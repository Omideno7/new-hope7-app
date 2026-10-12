"""Local provenance regression: real Git export, deliberate tamper/unknown SHA rejection."""
from pathlib import Path
import subprocess,tempfile,tarfile,io,json
root=Path(__file__).resolve().parents[1];sha=subprocess.check_output(['git','rev-parse','origin/main'],cwd=root,text=True).strip()
with tempfile.TemporaryDirectory(prefix='nh7-build-provenance-') as tmp:
 base=Path(tmp);payload=base/'payload';payload.mkdir();archive=subprocess.check_output(['git','archive',sha],cwd=root)
 with tarfile.open(fileobj=io.BytesIO(archive)) as tar:tar.extractall(payload,filter='data')
 command=['python3','scripts/record-build-metadata.py','--payload',str(payload),'--platform','web','--version','qa-consolidation','--build','test','--sha',sha,'--output',str(base/'metadata.json'),'--production']
 subprocess.run(command,cwd=root,check=True,stdout=subprocess.DEVNULL)
 data=json.loads((base/'metadata.json').read_text());assert data['git_sha']==sha and 'js/app.js' in data['verified_shared_files']
 app=payload/'js/app.js';app.write_bytes(app.read_bytes()+b'\n// deliberate QA tamper\n');result=subprocess.run(command,cwd=root,capture_output=True,text=True);assert result.returncode and 'differs from exact Git SHA' in result.stderr
 wrong=list(command);wrong[wrong.index('--sha')+1]='a177cdc7d995894868cf84bbe00c2dfa05ad6e25';result=subprocess.run(wrong,cwd=root,capture_output=True,text=True);assert result.returncode and 'origin/main' in result.stderr
 print('Build provenance PASS: actual shared bytes verified; dirty payload and historical Production SHA rejected; no deployment.')
