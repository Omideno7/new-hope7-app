"""Derive a deterministic offline Watch Bible from current public Web data. No network/deletion."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,hashlib,collections,argparse
ROOT=Path(__file__).resolve().parents[1]
def build(output):
 output=Path(output);output.mkdir(parents=True,exist_ok=True)
 # Refuse unknown output files instead of clearing any directory/user cache.
 assert not any(p.name not in ['bible_books.json','provenance.json'] and not __import__('re').fullmatch(r'bible_[A-Z0-9]{3}_\d+\.json',p.name) for p in output.iterdir()),'Output directory contains unrelated files'
 books=[];chapters=collections.defaultdict(list);sources=[]
 for name in ['bible_group_01_18.json','bible_group_19_39.json','bible_group_40_66.json']:
  path=ROOT/'data/bible/groups'/name;raw=path.read_bytes();data=json.loads(raw)
  sources.append({'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(raw).hexdigest(),'version':data['version'],'licenseNotes':data.get('licenseNotes',{})})
  books.extend({k:b[k] for k in ['id','order','names','chapters']} for b in data['books'])
  for v in data['verses']:
   assert all(isinstance(v['text'].get(l),str) and v['text'][l].strip() for l in ['fa','en','hr'])
   chapters[(v['bookId'],v['chapter'])].append({'verse':v['verse'],'text':{l:v['text'][l] for l in ['fa','en','hr']}})
 books.sort(key=lambda b:b['order']);assert len(books)==66 and len({b['id'] for b in books})==66 and len(chapters)==1189
 def write(name,obj,limit):
  raw=(json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'\n').encode();assert len(raw)<=limit,(name,len(raw));(output/name).write_bytes(raw);return len(raw)
 maximum=0;total=write('bible_books.json',books,32768)
 for b in books:
  for number in range(1,b['chapters']+1):
   rows=sorted(chapters[(b['id'],number)],key=lambda v:v['verse']);assert len(rows)<=200
   assert len({r['verse'] for r in rows})==len(rows)
   n=write(f"bible_{b['id']}_{number}.json",rows,262144);maximum=max(maximum,n);total+=n
 provenance={'canonical_sources':sources,'books':66,'chapters':1189,'runtime_cache':'none; current chapter only, <=256KiB/200 verses; catalog<=32KiB','largest_chapter_bytes':maximum,'bible_resource_bytes':total,'network_requests':0}
 write('provenance.json',provenance,32768);return provenance
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);a=p.parse_args();r=build(a.output);print(json.dumps({k:v for k,v in r.items() if k!='canonical_sources'},indent=2))
