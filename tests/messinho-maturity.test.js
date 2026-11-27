import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMessinhoMaturityReport } from '../backend/messinho-maturity.js';

test('maturity report uses a 100-point rubric and honest current level',()=>{
 const report=buildMessinhoMaturityReport();
 assert.equal(report.maximum,100);
 assert.equal(report.score,42);
 assert.equal(report.level,'Erweiterter Agent');
 assert.equal(report.pillars.reduce((sum,item)=>sum+item.maximum,0),100);
 assert.equal(report.pillars.reduce((sum,item)=>sum+item.points,0),report.score);
});

test('forecasting and engineering cannot receive premium points without validation',()=>{
 const report=buildMessinhoMaturityReport();
 const forecast=report.pillars.find(item=>item.id==='forecasting');
 const engineering=report.pillars.find(item=>item.id==='engineering');
 assert.equal(forecast.status,'nicht_validiert');
 assert.equal(forecast.points,2);
 assert.equal(engineering.status,'nicht_freigeschaltet');
 assert.ok(report.release_gate.includes('100 Punkte'));
 assert.ok(report.next_milestones.length>=4);
});
