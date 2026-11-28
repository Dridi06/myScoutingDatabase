/**
 * MESSINHO real persistence round-trip audit.
 * Writes one synthetic owner-scoped record, reads it through the production API,
 * then deletes only the exact synthetic fingerprint. Never trains model weights.
 */
import { randomUUID } from 'node:crypto';
import { storeMessinhoKnowledge, findMessinhoKnowledge, fingerprintMessinhoKnowledgeQuestion } from './messinho-knowledge-memory.js';

const clean=(value,max=500)=>String(value??'').replace(/[\\u0000-\\u001f\\u007f]/g,' ').replace(/\\s+/g,' ').trim().slice(0,max);
const SOURCE_TEXT='This synthetic audit source is deliberately longer than the minimum evidence threshold. It exists only to verify that the production knowledge-memory validator accepts two distinct source domains and can persist a test record safely.';

export async function runMessinhoMemoryPersistenceAudit({db,ownerId,store=storeMessinhoKnowledge,find=findMessinhoKnowledge,now=new Date()}={}){
 if(!db||!ownerId)return {ok:false,status:'NOT_VERIFIED',severity:'warning',detail:'Echte Memory-Persistenz nicht geprüft: Supabase-Client oder gültige Owner-ID fehlt.',evidence:{database_available:Boolean(db),owner_available:Boolean(ownerId),database_write:false},recommendation:'Audit mit authentifizierter Admin-Owner-ID und serverseitigem Supabase-Client erneut ausführen.'};
 const question='MESSINHO audit persistence verification '+randomUUID();
 const fingerprint=fingerprintMessinhoKnowledgeQuestion(question);
 const research={status:'completed',answer:'Synthetic audit memory round-trip verified.',answer_mode:'source_digest',
  claims:[],sources:[{title:'Audit source A',url:'https://audit-source-a.example.test/memory',publisher:'Audit A',snippet:SOURCE_TEXT},
   {title:'Audit source B',url:'https://audit-source-b.example.test/memory',publisher:'Audit B',snippet:SOURCE_TEXT}],
  evidence:{can_answer:true},quality_control:{passed:true}};
 let stored=null,retrieved=null,agentMemoryRead=null,cleanup={confirmed:false,attempted:false,error:null},failure=null;
 try{
  const agentMemory=await db.from('messinho_agent_memory').select('owner_id,active_player_ids,user_preferences,active_entities,last_intent,last_goal,updated_at').eq('owner_id',ownerId).maybeSingle();
  if(agentMemory.error)throw new Error('agent_memory_read_failed:'+clean(agentMemory.error.message||agentMemory.error.code||'unknown',100));
  agentMemoryRead={table_accessible:true,owner_scoped_query:true,record_present:Boolean(agentMemory.data),owner_match:!agentMemory.data||agentMemory.data.owner_id===ownerId,shape_valid:!agentMemory.data||(Array.isArray(agentMemory.data.active_player_ids)&&agentMemory.data.user_preferences&&typeof agentMemory.data.user_preferences==='object'&&agentMemory.data.active_entities&&typeof agentMemory.data.active_entities==='object')};
  if(!agentMemoryRead.owner_match||!agentMemoryRead.shape_valid)throw new Error('agent_memory_owner_or_shape_invalid');
  stored=await store(db,ownerId,question,research,now);
  if(!stored?.persisted||!stored.id)throw new Error('write_not_confirmed');
  retrieved=await find(db,ownerId,question,now);
  const exact=retrieved?.status==='hit'&&retrieved?.match==='exact'&&retrieved?.record?.id===stored.id&&retrieved?.record?.owner_id===ownerId;
  if(!exact)throw new Error('exact_owner_scoped_readback_failed');
 }catch(error){failure=clean(error?.message||'memory_roundtrip_failed',160);}
 finally{
  if(stored?.persisted||fingerprint){
   cleanup.attempted=true;
   try{
    const {data,error}=await db.from('messinho_knowledge_memory').delete()
      .eq('owner_id',ownerId).eq('question_fingerprint',fingerprint).select('id');
    cleanup.confirmed=!error&&Array.isArray(data)&&data.length===1;
    cleanup.error=error?clean(error.message||error.code||'delete_failed',180):null;
   }catch(error){cleanup.error=clean(error?.message||'cleanup_failed',180);}
  }
 }
 const exact=!failure&&retrieved?.status==='hit'&&retrieved?.match==='exact'&&retrieved?.record?.id===stored?.id&&retrieved?.record?.owner_id===ownerId;
 const ok=exact&&cleanup.confirmed&&agentMemoryRead?.table_accessible===true&&agentMemoryRead?.owner_match===true&&agentMemoryRead?.shape_valid===true;
 return {ok,status:ok?'PASS':'FAIL',severity:ok?'info':'warning',
  detail:ok?'Echter Memory-Roundtrip bestanden: agent_memory wurde owner-scoped gelesen; Knowledge-Memory wurde gespeichert, exakt wiedergefunden und anschließend entfernt.':
   'Echter Memory-Roundtrip nicht vollständig bestätigt: '+(failure||(!cleanup.confirmed?'temporärer Testeintrag konnte nicht sicher als gelöscht bestätigt werden.':'Readback fehlgeschlagen.')),
  evidence:{write_confirmed:Boolean(stored?.persisted),readback_confirmed:Boolean(retrieved?.record),exact_match:Boolean(exact),
   owner_scope_confirmed:retrieved?.record?.owner_id===ownerId,agent_memory_read:agentMemoryRead,cleanup,record_id:stored?.id||null,
   match:retrieved?.match||null,storage_table:'messinho_knowledge_memory',synthetic_record:true,model_training:false,
   database_mutations_attempted:(stored?.persisted?1:0)+(retrieved?.record?1:0)+(cleanup.attempted?1:0)},
  recommendation:ok?'Keine Maßnahme erforderlich.':'Supabase-Schema, Owner-Fremdschlüssel, Service-Key-Berechtigung, Unique-Constraint, Readback und Cleanup prüfen.'};
}
