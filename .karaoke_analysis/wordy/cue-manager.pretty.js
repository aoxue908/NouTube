var mt = Object.defineProperty
var yt = (e, t, n) => (t in e ? mt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n }) : (e[t] = n))
var l = (e, t, n) => yt(e, typeof t != 'symbol' ? t + '' : t, n)
import {
  a as bt,
  n as f,
  D as xt,
  h as St,
  g as Ct,
  T as Y,
  f as Lt,
  s as ut,
  o as ct,
  q as ht,
} from './wordyI18n-srT7ApvA.js'
import { s as K, c as wt } from './index.ts-C5l4YE8G.js'
import { W as vt } from './wordyMark-DkKyBWvL.js'
import { i as Tt } from './messages-FUSvB02k.js'
import './messages-BD2XHN-d.js'
import './languagePreparationPresentation-DqJdfyJH.js'
const Et = '/assets/interceptor.ts-e3R1GLTl.js',
  S = '぀-ヿ㐀-䶿一-鿿',
  U = '，。！？；：、）】》〉',
  $t = '（【《〈'
function dt(e) {
  return e
    .replace(
      /\r\n?/g,
      `
`,
    )
    .replace(/\u00a0/g, ' ')
    .replace(
      /<br\s*\/?>/gi,
      `
`,
    )
    .split(
      `
`,
    )
    .map((t) => kt(t))
    .filter(Boolean).join(`
`)
}
function kt(e) {
  return e
    .replace(/\s+/g, ' ')
    .trim()
    .replace(new RegExp(`([${S}])\\s+([${S}])`, 'g'), '$1$2')
    .replace(new RegExp(`([${S}])\\s+([${U}])`, 'g'), '$1$2')
    .replace(new RegExp(`([${U}])\\s+([${S}])`, 'g'), '$1$2')
    .replace(new RegExp(`([${$t}])\\s+([${S}])`, 'g'), '$1$2')
    .replace(new RegExp(`([${S}])\\s+([A-Za-z0-9])`, 'g'), '$1$2')
    .replace(new RegExp(`([A-Za-z0-9])\\s+([${S}])`, 'g'), '$1$2')
}
const Mt = new DOMParser(),
  G = document.createElement('textarea'),
  q = 0.02,
  At = new Set([
    'and',
    'so',
    'or',
    'if',
    'whether',
    'but',
    'when',
    'while',
    'because',
    'cause',
    'since',
    'until',
    'unless',
    'though',
    'what',
    'where',
    'how',
  ])
