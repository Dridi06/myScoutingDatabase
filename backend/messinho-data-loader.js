import { scopeMessinhoOwner } from './messinho-access.js';
import { buildMessinhoCapabilityContext } from './messinho-data-context.js';

export const MESSINHO_PLAYER_CAPABILITIES=new Set([
 'holistic_player_analysis','player_profile_synthesis','position_analysis','multi_position_analysis',
 'play_style_detection','strength_weakness_analysis','potential_analysis','performance_development',
 'form_curve_analysis','game_intelligence_analysis','tactical_behaviour_analysis','game_phase_analysis',
 'duel_analysis','running_performance_analysis','speed_analysis','technical_detail_analysis',
 'creativity_analysis','decision_quality_analysis','consistency_analysis','peer_comparison_analysis',
 'age_relative_analysis','availability_history_analysis','minutes_analysis','video_event_analysis',
 'anomaly_detection','overall_score','position_score','potential_score','talent_score','technical_score',
 'tactical_score','athletic_score','mental_score','goalkeeper_score','development_score','consistency_score',
 'league_fit_score','system_fit_score','coach_fit_score','club_fit_score','market_value_assessment',
 'value_for_money','risk_score','development_projection','competition_comparison','transfer_priority',
 'scout_rating_agreement','explainable_rating','identity_verification','birth_year_verification',
 'position_verification','contract_research','contract_expiry_monitor','source_cross_check',
 'rumour_verification','research_report_generation','statistics_research','video_source_research',
 'match_report_research','player_data_refresh','comparable_player_research'
]);
export const MESSINHO_ROSTER_CAPABILITIES=new Set([
 'squad_research','club_need_research','club_research','automated_talent_search','hidden_gem_detection',
 'underdog_detection','comparable_player_research','cross_league_research'
]);
const HISTORY_CAPABILITIES=new Set([
 'performance_development','form_curve_analysis','potential_analysis','potential_score','talent_score',
 'development_score','consistency_score','consistency_analysis','seasonal_learning','talent_pathway_learning',
 'breakthrough_learning','availability_history_analysis','minutes_analysis','anomaly_detection'
]);
export const MESSINHO_EVIDENCE_CAPABILITIES=new Set([
 'identity_verification','birth_year_verification','position_verification','source_cross_check',
 'rumour_verification','research_report_generation','international_research','contract_research',
 'contract_expiry_monitor','video_source_research','statistics_research','match_report_research','player_data_refresh'
]);
const EVENT_CAPABILITIES=new Set([
 'video_event_analysis','creativity_analysis','decision_quality_analysis','game_phase_analysis',
 'tactical_behaviour_analysis','duel_analysis','match_report_research'
]);
const LEARNING_CAPABILITIES=new Set([
 'supervised_learning','position_specific_learning','scout_feedback_learning','prediction_audit',
 'error_pattern_detection','weight_optimization','age_group_learning','league_learning','country_learning',
 'talent_pathway_learning','false_positive_learning','breakthrough_learning','scout_accuracy_analysis',
 'scout_calibration','model_benchmarking','regression_guard','dataset_quality_improvement',
 'data_error_learning','position_change_learning','availability_outcome_learning','probability_calibration',
 'seasonal_learning','verified_long_term_memory','model_versioning','controlled_self_optimization'
]);

export function messinhoNeeds(plan,set){return (plan?.steps||[]).some(id=>set.has(id));}

async function scopedPlayerRows(db,table,columns,playerId,actor,limit=250,orderBy='created_at'){
  let query=db.from(table).select(columns).eq('player_id',playerId);
  query=scopeMessinhoOwner(query,actor).limit(limit);
  if(orderBy)query=query.order(orderBy,{ascending:true});
  const {data,error}=await query;
  if(error)throw new Error('MESSINHO context read failed for '+table+': '+error.message);
  return data||[];
}
async function scopedOwnerRows(db,table,columns,actor,limit=2000,orderBy='created_at'){
  let query=db.from(table).select(columns);
  query=scopeMessinhoOwner(query,actor).limit(limit);
  if(orderBy)query=query.order(orderBy,{ascending:false});
  const {data,error}=await query;
  if(error)throw new Error('MESSINHO owner-scoped read failed for '+table+': '+error.message);
  return data||[];
}

