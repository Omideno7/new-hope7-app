"""Independent CURRENT source scope/security; previous exact checkpoints remain enforced."""
from pathlib import Path
import subprocess,re,hashlib,yaml
from batch3b_accepted_source import BASE,verify3b,prior_batch3b_bytes
m=verify3b();old=lambda p:subprocess.check_output(['git','show',BASE+':'+p])
changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines())
assert changed==set(m['approved_paths']),changed^set(m['approved_paths'])
protected=['supabase/migrations','supabase/functions','data','public','watchos','ios','android','js/document-studio-v2','supabase/review/school-progression-v580','supabase/review/batch3a-qa-owner-removal','js/nh7-school-cycles-v580.js','js/nh7-admin-school-cycles-v580.js','js/nh7-school-path-v351.js','js/nh7-school-drafts-v468.js','js/nh7-security-core-v340.js','js/nh7-admin-rbac-v350.js','js/nh7-profile-photo-v564.js','js/nh7-local-first-wave2.js','js/nh7-user-context-wave6.js','js/nh7-push-account-bind-v364.js','js/nh7-batch3a-v581.js','js/nh7-inbox-badge-sync-v418.js','js/nh7-my-notes-v234.js','js/nh7-spiritual-plans-v240.js','js/nh7-spiritual-plans-v412.js','js/nh7-audio-classic-v484.js','js/nh7-audio-library-v500.js','js/nh7-media-player-v500.js','service-worker.js']
assert not subprocess.check_output(['git','diff',BASE,'--',*protected]),'Unrelated authority/data/engine changed'
def functions(s):
 hits=list(re.finditer(r'^(?:async )?function (\w+)\(',s,re.M));return {h[1]:s[h.start():hits[i+1].start() if i+1<len(hits) else len(s)] for i,h in enumerate(hits)}
a,b=functions(old('js/app.js').decode()),functions(Path('js/app.js').read_text());assert set(a)==set(b);assert {k for k in a if a[k]!=b[k]}=={'defaultMeetingSettings','fetchMeetingSettings','renderMeetingDetails','meetings'}
a,b=functions(old('js/nh7-celebrations-v464.js').decode()),functions(Path('js/nh7-celebrations-v464.js').read_text());assert set(a)==set(b);assert {k for k in a if a[k]!=b[k]}=={'modalCopy','openCalendar','run'}
assert a['annualEvents']==b['annualEvents'] and a['feastText']==b['feastText'] and a['birthday']==b['birthday'] and a['profile']==b['profile']
for file in ['js/nh7-church-connect-batch3b.js','js/nh7-admin-connect-batch3b.js']:
 s=Path(file).read_text();assert not re.search(r'console\.|setInterval\(|sendBeacon|service_role|sb_secret_|requestPermission|Notification\(|subscribe\(|calendar\.read|localStorage\.setItem|sessionStorage\.setItem',s),file
 subprocess.run(['node','--check',file],check=True)
secret=re.search(r"security_code:'([^']+)'",old('js/app.js').decode()).group(1)
# Current runtime/static seeds never contain the obsolete quoted credential.
for name in subprocess.check_output(['git','ls-files']).decode().splitlines():
 if name.endswith(('.js','.html','.json','.sql')) and not name.startswith(('docs/','scripts/','supabase/migrations/','supabase/review/')):
  try:s=Path(name).read_text()
  except UnicodeError:continue
  assert "'"+secret+"'" not in s and '"'+secret+'"' not in s,'Obsolete bundled credential: '+name
assert Path('admin.html').read_text().replace('\n<script defer src="js/nh7-admin-connect-batch3b.js?v=3b"></script>\n<link rel="stylesheet" href="css/nh7-church-connect-batch3b.css?v=3b">','')==old('admin.html').decode()
assert Path('index.html').read_text().replace('  <link rel="stylesheet" href="css/nh7-church-connect-batch3b.css?v=3b" />\n','').replace('  <script src="js/nh7-church-connect-batch3b.js?v=3b" defer></script>\n','')==old('index.html').decode()
assert Path('sw-release-core-v403.js').read_text().replace("  './js/nh7-church-connect-batch3b.js',\n  './css/nh7-church-connect-batch3b.css',\n",'')==old('sw-release-core-v403.js').decode()
for name in ['supabase_v1_6_3_meeting_settings_fix.sql','supabase_v1_6_4_meeting_settings_rpc_fix.sql']:
 assert Path(name).read_text()==old(name).decode().replace("'"+secret+"'","''").replace('"'+secret+'"','""'),name
