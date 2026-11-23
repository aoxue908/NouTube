var t,e;"function"==typeof(t=globalThis.define)&&(e=t,t=null),function(e,r,o,a,n){var i="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},l="function"==typeof i[a]&&i[a],A=l.cache||{},c="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function s(t,r){if(!A[t]){if(!e[t]){var o="function"==typeof i[a]&&i[a];if(!r&&o)return o(t,!0);if(l)return l(t,!0);if(c&&"string"==typeof t)return c(t);var n=Error("Cannot find module '"+t+"'");throw n.code="MODULE_NOT_FOUND",n}p.resolve=function(r){var o=e[t][1][r];return null!=o?o:r},p.cache={};var d=A[t]=new s.Module(t);e[t][0].call(d.exports,p,d,d.exports,this)}return A[t].exports;function p(t){var e=p.resolve(t);return!1===e?{}:s(e)}}s.isParcelRequire=!0,s.Module=function(t){this.id=t,this.bundle=s,this.exports={}},s.modules=e,s.cache=A,s.parent=l,s.register=function(t,r){e[t]=[function(t,e){e.exports=r},{}]},Object.defineProperty(s,"root",{get:function(){return i[a]}}),i[a]=s;for(var d=0;d<r.length;d++)s(r[d]);if(o){var p=s(o);"object"==typeof exports&&"undefined"!=typeof module?module.exports=p:"function"==typeof t&&t.amd?t(function(){return p}):n&&(this[n]=p)}}({bmhKW:[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"config",()=>c);var a=t("~/theme"),n=t("~/theme/cursors"),i=t("~/theme/win98"),l=t("~/fontRegistry"),A=t("~/Fonts");let c={matches:["https://www.youtube.com/*"],run_at:"document_start",all_frames:!1},s="snowball-theme",d="snowball_yt_var_names",p=null,m="default",h={},g=t=>t.enabled&&"custom"===t.activePresetId&&null!=t.customHue&&null!=t.customChroma;function u(t,e){let r="",o=(0,a.presetForConfig)(t);if(o&&(r+=(0,a.buildThemeCSS)(o,h)),"default"!==e){let t=(0,l.getFontStack)(e);r+=`
/* snowball global font */
html, ytd-app, ytd-page-manager, ytd-page-manager *, ytd-guide-renderer, ytd-guide-renderer *, ytd-masthead, ytd-masthead *, tp-yt-app-drawer, tp-yt-app-drawer * {
  font-family: ${t} !important;
}
`}if(t.squareCorners&&(r+=`
/* snowball square corners */
* {
  border-radius: 0px !important;
  border-top-left-radius: 0px !important;
  border-top-right-radius: 0px !important;
  border-bottom-left-radius: 0px !important;
  border-bottom-right-radius: 0px !important;
}
`),t.cursorStyle&&"default"!==t.cursorStyle){let e=(0,n.getCursorById)(t.cursorStyle);e&&(r+=(0,n.buildCursorCSS)(e))}return t.win98Mode&&(r+=(0,i.buildWin98CSS)()),(0,a.chatSkinEnabled)(t)&&(r+=(0,a.buildChatFrameCSS)(t)),r}function b(t){let e=document.head||document.documentElement,r=document.getElementById(s);if(!t){r?.remove();return}r||((r=document.createElement("style")).id=s,e.appendChild(r)),r.textContent!==t&&(r.textContent=t),r.parentNode!==e&&e.appendChild(r)}function y(){p&&(function(t){let e=document.documentElement,{hue:r,chroma:o}=(0,a.themeAccent)(t);e.style.setProperty("--theme-hue",r.toString()),e.style.setProperty("--theme-chroma",o.toString());let n=(0,a.themeSurface)(t);e.style.setProperty("--theme-surface-hue",n.hue.toString()),e.style.setProperty("--theme-surface-chroma",n.chroma.toString())}(p),document.documentElement.toggleAttribute("data-snowball-win98",!!p.win98Mode),b(u(p,m)))}let w=!1;function f(t=0){if(0===t){if(w)return;w=!0}if(!p||!g(p)){w=!1;return}let e=(0,a.discoverYtVarNames)();if(!e){t<6?setTimeout(()=>f(t+1),500*2**t):w=!1;return}w=!1,JSON.stringify(e)!==JSON.stringify(h)&&(h=e,chrome.storage.local.set({[d]:e}),y())}let k=["data-snowball-text-cursor","data-snowball-link-cursor","data-snowball-native-cursor"];(async function(){p=await (0,a.loadThemeConfig)(),await (0,A.refreshFontLanguages)(),await new Promise(t=>{chrome.storage.local.get(["ui_font_family",d],e=>{m=e.ui_font_family||"default",e[d]&&"object"==typeof e[d]&&(h=e[d]),t()})}),y(),f(),function(){let t=document.head||document.documentElement,e=new MutationObserver(()=>{if(!p)return;let t=u(p,m);if(!t)return;let e=document.getElementById(s);e||b(t)});e.observe(t,{childList:!0})}(),chrome.storage.onChanged.addListener((t,e)=>{if("local"!==e)return;let r=!1;if(t[a.THEME_STORAGE_KEY]){let e=t[a.THEME_STORAGE_KEY].newValue;p=e??{enabled:!1,activePresetId:"default"},r=!0}t.ui_font_family&&(m=t.ui_font_family.newValue||"default",r=!0),(0,A.FONT_LANGUAGE_KEYS).some(e=>t[e])&&(0,A.refreshFontLanguages)().then(y),r&&y(),t[a.THEME_STORAGE_KEY]&&f()}),document.addEventListener("yt-navigate-finish",()=>y()),function(){let t=null,e=()=>{if(t){for(let e of k)t.removeAttribute(e);t=null}};document.addEventListener("mouseover",r=>{if(!p?.cursorStyle||"default"===p.cursorStyle){e();return}let o=r.target;if(!o||1!==o.nodeType)return;let a=!!o.closest('a, button, [role="button"], label, select, summary'),n=!1;if(!a){let t=Array.from(o.childNodes).some(t=>3===t.nodeType&&t.textContent&&t.textContent.trim().length>0),e="none"!==getComputedStyle(o).userSelect;n=t&&e}n||a||(n=!!o.closest("input, textarea, [contenteditable]"));let i=!1;if(!n&&!a){let t=o.style.cursor||"";["grab","grabbing","move","resize","n-resize","s-resize","e-resize","w-resize","ne-resize","nw-resize","se-resize","sw-resize","ew-resize","ns-resize","nesw-resize","nwse-resize","col-resize","row-resize","wait","progress","help","not-allowed","no-drop","zoom-in","zoom-out","crosshair"].includes(t)&&(i=!0)}t!==o&&e(),o.toggleAttribute("data-snowball-text-cursor",n),o.toggleAttribute("data-snowball-link-cursor",a),o.toggleAttribute("data-snowball-native-cursor",i),t=o},!0)}()})()},{"~/theme":"4sYvr","~/theme/cursors":"eIZL3","~/theme/win98":"eS4Gk","~/fontRegistry":"kFvPd","~/Fonts":"4OKnj","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4sYvr":[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"THEME_STORAGE_KEY",()=>a.THEME_STORAGE_KEY),o.export(r,"buildThemeCSS",()=>n.buildThemeCSS),o.export(r,"discoverYtVarNames",()=>i.discoverYtVarNames),o.export(r,"generateCustomPreset",()=>l.generateCustomPreset),o.export(r,"presetForConfig",()=>l.presetForConfig),o.export(r,"buildChatFrameCSS",()=>A.buildChatFrameCSS),o.export(r,"buildChatSkinCSS",()=>A.buildChatSkinCSS),o.export(r,"chatSkinEnabled",()=>A.chatSkinEnabled),o.export(r,"themeAccent",()=>A.themeAccent),o.export(r,"themeSkinOn",()=>A.themeSkinOn),o.export(r,"themeSurface",()=>A.themeSurface),o.export(r,"withThemeDefaults",()=>c),o.export(r,"loadThemeConfig",()=>s),o.export(r,"saveThemeConfig",()=>d);var a=t("./tokens"),n=t("./css-builder"),i=t("./yt-vars"),l=t("./preset-generator"),A=t("./chat-skin");function c(t){return t&&"object"==typeof t?{...a.DEFAULT_THEME_CONFIG,...t}:{...a.DEFAULT_THEME_CONFIG}}function s(){return new Promise(t=>{chrome.storage.local.get([a.THEME_STORAGE_KEY],e=>t(c(e[a.THEME_STORAGE_KEY])))})}function d(t){return new Promise(e=>{chrome.storage.local.set({[a.THEME_STORAGE_KEY]:t},()=>e())})}},{"./tokens":"6V6Su","./css-builder":"4TZno","./yt-vars":"4kCCU","./preset-generator":"4Viv9","./chat-skin":"dmhS3","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"6V6Su":[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"THEME_STORAGE_KEY",()=>a),o.export(r,"DEFAULT_THEME_CONFIG",()=>n);let a="snowball_theme",n={enabled:!1,activePresetId:"default"}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],cHUbl:[function(t,e,r){r.interopDefault=function(t){return t&&t.__esModule?t:{default:t}},r.defineInteropFlag=function(t){Object.defineProperty(t,"__esModule",{value:!0})},r.exportAll=function(t,e){return Object.keys(t).forEach(function(r){"default"===r||"__esModule"===r||e.hasOwnProperty(r)||Object.defineProperty(e,r,{enumerable:!0,get:function(){return t[r]}})}),e},r.export=function(t,e,r){Object.defineProperty(t,e,{enumerable:!0,get:r})}},{}],"4TZno":[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"buildThemeCSS",()=>A);var a=t("./token-map"),n=t("./selectors"),i=t("./preset-generator");function l(t,e,r,o){let l=[...t.panel?[`  --snowball-panel-bg: ${(0,i.panelCss)(t.panel)};`]:[],...t.panelActive?[`  --snowball-panel-active-bg: ${t.panelActive};`]:[]],A=[function(t,e){let r=[];for(let o of Object.keys(a.TOKEN_TO_YT_VARS)){let n=[...a.TOKEN_TO_YT_VARS[o],...e[o]??[]],i=t[o];if(n.length&&null!=i)for(let t of n)r.push(`  ${t}: ${i} !important;`)}return r.join("\n")}(t.yt,o),...l].join("\n"),c=function({yt:t,pageGradient:e,pageGradientReversed:r},o){let a=new Map;for(let i of n.DIRECT_OVERRIDE_RULES){let l;let A=i.literal??t[i.tokenKey];if(null==A)continue;let c=i.pageSurface?i.reversed?r:e:void 0,s=c?`background: ${c} fixed ${A} !important;`:`${i.property}: ${A} !important;`;l=i.selector===n.ROOT_SELECTOR?o:i.selector.split(",").map(t=>`${o} ${t.trim()}`).join(", ");let d=a.get(l)??[];d.push(s),a.set(l,d)}let i=[];for(let[t,e]of a)i.push(`${t} {
  ${e.join("\n  ")}
}`);return i.join("\n\n")}(t,e);return`/* ${e} */
${e}, ${e} ytd-app, ${e} ${r} {
${A}
}

${c}`}function A(t,e={}){let r=["/* snowball theme \u2014 generated, do not edit by hand */"];return t.dark&&r.push(l(t.dark,"html[dark]","[dark]",e)),t.light&&r.push(l(t.light,"html:not([dark])","[light]",e)),r.join("\n\n")+"\n"}},{"./token-map":"gwa09","./selectors":"55zpY","./preset-generator":"4Viv9","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],gwa09:[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"TOKEN_TO_YT_VARS",()=>a);let a={bgPrimary:["--yt-sys-color-baseline--base-background","--yt-sys-color-baseline--solid-background","--yt-spec-base-background","--yt-spec-general-background-a"],bgSecondary:["--yt-sys-color-baseline--raised-background","--yt-sys-color-baseline--tonal-background","--yt-spec-general-background-b","--yt-spec-raised-background"],bgElevated:["--yt-sys-color-baseline--menu-background","--yt-sys-color-baseline--overlay-solid-background","--yt-spec-menu-background","--yt-spec-brand-background-primary"],textPrimary:["--yt-sys-color-baseline--text-primary","--yt-spec-text-primary","--ytd-searchbox-text-color","--ytd-icon-color"],textSecondary:["--yt-sys-color-baseline--text-secondary","--yt-spec-text-secondary"],textMuted:["--yt-sys-color-baseline--text-disabled","--yt-spec-text-disabled"],accent:["--yt-sys-color-baseline--call-to-action","--yt-sys-color-baseline--call-to-action-hover","--yt-spec-call-to-action","--yt-spec-themed-blue"],border:["--yt-sys-color-baseline--outline","--yt-sys-color-baseline--outline-opaque","--yt-sys-color-baseline--outline-rim","--yt-spec-outline","--yt-spec-10-percent-layer","--ytd-searchbox-border-color"],chipBg:["--yt-sys-color-baseline--button-chip-background-hover","--yt-spec-badge-chip-background","--yt-sys-color-baseline--suggested-action","--yt-spec-call-to-action-inverse","--yt-spec-brand-button-background","--yt-spec-suggested-action"],chipBgActive:[],chipText:[],chipTextActive:[],headerBg:["--yt-sys-color-baseline--solid-background","--yt-spec-brand-background-solid"],searchBg:["--ytd-searchbox-background"]}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"55zpY":[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"ROOT_SELECTOR",()=>a),o.export(r,"DIRECT_OVERRIDE_RULES",()=>n);let a="html",n=[{selector:a,property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"ytd-app",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#background.ytd-masthead",property:"background",tokenKey:"bgPrimary",pageSurface:!0,reversed:!0},{selector:"ytd-tabbed-page-header tp-yt-app-toolbar",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#container.ytd-searchbox",property:"background-color",tokenKey:"searchBg"},{selector:"#container.ytd-searchbox",property:"border-color",tokenKey:"border"},{selector:".ytSearchboxComponentInputBox",property:"background-color",tokenKey:"searchBg"},{selector:".ytSearchboxComponentInputBox",property:"border-color",tokenKey:"border"},{selector:".ytSearchboxComponentSearchButton",property:"background-color",tokenKey:"chipBg"},{selector:".ytSearchboxComponentSearchButton",property:"border-color",tokenKey:"border"},{selector:".ytSearchboxComponentSuggestionsContainer",property:"background-color",tokenKey:"bgElevated"},{selector:"ytd-guide-renderer #guide-inner-content",property:"background",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#contentContainer.tp-yt-app-drawer",property:"background",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#guide-content.ytd-app",property:"background",tokenKey:"bgPrimary",pageSurface:!0},{selector:"ytd-page-manager",property:"color",tokenKey:"textPrimary"},{selector:"ytd-masthead",property:"color",tokenKey:"textPrimary"},{selector:"ytd-guide-renderer",property:"color",tokenKey:"textPrimary"},{selector:"ytd-guide-renderer #endpoint, ytd-guide-renderer tp-yt-paper-item, ytd-guide-renderer #guide-section-title, #guide-content",property:"color",tokenKey:"textPrimary"},{selector:"ytd-mini-guide-renderer",property:"color",tokenKey:"textPrimary"},{selector:"ytd-mini-guide-entry-renderer",property:"color",tokenKey:"textPrimary"},{selector:"ytd-page-manager yt-formatted-string, ytd-page-manager #video-title, ytd-page-manager #channel-name",property:"color",tokenKey:"textPrimary"},{selector:"ytd-page-manager a.yt-simple-endpoint:not(ytd-author-comment-badge-renderer a)",property:"color",tokenKey:"textPrimary"},{selector:".ytLockupMetadataViewModelTitle, .ytLockupMetadataViewModelTitle .ytAttributedStringHost",property:"color",tokenKey:"textPrimary"},{selector:".ytContentMetadataViewModelMetadataInline span, .ytContentMetadataViewModelMetadataInline a, .ytAttributedStringLinkCallToAction",property:"color",tokenKey:"textSecondary"},{selector:"ytd-page-manager #metadata-line span, ytd-page-manager #byline-container, ytd-page-manager yt-formatted-string.ytd-channel-name, ytd-page-manager #published-time-text",property:"color",tokenKey:"textSecondary"},{selector:"ytd-page-manager #subscriber-count, ytd-page-manager #info-strings",property:"color",tokenKey:"textMuted"},{selector:"#subscribe-button yt-button-shape button",property:"background-color",tokenKey:"chipBg"},{selector:"#subscribe-button yt-button-shape button.ytSpecButtonShapeNextFilled, #subscribe-button yt-button-shape button.yt-spec-button-shape-next--filled",property:"background-color",tokenKey:"accent"},{selector:"#subscribe-button yt-button-shape button.ytSpecButtonShapeNextFilled, #subscribe-button yt-button-shape button.yt-spec-button-shape-next--filled",property:"color",tokenKey:"bgPrimary"},{selector:"#notification-preference-button button",property:"background-color",tokenKey:"chipBg"},{selector:"button.ytSpecButtonShapeNextTonal",property:"background-color",tokenKey:"chipBg"},{selector:"button.ytSpecButtonShapeNextOutline",property:"background-color",tokenKey:"bgPrimary"},{selector:".button-container.ytd-rich-shelf-renderer",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"ytd-merch-shelf-renderer .arrow",property:"background-color",tokenKey:"bgElevated"},{selector:"ytd-merch-shelf-renderer .arrow",property:"color",tokenKey:"textPrimary"},{selector:"ytd-merch-shelf-renderer .arrow",property:"box-shadow",tokenKey:"bgElevated",literal:"none"},{selector:"ytd-merch-shelf-renderer .arrow, ytd-merch-shelf-renderer #left-arrow-container, ytd-merch-shelf-renderer #right-arrow-container",property:"margin",tokenKey:"bgElevated",literal:"0"},{selector:".ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment",property:"background-color",tokenKey:"accent"},{selector:".ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment",property:"background-image",tokenKey:"accent",literal:"none"},{selector:".ytp-swatch-background-color",property:"background",tokenKey:"accent"},{selector:"yt-chip-cloud-chip-renderer .ytChipShapeChip",property:"background",tokenKey:"chipBg"},{selector:"yt-chip-cloud-chip-renderer .ytChipShapeChip",property:"color",tokenKey:"chipText"},{selector:"yt-chip-cloud-chip-renderer.iron-selected .ytChipShapeChip, yt-chip-cloud-chip-renderer[selected] .ytChipShapeChip",property:"background",tokenKey:"chipBgActive"},{selector:"yt-chip-cloud-chip-renderer.iron-selected .ytChipShapeChip, yt-chip-cloud-chip-renderer[selected] .ytChipShapeChip",property:"color",tokenKey:"chipTextActive"},{selector:"#frosted-glass",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#chips-wrapper ytd-button-renderer",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#skip-navigation",property:"background-color",tokenKey:"bgPrimary"},{selector:"#cinematics",property:"mix-blend-mode",tokenKey:"bgPrimary",literal:"lighten"},{selector:"#cinematics canvas",property:"mask-image",tokenKey:"bgPrimary",literal:"radial-gradient(ellipse at center, oklch(0 0 0) 25%, oklch(0 0 0 / 0) 65%)"},{selector:"#cinematics canvas",property:"-webkit-mask-image",tokenKey:"bgPrimary",literal:"radial-gradient(ellipse at center, oklch(0 0 0) 25%, oklch(0 0 0 / 0) 65%)"},{selector:"tp-yt-paper-dialog, ytd-popup-container, ytd-menu-popup-renderer",property:"background-color",tokenKey:"bgElevated"},{selector:"ytd-watch-metadata[description-collapsed] #description:hover",property:"background-color",tokenKey:"chipBg",literal:"color-mix(in oklch, var(--yt-spec-badge-chip-background), var(--yt-spec-text-primary) 8%)"},{selector:"ytd-comment-renderer #body",property:"color",tokenKey:"textPrimary"},{selector:"ytd-comment-renderer #content-text",property:"color",tokenKey:"textPrimary"},{selector:"ytd-comment-renderer #author-text",property:"color",tokenKey:"textSecondary"},{selector:"#sections.ytd-guide-renderer, ytd-guide-section-renderer",property:"border-color",tokenKey:"border"},{selector:"ytd-author-comment-badge-renderer",property:"background-color",tokenKey:"bgPrimary",literal:"var(--yt-basic-background-color, inherit)"},{selector:"ytd-author-comment-badge-renderer, ytd-author-comment-badge-renderer yt-formatted-string, ytd-author-comment-badge-renderer ytd-channel-name, ytd-author-comment-badge-renderer a",property:"color",tokenKey:"textPrimary",literal:"var(--yt-basic-foreground-title-color, inherit)"}]},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4Viv9":[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"panelCss",()=>c),o.export(r,"presetForConfig",()=>s),o.export(r,"generateCustomPreset",()=>p),o.export(r,"deriveHues",()=>m);var a=t("./chat-skin");function n(t,e,r=1){return{yt:function(t,e,r=1){let o=t=>+(t*r).toFixed(4);return e?{bgPrimary:`oklch(0.16 ${o(.04)} ${t})`,bgSecondary:`oklch(0.20 ${o(.05)} ${t})`,bgElevated:`oklch(0.26 ${o(.05)} ${t})`,textPrimary:`oklch(0.93 ${o(.02)} ${t})`,textSecondary:`oklch(0.75 ${o(.04)} ${t})`,textMuted:`oklch(0.55 ${o(.03)} ${t})`,accent:`oklch(0.75 ${o(.18)} ${t})`,border:`oklch(0.30 ${o(.04)} ${t})`,chipBg:`oklch(0.24 ${o(.05)} ${t})`,chipBgActive:`oklch(0.88 ${o(.04)} ${t})`,chipText:`oklch(0.82 ${o(.04)} ${t})`,chipTextActive:`oklch(0.16 ${o(.04)} ${t})`,headerBg:`oklch(0.14 ${o(.05)} ${t})`,searchBg:`oklch(0.20 ${o(.05)} ${t})`}:{bgPrimary:`oklch(0.96 ${o(.03)} ${t})`,bgSecondary:`oklch(0.92 ${o(.04)} ${t})`,bgElevated:`oklch(0.98 ${o(.02)} ${t})`,textPrimary:`oklch(0.18 ${o(.04)} ${t})`,textSecondary:`oklch(0.38 ${o(.05)} ${t})`,textMuted:`oklch(0.55 ${o(.04)} ${t})`,accent:`oklch(0.55 ${o(.2)} ${t})`,border:`oklch(0.85 ${o(.03)} ${t})`,chipBg:`oklch(0.90 ${o(.04)} ${t})`,chipBgActive:`oklch(0.20 ${o(.04)} ${t})`,chipText:`oklch(0.22 ${o(.04)} ${t})`,chipTextActive:`oklch(0.96 ${o(.03)} ${t})`,headerBg:`oklch(0.94 ${o(.04)} ${t})`,searchBg:`oklch(0.97 ${o(.02)} ${t})`}}(t,e,r),panel:i(t,e,r,0)}}function i(t,e,r,o){return A(e?{l:.43,c:.075*r,alpha:.2}:{l:.93,c:.035*r,alpha:1},t,e,o)}let l={light:{l:1,c:0,alpha:.5},dark:{l:1,c:0,alpha:.1}};function A(t,e,r,o,a=l[r?"dark":"light"]){let n=(1-o)*t.alpha,i=o*a.alpha,A=n+i,c=(n*t.l+i*a.l)/A,s=(n*t.c+i*a.c)/A;return{color:`oklch(${+c.toFixed(4)} ${+s.toFixed(4)} ${e})`,alpha:+A.toFixed(3)}}function c({color:t,alpha:e}){return e>=1?t:t.replace(/\)$/,` / ${e})`)}function s(t){return(0,a.themeSkinOn)(t)?p(t.customHue,t.customChroma,t.enableSecondaryColor?t.customSecondaryShift??0:0,t.gradientStrength??0):null}let d={chroma:.5,lightL:.92,darkL:.21};function p(t,e,r,o=0){let a=e/.04,l=(t+r+360)%360,s=r*o,p=(t+s+360)%360,m=(n,m)=>{if(0===r)return n;let h=t=>+(t*a).toFixed(4),g=h((m?.04:.03)*(1+.8*Math.sin(Math.abs(s)*Math.PI/360))),u=m?.16:.96,b=`oklch(${u} ${g} ${t})`,y=+(u+((m?d.darkL:d.lightL)-u)*o).toFixed(4),w=+(g*(1+d.chroma*o)).toFixed(4),f=`oklch(${y} ${w} ${p})`,k=i(t,m,a,o),x=m?{l:.24,c:.05*a,alpha:1}:{l:.9,c:.04*a,alpha:1},v=c(A(x,l,m,o)),C=c(A(x,l,m,o,{l:.6,c:Math.min(5*e,.3),alpha:.2}));return{...n,panel:k,panelActive:C,...o>0?{pageGradient:`linear-gradient(155deg in oklab, ${b}, ${f})`,pageGradientReversed:`linear-gradient(335deg in oklab, ${b}, ${f})`}:{},yt:{...n.yt,accent:`oklch(${m?.75:.55} ${h(m?.18:.2)} ${l})`,chipBg:v,chipBgActive:`oklch(${m?.88:.2} ${h(.04)} ${l})`,chipTextActive:`oklch(${m?.16:.96} ${h(m?.04:.03)} ${l})`}}};return{id:"custom",light:m(n(t,!1,a),!1),dark:m(n(t,!0,a),!0)}}function m(t,e,r){if(e>.9||e<.1)return{primary:r,shift:0};let o=r-t;return o>180&&(o-=360),o<-180&&(o+=360),{primary:t,shift:o}}},{"./chat-skin":"dmhS3","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],dmhS3:[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"chatSkinEnabled",()=>a),o.export(r,"themeAccent",()=>n),o.export(r,"themeSurface",()=>i),o.export(r,"themeSkinOn",()=>l),o.export(r,"buildChatSkinCSS",()=>b),o.export(r,"buildChatFrameCSS",()=>y);let a=t=>!t.win98Mode;function n(t){if(!t.enabled||null==t.customHue)return{hue:267,chroma:.2};let e=t.enableSecondaryColor?t.customSecondaryShift??0:0;return{hue:(t.customHue+e+360)%360,chroma:null!=t.customChroma?Math.min(5*t.customChroma,.3):.2}}function i(t){return t.enabled&&"custom"===t.activePresetId&&null!=t.customHue&&null!=t.customChroma?{hue:t.customHue,chroma:t.customChroma}:{hue:0,chroma:0}}function l(t){return t.enabled&&"custom"===t.activePresetId&&null!=t.customHue&&null!=t.customChroma}let A=`
html {
  --sbc-page: oklch(1 0 0);
  /* --sbc-veil-light / -dark\uff1a\u76d6\u5728\u9875\u9762\u5e95\u8272\u4e0a\u7684\u90a3\u5c42\uff08\u989c\u8272 + \u6d53\u5ea6\uff09\uff0c\u548c\u4fa7\u8fb9\u680f\u540c\u4e00\u5c42\u3002\u9875\u9762\u6362\u4e86\u4e3b\u9898\u5e95\u8272\u65f6\u7531\u6ce8\u5165\u811a\u672c\u5199\u5165 */
  --sbc-bg: color-mix(in srgb, var(--sbc-veil-light, oklch(0 0 0) 5%), var(--sbc-page));
  --sbc-raised: color-mix(in srgb, oklch(0 0 0) 9%, var(--sbc-page));
  --sbc-popup: color-mix(in srgb, oklch(0 0 0) 2%, var(--sbc-page));
  --sbc-text-1: oklch(0.2101 0.0318 264.66);
  --sbc-text-2: oklch(0.3729 0.0306 259.73);
  --sbc-text-3: oklch(0.551 0.0234 264.36);
  --sbc-icon: oklch(0.7137 0.0192 261.32);
  --sbc-hover: oklch(0 0 0 / 0.05);
  --sbc-line: oklch(0 0 0 / 0.08);
  --sbc-accent: oklch(0.5 var(--theme-chroma) var(--theme-hue));
  --sbc-accent-soft: oklch(0.45 calc(var(--theme-chroma) * 0.5) var(--theme-hue));
  --sbc-accent-bg: oklch(0.6 var(--theme-chroma) var(--theme-hue) / 0.2);
  --sbc-switch-off: oklch(0.8717 0.0093 258.34);
  --sbc-shadow: 0 8px 24px oklch(0 0 0 / 0.12);
  --om-dur-fast: 0.12s;
  --om-dur-slow: 0.3s;
}
html[dark] {
  --sbc-page: oklch(0.1684 0 0);
  --sbc-bg: color-mix(in srgb, var(--sbc-veil-dark, oklch(1 0 0) 10%), var(--sbc-page));
  --sbc-raised: color-mix(in srgb, oklch(1 0 0) 16%, var(--sbc-page));
  --sbc-popup: color-mix(in srgb, oklch(1 0 0) 14%, var(--sbc-page));
  --sbc-text-1: oklch(0.9702 0 0);
  --sbc-text-2: oklch(0.8699 0 0);
  --sbc-text-3: oklch(0.7155 0 0);
  --sbc-icon: oklch(0.7155 0 0);
  --sbc-hover: oklch(1 0 0 / 0.06);
  --sbc-line: oklch(1 0 0 / 0.1);
  --sbc-accent: oklch(0.7 var(--theme-chroma) var(--theme-hue));
  --sbc-accent-soft: oklch(0.8 calc(var(--theme-chroma) * 0.5) var(--theme-hue));
  --sbc-switch-off: oklch(1 0 0 / 0.2);
  --sbc-shadow: 0 8px 24px oklch(0 0 0 / 0.3);
}
`,c=`
html, yt-live-chat-app, yt-live-chat-renderer {
  --yt-live-chat-background-color: var(--sbc-bg) !important;
  --yt-live-chat-header-background-color: var(--sbc-bg) !important;
  --yt-live-chat-action-panel-background-color: var(--sbc-bg) !important;
  --yt-live-chat-ticker-arrow-background: var(--sbc-bg) !important;
  --yt-live-chat-secondary-background-color: var(--sbc-raised) !important;
  --yt-live-chat-vem-background-color: var(--sbc-hover) !important;
  --yt-live-chat-dialog-background-color: var(--sbc-popup) !important;
  --yt-live-chat-toast-background-color: var(--sbc-popup) !important;
  --yt-emoji-picker-background-color: var(--sbc-bg) !important;
  --yt-emoji-picker-category-background-color: var(--sbc-bg) !important;
  --yt-spec-menu-background: var(--sbc-popup) !important;
  --yt-spec-raised-background: var(--sbc-popup) !important;
  --yt-live-chat-primary-text-color: var(--sbc-text-1) !important;
  --yt-live-chat-secondary-text-color: var(--sbc-text-3) !important;
  --yt-live-chat-tertiary-text-color: var(--sbc-text-3) !important;
  --yt-live-chat-deleted-message-color: var(--sbc-text-3) !important;
  --yt-live-chat-picker-button-color: var(--sbc-icon) !important;
  --yt-live-chat-text-input-field-inactive-underline-color: var(--sbc-line) !important;
  --yt-live-chat-text-input-field-active-underline-color: var(--sbc-accent) !important;
  --yt-live-chat-banner-gradient-scrim: linear-gradient(var(--sbc-bg), transparent) !important;
  --yt-spec-text-primary: var(--sbc-text-1) !important;
  --yt-spec-text-secondary: var(--sbc-text-3) !important;
  --yt-spec-call-to-action: var(--sbc-accent) !important;
  --yt-spec-10-percent-layer: var(--sbc-line) !important;
}
`,s=`
html, body, yt-live-chat-app {
  background: var(--sbc-bg) !important;
}
yt-live-chat-app, yt-live-chat-app *:not(.yt-icon):not(yt-icon) {
  font-family: var(--app-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif) !important;
}
yt-live-chat-renderer {
  background: var(--sbc-bg) !important;
  color: var(--sbc-text-1) !important;
}
::selection {
  background: var(--sbc-accent-bg);
}
/* YouTube \u7684\u6309\u538b\u6c34\u6ce2\u7eb9\u3002\u6309\u94ae\u7684\u53cd\u9988\u7edf\u4e00\u6210\u4fa7\u8fb9\u680f\u90a3\u79cd\uff1a\u60ac\u505c\u6362\u5e95\u8272 */
yt-live-chat-app :is(yt-touch-feedback-shape, yt-interaction, tp-yt-paper-ripple) {
  display: none !important;
}
`,d=`
yt-live-chat-header-renderer {
  height: auto !important;
  padding: 16px 16px 12px 24px !important;
  background: transparent !important;
  border-bottom: none !important;
  box-sizing: border-box;
}
yt-live-chat-renderer #separator {
  border: none !important;
}
yt-live-chat-header-renderer #primary-content {
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  line-height: 28px !important;
  color: var(--sbc-text-1) !important;
}
yt-live-chat-header-renderer #label.yt-dropdown-menu {
  padding: 0 !important;
  margin: 0 !important;
  min-width: 0 !important;
}
yt-live-chat-header-renderer #label-text.yt-dropdown-menu {
  font-size: 18px !important;
  font-weight: 600 !important;
  line-height: 28px !important;
  color: var(--sbc-text-1) !important;
}
yt-live-chat-header-renderer #label-icon.yt-dropdown-menu {
  color: var(--sbc-icon) !important;
  margin-left: 4px !important;
}
/* \u53f3\u4fa7\u4e24\u9897\u56fe\u6807\u6309\u94ae\uff1a32px \u7684\u5706\uff0c\u548c .transcript-sidebar-icon-btn \u4e00\u6837\u5927 */
yt-live-chat-header-renderer :is(#live-chat-header-context-menu, #close-button),
yt-live-chat-header-renderer :is(#live-chat-header-context-menu, #close-button) :is(yt-button-renderer, yt-button-shape) {
  width: 32px !important;
  height: 32px !important;
}
yt-live-chat-header-renderer :is(#live-chat-header-context-menu, #close-button) button {
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  color: var(--sbc-icon) !important;
  transition: background-color var(--om-dur-fast) ease;
}
yt-live-chat-header-renderer :is(#live-chat-header-context-menu, #close-button) button:hover {
  background-color: var(--sbc-hover) !important;
}
yt-live-chat-header-renderer :is(#live-chat-header-context-menu, #close-button) .ytSpecButtonShapeNextIcon {
  width: 20px !important;
  height: 20px !important;
  margin: 0 !important;
  color: inherit !important;
}
/* \u7c89\u4e1d\u699c\u5165\u53e3\uff1a\u4ece\u63cf\u8fb9\u80f6\u56ca\u6536\u6210\u4e00\u679a\u5b89\u9759\u7684\u5c0f\u6807\u7b7e\uff0c\u7687\u51a0\u7528\u4e3b\u9898\u8272 */
yt-live-chat-header-renderer #viewer-leaderboard-entry-point {
  margin-right: 4px !important;
}
yt-live-chat-header-renderer #viewer-leaderboard-entry-point button {
  height: 24px !important;
  padding: 0 8px !important;
  border: none !important;
  border-radius: 8px !important;
  background-color: var(--sbc-hover) !important;
  color: var(--sbc-text-2) !important;
  font-size: 12px !important;
  font-weight: 500 !important;
  transition: background-color var(--om-dur-fast) ease;
}
yt-live-chat-header-renderer #viewer-leaderboard-entry-point button:hover {
  background-color: var(--sbc-line) !important;
}
yt-live-chat-header-renderer #viewer-leaderboard-entry-point .ytSpecButtonShapeNextIcon {
  color: var(--sbc-accent) !important;
}
`,p=`
ytd-menu-popup-renderer,
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu {
  box-sizing: border-box !important;
  padding: 4px !important;
  border: 1px solid var(--sbc-line) !important;
  border-radius: 12px !important;
  background: var(--sbc-popup) !important;
  box-shadow: var(--sbc-shadow) !important;
}
ytd-menu-popup-renderer #items {
  padding: 0 !important;
}
ytd-menu-popup-renderer tp-yt-paper-item,
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu tp-yt-paper-item {
  --paper-item-min-height: 36px;
  min-height: 36px !important;
  padding: 0 12px !important;
  border-radius: 8px !important;
  cursor: pointer;
  transition: background-color var(--om-dur-fast) ease;
}
ytd-menu-popup-renderer tp-yt-paper-item:hover,
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu tp-yt-paper-item:hover {
  background-color: var(--sbc-hover) !important;
}
ytd-menu-popup-renderer tp-yt-paper-item::before,
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu tp-yt-paper-item::before {
  display: none !important;
}
ytd-menu-popup-renderer tp-yt-paper-item yt-icon {
  width: 18px !important;
  height: 18px !important;
  margin-right: 12px !important;
  color: var(--sbc-icon) !important;
}
ytd-menu-popup-renderer tp-yt-paper-item :is(yt-formatted-string, span:not(.yt-icon-shape)) {
  font-size: 13px !important;
  line-height: 20px !important;
  color: var(--sbc-text-1) !important;
}
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu .item.yt-dropdown-menu {
  font-size: 13px !important;
  color: var(--sbc-text-1) !important;
}
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu .subtitle.yt-dropdown-menu {
  font-size: 12px !important;
  color: var(--sbc-text-3) !important;
}
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu a.yt-dropdown-menu {
  background: transparent !important;
}
yt-live-chat-app tp-yt-paper-listbox.yt-dropdown-menu .iron-selected tp-yt-paper-item {
  background-color: var(--sbc-accent-bg) !important;
}
/* \u83dc\u5355\u91cc\u7684\u5f00\u5173\uff0c\u548c\u8bbe\u7f6e\u9762\u677f\u7684 .om-toggle-switch \u540c\u4e00\u4e2a\u9020\u578b\uff1a\u5b9e\u5fc3\u8f68\u9053\u91cc\u4e00\u9897\u767d\u8272\u5706\u94ae */
tp-yt-paper-toggle-button .toggle-container {
  width: 36px !important;
  height: 20px !important;
}
tp-yt-paper-toggle-button #toggleBar {
  width: 36px !important;
  height: 20px !important;
  border-radius: 10px !important;
  background-color: var(--sbc-switch-off) !important;
  opacity: 1 !important;
  transition: background-color var(--om-dur-fast) ease;
}
tp-yt-paper-toggle-button[checked] #toggleBar {
  background-color: var(--sbc-accent) !important;
}
tp-yt-paper-toggle-button #toggleButton {
  top: 2px !important;
  left: 2px !important;
  width: 16px !important;
  height: 16px !important;
  background-color: oklch(1 0 0) !important;
  box-shadow: 0 1px 3px oklch(0 0 0 / 0.2) !important;
}
tp-yt-paper-toggle-button[checked] #toggleButton {
  transform: translate(16px, 0) !important;
}
`,m=`
yt-live-chat-item-list-renderer #item-scroller {
  scrollbar-width: thin;
  scrollbar-color: var(--sbc-line) transparent;
}
yt-live-chat-text-message-renderer {
  padding: 4px 12px !important;
  font-size: 14px !important;
  transition: background-color var(--om-dur-fast) ease;
}
yt-live-chat-text-message-renderer:not([in-banner]):hover {
  background-color: var(--sbc-hover) !important;
}
yt-live-chat-text-message-renderer #author-photo {
  margin-right: 12px !important;
}
yt-live-chat-text-message-renderer #content {
  line-height: 22px !important;
}
yt-live-chat-text-message-renderer #message {
  color: var(--sbc-text-2) !important;
  line-height: 22px !important;
}
yt-live-chat-text-message-renderer #timestamp {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
  font-size: 12px !important;
  color: var(--sbc-text-3) !important;
}
/*
 * \u540d\u5b57\u7684\u989c\u8272\u4e0d\u7528 YouTube \u7684\u4f1a\u5458\u7eff\u3001\u7ba1\u7406\u5458\u84dd\u3001\u4e3b\u64ad\u9ec4\uff0c\u5168\u90e8\u843d\u5728\u4e3b\u9898\u8272\u8fd9\u4e00\u6761\u7ebf\u4e0a\uff1a
 * \u8def\u4eba\u7070\uff0c\u4f1a\u5458\u662f\u6de1\u4e00\u6863\u7684\u4e3b\u9898\u8272\uff0c\u7ba1\u7406\u5458\u662f\u4e3b\u9898\u8272\u52a0\u7c97\uff0c\u4e3b\u64ad\u662f\u4e3b\u9898\u8272\u5c0f\u6807\u7b7e\u3002\u8eab\u4efd\u5fbd\u7ae0\u56fe\u6807\u7167\u65e7\u8ddf\u5728\u540d\u5b57\u540e\u9762\u3002
 */
