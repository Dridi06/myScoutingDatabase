import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateMessinhoMathQuestion } from '../backend/messinho-math.js';
test('arithmetic precedence and parentheses',()=>{assert.equal(calculateMessinhoMathQuestion('Berechne 2 + 3 * 4').value,14);assert.equal(calculateMessinhoMathQuestion('Berechne (2 + 3) * 4').value,20);assert.equal(calculateMessinhoMathQuestion('12 geteilt durch 3').value,4);});
test('percentages, fractions and rule of three',()=>{assert.equal(calculateMessinhoMathQuestion('15 Prozent von 200').value,30);assert.equal(calculateMessinhoMathQuestion('Bruch 3/4').value,0.75);assert.equal(calculateMessinhoMathQuestion('Dreisatz 4 entsprechen 12, 10 entsprechen x').value,30);});
test('binomial scouting probability',()=>{const r=calculateMessinhoMathQuestion('Binomialverteilung n=10 p=0.7 k=7');assert.equal(r.kind,'probability');assert.ok(Math.abs(r.value-26.682793)<1e-6);});
test('Poisson probability',()=>{const r=calculateMessinhoMathQuestion('Poissonverteilung lambda=2 k=1');assert.ok(Math.abs(r.value-27.0670566473)<1e-6);});
test('Bayes posterior',()=>{const r=calculateMessinhoMathQuestion('Bayes a=0.2 b=0.8 c=0.1');assert.ok(Math.abs(r.value-66.6666666667)<1e-6);});
test('physics formulas',()=>{assert.equal(calculateMessinhoMathQuestion('Newton Kraft m=80 a=3').value,240);assert.equal(calculateMessinhoMathQuestion('Kinetische Energie m=2 v=3').value,9);assert.equal(calculateMessinhoMathQuestion('Dichte m=100 volumen=2').value,50);});
test('rejects division by zero and executable-looking input',()=>{assert.equal(calculateMessinhoMathQuestion('Berechne 1 / 0').status,'invalid_input');assert.equal(calculateMessinhoMathQuestion('Berechne process.exit()'),null);});
test('ignores ordinary conversation',()=>{assert.equal(calculateMessinhoMathQuestion('Wie geht es dir?'),null);});

test('Wilson confidence interval for scouting conversion rates',()=>{const r=calculateMessinhoMathQuestion('Wilson Konfidenzintervall n=100 k=20');assert.equal(r.kind,'probability');assert.equal(r.unit,'%');assert.ok(r.confidence_interval.lower<0.2&&r.confidence_interval.upper>0.2);});
test('additional physics formulas',()=>{assert.equal(calculateMessinhoMathQuestion('Hooke Federkraft k=100 x=0.2').value,20);assert.equal(calculateMessinhoMathQuestion('Ohm Widerstand u=12 i=2').value,6);assert.equal(calculateMessinhoMathQuestion('Mechanische Arbeit kraft=10 s=5').value,50);});
