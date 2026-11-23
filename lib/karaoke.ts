/**
 * Pure helpers for the karaoke (word-by-word highlight) subtitle layer.
 *
 * YouTube serves captions as `json3`: a list of events (lines), each with a
 * list of segments. Auto-generated captions include per-word timing: each
 * segment's `tOffsetMs` is a millisecond offset from its event's `tStartMs`.
 * Human-uploaded captions often omit `tOffsetMs`, so we fall back to
 * distributing the line's duration across words by character count.
 *
 * Everything here is DOM-free and deterministic so it can be unit tested.
 */

export interface TimedWord {
  text: string
  /** seconds, relative to the video */
  start: number
  /** seconds, relative to the video */
  end: number
}

export interface KaraokeLine {
  index: number
  start: number
  end: number
  words: TimedWord[]
  /** True when word starts came from real timestamps, not interpolation. */
  timed?: boolean
}

/** A word observed appearing on screen at a real playhead time. */
export interface ObservedWord {
  text: string
  start: number
}

interface Json3Seg {
  /** json3 uses `utf8`; `utf8String` is accepted for robustness. */
  utf8?: string
  utf8String?: string
  /** offset from the event's tStartMs, in milliseconds */
  tOffsetMs?: number
}

interface Json3Event {
  tStartMs?: number
  dDurationMs?: number
  segs?: Json3Seg[]
}

export interface Json3Payload {
  events?: Json3Event[]
}

const segText = (seg: Json3Seg): string => seg.utf8 ?? seg.utf8String ?? ''

const isWordLike = (text: string) => text.trim().length > 0 && text.trim() !== '\n'

/**
 * Split a segment string into words while keeping the whitespace attached, so
 * re-joining the words reconstructs the original line exactly.
 */
export const splitWords = (text: string): string[] => text.match(/\S+\s*/g) ?? []

/**
 * Distribute [start, end] across words proportional to their character count.
 * Used as a fallback when the caption has no word-level offsets.
 */
export const interpolateWordTimes = (text: string, start: number, end: number): TimedWord[] => {
  const words = splitWords(text)
  if (!words.length) return []
  const weights = words.map((w) => Math.max(1, w.trim().length))
  const total = weights.reduce((a, b) => a + b, 0)
  const span = Math.max(0, end - start)
  let cursor = 0
  return words.map((word, i) => {
    const from = start + span * (cursor / total)
    cursor += weights[i]
    const to = i === words.length - 1 ? end : start + span * (cursor / total)
    return { text: word, start: from, end: to }
  })
}

/**
 * A more speech-like fallback than raw character counting: longer words and
 * words with more vowel groups get more time, punctuation adds a pause, and
 * CJK glyphs are treated as roughly one beat each. This is still an estimate,
 * but it no longer advances at a perfectly constant rate.
 */
export const speechWeightedWordTimes = (text: string, start: number, end: number): TimedWord[] => {
  const words = splitWords(text)
  if (!words.length) return []
  const weights = words.map((word) => {
    const core = word.trim()
    const chars = Math.max(1, core.length)
    const syllables = (core.toLowerCase().match(/[aeiouà-öø-ÿаеёиоуыэюяіїєãõ]+/gu) ?? []).length || 1
    const cjk = (core.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) ?? []).length
    let weight = cjk ? cjk * 1.7 + (chars - cjk) * 0.35 : chars * 0.6 + syllables * 0.9
    if (/[,;:!?，、；：！？.。]$/u.test(core)) weight *= 1.4
    if (/[.!?！？。]$/u.test(core)) weight *= 1.2
    return Math.max(0.5, weight)
  })
  const total = weights.reduce((a, b) => a + b, 0)
  const span = Math.max(0, end - start)
  let cursor = 0
  return words.map((word, i) => {
    const from = start + span * (cursor / total)
    cursor += weights[i]
    const to = i === words.length - 1 ? end : start + span * (cursor / total)
    return { text: word, start: from, end: to }
  })
}

/**
 * Build a line from words observed appearing one by one in YouTube's own
 * caption DOM. Auto-generated captions reveal words as they are spoken, so the
 * recorded playhead times ARE the pronunciation times -- no interpolation.
 *
 * When the whole line appeared at once (human-uploaded captions), fall back to
 * speech-weighted interpolation across a measured line duration.
 */
