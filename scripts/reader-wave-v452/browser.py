"""Actual bundled reader text; synthetic storage and blocked external services."""
import json,os,subprocess,threading
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-reader452');OUT.mkdir(exist_ok=True)
ENGINE=os.getenv('QA_ENGINE','chromium');checks=[];errors=[];external=[]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())))
threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
seed={'nh7_lang':'en','nh7_bookmarks':json.dumps(['Psalms 23:1']),
 'nh7_bible_state_JHN_3_16':json.dumps({'saved':False,'note':'Old note 16 — متن با فاصله','highlight':False,'extra':'KEEP'},ensure_ascii=False),
 'nh7_bible_state_JHN_3_17':json.dumps({'saved':False,'note':'Old note 17','extra':'KEEP2'}),
 'nh7_bible_state_PSA_23_1':json.dumps({'saved':True,'note':'Do not touch','highlight':True,'highlightColor':'green'}),
 'nh7_sermon_note_qa-id':'Sermon note with spaces — موعظه','nh7_gratitude_note_7':'Gratitude note unchanged',
 'nh7_note_school-qa':'School note unchanged','nh7_note_private-qa':'Personal note unchanged',
 'nh7_apo_note_v242:tobit:1:1':'Apo original note','nh7_apo_note_v242:tobit:1:2':'Apo second note',
 'nh7_daily_done_word-5':'1','nh7_gratitude_completed':'[1,2,3]','nh7_offline_media_key_v2':'1'}
init="""(()=>{const seed=SEED;if(!localStorage.getItem('qa452-seeded')){Object.entries(seed).forEach(([k,v])=>localStorage.setItem(k,v));localStorage.setItem('qa452-seeded','1')}window.qa452={copies:[],shares:[],copyFail:false,shareCancel:false};Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{if(qa452.copyFail)throw Error('clipboard denied');qa452.copies.push(text)}},configurable:true});document.execCommand=()=>false;Object.defineProperty(navigator,'share',{value:async data=>{if(qa452.shareCancel)throw new DOMException('cancel','AbortError');qa452.shares.push(data)},configurable:true});})()""".replace('SEED',json.dumps(seed,ensure_ascii=False))
def passed(s):checks.append(s);print('PASS',ENGINE,s,flush=True)
def read(p,key):return p.evaluate('(key)=>JSON.parse(localStorage.getItem(key))',key)
def raw(p,key):return p.evaluate('(key)=>localStorage.getItem(key)',key)
def wait(p,expr):
    for _ in range(700):
        if p.evaluate(expr):return
        p.wait_for_timeout(30)
    raise AssertionError('Timed out: '+expr)
def language(p,lang):p.select_option('#langSelect',lang);p.wait_for_timeout(250)
def choose(p,props):
    # Await asynchronous route completion instead of assuming the next view already exists.
    wait(p,"(()=>{const props="+json.dumps(props)+";return [...document.querySelectorAll('[data-go=\"bible\"][data-params]')].some(x=>{const q=JSON.parse(x.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)})})()")
    p.locator('[data-go="bible"][data-params]').evaluate_all('(buttons,props)=>{const b=buttons.find(x=>{const q=JSON.parse(x.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)});if(!b)throw Error("Bible destination missing");b.click()}',props)
def chapter(p):
    p.locator('[data-route="bible"]').click();choose(p,{'section':'written'});choose(p,{'testament':'NT'});choose(p,{'bookId':'JHN','mode':'book'});choose(p,{'mode':'chapter','chapter':3})
    expect(p.locator('#v-16')).to_be_attached();wait(p,'!!window.NH7ReaderSourceV452')
