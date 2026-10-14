/* REVIEW ONLY service adapter. Package behind explicit approval, verify_jwt=true.
 * Store helpers are service-only; current v224 publication uses CALLER JWT.
 * No arbitrary URL fetch, current Library RLS/grants/file flow untouched. */
export async function publishLibrary(body,{auth,access,store,storage,currentLibrarySave,sha256}){
 const user=await auth();if(!user?.id||(await access())?.is_owner!==true)throw Error('denied');
 if(body?.version!==2||!body.publication_id||!body.prepare_token||!/^([0-9a-f]{64})$/.test(body.sha256||'')||Object.keys(body).some(k=>!['version','publication_id','prepare_token','sha256'].includes(k)))throw Error('invalid_request');
 const plan=await store.load(body.publication_id,user.id,body.prepare_token);if(!plan)throw Error('fresh_preview_required');if(plan.published)return{ok:true,id:plan.library_id,duplicate:true};if(!Number.isFinite(Date.parse(plan.expires_at))||Date.parse(plan.expires_at)<=Date.now())throw Error('fresh_preview_required');
 if(plan.snapshot.recipient?.name||plan.snapshot.recipient?.userId||plan.snapshot.recipient?.email||plan.snapshot.recipient?.studentId||plan.snapshot.recipient?.photo||!['official_letter','custom_document'].includes(plan.snapshot.type))throw Error('libraryBoundary');
 if(!plan.storage_path.startsWith('documents/studio-v2/'+user.id+'/')||plan.storage_path.includes('..')||!plan.storage_path.endsWith('.pdf'))throw Error('libraryBoundary');
 // Fixed bucket/path from immutable server plan. Adapter must verify current Storage object owner.
 const bytes=await storage.readOwned('nh7-library',plan.storage_path,user.id);if(!bytes||bytes.length>12000000||new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-'||await sha256(bytes)!==body.sha256)throw Error('file_attestation_failed');
 if((await access())?.is_owner!==true)throw Error('denied');
 // Claim retains unknown outcomes. Never delete claim / blindly republish an ambiguous result.
 const claim=await store.claim(plan.id,body.sha256);if(!claim)return{ok:true,status:await store.status(plan.id),duplicate:true};
 try{const item={...plan.metadata,id:plan.library_id,audience:'public',resource_type:'library',storage_path:plan.storage_path,file_name:'New-Hope-7-'+plan.id+'.pdf',file_size:bytes.length,mime_type:'application/pdf',is_active:true,is_published:true};
  const result=await currentLibrarySave('nh7_admin_library_save_item_v224',{p_item:item});await store.finish(plan.id,'published',result);return{ok:true,id:plan.library_id};
 }catch{await store.finish(plan.id,'unknown',{});return{ok:true,status:'unknown'}}
}
