import { CONFIG } from './config.js';

const EPS = 1e-9;

export function createWeapon(id) {
  return { ...CONFIG.WEAPONS[id], id, timer: 0, angle: 0 };
}

export function nearestEnemy(from, enemies) {
  let best = null;
  let bestD = Infinity;
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const d = Math.hypot(e.x - from.x, e.y - from.y);
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

function makeProjectile(w, owner, angle) {
  return {
    x: owner.x,
    y: owner.y,
    vx: Math.cos(angle) * w.projectileSpeed,
    vy: Math.sin(angle) * w.projectileSpeed,
    damage: w.damage,
    pierce: w.pierce,
    remaining: w.range,
    radius: 4,
    hitIds: new Set(),
  };
}

export function updateWeapon(w, owner, enemies, dt) {
  if (w.id === 'orbes') {
    w.angle += w.angularSpeed * dt;
    return [];
  }
  const target = nearestEnemy(owner, enemies);
  if (!target) {
    w.timer = Math.min(w.timer + dt, w.fireInterval);
    return [];
  }
  w.timer += dt;
  if (w.timer < w.fireInterval - EPS) return [];
  w.timer = Math.max(0, w.timer - w.fireInterval);

  const base = Math.atan2(target.y - owner.y, target.x - owner.x);
  const shots = [];
  for (let i = 0; i < w.count; i++) {
    const offset = w.count > 1 ? -w.spread / 2 + (w.spread * i) / (w.count - 1) : 0;
    shots.push(makeProjectile(w, owner, base + offset));
  }
  return shots;
}

export function updateProjectile(p, dt) {
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.remaining -= Math.hypot(p.vx, p.vy) * dt;
  return p.remaining > 0;
}

export function orbPositions(w, owner) {
  const out = [];
  for (let i = 0; i < w.orbCount; i++) {
    const a = w.angle + (2 * Math.PI * i) / w.orbCount;
    out.push({ x: owner.x + Math.cos(a) * w.orbitRadius, y: owner.y + Math.sin(a) * w.orbitRadius, radius: 8 });
  }
  return out;
}

export function projectileHits(p, enemies) {
  const hits = [];
  for (const e of enemies) {
    if (e.hp <= 0) continue;
    const key = e.id ?? e;
    if (p.hitIds.has(key)) continue;
    if (Math.hypot(e.x - p.x, e.y - p.y) > e.radius + p.radius) continue;
    p.hitIds.add(key);
    hits.push(e);
    p.pierce -= 1;
    if (p.pierce < 0) break;
  }
  return hits;
}
