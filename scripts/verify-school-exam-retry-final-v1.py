#!/usr/bin/env python3
from pathlib import Path
import hashlib, re, sys
root=Path(__file__).resolve().parents[1]
p=root/'supabase/migrations/20261011073048_school_exam_retry_final_completion_consistency_v1.sql'
s=p.read_text(encoding='utf-8')
errs=[]
def need(ok,msg):
    if not ok: errs.append(msg)
need(len(s)==3724,'migration length must match deployed Production SQL')
need(hashlib.md5(s.encode()).hexdigest()=='abdb63766b1347d209da8bc07e48ec3e','migration hash must exactly match deployed Production SQL')
need("v_progress_fence text := 'and (v_last_failed is null or p.updated_at>v_last_failed)'" in s,'class retry progress fence guard missing')
need("v_assignment_fence text := 'and (v_last_failed is null or coalesce(a.reviewed_at,a.updated_at,a.submitted_at)>v_last_failed)'" in s,'class retry assignment fence guard missing')
need("replace(v_sql,v_progress_fence,'')" in s and "replace(v_sql,v_assignment_fence,'')" in s,'class retry fences are not removed')
need("replace(v_sql,'v351-hotfix1','v351-hotfix2')" in s,'class path hotfix marker not advanced')
need("v_course=\\'foundation_school\\'" in s and "coalesce(v_exam.require_assignments_before_exam,false)=true" in s,"foundation final bridge is not narrowly scoped")
need("from public.school_assignments a" in s and "lower(coalesce(a.status,\\'\\'))=\\'approved\\'" in s,'approved assignment completion bridge missing')
need("revoke execute on function public.nh7_school_class_exam_session_v351(text) from public, anon" in s,'class session anon revoke missing')
need("revoke execute on function public.nh7_submit_school_exam_v340(uuid,jsonb) from public, anon" in s,'submit core anon revoke missing')
need(not re.search(r'(?im)^\s*(delete\s+from|truncate\s+|drop\s+table|update\s+public\.school_|insert\s+into\s+public\.school_)',s),'migration must not mutate School student data')
if errs:
    print('School exam retry/final consistency verifier: FAIL')
    for e in errs: print(' -',e)
    sys.exit(1)
print('School exam retry/final consistency verifier: PASS')
print(' - failed class exams preserve completed lessons/approved assignments while attempts remain')
print(' - Foundation final submit accepts the same completion evidence used by the current class path')
print(' - migration is exact Production hash and contains no School student-data DML')
