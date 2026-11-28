import test from 'node:test';
import assert from 'node:assert/strict';
import { correctMessinhoInput } from '../backend/messinho-input-correction.js';

test('corrects common German spelling and split-word errors', () => {
  const result = correctMessinhoInput('Such mir ein sturmer der schnell ist und gut ab schlissen kann');
  assert.equal(result.corrected, 'Such mir einen Stürmer der schnell ist und gut abschließen kann');
  assert.equal(result.changed, true);
});

test('corrects common intent and scouting typos', () => {
  const result = correctMessinhoInput('Suhce 5 spiler aus Deutchland');
  assert.match(result.corrected, /Suche 5 spieler aus deutschland/i);
});

test('preserves unknown words and player names rather than guessing', () => {
  const input = 'Finde Messi und Xqzv Spieler';
  const result = correctMessinhoInput(input);
  assert.equal(result.corrected, input);
});

test('returns the original request unchanged when no correction is needed', () => {
  const input = 'Suche einen schnellen Stürmer mit gutem Abschluss';
  const result = correctMessinhoInput(input);
  assert.equal(result.corrected, input);
  assert.equal(result.changed, false);
});


test('does not apply the German correction dictionary to other language profiles', () => {
  for (const language of ['en', 'fr', 'es', 'ar', 'ar-tn', 'mixed', null]) {
    const input = 'Chnowa rayek fel joueur hedha?';
    const result = correctMessinhoInput(input, { language });
    assert.equal(result.corrected, input, language);
    assert.equal(result.changed, false, language);
    assert.equal(result.skipped_reason, 'language_specific_correction_not_available', language);
  }
});

test('high-confidence German corrections are marked separately from fuzzy suggestions', () => {
  const exact = correctMessinhoInput('Suhce 5 spiler aus Deutchland', { language: 'de' });
  assert.equal(exact.confidence, 'high');
  const fuzzy = correctMessinhoInput('Suche einen Spieler mit schnelligkeitt', { language: 'de' });
  assert.equal(fuzzy.confidence, 'medium');
  assert.equal(fuzzy.changed, true);
});

test('preserves proper names and unknown words in German football requests', () => {
  const input = 'Vergleiche Kylian Mbappé mit Lionel Messi und Xqzv.';
  const result = correctMessinhoInput(input, { language: 'de' });
  assert.match(result.corrected, /Kylian Mbappé/);
  assert.match(result.corrected, /Lionel Messi/);
  assert.match(result.corrected, /Xqzv/);
});


test('authenticated chat applies only high-confidence German corrections to semantic routing', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(new URL('../backend/server.js', import.meta.url), 'utf8');
  assert.match(source, /buildMessinhoLinguisticContext\(message,history\)/);
  assert.match(source, /hasNonGermanSegment=baseLinguisticContext\.segments\.some/);
  assert.match(source, /correctMessinhoInput\(message,\{language:correctionLanguage\}\)/);
  assert.match(source, /correction\.changed&&correction\.confidence==='high'&&correction\.language==='de'/);
  assert.match(source, /message:interpretedMessage/);
  assert.match(source, /input_interpretation:inputInterpretation/);
  assert.match(source, /suggested:correction\.corrected/);
});

test('semantic router treats medium corrections as suggestions and preserves entities', async () => {
  const { buildMessinhoCognitiveRouterMessages } = await import('../backend/messinho-conversational-intelligence.js');
  const interpretation = {
    original_message: 'Suche einen spielr aus Deutchland',
    normalized_message: 'Suche einen spielr aus Deutchland',
    correction_status: 'suggested',
    correction_confidence: 'medium',
    correction_suggestions: [{ from: 'spielr', to: 'spieler', kind: 'contextual_spelling' }]
  };
  const messages = buildMessinhoCognitiveRouterMessages({
    message: interpretation.normalized_message,
    linguisticContext: { input_interpretation: interpretation }
  });
  const payload = JSON.parse(messages[1].content);
  assert.equal(payload.linguistic_context.input_interpretation.correction_status, 'suggested');
  assert.equal(payload.linguistic_context.input_interpretation.normalized_message, interpretation.original_message);
  assert.match(messages[0].content, /Medium-confidence spelling matches are suggestions/);
});
