import { CONFIG } from './config.js';
import { createInput } from './input.js';
import { stepFrames } from './loop.js';
import { nextState } from './state.js';
import { mulberry32 } from './rng.js';
import { createPlayer, updatePlayer, damagePlayer, isDead } from './player.js';
import { createWeapon, updateWeapon, updateProjectile, projectileHits, orbPositions } from './weapons.js';
import { createEnemy, updateEnemy, damageEnemy, touchesPlayer, createBoss, updateBoss } from './enemies.js';
import { createRoom, nextWave, updateRoom, isBossRoom } from './rooms.js';
import { drawChoices, applyUpgrade } from './upgrades.js';
import { loadSave, writeSave, coinsForRun, purchase, selectWeapon, applyStartBonuses } from './meta.js';
import { SHOP_ITEMS, drawTitle, drawRun, drawUpgrade, drawPause, drawEnd, drawShop } from './render.js';

const { w: W, h: H } = CONFIG.ARENA;
const WEAPON_IDS = ['pistolet', 'eventail', 'orbes', 'laser'];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
const input = createInput(window);

let save = loadSave(storage);
let state = 'title';
let game = null;
let summary = null;
const ui = { screen: 'title', menuIndex: 0, shopIndex: 0, upgradeIndex: 0 };

function persist() { writeSave(storage, save); }

function newRun() {
  const player = createPlayer();
  applyStartBonuses(save, player);
  game = {
    player,
    weapon: createWeapon(save.selectedWeapon),
    enemies: [], projectiles: [], enemyProjectiles: [], explosions: [],
    rng: mulberry32((Date.now() ^ 0x9e3779b9) >>> 0),
    roomIndex: 0, room: null, boss: null, roomsCleared: 0, waveTimer: 0,
    orbCooldowns: new Map(), choices: [],
  };
  startRoom();
}

function startRoom() {
  const g = game;
  g.enemies = []; g.projectiles = []; g.enemyProjectiles = []; g.explosions = [];
  g.orbCooldowns.clear();
  g.player.x = W / 2; g.player.y = H / 2;
  g.waveTimer = CONFIG.ROOMS.waveDelay;
  if (isBossRoom(g.roomIndex)) {
    g.room = null;
    g.boss = createBoss(W / 2, 100);
    g.enemies.push(g.boss);
  } else {
    g.room = createRoom(g.roomIndex, g.rng);
  }
}

function endRun(bossDefeated) {
  const coins = coinsForRun({ roomsCleared: game.roomsCleared, bossDefeated });
  summary = { roomsCleared: game.roomsCleared, bossDefeated, coins };
  save = { ...save, coins: save.coins + coins };
  persist();
  state = nextState('run', bossDefeated ? 'bossDefeated' : 'playerDead');
}

function inArena(o, margin = 0) {
  return o.x >= -margin && o.x <= W + margin && o.y >= -margin && o.y <= H + margin;
}

function simulate(dt) {
  const g = game;
  const p = g.player;
  updatePlayer(p, input.actions(), dt);

  g.projectiles.push(...updateWeapon(g.weapon, p, g.enemies, dt));

  if (g.weapon.id === 'orbes') {
    for (const [id, t] of g.orbCooldowns) {
      if (t - dt <= 0) g.orbCooldowns.delete(id); else g.orbCooldowns.set(id, t - dt);
    }
    for (const o of orbPositions(g.weapon, p)) {
      for (const e of g.enemies) {
        if (e.hp <= 0 || g.orbCooldowns.has(e.id)) continue;
        if (Math.hypot(e.x - o.x, e.y - o.y) <= e.radius + o.radius) {
          damageEnemy(e, g.weapon.damage);
          g.orbCooldowns.set(e.id, g.weapon.hitInterval);
        }
      }
    }
  }

  g.projectiles = g.projectiles.filter((pr) => {
    if (!updateProjectile(pr, dt)) return false;
    for (const e of projectileHits(pr, g.enemies)) damageEnemy(e, pr.damage);
    return pr.pierce >= 0 && inArena(pr, 30);
  });

  const spawned = [];
  for (const e of g.enemies) {
    if (e.hp <= 0) continue;
    if (e.type === 'boss') {
      const out = updateBoss(e, p, dt);
      g.enemyProjectiles.push(...out.projectiles);
      for (const s of out.summons) spawned.push(createEnemy(s.type, s.x, s.y));
      if (touchesPlayer(e, p)) damagePlayer(p, 1);
      continue;
    }
    const out = updateEnemy(e, p, dt);
    g.enemyProjectiles.push(...out.projectiles);
    if (out.explosion) {
      g.explosions.push({ ...out.explosion, ttl: 0.25 });
      if (Math.hypot(p.x - out.explosion.x, p.y - out.explosion.y) <= out.explosion.radius + p.radius) damagePlayer(p, 1);
    } else if (e.type !== 'kamikaze' && touchesPlayer(e, p)) {
      damagePlayer(p, 1);
    }
  }

  g.enemyProjectiles = g.enemyProjectiles.filter((pr) => {
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    if (Math.hypot(pr.x - p.x, pr.y - p.y) <= pr.radius + p.radius) {
      damagePlayer(p, pr.damage);
      return false;
    }
    return inArena(pr, 20);
  });

  g.explosions = g.explosions.filter((x) => (x.ttl -= dt) > 0);
  g.enemies = g.enemies.filter((e) => e.hp > 0).concat(spawned);

  if (isDead(p)) { endRun(false); return; }

  if (g.boss) {
    if (g.boss.hp <= 0) endRun(true);
    return;
  }

  if (g.enemies.length === 0 && g.room.waveIndex < g.room.waves.length) {
    g.waveTimer -= dt;
    if (g.waveTimer <= 0) {
      for (const s of nextWave(g.room)) g.enemies.push(createEnemy(s.type, s.x, s.y));
      g.waveTimer = CONFIG.ROOMS.waveDelay;
    }
  }
  updateRoom(g.room, g.enemies.length);
  if (g.room.cleared) {
    g.roomsCleared += 1;
    state = nextState(state, 'roomCleared');
    g.choices = drawChoices(g.rng);
    ui.upgradeIndex = 0;
  }
}

