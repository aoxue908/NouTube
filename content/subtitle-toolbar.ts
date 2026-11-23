/**
 * Subtitle settings entry point.
 *
 * All controls live in the popover opened by ONE small button. The button is
 * NOT part of YouTube's top control row any more: that row is crowded on
 * phones and kept making our button drift, overlap the native CC / gear
 * buttons, or vanish. It now forms a VERTICAL COLUMN with the fullscreen
 * "tuner" button (#_nou_fs_btn) on the LEFT EDGE of the video, stacked just
 * above it, with the same 16px inset, 40x40 size and dark translucent disc.
 *
 * Visibility still mirrors YouTube's own control bar: Android flags it with
 * #player-control-overlay.fadein (the same signal #_nou_fs_btn uses), the
 * desktop web player with .ytp-autohide on #movie_player. So the button never
 * burns over the video during playback. It lives on the shared
 * #_nou_sub_layer (see subtitle-host.ts), which guarantees taps reach it even
 * when YouTube's control overlay fades in. Nothing here modifies YouTube's
 * nodes.
 */
import { emit, log } from './utils'
import { getSubtitleLayer, isolateSubtitleEvents } from './subtitle-host'
import { getOfflineIpa } from './phonetics'
import {
  PHONETIC_LANGUAGES,
  annotateText,
  readingForWord,
  resolvePhonetic,
  voiceForLanguage,
} from './multilingual-phonetics'

export type DisplayMode = 'original' | 'bilingual' | 'translation'
export type SubtitleTheme = 'outline' | 'shadow' | 'paper'
export type LineAlign = 'left' | 'center' | 'right'
export type SentenceMode = 'group' | 'sentence'

export interface ToolbarSettings {
  displayMode: DisplayMode
  hoverTranslation: boolean
  mixedLevel: 0 | 1 | 2
  fontScale: number
  translationRatio: number
  theme: SubtitleTheme
  showPhonetics: boolean
  lineAlign: LineAlign
  karaoke: boolean
  /** 'group' = one whole sense group on screen (like the reference extension);
   *  'sentence' = swap at every full stop. */
  sentenceMode: SentenceMode
  /** Voice ids for the UK/US speaker buttons and the example-sentence speaker. */
  ttsVoiceUs: string
  ttsVoiceUk: string
  /** Which offline reading system to draw above caption words. */
  phoneticMode: string
  /** Master switch for any translated caption line. */
  translationEnabled: boolean
  /** Target BCP-47 language for translation; '' follows the App setting / system. */
  targetLang: string
  /** Override caption text colour; '' follows the App default. */
  subtitleColor: string
  /** Override phonetic (ruby) colour; '' follows the caption text colour. */
  phoneticColor: string
  /** Override translation-line colour; '' follows the caption text colour. */
  translationColor: string
  /** Translation line size multiplier on top of the existing translation ratio. */
  translationFontScale: number
}

export const TTS_VOICES: Array<{ id: string; label: string }> = [
  { id: 'en-US-AriaNeural', label: 'Aria · US female' },
  { id: 'en-US-JennyNeural', label: 'Jenny · US female' },
  { id: 'en-US-GuyNeural', label: 'Guy · US male' },
  { id: 'en-GB-SoniaNeural', label: 'Sonia · UK female' },
  { id: 'en-GB-RyanNeural', label: 'Ryan · UK male' },
  { id: 'en-AU-NatashaNeural', label: 'Natasha · AU female' },
  { id: 'zh-CN-XiaoxiaoNeural', label: '晓晓 · 普通话女声' },
  { id: 'zh-CN-YunxiNeural', label: '云希 · 普通话男声' },
]

/** Target languages offered for caption translation. '' follows the App setting. */
const TRANSLATION_LANGUAGES: Array<{ id: string; zh: string; en: string }> = [
  { id: '', zh: '跟随默认', en: 'Follow default' },
  { id: 'zh-CN', zh: '简体中文', en: 'Chinese (Simplified)' },
  { id: 'zh-TW', zh: '繁體中文', en: 'Chinese (Traditional)' },
  { id: 'en', zh: '英语', en: 'English' },
  { id: 'ja', zh: '日语', en: 'Japanese' },
  { id: 'ko', zh: '韩语', en: 'Korean' },
  { id: 'fr', zh: '法语', en: 'French' },
  { id: 'es', zh: '西班牙语', en: 'Spanish' },
  { id: 'pt', zh: '葡萄牙语', en: 'Portuguese' },
  { id: 'ru', zh: '俄语', en: 'Russian' },
  { id: 'de', zh: '德语', en: 'German' },
  { id: 'ar', zh: '阿拉伯语', en: 'Arabic' },
  { id: 'hi', zh: '印地语', en: 'Hindi' },
  { id: 'th', zh: '泰语', en: 'Thai' },
  { id: 'vi', zh: '越南语', en: 'Vietnamese' },
]

/** Preset swatches shared with the App's native subtitle colour rows. */
const COLOR_SWATCHES = ['#ffffff', '#ffe9a8', '#a8e6ff', '#b9ffcf', '#ffb3d9', '#e2d4ff']
const COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

const STORAGE_KEY = 'nou:subtitleToolbar'
const TAG = '[NouTube Subtitle Settings]'

const DEFAULTS: ToolbarSettings = {
  // Translation switch defaults to ON, so the line mode must default to
  // bilingual too; otherwise the open switch has no visible effect.
  displayMode: 'bilingual',
  hoverTranslation: true,
  mixedLevel: 0,
  fontScale: 1,
  translationRatio: 0.82,
  theme: 'outline',
  showPhonetics: false,
  lineAlign: 'center',
  karaoke: true,
  sentenceMode: 'group',
  ttsVoiceUs: 'en-US-AriaNeural',
  ttsVoiceUk: 'en-GB-SoniaNeural',
  phoneticMode: 'auto',
  translationEnabled: true,
  targetLang: '',
  subtitleColor: '',
  phoneticColor: '',
  translationColor: '',
  translationFontScale: 1,
}

let settings: ToolbarSettings = { ...DEFAULTS }
let changeHandler: ((next: ToolbarSettings) => void) | null = null

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const getToolbarSettings = (): ToolbarSettings => settings
export const onToolbarChange = (fn: (next: ToolbarSettings) => void) => {
  changeHandler = fn
}

const load = () => {
  // The App's own style setting is the source of truth on first install; after
  // that the in-page switch owns it and writes back through the bridge.
  let appStyle = ''
  try {
    const snapshot = window.NouTube?.getSettings?.() as any
    appStyle = String(snapshot?.interactiveSubtitleStyle ?? '')
  } catch {
    /* snapshot optional */
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      settings = { ...DEFAULTS, karaoke: appStyle !== 'rolling' }
      return
    }
    const parsed = JSON.parse(raw) as Partial<ToolbarSettings>
    settings = {
      displayMode: ['original', 'bilingual', 'translation'].includes(parsed.displayMode as string)
        ? (parsed.displayMode as DisplayMode)
        : 'bilingual',
      hoverTranslation: typeof parsed.hoverTranslation === 'boolean' ? parsed.hoverTranslation : true,
      mixedLevel: parsed.mixedLevel === 1 || parsed.mixedLevel === 2 ? parsed.mixedLevel : 0,
      fontScale: clamp(Number(parsed.fontScale) || 1, 0.6, 1.8),
      translationRatio: clamp(Number(parsed.translationRatio) || 0.82, 0.5, 1.4),
      theme: ['outline', 'shadow', 'paper'].includes(parsed.theme as string)
        ? (parsed.theme as SubtitleTheme)
        : 'outline',
      showPhonetics: parsed.showPhonetics === true,
      lineAlign: ['left', 'center', 'right'].includes(parsed.lineAlign as string)
        ? (parsed.lineAlign as LineAlign)
        : 'center',
      karaoke: typeof parsed.karaoke === 'boolean' ? parsed.karaoke : appStyle !== 'rolling',
      sentenceMode: parsed.sentenceMode === 'sentence' ? 'sentence' : 'group',
      ttsVoiceUs: TTS_VOICES.some((v) => v.id === parsed.ttsVoiceUs)
        ? parsed.ttsVoiceUs!
        : 'en-US-AriaNeural',
      ttsVoiceUk: TTS_VOICES.some((v) => v.id === parsed.ttsVoiceUk)
        ? parsed.ttsVoiceUk!
        : 'en-GB-SoniaNeural',
      phoneticMode: PHONETIC_LANGUAGES.some((o) => o.id === parsed.phoneticMode)
        ? parsed.phoneticMode!
        : 'auto',
      translationEnabled: parsed.translationEnabled !== false,
      targetLang: TRANSLATION_LANGUAGES.some((o) => o.id === parsed.targetLang)
        ? (parsed.targetLang as string)
        : '',
      subtitleColor: COLOR_RE.test(String(parsed.subtitleColor ?? '')) ? parsed.subtitleColor! : '',
      phoneticColor: COLOR_RE.test(String(parsed.phoneticColor ?? '')) ? parsed.phoneticColor! : '',
      translationColor: COLOR_RE.test(String(parsed.translationColor ?? '')) ? parsed.translationColor! : '',
      translationFontScale: clamp(Number(parsed.translationFontScale) || 1, 0.5, 1.4),
    }
  } catch {
    /* private mode / corrupt value -> defaults */
  }
}

