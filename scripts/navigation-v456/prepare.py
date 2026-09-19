"""Navigation-only rendering edits plus stale-view fencing; data contracts stay intact."""
from pathlib import Path
import json,re,subprocess
BASE='08d3bfb51532163392fe87cd017e316327c38234'
OUT=Path('qa-nav456');OUT.mkdir(exist_ok=True)
p=Path('js/app.js');s=p.read_text()
old="`<div class=\"grid\">${tile('bible','📖',tr('bible'))}${tile('plans','✓',tr('plans'))}${tile('school','🎓',tr('school'))}${tile('meetings','☎',tr('meetings'))}</div>`;"
new="`<div class=\"grid nh7-home-destinations456\" data-home-navigation456>${tile('meetings','☎',tr('meetings'),l223('زمان جلسات و دسترسی به جلسه','Meeting times and access','Vrijeme sastanaka i pristup'))}</div>`;"
if 'data-home-navigation456' not in s:
 assert s.count(old)==1,'Unexpected Home renderer';s=s.replace(old,new,1)
start=s.index('async function more(){');end=s.index('\n\nasync function fetchMyQuestionsCloud',start)
more='''async function more(){
  // Generic entry points have one stable home. Contextual shortcuts and deep links remain unchanged.
  const destinations=[['audio','🎧'],['salvation','✝'],['qna','❓'],['account','👤'],['about','ℹ'],['settings','⚙']];
  const locations=[
    [tr('school'),l223('نوار پایین ← مدرسه','Bottom bar → School','Donja traka → Škola'),'school'],
    [tr('bible'),l223('نوار پایین ← کتاب مقدس','Bottom bar → Bible','Donja traka → Biblija'),'bible'],
    [tr('plans'),l223('نوار پایین ← برنامه‌ها','Bottom bar → Plans','Donja traka → Planovi'),'plans'],
    [tr('gratitudeCourse'),l223('روزانه ← دوره شکرگزاری','Daily → Gratitude Course','Dnevno → Tečaj zahvalnosti'),'gratitude'],
    [tr('meetings'),l223('خانه ← جلسات کلیسا','Home → Church Meetings','Početna → Crkveni sastanci'),'meetings'],
    [tr('inbox'),l223('دکمهٔ صندوق ورودی در نوار بالای صفحه','Inbox button in the top bar','Gumb ulazne pošte na gornjoj traci'),'inbox']
  ];
  view.innerHTML=`<div class="grid" data-more-navigation456>${destinations.map(([route,icon])=>tile(route,icon,tr(route))).join('')}</div>
    <details class="nh7-navigation-guide456">
      <summary>${html(l223('امکانات دیگر کجا هستند؟','Where are the other features?','Gdje su ostale značajke?'))}</summary>
      <p>${html(l223('فقط میانبرهای تکراری برداشته شده‌اند؛ هیچ محتوا یا اطلاعاتی حذف نشده است.','Only duplicate shortcuts were removed; no content or personal data was deleted.','Uklonjeni su samo ponovljeni prečaci; sadržaj i osobni podaci nisu izbrisani.'))}</p>
      <dl>${locations.map(([name,location,id])=>`<div data-nav-location456="${id}"><dt>${html(name)}</dt><dd>${html(location)}</dd></div>`).join('')}</dl>
    </details>`;
}'''
s=s[:start]+more+s[end:]
# Epoch fencing is memory-only: it never cancels a request, changes approval or writes user state.
fences=[
 ('async function render(route, params={}, preserve=false){','let nh7NavigationEpochV456=0;\nasync function render(route, params={}, preserve=false){\n  const navigationEpochV456=++nh7NavigationEpochV456;'),
 ('    bindDynamic();','    if(navigationEpochV456!==nh7NavigationEpochV456)return;\n    bindDynamic();'),
 ("  }catch(e){ console.error(e); view.innerHTML=card('Error',`<p>${html(e.message)}</p>`); }","  }catch(e){ if(navigationEpochV456!==nh7NavigationEpochV456)return;console.error(e); view.innerHTML=card('Error',`<p>${html(e.message)}</p>`); }"),
 ('async function meetings(params={}){','async function meetings(params={}){\n  const meetingEpochV456=nh7NavigationEpochV456;'),
 ("  view.innerHTML=card(tr('meetings'), `<p>${tr('meetingAccessText')}","  if(meetingEpochV456!==nh7NavigationEpochV456)return;\n  view.innerHTML=card(tr('meetings'), `<p>${tr('meetingAccessText')}")
]
for before,after in fences:
 if after not in s:
  assert s.count(before)==1,before;s=s.replace(before,after,1)
p.write_text(s)
p=Path('index.html');s=p.read_text()
if 'css/nh7-navigation-v456.css' not in s:s=s.replace('</head>','  <link rel="stylesheet" href="css/nh7-navigation-v456.css?v=4.5.6" />\n</head>')
s=s.replace('js/app.js?v=4.5.4','js/app.js?v=4.5.6-navigation-preview');p.write_text(s)
# Reverse the exact reviewed guards, then compare everything except the two menu renderers.
original=subprocess.check_output(['git','show',BASE+':js/app.js'],text=True)
def strip_views(text):
 for before,after in reversed(fences):text=text.replace(after,before)
 text=re.sub(r'async function home\(\)\{[\s\S]*?(?=\n\nasync function fetchDynamicDailyItem)','<HOME>',text)
 return re.sub(r'async function more\(\)\{[\s\S]*?(?=\n\nasync function fetchMyQuestionsCloud)','<MORE>',text)
assert strip_views(original)==strip_views(Path('js/app.js').read_text()),'Unrelated runtime logic changed'
assert "$('#quickNotify')?.addEventListener('click', enableNotifications);" in Path('js/app.js').read_text()
subprocess.run(['git','diff','--exit-code',BASE,'--','data','supabase','version.json','manifest.json','app','service-worker.js','sw-release-core-v403.js'],check=True)
subprocess.run(['git','diff','--check'],check=True)
report={'status':'passed','baseline':BASE,'runtimeScope':['js/app.js','index.html','css/nh7-navigation-v456.css'],'changedMenuFunctions':['home','more'],'staleViewFix':'memory-only render epoch; discard late Meetings markup and stale post-render/error callbacks','removedGenericHomeTiles':['bible','plans','school'],'removedMoreTiles':['gratitude','meetings','inbox'],'retainedRoutes':True,'meetingAuthorizationUnchanged':True,'dataWritesAdded':0,'storageMigration':False,'notificationPreferencesUnchanged':True,'bottomBarOrderUnchanged':True}
(OUT/'scope-report.json').write_text(json.dumps(report,indent=2))
print('Home/More de-duplicated; late Meetings results fenced; existing data and authorization preserved.')