yt-live-chat-author-chip #author-name {
  font-size: 13px !important;
  font-weight: 500 !important;
  color: var(--sbc-text-3) !important;
}
yt-live-chat-author-chip #author-name.member {
  color: var(--sbc-accent-soft) !important;
}
yt-live-chat-author-chip #author-name.moderator {
  color: var(--sbc-accent) !important;
  font-weight: 600 !important;
}
yt-live-chat-author-chip #author-name.owner {
  padding: 0 6px !important;
  border-radius: 6px !important;
  background-color: var(--sbc-accent-bg) !important;
  color: var(--sbc-accent) !important;
  font-weight: 600 !important;
}
yt-live-chat-author-chip yt-live-chat-author-badge-renderer {
  color: var(--sbc-accent) !important;
}
/* \u7c89\u4e1d\u699c\u540d\u6b21\uff08#1\u3001#2\u2026\uff09\uff1a\u5b9e\u5fc3\u7d2b\u80f6\u56ca\u6362\u6210\u4e00\u679a\u4e3b\u9898\u8272\u5c0f\u6807\u7b7e\uff0c\u4e0d\u62a2\u6d88\u606f\u7684\u620f */
yt-live-chat-text-message-renderer #before-content-buttons button {
  display: inline-flex !important;
  align-items: center !important;
  min-width: 0 !important;
  height: 18px !important;
  padding: 0 6px !important;
  border-radius: 6px !important;
  background-color: var(--sbc-accent-bg) !important;
  color: var(--sbc-accent) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}