def action(p,name):p.locator('[data-reader-action452='+json.dumps(name)+']').click()
def apo(p):
    # QA approved-state fixture; assert the actual guest gate before simulating approval.
    p.locator('[data-route="bible"]').click()
    if not p.evaluate('NH7AccessV230.isApproved()'):
        p.locator('[data-go="apocrypha"]').click();expect(p.locator('.nh7-access-gate-v230')).to_be_visible()
        p.locator('.nh7-access-close-v230').click();passed('Guest access remains blocked; approved state is synthetic for reader-only testing')
    p.evaluate("sessionStorage.setItem('nh7_content_access_status_v230',JSON.stringify({approved:true,authenticated:true,checked_at:Date.now(),user_email:'reader-qa@example.invalid'}))")
    assert p.evaluate('NH7AccessV230.isApproved()')
    p.locator('[data-route="bible"]').click();p.locator('[data-go="apocrypha"]').click()
    expect(p.locator('[data-rc-apo-book="tobit"]')).to_be_visible();p.locator('[data-rc-apo-book="tobit"]').click()
    expect(p.locator('.nh7-apo-verse[data-apo-verse="1"]')).to_be_attached();expect(p.locator('[data-nh7-apo-save="APO:tobit:1:1"]')).to_be_attached()
def mock(route):
    req=route.request
    if req.url.startswith(BASE+'/'):return route.continue_()
    external.append({'url':req.url,'method':req.method})
    if req.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
    if req.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
    return route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'approved':False,'authenticated':False,'items':[]} if '/functions/' in req.url else []))