const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* best effort */
  }
  try {
    changeHandler?.(settings)
  } catch (e) {
    log(TAG, 'change handler failed', e)
  }
}

/** In-page master switch for the whole subtitle layer. It lives in the menu
 *  on purpose: when the layer is off, native captions come back and the player
 *  still needs to offer a way to switch it on again without digging through
 *  the App's native Settings modal. */
const setSubtitleLayerEnabled = (value: boolean) => {
  enabled = value
  try {
    // Keep the page snapshot in sync immediately, so the settings round-trip
    // cannot race readSettings() and flip the switch back.
    window.NouTube?.setSettings?.({ interactiveSubtitles: value })
  } catch {
    /* settings bridge optional */
  }
  try {
    emit('subtitle-enabled', { value })
  } catch {
    /* settings bridge optional */
  }
  if (!value) menuOpen = false
  render()
}

const update = (patch: Partial<ToolbarSettings>) => {
  settings = { ...settings, ...patch }
  save()
  if (typeof patch.karaoke === 'boolean') {
    // Mirror the in-page Karaoke switch into the App setting so the native
    // Settings modal and the WebView menu stay in sync.
    try {
      emit('subtitle-style', { value: patch.karaoke ? 'karaoke' : 'rolling' })
    } catch {
      /* bridge optional */
    }
  }
  render()
}

/** Called when the App pushes a new settings snapshot into the page. */
export const syncKaraokeFromSettings = () => {
  try {
    const snapshot = window.NouTube?.getSettings?.() as any
    const style = String(snapshot?.interactiveSubtitleStyle ?? '')
    if (!style) return
    const next = style !== 'rolling'
    if (next === settings.karaoke) return
    settings.karaoke = next
    save()
    render()
  } catch {
    /* snapshot optional */
  }
}

/* ---------------------------------------------------------------- i18n --- */

const isChinese = () => {
  try {
    const lang = window.NouTube?.getSettings?.()?.language as string | undefined
    return typeof lang === 'string' && /^zh/i.test(lang)
  } catch {
    return true
  }
}
const L = (zh: string, en: string) => (isChinese() ? zh : en)

/* ------------------------------------------------------------- DOM utils --- */

const mk = (tag: string, className?: string, text?: string): HTMLElement => {
  const el = document.createElement(tag)
  if (className) el.className = className
  if (text != null) el.textContent = text
  return el
}

const button = (label: string, active: boolean, onClick: () => void): HTMLElement => {
  const el = mk('button', 'nou-sub-tb-btn' + (active ? ' is-active' : ''), label)
  el.setAttribute('type', 'button')
  el.addEventListener('click', (event) => {
    event.stopPropagation()
    onClick()
  })
  return el
}

const row = (label: string, control: HTMLElement, hint?: string): HTMLElement => {
  const wrap = mk('div', 'nou-sub-tb-row')
  wrap.appendChild(mk('span', 'nou-sub-tb-row-label', label))
  wrap.appendChild(control)
  if (hint) wrap.appendChild(mk('span', 'nou-sub-tb-row-hint', hint))
  return wrap
}

const group = (...children: HTMLElement[]): HTMLElement => {
  const el = mk('div', 'nou-sub-tb-group')
  for (const child of children) el.appendChild(child)
  return el
}

const selectBox = (
  options: Array<{ id: string; label: string; group?: string }>,
  value: string,
  onChange: (id: string) => void,
  ariaLabel = 'Voice',
): HTMLElement => {
  const el = document.createElement('select')
  el.className = 'nou-sub-tb-select'
  el.setAttribute('aria-label', ariaLabel)
  let currentGroup: string | null = null
  let target: HTMLElement = el
  for (const opt of options) {
    if (opt.group && opt.group !== currentGroup) {
      currentGroup = opt.group
      const group = document.createElement('optgroup')
      group.label = opt.group
      el.appendChild(group)
      target = group
    }
    const o = document.createElement('option')
    o.value = opt.id
    o.textContent = opt.label
    o.selected = opt.id === value
    target.appendChild(o)
  }
  el.addEventListener('change', (event) => {
    event.stopPropagation()
    onChange(el.value)
  })
  el.addEventListener('click', (event) => event.stopPropagation())
  return el
}

/** A row of preset colour swatches plus a "follow default" chip. */
const colorRow = (label: string, value: string, onChange: (color: string) => void): HTMLElement => {
  const wrap = mk('div', 'nou-sub-tb-row')
  wrap.appendChild(mk('span', 'nou-sub-tb-row-label', label))
  const swatches = mk('div', 'nou-sub-tb-swatches')
  const def = mk('button', 'nou-sub-tb-swatch is-default' + (!value ? ' is-active' : ''))
  def.setAttribute('type', 'button')
  def.title = L('跟随默认', 'Default')
  def.textContent = '∅'
  def.addEventListener('click', (event) => {
    event.stopPropagation()
    onChange('')
  })
  swatches.appendChild(def)
  for (const color of COLOR_SWATCHES) {
    const swatch = mk('button', 'nou-sub-tb-swatch' + (value.toLowerCase() === color ? ' is-active' : ''))
    swatch.setAttribute('type', 'button')
    swatch.style.backgroundColor = color
    swatch.setAttribute('aria-label', color)
    swatch.addEventListener('click', (event) => {
      event.stopPropagation()
      onChange(color)
    })
    swatches.appendChild(swatch)
  }
  wrap.appendChild(swatches)
  return wrap
}

/* --------------------------------------------------------- menu sections --- */

type SectionKey = 'display' | 'language' | 'font' | 'theme' | 'settings'
const SECTION_KEYS: SectionKey[] = ['display', 'language', 'font', 'theme', 'settings']

const GROUP_LABELS: Record<string, { zh: string; en: string }> = {
  precise: { zh: '精确注音', en: 'Dictionary readings' },
  latin: { zh: '拉丁字母语言', en: 'Latin-script languages' },
  script: { zh: '其他文字', en: 'Other scripts' },
}

const SECTION_LABELS: Record<SectionKey, () => string> = {
  display: () => L('显示', 'Display'),
  language: () => L('语言显示', 'Language display'),
  font: () => L('字体大小', 'Font size'),
  theme: () => L('主题样式', 'Theme'),
  settings: () => L('设置', 'Settings'),
}