export const lineFromObservedWords = (
  observed: ObservedWord[],
  now: number,
  index = 0,
  fallbackDuration = 0,
): KaraokeLine | null => {
  if (!observed.length) return null
  const first = observed[0].start
  const hasRealTiming = observed.some((o, i) => i > 0 && o.start - first > 0.04)
  let words: TimedWord[]
  let timed = true
  if (hasRealTiming) {
    words = observed.map((o, i) => ({
      text: o.text,
      start: o.start,
      end:
        i < observed.length - 1
          ? Math.max(o.start + 0.03, observed[i + 1].start)
          : Math.max(o.start + 0.12, now + 0.12),
    }))
  } else {
    timed = false
    const text = observed.map((o) => o.text).join('')
    const duration = Math.max(0.4, Math.min(8, fallbackDuration || text.length * 0.085))
    words = speechWeightedWordTimes(text, first, first + duration)
  }
  return {
    index,
    start: words[0].start,
    end: Math.max(now, words[words.length - 1].end),
    words,
    timed,
  }
}

/**
 * Convert a json3 caption payload into karaoke lines with word timings.
 *
 * - Uses `tOffsetMs` word offsets when present (real word timestamps).
 * - Falls back to character-count interpolation when segments are untimed.
 * - Skips the leading window-definition event and pure line-break events.
 */
export const parseJson3 = (payload: Json3Payload): KaraokeLine[] => {
  const events = payload?.events
  if (!Array.isArray(events)) return []

  const lines: KaraokeLine[] = []
  let index = 0

  for (const event of events) {
    const segs = Array.isArray(event.segs) ? event.segs : []
    if (!segs.length) continue // window-definition event

    const rawText = segs.map(segText).join('')
    if (!isWordLike(rawText.replace(/\n/g, ''))) continue // line-break-only event

    const lineStartMs = event.tStartMs ?? 0
    const lineStart = lineStartMs / 1000
    const durationMs = event.dDurationMs ?? 0
    const lineEnd = durationMs > 0 ? (lineStartMs + durationMs) / 1000 : lineStart + 2

    // Real word timing: ASR (auto-generated) caption tracks split a line into
    // one segment per word, each with a `tOffsetMs` measured from the event
    // start. A single `tOffsetMs: 0` on a whole-line segment is NOT word timing
    // -- require at least two distinct offsets before trusting it.
    // End = next word's start; last word runs to the line end.
    const anyOffset = segs.some((seg) => typeof seg.tOffsetMs === 'number')
    const offsets = anyOffset ? segs.map((seg) => (typeof seg.tOffsetMs === 'number' ? seg.tOffsetMs : 0)) : []
    const hasWordTiming = offsets.length >= 2 && new Set(offsets).size >= 2
    let words: TimedWord[]
    if (hasWordTiming) {
      const timed: TimedWord[] = []
      for (let i = 0; i < segs.length; i++) {
        const text = segText(segs[i])
        if (!isWordLike(text)) continue
        timed.push({ text, start: (lineStartMs + offsets[i]) / 1000, end: lineEnd })
      }
      // Some responses group several words into one timed segment. Split those
      // across the segment's own span so the sweep still follows the audio.
      const expanded: TimedWord[] = []
      for (let i = 0; i < timed.length; i++) {
        const pieces = splitWords(timed[i].text)
        const next = i < timed.length - 1 ? timed[i + 1].start : lineEnd
        // splitWords drops leading whitespace; only expand when it is lossless.
        if (pieces.length <= 1 || pieces.join('') !== timed[i].text || next <= timed[i].start) {
          expanded.push(timed[i])
          continue
        }
        for (const w of speechWeightedWordTimes(timed[i].text, timed[i].start, next)) expanded.push(w)
      }
      for (let i = 0; i < expanded.length; i++) {
        expanded[i].end = i < expanded.length - 1 ? Math.max(expanded[i].start, expanded[i + 1].start) : lineEnd
      }
      words = expanded
    } else {
      words = speechWeightedWordTimes(rawText, lineStart, lineEnd)
    }

    if (!words.length) continue
    lines.push({
      index: index++,
      start: Math.min(lineStart, words[0].start),
      end: Math.max(lineEnd, words[words.length - 1].end),
      words,
      timed: hasWordTiming,
    })
  }

  return lines
}

/* -------------------------------------------------------------------------- */
/* Wordy-compatible whole-sentence cues                                        */
/*                                                                            */
/* The reference Chrome extension does NOT merge a global word stream. It     */
/* keeps each YouTube caption EVENT (a rolling cue) intact, accumulates the   */
/* events, and cuts a block when a punctuation mark appears or -- for          */
/* punctuation-free cues -- just before the last two segments of the newest    */
/* event. Very long blocks are cut at conjunctions. Ported verbatim from       */
/* Wordy 2.0.1 (assets/index-CxvDV2TC.js) so the on-screen blocks match it.    */
/* -------------------------------------------------------------------------- */

interface WordyWord {
  text: string
  start: number
  dur: number
}

