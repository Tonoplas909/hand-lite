import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createWeapon, nearestEnemy, updateWeapon, updateProjectile, orbPositions, projectileHits,
} from '../src/weapons.js';

const enemy = (id, x, y, hp = 3) => ({ id, x, y, radius: 10, hp });
const owner = { x: 100, y: 100 };

test('nearestEnemy choisit le plus proche et ignore les morts', () => {
  const list = [enemy(1, 150, 100), enemy(2, 120, 100, 0), enemy(3, 400, 100)];
  assert.equal(nearestEnemy(owner, list).id, 1);
});
test('nearestEnemy sur liste vide renvoie null', () => {
  assert.equal(nearestEnemy(owner, []), null);
});

test('pistolet : rien avant 0,4 s, un projectile a 0,4 s vers l ennemi', () => {
  const w = createWeapon('pistolet');
  const e = [enemy(1, 200, 100)];
  assert.equal(updateWeapon(w, owner, e, 0.39).length, 0);
  const shots = updateWeapon(w, owner, e, 0.02);
  assert.equal(shots.length, 1);
  assert.ok(shots[0].vx > 0 && Math.abs(shots[0].vy) < 1e-9);
});

test('aucun ennemi vivant : tableau vide sans exception', () => {
  const w = createWeapon('pistolet');
  assert.deepEqual(updateWeapon(w, owner, [], 5), []);
  assert.deepEqual(updateWeapon(w, owner, [enemy(1, 150, 100, 0)], 5), []);
});

test('eventail : 5 projectiles sur 0,8 rad centres sur la cible', () => {
  const w = createWeapon('eventail');
  const shots = updateWeapon(w, owner, [enemy(1, 200, 100)], 0.7);
  assert.equal(shots.length, 5);
  const angles = shots.map((s) => Math.atan2(s.vy, s.vx)).sort((a, b) => a - b);
  assert.ok(Math.abs(angles[4] - angles[0] - 0.8) < 1e-9);
  assert.ok(Math.abs((angles[0] + angles[4]) / 2) < 1e-9);
});

test('laser traverse deux ennemis alignes, le pistolet un seul', () => {
  const aligned = () => [enemy(1, 150, 100), enemy(2, 150, 100)];
  const laser = updateWeapon(createWeapon('laser'), owner, aligned(), 0.9)[0];
  assert.equal(laser.pierce, 99);
  assert.equal(projectileHits(laser, aligned()).length, 2);
  const pist = updateWeapon(createWeapon('pistolet'), owner, aligned(), 0.4)[0];
  const hit = projectileHits({ ...pist, x: 150, y: 100 }, aligned());
  assert.equal(hit.length, 1);
});

test('un projectile ne touche jamais deux fois le meme ennemi', () => {
  const laser = updateWeapon(createWeapon('laser'), owner, [enemy(1, 150, 100)], 0.9)[0];
  const e = [enemy(1, 150, 100)];
  assert.equal(projectileHits(laser, e).length, 1);
  assert.equal(projectileHits(laser, e).length, 0);
});

test('un projectile non perçant est consomme au premier impact', () => {
  const p = updateWeapon(createWeapon('pistolet'), owner, [enemy(1, 150, 100)], 0.4)[0];
  projectileHits(p, [enemy(1, 150, 100)]);
  assert.ok(p.pierce < 0);
});

test('updateProjectile renvoie false apres range px', () => {
  const w = createWeapon('pistolet');
  const p = updateWeapon(w, owner, [enemy(1, 900, 100)], 0.4)[0];
  let alive = true;
  let steps = 0;
  while (alive && steps < 1000) { alive = updateProjectile(p, 1 / 60); steps++; }
  assert.equal(alive, false);
  assert.ok(steps * 7 >= 320 - 7 && steps * 7 <= 320 + 7);
});

test('orbPositions : 3 points a 50 px du joueur', () => {
  const w = createWeapon('orbes');
  const pts = orbPositions(w, owner);
  assert.equal(pts.length, 3);
  for (const p of pts) assert.ok(Math.abs(Math.hypot(p.x - owner.x, p.y - owner.y) - 50) < 1e-9);
});

test('les orbes ne tirent pas mais tournent', () => {
  const w = createWeapon('orbes');
  assert.deepEqual(updateWeapon(w, owner, [enemy(1, 150, 100)], 1), []);
  assert.ok(w.angle > 0);
});
