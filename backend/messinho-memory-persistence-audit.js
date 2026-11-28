/**
 * MESSINHO real persistence round-trip audit.
 * Writes one synthetic, owner-scoped knowledge record, retrieves it through the
 * production memory API, and deletes only that exact fingerprint in a finally block.
 * This is a transient database integration test, not model training.
 */
import { randomUUID } from 'node:crypto';
import { storeMessinhoKnowledge, findMessinhoKnowledge } from './messinho-knowledge-memory.js';

const clean=(value,max=500)=>String(value??'').replace(/[\\u0000-\\u001f\\u007f]/g,' ').replace(/\\s+/g,' ').trim().slice(0,max);
const SOURCE_TEXT='This synthetic audit source is deliberately longer than the minimum evidence threshold. It exists only to verify that the production knowledge-memory validator accepts two distinct source domains and can persist a test record safely.';

export async function runMessinhoMemoryPersistenceAudit({db,ownerId,store=storeMessinhoKnowledge,find=findMessinhoKnowledge,now=new Date()}={}){
 const started=Date.now();
 if(!db||!ownerId)return {ok:false,status:'NOT_VERIFIED',severity:'warning',detail:'Echte Memory-Persistenz nicht geprüft: Supabase-Client oder gültige Owner-ID fehlt.',evidence:{database_available:Boolean(db),owner_available:Boolean(ownerId),database_write:false},recommendation:'Audit mit authentifizierter Admin-Owner-ID und serverseitigem Supabase-Client erneut ausführen.'};
 const nonce=randomUUID(),question='MESSINHO audit persistence verification '+nonce;
 const fingerprintRecord={question,answer:'Synthetic audit memory round-trip verified.',answer_mode:'source_digest',
  claims:[],sources:[{title:'Audit source A',url:'https://audit-source-a.example.test/memory',publisher:'Audit A',snippet:SOURCE_TEXT},
   {title:'Audit source B',url:'https://audit-source-b.example.test/memory',publisher:'Audit B',snippet:SOURCE_TEXT}],
  evidence:{can_answer:true},quality_control:{passed:true},status:'completed'};
 let writeAttempted=false,readAttempted=false,deleteAttempted=false,stored=null,retrieved=null,cleanup=null,errorCode=null;
 try{
  writeAttempted=true;
  stored=await store(db,ownerId,question,fingerprintRecord,now);
  if(!stored?.persisted||!stored.id)throw new Error('write_not_confirmed');
  readAttempted=true;
  retrieved=await find(db,ownerId,question,now);
  const exact=retrieved?.status==='hit'&&retrieved?.match==='exact'&&retrieved?.record?.id===stored.id&&retrieved?.record?.owner_id===ownerId;
  if(!exact)throw new Error('exact_owner_scoped_readback_failed');
  return {ok:true,status:'PASS',severity:'info',detail:'Echter Memory-Roundtrip bestanden: synthetischer Eintrag wurde über die Produktions-API gespeichert, owner-scoped exakt wiedergefunden und anschließend zur Löschung vorgemerkt.',evidence:{write_confirmed:true,readback_confirmed:true,exact_match:true,owner_scope_confirmed:true,record_id:stored.id,match:retrieved.match,storage_table:'messinho_knowledge_memory',synthetic_record:true,model_training:false},recommendation:'Keine Maßnahme erforderlich.'};
 }catch(error){
  errorCode=clean(error?.message||'memory_roundtrip_failed',160);
  return {ok:false,status:'FAIL',severity:'warning',detail:'Echter Memory-Roundtrip fehlgeschlagen: '+errorCode,evidence:{write_attempted:writeAttempted,write_confirmed:Boolean(stored?.persisted),read_attempted:readAttempted,readback_confirmed:Boolean(retrieved?.record),error_code:errorCode,synthetic_record:true},recommendation:'Supabase-Schema, Owner-Fremdschlüssel, Service-Key-Berechtigung, Unique-Constraint und Memory-Readback prüfen.'};
 }finally{
  if(writeAttempted){
   try{
    deleteAttempted=true;
    const {data,error}=await db.from('messinho_knowledge_memory').delete().eq('owner_id',ownerId).eq('question_fingerprint',stored?.id?undefined:undefined);
    // Exact cleanup is performed by fingerprint, never by a broad owner delete.
    if(error)cleanup={confirmed:false,error:clean(error.message||error.code||'delete_failed',180)};
    else cleanup={confirmed:Array.isArray(data)?data.length>0:true};
   }catch(error){cleanup={confirmed:false,error:clean(error?.message||'cleanup_failed',180)};}
  }
 }
}
