#!/usr/bin/env python3
import argparse, hashlib, json, re, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MANIFEST=ROOT/'supabase/review/migration-history-reconciliation-20261009/production-tail.json'
MIGRATIONS=ROOT/'supabase/migrations'

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--strict', action='store_true', help='fail if any newer pending migration exists beyond the captured Production checkpoint')
    args=ap.parse_args()
    data=json.loads(MANIFEST.read_text())
    expected={m['version']:m for m in data['migrations']}
    checkpoint=max(expected)
    unsafe=[]; present=set(); pending=[]; exact=0

    for path in sorted(MIGRATIONS.glob('202610*.sql')):
        m=re.fullmatch(r'(\d{14})_(.+)\.sql',path.name)
        if not m:
            unsafe.append(f'non-canonical executable migration filename: {path.name}')
            continue
        version,name=m.groups()
        row=expected.get(version)
        if row:
            if name!=row['name']:
                unsafe.append(f'name mismatch for {version}: local={name} production={row["name"]}')
                continue
            present.add(version)
            got=hashlib.md5(path.read_bytes()).hexdigest()
            if got!=row['sql_md5']:
                unsafe.append(f'raw SQL hash mismatch for {path.name}: {got} != {row["sql_md5"]}')
                continue
            exact+=1
            continue
        if version<=checkpoint:
            unsafe.append(f'unrecorded historical executable migration at/before checkpoint: {path.name}')
        else:
            pending.append(path.name)

    missing=[f'{v}_{expected[v]["name"]}.sql' for v in expected if v not in present]
    print(f'Production checkpoint entries: {len(expected)}')
    print(f'Exact raw-hash matches: {exact}')
    print(f'Missing checkpoint files: {len(missing)}')
    print(f'Newer pending migrations: {len(pending)}')
    for x in missing: print(f'  MISSING {x}')
    for x in pending: print(f'  PENDING {x}')
    for x in unsafe: print(f'  UNSAFE {x}')

    if unsafe or missing or exact!=len(expected):
        print('Migration parity guard: FAIL (Production checkpoint drift)')
        return 1
    if args.strict and pending:
        print('Migration parity guard: FAIL (strict mode forbids pending migrations)')
        return 2
    print('Migration parity guard: PASS (Production checkpoint exact)')
    return 0

if __name__=='__main__': sys.exit(main())