yt-live-chat-text-message-renderer #before-content-buttons button :is(.ytSpecButtonShapeNextIcon, .ytSpecButtonShapeNextButtonTextContent) {
  display: flex !important;
  align-items: center !important;
  height: 18px !important;
  color: inherit !important;
  line-height: 18px !important;
}
yt-live-chat-text-message-renderer #before-content-buttons .ytSpecButtonShapeNextIcon {
  margin: 0 2px 0 0 !important;
}
yt-live-chat-text-message-renderer a,
yt-live-chat-app .ytSpecButtonShapeNextCallToAction.ytSpecButtonShapeNextText {
  color: var(--sbc-accent) !important;
}
yt-live-chat-text-message-renderer #menu-button,
yt-live-chat-paid-message-renderer #menu-button {
  border-radius: 50% !important;
  color: var(--sbc-icon) !important;
  transition: background-color var(--om-dur-fast) ease;
}
yt-live-chat-text-message-renderer #menu-button:hover,
yt-live-chat-paid-message-renderer #menu-button:hover {
  background-color: var(--sbc-hover) !important;
}
yt-live-chat-item-list-renderer #show-more {
  background-color: var(--sbc-accent) !important;
  color: oklch(1 0 0) !important;
}
`,h=`
yt-live-chat-viewer-engagement-message-renderer {
  padding: 4px 12px !important;
}
yt-live-chat-viewer-engagement-message-renderer #card {
  padding: 12px !important;
  border-radius: 10px !important;
  background-color: var(--sbc-hover) !important;
  color: var(--sbc-text-2) !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
}
yt-live-chat-banner-renderer {
  margin: 0 12px 4px !important;
  border-radius: 12px !important;
  background-color: var(--sbc-raised) !important;
}
/* \u5e26 no-padding / dashboard-money-feed \u7684\u662f\u522b\u7684\u754c\u9762\u5728\u590d\u7528\u8fd9\u4e9b\u5361\u7247\uff08\u7f6e\u9876\u3001\u4e3b\u64ad\u540e\u53f0\uff09\uff0c\u90a3\u91cc\u7684\u8fb9\u8ddd\u4e0d\u5f52\u8fd9\u91cc\u7ba1 */
:is(yt-live-chat-paid-message-renderer, yt-live-chat-paid-sticker-renderer, yt-live-chat-membership-item-renderer):not([no-padding]):not([dashboard-money-feed]) {
  padding-left: 12px !important;
  padding-right: 12px !important;
}
yt-live-chat-paid-message-renderer #card,
yt-live-chat-membership-item-renderer #card {
  border-radius: 10px !important;
  box-shadow: none !important;
}
yt-live-chat-pinned-message-renderer yt-live-chat-paid-sticker-renderer {
  margin: 4px 12px !important;
  border-radius: 10px !important;
  box-shadow: none !important;
}
yt-live-chat-ticker-renderer #ticker-bar {
  padding: 0 12px 8px !important;
}
`,g=`
#panel-pages.yt-live-chat-renderer {
  border-top: none !important;
}
/* \u5e95\u90e8\u4e00\u680f\u4e0d\u53e6\u8d77\u5e95\u8272\uff0c\u548c\u6d88\u606f\u533a\u8fde\u6210\u4e00\u7247\u3002\u6ca1\u767b\u5f55\u3001\u4e3b\u64ad\u9650\u5236\u53d1\u8a00\u65f6\u8fd9\u91cc\u662f\u4e00\u53e5\u8bf4\u660e\u52a0\u6309\u94ae */
yt-live-chat-message-renderer,
yt-live-chat-restricted-participation-renderer,
yt-live-chat-restricted-participation-renderer #container {
  background: transparent !important;
}
yt-live-chat-message-renderer {
  padding: 8px 12px 12px !important;
}
yt-live-chat-message-renderer #subtext,
yt-live-chat-restricted-participation-renderer #explanation {
  color: var(--sbc-text-3) !important;
  font-size: 12px !important;
}
yt-live-chat-message-renderer #button :is(a, button).ytSpecButtonShapeNextHost {
  height: 36px !important;
  border-radius: 12px !important;
  background-color: var(--sbc-hover) !important;
  color: var(--sbc-text-1) !important;
  font-size: 13px !important;
  font-weight: 500 !important;
  transition: background-color var(--om-dur-fast) ease;
}
yt-live-chat-message-renderer #button :is(a, button).ytSpecButtonShapeNextHost:hover {
  background-color: var(--sbc-line) !important;
}
yt-live-chat-message-renderer #button .ytSpecButtonShapeNextButtonTextContent,
yt-live-chat-message-renderer #button .ytSpecButtonShapeNextButtonTextContent * {
  color: inherit !important;
  font-size: inherit !important;
}
/*
 * \u767b\u5f55\u540e\u7684\u8f93\u5165\u533a\u3002\u5de6\u53f3\u8fb9\u8ddd\u4ece 24px \u6536\u5230 12px\uff0c\u5934\u50cf\u624d\u548c\u6d88\u606f\u5217\u8868\u7684\u5934\u50cf\u5bf9\u9f50\u3002
 * \u8868\u60c5\u9762\u677f\u3001\u6295\u7968\u7f16\u8f91\u3001\u95ee\u7b54\u9762\u677f\u662f\u9760\u300c\u8d1f\u7684\u5de6\u53f3\u5916\u8fb9\u8ddd\u300d\u9876\u6ee1\u6574\u884c\u7684\uff0c\u6570\u503c\u8ddf\u7740\u8fb9\u8ddd\u4e00\u8d77\u6539\uff1b
 * \u5546\u54c1 / \u4e92\u52a8\u9762\u677f\u6253\u5f00\u65f6 YouTube \u628a\u8fb9\u8ddd\u6e05\u96f6\uff0c\u90a3\u4e24\u79cd\u72b6\u6001\u4e0d\u78b0\u3002
 */
