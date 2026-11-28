import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../src/asi/MyKiOperations.jsx', import.meta.url), 'utf8');

test('manual project diagnosis runs both system and MESSINHO checks as separate one-shot actions', () => {
  assert.match(component, /api\/admin\/system-diagnostics\/run/);
  assert.match(component, /api\/admin\/messinho-diagnostics\/run/);
  assert.match(component, /Diagnose starten/);
  assert.match(component, /Gesamtprojekt und MESSINHO-Agent/);
});

test('autonomous development controls remain distinct from diagnostic execution', () => {
  assert.match(component, /action:'set_mode',mode/);
  assert.match(component, /setMode\('developing'\)/);
  assert.match(component, /setMode\('paused'\)/);
  assert.match(component, /action:'stop'/);
  assert.match(component, /Entwicklung starten/);
  assert.match(component, /Entwicklung pausieren/);
  assert.match(component, /Entwicklung beenden/);
  assert.match(component, /Unterbrechung wird serverseitig noch nicht unterstützt/);
});
