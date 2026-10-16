"""Generate a review artifact only, never execute/connect/deploy. Exact Wave5 reuse, one transaction."""
from pathlib import Path
import hashlib,json,argparse
ROOT=Path(__file__).resolve().parents[3]
BASE=ROOT/'supabase/review/wave5-document-studio-v2'
HERE=Path(__file__).resolve().parent
def assemble(with_library=False):
 hashes=json.loads((HERE/'baseline-sha256.json').read_text());parts=[]
 for name in (['candidate.sql','library-boundary.sql'] if with_library else ['candidate.sql']):
  raw=(BASE/name).read_bytes();assert hashlib.sha256(raw).hexdigest()==hashes[name],name+' baseline changed'
  text=raw.decode();assert text.count('\nbegin;')==1 and text.rstrip().endswith('commit;')
  parts.append(text.replace('\nbegin;','\n',1).rsplit('commit;',1)[0])
 for name in ['document-backend-proposal.sql','rls-acl-proposal.sql']:parts.append((HERE/name).read_text())
 return '-- REVIEW ONLY generated atomic bundle; NOT an ordinary migration.\nbegin;\n'+'\n'.join(parts)+'\ncommit;\n'
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--output',required=True);p.add_argument('--with-library',action='store_true');a=p.parse_args();target=Path(a.output).resolve()
 assert ROOT/'supabase/migrations' not in target.parents,'No ordinary migration output';assert not target.exists(),'Refuse overwriting an existing artifact'
 target.write_text(assemble(a.with_library));print('Wrote review-only artifact; nothing executed')
