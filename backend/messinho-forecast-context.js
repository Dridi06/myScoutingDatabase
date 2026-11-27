const finite = value => value === null || value === undefined || value === '' ? null : (Number.isFinite(Number(value)) ? Number(value) : null);
const dateValue = value => { const parsed=Date.parse(value); return Number.isFinite(parsed)?parsed:null; };
const asObject = value => value && typeof value==='object' && !Array.isArray(value) ? value : {};
const explanationOf = value => {
  if(value && typeof value==='object' && !Array.isArray(value)) return value;
  if(typeof value==='string') { try { const parsed=JSON.parse(value); return asObject(parsed); } catch {} }
  return {};
};
const validEvidence = (row,now) => {
  if(!['confirmed','corroborated'].includes(row?.verification_status) ||
     row?.identity_status!=='matched' || row?.review_status!=='approved' ||
     row?.data_classification!=='ordinary' ||
     !['approved','not_required'].includes(row?.legal_review_status)) return false;
  const until=row?.valid_until?dateValue(row.valid_until):null;
  return until===null || until>now;
};
const outcomeIsVerified = row => row?.verification_status==='verified' &&
  dateValue(row?.observed_on)!==null && finite(row?.observed_value)!==null;

export function buildMessinhoForecastContext({evidence=[],contractSnapshots=[],predictions=[],outcomes=[],now=Date.now()}={}) {
  const nowMs=typeof now==='number'?now:dateValue(now)||Date.now();
  const approvedEvidence=(Array.isArray(evidence)?evidence:[]).filter(row=>validEvidence(row,nowMs));
  const approvedEvidenceIds=new Set(approvedEvidence.map(row=>String(row.id)));
  const verifiedContracts=(Array.isArray(contractSnapshots)?contractSnapshots:[]).filter(row=>
    ['confirmed','corroborated'].includes(row?.verification_status) && row?.contract_status &&
    row?.evidence_id && approvedEvidenceIds.has(String(row.evidence_id))
  );
  const predictionMap=new Map((Array.isArray(predictions)?predictions:[]).map(row=>[String(row.id),row]));
  const verifiedOutcomes=(Array.isArray(outcomes)?outcomes:[]).filter(outcomeIsVerified);
  const timeSeries=[];
  for(const row of verifiedOutcomes) {
    const metric=String(row.observed_metric||'').toLowerCase();
    if(!['overall_score','player_score','performance_score','player_development_score'].includes(metric)) continue;
    const value=finite(row.observed_value);
    if(value===null||value<0||value>100)continue;
    timeSeries.push({verification_status:'verified',player_id:row.player_id,observed_at:row.observed_on,overall_score:value,source_id:row.id});
  }
  const marketValueHistory=[];
  for(const row of verifiedOutcomes) {
    if(!['market_value_eur','market_value'].includes(String(row.observed_metric||'').toLowerCase()))continue;
    const value=finite(row.observed_value);
    if(value>0)marketValueHistory.push({verification_status:'verified',date:row.observed_on,value_eur:value,currency:'EUR',source_id:row.id});
  }
  for(const row of approvedEvidence) {
    const metadata=asObject(row.metadata);
    const metric=String(metadata.messinho_metric_key||metadata.metric_key||'').toLowerCase();
    const value=finite(metadata.value);
    if(metric==='overall_score'&&value!==null&&value>=0&&value<=100&&row.event_date)
      timeSeries.push({verification_status:'verified',observed_at:row.event_date,overall_score:value,source_id:row.id});
    if(metric==='market_value_eur'&&value!==null&&value>0&&row.event_date)
      marketValueHistory.push({verification_status:'verified',date:row.event_date,value_eur:value,currency:'EUR',source_id:row.id});
  }
  const transferHistory=[],successHistory=[],predictionPairs=[];
  for(const row of verifiedOutcomes) {
    const prediction=predictionMap.get(String(row.prediction_id));
    if(!prediction)continue;
    const explanation=explanationOf(prediction.explanation);
    predictionPairs.push({prediction_id:prediction.id,player_id:row.player_id,predicted_value:finite(prediction.predicted_value),
      observed_value:finite(row.observed_value),verification_status:'verified',target_metric:row.observed_metric,observed_on:row.observed_on});
    const metric=String(row.observed_metric||'').toLowerCase();
    if(['transfer_completed','transfer_outcome','transferred'].includes(metric)) {
      const position=String(explanation.position_group||'').trim().toLowerCase();
      const target=String(explanation.target_level||'').trim().toLowerCase();
      if(position&&target&&[0,1].includes(finite(row.observed_value)))
        transferHistory.push({verification_status:'verified',position_group:position,target_level:target,transferred:finite(row.observed_value)===1});
    }
    if(['player_success','success_outcome'].includes(metric)) {
      const position=String(explanation.position_group||'').trim().toLowerCase();
      const successDefinition=String(explanation.success_definition||'').trim().toLowerCase();
      const age=finite(explanation.age),score=finite(explanation.current_score);
      if(position&&successDefinition&&age!==null&&score!==null&&[0,1].includes(finite(row.observed_value)))
        successHistory.push({verification_status:'verified',position_group:position,success_definition:successDefinition,age,current_score:score,success:finite(row.observed_value)===1});
    }
  }
  const transferEvidence=approvedEvidence.filter(row=>
    ['transfer','transfer_rumour','contract_negotiation'].includes(row.claim_type)
  ).map(row=>({
    id:row.id,claim_type:row.claim_type,event_date:row.event_date,published_at:row.published_at,
    source_url:row.source_url,publisher:row.publisher,identity_status:row.identity_status,
    verification_status:row.verification_status,review_status:row.review_status,
    legal_review_status:row.legal_review_status,data_classification:row.data_classification,valid_until:row.valid_until
  }));
  const contracts=verifiedContracts.map(row=>({
    id:row.id,evidence_id:row.evidence_id,contract_status:row.contract_status,contract_end:row.contract_end,
    effective_date:row.effective_date,verification_status:row.verification_status,is_current:row.is_current,
    source_url:row.source_url,created_at:row.created_at
  }));
  const dedupe=(rows,key)=>[...new Map(rows.filter(x=>x[key]).map(x=>[String(x[key]),x])).values()].sort((a,b)=>(dateValue(a.observed_at||a.date)||0)-(dateValue(b.observed_at||b.date)||0));
  const finalTimeSeries=dedupe(timeSeries,'observed_at');
  const finalMarketValues=dedupe(marketValueHistory,'date');
  const sourceIds=[...new Set([...approvedEvidence.map(x=>x.id),...verifiedOutcomes.map(x=>x.id)].filter(Boolean))].slice(0,100);
  return {
    time_series:finalTimeSeries,market_value_history:finalMarketValues,transfer_history:transferHistory,
    success_history:successHistory,transfer_evidence:transferEvidence,contract_history:contracts,
    prediction_pairs:predictionPairs,
    _messinho_forecast_data_status:{
      approved_evidence:approvedEvidence.length,verified_contracts:contracts.length,verified_outcomes:verifiedOutcomes.length,
      performance_points:finalTimeSeries.length,market_value_points:finalMarketValues.length,
      transfer_cases:transferHistory.length,success_cases:successHistory.length,transfer_signals:transferEvidence.length,
      source_ids:sourceIds
    }
  };
}