const buildDisplaySection = (): HTMLElement => {
  const panel = mk('div', 'nou-sub-tb-panel-body')
  panel.appendChild(
    row(
      L('交互式字幕', 'Interactive subtitles'),
      group(
        button(L('关', 'Off'), !enabled, () => setSubtitleLayerEnabled(false)),
        button(L('开', 'On'), enabled, () => setSubtitleLayerEnabled(true)),
      ),
    ),
  )
  panel.appendChild(
    row(
      L('逐词高亮', 'Karaoke'),
      group(
        button(L('关', 'Off'), !settings.karaoke, () => update({ karaoke: false })),
        button(L('开', 'On'), settings.karaoke, () => update({ karaoke: true })),
      ),
    ),
  )
  panel.appendChild(
    row(
      L('显示注音', 'Phonetics'),
      group(
        button(L('关', 'Off'), !settings.showPhonetics, () => update({ showPhonetics: false })),
        button(L('开', 'On'), settings.showPhonetics, () => update({ showPhonetics: true })),
      ),
    ),
  )
  panel.appendChild(
    row(
      L('注音语言', 'Reading'),
      selectBox(
        PHONETIC_LANGUAGES.map((o) => ({
          id: o.id,
          label: L(o.zh, o.en),
          group: o.group === 'auto'
            ? undefined
            : L(GROUP_LABELS[o.group].zh, GROUP_LABELS[o.group].en),
        })),
        settings.phoneticMode,
        (id) => update({ phoneticMode: id }),
        L('注音语言', 'Reading language'),
      ),
    ),
  )
  panel.appendChild(
    mk(
      'div',
      'nou-sub-tb-note',
      L(
        '自动按字幕语言与文字选择读音；常用短词用词级 IPA 词典，其余用拼写规则近似转写。中文拼音、粤拼、日语假名/罗马音、韩语罗马字为词典级。',
        'Auto picks a reading by caption language and script. Common short words use a compact IPA dictionary; others use spelling-based approximations. Pinyin, Jyutping, kana/romaji and romaja are dictionary-grade.',
      ),
    ),
  )
  panel.appendChild(
    row(
      L('文字对齐', 'Alignment'),
      group(
        button(L('居左', 'Left'), settings.lineAlign === 'left', () => update({ lineAlign: 'left' })),
        button(L('居中', 'Center'), settings.lineAlign === 'center', () => update({ lineAlign: 'center' })),
        button(L('居右', 'Right'), settings.lineAlign === 'right', () => update({ lineAlign: 'right' })),
      ),
    ),
  )
  panel.appendChild(
    row(
      L('断句粒度', 'Line breaks'),
      group(
        button(L('整段', 'Sense group'), settings.sentenceMode === 'group', () => update({ sentenceMode: 'group' })),
        button(L('单句', 'Sentence'), settings.sentenceMode === 'sentence', () => update({ sentenceMode: 'sentence' })),
      ),
    ),
  )
  panel.appendChild(
    mk(
      'div',
      'nou-sub-tb-note',
      L('整段：连续几句话合成一个完整意群一起显示，只在说话明显停顿时整体换下一块（和参考插件一致）。单句：每遇到句号就换一行。', 'Sense group: keep consecutive sentences together and swap the whole block only at a real pause (like the reference extension). Sentence: one line per full stop.'),
    ),
  )
  panel.appendChild(
    row(
      L('美音发音人', 'US voice'),
      selectBox(TTS_VOICES, settings.ttsVoiceUs, (id) => update({ ttsVoiceUs: id })),
    ),
  )
  panel.appendChild(
    row(
      L('英音发音人', 'UK voice'),
      selectBox(TTS_VOICES, settings.ttsVoiceUk, (id) => update({ ttsVoiceUk: id })),
    ),
  )
  panel.appendChild(
    mk(
      'div',
      'nou-sub-tb-note',
      L('发音优先用微软 Edge 神经语音（可换发音人），不可用时自动回退有道词典发音。', 'Speech uses Microsoft Edge neural voices (selectable), falling back to Youdao dictionary audio when unavailable.'),
    ),
  )
  panel.appendChild(
    mk(
      'div',
      'nou-sub-tb-note',
      L('注音是英文单词上方的国际音标（离线词表 + 查词缓存）；点单词可听发音、看释义。', 'Phonetics are IPA shown above English words (offline table + lookups); tap a word to hear it and see its meaning.'),
    ),
  )
  return panel
}

const buildLanguageSection = (): HTMLElement => {
  const panel = mk('div', 'nou-sub-tb-panel-body')
  panel.appendChild(
    row(
      L('字幕翻译', 'Translate captions'),
      group(
        button(L('关', 'Off'), !settings.translationEnabled, () => update({ translationEnabled: false })),
        button(L('开', 'On'), settings.translationEnabled, () => update({ translationEnabled: true })),
      ),
    ),
  )
  panel.appendChild(
    row(
      L('目标语言', 'Target language'),
      selectBox(
        TRANSLATION_LANGUAGES.map((o) => ({ id: o.id, label: L(o.zh, o.en) })),
        settings.targetLang,
        (id) => update({ targetLang: id }),
        L('翻译目标语言', 'Translation target language'),
      ),
    ),
  )
  const modes: Array<{ value: DisplayMode; zh: string; en: string }> = [
    { value: 'original', zh: '仅原文', en: 'Original' },
    { value: 'bilingual', zh: '双语', en: 'Bilingual' },
    { value: 'translation', zh: '仅译文', en: 'Translation' },
  ]
  panel.appendChild(
    group(
      ...modes.map((m) =>
        button(L(m.zh, m.en), settings.displayMode === m.value, () => update({ displayMode: m.value })),
      ),
    ),
  )

  panel.appendChild(
    row(
      L('悬停看译文', 'Hover for meaning'),
      group(
        button(L('关', 'Off'), !settings.hoverTranslation, () => update({ hoverTranslation: false })),
        button(L('开', 'On'), settings.hoverTranslation, () => update({ hoverTranslation: true })),
      ),
    ),
  )

  const mixed: Array<{ value: 0 | 1 | 2; zh: string; en: string }> = [
    { value: 0, zh: '关', en: 'Off' },
    { value: 1, zh: '少', en: 'Some' },
    { value: 2, zh: '多', en: 'Many' },
  ]
  panel.appendChild(
    row(
      L('夹生字幕', 'Mixed words'),
      group(
        ...mixed.map((m) =>
          button(L(m.zh, m.en), settings.mixedLevel === m.value, () => update({ mixedLevel: m.value })),
        ),
      ),
    ),
  )
  panel.appendChild(
    mk(
      'div',
      'nou-sub-tb-note',
      L('译文里混进几个原文词，悬停看意思；需要视频有可翻译字幕。', 'Sprinkle original words into the translation; needs a translatable caption track.'),
    ),
  )
  return panel
}

const slider = (
  min: number,
  max: number,
  step: number,
  value: number,
  onChange: (v: number) => void,
): HTMLElement => {
  const input = document.createElement('input')
  input.type = 'range'
  input.className = 'nou-sub-tb-range'
  input.min = String(min)
  input.max = String(max)
  input.step = String(step)
  input.value = String(value)
  // The indigo gradient track reads --nou-fill; keep it in sync with the value
  // so the filled portion grows as the thumb moves (see css.ts).
  const paint = () => {
    const pct = max > min ? ((Number(input.value) - min) / (max - min)) * 100 : 50
    input.style.setProperty('--nou-fill', `${pct}%`)
  }
  paint()
  input.addEventListener('input', () => {
    paint()
    onChange(Number(input.value))
  })
  return input
}

const buildFontSection = (): HTMLElement => {
  const panel = mk('div', 'nou-sub-tb-panel-body')
  // NOTE: no "Font size" heading here -- the section title already says it.
  // The old toolbar drew both a panel title and this heading, so users saw
  // "Font size" twice (see the 2026-11-22 screenshot).
  const sizeRow = mk('div', 'nou-sub-tb-slider-row')
  sizeRow.appendChild(mk('span', 'nou-sub-tb-a', 'A−'))
  sizeRow.appendChild(slider(0.6, 1.8, 0.05, settings.fontScale, (v) => {
    settings.fontScale = v
    save()
  }))
  sizeRow.appendChild(mk('span', 'nou-sub-tb-a', 'A+'))
  panel.appendChild(sizeRow)

  panel.appendChild(
    mk('div', 'nou-sub-menu-subtitle', L('译文 / 原文大小对比', 'Translation / original size')),
  )
  const ratioRow = mk('div', 'nou-sub-tb-slider-row')
  ratioRow.appendChild(mk('span', 'nou-sub-tb-a small', L('译文', 'Trans')))
  ratioRow.appendChild(slider(0.5, 1.4, 0.02, settings.translationRatio, (v) => {
    settings.translationRatio = v
    save()
  }))
  ratioRow.appendChild(mk('span', 'nou-sub-tb-a small', L('原文+', 'Orig+')))
  panel.appendChild(ratioRow)

  panel.appendChild(
    mk('div', 'nou-sub-menu-subtitle', L('译文大小倍率', 'Translation size')),
  )
  const transScaleRow = mk('div', 'nou-sub-tb-slider-row')
  transScaleRow.appendChild(mk('span', 'nou-sub-tb-a small', L('小', 'S')))
  transScaleRow.appendChild(slider(0.5, 1.4, 0.05, settings.translationFontScale, (v) => {
    settings.translationFontScale = v
    save()
  }))
  transScaleRow.appendChild(mk('span', 'nou-sub-tb-a small', L('大', 'L')))
  panel.appendChild(transScaleRow)
  return panel
}

