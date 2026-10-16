"""Exact-head QA source export using existing recorder. Never native-build/sign/install/deploy."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import argparse,json,subprocess,hashlib,shutil,os,platform,tarfile,io,tempfile,re
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=True)
head=subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip();assert os.environ.get('GITHUB_SHA',head)==head
names=['node','python3','chromium','pdfinfo','pdftoppm','java','gradle','adb','emulator','xcodebuild','xcrun','swift','xcodegen','safaridriver','security']
tool_versions={}
for name,args in {'node':['--version'],'python3':['--version'],'git':['--version'],'pdfinfo':['-v'],'pdftoppm':['-v']}.items():
 if shutil.which(name):
  result=subprocess.run([name,*args],capture_output=True,text=True,check=True);tool_versions[name]=(result.stdout or result.stderr).splitlines()[0]
playwright=json.loads(subprocess.check_output(['node','-e',"console.log(JSON.stringify({version:require('playwright/package.json').version,executable:require('playwright').chromium.executablePath()}))"],text=True))
browser=os.environ.get('CHROMIUM_PATH') or (shutil.which('chromium') if platform.system()=='Linux' else None) or playwright['executable']
tool_versions['playwright']=playwright['version'];tool_versions['browser']=subprocess.check_output([browser,'--version'],text=True).strip()
tools={n:shutil.which(n) is not None for n in names};wrappers=subprocess.check_output(['git','ls-files','ios*','android*','macos*','watchos/*','*capacitor*','*Podfile*','*pbxproj*','*entitlements*','*gradle*','*package*.json'],text=True).splitlines()
wrapper_hashes={n:hashlib.sha256(Path(n).read_bytes()).hexdigest() for n in wrappers};native=[n for n in wrappers if not n.startswith('watchos/')];assert native==[],'New wrapper needs exact owner provenance review, never infer historical equivalence'
with tempfile.TemporaryDirectory(prefix='nh7-wave8-export-') as temp:
 root=Path(temp);payload=root/'payload';payload.mkdir()
 with tarfile.open(fileobj=io.BytesIO(subprocess.check_output(['git','archive',head]))) as archive:archive.extractall(payload,filter='data')
 command=['python3','scripts/record-build-metadata.py','--payload',str(payload),'--platform','web','--version','wave8-integration-qa','--build',head[:12],'--sha',head,'--output',str(a.output/'build-metadata.json')]
 subprocess.run(command,check=True,stdout=subprocess.DEVNULL)
 metadata=json.loads((a.output/'build-metadata.json').read_text());assert metadata['git_sha']==head and metadata['source_mode']=='qa-only' and metadata['generated_native_files']==[]
 source_hash=hashlib.sha256(json.dumps(metadata['payload_file_sha256'],sort_keys=True,separators=(',',':')).encode()).hexdigest()
 app=payload/'js/app.js';original=app.read_bytes();app.write_bytes(original+b'\n// synthetic tamper\n');result=subprocess.run(command,capture_output=True,text=True);assert result.returncode and 'differs from exact Git SHA' in result.stderr;app.write_bytes(original)
 ref=re.search(r'(?:href|src)=[\'"](css/[^\'"?#]+)',(payload/'index.html').read_text())[1];asset=payload/ref;original=asset.read_bytes();asset.unlink();result=subprocess.run(command,capture_output=True,text=True);assert result.returncode and 'Missing active shared dependency' in result.stderr;asset.write_bytes(original)
 # A QA head cannot masquerade as approved Production/main or use an older Store SHA.
 result=subprocess.run(command+['--production'],capture_output=True,text=True);assert result.returncode and 'origin/main' in result.stderr
 # Negative invocations never replace the valid artifact. Record again from restored exact bytes.
 subprocess.run(command,check=True,stdout=subprocess.DEVNULL)
 watch=root/'watch-bible';subprocess.run(['python3','scripts/build-watch-bible-wave7.py','--output',str(watch)],check=True,stdout=subprocess.DEVNULL)
 watch_files={str(f.relative_to(watch)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(watch.rglob('*')) if f.is_file()};watch_bytes=sum(f.stat().st_size for f in watch.rglob('*') if f.is_file())
 (a.output/'watch-resource-sha256.json').write_text(json.dumps({'test_head':head,'status':'PASS_AUTOMATED','artifact_kind':'derived-public-resource-JSON-not-native-binary','total_bytes':watch_bytes,'sha256':watch_files},indent=2)+'\n')
obj={'schema_version':1,'test_head':head,'status':'PASS_AUTOMATED','os':platform.system(),'architecture':platform.machine(),'artifact_kind':'exact-Git-QA-source-export-not-installable-native-build','source_mode':'qa-only','platform':'web','version':'wave8-integration-qa','build':head[:12],'exported_file_count':len(metadata['payload_file_sha256']),'verified_shared_file_count':len(metadata['verified_shared_files']),'sorted_payload_sha256_map_digest':source_hash,'native_builds':0,'simulator_runs':0,'physical_runs':0,'signed_artifacts':0,'store_uploads':0,'tools_available':tools,'tool_versions':tool_versions,'binding_presence_only':{n:bool(os.environ.get(n)) for n in ['ANDROID_HOME','ANDROID_SDK_ROOT','JAVA_HOME','DEVELOPER_DIR']},'visible_usb_interface':Path('/dev/bus/usb').exists(),'wrapper_source_sha256':wrapper_hashes,'ios_android_macos_wrapper_status':'BLOCKED_TOOLCHAIN','watch_compile_status':'BLOCKED_TOOLCHAIN','physical_devices':'PHYSICAL_QA_REQUIRED','provider_delivery':'PROVIDER_EVIDENCE_REQUIRED','negatives':['modified shared file rejected','missing active dependency rejected','develop cannot masquerade as approved Production source'],'limitations':['No current iOS/Android/macOS wrapper available; preserve exact owner project/locks/plugins/entitlements before any later approved build','Linux Chromium is not Safari/WKWebView/Android/Fold or installed native evidence','Watch resource generation is not Swift compilation, companion embedding, installation or pairing','No signing or native project reconstruction performed']}
(a.output/'provenance-summary.json').write_text(json.dumps(obj,indent=2)+'\n');print('PASS Wave8 exact QA Git export/actual runtime hashes/tamper/missing dependency/Production-head negatives; current wrappers recorded; native compile/device/provider correctly unresolved')