function confirmUpgrade(index) {
  const g = game;
  applyUpgrade(g.player, g.weapon, g.choices[index]);
  state = nextState(state, 'upgradePicked');
  g.roomIndex += 1;
  startRoom();
}

function cycle(i, delta, n) { return (i + delta + n) % n; }

function handleMenus() {
  const jp = (a) => input.justPressed(a);
  if (state === 'title' && ui.screen === 'title') {
    if (jp('Tab')) {
      save = { ...save, hand: save.hand === 'gauche' ? 'droite' : 'gauche' };
      persist();
    }
    if (jp('haut')) ui.menuIndex = cycle(ui.menuIndex, -1, 2);
    if (jp('bas')) ui.menuIndex = cycle(ui.menuIndex, 1, 2);
    if (jp('dash')) {
      if (ui.menuIndex === 0) { newRun(); state = nextState(state, 'start'); }
      else { ui.screen = 'shop'; ui.shopIndex = 0; }
    }
  } else if (state === 'title') {
    const n = SHOP_ITEMS.length + 1;
    if (jp('haut')) ui.shopIndex = cycle(ui.shopIndex, -1, n);
    if (jp('bas')) ui.shopIndex = cycle(ui.shopIndex, 1, n);
    if (jp('pause')) ui.screen = 'title';
    if (jp('dash')) {
      if (ui.shopIndex === SHOP_ITEMS.length) { ui.screen = 'title'; return; }
      const id = SHOP_ITEMS[ui.shopIndex];
      if (WEAPON_IDS.includes(id) && save.unlockedWeapons.includes(id)) {
        save = selectWeapon(save, id);
      } else {
        save = purchase(save, id).save;
      }
      persist();
    }
  } else if (state === 'upgrade') {
    if (jp('gauche')) ui.upgradeIndex = cycle(ui.upgradeIndex, -1, game.choices.length);
    if (jp('droite')) ui.upgradeIndex = cycle(ui.upgradeIndex, 1, game.choices.length);
    for (let i = 0; i < game.choices.length; i++) {
      if (jp(`Digit${i + 1}`)) { confirmUpgrade(i); return; }
    }
    if (jp('dash')) confirmUpgrade(ui.upgradeIndex);
  } else if (state === 'run') {
    if (jp('pause')) state = nextState(state, 'pause');
  } else if (state === 'pause') {
    if (jp('pause') || jp('dash')) state = nextState(state, 'resume');
  } else if (state === 'end') {
    if (jp('dash')) { state = nextState(state, 'toTitle'); ui.screen = 'title'; ui.menuIndex = 0; }
  }
}

function draw() {
  if (state === 'title') {
    if (ui.screen === 'shop') drawShop(ctx, save, ui.shopIndex);
    else drawTitle(ctx, save, ui.menuIndex);
  } else if (state === 'run') drawRun(ctx, game);
  else if (state === 'pause') { drawRun(ctx, game); drawPause(ctx); }
  else if (state === 'upgrade') drawUpgrade(ctx, game.choices, ui.upgradeIndex);
  else if (state === 'end') drawEnd(ctx, summary, save);
}

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const dt = (now - last) / 1000;
  last = now;
  handleMenus();
  if (state === 'run') {
    const r = stepFrames(accumulator, dt);
    accumulator = r.accumulator;
    for (let i = 0; i < r.steps && state === 'run'; i++) simulate(CONFIG.FIXED_DT);
  } else {
    accumulator = 0;
  }
  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

window.__rl = { get state() { return state; }, get game() { return game; }, get save() { return save; } };
requestAnimationFrame(frame);
