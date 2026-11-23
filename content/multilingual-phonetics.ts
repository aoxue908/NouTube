/**
 * Multilingual ruby annotations for the interactive subtitle layer.
 *
 * The old layer only knew English: getOfflineIpa() looked up a 541-word table
 * and every other language fell through to plain text. This module adds
 * script-aware, fully OFFLINE readings for the languages people actually watch:
 *
 *   Mandarin ........................ pinyin with tones (character table)
 *   Cantonese ....................... Jyutping (phrase table, then characters)
 *   Japanese ........................ furigana (kana) or romaji (vocab + kanji)
 *   Korean .......................... Revised Romanization (pure Unicode maths)
 *   English ......................... IPA (the existing table / lookup cache)
 *   French, Spanish, Portuguese,
 *   German, Dutch, Vietnamese,
 *   Swedish, Norwegian, Finnish,
 *   Romanian, Persian, Arabic ....... word-level IPA from ipa-dict
 *   Russian, Ukrainian, Thai,
 *   Greek, Hebrew, Hindi, Bengali,
 *   Turkish, Polish, Italian ... etc. spelling/script transliteration rules
 *
 * Data is embedded (see phonetics-data.ts / ipa-dict-data.ts /
 * translit-rules.ts). NOTHING here makes a network request, so a whole caption
 * line can be annotated synchronously inside the animation frame.
 *
 * Sources (all offline, permissive licences):
 *   - pilipala caption_offline_phonetics.dart (project-local reference app)
 *   - open-dict-data/ipa-dict, ISC licence
 *   - spelling rules written for this project (approximations, clearly marked)
 */
import {
  CANTONESE_CHARS,
  CANTONESE_PHRASES,
  JAPANESE_COMMON_VOCAB,
  JAPANESE_KANJI_TO_KANA,
  KANA_TO_ROMAJI,
  KOREAN_CHO,
  KOREAN_JONG,
  KOREAN_JUNG,
  MANDARIN_CHARS,
  ENGLISH_IPA_FULL,
} from './phonetics-data'
import { T2S } from './t2s-data'
import { IPA_DICT_PACKED } from './ipa-dict-data'
import { TRANSLIT_ALIASES, TRANSLIT_RULES, type TranslitRule } from './translit-rules'

export type PhoneticGroup = 'auto' | 'precise' | 'latin' | 'script'

export interface PhoneticLanguage {
  id: string
  zh: string
  en: string
  group: PhoneticGroup
}

