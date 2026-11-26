import { scoreMessinhoPlayer } from './messinho-engine.js';

const asArray=value=>Array.isArray(value)?value:[];
const finite=value=>value===null||value===undefined||value===''?null:Number.isFinite(Number(value))?Number(value):null;

function trustedEvidenceRow(row,now){
  const confirmed=['confirmed','corroborated'].includes(row?.verification_status);
  const identityMatched=['matched','confirmed'].includes(row?.identity_status);
  const legalApproved=row?.legal_review_status==='approved'||row?.legal_review_status==='not_required';
  const ordinary=row?.data_classification==='ordinary';
  return Boolean(confirmed&&row.review_status==='approved'&&row.reviewed_by&&identityMatched&&
    legalApproved&&ordinary&&typeof row.source_url==='string'&&row.source_url.startsWith('https://')&&
    (!row.valid_until||Date.parse(row.valid_until)>now));
}

export function buildMessinhoCapabilityContext({
  player,players=[],observations=[],events=[],evidence=[],candidateEvidence=[],contracts=[],
  calibration=[],playerDirectory=[],predictions=[],predictionOutcomes=[],sourceRegistry=[],now=Date.now()
}){
  const context={player,players:asArray(players),candidates:asArray(players)};
  const history=asArray(observations).map(row=>{
    const ratings=row.ratings&&typeof row.ratings==='object'?row.ratings:{};
    const score=scoreMessinhoPlayer({...player,ratings}).score;
    return {...ratings,...row,score,overall_score:score};
  });
  if(history.length){
    context.history=history;
    context.time_series=history;
    context.seasonal_metrics=history.map(row=>({...row,season:String(row.observed_on||'').slice(0,4)}))
      .filter(row=>/^\d{4}$/.test(row.season));
  }
  const registry=new Map(asArray(sourceRegistry).map(row=>[String(row.id),row]));
  context.events=asArray(events).filter(row=>row.verification_status==='verified')
    .map(row=>{
      const matchingSource=asArray(evidence).find(source=>source.source_url===row.source_url);
      const source=registry.get(String(matchingSource?.source_id))||{};
      const permitted=asArray(source.permitted_purposes);
      const licensed=['approved','licensed','owned'].includes(source.license_status)&&
        permitted.some(purpose=>['video_analysis','video_source_research'].includes(purpose));
      return {...row,type:row.event_type,action:row.event_type,date:row.match_date,
        license_status:licensed?'licensed':null,usage_rights:licensed?'confirmed':null};
    });
  context._trusted_video_bundle=context.events.some(row=>row.license_status==='licensed');

  const rawEvidence=[...asArray(evidence),...asArray(candidateEvidence)];
  const trustedEvidence=rawEvidence.filter(row=>trustedEvidenceRow(row,now));
  const evidenceForUse=trustedEvidence.length?trustedEvidence:rawEvidence.filter(row=>row?.source_url);
  context.sources=evidenceForUse.map(row=>{
    const source=registry.get(String(row.source_id))||{};
    const videoAllowed=['approved','licensed','owned'].includes(source.license_status)&&
      asArray(source.permitted_purposes).some(purpose=>['video_analysis','video_source_research'].includes(purpose));
    const trusted=trustedEvidenceRow(row,now);
    return {
      title:row.claim_title||row.source_name||row.publisher||'Scouting-Quelle',
      url:row.source_url,publisher:row.publisher||row.provider||row.source_name||null,
      content:row.evidence_excerpt||row.claim_text||'',
      published_date:row.published_at||null,
      verification_status:trusted?'verified':(row.verification_status||'pending'),
      identity_status:row.identity_status||'unknown',fact_confidence:row.fact_confidence??null,
      review_status:row.review_status||'pending',legal_review_status:row.legal_review_status||'pending',
      license_id:row.license_id||null,
      license_status:videoAllowed?'licensed':null,
      usage_rights:videoAllowed?'confirmed':null,
      permitted_purposes:asArray(source.permitted_purposes),
      country:row.metadata?.country||row.metadata?.national_team_country||null,
      region:row.metadata?.region||null,league:row.metadata?.league||null,
      metadata:row.metadata||{}
    };
  });
  if(!context.sources.length&&Array.isArray(player?.sources)){
    context.sources=player.sources.filter(source=>source&&typeof source==='object').slice(0,100)
      .map(source=>({title:source.title||source.name||null,url:source.url||source.source_url||null,
        publisher:source.publisher||source.domain||null,content:source.snippet||source.content||'',
        verification_status:'unverified',identity_status:'unknown',review_status:'pending'}))
      .filter(source=>source.url);
  }
  context.claims=trustedEvidence.map(row=>({
    claim:row.claim_text||row.claim_title||null,source_url:row.source_url,
    verified:true,verification_status:'verified',verified_by:row.reviewed_by,
    identity_status:row.identity_status,claim_type:row.claim_type
  }));
  context._trusted_source_bundle=trustedEvidence.length>0;
  context.contract_records=asArray(contracts);
  const clubName=player?.club||player?.current_club||null;
  if(clubName){
    context.club={name:clubName,country:player?.country||null,league:player?.league||null};
    context.club_profile={name:clubName,country:player?.country||null,league:player?.league||null};
  }

  const directory=new Map(asArray(playerDirectory).map(row=>[String(row.player_id),row]));
  const verifiedCalibration=asArray(calibration)
    .filter(row=>row.verification_status==='verified'&&row.verified_by&&finite(row.verified_outcome)!==null)
    .map(row=>{
      const profile=directory.get(String(row.player_id))||{};
      const birthYear=Number(profile.year);
      const age=Number.isInteger(birthYear)&&birthYear>1900?new Date(now).getUTCFullYear()-birthYear:null;
      return {...row,age,age_group:age===null?null:Math.floor(age/5)*5+'-'+(Math.floor(age/5)*5+4),
        country:profile.national_team_country||null};
    });
  const outcomeRows=asArray(predictionOutcomes);
  context.outcomes=[
    ...verifiedCalibration.map(row=>({
      player_id:row.player_id,position_group:row.messinho_position_group,age:row.age,
      age_group:row.age_group,country:row.country,target_score:row.verified_outcome,
      verified_outcome:row.verified_outcome,verification_status:'verified',verified_by:row.verified_by,
      dimension_scores:row.messinho_dimension_scores||{},outcome_metric:row.outcome_metric,
      scout_id:row.scout_id,outcome_observed_on:row.outcome_observed_on
    })),
    ...outcomeRows.filter(row=>row.verification_status==='verified'&&row.verified_by&&finite(row.observed_value)!==null)
      .map(row=>({player_id:row.player_id,target_score:row.observed_value,verified_outcome:row.observed_value,
        verification_status:'verified',verified_by:row.verified_by,observed_on:row.observed_on,
        outcome_metric:row.observed_metric,source_url:row.verification_source_url}))
  ];
  context.predictions=asArray(predictions).map(prediction=>{
    const outcome=outcomeRows.find(row=>row.prediction_id===prediction.id);
    return {player_id:prediction.player_id,predicted_score:prediction.predicted_value,
      actual_score:outcome?.observed_value??null,
      verification_status:outcome?.verification_status||'pending',verified_by:outcome?.verified_by||null,
      model_version:prediction.model_version,target_metric:prediction.target_metric,created_at:prediction.created_at};
  });
  context.verified_scout_feedback=verifiedCalibration.map(row=>({
    verified:true,verified_by:row.verified_by,scout_id:row.scout_id,rating:row.scout_rating,category:row.outcome_metric
  }));
  context.data_context={
    observations:asArray(observations).length,verified_events:context.events.length,
    evidence_records:rawEvidence.length,trusted_evidence:trustedEvidence.length,
    contract_records:context.contract_records.length,verified_outcomes:context.outcomes.length,
    prediction_records:asArray(predictions).length,context_loaded_at:new Date(now).toISOString()
  };
  return context;
}
