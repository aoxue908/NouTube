import type { SettingsSnapshot } from '@/states/settings'
import type { ContentSettings } from './state'

/*
 * Read straight off the stored settings without importing `@/states/settings`,
 * which would pull legend-state, i18next and every locale into the two bundles
 * that run inside youtube.com. The defaults match the app's own.
 */
type RawSettings = Partial<SettingsSnapshot> | undefined

const bool = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback)

export const getContentSettings = (settings: RawSettings): ContentSettings => ({
  sponsorBlock: bool(settings?.sponsorBlock, true),
  blockAds: bool(settings?.blockAds, true),
  playbackRate: typeof settings?.playbackRate === 'number' ? settings.playbackRate : 1,
  playbackQuality: typeof settings?.playbackQuality === 'string' ? settings.playbackQuality : 'auto',
  disableAutoplay: bool(settings?.disableAutoplay),
  // The mini player, the double-tap gesture, on-device translation and system
  // caption styles are all driven by the native shell.
  miniPlayer: false,
  showDislikes: bool(settings?.showDislikes),
  showOriginalVideoTitle: bool(settings?.showOriginalVideoTitle),
  doubleTapToToggleHeader: false,
  translateComments: false,
  replaceWatchNavigation: bool(settings?.replaceWatchNavigation),
  captionStyle: null,
  interactiveSubtitles: bool(settings?.interactiveSubtitles),
  interactiveSubtitleStyle: settings?.interactiveSubtitleStyle === 'rolling' ? 'rolling' : 'karaoke',
  interactiveSubtitleColor:
    typeof settings?.interactiveSubtitleColor === 'string' && settings.interactiveSubtitleColor
      ? settings.interactiveSubtitleColor
      : '#ffd54a',
  interactiveSubtitleTextColor:
    typeof settings?.interactiveSubtitleTextColor === 'string' && settings.interactiveSubtitleTextColor
      ? settings.interactiveSubtitleTextColor
      : '#ffffff',
  interactiveSubtitleFontSize:
    typeof settings?.interactiveSubtitleFontSize === 'number' && Number.isFinite(settings.interactiveSubtitleFontSize)
      ? Math.min(64, Math.max(0, settings.interactiveSubtitleFontSize))
      : 0,
  interactiveSubtitleFontFamily:
    ['default', 'serif', 'mono', 'rounded'].includes(settings?.interactiveSubtitleFontFamily as string)
      ? (settings!.interactiveSubtitleFontFamily as 'default' | 'serif' | 'mono' | 'rounded')
      : 'default',
  interactiveSubtitlePosition:
    typeof settings?.interactiveSubtitlePosition === 'number' && Number.isFinite(settings.interactiveSubtitlePosition)
      ? Math.min(70, Math.max(2, settings.interactiveSubtitlePosition))
      : 12,
})

export const getHideShorts = (settings: RawSettings) => bool(settings?.hideShorts, true)
export const getPreferH264 = (settings: RawSettings) => bool(settings?.preferH264)
export const getClickbaitThumbnail = (settings: RawSettings) =>
  ['hq1', 'hq2', 'hq3'].includes(settings?.clickbaitThumbnail || '') ? (settings!.clickbaitThumbnail as string) : 'default'
