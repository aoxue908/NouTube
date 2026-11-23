import { describe, expect, it } from 'bun:test'
import {
  findLineAt,
  findWordAt,
  highlightLine,
  lineFromObservedWords,
  lineFromText,
  mergeIntoSentences,
  mergeRollingCaption,
  parseJson3,
  parseJson3Wordy,
  parseCaptionedPayloadWordy,
  parseSrv3,
  parseVtt,
  speechWeightedWordTimes,
  splitWords,
  type KaraokeLine,
} from './karaoke'

describe('karaoke captions', () => {
  it('keeps whitespace attached when splitting words', () => {
    expect(splitWords('Hello  world ')).toEqual(['Hello  ', 'world '])
  })

  it('reads word-level tOffsetMs from real json3 segments', () => {
    const lines = parseJson3({
      events: [
        // leading window-definition event (no segs) is skipped
        { tStartMs: 0, dDurationMs: 60239 },
        {
          tStartMs: 1000,
          dDurationMs: 1000,
          segs: [
            { utf8: 'Hello' },
            { utf8: ' world', tOffsetMs: 400 },
          ],
        },
      ],
    })
    expect(lines).toHaveLength(1)
    expect(lines[0].words).toHaveLength(2)
    // absolute start = event start + offset
    expect(lines[0].words[0]).toEqual({ text: 'Hello', start: 1, end: 1.4 })
    expect(lines[0].words[1]).toEqual({ text: ' world', start: 1.4, end: 2 })
  })

  it('uses speech-weighted (non-uniform) timing when segments are untimed', () => {
    const lines = parseJson3({
      events: [{ tStartMs: 2000, dDurationMs: 1000, segs: [{ utf8: 'a bb' }] }],
    })
    expect(lines).toHaveLength(1)
    expect(lines[0].timed).toBe(false)
    const words = lines[0].words
    expect(words.map((w) => w.text)).toEqual(['a ', 'bb'])
    expect(words[0].start).toBeCloseTo(2, 5)
    expect(words[1].end).toBeCloseTo(3, 5)
    // The longer word must get MORE time than a plain 1/3 : 2/3 char split,
    // but it is no longer a fixed constant-rate sweep.
    expect(words[0].end - words[0].start).toBeGreaterThan(0.3)
    expect(words[0].end - words[0].start).toBeLessThan(0.55)
  })

  it('marks ASR word offsets as real timing and splits grouped segments', () => {
    const lines = parseJson3({
      events: [
        {
          tStartMs: 1000,
          dDurationMs: 1600,
          segs: [
            { utf8: 'Hello there ', tOffsetMs: 0 },
            { utf8: 'world', tOffsetMs: 900 },
          ],
        },
      ],
    })
    expect(lines[0].timed).toBe(true)
    const words = lines[0].words
    expect(words.length).toBe(3)
    expect(words.map((w) => w.text)).toEqual(['Hello ', 'there ', 'world'])
    expect(words[0].start).toBeCloseTo(1, 5)
    expect(words[words.length - 1].start).toBeCloseTo(1.9, 5)
    // Every word start must be strictly increasing and inside the line.
    for (let i = 1; i < words.length; i++) expect(words[i].start).toBeGreaterThanOrEqual(words[i - 1].start)
    expect(words[words.length - 1].end).toBeCloseTo(2.6, 5)
  })

  it('does not mistake a single whole-line tOffsetMs:0 for word timing', () => {
    const lines = parseJson3({
      events: [{ tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'one long line', tOffsetMs: 0 }] }],
    })
    expect(lines[0].timed).toBe(false)
    expect(lines[0].words.length).toBeGreaterThan(1)
  })

  it('skips line-break-only events and uses utf8String fallback', () => {
    const lines = parseJson3({
      events: [
        { tStartMs: 0, dDurationMs: 100, segs: [{ utf8: '\n' }] },
        { tStartMs: 500, dDurationMs: 500, segs: [{ utf8String: 'Hi' }] },
      ],
    })
    expect(lines).toHaveLength(1)
    expect(lines[0].words[0].text).toBe('Hi')
  })

  it('finds the line and active word at a playhead', () => {
    const lines = parseJson3({
      events: [
        {
          tStartMs: 0,
          dDurationMs: 1000,
          segs: [
            { utf8: 'one ' },
            { utf8: 'two ', tOffsetMs: 300 },
            { utf8: 'three', tOffsetMs: 600 },
          ],
        },
        { tStartMs: 2000, dDurationMs: 500, segs: [{ utf8: 'later' }] },
      ],
    })
    expect(findLineAt(lines, 0.5)?.index).toBe(0)
    expect(findLineAt(lines, 2.2)?.index).toBe(1)
    expect(findLineAt(lines, 1.5)).toBeNull()

    const line = lines[0]
    expect(findWordAt(line, 0.1)).toBe(0)
    expect(findWordAt(line, 0.45)).toBe(1)
    expect(findWordAt(line, 0.9)).toBe(2)
    expect(highlightLine(line, 0.45).map((w) => w.active)).toEqual([false, true, false])
  })

  it('keeps the last word lit inside micro-gaps', () => {
    const lines = parseJson3({
      events: [
        {
          tStartMs: 0,
          dDurationMs: 1000,
          segs: [{ utf8: 'a ' }, { utf8: 'b', tOffsetMs: 300 }],
        },
      ],
    })
    expect(findWordAt(lines[0], 1.5)).toBe(1) // beyond line, last word
  })
})

