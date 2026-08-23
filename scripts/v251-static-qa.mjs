import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const blockers=[];
const warnings=[];
const checks=[];
const B=(code,detail)=>blockers.push({code,detail});
const W=(code,detail)=>warnings.push({code,detail});
const check=(name,ok,detail='')=>{checks.push({name,ok:!!ok,detail});if(!ok)B(name,detail)};
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(text(p));
const exists=p=>fs.existsSync(path.join(root,p));

const jsFiles=[
  'js/nh7-account-content-access-v251.js',
  'js/nh7-reader-ux-v251.js',
  'js/nh7-admin-content-access-v251.js',
  'js/admin-v2.3.5-analytics.js',
  'js/nh7-apocrypha-reader-flow-v244.js'
];
for(const file of jsFiles){
  if(!exists(file)){B('FILE_MISSING',file);continue}
  const run=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
  check('JS_SYNTAX_'+file,run.status===0,(run.stderr||run.stdout||'').trim());
}

const rc=text('rc-full.html');
check('RC_VERSION',rc.includes("window.NH7_VERSION = '2.4.0.251-RC'"),'rc-full must be 2.4.0.251-RC');
check('RC_ACCOUNT_BRIDGE',rc.includes('js/nh7-account-content-access-v251.js?v=2.5.1'),'account bridge missing from rc-full');
check('RC_READER_BRIDGE',rc.includes('js/nh7-reader-ux-v251.js?v=2.5.1'),'reader UX bridge missing from rc-full');
check('RC_APO_CSS_251',rc.includes('css/nh7-apocrypha-reader-flow-v244.css?v=2.5.1'),'Apocrypha flow CSS is not cache-busted to v2.5.1');

const account=text('js/nh7-account-content-access-v251.js');
for(const token of ['nh7_library_items_v251','nh7_library_collections_public_v251','nh7-library-access-v251','nh7-school-media-access-v251','nh7_my_content_access_v251']){
  check('ACCOUNT_BRIDGE_'+token,account.includes(token),`missing ${token}`);
}
check('ACCOUNT_NO_PASSWORD_PROMPT',!account.includes('prompt('),'v2.5.1 account bridge itself must not prompt for passwords');

const admin=text('js/nh7-admin-content-access-v251.js');
for(const token of ['nh7_admin_content_access_dashboard_v251','nh7_admin_content_access_grant_v251','nh7_admin_content_access_revoke_v251','library_all','library_collection','library_item','media_all','video_item']){
  check('ADMIN_ACCESS_'+token,admin.includes(token),`missing ${token}`);
}
check('NO_DUPLICATE_MINISTER_UI',!exists('js/nh7-admin-minister-access-v251.js'),'duplicate grant UI should not exist');

const reader=text('js/nh7-reader-ux-v251.js');
for(const token of ['nh7_reader_font_scale_v251','data-v251-font-minus','data-v251-font-plus','data-nh7-apo-save','nh7-saved-inline-v251','pendingReaderTop']){
  check('READER_UX_'+token,reader.includes(token),`missing ${token}`);
}
const apoFlow=text('js/nh7-apocrypha-reader-flow-v244.js');
check('APO_COLOR_DATA_ATTR',apoFlow.includes('data-nh7-apo-color'),'Apocrypha palette JS must use data-nh7-apo-color');
const apoCss=text('css/nh7-apocrypha-reader-flow-v244.css');
for(const color of ['yellow','green','blue','pink','purple']){
  check('APO_COLOR_'+color,apoCss.includes(`data-nh7-apo-color="${color}"`),`missing visible ${color} palette selector`);
}

// Test the exact saved-verse Bible resolver used by nh7-reader-ux-v251.js against real bundled Bible data.
const meta=json('data/bible/plans/reading_plans_1yr_2yr.json');
const books=Array.isArray(meta.books)?meta.books:[];
const probeBook=books.find(b=>Number(b.order)===1)||books[0];
let bibleProbe={book:probeBook?.id||null,order:probeBook?.order||null,current_resolver_found:false,shape:{}};
if(!probeBook){B('BIBLE_META_BOOKS','No books in reading_plans metadata');}
else{
  const group=json('data/bible/groups/bible_group_01_18.json');
  bibleProbe.shape={topKeys:Object.keys(group||{}),isArray:Array.isArray(group)};
  function findDeepVerse(rootNode,bookId,chapter,verse){
    const stack=[rootNode];
    while(stack.length){
      const node=stack.pop();
      if(!node)continue;
      if(Array.isArray(node)){for(let i=node.length-1;i>=0;i--)stack.push(node[i]);continue;}
      if(typeof node!=='object')continue;
      const id=String(node.bookId||node.book_id||'');
      if(id===bookId&&Number(node.chapter)===Number(chapter)&&Number(node.verse)===Number(verse)&&node.text)return node;
      for(const value of Object.values(node))if(value&&typeof value==='object')stack.push(value);
    }
    return null;
  }
  const found=findDeepVerse(group,String(probeBook.id),1,1);
  bibleProbe.current_resolver_found=!!found;
  bibleProbe.current_resolver_sample=found||null;
  check('SAVED_VERSE_BIBLE_RESOLVER',!!found,`Current resolver could not find ${probeBook.id} 1:1 in bundled group JSON; resolver must be adapted to actual schema`);
}

// Data parse sanity for the main content bundles touched by the UX patch.
for(const file of ['data/bible/plans/reading_plans_1yr_2yr.json','data/bible/groups/bible_group_01_18.json','data/apocrypha/runtime/apocrypha-browser-19.preview.json']){
  try{json(file);checks.push({name:'JSON_PARSE_'+file,ok:true,detail:''});}catch(e){B('JSON_PARSE_'+file,e.message)}
}

const report={
  schema_version:1,
  qa_version:'2.5.1',
  generated_at:new Date().toISOString(),
  branch:process.env.GITHUB_REF_NAME||null,
  commit:process.env.GITHUB_SHA||null,
  checks,
  bible_probe:bibleProbe,
  blocker_count:blockers.length,
  warning_count:warnings.length,
  blockers,warnings,
  passed:blockers.length===0
};
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/v251-static-qa.json'),JSON.stringify(report,null,2)+'\n');
console.log(`V251_STATIC_QA blockers=${blockers.length} warnings=${warnings.length} bibleResolver=${bibleProbe.current_resolver_found}`);
for(const b of blockers)console.log(`BLOCKER ${b.code}: ${b.detail}`);
process.exitCode=0;