const THEMES: Array<{ value: SubtitleTheme; zh: string; en: string; sub: string }> = [
  { value: 'outline', zh: '描边', en: 'Outline', sub: 'Outline' },
  { value: 'shadow', zh: '投影', en: 'Shadow', sub: 'Just Shadow' },
  { value: 'paper', zh: '笔记风', en: 'Paper', sub: 'Paper Note' },
]

const buildThemeSection = (): HTMLElement => {
  const panel = mk('div', 'nou-sub-tb-panel-body')
  const cards = mk('div', 'nou-sub-tb-theme-cards')
  for (const item of THEMES) {
    const card = mk(
      'button',
      'nou-sub-tb-theme-card nou-sub-tb-theme--' + item.value + (settings.theme === item.value ? ' is-active' : ''),
    )
    card.setAttribute('type', 'button')
    card.appendChild(mk('span', 'nou-sub-tb-theme-name', L(item.zh, item.en)))
    card.appendChild(mk('span', 'nou-sub-tb-theme-sub', item.sub))
    card.addEventListener('click', (event) => {
      event.stopPropagation()
      update({ theme: item.value })
    })
    cards.appendChild(card)
  }
  panel.appendChild(cards)

  panel.appendChild(mk('div', 'nou-sub-menu-subtitle', L('颜色', 'Colours')))
  panel.appendChild(
    colorRow(L('字幕颜色', 'Caption'), settings.subtitleColor, (c) => update({ subtitleColor: c })),
  )
  panel.appendChild(
    colorRow(L('注音颜色', 'Phonetics'), settings.phoneticColor, (c) => update({ phoneticColor: c })),
  )
  panel.appendChild(
    colorRow(L('译文颜色', 'Translation'), settings.translationColor, (c) => update({ translationColor: c })),
  )
  return panel
}

const buildSettingsSection = (): HTMLElement => {
  const panel = mk('div', 'nou-sub-tb-panel-body')
  panel.appendChild(
    row(
      L('重置全部', 'Reset all'),
      button(L('重置', 'Reset'), false, () => {
        settings = { ...DEFAULTS }
        save()
      }),
    ),
  )
  panel.appendChild(
    mk(
      'div',
      'nou-sub-tb-note',
      L('按住字幕可上下拖动调整位置；点击字幕中的单词可查词查释义。更多设置见 App「设置 → YouTube → 播放」。', 'Drag the caption to move it; tap any word to look it up. More options live in the app Settings.'),
    ),
  )
  return panel
}

const sectionBody = (key: SectionKey): HTMLElement => {
  switch (key) {
    case 'display':
      return buildDisplaySection()
    case 'language':
      return buildLanguageSection()
    case 'font':
      return buildFontSection()
    case 'theme':
      return buildThemeSection()
    case 'settings':
      return buildSettingsSection()
  }
}

const buildMenuBody = (): HTMLElement => {
  const body = mk('div', 'nou-sub-menu-body')
  for (const key of SECTION_KEYS) {
    const section = mk('section', 'nou-sub-menu-section')
    section.appendChild(mk('div', 'nou-sub-menu-section-title', SECTION_LABELS[key]()))
    section.appendChild(sectionBody(key))
    body.appendChild(section)
  }
  return body
}

/* --------------------------------------------------- left-edge grouping --- */

const ENTRY_W = 40
const ENTRY_H = 40
const EDGE = 8
/** Vertical gap between our button and the fullscreen "tuner" button below. */
const VERTICAL_GAP = 12
/** Same left inset as #_nou_fs_btn / #_nou_fs_panel (see css.ts). */
const LEFT_INSET = 16
/** Touch strip along the screen left edge that reveals the entry button. */
const EDGE_HIT_PX = 28
/** Idle time after which an edge-revealed button hides itself again. */
const REVEAL_HIDE_MS = 3000

const getPlayer = (): HTMLElement | null => document.getElementById('movie_player')

/**
 * The subtitle settings button belongs to the same VERTICAL COLUMN as the
 * fullscreen "tuner" button (#_nou_fs_btn): both hug the left edge of the
 * video, one directly above the other. It is deliberately NOT part of
 * YouTube's crowded top control row any more -- on phones that row made the
 * button drift, collide with the native CC / gear buttons, or disappear
 * entirely (see the 2026-11-22 screenshots).
 *
 * #_nou_fs_btn is position:fixed with translateY(-50%), so its rect is already
 * transform-adjusted; stacking above it needs no extra maths. When the player
 * is not in fullscreen the tuner button does not exist, so fall back to the
 * same left inset and the same "just above centre" slot instead of jumping
 * back to the top-right control row.
 */
const syncEntryPosition = () => {
  const wrap = entryWrapEl
  const layer = getSubtitleLayer()
  if (!wrap || !layer) return
  let box = layer.getBoundingClientRect()
  if (!box.width || !box.height) {
    // Layer not laid out yet (inline/fullscreen transition, or a fresh SPA
    // navigation): fall back to the viewport so the button still hugs the
    // left edge instead of dropping into the control bar's static flow.
    box = {
      left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight,
      width: window.innerWidth || 800, height: window.innerHeight || 600,
      x: 0, y: 0, toJSON: () => ({}),
    } as DOMRect
  }

  // The native view publishes the display-cutout inset in fullscreen
  // landscape; the tuner button honours it, so we must too.
  let cutout = 0
  try {
    cutout = Number.parseFloat(
      window.getComputedStyle(document.documentElement)
        .getPropertyValue('--_nou_cutout_left'),
    ) || 0
  } catch {
    /* custom property is optional */
  }

  let left = LEFT_INSET + cutout
  let top = box.height / 2 - ENTRY_H / 2 - ENTRY_H - VERTICAL_GAP

  const fsBtn = document.getElementById('_nou_fs_btn') as HTMLElement | null
  if (fsBtn && !fsBtn.classList.contains('right')) {
    const r = fsBtn.getBoundingClientRect()
    if (r.width >= 16 && r.height >= 16 && r.right > 0 && r.bottom > 0) {
      left = r.left - box.left
      top = r.top - box.top - ENTRY_H - VERTICAL_GAP
    }
  }

  left = clamp(Math.round(left), EDGE, Math.max(EDGE, box.width - ENTRY_W - EDGE))
  top = clamp(Math.round(top), EDGE, Math.max(EDGE, box.height - ENTRY_H - EDGE))
  wrap.style.left = `${left}px`
  wrap.style.top = `${top}px`
  // A left-edge column opens its popover to the RIGHT (and vice versa). The
  // popover is vertically centred on the button (see css.ts), so no vertical
  // flip is needed even on short landscape screens.
  wrap.classList.toggle('menu-left', left < box.width / 2)
}

/* --------------------------------------------------------------- UI state --- */

let entryWrapEl: HTMLElement | null = null
let entryBtnEl: HTMLElement | null = null
let menuEl: HTMLElement | null = null
let wordCardEl: HTMLElement | null = null
let enabled = false
let menuOpen = false
let syncCounter = 0
let controlsVisible = false
/** Button was summoned by a touch on the left-edge strip. */
let edgeRevealed = false
/** Auto-hide timer for an edge-revealed button. */
let hideTimer = 0
let sawFadein = false
let staticOverlayVisible = false
let visFrames = 0