describe('karaoke fallback formats', () => {
  it('parses WebVTT cues and interpolates word timings', () => {
    const vtt = [
      'WEBVTT',
      '',
      '00:00:01.000 --> 00:00:03.000',
      'Hello world',
      '',
      '00:01:05.500 --> 00:01:07.000 align:start',
      '<c>Second</c> line',
    ].join('\n')
    const lines = parseVtt(vtt)
    expect(lines).toHaveLength(2)
    expect(lines[0].start).toBeCloseTo(1, 5)
    expect(lines[0].end).toBeCloseTo(3, 5)
    expect(lines[0].words.map((w) => w.text)).toEqual(['Hello ', 'world'])
    expect(lines[1].start).toBeCloseTo(65.5, 5)
    expect(lines[1].words.map((w) => w.text).join('')).toBe('Second line')
    expect(findWordAt(lines[0], 2.5)).toBe(1)
  })

  it('parses srv3 XML and keeps nested word offsets', () => {
    const xml =
      '<timedtext><body><p t="1000" d="1000">Hello <s t="400">world</s></p>' +
      '<p t="3000" d="800">plain text</p></body></timedtext>'
    const lines = parseSrv3(xml)
    expect(lines).toHaveLength(2)
    expect(lines[0].start).toBeCloseTo(1, 5)
    expect(lines[0].words).toHaveLength(2)
    expect(lines[0].words[1]).toEqual({ text: 'world', start: 1.4, end: 2 })
    expect(lines[0].words[0].end).toBeCloseTo(1.4, 5)
    expect(lines[1].words.map((w) => w.text)).toEqual(['plain ', 'text'])
  })

  it('builds a single line from plain DOM caption text', () => {
    const line = lineFromText('  Hello   world  ', 5, 7)
    expect(line).not.toBeNull()
    expect(line!.words.map((w) => w.text)).toEqual(['Hello ', 'world'])
    expect(line!.start).toBe(5)
    expect(line!.end).toBe(7)
    expect(findWordAt(line!, 6.5)).toBe(1)
    expect(lineFromText('   ', 1, 2)).toBeNull()
  })

  it('keeps word starts from DOM observation as real pronunciation times', () => {
    const line = lineFromObservedWords(
      [
        { text: 'Hello ', start: 1 },
        { text: 'there ', start: 1.42 },
        { text: 'world', start: 1.95 },
      ],
      2.1,
    )
    expect(line).not.toBeNull()
    expect(line!.timed).toBe(true)
    expect(line!.words.map((w) => w.start)).toEqual([1, 1.42, 1.95])
    expect(line!.words[0].end).toBeCloseTo(1.42, 5)
    expect(line!.words[1].end).toBeCloseTo(1.95, 5)
    expect(findWordAt(line!, 1.5)).toBe(1)
  })

  it('falls back to weighted interpolation when a whole line appears at once', () => {
    const line = lineFromObservedWords(
      [
        { text: 'Hello ', start: 3 },
        { text: 'world', start: 3 },
      ],
      3.2,
      0,
      1.5,
    )
    expect(line!.timed).toBe(false)
    expect(line!.words[0].start).toBeCloseTo(3, 5)
    expect(line!.words[1].end).toBeCloseTo(4.5, 5)
  })

  it('gives longer words more time than a constant-rate sweep', () => {
    const words = speechWeightedWordTimes('a extraordinary', 0, 2)
    expect(words.map((w) => w.text)).toEqual(['a ', 'extraordinary'])
    const first = words[0].end - words[0].start
    const second = words[1].end - words[1].start
    expect(second).toBeGreaterThan(first * 3)
    expect(words[1].end).toBeCloseTo(2, 5)
  })

  it('returns empty arrays for unusable payloads', () => {
    expect(parseVtt('')).toEqual([])
    expect(parseVtt('WEBVTT\n\nno cues here')).toEqual([])
    expect(parseSrv3('')).toEqual([])
    expect(parseJson3({})).toEqual([])
  })

  it('merges short cues into one whole sentence, keeping per-word timings', () => {
    const cues: KaraokeLine[] = [
      { index: 0, start: 0, end: 1, words: [
        { text: 'I ', start: 0, end: 0.5 },
        { text: 'used ', start: 0.5, end: 1 },
      ] },
      { index: 1, start: 1, end: 2, words: [
        { text: 'to ', start: 1, end: 1.5 },
        { text: 'eat.', start: 1.5, end: 2 },
      ] },
      { index: 2, start: 2.2, end: 3, words: [
        { text: 'It ', start: 2.2, end: 2.6 },
        { text: 'was ', start: 2.6, end: 2.8 },
        { text: 'good.', start: 2.8, end: 3 },
      ] },
    ]
    const sentences = mergeIntoSentences(cues, { mode: 'sentence' })
    expect(sentences).toHaveLength(2)
    expect(sentences[0].words.map((w) => w.text).join('')).toBe('I used to eat.')
    expect(sentences[1].words.map((w) => w.text).join('')).toBe('It was good.')
    // real word times survive the merge, so the karaoke sweep stays aligned
    expect(sentences[0].words[2].start).toBe(1)
    expect(sentences[0].start).toBe(0)
    expect(sentences[0].end).toBe(2)
    expect(findLineAt(sentences, 1.5)).toBe(sentences[0])
  })

  it('splits punctuation-free ASR cues only on a really long pause', () => {
    const cues: KaraokeLine[] = [
      { index: 0, start: 0, end: 1, words: [{ text: 'hello ', start: 0, end: 1 }] },
      { index: 1, start: 7, end: 8, words: [{ text: 'world ', start: 7, end: 8 }] },
    ]
    // Both fragments are unpunctuated, so a 6s pause is not enough to end a
    // block mid-thought; they are stitched until a real sentence mark appears.
    expect(mergeIntoSentences(cues)).toHaveLength(1)
    // An already long unpunctuated run may still break after a long silence.
    const long = [
      { index: 0, start: 0, end: 21, words: Array.from({ length: 31 }, (_, i) => ({
        text: 'word ', start: i * 0.6, end: i * 0.6 + 0.5,
      })) },
      { index: 1, start: 28, end: 29, words: [{ text: 'end ', start: 28, end: 29 }] },
    ]
    expect(mergeIntoSentences(long)).toHaveLength(2)
  })

  it('never ends a block mid-sentence after a short pause (screenshot regression)', () => {
    const cues: KaraokeLine[] = [
      { index: 0, start: 0, end: 10, words: [
        { text: 'crack ', start: 0, end: 0.3 },
        { text: 'and ', start: 0.3, end: 0.5 },
        { text: 'fall ', start: 0.5, end: 0.8 },
        { text: 'off! ', start: 0.8, end: 1.1 },
        { text: 'I ', start: 1.1, end: 1.2 },
        { text: 'know ', start: 1.2, end: 1.5 },
        { text: "couldn't ", start: 1.5, end: 1.9 },
        { text: 'live ', start: 1.9, end: 2.2 },
        { text: 'in ', start: 2.2, end: 2.4 },
        { text: 'a ', start: 2.4, end: 2.5 },
        { text: 'place ', start: 2.5, end: 2.9 },
        { text: 'like ', start: 2.9, end: 3.1 },
        { text: 'this ', start: 3.1, end: 3.4 },
        { text: 'for ', start: 3.4, end: 3.6 },
        { text: 'sure. ', start: 3.6, end: 4 },
        { text: 'We ', start: 4, end: 4.2 },
        { text: 'also ', start: 4.2, end: 4.5 },
        { text: 'went ', start: 4.5, end: 4.8 },
        { text: 'to ', start: 4.8, end: 5 },
        { text: 'the ', start: 5, end: 5.3 },
      ] },
      { index: 1, start: 7.8, end: 8.4, words: [{ text: 'store. ', start: 7.8, end: 8.4 }] },
    ]
    for (const mode of ['group', 'sentence'] as const) {
      const blocks = mergeIntoSentences(cues, { mode })
      const texts = blocks.map((b) => b.words.map((w) => w.text).join('').trim())
      // The old code emitted a block ending in "... went to the"; the next
      // block then started with "store.", i.e. a sentence cut in half.
      expect(texts.some((t) => t.endsWith('the'))).toBe(false)
      expect(texts.some((t) => t.includes('We also went to the store.'))).toBe(true)
    }
  })

  it('cuts at a sentence end in the MIDDLE of a cue instead of gluing sentences', () => {
    // Real YouTube shape: one cue contains "brunch." followed by the start of
    // the NEXT sentence. Checking only a cue's last word used to produce
    // "So I describe ... brunch. So a brunch is a" on screen.
    const cues: KaraokeLine[] = [
      { index: 0, start: 0, end: 1, words: [
        { text: 'So I describe ', start: 0, end: 0.5 },
        { text: 'brunch. ', start: 0.5, end: 0.7 },
        { text: 'So a ', start: 0.7, end: 1 },
      ] },
      { index: 1, start: 1, end: 2, words: [
        { text: 'brunch is a ', start: 1, end: 1.5 },
        { text: 'mixture. ', start: 1.5, end: 2 },
      ] },
    ]
    const sentences = mergeIntoSentences(cues, { mode: 'sentence' })
    expect(sentences).toHaveLength(2)
    expect(sentences[0].words.map((w) => w.text).join('').trim()).toBe('So I describe brunch.')
    expect(sentences[1].words.map((w) => w.text).join('').trim()).toBe('So a brunch is a mixture.')
    // Real word times survive the re-grouping, so the sweep stays aligned.
    expect(sentences[0].start).toBe(0)
    expect(sentences[0].end).toBe(0.7)
    expect(sentences[1].start).toBe(0.7)
    expect(sentences[1].words[0].start).toBe(0.7)
    expect(findLineAt(sentences, 0.2)).toBe(sentences[0])
    expect(findLineAt(sentences, 1.2)).toBe(sentences[1])
  })

  it('deduplicates YouTube rolling caption windows into one growing sentence', () => {
    // YouTube DOM captions are sliding windows: the next cue repeats the tail
    // of the previous one. Concatenating raw cues is exactly what produced
    // "crack and fall off!" on one frame and a half clause on the next.
    const windows = [
      'crack and fall off! I know I couldn\'t live in a place',
      'live in a place like this for sure. We also went to the',
      'We also went to the corner store and back.',
    ]
    let text = ''
    for (const w of windows) text = mergeRollingCaption(text, w).text
    expect(text).toBe(
      "crack and fall off! I know I couldn't live in a place like this for sure. We also went to the corner store and back.",
    )
    // A cue entirely inside what we already have adds nothing.
    expect(mergeRollingCaption(text, 'like this for sure.').added).toBe('')
  })

  it('does not split on short abbreviations like "Mr."', () => {
    const cues: KaraokeLine[] = [
      { index: 0, start: 0, end: 2, words: [
        { text: 'Mr. ', start: 0, end: 0.4 },
        { text: 'Smith ', start: 0.4, end: 1.2 },
        { text: 'came. ', start: 1.2, end: 2 },
      ] },
    ]
    const sentences = mergeIntoSentences(cues, { mode: 'sentence' })
    expect(sentences).toHaveLength(1)
    expect(sentences[0].words.map((w) => w.text).join('').trim()).toBe('Mr. Smith came.')
  })

  it('default group mode keeps consecutive sentences as ONE unbroken sense group', () => {
    // The reference browser extension shows one whole line (often 15s+) and
    // never splits it. A run of short sentences with only a short breath
    // between them must therefore stay on screen together, not swap per stop.
    const cues: KaraokeLine[] = [
      { index: 0, start: 0, end: 1, words: [
        { text: 'So I describe ', start: 0, end: 0.4 },
        { text: 'brunch. ', start: 0.4, end: 0.7 },
        { text: 'So a ', start: 0.7, end: 1 },
      ] },
      { index: 1, start: 1, end: 2, words: [
        { text: 'brunch is a ', start: 1, end: 1.5 },
        { text: 'mixture. ', start: 1.5, end: 2 },
      ] },
    ]
    const groups = mergeIntoSentences(cues)
    expect(groups).toHaveLength(1)
    expect(groups[0].words.map((w) => w.text).join('').trim()).toBe(
      'So I describe brunch. So a brunch is a mixture.',
    )
    // Both boundaries are sentence ends -> nothing is half-shown at either end.
    expect(mergeIntoSentences(cues, { mode: 'sentence' })).toHaveLength(2)
  })

  it('group mode replaces the whole block only after a real speaker pause', () => {
    const cues: KaraokeLine[] = [
      { index: 0, start: 0, end: 1, words: [{ text: 'First one. ', start: 0, end: 1 }] },
      { index: 1, start: 4, end: 5, words: [{ text: 'Second one. ', start: 4, end: 5 }] },
    ]
    expect(mergeIntoSentences(cues)).toHaveLength(2)
    expect(mergeIntoSentences(cues, { groupGap: 5 })).toHaveLength(1)
  })
})

