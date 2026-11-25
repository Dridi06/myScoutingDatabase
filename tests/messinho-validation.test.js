import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMessinhoScoutingRequest, matchesPosition, sourceSupportsRegion } from '../backend/messinho-validation.js';

test('parses a complete scouting request and caps the requested result count', () => {
  const result = parseMessinhoScoutingRequest('Ich brauche 20 linker Verteidiger Jahrgang 2004 in Deutschland, Regionalliga', [], 2026);
  assert.equal(result.shouldHandle, true);
  assert.deepEqual(result.missing, []);
  assert.equal(result.needsTargetLevel, false);
  assert.deepEqual(result.request, {
    quantity: 15, yearFrom: 2004, yearTo: 2004, position: 'linker Verteidiger',
    region: 'deutschland', targetLevel: 'Regionalliga'
  });
});

test('asks only for missing scouting criteria', () => {
  const result = parseMessinhoScoutingRequest('Ich suche 8 Talente in Deutschland', [], 2026);
  assert.equal(result.shouldHandle, true);
  assert.deepEqual(result.missing, ['Geburtsjahrgang', 'Position']);
});

test('retains criteria across a follow-up answer for target level', () => {
  const history = [
    { role: 'user', text: 'Ich brauche 10 linker Verteidiger Jahrgang 2004 in Deutschland' },
    { role: 'assistant', text: 'Welches Spielerlevel soll ich berücksichtigen?' }
  ];
  const result = parseMessinhoScoutingRequest('Regionalliga', history, 2026);
  assert.equal(result.shouldHandle, true);
  assert.equal(result.needsTargetLevel, false);
  assert.equal(result.request.yearFrom, 2004);
  assert.equal(result.request.position, 'linker Verteidiger');
  assert.equal(result.request.region, 'deutschland');
  assert.equal(result.request.targetLevel, 'Regionalliga');
});

test('does not turn a plain internal player lookup into a scouting discovery', () => {
  const result = parseMessinhoScoutingRequest('Suche Messi', [], 2026);
  assert.equal(result.shouldHandle, false);
});

test('parses year ranges and normalizes country aliases', () => {
  const result = parseMessinhoScoutingRequest('Suche 6 Innenverteidiger Jahrgang 2004 bis 2005 in Germany, 3. Liga', [], 2026);
  assert.equal(result.request.yearFrom, 2004);
  assert.equal(result.request.yearTo, 2005);
  assert.equal(result.request.region, 'deutschland');
  assert.equal(result.request.targetLevel, '3. Liga');
});

test('matches position abbreviations without substring false positives', () => {
  assert.equal(matchesPosition('linker Verteidiger', ['LB']), true);
  assert.equal(matchesPosition('linker Verteidiger', ['Left Back']), true);
  assert.equal(matchesPosition('linker Verteidiger', ['Central Midfielder']), false);
  assert.equal(matchesPosition('Innenverteidiger', ['CB']), true);
});

test('requires both the requested country and current club in the cited source evidence', () => {
  assert.equal(sourceSupportsRegion('deutschland', 'Germany - Borussia Dortmund squad', 'Borussia Dortmund'), true);
  assert.equal(sourceSupportsRegion('deutschland', 'Borussia Dortmund squad', 'Borussia Dortmund'), false);
  assert.equal(sourceSupportsRegion('deutschland', 'Germany - another club', 'Borussia Dortmund'), false);
});

test('supports common European country aliases', () => {
  assert.equal(sourceSupportsRegion('spanien', 'Spain - Real Madrid', 'Real Madrid'), true);
  assert.equal(sourceSupportsRegion('frankreich', 'French league - Paris Saint-Germain', 'Paris Saint-Germain'), true);
});
