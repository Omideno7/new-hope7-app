/* REVIEW ONLY adapter for existing nh7-admin-ai-v490 after its unchanged JWT/CORS
 * and current v350 owner proof. No serve/provider/network side effect on import. */
export async function documentDraft(body,{owner,structured}){
 if(!owner?.is_owner)throw Error('denied');if(body?.action!=='draft_document'||!['fa','en','hr'].includes(body.language)||!['title','body'].includes(body.field)||typeof body.brief!=='string'||!body.brief.trim()||body.brief.length>4000||/@|[0-9a-f]{8}-[0-9a-f-]{27,}/i.test(body.brief))throw Error('privateContent');
 if(Object.keys(body).some(k=>!['action','language','field','brief'].includes(k)))throw Error('privateContent');
 const schema={type:'object',properties:{draft:{type:'string'}},required:['draft'],additionalProperties:false};
 const result=await structured('Language: '+body.language+'\nField: '+body.field+'\nGeneric church brief: '+body.brief,'Prepare only a concise formal church-document DRAFT for human review in the requested language. Do not certify facts, invent recipient identities, assign approval/numbers, or issue/publish anything. No private recipient data is provided.',schema,'nh7_document_draft');
 if(!result?.parsed?.draft)throw Error('aiUnavailable');return{ok:true,draft:String(result.parsed.draft).slice(0,8000),manual_approval_required:true};
}
