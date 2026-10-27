import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { ENEMY_TYPES, createEnemy, updateEnemy, damageEnemy, touchesPlayer } from '../src/enemies.js';

const player = { x: 500, y: 300, radius: 12 };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

test('ENEMY_TYPES liste les 5 types', () => {
  assert.deepEqual(ENEMY_TYPES, ['rodeur', 'tireur', 'lourd', 'essaim', 'kamikaze']);
});

test('les ids sont uniques et croissants', () => {
  const a = createEnemy('rodeur', 0, 0);
  const b = createEnemy('rodeur', 0, 0);
  assert.ok(b.id > a.id);
});

test('le rodeur se rapproche de speed*dt', () => {
  const e = createEnemy('rodeur', 100, 300);
  const d0 = dist(e, player);
  updateEnemy(e, player, 0.5);
  assert.ok(Math.abs(d0 - dist(e, player) - CONFIG.ENEMIES.rodeur.speed * 0.5) < 1e-9);
});

test('le lourd est plus lent que le rodeur, l essaim plus rapide', () => {
  const move = (type) => {
    const e = createEnemy(type, 100, 300);
    updateEnemy(e, player, 1);
    return e.x - 100;
  };
  assert.ok(move('lourd') < move('rodeur'));
  assert.ok(move('essaim') > move('rodeur'));
});

test('le tireur s approche hors portee, s arrete a portee et tire apres 1,6 s', () => {
  const far = createEnemy('tireur', 500 - 400, 300);
  updateEnemy(far, player, 0.5);
  assert.ok(far.x > 100);

  const near = createEnemy('tireur', 500 - 200, 300);
  const x0 = near.x;
  let out = updateEnemy(near, player, 1.59);
  assert.equal(near.x, x0);
  assert.equal(out.projectiles.length, 0);
  out = updateEnemy(near, player, 0.02);
  assert.equal(out.projectiles.length, 1);
  assert.ok(out.projectiles[0].vx > 0);
  assert.equal(out.projectiles[0].damage, 1);
});

test('le kamikaze explose 0,6 s apres le contact', () => {
  const e = createEnemy('kamikaze', player.x + 5, player.y);
  let out = updateEnemy(e, player, 0.59);
  assert.equal(out.explosion, null);
  assert.ok(e.hp > 0);
  out = updateEnemy(e, player, 0.02);
  assert.equal(out.explosion.radius, 60);
  assert.equal(e.hp, 0);
});

test('damageEnemy renvoie true quand hp tombe a 0', () => {
  const e = createEnemy('rodeur', 0, 0);
  assert.equal(damageEnemy(e, 1), false);
  assert.equal(damageEnemy(e, 5), true);
  assert.equal(e.hp <= 0, true);
});

test('touchesPlayer vrai/faux selon la distance', () => {
  assert.equal(touchesPlayer(createEnemy('rodeur', player.x + 15, player.y), player), true);
  assert.equal(touchesPlayer(createEnemy('rodeur', player.x + 100, player.y), player), false);
});

test('aucun NaN si l ennemi est exactement sur le joueur', () => {
  for (const type of ENEMY_TYPES) {
    const e = createEnemy(type, player.x, player.y);
    updateEnemy(e, player, 0.1);
    assert.ok(!Number.isNaN(e.x) && !Number.isNaN(e.y), type);
  }
});
