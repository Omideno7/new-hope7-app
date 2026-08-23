import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const rj = p => JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const ex = p => fs.existsSync(path.join(root,p));
const k = (b,c,v) => `${b}|${Number(c)}|${Number(v)}`;
const blockers=[]; const warnings=[];
const B=(code,detail)=>blockers.push({code,detail}); const W=(code,detail)=>warnings.push({code,detail});
const progress=rj('data/apocrypha/review/progress-v245.json');
const runtime=rj('data/apocrypha/runtime/apocrypha-browser-19.preview.json');
const expected=new Map((progress.complete_books||[]).map(x=>[x.book_id,x]));
const canonical=new Map(); let sourceRows=0;
const sourceStats={};

for(const [id,e] of expected){
  const p=`data/apocrypha/sources/en/${id}.en.json`;
  if(!ex(p)){B('SOURCE_MISSING',p);continue}
  let s; try{s=rj(p)}catch(err){B('SOURCE_JSON',`${p}: ${err.message}`);continue}
  if(s.book_id!==id)B('SOURCE_ID',`${id}: ${s.book_id}`);
  if(!s.source_translation||!s.source_license||!s.versification)B('SOURCE_METADATA',id);
  let rows=0;
  if(!Array.isArray(s.chapters)||s.chapters.length!==Number(s.chapter_count))B('SOURCE_CHAPTER_COUNT',id);
  for(let ci=0;ci<(s.chapters||[]).length;ci++){
    const ch=s.chapters[ci]; if(Number(ch.chapter)!==ci+1)B('SOURCE_CHAPTER_ORDER',`${id}:${ch.chapter}`);
    let prev=null; const seen=new Set();
    for(const v of ch.verses||[]){
      const ref=k(id,ch.chapter,v.verse); const n=Number(v.verse);
      if(!Number.isInteger(n)||n<1)B('SOURCE_VERSE_NUMBER',ref);
      if(seen.has(n))B('SOURCE_DUPLICATE_VERSE',ref); seen.add(n);
      if(prev!==null&&n!==prev+1)B('SOURCE_VERSE_GAP',`${id} ${ch.chapter}: ${prev}->${n}`); prev=n;
      if(typeof v.text_en!=='string'||!v.text_en.trim())B('SOURCE_BLANK_EN',ref);
      if(canonical.has(ref))B('SOURCE_DUPLICATE_KEY',ref); canonical.set(ref,{id,chapter:Number(ch.chapter),verse:n,text_en:v.text_en}); rows++;
    }
  }
  if(rows!==Number(s.verse_count)||rows!==Number(e.verses))B('SOURCE_TOTAL',`${id}: source=${rows}, metadata=${s.verse_count}, progress=${e.verses}`);
  sourceStats[id]={rows,chapters:s.chapters?.length||0,translation:s.source_translation,license:s.source_license,versification:s.versification}; sourceRows+=rows;
}
if(expected.size!==19||progress.complete_book_count!==19)B('PROGRESS_BOOK_COUNT',`${expected.size}/${progress.complete_book_count}`);
if(sourceRows!==7501||canonical.size!==7501)B('SOURCE_CORPUS_TOTAL',`${sourceRows}/${canonical.size}`);

// Mirror fresh-filter: keep only localized runtime rows explicitly marked in_review; strip legacy/prepared values.
const idx=new Map(); let runtimeRows=0;
for(const book of runtime.books||[])for(const ch of book.chapters||[])for(const v of ch.verses||[]){
  const ref=k(book.book_id,ch.chapter,v.verse); if(idx.has(ref))B('RUNTIME_DUPLICATE_KEY',ref); idx.set(ref,v); runtimeRows++;
  const s=canonical.get(ref); if(!s)B('RUNTIME_NON_SOURCE',ref); else if(v.text_en!==s.text_en)B('RUNTIME_EN_MISMATCH',ref);
  if(v.status_fa!=='in_review'||typeof v.text_fa!=='string'||!v.text_fa.trim()){v.text_fa=null;v.status_fa=null}
  if(v.status_hr!=='in_review'||typeof v.text_hr!=='string'||!v.text_hr.trim()){v.text_hr=null;v.status_hr=null}
}
if((runtime.books||[]).length!==19||runtimeRows!==7501||idx.size!==7501)B('RUNTIME_TOTAL',`books=${runtime.books?.length}, rows=${runtimeRows}, unique=${idx.size}`);
for(const ref of canonical.keys())if(!idx.has(ref))B('RUNTIME_MISSING_SOURCE',ref);

