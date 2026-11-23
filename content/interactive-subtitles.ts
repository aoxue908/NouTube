/**
 * Interactive subtitle layer -- an INDEPENDENT switch alongside YouTube's own
 * captions.
 *
 * The point of drawing captions ourselves is not the animation, it is that every
 * word becomes tappable: tapping one emits `lookup-word` so the app can show a
 * definition/translation card. Two visual styles are offered:
 *
 *   karaoke -- single centered line, word-by-word colour sweep.
 *   rolling -- the same clean single line with a soft rise on each new sentence.
 *
 * Both styles draw ONE complete sentence at a time: YouTube's short cues are
 * merged into whole sentences (see lib/karaoke.ts), and a short gap between
 * sentences keeps the current line on screen instead of flashing an empty
 * frame. No previous line is cached and no block background is drawn -- those
 * belong to a streaming-ASR UI, while YouTube caption tracks are complete
 * and stable, so the reference product's ASR-driven scaffolding is unwanted
 * here. The caption TEXT itself is never rewritten (word spacing included).
 *
 * TIMING is the hard part. A constant-rate sweep looks wrong, so we go to some
 * length to get REAL word times:
 *   1. Prefer the ASR (auto-generated) caption track: its json3/srv3 payload
 *      carries per-word offsets measured from the audio.
 *   2. Otherwise watch the caption text YouTube has already rendered in the
 *      DOM. Auto captions reveal words as they are spoken, so the playhead time
 *      at which each word appears IS its pronunciation time -- no network
 *      request needed and nothing to interpolate.
 *   3. Only when a whole line appears at once (human captions) do we fall back
 *      to speech-weighted interpolation across the measured line duration.
 *
 * YouTube's native caption implementation is never modified. While this switch
 * is on we only make native captions transparent so the two layers don't
 * overlap -- keeping them in the render tree is important, because YouTube
 * keeps updating their text and that is what the DOM timing source reads.
 */

import { noutubeSettingsEvent } from './noutube'
import { emit, isYTMusic, log } from './utils'
import { getSubtitleLayer, isolateSubtitleEvents } from './subtitle-host'
import { annotateText } from './multilingual-phonetics'
import {
  getPhoneticForWord,
  getToolbarSettings,
  hideWordCard,
  installSubtitleToolbar,
  onToolbarChange,
  setToolbarEnabled,
  showWordCard,
  syncKaraokeFromSettings,
} from './subtitle-toolbar'
import {
  findLineAt,
  findWordAt,
  lineFromObservedWords,
  mergeIntoSentences,
  mergeRollingCaption,
  parseSrv3,
  parseVtt,
  splitWords,
  type KaraokeLine,
  type ObservedWord,
  type TimedWord,
} from '../lib/karaoke'
import { parseCaptionedPayloadWordy, parseJson3Wordy } from '../lib/karaoke'
import {
  CAPTION_CAPTURE_EVENT,
  getLastCaptionPayload,
  isTranslationCaptionUrl,
  type CaptionCapture,
} from './caption-capture'
import { resolveCaptionLayerVisible, resolveInteractiveEnabled } from '../lib/subtitle-behaviour'
import {
  getNativeCcState,
  installNativeCcWatcher,
  resetNativeCcBaseline,
  sampleNativeCc,
} from './native-cc'

interface CaptionTrack {
  languageCode?: string
  kind?: string
  name?: { simpleText?: string }
  baseUrl?: string
}

interface SubtitleState {
  videoId: string
  lines: KaraokeLine[]
  /** Unmerged caption cues, kept so the line-break mode can be changed live
   *  without re-fetching the track. */
  rawLines: KaraokeLine[]
  trackUrl: string
  source: string
  timed: boolean
  /** languageCode of the track actually rendered. Used ONLY to choose a ruby
   *  reading system; it never affects track selection or sentence boundaries
   *  (the Wordy whole-sentence data path stays untouched). */
  languageCode?: string
}

/** Last known caption language, kept even while state is null. */
let captionLanguageHint = ''

const langFromUrl = (url: string): string => {
  try {
    return new URL(url, window.location.href).searchParams.get('lang') ?? ''
  } catch {
    return ''
  }
}

interface LineEntry {
  key: string
  words: TimedWord[]
}

const CONTAINER_ID = '_nou_subtitles'
const HINT_ID = '_nou_subtitles_hint'
const ROOT_CLASS = 'nou-subtitles-active'
const ROLLING_CLASS = 'nou-sub-rolling'
const FETCH_TIMEOUT_MS = 6000
const TAG = '[NouTube Subtitles]'
const AUTO_FONT_SIZE = 0

const FONT_FAMILIES: Record<string, string> = {
  default: 'inherit',
  serif: 'Georgia, "Times New Roman", serif',
  mono: '"Roboto Mono", Consolas, "Courier New", monospace',
  rounded: '"Arial Rounded MT Bold", system-ui, -apple-system, sans-serif',
}

const NATIVE_CAPTION_SELECTORS = [
  '.ytp-caption-segment',
  '.captions-text .ytp-caption-segment',
  '.caption-window .ytp-caption-segment',
  '.ytp-caption-window-container .ytp-caption-segment',
]

type Style = 'karaoke' | 'rolling'

let enabled = false
let style: Style = 'karaoke'
let activeColor = '#ffd54a'
let textColor = '#ffffff'
let fontSize = AUTO_FONT_SIZE
let fontFamily = 'default'
let subtitlePosition = 12
let videoEl: HTMLVideoElement | null = null
let state: SubtitleState | null = null
let loadToken = 0
let rafId = 0
let container: HTMLElement | null = null
let activeLineEl: HTMLElement | null = null
let lastWordIndex = -2
let lastVideoId = ''
let frameCount = 0
let loadRetries = 0
let retryTimer = 0
let hintShown = false
let noCaptionSince = 0
let fallbackGapSince = 0
let statusKey = ''
let translationLines: Array<{ start: number; end: number; text: string }> = []
let translationVideoId = ''
let currentLine: KaraokeLine | null = null
let lastHoverWord = ''
/** Tracks the ON/OFF edge of the combined (master switch + native CC) gate,
 *  so the expensive hide/reload work runs once per transition, not per frame. */
