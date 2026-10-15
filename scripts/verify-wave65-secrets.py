"""Role-aware client/repository exposure guard. Prints filenames/categories only, never matching values."""
import base64,json,re,subprocess,sys
from pathlib import Path

def findings(text):
 result=[]
 patterns={'private-key':r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----',
 'privileged-publishable-lookalike':r'\bsb_secret_[A-Za-z0-9_-]{12,}',
 'database-credential':r'postgres(?:ql)?://[^\s/:]+:[^\s/@]{4,}@',
 'provider-secret':r'\b(?:sk_live_|sk-proj-|ghp_|github_pat_)[A-Za-z0-9_-]{20,}',
 'turnstile-secret':r'\b0x[A-Za-z0-9_-]{30,}'}
 for category,pattern in patterns.items():
  if re.search(pattern,text):result.append(category)
 for match in re.finditer(r'\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+',text):
  try:
   part=match[0].split('.')[1];payload=json.loads(base64.urlsafe_b64decode(part+'='*((4-len(part)%4)%4)))
   if payload.get('role') in ('service_role','supabase_admin','supabase_auth_admin'):result.append('privileged-JWT')
  except (ValueError,UnicodeError):pass
 # Literal secret assignments; variable/env wiring and empty/synthetic fixtures are not credentials.
 for m in re.finditer(r'(?:service_role_key|database_password|turnstile_secret|onesignal_rest_api_key|private_admin_token)\s*[=:]\s*[\'\"]([^\'\"\n]{12,})',text,re.I):
  if not re.match(r'(?:fixture|synthetic|example|process\.|Deno\.|\$\{|<)',m[1],re.I):result.append('literal-server-secret')
 return sorted(set(result))

def main():
 files=set(subprocess.check_output(['git','ls-files']).decode().splitlines())|set(subprocess.check_output(['git','ls-files','--others','--exclude-standard']).decode().splitlines());bad=[];count=0;public=0
 for file in sorted(files):
  p=Path(file)
  if not p.is_file():continue
  try:text=p.read_text()
  except (UnicodeError,OSError):continue
  count+=1;public+=text.count('sb_publishable_')
  for category in findings(text):bad.append(file+': '+category)
 assert not bad,'Forbidden exposure (values redacted):\n'+'\n'.join(bad)
 assert findings('key='+('sb_'+'secret_')+'A'*32)==['privileged-publishable-lookalike']
 payload=base64.urlsafe_b64encode(json.dumps({'role':'service_role'}).encode()).decode().rstrip('=')
 assert findings('eyJhbGciOiJIUzI1NiJ9.'+payload+'.fixture')==['privileged-JWT']
 assert not findings('sb_publishable_browser_key')
 print(f'PASS Wave65 secret scan: {count} text files; {public} public publishable references permitted; no privileged JWT/database/provider/private key literals; synthetic negative detectors pass. Not a full git-history/provider-log scan.')
if __name__=='__main__':main()