function Nt(e) {
  const t = '[YouTube Translator][4]'
  if (!e) return (console.debug(`${t} empty subtitle payload`), [])
  const n = e.trim()
  if (!n.startsWith('<')) {
    const o = zt(n)
    if (o.length) return (console.log(`${t} parsed JSON cues=${o.length}`), Z(o))
  }
  const i = Mt.parseFromString(e, 'text/xml')
  let r = Array.from(i.querySelectorAll('text'))
  ;(r.length ||
    ((r = Array.from(i.getElementsByTagName('text'))),
    console.warn(`${t} selector returned 0 nodes, fallback getElements result=${r.length}`)),
    r.length || console.warn(`${t} unable to locate <text> nodes payloadLength=${e.length}`),
    console.log(`${t} raw cue count=${r.length}`))
  const s = r
    .map((o) => Wt(o))
    .filter((o) => !!o)
    .sort((o, u) => o.start - u.start)
  return (console.log(`${t} normalized cue count=${s.length}`), Z(s))
}
function zt(e) {
  const t = '[YouTube Translator][4]'
  try {
    const n = JSON.parse(e),
      i = n == null ? void 0 : n.events
    return Array.isArray(i) ? Pt(i) : (console.warn(`${t} JSON payload missing events`), [])
  } catch {
    return (console.warn(`${t} failed to parse JSON payload payloadLength=${e.length}`), [])
  }
}
function Pt(e) {
  const t = []
  let n = []
  for (let i = 0; i < e.length; i += 1) {
    const a = e[i],
      r = e[i + 1],
      s = Ot(a, r)
    if (!s.length) continue
    const o = [...n, ...s],
      u = Rt(o, s)
    if (!u.length) {
      n = o
      continue
    }
    let p = 0
    for (const y of u) {
      if (y < p) continue
      const m = o.slice(p, y + 1)
      p = y + 1
      const A = m.length > 20 ? Ft(m) : [m]
      for (const g of A) {
        const E = J(g)
        E && t.push(E)
      }
    }
    n = o.slice(p)
  }
  if (n.length) {
    const i = J(n)
    i && t.push(i)
  }
  return t
}
function Ot(e, t) {
  if (!Array.isArray(e.segs) || !Number.isFinite(e.tStartMs)) return []
  const n = [],
    i = e.tStartMs / 1e3,
    a = Bt(e, t),
    r = Math.max(a / Math.max(1, e.segs.length), 0.1)
  let s = 0
  for (let o = 0; o < e.segs.length; o += 1) {
    const u = e.segs[o],
      p = typeof (u == null ? void 0 : u.utf8) == 'string' ? u.utf8 : ''
    if (!p.trim()) continue
    const y = e.segs[o + 1],
      m = Number.isFinite(u == null ? void 0 : u.tOffsetMs) ? u.tOffsetMs / 1e3 : s,
      A = Number.isFinite(y == null ? void 0 : y.tOffsetMs) ? y.tOffsetMs / 1e3 : NaN
    let g = Number.isFinite(A) ? A - m : NaN
    if (!Number.isFinite(g) && o === e.segs.length - 1 && Number.isFinite(u == null ? void 0 : u.tOffsetMs)) {
      const V = Number.isFinite(t == null ? void 0 : t.tStartMs) ? t.tStartMs / 1e3 : NaN
      g = Number.isFinite(V) ? V - (i + m) : a - m
    }
    ;(!Number.isFinite(g) &&
      e.segs.length === 1 &&
      Number.isFinite(t == null ? void 0 : t.tStartMs) &&
      (g = t.tStartMs / 1e3 - i),
      (!Number.isFinite(g) || g <= 0) && (g = r))
    const E = Math.max(g, 0.1)
    ;(n.push({ text: p, start: i + m, dur: E }), (s = Math.max(s, m + E)))
  }
  return n
}
function Bt(e, t) {
  return Number.isFinite(e.dDurationMs)
    ? Math.max(e.dDurationMs / 1e3, 0.1)
    : Number.isFinite(t == null ? void 0 : t.tStartMs) && Number.isFinite(e.tStartMs)
      ? Math.max((t.tStartMs - e.tStartMs) / 1e3, 0.1)
      : 0.3
}
function Rt(e, t) {
  const n = []
  for (let i = 0; i < e.length; i += 1) {
    const a = e[i].text
    ;(It(a) || a.toLowerCase().includes('[music]')) && n.push(i)
  }
  if (!n.length && e.length >= 2) {
    const i = t.some((r) => Dt(r.text)),
      a = t.every((r) => _t(r.text) >= 2)
    ;(i || a) && n.push(e.length - 2)
  }
  return [...new Set(n)].sort((i, a) => i - a)
}
function It(e) {
  return /[.!?。！？；;…]/.test(e)
}
function Dt(e) {
  return /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(e)
}
function _t(e) {
  return e.trim().split(/\s+/).filter(Boolean).length
}
function Ft(e) {
  const t = []
  for (let s = 0; s < e.length; s += 1) {
    const o = e[s].text.trim().toLowerCase()
    At.has(o) && t.push(s)
  }
  if (!t.length) return [e]
  const n = []
  let i = 0
  for (const s of t) s <= i || s >= e.length || (n.push(e.slice(i, s)), (i = s))
  i < e.length && n.push(e.slice(i))
  const a = n.filter((s) => s.length > 0)
  if (!a.length) return [e]
  const r = []
  for (let s = 0; s < a.length; s += 1) {
    const o = a[s]
    if (o.length < 3 && s + 1 < a.length) {
      a[s + 1] = [...o, ...a[s + 1]]
      continue
    }
    r.push(o)
  }
  return r.length ? r : [e]
}
function J(e) {
  if (!e.length) return null
  const t = dt(Yt(e))
  if (!t) return null
  const n = e[0].start,
    i = Math.max(n + 0.1, ...e.map((a) => a.start + Math.max(a.dur, 0.1)))
  return { start: n, end: i, text: t }
}
function Yt(e) {
  let t = ''
  for (const n of e) t = Ht(t, n.text || '')
  return t
}
function Ht(e, t) {
  if (!e) return t
  if (!t) return e
  if (/^\s/.test(t) || /[\s\n]$/.test(e)) return e + t
  const n = e.slice(-1),
    i = t.charAt(0)
  if (!n || !i || /[,.!?;:%)\]}'"”’]/.test(i) || /[(\[{'"“‘/]/.test(n)) return e + t
  const s = /[A-Za-z0-9]/.test(n),
    o = /[A-Za-z0-9]/.test(i)
  if (s && o) return `${e} ${t}`
  const u = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(n),
    p = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(i)
  return (s && p) || (u && o) ? `${e} ${t}` : e + t
}
function Wt(e) {
  const t = parseFloat(e.getAttribute('start') || '0'),
    n = parseFloat(e.getAttribute('dur') || '0'),
    i = parseFloat(e.getAttribute('end') || 'NaN'),
    a = Number.isFinite(i) ? i : t + n,
    r = e.innerHTML || e.textContent || '',
    s = Xt(
      r
        .replace(
          /<br\s*\/?>/gi,
          `
`,
        )
        .replace(
          /&#10;/g,
          `
`,
        ),
    ),
    o = dt(s)
  return o ? { start: t, end: a, text: o } : null
}
function Xt(e) {
  return ((G.innerHTML = e), G.value)
}
function Z(e) {
  if (!e.length) return []
  const t = []
  let n = { ...e[0] }
  for (let i = 1; i < e.length; i += 1) {
    const a = e[i]
    jt(n, a) ? (n.text = Vt(n.text, a.text)) : (t.push(n), (n = { ...a }))
  }
  return (t.push(n), console.log(`[YouTube Translator][4] merged cues=${t.length}`), t)
}
function jt(e, t) {
  return Math.abs(e.start - t.start) < q && Math.abs(e.end - t.end) < q
}
function Vt(e, t) {
  if (!e) return t
  if (!t) return e
  if (Q(e, t)) return t
  if (Q(t, e)) return e
  const n = new Set(
      e
        .split(
          `
`,
        )
        .map((r) => r.trim())
        .filter(Boolean),
    ),
    a = t
      .split(
        `
`,
      )
      .map((r) => r.trim())
      .filter(Boolean)
      .filter((r) => !n.has(r))
  return a.length
    ? `${e}
${a.join(`
`)}`
    : e
}
function Q(e, t) {
  const n = tt(e),
    i = tt(t)
  return !n || !i ? !1 : !!(n === i || (n.length >= 12 && i.startsWith(n)) || (n.length >= 18 && i.includes(n)))
}
function tt(e) {
  return e.toLowerCase().replace(/\s+/g, ' ').trim()
}
const et = 'yt-translator-overlay-style',
  Kt = 5,
  Ut = `
  :root {
    --plugin-color: #3ea6ff;
  }

  .imt-caption-container {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 2000;
    pointer-events: none;
  }

  .imt-caption-container.hidden {
    display: none !important;
  }

  .imt-captions-box-container {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    text-align: center;
    cursor: move;
    z-index: 20;
    user-select: none;
    transition: opacity 0.3s;
    pointer-events: auto;
  }

  .imt-captions-box {
    background-color: rgba(0, 0, 0, 0.7);
    border-radius: 8px;
    padding: 12px 20px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: all 0.2s ease;
    min-width: 200px;
    width: fit-content;
    max-width: min(96vw, 2200px);
    box-sizing: border-box;
  }

  .imt-line-primary {
    font-size: 24px;
    color: #fff;
    font-weight: 500;
    line-height: 1.3;
    white-space: normal;
    overflow-wrap: anywhere;
    text-shadow: 1px 1px 2px black;
    font-family: Roboto, Arial, sans-serif;
    user-select: text;
  }

  .imt-line-secondary {
    font-size: 16px;
    color: #ccc;
    font-weight: 400;
    line-height: 1.3;
    white-space: normal;
    overflow-wrap: anywhere;
    font-family: Roboto, Arial, sans-serif;
    user-select: text;
  }

  .imt-plugin-hud {
    position: absolute;
    top: -45px;
    right: 0;
    background-color: rgba(28, 28, 28, 0.9);
    border-radius: 20px;
    padding: 6px 12px;
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.2s ease;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
    cursor: default;
  }

  .imt-hud-mark {
    display: flex;
    width: 18px;
    height: 16px;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .imt-hud-mark svg {
    display: block;
    width: 18px;
    height: auto;
  }

  .imt-captions-box-container:hover .imt-plugin-hud {
    opacity: 1;
    transform: translateY(0);
  }

  .imt-captions-box-container.imt-dragging,
  .imt-captions-box-container.imt-dragging .imt-line-primary,
  .imt-captions-box-container.imt-dragging .imt-line-secondary {
    cursor: grabbing;
    user-select: none;
  }

  .imt-hud-btn {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 50%;
    transition: color 0.2s, background 0.2s;
  }

  .imt-hud-btn:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .html5-video-player.imt-active .ytp-caption-window-container {
    display: none !important;
  }
`,
  nt = {
    swap: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z"></path></svg>',
    size: '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"></path></svg>',
  }