/** Flat white CC icon with the same visual weight AND the same square outline
 *  as YouTube's own captions button, so the controls share one baseline. Two
 *  open C arcs sit inside the frame; background stays transparent (css.ts). */
const SVG_NS = 'http://www.w3.org/2000/svg'
/** Build SVG children with createElementNS. Assigning `svg.innerHTML` is not
 *  reliable on every Android WebView build: when it silently fails, the icon
 *  is empty and the transparent 40x40 button looks like it has vanished. */
const svgNode = (tag: string, attrs: Record<string, string>): SVGElement => {
  const el = document.createElementNS(SVG_NS, tag)
  for (const key of Object.keys(attrs)) el.setAttribute(key, attrs[key])
  return el
}

const makeSubtitleIcon = (): SVGElement => {
  const svg = svgNode('svg', {
    viewBox: '0 0 24 24',
    width: '24',
    height: '24',
    fill: 'none',
    'aria-hidden': 'true',
  })
  svg.appendChild(
    svgNode('rect', {
      x: '1.8', y: '3.6', width: '20.4', height: '16.8', rx: '2.6',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9',
    }),
  )
  // Two open C arcs (captions). Stroke arcs render more reliably on older
  // Android WebViews than an evenodd filled compound glyph.
  svg.appendChild(
    svgNode('path', {
      d: 'M10.4 9.4a3.5 3.5 0 1 0 0 5.2',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round',
    }),
  )
  svg.appendChild(
    svgNode('path', {
      d: 'M19.2 9.4a3.5 3.5 0 1 0 0 5.2',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round',
    }),
  )
  return svg
}

const ensureDom = (): boolean => {
  // Mount on the shared layer, NOT inside #movie_player: YouTube's control
  // overlay covers the whole player and swallows taps on anything beneath it
  // as soon as the controls fade in (see content/subtitle-host.ts).
  const layer = getSubtitleLayer()
  if (!layer) return false
  if (
    entryWrapEl?.isConnected &&
    menuEl?.isConnected &&
    wordCardEl?.isConnected &&
    entryWrapEl.parentElement === layer &&
    menuEl.parentElement === layer &&
    wordCardEl.parentElement === layer
  ) return true

  if (!entryWrapEl) {
    entryWrapEl = mk('div', 'nou-sub-entry-wrap')

    entryBtnEl = mk('button', 'nou-sub-entry')
    entryBtnEl.setAttribute('type', 'button')
    const label = L('字幕设置', 'Subtitle settings')
    entryBtnEl.setAttribute('aria-label', label)
    entryBtnEl.title = label
    entryBtnEl.appendChild(makeSubtitleIcon())
    // Keep the button up while the finger or pointer rests on it.
    entryBtnEl.addEventListener('pointerdown', () => scheduleAutoHide())
    entryBtnEl.addEventListener('pointerenter', () => scheduleAutoHide())
    entryBtnEl.addEventListener('click', (event) => {
      event.stopPropagation()
      menuOpen = !menuOpen
      if (menuOpen) clearHideTimer()
      else scheduleAutoHide()
      render()
      if (menuOpen) syncEntryPosition()
    })
    entryWrapEl.appendChild(entryBtnEl)

    menuEl = mk('div', 'nou-sub-menu')
    entryWrapEl.appendChild(menuEl)
  }
  wordCardEl ||= mk('div', 'nou-sub-tb-wordcard')

  if (entryWrapEl.parentElement !== layer) layer.appendChild(entryWrapEl)
  if (wordCardEl.parentElement !== layer) layer.appendChild(wordCardEl)
  // Keep taps off YouTube's player/document handlers, but leave pointermove
  // alone so the caption drag (window listener) still works.
  isolateSubtitleEvents(entryWrapEl)
  isolateSubtitleEvents(wordCardEl)
  return true
}

/** Mirror YouTube's own control bar: hidden while the video just plays, shown
 *  on tap. Android flags visible controls with #player-control-overlay.fadein
 *  (the same signal #_nou_fs_btn keys off in css.ts / fullscreen-controls.ts);
 *  the desktop web player marks hidden chrome with .ytp-autohide on
 *  #movie_player. */
const computeControlsShown = (): boolean => {
  const isWebPlayer = !(window as any).isAndroid
  const player = getPlayer()
  if (isWebPlayer) return !player?.classList?.contains?.('ytp-autohide')
  const overlay = document.getElementById('player-control-overlay')
  if (!overlay) return true
  if (overlay.classList.contains('fadein')) {
    sawFadein = true
    return true
  }
  // A few builds keep a static controls row with no .fadein. Probe computed
  // style rarely and latch the answer so the button does not flicker.
  if (!sawFadein && ++visFrames % 30 === 0) {
    const cs = window.getComputedStyle(overlay)
    staticOverlayVisible =
      cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.01
  }
  return !sawFadein && staticOverlayVisible
}

const clearHideTimer = () => {
  if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = 0
  }
}

/** Reset the idle clock; the button hides itself after this long without input. */
const scheduleAutoHide = () => {
  clearHideTimer()
  // Keep the button up while its menu is open; closing the menu restarts the
  // clock from onDocClick / the entry toggle.
  if (menuOpen) return
  hideTimer = window.setTimeout(() => {
    edgeRevealed = false
    hideTimer = 0
    applyVisibility()
  }, REVEAL_HIDE_MS)
}

/** Summon the button from a touch on the left-edge strip. */
const revealFromEdge = () => {
  edgeRevealed = true
  applyVisibility()
  scheduleAutoHide()
}

const applyVisibility = () => {
  if (!entryWrapEl) return
  // The entry does NOT follow YouTube's control bar any more: it stays hidden
  // until summoned by a touch on the left edge, then hides itself after a
  // short idle delay. It must stay up while the menu is open (the only place
  // the master switch can be reached), independent of `enabled`.
  const show = menuOpen || edgeRevealed
  entryWrapEl.classList.toggle('is-visible', show)
}

const syncControlsVisibility = () => {
  const shown = computeControlsShown()
  if (shown === controlsVisible) return
  controlsVisible = shown
  applyVisibility()
  if (shown) {
    // The native control row fades/moves in over several frames. Re-measure a
    // few times so the entry never settles on top of a neighbour mid-animation.
    syncEntryPosition()
    window.requestAnimationFrame(syncEntryPosition)
    window.setTimeout(syncEntryPosition, 160)
    window.setTimeout(syncEntryPosition, 420)
  }
}

const render = () => {
  if (!entryWrapEl || !entryBtnEl || !menuEl) return
  applyVisibility()
  entryBtnEl.classList.toggle('is-open', menuOpen)

  // The menu is the ONLY place where the master switch can be turned back on,
  // so it must open even while the subtitle layer is disabled.
  const open = menuOpen
  menuEl.classList.toggle('is-open', open)
  if (!open) return

  // Rebuild only while the menu is open (never on every frame), preserving the
  // scroll position so tapping a control does not jump back to the top.
  const scrollTop = menuEl.scrollTop
  menuEl.textContent = ''

  const head = mk('div', 'nou-sub-menu-head')
  head.appendChild(mk('div', 'nou-sub-menu-title', L('字幕设置', 'Subtitle settings')))
  const close = mk('button', 'nou-sub-menu-close', '×')
  close.setAttribute('type', 'button')
  close.setAttribute('aria-label', L('关闭', 'Close'))
  close.addEventListener('click', (event) => {
    event.stopPropagation()
    menuOpen = false
    render()
  })
  head.appendChild(close)
  menuEl.appendChild(head)
  menuEl.appendChild(buildMenuBody())
  menuEl.scrollTop = scrollTop
}

