#!/usr/bin/env python3
"""Record public build provenance; never deploy or change the exported payload."""
import argparse,datetime,hashlib,json,subprocess,re
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--payload',type=Path,required=True);p.add_argument('--platform',choices=['web','ios','android'],required=True);p.add_argument('--version',required=True);p.add_argument('--build',required=True);p.add_argument('--sha',required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--production',action='store_true');a=p.parse_args()
def git(*args):return subprocess.check_output(['git',*args],text=True).strip()
sha=git('rev-parse',a.sha+'^{commit}')
if a.production and sha!=git('rev-parse','origin/main^{commit}'):p.error('Production shared payload must use the exact fetched origin/main SHA; this does not substitute for release approval.')
if not a.payload.is_dir():p.error('Payload directory not found')
# Read only actual exported application bytes. Output lives outside payload to avoid self-hashing.
if a.output.resolve().is_relative_to(a.payload.resolve()):p.error('Metadata output must be outside payload; attach it after recording.')
files={str(f.relative_to(a.payload)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(a.payload.rglob('*')) if f.is_file() and not f.is_symlink()}
if not files:p.error('Empty payload')
mandatory=['index.html','js/app.js','version.json','service-worker.js']
if any(f not in files for f in mandatory):p.error('Shared application payload is incomplete')
tracked={}
for row in subprocess.check_output(['git','ls-tree','-rz',sha]).split(b'\0'):
 if row:
  meta,name=row.split(b'\t',1);tracked[name.decode()]=meta.decode().split()[-1]
verified=[];native=[]
for name,digest in files.items():
 if name in ['capacitor.config.json','capacitor.js','cordova.js','cordova_plugins.js'] or name.startswith('plugins/'):
  native.append(name);continue
 runtime=name.startswith(('js/','css/','assets/','data/','app/','public/')) or name in mandatory or name.startswith('sw-') or name=='manifest.json'
 if not runtime:continue
 if name not in tracked:p.error('Untracked shared runtime file: '+name)
 blob=subprocess.check_output(['git','cat-file','blob',tracked[name]])
 if hashlib.sha256(blob).hexdigest()!=digest:p.error('Shared payload differs from exact Git SHA: '+name)
 verified.append(name)
index=(a.payload/'index.html').read_text()
for ref in re.findall(r'(?:src|href)=[\'"]([^\'"]+)[\'"]',index):
 name=ref.split('?',1)[0].split('#',1)[0].removeprefix('./')
 if name.startswith(('js/','css/')) and name not in files:p.error('Missing active shared dependency: '+name)

obj={'schema_version':1,'git_sha':sha,'platform':a.platform,'app_version':a.version,'build_number':a.build,'build_timestamp_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_mode':'approved-main-required' if a.production else 'qa-only','payload_file_sha256':files,'verified_shared_files':verified,'generated_native_files':native}
a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(obj,indent=2)+'\n');print('Recorded',a.platform,'SHA',sha,'files',len(files),'to',a.output)
