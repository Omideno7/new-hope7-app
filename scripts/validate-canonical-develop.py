#!/usr/bin/env python3
"""Run the actual current release validate blocks locally/CI; never run deploy jobs."""
import subprocess,sys
from pathlib import Path
import yaml
root=Path(__file__).resolve().parents[1]
workflow=yaml.safe_load((root/'.github/workflows/deploy-pages.yml').read_text())
for step in workflow['jobs']['validate']['steps']:
 if 'run' not in step:continue
 print('RUN:',step.get('name','validation'),flush=True)
 subprocess.run(['bash','-euo','pipefail','-c',step['run']],cwd=root,check=True)
for command in [['python3','scripts/validate_next_native_optimization_guard.py'],['python3','scripts/verify-document-v520.py'],['python3','scripts/verify-notification-inbox-global-v18.py'],['python3','scripts/verify-cost-audit-v545.py'],['python3','scripts/verify-fold-player-safe-v544.py'],['node','scripts/verify-profile-approved-student-code-v1.py']]:
 # Python verifiers use Python, regardless of nearby JS/module test names.
 if command[-1].endswith('.py'):command[0]='python3'
 subprocess.run(command,cwd=root,check=True)
subprocess.run(['git','diff','--check'],cwd=root,check=True)
print('Canonical develop gate PASS: actual release/legacy guards plus current develop safeguards; no deployment.')
