import { getEnabledUserStyleCss } from '../lib/user-styles'
import { getCaptionCss } from './captions'
import { noutubeSettingsEvent, noutubeUserStylesEvent } from './noutube'

const injectedStyleId = '_nou_injected_css'

const css = (strings: string[] | ArrayLike<string>, ...values: any[]) => String.raw({ raw: strings }, ...values)

const cssContentMobile = css`
  /*
   * Text zoom (webView textZoom) scales fonts but not the fixed pixel heights
   * YouTube hardcodes on its text containers, so zoomed titles/headlines get
   * clipped. Drop those height clamps so the boxes grow with the text;
   * -webkit-line-clamp still truncates long titles to the intended line count.
   *
   * The player is excluded: its own class list carries title-related flags
   * (ytp-hide-fullscreen-title), and forcing height:auto on #movie_player
   * collapses it to 0, clipping the video away.
   */
  :is(
      [class*='headline' i],
      [class*='title' i],
      [class*='subhead' i],
      [class*='channel-name' i]
    ):not(#movie_player, #movie_player *) {
    height: auto !important;
    max-height: none !important;
  }

  /*
   * YouTube's control scrim fades to fully transparent at the bottom, but the
   * progress bar sits ~80% down, so the track (white at 35% alpha) disappears
   * over a bright frame. Darken the bottom and outline the bar to keep it and
   * the SponsorBlock segments readable.
   */
  #player-control-overlay .player-controls-background::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0) 35%);
    pointer-events: none;
  }

  #player-control-overlay .ytPlayerProgressBarHost {
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.6));
  }

  /*
   * YouTube Music mobile: when minimized to the bottom player bar,
   * YouTube Music's collapse selector typo leaves ytmusic-app-layout fixed and
   * leaves full player page backgrounds and overlays active over browsing content.
   */
  ytmusic-app-layout[player-ui-state='PLAYER_BAR_ONLY'] {
    position: static !important;
    animation: none !important;
    transform: none !important;
  }

  ytmusic-player-page[player-ui-state='PLAYER_BAR_ONLY'] {
    visibility: hidden !important;
    background: transparent !important;
    pointer-events: none !important;
  }

  ytmusic-player-page[player-ui-state='PLAYER_BAR_ONLY'] ytmusic-player {
    visibility: visible !important;
    pointer-events: auto !important;
  }

  /*
   * YouTube Music mobile fullscreen sizes the player to 56.25vw (16:9 of the
   * width), which overflows the screen vertically on phones wider than 16:9.
   */
  ytmusic-player[player-ui-state='FULLSCREEN'][is-mweb-modernization-enabled][video-mode] {
    height: min(56.25vw, 100vh) !important;
  }

  #_nou_fullscreen_title {
    display: none;
  }

  #player-container-id:fullscreen #_nou_fullscreen_title {
    display: block;
    position: absolute;
    top: 14px;
    left: 24px;
    right: 192px;
    z-index: 2;
    overflow: hidden;
    color: white;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
  }

  /*
   * Newer YouTube ships its own fullscreen title inside
   * player-fullscreen-top-controls, but keeps the whole host visibility:hidden
   * until the "More videos" panel opens. Unhide just the title (not the close
   * button next to it) and drop ours, otherwise both stack in the same corner.
   * Scoped to .fadein because the controls hide by flipping visibility, and a
   * title forced visible would stay burned over the video.
   */
  #player-container-id:fullscreen
    #player-control-overlay.fadein
    .ytwPlayerFullscreenTopControlsFullscreenControlsVideoTitle {
    visibility: visible;
    /*
     * The title box spans the full width, under the top-right control cluster.
     * YouTube gets away with that because the whole host is hidden; once we
     * make the title visible it starts hit-testing and swallows taps on the
     * captions and settings buttons, so it has to stay inert like ours.
     */
    pointer-events: none;
    /*
     * Its flex parent only reserves room for the close button (40px) next to
     * the host's 12px padding, so the title still runs under the controls.
     * Back both out of the 192px inset ours uses to land on the same edge.
     */
    margin-right: 140px;
  }

  #player-container-id:fullscreen
    #player-control-overlay:has(player-fullscreen-top-controls)
    #_nou_fullscreen_title {
    display: none;
  }

  /*
   * Fullscreen controls button: only in fullscreen, and only while the controls
   * are showing, so it never burns over the video. Left edge keeps it clear of
   * the centered play/seek buttons and the top-right control cluster. Hidden
   * once the panel or the lock overlay takes over.
   *
   * --_nou_cutout_left is published by the native view (NouTubeView.kt): the
   * fullscreen window draws under the display cutout, and in landscape the
   * camera sits on a side edge at the same height as the button.
   */
  #_nou_fs_btn {
    display: none;
  }

  #player-container-id:fullscreen:has(#player-control-overlay.fadein):not(
      :has(#_nou_lock_overlay, #_nou_fs_panel)
    )
    > #_nou_fs_btn {
    display: flex;
    position: fixed;
    top: 50%;
    left: calc(16px + var(--_nou_cutout_left, 0px));
    z-index: 2147483646;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    transform: translateY(-50%);
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
  }

  /* Same chain as above so it outweighs the left-edge rule. */
  #player-container-id:fullscreen:has(#player-control-overlay.fadein):not(
      :has(#_nou_lock_overlay, #_nou_fs_panel)
    )
    > #_nou_fs_btn.right {
    left: auto;
    right: calc(16px + var(--_nou_cutout_right, 0px));
  }

  #_nou_lock_overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483647;
    touch-action: none;
    -webkit-user-select: none;
    user-select: none;
  }

  #_nou_lock_overlay ._nou_lock_unlock {
    position: absolute;
    top: 50%;
    left: calc(16px + var(--_nou_cutout_left, 0px));
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    transform: translateY(-50%);
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    opacity: 0;
    transition: opacity 0.2s;
    pointer-events: none;
  }

  #_nou_lock_overlay.right ._nou_lock_unlock {
    left: auto;
    right: calc(16px + var(--_nou_cutout_right, 0px));
  }

  #_nou_lock_overlay.reveal ._nou_lock_unlock {
    opacity: 1;
    pointer-events: auto;
  }
`

