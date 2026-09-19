from pathlib import Path
import subprocess
BASE = '2df1fabd295a0b2de2eaf1486e41c41242a4c52f'
def base(path):
    return subprocess.check_output(['git','show',BASE+':'+path], text=True)
p=Path('js/nh7-celebrations-v464.js')
s=p.read_text()
assert 'function profile()' in s and 'function birthdayEffects()' in s
# Preserve the phone-approved feast descriptions and all 16 dates.
s=s[:s.index('function profile()')]
s=s.replace("'Sveta Marija Bogorodica'", "'Ime Isusovo'")
s=s.replace("function eventFor(now=new Date()){const", "function eventFor(now=new Date()){if(!(now instanceof Date)||!Number.isFinite(now.getTime()))return null;const")
s += r'''
// Read-only profile lookup: a birthday must belong to the currently signed-in account.
const SESSION='nh7_user_session_v170';
const remembered=new Set();
let active=null,scheduled=0,clockTimer=0;
function read(k){try{return JSON.parse(localStorage.getItem(k)||'null')}catch(_){return null}}
function item(k){try{return localStorage.getItem(k)}catch(_){return null}}
function identity(){const s=read(SESSION);if(item('nh7_explicit_logout')==='1'||!s?.access_token||!s.user)return null;const email=String(s.user.email||'').trim().toLowerCase(),id=String(s.user.id||email);return id?{id,email,user:s.user}:null}
function profile(){
 const account=identity();if(!account)return null;
 const school=read('nh7_school_access'),cached=read('nh7_user_profile'),metadata=account.user.user_metadata||{};
 const belongs=x=>x&&typeof x==='object'&&account.email&&String(x.email||x.user_email||'').trim().toLowerCase()===account.email;
 const rows=[school,cached].filter(belongs);rows.push(metadata);
 for(const x of rows){const date=String(x.birthDate||x.birth_date||x.date_of_birth||x.dob||'').trim();if(!validBirthDate(date))continue;const name=String(x.firstName||x.first_name||x.name||x.full_name||'').trim().slice(0,100);return {id:account.id,name,birthDate:date}}
 return null;
}
function validBirthDate(value){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);if(!m)return false;const y=+m[1],month=+m[2],d=+m[3],date=new Date(y,month-1,d,12);return y>=1900&&date.getFullYear()===y&&date.getMonth()===month-1&&date.getDate()===d&&value<=key(new Date())}
function birthday(now=new Date()){const p=profile();if(!p)return null;return p.birthDate.slice(5)===key(now).slice(5)?p:null}
function seen(k){return remembered.has(k)||item(k)==='1'}
function markSeen(k){remembered.add(k);try{localStorage.setItem(k,'1')}catch(_){}}
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function reduced(){try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(_){return true}}
function birthdayEffects(){
 if(reduced())return null;
 const layer=node('div','nh7-bday-effects464');layer.setAttribute('aria-hidden','true');
 for(let b=0;b<3;b++){
  layer.append(node('div','nh7-bday-rocket464 r'+(b+1)));
  const burst=node('div','nh7-bday-burst464 b'+(b+1));
  for(let i=0;i<18;i++){const spark=node('i','nh7-bday-spark464 s'+i%6);spark.style.setProperty('--i',String(i));burst.append(spark)}layer.append(burst);
 }
 for(let i=0;i<26;i++){const confetti=node('b','nh7-bday-confetti464 c'+i%5);confetti.style.setProperty('--i',String(i));confetti.style.setProperty('--drift',i%2?'12px':'-12px');layer.append(confetti)}
 return layer;
}
function stopEffects(){if(!active)return;clearTimeout(active.effectsTimer);active.layer?.remove();active.layer=null}
function closeModal(){
 if(!active)return;const old=active;stopEffects();active=null;old.overlay.remove();
 if(old.shell)old.shell.inert=old.wasInert;
 if(old.focus?.isConnected)try{old.focus.focus({preventScroll:true})}catch(_){}
}
function modalCopy(){
 if(!active)return;const a=active;a.dialog.dir=lang()==='fa'?'rtl':'ltr';a.dialog.lang=lang();
 a.close.setAttribute('aria-label',L('بستن','Close','Zatvori'));
 if(a.kind==='birthday'){
  a.title.textContent=L('تولدت مبارک','Happy Birthday','Sretan rođendan')+(a.person.name?(lang()==='fa'?'، ':', ')+a.person.name:'')+'!';
  a.body.textContent=L('دعا می‌کنیم سال تازهٔ زندگی‌ات پر از فیض، سلامتی، حکمت و ثمر برای جلال خداوند باشد.','We pray that your new year of life is filled with grace, health, wisdom and fruit for the glory of God.','Molimo da nova godina tvoga života bude ispunjena milošću, zdravljem, mudrošću i plodom na slavu Božju.');
  a.verse.textContent='📖 '+L('ارمیا ۲۹:۱۱','Jeremiah 29:11','Jeremija 29,11');
 }else{const ev=eventFor(a.date);if(!ev){closeModal();return}a.title.textContent=ev.title;a.body.textContent=ev.body;a.verse.textContent='📖 '+ev.verse}
}
function openModal(kind,person=null,date=new Date()){
 if(active)return false;
 const ev=kind==='feast'?eventFor(date):null;if(kind==='feast'&&!ev)return false;
 const overlay=node('div','nh7-celebration-modal464'),dialog=node('div','nh7-celebration-dialog464');
 const close=node('button','nh7-celebration-close464','×');close.type='button';
 const symbol=node('div','nh7-celebration-symbol464',kind==='birthday'?'🎂':ev.icon),title=node('h2'),body=node('p'),verse=node('div','nh7-feast-verse464');
 title.id='nh7CelebrationTitle464';body.id='nh7CelebrationBody464';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby',title.id);dialog.setAttribute('aria-describedby',body.id);
 dialog.append(close,symbol,title,body);let layer=null;
 if(kind==='birthday'){layer=birthdayEffects();if(layer)dialog.append(layer);const decoration=node('div','nh7-birthday-blessing464','🎉 ✨ 🎈 ✨ 🎉');decoration.setAttribute('aria-hidden','true');dialog.append(decoration)}
 dialog.append(verse);overlay.append(dialog);
 const shell=document.getElementById('appShell');active={kind,person,date:new Date(date),overlay,dialog,title,body,verse,close,layer,shell,wasInert:shell?.inert||false,focus:document.activeElement,owner:identity()?.id||'guest'};
 modalCopy();document.body.append(overlay);if(shell)shell.inert=true;close.focus({preventScroll:true});
 close.onclick=closeModal;overlay.onclick=e=>{if(e.target===overlay)closeModal()};
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeModal()}else if(e.key==='Tab'){e.preventDefault();close.focus()}});
 if(layer)active.effectsTimer=setTimeout(stopEffects,4800);
 return true;
}
function header(){
 const row=document.querySelector('.nh7-header-date-row455');if(!row)return;const ev=eventFor();let button=document.getElementById('nh7ChristianToday464');
 if(!ev){button?.remove();return}
 if(!button){button=node('button','nh7-christian-today464');button.id='nh7ChristianToday464';button.type='button';row.append(button);button.onclick=()=>openModal('feast')}
 const label=ev.icon+' '+ev.title;
 // Do not write identical DOM in an observer callback: no self-triggered mutation loop.
 if(button.textContent!==label)button.textContent=label;
 const aria=L('دربارهٔ ','About ','O blagdanu ')+ev.title;
 if(button.getAttribute('aria-label')!==aria)button.setAttribute('aria-label',aria);
}
function canAuto(){
 if(document.hidden||active)return false;
 const gate=document.getElementById('amenGate');if(gate&&!gate.classList.contains('hidden')&&!gate.hidden)return false;
 if(document.querySelector('[aria-modal="true"]:not(.hidden):not([hidden]),dialog[open]'))return false;
 if(/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName||''))return false;
 return true;
}
function run(){
 header();if(active){if(active.owner!==(identity()?.id||'guest'))closeModal();else modalCopy()}
 if(!canAuto())return;
 const today=key(new Date()),p=birthday();
 if(p){const k='nh7_birthday_seen_v464:'+encodeURIComponent(p.id)+':'+today;if(!seen(k)&&openModal('birthday',p))markSeen(k);return}
 const ev=eventFor();if(ev){const k='nh7_feast_seen_v464:'+encodeURIComponent(identity()?.id||'guest')+':'+today;if(!seen(k)&&openModal('feast'))markSeen(k)}
}
function schedule(){clearTimeout(scheduled);scheduled=setTimeout(run,100)}
function clock(){clearTimeout(clockTimer);if(document.hidden)return;run();clockTimer=setTimeout(clock,60000)}
// Observe only the app view/gate and language, never the header or our own modal subtree.
const view=document.getElementById('view'),gate=document.getElementById('amenGate');
if(view)new MutationObserver(schedule).observe(view,{childList:true});
if(gate)new MutationObserver(schedule).observe(gate,{attributes:true,attributeFilter:['class','hidden']});
new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
window.addEventListener('pageshow',schedule);window.addEventListener('focus',schedule);window.addEventListener('nh7-session-refreshed',schedule);
window.addEventListener('storage',e=>{if([SESSION,'nh7_explicit_logout','nh7_school_access','nh7_user_profile','nh7_lang'].includes(e.key))schedule()});
document.addEventListener('change',e=>{if(['langSelect','settingsLang'].includes(e.target?.id))schedule()});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(clockTimer);stopEffects()}else clock()});
try{matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{if(e.matches)stopEffects()})}catch(_){}
setTimeout(clock,900);
window.NH7_CELEBRATIONS_V464=Object.freeze({VERSION:'4.6.4',eventFor,birthday,run,easter});
})();
'''
p.write_text(s)
p=Path('css/nh7-celebrations-v464.css');css=p.read_text()
css=css.replace('calc((var(--i)%2)*24px - 12px)','var(--drift,12px)')
css += '''\n/* Scoped production integration; retain the approved layout and animation. */
.nh7-celebration-dialog464,.nh7-christian-today464{--card:var(--nh7-studio-card,var(--card-bg,#fff));--brand:var(--nh7-studio-accent,#1d4ed8);--accent:var(--nh7-studio-accent,#16a34a);color:var(--nh7-studio-text,var(--text,#16364c));font-family:inherit;box-sizing:border-box}
.nh7-celebration-dialog464{max-height:calc(100dvh - 40px);overflow-y:auto}
.nh7-celebration-dialog464>.nh7-celebration-close464{position:absolute;inset:12px 12px auto auto;z-index:3;min-width:44px;min-height:44px;cursor:pointer}
.nh7-celebration-dialog464[dir=rtl]>.nh7-celebration-close464{inset:12px auto auto 12px}
.nh7-celebration-dialog464 h2,.nh7-celebration-dialog464 p{color:inherit;overflow-wrap:anywhere}
.nh7-header-date-row455{flex-wrap:wrap}
.nh7-christian-today464{max-width:100%;white-space:normal;overflow:visible;text-overflow:clip;line-height:1.5;min-height:32px;font-family:inherit;cursor:pointer}
.nh7-christian-today464:focus-visible,.nh7-celebration-close464:focus-visible{outline:2px solid var(--brand,#1d4ed8);outline-offset:3px}
'''
p.write_text(css)
# Five deployable paths only; all unapproved mock/preview code stays outside the release.
idx=base('index.html')
idx=idx.replace('service-worker.js?v=4.5.7','service-worker.js?v=4.6.4')
idx=idx.replace('js/app.js?v=4.5.7','js/app.js?v=4.6.4')
idx=idx.replace('js/nh7-school-path-v351.js?v=3.5.2','js/nh7-school-path-v351.js?v=4.6.4')
idx=idx.replace('js/nh7-settings-controller-v403.js?v=4.0.3','js/nh7-settings-controller-v403.js?v=4.6.4')
idx=idx.replace('css/nh7-growth-v463.css?v=4.6.3-preview','css/nh7-growth-v463.css?v=4.6.3')
idx=idx.replace('</head>','  <link rel="stylesheet" href="css/nh7-celebrations-v464.css?v=4.6.4" />\n</head>')
idx=idx.replace('</body>','  <script src="js/nh7-celebrations-v464.js?v=4.6.4" defer></script>\n</body>')
Path('index.html').write_text(idx)
sw=base('service-worker.js').replace('sw-release-core-v403.js?v=4.5.7','sw-release-core-v403.js?v=4.6.4')
Path('service-worker.js').write_text(sw)
core=base('sw-release-core-v403.js').replace("'4.5.7-theme-gallery'","'4.6.4-celebrations'").replace("'nh7-release-core-v457-theme-gallery'","'nh7-release-core-v464-celebrations'")
assets=['js/nh7-celebrations-v464.js','css/nh7-celebrations-v464.css','css/nh7-growth-v463.css']
i=core.index('];',core.index('const NH7_RELEASE_ASSETS=['));core=core[:i]+''.join(", './"+x+"'" for x in assets)+core[i:]
i=core.index(']);',core.index('const NH7_READER_RELEASE_PATHS_V452'))
guarded=assets+['js/nh7-school-path-v351.js','js/nh7-settings-controller-v403.js','js/nh7-audio-classic-v400.js','js/nh7-audio-route-stability-v423.js']
core=core[:i]+''.join(', "'+x+'"' for x in guarded)+core[i:]
Path('sw-release-core-v403.js').write_text(core)
assert 'preview' not in '\n'.join(x for x in idx.splitlines() if 'celebrations' in x)
print('Prepared runtime-only release; existing app, audio, school, notes and data bytes unchanged.')
