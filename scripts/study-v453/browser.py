"""Full app test with synthetic user state and every external service intercepted."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import json,os,subprocess,threading
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-study453');OUT.mkdir(exist_ok=True);ENGINE=os.getenv('QA_ENGINE','chromium');checks=[];errors=[];requests=[]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())))
threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
SEED={'nh7_lang':'fa','nh7_bookmarks':'["John 3:16"]','nh7_bible_state_JHN_3_16':json.dumps({'saved':True,'note':'KEEP Bible — فاصله ۱۲۳','highlight':True,'highlightColor':'green','unknown':'KEEP'},ensure_ascii=False),'nh7_apo_note_v242:tobit:1:1':'KEEP Apocrypha note','nh7_sermon_note_qa453':'KEEP Sermon note','nh7_gratitude_note_7':'KEEP Gratitude note','nh7_school_progress_qa453':'KEEP School progress'}
INIT="""(()=>{if(!/^https?:/.test(location.protocol))return;if(!localStorage.getItem('qa453-seeded')){Object.entries(SEED).forEach(([k,v])=>localStorage.setItem(k,v));localStorage.setItem('qa453-seeded','1')}window.qa453Copies=[];Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>qa453Copies.push(value)},configurable:true});window.qa453Shares=[];Object.defineProperty(navigator,'share',{value:async value=>qa453Shares.push(value)},configurable:true});})();""".replace('SEED',json.dumps(SEED,ensure_ascii=False))
def wait(p,expr):
    for _ in range(900):
        if p.evaluate(expr):return
        p.wait_for_timeout(35)
    raise AssertionError('Timeout: '+expr)
def passed(s):checks.append(s);print('PASS',ENGINE,s,flush=True)
def choose(p,props):
    expression="(()=>{const props="+json.dumps(props)+";return [...document.querySelectorAll('[data-go=\"bible\"][data-params]')].some(b=>{const q=JSON.parse(b.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)})})()"
    wait(p,expression);p.locator('[data-go="bible"][data-params]').evaluate_all('(buttons,props)=>buttons.find(b=>{const q=JSON.parse(b.dataset.params);return Object.entries(props).every(([k,v])=>q[k]===v)}).click()',props)
def written(p):p.locator('[data-route="bible"]').click();choose(p,{'section':'written'});expect(p.locator('#bibleSearch')).to_be_visible()
def lexicon(p):written(p);choose(p,{'mode':'lexicon'});expect(p.locator('#nh7LexiconQuery453')).to_be_visible()
def settings(p):
    p.locator('[data-route="more"]').click();p.locator('[data-go="settings"]').click();expect(p.locator('#nh7ThemeStudio453')).to_be_visible()
def change_language(p,language):p.select_option('#langSelect',language);wait(p,'document.documentElement.lang==='+json.dumps(language))
def raw(p,key):return p.evaluate('(key)=>localStorage.getItem(key)',key)
def mock(route):
    r=route.request
    if r.url.startswith(BASE+'/'):return route.continue_()
    requests.append({'url':r.url,'method':r.method})
    if r.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
    if r.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
    return route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'approved':False,'authenticated':False,'items':[]} if '/functions/' in r.url else []))
with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch(**({'args':['--remote-debugging-port=9222']} if ENGINE=='chromium' else {}))
    c=browser.new_context(viewport={'width':390,'height':844},service_workers='block');c.route('**/*',mock);c.route_web_socket('**/*',lambda ws:ws.close());c.add_init_script(INIT)
    p=c.new_page();p.set_default_timeout(30000);expect.set_options(timeout=30000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
    try:
        p.goto(BASE+'/index.html',wait_until='domcontentloaded');p.locator('#amenButton').click()
        wait(p,'!!window.NH7ThemeStudioV453 && !!window.NH7StudySourceV453 && !!window.NH7OriginalLanguageV453 && !!window.NH7ApoReaderSourceV452')
        assert not p.evaluate('!!window.NH7_STUDY_PREVIEW')
        if ENGINE=='chromium' and os.getenv('QA_AGENT_BROWSER'):
            r=subprocess.run([os.environ['QA_AGENT_BROWSER'],'--cdp','9222','snapshot','-i'],capture_output=True,text=True,timeout=35);(OUT/'agent-browser-snapshot.txt').write_text(r.stdout+'\n'+r.stderr);assert r.returncode==0,r.stderr
        passed('Full app entry loads without Preview guards; agent/browser initialization succeeds')
        for language,grace in [('fa','فیض'),('en','Grace'),('hr','Milost')]:
            change_language(p,language);lexicon(p)
            p.fill('#nh7LexiconQuery453','');p.select_option('#nh7LexiconLanguage453','all');expect(p.locator('[data-lex-entry453]')).to_have_count(60)
            p.locator('#nh7LexiconMore453').click();expect(p.locator('[data-lex-entry453]')).to_have_count(120)
            p.fill('#nh7LexiconQuery453',grace);expect(p.locator('[data-lex-entry453="G5485"]')).to_be_visible();p.locator('[data-lex-entry453="G5485"]').click()
            expect(p.locator('[data-lex-detail453="G5485"]')).to_be_visible();expect(p.locator('[data-lex-verse453="EPH.2.8"]')).to_be_visible()
            expect(p.locator('[data-lex-verse-text453="EPH.2.8"]')).not_to_have_text({'fa':'در حال بارگذاری…','en':'Loading…','hr':'Učitavanje…'}[language])
            text=p.locator('.nh7-lex-explanation453').inner_text();assert len(text)>80
            if language!='fa':assert not any('\u0600'<=c<='\u06ff' for c in text),text
            p.screenshot(path=str(OUT/f'{ENGINE}-lexicon-{language}.png'))
            p.locator('[data-lex-verse453="EPH.2.8"]').click();expect(p.locator('#v-8')).to_be_attached()
            p.locator('#v-8 .verse-text').click();expect(p.locator('[data-study-selected453]')).to_be_visible();p.locator('[data-study-selected453]').click()
            expect(p.locator('.nh7-lex-context453')).to_be_visible();p.fill('#nh7LexiconQuery453','');expect(p.locator('[data-lex-entry453="G5485"]')).to_be_visible()
            p.locator('[data-lex-all453]').click();p.fill('#nh7LexiconQuery453','G1343');p.locator('[data-lex-entry453="G1343"]').click()
            expect(p.locator('[data-lex-related453="G19"]')).to_be_visible();p.locator('[data-lex-related453="G19"]').click();expect(p.locator('[data-lex-detail453="G19"]')).to_be_visible()
            p.locator('[data-lex-back453]').click();expect(p.locator('#nh7LexiconQuery453')).to_have_value('G1343')
            p.fill('#nh7LexiconQuery453','zz-no-such-entry-453');expect(p.locator('[data-lex-entry453]')).to_have_count(0)
            p.fill('#nh7LexiconQuery453','G5485');p.select_option('#nh7LexiconLanguage453','hebrew');expect(p.locator('[data-lex-entry453]')).to_have_count(0)
            p.select_option('#nh7LexiconLanguage453','all');p.fill('#nh7LexiconQuery453','');passed(language+': glossary search, paging, meanings, reference opening, related entries and back-state')
        # Reproduce the legacy Apocrypha entry path, then check every available book per language.
        apo_data=json.loads(Path('data/apocrypha/runtime/apocrypha-browser-19.preview.json').read_text())
        p.locator('[data-route="bible"]').click();p.locator('[data-go="apocrypha"]').click();expect(p.locator('.nh7-access-gate-v230')).to_be_visible();p.locator('.nh7-access-close-v230').click()
        p.evaluate("sessionStorage.setItem('nh7_content_access_status_v230',JSON.stringify({approved:true,authenticated:true,checked_at:Date.now(),user_email:'study-qa@example.invalid'}))")
        visits=[]
        for language in ['fa','en','hr']:
            change_language(p,language);p.locator('[data-route="bible"]').click();p.locator('[data-go="apocrypha"]').click();expect(p.locator('[data-rc-apo-book]')).to_have_count(19)
            for book in apo_data['books']:
                chapters=[ch for ch in book['chapters'] if any(str(v.get('text_'+language,'')).strip() and int(v['verse'])>0 for v in ch['verses'])]
                if not chapters:continue
                ch=chapters[0];numbers=[int(v['verse']) for v in ch['verses'] if str(v.get('text_'+language,'')).strip() and int(v['verse'])>0]
                p.locator('[data-rc-apo-book='+json.dumps(book['book_id'])+']').click();p.select_option('[data-rc-apo-chapter]',str(ch['chapter']))
                selector=f'.nh7-apo-verse[data-apo-verse="{numbers[0]}"]';expect(p.locator(selector)).to_be_attached()
                wait(p,"document.documentElement.dataset.nh7UnifiedReader453==='1'")
                before=p.locator('.nh7-apo-verse-text').all_text_contents()
                p.evaluate('(n)=>NH7ApoReaderSourceV452.toggleLegacy(n)',numbers[0]);assert p.evaluate('NH7ReaderToolbarV452.selected.size')==1
                expect(p.locator('#nh7ReaderToolbar452')).to_be_visible()
                p.locator(selector+' .nh7-apo-verse-main').click();assert p.evaluate('NH7ReaderToolbarV452.selected.size')==0
                for n in numbers[:2]:p.locator(f'.nh7-apo-verse[data-apo-verse="{n}"] .nh7-apo-verse-main').click()
                assert p.evaluate('NH7ReaderToolbarV452.selected.size')==min(2,len(numbers))
                # Even an old handler showing a legacy toolbox cannot display duplicate controls.
                p.locator('.nh7-apo-verse-tools').evaluate_all('(nodes)=>nodes.forEach(n=>n.classList.remove("hidden"))')
                assert p.locator('.nh7-apo-verse-tools').evaluate_all('(nodes)=>nodes.every(n=>getComputedStyle(n).display==="none")')
                assert p.locator('.nh7-apo-verse-text').all_text_contents()==before
                if book['book_id']=='tobit':p.screenshot(path=str(OUT/f'{ENGINE}-apocrypha-{language}.png'))
                p.locator('[data-reader-action452="close"]').click();p.locator('[data-rc-apo-back="catalog"]').first.click();expect(p.locator('[data-rc-apo-book]')).to_have_count(19)
                visits.append({'language':language,'book':book['book_id'],'chapter':ch['chapter']})
            passed(language+': every available Apocrypha book uses one toolbar; text and individual deselection preserved')
        change_language(p,'fa');settings(p)
        original_notes={k:raw(p,k) for k in SEED if k!='nh7_lang'}
        assert p.evaluate('Object.values(NH7ThemeStudioV453.PRESETS).every(x=>NH7ThemeStudioV453.validate({...x,preset:"custom",fa:"system",latin:"system"}).ok)')
        for preset in ['hope','ocean','forest','royal','sand','rose','midnight','sepia']:
            p.locator('[data-studio-preset453='+json.dumps(preset)+']').click();p.locator('[data-studio-apply453]').click()
            wait(p,'document.documentElement.dataset.nh7Studio==='+json.dumps(preset));assert p.evaluate('NH7ThemeStudioV453.validate(NH7ThemeStudioV453.get()).ok')
            bg=p.evaluate('getComputedStyle(document.body).backgroundColor');expected=p.evaluate('NH7ThemeStudioV453.get().bg');assert bg==f'rgb({int(expected[1:3],16)}, {int(expected[3:5],16)}, {int(expected[5:7],16)})'
        passed('All eight presets apply and meet every configured text/background contrast pair')
        custom=p.locator('.nh7-studio-custom453');custom.locator('summary').click()
        old=raw(p,'nh7_theme_studio_v453')
        for key,color in [('bg','#ffffff'),('card','#ffffff'),('text','#ffffff')]:p.locator('[data-studio-color453='+json.dumps(key)+']').evaluate('(n,value)=>{n.value=value;n.dispatchEvent(new Event("input",{bubbles:true}))}',color)
        expect(p.locator('[data-studio-apply453]')).to_be_disabled();assert raw(p,'nh7_theme_studio_v453')==old
        p.locator('[data-studio-auto453]').click();expect(p.locator('[data-studio-apply453]')).to_be_enabled();p.locator('[data-studio-apply453]').click();assert p.evaluate('NH7ThemeStudioV453.validate(NH7ThemeStudioV453.get()).ok')
        passed('Unreadable custom draft is rejected without changing saved appearance; auto readability repairs it')
        for locale,fonts in [('fa',[('vazirmatn','NH7 Vazirmatn'),('naskh','NH7 Noto Naskh'),('estedad','NH7 Estedad')]),('hr',[('inter','NH7 Inter'),('lora','NH7 Lora'),('nunito','NH7 Nunito')])]:
            change_language(p,locale);expect(p.locator('#nh7ThemeStudio453')).to_be_visible()
            for font,family in fonts:
                if not p.locator('.nh7-studio-custom453').evaluate('(n)=>n.open'):p.locator('.nh7-studio-custom453 summary').click()
                p.select_option('[data-studio-font453="'+('fa' if locale=='fa' else 'latin')+'"]',font);p.locator('[data-studio-apply453]').click()
                count=p.evaluate('(family)=>document.fonts.load("16px \\\""+family+"\\\"").then(x=>x.length)',family)
                assert count>0,(font,count)
                assert family in p.evaluate('getComputedStyle(document.body).fontFamily')
            p.screenshot(path=str(OUT/f'{ENGINE}-theme-studio-{locale}.png'))
        passed('All six bundled font families actually load; Persian and Croatian script choices apply')
        themes=p.locator('#nh7ThemeStudio453 details').last;themes.locator('summary').click();p.locator('[data-studio-name453]').fill('My safe theme 453');p.locator('[data-studio-save453]').click()
        assert len(json.loads(raw(p,'nh7_theme_library_v453')))==1
        current=raw(p,'nh7_theme_studio_v453');p.reload(wait_until='domcontentloaded');p.locator('#amenButton').click();wait(p,'!!window.NH7ThemeStudioV453')
        assert raw(p,'nh7_theme_studio_v453')==current
        settings(p);p.locator('[data-studio-reset453]').click();assert raw(p,'nh7_theme_studio_v453') is None
        for key,value in original_notes.items():assert raw(p,key)==value,key
        assert len(json.loads(raw(p,'nh7_theme_library_v453')))==1
        passed('Named theme and reload persist; reset touches appearance only and preserves all existing notes/progress')
        for width in [320,390,768,1280]:
            p.set_viewport_size({'width':width,'height':844});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
        assert not errors,errors
        report={'status':'passed','browser':ENGINE,'checks':checks,'apocryphaVisits':visits,'pageErrors':errors,'actualExternalAPIRequests':0,'mockedExternalRequests':len(requests),'nativeDeviceTest':False,'realAccountUsed':False}
        (OUT/f'{ENGINE}-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    except Exception as error:
        p.screenshot(path=str(OUT/f'{ENGINE}-failure.png'),full_page=True);(OUT/f'{ENGINE}-failure.json').write_text(json.dumps({'error':str(error),'checks':checks,'pageErrors':errors,'body':p.locator('body').inner_text()[:20000]},ensure_ascii=False,indent=2));raise
    finally:c.close();browser.close();server.shutdown()
