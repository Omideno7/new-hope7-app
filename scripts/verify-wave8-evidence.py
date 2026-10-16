"""Physical evidence cannot be fabricated from CI; every target and unresolved activation gate is explicit."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,re
m=json.loads(Path('scripts/fixtures/wave8-evidence-contract.json').read_text())
reports=['WAVE8_INTEGRATION_PHYSICAL_ACCEPTANCE_AUDIT.md','WAVE8_DEVICE_TEST_MATRIX.md','WAVE8_PHYSICAL_ACCEPTANCE_REPORT.md','WAVE8_UPGRADE_OFFLINE_REPORT.md','WAVE8_FINAL_REPORT.md']
for name in reports:
 p=Path('docs/qa')/name;assert p.is_file() and len(p.read_text())>500,name
matrix=Path('docs/qa/WAVE8_DEVICE_TEST_MATRIX.md').read_text()
for platform in m['platforms']:
 rows=[line for line in matrix.splitlines() if line.startswith('| '+platform+' |')];assert len(rows)==1,platform
 assert 'PHYSICAL_QA_REQUIRED' in rows[0] and 'UNKNOWN' in rows[0] and 'PASS_PHYSICAL' not in rows[0],rows
physical=Path('docs/qa/WAVE8_PHYSICAL_ACCEPTANCE_REPORT.md').read_text();final=Path('docs/qa/WAVE8_FINAL_REPORT.md').read_text()
for term in ['PHYSICAL_QA_REQUIRED','BLOCKED_TOOLCHAIN','PROVIDER_EVIDENCE_REQUIRED','BLOCKED_ACTIVATION']:
 assert term in physical and term in final,term
for i in range(1,10):assert 'A'+str(i) in physical,'Every Document gate must be accounted for'
assert 'PASS_PHYSICAL=0' in final and 'PASS_SIMULATOR=0' in final and 'REJECTED_COST' in final
for p in [Path('docs/qa/WAVE8_UPGRADE_OFFLINE_REPORT.md'),Path('docs/qa/WAVE8_FINAL_REPORT.md')]:
 assert 'immediate' in p.read_text().lower(),'Do not imply immediate last-write or native crash durability'
measure=json.loads(Path('docs/qa/WAVE8_INTEGRATION_MEASUREMENTS.json').read_text())
assert measure['status']=='PASS_AUTOMATED' and measure['working_tree_dirty'] is True
assert measure['checked_in_capture']['kind']=='local pre-commit worktree measurement'
assert measure['physical_passes']==measure['simulator_passes']==0
assert measure['analytics_decision']=='REJECTED_COST' and measure['additional_analytics_backend_reads']==measure['additional_analytics_backend_writes']==measure['additional_analytics_storage_bytes']==0
assert measure['migration_parity']['exact']==42 and measure['migration_parity']['pending']==1 and not measure['migration_parity']['applied']
assert 'FAIL' in measure['diagnostic_limitations']['fresh_profile_sigkill_1_5s_latest_checkpoint']
workflow=Path('.github/workflows/validate-develop.yml').read_text()
for p in ['verify-wave8-safety.py','verify-wave8-evidence.py','verify-wave8-provenance.py','verify-wave8-reconnect.cjs','verify-wave8-output.cjs','verify-wave8-upgrade.cjs','measure-wave8.cjs']:
 assert p in workflow,p
assert 'wave8-evidence-${{ github.sha }}' in workflow
print('PASS Wave8 required reports/seven physical targets/unknown install evidence/every Document activation gate/zero physical or simulator claims; full exact-head evidence stages retained')