/** The caption layer tells us whether the independent switch is on. */
export const setToolbarEnabled = (value: boolean) => {
  // tick() calls this every frame. Always re-check the host (a few cheap DOM
  // reads): a fullscreen transition re-parents the shared layer.
  const changed = enabled !== value
  const firstMount = !entryWrapEl
  if (changed) {
    enabled = value
    if (!value) menuOpen = false
  }
  ensureDom()
  // render() rebuilds the open menu's DOM, so it must NOT run every frame --
  // that would replace a slider mid-drag and cost a lot of layout work.
  if (changed || firstMount) render()
  syncControlsVisibility()
  if (firstMount || ++syncCounter % 30 === 0) syncEntryPosition()
}

/* --------------------------------------------------------- word meaning --- */

/**
 * The in-page card used to be a dead end: it printed "Looking up..." and
 * nothing ever filled it in, because the only real translation lived in the
 * native TranslationCard (ML Kit), which needs a downloaded model. Now the
 * native side queries Youdao (see lib/word-lookup.ts) and pushes the result
 * into the page; the page keeps its own network lookup as a fallback.
 */
const MEANING_EVENT = 'nou:word-meaning'
const meaningCache = new Map<string, string>()
const phoneticCache = new Map<string, string>()

export interface WordExampleDetail {
  en: string
  zh: string
  /** Online audio for the whole sentence; Android WebView has no system TTS. */
  audioUrl?: string
}

export interface WordMeaningDetail {
  word: string
  text?: string
  phonetic?: string
  audioUrl?: string
  ukPhonetic?: string
  usPhonetic?: string
  ukAudioUrl?: string
  usAudioUrl?: string
  example?: WordExampleDetail
}

/** IPA for a caption word: a looked-up one wins, otherwise the offline table. */
export const getPhoneticForWord = (word: string): string | undefined =>
  phoneticCache.get(word.toLowerCase()) ?? getOfflineIpa(word)

const meaningLanguage = (): string => {
  if (settings.targetLang) return settings.targetLang.split(/[-_]/)[0].toLowerCase()
  try {
    const appSettings = window.NouTube?.getSettings?.() as any
    const lang = appSettings?.translationTargetLanguage as string | undefined
    return typeof lang === 'string' && lang ? lang.split(/[-_]/)[0].toLowerCase() : 'zh'
  } catch {
    return 'zh'
  }
}

