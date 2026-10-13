/* Isolated Production-shaped contract fixtures: never send or delete live data. */
const id='12345678-1234-4234-8234-123456789abc';
const userId='22345678-1234-4234-8234-123456789abc';
function session(role='owner'){const email=role+'@example.invalid';return {access_token:'e30.'+Buffer.from(JSON.stringify({sub:role,email,exp:4102444800})).toString('base64url')+'.fixture',refresh_token:'refresh-'+role,user:{id:role,email,user_metadata:{}}}}
const users=[{user_id:userId,email:'student@example.invalid',full_name:'Student Fixture',language:'fa'},{user_id:'32345678-1234-4234-8234-123456789abc',email:'hr@example.invalid',full_name:'Croatian Fixture',language:'hr'}];
async function intercept(ctx,base,options={}){
 const calls=[];await ctx.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());if(url.origin===base)return route.continue();if(!url.hostname.endsWith('.supabase.co'))return route.fulfill({json:[]});
 let body={};try{body=req.postDataJSON()||{}}catch(_){}const name=url.pathname.split('/').at(-1),jwt=req.headers().authorization||'',role=jwt.includes(Buffer.from(JSON.stringify({sub:'owner',email:'owner@example.invalid',exp:4102444800})).toString('base64url'))?'owner':jwt.includes('delegate')?'delegate':options.role||'owner';
 calls.push({path:url.pathname,method:req.method(),body,role});let data=[],status=200;
 if(options.delay&&await options.delay({route,req,url,name,body,calls}))return;
 if(url.pathname.includes('/auth/'))data=url.pathname.endsWith('/user')?session(options.role||'owner').user:session(options.role||'owner');
 else if(name==='nh7_admin_my_access_v350')data={is_admin:role==='owner'||role==='delegate',is_owner:role==='owner',email:session(role).user.email,permissions:role==='delegate'?['registrations.view']:[],display_name:'Fixture'};
 else if(role!=='owner'&&!['nh7_admin_registration_feed_v350','nh7_library_catalog_v396','nh7_inbox_snapshot_v419'].includes(name)){status=403;data={message:'Owner required'}}
 else if(name==='nh7_is_admin')data=role==='owner';
 else if(/registration_feed|\/registrations$/.test(name)||url.pathname.endsWith('/registrations'))data=[{id,type:'school',status:'pending',created_at:'2026-10-13T10:00:00Z',payload:{email:users[0].email,firstName:'Student',lastName:'Fixture',phone:'+1234567890',birthDate:'1990-10-13'}}];
 else if(name==='qa_questions')data=[{id:'question',question_text:'Fixture question',status:'new',created_at:'2026-10-13T10:00:00Z'}];
 else if(name==='sermons')data=[{id:'sermon',title_en:'Fixture sermon',title_fa:'موعظه',title_hr:'Propovijed',audio_url:base+'/fixture.wav',is_published:true}];
 else if(name==='nh7_admin_user_directory_v360')data=users;
 else if(name==='nh7_admin_message_templates_v416')data=[];
 else if(name==='nh7-admin-messaging-v360')data={ok:true,status:'sent',recipient_count:body.recipients?.length||2,inbox_rows:body.recipients?.length||2};
 else if(url.pathname==='/storage/v1/bucket')data=[{id:'church-audio',name:'church-audio',public:false}];
 else if(url.pathname.includes('/storage/v1/object/list/'))data=[{id:'file1',name:'fixture.mp3',created_at:'2026-10-13T10:00:00Z',metadata:{size:1234,mimetype:'audio/mpeg'}},{id:null,name:'folder',metadata:null}];
 else if(name.includes('auth_user_count'))data=2;
 else if(name.includes('school_assignments'))data=[{id:'assignment',user_email:users[0].email,lesson_code:'CLASS-A-1',status:'submitted',answer_text:'Fixture answer'}];
 else if(name.includes('school_snapshot'))data={access:{status:'approved'},lessons:[],assignments:[],progress:[]};
 else if(name==='nh7_library_catalog_v396')data={items:[],collections:[]};
 else if(name==='nh7_inbox_snapshot_v419')data={messages:[],receipts:[]};
 else if(name==='nh7-content-access')data={authenticated:true,approved:true,user_email:session().user.email};
 else if(name==='nh7-admin-ai-v490')data={ok:true,configured:false};
 await route.fulfill({status,json:data});
 });return calls;
}
async function seed(ctx,role='owner',panel=true){await ctx.addInitScript(({session,panel})=>{localStorage.setItem('nh7_lang','en');localStorage.setItem('nh7_admin_lang','en');localStorage.setItem('nh7_user_session_v170',JSON.stringify(session));if(panel){localStorage.setItem('nh7_admin_token',session.access_token);localStorage.setItem('nh7_admin_refresh_token',session.refresh_token)}},{session:session(role),panel});}
module.exports={intercept,seed,session,users,id};
