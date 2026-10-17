"""Independent Batch2 scope, exact inverse patch, unchanged backend/engines/persistence/Batch1 authority."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
from school_accepted_source_v580 import prior_school_bytes,protected_diff,school_additions
import hashlib,subprocess,tempfile
from batch2_accepted_source import BASE,contract2,prior_batch2_bytes
m=contract2();assert m['base']==BASE
expected={'js/app.js','js/nh7-adaptive-layout-v570.js','js/nh7-audio-quick-bible-v454.js','js/nh7-spiritual-plans-v240.js','css/nh7-platform-wave7.css','js/nh7-reader-ux-v251.js'}
assert set(m['runtime'])==expected
changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines());assert changed<=set(m['approved_paths']),changed-set(m['approved_paths'])
p=Path('scripts/fixtures/batch2-approved-ui.patch');assert hashlib.sha256(p.read_bytes()).hexdigest()==m['patch_sha256']
with tempfile.TemporaryDirectory(prefix='nh7-batch2-check-') as temp:
 for name in expected:
  prior_batch2_bytes(name);out=Path(temp)/name;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(prior_school_bytes(name))
 subprocess.run(['git','apply','--reverse','--check','--unidiff-zero',str(p.resolve())],cwd=temp,check=True)
assert not protected_diff(BASE,['supabase','data','public','watchos','index.html','service-worker.js','sw-release-core-v403.js','js/nh7-platform-wave7.js','js/nh7-profile-photo-v564.js','js/nh7-user-context-wave6.js','js/nh7-local-first-wave2.js','js/nh7-audio-classic-v484.js','js/nh7-audio-library-v500.js','js/nh7-media-player-v500.js','js/nh7-admin-rbac-v350.js','js/document-studio-v2'])
# Existing Batch1/auth/persistence functions are byte-exact, independently of inverse mapping.
import re
before=subprocess.check_output(['git','show',BASE+':js/app.js']).decode();after=prior_school_bytes('js/app.js').decode()
def functions(s):
 hits=list(re.finditer(r'^(?:async )?function (\w+)\(',s,re.M));return {h[1]:s[h.start():hits[i+1].start() if i+1<len(hits) else len(s)] for i,h in enumerate(hits)}
a,b=functions(before),functions(after)
for name in ['signInAccount','signInSchool','logoutAccount','fetchLatestRegistration','saveNoteCloud','saveProgressCloud','restoreAccountCloudDataWave2','getSchoolSnapshot','submitSchoolAssignment','submitSchoolExam','navigate','back']:
 assert a[name]==b[name],name
assert 'FA · EN · HR' not in Path('js/nh7-spiritual-plans-v240.js').read_text()
assert 'showModal()' not in Path('js/nh7-audio-quick-bible-v454.js').read_text()
print('PASS Batch2 exact reversible presentation-only delta; Batch1/auth/data/persistence/backend/engines and activation gates preserved')
old_plans=subprocess.check_output(['git','show',BASE+':js/nh7-spiritual-plans-v240.js']).decode()
assert old_plans.replace('<span class="badge">FA · EN · HR</span>','')==Path('js/nh7-spiritual-plans-v240.js').read_text(),'Only the redundant hero badge may change'
a,b=functions(subprocess.check_output(['git','show',BASE+':js/nh7-audio-quick-bible-v454.js']).decode()),functions(Path('js/nh7-audio-quick-bible-v454.js').read_text())
for name in ['place','chapter','show','findReference','options']:
 assert a[name]==b[name],name

old_reader=subprocess.check_output(['git','show',BASE+':js/nh7-reader-ux-v251.js']).decode()
assert old_reader.replace("function navigationPatch(){const sig=readerSignature();", "function navigationPatch(){const sig=readerSignature();/* Canonical Bible router owns fresh-target and Back restoration. */if(sig.startsWith('bible|')&&history.state?.route==='bible'){lastReaderSignature=sig;pendingReaderTop=false;return}")==Path('js/nh7-reader-ux-v251.js').read_text(),'Only defer Bible scroll ownership to canonical router'
