"""Explicit Wave6 UI delta plus exact persistence/authority/engine/backend protections."""
from pathlib import Path
import subprocess,re,json,hashlib
import sys
sys.dont_write_bytecode=True
from wave75_accepted_source import manifest as wave75_manifest
from wave6_accepted_source import BASE,original,manifest,accepted_bytes
from wave65_accepted_source import prior_bytes,manifest as security_manifest
from wave7_accepted_source import manifest as platform_manifest
subprocess.run(['python3','scripts/verify-wave65-safety.py'],check=True)
m=manifest();assert m['base']==BASE
allowed=set(m['existing_ui_files'])
for scope in ['js','css','assets','data','public','supabase']:
 for p in subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--',scope]).decode().splitlines():
  if p in allowed:accepted_bytes(p)
  else:assert prior_bytes(p)==original(p),'Unapproved engine/data/backend change: '+p
runtime=set(subprocess.check_output(['git','ls-files','--','js','css','assets','data','public','supabase']).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard','--','js','css','assets','data','public','supabase']).decode().splitlines())
baseline=set(subprocess.check_output(['git','ls-tree','-r','--name-only',BASE,'--','js','css','assets','data','public','supabase']).decode().splitlines())
assert runtime-baseline==set(m['new_ui_files'])|set(security_manifest()['new_runtime'])|set(platform_manifest()['new_runtime'])|set(wave75_manifest()['new_runtime'])|set(wave75_manifest()['new_review'])|set(json.loads(Path('scripts/fixtures/wave66-approved-review.json').read_text())['new_review']),'Unapproved new runtime/backend/data source'
for p,row in m['existing_ui_files'].items():accepted_bytes(p)
for p,sha in m['new_ui_files'].items():assert hashlib.sha256(prior_bytes(p)).hexdigest()==sha,'New UI changed outside recorded patch: '+p
patch=Path('scripts/fixtures/wave6-approved-ui.patch').read_bytes();assert hashlib.sha256(patch).hexdigest()==m['patch_sha256']
# Reverse-check the explicit review patch without altering the checkout/index.
import tempfile
with tempfile.TemporaryDirectory(prefix='nh7-wave6-check-') as directory:
 for p in list(m['existing_ui_files'])+list(m['new_ui_files']):
  target=Path(directory)/p;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(prior_bytes(p))
 subprocess.run(['git','apply','--reverse','--check',str(Path('scripts/fixtures/wave6-approved-ui.patch').resolve())],cwd=directory,check=True)
# All top-level persistence and authority functions stay byte-identical. Only enumerated UI/read functions differ.
def functions(text):
 hits=list(re.finditer(r'^(?:export )?(?:async )?function ([\w$]+)\(',text,re.M))
 return {h[1]:text[h.start():hits[i+1].start() if i+1<len(hits) else len(text)] for i,h in enumerate(hits)}
# Compare exact named business sections up to their following declaration, with trailing wiring excluded.
protected={
 'js/app.js':['fetchLatestRegistration','submitSchoolAssignment','submitSchoolCourseExam','submitSchoolExam','saveNoteCloud','saveProgressCloud','loadSchoolContent','assignmentStatusText','nh7ApprovedSchoolAccessV223','getSchoolSnapshot','registrationFormHtml','signInSchool','logoutAccount'],
 'js/nh7-spiritual-plans-v240.js':['saveProgress','saveFasting','ensurePlanStarted','updateDay','syncSpiritualPlansV240','mergeProgressDay','queueProgressRows'],
 'js/nh7-spiritual-plans-v412.js':['cloudFetch','saveCloud','syncCloudQueue','userId'],
 'js/nh7-student-identity-v127.js':['saveStudentPhoto','uploadPhoto'],
 'js/nh7-my-notes-v234.js':['syncVerseState','deleteCloudNote','restoreCloudNotes','saveMeta','deleteMeta']}
checked=0
for p,names in protected.items():
 a,b=functions(original(p).decode()),functions(Path(p).read_text())
 for name in names:
  if name not in a:continue
  assert a[name]==b[name],'Persistent/business contract changed: '+p+':'+name;checked+=1
# Core legacy files remain exact, including audio, notification contracts, School engines and Studio outputs.
for p in ['js/nh7-local-first-wave2.js','js/nh7-performance-wave1.js','js/nh7-media-player-v500.js','js/nh7-audio-classic-v484.js','js/nh7-notification-intents-wave4.js','js/nh7-notification-contract-wave4.js','js/nh7-push-account-bind-v364.js','js/nh7-admin-report-print-v117.js','js/document-studio-v2/model.mjs','js/document-studio-v2/renderer.mjs','js/document-studio-v2/output.mjs','js/document-studio-v2/api.mjs']:
 assert prior_bytes(p)==original(p),p
for p in ['js/nh7-user-context-wave6.js','js/nh7-global-search-direct-v562.js']:
 s=Path(p).read_text();assert 'setInterval(' not in s and 'localStorage.clear(' not in s and 'SERVICE_ROLE' not in s
context=Path('js/nh7-user-context-wave6.js').read_text();assert "if(uid)return !!i.uid&&uid===i.uid" in context and 'nh7_profile_photo_v561' not in context
notes=Path('js/nh7-note-text-v501.js').read_text();assert 'function repairKnownNotes(){return 0}' in notes and '.setItem(' not in notes
search=Path('js/nh7-global-search-direct-v562.js').read_text();assert 'items.length<24' in search and '.isConnected' in search and 'NH7LibrarySecurityV125?.searchItems' in search
core=Path('sw-release-core-v403.js').read_text();assert "NH7_RELEASE_DATA_CACHE='nh7-data-stable-v329'" in core
html=Path('index.html').read_text();assert html.index('js/nh7-user-context-wave6.js')<html.index('js/nh7-profile-photo-v564.js')
assert 'start:1' not in Path('js/nh7-my-notes-v234.js').read_text()
from html.parser import HTMLParser
class Entry(HTMLParser):
 def handle_starttag(self,tag,attrs):
  a=dict(attrs);p=a.get('src') if tag=='script' else a.get('href') if tag=='link' and a.get('rel')=='stylesheet' else None
  if p and not p.startswith(('https:','http:','data:')):assert Path(p.split('?')[0]).is_file(),p
for p in ['index.html','document-verify.html','my-documents.html']:parser=Entry();parser.feed(Path(p).read_text());parser.close()
print('PASS Wave6 explicit reversible UI patch; '+str(checked)+' exact business/persistence sections; all other engines/data/authority/backend/migrations preserved; no polling/cache blanket clear, dependency order, typed UID photos, no automatic Notes writes')
