/**
 * Edge-TTS synthesis for the React Native side.
 *
 * The WebView cannot reach speech.platform.bing.com (YouTube's CSP blocks the
 * WebSocket upgrade), so the RN JS context does the synthesis and injects the
 * resulting MP3 back into the page as a data event.
 *
 * Protocol mirrors the verified reference implementation (pilipala). The
 * Sec-MS-GEC token is generated in ./edge-tts-drm; a real end-to-end call on
 * 2026-11-22 returned 18 KB of audio/mpeg, so the handshake is known-good.
 */

import { generateSecMsGec, TRUSTED_CLIENT_TOKEN } from './edge-tts-drm'

/** Voice ids shown in the subtitle settings menu (value, label, accent). */
export interface EdgeVoice {
  id: string
  label: string
  locale: string
}

export const EDGE_VOICES: EdgeVoice[] = [
  { id: 'en-US-AriaNeural', label: 'Aria · 美音女声', locale: 'en-US' },
  { id: 'en-US-JennyNeural', label: 'Jenny · 美音女声', locale: 'en-US' },
  { id: 'en-US-GuyNeural', label: 'Guy · 美音男声', locale: 'en-US' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia · 英音女声', locale: 'en-GB' },
  { id: 'en-GB-RyanNeural', label: 'Ryan · 英音男声', locale: 'en-GB' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha · 澳音女声', locale: 'en-AU' },
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓 · 普通话女声', locale: 'zh-CN' },
  { id: 'zh-CN-YunxiNeural', label: '云希 · 普通话男声', locale: 'zh-CN' },
]

export const DEFAULT_US_VOICE = 'en-US-AriaNeural'
export const DEFAULT_UK_VOICE = 'en-GB-SoniaNeural'

/** Default voice per accent button. */
export const voiceForAccent = (accent: 'uk' | 'us', us?: string, uk?: string): string =>
  accent === 'uk' ? uk || DEFAULT_UK_VOICE : us || DEFAULT_US_VOICE

/** Derive the SSML `xml:lang` from a voice id such as `zh-HK-HiuMaanNeural`
 *  or `fil-PH-RosaNeural`. `slice(0, 5)` used to be enough for two-letter
 *  language codes but silently produced the invalid locale `fil-P` for the
 *  three-letter ones (Filipino), so take the first two hyphen segments. */
export const localeForVoice = (voice: string): string => {
  const known = EDGE_VOICES.find((v) => v.id === voice)?.locale
  if (known) return known
  const parts = voice.split('-')
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : voice
}

const cache = new Map<string, string>()
const CACHE_LIMIT = 120

const randomHex = (bytes: number): string => {
  const out: string[] = []
  for (let i = 0; i < bytes; i++) out.push(Math.floor(Math.random() * 256).toString(16).padStart(2, '0'))
  return out.join('')
}

const bytesToBase64 = (bytes: Uint8Array): string => {
  // btoa is available in Hermes; chunk to avoid call-stack limits on long audio.
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

const escapeXml = (text: string): string =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

/** Synthesize `text` with `voice` and resolve to base64-encoded MP3. */
export const synthesizeEdgeTts = (
  text: string,
  voice: string,
  timeoutMs = 9000,
): Promise<string | null> => {
  const query = text.trim()
  if (!query) return Promise.resolve(null)
  const key = `${voice}\u0000${query}`
  const cached = cache.get(key)
  if (cached) return Promise.resolve(cached)

  return new Promise((resolve) => {
    let settled = false
    let socket: any = null
    let audioChunks: Uint8Array[] = []
    const finish = (value: string | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { socket?.close?.() } catch { /* noop */ }
      if (value && cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
      if (value) cache.set(key, value)
      resolve(value)
    }
    const timer = setTimeout(() => finish(null), timeoutMs)

    try {
      const gec = generateSecMsGec()
      const url =
        `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1` +
        `?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}` +
        `&Sec-MS-GEC=${gec}` +
        `&Sec-MS-GEC-Version=2-143.0.3650.75` +
        `&ConnectionId=${randomHex(16)}`

      // React Native's WebSocket accepts a 3rd options argument with headers.
      socket = new (WebSocket as any)(
        url,
        undefined,
        {
          headers: {
            Origin: 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
              '(KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
            Cookie: `muid=${randomHex(16)};`,
          },
        },
      )
      socket.binaryType = 'arraybuffer'

      socket.onopen = () => {
        try {
          const now = new Date().toUTCString()
          socket.send(
            `X-Timestamp:${now}\r\nContent-Type:application/json; charset=utf-8\r\n` +
              `Path:speech.config\r\n\r\n` +
              `{"context":{"synthesis":{"audio":{"metadataoptions":` +
              `{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},` +
              `"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`,
          )
          const locale = localeForVoice(voice)
          const ssml =
            `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='${locale}'>` +
            `<voice name='${voice}'><prosody pitch='+0Hz' rate='+0%' volume='+0%'>` +
            `${escapeXml(query)}</prosody></voice></speak>`
          socket.send(
            `X-RequestId:${randomHex(16)}\r\nContent-Type:application/ssml+xml\r\n` +
              `X-Timestamp:${now}Z\r\nPath:ssml\r\n\r\n${ssml}`,
          )
        } catch {
          finish(null)
        }
      }

      socket.onmessage = (event: any) => {
        try {
          const data = event?.data
          if (typeof data === 'string') {
            if (data.includes('Path:turn.end')) {
              const total = audioChunks.reduce((n, c) => n + c.length, 0)
              if (!total) return finish(null)
              const merged = new Uint8Array(total)
              let offset = 0
              for (const c of audioChunks) { merged.set(c, offset); offset += c.length }
              finish(bytesToBase64(merged))
            } else if (data.includes('Path:turn.cancel') || data.includes('Path:turn.error')) {
              finish(null)
            }
            return
          }
          const bytes: Uint8Array =
            data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data as any)
          if (bytes.length < 2) return
          const headerLen = (bytes[0] << 8) | bytes[1]
          if (bytes.length > 2 + headerLen) {
            const header = String.fromCharCode(...bytes.subarray(2, Math.min(2 + headerLen, 512)))
            if (header.includes('Path:audio')) audioChunks.push(bytes.subarray(2 + headerLen))
          }
        } catch {
          finish(null)
        }
      }
      socket.onerror = () => finish(null)
      socket.onclose = () => {
        if (!settled) {
          const total = audioChunks.reduce((n, c) => n + c.length, 0)
          if (total) {
            const merged = new Uint8Array(total)
            let offset = 0
            for (const c of audioChunks) { merged.set(c, offset); offset += c.length }
            finish(bytesToBase64(merged))
          } else finish(null)
        }
      }
    } catch {
      finish(null)
    }
  })
}
