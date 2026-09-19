"""Fresh browser, synthetic identity, all account traffic fulfilled locally. No real account used."""
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from urllib.parse import urlparse
import json,os,threading
from playwright.sync_api import sync_playwright,expect
OUT=Path(os.environ.get('QA_OUTPUT','qa-nav456'));OUT.mkdir(exist_ok=True,parents=True)
LIVE=os.getenv('QA_LIVE_URL','').rstrip('/');ENGINE=os.getenv('QA_ENGINE','chromium')
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())))
threading.Thread(target=server.serve_forever,daemon=True).start();BASE=LIVE or f'http://127.0.0.1:{server.server_port}'
requests=[];errors=[];alerts=[];checks=[]
def passed(text):checks.append(text);print('PASS ACCOUNT',ENGINE,text,flush=True)
def wait(p,expression):
 for _ in range(750):
  if p.evaluate(expression):return
  p.wait_for_timeout(30)
 raise AssertionError('Timeout: '+expression)
def intercept(route):
 r=route.request
 if r.url.startswith(BASE+'/'):return route.continue_()
 path=urlparse(r.url).path
 requests.append({'path':path,'method':r.method})
 if path=='/auth/v1/token':
  payload=json.loads(r.post_data);assert payload['email']=='navigation-qa@example.invalid' and payload['password']=='synthetic-not-real-456'
  return route.fulfill(status=400,content_type='application/json',body=json.dumps({'code':'invalid_credentials','message':'Invalid login credentials'}))
 if path=='/functions/v1/nh7-claim-legacy-auth':
  return route.fulfill(status=409,content_type='application/json',body=json.dumps({'code':'ACCOUNT_EXISTS','error':'Account exists'}))
 if path=='/auth/v1/recover':
  assert json.loads(r.post_data)['email']=='navigation-qa@example.invalid'
  return route.fulfill(status=200,content_type='application/json',body='{}')
 if r.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
 if r.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
 return route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'approved':False,'authenticated':False,'items':[]} if '/functions/' in path else []))
INIT="""(()=>{if(!/^https?:/.test(location.protocol))return;if(!localStorage.getItem('qa456-account-seeded')){localStorage.setItem('nh7_lang','en');localStorage.setItem('nh7_offline_media_key_v2','1');localStorage.setItem('nh7_note_account_keep','KEEP MY NOTE');localStorage.setItem('qa456-account-seeded','1')}})();"""
with sync_playwright() as pw:
 b=getattr(pw,ENGINE).launch();c=b.new_context(service_workers='block',viewport={'width':390,'height':844});c.route('**/*',intercept);c.route_web_socket('**/*',lambda ws:ws.close());c.add_init_script(INIT)
 p=c.new_page();expect.set_options(timeout=25000);p.set_default_timeout(25000);p.on('pageerror',lambda e:errors.append(str(e)))
 def dialog(d):alerts.append(d.message);d.accept()
 p.on('dialog',dialog)
 try:
  p.goto(BASE+'/index.html',wait_until='domcontentloaded');p.locator('#amenButton').click();expect(p.locator('#nh7HeaderDate455')).to_be_visible()
  assert p.evaluate('!window.NH7_NAVIGATION_PREVIEW && !window.NH7_STUDY_PREVIEW && !window.NH7_READER_PREVIEW')
  p.locator('[data-route="more"]').click();expect(p.locator('[data-more-navigation456]')).to_be_visible()
  expect(p.locator('.nh7-navigation-guide456,[data-nav-location456]')).to_have_count(0)
  p.locator('[data-more-navigation456] [data-go="account"]').click();expect(p.locator('#accountEmail')).to_be_visible();expect(p.locator('#signInBtn')).to_be_enabled()
  passed('Main entry and Account form load with no Preview guards or location guide')
  p.fill('#accountEmail','navigation-qa@example.invalid');p.fill('#accountPassword','synthetic-not-real-456');p.locator('#signInBtn').click()
  for _ in range(250):
   if alerts:break
   p.wait_for_timeout(40)
  assert alerts and not any('cloud disabled' in x.lower() for x in alerts),alerts
  assert any(r['path']=='/auth/v1/token' and r['method']=='POST' for r in requests)
  assert any(r['path']=='/functions/v1/nh7-claim-legacy-auth' for r in requests)
  assert 'incorrect' in alerts[-1].lower(),alerts
  passed('Sign-in and legacy account handling reach mocked cloud endpoints, not Cloud disabled')
  p.locator('#forgotPasswordToggle').click();p.fill('#resetEmail','navigation-qa@example.invalid');p.locator('#resetPasswordBtn').click()
  expect(p.locator('#resetMsg')).not_to_have_text('')
  assert any(r['path']=='/auth/v1/recover' and r['method']=='POST' for r in requests)
  assert not any('cloud disabled' in x.lower() for x in alerts)
  passed('Password recovery retains its existing endpoint; no real email was sent')
  # Pre-existing synthetic session: exercise Account presentation, not server authentication.
  p.evaluate("""(()=>{const data={access_token:'synthetic.'+btoa(JSON.stringify({exp:4102444800})) +'.invalid-signature',expires_at:4102444800,user:{id:'qa-only',email:'navigation-qa@example.invalid',user_metadata:{full_name:'QA User'}}};localStorage.setItem('nh7_user_session_v170',JSON.stringify(data));window.qa456Session=localStorage.getItem('nh7_user_session_v170')})()""")
  p.locator('[data-route="home"]').click();p.locator('[data-route="more"]').click();p.locator('[data-more-navigation456] [data-go="account"]').click()
  expect(p.locator('#logoutAccountBtn')).to_be_visible();expect(p.locator('#view')).to_contain_text('navigation-qa@example.invalid')
  session=p.evaluate('localStorage.getItem("nh7_user_session_v170")')
  p.reload(wait_until='domcontentloaded');p.locator('#amenButton').click();p.locator('[data-route="more"]').click();p.locator('[data-go="account"]').click();expect(p.locator('#logoutAccountBtn')).to_be_visible()
  assert p.evaluate('localStorage.getItem("nh7_user_session_v170")')==session
  assert p.evaluate('localStorage.getItem("nh7_note_account_keep")')=='KEEP MY NOTE'
  passed('Existing synthetic account session and unrelated note survive navigation and reload')
  assert not errors,errors
  p.screenshot(path=str(OUT/f'{ENGINE}-account-form.png'))
  (OUT/f'{ENGINE}-account-report.json').write_text(json.dumps({'status':'passed','checks':checks,'entry':BASE+'/index.html','requestsMocked':requests,'pageErrors':errors,'realLoginPerformed':False,'realEmailsSent':0,'actualExternalAPICalls':0,'productionDataWrites':0},indent=2))
 except Exception as e:
  p.screenshot(path=str(OUT/f'{ENGINE}-account-failure.png'),full_page=True);(OUT/f'{ENGINE}-account-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'pageErrors':errors,'alerts':alerts,'requests':requests,'body':p.locator('body').inner_text()[:8000]},indent=2));raise
 finally:c.close();b.close();server.shutdown()
