"""Synthetic account/storage only. Fonts render; actual HTMLAudioElement plays local WAV."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
import array,hashlib,json,os,threading,wave
from playwright.sync_api import sync_playwright,expect
OUT=Path('qa-study454');OUT.mkdir(exist_ok=True);ENGINE=os.getenv('QA_ENGINE','chromium');checks=[];errors=[];external=[];screens={}
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path.cwd())))
threading.Thread(target=server.serve_forever,daemon=True).start();BASE=f'http://127.0.0.1:{server.server_port}'
with wave.open(str(OUT/'sample.wav'),'wb') as w:
    w.setnchannels(1);w.setsampwidth(2);w.setframerate(8000);w.writeframes(array.array('h',[0]*8000*90).tobytes())
SEED={'nh7_lang':'fa','nh7_offline_media_key_v2':'1','nh7_bookmarks':'["John 3:16"]','nh7_bible_state_JHN_3_16':json.dumps({'saved':True,'note':'Original Bible note with spaces ۱۲۳','highlight':True,'highlightColor':'green','unknown':'KEEP'},ensure_ascii=False),'nh7_apo_note_v242:tobit:1:1':'Original Apocrypha note','nh7_sermon_note_keep':'Original sermon note','nh7_school_progress_keep':'Original school progress','nh7_gratitude_note_7':'Original gratitude note'}
INIT='(()=>{if(!/^https?:/.test(location.protocol))return;if(!localStorage.getItem("qa454seed")){Object.entries('+json.dumps(SEED,ensure_ascii=False)+').forEach(([k,v])=>localStorage.setItem(k,v));localStorage.setItem("qa454seed","1")}window.qa454copies=[];Object.defineProperty(navigator,"clipboard",{value:{writeText:async t=>qa454copies.push(t)},configurable:true});})();'
def wait(p,expr):
    for _ in range(900):
        if p.evaluate(expr):return
        p.wait_for_timeout(35)
    raise AssertionError('Timeout: '+expr)
def passed(s):checks.append(s);print('PASS',ENGINE,s,flush=True)
def settings(p):
    p.locator('[data-route="more"]').click();p.locator('[data-go="settings"]').click();expect(p.locator('#nh7FontProof454')).to_be_visible();expect(p.locator('#nh7ThemeStudio453')).to_be_attached()
def language(p,value):p.select_option('#langSelect',value);wait(p,'document.documentElement.lang==='+json.dumps(value))
def choose(p,props):
    wait(p,"(()=>{const q="+json.dumps(props)+";return [...document.querySelectorAll('[data-go=\"bible\"][data-params]')].some(b=>{const p=JSON.parse(b.dataset.params);return Object.entries(q).every(([k,v])=>p[k]===v)})})()")
    p.locator('[data-go="bible"][data-params]').evaluate_all('(buttons,query)=>buttons.find(b=>{const p=JSON.parse(b.dataset.params);return Object.entries(query).every(([k,v])=>p[k]===v)}).click()',props)
def mock(route):
    r=route.request
    if r.url.startswith(BASE+'/'):return route.continue_()
    external.append({'method':r.method,'url':r.url})
    if r.resource_type=='script':return route.fulfill(status=200,content_type='application/javascript',body='')
    if r.resource_type=='stylesheet':return route.fulfill(status=200,content_type='text/css',body='')
    return route.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'authenticated':False,'approved':False,'items':[]} if '/functions/' in r.url else []))
with sync_playwright() as pw:
    browser=getattr(pw,ENGINE).launch();context=browser.new_context(viewport={'width':390,'height':844},service_workers='block')
    context.route('**/*',mock);context.route_web_socket('**/*',lambda ws:ws.close());context.add_init_script(INIT)
    p=context.new_page();p.set_default_timeout(30000);expect.set_options(timeout=30000);p.on('pageerror',lambda e:errors.append(str(e)));p.on('dialog',lambda d:d.accept())
    try:
        p.goto(BASE+'/index.html',wait_until='domcontentloaded');p.locator('#amenButton').click();wait(p,'!!window.NH7FontsV454 && !!window.NH7QuickBibleSourceV454 && !!window.NH7ThemeStudioV453')
        assert not p.evaluate('!!window.NH7_STUDY_PREVIEW');settings(p)
        for selector,count in [('#nh7ThemeSelect option',3),('#nh7TextSizeSelect option',4),('#nh7AccentSelect option',8)]:expect(p.locator(selector)).to_have_count(count)
        for value in ['default','system','readable','serif','persian']:expect(p.locator('#nh7FontSelect option[value='+json.dumps(value)+']')).to_have_count(1)
        passed('Actual app retains all previous mode, size, accent and five original font choices')
        for locale,ids in [('fa',['vazirmatn','naskh','estedad','amiri','markazi']),('en',['inter','lora','nunito']),('hr',['inter','lora','nunito'])]:
            language(p,locale);settings(p);images=[];metrics=[]
            for font in ids:
                p.select_option('#nh7FontSelect',font);wait(p,'document.documentElement.dataset.nh7Font454==='+json.dumps(font))
                sample=p.locator('[data-font-sample454]');sample.scroll_into_view_if_needed();p.wait_for_timeout(100)
                family=p.evaluate('NH7FontsV454.fonts['+json.dumps(font)+'].family');assert family in sample.evaluate('(n)=>getComputedStyle(n).fontFamily')
                metrics.append(sample.evaluate('(n)=>{const c=document.createElement("canvas").getContext("2d");c.font="32px "+getComputedStyle(n).fontFamily;return [n.textContent,"iiiiWWWWmmmm","agQ0123456789","ČĆŽŠĐ čćžšđ","فیض و محبت — پژوهش"].map(t=>c.measureText(t).width)}'))
                image=sample.screenshot();images.append(hashlib.sha256(image).hexdigest());(OUT/f'{ENGINE}-{locale}-{font}.png').write_bytes(image)
                assert not p.locator('#nh7FontStatus454[data-error="1"]').count()
            assert len(set(images))==len(ids),(locale,images)
            # Different designs may give one sentence the same width. Require distinct
            # vectors across several glyph samples AND distinct actual text images.
            assert len({tuple(round(v,3) for v in row) for row in metrics})==len(ids),(locale,metrics)
            screens[locale]={'imageHashes':images,'glyphWidthVectors':metrics,'fonts':ids}
            passed(locale+': each font visibly changes actual text immediately in old selector; no Apply click')
        language(p,'fa');settings(p);p.locator('.nh7-studio-custom453 summary').click();p.select_option('[data-studio-font453="fa"]','naskh')
        wait(p,'document.documentElement.dataset.nh7Font454==="naskh"');expect(p.locator('#nh7FontSelect')).to_have_value('naskh')
        p.locator('[data-studio-preset453="sepia"]').click();p.locator('[data-studio-apply453]').click();wait(p,'document.documentElement.dataset.nh7Studio==="sepia"')
        assert p.evaluate('NH7FontsV454.choice()')=='naskh'
        p.reload(wait_until='domcontentloaded');p.locator('#amenButton').click();wait(p,'document.documentElement.dataset.nh7Font454==="naskh"');settings(p)
        passed('Studio and legacy font selectors agree; theme application and reload preserve the chosen font')
        p.locator('[data-route="bible"]').click();choose(p,{'section':'written'});choose(p,{'testament':'NT'});choose(p,{'bookId':'JHN','mode':'book'});choose(p,{'chapter':3,'mode':'chapter'})
        expect(p.locator('#v-16 .verse-text')).to_be_attached();assert 'NH7 Noto Naskh' in p.locator('#v-16 .verse-text').evaluate('(n)=>getComputedStyle(n).fontFamily')
        p.screenshot(path=str(OUT/f'{ENGINE}-actual-persian-verse.png'));passed('The selected Persian font reaches actual Bible verse text')
        data=p.evaluate('NH7OriginalLanguageV453.load()');assert data['count']==60 and data['reviewedSummaries']==60
        assert all(all(len(e.get('explanation',{}).get(l,''))>=120 for l in ['fa','en','hr']) for e in data['entries'])
        for locale in ['fa','en','hr']:
            language(p,locale);p.locator('[data-route="bible"]').click();choose(p,{'section':'written'});choose(p,{'mode':'lexicon'})
            p.fill('#nh7LexiconQuery453','');p.select_option('#nh7LexiconLanguage453','all');expect(p.locator('[data-lex-entry453]')).to_have_count(60)
            for id in ['G5485','G1343','H6664','G5','G3134']:
                p.fill('#nh7LexiconQuery453',id);p.locator('[data-lex-entry453='+json.dumps(id)+']').click();expect(p.locator('[data-lex-detail453='+json.dumps(id)+']')).to_be_visible()
                text=p.locator('.nh7-lex-explanation453').inner_text();assert len(text)>=120
                assert 'not yet' not in text and 'اضافه نشده' not in text and 'još nije' not in text
                p.locator('[data-lex-back453]').click()
            passed(locale+': all 60 published entries have substantive explanations; five varied entry dialogs checked')
        for locale in ['fa','en','hr']:
            language(p,locale);p.locator('[data-route="home"]').click()
            p.evaluate('''async()=>{
             const id='45400000-0000-4000-8000-000000000001';const blob=await fetch('qa-study454/sample.wav').then(r=>r.blob());
             await new Promise((resolve,reject)=>{const r=indexedDB.open('nh7-offline-audio-v397',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media',{keyPath:'id'})};r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('media','readwrite');tx.objectStore('media').put({id,blob});tx.oncomplete=()=>{db.close();resolve()}}});
             const item={id,title_fa:'نمونهٔ صوت آزمایشی',title_en:'Synthetic test audio',title_hr:'Probni audio',audio_url:'nh7-private://sermons/qa454',duration_seconds:90};window.__sermonMap=window.__sermonMap||{};window.__sermonMap[id]=item;
             const card=document.createElement('article');card.className='sermon-card';card.dataset.sermonCard=id;card.innerHTML='<div class="sermon-card-copy"><strong>QA audio fixture</strong><div class="sermon-card-actions"><button type="button" data-sermon-play="'+id+'">Play</button></div></div>';document.getElementById('view').append(card);window.NH7_AUDIO_CLASSIC_V400.patch();window.NH7QuickBibleV454.enhance();
            }''')
            card=p.locator('[data-sermon-card="45400000-0000-4000-8000-000000000001"]');card.locator('[data-classic-play],[data-sermon-play]').first.click()
            wait(p,'[...document.querySelectorAll("audio")].some(a=>!a.paused&&a.currentTime>0)')
            p.evaluate('window.qa454audio=[...document.querySelectorAll("audio")].find(a=>!a.paused);qa454audio.playbackRate=1.25;window.qa454pauseCount=0;qa454audio.addEventListener("pause",()=>window.qa454pauseCount++);window.qa454src=qa454audio.src;window.qa454view=document.getElementById("view");window.qa454time=qa454audio.currentTime')
            card.locator('[data-quick-bible454]').click();expect(p.locator('#nh7QuickBible454')).to_be_visible();expect(p.locator('[data-quick-line454]')).not_to_have_count(0)
            ref={'fa':'یوحنا ۳:۱۶-۱۸','en':'John 3:16-18','hr':'Ivan 3:16-18'}[locale];p.fill('[data-quick-reference454]',ref);p.locator('[data-quick-reference454]').press('Enter');expect(p.locator('[data-quick-line454]')).to_have_count(3)
            assert p.locator('[data-quick-content454] h3').inner_text().startswith({'fa':'یوحنا','en':'John','hr':'Ivan'}[locale])
            p.locator('[data-quick-copy454]').click();assert p.evaluate('qa454copies.at(-1)').startswith({'fa':'یوحنا','en':'John','hr':'Ivan'}[locale])
            p.locator('[data-quick-all454]').click();expect(p.locator('[data-quick-line454]')).to_have_count(36)
            p.screenshot(path=str(OUT/f'{ENGINE}-quick-bible-{locale}.png'))
            p.fill('[data-quick-reference454]',ref.replace('16-18','999').replace('۱۶-۱۸','۹۹۹'));p.locator('[data-quick-reference454]').press('Enter');expect(p.locator('[data-quick-status454]')).not_to_have_text('')
            p.wait_for_timeout(350)
            assert p.evaluate('!qa454audio.paused && qa454audio.currentTime>qa454time && qa454audio.src===qa454src && qa454audio.playbackRate===1.25 && qa454pauseCount===0 && document.getElementById("view")===qa454view')
            p.locator('[data-quick-close454]').last.click();expect(p.locator('#nh7QuickBible454')).to_have_count(0);assert p.evaluate('!qa454audio.paused&&qa454pauseCount===0');p.evaluate('qa454audio.pause()')
            passed(locale+': actual classic audio continues at same source and speed while verses are found, copied and closed')
        for key,value in SEED.items():
            if key!='nh7_lang':assert p.evaluate('(k)=>localStorage.getItem(k)',key)==value,key
        settings(p);p.locator('#nh7AppearanceReset').click();wait(p,'!document.documentElement.dataset.nh7Font454')
        for key,value in SEED.items():
            if key!='nh7_lang':assert p.evaluate('(k)=>localStorage.getItem(k)',key)==value,key
        passed('Existing notes, bookmarks and progress remain unchanged; resetting appearance does not touch them')
        for width in [320,390,768,1280]:p.set_viewport_size({'width':width,'height':844});assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1'),width
        assert not errors,errors
        (OUT/f'{ENGINE}-report.json').write_text(json.dumps({'status':'passed','checks':checks,'fontRenderingEvidence':screens,'pageErrors':errors,'mockedRequests':len(external),'actualExternalAPICalls':0,'physicalDeviceTest':False,'realAccountTest':False,'audioTest':'real HTMLAudioElement + synthetic WAV in classic player'},ensure_ascii=False,indent=2))
    except Exception as e:
        p.screenshot(path=str(OUT/f'{ENGINE}-failure.png'),full_page=True);(OUT/f'{ENGINE}-failure.json').write_text(json.dumps({'error':str(e),'checks':checks,'pageErrors':errors,'body':p.locator('body').inner_text()[:18000]},ensure_ascii=False,indent=2));raise
    finally:context.close();browser.close();server.shutdown()
