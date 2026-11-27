import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('MESSINHO system prompt injects the approved hierarchical knowledge context only once', async () => {
  const source = await readFile(new URL('../backend/server.js', import.meta.url), 'utf8');
  const matches = source.match(/HIERARCHISCHES, FREIGEGEBENES MESSINHO-FACHWISSEN/g) || [];
  assert.equal(matches.length, 1, 'approved knowledge context must not be duplicated in the system prompt');
});


test('MESSINHO system prompt does not force German when the user writes in another supported language',async()=>{
  const source=await readFile(new URL('../backend/server.js',import.meta.url),'utf8');
  assert.match(source,/Führe echte Gespräche in der Sprache der letzten Nutzernachricht/);
  assert.doesNotMatch(source,/Führe echte Gespräche auf Deutsch/);
});
