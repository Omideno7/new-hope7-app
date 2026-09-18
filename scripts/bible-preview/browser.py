"""Isolated Chromium regression tests; synthetic storage only, no production calls."""
from pathlib import Path
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from urllib.parse import urlparse
import json, os, traceback
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'qa-output'; OUT.mkdir(exist_ok=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(ROOT)))
Thread(target=server.serve_forever,daemon=True).start()
BASE=f'http://127.0.0.1:{server.server_port}'
checks=[]; errors=[]; requests=[]
def passed(name):
    checks.append(name);print('PASS',name,flush=True)
def route_button(page,fragment):
    return page.locator('[data-go="bible"][data-params*='+json.dumps(fragment)+']')
def written(p):
    p.locator('[data-route="bible"]').click()
    p.locator('[data-go="bible"][data-params=\'{"section":"written"}\']').click()
    expect(p.locator('#bibleSearch')).to_be_visible()
def keywords(p):
    written(p)
    route_button(p,'"mode":"keywords"').click()
    expect(p.locator('#bibleKeywordFilter')).to_be_visible()
def chapter(p):
    written(p)
    route_button(p,'"testament":"NT"').click()
    route_button(p,'"bookId":"JHN"').click()
    route_button(p,'"chapter":3}').click()
    expect(p.locator('#v-16')).to_be_attached()
def st(p,key): return p.evaluate('(k)=>JSON.parse(localStorage.getItem(k)||"null")',key)
def clear(p): p.evaluate('window.NH7BibleBatchV230.clearSelection()')
def wait_js(p,expression):
    for _ in range(250):
        if p.evaluate(expression):return
        p.wait_for_timeout(40)
    raise AssertionError('Timed out: '+expression)
