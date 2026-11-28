import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const component = await readFile(new URL('../src/asi/MyKiChat.jsx', import.meta.url), 'utf8');

test('manual MESSINHO diagnosis is a separate one-shot action', () => {
  assert.match(component, /fetch\('\/api\/admin\/messinho-diagnostics\/run'/);
  assert.match(component, /Diagnose starten/);
  assert.match(component, /Ändert keinen Autonomie-Modus und startet keine Reparatur/);
});

test('autonomous controls remain distinct from the manual diagnostic action', () => {
  assert.match(component, /changeControl\('set_mode','paused'\)/);
  assert.match(component, /changeControl\('set_mode','working'\)/);
  assert.match(component, /changeControl\('set_mode','developing'\)/);
  assert.match(component, /changeControl\('stop'\)/);
  assert.match(component, /Fehleranalyse & Reparaturprüfung/);
  assert.match(component, /Weiterentwicklung/);
  assert.match(component, /Stopp anfordern/);
});
