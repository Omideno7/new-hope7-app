#!/usr/bin/env python3
from pathlib import Path


def replace_exact(path, old, new, label, expected=1):
    p=Path(path); text=p.read_text()
    if new in text and old not in text:
        print(f'{label}: already applied'); return False
    count=text.count(old)
    if count!=expected:
        raise SystemExit(f'{label}: expected {expected} match(es), found {count}')
    p.write_text(text.replace(old,new,expected))
    print(f'{label}: applied ({expected})'); return True

# App runtime: load the additive identity module immediately after the active School path.
replace_exact(
    'index.html',
    '<script src="js/nh7-school-path-v351.js?v=4.6.7-io" defer></script>',
    '<script src="js/nh7-school-path-v351.js?v=4.6.7-io" defer></script>\n  <script src="js/nh7-student-identity-v127.js?v=1.27.0" defer></script>',
    'index Student Identity runtime'
)

# Offline release cache: preserve current School path and add the new additive runtime.
replace_exact(
    'sw-release-core-v403.js',
    "'./js/nh7-school-path-v351.js',",
    "'./js/nh7-school-path-v351.js',\n  './js/nh7-student-identity-v127.js',",
    'release cache Student Identity asset'
)

# Admin Academic Center uses the server-enriched v543 batch, still exactly one batch RPC.
replace_exact(
    'js/nh7-admin-student-academic-v540.js',
    "lower([r.display_name,r.email,r.phone].join(' ')).includes(q)",
    "lower([r.display_name,r.email,r.phone,r.student_code].join(' ')).includes(q)",
    'Admin search Student Code'
)
replace_exact(
    'js/nh7-admin-student-academic-v540.js',
    "nh7_admin_student_academic_center_v542',{p_inactive_days:requestDays}",
    "nh7_admin_student_academic_center_v543',{p_inactive_days:requestDays}",
    'Admin batch identity RPC'
)
# The same person/email cell is rendered in both report and member tables; show code in both.
replace_exact(
    'js/nh7-admin-student-academic-v540.js',
    "'<td><strong>'+E(r.display_name||r.email)+'</strong><br><small>'+E(r.email||'—')+'</small></td>'+",
    "'<td><strong>'+E(r.display_name||r.email)+'</strong><br><small>'+E(r.email||'—')+'</small>'+(r.student_code?'<br><small><b>'+E(r.student_code)+'</b></small>':'')+'</td>'+",
    'Admin table Student Code',
    expected=2
)
replace_exact(
    'js/nh7-admin-student-academic-v540.js',
    "L('جستجوی نام یا ایمیل…','Search name or email…','Pretraži ime ili e-mail…')",
    "L('جستجوی نام، ایمیل یا کد دانشجویی…','Search name, email or Student ID…','Pretraži ime, e-mail ili studentski ID…')",
    'Admin search placeholder'
)
replace_exact(
    'js/nh7-admin-student-academic-v540.js',
    "const header=['display_name','email','app_account_exists'",
    "const header=['display_name','email','student_code','app_account_exists'",
    'Admin CSV Student Code header'
)
replace_exact(
    'js/nh7-admin-student-academic-v540.js',
    "r.display_name,r.email,r.app_account_exists?'yes':'no'",
    "r.display_name,r.email,r.student_code||'',r.app_account_exists?'yes':'no'",
    'Admin CSV Student Code value'
)

# Individual reports use the identity-enriched profile wrapper and print the Student ID.
replace_exact(
    'js/nh7-admin-student-report-v496.js',
    "adminRpc('nh7_admin_student_profile_v451',{p_email:email},15000)",
    "adminRpc('nh7_admin_student_profile_v452',{p_email:email},15000)",
    'Individual report identity RPC'
)
replace_exact(
    'js/nh7-admin-student-report-v496.js',
    "const school=profile?.school||{},activity=profile?.activity||{},reg=school.registration||{};",
    "const school=profile?.school||{},activity=profile?.activity||{},identity=profile?.student_identity||{},reg=school.registration||{};",
    'Individual report identity model'
)
replace_exact(
    'js/nh7-admin-student-report-v496.js',
    "<p>${E(email)} · ${E(L('زمان دریافت داده','Data loaded','Podaci učitani',l))}",
    "<p>${identity.student_code?E(identity.student_code)+' · ':''}${E(email)} · ${E(L('زمان دریافت داده','Data loaded','Podaci učitani',l))}",
    'Individual report Student ID header'
)

print('Issue #127 Student Identity UI integration patch complete')
