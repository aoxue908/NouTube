/**
 * Pure decisions behind the interactive subtitle layer.
 *
 * These live outside `content/` on purpose: they can be unit-tested without a
 * DOM. Every regression in this file came from a real device screenshot where
 * the whole subtitle layer silently disappeared.
 */

/**
 * Resolve the master switch from the App's settings snapshot.
 *
 * ONLY an explicit `false` disables the layer. Early builds migrated a
 * `karaokeHighlight: false` legacy value into `interactiveSubtitles`, and an
 * early/missing snapshot used to yield `undefined`. The old strict
 * `=== true` check therefore turned the layer off for existing installs:
 * YouTube's native fragmented captions came back, the settings button was
 * hidden, and no caption word could be tapped. Defaulting to ON is self-
 * healing; the in-page menu still offers a real off switch.
 */
export const resolveInteractiveEnabled = (snapshot: unknown): boolean => {
  try {
    const value = (snapshot as { interactiveSubtitles?: unknown } | null | undefined)
      ?.interactiveSubtitles
    return value !== false
  } catch {
    return true
  }
}

/**
 * Whether the in-player subtitle settings button is visible.
 *
 * It follows YouTube's own control bar, NOT the master switch. Hiding it when
 * `enabled` is false removes the only way to switch the layer back on from
 * inside the player -- that is precisely the "settings button disappeared"
 * report. `enabled` is accepted (and deliberately ignored) so callers and
 * tests make the decoupling explicit.
 */
export const shouldShowSubtitleEntry = (
  controlsVisible: boolean,
  menuOpen: boolean,
  enabled: boolean,
): boolean => {
  void enabled
  return controlsVisible || menuOpen
}

/**
 * State of YouTube's own CC (closed captions) button as far as we can read it.
 * `unknown` is a first-class value: some player builds expose no readable
 * toggle at all, and guessing "off" there would blank every caption -- the
 * single most repeated regression in this project.
 */
export type NativeCcState = 'on' | 'off' | 'unknown'

/**
 * Whether our whole-sentence layer should draw.
 *
 * The layer is driven by intercepted caption data (Wordy), NOT by YouTube's
 * native caption renderer, so it used to keep drawing after the user switched
 * the native CC button OFF -- "the switch shows subtitles either way". Only an
 * explicit OFF suppresses it; `unknown` keeps captions on.
 */
export const resolveCaptionLayerVisible = (
  interactiveEnabled: boolean,
  nativeCc: NativeCcState,
): boolean => interactiveEnabled && nativeCc !== 'off'

/** Fold one CC-button reading into the gate state. */
export interface CcGate {
  /** Last readable aria-pressed value, or null when never read. */
  baseline: string | null
  /** True once a real ON->OFF / OFF->ON transition (or a tap) was observed. */
  engaged: boolean
  /** True when the user has switched native CC off. */
  off: boolean
  /** True when this player build exposes a readable ARIA CC state. */
  readable: boolean
}

export const emptyCcGate = (): CcGate => ({
  baseline: null,
  engaged: false,
  off: false,
  readable: false,
})

/**
 * We must NOT trust an absolute initial value: many videos start with CC
 * `false` while our layer is already showing perfectly good captions (we fetch
 * the track ourselves). Reading that as "off" would make subtitles vanish on
 * load -- the exact regression the user kept hitting. So the first readable
 * observation only establishes a baseline; only a genuine TRANSITION makes the
 * native toggle authoritative. That is precisely the reported bug: flipping
 * the switch changed nothing.
 */
export const foldNativeCc = (prev: CcGate, next: string | null): CcGate => {
  if (next === null) return prev
  if (prev.baseline === null) {
    return { baseline: next, engaged: prev.engaged, off: prev.off, readable: true }
  }
  if (next === prev.baseline) return { ...prev, readable: true }
  return { baseline: next, engaged: true, off: next === 'false', readable: true }
}

/** Mobile builds often expose no ARIA state at all; a tap on the CC control
 *  then has to drive the latch directly. */
export const tapCcGate = (prev: CcGate): CcGate => ({
  ...prev,
  engaged: true,
  off: !prev.off,
})

export const ccGateToState = (gate: CcGate): NativeCcState =>
  !gate.engaged ? 'unknown' : gate.off ? 'off' : 'on'
