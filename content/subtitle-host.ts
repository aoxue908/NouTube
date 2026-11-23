/**
 * Mount point for the interactive-subtitle layer.
 *
 * YouTube's own control layers hit-test ABOVE anything appended into
 * #movie_player: on Android it is #player-control-overlay (it covers the whole
 * player and fades in on tap with .fadein), on desktop .ytp-chrome-bottom.
 * A caption, toolbar button or word card mounted there is visible but its taps
 * are swallowed as soon as the controls are shown -- exactly the "the menu is
 * there but I cannot tap it" symptom.
 *
 * content/fullscreen-controls.ts already works around this for its settings
 * button by mounting on the fullscreen element itself ("Sits next to the
 * control overlay rather than inside it"). We use the same trick: one dedicated
 * layer element is kept as a DIRECT CHILD of the fullscreen element (or of
 * #movie_player for inline playback), with a z-index above all YouTube chrome.
 * Every subtitle UI element lives inside that layer, so the percentage-based
 * offsets still reference the player box.
 *
 * The layer is a single element shared by interactive-subtitles.ts and
 * subtitle-toolbar.ts; YouTube rebuilds its player subtree on fullscreen
 * transitions, so the layer is re-parented lazily on every ensure call.
 */
const LAYER_ID = '_nou_sub_layer'

const getFullscreenElement = () =>
  (document.fullscreenElement || (document as any).webkitFullscreenElement) as HTMLElement | null

/**
 * Fullscreen: the element YouTube put into fullscreen (Android:
 * #player-container-id). Inline: #movie_player. A page-level fullscreen
 * element (html/body) is deliberately rejected: it would make the percentage
 * offsets span the whole document instead of the video box.
 */
export const getSubtitleHost = (): HTMLElement | null => {
  const player = document.getElementById('movie_player')
  if (!player) return null
  const fs = getFullscreenElement()
  if (fs && fs !== document.documentElement && fs !== document.body && fs.contains(player)) {
    return fs
  }
  return player
}

let layer: HTMLElement | null = null

/**
 * Returns the shared layer, creating it or moving it when the host changes.
 * `position: fixed` is used for a fullscreen host (its box IS the viewport),
 * `absolute` for inline playback (relative to #movie_player).
 */
export const getSubtitleLayer = (): HTMLElement | null => {
  const host = getSubtitleHost()
  if (!host) return null

  if (!layer) {
    layer = document.createElement('div')
    layer.id = LAYER_ID
  }
  if (layer.parentElement !== host) {
    host.appendChild(layer)
  }
  const position = host === getFullscreenElement() ? 'fixed' : 'absolute'
  // Avoid writing the same value every frame: an attribute mutation on the
  // layer would wake the fullscreen controls' MutationObserver.
  if (layer.style.position !== position) layer.style.position = position
  return layer
}

/** Keep an element inside the shared layer. Cheap enough to call every frame. */
export const mountOnSubtitleLayer = (el: HTMLElement): boolean => {
  const root = getSubtitleLayer()
  if (!root) return false
  if (el.parentElement !== root) root.appendChild(el)
  return true
}

/**
 * Stop taps on our UI from reaching YouTube's player/document handlers (tap to
 * toggle controls, double-tap seek, ...). Those handlers live above the layer
 * and would otherwise steal or cancel the gesture.
 *
 * pointermove / pointerup / pointercancel are deliberately NOT isolated: the
 * caption drag listens for them on `window` in the bubble phase.
 */
const ISOLATED_EVENTS = [
  'click',
  'dblclick',
  'contextmenu',
  'pointerdown',
  'touchstart',
  'touchend',
  'touchcancel',
  'mousedown',
  'mouseup',
  'wheel',
] as const

const isolated = new WeakSet<HTMLElement>()

export const isolateSubtitleEvents = (el: HTMLElement) => {
  if (isolated.has(el)) return
  isolated.add(el)
  for (const type of ISOLATED_EVENTS) {
    el.addEventListener(type, (event) => event.stopPropagation())
  }
}

export const SUBTITLE_LAYER_ID = LAYER_ID
