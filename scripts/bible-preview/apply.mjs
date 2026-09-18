/* Idempotent, explicitly scoped candidate preparation; never deploys or edits main. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {normalizeBibleText,bibleTokens} from '../../js/nh7-bible-keywords-v451.js';
function edit(path,fn){const before=fs.readFileSync(path,'utf8'),after=fn(before);if(before!==after)fs.writeFileSync(path,after);}
function once(s,old,next){if(s.includes(next))return s;assert.equal(s.split(old).length,2,'Expected one patch anchor: '+old.slice(0,90));return s.replace(old,()=>next);}
edit('js/app.js',s=>{
  if(!s.includes("import {createBibleKeywordsV451}"))s="import {createBibleKeywordsV451} from './nh7-bible-keywords-v451.js?v=4.5.1';\n"+s;
  if(s.includes('const NH7_BIBLE_KEYWORDS_DATA_V450=')){
    const start=s.indexOf('const NH7_BIBLE_KEYWORDS_DATA_V450='),end=s.indexOf('\nasync function bible(params={})',start);assert(end>start);
    s=s.slice(0,start)+`const nh7BibleKeywordsV451=createBibleKeywordsV451({state,view,html,card,tr,l223,localNum,jfetch,navigate,localizeRef,loadBibleMeta,showWritten:()=>bible({section:'written'})});
async function bibleKeywordsV450(params={}){return nh7BibleKeywordsV451.bibleKeywords(params);}
`+s.slice(end);
    const startSearch=s.indexOf('async function bibleSearch(q,options={}){'),endSearch=s.indexOf('\nfunction bibleNameAliases',startSearch);assert(endSearch>startSearch);
    s=s.slice(0,startSearch)+"async function bibleSearch(q,options={}){return nh7BibleKeywordsV451.search(q,options);}\n"+s.slice(endSearch);
  }
  s=once(s,"if(params.mode==='keywords')return bibleKeywordsV450();","if(params.mode==='keywords')return bibleKeywordsV450(params);");
  s=once(s,"const CLOUD_ENABLED = Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.key);","const CLOUD_ENABLED = !window.NH7_BIBLE_PREVIEW && Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.key);");
  s=once(s,"if('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(console.warn);","if(!window.NH7_BIBLE_PREVIEW && 'serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js').catch(console.warn);");
  // Preserve verse IDs, storage keys and all note/highlight fields during a toggle.
  const marker="  $$('[data-bookmark]').forEach(el=>el.onclick=";
  const start=s.indexOf(marker),end=s.indexOf('\n',start);assert(start>0);
  s=s.slice(0,start)+`  $$('[data-bookmark]').forEach(el=>el.onclick=()=>{if((window.NH7BibleBatchV230?.selected?.size||0)>1)return;let arr=[];try{arr=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]')}catch(e){}if(!Array.isArray(arr))arr=[];const ref=el.dataset.bookmark,key=el.closest('.reader-verse')?.dataset?.verseKey;let st={};try{st=JSON.parse(localStorage.getItem(key)||'{}')}catch(e){}const on=!(arr.includes(ref)||st.saved===true);arr=on?[...arr,ref]:arr.filter(x=>x!==ref);localStorage.setItem('nh7_bookmarks',JSON.stringify(arr));if(key){st.saved=on;localStorage.setItem(key,JSON.stringify(st));saveProgressCloud(key,st).catch(console.warn)}if(on){saveVerseCloud(ref).catch(console.warn);addPoints(5,'first_verse')}else deleteVerseCloud(ref).catch(console.warn);el.textContent=(on?'★ ':'☆ ')+tr('save');});`+s.slice(end);
  s=once(s,'</span><span id="${html(noteBoxId)}" class="verse-note-box hidden">','<button type="button" class="secondary-btn nh7-bible-cancel" data-clear-bible-selection aria-label="${html(l223(\'لغو انتخاب\',\'Clear selection\',\'Poništi odabir\'))}">×</button></span><span id="${html(noteBoxId)}" class="verse-note-box hidden">');
  s=once(s,"  const run=$('#runBibleSearch');", "  $$('[data-clear-bible-selection]').forEach(el=>el.onclick=()=>window.NH7BibleBatchV230?.clearSelection?.());\n  const run=$('#runBibleSearch');");
  s=once(s,"await navigator.clipboard.writeText(txt); alert(tr('saved')); } }catch(e){} });","await navigator.clipboard.writeText(txt); alert(tr('saved')); } window.NH7BibleBatchV230?.clearSelection?.(); }catch(e){} });");
  s=s.replaceAll("v.text?.[state.lang]||v.text?.en||''","nh7BibleKeywordsV451.displayText(v)");
  return s;
});
edit('js/nh7-app-enhancements-v230.js',s=>{
  s=once(s,"  selected.clear();\n  removeAddedToolbar();","  selected.clear();\n  document.querySelectorAll('.reader-verse').forEach(v=>{v.classList.remove('verse-selected','nh7-verse-selected-v230');v.setAttribute('aria-selected','false');v.querySelectorAll('.verse-tools,.verse-note-box,.highlight-palette').forEach(x=>x.classList.add('hidden'))});\n  removeAddedToolbar();");
  s=once(s,"    if(action==='highlight'){","    if(action==='unsave'){st.saved=false;bookmarks.delete(info.ref);const button=info.node.querySelector('[data-bookmark]');if(button)button.textContent='☆ '+t('ذخیره','Save','Spremi')}\n    if(action==='highlight'){");
  s=once(s,"if(action.matches('[data-bookmark]'))batchApply('save');","if(action.matches('[data-bookmark]')){let refs=[];try{refs=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]')}catch(_){}batchApply([...selected.values()].every(info=>refs.includes(info.ref)||readState(info.key).saved===true)?'unsave':'save');}");
  s=once(s,"'Odabrani stihovi su kopirani.'))}}catch(error)","'Odabrani stihovi su kopirani.'))}clearSelection();}catch(error)");
  return s;
});
// A single tokenizer is used for both occurrence counts and exact-word search.
const all=['01_18','19_39','40_66'].flatMap(g=>JSON.parse(fs.readFileSync(`data/bible/groups/bible_group_${g}.json`)).verses);
edit('data/bible/keywords/bible_keywords_v450.json',s=>{
  const d=JSON.parse(s);d.version='4.5.1';d.source.tokenizer='js/nh7-bible-keywords-v451.js:bibleTokens';d.source.corrections_v451='Unified runtime and count normalization; replaced two zero-match Persian suffix fragments with attested Bible words (صداقت, مهربانی).';
  for(const lang of ['fa','en','hr']){
    const counts=new Map();for(const v of all)for(const token of bibleTokens(v.text[lang],lang))counts.set(token,(counts.get(token)||0)+1);
    for(const word of d.languages[lang]){if(lang==='fa'&&word.term==='ها')word.term='صداقت';if(lang==='fa'&&word.term==='ام')word.term='مهربانی';word.key=normalizeBibleText(word.term,lang);word.count=counts.get(word.key)||0;assert(word.count>0,lang+': '+word.term);}
    assert.equal(new Set(d.languages[lang].map(w=>w.key)).size,2500);
    d.languages[lang].sort((a,b)=>b.count-a.count||(a.key<b.key?-1:a.key>b.key?1:0));
  }
  return JSON.stringify(d)+'\n';
});
edit('index.html',s=>s.replace('app.js?v=4.5.0-bible-keywords','app.js?v=4.5.1-bible-qa').replace('nh7-bible-keywords-v450.css?v=4.5.0','nh7-bible-keywords-v450.css?v=4.5.1').replace('nh7-app-enhancements-v230.js?v=2.3.9.33','nh7-app-enhancements-v230.js?v=4.5.1-bible').replace("service-worker.js?v=4.5.0'","service-worker.js?v=4.5.1'"));
edit('service-worker.js',s=>s.replace('sw-release-core-v403.js?v=4.5.0','sw-release-core-v403.js?v=4.5.1'));
edit('sw-release-core-v403.js',s=>{
  s=s.replace(/4\.5\.0-bible-keywords-preview/g,'4.5.1-bible-keywords-preview').replace(/v450-bible-keywords-preview/g,'v451-bible-keywords-preview');
  return s.includes("'./js/nh7-bible-keywords-v451.js'")?s:s.replace("'./js/app.js'","'./js/app.js','./js/nh7-bible-keywords-v451.js'");
});
// This entry loads the real Bible implementation, but no live account services.
const allowed=new Set(['js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js']);
let preview=fs.readFileSync('index.html','utf8').replace(/<script\b([^>]*)>[\s\S]*?<\/script>/g,(whole,attributes)=>{
  const src=attributes.match(/src="([^"]+)"/);return src&&allowed.has(src[1].split('?')[0])?whole:'';
}).replace(/<link rel="manifest"[^>]+>/,'').replace('<title>OmideNo7 Church</title>','<title>New Hope 7 — Bible Preview 4.5.1</title>');
const head=`\n<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'none'; worker-src 'none'; frame-src 'none'; object-src 'none'; form-action 'none'; base-uri 'self'">\n<meta name="robots" content="noindex,nofollow">\n<script src="js/nh7-bible-preview-v451.js?v=4.5.1"></script>\n<style>.nav-item:not([data-route="home"]):not([data-route="bible"]),#inboxBtn,#quickNotify,[data-go]:not([data-go="bible"]):not([data-go="home"]){display:none!important}.nh7-preview-notice{margin:12px;padding:12px;border:1px solid #c2d8e8;border-radius:12px;background:#eef6fc;color:#17344b;line-height:1.7}.nh7-preview-notice button{margin:3px;padding:7px 12px}.nh7-preview-notice{font-size:.78rem;line-height:1.5}.nh7-preview-notice>div[dir="ltr"]{display:none}.nh7-preview-notice button{border:1px solid #9ab6cc;border-radius:8px;background:#fff;color:#17344b}</style>\n`;
preview=preview.replace('<head>','<head>'+head);
preview=preview.replace('<main id="view"',`<aside class="nh7-preview-notice" dir="rtl"><strong>Preview اختصاصی Bible — نسخهٔ ۴٫۵٫۱</strong><div>ذخیره‌ها و یادداشت‌های این صفحه آزمایشی و جدا هستند؛ هیچ اتصالی به حساب یا پایگاه دادهٔ اصلی برقرار نمی‌شود.</div><div dir="ltr">Bible-only preview · Local test data · No production connection</div><div><button type="button" data-bible-preview-theme="light">روشن / Light</button><button type="button" data-bible-preview-theme="dark">تیره / Dark</button></div></aside><main id="view"`);
// Keep Preview offline from external font services without changing production styles.
const previewLogo='data:image/png;base64,'+fs.readFileSync('assets/new-hope7-logo-192.png').toString('base64');
const inlinePreviewLogo=value=>value.replace(/(?:\.\.\/)?assets\/new-hope7-logo-(?:1024|512|192|180)\.png(?:\?[^\s"'()<>]*)?/g,previewLogo);
for(const match of [...preview.matchAll(/<link\b[^>]*href="(css\/[^"?]+)(?:\?[^\"]*)?"[^>]*>/g)]){
  const path=match[1],css=fs.readFileSync(path,'utf8');
  const safeCss=inlinePreviewLogo(css.replace(/^@import[^\n]*https?:[^\n]*\n?/gm,''));
  if(safeCss===css)continue;
  const safePath=path.replace('css/','css/nh7-bible-preview-');
  fs.writeFileSync(safePath,safeCss);
  preview=preview.replace(match[0],match[0].replace(/href="[^\"]*"/,'href="'+safePath+'?v=4.5.1"'));
}
preview=inlinePreviewLogo(preview);
fs.writeFileSync('bible-preview.html',preview);
console.log('Candidate prepared. Bible corpus and legacy storage keys unchanged.');