class Gt {
  constructor() {
    l(this, 'container')
    l(this, 'captionBoxContainer')
    l(this, 'captionBox')
    l(this, 'linePrimary')
    l(this, 'lineSecondary')
    l(this, 'hud')
    l(this, 'isDualMode', !0)
    l(this, 'fontSizeLevel', 1)
    l(this, 'swapped', !1)
    l(this, 'youtubeBilingualSubtitlesEnabled', !0)
    l(this, 'enhancementActive', !0)
    l(this, 'primaryLine', 'source')
    l(this, 'gesture', { phase: 'idle' })
    l(this, 'xOffset', 0)
    l(this, 'yOffset', 0)
    l(this, 'currentX', 0)
    l(this, 'currentY', 0)
    l(this, 'currentCue', null)
    l(this, 'hostElement', null)
    l(this, 'resizeObserver', null)
    ;(this.ensureStyles(),
      (this.container = document.createElement('div')),
      (this.container.className = 'imt-caption-container hidden'),
      (this.captionBoxContainer = document.createElement('div')),
      (this.captionBoxContainer.className = 'imt-captions-box-container'),
      (this.hud = document.createElement('div')),
      (this.hud.className = 'imt-plugin-hud'),
      this.createHudContent(),
      (this.captionBox = document.createElement('div')),
      (this.captionBox.className = 'imt-captions-box'),
      (this.linePrimary = document.createElement('div')),
      (this.linePrimary.className = 'imt-line-primary'),
      (this.lineSecondary = document.createElement('div')),
      (this.lineSecondary.className = 'imt-line-secondary'),
      this.captionBox.append(this.linePrimary, this.lineSecondary),
      this.captionBoxContainer.append(this.hud, this.captionBox),
      this.container.appendChild(this.captionBoxContainer),
      document.documentElement.appendChild(this.container),
      this.setupDrag())
  }
  get isDragging() {
    return this.gesture.phase === 'dragging'
  }
  ensureStyles() {
    if (document.getElementById(et)) return
    const t = document.createElement('style')
    ;((t.id = et), (t.textContent = Ut), document.head.appendChild(t))
  }
  createHudContent() {
    const t = document.createElement('span')
    ;((t.className = 'imt-hud-mark'),
      (t.dataset.wordyHudMark = ''),
      t.setAttribute('aria-hidden', 'true'),
      (t.innerHTML = vt))
    const n = document.createElement('button')
    ;((n.className = 'imt-hud-btn'),
      (n.innerHTML = nt.swap),
      (n.onclick = (a) => {
        ;(a.stopPropagation(), this.toggleSwap())
      }))
    const i = document.createElement('button')
    ;((i.className = 'imt-hud-btn'),
      (i.innerHTML = nt.size),
      (i.onclick = (a) => {
        ;(a.stopPropagation(), this.cycleFontSize())
      }),
      this.hud.append(t, n, i),
      this.updateHudLabels('en'))
  }
  setupDrag() {
    ;(this.captionBoxContainer.addEventListener('mousedown', (t) => this.dragStart(t)),
      document.addEventListener('mouseup', () => this.dragEnd(), !0),
      document.addEventListener('mousemove', (t) => this.drag(t)))
  }
  dragStart(t) {
    if (t.target.closest('.imt-plugin-hud') || !this.captionBoxContainer.contains(t.target)) return
    const n = !!t.target.closest('.imt-line-primary, .imt-line-secondary')
    if ((K('pending'), n && t.detail >= 2)) {
      this.gesture = { phase: 'selecting' }
      return
    }
    const i = {
      phase: 'pending',
      initialX: t.clientX - this.xOffset,
      initialY: t.clientY - this.yOffset,
      originX: t.clientX,
      originY: t.clientY,
    }
    this.gesture = i
  }
  dragEnd() {
    ;((this.gesture = { phase: 'idle' }), this.captionBoxContainer.classList.remove('imt-dragging'), wt())
  }
  drag(t) {
    var n
    if (this.gesture.phase === 'pending') {
      const i = this.gesture,
        a = t.clientX - i.originX,
        r = t.clientY - i.originY
      if (Math.hypot(a, r) < Kt) return
      ;((this.gesture = { phase: 'dragging', initialX: i.initialX, initialY: i.initialY }),
        this.captionBoxContainer.classList.add('imt-dragging'),
        K('dragging'),
        (n = window.getSelection()) == null || n.removeAllRanges())
    }
    this.gesture.phase === 'dragging' &&
      (t.preventDefault(),
      (this.currentX = t.clientX - this.gesture.initialX),
      (this.currentY = t.clientY - this.gesture.initialY),
      (this.xOffset = this.currentX),
      (this.yOffset = this.currentY),
      this.setTranslate(this.currentX, this.currentY, this.captionBoxContainer))
  }
  setTranslate(t, n, i) {
    i.style.transform = `translate(calc(-50% + ${t}px), ${n}px)`
  }
  attachTo(t) {
    const n = t.closest('.html5-video-player') || t
    ;((this.hostElement = n),
      n.contains(this.container) || n.appendChild(this.container),
      window.getComputedStyle(n).position === 'static' && (n.style.position = 'relative'),
      this.observeHostResize(n),
      this.updateCaptionMaxWidth(),
      this.updateHostClass())
  }
  applySettings(t) {
    ;((this.youtubeBilingualSubtitlesEnabled = t.youtubeBilingualSubtitlesEnabled),
      (this.primaryLine = t.primaryLine),
      (this.isDualMode = t.dualMode),
      this.updateHudLabels(t.nativeLanguage),
      this.updateSecondaryVisibility(),
      this.updateHostClass(),
      this.currentCue ? this.render(this.currentCue) : this.hide())
  }
  setEnhancementActive(t) {
    if (((this.enhancementActive = t), this.updateHostClass(), !this.isRenderingEnabled())) {
      this.hide()
      return
    }
    this.currentCue && this.render(this.currentCue)
  }
  updateHostClass() {
    if (this.hostElement) {
      if (this.isRenderingEnabled()) {
        this.hostElement.classList.add('imt-active')
        return
      }
      this.hostElement.classList.remove('imt-active')
    }
  }
  updateSecondaryVisibility() {
    var n
    const t = !!((n = this.currentCue) != null && n.translation && this.currentCue.translation !== this.currentCue.text)
    this.lineSecondary.style.display = this.isDualMode && t ? 'block' : 'none'
  }
  updateHudLabels(t) {
    const n = bt(t).messages,
      [, i, a] = this.hud.children
    ;(i.setAttribute('title', n.swapSubtitleLanguages),
      i.setAttribute('aria-label', n.swapSubtitleLanguages),
      a.setAttribute('title', n.changeSubtitleFontSize),
      a.setAttribute('aria-label', n.changeSubtitleFontSize))
  }
  toggleSwap() {
    ;((this.swapped = !this.swapped),
      (this.captionBox.style.transform = 'scale(0.95)'),
      setTimeout(() => {
        this.captionBox.style.transform = 'scale(1)'
      }, 150),
      this.render(this.currentCue))
  }
  cycleFontSize() {
    if (((this.fontSizeLevel = (this.fontSizeLevel + 1) % 3), this.fontSizeLevel === 0)) {
      ;((this.linePrimary.style.fontSize = '18px'), (this.lineSecondary.style.fontSize = '12px'))
      return
    }
    if (this.fontSizeLevel === 1) {
      ;((this.linePrimary.style.fontSize = '24px'), (this.lineSecondary.style.fontSize = '16px'))
      return
    }
    ;((this.linePrimary.style.fontSize = '32px'), (this.lineSecondary.style.fontSize = '20px'))
  }
  render(t) {
    var o
    if (((this.currentCue = t), !t || !this.isRenderingEnabled())) {
      this.hide()
      return
    }
    const n = t.text,
      i = (o = t.translation) == null ? void 0 : o.trim()
    if (!i || i === n) {
      ;((this.linePrimary.textContent = n),
        (this.lineSecondary.textContent = ''),
        this.setLookupData(this.linePrimary, t.sourceLanguage, t.lookupContext || n),
        this.setLookupData(this.lineSecondary, void 0, void 0),
        this.updateSecondaryVisibility(),
        this.updateCaptionMaxWidth(),
        this.container.classList.remove('hidden'))
      return
    }
    const a = this.resolvePrimaryLine(),
      r = a === 'source' ? n : i,
      s = a === 'source' ? i : n
    ;((this.linePrimary.textContent = r),
      (this.lineSecondary.textContent = s),
      a === 'source'
        ? (this.setLookupData(this.linePrimary, t.sourceLanguage, t.lookupContext || n),
          this.setLookupData(this.lineSecondary, t.targetLanguage, i))
        : (this.setLookupData(this.linePrimary, t.targetLanguage, i),
          this.setLookupData(this.lineSecondary, t.sourceLanguage, t.lookupContext || n)),
      this.updateSecondaryVisibility(),
      this.updateCaptionMaxWidth(),
      this.container.classList.remove('hidden'))
  }
  setLookupData(t, n, i) {
    ;(n ? (t.dataset.wordySubtitleLanguage = n) : delete t.dataset.wordySubtitleLanguage,
      i ? (t.dataset.wordySubtitleContext = i) : delete t.dataset.wordySubtitleContext)
  }
  hide() {
    this.container.classList.add('hidden')
  }
  isRenderingEnabled() {
    return this.youtubeBilingualSubtitlesEnabled && this.enhancementActive
  }
  resolvePrimaryLine() {
    return this.swapped ? (this.primaryLine === 'source' ? 'translation' : 'source') : this.primaryLine
  }
  observeHostResize(t) {
    ;(this.resizeObserver && (this.resizeObserver.disconnect(), (this.resizeObserver = null)),
      !(typeof ResizeObserver > 'u') &&
        ((this.resizeObserver = new ResizeObserver(() => this.updateCaptionMaxWidth())),
        this.resizeObserver.observe(t)))
  }
  updateCaptionMaxWidth() {
    if (!this.hostElement) return
    const t = this.hostElement.clientWidth
    if (!t || t <= 0) return
    const n = Math.floor(t * 0.9)
    this.captionBox.style.maxWidth = `${n}px`
  }
}
const it = () => `${location.pathname}${location.search}`
class qt {
  constructor(t = {}) {
    l(this, 'tag')
    l(this, 'overlay')
    l(this, 'cues')
    l(this, 'lastIndex')
    l(this, 'currentCue')
    l(this, 'locationKey')
    l(this, 'video', null)
    l(this, 'frameId', 0)
    ;((this.tag = '[YouTube Translator][3]'),
      (this.overlay = t.overlay || new Gt()),
      (this.cues = []),
      (this.lastIndex = 0),
      (this.currentCue = null),
      (this.locationKey = it()),
      t.autoStart !== !1 &&
        (console.log(`${this.tag} scheduler init`),
        this.attachVideo(),
        this.observePageChanges(),
        this.startRenderLoop()))
  }
  setCues(t) {
    ;((this.cues = t || []),
      (this.currentCue = null),
      (this.lastIndex = 0),
      this.cues.length || this.overlay.hide(),
      console.log(`${this.tag} cues updated count=${this.cues.length}`))
  }
  patchTranslation(t, n) {
    const i = this.cues[t]
    if (!i || !n.trim()) return
    const a = { ...i, translation: n.trim() }
    ;((this.cues[t] = a), this.currentCue === i && ((this.currentCue = a), this.overlay.render(a)))
  }
  applySettings(t) {
    this.overlay.applySettings(t)
  }
  setEnhancementActive(t) {
    this.overlay.setEnhancementActive(t)
  }
  attachVideo() {
    const t = document.querySelector('video.html5-main-video') || document.querySelector('video')
    !t || t === this.video || ((this.video = t), this.overlay.attachTo(t), console.log(`${this.tag} video attached`))
  }
  observePageChanges() {
    ;(new MutationObserver(() => {
      const n = it()
      ;(n !== this.locationKey &&
        ((this.locationKey = n), this.reset(), console.log(`${this.tag} navigation detected -> reset`)),
        this.attachVideo())
    }).observe(document.body, { childList: !0, subtree: !0 }),
      document.addEventListener('yt-navigate-finish', () => this.reset(), { passive: !0 }))
  }
  startRenderLoop() {
    const t = () => {
      ;(this.renderFrame(), (this.frameId = requestAnimationFrame(t)))
    }
    t()
  }
  renderFrame() {
    if (!this.video || !this.cues.length) return
    const t = this.video.currentTime,
      n = this.lookupCue(t)
    n !== this.currentCue && ((this.currentCue = n), n ? this.overlay.render(n) : this.overlay.hide())
  }
  lookupCue(t) {
    const n = this.lookupCueIndex(t)
    return n < 0 ? null : this.cues[n] || null
  }
  lookupCueIndex(t) {
    var a
    if (!this.cues.length) return -1
    const n = this.lastIndex
    if (n < this.cues.length) {
      const r = this.cues[n]
      if (r && t >= r.start && t <= r.end) return n
    }
    if ((t < (((a = this.cues[n]) == null ? void 0 : a.start) ?? 0) ? -1 : 1) < 0) {
      for (let r = Math.max(0, n - 1); r >= 0; r -= 1) {
        const s = this.cues[r]
        if (t >= s.start && t <= s.end) return ((this.lastIndex = r), r)
      }
      return -1
    }
    for (let r = n; r < this.cues.length; r += 1) {
      const s = this.cues[r]
      if (t >= s.start && t <= s.end) return ((this.lastIndex = r), r)
      if (t < s.start) break
    }
    return -1
  }
  reset() {
    ;(this.setCues([]),
      (this.currentCue = null),
      this.overlay.hide(),
      this.attachVideo(),
      console.log(`${this.tag} reset completed`))
  }
}
async function Jt(e) {
  if (te(e.url)) return 'translated-track'
  const t = rt(e.learningLanguage),
    n = rt(e.nativeLanguage),
    i = e.cues.filter((s) => s.text.trim()).slice(0, 8)
  if (!i.length) return 'single-language'
  let a = 0
  t && n && t.family !== n.family && !Qt(t.family, n.family)
    ? (a = i.filter((s) => t.pattern.test(s.text) && n.pattern.test(s.text)).length)
    : e.detectLanguage &&
      i.length >= 2 &&
      (a = (await Promise.all(i.map((o) => Zt(o.text, e.detectLanguage)))).filter(
        (o) => o.some((u) => at(u, e.learningLanguage)) && o.some((u) => at(u, e.nativeLanguage)),
      ).length)
  const r = Math.max(2, Math.ceil(i.length * 0.6))
  return a >= r ? 'bilingual' : 'single-language'
}
async function Zt(e, t) {
  const n = e
    .split(/\n+/)
    .map((a) => a.trim())
    .filter((a) => a.length >= 2)
  return n.length < 2
    ? []
    : (
        await Promise.all(
          n.map(async (a) => {
            try {
              return await t(a)
            } catch {
              return
            }
          }),
        )
      )
        .map((a) => f(a))
        .filter((a) => !!(a && a !== 'und'))
}
function at(e, t) {
  const n = f(e),
    i = f(t)
  if (!n || !i) return !1
  const a = n.split('-')[0],
    r = i.split('-')[0]
  return a !== r ? !1 : a !== 'zh' ? !0 : n === 'zh' || i === 'zh' || n === i
}
function Qt(e, t) {
  return new Set([e, t]).size === 2 && [e, t].every((n) => n === 'han' || n === 'japanese-kana')
}
function te(e) {
  try {
    return !!new URL(e, 'https://www.youtube.com').searchParams.get('tlang')
  } catch {
    return !1
  }
}
function rt(e) {
  const t = f(e).split('-')[0],
    n = {
      zh: { family: 'han', pattern: /[\u3400-\u4dbf\u4e00-\u9fff]/ },
      ja: { family: 'japanese-kana', pattern: /[\u3040-\u30ff]/ },
      ko: { family: 'hangul', pattern: /[\uac00-\ud7af]/ },
      ru: { family: 'cyrillic', pattern: /[\u0400-\u04ff]/ },
      ar: { family: 'arabic', pattern: /[\u0600-\u06ff]/ },
      hi: { family: 'devanagari', pattern: /[\u0900-\u097f]/ },
    }
  return n[t]
    ? n[t]
    : ['en', 'es', 'fr', 'de', 'pt', 'it', 'tr'].includes(t)
      ? { family: 'latin', pattern: /[A-Za-zÀ-ÖØ-öø-ÿ]/ }
      : null
}
function ee(e) {
  return e === 'CANCELLED' || e === 'SUPERSEDED' ? 'retry' : Tt(e) ? 'pause-combination' : 'skip-cue'
}
function gt(e, t) {
  return (
    e.learningLanguage !== t.learningLanguage ||
    e.nativeLanguage !== t.nativeLanguage ||
    e.youtubeBilingualSubtitlesEnabled !== t.youtubeBilingualSubtitlesEnabled
  )
}
function ne(e, t, n) {
  const i = []
  for (let a = 0; a < e.length; a += 1) {
    const r = e[a]
    if (!(r.end < t - 0.5) && (r.start > t + n.windowSeconds || (i.push(a), i.length >= n.maxCues))) break
  }
  return i
}
function ie(e, t) {
  var r, s
  const n = e[t]
  if (!n) return ''
  if (n.text.length >= 30) return n.text
  const a = [(r = e[t - 1]) == null ? void 0 : r.text, n.text, (s = e[t + 1]) == null ? void 0 : s.text]
    .filter((o) => !!o)
    .join(' ')
    .trim()
    .replace(/\s+/g, ' ')
  return a.length <= 220 ? a : n.text
}
function st(e, t, n, i) {
  return e === n && t === i
}
function ae(e, t) {
  let n = 2166136261
  for (let i = 0; i < t.length; i += 1) ((n ^= t.charCodeAt(i)), (n = Math.imul(n, 16777619)))
  return `${e}|${t.length}|${n >>> 0}`
}
const re = 'YT_TRANSLATOR_CHANNEL',
  se = { subtitlePayload: 'SUBTITLE_PAYLOAD' },
  $ = '[Wordy][YouTube]',
  oe = 60,
  le = 10,
  ue = 24,
  ce = 3
