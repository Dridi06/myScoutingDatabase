import { createHash, randomUUID } from 'node:crypto';

const STATUSES = new Set(['submitted','reviewing','ready_for_staging','integrating','integration_failed','integrated','deleted']);
const MAX_DIFF = 24000;
const cleanText = (value, max=1600) => String(value ?? '').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const isObject = value => value && typeof value === 'object' && !Array.isArray(value);

export function normalizeMyKiTicketProposal(input={}) {
  if (!isObject(input)) return {ok:false,error:'Ungültiger Verbesserungsvorschlag.'};
  const title=cleanText(input.title,140);
  const explanation=cleanText(input.explanation,2400);
  const rationale=cleanText(input.rationale,1600);
  const diff=String(input.diff ?? '');
  const files=Array.isArray(input.files)?[...new Set(input.files.map(v=>cleanText(v,240)).filter(Boolean))].slice(0,8):[];
  const tests=Array.isArray(input.tests)?input.tests.filter(isObject).slice(0,20).map(t=>({
    name:cleanText(t.name,120),status:['passed','failed','not_run'].includes(t.status)?t.status:'not_run',
    details:cleanText(t.details,500)
  })):[];
  const risks=cleanText(input.risks,1200);
  const rollback=cleanText(input.rollback,1000);
  const baselineId=cleanText(input.baseline_id,100);
  const candidateId=cleanText(input.candidate_id,100);
  if(!title||!explanation||!rationale||!diff.trim()||diff.length>MAX_DIFF||!files.length||!tests.length||!rollback||!baselineId||!candidateId)
    return {ok:false,error:'Der Vorschlag ist unvollständig oder überschreitet die zulässige Größe.'};
  const protectedFiles=new Set(['backend/server.js','backend/messinho-capabilities.js','backend/messinho-capability-runtime.js','backend/messinho-orchestrator.js','backend/messinho-agent-core.js','backend/messinho-autonomy.js','backend/messinho-access.js','backend/messinho-rights-registry.js','backend/messinho-knowledge-graph.js','backend/messinho-domain-knowledge.js']);
  if(files.some(path=>!(path.startsWith('backend/')||path.startsWith('tests/')||path.startsWith('docs/'))||path.startsWith('/')||path.includes('..')||path.includes('\\')||/^(supabase\/migrations|\.github|infra|deploy)(\/|$)/i.test(path)||/\.(sql|env|pem|key|crt)$/i.test(path)||protectedFiles.has(path)))
    return {ok:false,error:'Der Vorschlag enthält einen geschützten oder nicht zulässigen Dateipfad.'};
  if(/(?:OPENAI_API_KEY|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|JWT_SECRET|BEGIN (?:RSA|OPENSSH|EC) PRIVATE KEY)/i.test(diff))
    return {ok:false,error:'Der Vorschlag enthält möglicherweise geheime Zugangsdaten.'};
  if(/(?:child_process|\bexec\s*\(|\bspawn\s*\(|\beval\s*\(|new\s+Function|process\.env|https?:\/\/|\bfetch\s*\()/i.test(diff))
    return {ok:false,error:'Der Vorschlag enthält nicht freigegebene Ausführungs-, Netzwerk- oder Umgebungszugriffe.'};
  const fingerprint=createHash('sha256').update(JSON.stringify({title,explanation,rationale,diff,files,baselineId,candidateId})).digest('hex');
  return {ok:true,value:{title,explanation,rationale,diff,files,tests,risks,rollback,baseline_id:baselineId,candidate_id:candidateId,fingerprint}};
}

export function createMyKiTicketRecord(proposal,{now=new Date(),id=randomUUID()}={}) {
  const normalized=normalizeMyKiTicketProposal(proposal);
  if(!normalized.ok) return normalized;
  const date=now instanceof Date?now:new Date(now);
  if(Number.isNaN(date.getTime())) return {ok:false,error:'Ungültiger Zeitstempel.'};
  const ticketId='MYKI-'+date.getUTCFullYear()+'-'+id.replace(/[^a-f0-9]/gi,'').slice(0,12).toUpperCase().padEnd(12,'0');
  return {ok:true,ticket:{
    id,ticket_id:ticketId,...normalized.value,status:'submitted',created_at:date.toISOString(),
    updated_at:date.toISOString(),deleted_at:null,integrated_at:null,error_code:null,error_message:null
  }};
}

const TRANSITIONS={
  submitted:new Set(['reviewing','ready_for_staging','deleted']),
  reviewing:new Set(['ready_for_staging','integration_failed','deleted']),
  ready_for_staging:new Set(['integrating','deleted']),
  integrating:new Set(['integration_failed','integrated']),
  integration_failed:new Set(['reviewing','ready_for_staging','deleted']),
  integrated:new Set(['deleted']),
  deleted:new Set()
};
export function validateMyKiTransition(current,next,{actorRole='admin',approved=false,verification=null}={}) {
  if(actorRole!=='admin'||!approved) return {ok:false,error:'Nur ein freigeschalteter Administrator darf dieses Ticket ändern.'};
  if(!STATUSES.has(current)||!STATUSES.has(next)||!TRANSITIONS[current]?.has(next)) return {ok:false,error:'Dieser Statuswechsel ist nicht zulässig.'};
  if(next==='integrated') {
    const valid=verification&&verification.commit_sha&&verification.tests_passed===true&&verification.security_passed===true&&verification.tenant_isolation_passed===true&&verification.staging_health_passed===true&&verification.deployed===true;
    if(!valid) return {ok:false,error:'Integration kann erst nach bestätigten Staging-Tests und Health-Check abgeschlossen werden.'};
  }
  if(next==='integrating') return {ok:false,error:'Die isolierte Integrationsumgebung ist noch nicht freigegeben.'};
  return {ok:true};
}

export function buildMyKiCopyPacket(ticket) {
  if(!ticket||ticket.status==='deleted') return {ok:false,error:'Dieses Ticket ist nicht verfügbar.'};
  const safe={
    ticket_id:ticket.ticket_id,title:cleanText(ticket.title,140),status:ticket.status,
    created_at:ticket.created_at,explanation:cleanText(ticket.explanation,2400),
    rationale:cleanText(ticket.rationale,1600),files:Array.isArray(ticket.files)?ticket.files.slice(0,8):[],
    diff:String(ticket.diff||'').slice(0,MAX_DIFF),
    tests:Array.isArray(ticket.tests)?ticket.tests.slice(0,20):[],
    risks:cleanText(ticket.risks,1200),rollback:cleanText(ticket.rollback,1000),
    baseline_id:cleanText(ticket.baseline_id,100),candidate_id:cleanText(ticket.candidate_id,100),
    proposal_fingerprint:cleanText(ticket.fingerprint,64),
    error_code:cleanText(ticket.error_code,80),error_message:cleanText(ticket.error_message,500)
  };
  return {ok:true,text:JSON.stringify(safe,null,2)};
}
