import test from 'node:test';
import assert from 'node:assert/strict';
import { isMessinhoAdminOnlyCommand } from '../backend/messinho-command-access.js';

test('blocks Scout requests to change MESSINHO or system state',()=>{
  for(const input of [
    'Stoppe Messinho',
    'Bitte pausiere die autonome Entwicklung',
    'Aktiviere den Entwicklungsmodus von MESSINHO',
    'Ändere die Systemregeln',
    'Importiere neues Wissen in Messinhos Wissensbasis',
    'Gib das neue Modell frei',
    'Ändere die Rollen und Rechte',
    'Integriere diesen Code in das System'
  ]) assert.equal(isMessinhoAdminOnlyCommand(input),true,input);
});

test('keeps ordinary scouting and conversational requests available',()=>{
  for(const input of [
    'Suche einen linken Flügelspieler Jahrgang 2008',
    'Vergleiche diese beiden Spieler',
    'Erkläre mir das Pressing im 4-3-3',
    'Was kannst du?',
    'Woran arbeitest du gerade?'
  ]) assert.equal(isMessinhoAdminOnlyCommand(input),false,input);
});

test('normalizes unicode and safely handles empty or non-string input',()=>{
  assert.equal(isMessinhoAdminOnlyCommand('  ÄNDERE die Systemkonfiguration  '),true);
  assert.equal(isMessinhoAdminOnlyCommand(''),false);
  assert.equal(isMessinhoAdminOnlyCommand(null),false);
});
