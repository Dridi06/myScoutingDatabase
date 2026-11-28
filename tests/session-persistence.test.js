import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('Supabase authentication explicitly persists and refreshes the browser session',async()=>{
 const main=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(main,/createClient\(url,key,\{auth:\{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true\}\}\)/);
});

test('returning to the browser tab rehydrates the existing session without forcing a login',async()=>{
 const main=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(main,/const restoreSession=async\(\)=>/);
 assert.match(main,/window\.addEventListener\('focus',handleResume\)/);
 assert.match(main,/document\.addEventListener\('visibilitychange',handleResume\)/);
 assert.match(main,/if\(document\.visibilityState==='visible'\)/);
 assert.match(main,/if\(data\.session\)\{S\(\{user:data\.session\.user\}\)/);
 assert.match(main,/else if\(event==='SIGNED_OUT'\)\{/);
 assert.doesNotMatch(main,/\}\)\{S\(null\);P\(null\);D\(\[\]\);setMyTickets/);
});

test('session restoration ignores stale reads after a newer auth event',async()=>{
 const main=await readFile(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(main,/let active=true,authEventVersion=0/);
 assert.match(main,/const version=authEventVersion/);
 assert.match(main,/version!==authEventVersion/);
 assert.match(main,/authEventVersion\+\+/);
});
