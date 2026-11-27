/**
 * MESSINHO Autonomous Tool Intelligence.
 * Describes real handler quality and input readiness before execution.
 * It never grants permissions or executes a capability.
 */
import { getMessinhoCapabilityDiscovery } from './messinho-orchestrator.js';

export const MESSINHO_TOOL_INTELLIGENCE_VERSION='1.0.0';
const INPUT_ALIASES={
 player:['player','candidate'],
 player_metrics:['metrics','ratings','performance_metrics','player_metrics'],
 positions:['positions','position'],
 history:['history','performance_history','performanceHistory'],
 dated_metrics:['history','performance_history','time_series'],
 sources:['sources','evidence'],
 evidence:['sources','evidence','claims'],
 birth_year:['birth_year','year'],
 outcomes:['outcomes','verified_success_outcomes','success_history'],
 events:['events','match_events'],
 team_profile:['team_profile','team'],
 club_needs:['club_needs','team_needs'],
 league_benchmarks:['league_benchmarks','benchmarks']
};
function hasPath(value,path){
 return path.split('.').reduce((current,key)=>current&&typeof current==='object'?current[key]:undefined,value)!==undefined;
}
function hasInput(context,key){
 const aliases=INPUT_ALIASES[key];
 if(!aliases)return null;
 return aliases.some(alias=>hasPath(context,alias)||hasPath(context,'player.'+alias));
}
export function buildMessinhoToolIntelligence(plan,role='scout',context={}){
 const catalogue=getMessinhoCapabilityDiscovery();
 const byId=new Map(catalogue.map(item=>[item.id,item]));
 const selected=Array.isArray(plan?.steps)?plan.steps:[];
 const tools=selected.map((id,index)=>{
  const item=byId.get(id);
  if(!item)return {id,index:index+1,status:'unknown_tool',executable:false};
  const inputs=String(item.required_inputs||'').split(',').map(x=>x.trim()).filter(Boolean);
  const assessed=inputs.map(key=>({key,available:hasInput(context,key)}));
  const missing=assessed.filter(x=>x.available===false).map(x=>x.key);
  const unknown=assessed.filter(x=>x.available===null).map(x=>x.key);
  const runtime=item.runtime_status||'unknown';
  const permissionDenied=item.admin_only&&role!=='admin';
  return {id,index:index+1,name:item.name,group:item.group,
   runtime_status:runtime,executable:runtime==='specialist'||runtime==='generic_fallback',
   execution_quality:runtime==='specialist'?'specialist_logic':runtime==='generic_fallback'?'generic_fallback':runtime,
   permission_status:permissionDenied?'blocked_admin_only':'allowed',
   input_readiness:missing.length?'may_need_input':unknown.length?'not_fully_assessed':'available',
   missing_inputs:missing,unassessed_inputs:unknown};
 });
 const fallback=tools.filter(x=>x.runtime_status==='generic_fallback').map(x=>x.id);
 const unavailable=tools.filter(x=>!x.executable||x.permission_status==='blocked_admin_only').map(x=>x.id);
 return {version:MESSINHO_TOOL_INTELLIGENCE_VERSION,selection_source:plan?.planning_source||plan?.mode||'deterministic',
  selected_count:tools.length,specialist_count:tools.filter(x=>x.runtime_status==='specialist').length,
  generic_fallback_count:fallback.length,unavailable_count:unavailable.length,
  generic_fallback_capabilities:fallback,unavailable_capabilities:unavailable,
  tools,execution_guard:'Application runtime and role checks remain authoritative; this manifest is diagnostic only.'};
}