const fetchJson = async (url: string, timeoutMs = 3200): Promise<any> => {
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await window.fetch(url, { signal: ctrl.signal })
    return res.ok ? await res.json() : null
  } catch {
    // YouTube's CSP can block third-party hosts; a silent null lets the native
    // dictionary result (or the next source) take over.
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/** Translate the caption sentence as a last-resort example. Only used when
 *  Youdao returned no bilingual example; an untranslated line is not shown. */
const translateSentence = async (text: string): Promise<string> => {
  const tl = meaningLanguage() === 'zh' ? 'zh-CN' : meaningLanguage()
  const gtx = await fetchJson(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`,
  )
  const parts = Array.isArray(gtx?.[0]) ? gtx[0].map((p: any) => p?.[0]).filter(Boolean) : []
  return parts.join('').trim()
}

const lookupWordMeaning = async (word: string): Promise<string | null> => {
  const key = word.toLowerCase()
  if (meaningCache.has(key)) return meaningCache.get(key)!
  const q = encodeURIComponent(word)
  const lang = meaningLanguage()
  const tl = lang === 'zh' ? 'zh-CN' : lang

  const gtx = await fetchJson(
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${q}`,
  )
  const parts = Array.isArray(gtx?.[0]) ? gtx[0].map((p: any) => p?.[0]).filter(Boolean) : []
  let text = parts.join('').trim()

  if (!text) {
    const mm = await fetchJson(`https://api.mymemory.translated.net/get?q=${q}&langpair=en|${tl}`)
    text = String(mm?.responseData?.translatedText ?? '').trim()
  }
  if (!text) {
    const dict = await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${q}`)
    const entry = Array.isArray(dict) ? dict[0] : null
    text = String(entry?.meanings?.[0]?.definitions?.[0]?.definition ?? '').trim()
  }

  if (text) meaningCache.set(key, text)
  return text || null
}

/** Page-side Youdao attempt. YouTube's CSP blocks third-party fetches on most
 *  builds, but WebViews that allow it get IPA + Chinese meaning + a bilingual
 *  example in ONE request without waiting for the native round-trip. This is
 *  the second independent channel for "tapping a word shows nothing". */
const lookupYoudaoInPage = async (word: string): Promise<WordMeaningDetail | null> => {
  const q = encodeURIComponent(word)
  const data = await fetchJson(
    `https://dict.youdao.com/jsonapi?jsonversion=2&client=mobile&q=${q}`,
    3500,
  )
  if (!data) return null
  const str = (value: unknown): string =>
    typeof value === 'string' ? value.trim() : ''
  const strip = (value: unknown): string =>
    typeof value === 'string'
      ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
      : ''
  const ec = data?.ec?.word?.[0]
  const meanings: string[] = []
  for (const group of Array.isArray(ec?.trs) ? ec.trs : []) {
    const items = group?.tr?.[0]?.l?.i
    if (Array.isArray(items)) {
      for (const item of items) {
        const value = str(item)
        if (value) meanings.push(value)
      }
    }
  }
  const text = meanings.length ? meanings.slice(0, 6).join('；') : str(data?.fanyi?.tran)
  const uk = str(ec?.ukphone)
  const us = str(ec?.usphone)
  let example: WordExampleDetail | undefined
  const pairs = data?.blng_sents_part?.['sentence-pair']
  if (Array.isArray(pairs)) {
    for (const pair of pairs) {
      const en = strip(pair?.sentence)
      const zh = strip(pair?.['sentence-translation'])
      if (en && zh) {
        example = {
          en,
          zh,
          audioUrl: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(en)}&type=2`,
        }
        break
      }
    }
  }
  if (!text && !uk && !us && !example) return null
  return {
    word,
    text: text || undefined,
    phonetic: us || uk || undefined,
    ukPhonetic: uk || undefined,
    usPhonetic: us || undefined,
    ukAudioUrl: `https://dict.youdao.com/dictvoice?audio=${q}&type=1`,
    usAudioUrl: `https://dict.youdao.com/dictvoice?audio=${q}&type=2`,
    example,
  }
}

const lookupWordDetail = async (word: string): Promise<WordMeaningDetail | null> => {
  const direct = await lookupYoudaoInPage(word)
  if (direct) return direct
  const text = await lookupWordMeaning(word)
  return text ? { word, text } : null
}

/** Speaker (volume) icon with two sound-wave arcs. The arcs are animated only
 *  while the button has .is-playing, so a tap gives visible playback feedback. */
const makeSpeakerIcon = (): SVGElement => {
  const svg = svgNode('svg', {
    viewBox: '0 0 24 24', width: '16', height: '16', 'aria-hidden': 'true',
  })
  svg.appendChild(
    svgNode('path', {
      d: 'M3.4 9.2h3.3l4.8-3.6v12.8L6.7 14.8H3.4a1 1 0 0 1-1-1v-3.6a1 1 0 0 1 1-1Z',
      fill: 'currentColor',
    }),
  )
  svg.appendChild(
    svgNode('path', {
      class: 'nou-wave nou-wave--1',
      d: 'M14.7 9.2a4 4 0 0 1 0 5.6',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round',
    }),
  )
  svg.appendChild(
    svgNode('path', {
      class: 'nou-wave nou-wave--2',
      d: 'M17.4 6.9a7.3 7.3 0 0 1 0 10.2',
      fill: 'none', stroke: 'currentColor', 'stroke-width': '1.9', 'stroke-linecap': 'round',
    }),
  )
  return svg
}

const makeSpeakButton = (label: string, inline = false): HTMLElement => {
  const btn = mk('button', 'nou-sub-tb-word-speak' + (inline ? ' nou-sub-tb-word-speak--inline' : ''))
  btn.setAttribute('type', 'button')
  btn.setAttribute('aria-label', label)
  btn.title = label
  btn.appendChild(makeSpeakerIcon())
  return btn
}

/** Play a base64 MP3 coming back from the RN-side Edge-TTS synthesizer. */
const playBase64Audio = (base64: string, onEnd: () => void, onError: () => void) => {
  try {
    const raw = atob(base64)
    const bytes = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
    const audio = new Audio(url)
    audio.onended = () => { URL.revokeObjectURL(url); onEnd() }
    audio.onerror = () => { URL.revokeObjectURL(url); onError() }
    void audio.play().catch(() => { URL.revokeObjectURL(url); onError() })
  } catch {
    onError()
  }
}

/** Speak a word or a whole sentence.
 *  1) Ask RN for an Edge-TTS neural voice (selectable in the subtitle menu);
 *  2) on no reply / failure fall back to the Youdao dictvoice URL;
 *  3) finally fall back to the (often silent) system TTS.
 *  The button keeps its pulse animation until playback actually ends. */
const speakText = (
  text: string,
  opts: { audioUrl?: string; btn?: HTMLElement; lang?: string; voice?: string } = {},
) => {
  const { audioUrl, btn, lang = 'en-US', voice } = opts
  let timer = 0
  let finished = false
  const finish = () => {
    if (finished) return
    finished = true
    window.clearTimeout(timer)
    ttsPending.delete(id)
    btn?.classList.remove('is-playing')
  }
  const id = `${Date.now()}-${Math.random()}`

  const fallback = () => {
    try {
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = 0.9
      utter.onend = finish
      utter.onerror = finish
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    } catch {
      finish()
    }
  }
  const playDictvoice = () => {
    if (!audioUrl) { fallback(); return }
    try {
      const audio = new Audio(audioUrl)
      audio.onended = finish
      audio.onerror = fallback
      void audio.play().catch(fallback)
    } catch {
      fallback()
    }
  }

  // Wait briefly for the RN bridge. In the browser / Electron there is no RN
  // listener, so the timer simply fires and we use the online URL as before.
  const useEdge = Boolean(voice && window.NouTubeI?.onMessage)
  if (useEdge) {
    ttsPending.set(id, {
      play: (b64) => playBase64Audio(b64, finish, playDictvoice),
      fail: playDictvoice,
    })
    emit('speak-text', { id, text, voice })
    timer = window.setTimeout(() => {
      const pending = ttsPending.get(id)
      ttsPending.delete(id)
      pending?.fail()
    }, 7500)
  } else {
    timer = window.setTimeout(finish, 6000)
  }
  btn?.classList.add('is-playing')
}

/** Edge-TTS results keyed by request id, registered once when the toolbar installs. */
const ttsPending = new Map<string, { play: (b64: string) => void; fail: () => void }>()
const onTtsAudio = (event: Event) => {
  try {
    const detail = (event as CustomEvent).detail ?? {}
    const pending = ttsPending.get(String(detail.id))
    if (!pending) return
    ttsPending.delete(String(detail.id))
    if (typeof detail.base64 === 'string' && detail.base64) pending.play(detail.base64)
    else pending.fail()
  } catch { /* ignore malformed events */ }
}

/** Render a dictionary example: English sentence + Chinese translation + a
 *  speaker button at the END of the sentence. If no translated example is
 *  available the section simply does not exist. */
const renderExample = (card: HTMLElement, en: string, zh: string, audioUrl?: string) => {
  if (!en || !zh) return
  card.querySelector('.nou-sub-tb-word-example')?.remove()
  const box = mk('div', 'nou-sub-tb-word-example')
  const enRow = mk('div', 'nou-sub-tb-word-example-en')
  enRow.appendChild(document.createTextNode(en))
  const speak = makeSpeakButton(L('朗读例句', 'Play example'), true)
  // The Android WebView has no usable speechSynthesis voices, so a sentence
  // with no audioUrl used to be silently mute. Youdao dictvoice accepts a
  // whole encoded sentence (verified: audio/mpeg), same as the word speakers.
  const voiceUrl =
    audioUrl ||
    `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(en)}&type=2`
  speak.dataset.audio = voiceUrl
  speak.addEventListener('click', (event) => {
    event.stopPropagation()
    speakText(en, { audioUrl: voiceUrl, btn: speak, lang: 'en-US', voice: settings.ttsVoiceUs })
  })
  enRow.appendChild(speak)
  box.appendChild(enRow)
  box.appendChild(mk('div', 'nou-sub-tb-word-example-zh', zh))
  card.dataset.example = '1'
  card.appendChild(box)
}

/** Fill meaning / UK+US phonetics / audio / example into the card currently
 *  showing `word`. All sources (Youdao, ML Kit, page fallbacks) use this. */
const applyWordMeaning = (word: string, detail: WordMeaningDetail) => {
  const card = wordCardEl
  if (!card || card.style.display === 'none') return
  if ((card.dataset.word || '').toLowerCase() !== word.toLowerCase()) return

  if (detail.text) {
    meaningCache.set(word.toLowerCase(), detail.text)
    const el = card.querySelector<HTMLElement>('.nou-sub-tb-word-meaning')
    if (el) {
      el.textContent = detail.text
      el.style.display = ''
    }
  }
  const mainPhonetic = detail.phonetic || detail.usPhonetic || detail.ukPhonetic
  if (mainPhonetic) phoneticCache.set(word.toLowerCase(), mainPhonetic)
  const localText = card.querySelector<HTMLElement>(
    '.nou-sub-tb-word-ph-row:not([data-accent="uk"]):not([data-accent="us"]) .nou-sub-tb-word-ph-text',
  )
  if (localText && mainPhonetic && !localText.textContent) localText.textContent = mainPhonetic

  const ukText = card.querySelector<HTMLElement>('[data-accent="uk"] .nou-sub-tb-word-ph-text')
  const usText = card.querySelector<HTMLElement>('[data-accent="us"] .nou-sub-tb-word-ph-text')
  // If only one accent came back, mirror it so neither row is blank while both
  // play buttons remain usable.
  const only = detail.ukPhonetic || detail.usPhonetic || mainPhonetic
  if (ukText && (detail.ukPhonetic || only)) ukText.textContent = detail.ukPhonetic || only || ''
  if (usText && (detail.usPhonetic || only)) usText.textContent = detail.usPhonetic || only || ''

  const ukBtn = card.querySelector<HTMLElement>('[data-accent="uk"] .nou-sub-tb-word-speak')
  const usBtn = card.querySelector<HTMLElement>('[data-accent="us"] .nou-sub-tb-word-speak')
  if (detail.ukAudioUrl && ukBtn) ukBtn.dataset.audio = detail.ukAudioUrl
  if (detail.usAudioUrl && usBtn) usBtn.dataset.audio = detail.usAudioUrl
  if (detail.audioUrl && usBtn && !detail.usAudioUrl) usBtn.dataset.audio = detail.audioUrl

  if (detail.example)
    renderExample(card, detail.example.en, detail.example.zh, detail.example.audioUrl)
}

export const hideWordCard = () => {
  if (wordCardEl) wordCardEl.style.display = 'none'
}

export interface WordCardPayload {
  word: string
  sentence: string
  /** languageCode of the caption track the tapped word came from. */
  languageCode?: string
  translation?: string
  x?: number
  y?: number
  hover?: boolean
}

let cardTimer = 0

/** Immediate in-page card so a tap ALWAYS gives visible feedback, even when the
 *  native dictionary card is slow or the bridge is not ready. */
export const showWordCard = (payload: WordCardPayload) => {
  if (!ensureDom() || !wordCardEl) return
  const card = wordCardEl
  card.textContent = ''
  card.dataset.word = payload.word
  delete card.dataset.example
  const knownIpa = getPhoneticForWord(payload.word)
  const phoneticOpts = {
    mode: settings.phoneticMode,
    languageCode: payload.languageCode,
    lookupIpa: getPhoneticForWord,
  }
  const resolved = resolvePhonetic(payload.word, payload.languageCode, settings.phoneticMode)

  // Title: for script-based languages (zh / yue / ja / ko / ...) sit each
  // reading directly above its own character as a ruby annotation, instead of
  // dumping one flat pronunciation line under the word. English keeps its
  // separate UK / US IPA rows below.
  const titleEl = mk('div', 'nou-sub-tb-word')
  const titleSegs = resolved.lang === 'en' ? null : annotateText(payload.word, phoneticOpts)
  if (titleSegs) {
    for (const seg of titleSegs) {
      if (!seg.rt) {
        titleEl.appendChild(document.createTextNode(seg.base))
        continue
      }
      const ruby = document.createElement('ruby')
      ruby.appendChild(document.createTextNode(seg.base))
      const rt = document.createElement('rt')
      rt.textContent = seg.rt
      ruby.appendChild(rt)
      titleEl.appendChild(ruby)
    }
  } else {
    titleEl.textContent = payload.word
  }
  card.appendChild(titleEl)

  // British and American pronunciation are TWO separate groups. Each has its
  // own phonetic text and its own speaker button (dictvoice type=1 / type=2).
  // The offline IPA table answers instantly; the Youdao result later fills in
  // each accent's real phonetic.
  const phonetics = mk('div', 'nou-sub-tb-word-phonetics')
  if (resolved.lang === 'en') {
    // English keeps the two separate UK / US pronunciation groups exactly as
    // before (both the offline IPA table and the Youdao result feed them).
    const accents: Array<{ key: 'uk' | 'us'; tag: string; type: 1 | 2; label: string }> = [
      { key: 'uk', tag: 'UK', type: 1, label: L('英音发音', 'UK pronunciation') },
      { key: 'us', tag: 'US', type: 2, label: L('美音发音', 'US pronunciation') },
    ]
    for (const accent of accents) {
      const row = mk('div', 'nou-sub-tb-word-ph-row')
      row.dataset.accent = accent.key
      row.appendChild(mk('span', 'nou-sub-tb-word-ph-tag', accent.tag))
      row.appendChild(mk('span', 'nou-sub-tb-word-ph-text', knownIpa ?? ''))
      const speak = makeSpeakButton(accent.label)
      speak.dataset.audio = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(payload.word)}&type=${accent.type}`
      speak.addEventListener('click', (event) => {
        event.stopPropagation()
        speakText(payload.word, {
          audioUrl: speak.dataset.audio,
          btn: speak,
          voice: accent.key === 'uk' ? settings.ttsVoiceUk : settings.ttsVoiceUs,
        })
      })
      row.appendChild(speak)
      phonetics.appendChild(row)
    }
  } else {
    // Non-English: show THIS language's reading (pinyin / jyutping / kana /
    // romaja / IPA) and speak it with the matching Edge neural voice, so a
    // Cantonese word is actually read in Cantonese instead of English TTS.
    const voice = voiceForLanguage(resolved.lang)
    const reading = readingForWord(payload.word, phoneticOpts)
    const row = mk('div', 'nou-sub-tb-word-ph-row')
    row.dataset.accent = resolved.lang
    row.appendChild(mk('span', 'nou-sub-tb-word-ph-tag', L('读音', 'Reading')))
    // Ruby readings already sit above each character in the title; only fall
    // back to the flat line when the title had no segment reading at all.
    const flatReading = titleSegs ? '' : reading
    row.appendChild(mk('span', 'nou-sub-tb-word-ph-text', flatReading || knownIpa || ''))
    const speak = makeSpeakButton(L('发音', 'Pronounce'))
    speak.dataset.audio = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(payload.word)}&type=2`
    speak.addEventListener('click', (event) => {
      event.stopPropagation()
      speakText(payload.word, {
        audioUrl: speak.dataset.audio,
        btn: speak,
        lang: voice ? voice.slice(0, 5) : 'en-US',
        voice,
      })
    })
    row.appendChild(speak)
    phonetics.appendChild(row)
  }
  card.appendChild(phonetics)

  const meaningEl = mk('div', 'nou-sub-tb-word-meaning')
  if (payload.translation) {
    meaningEl.textContent = payload.translation
  } else if (payload.hover) {
    meaningEl.style.display = 'none'
  } else {
    meaningEl.textContent = L('查询中…', 'Looking up…')
  }
  card.appendChild(meaningEl)
  // Deliberately NO untranslated context line and no "tap elsewhere" hint:
  // a compact dictionary card reads better than a debug-style footer. The
  // example section appears only when a translated example arrives.
  card.style.display = 'block'

  // Resolve the meaning asynchronously and fill THIS card. A later tap may
  // have replaced or hidden it by the time the request returns, so re-check.
  if (!payload.translation && !payload.hover) {
    void lookupWordDetail(payload.word).then((detail) => {
      if (detail) {
        applyWordMeaning(payload.word, detail)
      } else if (card.dataset.word === payload.word && card.style.display !== 'none') {
        meaningEl.style.display = ''
        meaningEl.textContent = L('暂未获取到释义（网络受限）', 'No definition available (network restricted)')
      }
    })
  }

  // Fallback example: translate the caption sentence ourselves so the section
  // always carries a translation. Never overwrite a real dictionary example.
  if (payload.sentence && !payload.hover) {
    void translateSentence(payload.sentence).then((zh) => {
      if (!zh || card.dataset.word !== payload.word || card.style.display === 'none') return
      if (card.dataset.example === '1') return
      renderExample(card, payload.sentence, zh)
    })
  }

  // The card lives inside the shared layer, which is relative to the player
  // when inline and to the viewport when fullscreen. payload.x/y come from
  // getBoundingClientRect() (viewport coordinates), so convert them into
  // layer-local coordinates before clamping.
  const layerRect = getSubtitleLayer()?.getBoundingClientRect()
  const box = layerRect ?? getPlayer()?.getBoundingClientRect()
  const width = box?.width ?? 800
  const height = box?.height ?? 600
  const originX = layerRect?.left ?? 0
  const originY = layerRect?.top ?? 0
  const px = (payload.x ?? originX + width / 2) - originX
  const py = (payload.y ?? originY + height / 2) - originY
  // Clamp against the card's REAL rendered size, not a fixed 250/230 budget:
  // the card is up to 300px wide, so a fixed right budget pushed the far edge
  // (and the speaker buttons on its last row) off-screen for edge words.
  const cardW = card.offsetWidth || 300
  const cardH = card.offsetHeight || 230
  card.style.left = `${clamp(px - 20, 8, Math.max(8, width - cardW - 8))}px`
  card.style.top = `${clamp(py - 190, 8, Math.max(8, height - cardH - 8))}px`

  window.clearTimeout(cardTimer)
  if (payload.hover) cardTimer = window.setTimeout(hideWordCard, 2600)
}

export const installSubtitleToolbar = () => {
  load()
  const onDocClick = (event: Event) => {
    const target = event.target as HTMLElement | null
    if (target?.closest?.('.nou-sub-entry-wrap, .nou-sub-tb-wordcard')) return
    hideWordCard()
    if (menuOpen) {
      menuOpen = false
      render()
    }
    scheduleAutoHide()
  }
  document.addEventListener('click', onDocClick, true)
  // Summon the entry when the finger touches the left-edge strip. Captured so
  // it fires before any player gesture that might swallow the event.
  const onEdgePointer = (event: Event) => {
    const e = event as PointerEvent & TouchEvent
    const target = e.target as HTMLElement | null
    if (target?.closest?.('.nou-sub-entry-wrap, .nou-sub-tb-wordcard')) return
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    if (x <= EDGE_HIT_PX) revealFromEdge()
  }
  document.addEventListener('pointerdown', onEdgePointer, true)
  document.addEventListener('touchstart', onEdgePointer, true)
  // The native side queries Youdao (no WebView CORS) and pushes the result
  // here; the native ML Kit card does the same as a second source.
  window.addEventListener(MEANING_EVENT, (event: Event) => {
    const detail = (event as CustomEvent<WordMeaningDetail>).detail
    if (!detail?.word) return
    applyWordMeaning(detail.word, detail)
  })
  // RN-side Edge-TTS result. One pending speaker is resolved per id; if the
  // request already timed out the event is ignored and the fallback plays.
  window.addEventListener('nou:tts-audio', onTtsAudio)
  for (const type of ['resize', 'orientationchange', 'fullscreenchange', 'webkitfullscreenchange']) {
    window.addEventListener(type, syncEntryPosition)
  }
  try {
    log(TAG, 'installed', JSON.stringify(settings))
  } catch {
    /* logging is optional */
  }
}
