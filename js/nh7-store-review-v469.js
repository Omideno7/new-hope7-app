/* New Hope 7 — More -> store review. No Settings card, theme controls,
 * custom rating form, auto-popup, profile access, fetch or storage writes. */
const STORES=Object.freeze({ios:'https://apps.apple.com/app/id6803187205?action=write-review',android:'https://play.google.com/store/apps/details?id=com.omideno7.newhope7'});
const COPY=Object.freeze({
 fa:{title:'شرکت در نظرسنجی',action:'ثبت امتیاز و نظر',choose:'فروشگاه برنامه را انتخاب کنید',external:'صفحهٔ برنامه در فروشگاه باز می‌شود',offline:'برای بازکردن فروشگاه، اینترنت را وصل کنید و دوباره بزنید.'},
 en:{title:'Rate & review',action:'Rate and write a review',choose:'Choose your app store',external:'Opens the app page in the store',offline:'Connect to the internet, then tap again to open the store.'},
 hr:{title:'Ocijenite aplikaciju',action:'Ostavite ocjenu i recenziju',choose:'Odaberite trgovinu aplikacija',external:'Otvara stranicu aplikacije u trgovini',offline:'Povežite se s internetom pa ponovno dodirnite za otvaranje trgovine.'}
});
export function detectedReviewPlatformV469(environment=globalThis){
 try{const p=environment.Capacitor?.getPlatform?.();if(p==='ios'||p==='android')return p}catch(_){}
 const n=environment.navigator||{},ua=String(n.userAgent||'');
 if(/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&Number(n.maxTouchPoints)>1))return 'ios';
 return /Android/i.test(ua)?'android':'web';
}
export function reviewOptionsV469(language='en',platform='web'){
 const locale=Object.prototype.hasOwnProperty.call(COPY,language)?language:'en';
 const devices=platform==='ios'?['ios']:platform==='android'?['android']:['ios','android'];
 return Object.freeze({language:locale,dir:locale==='fa'?'rtl':'ltr',...COPY[locale],links:Object.freeze(devices.map(id=>Object.freeze({id,store:id==='ios'?'App Store':'Google Play',href:STORES[id]})))});
}
export function mountMoreReviewV469(host,{language='en',platform=detectedReviewPlatformV469()}={}){
 if(!host?.ownerDocument)throw new TypeError('A More-menu element is required');
 const doc=host.ownerDocument,data=reviewOptionsV469(language,platform);
 const make=(tag,cls,value)=>{const el=doc.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el};
 for(const node of [...host.children])if(node.hasAttribute('data-review-menu469'))node.remove();
 const status=make('span','nh7-review-warning469');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const linkFor=(item,cls)=>{
  const link=make('a',cls);link.href=item.href;link.target='_blank';link.rel='external noopener noreferrer';link.referrerPolicy='no-referrer';link.dataset.reviewStore469=item.id;
  link.setAttribute('aria-label',data.action+' — '+item.store+'. '+data.external);
  link.addEventListener('click',e=>{if(doc.defaultView?.navigator.onLine===false){e.preventDefault();status.textContent=data.offline}else if(status.textContent)status.textContent=''});
  return link;
 };
 const icon=make('span','emoji','⭐');icon.setAttribute('aria-hidden','true');
 let tile;
 if(data.links.length===1){
  const item=data.links[0];tile=linkFor(item,'tile nh7-review-menu469');
  tile.append(icon,make('strong','',data.title),make('small','',data.action+' · '+item.store),status);
 }else{
  // No guessed destination on desktops: an inline choice, not an extra app page.
  tile=make('details','tile nh7-review-menu469');const summary=make('summary');
  summary.append(icon,make('strong','',data.title),make('small','',data.choose));tile.append(summary);
  const choices=make('div','nh7-review-choices469');
  for(const item of data.links){const link=linkFor(item,'secondary-btn');const label=make('bdi','',item.store);label.dir='ltr';link.append(label);choices.append(link)}
  tile.append(choices,status);
 }
 tile.dataset.reviewMenu469='';tile.lang=data.language;tile.dir=data.dir;host.append(tile);return tile;
}
