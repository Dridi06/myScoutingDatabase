/**
 * MESSINHO 100-capability runtime.
 * The dispatcher covers the catalogue, but generic fallbacks are not specialist implementations.
 * The runtime never fabricates absent player metrics, evidence, outcomes or market data.
 * Provider-dependent research consumes a validated research bundle supplied by the ASI pipeline.
 */
import { getMessinhoCapabilityCatalog } from './messinho-capabilities.js';
import { scoreMessinhoPlayer, getMessinhoPositionGroup } from './messinho-engine.js';
import { assessMessinhoSource, messinhoValueSupported } from './messinho-intelligence.js';
import { buildMessinhoLearningProposal } from './messinho-learning.js';
import { analyzeMessinhoMatch } from './messinho-development.js';

export const MESSINHO_CAPABILITY_RUNTIME_VERSION = '1.0.0';
const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
const finite=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
const norm=v=>String(v??'').normalize('NFKC').toLocaleLowerCase('de-DE').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
const round=(n,d=2)=>Number(n.toFixed(d));
const avg=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
const std=xs=>{const m=avg(xs);return m===null?null:Math.sqrt(avg(xs.map(x=>(x-m)**2)));};
const dateValue=v=>{const n=Date.parse(v);return Number.isFinite(n)?n:null;};
const asArray=v=>Array.isArray(v)?v:[];
const aliases={
 technical:['technical','technik','dribbling','passing','passspiel','finishing','abschluss','first touch','ballkontrolle'],
 tactical:['tactical','taktik','positioning','positionierung','decision','entscheidungs','vision','raumverhalten','pressing'],
 athletic:['athletic','athletik','speed','sprint','acceleration','antritt','stamina','ausdauer','strength','kraft','agility','beweglichkeit'],
 mental:['mental','mentality','mentalitat','konzentration','disziplin','communication','kommunikation','leadership','fuhrung'],
 goalkeeping:['goalkeeping','torwart','reflex','handling','fangsicherheit','distribution','spielereroffnung']
};
function metricEntries(player={},extra={}){
 const source={...(player.performance_metrics||{}),...(player.metrics||{}),...(player.ratings||{}),...(player.analysis?.performance_metrics||{}),...(extra.metrics||{})};
 return Object.entries(source).map(([key,raw])=>{
   const v=raw&&typeof raw==='object'?(raw.score??raw.value):raw;
   const n=finite(v);
   const score=n===null?null:clamp(n<=1?n*100:n<=5?n*20:n);
   return {key,value:score,raw};
 }).filter(x=>x.value!==null);
}
function dimension(entries,kind){
 const patterns=aliases[kind]||[kind];
 const found=entries.filter(x=>patterns.some(p=>norm(x.key).includes(norm(p))));
 return found.length?round(avg(found.map(x=>x.value))):null;
}
function metricsByDimension(entries){
 return Object.fromEntries(Object.keys(aliases).map(k=>[k,dimension(entries,k)]));
}
function coverage(entries,expected=Object.keys(aliases)){
 return Math.round(expected.filter(k=>dimension(entries,k)!==null).length/expected.length*100);
}
function missingResult(id,required,detail='Für diese Funktion fehlen belastbare Eingabedaten.'){
 return {capability_id:id,status:'insufficient_data',result:null,missing_inputs:required,explanation:detail};
}
function result(id,status,result,extra={}){
 return {capability_id:id,status,result,engine_version:MESSINHO_CAPABILITY_RUNTIME_VERSION,...extra};
}
function playerName(p){return p?.name||p?.player_name||'Unbekannter Spieler';}
function getPlayer(input){return input.player||input.candidate||{};}
function getPlayers(input){return asArray(input.players).filter(x=>x&&typeof x==='object');}
function sourceBundle(input){return asArray(input.sources).filter(x=>x&&typeof x==='object');}
function evidenceUrls(input){return sourceBundle(input).map(s=>s.url).filter(Boolean);}
function verifiedOutcomes(input){
 return asArray(input.outcomes).filter(x=>x&&x.verification_status==='verified'&&x.verified_by&&finite(x.target_score??x.verified_outcome)!==null);
}
function sortedDated(items,key='date'){
 return items.map(x=>({...x,_date:dateValue(x[key]||x.observed_on||x.created_at)})).filter(x=>x._date!==null).sort((a,b)=>a._date-b._date);
}
function trend(items,key){
 const rows=sortedDated(items).map(x=>({date:new Date(x._date).toISOString().slice(0,10),value:finite(x[key])})).filter(x=>x.value!==null);
 if(rows.length<2)return null;
 const first=rows[0],last=rows.at(-1);
 return {points:rows.length,first,last,change:round(last.value-first.value),direction:last.value>first.value?'improving':last.value<first.value?'declining':'stable'};
}
function sourceAudit(sources,now){
 return sources.map(source=>({title:source.title||null,url:source.url||null,assessment:assessMessinhoSource(source,{now})}));
}
function profileScores(player){
 const entries=metricEntries(player);
 return {dimensions:metricsByDimension(entries),metric_count:entries.length,coverage:coverage(entries)};
}
function normalizedPosition(player){return getMessinhoPositionGroup(player.positions||player.position||[]);}
function scoreGroup(player,group){
 const entries=metricEntries(player);
 const value=dimension(entries,group);
 return value===null?null:Math.round(value);
}
function rankPlayers(players){
 return players.map(p=>({name:playerName(p),id:p.player_id??p.id??null,position_group:normalizedPosition(p),...profileScores(p),overall:scoreMessinhoPlayer(p).score}))
  .sort((a,b)=>(b.overall??-1)-(a.overall??-1));
}
function analysisHandler(id,input){
 const p=getPlayer(input),entries=metricEntries(p),dims=metricsByDimension(entries);
 const history=asArray(input.history||p.history||p.performance_history);
 const events=asArray(input.events||p.events);
 const positions=asArray(p.positions||p.position).filter(Boolean);
 const name=playerName(p);
 const timeSeries=asArray(input.time_series||history);
 const category=id;
 if(!p||!Object.keys(p).length)return missingResult(id,['player']);
 if(id==='holistic_player_analysis'||id==='player_profile_synthesis'){
   if(!entries.length&&!sourceBundle(input).length)return missingResult(id,['player_metrics','evidence']);
   return result(id,'completed',{player:name,position_group:normalizedPosition(p),dimensions:dims,overall:scoreMessinhoPlayer(p),data_coverage:coverage(entries),evidence_count:sourceBundle(input).length,profile_summary:Object.entries(dims).filter(([,v])=>v!==null).map(([k,v])=>k+': '+v+'/100').join(' · ')||'Keine numerischen Leistungswerte'});
 }
 if(id==='position_analysis')return result(id,positions.length?'completed':'insufficient_data',{primary_position:positions[0]||null,position_group:normalizedPosition(p),all_positions:positions});
 if(id==='multi_position_analysis'){
   if(!positions.length||!entries.length)return missingResult(id,['positions','player_metrics']);
   return result(id,'completed',{positions:positions.map(position=>({position,position_group:getMessinhoPositionGroup([position]),score:scoreMessinhoPlayer({...p,positions:[position]}).score,coverage:scoreMessinhoPlayer({...p,positions:[position]}).evidence_coverage}))});
 }
 if((id==='creativity_analysis'||id==='decision_quality_analysis')&&events.length){
   const relevant=events.filter(event=>{const action=norm(event.action||event.type||'');return id==='creativity_analysis'?/chance|key pass|assist|dribble|creative/.test(action):/decision|choice|pass|shot|duel/.test(action);});
   const eventAnalysis=analyzeMessinhoMatch(relevant);
   if(eventAnalysis.status==='insufficient_data')return missingResult(id,['mindestens fünf passende strukturierte Ereignisse']);
   return result(id,'completed',{...eventAnalysis,analysis_basis:'structured_match_events',interpretation:'Auswertung der gelieferten Ereignisse; keine Bewertung unbeobachteter Aktionen.'});
 }
 if(id==='strength_weakness_analysis'||id==='technical_detail_analysis'||id==='play_style_detection'||id==='game_intelligence_analysis'||id==='creativity_analysis'||id==='decision_quality_analysis'){
   if(!entries.length)return missingResult(id,['player_metrics']);
   const ordered=entries.slice().sort((a,b)=>b.value-a.value);
   const strengths=ordered.slice(0,4),weaknesses=ordered.slice(-4).reverse();
   let style='balanced';
   if(dims.technical!==null&&dims.technical>=75&&dims.athletic!==null&&dims.athletic>=70)style='technical_and_dynamic';
   else if(dims.tactical!==null&&dims.tactical>=75)style='positionally_intelligent';
   else if(dims.athletic!==null&&dims.athletic>=75)style='athletic';
   else if(dims.technical!==null&&dims.technical>=75)style='technical';
   return result(id,'completed',{strengths,development_areas:weaknesses,style,dimensions:dims,interpretation:'Musterbeschreibung aus vorhandenen Kennzahlen; keine Aussage über Persönlichkeit oder unbeobachtete Spielaktionen.'});
 }
 if(id==='potential_analysis'||id==='potential_score'||id==='talent_score'||id==='development_projection'){
   const t=trend(timeSeries,'score')||trend(timeSeries,'overall_score');
   const age=finite(input.age??p.age);
   const birthYear=finite(input.birth_year??p.birth_year??p.year);
   const currentYear=new Date(input.now||Date.now()).getFullYear();
   const derivedAge=age??(birthYear?currentYear-birthYear:null);
   if(!entries.length&&!t)return missingResult(id,['player_metrics','history']);
   const base=scoreMessinhoPlayer(p).score;
   const growth=t?.change??null;
   const potential=base===null?null:Math.round(clamp(base+(growth===null?0:Math.max(-5,Math.min(10,growth)))*.5));
   return result(id,'completed',{current_score:base,observed_change:growth,age:derivedAge,potential_indicator:potential,confidence:t?'longitudinal':'cross_sectional_only',limitations:t?[]:['Keine belastbare mehrzeitige Entwicklungshistorie; Potenzialindikator ist deshalb eingeschränkt.']});
 }
 if(id==='performance_development'||id==='form_curve_analysis'||id==='consistency_analysis'||id==='development_score'||id==='consistency_score'||id==='seasonal_metrics'){
   const key=input.metric_key||'score',t=trend(timeSeries,key);
   if(!t)return missingResult(id,['dated_metrics'],'Mindestens zwei datierte Messwerte derselben Kennzahl sind erforderlich.');
   const values=sortedDated(timeSeries).map(x=>finite(x[key])).filter(v=>v!==null);
   return result(id,'completed',{trend:t,mean:round(avg(values)),standard_deviation:round(std(values)),coefficient_of_variation:avg(values)?round(std(values)/avg(values),3):null});
 }
 if(id==='tactical_behaviour_analysis'||id==='game_phase_analysis'||id==='duel_analysis'||id==='video_event_analysis'||id==='minutes_analysis'||id==='availability_history_analysis'||id==='running_performance_analysis'||id==='speed_analysis'||id==='anomaly_detection'){
   if(!events.length&&!history.length)return missingResult(id,[id==='video_event_analysis'?'licensed_video_events':id==='minutes_analysis'?'appearance_records':id==='availability_history_analysis'?'availability_records':'dated_metrics']);
   const filtered=id==='video_event_analysis'?(input._trusted_video_bundle===true?events.filter(e=>e.license_status==='licensed'||e.license_status==='owned'):[]):id==='duel_analysis'?events.filter(e=>/duel|zweikampf/i.test(String(e.action||e.type||''))):events;
   if(id==='video_event_analysis'&&!filtered.length)return missingResult(id,['licensed_video_events'],'Es werden ausschließlich lizenzierte oder eigene vorverarbeitete Ereignisdaten akzeptiert.');
   if(['tactical_behaviour_analysis','game_phase_analysis','duel_analysis','video_event_analysis'].includes(id)){
     const eventAnalysis=analyzeMessinhoMatch(filtered);
     if(eventAnalysis.status==='insufficient_data')return missingResult(id,[id==='video_event_analysis'?'mindestens fünf lizenzierte Ereignisse':'mindestens fünf strukturierte Ereignisse']);
     return result(id,'completed',{...eventAnalysis,analysis_basis:id==='video_event_analysis'?'licensed_video_events':'structured_match_events',interpretation:'Nur gelieferte Ereignisdaten werden ausgewertet; nicht erfasste Spielszenen bleiben unbekannt.'});
   }
   const key=input.metric_key||'value';
   const vals=filtered.map(e=>finite(e[key])).filter(v=>v!==null);
   const groups=filtered.reduce((acc,e)=>{const k=e.phase||e.event_type||e.type||'other';acc[k]=(acc[k]||0)+1;return acc;},{});
   return result(id,'completed',{event_count:filtered.length,group_counts:groups,mean_value:avg(vals)===null?null:round(avg(vals)),min_value:vals.length?Math.min(...vals):null,max_value:vals.length?Math.max(...vals):null});
 }
 if(id==='peer_comparison_analysis'||id==='competition_comparison'){
   const peers=getPlayers(input).filter(x=>normalizedPosition(x)===normalizedPosition(p));
   if(peers.length<2)return missingResult(id,['cohort_metrics'],'Mindestens zwei vergleichbare Spieler derselben Positionsgruppe werden benötigt.');
   const ranked=rankPlayers(peers);
   const self=ranked.find(x=>String(x.id)===String(p.player_id??p.id));
   return result(id,'completed',{cohort_size:ranked.length,rank:self?ranked.findIndex(x=>x.id===self.id)+1:null,players:ranked});
 }
 if(id==='age_relative_analysis'){
   const birth=finite(p.birth_year??p.year);const cohort=getPlayers(input).filter(x=>finite(x.birth_year??x.year)===birth);
   if(birth===null||cohort.length<2)return missingResult(id,['birth_year','cohort_metrics']);
   return result(id,'completed',{birth_year:birth,cohort_size:cohort.length,ranking:rankPlayers(cohort)});
 }
 return missingResult(id,['capability_specific_inputs']);
}
function evaluationHandler(id,input){
 const p=getPlayer(input);
 const dimensionByCapability={technical_score:'technical',tactical_score:'tactical',athletic_score:'athletic',mental_score:'mental',goalkeeper_score:'goalkeeping'};
 if(dimensionByCapability[id]){
   const dimensionName=dimensionByCapability[id],entries=metricEntries(p),score=dimension(entries,dimensionName);
   if(score===null)return missingResult(id,[dimensionName+'_metrics']);
   const matching=entries.filter(entry=>(aliases[dimensionName]||[]).some(alias=>norm(entry.key).includes(norm(alias))));
   return result(id,'completed',{score:round(score),dimension:dimensionName,metric_count:matching.length,
     evidence_coverage:Math.min(100,Math.round(matching.length/Math.max(1,entries.length)*100)),
     calculation:'Mittelwert der vorhandenen, normalisierten Kennzahlen dieser Dimension',
     limitations:['Nur gespeicherte numerische Werte wurden berücksichtigt.','Fehlende Werte wurden nicht imputiert.']});
 }
 const p=getPlayer(input),entries=metricEntries(p),dims=metricsByDimension(entries);
 if(!p||!Object.keys(p).length)return missingResult(id,['player']);
 if(id==='overall_score'||id==='position_score'||id==='explainable_rating'){
   const scored=scoreMessinhoPlayer(p,input.model_profiles||null);
   return result(id,scored.score===null?'insufficient_data':'completed',{...scored,explanation:scored.explanation,trace:{dimensions:scored.dimensions,position_group:scored.position_group,weights_source:input.model_profiles?'approved_model_profiles':'versioned_code_baseline'}});
 }
 const dimensionMap={technical_score:'technical',tactical_score:'tactical',athletic_score:'athletic',mental_score:'mental',goalkeeper_score:'goalkeeping'};
 if(dimensionMap[id]){
   const value=dimension(entries,dimensionMap[id]);
   return value===null?missingResult(id,[dimensionMap[id]+'_metrics']):result(id,'completed',{score:Math.round(value),dimension:dimensionMap[id],metric_count:entries.length});
 }
 if(id==='development_score'||id==='consistency_score'){
   const rows=sortedDated(asArray(input.time_series||input.history||p.history));
   const key=input.metric_key||'score';
   const values=rows.map(x=>finite(x[key])).filter(v=>v!==null);
   if(values.length<2)return missingResult(id,['dated_metrics']);
   const spread=std(values),mean=avg(values);
   return result(id,'completed',{score:id==='consistency_score'?Math.round(clamp(100-(spread||0)*2)):Math.round(clamp(50+(values.at(-1)-values[0]))),mean:round(mean),standard_deviation:round(spread),observations:values.length});
 }
 if(id==='potential_score'||id==='talent_score'||id==='development_projection'){
   const rows=sortedDated(asArray(input.time_series||input.history||p.history));
   const key=input.metric_key||'score';
   const values=rows.map(x=>finite(x[key])).filter(v=>v!==null);
   const current=scoreMessinhoPlayer(p).score;
   const age=finite(p.age??input.age)??(finite(p.birth_year??p.year)?new Date().getFullYear()-finite(p.birth_year??p.year):null);
   if(current===null)return missingResult(id,['player_metrics']);
   const observedChange=values.length>=2?values.at(-1)-values[0]:null;
   const ageFactor=age===null?null:age<=20?10:age<=23?6:age<=26?3:0;
   const indicator=Math.round(clamp(current+(observedChange===null?0:Math.max(-10,Math.min(10,observedChange))*.5)+(ageFactor===null?0:ageFactor)));
   return result(id,'completed',{current_score:current,potential_indicator:indicator,observed_change:observedChange,age,confidence:values.length>=2&&age!==null?'longitudinal':'limited',limitations:values.length<2?['Keine ausreichende Entwicklungshistorie.']:[]});
 }
 if(id==='competition_comparison'){
   const peers=getPlayers(input).filter(x=>normalizedPosition(x)===normalizedPosition(p));
   if(peers.length<2)return missingResult(id,['cohort_metrics']);
   const ranked=rankPlayers(peers);
   return result(id,'completed',{cohort_size:ranked.length,ranking:ranked});
 }
 if(id==='data_quality_score'){
   const expected=['technical','tactical','athletic','mental'],present=expected.filter(k=>dims[k]!==null).length;
   return result(id,'completed',{score:Math.round(present/expected.length*100),present_dimensions:present,expected_dimensions:expected.length,metric_count:entries.length,missing_dimensions:expected.filter(k=>dims[k]===null)});
 }
 if(id==='source_trust_score'){
   const audited=sourceAudit(sourceBundle(input),input.now||Date.now());
   if(!audited.length)return missingResult(id,['sources']);
   const score=avg(audited.map(s=>(s.assessment.secure_transport?40:0)+(s.assessment.freshness==='fresh'?40:s.assessment.freshness==='unknown'?10:0)+(s.assessment.content_length>=80?20:0)));
   return result(id,'completed',{score:Math.round(score),sources:audited});
 }
 if(id==='system_fit_score'||id==='coach_fit_score'||id==='club_fit_score'||id==='league_fit_score'){
   const requirements=input.team_profile?.requirements||input.requirements||input.coach_requirements||input.club_needs||input.league_benchmarks;
   if(!requirements||typeof requirements!=='object')return missingResult(id,['team_profile.requirements']);
   const matched=[];
   for(const [key,targetRaw] of Object.entries(requirements).slice(0,40)){
     const target=finite(targetRaw),entry=entries.find(e=>norm(e.key).includes(norm(key)));
     if(target===null||!entry)continue;
     matched.push({attribute:key,actual:entry.value,target,distance:Math.abs(entry.value-target),fit:Math.max(0,100-Math.abs(entry.value-target))});
   }
   if(!matched.length)return missingResult(id,['matching_player_metrics']);
   return result(id,'completed',{score:Math.round(avg(matched.map(x=>x.fit))),matched_attributes:matched.length,required_attributes:Object.keys(requirements).length,coverage:Math.round(matched.length/Object.keys(requirements).length*100),details:matched});
 }
 if(id==='market_value_assessment'){
   const comps=asArray(input.market_comparables).map(x=>finite(x.value??x.market_value)).filter(v=>v!==null&&v>0);
   if(comps.length<3)return missingResult(id,['market_comparables'],'Eine Marktwertspanne wird erst ab drei vergleichbaren, belegten Markttransaktionen berechnet.');
   return result(id,'completed',{currency:input.currency||'EUR',low:round(comps.sort((a,b)=>a-b)[Math.floor((comps.length-1)*.25)]),median:round(comps.sort((a,b)=>a-b)[Math.floor(comps.length/2)]),high:round(comps.sort((a,b)=>a-b)[Math.ceil((comps.length-1)*.75)]),comparables:comps.length,estimate_only:true});
 }
 if(id==='value_for_money'){
   const cost=finite(input.transfer_cost),score=scoreMessinhoPlayer(p).score;
   if(cost===null||cost<=0||score===null)return missingResult(id,['transfer_cost','player_metrics']);
   return result(id,'completed',{score_per_million:round(score/(cost/1000000),2),cost,currency:input.currency||'EUR',sporting_score:score,not_a_market_valuation:true});
 }
 if(id==='risk_score'){
   const risks=asArray(input.risk_records);
   const sourceIssues=sourceAudit(sourceBundle(input),input.now||Date.now()).reduce((n,x)=>n+x.assessment.limitations.length,0);
   if(!risks.length&&!sourceBundle(input).length)return missingResult(id,['risk_records','sources']);
   const severity={low:1,medium:2,high:3,critical:4};
   const weighted=risks.map(r=>severity[r.severity]||0).filter(Boolean);
   return result(id,'completed',{risk_level:weighted.length?Math.max(...weighted):sourceIssues?'review_required': 'no_detected_issue',risk_records:risks.length,source_limitations:sourceIssues,scope:'Daten- und Dokumentationsrisiken; keine medizinische oder persönliche Diagnose.'});
 }
 if(id==='transfer_priority'){
   const candidates=getPlayers(input);
   if(!candidates.length)return missingResult(id,['candidate_scores','club_needs']);
   return result(id,'completed',{prioritized:rankPlayers(candidates).map((x,i)=>({...x,priority:i+1}))});
 }
 if(id==='scout_rating_agreement'){
   const ratings=asArray(input.scout_assessments).map(x=>finite(x.score??x.rating)).filter(v=>v!==null);
   if(ratings.length<2)return missingResult(id,['scout_assessments']);
   return result(id,'completed',{count:ratings.length,mean:round(avg(ratings)),spread:round(Math.max(...ratings)-Math.min(...ratings)),standard_deviation:round(std(ratings)),agreement:std(ratings)<=8?'high':std(ratings)<=15?'moderate':'low'});
 }
 return missingResult(id,['evaluation_inputs']);
}
function learningHandler(id,input){
 const rows=verifiedOutcomes(input);
 const min=Number.isInteger(input.minimum_examples)?Math.max(5,input.minimum_examples):30;
 if(id==='seasonal_learning'){
   const records=asArray(input.seasonal_metrics).map(row=>({season:String(row?.season||row?.season_label||'').trim(),score:finite(row?.score??row?.overall_score)})).filter(row=>row.season&&row.score!==null);
   const grouped=new Map();
   for(const row of records){if(!grouped.has(row.season))grouped.set(row.season,[]);grouped.get(row.season).push(row.score);}
   const seasons=[...grouped.entries()].map(([season,values])=>({season,observations:values.length,mean_score:round(avg(values))})).sort((a,b)=>a.season.localeCompare(b.season));
   if(seasons.length<2)return missingResult(id,['seasonal_metrics_for_at_least_two_seasons'],'Für einen Saisonvergleich werden belegte Werte aus mindestens zwei unterschiedlichen Saisons benötigt.');
   return result(id,'completed',{seasons,change:round(seasons.at(-1).mean_score-seasons[0].mean_score),
     direction:seasons.at(-1).mean_score>seasons[0].mean_score?'improving':seasons.at(-1).mean_score<seasons[0].mean_score?'declining':'stable',
     training_performed:false,model_weights_changed:false,method:'Deskriptiver Vergleich der gelieferten Saisonwerte; keine automatische Modellanpassung.'});
 }
 if(id==='dataset_quality_improvement'||id==='data_error_learning'){
   const all=asArray(input.training_dataset||input.outcomes);
   const ids=all.map(x=>String(x.player_id??x.id??'')).filter(Boolean);
   const duplicates=ids.length-new Set(ids).size;
   const invalid=all.filter(x=>finite(x.target_score??x.verified_outcome)===null).length;
   return result(id,'completed',{records:all.length,verified_records:rows.length,duplicate_keys:duplicates,missing_targets:invalid,quality_score:all.length?Math.round((all.length-invalid-duplicates)/all.length*100):null,training_allowed:rows.length>=min});
 }
 if(id==='model_versioning')return result(id,'completed',{versioning:'supported_by_existing_asi_model_ledger',requires_admin_approval:true,training_examples:rows.length});
 if(id==='verified_long_term_memory'){
   const items=asArray(input.verified_insights).filter(x=>x.verified===true&&x.verified_by&&x.source_url&&/^https:\/\//i.test(x.source_url));
   return result(id,'completed',{verified_insights:items.length,items:items.map(x=>({key:x.key||null,value:x.value||null,source_url:x.source_url,expires_at:x.expires_at||null})),persistence:'read_only_input; persistence requires the dedicated audited ledger'});
 }
 if(id==='regression_guard'||id==='model_benchmarking'||id==='prediction_audit'||id==='error_pattern_detection'||id==='false_positive_learning'||id==='probability_calibration'||id==='scout_accuracy_analysis'||id==='scout_calibration'){
   const predictions=asArray(input.predictions).filter(x=>x&&finite(x.predicted_score??x.prediction)!==null&&finite(x.actual_score??x.verified_outcome)!==null&&x.verification_status==='verified');
   if(!predictions.length)return missingResult(id,['verified_predictions']);
   const errors=predictions.map(x=>({player_id:x.player_id??null,error:finite(x.predicted_score??x.prediction)-finite(x.actual_score??x.verified_outcome)}));
   const mae=avg(errors.map(x=>Math.abs(x.error)));
   return result(id,'completed',{verified_predictions:predictions.length,mae:round(mae),bias:round(avg(errors.map(x=>x.error))),false_positives:errors.filter(x=>x.error>15).length,false_negatives:errors.filter(x=>x.error< -15).length,guard:'diagnostic_only'});
 }
 if(!rows.length)return missingResult(id,['admin_verified_outcomes']);
 const unique=new Set(rows.map(x=>String(x.player_id))).size;
 if(rows.length<min||unique<10)return result(id,'insufficient_data',{verified_examples:rows.length,unique_players:unique,required_examples:min,required_unique_players:10,training_performed:false});
 const profiles=input.baseline_profiles||{};
 const proposal=buildMessinhoLearningProposal(rows.map(x=>({player_id:String(x.player_id),position_group:x.position_group,target_score:finite(x.target_score??x.verified_outcome),dimension_scores:x.dimension_scores||{}})),profiles,{minExamples:min});
 return result(id,proposal.status==='proposal_ready'?'proposal_ready':'no_reliable_improvement',{proposal,training_performed:true,activation:'blocked_until_admin_review'});
}
function researchHandler(id,input){
 const sources=sourceBundle(input),now=input.now||Date.now();
 const audited=sourceAudit(sources,now);
 const claims=asArray(input.claims||input.evidence);
 if(id==='identity_verification'||id==='birth_year_verification'||id==='position_verification'){
   const player=getPlayer(input);
   const field=id==='birth_year_verification'?'birth_year':id==='position_verification'?'position':'name';
   const value=field==='name'?player.name:field==='position'?(player.positions||player.position):player.birth_year??player.year;
   if(value===null||value===undefined)return missingResult(id,[field]);
   const text=String(Array.isArray(value)?value.join(' '):value);
   const supported=input._trusted_source_bundle===true&&messinhoValueSupported(text,evidenceUrls(input),sources,claims);
   return result(id,supported?'verified':'unverified',{field,value,supported,source_count:sources.length,source_origin:input._trusted_source_bundle===true?'server_retrieved_ASI':'untrusted_request_payload',rule:'Verification requires a matching claim in server-retrieved HTTPS source text.'});
 }
 if(id==='video_source_research'){
   const licensed=sources.filter(s=>s.license_status==='licensed'||s.license_status==='owned'||s.usage_rights==='confirmed');
   return result(id,licensed.length?'completed':'insufficient_data',{source_count:sources.length,licensed_source_count:licensed.length,sources:audited,reason:licensed.length?'Only explicitly licensed or owned sources are returned.':'HTTPS availability is not a licence. No source is treated as usable without explicit rights evidence.'});
 }
 if(id==='contract_expiry_monitor'||id==='contract_research'){
   if(!sources.length)return missingResult(id,['contract_sources']);
   const patterns=[new RegExp('(?:contract|vertrag).{0,80}?(?:expires|expiry|läuft bis|laeuft bis|bis zum|until|through)(?:\\s+(?:on|am))?\\s+([0-9]{1,2}[./-][0-9]{1,2}[./-][0-9]{2,4}|[0-9]{4}-[0-9]{2}-[0-9]{2})','i'),new RegExp('(?:contract|vertrag).{0,80}?([0-9]{4}-[0-9]{2}-[0-9]{2})','i')];
   const mentions=sources.flatMap(source=>patterns.flatMap(pattern=>{const match=String(source.content||'').match(pattern);return match?[{date_mention:match[1],source_url:source.url,source_title:source.title||null,verified:false}]:[];}));
   return result(id,mentions.length?'needs_review':'insufficient_data',{contract_date_mentions:mentions,source_count:sources.length,rule:'Extracted dates are leads only and require confirmation from an official club or league source.'});
 }
 if(id==='source_cross_check'||id==='rumour_verification'){
   if(!sources.length)return missingResult(id,['sources']);
   const domains=audited.map(x=>x.assessment.host).filter(Boolean);
   const unique=[...new Set(domains)];
   return result(id,'completed',{source_count:sources.length,independent_domains:unique.length,domains:unique,corroboration:unique.length>=2?'multi_source':'single_source_only',rumours_are_not_facts:id==='rumour_verification'});
 }
 if(id==='research_report_generation'){
   if(!sources.length)return missingResult(id,['verified_research_bundle']);
   return result(id,'completed',{report:{subject:playerName(getPlayer(input)),facts:claims.map(c=>({claim:c.claim||null,source_url:c.source_url||null})),sources:audited,open_questions:audited.flatMap(x=>x.assessment.limitations)}});
 }
 if(id==='player_data_refresh'||id==='new_talent_monitoring'||id==='market_monitoring'||id==='competition_monitoring'){
   const last=finite(input.last_checked_at)?finite(input.last_checked_at):dateValue(input.last_checked_at);
   const interval=Number.isFinite(input.refresh_after_days)?input.refresh_after_days:30;
   const due=last===null||Date.now()-last>interval*86400000;
   return result(id,'completed',{due_for_refresh:due,last_checked_at:input.last_checked_at||null,refresh_after_days:interval,automatic_scheduler_configured:input.scheduler_enabled===true,execution:'schedule_evaluation_only'});
 }
 if(!sources.length)return missingResult(id,['research_sources_from_asi_pipeline']);
 const eligible=audited.filter(x=>x.assessment.url_valid&&x.assessment.secure_transport);
 return result(id,'completed',{source_count:sources.length,eligible_sources:eligible.length,sources:audited,claims:claims.length,provider_execution:'requires_ASI_search_results',notes:'This capability evaluates source bundles. Live discovery must be initiated by the configured ASI/Tavily provider pipeline.'});
}
const analysisIds=new Set(['holistic_player_analysis','position_analysis','multi_position_analysis','play_style_detection','strength_weakness_analysis','potential_analysis','performance_development','form_curve_analysis','game_intelligence_analysis','tactical_behaviour_analysis','game_phase_analysis','duel_analysis','running_performance_analysis','speed_analysis','technical_detail_analysis','creativity_analysis','decision_quality_analysis','consistency_analysis','peer_comparison_analysis','age_relative_analysis','availability_history_analysis','minutes_analysis','video_event_analysis','anomaly_detection','player_profile_synthesis']);
const evaluationIds=new Set(['overall_score','position_score','potential_score','talent_score','technical_score','tactical_score','athletic_score','mental_score','goalkeeper_score','data_quality_score','source_trust_score','development_score','consistency_score','league_fit_score','system_fit_score','coach_fit_score','club_fit_score','market_value_assessment','value_for_money','risk_score','development_projection','competition_comparison','transfer_priority','scout_rating_agreement','explainable_rating']);
const learningIds=new Set(['supervised_learning','position_specific_learning','scout_feedback_learning','prediction_audit','error_pattern_detection','weight_optimization','age_group_learning','league_learning','country_learning','talent_pathway_learning','false_positive_learning','breakthrough_learning','scout_accuracy_analysis','scout_calibration','model_benchmarking','regression_guard','dataset_quality_improvement','data_error_learning','position_change_learning','availability_outcome_learning','probability_calibration','seasonal_learning','verified_long_term_memory','model_versioning','controlled_self_optimization']);
const researchIds=new Set(['automated_talent_search','international_research','cross_league_research','youth_talent_discovery','underdog_detection','hidden_gem_detection','club_research','squad_research','contract_research','contract_expiry_monitor','rumour_verification','market_monitoring','source_cross_check','identity_verification','birth_year_verification','position_verification','statistics_research','video_source_research','match_report_research','competition_monitoring','club_need_research','comparable_player_research','player_data_refresh','new_talent_monitoring','research_report_generation']);

const allCatalog=getMessinhoCapabilityCatalog();
const catalogById=new Map(allCatalog.flatMap(g=>g.functions).map(x=>[x.id,x]));
const SPECIALIST_HANDLER_IDS=new Set(["holistic_player_analysis","position_analysis","multi_position_analysis","play_style_detection","strength_weakness_analysis","potential_analysis","performance_development","form_curve_analysis","game_intelligence_analysis","tactical_behaviour_analysis","game_phase_analysis","duel_analysis","running_performance_analysis","speed_analysis","technical_detail_analysis","creativity_analysis","decision_quality_analysis","consistency_analysis","peer_comparison_analysis","age_relative_analysis","availability_history_analysis","minutes_analysis","video_event_analysis","anomaly_detection","player_profile_synthesis","overall_score","position_score","potential_score","talent_score","data_quality_score","source_trust_score","development_score","consistency_score","league_fit_score","system_fit_score","coach_fit_score","club_fit_score","market_value_assessment","value_for_money","risk_score","development_projection","competition_comparison","transfer_priority","scout_rating_agreement","explainable_rating","prediction_audit","error_pattern_detection","false_positive_learning","scout_accuracy_analysis","scout_calibration","model_benchmarking","regression_guard","dataset_quality_improvement","data_error_learning","probability_calibration","verified_long_term_memory","model_versioning","contract_research","contract_expiry_monitor","rumour_verification","market_monitoring","source_cross_check","identity_verification","birth_year_verification","position_verification","video_source_research","competition_monitoring","player_data_refresh","new_talent_monitoring","research_report_generation","technical_score","tactical_score","athletic_score","mental_score","goalkeeper_score","seasonal_learning"]);
export function listExecutableMessinhoCapabilities(){
 return allCatalog.map(group=>({...group,functions:group.functions.map(fn=>{
   const specialist=SPECIALIST_HANDLER_IDS.has(fn.id);
   return {...fn,execution_handler_available:true,dispatch_available:true,specialist_handler_available:specialist,
     handler_kind:specialist?'specialist':'generic_missing_input_fallback',
     implementation_status:specialist?'partial':'not_implemented',runtime_version:MESSINHO_CAPABILITY_RUNTIME_VERSION};
 })}));
}
 return allCatalog.map(group=>({...group,functions:group.functions.map(fn=>({...fn,execution_handler_available:true,runtime_version:MESSINHO_CAPABILITY_RUNTIME_VERSION}))}));
}
export function executeMessinhoCapability(id,input={}){
 const meta=catalogById.get(id);
 if(!meta)return {capability_id:id,status:'unknown_capability',error:'Unbekannte MESSINHO-Funktion.'};
 if(!input||typeof input!=='object'||Array.isArray(input))return {capability_id:id,status:'invalid_input',error:'Eingaben müssen als Objekt übergeben werden.'};
 let output;
 if(analysisIds.has(id))output=analysisHandler(id,input);
 else if(evaluationIds.has(id))output=evaluationHandler(id,input);
 else if(learningIds.has(id))output=learningHandler(id,input);
 else if(researchIds.has(id))output=researchHandler(id,input);
 else output=missingResult(id,meta.required_inputs);
 return {...output,name:meta.name,domain:allCatalog.find(g=>g.functions.some(f=>f.id===id))?.id||null,description:meta.description};
}
export function getMessinhoRuntimeSummary(){
 const dispatched=new Set([...analysisIds,...evaluationIds,...learningIds,...researchIds]);
 const specialist=[...SPECIALIST_HANDLER_IDS].filter(id=>catalogById.has(id));
 const generic=[...catalogById.keys()].filter(id=>!SPECIALIST_HANDLER_IDS.has(id));
 return {version:MESSINHO_CAPABILITY_RUNTIME_VERSION,total_catalogue_entries:catalogById.size,
   dispatched_entries:dispatched.size,dispatch_coverage:catalogById.size?Math.round(dispatched.size/catalogById.size*100):0,
   specialist_handler_count:specialist.length,generic_fallback_count:generic.length,
   specialist_coverage:catalogById.size?Math.round(specialist.length/catalogById.size*100):0,
   not_implemented_capabilities:generic,
   seasonal_learning_handler:learningIds.has('seasonal_learning')&&SPECIALIST_HANDLER_IDS.has('seasonal_learning')?'reachable':'unavailable',
   all_dispatched:dispatched.size===catalogById.size};
}
