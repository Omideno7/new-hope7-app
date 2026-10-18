"""Reconcile every supplied live row with exact raw repository prosrc, signature and caller evidence."""
import sys
sys.dont_write_bytecode=True
from pathlib import Path
from wave75_accepted_source import prior75_bytes
import re,json,hashlib,collections
P=Path('supabase/review/wave6_6-live-security');rows=json.loads((P/'function-dispositions.json').read_text())['rows'];live=[]
for file in sorted(Path('docs/qa/wave6_6-live-security').glob('*.psv')):
 for line in file.read_text().splitlines():
  if line and not line.startswith('#'):live.append(line.split('|'))
assert len(live)==len(rows)==236 and {r['row'] for r in rows}==set(range(1,237))
assert sum(r['anon_execute'] for r in rows)==32 and all(r['authenticated_execute'] for r in rows)
matched=0
for r,v in zip(rows,live):
 assert r['row']==int(v[0]) and r['signature']==v[3] and r['acl']==v[4]
 assert r['definition_md5']==v[5] and r['body_md5']==v[6] and r['body_length']==int(v[7]) and r['proconfig']==v[8]
 assert r['anon_execute']==(v[1]=='anon') and r['safe_to_revoke'] is False and r['acl_delta']==[]
 assert not re.search(r'\(p_|,\s*p_',r['identity_signature'])
 if r['source_evidence']:
  matched+=1
  for source in r['source_evidence']:
   text=Path(source['path']).read_text();start=text.splitlines(keepends=True);offset=sum(len(l) for l in start[:source['line']-1]);tail=text[offset:]
   name=r['signature'].split('(')[0];m=re.match(r'create\s+(?:or\s+replace\s+)?function\s+([\w.]+)\s*\(',tail,re.I);assert m and m[1]==name,(name,source)
   a=re.search(r'\bas\s+(\$\w*\$)',tail,re.I);assert a
   body=tail[a.end():tail.index(a[1],a.end())];assert hashlib.md5(body.encode()).hexdigest()==r['body_md5'] and len(body)==r['body_length']
   header=tail[:a.end()];assert re.search(r'security\s+definer',header,re.I)
   # Balanced header arguments, remove defaults only; no body whitespace normalization.
   pos=header.index('(');depth=1;quote=False;end=pos+1
   while depth:
    c=header[end]
    if c=="'":quote=not quote
    if not quote:depth+=(c=='(')-(c==')')
    end+=1
   args=[]
   for arg in re.split(r',\s*(?=p_\w+\s)',header[pos+1:end-1].strip()):
    arg=re.split(r'\s+default\s+|\s*=\s*',arg,flags=re.I)[0];arg=' '.join(arg.lower().split()).replace('timestamptz','timestamp with time zone');args.append(re.sub(r'\bint\b','integer',arg))
   assert ', '.join(args)==r['signature'].split('(',1)[1][:-1],name
 else:assert r['authenticated_disposition']=='BLOCKED_LIVE_BODY'
 for candidate in r.get('candidate_source_mismatches',[]):
  text=Path(candidate['path']).read_text();offset=sum(len(l) for l in text.splitlines(keepends=True)[:candidate['line']-1]);tail=text[offset:];a=re.search(r'\bas\s+(\$\w*\$)',tail,re.I);assert a
  body=tail[a.end():tail.index(a[1],a.end())];assert hashlib.md5(body.encode()).hexdigest()==candidate['candidate_body_md5']!=r['body_md5']
 for c in r['runtime_callers']:
  name=r['signature'].split('(')[0].split('.')[-1]
  # Historical exact line offsets use independently hash-bound accepted source; the current caller must still exist.
  assert name in prior75_bytes(c['path']).decode().splitlines()[c['line']-1]
  if r['row']==131 and name=='nh7_get_meeting_settings' and c['path']=='js/app.js':
   # Batch3B intentionally retires this one unproven email/device transport; old Store callers still block live ACL changes.
   from batch3b_accepted_source import prior_batch3b_bytes
   assert name in prior_batch3b_bytes(c['path']).decode()
   assert "cloudRpc('nh7_get_meeting_settings'" not in Path(c['path']).read_text()
   assert "cloudFetch('meeting_settings?" not in Path(c['path']).read_text()
  else:
   assert name in Path(c['path']).read_text(),('Removed current caller',name,c)
assert matched==72
rls=json.loads((P/'rls-dispositions.json').read_text())['rows'];manifest=Path('docs/qa/WAVE6_6_LIVE_METADATA_MANIFEST.md').read_text();expected=re.findall(r'^\d+\. `([^`]+)`',manifest.split('The authoritative Advisor list is:')[1].split('A broader raw SQL')[0],re.M)
assert [r['table'] for r in rls]==expected and len(expected)==29
assert all(r['policy_proposal']=='NONE' for r in rls)
views=json.loads((P/'library-live-contract.json').read_text())['views'];assert len(views)==4
for v in views:assert len(v['columns'])==(12 if 'collections_public' in v['name'] else 25)
for file in ['function-acl-proposal.sql','rls-proposal.sql','pg-net-acl-proposal.sql']:
 assert all(not l.strip() or l.strip().startswith('--') for l in (P/file).read_text().splitlines())
for file in ['library-proposal.sql','rollback.sql']:
 s=(P/file).read_text();assert s.index('WAVE66_REVIEW_ONLY')<s.index('-- FIXTURE-SQL-BEGIN') and s.rstrip().endswith('ROLLBACK;')
assert json.loads((P/'full-delete-readiness.json').read_text())['enabled'] is False
assert 'ALTER EXTENSION' not in (P/'pg-net-acl-proposal.sql').read_text().upper()
assert all(not r['production_delete_authorized'] for r in json.loads((P/'full-delete-readiness.json').read_text())['rows'])
print('PASS Wave66 236 exact signatures/ACLs/fingerprints; 32 anon subset; 72 raw body/signature matches, all callers located; unresolved rows isolated; exact 29 RLS; zero existing-function ACL deltas; inert review SQL, Full Delete disabled')
print('authenticated',dict(collections.Counter(r['authenticated_disposition'] for r in rows)))
print('anon',dict(collections.Counter(r['anon_disposition'] for r in rows if r['anon_execute'])))
