/* New Hope 7 — optional, user-initiated store reviews. No automatic prompt,
 * custom star input, profile access, network request or storage write. */
const STORES=Object.freeze({ios:'https://apps.apple.com/app/id6803187205?action=write-review',android:'https://play.google.com/store/apps/details?id=com.omideno7.newhope7'});
const COPY=Object.freeze({
 fa:{title:'امتیاز و نظر شما',body:'تجربهٔ واقعی خود از New Hope 7 را با دیگران به اشتراک بگذارید. امتیازدهی و نوشتن نظر در فروشگاه انجام می‌شود.',action:'امتیاز دهید و نظر بنویسید',note:'ثبت نظر اختیاری است و روی امتیازهای داخل اپ یا دسترسی شما تأثیری ندارد.',external:'در فروشگاه باز می‌شود',offline:'برای بازکردن فروشگاه به اینترنت متصل شوید و دوباره روی دکمه بزنید.'},
 en:{title:'Rate & review',body:'Share your honest experience with New Hope 7. Give your rating and write your review in the app store.',action:'Rate and write a review',note:'Reviews are optional and do not affect your in-app points or access.',external:'Opens the app store',offline:'Connect to the internet, then tap the button again to open the store.'},
 hr:{title:'Ocjena i recenzija',body:'Podijelite svoje iskreno iskustvo s aplikacijom New Hope 7. Ocjenu i recenziju ostavite u trgovini aplikacija.',action:'Ocijenite i napišite recenziju',note:'Recenzije su dobrovoljne i ne utječu na vaše bodove ni pristup sadržaju.',external:'Otvara trgovinu aplikacija',offline:'Povežite se s internetom pa ponovno dodirnite gumb za otvaranje trgovine.'}
});
export function reviewOptionsV469(language='en',platform='web'){
 const locale=Object.prototype.hasOwnProperty.call(COPY,language)?language:'en';
 const devices=platform==='ios'?['ios']:platform==='android'?['android']:['ios','android'];
 return Object.freeze({language:locale,dir:locale==='fa'?'rtl':'ltr',...COPY[locale],links:Object.freeze(devices.map(id=>Object.freeze({id,store:id==='ios'?'App Store':'Google Play',href:STORES[id]})))});
}
export function detectedReviewPlatformV469(environment=globalThis){
 try{const p=environment.Capacitor?.getPlatform?.();if(p==='ios'||p==='android')return p}catch(_){}
 const n=environment.navigator||{},ua=String(n.userAgent||'');
 if(/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&Number(n.maxTouchPoints)>1))return 'ios';
 return /Android/i.test(ua)?'android':'web';
}
export function mountStoreReviewV469(host,{language='en',platform=detectedReviewPlatformV469()}={}){
 if(!host?.ownerDocument)throw new TypeError('A host element is required');
 const doc=host.ownerDocument,data=reviewOptionsV469(language,platform);
 const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
 const card=make('section','nh7-store-review469');card.lang=data.language;card.dir=data.dir;card.setAttribute('aria-label',data.title);
 const head=make('div','nh7-review-head469'),icon=make('span','nh7-review-symbol469','☆'),titles=make('div');icon.setAttribute('aria-hidden','true');
 const brand=make('span','nh7-review-brand469','NEW HOPE 7');brand.dir='ltr';titles.append(brand,make('h3','',data.title));head.append(icon,titles);
 const links=make('div','nh7-store-review-links469'),status=make('p','nh7-review-status469');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 for(const item of data.links){
  const link=make('a','nh7-review-link469');link.href=item.href;link.target='_blank';link.rel='external noopener noreferrer';link.referrerPolicy='no-referrer';link.dataset.reviewStore469=item.id;
  link.setAttribute('aria-label',data.action+' — '+item.store+'. '+data.external);
  const copy=make('span','nh7-review-link-copy469'),store=make('bdi','',item.store);store.dir='ltr';copy.append(make('span','',data.action),store);
  const arrow=make('span','nh7-review-arrow469','↗');arrow.setAttribute('aria-hidden','true');link.append(copy,arrow);
  link.addEventListener('click',e=>{
   // A user gesture is the only trigger. Never infer a submitted review on return.
   if(doc.defaultView?.navigator.onLine===false){e.preventDefault();status.textContent=data.offline}else if(status.textContent)status.textContent='';
  });
  links.append(link);
 }
 card.append(head,make('p','nh7-review-intro469',data.body),links,make('p','nh7-review-note469',data.note),status);
 host.replaceChildren(card);return card;
}
