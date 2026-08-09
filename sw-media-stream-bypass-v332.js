/* New Hope 7 v3.3.2 — let Safari stream online church audio directly from Supabase */
(()=>{'use strict';
const SUPABASE='https://gpzcwffxnddhaeaogdyo.supabase.co';
const original=self.addEventListener.bind(self);
function directChurchAudio(request){
  try{
    if(!request||request.method!=='GET')return false;
    const url=new URL(request.url);
    return url.origin===SUPABASE&&/\/storage\/v1\/object\/(?:public|sign|authenticated)\/church-audio\//.test(url.pathname);
  }catch(_){return false}
}
self.addEventListener=function(type,listener,options){
  if(type!=='fetch')return original(type,listener,options);
  return original(type,function(event){
    /* No respondWith here for online church audio. The browser/Safari performs the native
       media request itself, including Range requests. Downloaded offline playback uses
       Blob/native URLs and does not depend on this cross-origin interception. */
    if(directChurchAudio(event.request))return;
    return listener.call(this,event);
  },options);
};
self.NH7_MEDIA_STREAM_BYPASS_VERSION='3.3.2';
})();
