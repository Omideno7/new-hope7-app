#!/usr/bin/env python3
import argparse, hashlib, json, re, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'supabase/review/migration-history-reconciliation-20261009/production-tail.json'
MIGRATIONS=ROOT/'supabase/migrations'

def semantic(text:str)->str:
    text=re.sub(r'--[^\n]*','',text)
    text=re.sub(r'\s+','',text)
    return hashlib.md5(text.encode()).hexdigest()

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--strict', action='store_true', help='also fail when Production-applied files are still missing')
    args=ap.parse_args()
    data=json.loads(MANIFEST.read_text())
    expected={m['version']:m for m in data['migrations']}
    unsafe=[]; present=set()
    for path in sorted(MIGRATIONS.glob('202610*.sql')):
        m=re.fullmatch(r'(\d{14})_(.+)\.sql',path.name)
        if not m:
            unsafe.append(f'non-canonical executable migration filename: {path.name}')
            continue
        version,name=m.groups(); row=expected.get(version)
        if not row:
            unsafe.append(f'executable migration not recorded in Production manifest: {path.name}')
            continue
        if name!=row['name']:
            unsafe.append(f'name mismatch for {version}: local={name} production={row["name"]}')
            continue
        present.add(version)
        expected_sem=row.get('semantic_md5')
        if expected_sem:
            got=semantic(path.read_text())
            if got!=expected_sem:
                unsafe.append(f'semantic SQL mismatch for {path.name}: {got} != {expected_sem}')
    missing=[f'{v}_{expected[v]["name"]}.sql' for v in expected if v not in present]
    print(f'Production tail entries: {len(expected)}')
    print(f'Executable matching files: {len(present)}')
    print(f'Missing Production-applied files: {len(missing)}')
    for x in missing: print(f'  MISSING {x}')
    for x in unsafe: print(f'  UNSAFE {x}')
    if unsafe:
        print('Migration parity guard: FAIL (unsafe executable drift)')
        return 1
    if args.strict and missing:
        print('Migration parity guard: FAIL (strict parity incomplete)')
        return 2
    print('Migration parity guard: PASS (Stage A; no unsafe executable drift)')
    return 0

if __name__=='__main__': sys.exit(main())
