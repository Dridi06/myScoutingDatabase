import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMessinhoScoutingRequest } from '../backend/messinho-validation.js';
import { sanitizeMessinhoHistory } from '../backend/messinho-engine.js';

test('a bare birth-year range follows the previous conversation instead of becoming subtraction', () => {
  const history = [
    { role: 'user', text: 'Wir sprechen über den Geburtsjahrgang von Spielern.' },
    { role: 'assistant', text: 'Wir hatten den Geburtsjahrgang als Thema.' }
  ];
  const result = parseMessinhoScoutingRequest('2004-2006', history, 2026);
  assert.equal(result.shouldHandle, false);
  assert.equal(result.request.yearFrom, 2004);
  assert.equal(result.request.yearTo, 2006);
});

test('a later scouting request carries forward the discussed birth-year range', () => {
  const history = [
    { role: 'user', text: 'Ich suche Spieler aus dem Geburtsjahrgang 2004 bis 2006.' },
    { role: 'assistant', text: 'Verstanden. Welche Position und welches Land?' }
  ];
  const result = parseMessinhoScoutingRequest('Suche Spieler', history, 2026);
  assert.equal(result.shouldHandle, true);
  assert.equal(result.request.yearFrom, 2004);
  assert.equal(result.request.yearTo, 2006);
});

test('sanitized conversation context retains up to the latest 20 messages', () => {
  const history = Array.from({ length: 25 }, (_, index) => ({
    role: index % 2 ? 'assistant' : 'user',
    text: 'Nachricht ' + index
  }));
  const safe = sanitizeMessinhoHistory(history);
  assert.equal(safe.length, 20);
  assert.equal(safe[0].text, 'Nachricht 5');
  assert.equal(safe.at(-1).text, 'Nachricht 24');
});
