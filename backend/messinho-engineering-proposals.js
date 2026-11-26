/**
 * MESSINHO engineering proposal gate.
 *
 * This module validates and evaluates proposed patches only. It never writes
 * files, executes commands, invokes tools, changes permissions or deploys code.
 */
const clean=(value,max=1200)=>String(value??'').replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g,' ').trim().slice(0,max);
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const PROTECTED_PATHS=new Set([
 'backend/server.js','backend/messinho-capabilities.js','backend/messinho-capability-runtime.js',
 'backend/messinho-orchestrator.js','backend/messinho-agent-core.js','backend/messinho-autonomy.js',
 'backend/messinho-access.js','backend/messinho-rights-registry.js',
 'backend/messinho-knowledge-graph.js','backend/messinho-domain-knowledge.js'
]);
const SAFE_ROOTS=['backend/','tests/','docs/'];
const FORBIDDEN=/^(?:\.env(?:\..*)?|secrets?\/.*|.*\.(?:pem|key|p12|pfx)|package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i;
function safePath(path){
 if(typeof path!=='string'||!path||path.startsWith('/')||path.includes('\\')||path.split('/').some(part=>!part||part==='.'||part==='..'))return false;
 if(FORBIDDEN.test(path)||PROTECTED_PATHS.has(path))return false;
 if(/^(?:supabase\/|\.github\/|infra\/|deploy\/)/i.test(path)||/\.(?:sql|ya?ml)$/i.test(path))return false;
 return SAFE_ROOTS.some(root=>path.startsWith(root));
}
export function normalizeMessinhoEngineeringProposal(input={}){
 if(!object(input))return {ok:false,error:'Ungültiger Entwicklungsvorschlag.'};
 const id=clean(input.id,120),title=clean(input.title,180),rationale=clean(input.rationale,1600);
 const patch=typeof input.patch==='string'?input.patch:'';
 const testPlan=Array.isArray(input.test_plan)?input.test_plan.map(x=>clean(x,300)).filter(Boolean).slice(0,12):[];
 const rollback=clean(input.rollback_plan,1000),benchmark=clean(input.benchmark_id,120);
 if(id.length<6||title.length<8||rationale.length<30||patch.length<20||patch.length>24000||testPlan.length<2||rollback.length<20||benchmark.length<4)
  return {ok:false,error:'Titel, Begründung, begrenzter Patch, mindestens zwei Tests, Benchmark und Rollback-Plan sind erforderlich.'};
 if(/\b(?:exec|spawn|child_process|eval|new Function|process\.env|fetch\s*\(|https?:\/\/)/i.test(patch))
  return {ok:false,error:'Der Patch enthält nicht zulässige Ausführungs-, Umgebungs- oder Netzwerkzugriffe.'};
 const headers=[...patch.matchAll(/^diff --git a\/(.+) b\/(.+)$/gm)];
 if(!headers.length)return {ok:false,error:'Es wurde kein nachvollziehbarer Unified-Diff übergeben.'};
 const paths=[];
 for(const match of headers){
  const before=match[1],after=match[2];
  if(before!==after||!safePath(before))return {ok:false,error:'Der Patch enthält einen geschützten oder nicht freigegebenen Dateipfad.'};
  if(!paths.includes(before))paths.push(before);
 }
 if(paths.length>8)return {ok:false,error:'Ein Vorschlag darf höchstens acht Dateien umfassen.'};
 if(/^\s*(?:\+\+\+|---)\s+\/dev\/null/m.test(patch))return {ok:false,error:'Datei-Neuanlagen und Löschungen benötigen einen gesonderten Prüfprozess.'};
 return {ok:true,value:{
  id,title,rationale,patch,files:paths,test_plan:testPlan,benchmark_id:benchmark,
  rollback_plan:rollback,execution_mode:'proposal_only',status:'pending_admin_review',
  safeguards:{patch_applied:false,commands_executed:false,network_access:false,database_access:false,
   protected_paths_modified:false,production_access:false,admin_approval_required:true}
 }};
}
export function evaluateMessinhoEngineeringProposal(proposal,evaluation={}){
 if(!object(proposal)||proposal.execution_mode!=='proposal_only'||proposal.status!=='pending_admin_review')
  return {eligible:false,reason:'proposal_not_validated'};
 if(!object(evaluation.checks))return {eligible:false,reason:'evaluation_checks_required'};
 const required=['unit_tests','regression_tests','security_review','tenant_isolation','build','resource_budget'];
 const missing=required.filter(key=>evaluation.checks[key]!==true);
 if(missing.length)return {eligible:false,reason:'required_checks_not_passed',missing_checks:missing};
 if(evaluation.baseline_id!==proposal.benchmark_id||evaluation.candidate_id!==proposal.id)
  return {eligible:false,reason:'benchmark_identity_mismatch'};
 if(!Array.isArray(evaluation.improvements)||!evaluation.improvements.length||
   evaluation.improvements.some(item=>!object(item)||typeof item.metric!=='string'||!item.metric||!Number.isFinite(item.delta)||item.delta<=0))
  return {eligible:false,reason:'measurable_improvement_not_proven'};
 if(evaluation.regressions!==0||evaluation.security_findings!==0)
  return {eligible:false,reason:'regression_or_security_finding'};
 return {eligible:true,status:'evaluation_passed_admin_review_required',
  proposal_id:proposal.id,checks:required,improvements:evaluation.improvements,
  patch_applied:false,commands_executed:false,deployment_authorized:false,
  next_step:'admin_review_and_separate_staging_change'};
}
export const MESSINHO_ENGINEERING_PROPOSAL_POLICY=Object.freeze({
 version:'1.0.0',mode:'proposal_only',max_files:8,max_patch_chars:24000,
 no_execution:true,no_file_writes:true,no_network:true,no_database_access:true,
 protected_paths:[...PROTECTED_PATHS],required_checks:['unit_tests','regression_tests','security_review','tenant_isolation','build','resource_budget']
});
