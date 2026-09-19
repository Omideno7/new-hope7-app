"""Refine only synthetic test fixtures, never application data or runtime."""
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
p.write_text(s)
print('Synthetic inbox record and header badge validated using the existing production contract.')
