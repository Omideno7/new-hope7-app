/* New Hope 7 — explicit store-review links, not a custom rating dialog.
 * No automatic prompt, user profiling, storage writes or submission detection.
 * Deliberately not imported by production index.html until preview approval.
 */
const STORES=Object.freeze({
  ios:'https://apps.apple.com/app/id6803187205?action=write-review',
  android:'https://play.google.com/store/apps/details?id=com.omideno7.newhope7'
});
const COPY=Object.freeze({
  fa:{title:'ثبت نظر دربارهٔ برنامه',body:'تجربهٔ خود از New Hope 7 را در فروشگاهی که برنامه را از آن دریافت کرده‌اید بنویسید.',apple:'ثبت نظر در App Store',google:'ثبت نظر در Google Play',note:'ثبت نظر اختیاری است و روی امتیازها یا دسترسی شما به مدرسه تأثیری ندارد.'},
  en:{title:'Review the app',body:'Share your experience with New Hope 7 in the store where you downloaded the app.',apple:'Review on the App Store',google:'Review on Google Play',note:'Reviews are optional and do not affect your points or school access.'},
  hr:{title:'Ocijenite aplikaciju',body:'Podijelite svoje iskustvo s aplikacijom New Hope 7 u trgovini iz koje ste je preuzeli.',apple:'Ostavite recenziju u App Storeu',google:'Ostavite recenziju na Google Playu',note:'Recenzije su dobrovoljne i ne utječu na vaše bodove ni pristup školi.'}
});
export function reviewOptionsV469(language='en',platform='web'){
  const locale=Object.hasOwn(COPY,language)?language:'en',copy=COPY[locale];
  const devices=platform==='ios'?['ios']:platform==='android'?['android']:['ios','android'];
  return Object.freeze({language:locale,dir:locale==='fa'?'rtl':'ltr',...copy,links:devices.map(id=>Object.freeze({id,label:id==='ios'?copy.apple:copy.google,href:STORES[id]}))});
}
export function detectedReviewPlatformV469(environment=globalThis){
  try{const p=environment.Capacitor?.getPlatform?.();if(p==='ios'||p==='android')return p}catch(_){}
  const n=environment.navigator||{},ua=String(n.userAgent||'');
  if(/iPhone|iPad|iPod/i.test(ua)||(/Macintosh/i.test(ua)&&Number(n.maxTouchPoints)>1))return 'ios';
  return /Android/i.test(ua)?'android':'web';
}
export function mountStoreReviewV469(host,{language='en',platform=detectedReviewPlatformV469()}={}){
  if(!host?.ownerDocument)throw new TypeError('A mounted element is required');
  const doc=host.ownerDocument,data=reviewOptionsV469(language,platform);
  const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e};
  const card=make('section','nh7-store-review469');card.lang=data.language;card.dir=data.dir;
  const heading=make('h3','',data.title),intro=make('p','',data.body),links=make('div','nh7-store-review-links469');
  for(const item of data.links){const link=make('a','secondary-btn',item.label);link.href=item.href;link.target='_blank';link.rel='external noopener noreferrer';link.dataset.reviewStore469=item.id;links.append(link)}
  card.append(heading,intro,links,make('p','muted',data.note));
  host.replaceChildren(card);
  // Ordinary links intentionally bypass quota-controlled requestReview APIs on taps.
  // No inference is made that opening a store means a rating was submitted.
  return card;
}
