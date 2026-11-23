/**
 * Reads YouTube's own CC (closed captions) toggle.
 *
 * Our whole-sentence layer is fed by intercepted caption payloads, so it kept
 * drawing even after the user switched native captions OFF ("the CC switch
 * does nothing, subtitles show either way"). This module is deliberately
 * read-only: it never clicks or mutates YouTube's controls, it only observes
 * `aria-pressed` / `aria-checked` so the layer can follow the real switch.
 *
 * The gate lives in lib/subtitle-behaviour.ts (pure, unit-tested). The first
 * reading only establishes a baseline; subtitles are only suppressed after a
 * genuine ON->OFF transition. That keeps the default-CC-off case from ever
 * blanking the freshly fixed captions on load.
 */
import {
  ccGateToState,
  emptyCcGate,
  foldNativeCc,
  tapCcGate,
  type CcGate,
  type NativeCcState,
} from '../lib/subtitle-behaviour'
import { SUBTITLE_LAYER_ID } from './subtitle-host'

/** Everything we draw (settings button, menu, word card, caption words) lives
 *  inside this layer. It is the one DOM subtree that can never be a YouTube
 *  CC control. */
const OWN_UI_SELECTOR = `#${SUBTITLE_LAYER_ID}`

/** YouTube changes these names fairly often; try desktop + mobile + Polymer. */
const CC_SELECTORS = [
  '.ytp-subtitles-button',
  'button[aria-label*="ubtitle" i]',
  'button[aria-label*="aptions" i]',
  'button[aria-label="CC" i]',
  '[aria-label*="字幕"]',
  '[data-tooltip*="ubtitle" i]',
  '[title*="ubtitle" i]',
  '[class*="subtitles-button" i]',
  '[class*="cc-button" i]',
  'ytw-button-renderer[aria-label*="ubtitle" i]',
]

const CC_CLICK_SELECTOR = CC_SELECTORS.join(', ')

let gate: CcGate = emptyCcGate()
let lastTapAt = 0
let watcherInstalled = false

const readPressed = (el: Element): string | null => {
  const raw = el.getAttribute('aria-pressed') ?? el.getAttribute('aria-checked')
  if (raw === 'true' || raw === 'false') return raw
  return null
}

/** Poll from the existing rAF tick (throttled there). Cheap: a few selectors. */
export const sampleNativeCc = (): NativeCcState => {
  let next: string | null = null
  for (const selector of CC_SELECTORS) {
    try {
      const el = document.querySelector(selector)
      if (!el) continue
      const value = readPressed(el)
      if (value !== null) {
        next = value
        break
      }
    } catch {
      /* an unsupported selector must not break sampling */
    }
  }
  gate = foldNativeCc(gate, next)
  return ccGateToState(gate)
}

export const getNativeCcState = (): NativeCcState => ccGateToState(gate)

/**
 * Several mobile player builds render the CC button WITHOUT any ARIA state.
 * For those, a tap on the control is the only signal we get, so flip the latch
 * directly. Captured in the capture phase and never stopped, so YouTube's own
 * handler still runs unchanged. Installed once from installInteractiveSubtitles.
 */
export const installNativeCcWatcher = () => {
  // installInteractiveSubtitles() can run again after a SPA navigation; one
  // pair of capture-phase listeners is enough.
  if (watcherInstalled) return
  watcherInstalled = true
  const onTap = (event: Event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    // This listener is CAPTURE phase on `document`, so it sees taps BEFORE
    // isolateSubtitleEvents() can stop propagation on our own elements. Some
    // of those elements carry CC-like labels (e.g. the settings button's
    // "Subtitle settings"/"字幕设置"), which used to make a tap on OUR menu
    // flip the native-CC latch and blank every caption 60ms later. Ignore the
    // whole subtree: no YouTube CC control can ever live inside it.
    try {
      if (target.closest(OWN_UI_SELECTOR)) return
    } catch {
      /* unsupported selector -- fall through to the normal CC lookup */
    }
    let hit: Element | null = null
    try {
      hit = target.closest(CC_CLICK_SELECTOR)
    } catch {
      return
    }
    if (!hit) return
    // One physical tap fires BOTH pointerdown and click. Without this guard
    // the latch would flip twice and cancel itself out -- the CC switch would
    // look like it does nothing, which is exactly the reported bug.
    const now = Date.now()
    if (now - lastTapAt < 400) return
    lastTapAt = now
    // Prefer a re-sample: YouTube updates aria-pressed asynchronously right
    // after the tap. If that build has no readable state, the tap is the state.
    window.setTimeout(() => {
      const before = gate.readable
      sampleNativeCc()
      if (!before && !gate.readable) gate = tapCcGate(gate)
    }, 60)
  }
  document.addEventListener('click', onTap, true)
  document.addEventListener('pointerdown', onTap, true)
}

/** A new video may mount a fresh CC control; keep the user's OFF choice but
 *  re-establish the baseline so the new button is not read as a transition. */
export const resetNativeCcBaseline = () => {
  gate = { ...gate, baseline: null }
}
