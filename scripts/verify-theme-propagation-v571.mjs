import fs from 'node:fs';

const read=p=>fs.readFileSync(p,'utf8');
const must=(ok,msg)=>{if(!ok)throw new Error(msg)};
const has=(text,needle,msg)=>must(text.includes(needle),msg||`Missing: ${needle}`);

const css=read('css/nh7-finalqa-v558.css');
const appearanceCss=read('css/nh7-appearance-personalization-v514.css');
const appearanceJs=read('js/nh7-appearance-personalization-v514.js');
const celebrationCss=read('css/nh7-celebrations-v464.css');

has(css,'New Hope 7 Wave 2 — app-wide Theme Studio propagation','Wave 2 theme propagation layer missing');
has(css,'html[data-nh7-studio]','Theme propagation must stay scoped to resolved Theme Studio state');

for(const token of ['--nh7-ui-bg','--nh7-ui-surface','--nh7-ui-text','--nh7-ui-muted','--nh7-ui-verse','--nh7-ui-accent','--nh7-ui-line','--nh7-ui-button-ink']){
  has(css,token,`Missing semantic theme token ${token}`);
}

for(const target of ['.amen-card','.topbar','.bottom-nav','.nh7-adaptive570-sidebar','.nh7-celebration-dialog464','.verse-text','.reader-verse','.inbox-item']){
  has(css,target,`Theme propagation target missing: ${target}`);
}

has(css,'html[data-nh7-studio-tone457="dark"]','Dark theme reader safeguard missing');
has(css,'color:var(--nh7-ui-verse)!important','Verse text must use the resolved verse token');
has(css,'@media(prefers-reduced-motion:reduce)','Reduced motion safeguard missing');
has(css,'@keyframes nh7ThemeMotion571','Motion style animation missing');

for(const style of ['glass','aurora','clay','floating','neon','motion']){
  has(css,`data-nh7-ui-style514="${style}"`,`Global personality propagation missing for ${style}`);
}

for(const style of ['tactile','glass','minimal','material','outline','pill','aurora','clay','floating','neon','motion']){
  has(appearanceCss,`data-nh7-ui-style514="${style}"`,`Existing Theme Studio personality missing: ${style}`);
}

has(appearanceJs,"root.dataset.nh7StudioTone457=lum(c.card)<.2?'dark':'light'",'Theme tone resolver missing');
has(appearanceJs,"root.style.setProperty('--nh7-studio-verse',c[k])".replace('verse',"'+k+'"),'Theme variable loop changed unexpectedly');
// The controller must remain local-only; it may persist appearance preferences but must not introduce network writes.
must(!appearanceJs.includes('supabase.functions.invoke'),'Appearance controller must not call Supabase functions');

has(celebrationCss,'--nh7-studio-card','Celebrations must retain Theme Studio compatibility');
has(celebrationCss,'prefers-reduced-motion:reduce','Celebration reduced-motion safeguard missing');

console.log('Theme propagation v571 static verification OK');
