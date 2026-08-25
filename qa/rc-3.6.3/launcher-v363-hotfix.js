/* New Hope 7 QA 3.6.3 hotfix — accept both js/app.js and /js/app.js */
(async()=>{
  'use strict';
  try{
    const response=await fetch('launcher-v363.js?v=3.6.3.3',{cache:'no-store'});
    if(!response.ok)throw new Error(`QA launcher HTTP ${response.status}`);
    let source=await response.text();
    const before="find(script=>/\\/js\\/app\\.js(?:\\?|$)/.test";
    const after="find(script=>/(?:^|\\/)js\\/app\\.js(?:\\?|$)/.test";
    if(!source.includes(before))throw new Error('QA module detector patch target was not found.');
    source=source.replace(before,after);
    (0,eval)(source+'\n//# sourceURL=nh7-integration-qa-3.6.3-hotfix.js');
  }catch(error){
    console.error('[NH7 QA hotfix]',error);
    const box=document.getElementById('qaError');
    document.querySelector('.spinner')?.remove();
    if(box){
      box.style.display='block';
      box.textContent='نسخهٔ آزمایشی بارگذاری نشد.\n\n'+String(error?.message||error);
      const button=document.createElement('button');
      button.type='button';
      button.textContent='تلاش دوباره';
      button.onclick=()=>location.reload();
      box.appendChild(document.createElement('br'));
      box.appendChild(button);
    }
  }
})();
