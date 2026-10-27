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

export function createBoss(x, y) {
  const c = CONFIG.BOSS;
  return {
    id: nextId++, type: 'boss', x, y, hp: c.hp, radius: c.radius, speed: 0, timer: 0, fuseTimer: null,
    phase: 1, chargeVx: 0, chargeVy: 0, chargeLeft: 0,
    ringTimer: 0, chargeTimer: 0, summonTimer: 0,
  };
}

export function bossPhase(b) {
  const ratio = b.hp / CONFIG.BOSS.hp;
  if (ratio < CONFIG.BOSS.phase3At) return 3;
  if (ratio < CONFIG.BOSS.phase2At) return 2;
  return 1;
}

export function updateBoss(b, player, dt) {
  const c = CONFIG.BOSS;
  const out = { projectiles: [], summons: [] };
  if (b.hp <= 0) return out;
  b.phase = bossPhase(b);

  b.ringTimer += dt;
  if (b.ringTimer >= c.ringInterval - EPS) {
    b.ringTimer -= c.ringInterval;
    for (let i = 0; i < c.ringCount; i++) {
      const a = (2 * Math.PI * i) / c.ringCount;
      out.projectiles.push({
        x: b.x, y: b.y,
        vx: Math.cos(a) * c.projectileSpeed, vy: Math.sin(a) * c.projectileSpeed,
        radius: 4, damage: 1,
      });
    }
  }

  if (b.phase >= 2) {
    b.chargeTimer += dt;
    if (b.chargeTimer >= c.chargeInterval - EPS) {
      b.chargeTimer -= c.chargeInterval;
      const v = toward(b, player);
      const dir = v.d < EPS ? { x: 1, y: 0 } : v;
      b.chargeVx = dir.x * c.chargeSpeed;
      b.chargeVy = dir.y * c.chargeSpeed;
      b.chargeLeft = c.chargeDuration;
    }
  }
  if (b.chargeLeft > 0) {
    const t = Math.min(dt, b.chargeLeft);
    b.x += b.chargeVx * t;
    b.y += b.chargeVy * t;
    b.chargeLeft -= t;
    const { w, h } = CONFIG.ARENA;
    b.x = Math.min(w - b.radius, Math.max(b.radius, b.x));
    b.y = Math.min(h - b.radius, Math.max(b.radius, b.y));
  }

  if (b.phase >= 3) {
    b.summonTimer += dt;
    if (b.summonTimer >= c.summonInterval - EPS) {
      b.summonTimer -= c.summonInterval;
      for (let i = 0; i < c.summonCount; i++) {
        const a = (2 * Math.PI * i) / c.summonCount;
        out.summons.push({ type: 'rodeur', x: b.x + Math.cos(a) * (b.radius + 20), y: b.y + Math.sin(a) * (b.radius + 20) });
      }
    }
  }
  return out;
}
