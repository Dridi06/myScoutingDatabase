/**
 * MESSINHO Full-Stack Intelligence & Sandbox Audit.
 * Read-only by default. Synthetic checks never execute tools, mutate memory,
 * change model weights, dispatch sandbox jobs or contact external providers.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { getMessinhoCapabilityCatalog } from './messinho-capabilities.js';
import { listExecutableMessinhoCapabilities, getMessinhoRuntimeSummary } from './messinho-capability-runtime.js';
import { buildMessinhoLinguisticContext } from './messinho-linguistic-intelligence.js';
import { buildMessinhoReasoningIntelligence } from './messinho-reasoning-intelligence.js';
import { evaluateMessinhoConversationCase } from './messinho-conversation-evaluation.js';
import { resolveMessinhoModelConfig, requestMessinhoModelCompletion } from './messinho-model-runtime.js';
import { isMessinhoSandboxStagingAllowed } from './messinho-sandbox-dispatch.js';

const safe=(value,max=1200)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
const SOURCE_DIRS=['backend','src','tests'];
async function readOptional(root,file){try{return await readFile(path.join(root,file),'utf8');}catch{return '';}}
async function countFiles(root,relative){
 let entries=[];try{entries=await readdir(path.join(root,relative),{withFileTypes:true});}catch{return 0;}
 let count=0;for(const entry of entries){if(entry.isDirectory()&&!['node_modules','.git','dist','build','coverage'].includes(entry.name))count+=await countFiles(root,path.join(relative,entry.name));else if(entry.isFile())count++;}return count;
}
function check(name,category,ok,detail,severity='warning',evidence={},recommendation=''){
 return {name,category,ok:Boolean(ok),status:ok?'PASS':'FAIL',severity,detail:safe(detail,2200),evidence,
  recommendation:ok?'Keine Maßnahme erforderlich.':safe(recommendation||'Befund prüfen und nach Korrektur erneut testen.',700),
  checked_at:new Date().toISOString()};
}
function runCapabilityDiscovery(){
 const catalog=getMessinhoCapabilityCatalog(),executable=listExecutableMessinhoCapabilities(),runtime=getMessinhoRuntimeSummary();
 const declared=catalog.flatMap(group=>group.functions.map(item=>item.id));
 const executableIds=executable.flatMap(group=>group.functions.map(item=>item.id));
 const duplicates=declared.filter((id,index)=>declared.indexOf(id)!==index);
 const missing=declared.filter(id=>!executableIds.includes(id));
 const unexpected=executableIds.filter(id=>!declared.includes(id));
 const fallback=executable.flatMap(group=>group.functions).filter(item=>item.implementation_level==='generic_fallback').map(item=>item.id);
 const specialist=executable.flatMap(group=>group.functions).filter(item=>item.implementation_level==='specialist_logic').map(item=>item.id);
 const ok=duplicates.length===0&&missing.length===0&&unexpected.length===0&&runtime.all_registered===true;
 return check('Code- und Funktionsintrospektion','Code & Tools',ok,
  'Katalogfunktionen: '+declared.length+'; registrierte Handler: '+runtime.unique_handlers+
  '; Speziallogik: '+specialist.length+'; generische Fallbacks: '+fallback.length+
  '; nicht dispatchte Funktionen: '+runtime.undispatched_count+
  '; doppelte IDs: '+duplicates.length+'. Registrierung ist kein Beweis für End-to-End-Fertigstellung.',
  ok?'info':'critical',{runtime,catalog_groups:catalog.map(group=>({id:group.id,total:group.total})),
   duplicate_ids:duplicates,missing_ids:missing,unexpected_ids:unexpected,
   generic_fallback_ids:fallback.slice(0,100),specialist_logic_ids:specialist.slice(0,100)},
  'Capability-Katalog, Dispatcher und Handlerregistrierung abgleichen; generische Fallbacks nicht als vollständig implementierte Spezialfunktionen ausgeben.');
}
function runLinguisticSyntheticTests(){
 const cases=[
  {id:'de_negation',text:'Hallo. Tu nicht X, sondern vergleiche A mit B.',language:'de'},
  {id:'en_multistep',text:'Do not search the web. Explain the difference and calculate the percentage.',language:'en'},
  {id:'fr_instruction',text:'Ne fais pas X, mais explique la différence.',language:'fr'},
  {id:'ar_tunisian',text:'عسلامة، نحب نفهم علاش اللاعب هذا قوي؟',language:'ar-tn'}
 ];
 const results=cases.map(item=>{
  const context=buildMessinhoLinguisticContext(item.text,[]);
  const language=String(context?.primary_language||context?.segments?.[0]?.language_analysis?.primary_language||'');
  return {id:item.id,expected_language:item.language,detected_language:language||null,
   segments:Array.isArray(context?.segments)?context.segments.length:0,
   passed:language===item.language&&Array.isArray(context?.segments)&&context.segments.length>0};
 });
 const message='Vergleiche A und B, berechne danach die prozentuale Differenz und führe keine Recherche aus.';
 const reasoning=buildMessinhoReasoningIntelligence({message,history:[{role:'user',text:'Der alte Wert ist 20.'}]});
 const multiStep=reasoning?.decomposition?.required===true&&(reasoning?.decomposition?.steps?.length||0)>=2;
 const attribution=reasoning?.evidence_ledger?.user_assertions?.every(item=>item.authority==='user_assertion_not_verified')===true;
 const passed=results.every(item=>item.passed)&&multiStep&&attribution;
 return check('Linguistische Engine und synthetische Sprachtests','Intelligence & Linguistik',passed,
  'Sprachfälle bestanden: '+results.filter(item=>item.passed).length+'/'+results.length+
  '; Mehrfachaufgabe zerlegt: '+multiStep+'; Nutzerbehauptung korrekt als unbestätigt attribuiert: '+attribution+'.',
  passed?'info':'critical',{cases:results,reasoning:{task:reasoning?.task,decomposition:reasoning?.decomposition,
   evidence_ledger:reasoning?.evidence_ledger,explanation_policy:reasoning?.explanation_policy}},
  'Spracherkennung, Segmentierung, Negation, Mehrfachaufgaben und Quellenattribution anhand fehlgeschlagener Testfälle verbessern.');
}
function runCognitiveSafetyTests(){
 const testCase={id:'messinho-audit-no-tools',expected:{response_language:'de',must_not_execute_tools:true,must_include_context:['sandbox']},};
 const evaluation=evaluateMessinhoConversationCase(testCase,{response:'Die Sandbox bleibt unverändert.',responseLanguage:'de',toolExecutions:0,contextUsed:['sandbox']});
 const reasoning=buildMessinhoReasoningIntelligence({message:'Führe KEINE Tools aus. Erkläre nur, warum ein Import fehlschlägt.'});
 const noExecutionContract=reasoning?.policy&&reasoning?.explanation_policy&&reasoning?.decomposition?.required===true;
 const passed=evaluation.passed&&noExecutionContract;
 return check('Kognitiver Reasoning- und Sicherheits-Stresstest','Kognition & Sicherheit',passed,
  'Deterministischer Gesprächsvertrag: '+(evaluation.passed?'bestanden':'fehlgeschlagen')+
  '; Mehrschritt-Plan vorhanden: '+Boolean(reasoning?.decomposition?.required)+
  '; Toolausführung in diesem Audit: 0. Subjektive Gesprächsqualität benötigt zusätzlich menschliche oder unabhängige Modellbewertung.',
  passed?'info':'critical',{evaluation,reasoning_contract:{task:reasoning?.task,steps:reasoning?.decomposition?.steps,
   validation_checks:reasoning?.validation_checks,explanation_policy:reasoning?.explanation_policy}},
  'Negationen, mehrstufige Anweisungen, Nicht-Ausführungsgrenzen und nachvollziehbare Entscheidungsverträge gezielt regressionsprüfen.');
}
async function runSandboxAudit(root,env){
 const workflow=await readOptional(root,'.github/workflows/messinho-isolated-engineering.yml');
 const docker=await readOptional(root,'.github/sandbox/Dockerfile');
 const runner=await readOptional(root,'.github/sandbox/runner.sh');
 const checks={
  workflow_present:workflow.length>0,dockerfile_present:docker.length>0,runner_present:runner.length>0,
  no_network:/--network\s+none/.test(workflow),read_only_container:/--read-only/.test(workflow),
  memory_limit:/--memory\s+3g/.test(workflow),cpu_limit:/--cpus\s+2/.test(workflow),
  process_limit:/--pids-limit\s+128/.test(workflow),capabilities_dropped:/--cap-drop\s+ALL/.test(workflow),
  no_new_privileges:/no-new-privileges:true/.test(workflow),read_only_source_mount:/dst=\/src,readonly/.test(workflow),
  bounded_timeout:/timeout\s+15m/.test(workflow)&&/timeout\s+8m/.test(runner),
  unprivileged_user:/USER\s+10001:10001/.test(docker),
  no_lifecycle_scripts:/npm install[^\n]*--ignore-scripts/.test(workflow),
  baseline_before_candidate:/BASELINE: npm run build/.test(runner)&&/CANDIDATE: npm run build/.test(runner)
 };
 const safeEnv={MESSINHO_SANDBOX_ENABLED:'true',RENDER:'true',RENDER_SERVICE_ID:'staging-service',MESSINHO_STAGING_RENDER_SERVICE_ID:'staging-service'};
 const productionEnv={...safeEnv,RENDER_SERVICE_ID:'production-service'};
 checks.staging_gate_accepts_matching_service=isMessinhoSandboxStagingAllowed(safeEnv);
 checks.production_gate_rejects_mismatched_service=!isMessinhoSandboxStagingAllowed(productionEnv);
 const failed=Object.entries(checks).filter(([,value])=>!value).map(([key])=>key);
 const ok=failed.length===0;
 return check('Sandbox- und Ressourcen-Audit','Sandbox & Ressourcen',ok,
  'Geprüfte Isolationskontrollen: '+Object.keys(checks).length+'; erfüllt: '+(Object.keys(checks).length-failed.length)+
  '; fehlend: '+failed.length+'. Host-/Container-Liveverbrauch (CPU/RAM) wird nicht aus dem Webprozess abgeleitet.',
  ok?'info':'critical',{controls:checks,failed_controls:failed,
   resource_limits:{memory:'3 GiB',cpu:'2 vCPU',pids:128,job_timeout:'15 Minuten',baseline_timeout:'8 Minuten'},
   execution:{network_access:false,container_read_only:true,source_mount_read_only:true,application_code_executed:false,
    sandbox_job_dispatched:false,production_access:false}},
  'Isolationsworkflow, Runner und Docker-Limits reparieren. Ressourcenwerte nur innerhalb des Containers messen; keine Hostwerte als Sandboxwerte ausgeben.');
}
function runModelBindingAudit(env){
 const config=resolveMessinhoModelConfig(env);
 const keyPresent=Boolean(config.apiKey),localEndpoint=/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(?:\/|$)/iu.test(config.baseUrl);
 const ready=Boolean(config.model&&config.baseUrl&&(!config.requiresApiKey||keyPresent));
 return check('LLM-Anbindung und Modellkonfiguration','LLM & Modellbindung',ready,
  'Modell konfiguriert: '+Boolean(config.model)+'; Endpoint konfiguriert: '+Boolean(config.baseUrl)+
  '; API-Schlüssel vorhanden: '+keyPresent+'; lokaler Endpoint: '+localEndpoint+
  '; Live-Provider-Probe: nicht ausgeführt. Diese Prüfung bestätigt Konfiguration, nicht Provider-Erreichbarkeit, Tokenlimit oder tatsächliche Antwortlatenz.',
  ready?'info':'warning',{model:config.model,base_url:config.baseUrl,api_key_present:keyPresent,
   requires_api_key:config.requiresApiKey,live_provider_probe:'not_run',token_limit:'not_discovered'},
  'Modellendpunkt und Secret-Konfiguration prüfen. Für reale Latenz-, Token- und JSON-Ausgabe-Tests eine explizit gestartete, zeit- und tokenbegrenzte Provider-Probe verwenden.');
}
export async function runMessinhoFullStackIntelligenceAudit({root,env=process.env,history=[]}={}){
 const started=Date.now(),checkedAt=new Date().toISOString();
 const files=await Promise.all(SOURCE_DIRS.map(dir=>countFiles(root,dir)));
 const modules=[
  runCapabilityDiscovery(),
  runModelBindingAudit(env),
  runLinguisticSyntheticTests(),
  runCognitiveSafetyTests(),
  await runSandboxAudit(root,env)
 ];
 const previous=Array.isArray(history)?history.filter(item=>item&&item.status&&item.summary).slice(0,5):[];
 const previousRates=previous.map(item=>{
  const total=Number(item.summary?.total||item.summary?.checks||0),passed=Number(item.summary?.passed||0);
  return total>0?Number((passed/total).toFixed(4)):null;
 }).filter(value=>value!==null);
 const currentPassed=modules.filter(item=>item.ok).length;
 const evolution={baseline_available:previousRates.length>0,previous_runs:previousRates.length,
  previous_pass_rates:previousRates,current_pass_rate:Number((currentPassed/modules.length).toFixed(4)),
  trend:previousRates.length?currentPassed/modules.length>previousRates[0]?'improving':currentPassed/modules.length<previousRates[0]?'regressing':'stable':'initial_baseline',
  historical_comparison:'Nur vergleichbare, gespeicherte Auditmetriken sind aussagekräftig; ein einzelner Lauf beweist keine Lernkurve.'};
 modules.push(check('Evolution und Audit-Trend','Evolution',true,
  'Historische Vergleichsläufe: '+evolution.previous_runs+'; aktueller Teilmodul-Passanteil: '+Math.round(evolution.current_pass_rate*100)+' %; Trend: '+evolution.trend+'.',
  'info',evolution,'Mehrere versionierte Läufe mit gleicher Testbasis speichern und Erfolgsraten, Fehlerwiederholungen und Laufzeiten vergleichen.'));
 const failed=modules.filter(item=>!item.ok);
 const critical=failed.filter(item=>item.severity==='critical');
 const status=critical.length?'CRITICAL_FAILURE':failed.length?'DEGRADED':'PASS';
 return {audit_type:'full_stack_intelligence_sandbox_audit',version:'1.0.0',status,
  started_at:checkedAt,finished_at:new Date().toISOString(),duration_ms:Date.now()-started,
  scope:{source_directories:SOURCE_DIRS,source_file_counts:files.reduce((sum,n)=>sum+n,0),
   external_provider_calls:0,tool_executions:0,sandbox_jobs_dispatched:0,database_mutations:0,
   memory_mutations:0,model_weight_changes:0,production_access:false},
  modules,summary:{total:modules.length,passed:modules.length-failed.length,failed:failed.length,
   critical_failed:critical.length,warnings:failed.length-critical.length},
  limitations:['Provider-Live-Latenz, Tokenlimits und Antwortformat werden nur mit einer separat autorisierten Live-Probe verifiziert.',
   'CPU/RAM-Werte des tatsächlichen Sandbox-Containers müssen innerhalb des Containers oder aus dessen Jobmetriken erhoben werden.',
   'Subjektive Natürlichkeit, Ironie und semantische Qualität erfordern menschliche oder unabhängige Modellbewertung.',
   'Der Audit führt keine Toolfunktionen, Netzwerkaktionen, Sandbox-Jobs, Lernwrites oder automatischen Codekorrekturen aus.']};
}