const cssAndroidDesktopWatch = css`
  /* #444: YouTube's desktop watch column can enforce a 427px minimum on a
   * phone, centering the oversized column and clipping its left edge. */
  @media (max-width: 460px) {
    ytd-watch-flexy[is-single-column] #primary.ytd-watch-flexy {
      box-sizing: border-box;
      min-width: 0 !important;
      max-width: calc(100% - var(--ytd-watch-flexy-horizontal-page-margin, 16px)) !important;
    }

    ytd-watch-flexy[is-single-column] ytd-watch-metadata #description {
      min-width: 0 !important;
    }

    ytd-app #masthead-container,
    ytd-app #masthead {
      max-width: 100vw !important;
    }
  }
`

// Shared by the Android and desktop fullscreen control panels.
const cssFullscreenPanel = css`
  /*
   * The scrim only exists to give taps outside the panel something to land on;
   * the panel's own event blocking still runs, this just keeps the hit area from
   * falling through to YouTube's own layers visually.
   */
  #_nou_fs_scrim {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
  }

  #_nou_fs_panel {
    position: fixed;
    top: 50%;
    left: calc(16px + var(--_nou_cutout_left, 0px));
    z-index: 2147483647;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-width: min(420px, calc(100vw - 32px - var(--_nou_cutout_left, 0px) - var(--_nou_cutout_right, 0px)));
    max-height: 80vh;
    overflow-y: auto;
    padding: 14px 16px;
    transform: translateY(-50%);
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.82);
    color: white;
    font-size: 13px;
    touch-action: pan-x pan-y;
    -webkit-user-select: none;
    user-select: none;
  }

  #_nou_fs_panel.right {
    left: auto;
    right: calc(16px + var(--_nou_cutout_right, 0px));
  }

  #_nou_fs_panel ._nou_fs_row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  #_nou_fs_panel ._nou_fs_label {
    flex: none;
    width: 52px;
    color: rgba(255, 255, 255, 0.7);
  }

  #_nou_fs_panel ._nou_fs_chips {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    scrollbar-width: none;
  }

  #_nou_fs_panel ._nou_fs_chips::-webkit-scrollbar {
    display: none;
  }

  #_nou_fs_panel ._nou_fs_chip {
    flex: none;
    padding: 5px 10px;
    border: none;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    color: white;
    font-size: 13px;
    line-height: 1;
  }

  #_nou_fs_panel ._nou_fs_chip.active {
    background: #4f46e5;
  }

  #_nou_fs_panel ._nou_fs_value {
    flex: none;
    width: 40px;
    color: rgba(255, 255, 255, 0.7);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  #_nou_fs_panel #_nou_fs_lock {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 10px;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.12);
    color: white;
    font-size: 14px;
  }

  #_nou_fs_panel #_nou_fs_side {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: none;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }

  /*
   * The WebView's native range widget centres its thumb on its own track
   * metrics, which do not match the 4px track we want, so draw both parts
   * ourselves. --_nou_fill is written by the panel on every input so the filled
   * portion still tracks the value without accent-color.
   */
  #_nou_fs_panel ._nou_fs_slider {
    flex: 1;
    height: 16px;
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
  }

  #_nou_fs_panel ._nou_fs_slider::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      #4f46e5 var(--_nou_fill, 0%),
      rgba(255, 255, 255, 0.3) var(--_nou_fill, 0%)
    );
  }

  #_nou_fs_panel ._nou_fs_slider::-webkit-slider-thumb {
    width: 14px;
    height: 14px;
    margin-top: -5px;
    border: none;
    border-radius: 50%;
    background: white;
    -webkit-appearance: none;
    appearance: none;
  }
`