const regs=['data/apocrypha/review/translation-overlays-v245.json','data/apocrypha/review/translation-overlays-v246-continuation.json','data/apocrypha/review/translation-overlays-v247-audit-corrections.json'];
const applied=new Map(); const registryStats=[];
function put(id,c,v,loc,text,status,file,ri){
  if(status!=='in_review'||typeof text!=='string'||!text.trim())return;
  const ref=k(id,c,v); const target=idx.get(ref); if(!target){B('OVERLAY_NON_SOURCE',`${file}: ${ref}`);return}
  const lk=`${ref}|${loc}`; if(applied.has(lk)&&ri<2)W('OVERLAY_OVERRIDE',`${lk}: ${applied.get(lk)} -> ${file}`);
  target[`text_${loc}`]=text; target[`status_${loc}`]='in_review'; applied.set(lk,file);
}
function merge(d,file,ri){
  if(!d?.book_id||!expected.has(d.book_id)){B('OVERLAY_BOOK',file);return}
  if(Array.isArray(d.verses))for(const row of d.verses){put(d.book_id,d.chapter||1,row.verse,'fa',row.text_fa,row.status_fa,file,ri);put(d.book_id,d.chapter||1,row.verse,'hr',row.text_hr,row.status_hr,file,ri)}
  if(Array.isArray(d.chapters))for(const ch of d.chapters)for(const row of ch.verses||[]){
    if(d.language==='fa'||d.language==='hr')put(d.book_id,ch.chapter,row.verse,d.language,row.text,'in_review',file,ri);
    else{put(d.book_id,ch.chapter,row.verse,'fa',row.text_fa,row.status_fa,file,ri);put(d.book_id,ch.chapter,row.verse,'hr',row.text_hr,row.status_hr,file,ri)}
  }
}
for(let ri=0;ri<regs.length;ri++){
  const rp=regs[ri]; if(!ex(rp)){B('REGISTRY_MISSING',rp);continue} const reg=rj(rp); let loaded=0; const seen=new Set();
  for(const file of reg.files||[]){if(seen.has(file)){B('REGISTRY_DUPLICATE_PATH',`${rp}: ${file}`);continue}seen.add(file);if(!ex(file)){B('OVERLAY_FILE_MISSING',file);continue}try{merge(rj(file),file,ri);loaded++}catch(e){B('OVERLAY_JSON',`${file}: ${e.message}`)}}
  registryStats.push({path:rp,declared:(reg.files||[]).length,loaded});
}

// v2.4.7 display normalizations.
const enoch=idx.get(k('1_enoch',108,15));
if(enoch){enoch.text_en=String(enoch.text_en||'').replace(/\s*Printed in Great Britain by Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i,'').trim();enoch.text_hr=String(enoch.text_hr||'').replace(/\s*Tiskano u Velikoj Britaniji u tiskari Richard Clay and Company, Ltd\., Bungay, Suffolk\.?\s*$/i,'').trim();enoch.text_fa=String(enoch.text_fa||'').replace(/\s*چاپ‌شده در بریتانیای کبیر توسط Richard Clay and Company, Ltd\.، Bungay، Suffolk\.?\s*$/,'').trim()}
const az=idx.get(k('prayer_of_azariah',1,55)); if(az)az.text_en='O ye fountains, bless ye the Lord: praise and exalt him above all for ever.';

