import{i as g,n as d}from"./wordyI18n-srT7ApvA.js";function E(n){if(n!=null&&n.pageLanguage)return{language:n.pageLanguage,source:n.contextSource==="youtube-subtitle"?"subtitle":"document"}}function h(n,e){return g(n.sourceLanguage,e)?"source":g(n.targetLanguage,e)?"target":null}function x(n){var r,t;const e=n.contextExample?{source:n.contextExample.source,translation:n.contextExample.translation,translationError:n.contextExample.translationError,sourceLanguage:(r=n.contextExample.pair)==null?void 0:r.sourceLanguage,targetLanguage:(t=n.contextExample.pair)==null?void 0:t.targetLanguage,sourceTerm:n.contextExample.sourceTerm}:null;return{sourceText:n.sourceText,translation:n.translation,contexts:e?[e]:[],targetLanguage:n.pair.targetLanguage,sourceLanguage:n.pair.sourceLanguage}}const L=/[\p{L}\p{M}\p{N}]/u,w=/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;function p(n,e,r){const t=e.trim();if(!t||t.length>n.length)return null;const o=l(r),i=!w.test(t);for(let s=0;s<=n.length-t.length;s+=1){const u=n.slice(s,s+t.length);if(o.compare(u,t)!==0)continue;const a=s+t.length;if(!(i&&(c(n[s-1])||c(n[a]))))return{start:s,end:a}}return null}function l(n){try{return new Intl.Collator(n||void 0,{usage:"search",sensitivity:"base"})}catch{return new Intl.Collator(void 0,{usage:"search",sensitivity:"base"})}}function c(n){return!!(n&&L.test(n))}function C(n,e){const r=h(n,e),t=f(n.sourceText,n.translation,n.sourceLanguage,n.targetLanguage,r,null,null);return{learningSide:r,word:t,examples:n.contexts.map(o=>S(o,n,e))}}function S(n,e,r){const t=n.sourceLanguage||e.sourceLanguage,o=n.targetLanguage||e.targetLanguage,i=h({sourceLanguage:t,targetLanguage:o},r);return f(n.source,n.translation,t,o,i,m(n,e),n.translation?p(n.translation,e.translation,o):null)}function f(n,e,r,t,o,i,s){const u={text:n,language:r,isLearning:o==="source",isSpeakable:o==="source"||o===null,highlightRange:i},a=e?{text:e,language:t,isLearning:o==="target",isSpeakable:o==="target",highlightRange:s}:null;return{source:u,target:a,learning:o==="source"?u:o==="target"?a:null,counterpart:o==="source"?a:o==="target"?u:a}}function m(n,e){const r=n.sourceTerm;return r&&r.start>=0&&r.length>0&&r.start+r.length<=n.source.length?{start:r.start,end:r.start+r.length}:p(n.source,e.sourceText,e.sourceLanguage)}class R{isSupported(){return typeof window<"u"&&"speechSynthesis"in window&&typeof SpeechSynthesisUtterance<"u"}stop(){this.isSupported()&&window.speechSynthesis.cancel()}speak(e,r,t){const o=(e||"").trim();if(!o||!this.isSupported())return!1;const i=new SpeechSynthesisUtterance(o),s=d(r)||"en";i.lang=s;const u=y(s);return u&&(i.voice=u),i.onstart=()=>{var a;(a=t==null?void 0:t.onStart)==null||a.call(t)},i.onend=()=>{var a;(a=t==null?void 0:t.onEnd)==null||a.call(t)},i.onerror=()=>{var a;(a=t==null?void 0:t.onError)==null||a.call(t)},window.speechSynthesis.cancel(),window.speechSynthesis.speak(i),!0}}function y(n){const e=window.speechSynthesis.getVoices();if(!e.length)return null;const r=e.find(o=>o.lang.toLowerCase()===n.toLowerCase());if(r)return r;const t=n.split("-")[0];return e.find(o=>o.lang.toLowerCase().startsWith(`${t}-`))||null}const v=`<svg
  xmlns="http://www.w3.org/2000/svg"
  width="108"
  height="82"
  viewBox="10 28 108 82"
  fill="none"
  aria-hidden="true"
  focusable="false"
  data-wordy-mark=""
>
  <title>Wordy</title>
  <path
    fill="#007A35"
    d="M30 34h58c9 0 16 7 16 16s-7 16-16 16h-8c-5 0-8 2-11 5l-2 2c-2 2-4 2-6 0l-2-2c-3-3-6-5-11-5H30c-9 0-16-7-16-16s7-16 16-16Z"
  />
  <path
    fill="#00D166"
    d="M48 72h2c5 0 8 2 11 5l2 2c2 2 4 2 6 0l2-2c3-3 6-5 11-5h16c9 0 16 7 16 16s-7 16-16 16H48c-9 0-16-7-16-16s7-16 16-16Z"
  />
</svg>
`,H=v;export{R as S,H as W,E as a,x as b,C as t};
