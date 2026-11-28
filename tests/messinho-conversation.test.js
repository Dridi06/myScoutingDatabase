import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cleanMyKiMessageText} from '../src/asi/myki-chat-utils.js';
import { classifyMessinhoProviderFailure, classifyMessinhoSocialIntent, getMessinhoSocialReply } from '../backend/messinho-conversation.js';

const fixedMorning = new Date('2026-11-26T08:00:00');
const history = [];


test('chat display removes an orphan closing brace but preserves code with balanced braces',()=>{
 assert.equal(cleanMyKiMessageText('Hallo\n}'),'Hallo');
 assert.equal(cleanMyKiMessageText('Antwort\n  }  '),'Antwort');
 assert.equal(cleanMyKiMessageText('const value = { ok: true };'),'const value = { ok: true };');
 assert.equal(cleanMyKiMessageText('```js\nif (ok) {\n  run();\n}\n```'),'```js\nif (ok) {\n  run();\n}\n```');
});

test('server routes simple greetings through deterministic conversation before provider calls',async()=>{
 const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
 assert.ok(source.includes('getMessinhoSocialReply(interpretedMessage,history,new Date())'));
 assert.ok(source.indexOf('const socialReply=getMessinhoSocialReply')<source.indexOf('const cognitiveResult=await classifyMessinhoTurn'));
});

test('MESSINHO recognizes greetings and answers naturally without an AI provider', () => {
  assert.equal(classifyMessinhoSocialIntent('Hallo'), 'greeting');
  assert.match(getMessinhoSocialReply('Hallo', history, fixedMorning), /Moin|Servus|Hey|Grüß dich/);
  assert.match(getMessinhoSocialReply('Hi MESSINHO!', history, fixedMorning), /Moin|Servus|Hey|Grüß dich/);
});

test('MESSINHO handles how-are-you, thanks and farewells', () => {
  assert.equal(classifyMessinhoSocialIntent('Wie geht’s dir?'), 'how_are_you');
  assert.match(getMessinhoSocialReply('Wie geht’s dir?', history, fixedMorning), /bei dir|Und bei dir/);
  assert.equal(classifyMessinhoSocialIntent('Danke dir!'), 'thanks');
  assert.match(getMessinhoSocialReply('Danke dir!', history, fixedMorning), /gern|Ding|Freut mich|Sehr gerne/i);
  assert.equal(classifyMessinhoSocialIntent('Tschüss'), 'goodbye');
  assert.match(getMessinhoSocialReply('Tschüss', history, fixedMorning), /Bis später|Schönen Feierabend|Bis dann/);
});

test('all social intents in the project document are supported', () => {
  const cases = [
    ['Entschuldigung, mein Fehler', 'apology'],
    ['Ich hole mir einen Kaffee', 'coffee_break'],
    ['Was machst du am Wochenende?', 'weekend_smalltalk'],
    ['Wer bist du eigentlich?', 'bot_identity'],
    ['Guten Morgen', 'greeting']
  ];
  for (const [message, expected] of cases) {
    assert.equal(classifyMessinhoSocialIntent(message), expected, message);
    assert.equal(typeof getMessinhoSocialReply(message, history, fixedMorning), 'string');
  }
});

test('conversation replies avoid immediate repetition when recent assistant history exists', () => {
  const first = getMessinhoSocialReply('Hallo', [], fixedMorning);
  const second = getMessinhoSocialReply('Hallo', [{ role: 'assistant', text: first }], fixedMorning);
  assert.notEqual(first, second);
});

test('ordinary messages and scouting requests are not intercepted as small talk', () => {
  for (const message of ['Suche drei U19-Mittelfeldspieler', 'Erkläre mir das Pressing', 'Analysiere den Spieler', 'Vergleiche zwei Kandidaten']) {
    assert.equal(getMessinhoSocialReply(message), null, message);
  }
});

test('provider quota exhaustion is reported distinctly and safely', () => {
  const result = classifyMessinhoProviderFailure(429, { error: { code: 'insufficient_quota', message: 'You have no credits remaining.' } });
  assert.equal(result.code, 'provider_quota_exhausted');
  assert.equal(result.status, 503);
  assert.match(result.userMessage, /Guthaben/);
});

test('invalid API credentials and temporary rate limits have different messages', () => {
  assert.equal(classifyMessinhoProviderFailure(401, { error: { code: 'invalid_api_key' } }).code, 'provider_authentication_failed');
  assert.equal(classifyMessinhoProviderFailure(429, { error: { code: 'rate_limit_exceeded' } }).code, 'provider_rate_limited');
  assert.equal(classifyMessinhoProviderFailure(503, {}).code, 'provider_unavailable');
});

