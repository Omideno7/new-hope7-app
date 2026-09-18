(()=>{'use strict';
if(window.__NH7_SERMON_SOCIAL_V440__)return;
window.__NH7_SERMON_SOCIAL_V440__=true;
const SB='https://gpzcwffxnddhaeaogdyo.supabase.co',KEY='sb_publishable_v3xXEaJ5Fml7-te1mI4-0g_7R86oM37',AUTH='nh7_user_session_v170';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,cache=new Map();let timer=0;
const lg=()=>{const x=localStorage.getItem('nh7_lang')||document.documentElement.lang||'en';return['fa','en','hr'].includes(x)?x:'en'};
const L=(fa,en,hr)=>lg()==='fa'?fa:lg()==='hr'?hr:en;
const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ses=()=>{try{return JSON.parse(localStorage.getItem(AUTH)||'null')}catch(_){return null}},tok=()=>ses()?.access_token||'',signed=()=>!!tok();
async function rpc(n,p={},need=false){const t=tok();if(need&&!t)throw new Error('login_required');const r=await fetch(SB+'/rest/v1/rpc/'+n,{method:'POST',headers:{apikey:KEY,Authorization:'Bearer '+(t||KEY),'Content-Type':'application/json'},body:JSON.stringify(p),cache:'no-store'}),raw=await r.text();let d={};try{d=raw?JSON.parse(raw):{}}catch(_){d={message:raw}}if(!r.ok)throw new Error(d.message||d.error||raw||r.statusText);return Array.isArray(d)&&d.length===1?d[0]:d}
function id(card){const x=String(card?.dataset?.sermonCard||'');return UUID.test(x)?x:''}
function valid(card){return !!id(card)&&!card.classList.contains('school-audio-card')}
function title(card){return String(card.querySelector('.sermon-card-copy strong,strong')?.textContent||'New Hope 7').trim()}
function addStyle(){if(document.getElementById('nh7Social440Style'))return;const s=document.createElement('style');s.id='nh7Social440Style';s.textContent='.nh7s440{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);display:grid;gap:10px}.nh7s440a{display:flex;gap:8px;flex-wrap:wrap}.nh7s440b{border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:8px 12px;font:inherit;font-weight:800}.nh7s440b.on{background:#fff0f3;color:#c51d49}.nh7s440c{display:none;padding:12px;border:1px solid var(--line);border-radius:14px}.nh7s440c.open{display:grid;gap:8px}.nh7s440c textarea{width:100%;min-height:82px}.nh7s440list{display:grid;gap:8px}.nh7s440item{padding:10px 12px;border:1px solid var(--line);border-radius:14px}.nh7s440head{display:flex;justify-content:space-between;gap:8px}.nh7s440del{border:0;background:transparent;color:var(--danger);font-weight:800}.nh7s440status{color:var(--muted);font-size:.84rem;min-height:1.1em}';document.head.appendChild(s)}
function loginMsg(){return L('\u0628\u0631\u0627\u06cc Like \u06cc\u0627 \u0646\u0648\u0634\u062a\u0646 \u0628\u0631\u06a9\u062a \u0648\u0627\u0631\u062f \u062d\u0633\u0627\u0628 \u0634\u0648\u06cc\u062f.','Sign in to like or share a blessing.','Prijavite se za Like ili blagoslov.')}
function shell(card){let r=card.querySelector('[data-nh7-social-v440]');if(r)return r;r=document.createElement('section');r.className='nh7s440';r.dataset.nh7SocialV440='1';r.innerHTML='<div class="nh7s440a"><button class="nh7s440b" data-like>\u2661 <span>0</span></button><button class="nh7s440b" data-bless>\u270d\ufe0f '+E(L('\u0627\u0634\u062a\u0631\u0627\u06a9 \u0628\u0631\u06a9\u062a','Share a Blessing','Podijeli blagoslov'))+'</button><button class="nh7s440b" data-share>\u2197 '+E(L('\u0627\u0634\u062a\u0631\u0627\u06a9','Share','Podijeli'))+'</button></div><div class="nh7s440c" data-compose><textarea maxlength="800" data-ext placeholder="'+E(L('\u0627\u063c\u0646 \u067e\u06cc\u0627\u0645 \u0686LÈLLÌWLNWLWLØÈLLÌWL×LØÈLÍLWLÈLL×LÍLWLYË	ÒÝÈY\ÈY\ÜØYÙH\ÜÈ[ÝOÉË	ÒØZÛÈ\ÈHÝHÜZØHYÛÜÛÝ[OÉÊJJÉÈÝ^\XO]ÛÛ\ÜÏH[X\KX]K\ÝXZ]ÊÑJ
	×L×LÌWLÌ×L×LLLÌWLNWLIË	ÔÜÝ\ÜÚ[ÉË	ÓØ]HYÛÜÛÝÊJJÉÏØ]ÛÛX[ÊÑJÚYÛY

OÉÉÎÙÚ[\ÙÊ
JJÉÏÜÛX[Ù]]Û\ÜÏHÜÍÝ]\È]K\Ý]\ÏÙ]]Û\ÜÏHÜÍ\Ý]K[\ÝÙ]ÎØØ\\[Ú[
NØ[
Ø\NÜ]\B[Ý[Û]J^Ý^Ü]\]È]JKÓØØ[Q]TÝ[ÊÊ
OOOIÙIÏÉÙKRTÎÊ
OOOIÚÏÉÚRÎÙ[UTÉÊ_XØ]Ú
Ê^Ü]\Éß_B[Ý[Û]ÊØ\Ê^ØÛÛÝ\Ú[
Ø\
K\]Y\TÙ[XÝÜ	ÖÙ]K[ZÙWIÊNØÛ\ÜÓ\ÝÙÙÛJ	ÛÛËH\ÏËZÙY
NØ[\SJÏËZÙYÉ×LH	Î×LH	ÊJÉÏÜ[ÊÓ[X\ÏËZÙWØÛÝ[
JÉÏÜÜ[ÎØÛÛÝOP\^K\Ð\^JÏË\ÜÚ[ÜÊOÜË\ÜÚ[ÜÎ×NÜ]Y\TÙ[XÝÜ	ÖÙ]K[\ÝIÊK[\SXKX\
OÏ\XÛHÛ\ÜÏHÜÍ][H]Û\ÜÏHÜÍXYÝÛÏÊÑJ\Ü^WÛ[Y_	Ó]ÈÜHÉÊJÉÏÜÝÛÏÛX[ÊÑJ]JÜX]YØ]
JJÉÏÜÛX[ÊÊØ[Ù[]OÉÏ]ÛÛ\ÜÏHÜÍ[]KY[]OHÊÑJY
JÉÈÊÑJ
	×LLÌLIË	Ñ[]IË	Ò^\ÚIÊJJÉÏØ]ÛÎÉÊJÉÏÙ]ÊÑJ\ÜÚ[×Ý^	ÉÊJÉÏÜØ\XÛOÊKÚ[	ÉÊ_B\Þ[È[Ý[ÛØY
Ø\ÜÙOY[ÙJ^ØÛÛÝÚYZY
Ø\
NÚY\ÚY
\]\ÚYYÜÙIØXÚK\ÊÚY
J^Ù]ÊØ\ØXÚKÙ]
ÚY
JNÜ]\XÛÛÝ\Ú[
Ø\
KÝ\]Y\TÙ[XÝÜ	ÖÙ]K\Ý]\×IÊNÝ^ØÛÛÝÏX]ØZ]Ê	Û×ÜÙ\[ÛÜÛØÚX[ÜÝ]WÝ	ËÜÜÙ\[ÛÚYÚYÛ[Z]JNØØXÚKÙ]
ÚYÊNÙ]ÊØ\ÊNÜÝ^ÛÛ[IÉßXØ]Ú
J^ÜÝ^ÛÛ[YKY\ÜØYÙ_Ý[ÊJ__B\Þ[È[Ý[ÛZÙJØ\
^ØÛÛÝ\Ú[
Ø\
KÝ\]Y\TÙ[XÝÜ	ÖÙ]K\Ý]\×IÊNÚY\ÚYÛY

J^ÜÝ^ÛÛ[[ÙÚ[\ÙÊ
NÜ]\]^ØÛÛÝX]ØZ]Ê	Û×ÜÙ\[ÛÝÙÙÛWÛZÙWÝ	ËÜÜÙ\[ÛÚYY
Ø\
_KYJKÛXØXÚKÙ]
Y
Ø\
J_ßNØØXÚKÙ]
Y
Ø\
KØXÝ\ÜÚYÛßKÛ
JNÙ]ÊØ\ØXÚKÙ]
Y
Ø\
JJNÜÝ^ÛÛ[IÉßXØ]Ú
J^ÜÝ^ÛÛ[YKY\ÜØYÙ_Ý[ÊJ__B\Þ[È[Ý[Û\ÜÊØ\
^ØÛÛÝ\Ú[
Ø\
KÝ\]Y\TÙ[XÝÜ	ÖÙ]K\Ý]\×IÊKO\]Y\TÙ[XÝÜ	ÖÙ]K]^IÊNÚY\ÚYÛY

J^ÜÝ^ÛÛ[[ÙÚ[\ÙÊ
NÜ]\XÛÛÝTÝ[ÊK[Y_	ÉÊK[J
NÚY[Ý^ÜÝ^ÛÛ[S
	×LWLWLLLÌWLNWLHLWLØ×LLØÈLNWLLWL×LÈL×LÌ×LKË	Ð\ÜÚ[È^\ÈÛÈÚÜË	ÕZÜÝHZÜ]ZËÊNÜ]\]^Ø]ØZ]Ê	Û×ÜÙ\[ÛØYØ\ÜÚ[×Ý	ËÜÜÙ\[ÛÚYY
Ø\
KÝ^KYJNÝK[YOIÉÎÜ]Y\TÙ[XÝÜ	ÖÙ]KXÛÛ\ÜÙWIÊKÛ\ÜÓ\Ý[[ÝJ	ÛÜ[ÊNØØXÚK[]JY
Ø\
JNØ]ØZ]ØY
Ø\YJNÜÝ^ÛÛ[S
	×LLÌWLNWLHLÍLWLÈLLLHLÍLLÌLÉË	Ö[Ý\\ÜÚ[ÈØ\ÈÜÝYLÌLÉË	ÐYÛÜÛÝHØ][LÌLÉÊ_XØ]Ú
J^ÜÝ^ÛÛ[YKY\ÜØYÙ_Ý[ÊJ__B\Þ[È[Ý[Û[
Ø\Y
^ÚYXÛÛ\J
	×L×LØ×LLLÌWLNWLHLLÌLHLÍLLLYË	Ñ[]H\È\ÜÚ[ÏÉË	Ò^\Ø]HÝZYÛÜÛÝÉÊJJ\]\Ý^Ø]ØZ]Ê	Û×ÜÙ\[ÛÙ[]WØ\ÜÚ[×Ý	ËÜÚYYKYJNØØXÚK[]JY
Ø\
JNØ]ØZ]ØY
Ø\YJ_XØ]Ú
J^ÜÚ[
Ø\
K]Y\TÙ[XÝÜ	ÖÙ]K\Ý]\×IÊK^ÛÛ[YKY\ÜØYÙ_Ý[ÊJ__B\Þ[È[Ý[ÛÚ\JØ\
^ØÛÛÝO[]ÈT
ØØ][ÛYNÝKÙX\Ú\[\ËÙ]
	ÜÙ\[ÛËY
Ø\
JNÝK\ÚIØ]Y[ÉÎØÛÛÝ^Ý]NÓ]ÈÜHÈH	ÊÝ]JØ\
K^
	×L×LØ×LLÙWLØ×L×LHLÌWLÈLLÌH]ÈÜHÈLLÍLLLØ×LË	Ó\Ý[È\ÈY\ÜØYÙH[]ÈÜHËË	ÔÜÛ\ØZHÝHÜZÝHH]ÈÜHËÊK\KÔÝ[Ê
_NÝ^ÚY]YØ]ÜÚ\JX]ØZ]]YØ]ÜÚ\J
NÙ[Ù^Ø]ØZ]]YØ]ÜÛ\Ø\Ü]U^
\
NÜÚ[
Ø\
K]Y\TÙ[XÝÜ	ÖÙ]K\Ý]\×IÊK^ÛÛ[S
	×LLØ×LLNHLNWLÙWLØÈLÍLLÌLÉË	Ó[ÈÛÜYYLÌLÉË	ÔÝ^XØHÛÜ\[HLÌLÉÊ__XØ]Ú
J^ß_B[Ý[Û[
Ø\^Ü]Y\TÙ[XÝÜ	ÖÙ]K[ZÙWIÊKÛÛXÚÏJ
OOZÙJØ\
NÜ]Y\TÙ[XÝÜ	ÖÙ]KX\Ü×IÊKÛÛXÚÏJ
OO]Y\TÙ[XÝÜ	ÖÙ]KXÛÛ\ÜÙWIÊKÛ\ÜÓ\ÝÙÙÛJ	ÛÜ[ÊNÜ]Y\TÙ[XÝÜ	ÖÙ]K\ÝXZ]IÊKÛÛXÚÏJ
OO\ÜÊØ\
NÜ]Y\TÙ[XÝÜ	ÖÙ]K\Ú\WIÊKÛÛXÚÏJ
OOÚ\JØ\
NÜÛÛXÚÏYOOØÛÛÝYK\Ù]ÛÜÙ\Ý
	ÖÙ]KY[]WIÊNÚYY[
Ø\]\Ù][]J__B[Ý[Û]Ú

^ØYÝ[J
NÙØÝ[Y[]Y\TÙ[XÝÜ[
	ÖÙ]K\Ù\[ÛXØ\IÊKÜXXÚ
Ø\OÚY[Y
Ø\
J^ÜÚ[
Ø\
NÛØY
Ø\
__J_B]È]]][ÛØÙ\\

OOØÛX\[Y[Ý]
[Y\NÝ[Y\\Ù][Y[Ý]
]Ú
_JKØÙ\JØÝ[Y[ØÝ[Y[[[Y[ØÚ[\ÝYKÝXYNY_JNÝÚ[ÝËY][\Ý[\	ÜYÙ\ÚÝÉË]Ú
NØYÝ[J
NÜ]Ú

NÝÚ[ÝË×ÔÑTSÓÔÓÐÒPSÕTÒSÓIÍ	ÎÂJJ
NÂ