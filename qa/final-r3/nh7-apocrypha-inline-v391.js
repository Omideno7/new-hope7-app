/* New Hope 7 Final QA R3 v3.9.1
 * Render the approved Apocrypha reader as one continuous Bible-style text flow.
 * Verse tools, highlights, notes, saved verses, share and A-/A+ remain intact.
 */
(()=>{'use strict';
if(window.__NH7_APOCRYPHA_INLINE_V391__)return;
window.__NH7_APOCRYPHA_INLINE_V391__=true;

function installStyle(){
  if(document.getElementById('nh7-apocrypha-inline-v391-style'))return;
  const style=document.createElement('style');
  style.id='nh7-apocrypha-inline-v391-style';
  style.textContent=`
  .nh7-apo-continuous-reader{
    display:block!important;
    text-align:start!important;
    line-height:2.05!important;
    white-space:normal!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-verse{
    display:inline!important;
    border:0!important;
    margin:0!important;
    padding:0!important;
    background:transparent!important;
    box-shadow:none!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-verse-main{
    display:inline!important;
    width:auto!important;
    min-width:0!important;
    min-height:0!important;
    margin:0 .16em!important;
    padding:0!important;
    border:0!important;
    border-radius:0!important;
    background:transparent!important;
    color:inherit!important;
    box-shadow:none!important;
    font:inherit!important;
    line-height:inherit!important;
    text-align:inherit!important;
    vertical-align:baseline!important;
    white-space:normal!important;
    cursor:pointer!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-verse-num{
    display:inline!important;
    min-width:0!important;
    width:auto!important;
    height:auto!important;
    margin-inline:0 .18em!important;
    padding:0!important;
    border:0!important;
    border-radius:0!important;
    background:transparent!important;
    color:#0b6a5d!important;
    font-size:.69em!important;
    font-weight:900!important;
    line-height:1!important;
    vertical-align:super!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-verse-text{
    display:inline!important;
    margin:0!important;
    padding:0!important;
    line-height:inherit!important;
    white-space:normal!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-note-mark{
    display:inline!important;
    margin-inline-start:.12em!important;
    font-size:.78em!important;
    vertical-align:super!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-verse.is-highlighted .nh7-apo-verse-main{
    background:#fff2a8!important;
    border-radius:.32em!important;
    padding:.08em .18em!important;
    -webkit-box-decoration-break:clone;
    box-decoration-break:clone;
  }
  .nh7-apo-continuous-reader .nh7-apo-verse-tools{
    display:none!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-verse-tools:not(.hidden){
    display:block!important;
    margin:.55rem 0 .8rem!important;
    padding:.62rem!important;
    border:1px solid #dce9e6!important;
    border-radius:12px!important;
    background:#f8fbfa!important;
    line-height:1.45!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-tool-buttons{
    display:flex!important;
    flex-wrap:wrap!important;
    gap:6px!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-note-editor{
    display:block;
    margin-top:8px!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-note-editor.hidden{
    display:none!important;
  }
  .nh7-apo-continuous-reader .nh7-apo-note-editor textarea{
    width:100%!important;
    box-sizing:border-box!important;
  }
  @media(max-width:620px){
    .nh7-apo-continuous-reader{line-height:2.1!important}
    .nh7-apo-continuous-reader .nh7-apo-verse-main{margin-inline:.1em!important}
  }
  `;
  document.head.appendChild(style);
}

function markReader(){
  document.querySelectorAll('.nh7-apo-continuous-reader').forEach(reader=>{
    reader.dataset.nh7InlineReader='391';
    reader.setAttribute('role','document');
  });
}

installStyle();
let timer=0;
new MutationObserver(()=>{
  clearTimeout(timer);
  timer=setTimeout(markReader,30);
}).observe(document.documentElement,{childList:true,subtree:true});
markReader();
window.NH7_APOCRYPHA_INLINE_VERSION='3.9.1';
})();
