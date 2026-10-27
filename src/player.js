import { CONFIG } from './config.js';
import { moveVector } from './input.js';

export function createPlayer() {
  const c = CONFIG.PLAYER;
  return {
    x: CONFIG.ARENA.w / 2,
    y: CONFIG.ARENA.h / 2,
    radius: c.radius,
    speed: c.speed,
    hearts: c.hearts,
    maxHearts: c.hearts,
    dashCooldown: c.dashCooldown,
    dashTimer: 0,
    dashCooldownTimer: 0,
    hitTimer: 0,
    facing: { x: 1, y: 0 },
    dashDir: { x: 1, y: 0 },
  };
}

export function updatePlayer(p, actions, dt) {
  const c = CONFIG.PLAYER;
  const v = moveVector(actions);
  if (v.x !== 0 || v.y !== 0) p.facing = { x: v.x, y: v.y };

  if (actions.dash && p.dashTimer <= 0 && p.dashCooldownTimer <= 0) {
    p.dashTimer = c.dashDuration;
    p.dashCooldownTimer = p.dashCooldown;
    p.dashDir = { x: p.facing.x, y: p.facing.y };
  }

  if (p.dashTimer > 0) {
    p.x += p.dashDir.x * c.dashSpeed * dt;
    p.y += p.dashDir.y * c.dashSpeed * dt;
    p.dashTimer = Math.max(0, p.dashTimer - dt);
  } else {
    p.x += v.x * p.speed * dt;
    p.y += v.y * p.speed * dt;
  }

  p.dashCooldownTimer = Math.max(0, p.dashCooldownTimer - dt);
  p.hitTimer = Math.max(0, p.hitTimer - dt);

  const { w, h } = CONFIG.ARENA;
  p.x = Math.min(w - p.radius, Math.max(p.radius, p.x));
  p.y = Math.min(h - p.radius, Math.max(p.radius, p.y));
}

export function isInvulnerable(p) {
  return p.dashTimer > 0 || p.hitTimer > 0;
}

export function damagePlayer(p, amount = 1) {
  if (isInvulnerable(p)) return false;
  p.hearts -= amount;
  p.hitTimer = CONFIG.PLAYER.hitInvuln;
  return true;
}

export function isDead(p) {
  return p.hearts <= 0;
}
