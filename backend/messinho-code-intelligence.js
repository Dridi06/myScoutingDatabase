/**
 * Language-aware software engineering planner.
 * It identifies source technologies and proposes deterministic validation steps.
 * It does not execute untrusted code, write files, access networks or deploy.
 */
import { MESSINHO_PROGRAMMING_LANGUAGES } from './messinho-programming-languages.js';

export const MESSINHO_CODE_INTELLIGENCE_VERSION='1.0.0';

const EXTENSIONS=Object.freeze({
 '.js':'javascript-typescript','.mjs':'javascript-typescript','.cjs':'javascript-typescript',
 '.jsx':'javascript-typescript','.ts':'javascript-typescript','.tsx':'javascript-typescript',
 '.py':'python','.sql':'sql','.html':'html-css','.htm':'html-css','.css':'html-css',
 '.java':'java','.cs':'csharp-dotnet','.go':'go','.rs':'rust',
 '.c':'cpp-c','.h':'cpp-c','.cc':'cpp-c','.cpp':'cpp-c','.cxx':'cpp-c','.hpp':'cpp-c',
 '.php':'php','.sh':'bash-shell','.bash':'bash-shell'
});
const TOOLCHAINS=Object.freeze({
 'javascript-typescript':{tools:['node','npm'],checks:[['node','--check','<file>'],['npm','test'],['npm','run','build']]},
 python:{tools:['python3','pytest'],checks:[['python3','-m','compileall','<directory>'],['python3','-m','pytest']]},
 sql:{tools:['psql','PostgreSQL'],checks:[['SQL parser/linter','<file>'],['Migration review','<file>'],['RLS and transaction review','<file>']]},
 'html-css':{tools:['HTML validator','Stylelint','Lighthouse','axe'],checks:[['HTML validation','<file>'],['CSS lint','<file>'],['Accessibility audit','targeted page']]},
 java:{tools:['JDK','Maven or Gradle'],checks:[['mvn','test'],['mvn','verify']]},
 'csharp-dotnet':{tools:['.NET SDK'],checks:[['dotnet','build'],['dotnet','test']]},
 go:{tools:['Go toolchain'],checks:[['gofmt','-w','<files>'],['go','vet','./...'],['go','test','./...'],['go','test','-race','./...']]},
 rust:{tools:['Rust toolchain','Cargo'],checks:[['cargo','fmt','--check'],['cargo','clippy','--','-D','warnings'],['cargo','test']]},
 'cpp-c':{tools:['Clang or GCC','CMake','Sanitizers'],checks:[['cmake','--build','<build-dir>'],['ctest','--test-dir','<build-dir>'],['AddressSanitizer/UBSan','targeted tests']]},
 php:{tools:['PHP','Composer','PHPUnit'],checks:[['php','-l','<file>'],['vendor/bin/phpunit']]},
 'bash-shell':{tools:['Bash','ShellCheck'],checks:[['bash','-n','<file>'],['shellcheck','<file>']]}
});
const PROFILE_BY_ID=new Map(MESSINHO_PROGRAMMING_LANGUAGES.map(profile=>[profile.id,profile]));
const IGNORED=/^(?:node_modules|vendor|dist|build|coverage|\.git|\.next|\.venv|venv)\//;
const SENSITIVE=/(?:^|\/)(?:\.env(?:\..*)?|secrets?|credentials?)(?:\/|$)|\.(?:pem|key|p12|pfx)$/i;
const LOCK_OR_GENERATED=/(?:^|\/)(?:package-lock\.json|pnpm-lock\.yaml|yarn\.lock|composer\.lock|Cargo\.lock|poetry\.lock|uv\.lock)$/i;
function extension(path=''){
 const name=String(path).split('/').pop()||'';
 const dot=name.lastIndexOf('.');
 return dot>0?name.slice(dot).toLowerCase():'';
}
function cleanPath(path){return typeof path==='string'&&!path.startsWith('/')&&!path.includes('\\')&&!path.split('/').includes('..')&&path.length<=300;}

