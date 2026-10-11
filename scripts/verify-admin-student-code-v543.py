#!/usr/bin/env python3
from pathlib import Path
import hashlib, json, re, sys
errors=[]
root=Path(__file__).resolve().parents[1]
mig=root/'supabase/migrations/20261011082912_admin_student_code_payload_v543.sql'
sql=mig.read_text()
if len(sql)!=1538 or hashlib.md5(sql.encode()).hexdigest()!='a1b41dbaa50d7b50ca65446a3261e6d4': errors.append('Production migration hash/length mismatch')
for token in ['create or replace function public.nh7_admin_student_academic_center_v543','public.nh7_admin_student_academic_center_v542','public.nh7_is_admin()','student_code','revoke all on function public.nh7_admin_student_academic_center_v543','grant execute on function public.nh7_admin_student_academic_center_v543(integer) to authenticated,service_role']:
    if token not in sql: errors.append('missing migration invariant: '+token)
if re.search(r'(?im)^\s*(insert|update|delete|truncate|drop\s+table|alter\s+table)\b',sql): errors.append('unexpected student-data/schema DML in wrapper migration')
js=(root/'js/nh7-admin-student-academic-v540.js').read_text()
if "const VERSION='5.4.9-student-code-payload';" not in js: errors.append('Admin JS version not bumped')
if "adminRpc('nh7_admin_student_academic_center_v543'" not in js: errors.append('Admin still not wired to v543')
if "adminRpc('nh7_admin_student_academic_center_v542'" in js: errors.append('Direct v542 Academic Center call still active')
admin=(root/'admin.html').read_text()
if 'js/nh7-admin-student-academic-v540.js?v=5.4.9' not in admin: errors.append('Admin cache-bust version missing')
cp=json.loads((root/'supabase/review/migration-history-reconciliation-20261009/production-tail.json').read_text())
row=[x for x in cp['migrations'] if x['version']=='20261011082912']
if len(row)!=1 or row[0].get('sql_md5')!='a1b41dbaa50d7b50ca65446a3261e6d4': errors.append('Production checkpoint missing exact v543 migration')
if errors:
    print('Admin Student Code v543 verifier: FAIL')
    for e in errors: print(' -',e)
    sys.exit(1)
print('Admin Student Code v543 verifier: PASS')
print(' - Production wrapper is read-only and admin-gated')
print(' - Admin Academic Center consumes v543 Student Code payload')
print(' - cache-bust bumped to 5.4.9')
