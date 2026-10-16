/* Exact server receipt/preview contract. Validation never creates a document or performs a request. */
import {uuid,serialize,publicProjection} from './model.mjs';
export function capabilities(value,uid){return value?.schema_version===2&&value.issuance_contract===75&&value.owner_uid===uid&&value.mutations===true&&value.automatic_delivery===true&&value.minimal_verification===true&&value.expiry===true}
export function preparedReceipt(value,draft){
 if(!uuid(value?.prepare_token)||!uuid(value?.verification?.token)||!value.verification.number||!value.recipient||!value.snapshot||value.snapshot.status!=='issued'||(value.recipient.userId||null)!==(draft.recipient.userId||null))throw Error('reviewChanged');
 const expected=publicProjection({...draft,status:'issued',recipient:{...draft.recipient,...value.recipient},verification:value.verification});
 if(serialize(publicProjection(value.snapshot))!==serialize(expected))throw Error('reviewChanged');
 return value;
}
export function issuedReceipt(value,{draft,prepared,request}){
 if(value?.issuance_contract!==75||!uuid(value.id)||value.draft_id!==draft.id||value.request_id!==request||value.status!=='issued'||value.public_token!==prepared.verification.token||value.certificate_number!==prepared.verification.number||!value.issued_at||!Number.isFinite(Date.parse(value.issued_at)))throw Error('issueUnverified');
 if((value.recipient_user_id||null)!==(draft.recipient.userId||null)||value.archive_delivered!==!!draft.recipient.userId||!value.authoring||value.authoring.id!==draft.id||value.authoring.status!=='issued'||value.authoring.verification?.token!==value.public_token)throw Error('issueUnverified');
 const snapshot=serialize(publicProjection(prepared.snapshot));
 if(serialize(publicProjection(value.definition))!==snapshot||serialize(publicProjection(value.authoring))!==snapshot)throw Error('issueUnverified');
 return value;
}
