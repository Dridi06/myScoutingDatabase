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
 const base=path.posix.normalize(path.posix.join(path.posix.dirname(fromFile),specifier));
 const candidates=path.posix.extname(base)?[base]:[base,...JS_EXTENSIONS.map(ext=>base+ext),...JS_EXTENSIONS.map(ext=>path.posix.join(base,'index'+ext))];
 return candidates.some(candidate=>known.has(candidate));
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
 const unreadable=[],empty=[],oversized=[],unresolved=[];
 const sourceContents=new Map();
 for(const relative of sourceFiles){
  try{
   const content=await readFile(path.join(root,relative),'utf8');
   sourceContents.set(relative,content);
   if(!content.trim())empty.push(relative);
   if(Buffer.byteLength(content,'utf8')>1024*1024)oversized.push(relative);
   if(/\.(?:js|mjs|cjs|jsx|ts|tsx)$/i.test(relative)){
    const pattern=/(?:\bfrom\s*|\bimport\s*\()\s*['"]([^'"]+)['"]|^\s*import\s*['"]([^'"]+)['"]/gm;
    let match;
    while((match=pattern.exec(content))){
     const specifier=match[1]||match[2];
     if(specifier?.startsWith('.')&&!resolveRelativeImport(relative,specifier,known))unresolved.push(relative+' → '+specifier);
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
  (unresolved.length?'; '+unresolved.slice(0,15).join(' | '):''),
  'critical','Importpfade, Dateinamen und Build-Auflösung im betroffenen Modul korrigieren.');
 const backendJs=allFiles.filter(file=>file.startsWith('backend/')&&/\.(?:js|mjs|cjs)$/.test(file));
 const tests=inventory.tests||[];
 const testFiles=tests.filter(file=>/\.test\.(?:js|mjs|cjs|jsx|ts|tsx)$/.test(file));
 const missingTests=backendJs.filter(file=>!file.endsWith('/server.js')&&!testFiles.some(test=>path.basename(test).replace(/\.test\.[^.]+$/,'')===path.basename(file).replace(/\.[^.]+$/,'')));
 add(checks,'Backend-Testzuordnung','Testabdeckung',missingTests.length===0,
  'Backend-Module: '+backendJs.length+'; Testdateien: '+testFiles.length+'; Module ohne gleichnamige direkte Testdatei: '+missingTests.length+
  (missingTests.length?'; '+missingTests.slice(0,18).join(', '):''),
  'warning','Für kritische Module gezielte Erfolgs-, Fehler-, Berechtigungs- und Regressionstests ergänzen.');
 const packageFile=path.join(root,'package.json');
 let packageData=null;
 try{packageData=JSON.parse(await readFile(packageFile,'utf8'));}catch{}
 const scripts=packageData?.scripts||{};
 const buildScript=String(scripts.build||''),testScript=String(scripts.test||'');
 const buildOk=Boolean(packageData&&testScript&&buildScript.includes('npm test')&&buildScript.includes('vite build'));
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
 return {ok:checks.every(item=>item.ok),checks,summary:totals,scope:'backend, frontend, tests, SQL migrations, relative imports, build scripts and API route surface',
  limitations:['Read-only static inspection; no project code or shell command is executed.','No live database mutation, external request, compiler run or test suite is started by this audit.','Static route-guard hints do not prove authorization; authenticated integration tests remain necessary.']};
}