/** One entry in the settings dropdown. Grouped so a long list stays scannable. */
export const PHONETIC_LANGUAGES: PhoneticLanguage[] = [
  { id: 'auto', zh: '自动（跟随字幕语言）', en: 'Auto (follow captions)', group: 'auto' },
  // Dictionary / algorithmic grade readings.
  { id: 'zh', zh: '普通话拼音', en: 'Mandarin pinyin', group: 'precise' },
  { id: 'yue', zh: '粤拼 Jyutping', en: 'Cantonese Jyutping', group: 'precise' },
  { id: 'ja', zh: '日语假名', en: 'Japanese kana', group: 'precise' },
  { id: 'ja-romaji', zh: '日语罗马音', en: 'Japanese romaji', group: 'precise' },
  { id: 'ko', zh: '韩语罗马字', en: 'Korean romaja', group: 'precise' },
  { id: 'en', zh: '英语 IPA', en: 'English IPA', group: 'precise' },
  // Latin-script languages (word IPA dictionary + spelling fallback).
  { id: 'fr', zh: '法语', en: 'French', group: 'latin' },
  { id: 'es', zh: '西班牙语', en: 'Spanish', group: 'latin' },
  { id: 'pt', zh: '葡萄牙语', en: 'Portuguese', group: 'latin' },
  { id: 'de', zh: '德语', en: 'German', group: 'latin' },
  { id: 'it', zh: '意大利语', en: 'Italian', group: 'latin' },
  { id: 'nl', zh: '荷兰语', en: 'Dutch', group: 'latin' },
  { id: 'vi', zh: '越南语', en: 'Vietnamese', group: 'latin' },
  { id: 'tr', zh: '土耳其语', en: 'Turkish', group: 'latin' },
  { id: 'id', zh: '印尼语', en: 'Indonesian', group: 'latin' },
  { id: 'ms', zh: '马来语', en: 'Malay', group: 'latin' },
  { id: 'pl', zh: '波兰语', en: 'Polish', group: 'latin' },
  { id: 'cs', zh: '捷克语', en: 'Czech', group: 'latin' },
  { id: 'sv', zh: '瑞典语', en: 'Swedish', group: 'latin' },
  { id: 'da', zh: '丹麦语', en: 'Danish', group: 'latin' },
  { id: 'no', zh: '挪威语', en: 'Norwegian', group: 'latin' },
  { id: 'fi', zh: '芬兰语', en: 'Finnish', group: 'latin' },
  { id: 'ro', zh: '罗马尼亚语', en: 'Romanian', group: 'latin' },
  { id: 'hu', zh: '匈牙利语', en: 'Hungarian', group: 'latin' },
  { id: 'tl', zh: '菲律宾语', en: 'Filipino', group: 'latin' },
  { id: 'sw', zh: '斯瓦希里语', en: 'Swahili', group: 'latin' },
  { id: 'is', zh: '冰岛语', en: 'Icelandic', group: 'latin' },
  // Non-Latin scripts.
  { id: 'ru', zh: '俄语', en: 'Russian', group: 'script' },
  { id: 'uk', zh: '乌克兰语', en: 'Ukrainian', group: 'script' },
  { id: 'bg', zh: '保加利亚语', en: 'Bulgarian', group: 'script' },
  { id: 'sr', zh: '塞尔维亚语', en: 'Serbian', group: 'script' },
  { id: 'el', zh: '希腊语', en: 'Greek', group: 'script' },
  { id: 'he', zh: '希伯来语', en: 'Hebrew', group: 'script' },
  { id: 'ar', zh: '阿拉伯语', en: 'Arabic', group: 'script' },
  { id: 'fa', zh: '波斯语', en: 'Persian', group: 'script' },
  { id: 'ur', zh: '乌尔都语', en: 'Urdu', group: 'script' },
  { id: 'hi', zh: '印地语', en: 'Hindi', group: 'script' },
  { id: 'mr', zh: '马拉地语', en: 'Marathi', group: 'script' },
  { id: 'ne', zh: '尼泊尔语', en: 'Nepali', group: 'script' },
  { id: 'bn', zh: '孟加拉语', en: 'Bengali', group: 'script' },
  { id: 'th', zh: '泰语', en: 'Thai', group: 'script' },
  { id: 'lo', zh: '老挝语', en: 'Lao', group: 'script' },
  { id: 'km', zh: '高棉语', en: 'Khmer', group: 'script' },
  { id: 'or', zh: '奥里亚语', en: 'Odia', group: 'script' },
]

/** Neural voices whose ids are confirmed to exist on the Edge-TTS endpoint.
 *  Anything not listed falls back to Youdao/system TTS instead of risking a
 *  voice name the endpoint rejects (which would just burn a 7.5s timeout). */
const VOICES: Record<string, string> = {
  zh: 'zh-CN-XiaoxiaoNeural',
  yue: 'zh-HK-HiuMaanNeural',
  ja: 'ja-JP-NanamiNeural',
  ko: 'ko-KR-SunHiNeural',
  en: 'en-US-AriaNeural',
  fr: 'fr-FR-DeniseNeural',
  es: 'es-ES-ElviraNeural',
  pt: 'pt-BR-FranciscaNeural',
  de: 'de-DE-KatjaNeural',
  it: 'it-IT-ElsaNeural',
  nl: 'nl-NL-ColetteNeural',
  vi: 'vi-VN-HoaiMyNeural',
  tr: 'tr-TR-EmelNeural',
  id: 'id-ID-GadisNeural',
  ms: 'ms-MY-YasminNeural',
  pl: 'pl-PL-ZofiaNeural',
  cs: 'cs-CZ-VlastaNeural',
  sv: 'sv-SE-SofieNeural',
  da: 'da-DK-ChristelNeural',
  no: 'nb-NO-PernilleNeural',
  fi: 'fi-FI-NooraNeural',
  ro: 'ro-RO-AlinaNeural',
  hu: 'hu-HU-NoemiNeural',
  tl: 'fil-PH-RosaNeural',
  sw: 'sw-KE-ZuriNeural',
  ru: 'ru-RU-SvetlanaNeural',
  uk: 'uk-UA-PolinaNeural',
  bg: 'bg-BG-KalinaNeural',
  sr: 'sr-RS-SophieNeural',
  el: 'el-GR-AthinaNeural',
  he: 'he-IL-HilaNeural',
  ar: 'ar-SA-ZariyahNeural',
  fa: 'fa-IR-DilaraNeural',
  ur: 'ur-PK-UzmaNeural',
  hi: 'hi-IN-SwaraNeural',
  mr: 'hi-IN-SwaraNeural',
  ne: 'hi-IN-SwaraNeural',
  bn: 'bn-BD-NabanitaNeural',
  th: 'th-TH-PremwadeeNeural',
}