test('MESSINHO resolves current time from the runtime clock in Berlin without a language-model provider', async () => {
  const { resolveMessinhoLiveQuestion } = await import('../backend/messinho-conversation.js');
  const result = resolveMessinhoLiveQuestion('Wie spät ist es?', {
    now: new Date('2026-11-26T04:31:00.000Z'),
    timeZone: 'Europe/Berlin'
  });
  assert.equal(result.intent, 'live_time');
  assert.equal(result.tool, 'system_clock');
  assert.match(result.reply, /05:31 Uhr/);
  assert.equal(result.time_zone, 'Europe/Berlin');
  assert.equal(result.verified_at, '2026-11-26T04:31:00.000Z');
});

test('MESSINHO resolves date and combined date/time questions from the same trusted clock', async () => {
  const { resolveMessinhoLiveQuestion } = await import('../backend/messinho-conversation.js');
  const now = new Date('2026-11-26T04:31:00.000Z');
  const date = resolveMessinhoLiveQuestion('Welcher Wochentag ist heute?', { now });
  assert.equal(date.intent, 'live_date');
  assert.match(date.reply, /Donnerstag/);
  const both = resolveMessinhoLiveQuestion('Wie spät ist es und welches Datum haben wir?', { now });
  assert.equal(both.intent, 'live_time_and_date');
  assert.match(both.reply, /05:31 Uhr/);
  assert.match(both.reply, /Donnerstag/);
});

test('unknown general questions are not falsely answered by the live clock resolver', async () => {
  const { resolveMessinhoLiveQuestion } = await import('../backend/messinho-conversation.js');
  assert.equal(resolveMessinhoLiveQuestion('Warum ist der Himmel blau?'), null);
  assert.equal(resolveMessinhoLiveQuestion('Wie spielt ein inverser Außenverteidiger?'), null);
});


test('VO2max application questions trigger a focused player-data follow-up, not a fabricated rating', async () => {
  const { buildMessinhoKnowledgeApplicationFollowUp } = await import('../backend/messinho-conversation.js');
  const result = buildMessinhoKnowledgeApplicationFollowUp(
    'Wie kann ich die VO2max eines Fußballspielers für die Leistungsbewertung nutzen? Welche zusätzlichen Informationen benötigst du?',
    { conceptKey: 'sports_science.physiology.vo2max' }
  );
  assert.ok(result);
  assert.match(result.reply, /Messwert mit Einheit/);
  assert.match(result.reply, /Testverfahren/);
  assert.match(result.reply, /Spielposition/);
  assert.equal(result.follow_up.kind, 'vo2max_player_application');
  assert.equal(result.follow_up.score_created, false);
  assert.equal(result.follow_up.estimated_value_created, false);
});

test('basic VO2max definition questions do not cause unnecessary follow-up prompts', async () => {
  const { buildMessinhoKnowledgeApplicationFollowUp } = await import('../backend/messinho-conversation.js');
  assert.equal(buildMessinhoKnowledgeApplicationFollowUp('Was bedeutet VO2max?', {
    conceptKey: 'sports_science.physiology.vo2max'
  }), null);
});

test('provided estimated VO2max stays explicitly estimated and asks only for missing context', async () => {
  const { buildMessinhoKnowledgeApplicationFollowUp } = await import('../backend/messinho-conversation.js');
  const result = buildMessinhoKnowledgeApplicationFollowUp(
    'Wie ordne ich VO2max 55 ml/kg/min ein? Der Wert ist geschätzt aus einem Feldtest vom 12.05.2026.',
    { conceptKey: 'sports_science.physiology.vo2max', player: { age: 19, positions: ['Flügel'] } }
  );
  assert.equal(result.follow_up.method_classification, 'estimated_or_field_test');
  assert.ok(!result.follow_up.required_inputs.includes('vo2max_value'));
  assert.ok(!result.follow_up.required_inputs.includes('test_method'));
  assert.ok(!result.follow_up.required_inputs.includes('test_date'));
  assert.ok(!result.follow_up.required_inputs.includes('player_age'));
  assert.ok(!result.follow_up.required_inputs.includes('playing_position'));
  assert.ok(result.follow_up.required_inputs.includes('training_context'));
  assert.match(result.reply, /Schätzung bzw. Feldtestwert/);
  assert.equal(result.follow_up.score_created, false);
});

