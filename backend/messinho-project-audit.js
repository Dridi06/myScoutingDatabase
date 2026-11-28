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
       evidence:{source_line:content.split(/\\r?\\n/)[reference.line-1]?.trim()||'',import_kind:reference.kind},
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
 add(checks,'Backend-Testzuordnung','Testabdeckung',missingTests.length===0,
  'Backend-Module: '+backendJs.length+'; Testdateien: '+testFiles.length+'; Module ohne direkten Testimport: '+missingTests.length+
  (missingTests.length?'; '+missingTests.slice(0,30).join(', '):''),
  'info','Die Zuordnung ist nicht abschließend: fehlender direkter Import beweist keine fehlende Testabdeckung. Coverage- und Integrationsnachweise ausführen.');
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
 return {ok:checks.every(item=>item.ok),checks,findings,summary:totals,scope:'backend, frontend, tests, SQL migrations, relative imports, build scripts and API route surface',
  audit_metadata:{mode:'static_read_only',source_file_count:sourceFiles.length,inventory_roots:ROOTS,checked_at:new Date().toISOString(),
   finding_count:findings.length,confirmed_runtime_failures:0,unverified_static_findings:findings.length},
  limitations:['Read-only static inspection; no project code or shell command is executed.','No live database mutation, external request, compiler run or test suite is started by this audit.','A static unresolved-import candidate is not a confirmed runtime failure until the build/runtime resolver independently reproduces it.','No direct test import is not proof of missing behavioral coverage; coverage and integration results are required.','Static route-guard hints do not prove authorization; authenticated integration tests remain necessary.']};
}
