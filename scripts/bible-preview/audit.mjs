import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {normalizeBibleText,bibleTokens} from '../../js/nh7-bible-keywords-v451.js';
const expected={
 '01_18':'76fb306633755bea447edb2cce69f83133a821c33b43e9afb5861971f3c2a2b4',
 '19_39':'117d2f273023a662d81a7a08bba353483b3764e9b0ec2f4657fa652beb7bb7ba',
 '40_66':'786cad290347e059cbf272b26bab554055eb120e5e978b1db30bc1b1b9b67f1d'
};
let verses=[],books=[];const checks=[];
for(const [group,sha] of Object.entries(expected)){
 const bytes=fs.readFileSync(`data/bible/groups/bible_group_${group}.json`);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha,'Bible corpus must remain byte-identical');
 const d=JSON.parse(bytes);verses.push(...d.verses);books.push(...d.books);
}
assert.equal(books.length,66);assert.equal(verses.length,31102);
assert.equal(new Set(verses.map(v=>v.id)).size,31102);
assert.equal(new Set(verses.map(v=>v.reference.en)).size,31102);
assert.equal(new Set(verses.map(v=>v.bookId+':'+v.chapter)).size,1189);
for(const b of books){const own=verses.filter(v=>v.bookId===b.id);for(let ch=1;ch<=b.chapters;ch++)assert(own.some(v=>v.chapter===ch),b.id+':'+ch);}
checks.push('66 books, 1189 chapters, 31102 unique verses; corpus hashes unchanged');
const data=JSON.parse(fs.readFileSync('data/bible/keywords/bible_keywords_v450.json'));
const languages={};
for(const lang of ['fa','en','hr']){
 const counts=new Map(),inVerses=new Map();
 for(const v of verses){assert(v.text[lang]?.trim());const tokens=bibleTokens(v.text[lang],lang);for(const token of tokens)counts.set(token,(counts.get(token)||0)+1);for(const token of new Set(tokens))inVerses.set(token,(inVerses.get(token)||0)+1);}
 const words=data.languages[lang];assert.equal(words.length,2500);assert.equal(new Set(words.map(w=>normalizeBibleText(w.term,lang))).size,2500);
 for(const word of words){assert.equal(word.key,normalizeBibleText(word.term,lang));assert.equal(word.count,counts.get(word.key));assert(inVerses.get(word.key)>0);}
 languages[lang]={keywords:words.length,unique:2500,zeroMatch:0,countMismatches:0,sample:words.slice(0,3).map(w=>({...w,matchingVerses:inVerses.get(w.key)}))};
}
assert.equal(normalizeBibleText('مَحَبّت','fa'),'محبت');
assert.equal(normalizeBibleText('كتاب يحيي','fa'),'کتاب یحیی');
assert.equal(normalizeBibleText('می\u200cشود','fa'),normalizeBibleText('میشود','fa'));
assert.equal(normalizeBibleText('GOSPOD','hr'),'gospod');
assert(!bibleTokens('the shepherd','en').includes('he'));
assert(bibleTokens('Božja riječ','hr').includes('riječ'));
checks.push('7500 keywords: positive exact-token matches, unique normalized keys, all occurrence counts verified');
const app=fs.readFileSync('js/app.js','utf8'),preview=fs.readFileSync('bible-preview.html','utf8');
assert(app.includes("'nh7_bible_state_'"));assert(app.includes("'nh7_bookmarks'"));
assert(app.includes('if(savedRefSet.has(ref))st.saved=true'));
assert(app.includes("!window.NH7_BIBLE_PREVIEW && Boolean"));
assert(app.includes("!window.NH7_BIBLE_PREVIEW && 'serviceWorker'"));
assert.equal((app.match(/\$\$\('\[data-clear-bible-selection\]'\)/g)||[]).length,1);
assert(preview.includes("connect-src 'self'"));assert(preview.includes("worker-src 'none'"));assert(!preview.includes('cdn.onesignal'));
const scripts=[...preview.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1].split('?')[0]);
assert.deepEqual(scripts,['js/nh7-bible-preview-v451.js','js/app.js','js/nh7-app-enhancements-v230.js','js/nh7-my-notes-v234.js']);
checks.push('Preview entry contains only isolated storage guard and actual Bible/notes scripts; no push or account services');
fs.mkdirSync('qa-output',{recursive:true});
const report={version:'4.5.1',status:'passed',books:66,chapters:1189,verses:31102,corpusUnchanged:true,languages,checks,translationScope:'Structural check only; existing Persian fallback verses preserved, no translation replacement.'};
fs.writeFileSync('qa-output/bible-audit.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