let captionsWereVisible = true

// Render state: only ONE complete sentence is on screen at a time. YouTube's
// caption tracks are complete and stable (unlike a streaming ASR recogniser),
// so there is no previous line to cache and no block background to draw.
let currentEntry: LineEntry | null = null
let currentKey = ''
let gapSince = 0

// DOM-observation timing state
let observed: ObservedWord[] = []
let observedText = ''
let observedIndex = 0
let lineAppearedAt = 0
let lastLineDuration = 0
let captionWasPresent = false
/** Video time (seconds) at which the DOM caption window was last non-empty. */
let narrativeLastSeen = 0

// Drag state
let drag: { pointerId: number; startY: number; startPos: number; moved: boolean } | null = null
let suppressClickUntil = 0

const MAX_LOAD_RETRIES = 20

/** Same-status logging is collapsed so the rAF loop never floods the console. */
const report = (key: string, ...data: unknown[]) => {
  if (key === statusKey) return
  statusKey = key
  // main.ts wraps installInteractiveSubtitles() in a top-level try/catch, so a
  // failing native bridge must never abort the rest of the content script.
  try {
    log(TAG, key, ...data)
  } catch {
    try {
      console.log(TAG, key, ...data)
    } catch {
      /* logging is best-effort */
    }
  }
}

const getPlayer = (): any => document.getElementById('movie_player')

const readSettings = () => {
  try {
    const settings = window.NouTube?.getSettings?.() ?? {}
    // See resolveInteractiveEnabled(): only an explicit false turns the layer
    // off, so a legacy/missing snapshot cannot silently restore YouTube's
    // native fragmented captions.
    enabled = resolveInteractiveEnabled(settings)
    // The in-page Karaoke switch owns the style; the App settings snapshot is
    // mirrored into it by syncKaraokeFromSettings() on every settings push.
    style = getToolbarSettings().karaoke ? 'karaoke' : 'rolling'
    if (typeof settings.interactiveSubtitleColor === 'string' && settings.interactiveSubtitleColor) {
      activeColor = settings.interactiveSubtitleColor
    }
    if (typeof settings.interactiveSubtitleTextColor === 'string' && settings.interactiveSubtitleTextColor) {
      textColor = settings.interactiveSubtitleTextColor
    }
    const size = Number(settings.interactiveSubtitleFontSize)
    fontSize = Number.isFinite(size) && size >= 0 && size <= 64 ? size : AUTO_FONT_SIZE
    fontFamily = FONT_FAMILIES[settings.interactiveSubtitleFontFamily as string]
      ? String(settings.interactiveSubtitleFontFamily)
      : 'default'
    const pos = Number(settings.interactiveSubtitlePosition)
    subtitlePosition = Number.isFinite(pos) ? Math.min(70, Math.max(2, pos)) : 12
  } catch {
    // A broken settings bridge must not silently disable the feature.
    enabled = true
  }
}

const isOn = () => enabled && !isYTMusic

/** Single source of truth for "should any subtitle be on screen right now".
 *  Both our in-page master switch AND YouTube's own CC button must allow it.
 *  An unreadable CC control resolves to 'unknown' and never blanks captions. */
const captionsVisible = () => resolveCaptionLayerVisible(isOn(), getNativeCcState())

/** Turn EVERY subtitle off. The old code called setNativeCaptionsHidden(false)
 *  here, which made YouTube's native fragmented captions pop back the moment
 *  our layer was switched off -- the "switch shows subtitles either way" bug.
 *  Keep the native captions transparent instead, so OFF really means OFF. */
const hideAllCaptions = () => {
  if (container) {
    removeContainer()
  }
  if (!document.documentElement.classList.contains(ROOT_CLASS)) {
    setNativeCaptionsHidden(true)
  }
  state = null
  resetObservation()
}

/** One-shot work for the ON->OFF edge. Cancel every in-flight caption load and
 *  force a fresh reload when captions come back, so no stale async callback
 *  (fetch, translation, retry timer) can re-create our layer or un-hide
 *  YouTube's native fragmented captions while OFF really means OFF. */
const enterCaptionsHidden = () => {
  ++loadToken
  window.clearTimeout(retryTimer)
  retryTimer = 0
  hideAllCaptions()
  hideWordCard()
  lastVideoId = ''
  translationLines = []
  translationVideoId = ''
  statusKey = ''
}

const getVideo = (): HTMLVideoElement | null => {
  const player = getPlayer()
  const video =
    player?.querySelector?.('video') ??
    document.querySelector('#movie_player video') ??
    document.querySelector('video')
  return video instanceof HTMLVideoElement ? video : null
}

const getVideoId = (): string => {
  try {
    return getPlayer()?.getPlayerResponse?.()?.videoDetails?.videoId ?? ''
  } catch {
    return ''
  }
}

/** Player response is not always reachable via the element; check every place. */
const readCaptionTracks = (): CaptionTrack[] => {
  const responses: any[] = []
  try {
    const player: any = document.getElementById('movie_player')
    if (player?.getPlayerResponse) responses.push(player.getPlayerResponse())
  } catch {
    /* player not ready */
  }
  try {
    responses.push((window as any).ytInitialPlayerResponse)
    responses.push((window as any).ytplayer?.config?.args?.raw_player_response)
  } catch {
    /* not present on this page */
  }
  for (const response of responses) {
    const tracks = response?.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (Array.isArray(tracks) && tracks.length) return tracks as CaptionTrack[]
  }
  return []
}

/**
 * ASR tracks carry real per-word offsets; human-uploaded tracks almost never
 * do, which is exactly what produced a constant-rate ("uniform") sweep. Rank
 * ASR first and keep every usable track as a candidate.
 */
const rankTracks = (tracks: CaptionTrack[]): CaptionTrack[] => {
  const usable = tracks.filter((t) => typeof t.baseUrl === 'string' && t.baseUrl.length > 0)
  const score = (t: CaptionTrack) => {
    if (t.kind === 'asr') return 0
    if (t.kind === 'translated' || t.kind === 'forced') return 2
    return 1
  }
  return usable.slice().sort((a, b) => score(a) - score(b))
}

