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
  const fuzzy = correctMessinhoInput('Suche einen spielr aus Deutchland', { language: 'de' });
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
