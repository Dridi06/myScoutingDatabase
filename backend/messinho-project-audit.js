import { build as esbuildBuild } from 'esbuild';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ROOTS=['backend','src','tests','supabase/migrations'];
const SOURCE_EXTENSIONS=new Set(['.js','.mjs','.cjs','.jsx','.ts','.tsx','.css','.sql']);
const JS_EXTENSIONS=['.js','.mjs','.cjs','.jsx','.ts','.tsx','.css','.json'];
const IGNORED_DIRS=new Set(['node_modules','.git','dist','build','coverage','.next']);
const safe=(value,max=1200)=>String(value??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);

async function walk(root,relative=''){
 const directory=path.join(root,relative);
 let entries=[];
 try{entries=await readdir(directory,{withFileTypes:true});}catch{return [];}
 const found=[];
 for(const entry of entries){
  if(entry.isDirectory()){
   if(!IGNORED_DIRS.has(entry.name))found.push(...await walk(root,path.join(relative,entry.name)));
  }else if(entry.isFile())found.push(path.join(relative,entry.name));
 }
 return found;
}
function resolveRelativeImport(fromFile,specifier,known){
 const cleanSpecifier=String(specifier||'').split(/[?#]/,1)[0];
 const base=path.posix.normalize(path.posix.join(path.posix.dirname(fromFile),cleanSpecifier));
 const candidates=path.posix.extname(base)?[base]:[base,...JS_EXTENSIONS.map(ext=>base+ext),...JS_EXTENSIONS.map(ext=>path.posix.join(base,'index'+ext))];
 return candidates.find(candidate=>known.has(candidate))||null;
}

// Tokenize JavaScript module syntax only. Strings, comments, templates and regex
// literals are opaque, so import examples embedded in tests are not dependencies.
function moduleTokens(source){
 const tokens=[];let i=0,line=1;const text=String(source||'');
 const push=(type,value,startLine,offset)=>tokens.push({type,value,line:startLine,column:offset-text.lastIndexOf('\n',offset-1),offset});
 const isStartRegex=()=>{const p=tokens[tokens.length-1];return !p||(p.type==='punct'&&['(','[','{',',',':','=','!','?',';','=>'].includes(p.value))||(p.type==='identifier'&&['return','throw','case','delete','void','typeof','instanceof','in','of','yield','await'].includes(p.value));};
 while(i<text.length){
  const ch=text[i],next=text[i+1];
  if(/\s/.test(ch)){if(ch==='\n')line++;i++;continue;}
  if(ch==='/'&&next==='/'){i+=2;while(i<text.length&&text[i]!=='\n')i++;continue;}
  if(ch==='/'&&next==='*'){i+=2;while(i<text.length&&!(text[i]==='*'&&text[i+1]==='/')){if(text[i]==='\n')line++;i++;}i=Math.min(text.length,i+2);continue;}
  if(ch==='/'&&isStartRegex()){
   i++;let inClass=false,escaped=false;
   while(i<text.length){const value=text[i++];if(value==='\n')line++;if(escaped){escaped=false;continue;}if(value==='\\'){escaped=true;continue;}if(value==='[')inClass=true;else if(value===']')inClass=false;else if(value==='/'&&!inClass)break;}
   while(i<text.length&&/[a-z]/i.test(text[i]))i++;
   continue;
  }
  if(ch==='"'||ch==="'"||ch==='`'){
   const quote=ch,startLine=line,start=i;i++;let value='';
   while(i<text.length){const current=text[i++];if(current==='\n')line++;if(current===quote)break;if(current==='\\'&&i<text.length){const escaped=text[i++];if(escaped==='\n')line++;value+=escaped;}else value+=current;}
   if(quote!=='`')push('string',value,startLine,start);
   continue;
  }
  if(/[A-Za-z_$]/.test(ch)){
   const start=i,startLine=line;i++;while(i<text.length&&/[A-Za-z0-9_$]/.test(text[i]))i++;
   push('identifier',text.slice(start,i),startLine,start);continue;
  }
  push('punct',ch,line);i++;
 }
 return tokens;
}
export function extractModuleReferences(source){
 const tokens=moduleTokens(source),found=[],seen=new Set();
 const add=(token,kind)=>{
  if(!token||token.type!=='string')return;
  const key=kind+':'+token.value+':'+token.line+':'+token.column;
  if(seen.has(key))return;
  seen.add(key);found.push({specifier:token.value,line:token.line,column:token.column,kind});
 };
 for(let i=0;i<tokens.length;i++){
  const token=tokens[i];
  if(token.type!=='identifier'||(token.value!=='import'&&token.value!=='export'))continue;
  const next=tokens[i+1];
  if(token.value==='import'&&next?.type==='punct'&&next.value==='.')continue;
  if(token.value==='import'&&next?.type==='string'){add(next,'static');continue;}
  if(token.value==='import'&&next?.type==='punct'&&next.value==='('&&tokens[i+2]?.type==='string'&&tokens[i+3]?.value===')'){add(tokens[i+2],'dynamic_literal');continue;}
  for(let j=i+1;j<Math.min(tokens.length,i+160);j++){
   if(tokens[j].type==='punct'&&tokens[j].value===';')break;
   if(tokens[j].type==='identifier'&&tokens[j].value==='from'&&tokens[j+1]?.type==='string'){add(tokens[j+1],token.value==='export'?'re_export':'static');break;}
  }
 }
 return found;
}
export function extractModuleSpecifiers(source){
 return [...new Set(extractModuleReferences(source).map(item=>item.specifier))];
}

function normalizeModulePath(value){return String(value||'').replace(/\\/g,'/').replace(/^\.\//,'');}
function stronglyConnectedComponents(nodes,edges){
 let index=0;const stack=[],onStack=new Set(),indices=new Map(),low=new Map(),components=[];
 function visit(node){
  indices.set(node,index);low.set(node,index);index++;stack.push(node);onStack.add(node);
  for(const next of edges.get(node)||[]){if(!nodes.has(next))continue;
   if(!indices.has(next)){visit(next);low.set(node,Math.min(low.get(node),low.get(next)));}
   else if(onStack.has(next))low.set(node,Math.min(low.get(node),indices.get(next)));
  }
  if(low.get(node)===indices.get(node)){const component=[];let current;
   do{current=stack.pop();onStack.delete(current);component.push(current);}while(current!==node);
   if(component.length>1||(edges.get(node)||new Set()).has(node))components.push(component.sort());
  }
 }
 for(const node of nodes)if(!indices.has(node))visit(node);
 return components;
}
export async function buildMessinhoDependencyGraph({root=PROJECT_ROOT,files=[]}={}){
 const modules=files.filter(file=>/\.(?:js|mjs|cjs|jsx|ts|tsx)$/.test(file)).map(normalizeModulePath);
 const checkedAt=new Date().toISOString();
 if(!modules.length)return {ok:false,checked_at:checkedAt,parser:'esbuild',nodes:[],edges:[],cycles:[],external_dependencies:[],findings:[],
  coverage:{modules:0,parsed:0,excluded:files.length},metrics:{nodes:0,edges:0,cycles:0,external_dependencies:0,findings:0}};
 let metafile=null,buildErrors=[];
 try{
  const result=await esbuildBuild({absWorkingDir:root,entryPoints:modules,bundle:true,write:false,metafile:true,
   outdir:path.join(root,'.messinho-diagnostic-output'),entryNames:'[dir]/[name]-[hash]',packages:'external',
   logLevel:'silent',color:false,legalComments:'none',sourcemap:false,treeShaking:false});
  metafile=result.metafile;
 }catch(error){
  buildErrors=Array.isArray(error?.errors)?error.errors:[{text:safe(error?.message||error,1800),location:null,notes:[]}];
  metafile=error?.metafile||null;
  // Preserve the graph even when one edge is broken: parse all entry points again
  // with imports externalized, then resolve local edges against the repository inventory.
  if(!metafile){
   try{
    const parsed=await esbuildBuild({absWorkingDir:root,entryPoints:modules,bundle:true,write:false,metafile:true,
     outdir:path.join(root,'.messinho-diagnostic-parse'),entryNames:'[dir]/[name]-[hash]',packages:'external',
     logLevel:'silent',color:false,legalComments:'none',sourcemap:false,treeShaking:false,
     plugins:[{name:'messinho-audit-externalize-imports',setup(build){
      build.onResolve({filter:/.*/},args=>({path:args.path,external:true}));
     }}]});
    metafile=parsed.metafile;
   }catch(parseError){
    const parseErrors=Array.isArray(parseError?.errors)?parseError.errors:[];
    for(const item of parseErrors)if(!buildErrors.some(existing=>existing.text===item.text&&existing.location?.file===item.location?.file))buildErrors.push(item);
   }
  }
 }
 const inputNames=Object.keys(metafile?.inputs||{}).map(normalizeModulePath);
 const nodes=new Set(inputNames.length?inputNames:modules),edges=new Map([...nodes].map(node=>[node,new Set()]));
 const externalDependencies=new Set(),findings=[],edgeList=[];
 const referencesByFile=new Map();
 for(const file of modules){try{referencesByFile.set(file,extractModuleReferences(await readFile(path.join(root,file),'utf8')));}catch{referencesByFile.set(file,[]);}}
 for(const [input,meta] of Object.entries(metafile?.inputs||{})){
  const from=normalizeModulePath(input);
  for(const item of meta.imports||[]){
   const target=normalizeModulePath(item.path);
   const ref=(referencesByFile.get(from)||[]).find(candidate=>candidate.specifier===item.original?.path||candidate.specifier===item.path);
   const resolved=item.external&&String(item.path).startsWith('.')?resolveRelativeImport(from,item.path,nodes):target;
   if(item.external&&!String(item.path).startsWith('.')){externalDependencies.add(item.path);continue;}
   if(resolved&&nodes.has(resolved)){edges.get(from)?.add(resolved);
    edgeList.push({from,to:resolved,kind:item.kind||'import',line:ref?.line||null,column:ref?.column||null});
   }
  }
 }
 for(const error of buildErrors){
  const locFile=error?.location?.file?normalizeModulePath(path.relative(root,path.isAbsolute(error.location.file)?error.location.file:path.resolve(root,error.location.file))):null;
  const line=error?.location?.line||null,column=error?.location?.column==null?null:error.location.column+1;
  const message=safe(error.text||error.message||'Parser-/Modulauflösungsfehler',1800);
  const missingExport=/No matching export|does not provide an export/i.test(message);
  const unresolved=/Could not resolve|Cannot find module|not found/i.test(message);
  const category=missingExport?'missing_export':unresolved?'unresolved_import':'parser_or_module_error';
  findings.push({finding_id:'GRAPH-'+String(findings.length+1).padStart(4,'0'),status:'unverified',
   severity:missingExport||unresolved?'high':'critical',category,
   component:locFile?.startsWith('backend/')?'Backend':locFile?.startsWith('src/')?'Frontend':'Project',
   title:missingExport?'Importiertes Export-Symbol fehlt':unresolved?'Modulziel kann nicht aufgelöst werden':'Parser- oder Modulfehler',
   file:locFile,line,column,symbol:null,dependency:null,error_message:message,
   root_cause:'Der Parser-/Modulresolver hat beim isolierten Projektgraph-Aufbau einen Fehler gemeldet.',
   evidence:{tool:'esbuild',parser:'esbuild',message,notes:(error.notes||[]).map(note=>safe(note.text,500)).slice(0,5)},
   reproduction:{check:'esbuild_dependency_graph',source_file:locFile,command:'esbuild build (write:false, packages:external)'},
   recommendation:'Importpfad, Exportdefinition, Dateiendung, TypeScript-Konfiguration und betroffene Modulgrenze anhand der Parsermeldung prüfen.',
   checked_at:checkedAt});
 }
 const cycles=stronglyConnectedComponents(nodes,edges);
 for(const component of cycles)findings.push({finding_id:'CYCLE-'+String(findings.length+1).padStart(4,'0'),
  status:'unverified',severity:'medium',category:'circular_dependency',component:'Module',
  title:'Zyklische Modulabhängigkeit',file:component[0],line:null,column:null,dependency:component.join(' → '),
  root_cause:'Die Module bilden einen gerichteten Abhängigkeitszyklus.',evidence:{nodes:component},
  reproduction:{check:'strongly_connected_components',modules:component},
  recommendation:'Zyklus auflösen oder bewusst dokumentieren; gemeinsame Verträge gegebenenfalls in ein unabhängiges Modul verschieben.',
  checked_at:checkedAt});
 const external=[...externalDependencies].sort(),graphEdges=edgeList.sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
 const incoming=new Map([...nodes].map(node=>[node,0]));
 for(const targets of edges.values())for(const target of targets)incoming.set(target,(incoming.get(target)||0)+1);
 return {ok:findings.length===0,checked_at:checkedAt,parser:'esbuild',nodes:[...nodes].sort(),edges:graphEdges,cycles,
  external_dependencies:external,findings,coverage:{modules:modules.length,parsed:metafile?nodes.size:Math.max(0,modules.length-buildErrors.filter(error=>error.location?.file).length),
   excluded:files.length-modules.length,external_dependencies:external.length,internal_edges:graphEdges.length},
  metrics:{nodes:nodes.size,edges:graphEdges.length,cycles:cycles.length,external_dependencies:external.length,
   findings:findings.length,isolated_modules:[...nodes].filter(node=>(edges.get(node)?.size||0)===0&&(incoming.get(node)||0)===0).length},
  limitations:['Esbuild prüft unterstützte JS-/TS-Modulsyntax und relative Modulauflösung, führt keine Anwendungslogik aus.',
   'Paketimporte werden als externe Abhängigkeiten erfasst; Version und Laufzeitverfügbarkeit werden hier nicht bewiesen.',
   'Dynamische, zur Laufzeit zusammengesetzte Importpfade können statisch nicht vollständig aufgelöst werden.',
   'Zyklische Importe sind Hinweise, nicht automatisch Laufzeitfehler.','CSS-/SQL-Semantik wird in diesem Graphlauf nicht parsergestützt validiert.']};
}
function add(checks,name,category,ok,detail,severity='warning',recommendation=''){
 checks.push({name,category,ok:Boolean(ok),detail:safe(detail),severity,
  severity_label:severity==='critical'?'Kritisch':severity==='warning'?'Mittel':'Niedrig',
  recommendation:ok?'Keine Maßnahme erforderlich.':safe(recommendation||'Ursache untersuchen und gezielt beheben.'),
  root_cause:ok?null:safe(detail),impact:ok?null:'Der betroffene Projektbereich kann unvollständig oder fehlerhaft sein.',
  next_action:ok?null:safe(recommendation||'Ursache untersuchen und gezielt beheben.'),repair_class:ok?'none':'admin_approval',
  checkedAt:new Date().toISOString()});
}

/**
 * Read-only inventory and static consistency audit of the deployed project.
 * It never executes project code, tests, migrations, shell commands or generated patches.
 */
export async function runMessinhoProjectAudit({root=PROJECT_ROOT}={}){
 const checks=[],inventory={},allFiles=[];
 for(const folder of ROOTS){
  const absolute=path.resolve(root,folder);
  const inside=absolute===root||absolute.startsWith(root+path.sep);
  let exists=false;
  try{exists=inside&&(await stat(absolute)).isDirectory();}catch{}
  if(!exists){add(checks,'Projektbereich '+folder,'Projektinventar',false,'Der erwartete Projektbereich '+folder+' ist nicht vorhanden oder nicht lesbar.','warning','Projektstruktur und Deployment-Artefakt prüfen.');inventory[folder]=[];continue;}
  const files=await walk(absolute);
  inventory[folder]=files;
  allFiles.push(...files.map(file=>folder+'/'+file));
  add(checks,'Projektinventar '+folder,'Projektinventar',files.length>0,folder+': '+files.length+' Dateien gefunden.','warning','Fehlende Projektdateien oder falsches Deployment-Artefakt prüfen.');
 }
 const sourceFiles=allFiles.filter(file=>SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()));
 const known=new Set(allFiles.map(file=>file.replace(/\\/g,'/')));
 const unreadable=[],empty=[],oversized=[],unresolved=[],findings=[];
 const sourceContents=new Map();
 for(const relative of sourceFiles){
  try{
   const content=await readFile(path.join(root,relative),'utf8');
   sourceContents.set(relative,content);
   if(!content.trim())empty.push(relative);
   if(Buffer.byteLength(content,'utf8')>1024*1024)oversized.push(relative);
   if(/\.(?:js|mjs|cjs|jsx|ts|tsx)$/i.test(relative)){
    for(const reference of extractModuleReferences(content)){
     const specifier=reference.specifier;
     if(specifier.startsWith('.')&&!resolveRelativeImport(relative,specifier,known)){
      const item={file:relative,line:reference.line,column:reference.column,symbol:null,dependency:specifier,kind:reference.kind};
      unresolved.push(item);
      findings.push({finding_id:'IMPORT-'+String(findings.length+1).padStart(4,'0'),status:'unverified',severity:'critical',
       category:'dependency_resolution',component:relative.startsWith('backend/')?'Backend':relative.startsWith('src/')?'Frontend':'Tests',
       title:'Relativer Import nicht auflösbar',file:relative,line:reference.line,column:reference.column,
       dependency:specifier,root_cause:'Das Importziel konnte anhand des vorhandenen Projektinventars nicht aufgelöst werden.',
       evidence:{source_line:content.split(/\r?\n/)[reference.line-1]?.trim()||'',import_kind:reference.kind},
       reproduction:{check:'static_import_resolution',source_file:relative,specifier},
       recommendation:'Dateipfad, Groß-/Kleinschreibung, Export-/Dateiendung und Build-Alias-Konfiguration prüfen.',
       checked_at:new Date().toISOString()});
     }
    }
   }
  }catch{unreadable.push(relative);}
 }
 add(checks,'Quellcodedateien lesbar','Quellcode-Integrität',unreadable.length===0,
  'Unlesbare Dateien: '+unreadable.length+(unreadable.length?'; '+unreadable.slice(0,12).join(', '):'')+'.');
 add(checks,'Leere oder auffällig große Quelldateien','Quellcode-Integrität',empty.length===0&&oversized.length===0,
  'Leere Dateien: '+empty.length+'; Dateien über 1 MiB: '+oversized.length+
  (empty.length?'; leer: '+empty.slice(0,8).join(', '):'')+
  (oversized.length?'; groß: '+oversized.slice(0,8).join(', '):''),
  'warning','Betroffene Dateien auf versehentliche Leere, generierte Inhalte oder ungewollte Artefakte prüfen.');
 add(checks,'Relative Modulimporte','Abhängigkeiten',unresolved.length===0,
  'Geprüfte Quelldateien: '+sourceFiles.length+'; nicht auflösbare relative Importe: '+unresolved.length+
  (unresolved.length?'; '+unresolved.slice(0,30).map(item=>item.file+':'+item.line+':'+item.column+' → '+item.dependency).join(' | '):''),
  'critical','Importpfade, Dateinamen und Build-Auflösung im betroffenen Modul korrigieren.');
 checks[checks.length-1].findings=findings.filter(item=>item.category==='dependency_resolution');
 const dependencyGraph=await buildMessinhoDependencyGraph({root,files:sourceFiles});
 add(checks,'Parsergestützter Modul- und Abhängigkeitsgraph','Abhängigkeiten',dependencyGraph.ok,
  'Parser: esbuild; Module: '+dependencyGraph.coverage.modules+'; interne Kanten: '+dependencyGraph.metrics.edges+
  '; externe Pakete: '+dependencyGraph.metrics.external_dependencies+'; Zyklen: '+dependencyGraph.metrics.cycles+
  '; Parser-/Auflösungsbefunde: '+dependencyGraph.findings.length+
  (dependencyGraph.findings.length?'; '+dependencyGraph.findings.slice(0,12).map(item=>(item.file||'Projekt')+(item.line?':'+item.line:'')+' '+(item.error_message||item.title)).join(' | '):''),
  dependencyGraph.findings.some(item=>item.severity==='critical'||item.severity==='high')?'critical':'warning',
  'Parsermeldungen und Import-/Exportbeziehungen in den betroffenen Modulen prüfen; Zyklen gezielt entflechten.');
 checks[checks.length-1].findings=dependencyGraph.findings;
 checks[checks.length-1].dependency_graph={parser:dependencyGraph.parser,checked_at:dependencyGraph.checked_at,
  coverage:dependencyGraph.coverage,metrics:dependencyGraph.metrics,nodes:dependencyGraph.nodes,edges:dependencyGraph.edges,
  cycles:dependencyGraph.cycles,external_dependencies:dependencyGraph.external_dependencies,limitations:dependencyGraph.limitations};
 const backendJs=allFiles.filter(file=>file.startsWith('backend/')&&/\.(?:js|mjs|cjs)$/.test(file));
 const tests=inventory.tests||[];
 const testFiles=tests.filter(file=>/\.test\.(?:js|mjs|cjs|jsx|ts|tsx)$/.test(file));
 const directlyTested=new Set();
 for(const testFile of testFiles){
  const relative='tests/'+testFile;
  let content='';
  try{content=await readFile(path.join(root,relative),'utf8');}catch{}
  for(const specifier of extractModuleSpecifiers(content)){
   if(!specifier.startsWith('.'))continue;
   const target=resolveRelativeImport(relative,specifier,known);
   if(target?.startsWith('backend/'))directlyTested.add(target);
  }
 }
 const missingTests=backendJs.filter(file=>!file.endsWith('/server.js')&&!directlyTested.has(file));
 add(checks,'Backend-Testzuordnung','Testabdeckung',true,
  'Backend-Module: '+backendJs.length+'; Testdateien: '+testFiles.length+'; Module ohne direkten Testimport: '+missingTests.length+
  (missingTests.length?'; '+missingTests.slice(0,30).join(', '):''),
  'info','Die Zuordnung ist nicht abschließend: fehlender direkter Import beweist keine fehlende Testabdeckung. Coverage- und Integrationsnachweise ausführen.');
 checks[checks.length-1].recommendation='Die Zuordnung ist nicht abschließend: fehlender direkter Import beweist keine fehlende Testabdeckung. Coverage- und Integrationsnachweise ausführen.';
 checks[checks.length-1].next_action=checks[checks.length-1].recommendation;
 const packageFile=path.join(root,'package.json');
 let packageData=null;
 try{packageData=JSON.parse(await readFile(packageFile,'utf8'));}catch{}
 const scripts=packageData?.scripts||{};
 const buildScript=String(scripts.build||''),testScript=String(scripts.test||'');
 const runsTestsBeforeBuild=/(?:^|&&)\s*(?:npm|pnpm|yarn)\s+(?:run\s+)?test(?:\s|$)/.test(buildScript);
 const invokesViteBuild=/\bvite\s+build\b/.test(buildScript)||/\bnode\s+\S*\/vite(?:\/bin)?\/vite\.js\s+build\b/.test(buildScript);
 const buildOk=Boolean(packageData&&testScript&&runsTestsBeforeBuild&&invokesViteBuild);
 add(checks,'Produktions-Build und Testskripte','Build-Pipeline',buildOk,
  'npm test: '+(testScript||'fehlt')+'; build: '+(buildScript||'fehlt')+'.',
  'critical','Build-Pipeline so konfigurieren, dass Tests vor dem Produktionsbuild ausgeführt werden.');
 const migrationFiles=(inventory['supabase/migrations']||[]).filter(file=>file.endsWith('.sql'));
 add(checks,'Datenbank-Migrationsbestand','Datenbank und Migrationen',migrationFiles.length>0,
  'SQL-Migrationen im Projektbestand: '+migrationFiles.length+'. Änderungen an Migrationen werden hier nicht ausgeführt oder angewendet.',
  'warning','Migrationshistorie und Staging-Schema getrennt abgleichen.');
 const server=sourceContents.get('backend/server.js')||'';
 const routes=[...server.matchAll(/app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g)].map(match=>({method:match[1].toUpperCase(),route:match[2]}));
 const adminRoutes=routes.filter(item=>item.route.startsWith('/api/admin'));
 const adminGuardMentions=(server.match(/requireApprovedMessinhoAdmin|requireSupabaseAdmin/g)||[]).length;
 add(checks,'API-Routeninventar','API und Zugriffsschutz',routes.length>0,
  'Erkannte API-Routen: '+routes.length+'; Admin-Routen: '+adminRoutes.length+'; Verweise auf Admin-Guards im Server: '+adminGuardMentions+'.',
  'warning','Routen einzeln auf Authentifizierung, Rollenprüfung und Organisations-/Eigentümer-Scope prüfen.');
 const routeWithoutNearbyGuard=adminRoutes.filter(item=>{
  const at=server.indexOf(item.route);
  const snippet=server.slice(Math.max(0,at-180),Math.min(server.length,at+500));
  return !/requireApprovedMessinhoAdmin|requireSupabaseAdmin/.test(snippet);
 });
 add(checks,'Admin-Routen mit erkennbarem Schutz','API und Zugriffsschutz',routeWithoutNearbyGuard.length===0,
  'Admin-Routen ohne unmittelbar erkennbaren Guard im lokalen Routenumfeld: '+routeWithoutNearbyGuard.length+
  (routeWithoutNearbyGuard.length?'; '+routeWithoutNearbyGuard.slice(0,12).map(item=>item.method+' '+item.route).join(' | '):'')+
  '. Dies ist eine statische Hinweisprüfung, kein Ersatz für authentifizierte Berechtigungstests.',
  'warning','Jeden auffälligen Admin-Endpunkt und seine Middleware-Kette manuell bzw. per Integrationstest verifizieren.');
 const totals={
  backend_files:inventory.backend?.length||0,frontend_files:inventory.src?.length||0,
  test_files:tests.length,migration_files:migrationFiles.length,source_files:sourceFiles.length,
  api_routes:routes.length,admin_routes:adminRoutes.length,checks:checks.length,
  failed:checks.filter(item=>!item.ok).length
 };
 return {ok:checks.every(item=>item.ok),checks,findings:[...findings,...dependencyGraph.findings],dependency_graph:dependencyGraph,summary:totals,scope:'backend, frontend, tests, SQL migrations, relative imports, build scripts and API route surface',
  audit_metadata:{mode:'parser_backed_static',parser:'esbuild',source_file_count:sourceFiles.length,inventory_roots:ROOTS,checked_at:new Date().toISOString(),
   finding_count:findings.length,confirmed_runtime_failures:0,unverified_static_findings:findings.length},
  limitations:['Read-only parser-backed inspection; no application code or shell command is executed.','The esbuild parser and resolver run in-memory with write:false; no live database mutation, external request or application runtime is started.','A static unresolved-import candidate is not a confirmed runtime failure until the build/runtime resolver independently reproduces it.','No direct test import is not proof of missing behavioral coverage; coverage and integration results are required.','Static route-guard hints do not prove authorization; authenticated integration tests remain necessary.']};
}