export function detectMessinhoSourceLanguage(path=''){
 if(!cleanPath(path)||SENSITIVE.test(path)||IGNORED.test(path)||LOCK_OR_GENERATED.test(path))return {supported:false,reason:'excluded_or_unsafe_path'};
 const id=EXTENSIONS[extension(path)];
 if(!id)return {supported:false,reason:'unsupported_or_non_source_file'};
 const profile=PROFILE_BY_ID.get(id);
 return {supported:true,language_id:id,language:profile.name,extension:extension(path),priority:profile.priority};
}

export function buildMessinhoCodebaseIntelligence({files=[],availableTools=[]}={}){
 const groups=new Map(),excluded=[],unsupported=[];
 for(const file of files.slice(0,500)){
  const path=String(file?.path||'');
  const detected=detectMessinhoSourceLanguage(path);
  if(!detected.supported){
   (detected.reason==='excluded_or_unsafe_path'?excluded:unsupported).push(path||'[missing path]');
   continue;
  }
  if(!groups.has(detected.language_id))groups.set(detected.language_id,{language_id:detected.language_id,language:detected.language,files:[],priority:detected.priority});
  groups.get(detected.language_id).files.push(path);
 }
 const languages=[...groups.values()].sort((a,b)=>a.priority-b.priority).map(group=>{
  const toolchain=TOOLCHAINS[group.language_id];
  return {...group,toolchain:toolchain.tools,validation_plan:toolchain.checks,
   available_tools:toolchain.tools.filter(tool=>availableTools.includes(tool)),
   missing_tools:toolchain.tools.filter(tool=>!availableTools.includes(tool))};
 });
 return {
  version:MESSINHO_CODE_INTELLIGENCE_VERSION,
  analyzed_file_count:files.length,
  supported_file_count:languages.reduce((n,item)=>n+item.files.length,0),
  language_count:languages.length,languages,excluded_paths:excluded.slice(0,100),unsupported_paths:unsupported.slice(0,100),
  policy:'Plan-only. Tool names and commands are suggestions, not proof that tools exist or ran.',
  next_steps:['read_source_and_callers','identify_reproducible_root_cause','establish_baseline','design_minimal_fix','create_positive_negative_boundary_and_regression_tests','run_only_in_an_isolated_ephemeral_sandbox','review_security_performance_and_compatibility','compare_results_to_baseline','prepare_admin_review_ticket'],
  execution_safety:{execute_untrusted_code:false,run_commands_in_application_process:false,write_repository_files:false,access_secrets:false,access_production:false,require_isolated_sandbox:true,admin_approval_required:true}
 };
}

export function buildMessinhoAutonomousEngineeringProtocol(){
 return {
  version:MESSINHO_CODE_INTELLIGENCE_VERSION,
  modes:['understand','diagnose','design','validate','compare','learn','propose'],
  loop:[
   {step:1,name:'Understand',requires:['task_and_acceptance_criteria','repository_revision','language_and_runtime','callers_and_dependencies']},
   {step:2,name:'Diagnose',requires:['reproduction_or_static_evidence','root_cause','impact_and_scope']},
   {step:3,name:'Design',requires:['minimal_fix','alternative','compatibility_assessment','rollback_plan']},
   {step:4,name:'Validate',requires:['baseline_tests','targeted_tests','negative_tests','boundary_tests','security_checks']},
   {step:5,name:'Compare',requires:['before_after_results','performance_measurement_if_relevant','regression_count','security_findings']},
   {step:6,name:'Learn',requires:['verified_finding','source_revision','test_evidence','review_status']},
   {step:7,name:'Propose',requires:['diff','plain_language_summary','test_results_or_not_run','admin_approval']}
  ],
  hard_limits:[
   'Never claim a test passed unless its exact command ran successfully against the exact candidate revision.',
   'Never execute model-generated code in the application process.',
   'Never treat static inspection as compilation or runtime verification.',
   'Never change protected auth, roles, RLS, migrations, production or deployment controls autonomously.',
   'Never convert an unreviewed hypothesis into durable verified knowledge.',
   'A failed or inconclusive validation blocks the proposal from being labelled verified.'
  ],
  improvement_rule:'A change is an improvement only when correctness is preserved, security findings do not increase, regression tests pass and a relevant measurable metric improves or a verified defect is removed.'
 };
}
