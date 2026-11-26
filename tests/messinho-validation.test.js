import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMessinhoScoutingRequest, matchesPosition, sourceSupportsRegion } from '../backend/messinho-validation.js';

test('parses a complete scouting request and caps the requested result count', () => {
  const result = parseMessinhoScoutingRequest('Ich brauche 20 linker Verteidiger Jahrgang 2004 in Deutschland, Regionalliga', [], 2026);
  assert.equal(result.shouldHandle, true);
  assert.deepEqual(result.missing, []);
  assert.equal(result.needsTargetLevel, false);
  assert.deepEqual(result.request, {
    quantity: 15, yearFrom: 2004, yearTo: 2004, ageGroup: null, position: 'linker Verteidiger',
    region: 'deutschland', targetLevel: 'Regionalliga'
  });
});

test('asks only for missing scouting criteria', () => {
  const result = parseMessinhoScoutingRequest('Ich suche 8 Talente in Deutschland', [], 2026);
  assert.equal(result.shouldHandle, true);
  assert.deepEqual(result.missing, ['Geburtsjahrgang oder Altersklasse', 'Position']);
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

test('does not repeat a completed search when the user only says thanks', () => {
  const history = [
    { role: 'user', text: 'Ich brauche 10 linker Verteidiger Jahrgang 2004 in Deutschland, Regionalliga' },
    { role: 'assistant', text: 'Die vorhandene ASI-Recherche wurde mit deinen Kriterien ausgeführt.' }
  ];
  assert.equal(parseMessinhoScoutingRequest('Danke', history, 2026).shouldHandle, false);
});

test('a new scouting request does not inherit filters from the previous request', () => {
  const history = [
    { role: 'user', text: 'Ich brauche 10 linker Verteidiger Jahrgang 2004 in Deutschland, Regionalliga' },
    { role: 'assistant', text: 'Die Recherche ist abgeschlossen.' }
  ];
  const result = parseMessinhoScoutingRequest('Suche 5 Innenverteidiger Jahrgang 2005 in Spanien, 3. Liga', history, 2026);
  assert.equal(result.request.yearFrom, 2005);
  assert.equal(result.request.yearTo, 2005);
  assert.equal(result.request.position, 'Innenverteidiger');
  assert.equal(result.request.region, 'spanien');
  assert.equal(result.request.targetLevel, '3. Liga');
  assert.equal(result.request.quantity, 5);
});


test('autonomously parses the exact U19 midfield scouting request without follow-up questions', () => {
  const result = parseMessinhoScoutingRequest(
    'Identifiziere drei interessante U19-Mittelfeldspieler aus Deutschland für den leistungsorientierten Vereinsfußball',
    [],
    2026
  );
  assert.equal(result.shouldHandle, true);
  assert.deepEqual(result.missing, []);
  assert.equal(result.needsTargetLevel, false);
  assert.deepEqual(result.request, {
    quantity: 3, yearFrom: null, yearTo: null, ageGroup: 'U19',
    position: 'Mittelfeldspieler', region: 'deutschland', targetLevel: ''
  });
});

test('generic midfielder filter matches central, defensive and attacking midfield roles', () => {
  assert.equal(matchesPosition('Mittelfeldspieler', ['Central Midfielder']), true);
  assert.equal(matchesPosition('Mittelfeldspieler', ['Defensive Midfielder']), true);
  assert.equal(matchesPosition('Mittelfeldspieler', ['Attacking Midfielder']), true);
  assert.equal(matchesPosition('Mittelfeldspieler', ['Centre Back']), false);
});

test('U19 age group is sufficient without an exact birth year and league level is optional', () => {
  const result = parseMessinhoScoutingRequest('Suche U19-Mittelfeldspieler aus Deutschland', [], 2026);
  assert.deepEqual(result.missing, []);
  assert.equal(result.request.ageGroup, 'U19');
  assert.equal(result.needsTargetLevel, false);
});

test('recognizes U19, U-19 and U 19 as the same age group', () => {
  for (const phrase of ['U19-Mittelfeldspieler', 'U-19-Mittelfeldspieler', 'U 19-Mittelfeldspieler']) {
    const result = parseMessinhoScoutingRequest('Suche drei ' + phrase + ' aus Deutschland', [], 2026);
    assert.equal(result.shouldHandle, true, phrase);
    assert.deepEqual(result.missing, [], phrase);
    assert.equal(result.request.ageGroup, 'U19', phrase);
    assert.equal(result.request.position, 'Mittelfeldspieler', phrase);
    assert.equal(result.request.region, 'deutschland', phrase);
    assert.equal(result.request.quantity, 3, phrase);
  }
});
