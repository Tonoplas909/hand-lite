import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { mulberry32 } from '../src/rng.js';
import { buildWaves, createRoom, nextWave, updateRoom, isBossRoom } from '../src/rooms.js';

const total = (waves) => waves.reduce((n, w) => n + w.length, 0);
const types = (waves) => waves.flat().map((s) => s.type);

test('les salles 0..7 ont 2 ou 3 vagues et au moins un ennemi', () => {
  const rng = mulberry32(1);
  for (let i = 0; i < 8; i++) {
    const waves = buildWaves(i, rng);
    assert.ok(waves.length === 2 || waves.length === 3, `salle ${i}`);
    assert.ok(total(waves) >= 1);
  }
});

test('la salle 7 contient strictement plus d ennemis que la salle 0', () => {
  for (let seed = 1; seed <= 20; seed++) {
    assert.ok(total(buildWaves(7, mulberry32(seed))) > total(buildWaves(0, mulberry32(seed))), `graine ${seed}`);
  }
});

test('pas de lourd avant la salle 2, pas de kamikaze avant la salle 3', () => {
  for (let seed = 1; seed <= 50; seed++) {
    for (let room = 0; room < 3; room++) {
      const t = types(buildWaves(room, mulberry32(seed)));
      if (room < 2) assert.ok(!t.includes('lourd'), `lourd salle ${room}`);
      assert.ok(!t.includes('kamikaze'), `kamikaze salle ${room}`);
    }
  }
});

test('memes graines, memes vagues', () => {
  assert.deepEqual(buildWaves(5, mulberry32(9)), buildWaves(5, mulberry32(9)));
});

test('toutes les positions sont dans l arene', () => {
  for (let seed = 1; seed <= 20; seed++) {
    for (const s of buildWaves(7, mulberry32(seed)).flat()) {
      assert.ok(s.x >= 0 && s.x <= CONFIG.ARENA.w && s.y >= 0 && s.y <= CONFIG.ARENA.h);
    }
  }
});

test('nextWave avance puis renvoie null apres la derniere', () => {
  const room = createRoom(0, mulberry32(1));
  const n = room.waves.length;
  for (let i = 0; i < n; i++) assert.ok(Array.isArray(nextWave(room)));
  assert.equal(nextWave(room), null);
});

test('la salle n est cleared ni avant la derniere vague ni avec des ennemis vivants', () => {
  const room = createRoom(0, mulberry32(1));
  updateRoom(room, 0);
  assert.equal(room.cleared, false);
  while (nextWave(room)) { /* lance toutes les vagues */ }
  updateRoom(room, 2);
  assert.equal(room.cleared, false);
  updateRoom(room, 0);
  assert.equal(room.cleared, true);
});

test('isBossRoom', () => {
  assert.equal(isBossRoom(8), true);
  assert.equal(isBossRoom(7), false);
});