SEED="""(()=>{const s=window.localStorage;window.__testNativeStorage=s;const pre='nh7_preview_bible_v451:';if(!s.getItem('qa_seeded')){s.setItem('qa_seeded','1');s.setItem('nh7_bookmarks','["PRODUCTION_SENTINEL"]');s.setItem('nh7_bible_state_JHN_3_16','{"note":"PRODUCTION_NOTE","saved":true}');s.setItem(pre+'nh7_lang','fa');s.setItem(pre+'nh7_bookmarks','["John 3:16","Psalms 23:1"]');s.setItem(pre+'nh7_bible_state_JHN_3_16',JSON.stringify({saved:true,note:'یادداشت آزمایشی با فاصله',highlight:true,highlightColor:'blue',extraField:'PRESERVE'}));}window.__shared=[];Object.defineProperty(navigator,'share',{value:async data=>{window.__shared.push(data)},configurable:true});})()"""
with sync_playwright() as pw:
    exe=os.environ.get('BIBLE_CHROMIUM_EXECUTABLE')
    browser=pw.chromium.launch(headless=True,**({'executable_path':exe} if exe else {}))
    context=browser.new_context(viewport={'width':390,'height':844},locale='en-US')
    context.add_init_script(SEED)
    page=context.new_page();page.set_default_timeout(18000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append({'url':r.url,'method':r.method}))
    page.on('dialog',lambda d:d.accept())
    try:
        page.goto(BASE+'/bible-preview.html',wait_until='networkidle')
        expect(page.locator('#amenButton')).to_be_visible();page.locator('#amenButton').click()
        expect(page.locator('#view .card').first).to_be_visible()
        assert page.evaluate('window.NH7_BIBLE_PREVIEW') is True
        assert page.evaluate('localStorage.getItem("nh7_bookmarks")')!='["PRODUCTION_SENTINEL"]'
        assert page.evaluate('window.__testNativeStorage.getItem("nh7_bookmarks")')=='["PRODUCTION_SENTINEL"]'
        passed('Dedicated preview boots with isolated storage and actual Bible scripts')
        for lang,query in [('fa','خداوند'),('en','lord'),('hr','gospod')]:
            page.select_option('#langSelect',lang)
            keywords(page)
            expect(page.locator('[data-bible-keyword]')).to_have_count(120)
            page.locator('#bibleKeywordMore').click();expect(page.locator('[data-bible-keyword]')).to_have_count(240)
            page.fill('#bibleKeywordFilter',query)
            target=page.locator('[data-bible-keyword='+json.dumps(query,ensure_ascii=False)+']');expect(target).to_be_visible();target.click()
            expect(page.locator('[data-bible-hit]')).to_have_count(200)
            page.locator('#bibleSearchMore').click();expect(page.locator('[data-bible-hit]')).to_have_count(400)
            assert page.locator('[data-bible-hit]').evaluate_all('e=>new Set(e.map(x=>x.innerText)).size')==400
            page.locator('#view .nh7-step-back button').click()
            expect(page.locator('#bibleKeywordFilter')).to_have_value(query)
            page.fill('#bibleKeywordFilter','ZZZZ_کوئی_نتیجہ_نہیں_991')
            expect(page.locator('[data-bible-keyword]')).to_have_count(0)
            expect(page.locator('#bibleKeywordMore')).to_be_hidden()
            page.fill('#bibleKeywordFilter','')
            passed(lang+': list, pagination, exact-word results, preserved filter and empty state')
        page.select_option('#langSelect','fa');keywords(page)
        page.fill('#bibleKeywordFilter','مَحَبّت')
        expect(page.locator('[data-bible-keyword="محبت"]')).to_be_visible()
        page.fill('#bibleKeywordFilter','')
        for _ in range(20): page.locator('#bibleKeywordMore').click()
        expect(page.locator('[data-bible-keyword]')).to_have_count(2500)
        expect(page.locator('#bibleKeywordMore')).to_be_hidden()
        passed('All 2500 words can be browsed; Persian diacritics normalized')
        page.set_viewport_size({'width':390,'height':844})
        page.locator('[data-bible-preview-theme="dark"]').click()
        assert page.evaluate('document.documentElement.dataset.nh7Theme')=='dark'
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
        page.screenshot(path=str(OUT/'bible-keywords-fa-mobile-dark.png'))
        page.locator('[data-bible-preview-theme="light"]').click()
        page.set_viewport_size({'width':1280,'height':900})
        page.screenshot(path=str(OUT/'bible-keywords-fa-desktop.png'))
        passed('Light/dark controls and mobile/desktop layouts without horizontal overflow')
        written(page);page.fill('#bibleSearch','   ');page.locator('#runBibleSearch').click();expect(page.locator('#bibleSearch')).to_be_visible()
        page.select_option('#langSelect','en');page.fill('#bibleSearch','For God so loved');page.press('#bibleSearch','Enter')
        expect(page.locator('[data-bible-hit]')).to_have_count(1)
        expect(page.locator('[data-bible-hit] strong')).to_have_text('John 3:16')
        page.locator('[data-bible-hit]').click();expect(page.locator('#v-16.saved-focus')).to_be_attached()
        assert page.locator('#v-16 .verse-text').inner_text().startswith('For God so loved')
        passed('Empty search, Enter submission, and result opens exact chapter/verse')
        key='nh7_bible_state_JHN_3_16';initial=st(page,key)
        assert initial['note']=='یادداشت آزمایشی با فاصله' and initial['highlightColor']=='blue'
        v=page.locator('#v-16');clear(page);v.locator('.verse-text').click()
        v.locator('[data-bookmark]').click()
        wait_js(page,'!JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:16")')
        current=st(page,key);assert current['saved'] is False
        assert all(current[k]==initial[k] for k in ['note','highlight','highlightColor','extraField'])
        assert 'Psalms 23:1' in st(page,'nh7_bookmarks')
        v.locator('[data-bookmark]').click()
        assert 'John 3:16' in st(page,'nh7_bookmarks')
        passed('Save/unsave preserves other bookmarks, note, highlight and unknown fields')
        clear(page);v.locator('.verse-text').click();v.locator('[data-clear-bible-selection]').click()
        assert page.evaluate('window.NH7BibleBatchV230.selected.size')==0
        expect(v.locator('.verse-tools')).to_be_hidden()
        assert st(page,key)['note']==initial['note']
        passed('Cancel selection hides toolbar without deleting saved data')
        clear(page);v.locator('.verse-text').click();v.locator('[data-share-verse]').click()
        wait_js(page,'window.NH7BibleBatchV230.selected.size===0')
        assert len(page.evaluate('window.__shared'))==1
        passed('Successful mocked share dismisses selection')
        for n in [16,17]:page.locator(f'#v-{n} .verse-text').click()
        assert page.evaluate('window.NH7BibleBatchV230.selected.size')==2
        page.locator('#v-17 [data-bookmark]').click()
        wait_js(page,'JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:17")')
        page.locator('#v-17 [data-bookmark]').click()
        wait_js(page,'!JSON.parse(localStorage.getItem("nh7_bookmarks")).includes("John 3:17")')
        assert 'John 3:16' not in st(page,'nh7_bookmarks')
        assert 'Psalms 23:1' in st(page,'nh7_bookmarks')
        assert st(page,key)['note']==initial['note']
        passed('Multi-verse save/unsave preserves notes and unrelated bookmarks')
        clear(page);page.locator('#v-16 .verse-text').click();page.locator('#v-16 [data-note-verse]').click()
        page.locator('#v-16 textarea').fill('یادداشت جدید با فاصله و عدد ۱۲۳')
        page.locator('#v-16 [data-save-verse-note]').click()
        assert st(page,key)['note']=='یادداشت جدید با فاصله و عدد ۱۲۳'
        page.reload(wait_until='networkidle');expect(page.locator('#amenButton')).to_be_visible();page.locator('#amenButton').click()
        chapter(page)
        assert st(page,key)['note']=='یادداشت جدید با فاصله و عدد ۱۲۳'
        assert page.evaluate('window.__testNativeStorage.getItem("nh7_bible_state_JHN_3_16")')=='{"note":"PRODUCTION_NOTE","saved":true}'
        assert page.evaluate('window.__testNativeStorage.getItem("nh7_bookmarks")')=='["PRODUCTION_SENTINEL"]'
        passed('Note editing and reload persistence; original non-preview data byte-identical')
        page.set_viewport_size({'width':390,'height':844})
        page.locator('#v-16 .verse-text').click()
        page.screenshot(path=str(OUT/'bible-chapter-mobile.png'))
        external=[r for r in requests if not r['url'].startswith(BASE+'/')]
        writes=[r for r in requests if r['method'] not in ['GET','HEAD']]
        assert not external,external;assert not writes,writes;assert not errors,errors
        assert page.evaluate('navigator.serviceWorker.getRegistrations().then(r=>r.length)')==0
        passed('Zero external requests, zero network writes, zero service workers, zero page errors')
        report={'status':'passed','browser':'Chromium','checks':checks,'pageErrors':errors,'externalRequests':external,'networkWrites':writes,'nativeDeviceTest':False,'shareTest':'mocked browser navigator.share only'}
        (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    except Exception as error:
        print(traceback.format_exc(),flush=True)
        page.screenshot(path=str(OUT/'browser-failure.png'),full_page=True)
        (OUT/'browser-failure.html').write_text(page.content())
        (OUT/'browser-failure.json').write_text(json.dumps({'error':str(error),'checks':checks,'pageErrors':errors,'requests':requests,'body':page.locator('body').inner_text()[:10000]},ensure_ascii=False,indent=2))
        raise
    finally:
        context.close();browser.close();server.shutdown()