const WORDY_SENTENCE_MARK = /[.!?。！？；;…]/u
const WORDY_CJK = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/u
const WORDY_MUSIC = /\[music\]/iu
const WORDY_CONJUNCTIONS = new Set([
  'and', 'so', 'or', 'if', 'whether', 'but', 'when', 'while', 'because', 'cause',
  'since', 'until', 'unless', 'though', 'what', 'where', 'how',
])

/** Wordy's Ht(): concatenate two caption segments with the spacing YouTube
 *  would have used. Never glue "Hello" + "world" nor put a space before a
 *  full stop. */
const wordyJoinText = (left: string, right: string): string => {
  if (!left) return right
  if (!right) return left
  if (/^\s/.test(right) || /[\s\n]$/.test(left)) return left + right
  const last = left.slice(-1)
  const first = right.charAt(0)
  if (!last || !first || /[,.!?;:%)\]}'"”’]/.test(first) || /[(\[{'"“‘/]/.test(last)) return left + right
  const latinA = /[A-Za-z0-9]/.test(last)
  const latinB = /[A-Za-z0-9]/.test(first)
  if (latinA && latinB) return `${left} ${right}`
  const cjkA = WORDY_CJK.test(last)
  const cjkB = WORDY_CJK.test(first)
  return (latinA && cjkB) || (cjkA && latinB) ? `${left} ${right}` : left + right
}

/** Wordy's Ot(): one event -> timestamped segments. Segment duration comes
 *  from the next segment offset (or the next event start for the last one). */
const wordyFlattenEvent = (event: any, next: any): WordyWord[] => {
  const segs = event?.segs
  if (!Array.isArray(segs) || !Number.isFinite(event?.tStartMs)) return []
  const start = event.tStartMs / 1000
  const nextStartMs = Number.isFinite(next?.tStartMs) ? next.tStartMs : NaN
  const duration = Number.isFinite(event.dDurationMs)
    ? Math.max(event.dDurationMs / 1000, 0.1)
    : Number.isFinite(nextStartMs)
      ? Math.max((nextStartMs - event.tStartMs) / 1000, 0.1)
      : 0.3
  const fallbackDur = Math.max(duration / Math.max(1, segs.length), 0.1)
  const result: WordyWord[] = []
  let carried = 0
  for (let i = 0; i < segs.length; i++) {
    const text = typeof segs[i]?.utf8 === 'string' ? segs[i].utf8 : typeof segs[i]?.utf8String === 'string' ? segs[i].utf8String : ''
    if (!text.trim()) continue
    const nextSeg = segs[i + 1]
    const offset = Number.isFinite(segs[i]?.tOffsetMs) ? segs[i].tOffsetMs / 1000 : carried
    const nextOffset = Number.isFinite(nextSeg?.tOffsetMs) ? nextSeg.tOffsetMs / 1000 : NaN
    let dur = Number.isFinite(nextOffset) ? nextOffset - offset : NaN
    if (!Number.isFinite(dur) && i === segs.length - 1 && Number.isFinite(segs[i]?.tOffsetMs)) {
      dur = Number.isFinite(nextStartMs) ? nextStartMs / 1000 - (start + offset) : duration - offset
    }
    if (!Number.isFinite(dur) || dur <= 0) dur = fallbackDur
    dur = Math.max(dur, 0.1)
    result.push({ text, start: start + offset, dur })
    carried = Math.max(carried, offset + dur)
  }
  return result
}

/** Wordy's Rt(): cuts in the accumulated cue. The `length - 2` rule is the
 *  reason a block never starts or ends halfway through a clause: the last two
 *  segments of a punctuation-free cue are carried into the next block. */
const wordyBoundaryIndices = (acc: WordyWord[], fresh: WordyWord[]): number[] => {
  const indices: number[] = []
  for (let i = 0; i < acc.length; i++) {
    if (WORDY_SENTENCE_MARK.test(acc[i].text) || WORDY_MUSIC.test(acc[i].text)) indices.push(i)
  }
  if (!indices.length && acc.length >= 2) {
    const freshHasCjk = fresh.some((word) => WORDY_CJK.test(word.text))
    const freshAllMultiWord = fresh.every(
      (word) => word.text.trim().split(/\s+/u).filter(Boolean).length >= 2,
    )
    if (freshHasCjk || freshAllMultiWord) indices.push(acc.length - 2)
  }
  return Array.from(new Set(indices)).sort((a, b) => a - b)
}

/** Wordy's Ft(): a block of more than 20 segments is cut at conjunctions.
 *  Tiny pieces (<3 segments) are merged forward so no orphan word is shown. */