const fetchCaption = async (baseUrl: string, format: string): Promise<any | string | null> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  let url = baseUrl
  try {
    const parsed = new URL(baseUrl, window.location.href)
    parsed.searchParams.set('fmt', format)
    url = parsed.toString()
  } catch {
    url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}fmt=${format}`
  }
  try {
    const response = await fetch(url, { credentials: 'include', signal: controller.signal })
    if (!response.ok) {
      report(`http-${response.status}`, format)
      return null
    }
    const text = await response.text()
    if (!text || !text.trim()) {
      report('empty-body', format)
      return null
    }
    return format === 'json3' ? JSON.parse(text) : text
  } catch {
    report('fetch-error', format)
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

const parseCaption = (payload: any, format: string): KaraokeLine[] => {
  try {
    if (format === 'json3') return parseJson3Wordy(payload ?? {})
    if (format === 'srv3') return parseSrv3(String(payload))
    return parseVtt(String(payload))
  } catch {
    return []
  }
}

const isTimed = (lines: KaraokeLine[]) => lines.some((line) => line.timed === true)

const translationTargetLang = () => {
  const toolbar = getToolbarSettings()
  if (toolbar.targetLang) return toolbar.targetLang.replace('_', '-')
  try {
    const value = (window.NouTube?.getSettings?.() as any)?.translationTargetLanguage
    if (typeof value === 'string' && value) return value.replace('_', '-')
  } catch { /* settings bridge optional */ }
  return 'zh-CN'
}

/** Best-effort YouTube translation track (tlang). No native round-trip. */
const loadTranslation = async (trackUrl: string, videoId: string) => {
  const toolbar = getToolbarSettings()
  if (!toolbar.translationEnabled || toolbar.displayMode === 'original') return
  const target = translationTargetLang()
  const dedupeKey = `${videoId}::${target}::${toolbar.mixedLevel}`
  if (translationVideoId === dedupeKey && translationLines.length) return
  try {
    const url = new URL(trackUrl, window.location.href)
    url.searchParams.set('tlang', target)
    const payload = await fetchCaption(url.toString(), 'json3')
    // Keep the translation on the same sentence boundaries as the original,
    // otherwise a long merged line would be matched to a half-sentence gloss.
    const lines = payload
      ? parseJson3Wordy(payload as any)
      : []
    translationLines = lines
      .map((line) => ({
        start: line.start,
        end: line.end,
        text: line.words.map((w) => w.text).join('').trim(),
      }))
      .filter((line) => line.text.length > 0)
    translationVideoId = dedupeKey
    report('translation', translationLines.length ? `${translationLines.length} lines` : 'unavailable')
    currentKey = ''
    rebuildLines()
  } catch {
    report('translation', 'request failed')
  }
}

/** Match by time OVERLAP, not midpoint distance: merged sentences can be long,
 *  so a midpoint comparison would pick the wrong translated cue. */
const currentTranslationFor = (line: KaraokeLine | null): string => {
  if (!line || !translationLines.length) return ''
  let best = ''
  let bestOverlap = 0
  for (const item of translationLines) {
    const overlap = Math.min(line.end, item.end) - Math.max(line.start, item.start)
    if (overlap > bestOverlap) {
      bestOverlap = overlap
      best = item.text
    }
  }
  return bestOverlap > 0.2 ? best : ''
}

/** Split a Chinese (or any CJK) sentence into tappable pieces. */
const splitTranslation = (text: string): string[] => {
  try {
    const Segmenter = (Intl as any).Segmenter
    if (Segmenter) {
      const pieces: string[] = []
      for (const part of new Segmenter('zh', { granularity: 'word' }).segment(text)) {
        const piece = String((part as any).segment ?? '')
        if (piece.trim()) pieces.push(piece)
      }
      if (pieces.length) return pieces
    }
  } catch { /* older WebView */ }
  return Array.from(text).filter((char) => char.trim().length > 0)
}

/** Words for the translation line; `mixedLevel` sprinkles original words back in. */
const translationWords = (line: KaraokeLine): TimedWord[] => {
  const text = currentTranslationFor(line)
  if (!text) return line.words
  let pieces = splitTranslation(text)
  const level = getToolbarSettings().mixedLevel
  if (level) {
    const originals = line.words.map((w) => cleanWord(w.text)).filter(Boolean)
    const every = level === 1 ? 6 : 3
    pieces = pieces.map((piece, i) =>
      i % every === 2 && originals.length
        ? originals[Math.floor(i / every) % originals.length] + ' '
        : piece,
    )
  }
  const span = Math.max(0.2, line.end - line.start)
  return pieces.map((piece, i) => ({
    text: piece,
    start: line.start + (span * i) / pieces.length,
    end: line.start + (span * (i + 1)) / pieces.length,
  }))
}

const displayWordsFor = (line: KaraokeLine): TimedWord[] => {
  const toolbar = getToolbarSettings()
  return toolbar.translationEnabled && toolbar.displayMode === 'translation'
    ? translationWords(line)
    : line.words
}

const cleanWord = (text: string): string =>
  text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').trim()

const onWordClick = (event: Event) => {
  // A drag ends with a click on some WebViews; ignore it so moving the caption
  // never opens the dictionary card by accident.
  if (Date.now() < suppressClickUntil) return
  const target = (event.target as HTMLElement | null)?.closest?.('.nou-sub-word') as HTMLElement | null
  const word = target?.dataset?.word
  if (!target || !word) return
  event.preventDefault()
  event.stopPropagation()
  const lineEl = target.closest('.nou-sub-line')
  // Use dataset.text: with phonetics enabled, textContent would also contain
  // every IPA annotation and would make a nonsense example sentence.
  const wordEls = Array.from(lineEl?.querySelectorAll<HTMLElement>('.nou-sub-word') ?? [])
  const sentence = (wordEls.length
    ? wordEls.map((el) => el.dataset.text ?? el.textContent ?? '').join('')
    : word
  ).replace(/^>>\s*/, '').trim()
  const rect = target.getBoundingClientRect()
  // Do NOT pass the sentence translation here: it is a whole-sentence gloss,
  // not the meaning of the tapped word. The card resolves the word meaning
  // itself (see subtitle-toolbar.ts).
  try {
    showWordCard({
      word,
      sentence,
      languageCode: state?.languageCode ?? captionLanguageHint,
      x: rect.left,
      y: rect.bottom,
    })
  } catch { /* in-page card is best effort */ }
  try {
    emit('lookup-word', {
      id: `${Date.now()}-${Math.random()}`,
      text: word,
      sentence,
      x: rect.left,
      y: rect.bottom,
    })
  } catch {
    /* native bridge not ready */
  }
}

/** Hover-to-preview: show the sentence translation without a click. */
const onWordHover = (event: PointerEvent) => {
  // Touch devices fire pointerover on tap; let the click handler own those.
  if (event.pointerType === 'touch') return
  if (!isOn() || !getToolbarSettings().hoverTranslation || !getToolbarSettings().translationEnabled) return
  const target = (event.target as HTMLElement | null)?.closest?.('.nou-sub-word') as HTMLElement | null
  const word = target?.dataset?.word
  if (!word || word === lastHoverWord) return
  lastHoverWord = word
  const translation = currentTranslationFor(currentLine)
  if (!translation) return
  const lineEl = target?.closest('.nou-sub-line')
  const wordEls = Array.from(lineEl?.querySelectorAll<HTMLElement>('.nou-sub-word') ?? [])
  const sentence = (wordEls.length
    ? wordEls.map((el) => el.dataset.text ?? el.textContent ?? '').join('')
    : word
  ).replace(/^>>\s*/, '').trim()
  const rect = target!.getBoundingClientRect()
  try {
    showWordCard({
      word,
      sentence,
      translation,
      languageCode: state?.languageCode ?? captionLanguageHint,
      x: rect.left,
      y: rect.bottom,
      hover: true,
    })
  } catch { /* best effort */ }
}

const onPointerDown = (event: PointerEvent) => {
  if (!isOn()) return
  drag = {
    pointerId: event.pointerId,
    startY: event.clientY,
    startPos: subtitlePosition,
    moved: false,
  }
  // NOTE: never call setPointerCapture on the container here. Capturing the
  // pointer makes the subsequent click target the CONTAINER, not the word span,
  // which silently kills every tap-to-look-up. Move/up are bound on window
  // instead so dragging outside the caption still works.
}

const onPointerMove = (event: PointerEvent) => {
  if (!drag || event.pointerId !== drag.pointerId) return
  const dy = event.clientY - drag.startY
  if (Math.abs(dy) > 4) drag.moved = true
  if (!drag.moved) return
  const height = window.innerHeight || 720
  const next = Math.min(70, Math.max(2, drag.startPos + (-dy / height) * 100))
  subtitlePosition = next
  container?.classList.add('nou-sub-dragging')
  container?.style.setProperty('--nou-sub-bottom', `${next}%`)
  event.preventDefault()
}

const onPointerUp = (event: PointerEvent) => {
  if (!drag || event.pointerId !== drag.pointerId) return
  container?.classList.remove('nou-sub-dragging')
  if (drag.moved) {
    suppressClickUntil = Date.now() + 400
    const value = Math.round(subtitlePosition * 10) / 10
    report('position-changed', value)
    try {
      emit('subtitle-position', { value })
    } catch {
      /* native bridge not ready */
    }
  }
  drag = null
}

let windowDragBound = false

const ensureContainer = (): HTMLElement | null => {
  // YouTube's control overlay hit-tests above anything inside #movie_player.
  // The shared layer lives on the fullscreen element instead, so taps on words
  // actually arrive here (see content/subtitle-host.ts).
  const layer = getSubtitleLayer()
  if (!layer) return null
  if (container?.isConnected && container.parentElement === layer) return container

  const el = container ?? document.createElement('div')
  if (!container) {
    el.id = CONTAINER_ID
    el.addEventListener('click', onWordClick)
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointerover', onWordHover)
    // Keep taps off YouTube's tap-to-toggle / double-tap-seek handlers.
    isolateSubtitleEvents(el)
  }
  layer.appendChild(el)
  if (!windowDragBound) {
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    windowDragBound = true
  }
  container = el
  activeLineEl = null
  currentKey = ''
  syncContainerStyle()
  return container
}

const syncContainerStyle = () => {
  if (!container) return
  const toolbar = getToolbarSettings()
  container.classList.toggle(ROLLING_CLASS, style === 'rolling')
  // A menu colour overrides the App snapshot; empty string means follow default.
  const baseText = toolbar.subtitleColor || textColor
  container.style.setProperty('--nou-sub-color', activeColor)
  container.style.setProperty('--nou-sub-text-color', baseText)
  container.style.setProperty('--nou-sub-rt-color', toolbar.phoneticColor || baseText)
  container.style.setProperty('--nou-sub-translation-color', toolbar.translationColor || baseText)
  container.style.setProperty('--nou-sub-font-family', FONT_FAMILIES[fontFamily] ?? 'inherit')
  container.style.setProperty(
    '--nou-sub-font-size',
    fontSize > 0 ? `${fontSize}px` : 'clamp(16px, 3.6vw, 34px)',
  )
  container.style.setProperty('--nou-sub-bottom', `${subtitlePosition}%`)

  container.classList.remove(
    'nou-sub-theme--outline',
    'nou-sub-theme--shadow',
    'nou-sub-theme--paper',
    'nou-sub-align--left',
    'nou-sub-align--center',
    'nou-sub-align--right',
  )
  container.classList.add(`nou-sub-theme--${toolbar.theme}`)
  container.classList.add(`nou-sub-align--${toolbar.lineAlign}`)
  const autoPx = Math.round(Math.min(34, Math.max(16, (window.innerWidth || 800) * 0.036)))
  const scaled = Math.max(10, Math.round((fontSize > 0 ? fontSize : autoPx) * toolbar.fontScale))
  container.style.setProperty('--nou-sub-font-size', `${scaled}px`)
  container.style.setProperty(
    '--nou-sub-translation-size',
    `${Math.max(10, Math.round(scaled * toolbar.translationRatio * toolbar.translationFontScale))}px`,
  )
}

const removeContainer = () => {
  container?.remove()
  container = null
  activeLineEl = null
  currentKey = ''
  currentEntry = null
  gapSince = 0
  lastWordIndex = -2
}

/** Only make native captions transparent -- never display:none, so YouTube
 *  keeps updating their text (our real-time word timing source). */
const setNativeCaptionsHidden = (hidden: boolean) => {
  document.documentElement.classList.toggle(ROOT_CLASS, hidden)
}

const clearLines = () => {
  if (container) container.textContent = ''
  activeLineEl = null
  currentKey = ''
  currentEntry = null
  gapSince = 0
  lastWordIndex = -2
}

/**
 * Draw one word. Whitespace must NEVER be placed inside <ruby>: Chromium
 * collapses a trailing space in a ruby base, which glued words together
 * ("usedtoeat"). The original text (spaces included) stays in dataset.text;
 * leading/trailing whitespace is appended as plain text nodes around the ruby,
 * and `white-space: pre-wrap` on the line keeps it exactly as the caption
 * source had it. Nothing here rewrites the caption text.
 */
const applyWordContent = (span: HTMLElement, text: string) => {
  const leading = (text.match(/^\s*/u)?.[0] ?? '').replace(/[\r\n]+/g, ' ')
  const core = text.slice(leading.length).replace(/\s+$/u, '')
  const trailing = text.slice(leading.length + core.length).replace(/[\r\n]+/g, ' ')
  const toolbar = getToolbarSettings()
  // One caption "word" may hold a WHOLE Chinese / Japanese / Thai sentence
  // (no spaces). annotateText splits it into ruby segments so each character
  // or word gets its own reading instead of one giant rt line.
  const segments = toolbar.showPhonetics
    ? annotateText(core, {
        mode: toolbar.phoneticMode,
        languageCode: state?.languageCode ?? captionLanguageHint,
        lookupIpa: getPhoneticForWord,
      })
    : null

  span.textContent = ''
  if (leading) span.appendChild(document.createTextNode(leading))
  if (!segments) {
    span.appendChild(document.createTextNode(core))
  } else {
    for (const seg of segments) {
      if (!seg.rt) {
        span.appendChild(document.createTextNode(seg.base))
        continue
      }
      const ruby = document.createElement('ruby')
      ruby.appendChild(document.createTextNode(seg.base))
      const rt = document.createElement('rt')
      rt.textContent = seg.rt
      ruby.appendChild(rt)
      span.appendChild(ruby)
    }
  }
  if (trailing) span.appendChild(document.createTextNode(trailing))
}

const makeWordSpan = (word: TimedWord): HTMLElement => {
  const span = document.createElement('span')
  span.className = 'nou-sub-word'
  span.dataset.text = word.text
  const clean = cleanWord(word.text)
  if (clean) span.dataset.word = clean
  applyWordContent(span, word.text)
  return span
}

const fillWords = (lineEl: HTMLElement, words: TimedWord[]) => {
  for (const word of words) lineEl.appendChild(makeWordSpan(word))
}

/** Add words revealed since the last frame without rebuilding the line, so the
 *  rolling rise animation does not replay on every new word. */
const syncWords = (words: TimedWord[]) => {
  if (!activeLineEl) return
  const existing = activeLineEl.querySelectorAll('.nou-sub-word')
  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    let span = existing[i] as HTMLElement | undefined
    if (!span) {
      span = makeWordSpan(word)
      activeLineEl.appendChild(span)
    } else if (span.dataset.text !== word.text) {
      span.dataset.text = word.text
      applyWordContent(span, word.text)
      const clean = cleanWord(word.text)
      if (clean) span.dataset.word = clean
      else delete span.dataset.word
    }
  }
  // Remove stale spans if a line got shorter (seek / caption correction).
  for (let i = words.length; i < existing.length; i++) existing[i].remove()
}

const rebuildLines = () => {
  // A translation fetch or a settings push can finish while the native CC
  // switch is OFF. Guard here too, otherwise it silently re-mounts the layer.
  if (!captionsVisible()) return
  const root = ensureContainer()
  if (!root) return
  root.textContent = ''

  // A settings change (phonetics on/off, reading language, alignment ...) can
  // land right after a caption payload was applied, while the per-frame line
  // cache is still empty. Re-derive the current line from the live playhead
  // instead of leaving an empty container on screen until the next cue.
  if (!currentEntry) {
    const video = getVideo() ?? videoEl
    const line = video && state?.lines.length ? findLineAt(state.lines, video.currentTime) : null
    if (!line) return
    currentLine = line
    const words = displayWordsFor(line)
    currentEntry = { key: `L${line.index}:${words[0]?.text ?? ''}`, words: words.slice() }
    currentKey = currentEntry.key
  }

  // One line only: no cached previous sentence, no ">>" marker, no block
  // background. The caption text is drawn exactly as YouTube supplied it.
  const lineEl = document.createElement('div')
  lineEl.className = 'nou-sub-line'
  fillWords(lineEl, currentEntry.words)
  root.appendChild(lineEl)
  activeLineEl = lineEl

  // Bilingual mode draws a second, smaller line with the sentence
  // translation. It is built only when the LINE changes, so it never
  // restarts the rise animation.
  const toolbarNow = getToolbarSettings()
  if (toolbarNow.translationEnabled && toolbarNow.displayMode === 'bilingual' && currentLine) {
    const translated = translationWords(currentLine)
    if (translated !== currentLine.words && translated.length) {
      const transEl = document.createElement('div')
      transEl.className = 'nou-sub-line nou-sub-line--trans'
      fillWords(transEl, translated)
      root.appendChild(transEl)
    }
  }
  lastWordIndex = -2
}

const applyActive = (active: number) => {
  if (!activeLineEl || active === lastWordIndex) return
  const words = activeLineEl.querySelectorAll('.nou-sub-word')
  if (lastWordIndex >= 0 && lastWordIndex < words.length) {
    words[lastWordIndex].classList.remove('nou-sub-word--active')
  }
  if (active >= 0 && active < words.length) {
    words[active].classList.add('nou-sub-word--active')
  }
  lastWordIndex = active
}

/** Render one frame. Rebuilds only when the SENTENCE changes. Short gaps
 *  between sentences keep the last complete line on screen, so a sentence is
 *  replaced by the next one instead of flashing an empty frame in between.
 *  `keepHidden` stays true when we have a real caption payload, so native
 *  captions do not flash back on screen during the gaps. */
const renderFrame = (line: KaraokeLine | null, time: number, keepHidden = false) => {
  currentLine = line
  if (!line) {
    if (keepHidden && currentEntry) {
      if (!gapSince) gapSince = Date.now()
      if (Date.now() - gapSince < 2000) {
        setNativeCaptionsHidden(true)
        return
      }
    }
    if (currentKey) clearLines()
    gapSince = 0
    setNativeCaptionsHidden(keepHidden)
    return
  }
  gapSince = 0
  const words = displayWordsFor(line)
  const key = `L${line.index}:${words[0]?.text ?? ''}`
  if (key !== currentKey) {
    currentEntry = { key, words: words.slice() }
    currentKey = key
    rebuildLines()
  }
  if (!ensureContainer()) return
  setNativeCaptionsHidden(true)
  if (currentEntry) currentEntry.words = words
  syncWords(words)
  // Karaoke IS the word-by-word colour sweep. When its switch is off the
  // subtitle is a plain rolling line, so clear the active word instead of
  // still sweeping it (bug: "I turned Karaoke off but it is still there").
  // Skipping findWordAt in that mode also avoids per-frame lookup work.
  if (style === 'karaoke') {
    applyActive(findWordAt({ ...line, words }, time))
  } else {
    applyActive(-1)
  }
}

const showHintOnce = () => {
  if (hintShown) return
  hintShown = true
  const layer = getSubtitleLayer()
  if (!layer) return
  const el = document.createElement('div')
  el.id = HINT_ID
  el.textContent = 'Interactive subtitles: no caption data (enable CC subtitles, or the caption request was blocked)'
  layer.appendChild(el)
  window.setTimeout(() => el.remove(), 5000)
}

/** Low-frequency retry so a late player response is never missed forever. */
const scheduleTrackRetry = (videoId: string) => {
  if (retryTimer || loadRetries++ >= MAX_LOAD_RETRIES) return
  retryTimer = window.setTimeout(() => {
    retryTimer = 0
    if (captionsVisible() && getVideoId() === videoId) void loadSubtitles(videoId)
  }, 900)
}

interface CaptionResult {
  lines: KaraokeLine[]
  source: string
  timed: boolean
}

/**
 * Use the raw caption body captured from YouTube's own request. The Wordy
 * parser turns it into whole sentences immediately, so this path also works
 * when the player response exposes no captionTracks or the direct fetch is
 * blocked. Returns false when the body has no usable captions.
 */
const applyCapturedPayload = (capture: CaptionCapture): boolean => {
  const lines = parseCaptionedPayloadWordy(capture.text)
  if (!lines.length) return false
  const id = capture.videoId || getVideoId()
  captionLanguageHint = langFromUrl(capture.url) || captionLanguageHint
  ++loadToken
  state = {
    videoId: id,
    lines,
    rawLines: lines,
    trackUrl: capture.url,
    source: 'captured',
    timed: lines.some((line) => line.timed === true),
    languageCode: captionLanguageHint,
  }
  lastVideoId = id
  loadRetries = 0
  resetObservation()
  hintShown = false
  currentKey = ''
  report('captured-cues', `${lines.length} whole sentences from intercepted ${capture.url.includes('timedtext') ? 'timedtext' : 'videoplayback'}`)
  void loadTranslation(capture.url, id)
  return true
}

const loadSubtitles = async (videoId: string) => {
  // Never start (or resume) a caption load while the native CC switch is OFF.
  // It would call setNativeCaptionsHidden(false) and bring the native
  // fragmented captions straight back on screen.
  if (!captionsVisible()) return
  const token = ++loadToken
  setNativeCaptionsHidden(false)
  state = null
  clearLines()

  const captured = getLastCaptionPayload()
  if (
    captured &&
    !isTranslationCaptionUrl(captured.url) &&
    (!captured.videoId || captured.videoId === videoId) &&
    applyCapturedPayload(captured)
  ) return

  const tracks = rankTracks(readCaptionTracks())
  if (!tracks.length) {
    report('no-caption-track', `videoId=${videoId}`)
    scheduleTrackRetry(videoId)
    return
  }
  report('track-found', `${tracks.length} track(s), first kind=${tracks[0].kind ?? 'human'}`)
  captionLanguageHint =
    tracks[0].languageCode || langFromUrl(tracks[0].baseUrl ?? '') || captionLanguageHint

  // Fire a small batch of candidates in parallel: ASR json3 + ASR srv3 first,
  // then the next tracks' json3 and one vtt. Parallel keeps worst-case latency
  // at one timeout instead of multiplying it by the number of attempts.
  const jobs: Array<{ track: CaptionTrack; format: string }> = []
  jobs.push({ track: tracks[0], format: 'json3' })
  jobs.push({ track: tracks[0], format: 'srv3' })
  for (const track of tracks.slice(1, 3)) jobs.push({ track, format: 'json3' })
  jobs.push({ track: tracks[0], format: 'vtt' })

  const settled = await Promise.allSettled(
    jobs.map(async (job) => {
      const payload = await fetchCaption(job.track.baseUrl!, job.format)
      if (payload == null) return null
      const lines = parseCaption(payload, job.format)
      if (!lines.length) return null
      return { lines, source: job.format, timed: isTimed(lines) } as CaptionResult
    }),
  )
  if (token !== loadToken || getVideoId() !== videoId) return

  const results = settled
    .filter((r): r is PromiseFulfilledResult<CaptionResult | null> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((r): r is CaptionResult => r != null && r.lines.length > 0)

  if (!results.length) {
    report('endpoint-unavailable', 'falling back to native caption DOM word observation')
    scheduleTrackRetry(videoId)
    return
  }

  // Prefer a payload with real word timestamps even if it came from a later
  // track -- that is the whole point of the ASR-first ranking.
  const chosen = results.find((r) => r.timed) ?? results[0]
  // YouTube cues are only a few words long. Rebuild them into complete sense
  // groups (or single sentences) using the real word timestamps, so a block
  // never starts or ends in the middle of a sentence.
  // Wordy's json3 parser already emits complete sentences with conjunction
  // splits for over-long cues. Re-merging them would recreate half-sentences.
  const merged = chosen.source === 'json3'
    ? chosen.lines
    : mergeIntoSentences(chosen.lines, { mode: getToolbarSettings().sentenceMode })
  state = {
    videoId,
    lines: merged,
    rawLines: chosen.lines,
    trackUrl: tracks[0].baseUrl!,
    source: chosen.source,
    timed: chosen.timed,
    languageCode: captionLanguageHint,
  }
  lastVideoId = videoId
  loadRetries = 0
  resetObservation()
  hintShown = false
  report('ready', `${chosen.lines.length} cues -> ${merged.length} sentences via ${chosen.source}, REAL_WORD_TIMING=${chosen.timed}`)
  void loadTranslation(tracks[0].baseUrl!, videoId)
}

const resetObservation = () => {
  observed = []
  observedText = ''
  observedIndex = 0
  lineAppearedAt = 0
  lastLineDuration = 0
  captionWasPresent = false
  narrativeLastSeen = 0
}

const readNativeText = (): string => {
  for (const selector of NATIVE_CAPTION_SELECTORS) {
    const nodes = document.querySelectorAll(selector)
    if (!nodes.length) continue
    const text = Array.from(nodes)
      .map((node) => node.textContent ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (text) return text
  }
  return ''
}

/** A speaker pause this long ends the current DOM-fallback sentence block.
 *  YouTube ASR cues are ~2-3s sliding windows with sub-second gaps; a real
 *  sentence boundary leaves a noticeably longer silence. */
const DOM_PAUSE_SECONDS = 1.1
const DOM_MAX_WORDS = 40
const DOM_MAX_SECONDS = 26
const SENTENCE_END_RE = /[.!?。！？…]["'”’)\]]?\s*$/u

/**
 * Watch YouTube's own caption text and accumulate its ROLLING windows into
 * ONE growing sentence. Rendering each raw cue was the reason a sentence kept
 * arriving in pieces: cue N+1 repeats the tail of cue N, so neither cue is a
 * complete thought. We de-duplicate the overlap and only start a new block
 * after a real pause (or a sentence-ending mark), then hand the whole block
 * to the same karaoke renderer as the caption-API path.
 */
const observeNativeWords = (video: HTMLVideoElement): KaraokeLine | null => {
  const text = readNativeText()
  const now = video.currentTime

  if (!text) {
    if (observed.length && narrativeLastSeen > 0 && now - narrativeLastSeen > DOM_PAUSE_SECONDS) {
      // The sentence is finished. Keep it on screen; the next cue starts a new
      // block instead of being glued to this one.
      lastLineDuration = Math.max(0.4, Math.min(8, narrativeLastSeen - lineAppearedAt))
      observed = []
      observedText = ''
      observedIndex += 1
      lineAppearedAt = 0
      narrativeLastSeen = 0
      captionWasPresent = false
    }
    return null
  }

  narrativeLastSeen = now
  if (!captionWasPresent) {
    captionWasPresent = true
    lineAppearedAt = now
  }

  const merged = mergeRollingCaption(observedText, text)
  if (!merged.added) {
    // Same rolling window, or a pure suffix repeat: nothing new to highlight.
    return observed.length
      ? lineFromObservedWords(observed, now, observedIndex, lastLineDuration)
      : null
  }

  // A new cue that does NOT overlap the accumulated text starts a new sentence
  // only when what we have already ends with a sentence mark. Otherwise it is
  // just the next rolling window of the same thought and must be appended.
  const noOverlap =
    merged.added.replace(/\s+/g, ' ').trim() === text.replace(/\s+/g, ' ').trim()
  if (observed.length && noOverlap && SENTENCE_END_RE.test(observedText)) {
    observedIndex += 1
    lineAppearedAt = now
    observed = []
    observedText = ''
    const fresh = mergeRollingCaption('', text)
    for (const piece of splitWords(fresh.added)) {
      if (piece.trim()) observed.push({ text: piece, start: now })
    }
    observedText = fresh.text
  } else {
    for (const piece of splitWords(merged.added)) {
      if (piece.trim()) observed.push({ text: piece, start: now })
    }
    observedText = merged.text
  }

  // Hard cap: never let a punctuation-free monologue grow without bound.
  if (
    observed.length > DOM_MAX_WORDS ||
    (lineAppearedAt > 0 && now - lineAppearedAt > DOM_MAX_SECONDS)
  ) {
    const keep = Math.ceil(observed.length / 2)
    observed = observed.slice(-keep)
    observedText = observed.map((o) => o.text).join('').replace(/\s+/g, ' ').trim()
    lineAppearedAt = observed[0]?.start ?? now
  }

  if (!observed.length) return null
  return lineFromObservedWords(observed, now, observedIndex, lastLineDuration)
}

const tickNativeFallback = (video: HTMLVideoElement) => {
  const line = observeNativeWords(video)
  if (!line) {
    // Hold the last line briefly between caption segments so a sentence is
    // replaced by the next one instead of blinking off in the gap.
    if (!fallbackGapSince) fallbackGapSince = Date.now()
    // A completed DOM sentence stays up through the natural inter-sentence
    // pause (up to DOM_PAUSE_SECONDS) instead of blinking off after 600ms.
    if (currentEntry && Date.now() - fallbackGapSince < (DOM_PAUSE_SECONDS + 0.5) * 1000) {
      setNativeCaptionsHidden(true)
      return
    }
    if (currentKey) {
      clearLines()
      setNativeCaptionsHidden(false)
    }
    if (!noCaptionSince) noCaptionSince = Date.now()
    if (!state && Date.now() - noCaptionSince > 8000 && video.currentTime > 0.5) showHintOnce()
    return
  }
  fallbackGapSince = 0
  noCaptionSince = 0
  report('dom-word-timing', line.timed ? 'REAL word times observed' : 'whole-line, weighted interpolation')
  renderFrame(line, video.currentTime, true)
}

const tick = () => {
  rafId = window.requestAnimationFrame(tick)
  ++frameCount
  // Poll YouTube's own CC toggle (cheap: a handful of selectors every 15th
  // frame). Only a real ON->OFF transition ever suppresses captions.
  if (frameCount % 15 === 0) sampleNativeCc()

  const visible = captionsVisible()
  if (visible !== captionsWereVisible) {
    captionsWereVisible = visible
    if (!visible) {
      enterCaptionsHidden()
    } else {
      // Force a clean reload on the way back (lastVideoId was cleared while
      // hidden), and clear any stale "no captions" hint.
      statusKey = ''
      hintShown = false
      loadRetries = 0
      lastVideoId = ''
    }
  }
  if (!visible) {
    setToolbarEnabled(false)
    return
  }

  setToolbarEnabled(true)
  const video = getVideo() ?? videoEl
  if (!video) return
  videoEl = video

  // One single frame counter drives BOTH throttled polls. The old code did
  // `++frameCount` twice per frame, which made the two checks land on
  // different frames and desynchronised the video-id reload.
  if (frameCount % 15 === 0 || !lastVideoId) {
    const id = getVideoId()
    if (id && id !== lastVideoId) {
      lastVideoId = id
      loadRetries = 0
      translationLines = []
      translationVideoId = ''
      resetObservation()
      hintShown = false
      noCaptionSince = 0
      // A new video mounts a fresh CC button. Keep the user's OFF choice but
      // re-baseline it so the new button is not read as a transition.
      resetNativeCcBaseline()
      void loadSubtitles(id)
      return
    }
  }

  if (state?.lines.length) {
    const line = findLineAt(state.lines, video.currentTime)
    renderFrame(line, video.currentTime, true)
    return
  }
  tickNativeFallback(video)
}

export function installInteractiveSubtitles() {
  // load() first: the in-page Karaoke switch initialises from the App's style
  // snapshot, and readSettings() below takes the style from that switch.
  installSubtitleToolbar()
  // Mobile player builds render the CC button WITHOUT aria-pressed; a capture-
  // phase tap watcher is the only way to follow that switch. It never blocks
  // or mutates YouTube's own handler.
  installNativeCcWatcher()
  readSettings()
  setToolbarEnabled(isOn())
  let lastDisplayMode = getToolbarSettings().displayMode
  let lastMixedLevel = getToolbarSettings().mixedLevel
  let lastShowPhonetics = getToolbarSettings().showPhonetics
  let lastSentenceMode = getToolbarSettings().sentenceMode
  let lastPhoneticMode = getToolbarSettings().phoneticMode
  let lastTranslationEnabled = getToolbarSettings().translationEnabled
  let lastTargetLang = getToolbarSettings().targetLang
  onToolbarChange((next) => {
    const previousStyle = style
    style = next.karaoke ? 'karaoke' : 'rolling'
    syncContainerStyle()
    if (previousStyle !== style && style === 'rolling') {
      // Clear the sweep immediately, not on the next animation frame.
      applyActive(-1)
    }
    hideWordCard()
    lastHoverWord = ''

    // Translation disabled: drop any cached gloss so no residual line shows.
    if (!next.translationEnabled) {
      translationLines = []
      translationVideoId = ''
    }

    // Switching between "sense group" and "sentence" changes the block
    // boundaries, so re-group the cached raw cues (no network round-trip) and
    // re-group the translation track on the same boundaries.
    const sentenceModeChanged = next.sentenceMode !== lastSentenceMode
    lastSentenceMode = next.sentenceMode
    if (sentenceModeChanged && state) {
      // Wordy cues are already whole sentences; the legacy merger would turn
      // them back into fragments. Keep them intact for both modes.
      if (state.source !== 'json3' && state.source !== 'captured') {
        state.lines = mergeIntoSentences(state.rawLines, { mode: next.sentenceMode })
      }
      translationVideoId = ''
      currentKey = ''
      void loadTranslation(state.trackUrl, state.videoId)
      rebuildLines()
      return
    }

    // Changing the reading SYSTEM (pinyin -> jyutping -> kana ...) must
    // re-render the current line immediately, not only on the next cue.
    const phoneticModeChanged = next.phoneticMode !== lastPhoneticMode
    lastPhoneticMode = next.phoneticMode
    const translationChanged =
      next.translationEnabled !== lastTranslationEnabled || next.targetLang !== lastTargetLang
    lastTranslationEnabled = next.translationEnabled
    lastTargetLang = next.targetLang
    const contentChanged =
      next.displayMode !== lastDisplayMode ||
      next.mixedLevel !== lastMixedLevel ||
      next.showPhonetics !== lastShowPhonetics ||
      phoneticModeChanged ||
      translationChanged
    lastDisplayMode = next.displayMode
    lastMixedLevel = next.mixedLevel
    lastShowPhonetics = next.showPhonetics
    if (!contentChanged && previousStyle === style) return
    currentKey = ''
    if (contentChanged) void loadTranslation(state?.trackUrl ?? '', state?.videoId ?? '')
    rebuildLines()
  })
  report('installed', `enabled=${isOn()}, style=${style}, host=${window.location.host}`)

  window.addEventListener(CAPTION_CAPTURE_EVENT, (event: Event) => {
    if (!captionsVisible()) return
    const capture = (event as CustomEvent<CaptionCapture>).detail
    if (!capture?.text || isTranslationCaptionUrl(capture.url)) return
    const currentId = getVideoId()
    if (capture.videoId && currentId && capture.videoId !== currentId) return
    applyCapturedPayload(capture)
  })

  window.addEventListener(noutubeSettingsEvent, () => {
    const wasOn = enabled
    const previousStyle = style
    // Mirror a style change made in the App's native Settings modal into the
    // in-page switch before readSettings() picks it up.
    syncKaraokeFromSettings()
    readSettings()
    setToolbarEnabled(isOn())

    syncContainerStyle()
    if (previousStyle !== style) currentKey = ''
    if (!wasOn && isOn()) {
      lastVideoId = ''
      loadRetries = 0
      statusKey = ''
      void loadSubtitles(getVideoId())
    } else if (wasOn && !isOn()) {
      ++loadToken
      clearLines()
      hideAllCaptions()
    }
  })

  window.cancelAnimationFrame(rafId)
  rafId = window.requestAnimationFrame(tick)
}