describe('Wordy whole-sentence cues', () => {
  const textOf = (line: KaraokeLine) => line.words.map((word) => word.text).join('').trim()

  it('cuts at punctuation, never in the middle of a spoken sentence', () => {
    const payload = {
      events: [
        { tStartMs: 0, dDurationMs: 800, segs: [
          { utf8: 'crack ', tOffsetMs: 0 }, { utf8: 'and ', tOffsetMs: 200 },
          { utf8: 'fall ', tOffsetMs: 400 }, { utf8: 'off! ', tOffsetMs: 600 },
        ] },
        { tStartMs: 800, dDurationMs: 1700, segs: [
          { utf8: 'I ', tOffsetMs: 0 }, { utf8: 'know ', tOffsetMs: 200 },
          { utf8: "couldn't ", tOffsetMs: 400 }, { utf8: 'live ', tOffsetMs: 600 },
          { utf8: 'in ', tOffsetMs: 800 }, { utf8: 'a ', tOffsetMs: 1000 },
          { utf8: 'place ', tOffsetMs: 1200 },
        ] },
        { tStartMs: 2500, dDurationMs: 1000, segs: [
          { utf8: 'like ', tOffsetMs: 0 }, { utf8: 'this ', tOffsetMs: 200 },
          { utf8: 'for ', tOffsetMs: 400 }, { utf8: 'sure. ', tOffsetMs: 600 },
        ] },
        { tStartMs: 3500, dDurationMs: 1700, segs: [
          { utf8: 'We ', tOffsetMs: 0 }, { utf8: 'also ', tOffsetMs: 200 },
          { utf8: 'went ', tOffsetMs: 400 }, { utf8: 'to ', tOffsetMs: 600 },
          { utf8: 'the ', tOffsetMs: 800 }, { utf8: 'corner ', tOffsetMs: 1000 },
          { utf8: 'store ', tOffsetMs: 1200 }, { utf8: 'and ', tOffsetMs: 1400 },
          { utf8: 'back. ', tOffsetMs: 1500 },
        ] },
      ],
    }
    const lines = parseJson3Wordy(payload)
    expect(lines.map(textOf)).toEqual([
      'crack and fall off!',
      "I know couldn't live in a place like this for sure.",
      'We also went to the corner store and back.',
    ])
    expect(lines.every((line) => line.timed)).toBe(true)
    expect(lines[0].end).toBeLessThan(lines[1].start + 0.2)
  })

  it('keeps the last two segments of a punctuation-free cue for the next block', () => {
    const payload = {
      events: [
        { tStartMs: 0, dDurationMs: 1000, segs: [
          { utf8: '今天 ', tOffsetMs: 0 }, { utf8: '我们 ', tOffsetMs: 200 },
          { utf8: '去了 ', tOffsetMs: 400 }, { utf8: '公园 ', tOffsetMs: 600 },
        ] },
        { tStartMs: 1000, dDurationMs: 1000, segs: [
          { utf8: '然后 ', tOffsetMs: 0 }, { utf8: '吃 ', tOffsetMs: 200 },
          { utf8: '了 ', tOffsetMs: 400 }, { utf8: '饭 ', tOffsetMs: 600 },
        ] },
      ],
    }
    const lines = parseJson3Wordy(payload)
    expect(lines).toHaveLength(3)
    expect(textOf(lines[0])).toBe('今天 我们 去了')
    expect(textOf(lines[1])).toBe('公园 然后 吃 了')
  })

  it('splits over-long unpunctuated blocks at conjunctions', () => {
    const words = 'I went to the store and then to the park and then we had lunch and then went home and then we took a taxi back'.split(' ')
    const payload = {
      events: [{ tStartMs: 0, dDurationMs: 24000, segs: words.map((word, i) => ({
        utf8: `${word} `, tOffsetMs: i * 800,
      })) }],
    }
    const lines = parseJson3Wordy(payload)
    expect(lines.length).toBeGreaterThan(1)
    expect(lines.every((line) => !/^and /u.test(textOf(line)) || line.index > 0)).toBe(true)
    expect(lines.map(textOf).join(' ').replace(/\s+/gu, ' ').trim()).toContain('store and then')
  })

  it('parses captured XML timedtext payloads', () => {
    const xml =
      '<transcript><text start="1" dur="2">Hello <s t="1.4">world</s>.</text>' +
      '<text start="4" dur="2">Second sentence.</text></transcript>'
    const lines = parseCaptionedPayloadWordy(xml)
    expect(lines).toHaveLength(2)
    expect(textOf(lines[0]).replace(/\s+/gu, ' ')).toBe('Hello world.')
    expect(textOf(lines[1])).toBe('Second sentence.')
  })
})