const wordySplitAtConjunctions = (chunk: WordyWord[]): WordyWord[][] => {
  if (chunk.length <= 20) return [chunk]
  const cuts: number[] = []
  for (let i = 0; i < chunk.length; i++) {
    if (WORDY_CONJUNCTIONS.has(chunk[i].text.trim().toLowerCase())) cuts.push(i)
  }
  if (!cuts.length) return [chunk]
  const parts: WordyWord[][] = []
  let from = 0
  for (const cut of cuts) {
    if (cut <= from || cut >= chunk.length) continue
    parts.push(chunk.slice(from, cut))
    from = cut
  }
  if (from < chunk.length) parts.push(chunk.slice(from))
  const kept = parts.filter((part) => part.length > 0)
  const merged: WordyWord[][] = []
  for (let i = 0; i < kept.length; i++) {
    if (kept[i].length < 3 && i + 1 < kept.length) {
      kept[i + 1] = [...kept[i], ...kept[i + 1]]
      continue
    }
    merged.push(kept[i])
  }
  return merged.length ? merged : [chunk]
}

const wordyMakeLine = (
  chunk: WordyWord[],
  index: number,
  timed: boolean,
): KaraokeLine | null => {
  if (!chunk.length) return null
  const words: TimedWord[] = []
  let joined = ''
  for (const seg of chunk) {
    const pieces = splitWords(seg.text)
    if (!pieces.length) continue
    // splitWords() drops leading whitespace; restore it so spacing stays exact.
    const leading = seg.text.slice(0, seg.text.indexOf(pieces[0]))
    if (leading) pieces[0] = leading + pieces[0]
    const end = Math.max(seg.start + 0.1, seg.start + seg.dur)
    let timedPieces: TimedWord[]
    if (pieces.join('') !== seg.text || pieces.length === 1) {
      timedPieces = [{ text: seg.text, start: seg.start, end }]
    } else {
      const weights = pieces.map((piece) => Math.max(1, piece.trim().length))
      const total = weights.reduce((a, b) => a + b, 0)
      const span = Math.max(0.05, end - seg.start)
      let cursor = 0
      timedPieces = pieces.map((piece, i) => {
        const from = seg.start + (span * cursor) / total
        cursor += weights[i]
        return {
          text: piece,
          start: from,
          end: i === pieces.length - 1 ? end : seg.start + (span * cursor) / total,
        }
      })
    }
    for (const piece of timedPieces) {
      const text = joined ? wordyJoinText(joined, piece.text).slice(joined.length) : piece.text
      joined += text
      words.push({ ...piece, text })
    }
  }
  if (!words.length || !joined.trim()) return null
  const start = chunk[0].start
  const end = Math.max(
    start + 0.1,
    ...chunk.map((seg) => seg.start + Math.max(seg.dur, 0.1)),
  )
  words[words.length - 1].end = Math.max(words[words.length - 1].end, end)
  return { index, start, end, words, timed }
}

/** Wordy's Z(): near-identical cue timestamps are duplicates from two track
 *  variants; merge their text instead of flashing the same line twice. */
const wordyMergeDuplicates = (lines: KaraokeLine[]): KaraokeLine[] => {
  if (lines.length < 2) return lines
  const result: KaraokeLine[] = []
  let current = lines[0]
  for (let i = 1; i < lines.length; i++) {
    const next = lines[i]
    if (Math.abs(current.start - next.start) < 0.02 && Math.abs(current.end - next.end) < 0.02) {
      const seen = new Set(current.words.map((word) => word.text.trim()))
      const extra = next.words.filter((word) => !seen.has(word.text.trim()))
      current = { ...current, words: [...current.words, ...extra], end: Math.max(current.end, next.end) }
      continue
    }
    result.push(current)
    current = next
  }
  result.push(current)
  return result.map((line, i) => ({ ...line, index: i }))
}

/**
 * Port of Wordy's cue parser: accumulate rolling caption events, emit one
 * complete sentence per punctuation mark (or per newest-cue boundary), and
 * split over-long blocks at conjunctions. Word timings stay real.
 */
