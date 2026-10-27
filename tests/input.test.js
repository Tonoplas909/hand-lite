import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BINDINGS, actionsFromKeys, moveVector, rebind } from '../src/input.js';

const keys = (...codes) => actionsFromKeys(new Set(codes));

test('KeyW seul donne haut', () => assert.equal(keys('KeyW').haut, true));
test('ArrowUp seul donne haut', () => assert.equal(keys('ArrowUp').haut, true));
test('KeyA + ArrowRight donne gauche et droite', () => {
  const a = keys('KeyA', 'ArrowRight');
  assert.equal(a.gauche, true);
  assert.equal(a.droite, true);
});
test('gauche + droite annulent l axe x', () => {
  assert.equal(moveVector(keys('KeyA', 'KeyD')).x, 0);
});
test('diagonale normalisee', () => {
  const v = moveVector(keys('KeyW', 'KeyD'));
  assert.ok(Math.abs(Math.hypot(v.x, v.y) - 1) < 1e-9);
});
test('sans touche, vecteur nul sans NaN', () => {
  assert.deepEqual(moveVector(keys()), { x: 0, y: 0 });
});
test('rebind remplace la touche sans toucher l original', () => {
  const b = rebind(DEFAULT_BINDINGS, 'dash', 'KeyE');
  assert.equal(actionsFromKeys(new Set(['KeyE']), b).dash, true);
  assert.deepEqual(DEFAULT_BINDINGS.dash, ['Space']);
});
