from pathlib import Path
import subprocess

def change(path,old,new):
 p=Path(path);s=p.read_text();assert s.count(old)==1,(path,old[:80],s.count(old));p.write_text(s.replace(old,new,1))
# Cache isolation is local only. The authenticated server must receive the actual UUID.
change('js/nh7-audio-classic-v400.js',"edge({kind:'sermon',sermon_id:id})","edge({kind:'sermon',sermon_id:mediaId(item)})")
# The list-detail observer shares the same view; equal text writes must be no-ops.
change('js/nh7-sermon-list-detail-v445.js',"  row.querySelector('strong').textContent=title;","  const heading=row.querySelector('strong');if(heading.textContent!==title)heading.textContent=title;")
change('js/nh7-sermon-list-detail-v445.js',"    small.textContent=meta||L('برای باز کردن موعظه لمس کنید','Tap to open sermon','Dodirnite za otvaranje');","    const label=meta||L('برای باز کردن موعظه لمس کنید','Tap to open sermon','Dodirnite za otvaranje');if(small.textContent!==label)small.textContent=label;")
# A broken REST fallback is not an empty set of grades/assignments.
change('js/app.js',"      snapshot={progress:Array.isArray(progress)?progress:[],assignments:Array.isArray(assignments)?assignments:[]};","      if(!Array.isArray(progress)||!Array.isArray(assignments))throw new Error('invalid_school_snapshot');\n      snapshot={progress,assignments};")
change('index.html','js/nh7-sermon-list-detail-v445.js?v=4.4.6','js/nh7-sermon-list-detail-v445.js?v=4.6.7')
p=Path('sw-release-core-v403.js');s=p.read_text();i=s.index(']);',s.index('const NH7_READER_RELEASE_PATHS_V452'));s=s[:i]+', "js/nh7-sermon-list-detail-v445.js"'+s[i:];p.write_text(s)
# Strengthen server-shaped fixtures: do not accept local cache IDs as server UUIDs.
p=Path('scripts/v467/qa.py');s=p.read_text()
a="  if(u.pathname==='/functions/v1/nh7-school-media-access'){"
b=a+"\n   if(body.kind==='sermon'&&!/^[0-9a-f-]{36}$/i.test(body.sermon_id||''))return new Response(JSON.stringify({code:'invalid_sermon'}),{status:400});"
assert s.count(a)==1;s=s.replace(a,b)
# New integration regression uses the real security and catalogue wrapper stack.
marker='  browser.close()'
extra=r'''  def wrapper_integration():
   ctx,p,err=page();id='cccccccc-cccc-4ccc-8ccc-cccccccccccc';card(p,id)
   for file in ['js/nh7-security-core-v340.js','js/nh7-audio-route-stability-v423.js','js/nh7-offline-playback-bridge-v332.js','js/nh7-audio-classic-v400.js','js/nh7-sermon-list-detail-v445.js']:
    script(p,file)
   p.wait_for_timeout(750)
   p.evaluate("window.mutations=0;new MutationObserver(r=>mutations+=r.length).observe(document.getElementById('view'),{childList:true,subtree:true})")
   p.wait_for_timeout(450);assert p.evaluate('mutations')<8,p.evaluate('mutations')
   p.locator('.nh7-audio-row-v445').click()
   p.locator('[data-sermon-play]').click()
   p.wait_for_function("Array.from(document.querySelectorAll('audio')).some(a=>!a.paused&&a.currentTime>0)")
   requests=p.evaluate("calls.filter(x=>x.path.includes('nh7-school-media-access'))")
   assert len(requests)==1 and requests[0]['body']['sermon_id']==id,requests
   p.locator('[data-classic-toggle]').click();p.wait_for_timeout(200)
   p.evaluate('mutations=0');p.wait_for_timeout(450);assert p.evaluate('mutations')<8
   protect(p);assert not err,err;ctx.close()
  run(engine+': full security/catalogue/player wrapper stack and stable sermon DOM',wrapper_integration)
'''
assert s.count(marker)==1;s=s.replace(marker,extra+marker);p.write_text(s)
for path in ['js/app.js','js/nh7-audio-classic-v400.js','js/nh7-sermon-list-detail-v445.js','sw-release-core-v403.js']:
 subprocess.run(['node','--check',path],check=True)
print('Finalized ten runtime files; backend identifiers, gates, accepted student work preserved.')