export const parseJson3Wordy = (payload: Json3Payload): KaraokeLine[] => {
  const events = payload?.events
  if (!Array.isArray(events)) return []

  const hasRealOffsets = events.some((event) => {
    const offsets = (event?.segs ?? [])
      .map((seg: any) => seg?.tOffsetMs)
      .filter((value: any) => Number.isFinite(value))
    return new Set(offsets).size >= 2
  })

  const lines: KaraokeLine[] = []
  let pending: WordyWord[] = []
  for (let i = 0; i < events.length; i++) {
    const fresh = wordyFlattenEvent(events[i], events[i + 1])
    if (!fresh.length) continue
    const accumulated = pending.concat(fresh)
    const boundaries = wordyBoundaryIndices(accumulated, fresh)
    if (!boundaries.length) {
      pending = accumulated
      continue
    }
    let from = 0
    for (const boundary of boundaries) {
      if (boundary < from) continue
      const chunk = accumulated.slice(from, boundary + 1)
      from = boundary + 1
      for (const part of wordySplitAtConjunctions(chunk)) {
        const line = wordyMakeLine(part, lines.length, hasRealOffsets)
        if (line) lines.push(line)
      }
    }
    pending = accumulated.slice(from)
  }
  if (pending.length) {
    // The reference parser only splits chunks flushed by a boundary; applying
    // the same conjunction rule to the tail avoids one unsplit 30-word block.
    for (const part of wordySplitAtConjunctions(pending)) {
      const line = wordyMakeLine(part, lines.length, hasRealOffsets)
      if (line) lines.push(line)
    }
  }
  return wordyMergeDuplicates(lines)
}

