import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { stepFrames } from '../src/loop.js';

test('une image a 60 Hz donne 1 pas', () => {
  assert.equal(stepFrames(0, 1 / 60).steps, 1);
});
test('0,1 s donne 6 pas', () => {
  assert.equal(stepFrames(0, 0.1).steps, 6);
});
test('onglet en arriere-plan (60 s) : au plus 0,25 / FIXED_DT pas', () => {
  const { steps } = stepFrames(0, 60);
  assert.ok(steps <= Math.round(CONFIG.MAX_FRAME_DT / CONFIG.FIXED_DT));
  assert.ok(steps > 0);
});
test('le reste est toujours >= 0 et < FIXED_DT', () => {
  let acc = 0;
  for (const dt of [0.001, 0.016, 0.017, 0.05, 0.2, 1, 0]) {
    const r = stepFrames(acc, dt);
    assert.ok(r.accumulator >= 0 && r.accumulator < CONFIG.FIXED_DT, `dt ${dt}`);
    acc = r.accumulator;
  }
});
test('dt negatif ou NaN ne produit aucun pas', () => {
  assert.equal(stepFrames(0, -1).steps, 0);
  assert.equal(stepFrames(0, NaN).steps, 0);
});