yt-live-chat-message-input-renderer {
  background: transparent !important;
  --yt-emoji-picker-renderer-content-margin: 0 12px !important;
  --yt-emoji-picker-category-margin-left: 12px !important;
  --yt-live-chat-text-input-field-placeholder-color: var(--sbc-text-3) !important;
  --yt-live-chat-enabled-send-button-color: var(--sbc-accent) !important;
}
yt-live-chat-message-input-renderer:not([engage-with-audience-picker-open]):not([product-picker-open]) {
  padding-left: 12px !important;
  padding-right: 12px !important;
}
yt-live-chat-message-input-renderer yt-emoji-picker-renderer {
  margin-left: -12px !important;
  margin-right: -12px !important;
}
yt-live-chat-message-input-renderer :is(yt-live-chat-poll-editor-panel-renderer, yt-live-chat-qna-start-panel-renderer) {
  margin-left: -12px !important;
  margin-right: -12px !important;
}
yt-live-chat-message-input-renderer #input-container {
  background-color: var(--sbc-hover) !important;
  border-radius: 12px !important;
}
/* \u8f93\u5165\u6846\u65c1\u8fb9\u7684\u5706\u6309\u94ae\uff08\u8868\u60c5\u3001\u6253\u8d4f\u3001\u7231\u5fc3\uff09\uff1a\u6362\u6210\u548c\u8f93\u5165\u6846\u540c\u4e00\u79cd\u5706\u89d2\u7684\u65b9\u6309\u94ae */
:is(yt-live-chat-message-input-renderer, yt-live-chat-restricted-participation-renderer) yt-live-chat-icon-toggle-button-renderer > #button {
  border-radius: 12px !important;
  background-color: var(--sbc-hover) !important;
  color: var(--sbc-text-2) !important;
  transition: background-color var(--om-dur-fast) ease;
}
:is(yt-live-chat-message-input-renderer, yt-live-chat-restricted-participation-renderer) yt-live-chat-icon-toggle-button-renderer > #button:hover {
  background-color: var(--sbc-line) !important;
}
`,u=`
* {
  border-radius: 0px !important;
}
`;function b(t){let e=[A,c,s,d,p,m,h,g].join("\n");return t.squareCorners?e.replace(/border-radius:[^;]+;/g,"border-radius: 0px !important;")+u:e}function y(t){let e=t.squareCorners?"0px":"14px";return`
/* snowball live chat frame */
ytd-live-chat-frame#chat {
  border: none !important;
  border-radius: ${e} !important;
  background-color: oklch(0 0 0 / 0.05) !important;
}
html[dark] ytd-live-chat-frame#chat {
  background-color: oklch(1 0 0 / 0.1) !important;
}
ytd-live-chat-frame#chat iframe#chatframe {
  border-radius: ${e} !important;
}
`}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4kCCU":[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"discoverYtVarNames",()=>i);let a={"#fff|#0f0f0f":"bgPrimary","#f9f9f9|#181818":"bgPrimary","#fff|#212121":"bgSecondary","#fff|#282828":"bgElevated","#0f0f0f|#f1f1f1":"textPrimary","#606060|#aaa":"textSecondary","#909090|#717171":"textMuted","rgba(0,0,0,0.1)|rgba(255,255,255,0.2)":"border","rgba(0,0,0,0.1)|rgba(255,255,255,0.1)":"border","rgba(0,0,0,0.05)|rgba(255,255,255,0.1)":"chipBg","#065fd4|#3ea6ff":"accent","#0556bf|#65b8ff":"accent"},n=t=>t.replace(/\s+/g,"").toLowerCase();function i(){let t=new Map,e=new Map;for(let r of Array.from(document.styleSheets)){let o;try{o=r.cssRules}catch{continue}!function t(e,r,o){for(let a of Array.from(e))if(a instanceof CSSStyleRule){let t="[light]"===a.selectorText?r:"[dark]"===a.selectorText?o:null;if(!t)continue;for(let e of Array.from(a.style))e.startsWith("--")&&t.set(e,n(a.style.getPropertyValue(e)))}else"cssRules"in a&&t(a.cssRules,r,o)}(o,t,e)}if(!t.size||!e.size)return null;let r={};for(let[o,n]of t){let t=e.get(o);if(null==t)continue;let i=a[`${n}|${t}`];i&&(r[i]??=[]).push(o)}return Object.keys(r).length?r:null}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],eIZL3:[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"CURSOR_PRESETS",()=>a),o.export(r,"getCursorById",()=>n),o.export(r,"buildCursorCSS",()=>i);let a=[{id:"default",hotspot:[0,0]},{id:"w11-light",png:{pointer:"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",link:"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",beam:"iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAKiSURBVHja7dxBTttAFMbxb0aNyEhI9g0mNwgnsHIC1F6Apgdg0T1I9ARFbFk0rNmkaxaVcoEWlmyIT1CzGs2A/bqhFTKJoRXSM+X7Sd44D8vjv0hWHoCIiIiIiIiIiIiIiIiIiIjof2S0b6BLCGECYNI1U9f13Fo7Mcbk62ZEpDLGzJ1zS+01tfU2QErpi4hMn/GSy5ubm3ebm5s/tNfWezHGtzFG2dvbEwBrjzzP5fT0VIqi6Jzz3svl5aWklL5pr+1FCCEcxBg7HyruRXjK3PHxscQYr7TX9iKEECYxRtnf33/Sw33s4H/APwghzGKM0nXc/+o5OzuTR+Z/hhBG2utqe6N9A+s456YxxnnTNFvtz6y1HsB0xZ8tm6Y5aZ8Ukco5NzPGVNrrauttAADY2NiYA5i3z4cQJtbaafu8MWbpnDvQvu+/YbVv4LVjAGUMoIwBlDGAMgZQxgDKGEAZAyhjAGUMoIwBlDGAMgZQxgDKGEAZAyhjAGUMoIwBlDGAMgZQxgDKGEAZAyhjAGUMoIwBlDGAMgZQxgDKGEAZAyhjAGUMoIwBlDGAsl6/JQkAq97tHQwGWV3XD2ZFJF81PxwOqz6+ogr0OMDt7e37uq4PAeTtz1Y9/Dtb1toH2xGklJBSmg0Gg499C9HL3VJCCCNr7dXFxQWOjo7Wzi0WC5RlCQAoigLe+5Vz4/EYu7u7aJrm00t7j1jF7806vPfPslcEerxZRy9/hEWkAoAsyx6d3dnZedI18zwHgEp7bW29/AoSkTyl9L0sy9H5+Tmur69XzmVZhu3tbZRlicVisfZ63nsURYGmaT4452ba67uvlwGAP78DnwFsdc2JyFdr7VhERh1jlYicDIfDQ+11EREREREREREREREREREREb0OvwAI+W522m8xtQAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wNC0yNFQxODo0NDo1MyswMDowMJA+GMoAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjYtMDQtMjRUMTg6NDQ6NTMrMDA6MDDhY6B2AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA0LTI0VDE4OjQ0OjUzKzAwOjAwtnaBqQAAAABJRU5ErkJggg=="},hotspot:[3,9],hotspotLink:[13,7],hotspotBeam:[16,16],previewOffset:[6.5,-2]},{id:"windose",png:{pointer:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAHKSURBVHja7dxBSsNQGEZRI91JoUPBhRS6VMGFCA6FrkV3kDd4hCTec6YqdnD5oV+sy/369fsy4fP5vsz8PPt63fsFsC8BxAkgTgBxAogTQJwA4i6jb/j4eVv9+uO2viPYCY7NBYgTQJwA4gQQJ4A4AcQJIG64A4zYCc7NBYgTQJwA4gQQJ4A4AcQJIG56BxixExybCxAngDgBxAkgTgBxAogTQNzmO8CInWBfLkCcAOIEECeAOAHECSBOAHG77wAjdoJtuQBxAogTQJwA4gQQJ4A4AcQdfgcYsRPMcQHiBBAngDgBxAkgTgBxAog7/Q4wYidY5wLECSBOAHECiBNAnADiBBD373eAkfpO4ALECSBOAHECiBNAnADiBBB3+h3gcfve+yWcmgsQJ4A4AcQJIE4AcQKIE0Dc5jvA6H366Hn8rLM/r9+aCxAngDgBxAkgTgBxAogTQNz0DuB5/Lm5AHECiBNAnADiBBAngDgBxC336/rn30dmn7ePfv/s3wuMdor63wu4AHECiBNAnADiBBAngDgBxF3q74PrXIA4AcQJIE4AcQKIE0CcAOIO/38Cfe5gWy5AnADiBBAngDgBxAkgTgAAAAAAEX9aJkhV+SwiyAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wNC0yNFQxODo1NTo0NSswMDowMBEImZAAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjUtMDgtMjJUMDk6MTU6MDgrMDA6MDD/qNGkAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA0LTI0VDE4OjU3OjM4KzAwOjAwWKe4FwAAAABJRU5ErkJggg==",link:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAHtSURBVHja7d1BSgNBEEDRiXiTgEvBgwQ8quBBBJeCZ9EbdC+aoUn+e9tgiPIpmBonfTk2u12//lZ+/vP37bL7d7hnT7s/AHsJIE4AcQKIE0CcAOIEEHf6NfTsOv/j53Xp/d9fvoev2xOMmQBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHEPe/+AGfz3MGYCRAngDgBxAkgTgBxAogTQNzD7wHWnztY2yPM7N4zmABxAogTQJwA4gQQJ4A4AcRN9wCr99Mf3e49w+oewQSIE0CcAOIEECeAOAHECSBu+f8BZtfBs+/xY2z+9x3vEWZ7AhMgTgBxAogTQJwA4gQQJ4C4u38uYPV+/O73380EiBNAnADiBBAngDgBxAkg7u73APdu957BBIgTQJwA4gQQJ4A4AcQJIO70PcDu61zGTIA4AcQJIE4AcQKIE0CcAOIEECeAOAHECSBOAHECiBNAnADiBBAngDgBxAkgTgBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOKWzp4/juO4Xcfn1vl+gDWzcxdn5wLOmABxAogTQJwA4gQQJ4A4AcQtf0/g7Dp0dr69PcFeJkCcAOIEECeAOAHECSBOAHHbzw2c3e/mXCZAnADiBBAngDgBxAkgTgBx/7FtO24ZbUaXAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDI2LTA0LTI0VDE4OjU1OjQ1KzAwOjAwEQiZkAAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyNS0wOC0yMlQwMzowODo0NiswMDowMCXyllUAAAAodEVYdGRhdGU6dGltZXN0YW1wADIwMjYtMDQtMjRUMTg6NTc6MzgrMDA6MDBYp7gXAAAAAElFTkSuQmCC",beam:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAGASURBVHja7dfLDcIwFADBgOiECiiEaimECqgF7jmAIj4O2ZlzsJxo5WemCQAAAAAAgM3ajd7AUufj9f7O7y+309N3/vb6a7MfvQHGEkCcAOIOozfwa/MZ/28z+9OcAHECiBNA3Obn39L/9bU7gRMgTgBxAohLzbtpen0ncAcgRQBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHECSBOAHECiBNAnADiBBAngDgBxAkgTgBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHECSBOAHECiBNAnADiBBAngDgBxAkgTgBxAogTQJwA4gQQJ4A4AcQJIE4AcQKIE0CcAOIEECeAOAHECSBOAHECiBNAnADiBBAngDgBxAkgTgBxAogTQJwA4gQQJ4C43egN/Nr5eL0vef5yO236GzkB4gQQJ4C4v5tvS2f43Hymv7veq/XXzgkQJ4A4AcQdRm9gtG/fCdbOCRAngDgBAAAAAADAtj0Amv8k0LKVcH0AAAAldEVYdGRhdGU6Y3JlYXRlADIwMjYtMDQtMjRUMTg6NTU6NDUrMDA6MDARCJmQAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI1LTA4LTIyVDA5OjQxOjEyKzAwOjAw786CTAAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyNi0wNC0yNFQxODo1NzozOCswMDowMFinuBcAAAAASUVORK5CYII="},hotspot:[0,0],hotspotLink:[7,1],hotspotBeam:[12,12],displaySize:24,previewOffset:[4.5,.75]},{id:"minecraft",png:{pointer:"iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAKxSURBVHja7d29alRRFAXgKGIioo0kiIiKKCo2ViksVIIE7CO2prCJL6BPIPgAVoKdjbYiiPiTwiI2NkIgFkkKEdP4g5hYqA9wjuTizGTd3Pm+cnNn7oQsNmcxk8zICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADBoO9IvYDP7L07++d/Hfnu90Pqfb9jtTL8AhpsAEiWARAkgUbvSL2Azvz5+Lmb3F981euzc1HRRYBSTdrEBiRJAogSQKAEkqvUlpKk7C8+L2b0Xz4qZYtIuNiBRAkiUABIlgERty8P32MljRZGovTtSKya3Jy8Xs7mp6WKmmGwNG5AoASRKAIkSQKI6c9CuFZOzbx4V161/WClmikmODUiUABIlgEQJIFGdPlQrJu1nAxIlgEQJIFECSNTQHaB7KSZjJ44Ws6WZm8Wsl2LS9L+BdaX82IBECSBRAkiUABLViYNsr1LFpFY4RivPt1G5rxICfSCARAkgUQJIVCcOsoPQtJisPXhczMZnZ4rZ+/NXi9nEjWvF7MuTl8WsK4WjxgYkSgCJEkCiBJCozh5uB6FpMVm9dbeY7Tl1vNE9lBDYQgJIlAASJYBEdfZwu1VqxWT3oYniumH7mFVTNiBRAkiUABIlgEQN1YG3V00LR03tm9+vn/ldzFY+/SxmTxfWOvt7sgGJEkCiBJAoASSqM9+Y3m9NC0etXNSsLy0XReLVxt7iHrNXDtceXlzXlWJiAxIlgEQJIFECSFQnDrKDUCshNbVy0YvTR8picuncgeK6h18PNnq+tn+8ywYkSgCJEkCiBJAo74T8Q7/LRVOLqz+K+y6PjhfFZN+FZn9j0nY2IFECSJQAEiWARCkh29T3+bfpl9AXNiBRAkiUABIlgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAd9xemHaGb0BZ9OgAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wNC0yNFQxOTowMzowNCswMDowMJLqmV4AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjUtMDctMDNUMTE6MjA6MjgrMDA6MDA8gd4fAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA0LTI0VDE5OjAzOjU4KzAwOjAwO+JkLQAAAABJRU5ErkJggg==",link:"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",beam:"iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAAAIGNIUk0AAHomAACAhAAA+gAAAIDoAAB1MAAA6mAAADqYAAAXcJy6UTwAAAAGYktHRAD/AP8A/6C9p5MAAAM7SURBVHja7d27ahVRGAXgRMRERBtJEBEVUVRsrFJYqAQJ2Cu2WtjEF9AnEHwAK8HORlsRRLwVFrGxEQKxUAsRbbwgXgrjA+wd2PGcZM2cfF/5M+fMYVhs9mImmbExAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYK2Np39Ag+V1OEcfrsNI2pT+AWxsAkiUABIlgER1bfNdFI7l5bXvIOPj1cvQtWszkqyARAkgUQJIlAAS1YeNdlMLqZWVFcpFX6/DSLICEiWARAkgUQJI1Ob0D2hQKwiD3B5RODrECkiUABIlgEQJIFECSJQAEiWARAkgUQJIlAASJYBECSBRAkiUABLVh8exInacmvnvR76+PVvwyFcjKyBRAkiUABIlgEQpISv48+FTMbu1+Krps/Ozc0WBUUzqrIBECSBRAkiUABKlhAzo+sKjYnbz8cNippjUWQGJEkCiBJAoASSqr5vgpveJDPv9H5OH9hcnqd0dqRWTazNnitn87Fwx22jFxApIlAASJYBECSBRfd3wRkpITa2YHHtxtzju15t3xUwxsQISJoBECSBRAkhUXze3nSkhNYpJOysgUQJIlAASJYBE9XUj2+kSUjNIMZk8uK+YLZ27UswGKSat/w1s2OXHCkiUABIlgEQJIFF9KCFNm+NVlJDOXIdUMakVjonK9/2unFcJYaQIIFECSJQAEtW1EtJ0h2PoF6GHd0w+375XzKYunStmr0+cL2bTly8Usy/3nxSz9XjkywpIlAASJYBECSBRXSshNWvfQjp+HVqLyfurN4rZ1sMHms6hhLAhCSBRAkiUABLV6c03K6sVky27p4vjUo9ZtbICEiWARAkgUQJIlBLSA62Fo6b25veLR/8Ws3cffxazBwuf3QlhtAkgUQJIlAAS5Y3pHdNaOGrloubX0tuiSDz9va04x6Wze2ofL44bdjGxAhIlgEQJIFECSJQ7IR1TKyE1tXIxiCN7y2Jy+vjO4rg7X3c1fV/r411WQKIEkCgBJEoAiXInpGOGXS5aLb7/UZz37cRUUUy2n2z7G5NWVkCiBJAoASRKAIlSQliV789fDvX7rIBECSBRAkiUAAIAAAAAAMCa+AdBHsTahhir8QAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyNi0wNC0yNFQxOTowMzowNCswMDowMJLqmV4AAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjUtMDctMDNUMTE6MjE6NTgrMDA6MDDZhrw4AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDI2LTA0LTI0VDE5OjAzOjU4KzAwOjAwO+JkLQAAAABJRU5ErkJggg=="},hotspot:[12,12],hotspotLink:[14,12],hotspotBeam:[16,24],displaySize:48},{id:"pixel-light",png:{pointer:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAAHlBMVEUAAAD6+voAAADRxcUAAAAAAAAAAAAAAAAAAAAAAABJbhUIAAAACHRSTlMA////AAAAAAtxdNEAAACGSURBVHja7ZixDYAwEMQuiAWyQvafiRWyAgWkQRT8p0EXe4ArHEsvpTRdHMqxaRIG/jCwS1KX1JItINGng5kWkOjVQbYFJPp1kGkBiZ4dRFtAom8HkRaQ6N1Bu1tA4rodjAa4C+t1MN5+vH9F4nId1I83AIm2A+XtJijw14xEiwEAAACAJyeQ3hVcrwgdjgAAAABJRU5ErkJggg==",link:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAAHlBMVEUAAAD6+voAAACioq4AAAAAAAAAAAAAAAAAAAAAAAAVhrqwAAAACHRSTlMA////AAAAAAtxdNEAAACNSURBVHja7ZjBCYAwDEVbcYGs0P1nygpZwYtCCAYrXiR97yRS/uHnN9H05hjuWdscW/sIAn8Q2OMLc5lQTEQAAQQQWH4uvP1ewMQSAj3W25KDkmQBE2v0g+FqL5jIXDhzYJi49Fx4qj9zoX4/0MksYGLtfuD/D+7u/ZUR+sFa+0RJdoyYWFYAAAAAIHIAe40RuDCg4z0AAAAASUVORK5CYII=",beam:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAAHlBMVEUAAAAAAAD6+vqioq4AAAAAAAAAAAAAAAAAAAAAAABXbBJ9AAAACHRSTlMA////AAAAAAtxdNEAAAB3SURBVHja7ZixCcAwDATPIQtohew/U1bQCmliMCHGRZqA7hp3V8iPQN+COcmajY8o+INgB+hZiOHv0yGWy0ECx/0GcDrEaoLGsAv6PkiHqECBAgUKFChQoECBAmi9O3i7G+2RauVg1iOZg3r7AHvlygIRERGRJxeC+A+v1NMLxgAAAABJRU5ErkJggg=="},hotspot:[0,0],hotspotLink:[9,1],hotspotBeam:[7,12],previewOffset:[8,4]},{id:"pixel-dark",png:{pointer:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAAHlBMVEUAAAAFBQX///8uOjoAAAAAAAAAAAAAAAAAAAAAAACA9IxXAAAACHRSTlMA////AAAAAAtxdNEAAACGSURBVHja7ZixDYAwEMQuiAWyQvafiRWyAgWkQRT8p0EXe4ArHEsvpTRdHMqxaRIG/jCwS1KX1JItINGng5kWkOjVQbYFJPp1kGkBiZ4dRFtAom8HkRaQ6N1Bu1tA4rodjAa4C+t1MN5+vH9F4nId1I83AIm2A+XtJijw14xEiwEAAACAJyeQ3hVcrwgdjgAAAABJRU5ErkJggg==",link:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAAHlBMVEUAAAAFBQX///9dXVEAAAAAAAAAAAAAAAAAAAAAAADcHCPvAAAACHRSTlMA////AAAAAAtxdNEAAACNSURBVHja7ZjBCYAwDEVbcYGs0P1nygpZwYtCCAYrXiR97yRS/uHnN9H05hjuWdscW/sIAn8Q2OMLc5lQTEQAAQQQWH4uvP1ewMQSAj3W25KDkmQBE2v0g+FqL5jIXDhzYJi49Fx4qj9zoX4/0MksYGLtfuD/D+7u/ZUR+sFa+0RJdoyYWFYAAAAAIHIAe40RuDCg4z0AAAAASUVORK5CYII=",beam:"iVBORw0KGgoAAAANSUhEUgAAAIAAAACABAMAAAAxEHz4AAAAHlBMVEUAAAD///8FBQVdXVEAAAAAAAAAAAAAAAAAAAAAAACe9osiAAAACHRSTlMA////AAAAAAtxdNEAAAB3SURBVHja7ZixCcAwDATPIQtohew/U1bQCmliMCHGRZqA7hp3V8iPQN+COcmajY8o+INgB+hZiOHv0yGWy0ECx/0GcDrEaoLGsAv6PkiHqECBAgUKFChQoECBAmi9O3i7G+2RauVg1iOZg3r7AHvlygIRERGRJxeC+A+v1NMLxgAAAABJRU5ErkJggg=="},hotspot:[0,0],hotspotLink:[9,1],hotspotBeam:[7,12],previewOffset:[8,4]}];function n(t){return a.find(e=>e.id===t)}function i(t){if(!t.png)return"";let e=t.displaySize||32,r=t=>{let r=`<svg xmlns="http://www.w3.org/2000/svg" width="${e}" height="${e}"><image href="data:image/png;base64,${t}" width="${e}" height="${e}"/></svg>`;return"data:image/svg+xml,"+encodeURIComponent(r)},o=r(t.png.pointer),a=t.png.link?r(t.png.link):o,n=t.png.beam?r(t.png.beam):o,i=`${t.hotspot[0]} ${t.hotspot[1]}`,l=t.hotspotLink?`${t.hotspotLink[0]} ${t.hotspotLink[1]}`:i,A=t.hotspotBeam?`${t.hotspotBeam[0]} ${t.hotspotBeam[1]}`:i;return`
/* snowball custom cursor */
* { cursor: url("${o}") ${i}, default !important; }
[data-snowball-link-cursor] { cursor: url("${a}") ${l}, pointer !important; }
[data-snowball-text-cursor] { cursor: url("${n}") ${A}, text !important; }
[data-snowball-native-cursor] { cursor: unset !important; }
`}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],eS4Gk:[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"buildWin98CSS",()=>l);let a='"Ark Pixel", "Pixelated MS Sans Serif", "MS Sans Serif", Tahoma, Geneva, Verdana, sans-serif',n="inset -1px -1px var(--w98-frame), inset 1px 1px var(--w98-btn-highlight), inset -2px -2px var(--w98-btn-shadow), inset 2px 2px var(--w98-btn-face)",i="inset -1px -1px var(--w98-btn-highlight), inset 1px 1px var(--w98-frame), inset -2px -2px var(--w98-btn-face), inset 2px 2px var(--w98-btn-shadow)";function l(){return`
/* snowball win98 mode \u2014 light palette (default) */
html[data-snowball-win98] {
  --w98-text: oklch(0.27 0 0);
  --w98-surface: oklch(0.79 0 0);
  --w98-btn-highlight: oklch(1 0 0);
  --w98-btn-face: oklch(0.89 0 0);
  --w98-btn-shadow: oklch(0.60 0 0);
  --w98-frame: oklch(0.07 0 0);
  --w98-dialog-blue: oklch(0.27 0.15 264);
  --w98-dialog-blue-light: oklch(0.58 0.16 247);
  --w98-link: oklch(0.45 0.31 264);
  --w98-desktop: oklch(0.55 0.10 196);
  --w98-input-bg: oklch(1 0 0);
  --w98-thumb-bg: oklch(0.07 0 0);
  --w98-title-text: oklch(1 0 0);
  background: var(--w98-desktop) !important;
}

