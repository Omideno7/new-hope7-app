#!/usr/bin/env python3
from pathlib import Path


def write(path,text,label):
    p=Path(path)
    old=p.read_text()
    if old==text:
        print(f'{label}: already clean')
        return False
    p.write_text(text)
    print(f'{label}: updated')
    return True


def ensure_replace(path,old,new,label,expected=1):
    p=Path(path); text=p.read_text()
    if new in text:
        print(f'{label}: already applied'); return False
    count=text.count(old)
    if count!=expected:
        raise SystemExit(f'{label}: expected {expected} old match(es), found {count}')
    p.write_text(text.replace(old,new,expected))
    print(f'{label}: applied'); return True

# Normalize loader to exactly one Student Identity script, even after retried Actions.
p=Path('index.html'); text=p.read_text();
school='  <script src="js/nh7-school-path-v351.js?v=4.6.7-io" defer></script>'
student='  <script src="js/nh7-student-identity-v127.js?v=1.27.0" defer></script>'
lines=[line for line in text.splitlines() if line.strip()!=student.strip()]
try: idx=lines.index(school)
except ValueError: raise SystemExit('index Student Identity runtime: School anchor missing')
lines.insert(idx+1,student)
write('index.html','\n'.join(lines)+'\n','index Student Identity runtime')

# Normalize release asset to exactly one occurrence.
p=Path('sw-release-core-v403.js'); text=p.read_text(); token="'./js/nh7-student-identity-v127.js'"
text=text.replace(token+',','').replace(token,'')
anchor="'./js/nh7-school-path-v351.js',"
if text.count(anchor)!=1: raise SystemExit(f'release cache anchor count={text.count(anchor)}')
text=text.replace(anchor,anchor+"\n  './js/nh7-student-identity-v127.js',",1)
write('sw-release-core-v403.js',text,'release cache Student Identity asset')

# Admin Academic Center: patches become no-ops after first successful application.
ensure_replace('js/nh7-admin-student-academic-v540.js',
    "lower([r.display_name,r.email,r.phone].join(' ')).includes(q)",
    "lower([r.display_name,r.email,r.phone,r.student_code].join(' ')).includes(q)",
    'Admin search Student Code')
ensure_replace('js/nh7-admin-student-academic-v540.js',
    "nh7_admin_student_academic_center_v542',{p_inactive_days:requestDays}",
    "nh7_admin_student_academic_center_v543',{p_inactive_days:requestDays}",
    'Admin batch identity RPC')
old_cell="'<td><strong>'+E(r.display_name||r.email)+'</strong><br><small>'+E(r.email||'—')+'</small></td>'+"
new_cell="'<td><strong>'+E(r.display_name||r.email)+'</strong><br><small>'+E(r.email||'—')+'</small>'+(r.student_code?'<br><small><b>'+E(r.student_code)+'</b></small>':'')+'</td>'+"
if new_cell not in Path('js/nh7-admin-student-academic-v540.js').read_text():
    ensure_replace('js/nh7-admin-student-academic-v540.js',old_cell,new_cell,'Admin table Student Code',expected=2)
else: print('Admin table Student Code: already applied')
ensure_replace('js/nh7-admin-student-academic-v540.js',
    "L('جستجوی نام یا ایمیل…','Search name or email…','Pretraži ime ili e-mail…')",
    "L('جستجوی نام، ایمیل یا کد دانشجویی…','Search name, email or Student ID…','Pretraži ime, e-mail ili studentski ID…')",
    'Admin search placeholder')
ensure_replace('js/nh7-admin-student-academic-v540.js',
    "const header=['display_name','email','app_account_exists'",
    "const header=['display_name','email','student_code','app_account_exists'",
    'Admin CSV Student Code header')
ensure_replace('js/nh7-admin-student-academic-v540.js',
    "r.display_name,r.email,r.app_account_exists?'yes':'no'",
    "r.display_name,r.email,r.student_code||'',r.app_account_exists?'yes':'no'",
    'Admin CSV Student Code value')

# Individual report identity integration.
ensure_replace('js/nh7-admin-student-report-v496.js',
    "adminRpc('nh7_admin_student_profile_v451',{p_email:email},15000)",
    "adminRpc('nh7_admin_student_profile_v452',{p_email:email},15000)",
    'Individual report identity RPC')
ensure_replace('js/nh7-admin-student-report-v496.js',
    "const school=profile?.school||{},activity=profile?.activity||{},reg=school.registration||{};",
    "const school=profile?.school||{},activity=profile?.activity||{},identity=profile?.student_identity||{},reg=school.registration||{};",
    'Individual report identity model')
ensure_replace('js/nh7-admin-student-report-v496.js',
    "<p>${E(email)} · ${E(L('زمان دریافت داده','Data loaded','Podaci učitani',l))}",
    "<p>${identity.student_code?E(identity.student_code)+' · ':''}${E(email)} · ${E(L('زمان دریافت داده','Data loaded','Podaci učitani',l))}",
    'Individual report Student ID header')

print('Issue #127 Student Identity UI integration patch complete and idempotent')
