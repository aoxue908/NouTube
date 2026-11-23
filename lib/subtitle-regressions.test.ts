import { describe, expect, it } from 'bun:test'
import {
  mergeIntoSentences,
  type KaraokeLine,
} from './karaoke'
import {
  ccGateToState,
  emptyCcGate,
  foldNativeCc,
  resolveCaptionLayerVisible,
  resolveInteractiveEnabled,
  shouldShowSubtitleEntry,
  tapCcGate,
} from './subtitle-behaviour'

/**
 * Regressions taken from real device screenshots (2026-11-22):
 *   1. the subtitle layer was OFF -> YouTube's native two-line ASR window was
 *      shown, the settings button vanished, and tapping a word did nothing;
 *   2. a frame ended on "... I need my" and the next started with
 *      "routine video. So, ..." -- the size cap cut mid-clause.
 */

describe('master switch resolves safely (screenshot: layer silently off)', () => {
  it('defaults ON for missing / incomplete / legacy snapshots', () => {
    expect(resolveInteractiveEnabled(undefined)).toBe(true)
    expect(resolveInteractiveEnabled(null)).toBe(true)
    expect(resolveInteractiveEnabled({})).toBe(true)
    expect(resolveInteractiveEnabled({ interactiveSubtitles: undefined })).toBe(true)
    // Old installs carry karaokeHighlight:false but no interactiveSubtitles.
    expect(resolveInteractiveEnabled({ karaokeHighlight: false })).toBe(true)
    expect(resolveInteractiveEnabled({ karaokeHighlight: false, interactiveSubtitles: undefined })).toBe(true)
  })

  it('still honours an explicit on/off', () => {
    expect(resolveInteractiveEnabled({ interactiveSubtitles: true })).toBe(true)
    expect(resolveInteractiveEnabled({ interactiveSubtitles: false })).toBe(false)
  })
})

describe('settings button must not disappear with the layer', () => {
  it('shows with the native controls even when the layer is OFF', () => {
    // This exact case was the bug: `enabled && controlsVisible` hid the only
    // control that could turn the layer back on.
    expect(shouldShowSubtitleEntry(true, false, false)).toBe(true)
    expect(shouldShowSubtitleEntry(true, false, true)).toBe(true)
  })

  it('stays up while the menu is open, hides with the controls otherwise', () => {
    expect(shouldShowSubtitleEntry(false, true, false)).toBe(true)
    expect(shouldShowSubtitleEntry(false, true, true)).toBe(true)
    expect(shouldShowSubtitleEntry(false, false, true)).toBe(false)
    expect(shouldShowSubtitleEntry(false, false, false)).toBe(false)
  })
})

/** Build an ASR-style short cue with per-word timestamps. */
const cue = (text: string, start: number, end: number, index: number): KaraokeLine => {
  const pieces = text.match(/\S+\s*/g) ?? []
  const step = (end - start) / Math.max(1, pieces.length)
  return {
    index,
    start,
    end,
    timed: true,
    words: pieces.map((piece, i) => ({
      text: piece,
      start: start + i * step,
      end: start + (i + 1) * step,
    })),
  }
}

// Reproduces the screenshot text as YouTube would deliver it: 1-2s ASR cues,
// sentence-ending punctuation sitting in the MIDDLE of cues, and a clause
// ("because I need my privacy,") that the old 28-word cap used to cut in half.
const SCREENSHOT_CUES: KaraokeLine[] = [
  cue('hi guys welcome back ', 0, 1.5, 0),
  cue('to my morning routine video. ', 1.5, 3.2, 1),
  cue('So, I want to show ', 3.2, 4.6, 2),
  cue('you everything. ', 4.6, 6.0, 3),
  cue('Obviously, not everything ', 6.0, 7.5, 4),
  cue('because I need my privacy, ', 7.5, 9.2, 5),
  cue("but I'll show you most of it.", 9.2, 11.0, 6),
]