const cssContentDesktop = css`
  /*
   * Fullscreen controls button, web player. The Android rule keys off
   * #player-container-id and the mobile control overlay, neither of which the
   * desktop site has; here the button is a direct child of whatever element
   * YouTube put into fullscreen, and fullscreen-controls.ts toggles .hidden to
   * follow the player's own autohide.
   */
  #_nou_fs_btn {
    display: none;
  }

  :fullscreen > #_nou_fs_btn {
    position: fixed;
    top: 50%;
    left: 16px;
    z-index: 2147483646;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    transform: translateY(-50%);
    border: none;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    cursor: pointer;
    opacity: 1;
    transition: opacity 0.2s;
  }

  :fullscreen > #_nou_fs_btn:hover {
    background: rgba(0, 0, 0, 0.75);
  }

  :fullscreen > #_nou_fs_btn.right {
    left: auto;
    right: 16px;
  }

  /* Faded rather than display:none so it can still be hovered back into view. */
  :fullscreen > #_nou_fs_btn.hidden {
    opacity: 0;
  }

  /*
   * A mouse cannot swipe a chip strip, and shift+wheel is not something to make
   * the only way to reach the last few chips, so wrap them instead of scrolling
   * on desktop.
   */
  #_nou_fs_panel ._nou_fs_chips {
    flex-wrap: wrap;
    overflow-x: visible;
  }

  /* Once the chips wrap, the label belongs beside the first row of them, not
     centred against the whole block. 23px is a chip's height: 13px of text plus
     its 5px padding. */
  #_nou_fs_panel ._nou_fs_row:has(._nou_fs_chips) {
    align-items: flex-start;
  }

  #_nou_fs_panel ._nou_fs_row:has(._nou_fs_chips) ._nou_fs_label {
    line-height: 23px;
  }

  #_nou_fs_panel ._nou_fs_chip,
  #_nou_fs_panel #_nou_fs_side {
    cursor: pointer;
  }

  #_nou_fs_panel ._nou_fs_chip:hover:not(.active) {
    background: rgba(255, 255, 255, 0.24);
  }

  #_nou_fs_panel #_nou_fs_side:hover {
    background: rgba(255, 255, 255, 0.24);
  }
`

// Only injected while ad blocking is on; with it off the ads YouTube serves are
// left visible (see getCoreCss).
const cssContentAds = css`
  ytd-page-top-ad-layout-renderer,
  ytd-in-feed-ad-layout-renderer,
  ad-slot-renderer,
  yt-mealbar-promo-renderer,
  ytm-promoted-sparkles-web-renderer,
  .ytd-player-legacy-desktop-watch-ads-renderer {
    display: none !important;
  }

  /* Ads are normally dropped from the feed data, but if one still renders, hide
   * its grid cell too, otherwise the hidden ad leaves a blank tile behind. */
  ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
  ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer),
  ytd-rich-section-renderer:has(ytd-ad-slot-renderer),
  ytd-rich-section-renderer:has(ytd-statement-banner-renderer),
  ytd-item-section-renderer:has(ytd-ad-slot-renderer),
  ytm-rich-item-renderer:has(ad-slot-renderer),
  ytm-item-section-renderer:has(ad-slot-renderer),
  ytd-rich-item-renderer:has(ad-slot-renderer),
  ytd-rich-item-renderer:has(.ytwFeedAdMetadataViewModelHostMetadata) {
    display: none !important;
  }
`

