#!/usr/bin/env python3
"""Verify the immutable PR #243 synchronization evidence without contacting Supabase."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = json.loads((ROOT / 'docs/repository/MAIN_DEVELOP_SYNC_20261012.json').read_text())


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def parents(sha):
    return git('show', '-s', '--format=%P', sha).decode().strip().split()


main = EVIDENCE['main_sha']
old_develop = EVIDENCE['previous_develop_sha']
tip = EVIDENCE['pr243_original_tip_sha']
first_merge = EVIDENCE['main_into_develop_merge_sha']
candidate = EVIDENCE['synchronized_runtime_develop_sha']
assert parents(first_merge) == [old_develop, main], 'Main was not normally merged into develop'
assert parents(candidate) == [first_merge, tip], 'Original squash-merged tip ancestry was not preserved'
for sha in (old_develop, main, tip, candidate):
    git('merge-base', '--is-ancestor', sha, 'HEAD')
assert git('rev-parse', candidate + '^{tree}') == git('rev-parse', first_merge + '^{tree}'), 'Ancestry-only merge changed files'
assert git('rev-parse', tip + '^{tree}') == git('rev-parse', main + '^{tree}'), 'Original PR tip differs from squash result'
changed = set(git('diff', '--name-only', old_develop, candidate).decode().splitlines())
assert changed == set(EVIDENCE['pr243_file_sha256']), 'Synchronization changed unrelated files'
for path, expected in EVIDENCE['pr243_file_sha256'].items():
    for source in (main, tip, candidate):
        assert hashlib.sha256(git('show', source + ':' + path)).hexdigest() == expected, f'PR #243 bytes differ: {source}:{path}'
    subprocess.run(['node', '--check', path], cwd=ROOT, check=True)
assert not git('diff', '--name-only', old_develop, candidate, '--', 'supabase').strip(), 'Backend source/migrations changed'
heads = EVIDENCE['remote_heads_at_capture']
assert len(heads) == EVIDENCE['remote_branch_count_at_capture'] == 7
assert heads['main'] == main and heads['develop'] == candidate
assert EVIDENCE['temporary_branch'] not in heads and EVIDENCE['temporary_branch_deleted']
assert EVIDENCE['reachability_verified_on_remote_develop_before_deletion']
assert EVIDENCE['concurrent_unrelated_branch'] in heads
assert EVIDENCE['migration_parity'] == {'checkpoint_entries': 42, 'exact_matches': 42, 'pending': 0}
assert not EVIDENCE['production_backend_mutation'] and not EVIDENCE['main_modified_by_synchronization']
print('Main/develop synchronization PASS: normal merges, complete ancestry, exact PR #243 bytes, no unrelated runtime/backend changes; immutable deletion/head evidence verified.')
