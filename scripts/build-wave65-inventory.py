import re,json,subprocess,sys,tempfile
from pathlib import Path
BASE='fd7191653d45fc53791b867feb54181e2b90bf77'
root=Path(sys.argv[1]) if len(sys.argv)>1 else Path(tempfile.mkdtemp(prefix='nh7-wave65-inventory-'))
root.mkdir(parents=True,exist_ok=True)
names=subprocess.check_output(['git','ls-tree','-r','--name-only',BASE]).decode().splitlines()
def source(p):return subprocess.check_output(['git','show',BASE+':'+p]).decode()
files=[p for p in names if p.endswith('.sql')];rows=[];rls={};refs=[]
for path in files:
 s=source(path)
 for m in re.finditer(r'create\s+(?:or\s+replace\s+)?function\s+([\w.\"]+)\s*\(',s,re.I):
  end=s.find('$$;',m.end());end=end+3 if end>=0 else s.find(';',m.end())+1
  chunk=s[m.start():end]
  if not re.search(r'security\s+definer',chunk,re.I):continue
  header=chunk[:chunk.lower().find('returns')].strip();name=m[1].replace('"','');short=name.split('.')[-1]
  kind='authenticated user endpoint'
  if re.search(r'returns\s+trigger',chunk,re.I):kind='trigger-only function'
  elif name.startswith('private.') or re.search(r'payload_error|authorize|is_admin|is_owner|has_permission|validate|assert_',short):kind='internal helper'
  elif re.search(r'admin|owner|cleanup|purge|delete_registration',short):kind='Admin endpoint'
  elif re.search(r'backfill|repair|recover_.*orphan|migrat|sync_duplicate',short):kind='migration/maintenance-only function'
  elif re.search(r'public|verify|registration_status|submit_registration|recover',short):kind='intentional anonymous public endpoint'
  grants=re.findall(r'(?:grant|revoke)\s+[\s\S]*?\bon\s+function\s+'+re.escape(name)+r'\s*\([^;]*;',s,re.I)
  grants=[g[g.lower().rfind('grant '):] if 'grant ' in g.lower() else g[g.lower().rfind('revoke '):] for g in grants]
  rows.append({'name':name,'signature_source':header,'source':path,'classification':kind,'source_grants':grants,'search_path_pinned':bool(re.search(r'set\s+search_path',chunk,re.I)),'live_roles':{'anon':'UNVERIFIED','authenticated':'UNVERIFIED','service_role':'UNVERIFIED'},'disposition':'retain until live signature/body/ACL and caller inventory approved' if kind in ['authenticated user endpoint','intentional anonymous public endpoint'] else 'review least-privilege revocation; keep server checks; no automatic live change'})
 for m in re.finditer(r'alter\s+table\s+(?:if\s+exists\s+)?([\w.\"]+)\s+enable\s+row\s+level\s+security',s,re.I):
  name=m[1].replace('"','');rls.setdefault(name,[]).append(path)
 for m in re.finditer(r'create\s+policy\s+[\s\S]*?\bon\s+([\w.\"]+)',s,re.I):refs.append(m[1].replace('"',''))
