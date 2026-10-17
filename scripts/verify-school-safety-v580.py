"""Independent CURRENT School delta check; existing historical safety gates remain untouched."""
from pathlib import Path
import subprocess,re,hashlib,tempfile
from school_accepted_source_v580 import verify_school_contract,EXISTING
BASE='b769df6d91cc2ffb4cc86905ab35d2c022fb2447'
old=lambda p:subprocess.check_output(['git','show',BASE+':'+p])
existing={'admin.html','index.html','js/app.js','js/nh7-school-drafts-v468.js','js/nh7-school-path-v351.js','js/nh7-security-core-v340.js'}
protected=['data','public','watchos','supabase/functions','js/document-studio-v2','service-worker.js','js/nh7-admin-rbac-v350.js','js/nh7-audio-classic-v484.js','js/nh7-audio-library-v500.js','js/nh7-media-player-v500.js','js/nh7-profile-photo-v564.js','js/nh7-local-first-wave2.js','js/nh7-user-context-wave6.js']
assert not subprocess.check_output(['git','diff',BASE,'--',*protected]),'Unrelated authority/data/engine changes'
for p in ['admin.html','index.html']:
 line='  <script src="js/nh7-school-cycles-v580.js?v=580"></script>\n' if p=='index.html' else '<script defer src="js/nh7-admin-school-cycles-v580.js?v=580"></script>\n'
 assert Path(p).read_text().replace(line,'')==old(p).decode(),p
assert Path('sw-release-core-v403.js').read_text().replace("  './js/nh7-school-cycles-v580.js',\n  './js/nh7-admin-school-cycles-v580.js',\n",'')==old('sw-release-core-v403.js').decode(),'Only cache the two required School dependencies; all cache/storage behavior remains exact'
# All non-School app functions are byte-identical, not whitelisted by directory.
def functions(s):
 hits=list(re.finditer(r'^(?:async )?function (\w+)\(',s,re.M));return {h[1]:s[h.start():hits[i+1].start() if i+1<len(hits) else len(s)] for i,h in enumerate(hits)}
a,b=functions(old('js/app.js').decode()),functions(Path('js/app.js').read_text())
allowed={'getSchoolSnapshot','submitSchoolAssignment','school','schoolLesson','saveSchoolProgress'}
prefix_old=old('js/app.js').decode().split('function ',1)[0];prefix_new=Path('js/app.js').read_text().split('function ',1)[0];assert prefix_new.replace(',cycle:()=>window.NH7SchoolCyclesV580?.cycleForView()||0','')==prefix_old,'Only add cycle dependency before app functions'
assert set(a)==set(b)
assert "if(params.exam==='foundation_school'&&window.NH7SchoolPathV351?.openFinalExam)" in b['school']
assert {n for n in a if a[n]!=b[n]}<=allowed,'Unexpected app function change'
# Q&A/Library interceptors stay exact; only School read/progress/submit sections can change.
a=old('js/nh7-security-core-v340.js').decode();b=Path('js/nh7-security-core-v340.js').read_text()
start="  if(resource==='qa_questions'";end='\n  return nativeFetch(input,init);'
assert a[a.index(start):a.index(end)]==b[b.index(start):b.index(end)],'Unrelated Q&A/Library transport changed'
start="  if(resource==='school_exam_attempts'";end="  if(resource==='school_progress'"
assert a[a.index(start):a.index(end)]==b[b.index(start):b.index(end)],'Raw score write block changed'
for name in ['js/nh7-school-cycles-v580.js','js/nh7-admin-school-cycles-v580.js']:
 s=Path(name).read_text()
 assert not re.search(r'setInterval\(|setTimeout\(|\.clear\(|service_role|sb_secret_|XMLHttpRequest|sendBeacon',s.replace('verified.clear()','').replace('memory.clear()','')),name
 assert 'confirm(' in s