test('direct CPET values are distinguished from estimates', async () => {
  const { buildMessinhoKnowledgeApplicationFollowUp } = await import('../backend/messinho-conversation.js');
  const result = buildMessinhoKnowledgeApplicationFollowUp(
    'Wie bewerte ich VO2max 58 ml/kg/min, direkt gemessen per Spiroergometrie/CPET am 2026-10-20?',
    { conceptKey: 'sports_science.physiology.vo2max', player: { age: 21, positions: ['Mittelfeld'], training_status: 'Profi' } }
  );
  assert.equal(result.follow_up.method_classification, 'direct_cpet');
  assert.deepEqual(result.follow_up.required_inputs, []);
  assert.match(result.reply, /direkte CPET/);
  assert.equal(result.follow_up.estimated_value_created, false);
});

test('VO2max follow-up helper ignores unrelated knowledge concepts', async () => {
  const { buildMessinhoKnowledgeApplicationFollowUp } = await import('../backend/messinho-conversation.js');
  assert.equal(buildMessinhoKnowledgeApplicationFollowUp('Wie nutze ich das?', {
    conceptKey: 'mathematics.probability.bayes'
  }), null);
});


test('birth year alone is not treated as an exact player age', async () => {
  const { buildMessinhoKnowledgeApplicationFollowUp } = await import('../backend/messinho-conversation.js');
  const result = buildMessinhoKnowledgeApplicationFollowUp(
    'Wie bewerte ich die VO2max eines Spielers?',
    { conceptKey: 'sports_science.physiology.vo2max', player: { birth_year: 2007, positions: ['Mittelfeld'] } }
  );
  assert.ok(result);
  assert.ok(result.follow_up.required_inputs.includes('player_age'));
  assert.equal(result.follow_up.player_context.age_available, false);
});


test('a follow-up turn containing player data is recognized only after the VO2max clarification prompt', async () => {
  const { isMessinhoVo2maxApplicationDataReply, buildMessinhoKnowledgeApplicationFollowUp } = await import('../backend/messinho-conversation.js');
  assert.equal(isMessinhoVo2maxApplicationDataReply('56 ml/kg/min'), true);
  assert.equal(isMessinhoVo2maxApplicationDataReply('Wie ist das Wetter morgen?'), false);
  const result = buildMessinhoKnowledgeApplicationFollowUp(
    'Wie kann ich die VO2max für die Leistungsbewertung nutzen? Der Spieler hat 56 ml/kg/min, direkt gemessen per CPET am 2026-11-26, ist 19 Jahre alt, spielt im Mittelfeld und ist Profi.',
    { conceptKey: 'sports_science.physiology.vo2max', player: { age: 19, positions: ['Mittelfeld'], training_status: 'Profi' } }
  );
  assert.deepEqual(result.follow_up.required_inputs, []);
  assert.equal(result.follow_up.status, 'ready_for_descriptive_context_only');
  assert.equal(result.follow_up.comparative_norms_available, false);
  assert.equal(result.follow_up.score_created, false);
  assert.match(result.reply, /keine Normrangfolge/);
});

test('VO2max continuation preserves the original canonical question for knowledge lookup', async () => {
  const { buildMessinhoVo2maxApplicationQuery } = await import('../backend/messinho-conversation.js');
  const combined = buildMessinhoVo2maxApplicationQuery(
    'Wie kann ich VO2max für die Leistungsbewertung eines Fußballspielers nutzen?',
    '56 ml/kg/min, direkt per CPET am 26.11.2026 gemessen; Spieler 19 Jahre, Mittelfeld, Profi.',
    'Für eine konkrete Einordnung eines Spielers brauche ich die folgenden Angaben.'
  );
  assert.match(combined, /VO2max/);
  assert.match(combined, /56 ml\/kg\/min/);
  assert.equal(buildMessinhoVo2maxApplicationQuery(
    'Wie kann ich VO2max für die Leistungsbewertung nutzen?',
    'Wie ist das Wetter morgen?',
    'Für eine konkrete Einordnung eines Spielers brauche ich die folgenden Angaben.'
  ), null);
});


test('answers open-ended what-can-we-do questions without an external language provider',()=>{
 const reply=getMessinhoSocialReply('Was können wir machen?',[],new Date('2026-11-28T14:00:00'));
 assert.equal(typeof reply,'string');
 assert.match(reply,/Spieler|Scouting|Recherche|Plattform/);
 assert.equal(getMessinhoSocialReply('Was können wir machen, um einen U19-Stürmer zu finden?'),null);
});
