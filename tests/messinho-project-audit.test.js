import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {runMessinhoProjectAudit} from '../backend/messinho-project-audit.js';

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
