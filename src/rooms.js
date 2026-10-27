import { CONFIG } from './config.js';
import { ENEMY_TYPES } from './enemies.js';
import { pick } from './rng.js';

const MIN_ROOM = { lourd: 2, kamikaze: 3 };

function typesFor(roomIndex) {
  return ENEMY_TYPES.filter((t) => roomIndex >= (MIN_ROOM[t] ?? 0));
}

function edgePosition(rng) {
  const { w, h } = CONFIG.ARENA;
  const side = Math.floor(rng() * 4);
  const along = rng();
  if (side === 0) return { x: along * w, y: 0 };
  if (side === 1) return { x: w, y: along * h };
  if (side === 2) return { x: along * w, y: h };
  return { x: 0, y: along * h };
}

export function buildWaves(roomIndex, rng) {
  const { minWaves, maxWaves } = CONFIG.ROOMS;
  const waveCount = minWaves + Math.floor(rng() * (maxWaves - minWaves + 1));
  const available = typesFor(roomIndex);
  const waves = [];
  for (let i = 0; i < waveCount; i++) {
    const size = 2 + roomIndex + Math.floor(rng() * 2);
    const wave = [];
    for (let j = 0; j < size; j++) {
      wave.push({ type: pick(rng, available), ...edgePosition(rng) });
    }
    waves.push(wave);
  }
  return waves;
}

export function createRoom(roomIndex, rng) {
  return { index: roomIndex, waves: buildWaves(roomIndex, rng), waveIndex: 0, cleared: false };
}

export function nextWave(room) {
  if (room.waveIndex >= room.waves.length) return null;
  return room.waves[room.waveIndex++];
}

export function updateRoom(room, aliveCount) {
  if (room.waveIndex >= room.waves.length && aliveCount === 0) room.cleared = true;
}

export function isBossRoom(roomIndex) {
  return roomIndex === CONFIG.ROOMS.count;
}
