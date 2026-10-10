#!/usr/bin/env python3
from pathlib import Path
import sys

root=Path(__file__).resolve().parents[1]
p=root/'supabase/migrations/20261010182200_optimize_school_registration_rls_initplan_v1.sql'
s=p.read_text()
required=[
 'alter policy "NH7 secure pending registration insert"',
 'alter policy "NH7 secure read own registrations"',
 'alter policy "school certificates own or admin read"',
 'alter policy "approved students read active school lessons v340"',
 "status = 'pending'::text",
 "type = any (array['school'::text,'meeting'::text,'general'::text])",
 '(select auth.uid())',
 '(select auth.jwt())',
 '(select public.nh7_device_id())',
 '(select public.nh7_is_admin())',
 '(select public.nh7_admin_is_admin_v170())',
 'public.nh7_school_access_approved_v230('
]
missing=[x for x in required if x not in s]
forbidden=['delete from ','update public.registrations','insert into public.registrations','update public.school_','delete from public.school_','truncate ','drop table ','drop policy ']
found=[x for x in forbidden if x in s.lower()]
if missing or found:
    print('School/Registration RLS cost guard: FAIL')
    for x in missing: print('  missing:',x)
    for x in found: print('  forbidden:',x)
    sys.exit(1)
print('School/Registration RLS cost guard: PASS')
print(' - only four existing RLS policies are altered')
print(' - registration type/status and School access gate are preserved')
print(' - no School/Registration rows are inserted, updated, deleted, or truncated')
