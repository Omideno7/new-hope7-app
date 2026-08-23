import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const checks=[];
const add=(name,pass,detail='')=>checks.push({name,pass:!!pass,detail});
const read=p=>fs.readFileSync(p,'utf8');
const exists=p=>fs.existsSync(p);

const syntaxFiles=[
  'js/nh7-account-content-access-v251.js',
  'js/nh7-reader-ux-v251.js',
  'js/nh7-admin-content-access-v251.js',
  'js/admin-v2.3.5-analytics.js',
  'js/nh7-apocrypha-reader-flow-v244.js'
];
for(const file of syntaxFiles){
  const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  add(`syntax:${file}`,r.status===0,(r.stderr||r.stdout||'').trim());
}

const rc=read('rc-full.html');
add('rc-version-2.5.1',rc.includes("window.NH7_VERSION = '2.5.1-RC'"));
add('rc-loads-account-access',rc.includes('js/nh7-account-content-access-v251.js?v=2.5.1'));
add('rc-loads-reader-ux',rc.includes('js/nh7-reader-ux-v251.js?v=2.5.1'));
add('rc-apocrypha-css-v251',rc.includes('css/nh7-apocrypha-reader-flow-v244.css?v=2.5.1'));

const apoCss=read('css/nh7-apocrypha-reader-flow-v244.css');
add('apo-highlight-visible-yellow',apoCss.includes('[data-nh7-apo-color="yellow"]'));
add('apo-highlight-visible-green',apoCss.includes('[data-nh7-apo-color="green"]'));
add('apo-highlight-visible-blue',apoCss.includes('[data-nh7-apo-color="blue"]'));
add('apo-highlight-visible-pink',apoCss.includes('[data-nh7-apo-color="pink"]'));
add('apo-highlight-visible-purple',apoCss.includes('[data-nh7-apo-color="purple"]'));

const reader=read('js/nh7-reader-ux-v251.js');
add('reader-font-minus',reader.includes('data-v251-font-minus'));
add('reader-font-plus',reader.includes('data-v251-font-plus'));
add('apo-save-button',reader.includes('data-nh7-apo-save'));
add('saved-verse-inline-text',reader.includes('nh7-saved-inline-v251')&&reader.includes('resolveSaved'));
add('chapter-nav-scroll-top',reader.includes('pendingReaderTop')&&reader.includes('scrollReaderStart'));

const access=read('js/nh7-account-content-access-v251.js');
add('access-uses-unified-rpc',access.includes('nh7_my_content_access_v251'));
add('access-rewrites-library-edge',access.includes('nh7-library-access-v251'));
add('access-rewrites-media-edge',access.includes('nh7-school-media-access-v251'));
add('access-hides-minister-tab-without-grant',access.includes('minister.hidden=!status.library_any'));
add('access-hides-media-without-grant',access.includes('tile.hidden=!status.media_any'));
add('access-no-password-prompt',!access.includes('prompt('));

const adminLoader=read('js/admin-v2.3.5-analytics.js');
add('admin-loader-local-core',adminLoader.includes("const CORE='js/admin-v2.3.5-analytics-core-v237.js"));
add('admin-loader-account-manager',adminLoader.includes('nh7-admin-content-access-v251.js'));
add('admin-loader-no-jsdelivr',!adminLoader.includes('cdn.jsdelivr.net'));

const admin=read('js/nh7-admin-content-access-v251.js');
add('admin-account-search',admin.includes('nh7-v251-user-search'));
add('admin-grant-rpc',admin.includes('nh7_admin_content_access_grant_v251'));
add('admin-revoke-rpc',admin.includes('nh7_admin_content_access_revoke_v251'));
add('admin-library-all',admin.includes('library_all'));
add('admin-library-collection',admin.includes('library_collection'));
add('admin-library-item',admin.includes('library_item'));
add('admin-media-all',admin.includes('media_all'));
add('admin-video-item',admin.includes('video_item'));
add('admin-disables-legacy-code-ui',admin.includes('nh7CreateLibraryCodeV224')&&admin.includes('nh7V316CreateCode'));

add('obsolete-parallel-ui-removed',!exists('js/nh7-admin-minister-access-v251.js'));
add('unified-migration-present',exists('supabase/migrations/20260823091407_unify_account_content_access_v251.sql'));
const migration=read('supabase/migrations/20260823091407_unify_account_content_access_v251.sql');
add('migration-drops-parallel-table',migration.includes('drop table if exists public.nh7_minister_access_v251'));
add('migration-retains-code-signatures-but-ignores-code',migration.includes('p_code text default')&&migration.includes('nh7_library_authorize_v251')&&migration.includes('nh7_video_authorize_v251'));
add('migration-revokes-code-creation',migration.includes('revoke execute on function public.nh7_admin_library_create_code_v222')&&migration.includes('nh7_admin_school_video_create_code_v260'));

const failed=checks.filter(x=>!x.pass);
const report={schema_version:1,qa_version:'2.5.1',generated_at:new Date().toISOString(),checks,total:checks.length,passed:checks.length-failed.length,failed:failed.length,release_candidate_static_gate_passed:failed.length===0};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/qa-v251.json',JSON.stringify(report,null,2)+'\n');
console.log(`QA_V251 total=${checks.length} passed=${report.passed} failed=${report.failed}`);
for(const x of failed)console.log(`FAILED ${x.name}: ${x.detail}`);
process.exitCode=0;
