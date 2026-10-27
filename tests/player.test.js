import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { createPlayer, updatePlayer, isInvulnerable, damagePlayer, isDead } from '../src/player.js';

const NONE = { haut: false, bas: false, gauche: false, droite: false, dash: false, pause: false };
const act = (o) => ({ ...NONE, ...o });
const run = (p, actions, seconds, dt = 1 / 60) => {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) updatePlayer(p, actions, dt);
};

test('vitesse 220 px/s vers la droite sur 1 s', () => {
  const p = createPlayer();
  const x0 = p.x;
  run(p, act({ droite: true }), 1);
  assert.ok(Math.abs(p.x - x0 - 220) < 1);
});

test('la diagonale n est pas plus rapide que l axe', () => {
  const p = createPlayer();
  const { x, y } = p;
  run(p, act({ droite: true, bas: true }), 0.5);
  assert.ok(Math.hypot(p.x - x, p.y - y) <= 110 + 1);
});

test('le joueur ne sort pas de l arene', () => {
  const p = createPlayer();
  run(p, act({ gauche: true, haut: true }), 10);
  assert.ok(p.x >= p.radius && p.y >= p.radius);
  run(p, act({ droite: true, bas: true }), 20);
  assert.ok(p.x <= CONFIG.ARENA.w - p.radius && p.y <= CONFIG.ARENA.h - p.radius);
});

test('le dash rend invulnerable pendant 0,3 s puis plus', () => {
  const p = createPlayer();
  updatePlayer(p, act({ dash: true, droite: true }), 1 / 60);
  assert.equal(isInvulnerable(p), true);
  run(p, act({}), 0.35);
  assert.equal(isInvulnerable(p), false);
});

test('une seconde demande de dash avant 1,2 s est ignoree', () => {
  const p = createPlayer();
  updatePlayer(p, act({ dash: true, droite: true }), 1 / 60);
  run(p, act({}), 0.5);
  updatePlayer(p, act({ dash: true }), 1 / 60);
  assert.equal(isInvulnerable(p), false);
  run(p, act({}), 0.8);
  updatePlayer(p, act({ dash: true }), 1 / 60);
  assert.equal(isInvulnerable(p), true);
});

test('dash sans direction tenue part dans facing', () => {
  const p = createPlayer();
  p.facing = { x: 0, y: 1 };
  const { x, y } = p;
  run(p, act({ dash: true }), 0.2);
  assert.ok(p.y > y + 50);
  assert.ok(Math.abs(p.x - x) < 1e-6);
  assert.ok(!Number.isNaN(p.x) && !Number.isNaN(p.y));
});

test('damagePlayer renvoie false pendant l invulnerabilite', () => {
  const p = createPlayer();
  assert.equal(damagePlayer(p), true);
  assert.equal(p.hearts, 2);
  assert.equal(damagePlayer(p), false);
  assert.equal(p.hearts, 2);
});

test('deux degats espaces retirent 2 coeurs, isDead apres 3', () => {
  const p = createPlayer();
  damagePlayer(p);
  run(p, act({}), CONFIG.PLAYER.hitInvuln + 0.1);
  damagePlayer(p);
  assert.equal(p.hearts, 1);
  assert.equal(isDead(p), false);
  run(p, act({}), CONFIG.PLAYER.hitInvuln + 0.1);
  damagePlayer(p);
  assert.equal(isDead(p), true);
});
