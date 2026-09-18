/* Bible concordance v4.5.1. No account, storage, or database writes. */
export function normalizeBibleText(value, lang='en') {
  let s=String(value??'').normalize('NFKC').toLowerCase();
  if(lang==='fa') s=s.replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[ۀة]/g,'ه')
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,'');
  return s.replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'');
}
export function bibleTokens(value, lang='en') {
  const s=normalizeBibleText(value,lang);
  return s.match(lang==='fa'?/[\u0621-\u063A\u0641-\u064A\u066E-\u06D3\u06FA-\u06FC]+/g:
    lang==='en'?/[a-z]+(?:'[a-z]+)?/g:/[a-zčćđšž]+/g)||[];
}
export function createBibleKeywordsV451(ctx) {
  const {state,view,html,card,tr,l223:L,localNum:N,jfetch,navigate,localizeRef}=ctx;
  document.addEventListener('keydown',event=>{if(event.target?.id==='bibleSearch'&&event.key==='Enter'){event.preventDefault();view.querySelector('#runBibleSearch')?.click();}},true);
  const path='data/bible/keywords/bible_keywords_v450.json';
  const filters=new Map();
  let dataPromise=null,corpusPromise=null,serial=0;
  const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
  async function data() {
    if(!dataPromise) dataPromise=jfetch(path).then(d=>{
      for(const lang of ['fa','en','hr']) {
        const words=d?.languages?.[lang];
        if(!Array.isArray(words)||words.length!==2500||new Set(words.map(w=>normalizeBibleText(w.term,lang))).size!==2500)
          throw new Error('Invalid Bible keyword index: '+lang);
      }
      return d;
    }).catch(e=>{dataPromise=null;throw e;});
    return dataPromise;
  }
  async function corpus() {
    if(!corpusPromise) corpusPromise=(async()=>{
      await ctx.loadBibleMeta();
      const all=[];
      for(const group of ['01_18','19_39','40_66']) {
        if(!state.bible.groups[group]) state.bible.groups[group]=await jfetch(`data/bible/groups/bible_group_${group}.json`);
        all.push(...state.bible.groups[group].verses);
      }
      return all;
    })().catch(e=>{corpusPromise=null;throw e;});
    return corpusPromise;
  }
  function active(id,lang,mode,query='') {
    return id===serial&&state.lang===lang&&state.route==='bible'&&
      (mode==='keywords'?state.params?.mode==='keywords':String(state.params?.q||'').trim()===query);
  }
  function displayText(v) {
    const text=String(v.text?.[state.lang]||v.text?.en||'');
    return state.lang==='en'?text.replace(new RegExp('^\\s*'+Number(v.verse)+'\\.\\s+'),''):text;
  }
  function back(params) {
    return `<div class="nh7-step-back"><button class="secondary-btn" data-go="bible" data-params='${html(JSON.stringify(params))}'>‹ ${html(tr('back'))}</button></div>`;
  }
  function error(params) {
    view.innerHTML=back({section:'written'})+card(L('بارگذاری انجام نشد','Could not load','Učitavanje nije uspjelo'),
      `<p>${html(L('اتصال را بررسی کنید و دوباره تلاش کنید. ذخیره‌ها و یادداشت‌های شما تغییر نکرده‌اند.','Check your connection and try again. Saved verses and notes have not been changed.','Provjerite vezu i pokušajte ponovno. Spremljeni retci i bilješke nisu promijenjeni.'))}</p><button class="primary-btn" data-go="bible" data-params='${html(JSON.stringify(params))}'>${html(L('تلاش دوباره','Try again','Pokušaj ponovno'))}</button>`);
  }
  async function bibleKeywords(params={}) {
    const id=++serial,lang=state.lang;
    let words;
    try { words=(await data()).languages[lang]; }
    catch(e) {if(active(id,lang,'keywords'))error({section:'written',mode:'keywords'});return;}
    if(!active(id,lang,'keywords'))return;
    const saved=filters.get(lang)||{q:'',limit:120};
    let limit=saved.limit;
    view.innerHTML=back({section:'written'})+card(L('کلیدواژه‌های کتاب مقدس','Bible Keywords','Biblijske ključne riječi'),
      `<div class="nh7-keyword-wrap"><p class="muted">${html(L('۲۵۰۰ واژه از متن ۶۶ کتاب. عدد کنار هر واژه تعداد تکرار آن است؛ هر آیه در نتایج فقط یک بار نمایش داده می‌شود.','2,500 words from the 66 books. The number beside a word is its occurrence count; each matching verse is shown once.','2.500 riječi iz 66 knjiga. Broj uz riječ označava broj pojavljivanja; svaki povezani redak prikazuje se jednom.'))}</p><label for="bibleKeywordFilter">${html(L('جستجوی کلیدواژه','Search keywords','Pretraži ključne riječi'))}</label><input id="bibleKeywordFilter" class="search-box nh7-keyword-search" type="search" autocomplete="off" value="${html(saved.q)}"><p id="bibleKeywordMeta" class="nh7-keyword-count" role="status" aria-live="polite"></p><div id="bibleKeywordResults" class="nh7-keyword-grid"></div><button id="bibleKeywordMore" type="button" class="secondary-btn">${html(L('نمایش واژه‌های بیشتر','Show more words','Prikaži više riječi'))}</button></div>`);
    const input=view.querySelector('#bibleKeywordFilter'),box=view.querySelector('#bibleKeywordResults'),meta=view.querySelector('#bibleKeywordMeta'),more=view.querySelector('#bibleKeywordMore');
    function paint() {
      const query=normalizeBibleText(input.value,lang).trim();
      const matched=query?words.filter(w=>normalizeBibleText(w.term,lang).includes(query)):words;
      const shown=matched.slice(0,limit);
      filters.set(lang,{q:input.value,limit});
      meta.textContent=L(`${N(matched.length)} واژه؛ نمایش ${N(shown.length)}`,`${N(matched.length)} words; showing ${N(shown.length)}`,`${N(matched.length)} riječi; prikazano ${N(shown.length)}`);
      box.innerHTML=shown.length?shown.map(w=>`<button type="button" class="nh7-keyword-btn" data-bible-keyword="${html(w.term)}"><span>${html(w.term)}</span><small>${N(w.count)}</small></button>`).join(''):`<p class="nh7-keyword-empty">${html(L('واژه‌ای پیدا نشد.','No keyword found.','Ključna riječ nije pronađena.'))}</p>`;
      more.hidden=shown.length>=matched.length;
    }
    input.oninput=()=>{limit=120;paint();};
    more.onclick=()=>{limit+=120;paint();};
    box.onclick=e=>{const b=e.target.closest('[data-bible-keyword]');if(b)navigate('bible',{section:'written',q:b.dataset.bibleKeyword,fromKeywords:'1'});};
    paint();
  }
  async function search(q,options={}) {
    q=String(q||'').trim();
    if(!q){++serial;return ctx.showWritten();}
    const id=++serial,lang=state.lang,exact=String(options.fromKeywords||'')==='1';
    const needle=normalizeBibleText(q,lang);
    const matches=[];
    try {
      const verses=await corpus();
      for(let i=0;i<verses.length;i++) {
        if(i%512===0){await pause();if(!active(id,lang,'search',q))return;}
        const v=verses[i],text=v.text?.[lang]||'';
        if(exact?bibleTokens(text,lang).includes(needle):normalizeBibleText(text,lang).includes(needle))matches.push(v);
      }
    } catch(e) {if(active(id,lang,'search',q))error({section:'written',q,...(exact?{fromKeywords:'1'}:{})});return;}
    if(!active(id,lang,'search',q))return;
    const backParams=exact?{section:'written',mode:'keywords'}:{section:'written'};
    view.innerHTML=back(backParams)+card(tr('search'),`<p class="nh7-bible-search-summary" role="status" aria-live="polite"></p><div class="list nh7-bible-search-results"></div><button type="button" id="bibleSearchMore" class="secondary-btn">${html(L('نمایش آیات بیشتر','Show more verses','Prikaži više redaka'))}</button>`);
    const box=view.querySelector('.nh7-bible-search-results'),summary=view.querySelector('.nh7-bible-search-summary'),more=view.querySelector('#bibleSearchMore');
    let limit=200;
    function paint() {
      const shown=matches.slice(0,limit);
      summary.textContent=q+' — '+L(`${N(matches.length)} آیه؛ نمایش ${N(shown.length)}`,`${N(matches.length)} verses; showing ${N(shown.length)}`,`${N(matches.length)} redaka; prikazano ${N(shown.length)}`);
      box.innerHTML=shown.length?shown.map((v,i)=>`<button type="button" class="list-btn" data-bible-hit="${i}"><strong>${html(localizeRef(v.reference?.en||''))}</strong><small>${html(displayText(v).slice(0,220))}</small></button>`).join(''):`<p class="nh7-keyword-empty">${html(L('آیه‌ای پیدا نشد.','No verse found.','Nije pronađen nijedan redak.'))}</p>`;
      more.hidden=shown.length>=matches.length;
    }
    more.onclick=()=>{limit+=200;paint();};
    box.onclick=e=>{const b=e.target.closest('[data-bible-hit]'),v=b&&matches[Number(b.dataset.bibleHit)];if(v)navigate('bible',{section:'written',mode:'chapter',bookId:v.bookId,chapter:v.chapter,verse:v.verse});};
    paint();
  }
  return {bibleKeywords,search,displayText};
}
