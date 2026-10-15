import sys
sys.dont_write_bytecode=True
from pathlib import Path
import json,importlib.util,hashlib,copy
root=Path('supabase/review/wave6_5-security-registration');s=importlib.util.spec_from_file_location('adapters',root/'propose-adapters.py');mod=importlib.util.module_from_spec(s);s.loader.exec_module(mod)
m=json.loads((root/'function-matrix.json').read_text());assert m['sql_files']==110 and len(m['definitions'])==231
classes={'intentional anonymous public endpoint','authenticated user endpoint','Admin endpoint','internal helper','trigger-only function','migration/maintenance-only function','obsolete compatibility wrapper'}
for row in m['definitions']:
 assert row['classification'] in classes and Path(row['source']).is_file() and row['signature_source']
 assert set(row['live_roles'])=={'anon','authenticated','service_role'} and set(row['live_roles'].values())=={'UNVERIFIED'}
assert len({r['name'] for r in m['definitions']})==188
cols=[{'name':'id','type':'text'},{'name':'title','type':'text'},{'name':'audience','type':'text'}];definition='synthetic captured definition';digest=hashlib.sha256(definition.encode()).hexdigest()
catalog={'owner_approved':True,'v396_uid_grant_projection_verified':True,'views':[{'name':name,'definition':definition,'definition_sha256':digest,'columns':cols,'catalog_projection':cols} for name in mod.VIEWS], 'functions':[{'schema':'public','name':'fixture_admin','identity_arguments':'uuid','definition':definition,'definition_sha256':digest,'classification':'Admin endpoint','server_authorization_verified':True,'client_callers':['current-admin']}]}
sql=mod.propose(catalog);assert sql.count('security_invoker=true')==4 and 'FROM PUBLIC, anon;' in sql and 'SELECT *' not in sql and 'GRANT SELECT ON public.nh7_library_items ' not in sql
for mutate in [lambda c:c.update(owner_approved=False),lambda c:c['views'][0].update(definition_sha256='bad'),lambda c:c['views'][0].update(catalog_projection=[]),lambda c:c['functions'][0].update(classification='internal helper')]:
 bad=copy.deepcopy(catalog);mutate(bad)
 try:mod.propose(bad)
 except AssertionError:pass
 else:raise AssertionError('unsafe adapter proposal accepted')
assert all(r['disposition'] for r in json.loads((root/'rls-matrix.json').read_text())['tables'])
print('PASS Wave65 all 231 source definer declarations classified (188 names); no fabricated live ACLs; exact four-view projection/fingerprint generator, Admin anon revocation, used-internal caller block, RLS source classifications; live census still required')
