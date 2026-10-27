import { CONFIG } from './config.js';

export const SAVE_KEY = 'roguelite-une-main-save';

const WEAPON_ITEMS = ['eventail', 'orbes', 'laser'];
const isStringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

export function defaultSave() {
  return { coins: 0, unlockedWeapons: ['pistolet'], bonuses: [], selectedWeapon: 'pistolet', hand: 'gauche' };
}

export function loadSave(storage) {
  const save = defaultSave();
  let parsed;
  try {
    const raw = storage && storage.getItem(SAVE_KEY);
    if (typeof raw !== 'string') return save;
    parsed = JSON.parse(raw);
  } catch {
    return save;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return save;

  if (Number.isFinite(parsed.coins) && parsed.coins >= 0) save.coins = parsed.coins;
  if (isStringArray(parsed.unlockedWeapons)) {
    save.unlockedWeapons = Array.from(new Set(['pistolet', ...parsed.unlockedWeapons]));
  }
  if (isStringArray(parsed.bonuses)) save.bonuses = parsed.bonuses;
  if (save.unlockedWeapons.includes(parsed.selectedWeapon)) save.selectedWeapon = parsed.selectedWeapon;
  if (parsed.hand === 'gauche' || parsed.hand === 'droite') save.hand = parsed.hand;
  return save;
}

export function writeSave(storage, save) {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function coinsForRun({ roomsCleared, bossDefeated }) {
  return roomsCleared * CONFIG.META.coinsPerRoom + (bossDefeated ? CONFIG.META.bossBonus : 0);
}

export function purchase(save, itemId) {
  const price = CONFIG.META.shop[itemId];
  const owned = WEAPON_ITEMS.includes(itemId)
    ? save.unlockedWeapons.includes(itemId)
    : save.bonuses.includes(itemId);
  if (price === undefined || owned || save.coins < price) return { ok: false, save };
  const next = { ...save, coins: save.coins - price };
  if (WEAPON_ITEMS.includes(itemId)) next.unlockedWeapons = [...save.unlockedWeapons, itemId];
  else next.bonuses = [...save.bonuses, itemId];
  return { ok: true, save: next };
}

export function selectWeapon(save, weaponId) {
  if (!save.unlockedWeapons.includes(weaponId)) return save;
  return { ...save, selectedWeapon: weaponId };
}

export function applyStartBonuses(save, player) {
  if (save.bonuses.includes('bonus_coeur')) {
    player.maxHearts += 1;
    player.hearts += 1;
  }
  if (save.bonuses.includes('bonus_vitesse')) player.speed *= 1.1;
}
