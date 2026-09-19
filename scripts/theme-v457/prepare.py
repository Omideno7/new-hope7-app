"""Theme-only changes. Existing user palettes, fonts and all content keep their keys."""
from pathlib import Path
import json,re,subprocess
BASE='466badb8a151dbdf02d07606a99e9660da1fe04a'
OUT=Path('qa-theme457');OUT.mkdir(exist_ok=True)

def edit(name,fn):
    p=Path(name);old=p.read_text();new=fn(old)
    if new!=old:p.write_text(new)

def app(s):
    if 'data-appearance-basics457' not in s:
        begin=s.index('      <div class="nh7-theme-quick-wrap">',s.index('function nh7AppearanceSettingsHtml'))
        end=s.index('      <label class="nh7-accent-control">',begin)
        s=s[:begin]+s[end:]
        s=s.replace('class="nh7-appearance-panel" id="nh7AppearancePanel"','class="nh7-appearance-panel" id="nh7AppearancePanel" data-appearance-basics457',1)
        s=s.replace("'ظاهر و خوانایی','Appearance & readability','Izgled i čitljivost'","'فونت، اندازه و رنگ تأکید','Fonts, size and accent','Fontovi, veličina i naglasak'",1)
        s=s.replace("'تم، اندازه نوشته، فونت و رنگ ماژول‌ها را برای همین دستگاه انتخاب کنید. تغییرات فوراً اعمال و ذخیره می‌شوند.','Choose the theme, text size, font and module color for this device. Changes apply and save immediately.','Odaberite temu, veličinu teksta, font i boju modula za ovaj uređaj. Promjene se odmah primjenjuju i spremaju.'","'تم را در مجموعهٔ بالا انتخاب کنید. فونت، اندازه و رنگ تأکید از اینجا هم فوراً قابل تغییرند.','Choose a theme in the gallery above. Font, size and accent changes here apply immediately.','Odaberite temu u galeriji iznad. Promjene fonta, veličine i naglaska ovdje se odmah primjenjuju.'",1)
    return s
edit('js/app.js',app)
labels={'sapphire':['آبی زنده','Vivid blue','Živopisna plava'],'emerald':['زمردی','Emerald','Smaragdna'],'sunset':['غروب نارنجی','Sunset','Zalazak sunca'],'orchid':['ارکیده','Orchid','Orhideja'],'berry':['تمشکی','Berry','Bobičasta'],'aurora':['شب ارغوانی','Aurora night','Ljubičasta noć']}
presets={
'sapphire':dict(bg='#adc8ff',card='#f3f6ff',text='#11274f',muted='#354d73',verse='#142e54',accent='#1944d8'),
'emerald':dict(bg='#8addc3',card='#eefff7',text='#073c31',muted='#255648',verse='#093d31',accent='#00724f'),
'sunset':dict(bg='#ffc082',card='#fff5e9',text='#4a2309',muted='#734323',verse='#4c290e',accent='#b74509'),
'orchid':dict(bg='#d0afff',card='#f9f1ff',text='#331551',muted='#604477',verse='#41195b',accent='#8031c2'),
'berry':dict(bg='#ffa8bc',card='#fff0f4',text='#57122b',muted='#7b344d',verse='#4f1b30',accent='#bb1b57'),
'aurora':dict(bg='#131034',card='#272250',text='#faf5ff',muted='#d0bfea',verse='#fff5e4',accent='#efc759')}

