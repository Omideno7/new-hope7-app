"""Independently freeze all source except the exact reversible Batch1 UI repair."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import hashlib,subprocess,tempfile
from batch1_accepted_source import BASE,contract,prior_batch1_bytes
m=contract();assert m['base']==BASE
expected={'js/app.js','js/nh7-soul-winning-v472.js','js/nh7-admin-workspace-wave3.js','js/nh7-user-context-wave6.js','js/document-studio-v2/admin-entry.mjs','js/document-studio-v2/editor.mjs','css/styles.css'}
assert set(m['runtime'])==expected
changed=set(subprocess.check_output(['git','diff','--name-only',BASE]).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines())
assert changed<=set(m['approved_paths']),changed-set(m['approved_paths'])
patch=Path('scripts/fixtures/batch1-approved-ui.patch');assert hashlib.sha256(patch.read_bytes()).hexdigest()==m['patch_sha256']
with tempfile.TemporaryDirectory(prefix='nh7-batch1-inverse-') as temp:
 for p in expected:
  prior_batch1_bytes(p);out=Path(temp)/p;out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(Path(p).read_bytes())
 subprocess.run(['git','apply','--reverse','--check',str(patch.resolve())],cwd=temp,check=True)
# No backend, media engine, user-data or wrapper exception.
assert not subprocess.check_output(['git','diff',BASE,'--','supabase','data','public','watchos','service-worker.js','sw-release-core-v403.js','js/nh7-profile-photo-v564.js','js/nh7-local-first-wave2.js','js/nh7-audio-classic-v484.js','js/nh7-audio-library-v500.js','js/nh7-media-player-v500.js','js/nh7-admin-rbac-v350.js'])
for p in ['js/document-studio-v2/api.mjs','js/document-studio-v2/issuance.mjs','docs/qa/WAVE7_5_ZERO_COST_AUDIO_ANALYTICS_DECISION.md']:
 assert Path(p).read_bytes()==subprocess.check_output(['git','show',BASE+':'+p])
assert 'REJECTED_COST' in Path('docs/qa/WAVE7_5_ZERO_COST_AUDIO_ANALYTICS_DECISION.md').read_text()
for p in expected:
 s=Path(p).read_text();assert 'localStorage.clear(' not in s and 'sessionStorage.clear(' not in s
print('PASS Batch1 exact reversible UI-only delta; unchanged backend/data/engines/issuance authority/telemetry; explicit file boundary')