const cssContent = css`
  a.app-install-link,
  a.yt-spec-button-shape-next {
    display: none !important;
  }

  #_nou_livechat {
    width: 100%;
    height: 50vh;
    position: fixed;
    bottom: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid #e5e5e5;
    background: white;
    z-index: 10;
  }
  #_nou_livechat.right {
    width: 36vw;
    height: 100%;
    top: 0;
    bottom: 0;
    right: 0;
    border-top: none;
    border-left: 1px solid #e5e5e5;
  }

  #_nou_livechat > button {
    position: absolute;
    top: 1.25rem;
    left: 50%;
    transform: translateX(-50%);
  }

  #_nou_livechat_loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  #_nou_livechat iframe {
    position: relative;
    flex: 1;
    border: none;
  }

  ._nou_replay_panel {
    display: flex;
    flex-direction: column;
    min-height: 0;
    height: 100%;
    color: #0f0f0f;
    font-size: 14px;
  }
  ._nou_replay_panel header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
    min-height: 56px;
    box-sizing: border-box;
    padding: 6px 12px 6px 16px;
    border-bottom: 1px solid #e5e5e5;
    font-size: 16px;
    font-weight: 600;
  }
  ._nou_replay_panel header ._nou_livechat_close {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  ._nou_replay_panel header ._nou_livechat_close:is(:hover, :active) {
    background: #f2f2f2;
  }
  ._nou_replay_panel header ._nou_livechat_close:focus-visible {
    outline: 2px solid #606060;
    outline-offset: -4px;
  }
  ._nou_replay_panel header ._nou_livechat_close svg {
    width: 20px;
    height: 20px;
  }
  ._nou_replay_panel p {
    padding: 0.5rem 1rem;
  }
  ._nou_replay_messages {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    padding: 0.5rem 1rem;
  }
  ._nou_replay_message {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 0;
    overflow-wrap: anywhere;
  }
  ._nou_replay_message small,
  ._nou_replay_message strong {
    color: #606060;
    margin-right: 6px;
  }
  ._nou_replay_avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  ._nou_replay_emoji {
    width: 20px;
    height: 20px;
    vertical-align: middle;
  }
  ._nou_replay_sticker {
    display: block;
    width: 64px;
    height: 64px;
    object-fit: contain;
    margin-top: 4px;
  }
  ._nou_replay_retry {
    align-self: flex-start;
    margin: 0 1rem 0.5rem;
    padding: 0.5rem 1rem;
  }

  #_nou_livechat_btn {
    padding: 0.75rem 1rem;
    background: #e1002d;
    color: white;
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    border-radius: 18px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 16px;
  }

  .quick-actions-wrapper.enable-rtl-mirroring {
    display: none !important;
  }

  #_nou_audio_btn {
    display: flex;
    align-items: center;
    background: #34d399;
    padding: 0 4px;
    color: #44403c;
    border-radius: 4px;
    margin-left: 8px;
  }
  #_nou_audio_picker {
    position: absolute;
    top: 1rem;
    left: 1rem;
  }
  #_nou_audio_picker select {
    border: none;
    background: #a7f3d0;
    color: #44403c;
    padding: 2px;
  }

  ._nou_sb_segments {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
  ._nou_sb_segment {
    position: absolute;
    top: 0;
    height: 100%;
    opacity: 0.85;
  }
`

/*
 * Karaoke word-highlight layer. The container is mounted inside #movie_player,
 * so it automatically follows fullscreen / mini-player / layout changes. When
 * our layer is active we hide YouTube's native caption text to avoid showing
 * the same line twice; the ROOT_CLASS is toggled from content/karaoke.ts only
 * once a caption payload has loaded successfully, so captions never vanish
 * because of a fetch failure.
 */