/** Decode a captured /api/timedtext body in either json3 or XML form. */
export const parseCaptionedPayloadWordy = (text: string): KaraokeLine[] => {
  const body = String(text ?? '').trim()
  if (!body) return []
  if (body.startsWith('{') || body.startsWith('[')) {
    try {
      return parseJson3Wordy(JSON.parse(body))
    } catch {
      return []
    }
  }
  // YouTube sometimes serves WebVTT from the captured endpoint. Wordy only
  // handles JSON3/XML, but our VTT parser plus sentence regrouping gives the
  // same "one complete sentence per update" behaviour.
  if (/^WEBVTT\b/iu.test(body)) return mergeIntoSentences(parseVtt(body), { mode: 'sentence' })
  const decode = (raw: string): string => {
    const withBreaks = raw.replace(/<br\s*\/?>/giu, '\n').replace(/&#10;/giu, '\n')
    if (typeof document !== 'undefined') {
      try {
        const area = document.createElement('textarea')
        area.innerHTML = withBreaks
        return area.value
      } catch { /* fall through to the manual decoder */ }
    }
    return withBreaks
      .replace(/<[^>]+>/gu, '')
      .replace(/&lt;/giu, '<')
      .replace(/&gt;/giu, '>')
      .replace(/&quot;/giu, '"')
      .replace(/&apos;/giu, "'")
      .replace(/&amp;/giu, '&')
  }
  const makeLine = (start: number, dur: number, endAttr: number, raw: string): KaraokeLine | null => {
    const end = Number.isFinite(endAttr) ? endAttr : start + dur
    const normalized = decode(raw).replace(/\s+/gu, ' ').trim()
    if (!normalized) return null
    const words = speechWeightedWordTimes(normalized, start, Math.max(start + 0.1, end))
    return words.length ? { index: 0, start, end, words, timed: false } : null
  }
  const lines: KaraokeLine[] = []
  try {
    if (typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(body, 'text/xml')
      for (const node of Array.from(doc.querySelectorAll('text'))) {
        const line = makeLine(
          Number.parseFloat(node.getAttribute('start') ?? '0') || 0,
          Number.parseFloat(node.getAttribute('dur') ?? '0') || 0,
          Number.parseFloat(node.getAttribute('end') ?? 'NaN'),
          node.innerHTML || node.textContent || '',
        )
        if (line) lines.push(line)
      }
    } else {
      // Unit tests run without a DOM; the same <text> nodes can be read with a
      // small regex. Production always uses DOMParser above.
      const nodeRe = /<text\b([^>]*)>([\s\S]*?)<\/text>/giu
      const attr = (attrs: string, name: string) =>
        Number.parseFloat(attrs.match(new RegExp(`\\b${name}="([^"]+)"`, 'iu'))?.[1] ?? 'NaN')
      for (const match of body.matchAll(nodeRe)) {
        const line = makeLine(attr(match[1], 'start') || 0, attr(match[1], 'dur') || 0, attr(match[1], 'end'), match[2])
        if (line) lines.push(line)
      }
    }
  } catch {
    return []
  }
  return wordyMergeDuplicates(lines)
}

/** How much text is shown at once. 'group' mirrors the reference browser
 *  extension: one whole sense group (a run of sentences) stays on screen and
 *  is replaced as a single block. 'sentence' swaps at every full stop. */
export type SentenceMode = 'group' | 'sentence'

/** Options for grouping short caption cues into readable blocks. */
export interface SentenceMergeOptions {
  /** Max seconds one sentence fragment may span. */
  maxDuration?: number
  /** Max words in one sentence fragment. */
  maxWords?: number
  /** A pause longer than this starts a new sentence even without punctuation. */
  maxGap?: number
  mode?: SentenceMode
  /** 'group': a pause longer than this ends the whole on-screen block. */
  groupGap?: number
  /** 'group': hard caps so one block never becomes unreadable. */
  groupMaxWords?: number
  groupMaxDuration?: number
}

const SENTENCE_END = /[.!?。！？…]["'”’)\]]?\s*$/u

/** True when the last non-empty word of `words` ends a sentence. A very short
 *  stem ("Mr.", "a.") is an abbreviation / decimal, not a real full stop. */
const endsWithSentencePunctuation = (words: TimedWord[]): boolean => {
  for (let i = words.length - 1; i >= 0; i--) {
    const text = words[i].text.trim()
    if (!text) continue
    if (!SENTENCE_END.test(text)) return false
    if (text.endsWith('.')) {
      const stem = text.replace(/["'”’)\]]?\s*$/u, '').replace(/\.$/, '')
      if (stem.length <= 2) return false
    }
    return true
  }
  return false
}

/**
 * Rebuild YouTube's short caption cues into COMPLETE, readable blocks.
 *
 * A cue is only a few words, and a sentence-end mark often sits in the MIDDLE
 * of a cue ("brunch. So a brunch is a"). Accumulating whole cues and checking
 * only the buffer's LAST word therefore glues two sentences together and leaves
 * a half sentence on screen -- the "front and back are both incomplete" bug.
 *
 * We flatten the ENTIRE track into one timestamped word stream, then:
 *   Phase 1 -- cut ONLY at a sentence-ending word (or a long speaker pause on
 *              punctuation-free ASR). Size caps NEVER cut mid-clause: an over-
 *              long run is split recursively at its widest internal breath.
 *   Phase 2 -- 'group' mode (default) joins consecutive sentences back into one
 *              sense group and only replaces the whole block after a REAL
 *              speaker pause. This mirrors the reference browser extension,
 *              which stores one whole `U.line` and never splits it by default.
 *              'sentence' mode stops after phase 1, one sentence per screen.
 *
 * Every word KEEPS its own start/end, so the karaoke sweep still follows the
 * audio. The result stays sorted and non-overlapping, so `findLineAt` can stay
 * a binary search.
 */
export const mergeIntoSentences = (
  lines: KaraokeLine[],
  options: SentenceMergeOptions = {},
): KaraokeLine[] => {
  const maxDuration = options.maxDuration ?? 12
  const maxWords = options.maxWords ?? 28
  const maxGap = options.maxGap ?? 2.2
  const mode = options.mode ?? 'group'
  const groupGap = options.groupGap ?? 2.4
  const groupMaxWords = options.groupMaxWords ?? 72
  const groupMaxDuration = options.groupMaxDuration ?? 26

  // Flat word stream in track order. `timed` is a track-wide diagnostic flag.
  const all: TimedWord[] = []
  let timed = true
  for (const line of lines) {
    if (line.timed === false) timed = false
    for (const word of line.words) {
      if (word.text) all.push({ ...word })
    }
  }
  if (!all.length) return []

  const makeLine = (words: TimedWord[], index: number): KaraokeLine => ({
    index,
    start: words[0].start,
    end: words[words.length - 1].end,
    words,
    timed,
  })

  // ---- Phase 1: sentences, cut ONLY at real boundaries ------------------
  // The previous version flushed as soon as a word COUNT / DURATION cap was
  // hit, which landed in the middle of a clause. That is exactly why a frame
  // ended on "I need my" and the next began with "routine video.". Size caps
  // are now handled below by splitting an over-long run at its LARGEST breath,
  // never at the arbitrary index where the counter happened to expire.
  const sentences: TimedWord[][] = []
  let sentence: TimedWord[] = []
  for (let i = 0; i < all.length; i++) {
    const word = all[i]
    const next = all[i + 1]
    sentence.push(word)
    const punctuated = endsWithSentencePunctuation([word])
    // Punctuation-free ASR has no sentence marks at all; a long speaker pause
    // is the only honest boundary there.
    const longPause = next ? next.start - word.end > maxGap : false
    if (punctuated || longPause) {
      sentences.push(sentence)
      sentence = []
    }
  }
  if (sentence.length) sentences.push(sentence)

  // An over-long, punctuation-free run is broken recursively at its widest
  // internal pause (closest to the middle wins ties). Both halves therefore
  // still begin and end at a natural breath instead of mid-clause.
  const splitLong = (words: TimedWord[]): TimedWord[][] => {
    const span = words[words.length - 1].end - words[0].start
    if (words.length <= maxWords && span <= maxDuration) return [words]
    let cut = -1
    let bestScore = -Infinity
    for (let i = 0; i < words.length - 1; i++) {
      const gap = words[i + 1].start - words[i].end
      if (gap < maxGap * 0.25) continue
      const balance = 1 - Math.abs((i + 1) / words.length - 0.5) * 2
      const score = gap + balance * 0.5
      if (score > bestScore) {
        bestScore = score
        cut = i
      }
    }
    if (cut < 0) cut = Math.floor(words.length / 2) - 1
    if (cut < 0) return [words]
    return [
      ...splitLong(words.slice(0, cut + 1)),
      ...splitLong(words.slice(cut + 1)),
    ]
  }

  const fragments: TimedWord[][] = []
  for (const part of sentences) fragments.push(...splitLong(part))

  // A pause split can land mid-sentence ("We also went to the" | "store.").
  // Never show such a fragment as its own block: stitch it to the following
  // fragment until a real sentence-ending mark closes it. Only a long silence
  // on an already long run is allowed to end an unpunctuated block.
  const stitchIncomplete = (parts: TimedWord[][]): TimedWord[][] => {
    const out: TimedWord[][] = []
    let buf: TimedWord[] = []
    for (const part of parts) {
      if (!buf.length) {
        buf = part.slice()
        continue
      }
      const pause = part[0].start - buf[buf.length - 1].end
      const overlong = buf.length >= 30 || part[part.length - 1].end - buf[0].start > 20
      if (endsWithSentencePunctuation(buf) || (pause > 5 && overlong)) {
        out.push(buf)
        buf = part.slice()
      } else {
        buf = buf.concat(part)
      }
    }
    if (buf.length) out.push(buf)
    return out
  }
  const completeFragments = stitchIncomplete(fragments)
  if (mode === 'sentence') return completeFragments.map((words, i) => makeLine(words, i))

  // ---- Phase 2: sense groups. A group boundary ALWAYS falls BETWEEN two
  //      complete fragments, so no block can ever end on half a sentence.
  //      The size caps only decide when to start the NEXT group.
  const groups: TimedWord[][] = []
  let group: TimedWord[] = []
  for (const part of completeFragments) {
    const pause = group.length ? part[0].start - group[group.length - 1].end : 0
    const tooLong =
      group.length > 0 &&
      (part[part.length - 1].end - group[0].start > groupMaxDuration ||
        group.length + part.length > groupMaxWords)
    if (group.length && (pause > groupGap || tooLong)) {
      groups.push(group)
      group = []
    }
    group.push(...part)
  }
  if (group.length) groups.push(group)
  return groups.map((words, i) => makeLine(words, i))
}

/**
 * Merge YouTube's ROLLING caption window into an accumulating transcript.
 * YouTube's DOM captions are sliding windows: cue N+1 repeats the tail of cue
 * N and adds a few new words. Rendering each cue as a line is exactly why a
 * sentence appears chopped in half. This helper keeps the already-seen text
 * and returns only the genuinely new tail.
 */
export const mergeRollingCaption = (
  accumulated: string,
  next: string,
): { text: string; added: string } => {
  const a = accumulated.replace(/\s+/g, ' ').trim()
  const b = next.replace(/\s+/g, ' ').trim()
  if (!b) return { text: a, added: '' }
  if (!a) return { text: b, added: b }
  // The very same window read twice (or an older window still in the DOM):
  // adding it again would duplicate words on screen.
  if (a.includes(b)) return { text: a, added: '' }
  let overlap = 0
  const limit = Math.min(a.length, b.length)
  for (let k = limit; k > 0; k--) {
    if (a.slice(-k) === b.slice(0, k)) {
      overlap = k
      break
    }
  }
  const added = b.slice(overlap)
  return { text: (a + added).replace(/\s+/g, ' ').trim(), added }
}

/** Binary search for the line covering `time`, or null when none does. */
export const findLineAt = (lines: KaraokeLine[], time: number): KaraokeLine | null => {
  if (!lines.length) return null
  let lo = 0
  let hi = lines.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    const line = lines[mid]
    if (time < line.start) {
      hi = mid - 1
    } else if (time > line.end) {
      lo = mid + 1
    } else {
      return line
    }
  }
  return null
}

/** Index of the word currently being spoken in `line`, or -1 in a gap. */
export const findWordAt = (line: KaraokeLine, time: number): number => {
  const words = line.words
  for (let i = 0; i < words.length; i++) {
    if (time >= words[i].start && time < words[i].end) return i
  }
  // In micro-gaps between words, keep the most recently started word lit so
  // the highlight doesn't flicker off between every syllable.
  let last = -1
  for (let i = 0; i < words.length; i++) {
    if (words[i].start <= time) last = i
  }
  return last
}

/** Render one line to {text, active} tokens for the given playhead. */
export const highlightLine = (line: KaraokeLine, time: number): Array<{ text: string; active: boolean }> => {
  const active = findWordAt(line, time)
  return line.words.map((word, i) => ({ text: word.text, active: i === active }))
}

/**
 * Build a single karaoke line from plain text and a time range, distributing
 * the duration across words. Used by the DOM fallback when YouTube's caption
 * endpoint is unreachable but its native caption spans are on screen.
 */
export const lineFromText = (text: string, start: number, end: number, index = 0): KaraokeLine | null => {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return null
  const words = speechWeightedWordTimes(clean, start, Math.max(start + 0.1, end))
  if (!words.length) return null
  return { index, start, end: Math.max(start + 0.1, end), words, timed: false }
}

const parseClock = (value: string): number => {
  const parts = value.trim().split(':')
  if (parts.length < 2) return Number.NaN
  const seconds = Number(parts[parts.length - 1]) || 0
  const minutes = Number(parts[parts.length - 2]) || 0
  const hours = parts.length > 2 ? Number(parts[parts.length - 3]) || 0 : 0
  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Parse WebVTT / srv1 captions. These carry line-level timing only, so words
 * are interpolated by character count -- the highlight still sweeps, just
 * without exact per-word timestamps.
 */
export const parseVtt = (text: string): KaraokeLine[] => {
  if (typeof text !== 'string' || !text.trim()) return []
  const lines: KaraokeLine[] = []
  const blocks = text.replace(/\r/g, '').split(/\n\s*\n/)
  let index = 0
  for (const block of blocks) {
    const rows = block.split('\n')
    const cueRow = rows.find((row) => row.includes('-->'))
    if (!cueRow) continue
    const [from, to] = cueRow.split('-->').map((part) => parseClock(part.trim().split(/\s+/)[0]))
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) continue
    const content = rows.slice(rows.indexOf(cueRow) + 1).join(' ').replace(/<[^>]+>/g, '')
    const line = lineFromText(content, from, to, index)
    if (line) {
      lines.push(line)
      index++
    }
  }
  return lines
}

/**
 * Parse YouTube's `srv3` XML captions. `<p t=".." d="..">` gives line timing;
 * nested `<s>` may carry word offsets, otherwise words are interpolated.
 */
export const parseSrv3 = (text: string): KaraokeLine[] => {
  if (typeof text !== 'string' || !text.includes('<')) return []
  const lines: KaraokeLine[] = []
  const paragraphRe = /<p\b([^>]*)>([\s\S]*?)<\/p>/g
  let match: RegExpExecArray | null
  let index = 0
  while ((match = paragraphRe.exec(text))) {
    const t = Number(/\bt="(\d+)"/.exec(match[1])?.[1] ?? Number.NaN)
    const d = Number(/\bd="(\d+)"/.exec(match[1])?.[1] ?? 0)
    if (!Number.isFinite(t)) continue
    const start = t / 1000
    const end = start + Math.max(0.1, d / 1000)
    const inner = match[2]
    const segments: Array<{ text: string; offset?: number }> = []
    let last = 0
    const segRe = /<s\b([^>]*)>([\s\S]*?)<\/s>/g
    let sm: RegExpExecArray | null
    while ((sm = segRe.exec(inner))) {
      const plain = inner.slice(last, sm.index).replace(/<[^>]+>/g, '')
      if (plain.trim()) segments.push({ text: plain })
      const off = Number(/\bt="(\d+)"/.exec(sm[1])?.[1] ?? Number.NaN)
      segments.push({ text: sm[2].replace(/<[^>]+>/g, ''), offset: Number.isFinite(off) ? off : undefined })
      last = sm.index + sm[0].length
    }
    const tail = inner.slice(last).replace(/<[^>]+>/g, '')
    if (tail.trim()) segments.push({ text: tail })
    const decode = (s: string) =>
      s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    const clean = segments.map((s) => decode(s.text))
    let words: TimedWord[]
    const hasWordTiming = clean.some((_, i) => typeof segments[i].offset === 'number')
    if (hasWordTiming) {
      words = clean
        .map((w, i) => ({ text: w, start: start + (segments[i].offset ?? 0) / 1000, end }))
        .filter((w) => w.text.trim().length > 0)
      for (let i = 0; i < words.length - 1; i++) words[i].end = Math.max(words[i].start, words[i + 1].start)
    } else {
      words = speechWeightedWordTimes(clean.join(''), start, end)
    }
    if (!words.length) continue
    lines.push({ index: index++, start, end, words, timed: hasWordTiming })
  }
  return lines
}