/* dark palette \u2014 kicks in when YouTube's dark mode is on */
html[data-snowball-win98][dark] {
  --w98-text: oklch(0.92 0 0);
  --w98-surface: oklch(0.30 0 0);
  --w98-btn-highlight: oklch(0.45 0 0);
  --w98-btn-face: oklch(0.38 0 0);
  --w98-btn-shadow: oklch(0.16 0 0);
  --w98-frame: oklch(0.04 0 0);
  --w98-dialog-blue: oklch(0.18 0.12 264);
  --w98-dialog-blue-light: oklch(0.32 0.14 247);
  --w98-link: oklch(0.72 0.18 240);
  --w98-desktop: oklch(0.25 0.06 196);
  --w98-input-bg: oklch(0.18 0 0);
  --w98-thumb-bg: oklch(0 0 0);
  --w98-title-text: oklch(0.95 0 0);
}

html[data-snowball-win98],
html[data-snowball-win98] body,
html[data-snowball-win98] ytd-app,
html[data-snowball-win98] ytd-app *,
html[data-snowball-win98] yt-formatted-string,
html[data-snowball-win98] tp-yt-paper-item,
html[data-snowball-win98] ytd-masthead,
html[data-snowball-win98] ytd-guide-renderer,
html[data-snowball-win98] ytd-mini-guide-renderer {
  font-family: ${a} !important;
  font-weight: 400 !important;
  letter-spacing: 0 !important;
  text-rendering: geometricPrecision !important;
}