let h,
  F = null,
  c = xt,
  H = !1,
  C = null,
  k = '',
  M = '',
  v = '',
  d = [],
  T = !1,
  N = 0,
  L = !0,
  D = 0,
  _ = 0,
  P = 0,
  z = null,
  ot = 0
const w = new Map(),
  O = new Set(),
  R = new Map()
let B = ''
function Me() {
  if (window.__ytTranslatorBootstrapped) {
    console.warn(`${$} bootstrap skipped (already initialized)`)
    return
  }
  ;((window.__ytTranslatorBootstrapped = !0),
    (h = new qt()),
    h.applySettings(c),
    h.setEnhancementActive(!1),
    de(),
    pe(),
    ge(),
    fe(),
    xe(),
    ye(),
    he())
}
async function he() {
  try {
    const e = await Lt()
    ;(gt(c, e) && x(!1), (c = e), (H = !0), W('settings:init'))
  } catch (e) {
    console.warn(`${$} failed to initialize settings`, e)
  }
}
function de() {
  if (document.documentElement.querySelector('script[data-yt-translator-hook]')) return
  const e = document.createElement('script')
  ;((e.src = chrome.runtime.getURL(Et)),
    (e.async = !1),
    (e.dataset.ytTranslatorHook = 'true'),
    (document.head || document.documentElement).appendChild(e),
    e.remove())
}
function ge() {
  var e, t
  ;(t = (e = chrome.storage) == null ? void 0 : e.onChanged) == null ||
    t.addListener((n, i) => {
      i !== 'sync' ||
        !St(n) ||
        Ct().then((a) => {
          const r = c.youtubeBilingualSubtitlesEnabled !== a.youtubeBilingualSubtitlesEnabled,
            s = gt(c, a)
          if (((c = a), s)) {
            ;(x(!1), r && b('settings:enablement-changed'), W('settings:changed'))
            return
          }
          b('settings:changed')
        })
    })
}
function fe() {
  chrome.runtime.onMessage.addListener((e) => {
    const t = e
    if ((t == null ? void 0 : t.type) !== Y.resourcesReady) return !1
    const n = pt(t.payload.languagePair.learningLanguage, t.payload.languagePair.nativeLanguage)
    return (n && n === B && n === j() && ((B = ''), x(!1), b('resources:ready')), !1)
  })
}
function pe() {
  window.addEventListener('message', (e) => {
    if (e.source !== window) return
    const { channel: t, type: n, payload: i } = e.data || {}
    if (t !== re || n !== se.subtitlePayload || !(i != null && i.text) || typeof i.url != 'string') return
    const a = ae(i.url, i.text)
    a !== F && ((F = a), me(i, a))
  })
}
function me(e, t) {
  const n = Nt(e.text)
  n.length &&
    ((C = { url: e.url, cues: n, signature: t }),
    (M = e.url),
    (v = t),
    (k = I(e.url).lang),
    (d = []),
    (T = !1),
    x(!0),
    b('track:classifying'),
    W('track:new'))
}
async function W(e) {
  const t = C
  if (!t) {
    b(e)
    return
  }
  N += 1
  const n = N,
    i = c.learningLanguage,
    a = c.nativeLanguage
  let r
  try {
    r = await Jt({ url: t.url, cues: t.cues, learningLanguage: i, nativeLanguage: a, detectLanguage: Ce })
  } catch (s) {
    ;(console.warn(`${$} subtitle capability detection failed`, s), (r = 'single-language'))
  }
  n !== N ||
    (C == null ? void 0 : C.signature) !== t.signature ||
    i !== c.learningLanguage ||
    a !== c.nativeLanguage ||
    ((k = I(t.url).lang),
    (M = t.url),
    (v = t.signature),
    r === 'translated-track' || r === 'bilingual' ? ((T = !0), (d = [])) : ((T = !1), (d = t.cues)),
    x(!1),
    b(`track:${r}:${e}`))
}
function b(e) {
  h.applySettings(c)
  const t = k || I(M).lang,
    n = ct(t, c),
    i = !!(H && c.youtubeBilingualSubtitlesEnabled && !T && L && d.length && t && n && !ht(n, t))
  if ((h.setEnhancementActive(i), !i)) {
    ;(h.setCues([]), console.debug(`${$} enhancement paused reason=${e}`))
    return
  }
  ;(h.setCues(
    d.map((a, r) => ({
      ...a,
      sourceLanguage: t,
      targetLanguage: n,
      lookupContext: ie(d, r),
      translation: R.get(X(a.text, t, n)),
    })),
  ),
    ft())
}
function ye() {
  ;(_ && clearInterval(_), (_ = window.setInterval(ft, 350)))
}
function ft() {
  if (!H || !h.video || !d.length || T || !c.youtubeBilingualSubtitlesEnabled || !L || j() === B) return
  const e = h.video.currentTime
  ;(z !== null && Math.abs(e - z) > 5 && x(!1), (z = e))
  const t = k || I(M).lang,
    n = ct(t, c)
  if (!t || !n || ht(t, n)) return
  const i = ne(d, e, { windowSeconds: oe, maxCues: ue })
  for (const a of i) {
    if (w.size >= ce) break
    const r = d[a],
      s = X(r.text, t, n),
      o = R.get(s)
    if (o) {
      h.patchTranslation(a, o)
      continue
    }
    if (w.has(a) || O.has(a)) continue
    const u = r.start <= e + le ? 'youtube-current' : 'youtube-prefetch'
    be(a, t, n, u, P, v)
  }
}
async function be(e, t, n, i, a, r) {
  const s = d[e]
  if (s) {
    ;(w.set(e, a), (ot += 1))
    try {
      const o = await ut({
        type: Y.translate,
        payload: {
          id: `youtube-${ot}`,
          scene: i,
          text: s.text,
          languageEvidence: { language: t, source: 'subtitle' },
          languagePair: { learningLanguage: c.learningLanguage, nativeLanguage: c.nativeLanguage },
        },
      })
      if (!st(a, r, P, v)) return
      if (!o.ok) {
        const u = ee(o.error)
        u === 'pause-combination' ? (B = j()) : u === 'skip-cue' && O.add(e)
        return
      }
      ;(R.set(X(s.text, t, n), o.data.translation), h.patchTranslation(e, o.data.translation))
    } catch (o) {
      ;(console.warn(`${$} cue translation failed scene=${i}`, o), st(a, r, P, v) && O.add(e))
    } finally {
      w.get(e) === a && w.delete(e)
    }
  }
}
function xe() {
  const e = () => {
    const t = lt()
    t !== L && ((L = t), L || x(!1), b('cc:changed'))
  }
  ;((L = lt()),
    D && clearInterval(D),
    (D = window.setInterval(e, 500)),
    document.addEventListener(
      'yt-navigate-finish',
      () => {
        ;((N += 1),
          x(!0),
          (C = null),
          (d = []),
          (k = ''),
          (M = ''),
          (v = ''),
          (F = null),
          (T = !1),
          b('youtube:navigate'))
      },
      { passive: !0 },
    ))
}
function lt() {
  const e = document.querySelector('.ytp-subtitles-button')
  if (!e) return !1
  const t = e.getAttribute('aria-pressed')
  return t === 'true' ? !0 : t === 'false' ? !1 : e.classList.contains('ytp-button-active')
}
function I(e) {
  if (!e) return { lang: '', tlang: '' }
  try {
    const t = new URL(e, window.location.origin)
    return {
      lang: f(t.searchParams.get('lang')) || f(Se(t.searchParams.get('vssId'))),
      tlang: f(t.searchParams.get('tlang')),
    }
  } catch {
    return { lang: '', tlang: '' }
  }
}
function Se(e) {
  const t = e == null ? void 0 : e.match(/([a-z]{2,3}(?:-[a-z0-9]{2,8})?)$/i)
  return (t == null ? void 0 : t[1]) || ''
}
function x(e) {
  ;((P += 1),
    w.clear(),
    O.clear(),
    (z = null),
    ut({ type: Y.cancelScope, payload: { scope: 'youtube' } }).catch(() => {}),
    e && R.clear())
}
function X(e, t, n) {
  return `${t}\0${n}\0${e.trim().replace(/\s+/g, ' ')}`
}
function j() {
  return pt(c.learningLanguage, c.nativeLanguage)
}
function pt(e, t) {
  return `${f(e)}\0${f(t)}`
}
function Ce(e) {
  return new Promise((t) => {
    var n
    if (!((n = chrome.i18n) != null && n.detectLanguage)) {
      t(void 0)
      return
    }
    chrome.i18n.detectLanguage(e, (i) => {
      if (chrome.runtime.lastError || !(i != null && i.isReliable)) {
        t(void 0)
        return
      }
      const a = [...(i.languages || [])]
        .sort((r, s) => s.percentage - r.percentage)
        .find((r) => f(r.language) !== 'und')
      t(a == null ? void 0 : a.language)
    })
  })
}
export { Me as bootstrap }