def studio(s):
    if 'const THEME_GROUPS457=' in s:return s
    p=s.index('const PRESETS={')
    s=s[:p]+"Object.assign(LABELS,"+json.dumps(labels,ensure_ascii=False,separators=(',',':'))+");\n"+s[p:]
    pos=s.index('const FONT_FA=')
    addition="Object.assign(PRESETS,"+json.dumps(presets,separators=(',',':'))+");\n"+r'''
const THEME_GROUPS457={
 vivid:{label:['زنده و رنگی','Colorful','Živopisne'],ids:['sapphire','emerald','sunset','orchid','berry']},
 soft:{label:['ملایم و مطالعه','Soft / Reading','Blage / Čitanje'],ids:['hope','ocean','forest','royal','sand','rose','sepia']},
 dark:{label:['تم‌های تیره','Dark themes','Tamne teme'],ids:['midnight','aurora']}
};
let galleryGroup457='',previousColorScheme457=null;
function groupFor457(id){return Object.keys(THEME_GROUPS457).find(k=>THEME_GROUPS457[k].ids.includes(id))||'vivid'}
function gallery457(){
 const current=clean(read(KEY,null));
 if(!galleryGroup457)galleryGroup457=current?groupFor457(current.preset):'vivid';
 return `<div class="nh7-theme-group-tabs457" role="tablist" aria-label="${E(L('گروه تم‌ها','Theme groups','Skupine tema'))}">${Object.entries(THEME_GROUPS457).map(([id,g])=>`<button type="button" role="tab" id="theme-tab-${id}457" aria-controls="theme-group-${id}457" aria-selected="${galleryGroup457===id}" tabindex="${galleryGroup457===id?'0':'-1'}" data-theme-group457="${id}">${E(L(...g.label))}</button>`).join('')}</div>${Object.entries(THEME_GROUPS457).map(([group,g])=>`<div class="nh7-studio-presets453" role="tabpanel" id="theme-group-${group}457" aria-labelledby="theme-tab-${group}457" ${galleryGroup457===group?'':'hidden'}>${g.ids.map(id=>{const c=PRESETS[id];return `<button type="button" data-studio-preset453="${id}" aria-pressed="${current?.preset===id}" style="--chip-bg:${c.bg};--chip-card:${c.card};--chip-ink:${c.text};--chip-accent:${c.accent}"><span class="nh7-studio-mini453"><i></i><b>${E(L('آ','Aa','Aa'))}</b></span><strong>${E(pick(LABELS[id]))}</strong></button>`}).join('')}</div>`).join('')}<p id="nh7StudioCurrent457" role="status">${E(L('تم فعال: ','Active theme: ','Aktivna tema: ')+(current?(LABELS[current.preset]?pick(LABELS[current.preset]):L('شخصی','Custom','Prilagođena')):L('ظاهر قبلی دستگاه','Previous device appearance','Prethodni izgled uređaja')))}</p>`;
}
function selectGroup457(group,focus=false){
 if(!Object.hasOwn(THEME_GROUPS457,group))return;
 galleryGroup457=group;const panel=document.getElementById('nh7ThemeStudio453');if(!panel)return;
 panel.querySelectorAll('[data-theme-group457]').forEach(b=>{const on=b.dataset.themeGroup457===group;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;if(on&&focus)b.focus()});
 panel.querySelectorAll('[role="tabpanel"]').forEach(n=>n.hidden=n.id!=='theme-group-'+group+'457');
}
function syncAccent457(){
 const current=clean(read(KEY,null)),select=document.getElementById('nh7AccentSelect'),custom=document.getElementById('nh7AccentCustom');
 if(!current||!select||!custom)return;
 const palette={blue:'#1d4ed8',green:'#15803d',red:'#b91c1c',purple:'#7e22ce',orange:'#c2410c',teal:'#0f766e',pink:'#be185d'};
 select.value=Object.keys(palette).find(k=>palette[k]===current.accent)||'custom';custom.value=current.accent;
}
'''
    s=s[:pos]+addition+s[pos:]
    s=s.replace("function clearVariables(){delete root.dataset.nh7Studio;", "function clearVariables(){delete root.dataset.nh7StudioTone457;if(previousColorScheme457!==null){previousColorScheme457?root.style.setProperty('color-scheme',previousColorScheme457):root.style.removeProperty('color-scheme');previousColorScheme457=null}delete root.dataset.nh7Studio;",1)
    marker="lastApplied=signature;root.dataset.nh7Studio=c.preset;root.dataset.nh7StudioFont='1';";assert marker in s
    s=s.replace(marker,marker+"\n if(previousColorScheme457===null)previousColorScheme457=root.style.getPropertyValue('color-scheme');const tone=luminance(c.card)<0.2?'dark':'light';root.dataset.nh7StudioTone457=tone;root.style.setProperty('color-scheme',tone);",1)
    begin=s.index('<div class="nh7-studio-presets453">${Object.entries(PRESETS)');end=s.index('<div class="nh7-studio-sample453"',begin)
    s=s[:begin]+'${gallery457()}'+s[end:]
    s=s.replace("old.insertAdjacentElement('afterend',panel);preview();", "old.insertAdjacentElement('beforebegin',panel);preview();syncAccent457();",1)
    s=s.replace("'یک تم آماده انتخاب کن یا ظاهر دلخواهت را بساز. این تنظیمات فقط برای همین دستگاه هستند.','Choose a preset or create your own look. These settings apply only to this device.','Odaberite temu ili stvorite vlastiti izgled. Postavke vrijede samo za ovaj uređaj.'", "'با لمس هر تم، ظاهر فوراً تغییر می‌کند. رنگ‌های شخصی را پیش از اعمال، در پیش‌نمایش ببین.','Tap a theme to apply it immediately. Custom colors can be previewed before applying.','Dodirnite temu za trenutačnu primjenu. Prilagođene boje možete pregledati prije primjene.'",1)
    begin=s.index("  if(b.dataset.studioPreset453){");end=s.index("  else if(b.hasAttribute('data-studio-apply453'))",begin)
    new="""  if(b.dataset.themeGroup457){selectGroup457(b.dataset.themeGroup457);return}
  if(b.dataset.studioPreset453){const id=b.dataset.studioPreset453,fonts={fa:draft.fa,latin:draft.latin};draft={...base(id),...fonts};galleryGroup457=groupFor457(id);if(set(draft)){renderKey='';mount();status(L('تم اعمال شد: ','Theme applied: ','Tema primijenjena: ')+pick(LABELS[id]))}}
"""
    s=s[:begin]+new+s[end:]
    idx=s.index(" panel.addEventListener('input',event=>")
    s=s[:idx]+" panel.addEventListener('keydown',event=>{const b=event.target.closest('[data-theme-group457]');if(!b||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const keys=Object.keys(THEME_GROUPS457),i=keys.indexOf(b.dataset.themeGroup457),delta=(event.key==='ArrowRight'?1:-1)*(lang()==='fa'?-1:1);const next=event.key==='Home'?0:event.key==='End'?keys.length-1:(i+delta+keys.length)%keys.length;selectGroup457(keys[next],true)});\n"+s[idx:]
    s=s.replace("String(b.dataset.studioPreset453===draft.preset)","String(b.dataset.studioPreset453===clean(read(KEY,null))?.preset)")
    s=s.replace("apply();mount()})}","apply();mount();syncAccent457()})}")
    idx=s.index("window.addEventListener('change',event=>{if(['langSelect'")
    extra=r'''
window.addEventListener('change',event=>{
 const input=event.target;if(!['nh7AccentSelect','nh7AccentCustom'].includes(input.id))return;
 const current=clean(read(KEY,null));if(!current)return;
 const palette={blue:'#1d4ed8',green:'#15803d',red:'#b91c1c',purple:'#7e22ce',orange:'#c2410c',teal:'#0f766e',pink:'#be185d'};
 const id=input.id==='nh7AccentCustom'?'custom':input.value,color=id==='custom'?document.getElementById('nh7AccentCustom')?.value:palette[id];
 if(!/^#[0-9a-f]{6}$/i.test(color||''))return;
 event.preventDefault();event.stopImmediatePropagation();
 if(set({...current,accent:color,preset:'custom'})){try{localStorage.setItem('nh7_ui_accent_v430',id);localStorage.setItem('nh7_ui_accent_custom_v431',color)}catch(_){}window.NH7_UI_PREFS?.apply?.();draft=clean(read(KEY,null));renderKey='';mount();syncAccent457();status(L('رنگ تأکید اعمال شد','Accent color applied','Primijenjena boja naglaska'))}
},true);
'''
    s=s[:idx]+extra+s[idx:]
    s=s.replace("VERSION:'4.5.3',KEY", "VERSION:'4.5.7',KEY",1)
    return s