html[data-snowball-win98] body,
html[data-snowball-win98] ytd-app,
html[data-snowball-win98] ytd-page-manager,
html[data-snowball-win98] ytd-watch-flexy,
html[data-snowball-win98] ytd-browse,
html[data-snowball-win98] ytd-two-column-browse-results-renderer,
html[data-snowball-win98] ytd-rich-grid-renderer,
html[data-snowball-win98] ytd-section-list-renderer,
html[data-snowball-win98] ytd-shelf-renderer,
html[data-snowball-win98] ytd-item-section-renderer {
  background: var(--w98-desktop) !important;
}

html[data-snowball-win98] ytd-rich-item-renderer,
html[data-snowball-win98] ytd-grid-video-renderer,
html[data-snowball-win98] ytd-compact-video-renderer,
html[data-snowball-win98] ytd-video-renderer,
html[data-snowball-win98] ytd-playlist-panel-video-renderer,
html[data-snowball-win98] ytd-comment-thread-renderer,
html[data-snowball-win98] ytd-comment-renderer,
html[data-snowball-win98] ytd-engagement-panel-section-list-renderer,
html[data-snowball-win98] ytd-watch-metadata,
html[data-snowball-win98] ytd-secondary-info-renderer,
html[data-snowball-win98] ytd-video-secondary-info-renderer,
html[data-snowball-win98] #related,
html[data-snowball-win98] #secondary,
html[data-snowball-win98] #primary,
html[data-snowball-win98] ytd-mini-guide-renderer,
html[data-snowball-win98] ytd-guide-renderer,
html[data-snowball-win98] ytd-guide-section-renderer,
html[data-snowball-win98] tp-yt-app-drawer #contentContainer,
html[data-snowball-win98] tp-yt-app-drawer {
  background: var(--w98-surface) !important;
  color: var(--w98-text) !important;
}

