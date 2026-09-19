(()=>{'use strict';
if(window.__NH7_CELEBRATIONS_V464__)return;window.__NH7_CELEBRATIONS_V464__=1;
const lang=()=>item('nh7_lang')||document.documentElement.lang||'en';
const L=(fa,en,hr)=>lang()==='fa'?fa:lang()==='hr'?hr:en;
const key=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
function easter(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=(h+l-7*m+114)%31+1;return new Date(y,mo-1,da)}
function plus(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function feastText(id){
 const texts={
  holy_name:[['در آغاز سال، کلیسا نام عیسی را گرامی می‌دارد؛ نامی که نجات در آن اعلام شده است.','At the beginning of the year, the Church honors the name of Jesus—the name in which salvation is proclaimed.','Na početku godine Crkva časti Isusovo ime — ime u kojem je naviješteno spasenje.'],'لوقا ۲:۲۱','Luke 2:21','Luka 2,21'],
  epiphany:[['این روز آشکار شدن مسیح برای ملت‌ها را به یاد می‌آورد؛ مجوسیان آمدند تا پادشاه را بپرستند و هدایا تقدیم کنند.','This day remembers Christ being revealed to the nations; the Magi came to worship the King and offer gifts.','Ovaj dan podsjeća na objavu Krista narodima; mudraci su došli pokloniti se Kralju i prinijeti darove.'],'متی ۲:۱–۱۲','Matthew 2:1–12','Matej 2,1–12'],
  ash:[['این روز آغاز دوره آمادگی پیش از عید قیام است و بر توبه، دعا و بازگشت قلب به خدا تأکید می‌کند.','This day begins the season of preparation before Easter, emphasizing repentance, prayer and turning the heart toward God.','Ovaj dan započinje vrijeme priprave prije Uskrsa, s naglaskom na obraćenje, molitvu i povratak srca Bogu.'],'یوئیل ۲:۱۲–۱۳','Joel 2:12–13','Joel 2,12–13'],
  palm:[['یکشنبه نخل ورود عیسی به اورشلیم را به یاد می‌آورد؛ مردم با شاخه‌های نخل از او استقبال کردند و فریاد «هوشیعانا» سر دادند.','Palm Sunday remembers Jesus entering Jerusalem, welcomed with palm branches and cries of “Hosanna.”','Cvjetnica podsjeća na Isusov ulazak u Jeruzalem, dočekan palminim granama i povicima „Hosana”.'],'متی ۲۱:۱–۱۱','Matthew 21:1–11','Matej 21,1–11'],
  maundy:[['این روز شام آخر را به یاد می‌آورد؛ عیسی نان و جام را با شاگردان تقسیم کرد و نمونه‌ای از محبت و خدمت فروتنانه نشان داد.','This day remembers the Last Supper, when Jesus shared the bread and cup with His disciples and modeled humble, loving service.','Ovaj dan podsjeća na Posljednju večeru, kada je Isus s učenicima podijelio kruh i čašu te pokazao poniznu službu ljubavi.'],'اول قرنتیان ۱۱:۲۳–۲۶','1 Corinthians 11:23–26','1 Korinćanima 11,23–26'],
  good_friday:[['جمعه نیک یادآور مصلوب شدن عیسی مسیح و قربانی او برای ماست؛ صلیب مرکز پیام آشتی و فیض خداست.','Good Friday remembers the crucifixion of Jesus Christ and His sacrifice for us; the cross stands at the center of the message of reconciliation and grace.','Veliki petak podsjeća na raspeće Isusa Krista i njegovu žrtvu za nas; križ je u središtu poruke pomirenja i milosti.'],'یوحنا ۱۹:۱۶–۳۰','John 19:16–30','Ivan 19,16–30'],
  holy_saturday:[['شنبه مقدس فاصله میان صلیب و صبح قیام را به یاد می‌آورد؛ روز انتظار پیش از اعلام خبر قیام.','Holy Saturday remembers the time between the cross and resurrection morning—a day of waiting before the resurrection is proclaimed.','Velika subota podsjeća na vrijeme između križa i jutra uskrsnuća — dan iščekivanja prije navještaja uskrsnuća.'],'متی ۲۷:۵۷–۶۶','Matthew 27:57–66','Matej 27,57–66'],
  easter:[['عید قیام جشن رستاخیز عیسی مسیح از مردگان است. قبر خالی اعلام می‌کند که مرگ آخرین سخن را ندارد و مسیح زنده است.','Easter celebrates the resurrection of Jesus Christ from the dead. The empty tomb proclaims that death does not have the final word and Christ is alive.','Uskrs slavi uskrsnuće Isusa Krista od mrtvih. Prazan grob naviješta da smrt nema posljednju riječ i da Krist živi.'],'لوقا ۲۴:۱–۷','Luke 24:1–7','Luka 24,1–7'],
  easter_monday:[['این روز ادامه شادی قیام است و یادآور ملاقات شاگردان با مسیح برخاسته و شهادت آنان به زنده بودن اوست.','This day continues the joy of Easter and remembers the disciples encountering the risen Christ and bearing witness that He is alive.','Ovaj dan nastavlja uskrsnu radost i podsjeća na susrete učenika s uskrslim Kristom i njihovo svjedočanstvo da je živ.'],'لوقا ۲۴:۱۳–۳۵','Luke 24:13–35','Luka 24,13–35'],
  ascension:[['عید صعود یادآور صعود عیسی نزد پدر پس از قیام است؛ شاگردان مأمور شدند شاهدان او باشند و در انتظار قوت روح‌القدس بمانند.','Ascension remembers Jesus ascending to the Father after His resurrection; the disciples were commissioned to be His witnesses and to wait for the power of the Holy Spirit.','Uzašašće podsjeća na Isusov odlazak Ocu nakon uskrsnuća; učenici su poslani biti njegovi svjedoci i čekati snagu Duha Svetoga.'],'اعمال ۱:۸–۱۱','Acts 1:8–11','Djela 1,8–11'],
  pentecost:[['پنطیکاست در زمینه عید یهودی هفته‌ها (شاووعوت) رخ داد؛ زمانی که یهودیان از سرزمین‌های مختلف در اورشلیم گرد می‌آمدند. در اعمال ۲، روح‌القدس بر شاگردان نازل شد، آنان با زبان‌های دیگر سخن گفتند و شهادت کلیسا با قوت آغاز شد.','Pentecost took place in the setting of the Jewish Feast of Weeks (Shavuot), when Jews from many regions gathered in Jerusalem. In Acts 2, the Holy Spirit came upon the disciples, they spoke in other tongues, and the Church’s witness began in power.','Duhovi su se dogodili u okviru židovskog Blagdana sedmica (Šavuot), kada su se Židovi iz mnogih krajeva okupljali u Jeruzalemu. U Djelima 2 Duh Sveti sišao je na učenike, govorili su drugim jezicima i svjedočanstvo Crkve započelo je u sili.'],'اعمال ۲:۱–۴','Acts 2:1–4','Djela 2,1–4'],
  pentecost_monday:[['این روز ادامه یادبود پنطیکاست و کار روح‌القدس در زندگی و مأموریت کلیساست.','This day continues the remembrance of Pentecost and the work of the Holy Spirit in the life and mission of the Church.','Ovaj dan nastavlja spomen Duhova i djelovanja Duha Svetoga u životu i poslanju Crkve.'],'اعمال ۱:۸','Acts 1:8','Djela 1,8'],
  all_saints:[['این روز یادآور ایماندارانی است که پیش از ما در ایمان زیسته‌اند و ما را به پایداری در مسابقه ایمان تشویق می‌کند.','This day remembers believers who have gone before us in faith and encourages perseverance in the race of faith.','Ovaj dan podsjeća na vjernike koji su prije nas živjeli u vjeri i potiče nas na ustrajnost u trci vjere.'],'عبرانیان ۱۲:۱–۲','Hebrews 12:1–2','Hebrejima 12,1–2'],
  christmas_eve:[['شب میلاد زمان آماده شدن برای یادبود آمدن عیسی مسیح به جهان است؛ تحقق وعده خدا درباره نجات‌دهنده.','Christmas Eve prepares us to remember the coming of Jesus Christ into the world—the fulfillment of God’s promise of a Savior.','Badnjak nas pripravlja za spomen dolaska Isusa Krista na svijet — ispunjenje Božjeg obećanja o Spasitelju.'],'لوقا ۲:۱–۱۴','Luke 2:1–14','Luka 2,1–14'],
  christmas:[['کریسمس یادبود تولد عیسی مسیح است؛ کلمه جسم شد و در میان ما ساکن گردید. این روز آمدن نجات‌دهنده و محبت خدا آشکارشده در مسیح را جشن می‌گیرد.','Christmas remembers the birth of Jesus Christ: the Word became flesh and dwelt among us. It celebrates the coming of the Savior and God’s love revealed in Christ.','Božić je spomen rođenja Isusa Krista: Riječ je tijelom postala i nastanila se među nama. Slavimo dolazak Spasitelja i Božju ljubav objavljenu u Kristu.'],'لوقا ۲:۱۰–۱۴؛ یوحنا ۱:۱۴','Luke 2:10–14; John 1:14','Luka 2,10–14; Ivan 1,14'],
  stephen:[['این روز استیفان، نخستین شهید ثبت‌شده کلیسای اولیه را به یاد می‌آورد؛ او با ایمان و بخشش تا پایان بر مسیح شهادت داد.','This day remembers Stephen, the first recorded martyr of the early Church, who bore witness to Christ with faith and forgiveness to the end.','Ovaj dan podsjeća na Stjepana, prvog zabilježenog mučenika rane Crkve, koji je do kraja svjedočio za Krista vjerom i oproštenjem.'],'اعمال ۷:۵۴–۶۰','Acts 7:54–60','Djela 7,54–60']
 };const x=texts[id];return x?{body:x[0][lang()==='fa'?0:lang()==='hr'?2:1],verse:x[lang()==='fa'?1:lang()==='hr'?3:2]}:{body:'',verse:''}
}
function eventFor(now=new Date()){if(!(now instanceof Date)||!Number.isFinite(now.getTime()))return null;const y=now.getFullYear(),e=easter(y),today=key(now),rows=[
[y+'-01-01','holy_name','✝️',L('نام‌گذاری عیسی','Holy Name of Jesus','Ime Isusovo')],
[y+'-01-06','epiphany','✨',L('ظهور مسیح','Epiphany','Bogojavljenje')],
[key(plus(e,-46)),'ash','🕊️',L('چهارشنبه خاکستر','Ash Wednesday','Pepelnica')],
[key(plus(e,-7)),'palm','🌿',L('یکشنبه نخل','Palm Sunday','Cvjetnica')],
[key(plus(e,-3)),'maundy','🍞',L('پنجشنبه مقدس','Maundy Thursday','Veliki četvrtak')],
[key(plus(e,-2)),'good_friday','✝️',L('جمعه نیک','Good Friday','Veliki petak')],
[key(plus(e,-1)),'holy_saturday','🕯️',L('شنبه مقدس','Holy Saturday','Velika subota')],
[key(e),'easter','🌅',L('عید قیام مسیح','Easter Sunday','Uskrs')],
[key(plus(e,1)),'easter_monday','🌅',L('دوشنبه عید پاک','Easter Monday','Uskrsni ponedjeljak')],
[key(plus(e,39)),'ascension','☁️',L('عید صعود','Ascension','Uzašašće')],
[key(plus(e,49)),'pentecost','🔥',L('پنطیکاست','Pentecost','Duhovi')],
[key(plus(e,50)),'pentecost_monday','🔥',L('دوشنبه پنطیکاست','Pentecost Monday','Duhovski ponedjeljak')],
[y+'-11-01','all_saints','🕯️',L('روز همه مقدسین','All Saints’ Day','Svi sveti')],
[y+'-12-24','christmas_eve','🕯️',L('شب میلاد','Christmas Eve','Badnjak')],
[y+'-12-25','christmas','⭐',L('میلاد عیسی مسیح','Christmas','Božić')],
[y+'-12-26','stephen','✝️',L('روز استیفان مقدس','St Stephen’s Day','Sveti Stjepan')]
];const x=rows.find(r=>r[0]===today);if(!x)return null;const info=feastText(x[1]);return{key:today,id:x[1],icon:x[2],title:x[3],body:info.body,verse:info.verse}}

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
 for(let i=0;i<26;i++){const confetti=node('b','nh7-bday-confetti464 c'+i%5);confetti.style.setProperty('--i',String(i));confetti.style.setProperty('--drift',i%2?'12px':'-12px');confetti.style.animation='nh7Confetti464 3.4s ease-in '+(.5+i*.035)+'s forwards';layer.append(confetti)}
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
