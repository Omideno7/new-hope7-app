"""Package QA startup dependencies; never touches production settings or source files."""
from pathlib import Path
import ast, base64, gzip, html, json, re, subprocess, tempfile
root=Path.cwd()
core=(root/'qa32-core.js').read_text(encoding='utf-8')
page=(root/'index.html').read_text(encoding='utf-8')
pre_match=re.search(r'for\(const p of (\[.*?\])\)await load\(BASE\+p\)',core)
post_match=re.search(r'for\(const \[p,t\] of (\[.*?\])\)await load\(BASE\+p,t\)',core)
assert pre_match and post_match, 'Unexpected QA loader source'
pre=ast.literal_eval(pre_match.group(1))
post=ast.literal_eval(post_match.group(1))
skip={'js/nh7-auto-update-v335.js','js/nh7-notifications-zagreb-v334.js','js/nh7-push-account-bind-v361.js'}
pre=[p for p in pre if p not in skip]
post=[list(pair) for pair in post if pair[0] not in skip]
assert all(isinstance(x,list) and len(x)==2 for x in post)
sources={p:(root/p).read_text(encoding='utf-8') for p in dict.fromkeys(pre+[p for p,t in post])}
app=gzip.decompress(base64.b64decode((root/'qa31-app.b64').read_bytes())).decode('utf-8')
old="if(!('serviceWorker'in navigator)){reject(new Error('Service worker unavailable'));return}"
assert old in app
app=app.replace(old,"if(window.NH7_HYBRID_QA||!('serviceWorker'in navigator)){reject(new Error('Offline worker is disabled in browser QA'));return}",1)
old='async function bootstrapApp(){\n  clearLegacySchoolSession();'
assert old in app
app=app.replace(old,old+'\n  setLang(state.lang);\n  ensureSermonPlayer();',1)
sources['__qa_application__.js']=app
core=core.replace(pre_match.group(0),'for(const p of '+json.dumps(pre)+')await load(BASE+p)')
core=core.replace(post_match.group(0),'for(const [p,t] of '+json.dumps(post)+')await load(BASE+p,t)')
load_start=core.index("function load(src,type='classic')")
load_end=core.index('async function gunzipText',load_start)
loader="""function load(src,type='classic'){
  const name=src==='__qa_application__.js'?src:src.slice(BASE.length);
  if(!Object.prototype.hasOwnProperty.call(NH7_QA_PACKED_SOURCES,name))return Promise.reject(new Error('Unpackaged startup dependency: '+name));
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    const url=URL.createObjectURL(new Blob([NH7_QA_PACKED_SOURCES[name]+'\\n//# sourceURL=nh7qa/'+name],{type:'text/javascript'}));
    const finish=error=>{clearTimeout(timer);URL.revokeObjectURL(url);error?reject(error):resolve()};
    const timer=setTimeout(()=>finish(new Error('Startup script timed out: '+name)),15000);
    s.async=false;if(type==='module')s.type='module';
    s.onload=()=>finish();s.onerror=()=>finish(new Error('Startup script failed: '+name));
    s.src=url;document.body.appendChild(s);
  });
}
"""
core=core[:load_start]+loader+core[load_end:]
old="const ar=await fetch('qa31-app.b64',{cache:'no-store'});if(!ar.ok)throw new Error('app payload');runText(await gunzipText(await ar.text()));"
assert old in core
core=core.replace(old,"await load('__qa_application__.js','module');",1)
core=core.replace('HYBRID FINAL QA 28 · ONLINE','BROWSER QA · STARTUP REPAIR 33')
core='const NH7_QA_PACKED_SOURCES='+json.dumps(sources,ensure_ascii=False,separators=(',',':'))+';\n'+core
with tempfile.TemporaryDirectory() as td:
    check=Path(td)/'bundle.js';check.write_text(core,encoding='utf-8')
    subprocess.run(['node','--check',str(check)],check=True)
    for text in re.findall(r"runText\(('(?:\\.|[^'\\])*')\)",core):
        check.write_text(ast.literal_eval(text),encoding='utf-8')
        subprocess.run(['node','--check',str(check)],check=True)
def stylesheet(match):
    tag=match.group(0)
    if not re.search(r'rel=[\"\']stylesheet[\"\']',tag):return tag
    href=html.unescape(re.search(r'href=[\"\']([^\"\']+)',tag).group(1))
    name=href.split('/657a0dadc01b46e6176bfab791bcd7a1bac2025c/')[-1].split('?')[0]
    file=root/name
    assert file.is_file(), 'Missing stylesheet '+name
    css=file.read_text(encoding='utf-8').replace('</style','<\\/style')
    return '<style data-source="'+html.escape(name,quote=True)+'">'+css+'</style>'
page=re.sub(r'<link\b[^>]*>',stylesheet,page)
page=re.sub(r'<script\b[^>]*src="qa32-core\.js[^\"]*"[^>]*>\s*</script>','',page)
logo='data:image/png;base64,'+base64.b64encode((root/'assets/logo.png').read_bytes()).decode()
page=page.replace('https://raw.githack.com/Omideno7/new-hope7-app/657a0dadc01b46e6176bfab791bcd7a1bac2025c/assets/logo.png',logo)
page=page.replace('Hybrid Final QA 32','Browser QA · Startup Repair 33').replace("'QA-32'","'QA-33-runtime'")
page=page.replace('</body>','<script>'+core.replace('</script','<\\/script')+'</script></body>')
assert 'src="qa32-core.js' not in page
(root/'qa-runtime-repaired.html').write_text(page,encoding='utf-8')
print(json.dumps({'packaged_startup_scripts':len(sources),'html_bytes':len(page.encode()),'external_startup_scripts':0,'missing_tuple_path_fixed':True,'production_configuration_changed':False}))
