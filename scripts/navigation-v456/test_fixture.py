"""Refine synthetic fixtures only; production APIs are intercepted by the harness."""
from pathlib import Path
p=Path('scripts/navigation-v456/browser.py');s=p.read_text().replace("'nh7_inbox':json.dumps(","'nh7_inbox_messages':json.dumps(")
marker="   for key,value in SEED.items():\n    if key!='nh7_lang':assert p.evaluate('(k)=>localStorage.getItem(k)',key)==value,key"
replacement="""   for key,value in SEED.items():
    if key=='nh7_inbox_messages':
     rows=json.loads(p.evaluate('(k)=>localStorage.getItem(k)',key));record=next(x for x in rows if x['id']=='nav456-inbox');assert record['body']=='KEEP inbox body' and record['read'] is False
    elif key!='nh7_lang':assert p.evaluate('(k)=>localStorage.getItem(k)',key)==value,key
   expect(p.locator('#inboxBadge')).to_be_visible()
""".rstrip()
if "record['body']=='KEEP inbox body'" not in s:
 assert marker in s;s=s.replace(marker,replacement,1)
old="def assert_no_error(p):assert not p.locator('#view h2').filter(has_text='Error').count(),p.locator('#view').inner_text()"
new="""def assert_no_error(p):
 wait(p,'document.getElementById("view").textContent.trim()!=="..." && document.getElementById("view").textContent.trim().length>5')
 assert not p.locator('#view h2').filter(has_text='Error').count(),p.locator('#view').inner_text()"""
if old in s:s=s.replace(old,new,1)
if 'Late Meetings responses cannot replace' not in s:
 marker="   # Browser back/forward must keep old route IDs and not strand a removed shortcut.\n";assert marker in s
 race='''   # A deliberately delayed registration lookup tests the real previous navigation race.
   home(p)
   p.evaluate("""(()=>{window.qa456NativeFetch=window.fetch;window.qa456Pending=0;window.qa456Started=0;window.fetch=(input,options)=>{const url=typeof input==='string'?input:input.url;if(String(url).includes('registration')){qa456Pending++;qa456Started++;return new Promise(resolve=>setTimeout(resolve,250)).then(()=>qa456NativeFetch(input,options)).finally(()=>qa456Pending--)}return qa456NativeFetch(input,options)}})()""")
   p.locator('[data-go="meetings"]').click();wait(p,'qa456Started>0');more(p)
   for _ in range(50):
    p.wait_for_timeout(150)
    if p.evaluate('qa456Pending===0'):
     p.wait_for_timeout(350)
     if p.evaluate('qa456Pending===0'):break
   assert p.evaluate('qa456Pending===0')
   expect(p.locator('[data-more-navigation456]')).to_be_visible()
   expect(p.locator('.nav-item[data-route="more"]')).to_have_class('nav-item active')
   p.evaluate('window.fetch=qa456NativeFetch')
   passed('Late Meetings responses cannot replace the newer More page or its active navigation')
'''
 s=s.replace(marker,race+marker,1)
p.write_text(s)
print('Actual inbox contract and explicit slow-response navigation race are covered.')
