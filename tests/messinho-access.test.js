import test from 'node:test';
import assert from 'node:assert/strict';
import { scopeMessinhoOwner } from '../backend/messinho-access.js';

function queryRecorder() {
  return {
    filters: [],
    eq(column,value) { this.filters.push([column,value]); return this; }
  };
}

test('scout queries are always scoped to the authenticated owner', () => {
  const query = queryRecorder();
  const result = scopeMessinhoOwner(query,{user:{id:'scout-123'},profile:{role:'scout'}});
  assert.equal(result,query);
  assert.deepEqual(query.filters,[['owner_id','scout-123']]);
});

test('admin queries retain intended global visibility', () => {
  const query = queryRecorder();
  scopeMessinhoOwner(query,{user:{id:'admin-1'},profile:{role:'admin'}});
  assert.deepEqual(query.filters,[]);
});

test('missing actor and unsupported roles fail closed', () => {
  assert.throws(()=>scopeMessinhoOwner(queryRecorder(),null),/Authenticated/);
  assert.throws(()=>scopeMessinhoOwner(queryRecorder(),{user:{id:'user'},profile:{role:'player'}}),/Authenticated/);
  assert.throws(()=>scopeMessinhoOwner(queryRecorder(),{user:{id:null},profile:{role:'scout'}}),/Authenticated/);
});
