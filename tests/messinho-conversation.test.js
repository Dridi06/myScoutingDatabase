import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMessinhoProviderFailure, classifyMessinhoSocialIntent, getMessinhoSocialReply } from '../backend/messinho-conversation.js';

const fixedMorning = new Date('2026-11-26T08:00:00');
const history = [];

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
