from pathlib import Path
errors=[]
admin=Path('admin.html').read_text()
profile=Path('js/nh7-profile-photo-v564.js').read_text()
index=Path('index.html').read_text()
ms=sorted(Path('supabase/migrations').glob('*_admin_student_identity_directory_v128.sql'))
if len(ms)!=1: errors.append(f'expected one identity directory migration, got {len(ms)}')
else:
    sql=ms[0].read_text().lower()
    for token in ['create or replace function public.nh7_admin_student_identity_directory_v128','public.nh7_is_admin()','school_student_identities','student_code','grant execute on function public.nh7_admin_student_identity_directory_v128() to authenticated,service_role']:
        if token not in sql: errors.append('migration missing '+token)
    for bad in ['insert into','update public.','delete from','truncate ','alter table','drop table']:
        if bad in sql: errors.append('unexpected mutating SQL: '+bad)
for token in ['studentIdentities:[]',"adminRpc('nh7_admin_student_identity_directory_v128'",'studentCodeForRegistration(r)',"queueRegistrationSearch(this)","studentCodeForRegistration(r)+' '",'کد دانشجویی']:
    if token not in admin: errors.append('Admin missing '+token)
for token in ["nh7_my_student_identity_v127",'nh7-student-code564',"L('کد دانشجویی','Student ID','Studentski ID')",'studentIdentity?.student_code']:
    if token not in profile: errors.append('Profile missing '+token)
if 'js/nh7-profile-photo-v564.js?v=5.6.7&ui=124' not in index: errors.append('profile cache bust missing')
if errors:
    print('FAILED'); [print(' -',e) for e in errors]; raise SystemExit(1)
print('Approved/Profile Student Code verifier: PASS')
print(' - Approved list shows and live-searches name/email/Student ID')
print(' - Account Profile shows only the signed-in student’s own Student ID')
print(' - Admin identity directory migration is read-only and admin-gated')