const cssInteractiveSubtitles = css`
  /*
   * ONE layer holds every element the subtitle feature draws, mounted as a
   * direct child of the fullscreen element (see content/subtitle-host.ts).
   * YouTube's control overlay covers the whole player and hit-tests above
   * anything appended into #movie_player, so without this layer the toolbar,
   * panels, word card and tappable words are visible but never receive a tap.
   *
   * Above all YouTube chrome, but below our own fullscreen panel / lock
   * overlay (2147483646+). pointer-events:none keeps the layer itself from
   * stealing taps: only real controls opt back in.
   */
  #_nou_sub_layer {
    position: absolute;
    inset: 0;
    z-index: 2147483000;
    pointer-events: none;
    -webkit-user-select: none;
    user-select: none;
  }

  /* Only make native captions transparent while our layer is drawing. We must
     NOT use display:none: YouTube keeps updating the caption DOM as words are
     spoken, and that text is our real-time word-timing source when the caption
     endpoint is unreachable. Native captions are never structurally modified. */
  .nou-subtitles-active .ytp-caption-window-container,
  .nou-subtitles-active .ytp-caption-container,
  .nou-subtitles-active .ytp-caption-container-background,
  .nou-subtitles-active .caption-window,
  .nou-subtitles-active .captions-text,
  .nou-subtitles-active .ytp-caption-overlay {
    opacity: 0 !important;
    pointer-events: none !important;
  }

  #_nou_subtitles {
    position: absolute;
    left: 0;
    right: 0;
    bottom: var(--nou-sub-bottom, 12%);
    z-index: 2147483001;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 2px;
    padding: 0 6%;
    box-sizing: border-box;
    pointer-events: none;
    --nou-sub-color: #ffd54a;
    --nou-sub-text-color: #ffffff;
    --nou-sub-rt-color: var(--nou-sub-text-color, #fff);
    --nou-sub-translation-color: var(--nou-sub-text-color, #fff);
  }

  .nou-sub-line {
    max-width: 100%;
    text-align: center;
    font-size: var(--nou-sub-font-size, clamp(16px, 3.6vw, 34px));
    font-family: var(--nou-sub-font-family, inherit);
    line-height: 1.35;
    font-weight: 600;
    color: var(--nou-sub-text-color, #fff);
    text-shadow:
      -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
      0 2px 6px rgba(0, 0, 0, 0.9);
    unicode-bidi: plaintext;
    /* Keep the caption's own spacing exactly as supplied. Without this, a
       trailing space next to a <ruby> annotation is collapsed and words glue
       together ("usedtoeat"). pre-wrap still allows normal line wrapping. */
    white-space: pre-wrap;
    /* The line itself is the drag handle; words remain individual tap targets. */
    pointer-events: auto;
    touch-action: none;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
  }
  #_nou_subtitles.nou-sub-dragging .nou-sub-line { cursor: grabbing; }

  .nou-sub-line:empty { display: none; }

  /* Every word is a tap target for the dictionary lookup. */
  .nou-sub-word {
    pointer-events: auto;
    cursor: pointer;
    border-radius: 3px;
    opacity: 0.92;
    transition: color 0.12s ease-out, opacity 0.12s ease-out, background-color 0.12s ease-out;
  }
  .nou-sub-word:hover { background-color: rgba(255, 255, 255, 0.2); }
  .nou-sub-word:active { background-color: rgba(255, 255, 255, 0.36); }

  /* Phonetics: a small IPA line above the word, drawn as a ruby annotation.
     The rt keeps its own colour so an active (highlighted) word does not turn
     the annotation yellow along with it. */
  /* A CJK sentence is one "word" but MANY ruby segments; ruby-align:center
     keeps each reading centred over its own character instead of stretching
     the whole line, and nowrap stops a long romaji reading from wrapping. */
  .nou-sub-word ruby { ruby-position: over; ruby-align: center; }
  .nou-sub-word rt {
    font-size: 0.46em;
    white-space: nowrap;
    font-weight: 500;
    line-height: 1;
    color: var(--nou-sub-rt-color, var(--nou-sub-text-color, #fff));
    opacity: 0.82;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
    letter-spacing: 0;
    user-select: none;
    -webkit-user-select: none;
  }

  .nou-sub-word--active {
    color: var(--nou-sub-color, #ffd54a) !important;
    opacity: 1;
    text-shadow:
      -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
      0 0 14px rgba(0, 0, 0, 0.9);
  }
  /* Karaoke OFF: a plain rolling line must never colour a word, even if a
     stale .--active class survives the style switch for one frame. Declared
     with the id so it also beats the translation / paper-theme variants. */
  #_nou_subtitles.nou-sub-rolling .nou-sub-word--active,
  #_nou_subtitles.nou-sub-rolling .nou-sub-line--trans .nou-sub-word--active {
    color: var(--nou-sub-text-color, #fff) !important;
    opacity: 0.92;
  }

  /* "rolling" style: a soft rise on each NEW complete sentence. No cached
     previous line, no black block and no ">>" marker -- the reference
     product's two-line block CC look came from a streaming ASR recogniser
     (its partial results can roll back), which does not apply here. */
  #_nou_subtitles.nou-sub-rolling .nou-sub-line {
    animation: nou-sub-rise 0.22s ease-out;
  }
  @keyframes nou-sub-rise {
    from { transform: translateY(9px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  /* Line alignment. Declared after the rolling rules so it can override that
     style's flex-start anchoring. */
  #_nou_subtitles.nou-sub-align--left { align-items: flex-start; }
  #_nou_subtitles.nou-sub-align--center { align-items: center; }
  #_nou_subtitles.nou-sub-align--right { align-items: flex-end; }
  #_nou_subtitles.nou-sub-align--left .nou-sub-line { text-align: left; }
  #_nou_subtitles.nou-sub-align--center .nou-sub-line { text-align: center; }
  #_nou_subtitles.nou-sub-align--right .nou-sub-line { text-align: right; }

  #_nou_subtitles_hint {
    position: absolute;
    left: 50%;
    top: 14%;
    transform: translateX(-50%);
    z-index: 2147483002;
    max-width: 80%;
    padding: 8px 12px;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.72);
    color: #fff;
    font: 500 13px/1.4 sans-serif;
    text-align: center;
    pointer-events: none;
  }

  /* ---- translation line (bilingual / translation-only display) ---- */
  .nou-sub-line--trans {
    font-size: var(--nou-sub-translation-size, 18px) !important;
    font-weight: 500;
    opacity: 0.94;
    color: var(--nou-sub-translation-color, var(--nou-sub-text-color, #fff));
  }
  .nou-sub-line--trans .nou-sub-word { cursor: pointer; }
  .nou-sub-line--trans .nou-sub-word--active {
    color: var(--nou-sub-color, #ffd54a) !important;
  }

  /* ---- themes: outline (default) / just shadow / paper note ---- */
  #_nou_subtitles.nou-sub-theme--shadow .nou-sub-line {
    text-shadow: 0 3px 10px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.9) !important;
  }
  #_nou_subtitles.nou-sub-theme--paper .nou-sub-line {
    display: inline-block;
    width: fit-content;
    padding: 6px 14px;
    border-radius: 6px;
    background: linear-gradient(180deg, #f7f1dc 0%, #efe7c9 100%);
    color: #23201a !important;
    text-shadow: none !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
    font-weight: 600;
  }
  #_nou_subtitles.nou-sub-theme--paper .nou-sub-word--active {
    color: #b3541e !important;
    background: rgba(255, 213, 74, 0.75);
    text-shadow: none !important;
  }
  #_nou_subtitles.nou-sub-theme--paper .nou-sub-line--trans {
    background: rgba(247, 241, 220, 0.9);
    color: #4a4335 !important;
  }

  /* ---- subtitle settings entry (left-edge vertical column) ---- */
  /* Same 40x40 dark translucent disc as #_nou_fs_btn (the fullscreen tuner
     button). Only appears while YouTube's own controls are shown, so it never
     burns over the video during playback. syncEntryPosition() stacks it
     directly above the tuner button in the same left-edge column. */
  .nou-sub-entry-wrap {
    position: absolute;
    z-index: 2147483010;
    width: 40px;
    height: 40px;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.18s ease-out, visibility 0.18s ease-out;
  }
  .nou-sub-entry-wrap.is-visible {
    opacity: 1;
    visibility: visible;
  }
  .nou-sub-entry {
    appearance: none;
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    cursor: pointer;
    pointer-events: auto;
    -webkit-tap-highlight-color: transparent;
  }
  .nou-sub-entry:hover { background: rgba(0, 0, 0, 0.75); }
  .nou-sub-entry:active,
  .nou-sub-entry.is-open { background: rgba(0, 0, 0, 0.82); }
  .nou-sub-entry svg {
    width: 24px;
    height: 24px;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.7));
  }

  /* Subtitle settings popover -- EXACTLY the #_nou_fs_panel design language
     (reference screenshot): flat black 82% panel, 14px radius, plain white
     13px text, neutral pills and #4f46e5 for the active one. No glass blur,
     no purple-tinted surface, no uppercase lavender section labels. */
  .nou-sub-menu {
    --nou-accent: #4f46e5;
    --nou-accent-soft: rgba(79, 70, 229, 0.32);
    position: absolute;
    /* Vertically centred on the button, exactly like #_nou_fs_panel. Opening
       from the button's top edge used to push the menu past the bottom of the
       screen on landscape phones. */
    top: 50%;
    transform: translateY(-50%);
    right: calc(100% + 10px);
    z-index: 2147483011;
    display: none;
    box-sizing: border-box;
    width: min(360px, calc(100vw - 88px));
    max-height: min(76vh, 560px);
    overflow-y: auto;
    overscroll-behavior: contain;
    touch-action: pan-y;
    padding: 14px 16px;
    border: none;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.82);
    box-shadow: none;
    color: #fff;
    font: 400 13px/1.4 system-ui, -apple-system, sans-serif;
    pointer-events: auto;
  }
  .nou-sub-menu.is-open { display: block; }
  /* Left-edge column: popover opens to the RIGHT of the button. A right-edge
     column opens leftward; a low button flips the popover upward. */
  .nou-sub-entry-wrap.menu-left .nou-sub-menu {
    right: auto;
    left: calc(100% + 10px);
  }
  .nou-sub-menu-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  .nou-sub-menu-title { font-weight: 700; font-size: 15px; color: #fff; letter-spacing: 0; }
  .nou-sub-menu-close {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
  }
  .nou-sub-menu-section + .nou-sub-menu-section { margin-top: 12px; }
  .nou-sub-menu-section-title {
    margin-bottom: 8px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0;
    text-transform: none;
  }
  .nou-sub-menu-subtitle {
    margin: 4px 0 6px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
  }

  .nou-sub-tb-panel-body { display: flex; flex-direction: column; gap: 12px; }
  .nou-sub-tb-group { display: flex; gap: 6px; }
  /* Same pill as #_nou_fs_panel ._nou_fs_chip: neutral 12% white, plain white
     13px label, solid #4f46e5 when active. No glow, no heavy bold. */
  .nou-sub-tb-btn {
    flex: 1;
    appearance: none;
    border: 0;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    padding: 5px 10px;
    border-radius: 999px;
    font: 400 13px/1.2 system-ui, -apple-system, sans-serif;
    cursor: pointer;
    text-align: center;
    transition: background-color 0.15s ease-out;
  }
  .nou-sub-tb-btn:hover { background: rgba(255, 255, 255, 0.24); }
  .nou-sub-tb-btn.is-active {
    background: var(--nou-accent, #4f46e5);
    color: #fff;
  }
  .nou-sub-tb-row {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .nou-sub-tb-row-label {
    flex: 0 0 84px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.7);
    font-size: 13px;
  }
  .nou-sub-tb-row .nou-sub-tb-group { flex: 1; min-width: 150px; }
  .nou-sub-tb-select {
    flex: 1 1 auto;
    min-width: 0;
    max-width: 100%;
    min-height: 34px;
    padding: 5px 10px;
    border: 0;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    font: 400 13px/1.3 system-ui, -apple-system, sans-serif;
    cursor: pointer;
  }
  /* Android WebView renders <option> with the system picker, which ignores
     our dark panel. Without an explicit light scheme it shows white-on-white. */
  .nou-sub-tb-select option,
  .nou-sub-tb-select optgroup { background: #fff; color: #111; }
  .nou-sub-tb-swatches { flex: 1; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .nou-sub-tb-swatch {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.28);
    background: rgba(255, 255, 255, 0.12);
    cursor: pointer;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    line-height: 1;
    transition: transform 0.12s ease-out, border-color 0.12s ease-out;
  }
  .nou-sub-tb-swatch:hover { transform: scale(1.1); }
  .nou-sub-tb-swatch.is-active {
    border-color: #fff;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
  }
  .nou-sub-tb-swatch.is-default {
    background: rgba(255, 255, 255, 0.08);
    border-style: dashed;
  }
  .nou-sub-tb-row-hint { flex: 0 0 100%; }
  .nou-sub-tb-note {
    color: rgba(255, 255, 255, 0.55);
    font-size: 11.5px;
    line-height: 1.5;
  }
  .nou-sub-tb-slider-row { display: flex; align-items: center; gap: 10px; }
  .nou-sub-tb-a { font-size: 16px; font-weight: 500; color: rgba(255, 255, 255, 0.7); min-width: 26px; text-align: center; }
  .nou-sub-tb-a.small { font-size: 12px; min-width: 36px; color: rgba(255, 255, 255, 0.7); }
  /* Draw our own track + thumb: WebView range metrics never line up, and the
     indigo fill has to track the value without relying on accent-color. */
  .nou-sub-tb-range {
    flex: 1;
    height: 16px;
    margin: 0;
    padding: 0;
    border: none;
    outline: none;
    box-shadow: none;
    background: transparent;
    -webkit-appearance: none;
    appearance: none;
  }
  .nou-sub-tb-range::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(
      to right,
      var(--nou-accent, #4f46e5) var(--nou-fill, 50%),
      rgba(255, 255, 255, 0.3) var(--nou-fill, 50%)
    );
  }
  .nou-sub-tb-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    margin-top: -5px;
    border: none;
    border-radius: 50%;
    background: #fff;
    cursor: pointer;
  }
  .nou-sub-tb-theme-cards { display: flex; gap: 9px; }
  .nou-sub-tb-theme-card {
    flex: 1;
    appearance: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 13px 4px;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    font: inherit;
    transition: border-color 0.15s ease-out, box-shadow 0.15s ease-out;
  }
  .nou-sub-tb-theme-card.is-active {
    border-color: var(--nou-accent, #4f46e5);
  }
  .nou-sub-tb-theme-name { font-weight: 700; font-size: 13px; }
  .nou-sub-tb-theme-sub { font-size: 10px; opacity: 0.7; }
  .nou-sub-tb-theme--outline { background: #1b1f1d; color: #fff; text-shadow: 1px 1px 0 #000; }
  .nou-sub-tb-theme--shadow { background: #222826; color: #fff; text-shadow: 0 3px 6px #000; }
  .nou-sub-tb-theme--paper { background: linear-gradient(180deg, #f7f1dc, #e6d9ae); color: #2a2620; }

  /* ---- tap-a-word card (instant in-page feedback) ---- */
  .nou-sub-tb-wordcard {
    position: absolute;
    z-index: 2147483012;
    display: none;
    box-sizing: border-box;
    width: min(300px, calc(100vw - 32px));
    padding: 16px 18px 15px;
    border: none;
    border-radius: 14px;
    background: rgba(0, 0, 0, 0.82);
    box-shadow: none;
    color: #f3f6f4;
    font: 400 13px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
    pointer-events: auto;
  }
  .nou-sub-tb-word {
    margin-bottom: 2px;
    color: #fff;
    font-size: 20px;
    font-weight: 650;
    line-height: 1.2;
    letter-spacing: -0.2px;
  }
  /* Readings sit centered directly above their own character (ruby over). */
  .nou-sub-tb-word ruby { ruby-position: over; ruby-align: center; }
  .nou-sub-tb-word rt {
    font-size: 10px;
    font-weight: 500;
    line-height: 1;
    color: #9fb0a8;
    letter-spacing: 0;
    user-select: none;
    -webkit-user-select: none;
  }

  /* Two independent pronunciation groups: UK (type=1) and US (type=2). */
  .nou-sub-tb-word-phonetics {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 10px 0 12px;
  }
  .nou-sub-tb-word-ph-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 24px;
  }
  .nou-sub-tb-word-ph-tag {
    flex: 0 0 auto;
    min-width: 23px;
    height: 19px;
    line-height: 19px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.08);
    color: #9fb0a8;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-align: center;
  }
  .nou-sub-tb-word-ph-text {
    flex: 1 1 auto;
    min-width: 0;
    color: #c6d1cb;
    font-size: 13px;
    font-style: italic;
    letter-spacing: 0.1px;
    overflow-wrap: anywhere;
  }

  /* Lightweight icon buttons: no circular outlines, same weight as the text. */
  .nou-sub-tb-word-speak {
    appearance: none;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: #a6b5ad;
    cursor: pointer;
    transition: background-color 0.15s ease-out, color 0.15s ease-out;
  }
  .nou-sub-tb-word-speak:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
  .nou-sub-tb-word-speak svg { width: 16px; height: 16px; }
  .nou-wave { opacity: 0; transform-origin: 12px 12px; }
  .nou-sub-tb-word-speak.is-playing {
    color: #ffd36e;
    background: rgba(255, 211, 110, 0.12);
    animation: nou-speak-pulse 0.9s ease-in-out infinite;
  }
  .nou-sub-tb-word-speak.is-playing .nou-wave { animation: nou-wave 1s ease-out infinite; }
  .nou-sub-tb-word-speak.is-playing .nou-wave--2 { animation-delay: 0.25s; }
  @keyframes nou-speak-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(255, 211, 110, 0.32); }
    50% { box-shadow: 0 0 0 5px rgba(255, 211, 110, 0); }
  }
  @keyframes nou-wave {
    0% { opacity: 0; transform: scale(0.75); }
    30% { opacity: 1; }
    100% { opacity: 0; transform: scale(1.3); }
  }

  .nou-sub-tb-word-meaning {
    color: #ffd36e;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
  }

  /* Dictionary example: a soft card, English + Chinese + a small speaker. */
  .nou-sub-tb-word-example {
    margin-top: 13px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.12);
  }
  .nou-sub-tb-word-example-en {
    color: #edf2ef;
    font-size: 13px;
    line-height: 1.55;
  }
  .nou-sub-tb-word-example-zh {
    margin-top: 5px;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    line-height: 1.5;
  }
  /* The example speaker must stay IN THE SAME TEXT FLOW as the English
     sentence, right after its last word. The base button is display:grid
     (a block-level grid), which used to force it onto a line of its own --
     exactly the "restart line" screenshot. inline-grid keeps it inline. */
  .nou-sub-tb-word-speak--inline {
    display: inline-grid;
    vertical-align: -4px;
    width: 18px;
    height: 18px;
    margin-left: 5px;
  }
  .nou-sub-tb-word-speak--inline svg { width: 13px; height: 13px; }
`

