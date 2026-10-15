"""Offline only. Generate exact view/grant proposals from an owner-approved live metadata export.
Never connects/applies. Refuse absent fingerprints, changed projections or unresolved callers.
"""
import hashlib,json,re,sys
VIEWS={'nh7_library_items_v224':'items','nh7_library_items_v251':'items','nh7_library_collections_public_v251':'collections','nh7_library_collections_public_v322':'collections'}
IDENT=re.compile(r'^[a-z_][a-z0-9_]*$')
TYPES={'text','uuid','boolean','integer','bigint','numeric','jsonb','timestamp with time zone','timestamp without time zone','date'}
def propose(catalog):
 assert catalog.get('owner_approved') is True and catalog.get('v396_uid_grant_projection_verified') is True,'live authorization/projection proof required'
 sql=['-- REVIEW ONLY generated from approved metadata. Capture old view definitions/ACLs for rollback.']
 assert {v['name'] for v in catalog['views']}==set(VIEWS),'exactly four captured views required'
 for view in catalog['views']:
  assert hashlib.sha256(view['definition'].encode()).hexdigest()==view['definition_sha256'],'view fingerprint mismatch'
  columns=view['columns'];assert columns and columns==view['catalog_projection'],'view/RPC projection not proven equivalent'
  parts=[]
  for column in columns:
   name,typ=column['name'],column['type'];assert IDENT.fullmatch(name) and typ in TYPES,'unsupported live column requires review'
   assert not re.search('secret|storage_path|access_code|claim_code|password|token',name),'internal column exposure'
   parts.append(f"(item{'->' if typ=='jsonb' else '->>'}'{name}')::{typ} AS \"{name}\"")
  sql.append(f'CREATE OR REPLACE VIEW public.{view["name"]} WITH (security_invoker=true,security_barrier=true) AS SELECT '+', '.join(parts)+f" FROM public.nh7_library_catalog_wave65('{VIEWS[view['name']]}') item;")
  sql.append(f'REVOKE ALL ON public.{view["name"]} FROM PUBLIC, anon; GRANT SELECT ON public.{view["name"]} TO authenticated;')
 for f in catalog.get('functions',[]):
  assert IDENT.fullmatch(f['schema']) and IDENT.fullmatch(f['name']) and not re.search(r"[;'\"$]|--|/\*",f['identity_arguments']),'unsafe function signature'
  assert hashlib.sha256(f['definition'].encode()).hexdigest()==f['definition_sha256'],'function fingerprint mismatch'
  kind=f['classification'];roles=[]
  if kind in ('Admin endpoint','authenticated user endpoint'):
   assert f.get('server_authorization_verified') is True,'server UID/Admin authority proof required';roles=['PUBLIC','anon']
  elif kind in ('internal helper','trigger-only function','migration/maintenance-only function','obsolete compatibility wrapper'):
   assert not f.get('client_callers'),'replacement/caller proof required before revocation';roles=['PUBLIC','anon','authenticated']
  elif kind not in ('authenticated user endpoint','intentional anonymous public endpoint'):raise AssertionError('unclassified function')
  if roles:sql.append(f'REVOKE EXECUTE ON FUNCTION {f["schema"]}.{f["name"]}({f["identity_arguments"]}) FROM '+', '.join(roles)+';')
  if kind in ('Admin endpoint','authenticated user endpoint'):sql.append(f'GRANT EXECUTE ON FUNCTION {f["schema"]}.{f["name"]}({f["identity_arguments"]}) TO authenticated;')
 return '\n'.join(sql)+'\n'
if __name__=='__main__':
 if len(sys.argv)!=2:raise SystemExit('Usage: python3 propose-adapters.py APPROVED_METADATA.json > review-proposal.sql (never auto-apply)')
 print(propose(json.load(open(sys.argv[1]))),end='')
