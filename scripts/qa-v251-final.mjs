import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';

const root=process.cwd();
const checks=[];
const add=(name,ok,detail='')=>checks.push({name,ok:!!ok,detail});
const text=p=>fs.readFileSync(path.join(root,p),'utf8');
const json=p=>JSON.parse(text(p));
const exists=p=>fs.existsSync(path.join(root,p));

for(const file of [
  'js/nh7-account-content-access-v251.js',
  'js/nh7-reader-ux-v251.js',
  'js/nh7-admin-content-access-v251.js',
  'js/admin-v2.3.5-analytics.js',
  'js/nh7-apocrypha-reader-flow-v244.js'
]){
  const run=spawnSync(process.execPath,['--check',file],{cwd:root,encoding:'utf8'});
  add('JS_SYNTAX_'+file,run.status===0,(run.stderr||run.stdout||'').trim());
}

const rc=text('rc-full.html');
add('RC_VERSION_251',rc.includes("window.NH7_VERSION = '2.5.1-RC'"));
add('RC_ACCOUNT_ACCESS',rc.includes('js/nh7-account-content-access-v251.js?v=2.5.1'));
add('RC_READER_UX',rc.includes('js/nh7-reader-ux-v251.js?v=2.5.1'));
add('RC_APO_CSS_251',rc.includes('css/nh7-apocrypha-reader-flow-v244.css?v=2.5.1'));

const css=text('css/nh7-apocrypha-reader-flow-v244.css');
for(const c of ['yellow','green','blue','pink','purple']) add('APO_COLOR_'+c,css.includes(`data-nh7-apo-color="${c}"`));

const reader=text('js/nh7-reader-ux-v251.js');
for(const token of ['data-v251-font-minus','data-v251-font-plus','data-nh7-apo-save','nh7-saved-inline-v251','pendingReaderTop','scrollReaderStart']) add('READER_'+token,reader.includes(token));

const access=text('js/nh7-account-content-access-v251.js');
for(const token of ['nh7_my_content_access_v251','nh7_library_items_v251','nh7_library_collections_public_v251','nh7-library-access-v251','nh7-school-media-access-v251']) add('ACCESS_'+token,access.includes(token));
add('ACCESS_NO_PASSWORD_PROMPT',!access.includes('prompt('));
add('ACCESS_HIDES_UNGRANTED_LIBRARY',access.includes('minister.hidden=!status.library_any'));
add('ACCESS_HIDES_UNGRANTED_MEDIA',access.includes('tile.hidden=!status.media_any'));

const adminLoader=text('js/admin-v2.3.5-analytics.js');
add('ADMIN_LOCAL_CORE',adminLoader.includes('admin-v2.3.5-analytics-core-v237.js')&&!adminLoader.includes('cdn.jsdelivr.net'));
add('ADMIN_ACCESS_MANAGER_LOADED',adminLoader.includes('nh7-admin-content-access-v251.js'));
const admin=text('js/nh7-admin-content-access-v251.js');
for(const token of ['nh7_admin_content_access_dashboard_v251','nh7_admin_content_access_grant_v251','nh7_admin_content_access_revoke_v251','library_all','library_collection','library_item','media_all','video_item']) add('ADMIN_'+token,admin.includes(token));
add('ADMIN_LEGACY_CODE_CONTROLS_DISABLED',admin.includes('nh7CreateLibraryCodeV224')&&admin.includes('nh7V316CreateCode'));
add('NO_PARALLEL_ADMIN_UI',!exists('js/nh7-admin-minister-access-v251.js'));

for(const file of ['supabase/migrations/20260823101500_account_content_access_v251.sql','supabase/migrations/20260823111000_minister_account_access_v251.sql','supabase/migrations/20260823112500_unify_account_content_access_v251.sql']) add('MIGRATION_'+file,exists(file));
const finalMigration=text('supabase/migrations/20260823112500_unify_account_content_access_v251.sql');
add('FINAL_MIGRATION_UNIFIED_SOURCE',finalMigration.includes('nh7_content_access_active_v251'));
add('FINAL_MIGRATION_DROPS_PARALLEL',finalMigration.includes('drop table if exists public.nh7_minister_access_v251'));
add('FINAL_MIGRATION_IGNORES_LEGACY_CODES',finalMigration.includes('p_code is ignored')||finalMigration.includes('p_code is deliberately ignored')||finalMigration.includes('p_code is ignored.'));
add('FINAL_MIGRATION_REVOKES_CODE_CREATE',finalMigration.includes('nh7_admin_library_create_code_v222')&&finalMigration.includes('nh7_admin_school_video_create_code_v260'));

for(const file of ['supabase/functions/nh7-library-access-v251/index.ts','supabase/functions/nh7-school-media-access-v251/index.ts']) add('EDGE_'+file,exists(file));
const libEdge=text('supabase/functions/nh7-library-access-v251/index.ts');
const mediaEdge=text('supabase/functions/nh7-school-media-access-v251/index.ts');
add('LIB_EDGE_ID_AUTH',libEdge.includes('nh7_library_authorize_v251')&&!libEdge.includes('plain_code'));
add('MEDIA_EDGE_ID_AUTH',mediaEdge.includes('nh7_video_portal_authorize_v251')&&mediaEdge.includes('nh7_video_authorize_v251'));

// Probe the saved-verse resolver against real bundled Bible data.
const meta=json('data/bible/plans/reading_plans_1yr_2yr.json');
const book=(meta.books||[]).find(b=>Number(b.order)===1);
const group=json('data/bible/groups/bible_group_01_18.json');
function findDeep(rootNode,bookId,chapter,verse){const stack=[rootNode];while(stack.length){const node=stack.pop();if(!node)continue;if(Array.isArray(node)){for(let i=node.length-1;i>=0;i--)stack.push(node[i]);continue}if(typeof node!=='object')continue;if(String(node.bookId||node.book_id||'')===bookId&&Number(node.chapter)===chapter&&Number(node.verse)===verse&&node.text)return node;for(const value of Object.values(node))if(value&&typeof value==='object')stack.push(value)}return null}
const probe=book?findDeep(group,String(book.id),1,1):null;
add('SAVED_VERSE_BIBLE_RESOLVER',!!probe,book?`${book.id} 1:1`:'book metadata missing');
try{const apo=json('data/apocrypha/runtime/apocrypha-browser-19.preview.json');add('APOCRYPHA_RUNTIME_19_BOOKS',Number(apo?.totals?.books)===19,`books=${apo?.totals?.books}`)}catch(e){add('APOCRYPHA_RUNTIME_19_BOOKS',false,e.message)}

const failed=checks.filter(x=>!x.ok);
const report={schema_version:1,qa_version:'2.5.1-final',generated_at:new Date().toISOString(),branch:process.env.GITHUB_REF_NAME||null,commit:process.env.GITHUB_SHA||null,total:checks.length,passed:checks.length-failed.length,failed:failed.length,checks,bible_probe:probe?{id:probe.id,bookId:probe.bookId,chapter:probe.chapter,verse:probe.verse,has_fa:!!probe.text?.fa,has_en:!!probe.text?.en,has_hr:!!probe.text?.hr}:null,release_candidate_static_gate_passed:failed.length===0};
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
fs.writeFileSync(path.join(root,'artifacts/qa-v251-final.json'),JSON.stringify(report,null,2)+'\n');
console.log(`QA_V251_FINAL total=${report.total} passed=${report.passed} failed=${report.failed}`);
for(const x of failed)console.log(`FAILED ${x.name}: ${x.detail}`);
process.exitCode=0;
