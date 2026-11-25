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
