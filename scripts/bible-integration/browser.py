"""Full unmodified app entry, synthetic account data, all external traffic mocked."""
import os,json,traceback,subprocess,base64,time
from pathlib import Path
from functools import partial
from threading import Thread
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright,expect
ROOT=Path.cwd();OUT=Path(os.environ['QA_OUTPUT']);OUT.mkdir(parents=True,exist_ok=True)
MODE=os.environ.get('QA_MODE','candidate');ENGINE=os.environ.get('QA_ENGINE','chromium')
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
checks=[];errors=[];mocked=[];responses=[]
def passed(s):checks.append(s);print('PASS',s,flush=True)
def value(p,k):return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',k)
def wait(p,expr):
    for _ in range(300):
        if p.evaluate(expr):return
        p.wait_for_timeout(30)
    raise AssertionError('Timed out: '+expr)
def written(p):
    p.locator('[data-route="bible"]').click();p.locator('[data-go="bible"][data-params=\'{"section":"written"}\']').click();expect(p.locator('#bibleSearch')).to_be_visible()
def keywords(p):
    written(p);p.locator('[data-go="bible"][data-params*="keywords"]').click();expect(p.locator('#bibleKeywordFilter')).to_be_visible()
def chapter(p):
    written(p)
    for fragment in ['"testament":"NT"','"bookId":"JHN"','"chapter":3}']:
        p.locator('[data-go="bible"][data-params*='+json.dumps(fragment)+']').click()
    expect(p.locator('#v-16')).to_be_attached()
seed={
 'nh7_lang':'en','nh7_bookmarks':json.dumps(['John 3:16','Psalms 23:1']),
 'nh7_bible_state_JHN_3_16':json.dumps({'saved':True,'note':'یادداشت پیشین با فاصله ۱۲۳','highlight':True,'highlightColor':'blue','extraField':'KEEP'},ensure_ascii=False),
 'nh7_bible_state_PSA_23_1':json.dumps({'saved':True,'note':'Unrelated note','highlight':True,'highlightColor':'green'}),
 'nh7_personal_note_qa':'یادداشت شخصی تغییر نکند','nh7_sermon_note_qa':'موعظه با فاصله و ۱۲۳',
 'nh7_gratitude_note_7':'Gratitude note unchanged','nh7_offline_media_key_v2':'1'
}
INIT="""(()=>{const seed=__SEED__;if(!localStorage.getItem('qa_integration_seeded')){for(const [k,v] of Object.entries(seed))localStorage.setItem(k,v);localStorage.setItem('qa_integration_seeded','1');}window.__qaShared=[];Object.defineProperty(navigator,'share',{value:async d=>window.__qaShared.push(d),configurable:true});window.__qaWrites=[];const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.__qaWrites.push({key:k,value:String(v)});return old.call(this,k,v)};})()""".replace('__SEED__',json.dumps(seed,ensure_ascii=False))
def intercept(route):
    r=route.request;u=urlparse(r.url)
    if r.url.startswith(BASE+'/'):
        if r.method not in ['GET','HEAD']:raise AssertionError('Unexpected local write')
        return route.continue_()
    record={'url':r.url,'method':r.method}
    if r.post_data:
        try:record['body']=json.loads(r.post_data)
        except Exception:record['body']='non-json'
    mocked.append(record)
    if r.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
    if r.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
    body=[]
    if '/functions/v1/' in u.path:
        body={'ok':True,'authenticated':False,'approved':False,'items':[]}
        if isinstance(record.get('body'),dict) and record['body'].get('action')=='save_bible_batch':body={'ok':True}
    if '/auth/v1/' in u.path:body={'error':'synthetic test account only'}
    return route.fulfill(status=200,content_type='application/json',body=json.dumps(body),headers={'Access-Control-Allow-Origin':'*'})
