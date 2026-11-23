/**
 * Capture YouTube's own caption responses in the page context.
 *
 * Wordy 2.0.1 hooks fetch/XHR for /api/timedtext (and videoplayback?...text=)
 * and forwards the raw body to its content script. We run in the same context,
 * so the hooks live in content/intercept.ts; this module only stores the last
 * payload and notifies the subtitle layer. It is a fallback for videos whose
 * player response has no captionTracks (or whose direct caption fetch fails).
 */

export const CAPTION_CAPTURE_EVENT = 'nou:caption-capture'

export interface CaptionCapture {
  url: string
  text: string
  videoId: string
  at: number
}

const CAPTION_URL_RE = /(\/api\/timedtext)|(videoplayback\?.*\btext=)/iu

let lastCapture: CaptionCapture | null = null

export const isCaptionRequestUrl = (value: unknown): boolean =>
  typeof value === 'string' && CAPTION_URL_RE.test(value)

/** A tlang= body is a translation gloss, not the original track. Feeding it
 *  back into the subtitle layer would both swap the language and recurse. */
export const isTranslationCaptionUrl = (url: string): boolean => /[?&]tlang=/iu.test(url)

const videoIdFromUrl = (url: string): string => {
  try {
    return new URL(url, window.location.href).searchParams.get('v') ?? ''
  } catch {
    return ''
  }
}

export const notifyCaptionPayload = (url: string, text: string): void => {
  if (!isCaptionRequestUrl(url) || !text || !text.trim()) return
  const capture: CaptionCapture = {
    url,
    text,
    videoId: videoIdFromUrl(url),
    at: Date.now(),
  }
  // Keep the ORIGINAL track as the stored fallback even when a translation
  // gloss arrives later (the subtitle layer also ignores tlang separately).
  if (!isTranslationCaptionUrl(url)) lastCapture = capture
  try {
    window.dispatchEvent(new CustomEvent<CaptionCapture>(CAPTION_CAPTURE_EVENT, { detail: capture }))
  } catch {
    /* the subtitle layer may not be installed yet; loadSubtitles reads it later */
  }
}

export const getLastCaptionPayload = (): CaptionCapture | null => lastCapture