export const getCoreCss = () => {
  // The Android app is the only shell with the mobile control overlay; the
  // Electron webview and the browser extension both render the plain web
  // player, so they share the same fullscreen button and panel rules.
  const isApp = Boolean(window.NouTubeI)
  const isAndroid = window.isAndroid && !window.NouTubeIOS
  const blockAds = window.NouTube?.getSettings?.()?.blockAds !== false
  return (
    (blockAds ? cssContentAds : '') +
    cssContent +
    (isApp ? cssContentMobile : cssContentDesktop) +
    (isAndroid ? cssAndroidDesktopWatch : '') +
    cssFullscreenPanel +
    cssInteractiveSubtitles
  )
}

export const getInjectedCss = (userStyles?: any) => {
  return [getCoreCss(), getCaptionCss(), getEnabledUserStyleCss(document.location.host, userStyles)]
    .filter(Boolean)
    .join('\n\n')
}

export function injectCSS() {
  const style = document.querySelector<HTMLStyleElement>(`#${injectedStyleId}`) || document.createElement('style')

  const update = () => {
    const userStyles = window.NouTube?.getUserStyles?.()
    style.textContent = getInjectedCss(userStyles)
  }

  style.id = injectedStyleId
  style.type = 'text/css'
  update()
  ;(document.head || document.documentElement).appendChild(style)
  window.addEventListener(noutubeSettingsEvent, update)
  window.addEventListener(noutubeUserStylesEvent, update)
}

export function hideShorts() {
  const style = document.createElement('style')
  style.id = 'noutube-shorts'
  style.type = 'text/css'
  style.textContent = `
ytm-reel-shelf-renderer,
ytd-reel-shelf-renderer,
.ytGridShelfViewModelHost,
grid-shelf-view-model,
ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
ytm-shorts-lockup-view-model,
yt-lockup-view-model:has(a[href^='/shorts']),
ytd-video-renderer:has(a[href^='/shorts']),
ytm-video-with-context-renderer:has(a[href^='/shorts']) {
  display: none !important;
}
`
  document.head.appendChild(style)
}

export function showShorts() {
  document.querySelector('style#noutube-shorts')?.remove()
}
