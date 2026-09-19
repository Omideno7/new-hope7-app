"""Diagnostics only: retain all assertions and report the precise pending operation."""
import ast,faulthandler,runpy,sys
from pathlib import Path
faulthandler.enable();faulthandler.dump_traceback_later(60,repeat=True)
path=Path('scripts/study-v454/browser.py');source=path.read_text()
# A bounded diagnostic wrapper affects only test fixture creation, never runtime.
tree=ast.parse(source)
for node in ast.walk(tree):
    if isinstance(node,ast.Constant) and isinstance(node.value,str) and "const id='45400000" in node.value:
        old=node.value
        code=old.replace("const id='45400000", "window.qa454stage='fetching synthetic WAV';const id='45400000",1)
        code=code.replace("await new Promise((resolve,reject)=>{const r=indexedDB.open", "window.qa454stage='opening synthetic media database';await new Promise((resolve,reject)=>{const r=indexedDB.open",1)
        code=code.replace("r.onsuccess=()=>{const db=r.result,tx=db.transaction", "r.onblocked=()=>reject(Error('Synthetic database version blocked'));r.onsuccess=()=>{window.qa454stage='writing synthetic WAV blob';const db=r.result,tx=db.transaction",1)
        code=code.replace("tx.oncomplete=()=>{db.close();resolve()}","tx.onerror=()=>{db.close();reject(tx.error||Error('Synthetic transaction error'))};tx.onabort=()=>{db.close();reject(tx.error||Error('Synthetic transaction abort'))};tx.oncomplete=()=>{db.close();window.qa454stage='synthetic blob committed';resolve()}",1)
        code=code.replace("const item={id,title_fa", "window.qa454stage='mounting synthetic classic player';const item={id,title_fa",1)
        code="()=>Promise.race([("+code+")(),new Promise((_,reject)=>setTimeout(()=>reject(Error('Audio fixture timeout at '+window.qa454stage)),12000))])"
        # Preserve source outside the selected literal exactly.
        lines=source.splitlines(keepends=True);start=sum(len(x) for x in lines[:node.lineno-1])+node.col_offset;end=sum(len(x) for x in lines[:node.end_lineno-1])+node.end_col_offset
        source=source[:start]+repr(code)+source[end:];break
out=Path('qa-study454');out.mkdir(exist_ok=True)
def trace(frame,event,arg):
    if event=='line' and frame.f_code.co_filename.endswith('diagnostic-browser.py'):
        (out/'last-test-line.txt').write_text(str(frame.f_lineno))
    return trace
patched=out/'diagnostic-browser.py';patched.write_text(source)
sys.settrace(trace)
try:runpy.run_path(str(patched),run_name='__main__')
finally:sys.settrace(None);faulthandler.cancel_dump_traceback_later()
