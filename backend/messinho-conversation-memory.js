import { isSensitiveMessinhoMemoryText } from './messinho-conversational-intelligence.js';
export const MESSINHO_CONVERSATION_MEMORY_VERSION = '1.0.0';
const MAX_ITEMS=8, MAX_ITEM_LENGTH=260, MAX_TOTAL_LENGTH=1600;
export function buildMessinhoConversationMemory({history=[],conversationId=null}={}){
 const safe=(Array.isArray(history)?history:[]).filter(x=>x&&(x.role==='user'||x.role==='assistant')&&typeof x.text==='string'&&x.text.trim()).slice(-40);
 const items=[];let total=0;
 for(const entry of safe.slice().reverse()){const text=entry.text.replace(/\s+/g,' ').trim().slice(0,MAX_ITEM_LENGTH);if(!text||isSensitiveMessinhoMemoryText(text))continue;
 const normalized=text.toLocaleLowerCase('de-DE');if(items.some(x=>x.normalized===normalized)||items.length>=MAX_ITEMS||total+text.length>MAX_TOTAL_LENGTH)continue;
 items.push({role:entry.role,text,normalized});total+=text.length;}
 items.reverse();
 return {version:MESSINHO_CONVERSATION_MEMORY_VERSION,scope:'owner_conversation',conversation_id:typeof conversationId==='string'?conversationId:null,source:'persisted_conversation_messages',message_count:safe.length,items:items.map(({role,text})=>({role,text})),bounded:true,persisted_summary:false};
}
export function formatMessinhoConversationMemory(memory){
 if(!memory||!Array.isArray(memory.items)||!memory.items.length)return null;
 return {scope:memory.scope,source:memory.source,message_count:memory.message_count,items:memory.items.slice(-MAX_ITEMS)};
}