with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(**({'args':['--remote-debugging-port=9222']} if ENGINE=='chromium' and MODE=='candidate' else {}))
    context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    context.route('**/*',intercept);context.route_web_socket('**/*',lambda ws:ws.close())
    context.add_init_script(INIT)
    page=context.new_page();page.set_default_timeout(25000);expect.set_options(timeout=25000)
    page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
    page.on('response',lambda r:responses.append({'url':r.url,'status':r.status}))
    try:
        response=page.goto(BASE+'/index.html',wait_until='domcontentloaded')
        assert response.status==200
        expect(page.locator('#amenButton')).to_be_visible();page.locator('#amenButton').click()
        expect(page.locator('#view .card').first).to_be_visible();page.wait_for_timeout(500)
        assert not page.evaluate('!!window.NH7_BIBLE_PREVIEW')
        assert not page.locator('.nh7-preview-notice').count()
        assert not page.evaluate('Object.keys(localStorage).some(k=>k.startsWith("nh7_preview_bible_"))')
        passed('Actual index.html boots with all app modules; no Preview guards or storage namespace')
        if ENGINE=='chromium' and MODE=='candidate' and os.environ.get('QA_AGENT_BROWSER'):
            cmd=[os.environ['QA_AGENT_BROWSER'],'--cdp','9222','snapshot','-i']
            result=subprocess.run(cmd,capture_output=True,text=True,timeout=35)
            (OUT/'agent-browser-snapshot.txt').write_text(result.stdout+'\n'+result.stderr)
            assert result.returncode==0,result.stderr
            passed('agent-browser independently sees interactive app controls')
        for k in seed:
            if k not in ['nh7_lang','nh7_offline_media_key_v2']:
                assert page.evaluate('(k)=>localStorage.getItem(k)',k)==seed[k],k
        passed('Existing synthetic Bible, personal, sermon and gratitude notes unchanged at startup')
        for route in ['daily','plans','school','more','home']:
            page.locator('[data-route='+json.dumps(route)+']').click()
            expect(page.locator('#view')).not_to_have_text('...')
            page.wait_for_timeout(400)
            text=page.locator('#view').inner_text();assert len(text)>10,(route,text)
            assert not page.locator('#view h2').filter(has_text='Error').count(),(route,text)
        page.locator('[data-route="more"]').click()
        settings=page.locator('[data-go="settings"]')
        if settings.count():settings.first.click();expect(page.locator('#view')).not_to_have_text('...')
        passed('Home, Daily, Plans, School, More and available Settings render')
        chapter(page)
        assert value(page,'nh7_bible_state_JHN_3_16')['note']=='یادداشت پیشین با فاصله ۱۲۳'
        expect(page.locator('#v-16.verse-selected')).to_have_count(0)
        if MODE=='candidate':
            for lang,query in [('fa','خداوند'),('en','lord'),('hr','gospod')]:
                page.select_option('#langSelect',lang);keywords(page)
                expect(page.locator('[data-bible-keyword]')).to_have_count(120)
                page.locator('#bibleKeywordMore').click();expect(page.locator('[data-bible-keyword]')).to_have_count(240)
                page.fill('#bibleKeywordFilter',query);page.locator('[data-bible-keyword='+json.dumps(query,ensure_ascii=False)+']').click()
                expect(page.locator('[data-bible-hit]')).to_have_count(200)
                page.locator('#bibleSearchMore').click();expect(page.locator('[data-bible-hit]')).to_have_count(400)
                page.locator('#view .nh7-step-back button').click();expect(page.locator('#bibleKeywordFilter')).to_have_value(query)
                passed(lang+': keyword search, pagination and back state work inside full app')
            page.select_option('#langSelect','en');written(page)
            page.fill('#bibleSearch','For God so loved');page.press('#bibleSearch','Enter')
            expect(page.locator('[data-bible-hit]')).to_have_count(1);page.locator('[data-bible-hit]').click()
            expect(page.locator('#v-16.saved-focus')).to_be_attached()
            assert page.locator('#v-16 .verse-text').inner_text().startswith('For God so loved')
            passed('Enter search opens exact John 3:16 with clean verse numbering')
            key='nh7_bible_state_JHN_3_16';initial=value(page,key)
            def clear():page.evaluate('window.NH7BibleBatchV230.clearSelection()')
            v=page.locator('#v-16');clear();v.locator('.verse-text').click();v.locator('[data-bookmark]').click()
            wait(page,'!JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:16")')
            now=value(page,key);assert now['saved'] is False
            assert all(now[x]==initial[x] for x in ['note','highlight','highlightColor','extraField'])
            v.locator('[data-bookmark]').click();wait(page,'JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:16")')
            clear();v.locator('.verse-text').click();v.locator('[data-clear-bible-selection]').click()
            assert page.evaluate('window.NH7BibleBatchV230.selected.size')==0
            expect(v.locator('.verse-tools')).to_be_hidden()
            clear();v.locator('.verse-text').click();v.locator('[data-share-verse]').click()
            wait(page,'window.__qaShared.length===1 && window.NH7BibleBatchV230.selected.size===0')
            passed('Single save/unsave, cancel and mocked share preserve note and highlight')
            for n in [16,17]:page.locator(f'#v-{n} .verse-text').click()
            assert page.evaluate('window.NH7BibleBatchV230.selected.size')==2
            page.locator('#v-17 [data-bookmark]').click();wait(page,'JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:17")')
            page.locator('#v-17 [data-bookmark]').click();wait(page,'!JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:17")')
            assert value(page,key)['note']==initial['note'];assert 'Psalms 23:1' in value(page,'nh7_bookmarks')
            queue=value(page,'nh7_bible_batch_queue_v230');assert len(queue)>=2
            assert all(x['saved'] is False for x in queue[-1]['items'])
            passed('Multi save/unsave queues existing cloud contract; unrelated notes preserved')
            clear();v.locator('.verse-text').click();v.locator('[data-note-verse]').click()
            v.locator('textarea').fill('یادداشت جدید با فاصله و عدد ۱۲۳');v.locator('[data-save-verse-note]').click()
            assert value(page,key)['note']=='یادداشت جدید با فاصله و عدد ۱۲۳'
            page.reload(wait_until='domcontentloaded');expect(page.locator('#amenButton')).to_be_visible();page.locator('#amenButton').click();chapter(page)
            assert value(page,key)['note']=='یادداشت جدید با فاصله و عدد ۱۲۳'
            for k in ['nh7_bible_state_PSA_23_1','nh7_personal_note_qa','nh7_sermon_note_qa','nh7_gratitude_note_7']:
                assert page.evaluate('(k)=>localStorage.getItem(k)',k)==seed[k],k
            passed('Edited verse note persists on reload; other data remains byte-identical')
            for lang in ['fa','en','hr']:
                page.select_option('#langSelect',lang);chapter(page);clear();page.locator('#v-16 .verse-text').click();page.wait_for_timeout(300)
                box=page.locator('#v-16 .verse-tools').bounding_box()
                assert box and box['height']<=130 and box['x']>=-1 and box['x']+box['width']<=391,box
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                page.screenshot(path=str(OUT/f'{ENGINE}-{lang}-chapter.png'))
            passed('FA/EN/HR mobile toolbar stays within viewport')
            for width in [320,390,768,1280]:
                page.set_viewport_size({'width':width,'height':900});keywords(page)
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
            page.screenshot(path=str(OUT/f'{ENGINE}-keywords-desktop.png'))
            passed('Keyword layout fits 320, 390, 768 and 1280 pixel widths')
        missing=[r for r in responses if r['url'].startswith(BASE+'/') and r['status']>=400]
        assert not missing,missing;assert not errors,errors
        passed('No missing local assets and no uncaught browser errors; all external requests intercepted')
        report={'status':'passed','mode':MODE,'browser':ENGINE,'checks':checks,'pageErrors':errors,'mockedExternalRequests':len(mocked),'actualExternalRequests':0,'databaseChanges':0,'realAccountTest':False,'nativeDeviceTest':False,'serviceWorkers':'blocked in UI test; separate cache unit test','networkMocks':mocked}
        (OUT/f'{MODE}-{ENGINE}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    except Exception as e:
        page.screenshot(path=str(OUT/f'{MODE}-{ENGINE}-failure.png'),full_page=True)
        (OUT/f'{MODE}-{ENGINE}-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'pageErrors':errors,'body':page.locator('body').inner_text()[:14000],'mocked':mocked},ensure_ascii=False,indent=2))
        raise
    finally:
        context.close();browser.close();server.shutdown()