# Birthday branch, owner/DOB lookup, dates, text and Bible handoff retain every original byte.
calendar_old=functions(old('js/nh7-celebrations-v464.js').decode());calendar_now=functions(Path('js/nh7-celebrations-v464.js').read_text())
assert calendar_now['modalCopy'].split(' }else{')[0]==calendar_old['modalCopy'].split(' }else{')[0]
assert calendar_now['run']==calendar_old['run'].replace(' header();',' window.NH7ConnectBatch3B?.home();header();')
app=Path('js/app.js').read_text();assert "cloudRpc('nh7_get_meeting_settings'" not in app;assert "cloudFetch('meeting_settings?" not in app
sql=Path('supabase/review/batch3b-church-connect/candidate.sql').read_text();assert 'RAISE EXCEPTION' in sql.split('-- BEGIN SYNTHETIC CANDIDATE')[0];assert sql.rstrip().endswith('ROLLBACK;');assert not re.search(r'GRANT\s+ALL|TO\s+PUBLIC|auth\.jwt\(\).*email',sql,re.I)
assert sql.count("private.nh7_admin_is_owner_v350()")>=4 and 'auth.uid()' in sql
before=yaml.safe_load(old('.github/workflows/validate-develop.yml'));after=yaml.safe_load(Path('.github/workflows/validate-develop.yml').read_text());steps=after['jobs']['validate']['steps'];new=[x for x in steps if x['name']=='Validate Batch 3B Calendar YouVersion Church Connect without activation'];assert len(new)==1;after['jobs']['validate']['steps']=[s for s in steps if s not in new];assert before==after,'No prior CI step or permission may change'
# Exact prior fixture is unchanged; projection cannot alter its safety assertions.
for name in ['scripts/fixtures/batch3a-source-contract.json','scripts/fixtures/batch3a-approved.patch','scripts/fixtures/school-source-contract-v580.json','scripts/fixtures/school-approved-v580.patch']:
 assert Path(name).read_bytes()==old(name),name
# Guard reconciliation is an exact additive transform, never a broad whitelist or removed assertion.
x=old('scripts/batch3a_accepted_source.py').decode()
x=x.replace('from functools import lru_cache','from functools import lru_cache\nfrom batch3b_accepted_source import prior_batch3b_bytes,batch3b_paths,batch3b_additions').replace(" return m\ndef verify3a"," m['approved_paths']=sorted(set(m['approved_paths'])|batch3b_paths())\n return m\ndef verify3a").replace('hashlib.sha256(Path(p).read_bytes())','hashlib.sha256(prior_batch3b_bytes(p))').replace('current=Path(p).read_bytes()','current=prior_batch3b_bytes(p)').replace('return ADDITIONS','return ADDITIONS|batch3b_additions()')
assert Path('scripts/batch3a_accepted_source.py').read_text()==x
x=old('scripts/verify-batch3a-safety.py').decode().replace('from batch3a_accepted_source import BASE,EXISTING,ADDITIONS,verify3a','from batch3a_accepted_source import BASE,EXISTING,ADDITIONS,verify3a\nfrom batch3b_accepted_source import prior_batch3b_bytes,diff_without3b').replace("not subprocess.check_output(['git','diff',BASE,'--',*protected])",'not diff_without3b(BASE,protected)')
for name in ['js/app.js','index.html','sw-release-core-v403.js']:x=x.replace(f"Path('{name}').read_text()",f"prior_batch3b_bytes('{name}').decode()")
x=x.replace('out.write_bytes(Path(name).read_bytes())','out.write_bytes(prior_batch3b_bytes(name))').replace("yaml.safe_load(Path('.github/workflows/validate-develop.yml').read_text())","yaml.safe_load(prior_batch3b_bytes('.github/workflows/validate-develop.yml').decode())")
assert Path('scripts/verify-batch3a-safety.py').read_text()==x
x=old('scripts/school_accepted_source_v580.py').decode().replace('from pathlib import Path','from pathlib import Path\nfrom batch3b_accepted_source import contract3b').replace('return names-(EXISTING|NEW_RUNTIME|NEW_BACKEND|BATCH3A_EXISTING|batch3a_additions())',"return names-(EXISTING|NEW_RUNTIME|NEW_BACKEND|BATCH3A_EXISTING|batch3a_additions()|set(contract3b()['files']))")
assert Path('scripts/school_accepted_source_v580.py').read_text()==x

x=old('scripts/verify-wave66-evidence.py').decode().replace("  assert name in Path(c['path']).read_text(),('Removed current caller',name,c)",'  if r[\'row\']==131 and name==\'nh7_get_meeting_settings\' and c[\'path\']==\'js/app.js\':\n   # Batch3B intentionally retires this one unproven email/device transport; old Store callers still block live ACL changes.\n   from batch3b_accepted_source import prior_batch3b_bytes\n   assert name in prior_batch3b_bytes(c[\'path\']).decode()\n   assert "cloudRpc(\'nh7_get_meeting_settings\'" not in Path(c[\'path\']).read_text()\n   assert "cloudFetch(\'meeting_settings?" not in Path(c[\'path\']).read_text()\n  else:\n   assert name in Path(c[\'path\']).read_text(),(\'Removed current caller\',name,c)')
assert Path('scripts/verify-wave66-evidence.py').read_text()==x
subprocess.run(['python3','scripts/verify-supabase-migration-parity.py'],check=True)
print('PASS Batch3B exact named source contract, four meeting functions only; Calendar dates/text/birthday exact; no provider/poll/secret cache; SQL guarded, no migration; all prior CI/security/engines retained')
