import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/rng.js';
import { createPlayer } from '../src/player.js';
import { createWeapon } from '../src/weapons.js';
import { UPGRADES, drawChoices, applyUpgrade } from '../src/upgrades.js';

const IDS = ['degats', 'cadence', 'vitesse', 'coeur', 'dash', 'perforant', 'multitir', 'portee'];
const setup = (weaponId = 'pistolet') => ({ p: createPlayer(), w: createWeapon(weaponId) });

test('UPGRADES contient les 8 ids avec label et description', () => {
  assert.deepEqual(UPGRADES.map((u) => u.id).sort(), [...IDS].sort());
  for (const u of UPGRADES) assert.ok(u.label && u.description);
});

test('drawChoices renvoie 3 ids distincts presents dans UPGRADES', () => {
  const c = drawChoices(mulberry32(5));
  assert.equal(c.length, 3);
  assert.equal(new Set(c).size, 3);
  for (const id of c) assert.ok(IDS.includes(id));
});

test('memes graines, memes choix', () => {
  assert.deepEqual(drawChoices(mulberry32(8)), drawChoices(mulberry32(8)));
});

test('drawChoices(rng, 20) renvoie les 8 ids', () => {
  assert.deepEqual(drawChoices(mulberry32(2), 20).sort(), [...IDS].sort());
});

test('degats : +1 damage', () => {
  const { p, w } = setup();
  const d = w.damage;
  applyUpgrade(p, w, 'degats');
  assert.equal(w.damage, d + 1);
});
test('cadence : fireInterval x0,85', () => {
  const { p, w } = setup();
  const f = w.fireInterval;
  applyUpgrade(p, w, 'cadence');
  assert.ok(Math.abs(w.fireInterval - f * 0.85) < 1e-12);
});
test('vitesse : speed x1,1', () => {
  const { p, w } = setup();
  const s = p.speed;
  applyUpgrade(p, w, 'vitesse');
  assert.ok(Math.abs(p.speed - s * 1.1) < 1e-12);
});
test('coeur : +1 maxHearts et +1 hearts', () => {
  const { p, w } = setup();
  applyUpgrade(p, w, 'coeur');
  assert.equal(p.maxHearts, 4);
  assert.equal(p.hearts, 4);
});
test('dash : dashCooldown x0,85', () => {
  const { p, w } = setup();
  const c = p.dashCooldown;
  applyUpgrade(p, w, 'dash');
  assert.ok(Math.abs(p.dashCooldown - c * 0.85) < 1e-12);
});
test('perforant : +1 pierce', () => {
  const { p, w } = setup();
  applyUpgrade(p, w, 'perforant');
  assert.equal(w.pierce, 1);
});
test('multitir : +1 count', () => {
  const { p, w } = setup();
  applyUpgrade(p, w, 'multitir');
  assert.equal(w.count, 2);
});
test('portee : range x1,2', () => {
  const { p, w } = setup();
  const r = w.range;
  applyUpgrade(p, w, 'portee');
  assert.ok(Math.abs(w.range - r * 1.2) < 1e-9);
});

test('sur les orbes : multitir -> orbCount, portee -> orbitRadius, sans NaN', () => {
  const { p, w } = setup('orbes');
  applyUpgrade(p, w, 'multitir');
  applyUpgrade(p, w, 'portee');
  applyUpgrade(p, w, 'cadence');
  applyUpgrade(p, w, 'perforant');
  assert.equal(w.orbCount, 4);
  assert.ok(Math.abs(w.orbitRadius - 60) < 1e-9);
  for (const v of Object.values(w)) if (typeof v === 'number') assert.ok(!Number.isNaN(v));
});

test('id inconnu ne change rien et ne leve pas', () => {
  const { p, w } = setup();
  const before = JSON.stringify([p, w]);
  applyUpgrade(p, w, 'nimportequoi');
  assert.equal(JSON.stringify([p, w]), before);
});
