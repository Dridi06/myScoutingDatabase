import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('myKI dashboard places key information before detailed sections',async()=>{
 const source=await read('src/main.jsx');
 const start=source.indexOf(`{page==='myki'&&admin&&<div className="myki-dashboard">`);
 assert.notEqual(start,-1,'myKI dashboard wrapper must exist');
 const end=source.indexOf(`{page==='ticket-support'&&admin`,start);
 const page=source.slice(start,end);
 const positions=[
  page.indexOf('className="myki-heading"'),
  page.indexOf('className="myki-summary"'),
  page.indexOf('<MyKiChat supabase={sb}/>'),
  page.indexOf('<MyKiActivityMonitor supabase={sb}/>'),
  page.indexOf('className="myki-layout"')
 ];
 assert.ok(positions.every(index=>index>=0),'all dashboard sections must be present');
 assert.deepEqual(positions,[...positions].sort((a,b)=>a-b),'order must be heading, summary, chat, activity monitor, ticket inbox');
});

test('secondary operational metadata and schedule are collapsed by default',async()=>{
 const [chat,monitor]=await Promise.all([read('src/asi/MyKiChat.jsx'),read('src/asi/MyKiActivityMonitor.jsx')]);
 assert.match(chat,/<details className="myki-agent-details">/);
 assert.match(chat,/setInterval\(refresh,30000\)/);
 assert.match(monitor,/<details className="myki-monitor-schedule-details">/);
});

test('myKI dashboard uses stationary gold-accented controls',async()=>{
 const css=await read('src/styles.css');
 assert.match(css,/\.myki-dashboard\s*\{/);
 assert.match(css,/\.myki-dashboard button,\s*\.myki-dashboard button:hover,\s*\.myki-dashboard button:active\s*\{\s*transform:none!important/s);
 assert.match(css,/outline:2px solid #d8b76d!important/);
 assert.match(css,/linear-gradient\(145deg,#e9d39b,#b58c48\)/);
});
