"""CURRENT Batch3A scope/authority gates. No prior-byte projection used for behavior."""
from pathlib import Path
import subprocess,re,hashlib,tempfile,yaml
from batch3a_accepted_source import BASE,EXISTING,ADDITIONS,verify3a
from batch3b_accepted_source import prior_batch3b_bytes,diff_without3b
m=verify3a()
old=lambda p:subprocess.check_output(['git','show',BASE+':'+p])
# Every earlier School byte, ordinary migration and existing privileged engine remains exact.
protected=['supabase/migrations','supabase/functions','supabase/review/school-progression-v580','supabase/review/wave5-document-studio-v2','data','public','watchos','admin.html','admin-v239-stable.html','service-worker.js','js/nh7-school-cycles-v580.js','js/nh7-admin-school-cycles-v580.js','js/nh7-school-path-v351.js','js/nh7-school-drafts-v468.js','js/nh7-security-core-v340.js','js/nh7-admin-rbac-v350.js','js/nh7-profile-photo-v564.js','js/nh7-local-first-wave2.js','js/nh7-user-context-wave6.js','js/nh7-push-account-bind-v364.js','js/nh7-notification-contract-wave4.js','js/nh7-notification-intents-wave4.js','js/nh7-audio-classic-v484.js','js/nh7-audio-library-v500.js','js/nh7-media-player-v500.js']
assert not diff_without3b(BASE,protected),'Protected School/authority/engine/data changed'
def functions(s):
 h=list(re.finditer(r'^(?:async )?function (\w+)\(',s,re.M));return {x[1]:s[x.start():h[i+1].start() if i+1<len(h) else len(s)] for i,x in enumerate(h)}
a,b=functions(old('js/app.js').decode()),functions(prior_batch3b_bytes('js/app.js').decode());assert set(a)==set(b)
allowed={'saveCloud','inboxMessages','setInboxMessages','updateInboxBadge','refreshInboxFromCloud','maybeCreateScheduledInboxMessages','inbox','nh7ReadQnaPublicCacheV470','nh7WriteQnaPublicCacheV470','nh7MergeOwnQuestionsV470','qna','myDocumentsV510','myDocumentsHtmlV510','account','bindDynamic'}
assert {k for k in a if a[k]!=b[k]}==allowed
assert b['saveCloud']==a['saveCloud'].replace('saveProgress:(...args)=>saveProgressCloud(...args),deleteNote:','saveNote:(...args)=>saveNoteCloud(...args),saveProgress:(...args)=>saveProgressCloud(...args),deleteNote:'),'Existing save function only exposes its same-key bridge'
assert b['bindDynamic']==a['bindDynamic'].replace("$$('[data-inbox-open]')","$$('[data-inbox-open]:not([data-inbox3a])')"),'No unrelated handler change'
assert prior_batch3b_bytes('index.html').decode().replace('  <script src="js/nh7-batch3a-v581.js?v=581"></script>\n','')==old('index.html').decode()
assert prior_batch3b_bytes('sw-release-core-v403.js').decode().replace("  './js/nh7-batch3a-v581.js',\n",'')==old('sw-release-core-v403.js').decode(),'Only precache exact required dependency; no cache clearing/version rewrite'
# Plans existing persistence/start/progression code stays byte-identical, explicit new note API appended.
plans=Path('js/nh7-spiritual-plans-v240.js').read_text();assert plans.startswith(old('js/nh7-spiritual-plans-v240.js').decode())
added=plans[len(old('js/nh7-spiritual-plans-v240.js').decode()):];assert 'ensurePlanStarted(' not in added and 'derivePlanCompletion(' not in added and 'lastOpenedDay =' not in added
runtime=Path('js/nh7-batch3a-v581.js').read_text();assert not re.search(r'setInterval\(|setTimeout\(|\.clear\(|service_role|sendBeacon|XMLHttpRequest|\.init\(',runtime.replace('badge.clear()','').replace('cordova.clear(resolve,reject)',''))
assert 'visibleLoop(' not in Path('js/nh7-inbox-badge-sync-v418.js').read_text(),'No recurring Inbox poll'
assert 'REJECTED_COST' in Path('docs/qa/WAVE7_5_ZERO_COST_AUDIO_ANALYTICS_DECISION.md').read_text()
# Exact reversible patch plus explicit individually named additions/QA paths.
p=Path('scripts/fixtures/batch3a-approved.patch');assert hashlib.sha256(p.read_bytes()).hexdigest()==m['patch_sha256']
with tempfile.TemporaryDirectory(prefix='nh7-batch3a-inverse-') as d:
 for name in EXISTING:
  out=Path(d)/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(prior_batch3b_bytes(name))
 subprocess.run(['git','apply','--reverse','--check','--unidiff-zero',str(p.resolve())],cwd=d,check=True)
changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines());assert changed==set(m['approved_paths']),changed^set(m['approved_paths'])
before=yaml.safe_load(old('.github/workflows/validate-develop.yml'));after=yaml.safe_load(prior_batch3b_bytes('.github/workflows/validate-develop.yml').decode());steps=after['jobs']['validate']['steps'];new=[s for s in steps if s['name']=='Validate Batch 3A Account Notes Q&A Inbox without activation'];assert len(new)==1;after['jobs']['validate']['steps']=[s for s in steps if s not in new];assert before==after,'All earlier CI steps and permissions retained'
subprocess.run(['python3','scripts/verify-supabase-migration-parity.py'],check=True)
print('PASS Batch3A exact current scope; School v580, migration42+2, Auth/RLS/Notes sync/Audio/Profile/notification authority intact; no recurring new cost; exact inverse bridge; all original CI steps retained')