(root/'function-matrix.json').write_text(json.dumps({'scope':'repository source declarations, not live catalog; historical/review duplicates retained','sql_files':len(files),'definitions':rows},indent=2)+'\n')
(root/'rls-matrix.json').write_text(json.dumps({'scope':'source candidates only; live no-policy census in preflight.sql','tables':[{'table':name,'sources':paths,'source_policy_seen':name in refs or 'public.'+name in refs,'disposition':'SAFE BY DESIGN / KEEP: private internal deny-all' if name.startswith('private.') else 'REVIEW-ONLY BACKEND CHANGE: verify live policies and ownership before any grant'} for name,paths in sorted(rls.items())]},indent=2)+'\n')
# Explicit identity domain inventory: referenced-only tables remain preflight-blocked, never assumed deployed.
groups={
'registrations':['registrations'],
'notes-verses-progress':['user_notes','saved_verses','user_progress','nh7_account_notes','nh7_account_progress','nh7_account_saved_verses','nh7_account_verse_marks_v230','bible_user_actions','bible_user_rewards','bible_user_notes','bible_user_highlights','bible_user_bookmarks','user_bible_activity','user_reading_progress','user_points_ledger'],
'school':['church_members','school_student_identities','school_progress','school_legacy_progress_v542','school_audio_progress','school_assignments','school_exam_attempts','school_video_progress','nh7_school_video_grants_v260','school_course_access_grants'],
'plans':['spiritual_plan_progress','fasting_journeys','fasting_daily_logs'],
'library':['nh7_library_reading_progress_v490','nh7_library_grants','nh7_library_access_grants','nh7_library_minister_grants','nh7_library_user_access','nh7_library_code_claims'],
'community':['nh7_prayer_requests_v502','nh7_testimonies_v502'],
'sermon-social':['sermon_likes','sermon_blessings','nh7_sermon_likes','nh7_sermon_blessings'],
'inbox':['notification_inbox','notification_inbox_receipts'],
'questions':['qa_questions'],
'profile':['nh7_user_profiles_v502','nh7_user_profiles','profiles'],
'notifications-review':['private.nh7_notification_preferences_wave4','private.nh7_notification_subscriptions_wave4'],
'documents-review':['nh7_document_drafts_v2','nh7_document_deliveries_v2'],
}
# Add identity-linked tables referenced in current JS/SQL (name discovery with provenance, never silent exclusion).
alltexts={p:source(p) for p in names if p.endswith(('.js','.mjs','.sql'))}
known={t for ts in groups.values() for t in ts}
for p,s in alltexts.items():
 for m in re.finditer(r'\.from\([\'\"]([\w]+)[\'\"]\)',s):
  table=m[1];context=s[m.start():m.start()+1100]
  if table not in known and re.search(r'\b(user_id|user_email|author_email|owner_id|target_email|device_id)\b',context) and not re.search(r'(items|catalog|courses|lessons|chapters|books|sermons|categories|settings|templates|schedule)$',table):groups.setdefault('referenced-needs-preflight',[]).append(table);known.add(table)
retained=['nh7_apocrypha_books_v270','nh7_school_videos_v260','nh7_school_video_codes_v260','school_certificates','nh7_official_documents_v2','nh7_document_design_templates_v2','private.nh7_document_library_versions_v2','private.nh7_admin_audit_log_v350','private.nh7_admin_members_v350','private.nh7_admin_permission_grants_v350']
rows=[]
for domain,tables in groups.items():
 for table in sorted(set(tables)):
  if table in retained:continue
  short=table.split('.')[-1];sources=[p for p,s in alltexts.items() if re.search(r'\b'+re.escape(short)+r'\b',s)]
  rows.append({'table':table if '.' in table else 'public.'+table,'domain':domain,'status':'purge-owner; exact deployed columns and recursive identity census REQUIRED before activation','uid_keys':['user_id','owner_id','author_id','recipient_user_id','auth_user_id'],'email_keys':['user_email','author_email','target_email','email','recipient_email','email_normalized'],'json_keys':['payload'],'device_keys':['device_id'],'sources':sources,'device_only':'quarantine unless independently proven exclusive ownership; never delete by device alone'})
for table in retained:rows.append({'table':table if '.' in table else 'public.'+table,'domain':'retention-policy-exception','status':'BLOCKED: owner-approved retention/redaction/revocation/offboarding policy required; never claim verified full purge while active PII remains','uid_keys':['user_id','recipient_user_id','created_by','actor_user_id','target_user_id'],'email_keys':['recipient_email','email'],'json_keys':['details','definition','snapshot'],'device_keys':[],'sources':[p for p,s in alltexts.items() if table.split('.')[-1] in s]})
(root/'identity-coverage.json').write_text(json.dumps({'scope':'superset discovery; referenced-only/absent tables and column keys must be resolved by preflight; table presence never assumed','rows':rows,'systems':[{'system':'Auth users/identities/sessions/refresh tokens','strategy':'supported Auth Admin deleteUser; cascades verified, never raw Auth SQL'},{'system':'Storage owned objects','strategy':'supported Storage remove API before app DB/Auth; verified owner UID only, zero-object supported'},{'system':'legacy device-only / immutable issued history / admin membership logs','strategy':'explicit safe exception; quarantine pending exclusive proof or approved retention policy; full deletion reports blocked, never false success'}]},indent=2)+'\n')
print(len(rows),'identity table candidates;',len(rows)-len(retained),'purge;',len(retained),'policy exceptions;',len(rows and rls),'source RLS tables;',len(json.loads((root/'function-matrix.json').read_text())['definitions']),'definer declarations')

if len(sys.argv)==1:
 for file in ['function-matrix.json','rls-matrix.json','identity-coverage.json']:
  assert (root/file).read_bytes()==(Path('supabase/review/wave6_5-security-registration')/file).read_bytes(),'Inventory drift: '+file
 print('PASS exact reproducible Wave65 baseline inventory')