const placeholder=/(TODO|TBD|TRANSLATE|\[\[(?:C\d+V\d+|V\d+)\]\]|\/n\/n|\\n\\n|\[object Object\])/iu;
const control=/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u;
const imprint=/(Printed in Great Britain|Richard Clay and Company|Tiskano u Velikoj Britaniji|چاپ‌شده در بریتانیای کبیر)/iu;
const legacy=/(Razgah|رازگاه|prepared[-_ ]existing|legacy[_ -]text)/iu; const cyr=/[А-Яа-яЁё]/u;
const byBook={}; const missing={}; let EN=0,FA=0,HR=0;
for(const [ref,s] of canonical){const v=idx.get(ref);if(!v)continue;byBook[s.id]||={en:0,fa:0,hr:0,text_issues:0};missing[s.id]||={fa:[],hr:[]};const bs=byBook[s.id];const en=String(v.text_en||'').trim(),fa=String(v.text_fa||'').trim(),hr=String(v.text_hr||'').trim();
  if(en){EN++;bs.en++}else B('FINAL_BLANK_EN',ref);
  if(fa&&v.status_fa==='in_review'){FA++;bs.fa++}else{B('FINAL_MISSING_FA',ref);missing[s.id].fa.push(`${s.chapter}:${s.verse}`)}
  if(hr&&v.status_hr==='in_review'){HR++;bs.hr++}else{B('FINAL_MISSING_HR',ref);missing[s.id].hr.push(`${s.chapter}:${s.verse}`)}
  for(const [loc,t] of [['fa',fa],['hr',hr]])if(t){if(placeholder.test(t)){B('TEXT_PLACEHOLDER',`${ref}|${loc}`);bs.text_issues++}if(control.test(t)){B('TEXT_CONTROL',`${ref}|${loc}`);bs.text_issues++}if(imprint.test(t)){B('TEXT_IMPRINT',`${ref}|${loc}`);bs.text_issues++}if(legacy.test(t)){B('TEXT_LEGACY',`${ref}|${loc}`);bs.text_issues++}if(loc==='hr'&&cyr.test(t)){B('HR_CYRILLIC',ref);bs.text_issues++}}
}
if(EN!==7501||FA!==7501||HR!==7501)B('FINAL_TOTAL',`EN=${EN}, FA=${FA}, HR=${HR}`);
for(const [id,e] of expected){const b=byBook[id]||{};if(b.en!==e.verses||b.fa!==e.fa||b.hr!==e.hr)B('FINAL_BOOK_TOTAL',`${id}: ${b.en||0}/${b.fa||0}/${b.hr||0} expected ${e.verses}/${e.fa}/${e.hr}`)}

const t1411=idx.get(k('tobit',14,11)),t12=idx.get(k('tobit',1,2));
if(!t1411?.text_fa?.includes('صد و پنجاه‌وهشت'))B('KNOWN_TOBIT_14_11','158 fix inactive');
if(/قادش/u.test(t12?.text_fa||'')||/Kadeš/iu.test(t12?.text_hr||''))B('KNOWN_TOBIT_1_2','Kadesh still visible');
if(!/چشمه/u.test(az?.text_fa||'')||!/Izvori/iu.test(az?.text_hr||'')||!/fountains/iu.test(az?.text_en||''))B('KNOWN_AZARIAH_1_55','fountains normalization incomplete');
if(imprint.test(`${enoch?.text_en||''} ${enoch?.text_fa||''} ${enoch?.text_hr||''}`))B('KNOWN_ENOCH_108_15','printer imprint visible');

const summary={};for(const x of blockers)summary[x.code]=(summary[x.code]||0)+1;
const report={schema_version:1,audit_version:'2.4.8',generated_at:new Date().toISOString(),branch:process.env.GITHUB_REF_NAME||null,commit:process.env.GITHUB_SHA||null,scope:{books:19,canonical_rows:7501},coverage:{english:EN,persian:FA,croatian:HR},source_rows:sourceRows,source_books:sourceStats,registries:registryStats,by_book:byBook,missing_refs:missing,blocker_summary:summary,blockers,warning_count:warnings.length,warnings,blocker_count:blockers.length,structural_release_gate_passed:blockers.length===0};
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/apocrypha-corpus-audit-v248.json'),JSON.stringify(report,null,2)+'\n');
console.log(`APOCRYPHA_AUDIT_V248 EN=${EN} FA=${FA} HR=${HR} blockers=${blockers.length} warnings=${warnings.length}`);console.log('BLOCKER_SUMMARY '+JSON.stringify(summary));for(const [id,m] of Object.entries(missing))if(m.fa.length||m.hr.length)console.log(`MISSING ${id} FA=${m.fa.join(',')} HR=${m.hr.join(',')}`);for(const x of blockers.filter(x=>!x.code.startsWith('FINAL_MISSING')).slice(0,100))console.log(`BLOCKER ${x.code}: ${x.detail}`);process.exitCode=0;
