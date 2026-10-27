import { CONFIG } from './config.js';
import { UPGRADES } from './upgrades.js';
import { isInvulnerable } from './player.js';
import { orbPositions } from './weapons.js';

export const SHOP_ITEMS = ['pistolet', 'eventail', 'orbes', 'laser', 'bonus_coeur', 'bonus_vitesse'];

const NAMES = {
  pistolet: 'Pistolet', eventail: 'Éventail', orbes: 'Orbes', laser: 'Laser perçant',
  bonus_coeur: 'Bonus : +1 cœur de départ', bonus_vitesse: 'Bonus : vitesse +10 %',
};
const COLORS = {
  rodeur: '#ef5350', tireur: '#ab47bc', lourd: '#8d6e63', essaim: '#ffa726', kamikaze: '#ffee58', boss: '#e91e63',
};
const { w: W, h: H } = CONFIG.ARENA;

function circle(ctx, x, y, r, fill, stroke) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
}

function text(ctx, str, x, y, size = 20, color = '#e8eaf0', align = 'center') {
  ctx.font = `${size}px system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function clear(ctx) {
  ctx.fillStyle = '#151922';
  ctx.fillRect(0, 0, W, H);
}

function menuList(ctx, labels, selected, top) {
  labels.forEach((label, i) => {
    const y = top + i * 40;
    const on = i === selected;
    if (on) {
      ctx.fillStyle = '#2a3350';
      ctx.fillRect(W / 2 - 230, y - 17, 460, 34);
    }
    text(ctx, (on ? '> ' : '') + label, W / 2, y, 20, on ? '#ffffff' : '#9aa3b8');
  });
}

export function drawTitle(ctx, save, selectedIndex = 0) {
  clear(ctx);
  text(ctx, 'ROGUELITE UNE MAIN', W / 2, 90, 44);
  const left = save.hand === 'gauche';
  text(ctx, `Main active : ${left ? 'GAUCHE (Z Q S D / W A S D)' : 'DROITE (flèches)'}`, W / 2, 150, 20, '#4fc3f7');
  text(ctx, 'Tab : changer de main    Espace : dash / valider    Échap : pause', W / 2, 180, 16, '#9aa3b8');
  menuList(ctx, ['Jouer', 'Boutique'], selectedIndex, 260);
  text(ctx, `Pièces : ${save.coins}`, W / 2, 400, 20, '#ffd54f');
  text(ctx, `Arme : ${NAMES[save.selectedWeapon]}`, W / 2, 430, 18, '#9aa3b8');
  text(ctx, "Haut / Bas : choisir    Espace : valider", W / 2, 500, 16, '#9aa3b8');
}

export function drawRun(ctx, game) {
  clear(ctx);
  const { player, weapon } = game;
  for (const x of game.explosions) {
    circle(ctx, x.x, x.y, x.radius, `rgba(255,152,0,${0.5 * (x.ttl / 0.25)})`);
  }
  if (weapon.id === 'orbes') {
    for (const o of orbPositions(weapon, player)) circle(ctx, o.x, o.y, o.radius, '#80deea');
  }
  for (const e of game.enemies) {
    if (e.hp <= 0) continue;
    const flash = e.type === 'kamikaze' && e.fuseTimer !== null && Math.floor(e.fuseTimer * 12) % 2 === 0;
    circle(ctx, e.x, e.y, e.radius, flash ? '#ffffff' : COLORS[e.type]);
    if (e.type === 'kamikaze' && e.fuseTimer !== null) {
      circle(ctx, e.x, e.y, CONFIG.ENEMIES.kamikaze.blastRadius, null, 'rgba(255,152,0,0.6)');
    }
  }
  for (const p of game.projectiles) circle(ctx, p.x, p.y, p.radius, '#ffffff');
  for (const p of game.enemyProjectiles) circle(ctx, p.x, p.y, p.radius, '#ff7043');

  const blink = isInvulnerable(player) && Math.floor(player.hitTimer * 20) % 2 === 0 && player.hitTimer > 0;
  circle(ctx, player.x, player.y, player.radius, blink ? '#b3e5fc' : '#4fc3f7', player.dashTimer > 0 ? '#ffffff' : null);

  for (let i = 0; i < player.maxHearts; i++) {
    text(ctx, i < player.hearts ? '♥' : '♡', 24 + i * 26, 24, 26, '#ef5350');
  }
  const ready = player.dashCooldownTimer <= 0;
  text(ctx, ready ? 'DASH prêt' : 'dash...', 24, 56, 14, ready ? '#a5d6a7' : '#9aa3b8', 'left');
  text(ctx, game.roomIndex >= CONFIG.ROOMS.count ? 'BOSS' : `Salle ${game.roomIndex + 1} / ${CONFIG.ROOMS.count}`, W - 24, 24, 20, '#e8eaf0', 'right');

  const boss = game.enemies.find((e) => e.type === 'boss' && e.hp > 0);
  if (boss) {
    const ratio = Math.max(0, boss.hp / CONFIG.BOSS.hp);
    ctx.fillStyle = '#37203a';
    ctx.fillRect(W / 2 - 200, 14, 400, 12);
    ctx.fillStyle = COLORS.boss;
    ctx.fillRect(W / 2 - 200, 14, 400 * ratio, 12);
  }
}

export function drawUpgrade(ctx, choices, selectedIndex) {
  clear(ctx);
  text(ctx, "Choisis une amélioration", W / 2, 80, 32);
  choices.forEach((id, i) => {
    const u = UPGRADES.find((x) => x.id === id);
    const x = 90 + i * 290;
    const on = i === selectedIndex;
    ctx.fillStyle = on ? '#2a3350' : '#1d2231';
    ctx.fillRect(x, 160, 260, 220);
    ctx.strokeStyle = on ? '#4fc3f7' : '#39415a';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 160, 260, 220);
    text(ctx, `${i + 1}`, x + 20, 180, 16, '#9aa3b8', 'left');
    text(ctx, u.label, x + 130, 230, 26, on ? '#ffffff' : '#c5cae0');
    text(ctx, u.description, x + 130, 300, 15, '#9aa3b8');
  });
  text(ctx, 'Gauche / Droite : choisir    Espace : valider    (1 2 3 : raccourcis)', W / 2, 450, 16, '#9aa3b8');
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, W, H);
  text(ctx, 'PAUSE', W / 2, H / 2 - 10, 44);
  text(ctx, 'Échap : reprendre', W / 2, H / 2 + 40, 18, '#9aa3b8');
}

export function drawEnd(ctx, summary, save) {
  clear(ctx);
  text(ctx, summary.bossDefeated ? 'VICTOIRE !' : 'PERDU', W / 2, 110, 48, summary.bossDefeated ? '#a5d6a7' : '#ef9a9a');
  text(ctx, `Salles terminées : ${summary.roomsCleared} / ${CONFIG.ROOMS.count}`, W / 2, 200, 22);
  text(ctx, `Pièces gagnées : +${summary.coins}`, W / 2, 240, 22, '#ffd54f');
  text(ctx, `Total : ${save.coins} pièces`, W / 2, 280, 18, '#9aa3b8');
  text(ctx, 'Espace : retour au titre', W / 2, 400, 18, '#9aa3b8');
}

export function drawShop(ctx, save, selectedIndex) {
  clear(ctx);
  text(ctx, 'BOUTIQUE', W / 2, 60, 36);
  text(ctx, `Pièces : ${save.coins}`, W / 2, 105, 20, '#ffd54f');
  const labels = SHOP_ITEMS.map((id) => {
    const weapon = ['pistolet', 'eventail', 'orbes', 'laser'].includes(id);
    const price = CONFIG.META.shop[id];
    let status;
    if (weapon) {
      if (!save.unlockedWeapons.includes(id)) status = `${price} pièces`;
      else status = save.selectedWeapon === id ? 'équipée' : 'équiper';
    } else {
      status = save.bonuses.includes(id) ? 'acheté' : `${price} pièces`;
    }
    return `${NAMES[id]}  —  ${status}`;
  });
  labels.push('Retour');
  menuList(ctx, labels, selectedIndex, 160);
  text(ctx, 'Haut / Bas : choisir    Espace : acheter / équiper', W / 2, 510, 16, '#9aa3b8');
}
