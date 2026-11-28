import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('backend stamps all JSON responses and all console log levels in UTC',async()=>{
 const server=await read('backend/server.js');
 assert.match(server,/X-Server-Timestamp/);
 assert.match(server,/server_timestamp/);
 assert.match(server,/\['log','info','warn','error','debug'\]/);
 assert.match(server,/new Date\(\)\.toISOString\(\)/);
});

test('MESSINHO input and output persist database timestamps and lifecycle metadata',async()=>{
 const server=await read('backend/server.js');
 assert.match(server,/client_submitted_at:clientSubmittedAt,server_received_at:serverReceivedAt/);
 assert.match(server,/const requestReceivedAt=new Date\(\)\.toISOString\(\)/);
 assert.match(server,/const serverReceivedAt=requestReceivedAt/);
 assert.match(server,/select\('id,created_at'\)\.single\(\)/);
 assert.match(server,/processing_started_at:processingStartedAt,output_generated_at:outputGeneratedAt/);
 assert.match(server,/input_persisted_at:storedUserMessage\.created_at/);
 assert.match(server,/output_persisted_at:storedAssistantMessage\?\.created_at/);
 assert.match(server,/client_submitted_at:row\.metadata\?\.client_submitted_at/);
 assert.match(server,/server_received_at:row\.metadata\?\.server_received_at/);
});

test('primary Scout/Admin MESSINHO conversation displays one local clock timestamp per message',async()=>{
 const [chat,styles,main]=await Promise.all([
  read('src/asi/MessinhoWorkspace.jsx'),read('src/asi/messinho.css'),read('src/main.jsx')
 ]);
 assert.match(chat,/client_submitted_at:clientSubmittedAt/);
 assert.match(chat,/input_persisted_at/);
 assert.match(chat,/output_persisted_at/);
 assert.match(chat,/serverReceivedAt/);
 assert.match(chat,/message\.persisted\?'Ausgabe gespeichert'/);
 assert.match(chat,/message\.persisted\?'Eingabe gespeichert'/);
 assert.match(chat,/formatMessinhoTimestamp\(message\.timestamp\)/);
 assert.match(chat,/timeZone:'Europe\/Berlin'/);
 assert.match(styles,/\.messinho-message-timestamp/);
 assert.match(main,/Client-side logs receive the same UTC audit prefix/);
 assert.match(main,/\['log','info','warn','error','debug'\]/);
});

test('myKI chat restores message timestamps but displays only the local clock time',async()=>{
 const chat=await read('src/asi/MyKiChat.jsx');
 assert.match(chat,/fetch\('\/api\/agent\/conversation'/);
 assert.match(chat,/client_submitted_at:clientSubmittedAt/);
 assert.match(chat,/input_persisted_at/);
 assert.match(chat,/output_persisted_at/);
 assert.match(chat,/hour:'2-digit',minute:'2-digit',timeZone:'Europe\/Berlin'/);
 assert.match(chat,/<time className="myki-chat-timestamp" dateTime={item.timestamp\|\|undefined}>\{formatTimestamp\(item.timestamp\)\}<\/time>/);
 assert.doesNotMatch(chat,/Client gesendet|Servereingang|Ausgabe gespeichert|Eingabe gespeichert|Erzeugt ·/);
});

test('all myKI dashboard panels expose their server or record timestamp',async()=>{
 const [main,maturity,operations,boards,css]=await Promise.all([
  read('src/main.jsx'),read('src/asi/MyKiMaturity.jsx'),read('src/asi/MyKiOperations.jsx'),
  read('src/asi/MyKiTicketBoards.jsx'),read('src/asi/myki-chat.css')
 ]);
 assert.match(main,/myKiDashboardUpdatedAt/);
 assert.match(main,/myKiSelected\.created_at/);
 assert.match(main,/event\.created_at\?/);
 assert.match(main,/job\.created_at\?/);
 assert.match(main,/memory\.created_at\?/);
 assert.match(main,/memory\.reviewed_at\?/);
 assert.match(maturity,/payload\.generated_at\|\|payload\.server_timestamp/);
 assert.match(maturity,/Dashboard-Ausgabe erstellt/);
 assert.match(operations,/status\?\.generated_at\|\|status\?\.server_timestamp/);
 assert.match(operations,/lastSystemDiagnosis\?\.finished_at/);
 assert.match(operations,/lastDiagnosis\?\.finished_at/);
 assert.match(boards,/Datenstand:/);
 assert.match(boards,/formatTimestamp\(ticket\.created_at\)/);
 assert.match(css,/\.myki-dashboard-timestamp/);
});

test('diagnostic checks, runs, tickets and ticket audit events have authoritative timestamp fields',async()=>{
 const [server,diagnostics,tickets,migration,activity]=await Promise.all([
  read('backend/server.js'),read('src/asi/SystemDiagnostics.jsx'),
  read('backend/messinho-myki-tickets.js'),read('supabase/migrations/202611270001_messinho_myki_tickets.sql'),read('src/asi/MyKiActivityMonitor.jsx')
 ]);
 assert.match(server,/checkedAt:new Date\(\)\.toISOString\(\)/);
 assert.match(server,/created_at:row\.created_at/);
 assert.match(diagnostics,/dateTime\(check\.checkedAt\)/);
 assert.match(diagnostics,/dateTime\(run\.finished_at\)/);
 assert.match(diagnostics,/timeZone:'Europe\/Berlin'/);
 assert.match(activity,/timeZone:'Europe\/Berlin'/);
 assert.match(migration,/created_at timestamptz not null default now\(\)/);
 assert.match(tickets,/created_at/);
});

test('durable agent memory has creation and update timestamps enforced by migration',async()=>{
 const migration=await read('supabase/migrations/20261128102005_global_timestamp_coverage.sql');
 assert.match(migration,/add column if not exists created_at timestamptz not null default now\(\)/);
 assert.match(migration,/messinho_agent_memory_touch_updated_at/);
 assert.match(migration,/public\.touch_updated_at\(\)/);
});