with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(**({'args':['--remote-debugging-port=9222']} if ENGINE=='chromium' else {}))
    c=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    c.route('**/*',mock);c.route_web_socket('**/*',lambda ws:ws.close());c.add_init_script(init)
    p=c.new_page();p.set_default_timeout(25000);expect.set_options(timeout=25000)
    p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
    try:
        p.goto(BASE+'/index.html',wait_until='domcontentloaded');p.locator('#amenButton').click()
        wait(p,'!!window.NH7BibleBatchV230 && !!window.NH7ReaderToolbarV452 && !!window.NH7ApoReaderSourceV452')
        if ENGINE=='chromium' and os.getenv('QA_AGENT_BROWSER'):
            result=subprocess.run([os.environ['QA_AGENT_BROWSER'],'--cdp','9222','snapshot','-i'],capture_output=True,text=True,timeout=35)
            (OUT/'agent-browser-snapshot.txt').write_text(result.stdout+'\n'+result.stderr);assert result.returncode==0,result.stderr
        assert not errors,errors;passed('Actual app loads; new scripts valid; interactive app visible')
        for lang,book in [('en','John'),('fa','یوحنا'),('hr','Ivan')]:
            language(p,lang);chapter(p);before=p.locator('.reader-verse .verse-text').all_text_contents()
            p.locator('#v-17 .verse-text').click();p.locator('#v-16 .verse-text').click();assert p.evaluate('NH7ReaderToolbarV452.selected.size')==2
            p.locator('#v-16 .verse-text').click();assert p.evaluate('NH7ReaderToolbarV452.selected.size')==1
            p.locator('#v-16 .verse-text').click();assert p.evaluate('NH7BibleBatchV230.selected.size')==2
            payload=p.evaluate('NH7ReaderToolbarV452.shareText()');lines=payload.split('\n\n');assert lines[0].startswith(book+' '),payload
            assert ('۱۶' if lang=='fa' else '16') in lines[0].split(' — ')[0]
            assert ('۱۷' if lang=='fa' else '17') in lines[1].split(' — ')[0]
            assert payload.count('new-hope7-app/app/')==1
            action(p,'highlight');p.locator('[data-reader-color452="blue"]').click();wait(p,'JSON.parse(localStorage.getItem("nh7_bible_state_JHN_3_16")).highlightColor==="blue"')
            for n in [16,17]:
                assert read(p,f'nh7_bible_state_JHN_3_{n}')['highlightColor']=='blue'
                assert p.locator(f'#v-{n}').evaluate('(n)=>getComputedStyle(n).backgroundColor')=='rgb(207, 232, 255)'
            p.evaluate('qa452.shareCancel=true');action(p,'share');p.wait_for_timeout(100);assert p.evaluate('NH7ReaderToolbarV452.selected.size')==2
            p.evaluate('qa452.shareCancel=false');action(p,'share');wait(p,'NH7ReaderToolbarV452.selected.size===0');assert p.evaluate('qa452.shares.at(-1).text').startswith(book+' ')
            p.locator('#v-16 .verse-text').click();p.evaluate('qa452.copyFail=true');action(p,'copy');p.wait_for_timeout(100);assert p.evaluate('NH7ReaderToolbarV452.selected.size')==1
            p.evaluate('qa452.copyFail=false');action(p,'copy');wait(p,'NH7ReaderToolbarV452.selected.size===0')
            copied=p.evaluate('qa452.copies.at(-1)');assert copied.startswith(book+' ') and 'new-hope7-app/app/' not in copied
            assert before==p.locator('.reader-verse .verse-text').all_text_contents();passed(lang+': selection, localized ordered copy/share, cancellation and real highlight color')
        language(p,'fa');chapter(p);original=[read(p,f'nh7_bible_state_JHN_3_{n}') for n in [16,17]]
        for n in [16,17]:p.locator(f'#v-{n} .verse-text').click()
        action(p,'save');wait(p,'JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:17")');assert 'Psalms 23:1' in read(p,'nh7_bookmarks')
        action(p,'note');expect(p.locator('.nh7-reader-note-dialog452')).to_be_visible();assert p.locator('[data-reader-note-mode452]').input_value()=='append'
        p.locator('[data-reader-note452]').fill('افزوده گروهی با فاصله ۱۲۳');p.locator('[data-reader-note-save452]').click();expect(p.locator('.nh7-reader-note-dialog452')).to_have_count(0)
        for index,n in enumerate([16,17]):
            value=read(p,f'nh7_bible_state_JHN_3_{n}');assert value['note']==original[index]['note']+'\n\nافزوده گروهی با فاصله ۱۲۳';assert value['extra']==original[index]['extra']
        action(p,'close');passed('Batch save and append-note preserve previous notes, other bookmarks and unknown fields')
        for lang in ['fa','en','hr']:
            language(p,lang);apo(p);before=p.locator('.nh7-apo-verse-text').all_text_contents()
            for n in [1,2]:p.locator(f'.nh7-apo-verse[data-apo-verse="{n}"] .nh7-apo-verse-main').click()
            assert p.evaluate('NH7ReaderToolbarV452.selected.size')==2
            p.locator('.nh7-apo-verse[data-apo-verse="1"] .nh7-apo-verse-main').click();assert p.evaluate('NH7ReaderToolbarV452.selected.size')==1
            p.locator('.nh7-apo-verse[data-apo-verse="1"] .nh7-apo-verse-main').click()
            action(p,'highlight');p.locator('[data-reader-color452="blue"]').click();wait(p,'localStorage.getItem("nh7_apo_highlight_color_v244:tobit:1:2")==="blue"')
            action(p,'save');p.wait_for_timeout(100)
            if 'APO:tobit:1:1' not in read(p,'nh7_bookmarks'):action(p,'save')
            wait(p,'JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("APO:tobit:1:2")')
            action(p,'note');p.locator('[data-reader-note452]').fill('Group '+lang+' با فاصله');p.locator('[data-reader-note-save452]').click();expect(p.locator('.nh7-reader-note-dialog452')).to_have_count(0)
            assert 'Group '+lang+' با فاصله' in raw(p,'nh7_apo_note_v242:tobit:1:1')
            expected=p.locator('.nh7-apo-reader-head h2').inner_text();text=p.evaluate('NH7ReaderToolbarV452.shareText()');assert text.startswith(expected+' ') and text.count('new-hope7-app/app/')==1
            p.screenshot(path=str(OUT/f'{ENGINE}-{lang}-apocrypha-toolbar.png'))
            action(p,'copy');wait(p,'NH7ReaderToolbarV452.selected.size===0');assert before==p.locator('.nh7-apo-verse-text').all_text_contents()
            passed(lang+': shared Apocrypha toolbar, multiple actions and unchanged continuous text')
        language(p,'fa');p.locator('[data-route="home"]').click();p.locator('[data-toggle-panel="notesPanel"]').click()
        expect(p.locator('#notesPanel .nh7-note-category-v452')).to_have_count(6)
        for key in ['bible','apocrypha','audio','school','gratitude','other']:expect(p.locator(f'[data-reader-group452="notes:{key}"]')).to_be_visible()
        p.locator('[data-reader-group452="notes:bible"] summary').click();expect(p.locator('[data-reader-group452="notes:bible"] .nh7-my-note-head-v234 strong').filter(has_text='یوحنا')).to_have_count(2)
        p.locator('[data-reader-group452="notes:apocrypha"] summary').click();p.screenshot(path=str(OUT/f'{ENGINE}-note-categories.png'))
        p.locator('[data-toggle-panel="savedVersesPanel"]').click();expect(p.locator('#savedVersesPanel .nh7-saved-groups452')).to_be_visible()
        groups=p.locator('#savedVersesPanel details');assert groups.count()>=3
        for i in range(groups.count()):
            if 'یوحنا' in groups.nth(i).locator('summary').inner_text():groups.nth(i).locator('summary').click();break
        remove=p.locator('[data-delete-bookmark="John 3:16"]');expect(remove).to_be_visible();saved_note=read(p,'nh7_bible_state_JHN_3_16')['note'];remove.click()
        wait(p,'!JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:16")');assert read(p,'nh7_bible_state_JHN_3_16')['saved'] is False
        assert read(p,'nh7_bible_state_JHN_3_16')['note']==saved_note;passed('Six localized note categories; saved book groups; unsave retains notes')
        p.reload(wait_until='domcontentloaded');p.locator('#amenButton').click();chapter(p);assert read(p,'nh7_bible_state_JHN_3_16')['note']==saved_note
        assert raw(p,'nh7_apo_note_v242:tobit:1:1').startswith('Apo original note')
        for key in ['nh7_bible_state_PSA_23_1','nh7_sermon_note_qa-id','nh7_gratitude_note_7','nh7_note_school-qa','nh7_note_private-qa','nh7_daily_done_word-5','nh7_gratitude_completed']:assert raw(p,key)==seed[key],key
        p.locator('#v-16 .verse-text').click()
        for width in [320,390,768,1280]:
            p.set_viewport_size({'width':width,'height':844});p.wait_for_timeout(100);box=p.locator('#nh7ReaderToolbar452').bounding_box()
            assert box and box['x']>=0 and box['x']+box['width']<=width+1 and box['height']<=125,box
            assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
        p.set_viewport_size({'width':390,'height':844});p.screenshot(path=str(OUT/f'{ENGINE}-bible-toolbar-light.png'))
        p.evaluate('document.documentElement.dataset.nh7Theme="dark"');p.screenshot(path=str(OUT/f'{ENGINE}-bible-toolbar-dark.png'));action(p,'close')
        passed('Reload persistence, unchanged unrelated data and four viewport sizes')
        for route in ['daily','plans','school','more','home']:
            p.locator('[data-route='+json.dumps(route)+']').click();p.wait_for_timeout(250);assert len(p.locator('#view').inner_text())>10
        assert not errors,errors;passed('Existing primary routes render; zero uncaught page errors')
        report={'status':'passed','browser':ENGINE,'checks':checks,'pageErrors':errors,'actualExternalAPIRequests':0,'mockedExternalRequests':len(external),'productionDatabaseChanges':0,'nativeDeviceTest':False,'realCloudSyncTest':False,'mockedApprovedReaderState':True}
        (OUT/f'{ENGINE}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    except Exception as e:
        p.screenshot(path=str(OUT/f'{ENGINE}-failure.png'),full_page=True)
        (OUT/f'{ENGINE}-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'pageErrors':errors,'body':p.locator('body').inner_text()[:18000]},ensure_ascii=False,indent=2));raise
    finally:c.close();browser.close();server.shutdown()
