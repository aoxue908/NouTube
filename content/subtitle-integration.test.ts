/**
 * End-to-end test of the ACTUAL shipped bundle (`assets/scripts/main.bjs`) in
 * a real DOM implementation (happy-dom), with a mocked YouTube player page.
 *
 * This is deliberately different from a source-level unit test: it executes
 * the same code the APK injects, including install timing, settings snapshot
 * handling, caption fetching/parsing, regrouping, DOM rendering, toolbar
 * visibility and word taps. Regressions here came from device screenshots.
 */
import { describe, expect, it } from 'bun:test'
import { Window } from 'happy-dom'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const BUNDLE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../assets/scripts/main.bjs'),
  'utf8',
)

// Short ASR-style cues reproducing the screenshot: punctuation in the middle
// of a cue and a clause ("because I need my privacy,") that the old 28-word
// cap used to cut in half.
const CAPTION_PAYLOAD = {
  events: [
    { tStartMs: 0, dDurationMs: 3200, segs: [{ utf8: 'hi guys welcome back ' }, { utf8: 'to my morning routine video. ' }] },
    { tStartMs: 3200, dDurationMs: 2800, segs: [{ utf8: 'So, I want to show ' }, { utf8: 'you everything. ' }] },
    { tStartMs: 6000, dDurationMs: 5000, segs: [{ utf8: 'Obviously, not everything ' }, { utf8: 'because I need my privacy, ' }, { utf8: "but I'll show you most of it." }] },
  ],
}

interface Harness {
  w: any
  d: Document
  messages: Array<{ type: string; data?: any }>
  close: () => void
}

const boot = async (
  initialSettings?: Record<string, unknown> | null,
  options: { noTracks?: boolean; capturePayload?: string } = {},
): Promise<Harness> => {
  const w = new Window({ url: 'https://www.youtube.com/watch?v=abcdefg' }) as any
  const d = w.document as Document
  d.body.innerHTML = `
    <div id="player-control-overlay" class="fadein">
      <button class="ytp-settings-button" aria-label="Settings"></button>
    </div>
    <div id="movie_player"><video></video></div>
  `
  w.isAndroid = true

  const noop = () => {}
  try {
    Object.defineProperty(w.screen, 'orientation', {
      configurable: true,
      value: { addEventListener: noop, removeEventListener: noop, angle: 0, type: 'portrait-primary' },
    })
  } catch { /* older happy-dom */ }
  w.matchMedia ||= () => ({ matches: false, addEventListener: noop, removeEventListener: noop, addListener: noop, removeListener: noop })
  w.ResizeObserver ||= class { observe() {} unobserve() {} disconnect() {} }
  w.IntersectionObserver ||= class { observe() {} unobserve() {} disconnect() {} }
  w.requestIdleCallback ||= (cb: any) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 1 }), 0)
  w.cancelIdleCallback ||= clearTimeout
  w.navigator.mediaSession ||= { metadata: null, playbackState: 'none', setActionHandler: noop }
  w.speechSynthesis ||= { cancel: noop, speak: noop }
  for (const prop of ['response', 'responseText']) {
    if (!Object.getOwnPropertyDescriptor(w.XMLHttpRequest.prototype, prop)?.get) {
      Object.defineProperty(w.XMLHttpRequest.prototype, prop, {
        configurable: true,
        get() { return (this as any)[`_${prop}`] ?? '' },
      })
    }
  }

  const messages: Array<{ type: string; data?: any }> = []
  w.NouTubeI = { onMessage: (raw: string) => messages.push(JSON.parse(raw)) }
  if (initialSettings) w.NouTubeInitialSettings = initialSettings

  const player = d.getElementById('movie_player') as any
  player.getPlayerResponse = () => ({ videoDetails: { videoId: 'abcdefg' } })
  if (!options.noTracks) {
    w.ytInitialPlayerResponse = {
      captions: {
        playerCaptionsTracklistRenderer: {
          captionTracks: [
            { baseUrl: 'https://www.youtube.com/api/timedtext?v=abcdefg', kind: 'asr', languageCode: 'en' },
          ],
        },
      },
    }
  }
  w.fetch = options.noTracks
    ? async () => { throw new Error('caption endpoint blocked') }
    : async () => ({ ok: true, status: 200, text: async () => JSON.stringify(CAPTION_PAYLOAD) })
  ;(d.querySelector('video') as any).currentTime = 2

  // Drive rAF continuously like a real browser. A fixed 40-frame burst was
  // not enough: the CC-switch tests below mutate the page AFTER boot and need
  // the tick loop to keep sampling. rafActive stops the loop on close().
  let rafActive = true
  const rafQueue: Array<(t: number) => void> = []
  w.requestAnimationFrame = (cb: any) => {
    rafQueue.push(cb)
    return rafQueue.length
  }
  w.cancelAnimationFrame = noop
  const rafLoop = () => {
    if (!rafActive) return
    const batch = rafQueue.splice(0)
    for (const cb of batch) {
      try {
        cb(Date.now())
      } catch {
        /* one bad frame must not kill the loop */
      }
    }
    setTimeout(rafLoop, 4)
  }
  rafLoop()

  const pageErrors: string[] = []
  try {
    w.console.error = (...args: any[]) =>
      pageErrors.push(args.map((a) => String(a?.message ?? a)).join(' '))
  } catch { /* read-only console on some builds */ }

  w.eval(BUNDLE)
  if (options.capturePayload) {
    w.dispatchEvent(new w.CustomEvent('nou:caption-capture', {
      detail: {
        url: 'https://www.youtube.com/api/timedtext?v=abcdefg&lang=en',
        text: options.capturePayload,
        videoId: 'abcdefg',
        at: Date.now(),
      },
    }))
  }
  await new Promise((resolve) => setTimeout(resolve, 250))
  expect(pageErrors).toEqual([])

  return {
    w,
    d,
    messages,
    close: () => {
      rafActive = false
      try { w.happyDOM?.abort?.() } catch { /* noop */ }
    },
  }
}

