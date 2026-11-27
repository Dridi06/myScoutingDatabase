import { createMyKiTicketRecord } from './messinho-myki-tickets.js';
import { normalizeMessinhoEngineeringProposal } from './messinho-engineering-proposals.js';

/**
 * Trusted in-process bridge from validated MESSINHO agent results to myKI.
 * It persists proposals only; it never applies diffs or executes code.
 */
export async function persistMessinhoMyKiProposal({db,proposal,now=new Date(),id}={}) {
  if(!db||typeof db.rpc!=='function') return {ok:false,code:'MYKI_DATABASE_UNAVAILABLE'};
  const normalized=normalizeMessinhoEngineeringProposal(proposal);
  if(!normalized.ok) return {ok:false,code:'MYKI_PROPOSAL_REJECTED',error:normalized.error};
  const value=normalized.value;
  const ticketInput={
    title:value.title,
    explanation:value.rationale+' Der Änderungsvorschlag wurde nur zur Admin-Prüfung gespeichert. Es wurde kein Code angewendet oder ausgeführt.',
    rationale:value.rationale,
    diff:value.patch,
    files:value.files,
    tests:value.test_plan.map((name)=>({name,status:'not_run',details:'Vor einer Staging-Integration separat auszuführen.'})),
    risks:'Noch nicht unabhängig geprüft. Die sechs Qualitätsprüfungen müssen vor einer Integrationsfreigabe nachgewiesen werden.',
    rollback:value.rollback_plan,
    baseline_id:value.benchmark_id,
    candidate_id:value.id
  };
  const record=createMyKiTicketRecord(ticketInput,{now,id});
  if(!record.ok) return {ok:false,code:'MYKI_TICKET_REJECTED',error:record.error};
  const {data,error}=await db.rpc('asi_create_messinho_myki_ticket',{p_ticket:record.ticket});
  if(error) {
    if(error.code==='23505') return {ok:true,duplicate:true,code:'MYKI_DUPLICATE'};
    return {ok:false,code:'MYKI_PERSIST_FAILED',error_code:error.code||'unknown'};
  }
  return {ok:true,duplicate:false,ticket_id:data?.ticket_id||record.ticket.ticket_id,ticket:data||record.ticket};
}

/** Only explicit, validated engineering proposals from successful admin agent steps are eligible. */
export async function dispatchMessinhoMyKiProposals({role='scout',run,onProposal}={}) {
  if(role!=='admin'||typeof onProposal!=='function') return {eligible:0,submitted:0,rejected:0,skipped:'role_or_callback'};
  if(run?.status!=='completed'||!Number.isFinite(run?.completed_steps)||run.completed_steps!==run.total_steps) return {eligible:0,submitted:0,rejected:0,skipped:'agent_run_incomplete'};
  const results=Array.isArray(run?.results)?run.results:[];
  const candidates=results.filter(item=>item?.status==='proposal_ready'&&item?.result?.myki_engineering_proposal);
  const outcomes=[];
  for(const item of candidates) {
    try {
      const outcome=await onProposal(item.result.myki_engineering_proposal,item);
      outcomes.push({capability_id:item.capability_id,...outcome});
    } catch {
      outcomes.push({capability_id:item.capability_id,ok:false,code:'MYKI_DISPATCH_FAILED'});
    }
  }
  return {eligible:candidates.length,submitted:outcomes.filter(x=>x.ok&&!x.duplicate).length,
    duplicates:outcomes.filter(x=>x.ok&&x.duplicate).length,rejected:outcomes.filter(x=>!x.ok).length,outcomes};
}
