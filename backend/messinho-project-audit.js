import { parse as babelParse } from '@babel/parser';
import { builtinModules } from 'node:module';
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
function projectRelativeModulePath(value,root){
 const raw=String(value||'').split('?')[0];
 if(!raw||raw.startsWith('\\0'))return null;
 const absolute=path.isAbsolute(raw)?raw:path.resolve(root,raw);
 const relative=normalizeModulePath(path.relative(root,absolute));
 return relative&&!relative.startsWith('../')&&!path.isAbsolute(relative)?relative:null;
}
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


function declaredNames(node,result=new Set()){
 if(!node)return result;
 if(node.type==='Identifier')result.add(node.name);
 else if(node.type==='RestElement')declaredNames(node.argument,result);
 else if(node.type==='AssignmentPattern')declaredNames(node.left,result);
 else if(node.type==='ArrayPattern')for(const item of node.elements||[])declaredNames(item,result);
 else if(node.type==='ObjectPattern')for(const item of node.properties||[])declaredNames(item.type==='RestElement'?item.argument:item.value,result);
 return result;
}
function visitAst(node,visitor){
 if(!node||typeof node!=='object')return;
 if(Array.isArray(node)){for(const item of node)visitAst(item,visitor);return;}
 if(typeof node.type==='string')visitor(node);
 for(const [key,value] of Object.entries(node)){
  if(key==='loc'||key==='start'||key==='end'||key==='extra'||key==='comments'||key==='tokens')continue;
  if(value&&typeof value==='object')visitAst(value,visitor);
 }
}
function parseModuleRecord(source,file){
 const ast=babelParse(source,{sourceType:'unambiguous',allowAwaitOutsideFunction:true,allowReturnOutsideFunction:true,
  plugins:['jsx','typescript','decorators-legacy','importAttributes','topLevelAwait']});
 const imports=[],exports=new Set(),reexports=[];
 visitAst(ast,node=>{
  if(node.type==='ImportDeclaration'){
   imports.push({specifier:node.source.value,kind:'static',line:node.loc?.start.line||null,column:node.loc?.start.column==null?null:node.loc.start.column+1,
    names:(node.specifiers||[]).map(item=>({imported:item.type==='ImportDefaultSpecifier'?'default':item.type==='ImportNamespaceSpecifier'?'*':item.imported?.name||item.imported?.value||'default',local:item.local?.name||null}))});
  }else if(node.type==='ExportNamedDeclaration'){
   if(node.source){reexports.push({specifier:node.source.value,names:(node.specifiers||[]).map(item=>({imported:item.local?.name||item.local?.value||'default',exported:item.exported?.name||item.exported?.value||'default'})),line:node.loc?.start.line||null,column:node.loc?.start.column==null?null:node.loc.start.column+1});}
   else{
    if(node.declaration){
     const d=node.declaration;
     if(d.id?.name)exports.add(d.id.name);
     if(d.type==='VariableDeclaration')for(const item of d.declarations||[])for(const name of declaredNames(item.id))exports.add(name);
     if(['TSInterfaceDeclaration','TSTypeAliasDeclaration','ClassDeclaration','FunctionDeclaration','EnumDeclaration'].includes(d.type)&&d.id?.name)exports.add(d.id.name);
    }
    for(const item of node.specifiers||[])exports.add(item.exported?.name||item.exported?.value||'default');
   }
  }else if(node.type==='ExportDefaultDeclaration')exports.add('default');
  else if(node.type==='ExportAllDeclaration'){
   reexports.push({specifier:node.source.value,names:node.exported?[{imported:'*',exported:node.exported.name||node.exported.value}]:[],all:!node.exported,line:node.loc?.start.line||null,column:node.loc?.start.column==null?null:node.loc.start.column+1});
  }else if(node.type==='ImportExpression'&&node.source?.type==='StringLiteral'){
   imports.push({specifier:node.source.value,kind:'dynamic',line:node.loc?.start.line||null,column:node.loc?.start.column==null?null:node.loc.start.column+1,names:[]});
  }else if(node.type==='CallExpression'&&node.callee?.type==='Import'&&node.arguments?.[0]?.type==='StringLiteral'){
   imports.push({specifier:node.arguments[0].value,kind:'dynamic',line:node.loc?.start.line||null,column:node.loc?.start.column==null?null:node.loc.start.column+1,names:[]});
  }else if(node.type==='CallExpression'&&node.callee?.type==='Identifier'&&node.callee.name==='require'&&node.arguments?.[0]?.type==='StringLiteral'){
   imports.push({specifier:node.arguments[0].value,kind:'commonjs',line:node.loc?.start.line||null,column:node.loc?.start.column==null?null:node.loc.start.column+1,names:[]});
  }
 });
 return {file,imports,exports,reexports};
}
function resolveGraphImport(from,specifier,known,aliases,root){
 let candidate=String(specifier||'');
 if(candidate.startsWith('.'))return resolveRelativeImport(from,candidate,known);
 for(const alias of aliases){
  if(candidate===alias.find||candidate.startsWith(alias.find)){
   const suffix=candidate.slice(alias.find.length);
   const base=path.relative(root,path.join(alias.replacement,suffix));
   return resolveRelativeImport(from,'/'+base,known)||resolveKnownPath(base,known);
  }
 }
 if(candidate.startsWith('/'))return resolveKnownPath(candidate.slice(1),known);
 return null;
}
function resolveKnownPath(value,known){
 const base=path.posix.normalize(String(value||'').replace(/^\//,''));
 const candidates=path.posix.extname(base)?[base]:[base,...JS_EXTENSIONS.map(ext=>base+ext),...JS_EXTENSIONS.map(ext=>path.posix.join(base,'index'+ext))];
 return candidates.find(candidate=>known.has(candidate))||null;
}
export async function buildMessinhoDependencyGraph({root=PROJECT_ROOT,files=[]}={}){
 const modules=files.filter(file=>/\.(?:js|mjs|cjs|jsx|ts|tsx)$/.test(file)).map(normalizeModulePath);
 const checkedAt=new Date().toISOString(),known=new Set(files.map(normalizeModulePath));
 if(!modules.length)return {ok:false,checked_at:checkedAt,parser:'babel',nodes:[],edges:[],cycles:[],external_dependencies:[],findings:[],
  coverage:{modules:0,parsed:0,excluded:files.length},metrics:{nodes:0,edges:0,cycles:0,external_dependencies:0,findings:0}};
 const records=new Map(),edges=new Map(),externalDependencies=new Set(),findings=[];
 const packageFile=path.join(root,'package.json');let packageData={};
 try{packageData=JSON.parse(await readFile(packageFile,'utf8'));}catch{}
 const declaredPackages=new Set(['dependencies','devDependencies','optionalDependencies'].flatMap(key=>Object.keys(packageData[key]||{})));
 const builtins=new Set(builtinModules.flatMap(item=>[item,item.replace(/^node:/,'')]));
 const aliases=[];
 try{
  const tsconfig=JSON.parse(await readFile(path.join(root,'tsconfig.json'),'utf8'));
  const base=path.resolve(root,tsconfig.compilerOptions?.baseUrl||'.');
  for(const [pattern,targets] of Object.entries(tsconfig.compilerOptions?.paths||{}))for(const target of targets||[]){
   const star=pattern.indexOf('*'),find=star<0?pattern:pattern.slice(0,star);
   const targetStar=target.indexOf('*'),replacement=path.resolve(base,targetStar<0?target:target.slice(0,targetStar));
   aliases.push({find,replacement});
  }
 }catch{}
 try{
  const configSource=await readFile(path.join(root,'vite.config.js'),'utf8');
  const configAst=babelParse(configSource,{sourceType:'unambiguous',plugins:['jsx','typescript']});
  const staticValue=value=>{
   if(value?.type==='StringLiteral')return value.value;
   if(value?.type==='TemplateLiteral'&&value.expressions.length===0)return value.quasis[0]?.value?.cooked||null;
   if(value?.type==='CallExpression'){
    const last=[...(value.arguments||[])].reverse().find(item=>item?.type==='StringLiteral');
    return last?.value||null;
   }
   return null;
  };
  visitAst(configAst,node=>{
   if(node.type!=='ObjectProperty'||(node.key?.name||node.key?.value)!=='alias')return;
   const value=node.value;
   const addAlias=(findNode,replacementNode)=>{
    const find=staticValue(findNode),replacement=staticValue(replacementNode);
    if(find&&replacement)aliases.push({find,replacement:path.isAbsolute(replacement)?replacement:path.resolve(root,replacement)});
   };
   if(value?.type==='ObjectExpression')for(const property of value.properties||[]){
    if(property.type==='ObjectProperty')addAlias(property.key,property.value);
   }
   if(value?.type==='ArrayExpression')for(const entry of value.elements||[]){
    if(entry?.type!=='ObjectExpression')continue;
    let findNode=null,replacementNode=null;
    for(const property of entry.properties||[]){
     const key=property.key?.name||property.key?.value;
     if(key==='find')findNode=property.value;
     if(key==='replacement')replacementNode=property.value;
    }
    addAlias(findNode,replacementNode);
   }
  });
 }catch{}
 try{
  const vite=await readFile(path.join(root,'vite.config.js'),'utf8');
  for(const match of vite.matchAll(/['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/g)){
   const find=match[1],replacement=match[2];
   if(find.length<=12&&(replacement.startsWith('./')||replacement.startsWith('/')))aliases.push({find,replacement:path.resolve(root,replacement)});
  }
 }catch{}
 for(const file of modules){
  try{
   const source=await readFile(path.join(root,file),'utf8');
   records.set(file,parseModuleRecord(source,file));
  }catch(error){
   const loc=error.loc||error.location||{};
   findings.push({finding_id:'PARSE-'+String(findings.length+1).padStart(4,'0'),status:'unverified',severity:'critical',
    category:'parser_or_module_error',component:file.startsWith('backend/')?'Backend':file.startsWith('src/')?'Frontend':'Project',
    title:'Quelldatei kann nicht geparst werden',file,line:loc.line||null,column:loc.column==null?null:loc.column+1,
    error_message:safe(error.message||error,1800),root_cause:'Der Babel-Parser konnte die Datei mit den konfigurierten JS-/JSX-/TypeScript-Syntaxregeln nicht lesen.',
    evidence:{tool:'@babel/parser',message:safe(error.message||error,1800)},
    reproduction:{check:'babel_parse',source_file:file},recommendation:'Syntax und Dateiendung prüfen; nicht unterstützte Syntax gezielt als Parserlücke dokumentieren.',
    checked_at:checkedAt});
  }
 }
 for(const file of records.keys())edges.set(file,new Set());
 const resolve=(from,specifier)=>resolveGraphImport(from,specifier,known,aliases,root);
 const importsByFile=new Map();
 for(const [file,record] of records){
  const imports=[];
  for(const item of [...record.imports,...record.reexports]){
   const local=resolve(file,item.specifier);
   if(local){edges.get(file).add(local);imports.push({...item,target:local});continue;}
   if(item.specifier.startsWith('.')||item.specifier.startsWith('/')){
    findings.push({finding_id:'IMPORT-'+String(findings.length+1).padStart(4,'0'),status:'unverified',severity:'high',
     category:'unresolved_import',component:file.startsWith('backend/')?'Backend':file.startsWith('src/')?'Frontend':'Tests',
     title:'Importziel nicht auflösbar',file,line:item.line,column:item.column,dependency:item.specifier,
     root_cause:'Das Importziel ist weder über den relativen Pfad noch über eine erkannte Alias-Regel im Projektinventar vorhanden.',
     evidence:{specifier:item.specifier,import_kind:item.kind||'re_export'},
     reproduction:{check:'module_resolution',source_file:file,specifier:item.specifier},
     recommendation:'Pfad, Groß-/Kleinschreibung, Endung und tsconfig-/Vite-Aliasregeln prüfen.',checked_at:checkedAt});
    continue;
   }
   const packageName=item.specifier.startsWith('@')?item.specifier.split('/').slice(0,2).join('/'):item.specifier.split('/')[0];
   if(builtins.has(item.specifier)||builtins.has(packageName))continue;
   externalDependencies.add(packageName);
   if(!declaredPackages.has(packageName)){
    findings.push({finding_id:'PACKAGE-'+String(findings.length+1).padStart(4,'0'),status:'unverified',severity:'high',
     category:'undeclared_dependency',component:'Dependencies',title:'Externe Abhängigkeit nicht deklariert',
     file,line:item.line,column:item.column,dependency:packageName,
     root_cause:'Das importierte Paket ist weder als Projektabhängigkeit noch als Node.js-Builtin deklariert.',
     evidence:{specifier:item.specifier},reproduction:{check:'package_manifest_dependency',source_file:file,specifier:item.specifier},
     recommendation:'Prüfen, ob das Paket absichtlich extern bereitgestellt wird; andernfalls als Abhängigkeit deklarieren.',
     checked_at:checkedAt});
   }
   imports.push({...item,target:null,external:true});
  }
  importsByFile.set(file,imports);
 }
 // Resolve named re-exports to a fixed point before validating import bindings.
 for(let pass=0;pass<records.size;pass++){
  let changed=false;
  for(const [file,record] of records)for(const item of record.reexports){
   const target=resolve(file,item.specifier),targetRecord=records.get(target);
   if(!targetRecord)continue;
   const names=item.all?[...targetRecord.exports].filter(name=>name!=='default'):item.names.map(name=>name.imported);
   for(const name of names){const exported=item.all?name:(item.names.find(value=>value.imported===name)?.exported||name);
    if(!record.exports.has(exported)){record.exports.add(exported);changed=true;}
   }
  }
  if(!changed)break;
 }
 for(const [file,record] of records)for(const item of importsByFile.get(file)||[]){
  if(!item.target||item.external||!item.names?.length)continue;
  const targetRecord=records.get(item.target);
  if(!targetRecord)continue;
  for(const name of item.names){
   if(name.imported==='*'||targetRecord.exports.has(name.imported))continue;
   findings.push({finding_id:'EXPORT-'+String(findings.length+1).padStart(4,'0'),status:'unverified',severity:'high',
    category:'missing_export',component:file.startsWith('backend/')?'Backend':'Frontend',
    title:'Importiertes Export-Symbol fehlt',file,line:item.line,column:item.column,symbol:name.imported,dependency:item.specifier,
    root_cause:'Das lokale Modul exportiert das angeforderte Symbol nicht.',
    evidence:{imported_symbol:name.imported,target_file:item.target,available_exports:[...targetRecord.exports].slice(0,40)},
    reproduction:{check:'named_export_contract',source_file:file,target_file:item.target,symbol:name.imported},
    recommendation:'Exportname, Importname und Re-Export-Kette abgleichen.',checked_at:checkedAt});
  }
 }
 const cycles=stronglyConnectedComponents(new Set(records.keys()),edges);
 for(const component of cycles)findings.push({finding_id:'CYCLE-'+String(findings.length+1).padStart(4,'0'),status:'unverified',
  severity:'medium',category:'circular_dependency',component:'Module',title:'Zyklische Modulabhängigkeit',
  file:component[0],line:null,column:null,dependency:component.join(' → '),
  root_cause:'Die Module bilden einen gerichteten Abhängigkeitszyklus.',evidence:{nodes:component},
  reproduction:{check:'strongly_connected_components',modules:component},
  recommendation:'Zyklus auflösen oder bewusst dokumentieren; gemeinsame Verträge gegebenenfalls in ein unabhängiges Modul verschieben.',
  checked_at:checkedAt});
 const edgeList=[];
 for(const [from,targets] of edges)for(const to of targets){
  const reference=(records.get(from)?.imports||[]).find(item=>resolve(from,item.specifier)===to);
  edgeList.push({from,to,kind:reference?.kind||'static',line:reference?.line||null,column:reference?.column||null});
 }
 const incoming=new Map([...records.keys()].map(node=>[node,0]));
 for(const targets of edges.values())for(const target of targets)incoming.set(target,(incoming.get(target)||0)+1);
 const graphEdges=edgeList.sort((a,b)=>a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
 return {ok:findings.length===0,checked_at:checkedAt,parser:'@babel/parser',nodes:[...records.keys()].sort(),exported_symbols:Object.fromEntries([...records].map(([file,record])=>[file,[...record.exports].sort()])),edges:graphEdges,
  cycles,external_dependencies:[...externalDependencies].sort(),findings,
  coverage:{modules:modules.length,parsed:records.size,excluded:files.length-modules.length,
   external_dependencies:externalDependencies.size,internal_edges:graphEdges.length},
  metrics:{nodes:records.size,edges:graphEdges.length,cycles:cycles.length,external_dependencies:externalDependencies.size,
   findings:findings.length,isolated_modules:[...records.keys()].filter(node=>(edges.get(node)?.size||0)===0&&(incoming.get(node)||0)===0).length},
  limitations:['Babel parst JS-/JSX-/TypeScript-Module und prüft lokale Import-/Exportverträge; Anwendungscode wird nicht ausgeführt.',
   'Paketimporte werden anhand des package.json-Manifests als externe Abhängigkeiten erfasst; installierte Version und Laufzeitverfügbarkeit werden hier nicht bewiesen.',
   'Dynamische, zur Laufzeit zusammengesetzte Importpfade und CommonJS-Exports können statisch nicht vollständig aufgelöst werden.',
   'Zyklische Importe sind Hinweise, nicht automatisch Laufzeitfehler.','CSS-/SQL-Semantik und Backend-Laufzeitverhalten sind nicht Gegenstand dieses Modulgraphen.']};
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
  'Parser: Babel; Module: '+dependencyGraph.coverage.modules+'; interne Kanten: '+dependencyGraph.metrics.edges+
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
  audit_metadata:{mode:'parser_backed_static',parser:'vite/rollup',source_file_count:sourceFiles.length,inventory_roots:ROOTS,checked_at:new Date().toISOString(),
   finding_count:findings.length,confirmed_runtime_failures:0,unverified_static_findings:findings.length},
  limitations:['Read-only parser-backed inspection; no application code or shell command is executed.','The Babel parser and static module resolver run read-only; no live database mutation, external request or application runtime is started.','A static unresolved-import candidate is not a confirmed runtime failure until the build/runtime resolver independently reproduces it.','No direct test import is not proof of missing behavioral coverage; coverage and integration results are required.','Static route-guard hints do not prove authorization; authenticated integration tests remain necessary.']};
}