const textOf = (line: KaraokeLine) => line.words.map((w) => w.text).join('').trim()
const ENDS_WITH_SENTENCE = /[.!?]["'”’)\]]?$/u

describe('every displayed block is a COMPLETE sentence (screenshot regression)', () => {
  for (const mode of ['group', 'sentence'] as const) {
    it(`never ends a block mid-clause in ${mode} mode`, () => {
      const blocks = mergeIntoSentences(SCREENSHOT_CUES, { mode })
      expect(blocks.length).toBeGreaterThan(0)

      for (const block of blocks) {
        const text = textOf(block)
        // A block may contain several sentences, but its LAST character must be
        // a sentence terminator. "I need my" / "routine video. So," both fail.
        expect(ENDS_WITH_SENTENCE.test(text)).toBe(true)
        expect(text).not.toMatch(/I need my$/)
        expect(text).not.toMatch(/^routine video\./)
      }
    })
  }

  it('keeps every word and its real timing after regrouping', () => {
    const blocks = mergeIntoSentences(SCREENSHOT_CUES, { mode: 'group' })
    const rebuilt = blocks.flatMap((b) => b.words.map((w) => w.text)).join('')
    const original = SCREENSHOT_CUES.flatMap((c) => c.words.map((w) => w.text)).join('')
    expect(rebuilt).toBe(original)
    for (const block of blocks) {
      for (const word of block.words) {
        expect(word.end).toBeGreaterThan(word.start)
      }
    }
  })

  it('does not cut a long clause merely because a word counter expired', () => {
    // One sentence, 40 words, well over the old maxWords=28 hard cap. The old
    // implementation flushed at word 28 and left the rest for the next frame.
    const longSentence = Array.from({ length: 39 }, () => 'word').join(' ') + ' finally.'
    const single = [cue(longSentence, 0, 14, 0)]
    const blocks = mergeIntoSentences(single, { mode: 'sentence' })
    expect(textOf(blocks[blocks.length - 1])).toMatch(/finally\.$/)
    // Any split that was unavoidable must still land at a breath, and the
    // concatenation must equal the original text (no words dropped).
    expect(blocks.flatMap((b) => b.words.map((w) => w.text)).join('')).toBe(longSentence)
  })
})

describe('native CC switch gates the whole-sentence layer (screenshot: switch does nothing)', () => {
  it('only an explicit OFF suppresses captions; unknown keeps them on', () => {
    expect(resolveCaptionLayerVisible(true, 'on')).toBe(true)
    expect(resolveCaptionLayerVisible(true, 'unknown')).toBe(true)
    expect(resolveCaptionLayerVisible(true, 'off')).toBe(false)
    expect(resolveCaptionLayerVisible(false, 'on')).toBe(false)
  })

  it('the FIRST aria reading is only a baseline, never an off switch', () => {
    // Most videos start with CC aria-pressed="false" while our intercepted
    // whole-sentence captions are already correct. Treating that as a real
    // switch would blank the subtitles on load -- the regression that kept
    // coming back before the Wordy data path was fixed.
    let gate = emptyCcGate()
    gate = foldNativeCc(gate, 'false')
    expect(ccGateToState(gate)).toBe('unknown')
    expect(resolveCaptionLayerVisible(true, ccGateToState(gate))).toBe(true)
    // A real OFF->ON transition is harmless; the fatal one is ON->OFF.
    gate = foldNativeCc(gate, 'true')
    expect(ccGateToState(gate)).toBe('on')
    gate = foldNativeCc(gate, 'false')
    expect(ccGateToState(gate)).toBe('off')
  })

  it('a tap drives the latch on player builds with no ARIA state', () => {
    let gate = emptyCcGate()
    gate = foldNativeCc(gate, null)
    expect(ccGateToState(gate)).toBe('unknown')
    gate = tapCcGate(gate)
    expect(ccGateToState(gate)).toBe('off')
    gate = tapCcGate(gate)
    expect(ccGateToState(gate)).toBe('on')
  })

  it('keeps the OFF choice when a new video re-baselines the CC button', () => {
    let gate = emptyCcGate()
    gate = foldNativeCc(gate, 'true')
    gate = foldNativeCc(gate, 'false')
    expect(ccGateToState(gate)).toBe('off')
    // resetNativeCcBaseline() only clears the baseline, not engaged/off.
    gate = { ...gate, baseline: null }
    gate = foldNativeCc(gate, 'false')
    expect(ccGateToState(gate)).toBe('off')
  })
})
