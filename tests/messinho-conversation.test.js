import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyMessinhoProviderFailure, getMessinhoSmallTalkReply } from '../backend/messinho-conversation.js';

test('MESSINHO answers a greeting naturally without requiring an AI provider', () => {
  assert.equal(getMessinhoSmallTalkReply('Hallo'), 'Hallo! Schön, dass du da bist. Wie geht es dir?');
  assert.equal(getMessinhoSmallTalkReply('Hi MESSINHO!'), 'Hallo! Schön, dass du da bist. Wie geht es dir?');
});

test('MESSINHO answers how-are-you conversationally and invites a reply', () => {
  assert.equal(getMessinhoSmallTalkReply('Wie geht’s dir?'), 'Mir geht es gut, danke! Und wie geht es dir?');
  assert.match(getMessinhoSmallTalkReply('Mir geht es gut und dir?'), /Was steht bei dir heute an/);
});

test('MESSINHO handles thanks and goodbye as everyday conversation', () => {
  assert.match(getMessinhoSmallTalkReply('Danke dir!'), /Sehr gern/);
  assert.match(getMessinhoSmallTalkReply('Tschüss'), /Bis bald/);
});

test('ordinary messages are not swallowed by the small-talk shortcut', () => {
  assert.equal(getMessinhoSmallTalkReply('Suche drei U19-Mittelfeldspieler'), null);
  assert.equal(getMessinhoSmallTalkReply('Erkläre mir das Pressing'), null);
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
