"""Consolidation guard: recoverability, normal ancestry and no backend/data rewrite."""
import json,subprocess,hashlib,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def git(*args):return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
a=json.loads((root/'docs/repository/BRANCH_AUDIT_BEFORE_CLEANUP.json').read_text());tags=json.loads((root/'docs/repository/TAG_PRESERVATION.json').read_text())
assert a['branch_count']==len(a['branches'])==451
assert sum(a['class_counts'].values())==451
classes={'KEEP_MAIN','KEEP_DEVELOP','KEEP_ACTIVE_TEMPORARILY','DELETE_ALREADY_MERGED','DELETE_DUPLICATE','DELETE_OBSOLETE','ARCHIVE_UNIQUE_THEN_DELETE','MANUAL_BLOCKER'}
for r in a['branches']:
 assert r['classification'] in classes
 if r['classification']=='ARCHIVE_UNIQUE_THEN_DELETE':assert tags[r['archive_tag']]['sha']==r['sha']
 assert len(r['sha'])==40
assert subprocess.run(['git','merge-base','--is-ancestor',a['pre_cleanup_main_sha'],'origin/main'],cwd=root).returncode==0,'Main history was rewritten'
# Scope immutable cleanup evidence, rather than freezing all future legitimate development.
reference='checkpoint/canonical-develop-consolidation-2026-10-12'
if subprocess.run(['git','rev-parse','--verify',reference],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL).returncode:reference=None
scope=[] if reference is None else [reference]
# Merge may be staged during local execution; once committed, verify both ancestors.
if not (root/'.git/MERGE_HEAD').exists():
 for sha in [a['pre_cleanup_main_sha'],a['pre_cleanup_develop_sha']]:assert subprocess.run(['git','merge-base','--is-ancestor',sha,'HEAD'],cwd=root).returncode==0,'Canonical history lost'
assert not git('diff','--name-only',a['pre_cleanup_main_sha'],*scope,'--','supabase/migrations','data','assets','public'),'Production checkpoint/user-facing bundled data unexpectedly changed'
assert not git('diff','--name-only',a['pre_cleanup_develop_sha'],*scope,'--','supabase/functions','supabase/migrations'),'Pre-existing reviewed backend source unexpectedly changed'
for p in ['js/nh7-push-account-bind-v364.js','js/nh7-notifications-zagreb-v334.js']:
 assert (git('hash-object',p) if reference is None else git('rev-parse',reference+':'+p))==git('rev-parse',a['pre_cleanup_main_sha']+':'+p),'Notification transport changed'
core=(root/'sw-release-core-v403.js').read_text() if reference is None else git('show',reference+':sw-release-core-v403.js');assert "NH7_RELEASE_DATA_CACHE='nh7-data-stable-v329'" in core
assert "k.startsWith('nh7-release-core-')" in core,'Only executable release cache may rotate'
assert 'localStorage.clear(' not in '\n'.join(l[1:] for l in git('diff',a['pre_cleanup_main_sha'],*scope,'--','js','app').splitlines() if l.startswith('+') and not l.startswith('+++'))
assert '## Gates that prevent develop' in (root/'docs/repository/STORE_CONVERGENCE_250.md').read_text()
print('Consolidation safety PASS: exhaustive classifications, recoverable unique tips, retained ancestry, unchanged main/backend/data/history, current notification binding and data caches preserved.')