html[data-snowball-win98] ytd-rich-item-renderer #content,
html[data-snowball-win98] ytd-comment-thread-renderer,
html[data-snowball-win98] ytd-engagement-panel-section-list-renderer,
html[data-snowball-win98] ytd-watch-metadata {
  box-shadow: ${n} !important;
  padding: 4px !important;
}

html[data-snowball-win98] ytd-masthead,
html[data-snowball-win98] #masthead-container,
html[data-snowball-win98] #frosted-glass {
  background: linear-gradient(90deg, var(--w98-dialog-blue), var(--w98-dialog-blue-light)) !important;
  box-shadow: ${n} !important;
  border-bottom: 0 !important;
}

html[data-snowball-win98] ytd-masthead *,
html[data-snowball-win98] #masthead-container * {
  color: var(--w98-title-text) !important;
}

html[data-snowball-win98] ytd-masthead yt-icon,
html[data-snowball-win98] ytd-masthead svg {
  fill: var(--w98-title-text) !important;
  color: var(--w98-title-text) !important;
}

html[data-snowball-win98] yt-formatted-string,
html[data-snowball-win98] #video-title,
html[data-snowball-win98] .ytd-channel-name a,
html[data-snowball-win98] #content-text,
html[data-snowball-win98] #header-text,
html[data-snowball-win98] .style-scope.ytd-comment-renderer {
  color: var(--w98-text) !important;
}

html[data-snowball-win98] a,
html[data-snowball-win98] a yt-formatted-string {
  color: var(--w98-link) !important;
  text-decoration: underline !important;
}
html[data-snowball-win98] ytd-masthead a,
html[data-snowball-win98] #masthead-container a {
  color: var(--w98-title-text) !important;
}

html[data-snowball-win98] ytd-button-renderer button,
html[data-snowball-win98] button.yt-spec-button-shape-next,
html[data-snowball-win98] .yt-spec-button-shape-next,
html[data-snowball-win98] tp-yt-paper-button,
html[data-snowball-win98] yt-chip-cloud-chip-renderer,
html[data-snowball-win98] ytd-toggle-button-renderer button,
html[data-snowball-win98] yt-button-shape button,
html[data-snowball-win98] yt-button-shape .yt-spec-button-shape-next,
html[data-snowball-win98] button-view-model button,
html[data-snowball-win98] like-button-view-model button,
html[data-snowball-win98] dislike-button-view-model button,
html[data-snowball-win98] segmented-like-dislike-button-view-model button,
html[data-snowball-win98] ytd-menu-renderer yt-button-shape button,
html[data-snowball-win98] ytd-subscribe-button-renderer button,
html[data-snowball-win98] yt-smartimation button,
html[data-snowball-win98] .yt-spec-button-shape-next--filled,
html[data-snowball-win98] .yt-spec-button-shape-next--tonal,
html[data-snowball-win98] .yt-spec-button-shape-next--text,
html[data-snowball-win98] .yt-spec-button-shape-next--mono,
html[data-snowball-win98] .yt-spec-button-shape-next--call-to-action,
html[data-snowball-win98] .yt-spec-button-shape-next--overlay {
  background: var(--w98-surface) !important;
  background-color: var(--w98-surface) !important;
  color: var(--w98-text) !important;
  box-shadow: ${n} !important;
  border: 0 !important;
  min-height: 23px !important;
  padding: 0 12px !important;
  font-family: ${a} !important;
  text-transform: none !important;
}

/* Flatten wrapper containers so the bevel reads cleanly without rounded outer pill */
html[data-snowball-win98] yt-button-shape,
html[data-snowball-win98] button-view-model,
html[data-snowball-win98] like-button-view-model,
html[data-snowball-win98] dislike-button-view-model,
html[data-snowball-win98] segmented-like-dislike-button-view-model {
  background: transparent !important;
  border: 0 !important;
}

/* Inner icons inside buttons take the same dark text color */
html[data-snowball-win98] yt-button-shape button yt-icon,
html[data-snowball-win98] yt-button-shape button svg,
html[data-snowball-win98] button-view-model button yt-icon,
html[data-snowball-win98] button-view-model button svg,
html[data-snowball-win98] like-button-view-model button yt-icon,
html[data-snowball-win98] like-button-view-model button svg,
html[data-snowball-win98] dislike-button-view-model button yt-icon,
html[data-snowball-win98] dislike-button-view-model button svg {
  fill: var(--w98-text) !important;
  color: var(--w98-text) !important;
}

html[data-snowball-win98] ytd-button-renderer button:active,
html[data-snowball-win98] button.yt-spec-button-shape-next:active,
html[data-snowball-win98] .yt-spec-button-shape-next:active,
html[data-snowball-win98] yt-button-shape button:active,
html[data-snowball-win98] button-view-model button:active,
html[data-snowball-win98] like-button-view-model button:active,
html[data-snowball-win98] dislike-button-view-model button:active,
html[data-snowball-win98] segmented-like-dislike-button-view-model button:active,
html[data-snowball-win98] yt-chip-cloud-chip-renderer:active {
  box-shadow: ${i} !important;
}

html[data-snowball-win98] yt-chip-cloud-chip-renderer[selected],
html[data-snowball-win98] yt-chip-cloud-chip-renderer[chip-style="STYLE_PRIMARY"] {
  background: var(--w98-surface) !important;
  color: var(--w98-text) !important;
  box-shadow: ${i} !important;
}

html[data-snowball-win98] input,
html[data-snowball-win98] textarea,
html[data-snowball-win98] ytd-searchbox #search-input,
html[data-snowball-win98] #search-input,
html[data-snowball-win98] ytd-searchbox #container {
  background: var(--w98-input-bg) !important;
  color: var(--w98-text) !important;
  box-shadow: ${i} !important;
  border: 0 !important;
  font-family: ${a} !important;
}

html[data-snowball-win98] #search-icon-legacy,
html[data-snowball-win98] ytd-searchbox button {
  background: var(--w98-surface) !important;
  box-shadow: ${n} !important;
  border: 0 !important;
  color: var(--w98-text) !important;
}

html[data-snowball-win98] ytd-thumbnail,
html[data-snowball-win98] ytd-thumbnail img,
html[data-snowball-win98] yt-image,
html[data-snowball-win98] yt-img-shadow {
  box-shadow: ${i} !important;
  background: var(--w98-thumb-bg) !important;
}

html[data-snowball-win98] *,
html[data-snowball-win98] *::before,
html[data-snowball-win98] *::after {
  border-radius: 0 !important;
  transition: none !important;
  animation-duration: 0.001s !important;
}

html[data-snowball-win98] #cinematics,
html[data-snowball-win98] #cinematics canvas,
html[data-snowball-win98] ytd-watch-flexy[cinematics-enabled] #cinematics {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
}

/* Force Ark Pixel on subtitles regardless of user's font choice */
html[data-snowball-win98] #chinese-subtitle,
html[data-snowball-win98] #chinese-subtitle span,
html[data-snowball-win98] #english-subtitle,
html[data-snowball-win98] #english-subtitle span,
html[data-snowball-win98] .snow-english-text,
html[data-snowball-win98] .snow-chinese-text {
  font-family: ${a} !important;
  -webkit-font-smoothing: none !important;
  font-smooth: never !important;
  text-rendering: geometricPrecision !important;
}

html[data-snowball-win98] ytd-rich-grid-renderer #contents.ytd-rich-grid-renderer,
html[data-snowball-win98] #primary,
html[data-snowball-win98] #secondary {
  padding: 4px !important;
  gap: 4px !important;
}

