import fs from 'node:fs';
import path from 'node:path';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const runtime=read('data/apocrypha/runtime/apocrypha-browser-19.preview.json');
const registries=[
  'data/apocrypha/review/translation-overlays-v245.json',
  'data/apocrypha/review/translation-overlays-v246-continuation.json',
  'data/apocrypha/review/translation-overlays-v247-audit-corrections.json'
];

for(const book of runtime.books||[])for(const chapter of book.chapters||[])for(const verse of chapter.verses||[]){
  if(String(verse.status_fa||'')!=='in_review')verse.text_fa=null;
  if(String(verse.status_hr||'')!=='in_review')verse.text_hr=null;
}

const books=new Map((runtime.books||[]).map(book=>[String(book.book_id),book]));
const findChapter=(book,no)=>(book?.chapters||[]).find(x=>Number(x.chapter)===Number(no));
const findVerse=(chapter,no)=>(chapter?.verses||[]).find(x=>Number(x.verse)===Number(no));
function mergeRows(book,chapterNo,rows,declared=''){
  const chapter=findChapter(book,chapterNo);if(!chapter)return;
  for(const row of rows||[]){
    const verse=findVerse(chapter,row.verse);if(!verse)continue;
    if(['fa','hr'].includes(declared)){
      const text=String(row.text||'').trim();
      if(text){verse[`text_${declared}`]=row.text;verse[`status_${declared}`]='in_review'}
    }else{
      for(const locale of ['fa','hr']){
        const text=String(row[`text_${locale}`]||'').trim();
        const status=String(row[`status_${locale}`]||'');
        if(text&&status==='in_review'){
          verse[`text_${locale}`]=row[`text_${locale}`];
          verse[`status_${locale}`]='in_review';
        }
      }
    }
  }
}

const seen=new Set();
for(const registryPath of registries){
  const registry=read(registryPath);
  for(const file of registry.files||[]){
    if(seen.has(file))continue;seen.add(file);
    const doc=read(file),book=books.get(String(doc.book_id));if(!book)continue;
    const declared=String(doc.language||'');
    if(Array.isArray(doc.verses))mergeRows(book,Number(doc.chapter||1),doc.verses,declared);
    if(Array.isArray(doc.chapters))for(const chapter of doc.chapters||[])mergeRows(book,chapter.chapter,chapter.verses,declared);
  }
}

const enoch=books.get('1_enoch');
if(enoch){const verse=findVerse(findChapter(enoch,108),15);if(verse){
  if(typeof verse.text_en==='string')verse.text_en=verse.text_en.replace(/\s*Printed in Great Britain by Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i,'').trim();
  if(typeof verse.text_hr==='string')verse.text_hr=verse.text_hr.replace(/\s*Tiskano u Velikoj Britaniji u tiskari Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i,'').trim();
  if(typeof verse.text_fa==='string')verse.text_fa=verse.text_fa.replace(/\s*چاپ‌شده در بریتانیای کبیر توسط Richard Clay and Company, Ltd\.، Bungay، Suffolk\.?\s*$/,'').trim();
}}
const azariah=books.get('prayer_of_azariah');
if(azariah){const verse=findVerse(findChapter(azariah,1),55);if(verse)verse.text_en='O ye fountains, bless ye the Lord: praise and exalt him above all for ever.'}

const report=[];let incomplete=0;
for(const book of runtime.books||[]){
  let en=0,fa=0,hr=0;
  for(const chapter of book.chapters||[])for(const verse of chapter.verses||[]){
    if(String(verse.text_en||'').trim())en++;
    if(String(verse.text_fa||'').trim())fa++;
    if(String(verse.text_hr||'').trim())hr++;
  }
  const okFa=en>0&&fa===en,okHr=en>0&&hr===en;if(!okFa||!okHr)incomplete++;
  report.push({book:book.book_id,en,fa,hr,okFa,okHr});
}
if(report.length!==19)throw new Error(`Expected 19 books, got ${report.length}`);
if(incomplete)throw new Error(`${incomplete} books lack complete fresh FA/HR coverage`);

runtime.qa_premerged={version:'3.9.2',source_commit:'a6b0f6465e2d7f3e335b528a116d962cbe8f5b20',overlay_files:seen.size,generated_at:'2026-08-23T09:48:13Z',fresh_only:true};
const output=process.argv[2]||'qa/final-r3/data/apocrypha-19-merged-v392.json';
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(runtime));
console.table(report);
console.log(JSON.stringify({output,bytes:fs.statSync(output).size,books:report.length,overlayFiles:seen.size,incompleteBooks:incomplete},null,2));
