"""Verify the dedicated Preview, locally or through its immutable public URL."""
import json,os,threading
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-reader452');OUT.mkdir(exist_ok=True);server=None
url=os.getenv('QA_PREVIEW_URL','');public=bool(url);stage='public-preview' if public else 'local-preview'
if not url:
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())))
    threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/reader-preview.html'
errors=[];requests=[]
def wait(p,expr):
    for _ in range(1000):
        if p.evaluate(expr):return
        p.wait_for_timeout(40)
    raise AssertionError('Timed out: '+expr)
def choose(p,props):
    test="(()=>{const props="+json.dumps(props)+";return [...document.querySelectorAll('[data-go=\"bible\"][data-params]')].some(x=>{const q=JSON.parse(x.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)})})()"
    wait(p,test)
    p.locator('[data-go="bible"][data-params]').evaluate_all('(buttons,props)=>buttons.find(x=>{const q=JSON.parse(x.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)}).click()',props)
with sync_playwright() as pw:
    browser=pw.chromium.launch();context=browser.new_context(viewport={'width':390,'height':844})
    context.add_init_script("""(()=>{if(!location.pathname.endsWith('/reader-preview.html'))return;window.qaPreviewRaw=localStorage;localStorage.setItem('nh7_bookmarks','[\"Unrelated saved data\"]');localStorage.setItem('nh7_note_unrelated','DO NOT TOUCH');window.qaPreviewCopies=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>qaPreviewCopies.push(text)},configurable:true});})();""")
    context.on('page',lambda p:p.on('pageerror',lambda e:errors.append(str(e))))
    context.on('request',lambda r:requests.append({'url':r.url,'method':r.method}))
    p=context.new_page();p.set_default_timeout(60000);expect.set_options(timeout=60000)
    try:
        response=p.goto(url,wait_until='domcontentloaded',timeout=90000);assert response and response.status==200
        notice=p.get_by_text('Open the page',exact=True);gateway=False
        if notice.count() and notice.is_visible():
            gateway=True
            if notice.get_attribute('target')=='_blank':
                with context.expect_page() as opened:notice.click()
                p=opened.value
            else:notice.click()
            expect(p.locator('#amenButton')).to_be_visible()
            requests.clear();errors.clear();response=p.reload(wait_until='domcontentloaded',timeout=90000)
        expect(p.locator('#amenButton')).to_be_visible();p.locator('#amenButton').click();wait(p,'!!window.NH7ReaderToolbarV452 && !!window.NH7ApoReaderSourceV452')
        assert p.evaluate('window.NH7_READER_PREVIEW') is True
        assert p.evaluate('localStorage.getItem("nh7_note_unrelated")') is None
        p.locator('[data-route="bible"]').click();choose(p,{'section':'written'});choose(p,{'testament':'NT'});choose(p,{'bookId':'JHN','mode':'book'});choose(p,{'mode':'chapter','chapter':3})
        expect(p.locator('#v-16')).to_be_attached()
        for n in [16,17]:p.locator(f'#v-{n} .verse-text').click()
        assert p.evaluate('NH7ReaderToolbarV452.selected.size')==2
        p.locator('[data-reader-action452="save"]').click()
        wait(p,'JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:17")')
        p.locator('[data-reader-action452="note"]').click();p.locator('[data-reader-note452]').fill('یادداشت آزمایشی Preview');p.locator('[data-reader-note-save452]').click();expect(p.locator('.nh7-reader-note-dialog452')).to_have_count(0)
        p.screenshot(path=str(OUT/f'{stage}-bible.png'))
        assert p.evaluate('NH7ReaderToolbarV452.shareText()').count('new-hope7-app/app/')==1
        p.locator('[data-reader-action452="copy"]').click();wait(p,'NH7ReaderToolbarV452.selected.size===0')
        assert p.evaluate('qaPreviewCopies.at(-1)').startswith('یوحنا ')
        p.locator('[data-route="bible"]').click();p.locator('[data-go="apocrypha"]').click();p.locator('[data-rc-apo-book="tobit"]').click()
        expect(p.locator('[data-nh7-apo-save="APO:tobit:1:1"]')).to_be_attached()
        for n in [1,2]:p.locator(f'.nh7-apo-verse[data-apo-verse="{n}"] .nh7-apo-verse-main').click()
        p.locator('[data-reader-action452="highlight"]').click();p.locator('[data-reader-color452="green"]').click();wait(p,'localStorage.getItem("nh7_apo_highlight_color_v244:tobit:1:2")==="green"')
        p.locator('[data-reader-action452="note"]').click();p.locator('[data-reader-note452]').fill('یادداشت آزمایشی اپوکریفا');p.locator('[data-reader-note-save452]').click();expect(p.locator('.nh7-reader-note-dialog452')).to_have_count(0)
        p.locator('[data-reader-action452="close"]').click();p.locator('[data-route="home"]').click();p.locator('[data-toggle-panel="notesPanel"]').click()
        expect(p.locator('[data-reader-group452="notes:bible"]')).to_be_visible();expect(p.locator('[data-reader-group452="notes:apocrypha"]')).to_be_visible()
        p.locator('[data-reader-group452="notes:apocrypha"] summary').click();p.screenshot(path=str(OUT/f'{stage}-notes.png'))
        assert p.evaluate('qaPreviewRaw.getItem("nh7_note_unrelated")')=='DO NOT TOUCH'
        assert p.evaluate('qaPreviewRaw.getItem("nh7_bookmarks")')=='["Unrelated saved data"]'
        assert p.evaluate('qaPreviewRaw.getItem("nh7_preview_reader_v452:nh7_bible_state_JHN_3_16")')
        assert p.evaluate('fetch(location.href,{method:"POST"}).then(()=>false,()=>true)')
        assert p.evaluate('fetch("https://example.invalid/blocked").then(()=>false,()=>true)')
        assert p.evaluate('navigator.serviceWorker.getRegistrations().then(r=>r.length)')==0
        assert not errors,errors
        foreign=[r for r in requests if urlparse(r['url']).hostname!=urlparse(p.url).hostname];assert not foreign,foreign
        assert all(r['method'] in ['GET','HEAD'] for r in requests)
        report={'status':'passed','url':url,'resolvedUrl':p.url,'httpStatus':response.status,'hostingNoticeShown':gateway,'checks':['Actual Bible and Apocrypha toolbar works','Localized copy contains Persian reference and text','Batch notes show in their source categories','Existing unprefixed stored data remains unchanged','New changes use isolated Preview namespace','POST and external fetch blocked','No service worker registered','No external application requests','No uncaught page errors'],'pageErrors':errors,'requests':requests}
        (OUT/f'{stage}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
    except Exception as error:
        p.screenshot(path=str(OUT/f'{stage}-failure.png'),full_page=True)
        (OUT/f'{stage}-failure.json').write_text(json.dumps({'error':str(error),'pageErrors':errors,'body':p.locator('body').inner_text()[:10000],'requests':requests},ensure_ascii=False,indent=2));raise
    finally:context.close();browser.close()
if server:server.shutdown()
