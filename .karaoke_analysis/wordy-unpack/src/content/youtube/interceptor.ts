/**
 * interceptor.ts
 *
 * This script is injected into the page context to intercept network requests.
 * It hooks `window.fetch` and `XMLHttpRequest` to capture subtitle data from YouTube's API
 * and sends it to the content script via `window.postMessage`.
 */

(() => {
  const CHANNEL = 'YT_TRANSLATOR_CHANNEL';
  const PAYLOAD_TYPE = 'SUBTITLE_PAYLOAD';
  const FLAG = '__YT_TRANSLATOR_HOOKED__';
  const TIMEDTEXT_RE = /(\/api\/timedtext)|(videoplayback\?.*\btext=)/i;

  if (window[FLAG]) {
    console.warn('[YouTube Translator][6] hook already installed');
    return;
  }
  window[FLAG] = true;
  console.log('[YouTube Translator][6] installing hooks');

  /**
   * Sends the captured subtitle data to the content script.
   */
  function notify(url: string, text: string) {
    if (!text) {
      return;
    }
    window.postMessage({
      channel: CHANNEL,
      type: PAYLOAD_TYPE,
      payload: { url, text }
    }, '*');
  }

  /**
   * Checks if the request URL corresponds to a YouTube subtitle endpoint.
   */
  function isSubtitleRequest(url: any): boolean {
    return typeof url === 'string' && TIMEDTEXT_RE.test(url);
  }

  /**
   * Hooks `window.fetch` to intercept subtitle requests.
   */
  function hookFetch() {
    if (!window.fetch) {
      return;
    }
    const original = window.fetch;
    window.fetch = async function patchedFetch(...args: any[]) {
      const response = await original.apply(this, args as [RequestInfo, RequestInit | undefined]);
      try {
        const url = extractUrl(args[0]);
        if (isSubtitleRequest(url)) {
          const text = await response.clone().text();
          notify(url, text);
          console.log('[YouTube Translator][6] fetch subtitle captured');
        }
      } catch (error) {
        console.warn('[YouTube Translator] fetch hook error', error);
      }
      return response;
    };
  }

  /**
   * Hooks `XMLHttpRequest` to intercept subtitle requests.
   */
  function hookXHR() {
    const open = XMLHttpRequest.prototype.open;
    const send = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function patchedOpen(method: string, url: string | URL, ...rest: any[]) {
      (this as any).__ytTranslatorUrl = extractUrl(url);
      return open.apply(this, [method, url, ...rest] as any);
    };

    XMLHttpRequest.prototype.send = function patchedSend(...args: any[]) {
      this.addEventListener('load', () => {
        if (this.status !== 200) {
          return;
        }
        const url = (this as any).__ytTranslatorUrl;
        if (!isSubtitleRequest(url)) {
          return;
        }
        try {
          const text = typeof this.responseText === 'string' ? this.responseText : this.response;
          notify(url, text);
          console.log('[YouTube Translator][6] xhr subtitle captured');
        } catch (error) {
          console.warn('[YouTube Translator] xhr hook error', error);
        }
      });
      return send.apply(this, args as [Document | XMLHttpRequestBodyInit | null | undefined]);
    };
  }

  /**
   * Helper to extract the URL string from various input types.
   */
  function extractUrl(input: any): string {
    if (typeof input === 'string') {
      return input;
    }
    if (input && typeof input === 'object') {
      if (input.url) {
        return input.url;
      }
      if (input.href) {
        return input.href;
      }
    }
    return '';
  }

  hookFetch();
  hookXHR();
})();