export const voiceForLanguage = (lang: string): string | undefined => {
  if (lang === 'ja-romaji') return VOICES.ja
  return VOICES[lang]
}

/* ----------------------------------------------------------- script detection --- */

const KANA_RE = /[\u3040-\u30ff\u31f0-\u31ff]/u
const HANGUL_RE = /[\uac00-\ud7af\u1100-\u11ff]/u
const HAN_RE = /[\u3400-\u9fff\uf900-\ufaff]/u
const CJK_RE = /[\u3000-\u303f\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/u
const CYRILLIC_RE = /[\u0400-\u04ff]/u
const GREEK_RE = /[\u0370-\u03ff]/u
const ARABIC_RE = /[\u0600-\u06ff\u0750-\u077f]/u
const HEBREW_RE = /[\u0590-\u05ff]/u
const DEVANAGARI_RE = /[\u0900-\u097f]/u
const BENGALI_RE = /[\u0980-\u09ff]/u
const THAI_RE = /[\u0e00-\u0e7f]/u
const LAO_RE = /[\u0e80-\u0eff]/u
const KHMER_RE = /[\u1780-\u17ff]/u
const ORIYA_RE = /[\u0b00-\u0b7f]/u

/** Written-Cantonese markers. A Hong Kong subtitle written in standard
 *  written Chinese ("母后過慮了...") has none of these, so auto mode picks
 *  Mandarin pinyin; the user can force 粤拼 in the dropdown. */
const CANTONESE_MARKERS = '唔喺哋咗嘅乜冇睇諗搵嘢㗎啫嘞咁係咪佢瞓返落講食玩靚靓咧呐呢嗰啱卒攰慳撩嘈噏嗌喐掟氹掹抌拗黐抦扯畀俾冧嘥埗邨鎅揸攞踎'

const isCantoneseText = (text: string): boolean => {
  for (const ch of text) if (CANTONESE_MARKERS.includes(ch)) return true
  return false
}

/** YouTube caption-track languageCode -> our language id. */
const HINT_MAP: Record<string, string> = {
  ja: 'ja', jp: 'ja', ko: 'ko', kr: 'ko',
  yue: 'yue', 'zh-hk': 'yue', 'zh-hant-hk': 'yue',
  zh: 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', 'zh-hans': 'zh', 'zh-hant': 'zh',
  en: 'en', 'en-us': 'en', 'en-gb': 'en',
  fr: 'fr', es: 'es', pt: 'pt', de: 'de', it: 'it', nl: 'nl',
  vi: 'vi', tr: 'tr', id: 'id', ms: 'ms', pl: 'pl', cs: 'cs',
  sv: 'sv', da: 'da', no: 'no', nb: 'no', fi: 'fi', ro: 'ro',
  hu: 'hu', tl: 'tl', fil: 'tl', sw: 'sw', is: 'is',
  ru: 'ru', uk: 'uk', bg: 'bg', sr: 'sr', el: 'el', he: 'he',
  ar: 'ar', fa: 'fa', ur: 'ur', hi: 'hi', mr: 'mr', ne: 'ne',
  bn: 'bn', th: 'th', lo: 'lo', km: 'km', or: 'or',
}

export interface ResolvedPhonetic {
  lang: string
  japaneseMode: 'kana' | 'romaji'
}

/** Decide which reading system to use for one caption word. */
export const resolvePhonetic = (
  text: string,
  hint: string | undefined,
  mode: string,
): ResolvedPhonetic => {
  if (mode === 'ja-romaji') return { lang: 'ja', japaneseMode: 'romaji' }
  if (mode !== 'auto') return { lang: mode, japaneseMode: 'kana' }

  // Hard evidence from the script beats a stale track hint (e.g. an English
  // labelled track that actually carries Chinese subtitles).
  if (KANA_RE.test(text)) return { lang: 'ja', japaneseMode: 'kana' }
  if (HANGUL_RE.test(text)) return { lang: 'ko', japaneseMode: 'kana' }
  if (HAN_RE.test(text)) {
    const hinted = hint ? HINT_MAP[hint.toLowerCase()] : undefined
    if (hinted === 'ja') return { lang: 'ja', japaneseMode: 'kana' }
    return { lang: isCantoneseText(text) || hinted === 'yue' ? 'yue' : 'zh', japaneseMode: 'kana' }
  }
  if (DEVANAGARI_RE.test(text)) return { lang: hint?.toLowerCase() === 'mr' ? 'mr' : hint?.toLowerCase() === 'ne' ? 'ne' : 'hi', japaneseMode: 'kana' }
  if (BENGALI_RE.test(text)) return { lang: 'bn', japaneseMode: 'kana' }
  if (ORIYA_RE.test(text)) return { lang: 'or', japaneseMode: 'kana' }
  if (THAI_RE.test(text)) return { lang: 'th', japaneseMode: 'kana' }
  if (LAO_RE.test(text)) return { lang: 'lo', japaneseMode: 'kana' }
  if (KHMER_RE.test(text)) return { lang: 'km', japaneseMode: 'kana' }
  if (ARABIC_RE.test(text)) {
    const h = hint ? HINT_MAP[hint.toLowerCase()] : undefined
    return { lang: h === 'fa' || h === 'ur' ? h : 'ar', japaneseMode: 'kana' }
  }
  if (HEBREW_RE.test(text)) return { lang: 'he', japaneseMode: 'kana' }
  if (GREEK_RE.test(text)) return { lang: 'el', japaneseMode: 'kana' }
  if (CYRILLIC_RE.test(text)) {
    const h = hint ? HINT_MAP[hint.toLowerCase()] : undefined
    return { lang: h === 'uk' || h === 'bg' || h === 'sr' ? h : 'ru', japaneseMode: 'kana' }
  }

  // Latin script: only the caption-track hint can tell French from Spanish.
  const hinted = hint ? HINT_MAP[hint.toLowerCase()] : undefined
  return { lang: hinted && hinted !== 'zh' && hinted !== 'yue' && hinted !== 'ja' && hinted !== 'ko' ? hinted : 'en', japaneseMode: 'kana' }
}

/* ------------------------------------------------------------- transliteration --- */

const normHan = (ch: string): string => T2S[ch] ?? ch

/** Brahmic scripts carry an inherent /a/ on every consonant. A vowel sign
 *  REPLACES that /a/, and a virama DELETES it. Without this engine नमस्ते came
 *  out as "nmste" instead of "namaste". */
const transliterateBrahmic = (word: string, rule: TranslitRule): string => {
  const b = rule.brahmic!
  const out: string[] = []
  let pendingA = false
  const dropA = () => {
    if (pendingA && out.length && out[out.length - 1].endsWith('a')) {
      out.push(out.pop()!.slice(0, -1))
    }
    pendingA = false
  }
  for (const ch of Array.from(word)) {
    const mapped = rule.chars?.[ch]
    if (mapped === undefined) { out.push(ch); pendingA = false; continue }
    if (ch === b.virama) { dropA(); continue }
    if (b.signs.includes(ch)) { dropA(); out.push(mapped); pendingA = false; continue }
    if (b.independent.includes(ch)) { out.push(mapped); pendingA = false; continue }
    out.push(mapped + 'a')
    pendingA = true
  }
  return out.join('').trim()
}

const longestFirst = (rule: TranslitRule): Array<[string, string]> =>
  Object.entries(rule.digraphs ?? {}).sort((a, b) => b[0].length - a[0].length)

/* Parse a packed dictionary only when that language is first used. Starting
 * up for an English video should not pay for 18 languages' string splits. */
const dictCache = new Map<string, Record<string, string>>()
const dictFor = (lang: string): Record<string, string> | undefined => {
  const cached = dictCache.get(lang)
  if (cached) return cached
  const raw = IPA_DICT_PACKED[lang]
  if (!raw) return undefined
  const dict: Record<string, string> = {}
  for (const entry of raw.split('|')) {
    const at = entry.indexOf('~')
    if (at > 0) dict[entry.slice(0, at)] = entry.slice(at + 1)
  }
  dictCache.set(lang, dict)
  return dict
}

const ruleCache = new Map<string, Array<[string, string]>>()
const ruleFor = (lang: string): TranslitRule | undefined =>
  TRANSLIT_RULES[TRANSLIT_ALIASES[lang] ?? lang]

/** Spelling -> approximate reading. Longest digraph first, then single chars,
 *  then word-level post rules. Returns undefined when nothing changed, so we
 *  never draw an annotation that just repeats the word itself. */
/** Lao letters are the Thai alphabet shifted by 0x80 in Unicode. Reusing the
 *  Thai table this way covers Lao without shipping a second 60-char table. */
const laoToThai = (text: string): string =>
  Array.from(text).map((ch) => {
    const code = ch.codePointAt(0) ?? 0
    return code >= 0x0e80 && code <= 0x0eff ? String.fromCodePoint(code - 0x80) : ch
  }).join('')

export const transliterateWord = (word: string, lang: string): string | undefined => {
  const rule = ruleFor(lang)
  if (!rule) return undefined
  if (lang === 'lo') word = laoToThai(word)
  if (rule.brahmic) {
    const reading = transliterateBrahmic(word, rule)
    if (!reading || reading.toLowerCase() === word.toLowerCase()) return undefined
    return reading
  }
  let pairs = ruleCache.get(lang)
  if (!pairs) {
    pairs = longestFirst(rule)
    ruleCache.set(lang, pairs)
  }
  const chars = Array.from(word)
  const out: string[] = []
  for (let i = 0; i < chars.length;) {
    let hit: string | undefined
    for (const [from, to] of pairs) {
      const parts = Array.from(from)
      if (parts.length > chars.length - i) continue
      if (parts.every((p, k) => p === chars[i + k])) {
        hit = to
        i += parts.length
        break
      }
    }
    if (hit !== undefined) {
      if (hit) out.push(hit)
      continue
    }
    const ch = chars[i]
    if (rule.silent?.includes(ch)) { i++; continue }
    const mapped = rule.chars?.[ch]
    out.push(mapped === undefined ? ch : mapped)
    i++
  }
  let result = out.join('')
  for (const [pattern, replacement] of rule.post ?? []) {
    try { result = result.replace(new RegExp(pattern, 'gu'), replacement) } catch { /* bad pattern */ }
  }
  result = result.trim()
  if (!result || result.toLowerCase() === word.toLowerCase()) {
    if (!rule.syllabify) return undefined
    // Indonesian / Malay / Filipino / Swahili are spelled almost exactly as
    // they sound. Syllable breaks are still useful as a reading aid.
    const syllables = word.toLowerCase().replace(
      /([aeiou])(?=[bcdfghjklmnpqrstvwxyz][aeiou])/gu,
      '$1.',
    )
    return syllables === word.toLowerCase() ? undefined : syllables
  }
  return result
}

/* -------------------------------------------------------------- kana -> romaji --- */

const KATAKANA_TO_HIRAGANA = (text: string): string =>
  Array.from(text).map((ch) => {
    const code = ch.codePointAt(0) ?? 0
    return code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : ch
  }).join('')

/** Hepburn-ish romaji with the two greeting exceptions Japanese learners hit
 *  immediately (は as a particle is 'wa', not 'ha'). */
const kanaToRomaji = (text: string): string => {
  let s = KATAKANA_TO_HIRAGANA(text)
    .replaceAll('こんにちは', ' konnichiwa ')
    .replaceAll('こんばんは', ' konbanwa ')
  const chars = Array.from(s)
  const out: string[] = []
  for (let i = 0; i < chars.length;) {
    const ch = chars[i]
    if (ch === 'っ' && i + 1 < chars.length) {
      const next = KANA_TO_ROMAJI[chars[i + 1]]
      if (next) out.push(next[0])
      i++
      continue
    }
    const two = chars[i] + (chars[i + 1] ?? '')
    if (KANA_TO_ROMAJI[two]) {
      out.push(KANA_TO_ROMAJI[two])
      i += 2
      continue
    }
    if (KANA_TO_ROMAJI[ch]) out.push(KANA_TO_ROMAJI[ch])
    else if (HAN_RE.test(ch)) return ''
    else out.push(ch)
    i++
  }
  return out.join('').replace(/\s+/gu, ' ').trim()
}

// Index the vocabulary by its first character. The dictionary now holds
// ~18k compounds; scanning every entry for each cursor position would be O(n·V)
// inside the render loop. A first-char bucket keeps the longest-match scan
// limited to words that can actually start here.
const JAPANESE_VOCAB_BY_FIRST = new Map<string, Array<[string, string]>>()
for (const [word, kana] of Object.entries(JAPANESE_COMMON_VOCAB)) {
  const first = word[0]
  const bucket = JAPANESE_VOCAB_BY_FIRST.get(first) ?? []
  bucket.push([word, kana])
  JAPANESE_VOCAB_BY_FIRST.set(first, bucket)
}
for (const bucket of JAPANESE_VOCAB_BY_FIRST.values()) {
  bucket.sort((a, b) => b[0].length - a[0].length)
}

/* --------------------------------------------------------------- segmentation --- */

export interface PhoneticSegment {
  base: string
  rt?: string
}

/** Split into word runs and separator runs, preserving the exact original
 *  text (spaces, punctuation) so the caption source is never rewritten. */
const splitRuns = (text: string): Array<{ text: string; word: boolean }> => {
  const runs: Array<{ text: string; word: boolean }> = []
  const chars = Array.from(text)
  let buf = ''
  let currentWord: boolean | null = null
  const isWordChar = (ch: string) =>
    /[\p{L}\p{M}\p{N}'’\-]/u.test(ch)
  for (const ch of chars) {
    const word = isWordChar(ch)
    if (currentWord !== null && word !== currentWord) {
      runs.push({ text: buf, word: currentWord })
      buf = ''
    }
    currentWord = word
    buf += ch
  }
  if (buf) runs.push({ text: buf, word: currentWord ?? false })
  return runs
}

const pushPlain = (segs: PhoneticSegment[], text: string) => {
  const last = segs[segs.length - 1]
  if (last && !last.rt) last.base += text
  else segs.push({ base: text })
}

/** Mandarin / Cantonese: one ruby per character, with Cantonese phrases kept
 *  together so their Jyutping syllables line up with the characters. */
const chineseSegments = (text: string, lang: 'zh' | 'yue'): PhoneticSegment[] => {
  const segs: PhoneticSegment[] = []
  const chars = Array.from(text)
  let chinese = 0
  let annotated = 0
  for (let i = 0; i < chars.length;) {
    const ch = chars[i]
    if (!HAN_RE.test(ch)) {
      pushPlain(segs, ch)
      i++
      continue
    }
    chinese++
    if (lang === 'yue') {
      let matched = false
      for (let len = Math.min(4, chars.length - i); len >= 2; len--) {
        const phrase = chars.slice(i, i + len).join('')
        // Hong Kong / Taiwan tracks are Traditional Chinese while the offline
        // Jyutping phrase table is mostly Simplified. Try both spellings.
        const folded = Array.from(phrase).map(normHan).join('')
        const jyut = CANTONESE_PHRASES[phrase] ?? CANTONESE_PHRASES[folded]
        if (jyut) {
          segs.push({ base: phrase, rt: jyut })
          annotated += len
          i += len
          matched = true
          break
        }
      }
      if (matched) continue
      const jyut = CANTONESE_CHARS[ch] ?? CANTONESE_CHARS[normHan(ch)]
      if (jyut) { segs.push({ base: ch, rt: jyut }); annotated++ }
      else pushPlain(segs, ch)
    } else {
      const py = MANDARIN_CHARS[ch] ?? MANDARIN_CHARS[normHan(ch)]
      if (py) { segs.push({ base: ch, rt: py }); annotated++ }
      else pushPlain(segs, ch)
    }
    i++
  }
  // Do not sprinkle a few random readings over a line the table cannot cover.
  if (!chinese || annotated < chinese * (lang === 'yue' ? 0.4 : 0.6)) return []
  return segs
}

const japaneseSegments = (text: string, romaji: boolean): PhoneticSegment[] => {
  const segs: PhoneticSegment[] = []
  const chars = Array.from(text)
  let annotated = 0
  for (let i = 0; i < chars.length;) {
    let matched = false
    const bucket = JAPANESE_VOCAB_BY_FIRST.get(chars[i])
    if (bucket) {
      for (const [word, kana] of bucket) {
        const parts = Array.from(word)
        if (parts.length > chars.length - i) continue
        if (!parts.every((p, k) => p === chars[i + k])) continue
        const rt = romaji ? kanaToRomaji(kana) : kana
        if (rt) { segs.push({ base: word, rt }); annotated++ }
        else pushPlain(segs, word)
        i += parts.length
        matched = true
        break
      }
    }
    if (matched) continue
    const ch = chars[i]
    if (HAN_RE.test(ch)) {
      const kana = JAPANESE_KANJI_TO_KANA[ch]
      const rt = kana ? (romaji ? kanaToRomaji(kana) : kana) : undefined
      if (rt) { segs.push({ base: ch, rt }); annotated++ }
      else pushPlain(segs, ch)
    } else if (KANA_RE.test(ch) && romaji) {
      const rt = kanaToRomaji(ch)
      if (rt) { segs.push({ base: ch, rt }); annotated++ }
      else pushPlain(segs, ch)
    } else {
      pushPlain(segs, ch)
    }
    i++
  }
  return annotated ? segs : []
}

const koreanSegments = (text: string): PhoneticSegment[] => {
  const segs: PhoneticSegment[] = []
  for (const ch of Array.from(text)) {
    const code = ch.codePointAt(0) ?? 0
    if (code >= 0xac00 && code <= 0xd7a3) {
      const s = code - 0xac00
      const jong = s % 28
      const jung = ((s - jong) / 28) % 21
      const cho = Math.floor((s - jong) / 28 / 21)
      const rt = KOREAN_CHO[cho] + KOREAN_JUNG[jung] + KOREAN_JONG[jong]
      if (rt) { segs.push({ base: ch, rt }); continue }
    }
    pushPlain(segs, ch)
  }
  return segs.some((s) => s.rt) ? segs : []
}

/** Word-level dictionary IPA, with the spelling rules as a fallback. */
const wordSegments = (
  text: string,
  lang: string,
  lookupIpa: ((word: string) => string | undefined) | undefined,
): PhoneticSegment[] => {
  const segs: PhoneticSegment[] = []
  const dict = dictFor(lang)
  for (const run of splitRuns(text)) {
    if (!run.word) { pushPlain(segs, run.text); continue }
    const key = run.text.toLowerCase()
    const rt = (lang === 'en'
      ? lookupIpa?.(run.text) ?? ENGLISH_IPA_FULL[key]
      : undefined)
      ?? dict?.[key]
      ?? transliterateWord(run.text, lang)
    // Some dictionaries transcribe a word exactly as it is spelled (Spanish
    // "mundo" -> "mundo"). Drawing that as a ruby adds noise, not information.
    if (rt && rt.toLowerCase() !== key) segs.push({ base: run.text, rt })
    else pushPlain(segs, run.text)
  }
  return segs.some((s) => s.rt) ? segs : []
}

export interface AnnotateOptions {
  mode?: string
  /** languageCode from the active caption track, when known. */
  languageCode?: string
  /** Existing English IPA lookup (offline table + Youdao cache). */
  lookupIpa?: (word: string) => string | undefined
}

/**
 * Return the ruby segments for one caption word, or null when the language is
 * not covered (the caller then draws plain text). Never throws: this runs
 * inside the render loop.
 */
export const annotateText = (text: string, opts: AnnotateOptions = {}): PhoneticSegment[] | null => {
  try {
    if (!text || !text.trim()) return null
    const { lang, japaneseMode } = resolvePhonetic(text, opts.languageCode, opts.mode ?? 'auto')
    let segs: PhoneticSegment[]
    if (lang === 'zh' || lang === 'yue') segs = chineseSegments(text, lang)
    else if (lang === 'ja') segs = japaneseSegments(text, japaneseMode === 'romaji')
    else if (lang === 'ko') segs = koreanSegments(text)
    else segs = wordSegments(text, lang, opts.lookupIpa)
    return segs.length ? segs : null
  } catch {
    return null
  }
}

/** Flat reading string for the lookup card (e.g. "mǔ hòu guò lǜ le"). */
export const readingForWord = (word: string, opts: AnnotateOptions = {}): string => {
  const segs = annotateText(word, opts)
  if (!segs) return ''
  return segs.filter((s) => s.rt).map((s) => s.rt).join(' ')
}
