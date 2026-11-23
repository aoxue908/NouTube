/**
 * Native-side word lookup for the interactive subtitle layer.
 *
 * The WebView runs inside YouTube's CSP, so a page fetch to dict.youdao.com is
 * blocked by CORS. This runs in the React Native JS context instead (no CORS),
 * then the result is injected into the page as a `nou:word-meaning` event.
 *
 * Data source mirrors pilipala's caption_dictionary.dart: Youdao's public
 * jsonapi returns UK/US IPA, Chinese definitions, dictvoice audio URLs and a
 * bilingual example sentence in a single request, and works from mainland
 * China without a proxy.
 */

export interface WordExample {
  en: string
  zh: string
  /** Youdao dictvoice can read a WHOLE sentence, not just single words. */
  audioUrl?: string
}

export interface WordLookupDetail {
  word: string
  text?: string
  phonetic?: string
  audioUrl?: string
  /** British pronunciation, kept separate from the US one. */
  ukPhonetic?: string
  usPhonetic?: string
  ukAudioUrl?: string
  usAudioUrl?: string
  /** Dictionary example sentence WITH its Chinese translation. */
  example?: WordExample
}

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : ''

/** Youdao highlights the queried word with <b> tags inside example sentences. */
const stripTags = (value: unknown): string =>
  typeof value === 'string'
    ? value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
    : ''

export async function lookupWordNative(word: string): Promise<WordLookupDetail | null> {
  const q = encodeURIComponent(word)
  // dictvoice type=1 is British, type=2 is American (same convention as
  // pilipala's caption_dictionary.dart).
  const ukAudioUrl = `https://dict.youdao.com/dictvoice?audio=${q}&type=1`
  const usAudioUrl = `https://dict.youdao.com/dictvoice?audio=${q}&type=2`
  const audioUrl = usAudioUrl

  // 1) Youdao: UK/US IPA + Chinese definitions + bilingual example.
  try {
    const res = await fetch(`https://dict.youdao.com/jsonapi?jsonversion=2&client=mobile&q=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 13)' },
    })
    if (res.ok) {
      const data: any = await res.json()
      const ec = data?.ec?.word?.[0]
      const simple = data?.simple?.word?.[0]
      const ukPhonetic = clean(ec?.ukphone)
      const usPhonetic = clean(ec?.usphone)
      const phonetic =
        usPhonetic || ukPhonetic || clean(ec?.phonetic) || clean(simple?.phone)

      const meanings: string[] = []
      for (const group of Array.isArray(ec?.trs) ? ec.trs : []) {
        const items = group?.tr?.[0]?.l?.i
        if (Array.isArray(items)) {
          for (const item of items) {
            const value = clean(item)
            if (value) meanings.push(value)
          }
        }
      }
      // Chinese -> English module uses a different shape.
      if (!meanings.length && Array.isArray(data?.ce?.word?.[0]?.trs)) {
        for (const tr of data.ce.word[0].trs) {
          const value = clean(tr?.['#text'])
          if (value) meanings.push(value)
        }
      }
      const text = meanings.length
        ? meanings.slice(0, 6).join('；')
        : clean(data?.fanyi?.tran)

      // Bilingual example sentences. Only keep pairs that have BOTH sides:
      // an untranslated English sentence is exactly the "no practical value"
      // section the user asked to remove.
      let example: WordExample | undefined
      const pairs = data?.blng_sents_part?.['sentence-pair']
      if (Array.isArray(pairs)) {
        for (const pair of pairs) {
          const en = stripTags(pair?.sentence)
          const zh = stripTags(pair?.['sentence-translation'])
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

      if (phonetic || text || example) {
        return {
          word,
          text: text || undefined,
          phonetic: phonetic || undefined,
          audioUrl,
          ukPhonetic: ukPhonetic || undefined,
          usPhonetic: usPhonetic || undefined,
          ukAudioUrl,
          usAudioUrl,
          example,
        }
      }
    }
  } catch {
    /* fall through to translation fallback */
  }

  // 2) Google translate as a plain-meaning fallback (native fetch, no CORS).
  try {
    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${q}`,
    )
    if (res.ok) {
      const data: any = await res.json()
      const parts = Array.isArray(data?.[0])
        ? data[0].map((part: any) => clean(part?.[0])).filter(Boolean)
        : []
      const text = parts.join('').trim()
      if (text) {
        return { word, text, audioUrl, ukAudioUrl, usAudioUrl }
      }
    }
  } catch {
    /* no network */
  }
  return null
}
