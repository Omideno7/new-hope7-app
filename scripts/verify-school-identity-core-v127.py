#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
files = sorted((ROOT / "supabase" / "migrations").glob("*_school_student_identity_core_v127.sql"))

if len(files) != 1:
    raise SystemExit(f"Expected exactly one Student Identity Core migration, found {len(files)}")

path = files[0]
text = path.read_text(encoding="utf-8")
low = text.lower()
errors = []

if not re.fullmatch(r"\d{14}_school_student_identity_core_v127\.sql", path.name):
    errors.append(f"non-canonical migration filename: {path.name}")

required = [
    "create sequence public.school_student_code_seq",
    "create table public.school_student_identities",
    "alter table public.school_student_identities enable row level security",
    "private.nh7_student_identity_guard_v127",
    "private.nh7_sync_student_identity_v127",
    "public.nh7_my_student_identity_v127",
    "public.nh7_admin_student_identity_search_v127",
    "student_code_is_immutable",
    "revoke all on table public.school_student_identities from public, anon, authenticated",
    "grant execute on function public.nh7_my_student_identity_v127() to authenticated",
    "grant execute on function public.nh7_admin_student_identity_search_v127(text,integer) to authenticated",
    "notify pgrst, 'reload schema'",
]
for token in required:
    if token not in low:
        errors.append(f"missing required invariant: {token}")

forbidden = [
    "delete from public.school_progress",
    "delete from public.school_assignments",
    "delete from public.school_exam_attempts",
    "delete from public.school_certificates",
    "update public.school_progress",
    "update public.school_assignments",
    "update public.school_exam_attempts",
    "update public.school_certificates",
    "alter table public.school_progress",
    "alter table public.school_assignments",
    "alter table public.school_exam_attempts",
    "alter table public.school_certificates",
    "truncate ",
    "drop table ",
    "storage.objects",
    "storage.buckets",
    "nh7_public_certificate",
]
for token in forbidden:
    if token in low:
        errors.append(f"out-of-scope/destructive SQL found: {token}")

# Every SECURITY DEFINER function in this migration must use an empty search_path.
definer_count = low.count("security definer")
pinned_count = low.count("security definer\nset search_path=''")
if definer_count != 4:
    errors.append(f"expected 4 SECURITY DEFINER functions, found {definer_count}")
if pinned_count != definer_count:
    errors.append(f"not every SECURITY DEFINER has pinned empty search_path: {pinned_count}/{definer_count}")

# Student Code allocation starts at the agreed public identifier range and is not a credential.
if "start with 1001" not in low or "^nh7-[0-9]{4,}$" not in low:
    errors.append("Student Code allocator/format invariant missing")

# Core migration must not grant direct table access to app roles.
if re.search(r"grant\s+.+\s+on\s+(?:table\s+)?public\.school_student_identities\s+to\s+(?:anon|authenticated)", low):
    errors.append("direct Student Identity table grant to app role detected")

# Backfill must be limited to approved School registrations and Auth-matched users.
for token in ["r.type='school'", "r.status='approved'", "join auth.users u"]:
    if token not in low:
        errors.append(f"backfill scope invariant missing: {token}")

if errors:
    print("Student Identity Core v127 verifier: FAIL")
    for item in errors:
        print(f"  - {item}")
    sys.exit(1)

print(f"Student Identity Core v127 verifier: PASS ({path.name})")
print("Scope: identity core only; legacy School activity tables and Storage untouched")