html[data-snowball-win98] ::-webkit-scrollbar {
  width: 16px !important;
  height: 16px !important;
}
html[data-snowball-win98] ::-webkit-scrollbar-track {
  background: var(--w98-btn-face) !important;
  background-image:
    linear-gradient(45deg, var(--w98-surface) 25%, transparent 25%),
    linear-gradient(-45deg, var(--w98-surface) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--w98-surface) 75%),
    linear-gradient(-45deg, transparent 75%, var(--w98-surface) 75%) !important;
  background-size: 4px 4px !important;
}
html[data-snowball-win98] ::-webkit-scrollbar-thumb {
  background: var(--w98-surface) !important;
  box-shadow: ${n} !important;
}
html[data-snowball-win98] ::-webkit-scrollbar-button {
  background: var(--w98-surface) !important;
  box-shadow: ${n} !important;
  width: 16px !important;
  height: 16px !important;
}
`}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],kFvPd:[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"setFontLanguages",()=>m),o.export(r,"getFontDef",()=>h),o.export(r,"fontWithSiblings",()=>u),o.export(r,"getFontStack",()=>y),o.export(r,"getPlainFontStack",()=>w),o.export(r,"getFontWeight",()=>f),o.export(r,"fontKeysForLanguage",()=>k),o.export(r,"localizeFontKey",()=>x),o.export(r,"localizeFontKeyToNative",()=>v);let a="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",n={key:"default",kind:"sans",families:[],weight:600,labelKey:"options.System_Default"},i=Object.fromEntries([{key:"noto-sans",kind:"sans",families:["Noto Sans SC"],weight:500,load:{google:"Noto+Sans+SC:wght@500;600;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif",kind:"serif",families:["Noto Serif SC"],weight:500,load:{google:"Noto+Serif+SC:wght@500;600;700"},labelKey:"options.Noto_Serif"},{key:"lxgw-wenkai",kind:"script",families:["LXGW WenKai Screen","LXGW WenKai Screen R"],weight:400,load:{css:"https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.7.0/style.css"},labelKey:"options.LXGW_Wen_Kai"},{key:"xiaolai-sc",kind:"rounded",families:["Xiaolai SC"],weight:400,load:{css:"https://cdn.jsdelivr.net/npm/cn-fontsource-xiaolai-sc-regular@1.0.2/font.min.css"},labelKey:"options.Xiaolai_SC"},{key:"zcool-kuaile",kind:"display",families:["ZCOOL KuaiLe"],weight:400,load:{google:"ZCOOL+KuaiLe"},labelKey:"options.ZCool_Kuai_Le"},{key:"ark-pixel",kind:"pixel",families:["Ark Pixel","Pixelated MS Sans Serif"],weight:400,load:{local:"ark-pixel"},labelKey:"options.Ark_Pixel"},{key:"noto-sans-tc",kind:"sans",families:["Noto Sans TC"],weight:500,load:{google:"Noto+Sans+TC:wght@500;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif-tc",kind:"serif",families:["Noto Serif TC"],weight:500,load:{google:"Noto+Serif+TC:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"lxgw-wenkai-tc",kind:"script",families:["LXGW WenKai TC"],weight:400,load:{google:"LXGW+WenKai+TC"},labelKey:"options.LXGW_Wen_Kai"},{key:"noto-sans-jp",kind:"sans",families:["Noto Sans JP"],weight:500,load:{google:"Noto+Sans+JP:wght@500;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif-jp",kind:"serif",families:["Noto Serif JP"],weight:500,load:{google:"Noto+Serif+JP:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"klee-one",kind:"script",families:["Klee One"],weight:600,load:{google:"Klee+One:wght@600"},label:"Klee One"},{key:"zen-maru-gothic",kind:"rounded",families:["Zen Maru Gothic"],weight:500,load:{google:"Zen+Maru+Gothic:wght@500;700"},label:"Zen Maru Gothic"},{key:"noto-sans-kr",kind:"sans",families:["Noto Sans KR"],weight:500,load:{google:"Noto+Sans+KR:wght@500;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif-kr",kind:"serif",families:["Noto Serif KR"],weight:500,load:{google:"Noto+Serif+KR:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"gaegu",kind:"script",families:["Gaegu"],weight:700,load:{google:"Gaegu:wght@700"},label:"Gaegu"},{key:"jua",kind:"rounded",families:["Jua"],weight:400,load:{google:"Jua"},label:"Jua"},{key:"ibm-plex-sans-arabic",kind:"sans",families:["IBM Plex Sans Arabic"],weight:500,load:{google:"IBM+Plex+Sans+Arabic:wght@500;700"},label:"IBM Plex Sans Arabic"},{key:"amiri",kind:"serif",families:["Amiri"],weight:400,load:{google:"Amiri:wght@400;700"},label:"Amiri"},{key:"aref-ruqaa",kind:"script",families:["Aref Ruqaa"],weight:400,load:{google:"Aref+Ruqaa"},label:"Aref Ruqaa"},{key:"lalezar",kind:"display",families:["Lalezar"],weight:400,load:{google:"Lalezar"},label:"Lalezar"},{key:"sarabun",kind:"sans",families:["Sarabun"],weight:500,load:{google:"Sarabun:wght@500;700"},label:"Sarabun"},{key:"noto-serif-thai",kind:"serif",families:["Noto Serif Thai"],weight:500,load:{google:"Noto+Serif+Thai:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"charm",kind:"script",families:["Charm"],weight:700,load:{google:"Charm:wght@700"},label:"Charm"},{key:"mitr",kind:"rounded",families:["Mitr"],weight:400,load:{google:"Mitr:wght@400;600"},label:"Mitr"},{key:"hind",kind:"sans",families:["Hind"],weight:500,load:{google:"Hind:wght@500;700"},label:"Hind"},{key:"tiro-devanagari-hindi",kind:"serif",families:["Tiro Devanagari Hindi"],weight:400,load:{google:"Tiro+Devanagari+Hindi"},label:"Tiro Devanagari"},{key:"kalam",kind:"script",families:["Kalam"],weight:400,load:{google:"Kalam:wght@400;700"},label:"Kalam"},{key:"baloo-2",kind:"rounded",families:["Baloo 2"],weight:500,load:{google:"Baloo+2:wght@500;600;700"},label:"Baloo 2"},{key:"inter",kind:"sans",families:["Inter"],weight:500,load:{google:"Inter:wght@500;700"},label:"Inter"},{key:"source-serif-4",kind:"serif",families:["Source Serif 4"],weight:500,load:{google:"Source+Serif+4:wght@500;700"},label:"Source Serif"},{key:"patrick-hand",kind:"script",families:["Patrick Hand"],weight:400,load:{google:"Patrick+Hand"},label:"Patrick Hand"},{key:"nunito",kind:"rounded",families:["Nunito"],weight:600,load:{google:"Nunito:wght@500;600;800"},label:"Nunito"},{key:"vt323",kind:"pixel",families:["VT323"],weight:400,load:{google:"VT323"},label:"VT323"},{key:"caveat",kind:"script",families:["Caveat"],weight:600,load:{google:"Caveat:wght@600;700"},label:"Caveat"}].map(t=>[t.key,t])),l={"zh-hans":["noto-sans","noto-serif","lxgw-wenkai","xiaolai-sc","zcool-kuaile","ark-pixel"],"zh-hant":["noto-sans-tc","noto-serif-tc","lxgw-wenkai-tc","ark-pixel"],ja:["noto-sans-jp","noto-serif-jp","klee-one","zen-maru-gothic","ark-pixel"],ko:["noto-sans-kr","noto-serif-kr","gaegu","jua","ark-pixel"],ar:["ibm-plex-sans-arabic","amiri","aref-ruqaa","lalezar"],th:["sarabun","noto-serif-thai","charm","mitr"],hi:["hind","tiro-devanagari-hindi","kalam","baloo-2"],vi:["inter","source-serif-4","patrick-hand","nunito","vt323"],cyrillic:["inter","source-serif-4","caveat","nunito","ark-pixel"],latin:["inter","source-serif-4","patrick-hand","nunito","ark-pixel"]},A=["latin","vi","cyrillic","zh-hans","ja","ko","zh-hant","ar","th","hi"];function c(t){switch(t){case"zh-CN":return"zh-hans";case"zh-TW":case"zh-HK":return"zh-hant";case"ja":case"ko":case"ar":case"th":case"hi":case"vi":return t;case"ru":case"uk":case"bg":case"be":case"sr":return"cyrillic";default:return"latin"}}let s="zh-hans",d="latin",p=null;function m(t,e,r){s=c(t??"zh-CN"),d=c(e??"en"),p=r?c(r):null}function h(t){return t&&i[t]||n}function g(t,e){let r=e=>l[t].map(t=>i[t]).find(t=>t.kind===e);return r(e)??("display"===e?r("rounded"):void 0)}function u(t){let e=h(t);if("default"===e.key)return[];let r=p?g(p,e.kind)??e:e,o=[...p?[p]:[],s,d,...A],a=[r];for(let t of o){let e=g(t,r.kind);e&&!a.includes(e)&&a.push(e)}return a}let b=t=>`'${t}'`;function y(t){let e=u(t);if(0===e.length)return a;let r="serif"===h(t).kind?"serif":"pixel"===h(t).kind?"monospace":"sans-serif",o=e.flatMap(t=>t.families).map(b).join(", ");return`${o}, -apple-system, BlinkMacSystemFont, ${r}`}function w(t){let e=h(t);return"default"===e.key?a:`${e.families.map(b).join(", ")}, -apple-system, BlinkMacSystemFont, sans-serif`}function f(t){return(u(t)[0]??n).weight}function k(t){return l[c(t)]}function x(t,e){return C(t,c(e))}function v(t){return C(t,s)}function C(t,e){let r=h(t);return"default"===r.key?"default":l[e].includes(r.key)?r.key:g(e,r.kind)?.key??"default"}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4OKnj":[function(t,e,r){var o=t("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"ensureFontLoaded",()=>A),o.export(r,"FONT_LANGUAGE_KEYS",()=>s),o.export(r,"refreshFontLanguages",()=>p),o.export(r,"initializeFonts",()=>h);var a=t("./fontRegistry");function n(t){let e="snowplay-opendyslexic-style";if(t){if(!document.getElementById(e)){let t=document.createElement("style");t.id=e,t.textContent=`
        /* Override English fonts in subtitles */
        #english-subtitle, #english-subtitle span, .snow-english-text {
           font-family: 'OpenDyslexic', sans-serif !important;
        }
      `,document.head.appendChild(t)}}else{let t=document.getElementById(e);t&&t.remove()}}function i(t,e){if(document.getElementById(t))return;let r=document.createElement("link");r.id=t,r.rel="stylesheet",r.href=e,(document.head||document.documentElement).appendChild(r)}function l(t){let e=t.load;e&&("local"in e?function(){let t="snowplay-ark-pixel-font-face";if(document.getElementById(t))return;let e=t=>chrome.runtime.getURL(`assets/fonts/ark-pixel-12px-proportional-${t}.ttf.woff2`),r=document.createElement("style");r.id=t,r.textContent=`
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${e("latin")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+0000-007F, U+00A0-024F, U+0400-04FF, U+2000-206F, U+2070-209F, U+20A0-20CF, U+2100-214F;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${e("zh_cn")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+3000-303F, U+4E00-9FFF, U+FF00-FFEF;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${e("ja")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+3040-309F, U+30A0-30FF, U+31F0-31FF;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${e("ko")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+1100-11FF, U+3130-318F, U+AC00-D7AF;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${e("zh_tw")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+3400-4DBF, U+20000-2A6DF;
    }
  `,document.head.appendChild(r)}():"google"in e?i(`snowball-font-${t.key}`,`https://fonts.googleapis.com/css2?family=${e.google}&display=swap`):i(`snowball-font-${t.key}`,e.css))}function A(t,e=!0){let r=e?(0,a.fontWithSiblings)(t):[(0,a.getFontDef)(t)];r.forEach(l)}function c(t){document.documentElement.style.setProperty("--app-font-family",(0,a.getFontStack)(t)),A(t)}let s=["targetLanguage","sourceLanguage","language","original_only"];function d(t){let e=t=>"string"==typeof t?t:void 0;(0,a.setFontLanguages)(e(t.targetLanguage),e(t.sourceLanguage),!0===t.original_only?e(t.language):void 0)}async function p(){d(await chrome.storage.local.get(s))}let m=["ui_font_family","app_font_family",...s];function h(){let t=window.location.hostname.includes("youtube.com"),e={},r=()=>{d(e),c(e.ui_font_family),t&&A(e.app_font_family)};c("default");try{chrome.storage.local.get(m,t=>{m.forEach(r=>{e[r]=t?.[r]}),r()}),chrome.storage.onChanged.addListener((t,o)=>{if("local"!==o)return;let a=m.filter(e=>t[e]);0!==a.length&&(a.forEach(r=>{e[r]=t[r].newValue}),r())})}catch{}t&&(A("nunito",!1),function(){let t="snowplay-opendyslexic-font-face";if(!document.getElementById(t)){let e=chrome.runtime.getURL("assets/fonts/OpenDyslexic-Regular.woff"),r=document.createElement("style");r.id=t,r.textContent=`
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${e}') format('woff');
        font-weight: normal;
        font-style: normal;
      }
    `,document.head.appendChild(r)}chrome.storage.local.get(["open_dyslexic_enabled"],t=>{n(!0===t.open_dyslexic_enabled)})}(),chrome.storage.onChanged.addListener((t,e)=>{"local"===e&&t.open_dyslexic_enabled&&n(t.open_dyslexic_enabled.newValue)}))}},{"./fontRegistry":"kFvPd","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}]},["bmhKW"],"bmhKW","parcelRequire2886"),globalThis.define=e;