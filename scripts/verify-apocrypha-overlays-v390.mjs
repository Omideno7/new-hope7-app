import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const runtime=read('data/apocrypha/runtime/apocrypha-browser-19.preview.json');
const registries=['data/apocrypha/review/translation-overlays-v245.json','data/apocrypha/review/translation-overlays-v246-continuation.json','data/apocrypha/review/translation-overlays-v247-audit-corrections.json'];
for(const b of runtime.books||[])for(const c of b.chapters||[])for(const v of c.verses||[]){if(String(v.status_fa||'')!=='in_review')v.text_fa=null;if(String(v.status_hr||'')!=='in_review')v.text_hr=null}
const books=new Map((runtime.books||[]).map(b=>[String(b.book_id),b]));
function chapter(book,n){return(book?.chapters||[]).find(c=>Number(c.chapter)===Number(n))}
function mergeRows(book,chapterNo,rows,language=''){
 const c=chapter(book,chapterNo);if(!c)return;
 for(const row of rows||[]){const v=(c.verses||[]).find(x=>Number(x.verse)===Number(row.verse));if(!v)continue;
  if(['fa','hr'].includes(language)){const text=String(row.text||'').trim();if(text){v[`text_${language}`]=row.text;v[`status_${language}`]='in_review'}}
  else for(const l of ['fa','hr']){const text=String(row[`text_${l}`]||'').trim(),status=String(row[`status_${l}`]||'');if(text&&status==='in_review'){v[`text_${l}`]=row[`text_${l}`];v[`status_${l}`]='in_review'}}
 }
}
const seen=new Set();
for(const regPath of registries){const reg=read(regPath);for(const p of reg.files||[]){if(seen.has(p))continue;seen.add(p);const doc=read(p),book=books.get(String(doc.book_id));if(!book)continue;const language=String(doc.language||'');if(Array.isArray(doc.verses))mergeRows(book,Number(doc.chapter||1),doc.verses,language);if(Array.isArray(doc.chapters))for(const c of doc.chapters)mergeRows(book,c.chapter,c.verses,language)}}
const rows=[];let bad=0;
for(const b of runtime.books||[]){let en=0,fa=0,hr=0;for(const c of b.chapters||[])for(const v of c.verses||[]){if(String(v.text_en||'').trim())en++;if(String(v.text_fa||'').trim())fa++;if(String(v.text_hr||'').trim())hr++}const okFa=en>0&&fa===en,okHr=en>0&&hr===en;if(!okFa||!okHr)bad++;rows.push({book:b.book_id,en,fa,hr,okFa,okHr})}
console.table(rows);console.log(JSON.stringify({books:rows.length,overlayFiles:seen.size,incompleteBooks:bad},null,2));
if(rows.length!==19)throw new Error(`Expected 19 books, got ${rows.length}`);
if(bad)throw new Error(`${bad} books do not have complete fresh FA/HR overlay coverage`);
