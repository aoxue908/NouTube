/**
 * Offline multilingual ruby readings. These cover the screenshot regression
 * where a Traditional-Chinese / Cantonese caption had NO annotation at all
 * because the layer only knew an English IPA table.
 */
import { describe, expect, it } from 'bun:test'
import {
  PHONETIC_LANGUAGES,
  annotateText,
  readingForWord,
  resolvePhonetic,
  transliterateWord,
  voiceForLanguage,
} from './multilingual-phonetics'

const readings = (mode: string, text: string): string[] => {
  const segs = annotateText(text, { mode })
  return segs ? segs.flatMap((s) => (s.rt ? [s.rt] : [])) : []
}

describe('multilingual offline phonetics', () => {
  it('offers 40+ reading systems in grouped dropdown', () => {
    expect(PHONETIC_LANGUAGES.length).toBeGreaterThanOrEqual(40)
    expect(PHONETIC_LANGUAGES[0].id).toBe('auto')
    expect(PHONETIC_LANGUAGES[0].group).toBe('auto')
    const groups = new Set(PHONETIC_LANGUAGES.map((o) => o.group))
    expect([...groups].sort()).toEqual(['auto', 'latin', 'precise', 'script'])
    // Languages the user explicitly named.
    for (const id of ['zh', 'yue', 'ja', 'ja-romaji', 'ko', 'en', 'fr', 'es', 'pt', 'ru', 'vi', 'th']) {
      expect(PHONETIC_LANGUAGES.some((o) => o.id === id)).toBe(true)
    }
  })

  it('gives PINYIN to Traditional Chinese captions (the screenshot case)', () => {
    const r = readings('zh', '母后過慮了，現在四方平定')
    expect(r).toContain('hòu')
    expect(r).toContain('guò')
    expect(r).toContain('xiàn')
    expect(r).toContain('píng')
  })

  it('gives JYUTPING to Cantonese captions', () => {
    const r = readings('yue', '唔該晒你')
    expect(r.join(' ')).toContain('m4')
    expect(r.join(' ')).toContain('goi1')
  })

  it('gives kana and Hepburn romaji to Japanese', () => {
    expect(readings('ja', '今日は良い天気です')).toContain('きょう')
    expect(readings('ja-romaji', 'こんにちは')).toContain('konnichiwa')
  })

  it('annotates Japanese compounds as whole words, not per kanji', () => {
    // 綺麗 reads きれい as a compound; the single-kanji fallback うるわ is wrong.
    expect(readings('ja', 'すごい綺麗だ')).toContain('きれい')
    expect(readings('ja', '綺麗')).toEqual(['きれい'])
    expect(readings('ja', '大人と子供')).toEqual(['おとな', 'こども'])
  })

  it('gives Revised Romanization to every Hangul syllable', () => {
    const r = readings('ko', '안녕하세요')
    expect(r).toEqual(['an', 'nyeong', 'ha', 'se', 'yo'])
  })

  it('keeps the original English IPA behaviour', () => {
    expect(readings('en', 'morning')).toContain('ˈmɔːrnɪŋ')
  })

  it('uses inherent vowels for Brahmic scripts', () => {
    expect(readings('hi', 'नमस्ते')).toContain('namasteː')
    expect(readings('bn', 'নমস্কার')).toContain('namaskara')
  })

  it('syllabifies languages whose spelling is already phonetic', () => {
    expect(readings('id', 'selamat')).toContain('se.la.mat')
    expect(readings('sw', 'habari')).toContain('ha.ba.ri')
  })

  it('never draws a ruby that just repeats the word (case-insensitive)', () => {
    // An earlier build compared "Tag" with "tag" and produced rt="Tag".
    expect(transliterateWord('Tag', 'de')).not.toBe('Tag')
    expect(readings('es', 'mundo')).not.toContain('mundo')
  })

  it.each([
    ['fr', 'bonjour'], ['es', 'hola'], ['pt', 'obrigado'], ['de', 'guten'],
    ['it', 'buongiorno'], ['nl', 'hallo'], ['vi', 'xin'], ['tr', 'merhaba'],
    ['ru', 'привет'], ['th', 'สวัสดี'], ['ar', 'مرحبا'], ['el', 'Γειά'],
    ['he', 'שלום'], ['fa', 'سلام'], ['ur', 'سلام'], ['uk', 'Привіт'],
    ['bg', 'здравей'], ['sr', 'здраво'], ['pl', 'cześć'], ['cs', 'ahoj'],
    ['sv', 'hej'], ['da', 'hej'], ['no', 'jeg'], ['fi', 'kyllä'],
    ['ro', 'bună'], ['hu', 'szia'], ['tl', 'kamusta'], ['is', 'halló'],
    ['lo', 'ສະບາຍ'], ['km', 'ជំរាបសួរ'], ['or', 'ନମସ୍କାର'],
  ])('produces a reading for %s', (mode, text) => {
    expect(readings(mode, text).length).toBeGreaterThan(0)
  })

  it('auto-detect uses script evidence and the caption-track hint', () => {
    expect(resolvePhonetic('こんにちは', 'en', 'auto').lang).toBe('ja')
    expect(resolvePhonetic('안녕', 'en', 'auto').lang).toBe('ko')
    expect(resolvePhonetic('привет', undefined, 'auto').lang).toBe('ru')
    expect(resolvePhonetic('สวัสดี', undefined, 'auto').lang).toBe('th')
    expect(resolvePhonetic('नमस्ते', undefined, 'auto').lang).toBe('hi')
    expect(resolvePhonetic('母后過慮了', 'zh-HK', 'auto').lang).toBe('yue')
    expect(resolvePhonetic('母后過慮了', 'zh-TW', 'auto').lang).toBe('zh')
    expect(resolvePhonetic('bonjour', 'fr', 'auto').lang).toBe('fr')
    expect(resolvePhonetic('bonjour', undefined, 'auto').lang).toBe('en')
  })

  it('maps a non-English word to its OWN neural voice', () => {
    expect(voiceForLanguage('yue')).toBe('zh-HK-HiuMaanNeural')
    expect(voiceForLanguage('ja')).toBe('ja-JP-NanamiNeural')
    expect(voiceForLanguage('ko')).toBe('ko-KR-SunHiNeural')
    expect(voiceForLanguage('th')).toBe('th-TH-PremwadeeNeural')
    expect(voiceForLanguage('fr')).toBe('fr-FR-DeniseNeural')
  })

  it('readingForWord returns a flat string for the lookup card', () => {
    expect(readingForWord('母后過慮了', { mode: 'zh' })).toContain('hòu')
    expect(readingForWord('', { mode: 'zh' })).toBe('')
  })
})