assert 'cycles.submit(session,answers)' in b and 'SERVER_SCORING_REQUIRED' in b
assert 'REJECTED_COST' in Path('docs/qa/WAVE7_5_ZERO_COST_AUDIO_ANALYTICS_DECISION.md').read_text()
# All 42 original checkpoint files and v511 are byte-exact. New migration is explicitly pending.
old_names=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--','supabase/migrations']).decode().splitlines()
for p in old_names:assert Path(p).read_bytes()==old(p),p
new=set(str(p) for p in Path('supabase/migrations').glob('*.sql'))-set(old_names)
assert new=={'supabase/migrations/20261017130000_school_cycles_and_admin_overrides_v580.sql'}
subprocess.run(['python3','scripts/verify-supabase-migration-parity.py'],check=True)
print('PASS current School scope: five app functions only; Admin/index single dependency; engines/Notes/Auth/Library/documents/42 checkpoints/v511 unchanged; no new recurring timers/telemetry; new unapplied School migration explicit. Historical assertions remain intact through the explicitly approved exact-source bridge.')

# Current-source bridge must prove the exact delta BEFORE historical assertions use prior bytes.
m=verify_school_contract();assert m['base']==BASE
changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines())
assert changed<=set(m['approved_paths']),changed-set(m['approved_paths'])
patch=Path('scripts/fixtures/school-approved-v580.patch');assert hashlib.sha256(patch.read_bytes()).hexdigest()==m['patch_sha256']
with tempfile.TemporaryDirectory(prefix='nh7-school-inverse-') as tmp:
 for name in EXISTING:
  out=Path(tmp)/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(Path(name).read_bytes())
 subprocess.run(['git','apply','--reverse','--check','--unidiff-zero',str(patch.resolve())],cwd=tmp,check=True)
print('PASS exact School before/after hashes and reversible patch; individually named paths; all original guard assertions retained on exact accepted prior source')

# Keep every existing CI step/permission intact; exactly one additional independent School gate.
import yaml
prior_workflow=yaml.safe_load(old('.github/workflows/validate-develop.yml'))
current_workflow=yaml.safe_load(Path('.github/workflows/validate-develop.yml').read_text())
steps=current_workflow['jobs']['validate']['steps'];new_steps=[s for s in steps if s['name']=='Validate School cycle and Admin override source without activation'];assert len(new_steps)==1
current_workflow['jobs']['validate']['steps']=[s for s in steps if s not in new_steps]
assert current_workflow==prior_workflow,'Existing CI commands, permissions or gates changed'
# Compiler determinism protects against stale generated SQL; it has no DB/network client.
paths=['supabase/review/school-progression-v580/compiled-rpcs.sql','supabase/migrations/20261017130000_school_cycles_and_admin_overrides_v580.sql']
before=[Path(p).read_bytes() for p in paths]
subprocess.run(['python3','scripts/build-school-cycle-source-v580.py'],check=True)
assert before==[Path(p).read_bytes() for p in paths],'Generated SQL was stale'
print('PASS original CI steps/permissions byte-equivalent; additive School gate only; SQL source compiler deterministic')

# A zero-latency Admin fixture raced deferred bootstrap (unchanged baseline47/65/66).
# Preserve every request and every original cost/idle assertion; only paired fixture latency/metadata changes.
old_measure=old('scripts/measure-wave75.cjs').decode()
expected=old_measure.replace('const calls=await a.intercept(c,base),p=await c.newPage();',"const calls=await a.intercept(c,base,{delay:async({name})=>{if(name==='nh7_admin_my_access_v350')await new Promise(r=>setTimeout(r,500))}}),p=await c.newPage();").replace('Fixed500ms Inbox fixture latency matches previous protocol;','Fixed500ms owner-proof latency stabilizes deferred-wrapper bootstrap in BOTH Admin payloads; fixed500ms Inbox fixture latency matches previous protocol;')
assert Path('scripts/measure-wave75.cjs').read_text()==expected,'Only identical fixed fixture latency and honest metadata; no cost assertion/filter change'
print('PASS Wave75 measurement original assertions/counting unchanged; symmetric500ms owner-proof fixture only')
