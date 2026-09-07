from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[1];base=root
version=json.loads((root/'version.json').read_text())
if version.get('admin')=='2.3.9.43':
    print('Admin 2.3.9.43 is already applied.');raise SystemExit(0)
if version.get('admin')!='2.3.9.42':
    raise SystemExit('Unexpected source version; refusing to overwrite another release.')
s=(base/'admin-v239-stable.html').read_text()
s=s.replace('2.3.9.42','2.3.9.43').replace('۲.۳.۹.۴۲','۲.۳.۹.۴۳').replace('2.3.9.43-master-v438-force','2.3.9.43-ui-v439')
s=s.replace('    await checkForUpdate();','    // Entry HTML is fetched without waiting for the unrelated version endpoint.\n    // The mounted panel offers an explicit update button instead of discarding edits.')
# Replace old monolithic inline ready/update observer with a small event-based runtime.
start=s.index('<script>(()=>{document.querySelectorAll')
end=s.index('})();<\\/script></body>',start)+len('})();<\\/script>')
s=s[:start]+'<script src="js/nh7-admin-rbac-v350.js?v=${BUILD}"><\\/script><script src="js/nh7-admin-ready-v439.js?v=${BUILD}"><\\/script>'+s[end:]
# Remove now obsolete inject-before-inline-RBAC transform.
s='\n'.join(line for line in s.split('\n') if "html=html.replace('<script>(()=>{document.querySelectorAll" not in line)
# All transformations stay limited to the stable admin entry; user app files untouched.
needle='    document.open();document.write(html);document.close();'
insert=r'''
    html=html.replace('</head>',`<script src="js/nh7-admin-ui-stability-v439.js?v=${BUILD}"><\/script></head>`);
    const core=/^function render\(\)\{[^\n]+\}$/m;
    if(!core.test(html))throw new Error('Admin render contract changed; refusing an unsafe patch');
    html=html.replace(core,`function render(){document.documentElement.lang=lang;document.body.dir=lang==='fa'?'rtl':'ltr';const app=document.getElementById('adminApp');try{NH7AdminUI.update(app,!token||!nh7AdminAccessReady?renderLogin():renderTop()+renderBody()+'<button class="fab-refresh" onclick="loadAll()">⟳</button>')}catch(e){console.error('Admin render failed',e);NH7AdminUI.update(app,(token&&nh7AdminAccessReady?renderTop():'')+'<div class="notice">'+h(e.message||String(e))+'</div>')}}`);
    html=html.replace('state.loading=true;\n  if(!silent)render();','state.loading=false;NH7AdminUI.loading(true);\n  if(!silent)render();');
    html=html.replace('finally{adminLoadInFlight=false;state.loading=false}','finally{adminLoadInFlight=false;state.loading=false;NH7AdminUI.loading(false)}');
    html=html.replace(/<script src="js\/admin-v2\.3\.5-analytics\.js[^"\n]*"><\/script>/,`<script src="js/admin-v2.3.5-analytics-core-v237.js?v=${BUILD}"><\/script><script src="js/nh7-admin-listening-analytics-v427.js?v=${BUILD}"><\/script><script src="js/nh7-admin-school-workflow-v246.js?v=${BUILD}"><\/script>`);
    html=html.replaceAll('js/admin-v2.3.9-clean-scroll-v300.js','js/nh7-admin-scroll-v439.js').replaceAll('js/admin-v2.3.9-request-search-focus-v336.js','js/nh7-admin-request-search-v439.js');
    // Keep the last student implementation, after the analytics compatibility layer.
    const tags=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
    const last=new Map();for(const m of tags)last.set(m[1].split('?')[0],m.index);
    html=html.replace(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g,(tag,src,offset)=>last.get(src.split('?')[0])===offset?tag:'');
'''
s=s.replace(needle,insert+'\n'+needle)
s=s.replace("html=html.replaceAll('2.3.9.39'", "html=html.replaceAll('2.3.9.42','2.3.9.43').replaceAll('2.3.9.39'")
s=s.replace("html=html.replaceAll('js/admin-v2.3.9-clean-scroll-v300.js'","html=html.replace('js/admin-v2.3.9-document-runtime-fix4.js?v=2.3.9-f4','js/admin-v2.3.9-document-runtime-fix4.js?v='+BUILD);\n    html=html.replaceAll('js/admin-v2.3.9-clean-scroll-v300.js'")
s=s.replace('<style>.nh7-admin-version-v235', '<link rel="stylesheet" href="css/nh7-admin-ui-v439.css?v=${BUILD}"><style>.nh7-admin-version-v235')
(root/'admin-v239-stable.html').write_text(s)
# No mandatory SW waiting: revalidation is best-effort and doesn't block opening admin.
s=(base/'admin-refresh.html').read_text();start=s.index('  if(!(\'serviceWorker\'');end=s.index('\n})();',start)
s=s[:start]+"  if('serviceWorker' in navigator){navigator.serviceWorker.getRegistration().then(reg=>reg?.update()).catch(()=>{})}\n  go();"+s[end:]
(root/'admin-refresh.html').write_text(s)
# Document studio keeps all design/upload/print controls, but no self-triggering redraw loop.
s=(base/'js/admin-v2.3.9-document-runtime-fix4.js').read_text()
s=s.replace('function bindGuards(){', 'let guardsBound=false;function bindGuards(){if(guardsBound)return;guardsBound=true;')
s=s.replace("fab.style.display=inCertificates?'block':'none';", "const display=inCertificates?'block':'none';if(fab.style.display!==display)fab.style.display=display;")
s=s.replace("if(heading)heading.textContent=churchName();", "if(heading&&heading.textContent!==churchName())heading.textContent=churchName();")
s=s.replace('small.textContent=contact', 'if(small.textContent!==contact)small.textContent=contact')
s=s.replace('function applyAll(){syncLegacy();applyLegacy();applyModern();refreshPreviewClone()}',"function applyAll(){observer.disconnect();try{syncLegacy();applyLegacy();applyModern();refreshPreviewClone()}finally{observer.observe(document.documentElement,{childList:true,subtree:true})}}")
s=s.replace('const observer=new MutationObserver(()=>requestAnimationFrame(()=>{addLauncher();applyAll()}));', "let frame=0;const observer=new MutationObserver(()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;addLauncher();applyAll()})});")
(root/'js/admin-v2.3.9-document-runtime-fix4.js').write_text(s)
# Avoid duplicate module registration even from an older cached loader.
s=(base/'js/admin-v2.3.9-student-clean-v311.js').read_text();s=s.replace("const VERSION='3.1.1-student-clean';", "if(window.__NH7_STUDENT_CLEAN_V311__)return;window.__NH7_STUDENT_CLEAN_V311__=true;\nconst VERSION='3.1.1-student-clean';")
(root/'js/admin-v2.3.9-student-clean-v311.js').write_text(s)
v=json.loads((root/'version.json').read_text());v['admin']='2.3.9.43';v['updated_at']='2026-09-07T14:00:00+00:00';(root/'version.json').write_text(json.dumps(v,ensure_ascii=False,separators=(',',':'))+'\n')

# Old direct bookmarks use the same verified loader, not a different admin implementation.
p=root/'admin.html';s=p.read_text()
redirect='<script id="nh7StableAdminEntry">if(/\\/admin\\.html$/.test(location.pathname))location.replace("./admin-v239-stable.html"+location.search+location.hash);</script>'
if 'nh7StableAdminEntry' not in s:s=s.replace('<head>','<head>\n'+redirect,1)
p.write_text(s)
print('Applied admin 2.3.9.43. No database or user-app files changed.')