describe('shipped bundle on a YouTube-like page', () => {
  it('renders ONE complete sense group, not a half sentence', async () => {
    const h = await boot()
    try {
      const captions = h.d.getElementById('_nou_subtitles')
      expect(captions).not.toBeNull()
      const text = (captions?.textContent ?? '').trim()
      // Screenshot regressions: started with "routine video." and ended with
      // "I need my". Wordy's cue parser emits one COMPLETE sentence per block;
      // at t=2s the first cue is the whole opening sentence, not a fragment.
      expect(text).toBe('hi guys welcome back to my morning routine video.')
      expect(text).toMatch(/\.$/)
      expect(text).not.toMatch(/I need my$/)
      expect(text).not.toMatch(/^routine video\./)
      // Every word of the sentence is independently tappable.
      expect(h.d.querySelectorAll('.nou-sub-word').length).toBeGreaterThan(7)
    } finally {
      h.close()
    }
  })

  it('creates the subtitle settings button even with NO settings snapshot', async () => {
    // No NouTubeInitialSettings == the legacy-install case. The layer used to
    // be disabled, native captions came back, and the button disappeared.
    const h = await boot()
    try {
      const wrap = h.d.querySelector('.nou-sub-entry-wrap')
      expect(wrap).not.toBeNull()
      expect(wrap?.classList.contains('is-visible')).toBe(true)
      // The icon must actually contain SVG shapes (svg.innerHTML silently
      // failed on some WebView builds, leaving an invisible empty button).
      const svg = wrap?.querySelector('svg')
      expect(svg?.childElementCount).toBeGreaterThanOrEqual(3)
      // Same visual weight as YouTube's CC / gear icons; the old 30px icon
      // towered over the other three controls in the same row.
      expect(svg?.getAttribute('width')).toBe('24')
    } finally {
      h.close()
    }
  })

  it('stacks the subtitle button ABOVE the tuner button in the LEFT column', async () => {
    const h = await boot()
    try {
      // happy-dom has no layout, so give the layer and the fullscreen tuner
      // button a real 1080x540 landscape box.
      const layer = h.d.getElementById('_nou_sub_layer') as HTMLElement | null
      expect(layer).not.toBeNull()
      layer!.getBoundingClientRect = () => ({ left: 0, top: 0, right: 1080, bottom: 540, width: 1080, height: 540, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect
      let fsBtn = h.d.getElementById('_nou_fs_btn') as HTMLElement | null
      if (!fsBtn) {
        fsBtn = h.d.createElement('button')
        fsBtn.id = '_nou_fs_btn'
        h.d.body.appendChild(fsBtn)
      }
      // left:16px, vertically centred (top = 50% - 20px).
      fsBtn!.getBoundingClientRect = () => ({ left: 16, top: 250, right: 56, bottom: 290, width: 40, height: 40, x: 16, y: 250, toJSON: () => ({}) }) as DOMRect

      h.w.dispatchEvent(new h.w.Event('resize'))
      await new Promise((resolve) => setTimeout(resolve, 150))

      const wrap = h.d.querySelector('.nou-sub-entry-wrap') as HTMLElement | null
      expect(wrap).not.toBeNull()
      const left = Number.parseFloat(wrap!.style.left || 'NaN')
      const top = Number.parseFloat(wrap!.style.top || 'NaN')
      expect(Number.isFinite(left)).toBe(true)
      expect(Number.isFinite(top)).toBe(true)
      // Same left edge, one full button + gap directly ABOVE the tuner button
      // (250 - 40 - 12 = 198), NOT in the top control row.
      expect(left).toBe(16)
      expect(top).toBeGreaterThanOrEqual(190)
      expect(top + 40).toBeLessThanOrEqual(250)
      // A left-edge column opens its popover rightward so it never overflows.
      expect(wrap!.classList.contains('menu-left')).toBe(true)
    } finally {
      h.close()
    }
  })

  it('matches the fullscreen control panel (screenshot) style', async () => {
    const h = await boot()
    try {
      ;(h.d.querySelector('.nou-sub-entry') as HTMLElement | null)?.click()
      const menu = h.d.querySelector('.nou-sub-menu')
      expect(menu).not.toBeNull()
      const style = h.d.getElementById('_nou_injected_css')?.textContent ?? ''
      // Exactly the #_nou_fs_panel tokens: flat black 82%, 14px radius,
      // #4f46e5 accent, 999px pills -- NOT the old purple glass theme.
      expect(style).toContain('--nou-accent: #4f46e5')
      expect(style).toContain('background: rgba(0, 0, 0, 0.82)')
      expect(style).toContain('border-radius: 14px')
      expect(style).toContain('border-radius: 999px')
      expect(style).not.toContain('blur(24px)')
      expect(style).not.toContain('#5b4fe8')
    } finally {
      h.close()
    }
  })

  it('keeps the settings button reachable when the layer is switched OFF', async () => {
    const h = await boot({ interactiveSubtitles: false })
    try {
      const wrap = h.d.querySelector('.nou-sub-entry-wrap')
      expect(wrap).not.toBeNull()
      expect(wrap?.classList.contains('is-visible')).toBe(true)
      // Opening the menu must expose the master switch so it can be turned
      // back on from inside the player.
      ;(wrap?.querySelector('.nou-sub-entry') as HTMLElement | null)?.click()
      const menu = h.d.querySelector('.nou-sub-menu')
      expect(menu?.classList.contains('is-open')).toBe(true)
      expect(menu?.textContent ?? '').toMatch(/Interactive subtitles|交互式字幕/)
    } finally {
      h.close()
    }
  })

  it('renders the Chinese meaning pushed back by the native dictionary', async () => {
    const h = await boot()
    try {
      const words = Array.from(h.d.querySelectorAll('.nou-sub-word')) as HTMLElement[]
      const target = words.find((el) => el.dataset.word)
      expect(target).toBeDefined()
      target?.click()
      const word = target?.dataset?.word ?? ''
      // This is exactly what MainPageContent injects after lookupWordNative().
      h.w.dispatchEvent(
        new h.w.CustomEvent('nou:word-meaning', {
          detail: {
            word,
            text: '测试释义：日常安排',
            ukPhonetic: '/ˈruːtiːn/',
            usPhonetic: '/ruːˈtiːn/',
            example: { en: 'my morning routine', zh: '我的晨间日常' },
          },
        }),
      )
      const card = h.d.querySelector('.nou-sub-tb-wordcard')
      expect(card?.textContent ?? '').toContain('测试释义：日常安排')
      expect(card?.textContent ?? '').toContain('我的晨间日常')
      // No debug-style "tap elsewhere" footer in the redesigned card.
      expect(card?.querySelector('.nou-sub-tb-word-tip')).toBeNull()
    } finally {
      h.close()
    }
  })

  it('tapping a word opens the card and emits lookup-word', async () => {
    const h = await boot()
    try {
      const word = h.d.querySelector('.nou-sub-word') as HTMLElement | null
      expect(word).not.toBeNull()
      word?.click()
      const card = h.d.querySelector('.nou-sub-tb-wordcard') as HTMLElement | null
      expect(card).not.toBeNull()
      expect(card?.style.display).toBe('block')
      expect(card?.textContent ?? '').toMatch(/Looking up|查询中|meaning|释义|No definition/i)
      const lookup = h.messages.find((m) => m.type === 'lookup-word')
      expect(lookup).toBeDefined()
      expect(typeof lookup?.data?.text).toBe('string')
      expect(lookup?.data?.text.length).toBeGreaterThan(0)
    } finally {
      h.close()
    }
  })

  it('requests an Edge-TTS voice for the speaker buttons and voice selection exists', async () => {
    const h = await boot()
    try {
      // The menu must expose a selectable voice for both accents.
      ;(h.d.querySelector('.nou-sub-entry') as HTMLElement | null)?.click()
      const menu = h.d.querySelector('.nou-sub-menu')
      expect(menu).not.toBeNull()
      const selects = menu?.querySelectorAll('select.nou-sub-tb-select') ?? []
      expect(selects.length).toBeGreaterThanOrEqual(2)

      const word = h.d.querySelector('.nou-sub-word') as HTMLElement | null
      word?.click()
      const speaker = h.d.querySelector('.nou-sub-tb-word-speak') as HTMLElement | null
      expect(speaker).not.toBeNull()
      ;(h.w.URL as any).createObjectURL ||= () => 'blob:tts'
      speaker?.click()
      const speak = h.messages.find((m) => m.type === 'speak-text')
      expect(speak).toBeDefined()
      expect(speak?.data?.voice).toMatch(/^(en|zh)-/)
      expect(typeof speak?.data?.text).toBe('string')
    } finally {
      h.close()
    }
  })

  it('turning native CC OFF removes EVERY caption; ON restores them', async () => {
    const h = await boot()
    try {
      // A readable desktop-style CC button, initially ON.
      const cc = h.d.createElement('button')
      cc.className = 'ytp-subtitles-button'
      cc.setAttribute('aria-pressed', 'true')
      h.d.body.appendChild(cc)
      await new Promise((resolve) => setTimeout(resolve, 200))
      const captions = h.d.getElementById('_nou_subtitles')
      expect(captions).not.toBeNull()
      expect((captions?.textContent ?? '').trim()).toContain('morning routine')

      // A REAL ON->OFF transition must blank the layer.
      cc.setAttribute('aria-pressed', 'false')
      await new Promise((resolve) => setTimeout(resolve, 220))
      const afterOff = h.d.getElementById('_nou_subtitles')
      expect(afterOff === null || (afterOff.textContent ?? '').trim() === '').toBe(true)
      // Native captions must stay transparent so they cannot pop back either.
      expect(h.d.documentElement.classList.contains('nou-subtitles-active')).toBe(true)

      // Back ON: captions reload and render again.
      cc.setAttribute('aria-pressed', 'true')
      await new Promise((resolve) => setTimeout(resolve, 400))
      const restored = h.d.getElementById('_nou_subtitles')
      expect(restored).not.toBeNull()
      expect((restored?.textContent ?? '').trim()).toContain('morning routine')
    } finally {
      h.close()
    }
  })

  it('opening the subtitle settings menu does NOT trip the native-CC latch', async () => {
    // Regression: the settings button carries aria-label "Subtitle settings" /
    // "字幕设置", which matches the CC watcher's selectors. The watcher listens
    // on `document` in the CAPTURE phase, so isolateSubtitleEvents()' bubble
    // phase stopPropagation could not protect us. A menu tap used to flip the
    // CC latch and blank every caption 60ms later on mobile builds (no ARIA
    // CC state). Wait well past that timeout: captions must stay on screen.
    const h = await boot()
    try {
      const before = h.d.getElementById('_nou_subtitles')
      expect((before?.textContent ?? '').trim()).toContain('morning routine')
      const entry = h.d.querySelector('.nou-sub-entry') as HTMLElement | null
      expect(entry).not.toBeNull()
      // Confirm the trap really exists: the label DOES look like a CC control.
      expect(entry!.getAttribute('aria-label') ?? '').toMatch(/ubtitle|字幕/i)
      entry!.click()
      expect(h.d.querySelector('.nou-sub-menu')?.classList.contains('is-open')).toBe(true)
      await new Promise((resolve) => setTimeout(resolve, 220))
      const after = h.d.getElementById('_nou_subtitles')
      expect(after).not.toBeNull()
      expect((after?.textContent ?? '').trim()).toContain('morning routine')
      expect(h.d.documentElement.classList.contains('nou-subtitles-active')).toBe(true)
    } finally {
      h.close()
    }
  })

  it('puts the example speaker INLINE at the end of the English sentence', async () => {
    const h = await boot()
    try {
      const words = Array.from(h.d.querySelectorAll('.nou-sub-word')) as HTMLElement[]
      const target = words.find((el) => el.dataset.word)
      expect(target).toBeDefined()
      target?.click()
      const word = target?.dataset?.word ?? ''
      h.w.dispatchEvent(
        new h.w.CustomEvent('nou:word-meaning', {
          detail: {
            word,
            text: '释义',
            example: {
              en: 'She stood there, the flowers still clutched in her hand.',
              zh: '她站在那里，手里仍然紧握着花束。',
            },
          },
        }),
      )
      const enRow = h.d.querySelector('.nou-sub-tb-word-example-en')
      expect(enRow).not.toBeNull()
      // The speaker is the LAST child, immediately after the sentence text --
      // not a block that starts a new line (the "restart line" screenshot).
      expect(enRow!.lastElementChild?.classList.contains('nou-sub-tb-word-speak--inline')).toBe(true)
      expect(enRow!.textContent).toContain('clutched in her hand.')
      const style = h.d.getElementById('_nou_injected_css')?.textContent ?? ''
      expect(style).toContain('display: inline-grid')
      // The Chinese translation remains a separate block underneath.
      expect(h.d.querySelector('.nou-sub-tb-word-example-zh')?.textContent).toContain('她站在那里')
    } finally {
      h.close()
    }
  })

  it('uses YouTube captions captured from the network when the direct fetch is blocked', async () => {
    const h = await boot(null, { noTracks: true, capturePayload: JSON.stringify(CAPTION_PAYLOAD) })
    try {
      const captions = h.d.getElementById('_nou_subtitles')
      expect(captions).not.toBeNull()
      expect((captions?.textContent ?? '').trim()).toBe(
        'hi guys welcome back to my morning routine video.',
      )
    } finally {
      h.close()
    }
  })

  it('draws pinyin above Traditional Chinese captions, switches to Jyutping and speaks Cantonese', async () => {
    // Screenshot: "母后過慮了，現在四方平定試問還有什麼可以威脅朕？"
    // Previously the caption layer had NO ruby at all because only English IPA
    // was known. The reading must work on the SHIPPED bundle, not just in unit
    // tests, and switching the language must re-render the CURRENT line.
    const h = await boot()
    try {
      const cn = JSON.stringify({
        events: [
          { tStartMs: 0, dDurationMs: 5000, segs: [{ utf8: '母后過慮了，現在四方平定。' }] },
        ],
      })
      h.w.dispatchEvent(new h.w.CustomEvent('nou:caption-capture', {
        detail: {
          url: 'https://www.youtube.com/api/timedtext?v=abcdefg&lang=zh-TW',
          text: cn,
          videoId: 'abcdefg',
          at: Date.now(),
        },
      }))
      await new Promise((resolve) => setTimeout(resolve, 80))
      expect((h.d.getElementById('_nou_subtitles')?.textContent ?? '')).toContain('母后過慮了')
      // Phonetics are OFF by default -> no ruby yet.
      expect(h.d.querySelectorAll('#_nou_subtitles rt').length).toBe(0)

      const entry = h.d.querySelector('.nou-sub-entry') as HTMLElement | null
      expect(entry).not.toBeNull()
      entry!.click()
      const rows = Array.from(h.d.querySelectorAll('.nou-sub-tb-row')) as HTMLElement[]
      const phonRow = rows.find((r) =>
        /显示注音|phonetics/i.test(r.querySelector('.nou-sub-tb-row-label')?.textContent ?? ''))
      expect(phonRow).toBeDefined()
      ;(phonRow!.querySelectorAll('.nou-sub-tb-btn')[1] as HTMLElement).click()
      await new Promise((resolve) => setTimeout(resolve, 100))
      const pinyin = Array.from(h.d.querySelectorAll('#_nou_subtitles rt'))
        .map((e) => e.textContent ?? '').join(' ')
      expect(pinyin).toContain('hòu')
      expect(pinyin).toContain('guò')

      // The new grouped reading-language selector exists and switching it
      // re-renders the SAME line with Jyutping immediately.
      // Labels follow the App language setting; match either locale.
      const selects = Array.from(h.d.querySelectorAll('select.nou-sub-tb-select')) as HTMLSelectElement[]
      const sel = selects.find((x) =>
        /注音语言|reading language/i.test(x.getAttribute('aria-label') ?? '')) ?? null
      expect(sel).not.toBeNull()
      expect(sel!.querySelectorAll('optgroup').length).toBeGreaterThan(0)
      sel!.value = 'yue'
      sel!.dispatchEvent(new h.w.Event('change', { bubbles: true }))
      await new Promise((resolve) => setTimeout(resolve, 100))
      const jyut = Array.from(h.d.querySelectorAll('#_nou_subtitles rt'))
        .map((e) => e.textContent ?? '').join(' ')
      expect(jyut).toMatch(/hau6|gwo3/)

      // Lookup card: one "reading" row (NOT UK/US) + a Cantonese neural voice.
      const word = h.d.querySelector('.nou-sub-word') as HTMLElement | null
      expect(word).not.toBeNull()
      word!.click()
      const cardRows = h.d.querySelectorAll('.nou-sub-tb-word-ph-row')
      expect(cardRows.length).toBe(1)
      expect((cardRows[0] as HTMLElement).dataset.accent).toBe('yue')
      const speaker = h.d.querySelector(
        '.nou-sub-tb-word-ph-row .nou-sub-tb-word-speak',
      ) as HTMLElement | null
      expect(speaker).not.toBeNull()
      speaker!.click()
      const tts = h.messages.find((m) => m.type === 'speak-text')
      expect(tts?.data?.voice).toBe('zh-HK-HiuMaanNeural')
    } finally {
      h.close()
    }
  })

})
