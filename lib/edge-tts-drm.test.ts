import { describe, expect, it } from 'bun:test'
import { generateSecMsGec, TRUSTED_CLIENT_TOKEN } from './edge-tts-drm'
import { EDGE_VOICES, localeForVoice } from './edge-tts'

describe('edge-tts SSML locale for multilingual voices', () => {
  it('uses the configured locale for the selectable accents', () => {
    for (const voice of EDGE_VOICES) {
      expect(localeForVoice(voice.id)).toBe(voice.locale)
    }
  })

  it('derives a valid locale for every new phonetics voice, including 3-letter codes', () => {
    // Regression: voice.slice(0, 5) produced the invalid `fil-P` for Filipino.
    expect(localeForVoice('zh-HK-HiuMaanNeural')).toBe('zh-HK')
    expect(localeForVoice('ja-JP-NanamiNeural')).toBe('ja-JP')
    expect(localeForVoice('fil-PH-RosaNeural')).toBe('fil-PH')
    expect(localeForVoice('nb-NO-PernilleNeural')).toBe('nb-NO')
    expect(localeForVoice('ar-SA-ZariyahNeural')).toBe('ar-SA')
  })
})

describe('edge-tts Sec-MS-GEC token', () => {
  it('produces a stable, correctly shaped v2 token for a fixed clock', () => {
    const token = generateSecMsGec(1763820000)
    // <8-byte cs64 hex (16 chars)>-<32-byte sha256 hex (64 chars)>
    expect(token).toMatch(/^[0-9A-F]{16}-[0-9A-F]{64}$/)
    expect(token).toBe(generateSecMsGec(1763820000))
  })

  it('changes across 5-minute windows (the server rounds ticks to 300s)', () => {
    const a = generateSecMsGec(1763820000)
    const b = generateSecMsGec(1763820000 + 300)
    expect(a).not.toBe(b)
  })

  it('uses Microsoft trusted client token', () => {
    expect(TRUSTED_CLIENT_TOKEN).toBe('6A5AA1D4EAFF4E9FB37E23D68491D6F4')
  })

  it('live endpoint accepts the token and returns audio', async () => {
    // Real network smoke test. Skipped when offline so the normal suite stays
    // deterministic; run `bun test lib/edge-tts-drm.test.ts` to exercise it.
    if (process.env.NOU_SKIP_NETWORK === '1') return
    const WebSocket = (await import('ws')).default
    const gec = generateSecMsGec()
    const hex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')
    const url =
      'wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1' +
      `?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}&Sec-MS-GEC=${gec}` +
      `&Sec-MS-GEC-Version=2-143.0.3650.75&ConnectionId=${hex(16)}`
    const audio = await new Promise<number>((resolve) => {
      let socket: any
      let bytes = 0
      const timer = setTimeout(() => { try { socket?.close() } catch {} ; resolve(bytes) }, 12000)
      try {
        socket = new (WebSocket as any)(url, {
          headers: {
            Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
            Cookie: `muid=${hex(16)};`,
          },
        })
        socket.on('open', () => {
          const now = new Date().toUTCString()
          socket.send(`X-Timestamp:${now}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`)
          const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='en-US-AriaNeural'>hello</voice></speak>`
          socket.send(`X-RequestId:${hex(16)}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${now}Z\r\nPath:ssml\r\n\r\n${ssml}`)
        })
        socket.on('message', (data: any, isBinary: boolean) => {
          if (isBinary) {
            const b = Buffer.from(data)
            const hlen = b.readUInt16BE(0)
            if (b.subarray(2, 2 + hlen).toString().includes('Path:audio')) bytes += b.length - 2 - hlen
          } else if (data.toString().includes('Path:turn.end')) {
            clearTimeout(timer); try { socket.close() } catch {} ; resolve(bytes)
          }
        })
        socket.on('error', () => { clearTimeout(timer); resolve(bytes) })
        socket.on('unexpected-response', (_: any, res: any) => { clearTimeout(timer); res.resume?.(); resolve(0) })
      } catch {
        clearTimeout(timer)
        resolve(0)
      }
    })
    expect(audio).toBeGreaterThan(1000)
  })
})
