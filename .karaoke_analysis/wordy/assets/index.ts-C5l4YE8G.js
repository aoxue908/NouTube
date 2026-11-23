const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-CxvDV2TC.js","assets/wordyI18n-srT7ApvA.js","assets/wordyMark-DkKyBWvL.js","assets/messages-FUSvB02k.js","assets/messages-BD2XHN-d.js","assets/languagePreparationPresentation-DqJdfyJH.js"])))=>i.map(i=>d[i]);
var j=Object.defineProperty;var X=(t,e,n)=>e in t?j(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var l=(t,e,n)=>X(t,typeof e!="symbol"?e+"":e,n);import{C,l as q,P as v}from"./messages-FUSvB02k.js";import{D as L}from"./messages-BD2XHN-d.js";import{S as Q,t as Z,W as J,a as ee,b as te}from"./wordyMark-DkKyBWvL.js";import{s as k,h as ne,g as $,T as U,a as re,p as oe,i as ae}from"./wordyI18n-srT7ApvA.js";import{g as ie}from"./languagePreparationPresentation-DqJdfyJH.js";const se="modulepreload",ce=function(t){return"/"+t},R={},le=function(e,n,r){let o=Promise.resolve();if(n&&n.length>0){document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),i=(a==null?void 0:a.nonce)||(a==null?void 0:a.getAttribute("nonce"));o=Promise.all(n.map(s=>{if(s=ce(s),s in R)return;R[s]=!0;const c=s.endsWith(".css"),h=c?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${s}"]${h}`))return;const d=document.createElement("link");if(d.rel=c?"stylesheet":se,c||(d.as="script",d.crossOrigin=""),d.href=s,i&&d.setAttribute("nonce",i),document.head.appendChild(d),c)return new Promise((g,m)=>{d.addEventListener("load",g),d.addEventListener("error",()=>m(new Error(`Unable to preload CSS for ${s}`)))})}))}return o.then(()=>e()).catch(a=>{const i=new Event("vite:preloadError",{cancelable:!0});if(i.payload=a,window.dispatchEvent(i),!i.defaultPrevented)throw a})},de=`
  :host {
    all: initial;
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  button {
    font: inherit;
  }

  .wordy-hidden {
    display: none !important;
  }

  .wordy-trigger {
    position: fixed;
    z-index: 2147483646;
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    padding: 0;
    overflow: visible;
    border: 0;
    border-radius: 8px;
    appearance: none;
    background: transparent;
    color: #0b1c30;
    box-shadow: none;
    cursor: pointer;
    transition: transform 140ms ease;
  }

  .wordy-trigger:hover {
    transform: translateY(-1px) scale(1.04);
    box-shadow: none;
  }

  .wordy-trigger:active {
    transform: translateY(0) scale(0.96);
  }

  .wordy-trigger:focus-visible,
  .wordy-popover button:focus-visible {
    outline: 2px solid #007a35;
    outline-offset: 2px;
  }

  .wordy-trigger svg {
    display: block;
    width: 28px;
    height: 21px;
    overflow: visible;
    filter: drop-shadow(0 0 0.75px rgba(255, 255, 255, 0.96)) drop-shadow(0 1.5px 2.5px rgba(11, 28, 48, 0.28));
    transition: filter 140ms ease;
  }

  .wordy-trigger:hover svg {
    filter: drop-shadow(0 0 0.75px rgba(255, 255, 255, 0.98)) drop-shadow(0 2px 3px rgba(11, 28, 48, 0.34));
  }

  .wordy-popover {
    position: fixed;
    z-index: 2147483645;
    width: 320px;
    max-width: calc(100vw - 24px);
    max-height: min(72vh, 520px);
    overflow: auto;
    border: 1px solid rgba(214, 221, 232, 0.78);
    border-radius: 14px;
    background: #ffffff;
    box-shadow: 0 18px 48px rgba(58, 70, 92, 0.14), 0 3px 12px rgba(58, 70, 92, 0.08);
    color: #0b1c30;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .wordy-popover-content {
    display: flex;
    flex-direction: column;
  }

  .wordy-word-section {
    padding: 12px;
  }

  .wordy-popover-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .wordy-source-group {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 6px;
  }

  .wordy-translation-group {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    gap: 6px;
  }

  .wordy-source {
    margin: 0;
    overflow-wrap: anywhere;
    color: #697386;
    font-family: "Space Grotesk", "Avenir Next", Inter, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.35;
  }

  .wordy-source.wordy-source-sentence {
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 13px;
    font-weight: 600;
  }

  .wordy-icon-button {
    display: grid;
    width: 28px;
    height: 28px;
    flex: 0 0 auto;
    place-items: center;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: #7c8799;
    cursor: pointer;
    transition: background-color 140ms ease, color 140ms ease;
  }

  .wordy-icon-button:hover {
    background: #f0f3f8;
    color: #007a35;
  }

  .wordy-icon-button:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }

  .wordy-icon-button.wordy-speaking {
    background: #e7f7ee;
    color: #007a35;
    box-shadow: 0 0 0 2px rgba(0, 122, 53, 0.18);
  }

  .wordy-icon-button.wordy-close {
    color: #3c4a3d;
  }

  .wordy-icon-button.wordy-close:hover {
    background: #ffdad6;
    color: #93000a;
  }

  .wordy-icon-button svg {
    width: 16px;
    height: 16px;
  }

  .wordy-translation {
    margin: 6px 0 0;
    overflow-wrap: anywhere;
    color: #007a35;
    font-family: "Space Grotesk", "Avenir Next", Inter, sans-serif;
    font-size: 20px;
    font-weight: 760;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }

  .wordy-translation.wordy-translation-sentence {
    font-size: 16px;
    line-height: 1.35;
  }

  .wordy-examples {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 10px 12px 12px;
    border-top: 1px solid #e7ebf1;
    list-style: none;
  }

  .wordy-example {
    min-width: 0;
  }

  .wordy-example + .wordy-example {
    padding-top: 8px;
    border-top: 1px solid #eef1f5;
  }

  .wordy-example-learning-row {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
  }

  .wordy-example-target-row {
    display: flex;
    min-width: 0;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
  }

  .wordy-example-source,
  .wordy-example-translation {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .wordy-example-source {
    color: #0b1c30;
    font-size: 12px;
    line-height: 1.4;
  }

  .wordy-example-translation {
    margin-top: 3px;
    color: #7c8799;
    font-size: 12px;
    line-height: 1.4;
  }

  .wordy-example-highlight {
    color: #007a35;
    font-weight: 700;
  }

  .wordy-empty,
  .wordy-error-message {
    margin: 0;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.45;
  }

  .wordy-empty {
    padding: 10px 12px;
    background: #eff4ff;
    color: #3c4a3d;
  }

  .wordy-error-message {
    margin: 0 12px 10px;
    padding: 10px;
    background: #ffdad6;
    color: #93000a;
  }

  .wordy-error-action {
    align-self: flex-start;
    margin: 0 12px 12px;
    padding: 7px 10px;
    border: 0;
    border-radius: 9px;
    background: #007a35;
    color: #ffffff;
    cursor: pointer;
    font-size: 13px;
    font-weight: 700;
  }

  .wordy-error-action:disabled {
    cursor: wait;
    opacity: 0.55;
  }

  .wordy-preparation {
    margin: 12px;
    padding: 12px;
    border: 1px solid rgba(187, 203, 185, 0.2);
    border-radius: 10px;
    background: #eff4ff;
  }

  .wordy-preparation-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  .wordy-preparation-copy {
    min-width: 0;
  }

  .wordy-preparation-title,
  .wordy-preparation-detail {
    margin: 0;
  }

  .wordy-preparation-title {
    color: #0b1c30;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
  }

  .wordy-preparation-detail {
    margin-top: 2px;
    color: #3c4a3d;
    font-size: 10px;
    line-height: 1.4;
  }

  .wordy-preparation-progress {
    height: 6px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: #dce9ff;
  }

  .wordy-preparation-progress span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: #007a35;
    transition: width 140ms ease;
  }

  .wordy-preparation-action {
    margin-top: 10px;
    padding: 6px 10px;
    border: 0;
    border-radius: 6px;
    background: #007a35;
    color: #ffffff;
    cursor: pointer;
    font-size: 11px;
    font-weight: 700;
  }

  .wordy-preparation-action:disabled {
    cursor: wait;
    opacity: 0.55;
  }

  .wordy-arrow {
    position: fixed;
    z-index: 2147483646;
    width: 16px;
    height: 8px;
    border: 0;
    background: transparent;
    filter: drop-shadow(0 1px 1px rgba(11, 28, 48, 0.04));
  }

  .wordy-arrow::before,
  .wordy-arrow::after {
    position: absolute;
    content: "";
  }

  .wordy-arrow::before {
    inset: 0;
    background: rgba(214, 221, 232, 0.9);
  }

  .wordy-arrow::after {
    left: 1px;
    top: 1px;
    width: 14px;
    height: 7px;
    background: #ffffff;
  }

  .wordy-arrow[data-placement="below"]::before,
  .wordy-arrow[data-placement="below"]::after {
    clip-path: polygon(50% 0, 100% 100%, 0 100%);
  }

  .wordy-arrow[data-placement="above"]::before,
  .wordy-arrow[data-placement="above"]::after {
    clip-path: polygon(0 0, 100% 0, 50% 100%);
  }
`,E=`
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 10v4h4l5 4V6L8 10H4Z" fill="currentColor"></path>
    <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
  </svg>
`,H=`
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
  </svg>
`;function he(t,e){const n=t.trim().replace(/\s+/g," ");return!e||e.text.trim().replace(/\s+/g," ")!==n?{text:n}:{...e,text:n}}function ue(t){const e=(t||"").trim();return e?/[.!?。！？]/.test(e)||e.split(/\s+/).filter(Boolean).length>=4?!0:e.length>=28:!1}function A(t){return!ue(t)}class pe{constructor(e){l(this,"element");l(this,"title");l(this,"detail");l(this,"progress");l(this,"progressBar");l(this,"action");l(this,"onPrepare",null);this.element=document.createElement("section"),this.element.className="wordy-preparation wordy-hidden",this.element.setAttribute("aria-label","Language resources");const n=document.createElement("div");n.className="wordy-preparation-header";const r=document.createElement("div");r.className="wordy-preparation-copy",this.title=document.createElement("p"),this.title.className="wordy-preparation-title",this.detail=document.createElement("p"),this.detail.className="wordy-preparation-detail",this.detail.setAttribute("role","status"),r.append(this.title,this.detail);const o=document.createElement("button");o.type="button",o.className="wordy-icon-button wordy-close",o.setAttribute("aria-label","Close translation"),o.title="Close translation",o.innerHTML=H,o.addEventListener("click",e),n.append(r,o),this.progress=document.createElement("div"),this.progress.className="wordy-preparation-progress wordy-hidden",this.progress.setAttribute("role","progressbar"),this.progress.setAttribute("aria-valuemin","0"),this.progress.setAttribute("aria-valuemax","100"),this.progressBar=document.createElement("span"),this.progress.append(this.progressBar),this.action=document.createElement("button"),this.action.type="button",this.action.className="wordy-preparation-action wordy-hidden",this.action.addEventListener("click",()=>{this.runAction()}),this.element.append(n,this.progress,this.action)}render(e,n){this.onPrepare=n.onPrepare||null,this.element.classList.remove("wordy-hidden"),this.element.lang=n.locale,this.element.dir=n.direction,this.element.setAttribute("aria-label",n.messages.languageResourcesLabel);const r=ie(n.messages,e.phase);this.title.textContent=r.title,this.detail.textContent=r.detail;const o=typeof e.progress=="number"&&(e.phase==="preparing"||e.phase==="verifying"),a=Math.round((e.progress||0)*100);this.progress.classList.toggle("wordy-hidden",!o),this.progress.setAttribute("aria-valuenow",`${a}`),this.progressBar.style.width=`${a}%`;const i=!!(this.onPrepare&&(e.phase==="needs-preparation"||e.phase==="failed"));this.action.textContent=e.phase==="failed"?n.messages.retryLanguagePackDownload:n.messages.downloadLanguagePackAction,this.action.classList.toggle("wordy-hidden",!i),this.action.disabled=!1}hide(){this.element.classList.add("wordy-hidden"),this.onPrepare=null}async runAction(){if(!(!this.onPrepare||this.action.disabled)){this.action.disabled=!0;try{await this.onPrepare()}finally{this.action.disabled=!1}}}}const w=12,N=12,D=16,ge=8;function we(t){const e=Math.min(t.popoverWidth,t.viewportWidth-w*2),n=Math.min(t.popoverHeight,t.viewportHeight-w*2);if(!t.anchorRect)return{left:y((t.viewportWidth-e)/2,w,t.viewportWidth-e-w),top:y(t.viewportHeight*.58-n/2,w,t.viewportHeight-n-w),placement:"fallback"};const r=t.anchorRect.x+t.anchorRect.width/2,o=y(r-e/2,w,t.viewportWidth-e-w),a=t.anchorRect.y+t.anchorRect.height+N,i=t.anchorRect.y-n-N,s=a+n<=t.viewportHeight-w,c=i>=w,h=s||!c?"below":"above",d=y(h==="below"?a:i,w,t.viewportHeight-n-w);return{left:o,top:d,placement:h,arrowLeft:y(r-D/2,o+16,o+e-16-D),arrowTop:h==="below"?d-ge:d+n}}function y(t,e,n){return Math.min(Math.max(t,e),Math.max(e,n))}class me{constructor(e,n=()=>{}){l(this,"container");l(this,"arrow");l(this,"wordSection");l(this,"sourceText");l(this,"sourceGroup");l(this,"speakButton");l(this,"translationText");l(this,"translationGroup");l(this,"examplesList");l(this,"errorMessage");l(this,"errorAction");l(this,"preparationView");l(this,"speechService",new Q);l(this,"currentSpeechText","");l(this,"currentSpeechLanguage","");l(this,"currentErrorAction",null);l(this,"learningLanguage","en");l(this,"anchorDocumentRect",null);l(this,"activeSpeechButton",null);this.root=e,this.onDismiss=n,this.container=document.createElement("div"),this.container.className="wordy-popover wordy-hidden",this.container.setAttribute("role","dialog"),this.container.setAttribute("aria-label","Wordy translation"),this.arrow=document.createElement("div"),this.arrow.className="wordy-arrow wordy-hidden";const r=document.createElement("div");r.className="wordy-popover-content",this.wordSection=document.createElement("section"),this.wordSection.className="wordy-word-section";const o=document.createElement("div");o.className="wordy-popover-header",this.sourceGroup=document.createElement("div"),this.sourceGroup.className="wordy-source-group",this.sourceText=document.createElement("p"),this.sourceText.className="wordy-source",this.speakButton=x("Speak Learning word",E),this.speakButton.addEventListener("click",()=>this.toggleSourceSpeech()),this.sourceGroup.append(this.sourceText,this.speakButton);const a=x("Close translation",H);a.classList.add("wordy-close"),a.addEventListener("click",()=>this.hide()),o.append(this.sourceGroup,a),this.translationGroup=document.createElement("div"),this.translationGroup.className="wordy-translation-group",this.translationText=document.createElement("p"),this.translationText.className="wordy-translation",this.translationGroup.append(this.translationText),this.wordSection.append(o,this.translationGroup),this.examplesList=document.createElement("ul"),this.examplesList.className="wordy-examples wordy-example-section",this.errorMessage=document.createElement("p"),this.errorMessage.className="wordy-error-message wordy-hidden",this.errorAction=document.createElement("button"),this.errorAction.type="button",this.errorAction.className="wordy-error-action wordy-hidden",this.errorAction.addEventListener("click",()=>{this.runErrorAction()}),this.preparationView=new pe(()=>this.hide()),r.append(this.wordSection,this.examplesList,this.errorMessage,this.errorAction,this.preparationView.element),this.container.appendChild(r),this.root.append(this.arrow,this.container),document.addEventListener("mousedown",i=>{!this.isVisible()||i.composedPath().includes(this.container)||this.hide()}),document.addEventListener("keydown",i=>{i.key==="Escape"&&this.isVisible()&&this.hide()}),window.addEventListener("scroll",()=>this.isVisible()&&this.place(),{passive:!0,capture:!0}),window.addEventListener("resize",()=>this.isVisible()&&this.place(),{passive:!0})}render(e,n,r){this.stopSpeech(),this.learningLanguage=r||"en";const o=Z(e,this.learningLanguage),a=o.word.source,i=o.word.target;this.currentSpeechText=a.isSpeakable?a.text:i!=null&&i.isSpeakable?i.text:"",this.currentSpeechLanguage=a.isSpeakable?a.language:(i==null?void 0:i.language)||this.learningLanguage,this.currentErrorAction=null,this.setAnchor(n),this.showResultSurface();const s=!A(a.text),c=!!(i&&!A(i.text));this.sourceText.textContent=a.text,this.sourceText.classList.toggle("wordy-learning-word",a.isLearning),this.sourceText.classList.toggle("wordy-native-word",!a.isLearning),this.sourceText.classList.toggle("wordy-source-sentence",s),this.translationText.textContent=(i==null?void 0:i.text)||e.translation,this.translationText.classList.toggle("wordy-learning-word",!!(i!=null&&i.isLearning)),this.translationText.classList.toggle("wordy-native-word",!(i!=null&&i.isLearning)),this.translationText.classList.toggle("wordy-translation-sentence",c),a.isSpeakable?(this.sourceGroup.append(this.speakButton),this.configureSpeechButton(this.speakButton,a.isLearning?"Learning word":"source word")):i!=null&&i.isSpeakable?(this.translationGroup.append(this.speakButton),this.configureSpeechButton(this.speakButton,"Learning word")):this.hideSpeechButton(this.speakButton),this.errorMessage.classList.add("wordy-hidden"),this.errorAction.classList.add("wordy-hidden"),this.renderExamples(o),this.showAndPlace()}renderError(e,n,r={}){this.stopSpeech(),this.learningLanguage=r.learningLanguage||this.learningLanguage,this.currentSpeechText=r.sourceText||"",this.currentSpeechLanguage=r.sourceLanguage||this.learningLanguage,this.currentErrorAction=r.onAction||null,this.setAnchor(n),this.showResultSurface(),this.sourceText.textContent=r.sourceText||"Wordy",this.sourceText.classList.toggle("wordy-source-sentence",!!(r.sourceText&&!A(r.sourceText)));const o=!!(r.sourceText&&r.sourceIsLearning);o?this.configureSpeechButton(this.speakButton,"Learning word"):this.hideSpeechButton(this.speakButton),this.translationText.textContent="Translation unavailable",this.translationText.classList.add("wordy-translation-sentence"),this.renderFailureContext(r.contextSentence,r.selectedRange,o),this.errorMessage.textContent=e,this.errorMessage.classList.remove("wordy-hidden"),this.errorAction.textContent=r.actionLabel||"",this.errorAction.classList.toggle("wordy-hidden",!r.actionLabel||!r.onAction),this.errorAction.disabled=!1,this.showAndPlace()}renderPreparation(e,n,r){this.stopSpeech(),this.currentErrorAction=null,this.setAnchor(n),this.wordSection.classList.add("wordy-hidden"),this.examplesList.classList.add("wordy-hidden"),this.errorMessage.classList.add("wordy-hidden"),this.errorAction.classList.add("wordy-hidden"),this.preparationView.render(e,r),this.showAndPlace()}hide(){const e=this.isVisible();this.container.classList.add("wordy-hidden"),this.arrow.classList.add("wordy-hidden"),this.anchorDocumentRect=null,this.stopSpeech(),e&&this.onDismiss()}updateErrorMessage(e){this.errorMessage.textContent=e}renderExamples(e){var n;this.examplesList.replaceChildren(),this.examplesList.classList.toggle("wordy-hidden",!e.examples.length);for(const r of e.examples.slice(0,3)){const o=document.createElement("li");o.className="wordy-example";const a=document.createElement("div"),i=document.createElement("p");i.className=`wordy-example-source ${r.source.isLearning?"wordy-learning-example":"wordy-native-example"}`,B(i,r.source);const s=document.createElement("div");if(s.className="wordy-example-learning-row",r.source.isSpeakable){const d=r.source.isLearning?"Learning example":"source example",g=x(`Speak ${d}`,E);this.configureSpeechButton(g,d),g.addEventListener("click",()=>this.toggleSpeech(r.source.text,r.source.language,g,d)),s.append(i,g)}else s.append(i);const c=document.createElement("p");c.className=`wordy-example-translation ${(n=r.target)!=null&&n.isLearning?"wordy-learning-example":"wordy-native-example"}`;const h=document.createElement("div");if(h.className="wordy-example-target-row",r.target)if(B(c,r.target),r.target.isSpeakable){const d=x("Speak Learning example",E);this.configureSpeechButton(d,"Learning example"),d.addEventListener("click",()=>{var g,m;return this.toggleSpeech(((g=r.target)==null?void 0:g.text)||"",((m=r.target)==null?void 0:m.language)||this.learningLanguage,d,"Learning example")}),h.append(c,d)}else h.append(c);else c.textContent="Context translation unavailable.",h.append(c);a.append(s,h),o.append(a),this.examplesList.appendChild(o)}}toggleSourceSpeech(){this.toggleSpeech(this.currentSpeechText,this.currentSpeechLanguage||this.learningLanguage,this.speakButton,this.speakButton.dataset.wordySpeechTarget||"source word")}toggleSpeech(e,n,r,o){if(!e||!this.speechService.isSupported())return;if(this.activeSpeechButton===r){this.stopSpeech();return}this.stopSpeech();const a=this.speechService.speak(e,n,{onStart:()=>this.setSpeakingState(r,o,!0),onEnd:()=>this.setSpeakingState(r,o,!1),onError:()=>this.setSpeakingState(r,o,!1)});this.setSpeakingState(r,o,a)}renderFailureContext(e,n,r=!1){if(this.examplesList.replaceChildren(),this.examplesList.classList.toggle("wordy-hidden",!e),!e)return;const o=document.createElement("li");o.className="wordy-example";const a=document.createElement("p");if(a.className=r?"wordy-example-source wordy-learning-example":"wordy-example-source",fe(a,e,n),r){const i=document.createElement("div");i.className="wordy-example-learning-row";const s=x("Speak Learning example",E);this.configureSpeechButton(s,"Learning example"),s.addEventListener("click",()=>this.toggleSpeech(e,this.learningLanguage,s,"Learning example")),i.append(a,s),o.append(i)}else o.append(a);this.examplesList.appendChild(o)}async runErrorAction(){if(!(!this.currentErrorAction||this.errorAction.disabled)){this.errorAction.disabled=!0;try{await this.currentErrorAction()}finally{this.errorAction.disabled=!1}}}showResultSurface(){this.wordSection.classList.remove("wordy-hidden"),this.preparationView.hide()}stopSpeech(){if(this.speechService.stop(),this.activeSpeechButton){const e=this.activeSpeechButton.dataset.wordySpeechTarget||"source";this.setSpeakingState(this.activeSpeechButton,e,!1)}}setSpeakingState(e,n,r){e.classList.toggle("wordy-speaking",r),e.setAttribute("aria-label",r?`Stop ${n} speech`:`Speak ${n}`),e.title=r?`Stop ${n} speech`:`Speak ${n}`,this.activeSpeechButton=r?e:this.activeSpeechButton===e?null:this.activeSpeechButton}configureSpeechButton(e,n){const r=this.speechService.isSupported();e.classList.remove("wordy-hidden"),e.dataset.wordySpeechTarget=n,e.disabled=!r,e.setAttribute("aria-label",`Speak ${n}`),e.title=r?`Speak ${n}`:"Speech is unavailable in this browser"}hideSpeechButton(e){e.classList.add("wordy-hidden"),e.classList.remove("wordy-speaking"),delete e.dataset.wordySpeechTarget}setAnchor(e){this.anchorDocumentRect=e?{x:e.x+window.scrollX,y:e.y+window.scrollY,width:e.width,height:e.height}:null}showAndPlace(){this.container.style.visibility="hidden",this.container.classList.remove("wordy-hidden"),this.place(),this.container.style.visibility=""}place(){const e=this.anchorDocumentRect?{x:this.anchorDocumentRect.x-window.scrollX,y:this.anchorDocumentRect.y-window.scrollY,width:this.anchorDocumentRect.width,height:this.anchorDocumentRect.height}:void 0,n=we({anchorRect:e,viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,popoverWidth:this.container.offsetWidth||320,popoverHeight:this.container.offsetHeight||240});if(this.container.style.left=`${n.left}px`,this.container.style.top=`${n.top}px`,n.placement==="fallback"||n.arrowLeft===void 0||n.arrowTop===void 0){this.arrow.classList.add("wordy-hidden");return}this.arrow.style.left=`${n.arrowLeft}px`,this.arrow.style.top=`${n.arrowTop}px`,this.arrow.dataset.placement=n.placement,this.arrow.classList.remove("wordy-hidden")}isVisible(){return!this.container.classList.contains("wordy-hidden")}}function fe(t,e,n){if(!n||n.start<0||n.length<=0||n.start+n.length>e.length){t.textContent=e;return}t.append(document.createTextNode(e.slice(0,n.start)));const r=document.createElement("strong");r.className="wordy-example-highlight",r.textContent=e.slice(n.start,n.start+n.length),t.append(r,document.createTextNode(e.slice(n.start+n.length)))}function x(t,e){const n=document.createElement("button");return n.type="button",n.className="wordy-icon-button",n.setAttribute("aria-label",t),n.title=t,n.innerHTML=e,n}function B(t,e){const{text:n,highlightRange:r}=e;if(!r){t.textContent=n;return}t.append(document.createTextNode(n.slice(0,r.start)));const o=document.createElement("strong");o.className="wordy-example-highlight",o.textContent=n.slice(r.start,r.end),t.append(o,document.createTextNode(n.slice(r.end)))}function b(){const t=window.getSelection(),e=((t==null?void 0:t.toString())||"").trim();if(!e||!t||t.rangeCount===0)return{text:""};const n=t.getRangeAt(0),r=xe(n);return{text:e,rect:ye(t),...r}}function ye(t){if(!t||t.rangeCount===0)return;const e=t.getRangeAt(0);if(typeof e.getBoundingClientRect!="function")return;const n=e.getBoundingClientRect();if(!(!n||!n.width&&!n.height))return{x:n.x,y:n.y,width:n.width,height:n.height}}function xe(t){const e=M(t.startContainer),n=M(t.endContainer);if(!e||!n||_(e)||_(n))return{};const r=be(e,t);if(r)return r;const o=e.closest("p,li,blockquote,dd,dt,figcaption,h1,h2,h3,h4,h5,h6,article,section,div");if(!o||!o.contains(t.endContainer))return{};const a=o.textContent||"";if(!a.trim())return{};const i=document.createRange();i.selectNodeContents(o);try{i.setEnd(t.startContainer,t.startOffset)}catch{return{}}const s=i.toString().length,c=s+t.toString().length,h=Se(a,s,c,T(e));if(!h)return{pageLanguage:T(e)};const d=Le(h.text,s-h.start,c-h.start);return!d.text||d.text.length>2e3||d.selectedRange.length===0?{pageLanguage:T(e)}:{contextSentence:d.text,selectedRange:d.selectedRange,pageLanguage:T(e)}}function be(t,e){var d,g;const n=t.closest("[data-wordy-subtitle-context]");if(!n||!n.contains(e.endContainer))return null;const r=(d=n.dataset.wordySubtitleContext)==null?void 0:d.trim(),o=(g=n.textContent)==null?void 0:g.trim();if(!r||!o)return null;const a=document.createRange();a.selectNodeContents(n);try{a.setEnd(e.startContainer,e.startOffset)}catch{return null}const i=r.indexOf(o);if(i<0)return null;const s=e.toString().trim(),c=a.toString().length,h=i+c;return!s||r.slice(h,h+s.length)!==s?null:{contextSentence:r,contextSource:"youtube-subtitle",selectedRange:{start:h,length:s.length},pageLanguage:n.dataset.wordySubtitleLanguage}}function M(t){return t.nodeType===Node.ELEMENT_NODE?t:t.parentElement}function _(t){return!!t.closest('input,textarea,[contenteditable]:not([contenteditable="false"]),[role="textbox"]')}function T(t){var n;const e=((n=t.closest("[lang]"))==null?void 0:n.getAttribute("lang"))||document.documentElement.lang;return(e==null?void 0:e.trim())||void 0}function Se(t,e,n,r){return ve(t,r).find(i=>e>=i.start&&n<=i.start+i.text.length)||null}function ve(t,e){const n=Intl.Segmenter;if(n){const a=new n(e||void 0,{granularity:"sentence"});return Array.from(a.segment(t),i=>({text:i.segment,start:i.index}))}const r=[];let o=0;for(let a=0;a<t.length;a+=1)/[.!?。！？；;\n]/.test(t[a])&&(r.push({text:t.slice(o,a+1),start:o}),o=a+1);return o<t.length&&r.push({text:t.slice(o),start:o}),r}function Le(t,e,n){const r=new Array(t.length+1);let o="",a=!1;for(let c=0;c<t.length;c+=1){r[c]=o.length;const h=t[c];if(/\s/.test(h)){o&&!a&&(o+=" "),a=!0;continue}o+=h,a=!1}r[t.length]=o.length,o=o.trimEnd();const i=Math.min(r[Math.max(0,e)]||0,o.length),s=Math.min(r[Math.max(0,n)]||i,o.length);return{text:o,selectedRange:{start:i,length:Math.max(0,s-i)}}}const P="data-wordy-subtitle-gesture";function Xe(t){document.documentElement.setAttribute(P,t)}function qe(){document.documentElement.removeAttribute(P)}function Ee(){const t=document.documentElement.getAttribute(P);return t==="pending"||t==="dragging"?t:null}function Te(){return Ee()!==null}class ke{constructor(e,n){l(this,"button");l(this,"currentPayload",null);l(this,"preserveSubtitleSelection",!1);l(this,"popoverVisible",!1);l(this,"blockedSelectionKey",null);l(this,"enabled",!1);l(this,"preventSelectionLoss",e=>{e.preventDefault(),e.stopPropagation()});l(this,"handleClick",e=>{e.preventDefault(),e.stopPropagation(),this.currentPayload&&(this.onTranslate(this.currentPayload),this.hide())});l(this,"handleViewportChange",()=>{this.currentPayload&&this.refreshFromSelection()});l(this,"handleDocumentMouseDown",e=>{e.composedPath().includes(this.button)||this.hide()});l(this,"handleKeyDown",e=>{e.key==="Escape"&&this.hide()});l(this,"refreshFromSelection",()=>{if(!this.enabled||this.popoverVisible)return;if(Te()){this.blockedSelectionKey=null,this.hide();return}const e=b();if(!e.text||!e.rect){if(this.blockedSelectionKey=null,this.preserveSubtitleSelection&&this.currentPayload)return;this.hide();return}const n=I(e);if(this.blockedSelectionKey&&n===this.blockedSelectionKey){this.hide();return}this.blockedSelectionKey=null,this.currentPayload={...e,rect:e.rect},this.preserveSubtitleSelection=e.contextSource==="youtube-subtitle",this.place(e.rect),this.button.classList.remove("wordy-hidden")});this.onTranslate=n,this.button=document.createElement("button"),this.button.className="wordy-trigger wordy-hidden",this.button.type="button",this.button.title="Translate selection with Wordy",this.button.setAttribute("aria-label","Translate selection with Wordy"),this.button.innerHTML=J,this.button.addEventListener("mousedown",this.preventSelectionLoss),this.button.addEventListener("click",this.handleClick),e.appendChild(this.button)}setEnabled(e){if(this.enabled!==e){if(this.enabled=e,e){this.bindEvents(),this.refreshFromSelection();return}this.unbindEvents(),this.hide()}}setPopoverVisible(e){if(e){const n=this.currentPayload||b();this.blockedSelectionKey=I(n),this.hide()}this.popoverVisible=e}hide(){this.currentPayload=null,this.preserveSubtitleSelection=!1,this.button.classList.add("wordy-hidden")}bindEvents(){document.addEventListener("selectionchange",this.refreshFromSelection,{passive:!0}),document.addEventListener("mouseup",this.refreshFromSelection,{passive:!0}),document.addEventListener("keyup",this.refreshFromSelection,{passive:!0}),window.addEventListener("scroll",this.handleViewportChange,{passive:!0,capture:!0}),window.addEventListener("resize",this.refreshFromSelection,{passive:!0}),document.addEventListener("mousedown",this.handleDocumentMouseDown),document.addEventListener("keydown",this.handleKeyDown)}unbindEvents(){document.removeEventListener("selectionchange",this.refreshFromSelection),document.removeEventListener("mouseup",this.refreshFromSelection),document.removeEventListener("keyup",this.refreshFromSelection),window.removeEventListener("scroll",this.handleViewportChange,!0),window.removeEventListener("resize",this.refreshFromSelection),document.removeEventListener("mousedown",this.handleDocumentMouseDown),document.removeEventListener("keydown",this.handleKeyDown)}place(e){const a=e.x+(e.width-32)/2,i=e.y+e.height+0,s=e.y-32-0,c=i+32<=window.innerHeight-8?i:s,h=O(a,8,window.innerWidth-32-8),d=O(c,8,window.innerHeight-32-8);this.button.style.left=`${h}px`,this.button.style.top=`${d}px`}}function I(t){var e,n;return!t.text||!t.rect?null:[t.text,t.contextSource||"",t.contextSentence||"",((e=t.selectedRange)==null?void 0:e.start)??"",((n=t.selectedRange)==null?void 0:n.length)??"",t.pageLanguage||""].join("\0")}function O(t,e,n){return Math.min(Math.max(t,e),Math.max(e,n))}const z="wordy-dictionary-root";let u=null,p=null,F=null,f=0;function Ae(){if(window.__wordyDictionaryBootstrapped)return;window.__wordyDictionaryBootstrapped=!0;const t=Ce();u=new me(t,()=>{f+=1,p==null||p.setPopoverVisible(!1)}),p=new ke(t,e=>{Be(e)}),Pe(),Ne(),Re(),De(),K()}function Ce(){const t=document.getElementById(z);if(t!=null&&t.shadowRoot)return t.shadowRoot;const e=t||document.createElement("div");e.id=z,t||document.documentElement.appendChild(e);const n=e.attachShadow({mode:"open"}),r=document.createElement("style");return r.textContent=de,n.appendChild(r),n}function Pe(){chrome.runtime.onMessage.addListener((t,e,n)=>{if(!t||typeof t!="object")return!1;const r=t;if(r.type===C.readForPopup)return k({type:C.readCurrentDocument}).then(n).catch(()=>{n({ok:!1,error:"STORAGE_UNAVAILABLE"})}),!0;if(r.type===L.getPageSelection)return n({ok:!0,data:b()}),!1;if(r.type===L.translateContextMenu){const o=he(r.payload.text,F);return S(o,"contextmenu").then(()=>{n({ok:!0,data:!0})}),!0}return r.type===L.renderPopover?(p==null||p.setPopoverVisible(!0),"result"in r.payload&&r.payload.result?u==null||u.render(r.payload.result,r.payload.anchorRect,r.payload.learningLanguage):u==null||u.renderError(r.payload.error,r.payload.anchorRect),n({ok:!0,data:!0}),!1):(r.type===L.dismissPopover&&(p==null||p.hide(),u==null||u.hide(),n({ok:!0,data:!0})),!1)})}function Re(){document.addEventListener("contextmenu",()=>{const t=b();F=t.text?t:null},{capture:!0,passive:!0})}function Ne(){document.addEventListener("copy",t=>{if(!t.isTrusted)return;const e=b();e.text&&k({type:C.save,payload:{text:e.text,contextSource:e.contextSource,contextSentence:e.contextSentence,selectedRange:e.selectedRange,pageLanguage:e.pageLanguage}}).catch(n=>{console.warn("[Wordy][CopySnapshot] unable to save snapshot",n)})},{passive:!0})}function De(){var t,e;(e=(t=chrome.storage)==null?void 0:t.onChanged)==null||e.addListener((n,r)=>{r==="sync"&&ne(n)&&K()})}async function K(){try{const t=await $();p==null||p.setEnabled(t.selectionTranslationEnabled)}catch(t){console.warn("[Wordy][Dictionary] unable to synchronize enable state",t),p==null||p.setEnabled(!1)}}async function Be(t){await S(t,"selection")}async function S(t,e){p==null||p.setPopoverVisible(!0),f+=1;const n=f;let r="en";try{const o=await $();r=o.learningLanguage;const a=await k({type:U.translate,payload:{id:Ie(e),scene:e,text:t.text,contextText:t.contextSentence,selectedRange:t.selectedRange,languageEvidence:ee(t),languagePair:{learningLanguage:o.learningLanguage,nativeLanguage:o.nativeLanguage}}});if(n!==f)return;if(!a.ok){Me(a.error,t,o,e,n,a.requiredLanguagePair);return}u==null||u.render(te(a.data),t.rect,o.learningLanguage)}catch(o){if(n!==f)return;console.warn("[Wordy][Dictionary] selection translate failed",o),u==null||u.renderError("Translation is unavailable. Please try again.",t.rect,{...Y(t),learningLanguage:r,actionLabel:"Retry",onAction:()=>S(t,e)})}}function Me(t,e,n,r,o,a){const i=q(t);if(i){const s=a||{sourceLanguage:n.learningLanguage,targetLanguage:n.nativeLanguage},c=re(n.nativeLanguage),h=(g,m)=>{o===f&&(u==null||u.renderPreparation(g,e.rect,{...c,onPrepare:m}))},d=async()=>{try{(await oe(s,m=>h(m,d))).phase==="ready"&&o===f&&await S(e,r)}catch{h({languagePair:s,phase:"failed",error:"PREPARATION_FAILED"},d)}};h({languagePair:s,phase:i,error:t==="PREPARATION_REQUIRED"?void 0:t},i==="needs-preparation"||i==="failed"?d:void 0);return}u==null||u.renderError(_e(t),e.rect,{...Y(e),learningLanguage:n.learningLanguage,actionLabel:t==="QUOTA_EXCEEDED"?void 0:"Retry",onAction:t==="QUOTA_EXCEEDED"?void 0:()=>S(e,r)})}function Y(t){return{sourceText:t.text,sourceLanguage:t.pageLanguage,contextSentence:t.contextSentence,selectedRange:t.selectedRange}}function _e(t){return{UNSUPPORTED_BROWSER:"This browser does not support local translation.",UNSUPPORTED_PAIR:"This language combination is not supported.",POLICY_BLOCKED:"Local translation is disabled by browser policy.",QUOTA_EXCEEDED:"Local translation resources are unavailable due to browser limits.",CANCELLED:"Translation was cancelled.",SUPERSEDED:"This translation was replaced by a newer request."}[t]||"Translation is unavailable. Please try again."}let G=0;function Ie(t){return G+=1,`${t}-${G}`}const Oe=["script","style","noscript","template","textarea","input","select","option","code","pre","svg","canvas","iframe",'[contenteditable]:not([contenteditable="false"])','[role="textbox"]','[translate="no"]',"[hidden]",'[aria-hidden="true"]',"#wordy-dictionary-root",".imt-caption-container"].join(","),ze=4;class Ge{constructor(e,n){l(this,"sourceLanguage");l(this,"translationRevision",0);l(this,"translatedNodes",new Map);this.pageDocument=e,this.translateText=n}async translate(e){this.translationRevision+=1;const n=this.translationRevision,r={translated:0,failed:0,skipped:0};if(ae(e.sourceLanguage,e.targetLanguage))return r;const o=this.collectCandidates(r);let a=0;const i=async()=>{for(;a<o.length;){const c=o[a];a+=1,await this.translateCandidate(c,e,r,n)}},s=Math.min(ze,o.length);return await Promise.all(Array.from({length:s},()=>i())),r.translated>0&&!this.sourceLanguage&&(this.sourceLanguage=e.sourceLanguage),r}getState(){return{isTranslated:this.translatedNodes.size>0,...this.sourceLanguage?{sourceLanguage:this.sourceLanguage}:{}}}restore(){this.translationRevision+=1;const e={restored:0,skipped:0};for(const[n,r]of this.translatedNodes)n.isConnected&&n.data===r.translatedData?(n.data=r.originalData,e.restored+=1):e.skipped+=1;return this.translatedNodes.clear(),e}reset(){this.translationRevision+=1,this.translatedNodes.clear(),this.sourceLanguage=void 0}collectCandidates(e){const n=this.pageDocument.body;if(!n)return[];const r=this.pageDocument.createTreeWalker(n,NodeFilter.SHOW_TEXT),o=[];let a=r.nextNode();for(;a;){const i=a,s=this.toCandidate(i);s==="protected"?e.skipped+=1:s&&o.push(s),a=r.nextNode()}return o}toCandidate(e){var a,i,s;if(this.translatedNodes.has(e))return null;const n=e.data.trim();if(!n||!new RegExp("\\p{L}","u").test(n))return null;const r=e.parentElement;if(!r||r.closest(Oe))return"protected";let o=r;for(;o;){const c=(a=this.pageDocument.defaultView)==null?void 0:a.getComputedStyle(o);if((c==null?void 0:c.display)==="none"||(c==null?void 0:c.visibility)==="hidden"||(c==null?void 0:c.visibility)==="collapse"||(c==null?void 0:c.opacity)==="0")return"protected";o=o.parentElement}return{node:e,sourceText:n,leadingWhitespace:((i=e.data.match(/^\s*/))==null?void 0:i[0])||"",trailingWhitespace:((s=e.data.match(/\s*$/))==null?void 0:s[0])||""}}async translateCandidate(e,n,r,o){const a=e.node.data;try{const i=(await this.translateText({text:e.sourceText,...n})).trim();if(!i||o!==this.translationRevision||!e.node.isConnected||e.node.data!==a){r.skipped+=1;return}const s=[e.leadingWhitespace,i,e.trailingWhitespace].join("");e.node.data=s,this.translatedNodes.set(e.node,{originalData:a,translatedData:s}),r.translated+=1}catch{r.failed+=1}}}const Ve="[Wordy][PageTranslation]";let V=0;function We(){if(window.__wordyPageTranslationBootstrapped)return;window.__wordyPageTranslationBootstrapped=!0;const t=new Ge(document,$e);let e=W();const n=()=>({...t.getState(),pageId:e});chrome.runtime.onMessage.addListener((r,o,a)=>{const i=r==null?void 0:r.type;if(i===v.getState)return a({ok:!0,data:n()}),!1;if(i===v.restorePage)return a({ok:!0,data:t.restore()}),!1;if(i===v.resetPage)return t.reset(),e=W(),a({ok:!0,data:n()}),!1;const s=r;return i!==v.translatePage?!1:(t.translate({sourceLanguage:s.payload.sourceLanguage,targetLanguage:s.payload.languagePair.nativeLanguage}).then(c=>{a({ok:!0,data:c})}).catch(c=>{console.warn(`${Ve} page translation failed`,c),a({ok:!1,error:"TRANSLATION_FAILED"})}),!0)})}function W(){return typeof crypto.randomUUID=="function"?crypto.randomUUID():`page-${Date.now()}-${Math.random().toString(36).slice(2)}`}async function $e(t){V+=1;const e=await k({type:U.translate,payload:{id:`page-${V}`,scene:"page",text:t.text,languageEvidence:{language:t.sourceLanguage,source:"document"},languagePair:{learningLanguage:t.sourceLanguage,nativeLanguage:t.targetLanguage}}});if(!e.ok)throw new Error(e.error);return e.data.translation}console.log("[Wordy] Content script loaded");Ae();We();window.location.hostname.includes("youtube.com")&&le(()=>import("./index-CxvDV2TC.js"),__vite__mapDeps([0,1,2,3,4,5])).then(t=>{t.bootstrap()});export{qe as c,Xe as s};