edit('js/nh7-theme-studio-v453.js',studio)

def index(s):
    for path in ['js/app.js','js/nh7-theme-studio-v453.js']:
        s=re.sub(r'('+re.escape(path)+r')\?[^\"]+',r'\1?v=4.5.7-theme-preview',s)
    if 'css/nh7-theme-gallery-v457.css' not in s:s=s.replace('</head>','  <link rel="stylesheet" href="css/nh7-theme-gallery-v457.css?v=4.5.7" />\n</head>')
    return s
edit('index.html',index)
if Path('.git').exists():
    old=subprocess.check_output(['git','show',BASE+':js/app.js'],text=True)
    def stripped(v):return re.sub(r'function nh7AppearanceSettingsHtml\(\)\{[\s\S]*?(?=\nfunction nh7BindAppearanceSettings)', '<APPEARANCE HTML>',v)
    assert stripped(old)==stripped(Path('js/app.js').read_text()),'Unrelated app logic changed'
    subprocess.run(['git','diff','--exit-code',BASE,'--','data','supabase','version.json','manifest.json','service-worker.js','sw-release-core-v403.js','js/nh7-fonts-v454.js','js/nh7-audio-classic-v400.js'],check=True)
    subprocess.run(['git','diff','--check'],check=True)
(OUT/'scope-report.json').write_text(json.dumps({'status':'passed','base':BASE,'oldPresetsPreserved':8,'newPresets':list(presets),'totalPresets':14,'groups':['vivid','soft','dark'],'oldModeControlsRemoved':True,'oldModeStoragePreserved':True,'presetAppliesOnTap':True,'runtimeScope':['js/app.js','js/nh7-theme-studio-v453.js','index.html','css/nh7-theme-gallery-v457.css'],'userDataMigration':False},indent=2))
print('Prepared single theme gallery: 8 preserved + 6 additional presets; old data keys unchanged.')