export async function loadMessinhoCapabilityContext({db,player,players=[],plan,actor,now=Date.now()}){
  if(!db)throw new Error('MESSINHO database connection is unavailable');
  const playerId=Number.isFinite(Number(player?.player_id))?Number(player.player_id):null;
  const candidateId=player?.player_id?null:(player?.id||null);
  const tasks={};
  if(!playerId){
    if(candidateId&&messinhoNeeds(plan,MESSINHO_EVIDENCE_CAPABILITIES)){
      tasks.candidateEvidence=(async()=>{
        let query=db.from('asi_candidate_evidence')
          .select('id,provider,source_name,source_type,source_url,publisher,license_id,attribution,claim_type,claim_title,claim_text,evidence_excerpt,published_at,identity_status,identity_confidence,fact_confidence,verification_status,data_classification,legal_review_status,review_status,reviewed_by,reviewed_at,metadata,created_at')
          .eq('candidate_id',candidateId);
        query=scopeMessinhoOwner(query,actor).limit(200);
        const {data,error}=await query.order('created_at',{ascending:true});
        if(error)throw new Error('Candidate evidence read failed: '+error.message);
        return data||[];
      })();
    }
  }else{
    if(messinhoNeeds(plan,HISTORY_CAPABILITIES)||messinhoNeeds(plan,EVENT_CAPABILITIES)){
      tasks.observations=scopedPlayerRows(db,'asi_player_observations',
        'player_id,observed_on,ratings,observation,source_type,created_at',playerId,actor,300,'observed_on');
    }
    if(messinhoNeeds(plan,EVENT_CAPABILITIES)){
      tasks.events=scopedPlayerRows(db,'asi_video_event_tags',
        'player_id,match_date,competition,opponent,minute,event_type,zone,outcome,source_url,verification_status,notes,created_at,detection_confidence,detection_metadata',
        playerId,actor,500,'match_date');
    }
    if(messinhoNeeds(plan,MESSINHO_EVIDENCE_CAPABILITIES)||messinhoNeeds(plan,LEARNING_CAPABILITIES)){
      tasks.evidence=scopedPlayerRows(db,'asi_external_evidence',
        'id,source_id,claim_type,claim_title,claim_text,event_date,published_at,source_url,publisher,source_category,evidence_excerpt,identity_status,identity_confidence,fact_confidence,verification_status,data_classification,legal_review_status,review_status,reviewed_by,reviewed_at,last_verified_at,valid_until,metadata,created_at',
        playerId,actor,300,'published_at');
    }
    if((plan?.steps||[]).some(id=>id==='contract_research'||id==='contract_expiry_monitor')){
      tasks.contracts=scopedPlayerRows(db,'asi_contract_snapshots',
        'id,evidence_id,contract_status,club_name,parent_club_name,contract_start,contract_end,option_type,option_details,effective_date,confidence,verification_status,source_url,source_checked_at,is_current,recorded_by,created_at',
        playerId,actor,100,'created_at');
    }
  }
  if(messinhoNeeds(plan,LEARNING_CAPABILITIES)){
    tasks.calibration=scopedOwnerRows(db,'asi_scout_calibration_records',
      'player_id,scout_id,scout_rating,outcome_metric,verified_outcome,outcome_observed_on,outcome_source_url,verification_status,verified_by,verified_at,messinho_position_group,messinho_dimension_scores,created_at',
      actor,2000,'created_at');
    tasks.predictions=scopedOwnerRows(db,'asi_prediction_records',
      'id,player_id,target_metric,prediction_horizon_days,predicted_value,probability,model_version,input_cutoff_at,status,explanation,created_at',
      actor,2000,'created_at');
    tasks.playerDirectory=scopedOwnerRows(db,'players','player_id,year,national_team_country,positions',actor,2000,'created_at');
  }
  const entries=await Promise.all(Object.entries(tasks).map(async([key,promise])=>[key,await promise]));
  const loaded=Object.fromEntries(entries);
  const predictionRecords=loaded.predictions||[];
  const predictionIds=predictionRecords.map(row=>row.id);
  let predictionOutcomes=[];
  if(predictionIds.length){
    let query=db.from('asi_prediction_outcomes')
      .select('id,prediction_id,player_id,observed_metric,observed_value,observed_on,outcome_source,verification_status,verification_source_url,verified_by,verified_at,verification_reason')
      .in('prediction_id',predictionIds);
    query=scopeMessinhoOwner(query,actor);
    const {data,error}=await query.limit(2000);
    if(error)throw new Error('MESSINHO prediction outcome read failed: '+error.message);
    predictionOutcomes=data||[];
  }
  const evidenceRows=[...(loaded.evidence||[]),...(loaded.candidateEvidence||[])];
  const sourceIds=[...new Set(evidenceRows.map(row=>row.source_id).filter(Boolean))];
  let sourceRegistry=[];
  if(sourceIds.length){
    const {data,error}=await db.from('asi_external_sources')
      .select('id,license_status,permitted_purposes,source_type,source_name,metadata')
      .in('id',sourceIds).limit(200);
    if(error)throw new Error('MESSINHO source registry read failed: '+error.message);
    sourceRegistry=data||[];
  }
  return buildMessinhoCapabilityContext({
    player,players:Array.isArray(players)?players:[],observations:loaded.observations||[],
    events:loaded.events||[],evidence:loaded.evidence||[],candidateEvidence:loaded.candidateEvidence||[],
    contracts:loaded.contracts||[],calibration:loaded.calibration||[],playerDirectory:loaded.playerDirectory||[],
    predictions:predictionRecords,predictionOutcomes,sourceRegistry,goal:plan?.goal||'',now
  });
}
