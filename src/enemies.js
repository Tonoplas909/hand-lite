import { CONFIG } from './config.js';

const EPS = 1e-9;

export const ENEMY_TYPES = ['rodeur', 'tireur', 'lourd', 'essaim', 'kamikaze'];

let nextId = 1;

export function createEnemy(type, x, y) {
  const c = CONFIG.ENEMIES[type];
  return { id: nextId++, type, x, y, hp: c.hp, radius: c.radius, speed: c.speed, timer: 0, fuseTimer: null };
}

function toward(e, target) {
  const dx = target.x - e.x;
  const dy = target.y - e.y;
  const d = Math.hypot(dx, dy);
  return d < EPS ? { x: 0, y: 0, d } : { x: dx / d, y: dy / d, d };
}

function chase(e, player, dt) {
  const v = toward(e, player);
  e.x += v.x * e.speed * dt;
  e.y += v.y * e.speed * dt;
}

export function updateEnemy(e, player, dt) {
  const out = { projectiles: [], explosion: null };
  if (e.hp <= 0) return out;
  const c = CONFIG.ENEMIES[e.type];

  if (e.type === 'tireur') {
    const v = toward(e, player);
    if (v.d > c.range) {
      chase(e, player, dt);
    } else {
      e.timer += dt;
      if (e.timer >= c.fireInterval - EPS) {
        e.timer -= c.fireInterval;
        const dir = v.d < EPS ? { x: 1, y: 0 } : v;
        out.projectiles.push({
          x: e.x, y: e.y,
          vx: dir.x * c.projectileSpeed, vy: dir.y * c.projectileSpeed,
          radius: 4, damage: 1,
        });
      }
    }
  } else if (e.type === 'kamikaze') {
    if (e.fuseTimer === null) {
      if (toward(e, player).d <= e.radius + player.radius) e.fuseTimer = 0;
      else chase(e, player, dt);
    }
    if (e.fuseTimer !== null) {
      e.fuseTimer += dt;
      if (e.fuseTimer >= c.fuse - EPS) {
        out.explosion = { x: e.x, y: e.y, radius: c.blastRadius };
        e.hp = 0;
      }
    }
  } else {
    chase(e, player, dt);
  }
  return out;
}

export function damageEnemy(e, amount) {
  if (e.hp <= 0) return false;
  e.hp -= amount;
  return e.hp <= 0;
}

export function touchesPlayer(e, player) {
  return Math.hypot(e.x - player.x, e.y - player.y) <= e.radius + player.radius;
}
