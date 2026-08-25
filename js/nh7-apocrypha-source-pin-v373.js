/* New Hope 7 QA v3.7.3 — pin the fresh reader to the user-approved RC 2.4.0.250 corpus. */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_SOURCE_PIN_V373__)return;
window.__NH7_APOCRYPHA_SOURCE_PIN_V373__=true;
const VERSION='3.7.3-apocrypha-source-pin';
const APPROVED='https://raw.githack.com/Omideno7/new-hope7-app/a8521f7b87ee68b7bdbbfd081ed63e679e9bad5a/data/apocrypha/runtime/apocrypha-browser-19.preview.json?v=2500';
const previousFetch=window.fetch.bind(window);
const runtime=/data\/apocrypha\/runtime\/apocrypha-browser-19\.preview\.json(?:[?#]|$)/;
window.fetch=function nh7ApprovedApocryphaSource(input,init={}){
  try{
    const raw=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';
    if(runtime.test(new URL(raw,document.baseURI).href)){
      return previousFetch(APPROVED,{...init,cache:'no-store'});
    }
  }catch(error){console.warn('[NH7 approved Apocrypha pin]',error)}
  return previousFetch(input,init);
};
window.NH7_APOCRYPHA_APPROVED_SOURCE={version:VERSION,rc:'2.4.0.250',commit:'a8521f7b87ee68b7bdbbfd081ed63e679e9bad5a',url:APPROVED};
window.NH7_APOCRYPHA_SOURCE_PIN_VERSION=VERSION;
})();
