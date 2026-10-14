/* Personal issuance is never a general Library publication. Current Library file/read contracts stay intact. */
import {normalize,preflight,serialize,publicProjection,id} from './model.mjs';
import {rpc,calls,identity,fence,base,key,ownerProven} from './api.mjs';
import {pdf} from './output.mjs';
export function resourcePlan(input){const d=normalize(input);if(d.publicationTarget!=='library'||preflight(d).length||!['official_letter','custom_document'].includes(d.type)||Object.values(d.recipient).some(Boolean))throw Error('libraryBoundary');for(const l of ['fa','en','hr'])if(!d.contents[l].title.trim()||!d.contents[l].body.trim())throw Error('libraryBoundary');return{draft_id:d.id,revision:d.revision,parent:d.replaces||null,authoring:d,snapshot:publicProjection(d),metadata:Object.fromEntries(['fa','en','hr'].flatMap(l=>[['title_'+l,d.contents[l].title],['description_'+l,d.contents[l].body]]))}}
export async function prepareResource(input,{guard,confirm}={}){
 const i=identity(),plan=resourcePlan(input);fence(i);if(!ownerProven()||globalThis.NH7_DOCUMENT_STUDIO_V2_BACKEND_READY!==true)throw Error('disabled');guard?.();
 // Backend freezes version + expected metadata/snapshot, never edits a historical Library item.
 const prepared=await rpc(calls.libraryPrepare,{p_plan:plan});fence(i);guard?.();
 const bytes=await pdf(prepared.snapshot,{guard:()=>{fence(i);guard?.()}});fence(i);guard?.();if(!await confirm?.(plan,prepared.snapshot))return{cancelled:true};fence(i);guard?.();
 const path=prepared.storage_path;if(!path?.startsWith('documents/studio-v2/'+i.uid+'/')||path.includes('..')||!path.endsWith('.pdf'))throw Error('libraryBoundary');
 const ctrl=new AbortController(),timeout=setTimeout(()=>ctrl.abort(),20000);
 try{const response=await fetch(base+'/storage/v1/object/nh7-library/'+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+i.jwt,'Content-Type':'application/pdf','x-upsert':'false'},body:bytes,signal:ctrl.signal});fence(i);guard?.();if(!response.ok&&response.status!==409)throw Error('serviceError')}finally{clearTimeout(timeout)}
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await bytes.arrayBuffer()))).map(x=>x.toString(16).padStart(2,'0')).join('');fence(i);guard?.();
 // Review Edge verifies stored bytes/ownership and invokes EXISTING v224 contract with current caller JWT.
 const ctrl2=new AbortController(),timer=setTimeout(()=>ctrl2.abort(),20000);
 try{const response=await fetch(base+'/functions/v1/nh7-document-library-publish-v2',{method:'POST',headers:{Authorization:'Bearer '+i.jwt,'Content-Type':'application/json'},body:JSON.stringify({version:2,publication_id:prepared.id,prepare_token:prepared.prepare_token,sha256:digest}),signal:ctrl2.signal});fence(i);guard?.();const result=await response.json();fence(i);guard?.();if(!response.ok||!result.ok)throw Error('serviceError');return {...result,definition:prepared.snapshot,publication_id:prepared.id}}finally{clearTimeout(timer)}
}
