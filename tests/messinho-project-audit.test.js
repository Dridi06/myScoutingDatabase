import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {runMessinhoProjectAudit,buildMessinhoDependencyGraph,extractModuleSpecifiers,extractModuleReferences} from '../backend/messinho-project-audit.js';

test('project audit inventories project areas and build/test pipeline without executing code',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-audit-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node --test',build:'npm test && vite build'}}));
  await writeFile(path.join(root,'backend','server.js'),"import './ok.js';\napp.get('/api/admin/example', requireSupabaseAdmin, handler);");
  await writeFile(path.join(root,'backend','ok.js'),'export const ok=true;');
  await writeFile(path.join(root,'tests','ok.test.js'),"import '../backend/ok.js';");
  await writeFile(path.join(root,'supabase','migrations','001.sql'),'select 1;');
  const result=await runMessinhoProjectAudit({root});
  assert.equal(result.summary.backend_files,2);
  assert.equal(result.summary.test_files,1);
  assert.equal(result.summary.migration_files,1);
  assert.equal(result.checks.find(item=>item.name==='Relative Modulimporte').ok,true);
  assert.equal(result.checks.find(item=>item.name==='Produktions-Build und Testskripte').ok,true);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('project audit detects unresolved relative imports',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-audit-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node --test',build:'npm test && vite build'}}));
  await writeFile(path.join(root,'backend','broken.js'),"import './missing.js';");
  const result=await runMessinhoProjectAudit({root});
  const imports=result.checks.find(item=>item.name==='Relative Modulimporte');
  assert.equal(imports.ok,false);
  assert.match(imports.detail,/missing\.js/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('project audit accepts the direct Vite CLI build used by the staging package script',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-audit-vite-cli-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({
   scripts:{test:'node --test tests/*.test.js',build:"npm test && find backend -maxdepth 1 -type f -name '*.js' -print0 | xargs -0 -n1 node --check && node ./node_modules/vite/bin/vite.js build"}
  }));
  await writeFile(path.join(root,'backend','server.js'),"export const server=true;");
  await writeFile(path.join(root,'src','main.js'),"export const app=true;");
  await writeFile(path.join(root,'tests','main.test.js'),"import test from 'node:test'; test('ok',()=>{});");
  await writeFile(path.join(root,'supabase','migrations','001.sql'),'select 1;');
  const result=await runMessinhoProjectAudit({root});
  const build=result.checks.find(item=>item.name==='Produktions-Build und Testskripte');
  assert.equal(build.ok,true,build.detail);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('module import tokenizer finds side-effect and named imports but ignores string examples',()=>{
 const source=[
  "import test from 'node:test';",
  "import '../backend/feature.js';",
  "import { other } from '../backend/other.js';",
  "const example = \\\"import { fake } from './not-real.js';\\\";",
  "// import './comment.js';"
 ].join('\n');
 assert.deepEqual(extractModuleSpecifiers(source),['node:test','../backend/feature.js','../backend/other.js']);
});

test('project audit ignores import examples in strings and comments and maps tests by real imports',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-audit-import-graph-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node --test',build:'npm test && vite build'}}));
  await writeFile(path.join(root,'backend','server.js'),[
   "import { feature } from './feature.js';",
   "// import './comment-only-missing.js';",
   "const example = \\\"import { fake } from './string-only-missing.js';\\\";",
   "export { feature };"
  ].join('\n'));
  await writeFile(path.join(root,'backend','feature.js'),'export const feature=true;');
  await writeFile(path.join(root,'tests','feature-behavior.test.js'),[
   "import test from 'node:test';",
   "import '../backend/feature.js';",
   "test('feature is loaded',()=>assert.ok(feature));",
   "const example = \\\"import { fake } from './not-a-real-module.js';\\\";",
   "// import './also-not-a-real-module.js';"
  ].join('\n'));
  const result=await runMessinhoProjectAudit({root});
  const imports=result.checks.find(item=>item.name==='Relative Modulimporte');
  const coverage=result.checks.find(item=>item.name==='Backend-Testzuordnung');
  assert.equal(imports.ok,true,imports.detail);
  assert.equal(coverage.ok,true,coverage.detail);
  assert.match(coverage.detail,/Module ohne direkten Testimport: 0/);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('diagnostic import findings identify exact file, line, column and evidence',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-audit-location-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node --test',build:'npm test && vite build'}}));
  await writeFile(path.join(root,'backend','broken.js'),"export const ok=true;\nimport './missing.js';\n");
  const result=await runMessinhoProjectAudit({root});
  const finding=result.findings.find(item=>item.category==='dependency_resolution');
  assert.equal(finding.file,'backend/broken.js');
  assert.equal(finding.line,2);
  assert.equal(finding.column,8);
  assert.equal(finding.dependency,'./missing.js');
  assert.equal(finding.status,'unverified');
  assert.match(finding.evidence.source_line,/missing\.js/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('Vite CLI path used by package build script is recognized',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-audit-vite-cli-path-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({
   scripts:{test:'node --test',build:'npm test && node ./node_modules/vite/bin/vite.js build'}
  }));
  const result=await runMessinhoProjectAudit({root});
  const build=result.checks.find(item=>item.name==='Produktions-Build und Testskripte');
  assert.equal(build.ok,true,build.detail);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('missing direct test imports are informational and not asserted as missing behavioral coverage',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-audit-coverage-unknown-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({scripts:{test:'node --test',build:'npm test && vite build'}}));
  await writeFile(path.join(root,'backend','service.js'),'export const run=()=>true;');
  const result=await runMessinhoProjectAudit({root});
  const coverage=result.checks.find(item=>item.name==='Backend-Testzuordnung');
  assert.equal(coverage.severity,'info');
  assert.equal(coverage.ok,true);
  assert.match(coverage.recommendation,/nicht abschließend/);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('module references preserve source line and column for imports',()=>{
 const source="const x=1;\nimport './missing.js';";
 const refs=extractModuleReferences(source);
 assert.deepEqual(refs.map(({specifier,line,column})=>({specifier,line,column})),[
  {specifier:'./missing.js',line:2,column:8}
 ]);
});


test('parser-backed dependency graph resolves internal imports, records packages and detects cycles',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-dependency-graph-'));
 try{
  for(const folder of ['backend','src','tests','supabase/migrations'])await mkdir(path.join(root,folder),{recursive:true});
  await writeFile(path.join(root,'package.json'),JSON.stringify({dependencies:{express:'^5.1.0'}}));
  await writeFile(path.join(root,'backend','alpha.js'),"import { beta } from './beta.js';\nimport express from 'express';\nexport const alpha=()=>beta+Boolean(express);");
  await writeFile(path.join(root,'backend','beta.js'),"import { alpha } from './alpha.js';\nexport const beta=()=>Boolean(alpha);");
  const graph=await buildMessinhoDependencyGraph({root,files:['backend/alpha.js','backend/beta.js']});
  assert.equal(graph.parser,'@babel/parser');
  assert.equal(graph.coverage.modules,2);
  assert.equal(graph.edges.length,2);
  assert.equal(graph.external_dependencies.includes('express'),true);
  assert.equal(graph.cycles.length,1);
  assert.equal(graph.findings[0].category,'circular_dependency');
 }finally{await rm(root,{recursive:true,force:true});}
});

test('parser-backed graph identifies unresolved imports with exact source locations',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-dependency-unresolved-'));
 try{
  await mkdir(path.join(root,'backend'),{recursive:true});
  await writeFile(path.join(root,'backend','consumer.js'),"export const value=1;\nimport './missing.js';\n");
  const graph=await buildMessinhoDependencyGraph({root,files:['backend/consumer.js']});
  const finding=graph.findings.find(item=>item.category==='unresolved_import');
  assert.ok(finding);
  assert.equal(finding.file,'backend/consumer.js');
  assert.equal(finding.line,2);
  assert.equal(finding.dependency,'./missing.js');
 }finally{await rm(root,{recursive:true,force:true});}
});

test('parser-backed graph catches missing named exports rather than only checking file existence',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-dependency-export-'));
 try{
  await mkdir(path.join(root,'backend'),{recursive:true});
  await writeFile(path.join(root,'backend','provider.js'),'export const actual=true;');
  await writeFile(path.join(root,'backend','consumer.js'),"import { missing } from './provider.js';\nexport const result=missing;");
  const graph=await buildMessinhoDependencyGraph({root,files:['backend/provider.js','backend/consumer.js']});
  const finding=graph.findings.find(item=>item.category==='missing_export');
  assert.ok(finding,JSON.stringify(graph.findings));
  assert.equal(finding.file,'backend/consumer.js');
  assert.ok(finding.line);
 }finally{await rm(root,{recursive:true,force:true});}
});

test('parser-backed graph catches JavaScript syntax errors with parser evidence',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-dependency-syntax-'));
 try{
  await mkdir(path.join(root,'backend'),{recursive:true});
  await writeFile(path.join(root,'backend','broken.js'),'export const = ;');
  const graph=await buildMessinhoDependencyGraph({root,files:['backend/broken.js']});
  const finding=graph.findings.find(item=>item.category==='parser_or_module_error');
  assert.ok(finding,JSON.stringify(graph.findings));
  assert.equal(finding.file,'backend/broken.js');
  assert.ok(finding.line);
  assert.ok(finding.evidence.message);
 }finally{await rm(root,{recursive:true,force:true});}
});


test('dependency graph resolves TypeScript path aliases to real project modules',async()=>{
 const root=await mkdtemp(path.join(os.tmpdir(),'messinho-dependency-alias-'));
 try{
  await mkdir(path.join(root,'backend'),{recursive:true});
  await mkdir(path.join(root,'src'),{recursive:true});
  await writeFile(path.join(root,'tsconfig.json'),JSON.stringify({compilerOptions:{baseUrl:'.',paths:{'@/*':['src/*']}}}));
  await writeFile(path.join(root,'src','util.js'),'export const util=true;');
  await writeFile(path.join(root,'backend','consumer.js'),"import { util } from '@/util.js';\nexport const value=util;");
  const graph=await buildMessinhoDependencyGraph({root,files:['backend/consumer.js','src/util.js']});
  assert.equal(graph.coverage.parsed,2);
  assert.equal(graph.edges.length,1,JSON.stringify(graph.findings));
  assert.equal(graph.edges[0].to,'src/util.js');
  assert.equal(graph.findings.length,0);
 }finally{await rm(root,{recursive:true,force:true});}
});
