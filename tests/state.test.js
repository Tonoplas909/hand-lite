import test from 'node:test';
import assert from 'node:assert/strict';
import { nextState } from '../src/state.js';

const cases = [
  ['title', 'start', 'run'],
  ['run', 'roomCleared', 'upgrade'],
  ['upgrade', 'upgradePicked', 'run'],
  ['run', 'pause', 'pause'],
  ['pause', 'resume', 'run'],
  ['run', 'playerDead', 'end'],
  ['run', 'bossDefeated', 'end'],
  ['end', 'toTitle', 'title'],
  ['title', 'roomCleared', 'title'],
  ['upgrade', 'pause', 'upgrade'],
];
for (const [from, ev, to] of cases) {
  test(`${from} + ${ev} -> ${to}`, () => assert.equal(nextState(from, ev), to));
}
test('etat inconnu ne leve pas d exception', () => assert.equal(nextState('???', 'start'), '???'));
