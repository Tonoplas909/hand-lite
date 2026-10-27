import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { createBoss, bossPhase, updateBoss, damageEnemy } from '../src/enemies.js';

const player = { x: 700, y: 300, radius: 12 };
const bossAt = (ratio) => {
  const b = createBoss(200, 300);
  b.hp = CONFIG.BOSS.hp * ratio;
  return b;
};

test('createBoss : type boss, pleine vie, phase 1', () => {
  const b = createBoss(10, 10);
  assert.equal(b.type, 'boss');
  assert.equal(b.hp, CONFIG.BOSS.hp);
  assert.equal(b.phase, 1);
});

test('bossPhase renvoie 1/2/3 a 100 %, 50 % et 20 % de PV', () => {
  assert.equal(bossPhase(bossAt(1)), 1);
  assert.equal(bossPhase(bossAt(0.5)), 2);
  assert.equal(bossPhase(bossAt(0.2)), 3);
});

test('phase 1 : 12 projectiles espaces de 2π/12 apres 1,5 s, aucune invocation', () => {
  const out = updateBoss(bossAt(1), player, 1.5);
  assert.equal(out.projectiles.length, 12);
  assert.equal(out.summons.length, 0);
  const angles = out.projectiles.map((p) => Math.atan2(p.vy, p.vx)).sort((a, b) => a - b);
  for (let i = 1; i < angles.length; i++) {
    assert.ok(Math.abs(angles[i] - angles[i - 1] - (2 * Math.PI) / 12) < 1e-9);
  }
});

test('phase 1 : le boss ne charge pas', () => {
  const b = bossAt(1);
  updateBoss(b, player, 2.5);
  assert.equal(b.x, 200);
});

test('phase 2 : apres 2,5 s le boss s est deplace vers le joueur', () => {
  const b = bossAt(0.5);
  updateBoss(b, player, 2.5);
  assert.ok(b.x > 200);
  assert.ok(Math.abs(b.y - 300) < 1e-9);
});

test('phase 3 : 3 invocations de rodeurs apres 5 s', () => {
  const out = updateBoss(bossAt(0.2), player, 5);
  assert.equal(out.summons.length, 3);
  assert.ok(out.summons.every((s) => s.type === 'rodeur'));
});

test('aucun NaN quand le boss est sur le joueur', () => {
  const b = bossAt(0.2);
  b.x = player.x; b.y = player.y;
  updateBoss(b, player, 5);
  assert.ok(!Number.isNaN(b.x) && !Number.isNaN(b.y));
});

test('le boss est blessable avec damageEnemy', () => {
  const b = createBoss(0, 0);
  assert.equal(damageEnemy(b, 150), true);
});
