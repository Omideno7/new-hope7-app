/* New Hope 7 — global search v5.4.3 Final QA.
   Local-first search with direct audio handoff to the canonical player. */
export function createGlobalSearchV540(ctx){
  let serial=0,timer=0;
  const norm=value=>String(value||'').normalize('NFKC').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,'')
    .replace(/[يى]/g,'ی').replace(/ك/g,'ک').replace(/[أإٱآ]/g,'ا').replace(/ۀ/g,'ه')
    .replace(/\u200c/g,' ').replace(/[’'\x60]/g,'')
    .replace(/[^\p{L}\p{N}]+/gu,' ').replace(/\s+/g,' ').trim();
  const L=(fa,en,hr)=>ctx.lang()==='fa'?fa:ctx.lang()==='hr'?hr:en;
  const snippet=(value,max=150)=>{const clean=String(value||'').replace(/\s+/g,' ').trim();return clean.length>max?clean.slice(0,max-1)+'…':clean};
  const label=kind=>({bible:L('کتاب مقدس','Bible','Biblija'),saved:L('آیات ذخیره‌شده','Saved verses','Spremljeni retci'),notes:L('یادداشت‌های من','My notes','Moje bilješke'),audio:L('پیام‌های صوتی','Audio messages','Audio poruke')})[kind]||kind;
  function button(item){
    return '<button type="button" class="nh7-global-hit-v540" data-global-action=\''+ctx.html(JSON.stringify(item.action||{}))+'\'>'+
      '<span class="nh7-global-hit-icon-v540">'+ctx.html(item.icon||'⌕')+'</span><span><strong>'+ctx.html(item.title||'')+'</strong>'+
      (item.meta?'<small>'+ctx.html(item.meta)+'</small>':'')+(item.snippet?'<small class="nh7-global-snippet-v540">'+ctx.html(item.snippet)+'</small>':'')+
      '</span><span aria-hidden="true">›</span></button>';
  }
  function section(kind,items){
    if(!items||!items.length)return '';
    return '<section class="nh7-global-section-v540"><h4>'+ctx.html(label(kind))+' <small>'+ctx.localNum(items.length)+'</small></h4><div class="nh7-global-results-list-v540">'+items.map(button).join('')+'</div></section>';
  }
  function noteAction(key){
    key=String(key||'');
    if(key.startsWith('nh7_sermon_note_'))return {route:'audio',params:{note:key.slice('nh7_sermon_note_'.length)}};
    if(key.startsWith('nh7_note_school-'))return {route:'school',params:{lesson:key.slice('nh7_note_school-'.length)}};
    if(key.startsWith('nh7_gratitude_note_'))return {route:'daily',params:{tab:'gratitude',gday:Number(key.slice('nh7_gratitude_note_'.length))||1}};
    return {type:'homeNote',key};
  }
  async function noteResults(query,limit=10){
    const q=norm(query),rows=[],cache=ctx.audioCache(),sermons=cache&&Array.isArray(cache.sermons)?cache.sermons:[];
    for(let i=0;i<localStorage.length&&rows.length<limit;i++){
      const key=localStorage.key(i);if(!key)continue;
      let text='',title='',action=null;
      if(key.startsWith('nh7_note_')||key.startsWith('nh7_gratitude_note_')||key.startsWith('nh7_sermon_note_')){
        text=ctx.normalizeNote(localStorage.getItem(key)||'');if(!text)continue;
        if(key.startsWith('nh7_sermon_note_')){
          const id=key.slice('nh7_sermon_note_'.length),sermon=sermons.find(x=>String(x.id)===String(id));
          title=(sermon&&((sermon['title_'+ctx.lang()])||sermon.title_fa||sermon.title_en))||L('یادداشت موعظه','Sermon note','Bilješka propovijedi');
        }else if(key.startsWith('nh7_note_school-'))title=L('یادداشت تکلیف مدرسه','School assignment note','Bilješka školskog zadatka')+' · '+key.slice('nh7_note_school-'.length);
        else if(key.startsWith('nh7_gratitude_note_'))title=L('یادداشت شکرگزاری','Gratitude note','Bilješka zahvalnosti')+' · '+ctx.localNum(Number(key.slice('nh7_gratitude_note_'.length))||1);
        else title=key.replace(/^nh7_/,'').replace(/_/g,' ');
        action=noteAction(key);
      }else if(key.startsWith('nh7_bible_state_')){
        let st={};try{st=JSON.parse(localStorage.getItem(key)||'{}')}catch(_){}
        text=ctx.normalizeNote(st&&st.note||'');if(!text)continue;
        const resolved=await ctx.bible().resolveStateKey(key).catch(()=>null);
        title=resolved&&resolved.reference?ctx.localizeRef(resolved.reference):L('یادداشت آیه','Verse note','Bilješka retka');
        action=resolved?{route:'bible',params:{section:'written',mode:'chapter',bookId:resolved.bookId,chapter:resolved.chapter,verse:resolved.verse}}:{type:'homeNote',key};
      }else continue;
      if(!norm(title+' '+text).includes(q))continue;
      rows.push({icon:'📝',title,snippet:snippet(text),action});
    }
    return rows;
  }
  async function audioResults(query,limit=8){
    const q=norm(query),out=[],seen=new Set();
    let cached=ctx.audioCache();
    if(!cached&&ctx.audioCatalog)cached=await ctx.audioCatalog().catch(()=>null);
    for(const item of (cached&&cached.sermons)||[]){
      const title=item['title_'+ctx.lang()]||item.title_fa||item.title_en||item.title_hr||'';
      const hay=norm([item.title_fa,item.title_en,item.title_hr,item.description_fa,item.description_en,item.description_hr].join(' '));
      if(!hay.includes(q))continue;
      const id='cloud:'+String(item.id);if(seen.has(id))continue;seen.add(id);
      out.push({icon:'🎧',title,meta:L('پیام صوتی','Audio message','Audio poruka'),snippet:snippet(item['description_'+ctx.lang()]||item.description_fa||item.description_en||''),action:{type:'audio',source:'cloud',item:{id:item.id,audio_url:item.audio_url||'',cover_url:item.cover_url||'',duration_seconds:item.duration_seconds||0,category_id:item.category_id||'',speaker:item.speaker||'',title_fa:item.title_fa||'',title_en:item.title_en||'',title_hr:item.title_hr||''}}});
      if(out.length>=limit)return out;
    }
    try{
      const d=await ctx.jfetch('data/audio/messages.json');
      for(const cat of (d&&d.categories)||[])for(const item of cat.items||[]){
        const title=ctx.pick(item.title)||item.title&&item.title[ctx.lang()]||item.title&&item.title.en||String(item.title||'');
        const hay=norm(title+' '+String(item.description&&item.description[ctx.lang()]||item.description&&item.description.en||''));
        if(!hay.includes(q))continue;
        const id='bundle:'+String(cat.id)+'|'+String(item.id||item.src||title);if(seen.has(id))continue;seen.add(id);
        out.push({icon:'🎧',title,meta:ctx.pick(cat.title)||L('پیام صوتی','Audio message','Audio poruka'),action:{type:'audio',source:'bundle',cat:cat.id,item:{id:'bundled-'+String(item.id||ctx.hash?.(item.src||title)||item.src||title),audio_url:item.src||'',analytics_type:'sermon',analytics_id:String(item.id||''),analytics_topic:ctx.pick(cat.title)||'',analytics_source_group:String(cat.id||''),analytics_language:ctx.lang(),title_fa:item.title?.fa||item.title?.en||title,title_en:item.title?.en||item.title?.fa||title,title_hr:item.title?.hr||item.title?.en||title}}});
        if(out.length>=limit)return out;
      }
    }catch(_){}
    return out;
  }
  async function run(query){
    const q=String(query||'').trim(),n=norm(q);
    if(n.length<2)return {tooShort:true,bible:[],saved:[],notes:[],audio:[]};
    const values=await Promise.all([ctx.bible().find(q,{limit:60}).catch(()=>[]),noteResults(q,10).catch(()=>[]),audioResults(q,8).catch(()=>[])]);
    const bibleHits=values[0],notes=values[1],audio=values[2];
    let bookmarks=[];try{bookmarks=JSON.parse(localStorage.getItem('nh7_bookmarks')||'[]')}catch(_){}
    if(!Array.isArray(bookmarks))bookmarks=[];
    const savedSet=new Set(bookmarks.map(String)),saved=[],savedSeen=new Set();
    for(const hit of bibleHits){
      if(savedSet.has(String(hit.reference))&&!savedSeen.has(String(hit.reference))){
        savedSeen.add(String(hit.reference));saved.push({icon:'★',title:ctx.localizeRef(hit.reference),snippet:snippet(hit.text),action:{route:'bible',params:{section:'written',mode:'chapter',bookId:hit.bookId,chapter:hit.chapter,verse:hit.verse}}});
        if(saved.length>=8)break;
      }
    }
    if(saved.length<8){
      await ctx.loadBibleMeta();
      for(const ref of bookmarks){
        if(saved.length>=8||savedSeen.has(String(ref))||!norm(ctx.localizeRef(ref)).includes(n))continue;
        const parsed=ctx.parseRef(ref);if(!parsed)continue;
        savedSeen.add(String(ref));saved.push({icon:'★',title:ctx.localizeRef(ref),action:{route:'bible',params:{section:'written',mode:'chapter',bookId:parsed.bookId,chapter:parsed.chapter,verse:parsed.verse}}});
      }
    }
    const bible=bibleHits.slice(0,12).map(hit=>({icon:'📖',title:ctx.localizeRef(hit.reference),snippet:snippet(hit.text),action:{route:'bible',params:{section:'written',mode:'chapter',bookId:hit.bookId,chapter:hit.chapter,verse:hit.verse}}}));
    return {tooShort:false,bible,saved,notes,audio};
  }
  function paint(box,result,query){
    if(!box)return;
    if(result&&result.tooShort){box.innerHTML='<p class="muted">'+ctx.html(L('حداقل دو حرف وارد کنید.','Type at least two characters.','Unesite najmanje dva znaka.'))+'</p>';return}
    const total=(result.bible||[]).length+(result.saved||[]).length+(result.notes||[]).length+(result.audio||[]).length;
    box.innerHTML=total?'<p class="muted nh7-global-meta-v540">'+ctx.html(L('نتایج برای','Results for','Rezultati za'))+': <strong>'+ctx.html(query)+'</strong> · '+ctx.localNum(total)+'</p>'+section('saved',result.saved)+section('notes',result.notes)+section('bible',result.bible)+section('audio',result.audio):'<p class="muted">'+ctx.html(L('نتیجه‌ای پیدا نشد.','No result found.','Nema rezultata.'))+'</p>';
  }
  function htmlBlock(){
    const placeholder=L('جستجوی مرکزی','Search everywhere','Pretraži sve');
    return ctx.card('','<div class="nh7-global-search-v540"><label class="nh7-global-input-shell-v540" for="nh7GlobalSearchV540"><span class="nh7-global-search-icon-v540" aria-hidden="true">⌕</span><input id="nh7GlobalSearchV540" type="search" autocomplete="off" aria-label="'+ctx.html(placeholder)+'" placeholder="'+ctx.html(placeholder)+'"></label><div id="nh7GlobalSearchResultsV540" class="nh7-global-search-results-v540"></div></div>','nh7-global-search-card-v540');
  }
  function mount(){
    const input=document.getElementById('nh7GlobalSearchV540'),box=document.getElementById('nh7GlobalSearchResultsV540');if(!input||!box)return;
    const trigger=()=>{clearTimeout(timer);const value=input.value||'',id=++serial;timer=setTimeout(async()=>{box.innerHTML='<p class="muted">'+ctx.html(L('در حال جستجو…','Searching…','Pretraživanje…'))+'</p>';const result=await run(value);if(id!==serial)return;paint(box,result,value)},280)};
    input.addEventListener('input',trigger);input.addEventListener('search',trigger);
    box.addEventListener('click',event=>{
      const button=event.target.closest('[data-global-action]');if(!button)return;
      let action={};try{action=JSON.parse(button.dataset.globalAction||'{}')}catch(_){}
      if(action.type==='audio'&&ctx.openAudio){ctx.openAudio(action);return}
      if(action.route){ctx.navigate(action.route,action.params||{});return}
      if(action.type==='homeNote'){
        const panel=document.getElementById('notesPanel');if(panel)panel.classList.remove('hidden');
        const nodes=panel?Array.from(panel.querySelectorAll('[data-note-key]')):[];
        const node=nodes.find(x=>x.dataset.noteKey===action.key);if(node){node.scrollIntoView({behavior:'smooth',block:'center'});node.classList.add('nh7-global-focus-v540');setTimeout(()=>node.classList.remove('nh7-global-focus-v540'),1800)}
      }
    });
  }
  return {html:htmlBlock,mount,run};
}
