"""Dedicated Preview verification. No real account access or production writes."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from urllib.parse import urlparse
import json,os,threading
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-study453');OUT.mkdir(exist_ok=True);url=os.getenv('QA_PREVIEW_URL','');stage='public' if url else 'local';server=None;errors=[];requests=[]
if not url:
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())))
    threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/study-preview.html'
def wait(p,expr):
    for _ in range(1100):
        if p.evaluate(expr):return
        p.wait_for_timeout(40)
    raise AssertionError('Timeout: '+expr)
def choose(p,props):
    wait(p,"(()=>{const props="+json.dumps(props)+";return [...document.querySelectorAll('[data-go=\"bible\"][data-params]')].some(b=>{const q=JSON.parse(b.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)})})()")
    p.locator('[data-go="bible"][data-params]').evaluate_all('(buttons,props)=>buttons.find(b=>{const q=JSON.parse(b.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)}).click()',props)
with sync_playwright() as pw:
    browser=pw.chromium.launch();c=browser.new_context(viewport={'width':390,'height':844})
    c.add_init_script("""(()=>{if(!location.pathname.endsWith('/study-preview.html'))return;window.qaRaw453=localStorage;localStorage.setItem('nh7_note_outside453','DO NOT TOUCH');localStorage.setItem('nh7_theme_studio_v453','OUTSIDE THEME');window.qaCopies453=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>qaCopies453.push(t)},configurable:true});})();""")
    c.on('page',lambda p:p.on('pageerror',lambda e:errors.append(str(e))));c.on('request',lambda r:requests.append({'url':r.url,'method':r.method}));p=c.new_page();p.set_default_timeout(60000);expect.set_options(timeout=60000)
    try:
        response=p.goto(url,wait_until='domcontentloaded',timeout=90000);assert response and response.status==200
        notice=p.get_by_text('Open the page',exact=True);gateway=False
        if notice.count() and notice.is_visible():
            gateway=True
            if notice.get_attribute('target')=='_blank':
                with c.expect_page() as new:notice.click()
                p=new.value
            else:notice.click()
            expect(p.locator('#amenButton')).to_be_visible();requests.clear();errors.clear();p.reload(wait_until='domcontentloaded',timeout=90000)
        p.locator('#amenButton').click();wait(p,'!!window.NH7OriginalLanguageV453 && !!window.NH7ThemeStudioV453 && !!window.NH7ApoReaderSourceV452')
        assert p.evaluate('window.NH7_STUDY_PREVIEW') is True
        assert p.evaluate('localStorage.getItem("nh7_note_outside453")') is None
        p.locator('.nh7-study-preview-banner453 [data-go="settings"]').click();expect(p.locator('#nh7ThemeStudio453')).to_be_visible()
        p.locator('[data-studio-preset453="sepia"]').click();p.locator('.nh7-studio-custom453 summary').click();p.select_option('[data-studio-font453="fa"]','vazirmatn');p.locator('[data-studio-apply453]').click()
        wait(p,'document.documentElement.dataset.nh7Studio==="sepia"')
        assert p.evaluate('document.fonts.load(\'16px "NH7 Vazirmatn"\').then(x=>x.length)')>0
        p.screenshot(path=str(OUT/f'{stage}-theme-studio.png'))
        p.locator('[data-route="bible"]').click();choose(p,{'section':'written'});choose(p,{'mode':'lexicon'});expect(p.locator('#nh7LexiconQuery453')).to_be_visible()
        p.fill('#nh7LexiconQuery453','عدالت');p.locator('[data-lex-entry453="G1343"]').click();expect(p.locator('[data-lex-detail453="G1343"]')).to_be_visible()
        wait(p,'!!document.querySelector("[data-lex-verse-text453]") && !document.querySelector("[data-lex-verse-text453]").textContent.includes("بارگذاری")')
        p.screenshot(path=str(OUT/f'{stage}-lexicon-righteousness.png'))
        p.locator('[data-lex-verse453]').first.click();expect(p.locator('.reader-verse')).not_to_have_count(0)
        p.locator('[data-route="bible"]').click();p.locator('[data-go="apocrypha"]').click();p.locator('[data-rc-apo-book="tobit"]').click()
        expect(p.locator('[data-nh7-apo-save="APO:tobit:1:1"]')).to_be_attached()
        for n in [1,2]:p.locator(f'.nh7-apo-verse[data-apo-verse="{n}"] .nh7-apo-verse-main').click()
        assert p.evaluate('NH7ReaderToolbarV452.selected.size')==2
        p.locator('.nh7-apo-verse[data-apo-verse="1"] .nh7-apo-verse-main').click();assert p.evaluate('NH7ReaderToolbarV452.selected.size')==1
        assert p.locator('.nh7-apo-verse-tools').evaluate_all('(nodes)=>nodes.every(n=>getComputedStyle(n).display==="none")')
        p.screenshot(path=str(OUT/f'{stage}-apocrypha-toolbar.png'))
        p.locator('[data-reader-action452="copy"]').click();wait(p,'NH7ReaderToolbarV452.selected.size===0')
        assert p.evaluate('qaCopies453.length')==1
        assert p.evaluate('qaRaw453.getItem("nh7_note_outside453")')=='DO NOT TOUCH'
        assert p.evaluate('qaRaw453.getItem("nh7_theme_studio_v453")')=='OUTSIDE THEME'
        assert p.evaluate('!!qaRaw453.getItem("nh7_preview_study_v453:nh7_theme_studio_v453")')
        assert p.evaluate('fetch(location.href,{method:"POST"}).then(()=>false,()=>true)')
        assert p.evaluate('fetch("https://example.invalid/no-network").then(()=>false,()=>true)')
        assert p.evaluate('navigator.serviceWorker.getRegistrations().then(x=>x.length)')==0
        assert not errors,errors
        external=[r for r in requests if urlparse(r['url']).hostname!=urlparse(p.url).hostname];assert not external,external
        assert all(r['method'] in ['GET','HEAD'] for r in requests)
        report={'status':'passed','url':url,'resolvedUrl':p.url,'hostingNoticeShown':gateway,'checks':['Dedicated Preview boots','Theme Studio applies Sepia with actual bundled Persian font','Righteousness glossary detail and source verse open','Apocrypha uses shared toolbar with individual deselection','Copy works with localized text','Existing real-storage note and theme remain unchanged','Only Preview namespace is written','External fetch and POST blocked','No service worker or external app requests','No uncaught page errors'],'requests':requests,'pageErrors':errors}
        (OUT/f'{stage}-preview-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False,indent=2))
    except Exception as e:
        p.screenshot(path=str(OUT/f'{stage}-preview-failure.png'),full_page=True);(OUT/f'{stage}-preview-failure.json').write_text(json.dumps({'error':str(e),'pageErrors':errors,'requests':requests,'body':p.locator('body').inner_text()[:14000]},ensure_ascii=False,indent=2));raise
    finally:c.close();browser.close()
if server:server.shutdown()
