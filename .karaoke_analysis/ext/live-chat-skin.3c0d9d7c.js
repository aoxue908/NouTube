var e,t;"function"==typeof(e=globalThis.define)&&(t=e,e=null),function(t,r,o,a,n){var i="undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{},l="function"==typeof i[a]&&i[a],c=l.cache||{},s="undefined"!=typeof module&&"function"==typeof module.require&&module.require.bind(module);function p(e,r){if(!c[e]){if(!t[e]){var o="function"==typeof i[a]&&i[a];if(!r&&o)return o(e,!0);if(l)return l(e,!0);if(s&&"string"==typeof e)return s(e);var n=Error("Cannot find module '"+e+"'");throw n.code="MODULE_NOT_FOUND",n}m.resolve=function(r){var o=t[e][1][r];return null!=o?o:r},m.cache={};var d=c[e]=new p.Module(e);t[e][0].call(d.exports,m,d,d.exports,this)}return c[e].exports;function m(e){var t=m.resolve(e);return!1===t?{}:p(t)}}p.isParcelRequire=!0,p.Module=function(e){this.id=e,this.bundle=p,this.exports={}},p.modules=t,p.cache=c,p.parent=l,p.register=function(e,r){t[e]=[function(e,t){t.exports=r},{}]},Object.defineProperty(p,"root",{get:function(){return i[a]}}),i[a]=p;for(var d=0;d<r.length;d++)p(r[d]);if(o){var m=p(o);"object"==typeof exports&&"undefined"!=typeof module?module.exports=m:"function"==typeof e&&e.amd?e(function(){return m}):n&&(this[n]=m)}}({"3EUuG":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"config",()=>l);var a=e("~/Fonts"),n=e("~/theme"),i=e("~/theme/tokens");let l={matches:["https://www.youtube.com/live_chat*","https://www.youtube.com/live_chat_replay*"],run_at:"document_start",all_frames:!0},c="snowball-chat-skin",s=null,p=!1;function d(){if(!s)return;let e=document.documentElement,t=document.getElementById(c);if(!(0,n.chatSkinEnabled)(s)){t?.remove(),e.style.removeProperty("--sbc-page");return}p||!document.head||(p=!0,(0,a.initializeFonts)());let{hue:r,chroma:o}=(0,n.themeAccent)(s);e.style.setProperty("--theme-hue",String(r)),e.style.setProperty("--theme-chroma",String(o));let i=(0,n.presetForConfig)(s);for(let[t,r]of[["--sbc-veil-light",i?.light?.panel],["--sbc-veil-dark",i?.dark?.panel]])r?e.style.setProperty(t,`${r.color} ${100*r.alpha}%`):e.style.removeProperty(t);let l=function(){let e;if(window.parent===window)return null;try{e=window.parent.document}catch{return null}let t=getComputedStyle(e.querySelector("ytd-app")??e.documentElement).backgroundColor;return t&&!/^rgba\(0, 0, 0, 0\)$|^transparent$/.test(t)?t:null}();l?e.style.setProperty("--sbc-page",l):e.style.removeProperty("--sbc-page");let d=(0,n.buildChatSkinCSS)(s),m=t??document.createElement("style");m.id=c,m.textContent!==d&&(m.textContent=d),e.lastElementChild!==m&&e.appendChild(m)}(async function(){s=await (0,n.loadThemeConfig)(),d(),chrome.storage.onChanged.addListener((e,t)=>{"local"===t&&e[n.THEME_STORAGE_KEY]&&(s={...i.DEFAULT_THEME_CONFIG,...e[n.THEME_STORAGE_KEY].newValue??{}},d(),window.setTimeout(d,300))}),document.addEventListener("DOMContentLoaded",d),window.addEventListener("load",d)})()},{"~/Fonts":"4OKnj","~/theme":"4sYvr","~/theme/tokens":"6V6Su","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4OKnj":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"ensureFontLoaded",()=>c),o.export(r,"FONT_LANGUAGE_KEYS",()=>p),o.export(r,"refreshFontLanguages",()=>m),o.export(r,"initializeFonts",()=>u);var a=e("./fontRegistry");function n(e){let t="snowplay-opendyslexic-style";if(e){if(!document.getElementById(t)){let e=document.createElement("style");e.id=t,e.textContent=`
        /* Override English fonts in subtitles */
        #english-subtitle, #english-subtitle span, .snow-english-text {
           font-family: 'OpenDyslexic', sans-serif !important;
        }
      `,document.head.appendChild(e)}}else{let e=document.getElementById(t);e&&e.remove()}}function i(e,t){if(document.getElementById(e))return;let r=document.createElement("link");r.id=e,r.rel="stylesheet",r.href=t,(document.head||document.documentElement).appendChild(r)}function l(e){let t=e.load;t&&("local"in t?function(){let e="snowplay-ark-pixel-font-face";if(document.getElementById(e))return;let t=e=>chrome.runtime.getURL(`assets/fonts/ark-pixel-12px-proportional-${e}.ttf.woff2`),r=document.createElement("style");r.id=e,r.textContent=`
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${t("latin")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+0000-007F, U+00A0-024F, U+0400-04FF, U+2000-206F, U+2070-209F, U+20A0-20CF, U+2100-214F;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${t("zh_cn")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+3000-303F, U+4E00-9FFF, U+FF00-FFEF;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${t("ja")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+3040-309F, U+30A0-30FF, U+31F0-31FF;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${t("ko")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+1100-11FF, U+3130-318F, U+AC00-D7AF;
    }
    @font-face {
      font-family: 'Ark Pixel';
      src: url('${t("zh_tw")}') format('woff2');
      font-weight: normal; font-style: normal; font-display: swap;
      unicode-range: U+3400-4DBF, U+20000-2A6DF;
    }
  `,document.head.appendChild(r)}():"google"in t?i(`snowball-font-${e.key}`,`https://fonts.googleapis.com/css2?family=${t.google}&display=swap`):i(`snowball-font-${e.key}`,t.css))}function c(e,t=!0){let r=t?(0,a.fontWithSiblings)(e):[(0,a.getFontDef)(e)];r.forEach(l)}function s(e){document.documentElement.style.setProperty("--app-font-family",(0,a.getFontStack)(e)),c(e)}let p=["targetLanguage","sourceLanguage","language","original_only"];function d(e){let t=e=>"string"==typeof e?e:void 0;(0,a.setFontLanguages)(t(e.targetLanguage),t(e.sourceLanguage),!0===e.original_only?t(e.language):void 0)}async function m(){d(await chrome.storage.local.get(p))}let h=["ui_font_family","app_font_family",...p];function u(){let e=window.location.hostname.includes("youtube.com"),t={},r=()=>{d(t),s(t.ui_font_family),e&&c(t.app_font_family)};s("default");try{chrome.storage.local.get(h,e=>{h.forEach(r=>{t[r]=e?.[r]}),r()}),chrome.storage.onChanged.addListener((e,o)=>{if("local"!==o)return;let a=h.filter(t=>e[t]);0!==a.length&&(a.forEach(r=>{t[r]=e[r].newValue}),r())})}catch{}e&&(c("nunito",!1),function(){let e="snowplay-opendyslexic-font-face";if(!document.getElementById(e)){let t=chrome.runtime.getURL("assets/fonts/OpenDyslexic-Regular.woff"),r=document.createElement("style");r.id=e,r.textContent=`
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${t}') format('woff');
        font-weight: normal;
        font-style: normal;
      }
    `,document.head.appendChild(r)}chrome.storage.local.get(["open_dyslexic_enabled"],e=>{n(!0===e.open_dyslexic_enabled)})}(),chrome.storage.onChanged.addListener((e,t)=>{"local"===t&&e.open_dyslexic_enabled&&n(e.open_dyslexic_enabled.newValue)}))}},{"./fontRegistry":"kFvPd","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],kFvPd:[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"setFontLanguages",()=>h),o.export(r,"getFontDef",()=>u),o.export(r,"fontWithSiblings",()=>g),o.export(r,"getFontStack",()=>f),o.export(r,"getPlainFontStack",()=>k),o.export(r,"getFontWeight",()=>x),o.export(r,"fontKeysForLanguage",()=>v),o.export(r,"localizeFontKey",()=>w),o.export(r,"localizeFontKeyToNative",()=>S);let a="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', sans-serif",n={key:"default",kind:"sans",families:[],weight:600,labelKey:"options.System_Default"},i=Object.fromEntries([{key:"noto-sans",kind:"sans",families:["Noto Sans SC"],weight:500,load:{google:"Noto+Sans+SC:wght@500;600;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif",kind:"serif",families:["Noto Serif SC"],weight:500,load:{google:"Noto+Serif+SC:wght@500;600;700"},labelKey:"options.Noto_Serif"},{key:"lxgw-wenkai",kind:"script",families:["LXGW WenKai Screen","LXGW WenKai Screen R"],weight:400,load:{css:"https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.7.0/style.css"},labelKey:"options.LXGW_Wen_Kai"},{key:"xiaolai-sc",kind:"rounded",families:["Xiaolai SC"],weight:400,load:{css:"https://cdn.jsdelivr.net/npm/cn-fontsource-xiaolai-sc-regular@1.0.2/font.min.css"},labelKey:"options.Xiaolai_SC"},{key:"zcool-kuaile",kind:"display",families:["ZCOOL KuaiLe"],weight:400,load:{google:"ZCOOL+KuaiLe"},labelKey:"options.ZCool_Kuai_Le"},{key:"ark-pixel",kind:"pixel",families:["Ark Pixel","Pixelated MS Sans Serif"],weight:400,load:{local:"ark-pixel"},labelKey:"options.Ark_Pixel"},{key:"noto-sans-tc",kind:"sans",families:["Noto Sans TC"],weight:500,load:{google:"Noto+Sans+TC:wght@500;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif-tc",kind:"serif",families:["Noto Serif TC"],weight:500,load:{google:"Noto+Serif+TC:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"lxgw-wenkai-tc",kind:"script",families:["LXGW WenKai TC"],weight:400,load:{google:"LXGW+WenKai+TC"},labelKey:"options.LXGW_Wen_Kai"},{key:"noto-sans-jp",kind:"sans",families:["Noto Sans JP"],weight:500,load:{google:"Noto+Sans+JP:wght@500;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif-jp",kind:"serif",families:["Noto Serif JP"],weight:500,load:{google:"Noto+Serif+JP:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"klee-one",kind:"script",families:["Klee One"],weight:600,load:{google:"Klee+One:wght@600"},label:"Klee One"},{key:"zen-maru-gothic",kind:"rounded",families:["Zen Maru Gothic"],weight:500,load:{google:"Zen+Maru+Gothic:wght@500;700"},label:"Zen Maru Gothic"},{key:"noto-sans-kr",kind:"sans",families:["Noto Sans KR"],weight:500,load:{google:"Noto+Sans+KR:wght@500;700"},labelKey:"options.Noto_Sans"},{key:"noto-serif-kr",kind:"serif",families:["Noto Serif KR"],weight:500,load:{google:"Noto+Serif+KR:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"gaegu",kind:"script",families:["Gaegu"],weight:700,load:{google:"Gaegu:wght@700"},label:"Gaegu"},{key:"jua",kind:"rounded",families:["Jua"],weight:400,load:{google:"Jua"},label:"Jua"},{key:"ibm-plex-sans-arabic",kind:"sans",families:["IBM Plex Sans Arabic"],weight:500,load:{google:"IBM+Plex+Sans+Arabic:wght@500;700"},label:"IBM Plex Sans Arabic"},{key:"amiri",kind:"serif",families:["Amiri"],weight:400,load:{google:"Amiri:wght@400;700"},label:"Amiri"},{key:"aref-ruqaa",kind:"script",families:["Aref Ruqaa"],weight:400,load:{google:"Aref+Ruqaa"},label:"Aref Ruqaa"},{key:"lalezar",kind:"display",families:["Lalezar"],weight:400,load:{google:"Lalezar"},label:"Lalezar"},{key:"sarabun",kind:"sans",families:["Sarabun"],weight:500,load:{google:"Sarabun:wght@500;700"},label:"Sarabun"},{key:"noto-serif-thai",kind:"serif",families:["Noto Serif Thai"],weight:500,load:{google:"Noto+Serif+Thai:wght@500;700"},labelKey:"options.Noto_Serif"},{key:"charm",kind:"script",families:["Charm"],weight:700,load:{google:"Charm:wght@700"},label:"Charm"},{key:"mitr",kind:"rounded",families:["Mitr"],weight:400,load:{google:"Mitr:wght@400;600"},label:"Mitr"},{key:"hind",kind:"sans",families:["Hind"],weight:500,load:{google:"Hind:wght@500;700"},label:"Hind"},{key:"tiro-devanagari-hindi",kind:"serif",families:["Tiro Devanagari Hindi"],weight:400,load:{google:"Tiro+Devanagari+Hindi"},label:"Tiro Devanagari"},{key:"kalam",kind:"script",families:["Kalam"],weight:400,load:{google:"Kalam:wght@400;700"},label:"Kalam"},{key:"baloo-2",kind:"rounded",families:["Baloo 2"],weight:500,load:{google:"Baloo+2:wght@500;600;700"},label:"Baloo 2"},{key:"inter",kind:"sans",families:["Inter"],weight:500,load:{google:"Inter:wght@500;700"},label:"Inter"},{key:"source-serif-4",kind:"serif",families:["Source Serif 4"],weight:500,load:{google:"Source+Serif+4:wght@500;700"},label:"Source Serif"},{key:"patrick-hand",kind:"script",families:["Patrick Hand"],weight:400,load:{google:"Patrick+Hand"},label:"Patrick Hand"},{key:"nunito",kind:"rounded",families:["Nunito"],weight:600,load:{google:"Nunito:wght@500;600;800"},label:"Nunito"},{key:"vt323",kind:"pixel",families:["VT323"],weight:400,load:{google:"VT323"},label:"VT323"},{key:"caveat",kind:"script",families:["Caveat"],weight:600,load:{google:"Caveat:wght@600;700"},label:"Caveat"}].map(e=>[e.key,e])),l={"zh-hans":["noto-sans","noto-serif","lxgw-wenkai","xiaolai-sc","zcool-kuaile","ark-pixel"],"zh-hant":["noto-sans-tc","noto-serif-tc","lxgw-wenkai-tc","ark-pixel"],ja:["noto-sans-jp","noto-serif-jp","klee-one","zen-maru-gothic","ark-pixel"],ko:["noto-sans-kr","noto-serif-kr","gaegu","jua","ark-pixel"],ar:["ibm-plex-sans-arabic","amiri","aref-ruqaa","lalezar"],th:["sarabun","noto-serif-thai","charm","mitr"],hi:["hind","tiro-devanagari-hindi","kalam","baloo-2"],vi:["inter","source-serif-4","patrick-hand","nunito","vt323"],cyrillic:["inter","source-serif-4","caveat","nunito","ark-pixel"],latin:["inter","source-serif-4","patrick-hand","nunito","ark-pixel"]},c=["latin","vi","cyrillic","zh-hans","ja","ko","zh-hant","ar","th","hi"];function s(e){switch(e){case"zh-CN":return"zh-hans";case"zh-TW":case"zh-HK":return"zh-hant";case"ja":case"ko":case"ar":case"th":case"hi":case"vi":return e;case"ru":case"uk":case"bg":case"be":case"sr":return"cyrillic";default:return"latin"}}let p="zh-hans",d="latin",m=null;function h(e,t,r){p=s(e??"zh-CN"),d=s(t??"en"),m=r?s(r):null}function u(e){return e&&i[e]||n}function y(e,t){let r=t=>l[e].map(e=>i[e]).find(e=>e.kind===t);return r(t)??("display"===t?r("rounded"):void 0)}function g(e){let t=u(e);if("default"===t.key)return[];let r=m?y(m,t.kind)??t:t,o=[...m?[m]:[],p,d,...c],a=[r];for(let e of o){let t=y(e,r.kind);t&&!a.includes(t)&&a.push(t)}return a}let b=e=>`'${e}'`;function f(e){let t=g(e);if(0===t.length)return a;let r="serif"===u(e).kind?"serif":"pixel"===u(e).kind?"monospace":"sans-serif",o=t.flatMap(e=>e.families).map(b).join(", ");return`${o}, -apple-system, BlinkMacSystemFont, ${r}`}function k(e){let t=u(e);return"default"===t.key?a:`${t.families.map(b).join(", ")}, -apple-system, BlinkMacSystemFont, sans-serif`}function x(e){return(g(e)[0]??n).weight}function v(e){return l[s(e)]}function w(e,t){return C(e,s(t))}function S(e){return C(e,p)}function C(e,t){let r=u(e);return"default"===r.key?"default":l[t].includes(r.key)?r.key:y(t,r.kind)?.key??"default"}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],cHUbl:[function(e,t,r){r.interopDefault=function(e){return e&&e.__esModule?e:{default:e}},r.defineInteropFlag=function(e){Object.defineProperty(e,"__esModule",{value:!0})},r.exportAll=function(e,t){return Object.keys(e).forEach(function(r){"default"===r||"__esModule"===r||t.hasOwnProperty(r)||Object.defineProperty(t,r,{enumerable:!0,get:function(){return e[r]}})}),t},r.export=function(e,t,r){Object.defineProperty(e,t,{enumerable:!0,get:r})}},{}],"4sYvr":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"THEME_STORAGE_KEY",()=>a.THEME_STORAGE_KEY),o.export(r,"buildThemeCSS",()=>n.buildThemeCSS),o.export(r,"discoverYtVarNames",()=>i.discoverYtVarNames),o.export(r,"generateCustomPreset",()=>l.generateCustomPreset),o.export(r,"presetForConfig",()=>l.presetForConfig),o.export(r,"buildChatFrameCSS",()=>c.buildChatFrameCSS),o.export(r,"buildChatSkinCSS",()=>c.buildChatSkinCSS),o.export(r,"chatSkinEnabled",()=>c.chatSkinEnabled),o.export(r,"themeAccent",()=>c.themeAccent),o.export(r,"themeSkinOn",()=>c.themeSkinOn),o.export(r,"themeSurface",()=>c.themeSurface),o.export(r,"withThemeDefaults",()=>s),o.export(r,"loadThemeConfig",()=>p),o.export(r,"saveThemeConfig",()=>d);var a=e("./tokens"),n=e("./css-builder"),i=e("./yt-vars"),l=e("./preset-generator"),c=e("./chat-skin");function s(e){return e&&"object"==typeof e?{...a.DEFAULT_THEME_CONFIG,...e}:{...a.DEFAULT_THEME_CONFIG}}function p(){return new Promise(e=>{chrome.storage.local.get([a.THEME_STORAGE_KEY],t=>e(s(t[a.THEME_STORAGE_KEY])))})}function d(e){return new Promise(t=>{chrome.storage.local.set({[a.THEME_STORAGE_KEY]:e},()=>t())})}},{"./tokens":"6V6Su","./css-builder":"4TZno","./yt-vars":"4kCCU","./preset-generator":"4Viv9","./chat-skin":"dmhS3","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"6V6Su":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"THEME_STORAGE_KEY",()=>a),o.export(r,"DEFAULT_THEME_CONFIG",()=>n);let a="snowball_theme",n={enabled:!1,activePresetId:"default"}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4TZno":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"buildThemeCSS",()=>c);var a=e("./token-map"),n=e("./selectors"),i=e("./preset-generator");function l(e,t,r,o){let l=[...e.panel?[`  --snowball-panel-bg: ${(0,i.panelCss)(e.panel)};`]:[],...e.panelActive?[`  --snowball-panel-active-bg: ${e.panelActive};`]:[]],c=[function(e,t){let r=[];for(let o of Object.keys(a.TOKEN_TO_YT_VARS)){let n=[...a.TOKEN_TO_YT_VARS[o],...t[o]??[]],i=e[o];if(n.length&&null!=i)for(let e of n)r.push(`  ${e}: ${i} !important;`)}return r.join("\n")}(e.yt,o),...l].join("\n"),s=function({yt:e,pageGradient:t,pageGradientReversed:r},o){let a=new Map;for(let i of n.DIRECT_OVERRIDE_RULES){let l;let c=i.literal??e[i.tokenKey];if(null==c)continue;let s=i.pageSurface?i.reversed?r:t:void 0,p=s?`background: ${s} fixed ${c} !important;`:`${i.property}: ${c} !important;`;l=i.selector===n.ROOT_SELECTOR?o:i.selector.split(",").map(e=>`${o} ${e.trim()}`).join(", ");let d=a.get(l)??[];d.push(p),a.set(l,d)}let i=[];for(let[e,t]of a)i.push(`${e} {
  ${t.join("\n  ")}
}`);return i.join("\n\n")}(e,t);return`/* ${t} */
${t}, ${t} ytd-app, ${t} ${r} {
${c}
}

${s}`}function c(e,t={}){let r=["/* snowball theme \u2014 generated, do not edit by hand */"];return e.dark&&r.push(l(e.dark,"html[dark]","[dark]",t)),e.light&&r.push(l(e.light,"html:not([dark])","[light]",t)),r.join("\n\n")+"\n"}},{"./token-map":"gwa09","./selectors":"55zpY","./preset-generator":"4Viv9","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],gwa09:[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"TOKEN_TO_YT_VARS",()=>a);let a={bgPrimary:["--yt-sys-color-baseline--base-background","--yt-sys-color-baseline--solid-background","--yt-spec-base-background","--yt-spec-general-background-a"],bgSecondary:["--yt-sys-color-baseline--raised-background","--yt-sys-color-baseline--tonal-background","--yt-spec-general-background-b","--yt-spec-raised-background"],bgElevated:["--yt-sys-color-baseline--menu-background","--yt-sys-color-baseline--overlay-solid-background","--yt-spec-menu-background","--yt-spec-brand-background-primary"],textPrimary:["--yt-sys-color-baseline--text-primary","--yt-spec-text-primary","--ytd-searchbox-text-color","--ytd-icon-color"],textSecondary:["--yt-sys-color-baseline--text-secondary","--yt-spec-text-secondary"],textMuted:["--yt-sys-color-baseline--text-disabled","--yt-spec-text-disabled"],accent:["--yt-sys-color-baseline--call-to-action","--yt-sys-color-baseline--call-to-action-hover","--yt-spec-call-to-action","--yt-spec-themed-blue"],border:["--yt-sys-color-baseline--outline","--yt-sys-color-baseline--outline-opaque","--yt-sys-color-baseline--outline-rim","--yt-spec-outline","--yt-spec-10-percent-layer","--ytd-searchbox-border-color"],chipBg:["--yt-sys-color-baseline--button-chip-background-hover","--yt-spec-badge-chip-background","--yt-sys-color-baseline--suggested-action","--yt-spec-call-to-action-inverse","--yt-spec-brand-button-background","--yt-spec-suggested-action"],chipBgActive:[],chipText:[],chipTextActive:[],headerBg:["--yt-sys-color-baseline--solid-background","--yt-spec-brand-background-solid"],searchBg:["--ytd-searchbox-background"]}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"55zpY":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"ROOT_SELECTOR",()=>a),o.export(r,"DIRECT_OVERRIDE_RULES",()=>n);let a="html",n=[{selector:a,property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"ytd-app",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#background.ytd-masthead",property:"background",tokenKey:"bgPrimary",pageSurface:!0,reversed:!0},{selector:"ytd-tabbed-page-header tp-yt-app-toolbar",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#container.ytd-searchbox",property:"background-color",tokenKey:"searchBg"},{selector:"#container.ytd-searchbox",property:"border-color",tokenKey:"border"},{selector:".ytSearchboxComponentInputBox",property:"background-color",tokenKey:"searchBg"},{selector:".ytSearchboxComponentInputBox",property:"border-color",tokenKey:"border"},{selector:".ytSearchboxComponentSearchButton",property:"background-color",tokenKey:"chipBg"},{selector:".ytSearchboxComponentSearchButton",property:"border-color",tokenKey:"border"},{selector:".ytSearchboxComponentSuggestionsContainer",property:"background-color",tokenKey:"bgElevated"},{selector:"ytd-guide-renderer #guide-inner-content",property:"background",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#contentContainer.tp-yt-app-drawer",property:"background",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#guide-content.ytd-app",property:"background",tokenKey:"bgPrimary",pageSurface:!0},{selector:"ytd-page-manager",property:"color",tokenKey:"textPrimary"},{selector:"ytd-masthead",property:"color",tokenKey:"textPrimary"},{selector:"ytd-guide-renderer",property:"color",tokenKey:"textPrimary"},{selector:"ytd-guide-renderer #endpoint, ytd-guide-renderer tp-yt-paper-item, ytd-guide-renderer #guide-section-title, #guide-content",property:"color",tokenKey:"textPrimary"},{selector:"ytd-mini-guide-renderer",property:"color",tokenKey:"textPrimary"},{selector:"ytd-mini-guide-entry-renderer",property:"color",tokenKey:"textPrimary"},{selector:"ytd-page-manager yt-formatted-string, ytd-page-manager #video-title, ytd-page-manager #channel-name",property:"color",tokenKey:"textPrimary"},{selector:"ytd-page-manager a.yt-simple-endpoint:not(ytd-author-comment-badge-renderer a)",property:"color",tokenKey:"textPrimary"},{selector:".ytLockupMetadataViewModelTitle, .ytLockupMetadataViewModelTitle .ytAttributedStringHost",property:"color",tokenKey:"textPrimary"},{selector:".ytContentMetadataViewModelMetadataInline span, .ytContentMetadataViewModelMetadataInline a, .ytAttributedStringLinkCallToAction",property:"color",tokenKey:"textSecondary"},{selector:"ytd-page-manager #metadata-line span, ytd-page-manager #byline-container, ytd-page-manager yt-formatted-string.ytd-channel-name, ytd-page-manager #published-time-text",property:"color",tokenKey:"textSecondary"},{selector:"ytd-page-manager #subscriber-count, ytd-page-manager #info-strings",property:"color",tokenKey:"textMuted"},{selector:"#subscribe-button yt-button-shape button",property:"background-color",tokenKey:"chipBg"},{selector:"#subscribe-button yt-button-shape button.ytSpecButtonShapeNextFilled, #subscribe-button yt-button-shape button.yt-spec-button-shape-next--filled",property:"background-color",tokenKey:"accent"},{selector:"#subscribe-button yt-button-shape button.ytSpecButtonShapeNextFilled, #subscribe-button yt-button-shape button.yt-spec-button-shape-next--filled",property:"color",tokenKey:"bgPrimary"},{selector:"#notification-preference-button button",property:"background-color",tokenKey:"chipBg"},{selector:"button.ytSpecButtonShapeNextTonal",property:"background-color",tokenKey:"chipBg"},{selector:"button.ytSpecButtonShapeNextOutline",property:"background-color",tokenKey:"bgPrimary"},{selector:".button-container.ytd-rich-shelf-renderer",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"ytd-merch-shelf-renderer .arrow",property:"background-color",tokenKey:"bgElevated"},{selector:"ytd-merch-shelf-renderer .arrow",property:"color",tokenKey:"textPrimary"},{selector:"ytd-merch-shelf-renderer .arrow",property:"box-shadow",tokenKey:"bgElevated",literal:"none"},{selector:"ytd-merch-shelf-renderer .arrow, ytd-merch-shelf-renderer #left-arrow-container, ytd-merch-shelf-renderer #right-arrow-container",property:"margin",tokenKey:"bgElevated",literal:"0"},{selector:".ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment",property:"background-color",tokenKey:"accent"},{selector:".ytThumbnailOverlayProgressBarHostWatchedProgressBarSegment",property:"background-image",tokenKey:"accent",literal:"none"},{selector:".ytp-swatch-background-color",property:"background",tokenKey:"accent"},{selector:"yt-chip-cloud-chip-renderer .ytChipShapeChip",property:"background",tokenKey:"chipBg"},{selector:"yt-chip-cloud-chip-renderer .ytChipShapeChip",property:"color",tokenKey:"chipText"},{selector:"yt-chip-cloud-chip-renderer.iron-selected .ytChipShapeChip, yt-chip-cloud-chip-renderer[selected] .ytChipShapeChip",property:"background",tokenKey:"chipBgActive"},{selector:"yt-chip-cloud-chip-renderer.iron-selected .ytChipShapeChip, yt-chip-cloud-chip-renderer[selected] .ytChipShapeChip",property:"color",tokenKey:"chipTextActive"},{selector:"#frosted-glass",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#chips-wrapper ytd-button-renderer",property:"background-color",tokenKey:"bgPrimary",pageSurface:!0},{selector:"#skip-navigation",property:"background-color",tokenKey:"bgPrimary"},{selector:"#cinematics",property:"mix-blend-mode",tokenKey:"bgPrimary",literal:"lighten"},{selector:"#cinematics canvas",property:"mask-image",tokenKey:"bgPrimary",literal:"radial-gradient(ellipse at center, oklch(0 0 0) 25%, oklch(0 0 0 / 0) 65%)"},{selector:"#cinematics canvas",property:"-webkit-mask-image",tokenKey:"bgPrimary",literal:"radial-gradient(ellipse at center, oklch(0 0 0) 25%, oklch(0 0 0 / 0) 65%)"},{selector:"tp-yt-paper-dialog, ytd-popup-container, ytd-menu-popup-renderer",property:"background-color",tokenKey:"bgElevated"},{selector:"ytd-watch-metadata[description-collapsed] #description:hover",property:"background-color",tokenKey:"chipBg",literal:"color-mix(in oklch, var(--yt-spec-badge-chip-background), var(--yt-spec-text-primary) 8%)"},{selector:"ytd-comment-renderer #body",property:"color",tokenKey:"textPrimary"},{selector:"ytd-comment-renderer #content-text",property:"color",tokenKey:"textPrimary"},{selector:"ytd-comment-renderer #author-text",property:"color",tokenKey:"textSecondary"},{selector:"#sections.ytd-guide-renderer, ytd-guide-section-renderer",property:"border-color",tokenKey:"border"},{selector:"ytd-author-comment-badge-renderer",property:"background-color",tokenKey:"bgPrimary",literal:"var(--yt-basic-background-color, inherit)"},{selector:"ytd-author-comment-badge-renderer, ytd-author-comment-badge-renderer yt-formatted-string, ytd-author-comment-badge-renderer ytd-channel-name, ytd-author-comment-badge-renderer a",property:"color",tokenKey:"textPrimary",literal:"var(--yt-basic-foreground-title-color, inherit)"}]},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4Viv9":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"panelCss",()=>s),o.export(r,"presetForConfig",()=>p),o.export(r,"generateCustomPreset",()=>m),o.export(r,"deriveHues",()=>h);var a=e("./chat-skin");function n(e,t,r=1){return{yt:function(e,t,r=1){let o=e=>+(e*r).toFixed(4);return t?{bgPrimary:`oklch(0.16 ${o(.04)} ${e})`,bgSecondary:`oklch(0.20 ${o(.05)} ${e})`,bgElevated:`oklch(0.26 ${o(.05)} ${e})`,textPrimary:`oklch(0.93 ${o(.02)} ${e})`,textSecondary:`oklch(0.75 ${o(.04)} ${e})`,textMuted:`oklch(0.55 ${o(.03)} ${e})`,accent:`oklch(0.75 ${o(.18)} ${e})`,border:`oklch(0.30 ${o(.04)} ${e})`,chipBg:`oklch(0.24 ${o(.05)} ${e})`,chipBgActive:`oklch(0.88 ${o(.04)} ${e})`,chipText:`oklch(0.82 ${o(.04)} ${e})`,chipTextActive:`oklch(0.16 ${o(.04)} ${e})`,headerBg:`oklch(0.14 ${o(.05)} ${e})`,searchBg:`oklch(0.20 ${o(.05)} ${e})`}:{bgPrimary:`oklch(0.96 ${o(.03)} ${e})`,bgSecondary:`oklch(0.92 ${o(.04)} ${e})`,bgElevated:`oklch(0.98 ${o(.02)} ${e})`,textPrimary:`oklch(0.18 ${o(.04)} ${e})`,textSecondary:`oklch(0.38 ${o(.05)} ${e})`,textMuted:`oklch(0.55 ${o(.04)} ${e})`,accent:`oklch(0.55 ${o(.2)} ${e})`,border:`oklch(0.85 ${o(.03)} ${e})`,chipBg:`oklch(0.90 ${o(.04)} ${e})`,chipBgActive:`oklch(0.20 ${o(.04)} ${e})`,chipText:`oklch(0.22 ${o(.04)} ${e})`,chipTextActive:`oklch(0.96 ${o(.03)} ${e})`,headerBg:`oklch(0.94 ${o(.04)} ${e})`,searchBg:`oklch(0.97 ${o(.02)} ${e})`}}(e,t,r),panel:i(e,t,r,0)}}function i(e,t,r,o){return c(t?{l:.43,c:.075*r,alpha:.2}:{l:.93,c:.035*r,alpha:1},e,t,o)}let l={light:{l:1,c:0,alpha:.5},dark:{l:1,c:0,alpha:.1}};function c(e,t,r,o,a=l[r?"dark":"light"]){let n=(1-o)*e.alpha,i=o*a.alpha,c=n+i,s=(n*e.l+i*a.l)/c,p=(n*e.c+i*a.c)/c;return{color:`oklch(${+s.toFixed(4)} ${+p.toFixed(4)} ${t})`,alpha:+c.toFixed(3)}}function s({color:e,alpha:t}){return t>=1?e:e.replace(/\)$/,` / ${t})`)}function p(e){return(0,a.themeSkinOn)(e)?m(e.customHue,e.customChroma,e.enableSecondaryColor?e.customSecondaryShift??0:0,e.gradientStrength??0):null}let d={chroma:.5,lightL:.92,darkL:.21};function m(e,t,r,o=0){let a=t/.04,l=(e+r+360)%360,p=r*o,m=(e+p+360)%360,h=(n,h)=>{if(0===r)return n;let u=e=>+(e*a).toFixed(4),y=u((h?.04:.03)*(1+.8*Math.sin(Math.abs(p)*Math.PI/360))),g=h?.16:.96,b=`oklch(${g} ${y} ${e})`,f=+(g+((h?d.darkL:d.lightL)-g)*o).toFixed(4),k=+(y*(1+d.chroma*o)).toFixed(4),x=`oklch(${f} ${k} ${m})`,v=i(e,h,a,o),w=h?{l:.24,c:.05*a,alpha:1}:{l:.9,c:.04*a,alpha:1},S=s(c(w,l,h,o)),C=s(c(w,l,h,o,{l:.6,c:Math.min(5*t,.3),alpha:.2}));return{...n,panel:v,panelActive:C,...o>0?{pageGradient:`linear-gradient(155deg in oklab, ${b}, ${x})`,pageGradientReversed:`linear-gradient(335deg in oklab, ${b}, ${x})`}:{},yt:{...n.yt,accent:`oklch(${h?.75:.55} ${u(h?.18:.2)} ${l})`,chipBg:S,chipBgActive:`oklch(${h?.88:.2} ${u(.04)} ${l})`,chipTextActive:`oklch(${h?.16:.96} ${u(h?.04:.03)} ${l})`}}};return{id:"custom",light:h(n(e,!1,a),!1),dark:h(n(e,!0,a),!0)}}function h(e,t,r){if(t>.9||t<.1)return{primary:r,shift:0};let o=r-e;return o>180&&(o-=360),o<-180&&(o+=360),{primary:e,shift:o}}},{"./chat-skin":"dmhS3","@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],dmhS3:[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"chatSkinEnabled",()=>a),o.export(r,"themeAccent",()=>n),o.export(r,"themeSurface",()=>i),o.export(r,"themeSkinOn",()=>l),o.export(r,"buildChatSkinCSS",()=>b),o.export(r,"buildChatFrameCSS",()=>f);let a=e=>!e.win98Mode;function n(e){if(!e.enabled||null==e.customHue)return{hue:267,chroma:.2};let t=e.enableSecondaryColor?e.customSecondaryShift??0:0;return{hue:(e.customHue+t+360)%360,chroma:null!=e.customChroma?Math.min(5*e.customChroma,.3):.2}}function i(e){return e.enabled&&"custom"===e.activePresetId&&null!=e.customHue&&null!=e.customChroma?{hue:e.customHue,chroma:e.customChroma}:{hue:0,chroma:0}}function l(e){return e.enabled&&"custom"===e.activePresetId&&null!=e.customHue&&null!=e.customChroma}let c=`
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
`,s=`
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
`,p=`
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
`,m=`
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
`,h=`
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
`,u=`
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
`,y=`
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
`,g=`
* {
  border-radius: 0px !important;
}
`;function b(e){let t=[c,s,p,d,m,h,u,y].join("\n");return e.squareCorners?t.replace(/border-radius:[^;]+;/g,"border-radius: 0px !important;")+g:t}function f(e){let t=e.squareCorners?"0px":"14px";return`
/* snowball live chat frame */
ytd-live-chat-frame#chat {
  border: none !important;
  border-radius: ${t} !important;
  background-color: oklch(0 0 0 / 0.05) !important;
}
html[dark] ytd-live-chat-frame#chat {
  background-color: oklch(1 0 0 / 0.1) !important;
}
ytd-live-chat-frame#chat iframe#chatframe {
  border-radius: ${t} !important;
}
`}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}],"4kCCU":[function(e,t,r){var o=e("@parcel/transformer-js/src/esmodule-helpers.js");o.defineInteropFlag(r),o.export(r,"discoverYtVarNames",()=>i);let a={"#fff|#0f0f0f":"bgPrimary","#f9f9f9|#181818":"bgPrimary","#fff|#212121":"bgSecondary","#fff|#282828":"bgElevated","#0f0f0f|#f1f1f1":"textPrimary","#606060|#aaa":"textSecondary","#909090|#717171":"textMuted","rgba(0,0,0,0.1)|rgba(255,255,255,0.2)":"border","rgba(0,0,0,0.1)|rgba(255,255,255,0.1)":"border","rgba(0,0,0,0.05)|rgba(255,255,255,0.1)":"chipBg","#065fd4|#3ea6ff":"accent","#0556bf|#65b8ff":"accent"},n=e=>e.replace(/\s+/g,"").toLowerCase();function i(){let e=new Map,t=new Map;for(let r of Array.from(document.styleSheets)){let o;try{o=r.cssRules}catch{continue}!function e(t,r,o){for(let a of Array.from(t))if(a instanceof CSSStyleRule){let e="[light]"===a.selectorText?r:"[dark]"===a.selectorText?o:null;if(!e)continue;for(let t of Array.from(a.style))t.startsWith("--")&&e.set(t,n(a.style.getPropertyValue(t)))}else"cssRules"in a&&e(a.cssRules,r,o)}(o,e,t)}if(!e.size||!t.size)return null;let r={};for(let[o,n]of e){let e=t.get(o);if(null==e)continue;let i=a[`${n}|${e}`];i&&(r[i]??=[]).push(o)}return Object.keys(r).length?r:null}},{"@parcel/transformer-js/src/esmodule-helpers.js":"cHUbl"}]},["3EUuG"],"3EUuG","parcelRequire2886"),globalThis.define=t;