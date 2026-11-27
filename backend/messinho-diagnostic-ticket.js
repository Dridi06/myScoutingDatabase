import { createHash, randomUUID } from 'node:crypto';

const clean=(value,max=500)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
function safeFinding(item){
 return {
  name:clean(item?.name||'Unbekannte Prüfung',120),
  category:clean(item?.category||'System',80),
  severity:clean(item?.severity||'warning',30),
  detail:clean(item?.detail||'Keine Detailbeschreibung verfügbar.',500)
 };
}
export function buildMessinhoDiagnosticTicket({checks=[],now=new Date(),id=randomUUID()}={}){
 const findings=(Array.isArray(checks)?checks:[]).filter(item=>item&&item.ok===false).slice(0,8).map(safeFinding);
 if(!findings.length)return {ok:false,code:'NO_FAILED_DIAGNOSTICS'};
 const date=now instanceof Date?now:new Date(now);
 if(Number.isNaN(date.getTime()))return {ok:false,code:'INVALID_TIMESTAMP'};
 const timestamp=date.toISOString(),year=date.getUTCFullYear();
 const fingerprint=createHash('sha256').update(JSON.stringify({day:timestamp.slice(0,10),findings})).digest('hex');
 const summary=findings.map((item,index)=>`${index+1}. ${item.name} (${item.severity}): ${item.detail}`).join(' | ').slice(0,2200);
 const record={
  id,ticket_id:'MYKI-'+year+'-'+id.replace(/[^a-f0-9]/gi,'').slice(0,12).toUpperCase().padEnd(12,'0'),
  title:`Systemdiagnose: ${findings.length} fehlgeschlagene Prüfung(en)`,
  explanation:'MESSINHO hat bei einer selbst gestarteten Systemprüfung konkrete Auffälligkeiten gefunden. Dieser Eintrag dokumentiert den Befund zur Admin-Prüfung. Befunde: '+summary,
  rationale:'Die Auffälligkeiten müssen nachvollziehbar untersucht werden. Ein sicherer Code-Reparaturvorschlag konnte in diesem Prüflauf nicht zuverlässig erstellt werden.',
  diff:'',files:[],tests:findings.map(item=>({name:item.name,status:'failed',details:item.detail.slice(0,500)})),
  risks:'Dieses Diagnose-Ticket enthält keinen Codepatch. Es wurde keine Änderung an der laufenden Anwendung vorgenommen.',
  rollback:'Nicht erforderlich: Es wurde kein Quellcode geändert und kein Patch angewendet.',
  baseline_id:'diagnostic-only',candidate_id:'diagnostic-'+id,fingerprint,status:'submitted',
  error_code:'diagnostic_finding',error_message:`${findings.length} Systemprüfung(en) fehlgeschlagen; Admin-Prüfung erforderlich.`,
  created_at:timestamp,updated_at:timestamp,deleted_at:null,integrated_at:null
 };
 return {ok:true,ticket:record,findings};
}
export async function persistMessinhoDiagnosticTicket({db,checks,now=new Date(),id=randomUUID}={}){
 if(!db)return {ok:false,code:'DATABASE_UNAVAILABLE'};
 const built=buildMessinhoDiagnosticTicket({checks,now,id:id()});
 if(!built.ok)return built;
 const {data,error}=await db.from('messinho_myki_tickets').insert(built.ticket).select('id,ticket_id').single();
 if(error?.code==='23505'){
  const {data:existing,error:lookupError}=await db.from('messinho_myki_tickets').select('id,ticket_id')
   .eq('fingerprint',built.ticket.fingerprint).maybeSingle();
  if(!lookupError&&existing)return {ok:true,duplicate:true,ticket_id:existing.ticket_id,id:existing.id};
 }
 if(error)return {ok:false,code:'DIAGNOSTIC_TICKET_PERSIST_FAILED',error_code:error.code||'unknown'};
 if(!data?.id||!data?.ticket_id)return {ok:false,code:'DIAGNOSTIC_TICKET_WRITE_UNCONFIRMED'};
 return {ok:true,duplicate:false,ticket_id:data.ticket_id,id:data.id};
}
