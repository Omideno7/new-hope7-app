/* New Hope 7 v2.4.0.244 RC — continuous Apocrypha reader enhancement + highlight colors. */
(()=>{'use strict';
if(window.__NH7_APO_FLOW_V244__)return;window.__NH7_APO_FLOW_V244__=true;
const VERSION='2.4.0.244-apocrypha-flow-colors';
const PALETTE_VERSION='4.0.2-visible-swatches';
const DATA='data/apocrypha/runtime/apocrypha-browser-19.preview.json?v=6440';
const BASE='nh7_apo_highlight_v242:';
const COLOR='nh7_apo_highlight_color_v244:';
const COLORS=['yellow','green','blue','pink','purple'];
const SWATCH={yellow:'#fff2a8',green:'#ccefd7',blue:'#cfe8ff',pink:'#ffd9e5',purple:'#e8dcff'};
let booksPromise=null,decorating=false;
const $=(s,r=document)=>r.querySelector(s);const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const lang=()=>{const v=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return ['fa','en','hr'].includes(v)?v:'en'};
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const norm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
function colorLabel(color){
  const labels={
    yellow:L('زرد','Yellow','Žuta'),
    green:L('سبز','Green','Zelena'),
    blue:L('آبی','Blue','Plava'),
    pink:L('صورتی','Pink','Ružičasta'),
    purple:L('بنفش','Purple','Ljubičasta')
  };
  return labels[color]||color;
}
function installPaletteStyle(){
  if(document.getElementById('nh7-apocrypha-palette-v402-style'))return;
  const style=document.createElement('style');
  style.id='nh7-apocrypha-palette-v402-style';
  style.textContent=`
  .nh7-apo-color-row .nh7-apo-color[data-nh7-apo-color]{
    display:inline-block!important;
    width:30px!important;height:30px!important;
    min-width:30px!important;min-height:30px!important;
    padding:0!important;margin:2px 3px!important;
    border:2px solid rgba(15,23,42,.38)!important;
    border-radius:999px!important;
    opacity:1!important;
    -webkit-appearance:none!important;appearance:none!important;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.58),0 1px 3px rgba(15,23,42,.2)!important;
  }
  .nh7-apo-color-row .nh7-apo-color[data-nh7-apo-color="yellow"]{background:#fff2a8!important}
  .nh7-apo-color-row .nh7-apo-color[data-nh7-apo-color="green"]{background:#ccefd7!important}
  .nh7-apo-color-row .nh7-apo-color[data-nh7-apo-color="blue"]{background:#cfe8ff!important}
  .nh7-apo-color-row .nh7-apo-color[data-nh7-apo-color="pink"]{background:#ffd9e5!important}
  .nh7-apo-color-row .nh7-apo-color[data-nh7-apo-color="purple"]{background:#e8dcff!important}
  .nh7-apo-color-row .nh7-apo-color[aria-pressed="true"]{
    outline:3px solid #1d4ed8!important;
    outline-offset:2px!important;
    transform:scale(1.08);
  }`;
  document.head.appendChild(style);
}
function loadBooks(){if(!booksPromise)booksPromise=fetch(DATA,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject(new Error('Apocrypha metadata '+r.status))).then(d=>d.books||[]).catch(e=>{console.warn('NH7 apo colors metadata',e);return[]});return booksPromise}
function currentChapter(){return Number($('[data-rc-apo-chapter]')?.value||1)||1}
async function currentBook(){const books=await loadBooks();if(!books.length)return null;const heading=norm($('.nh7-apo-reader-head h2')?.textContent||'');let found=books.find(b=>[b.title_fa,b.title_en,b.title_hr].some(x=>norm(x)===heading));if(found)return found;const prev=$('[data-apo-prev-book]')?.dataset?.apoPrevBook,next=$('[data-apo-next-book]')?.dataset?.apoNextBook;if(prev){const i=books.findIndex(b=>String(b.book_id)===String(prev));if(i>=0&&books[i+1])return books[i+1]}if(next){const i=books.findIndex(b=>String(b.book_id)===String(next));if(i>0)return books[i-1]}return null}
function key(prefix,bookId,chapter,verse){return `${prefix}${bookId}:${chapter}:${verse}`}
function removeColorClasses(main){for(const c of COLORS)main.classList.remove('nh7-hl-'+c)}
function paletteHtml(verse,selected){return `<div class="nh7-apo-color-row" data-nh7-apo-palette="${verse}"><span class="nh7-apo-color-label">${L('رنگ هایلایت','Highlight color','Boja isticanja')}</span>${COLORS.map(c=>`<button type="button" class="nh7-apo-color" data-nh7-apo-color="${c}" data-verse="${verse}" title="${colorLabel(c)}" aria-label="${colorLabel(c)}" aria-pressed="${selected===c?'true':'false'}"></button>`).join('')}<button type="button" class="nh7-apo-clear-highlight" data-nh7-apo-clear="${verse}">${L('حذف','Clear','Ukloni')}</button></div>`}
async function decorate(){if(decorating)return;const reader=$('.nh7-apo-continuous-reader');if(!reader)return;decorating=true;try{const book=await currentBook();if(!book)return;const chapter=currentChapter();for(const article of $$('.nh7-apo-verse',reader)){const verse=Number(article.dataset.apoVerse||0);if(!verse)continue;const main=$('.nh7-apo-verse-main',article),box=$('.nh7-apo-verse-tools',article);if(!main||!box)continue;const active=localStorage.getItem(key(BASE,book.book_id,chapter,verse))==='1';let selected=active?(localStorage.getItem(key(COLOR,book.book_id,chapter,verse))||'yellow'):'';if(!COLORS.includes(selected))selected=active?'yellow':'';removeColorClasses(main);if(active)main.classList.add('nh7-hl-'+selected);const old=$('[data-apo-highlight]',box);if(old)old.style.display='none';let palette=$('[data-nh7-apo-palette]',box);if(!palette){box.insertAdjacentHTML('afterbegin',paletteHtml(verse,selected));palette=$('[data-nh7-apo-palette]',box)}else{for(const b of $$('[data-nh7-apo-color]',palette))b.setAttribute('aria-pressed',b.dataset.nh7ApoColor===selected?'true':'false')}}}finally{decorating=false}}
async function setColor(verse,color){const book=await currentBook();if(!book)return;const chapter=currentChapter(),article=$(`.nh7-apo-verse[data-apo-verse="${CSS.escape(String(verse))}"]`),main=article?.querySelector('.nh7-apo-verse-main');localStorage.setItem(key(BASE,book.book_id,chapter,verse),'1');localStorage.setItem(key(COLOR,book.book_id,chapter,verse),color);if(main){removeColorClasses(main);main.classList.add('nh7-hl-'+color)}const palette=article?.querySelector('[data-nh7-apo-palette]');if(palette)for(const b of $$('[data-nh7-apo-color]',palette))b.setAttribute('aria-pressed',b.dataset.nh7ApoColor===color?'true':'false')}
async function clearColor(verse){const book=await currentBook();if(!book)return;const chapter=currentChapter(),article=$(`.nh7-apo-verse[data-apo-verse="${CSS.escape(String(verse))}"]`),main=article?.querySelector('.nh7-apo-verse-main');localStorage.removeItem(key(BASE,book.book_id,chapter,verse));localStorage.removeItem(key(COLOR,book.book_id,chapter,verse));if(main)removeColorClasses(main);const palette=article?.querySelector('[data-nh7-apo-palette]');if(palette)for(const b of $$('[data-nh7-apo-color]',palette))b.setAttribute('aria-pressed','false')}
document.addEventListener('click',e=>{const color=e.target.closest?.('[data-nh7-apo-color]');if(color){e.preventDefault();e.stopPropagation();setColor(Number(color.dataset.verse),color.dataset.nh7ApoColor);return}const clear=e.target.closest?.('[data-nh7-apo-clear]');if(clear){e.preventDefault();e.stopPropagation();clearColor(Number(clear.dataset.nh7ApoClear));return}if(e.target.closest?.('.nh7-apo-verse-main'))setTimeout(decorate,0)},false);
document.addEventListener('change',e=>{if(e.target.matches?.('[data-rc-apo-chapter]')||e.target.id==='langSelect')setTimeout(decorate,50)},true);
const observer=new MutationObserver(()=>setTimeout(decorate,0));observer.observe(document.documentElement,{childList:true,subtree:true});
installPaletteStyle();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorate,{once:true});else decorate();
window.NH7_APOCRYPHA_FLOW_VERSION=VERSION;
window.NH7_APOCRYPHA_PALETTE_VERSION=PALETTE_VERSION;
})();
