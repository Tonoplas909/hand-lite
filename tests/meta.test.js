import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultSave, loadSave, writeSave, coinsForRun, purchase, selectWeapon, applyStartBonuses,
} from '../src/meta.js';
import { createPlayer } from '../src/player.js';

const store = (value) => ({ getItem: () => value });

test('defaultSave', () => {
  assert.deepEqual(defaultSave(), {
    coins: 0, unlockedWeapons: ['pistolet'], bonuses: [], selectedWeapon: 'pistolet', hand: 'gauche',
  });
});

test('loadSave retombe sur defaultSave si stockage absent, qui leve, JSON invalide ou mauvaise forme', () => {
  const d = defaultSave();
  assert.deepEqual(loadSave(null), d);
  assert.deepEqual(loadSave(undefined), d);
  assert.deepEqual(loadSave({ getItem() { throw new Error('bloque'); } }), d);
  assert.deepEqual(loadSave(store('{pas du json')), d);
  assert.deepEqual(loadSave(store('42')), d);
  assert.deepEqual(loadSave(store('null')), d);
  assert.deepEqual(loadSave(store('[1,2]')), d);
  assert.deepEqual(loadSave(store(null)), d);
});

test('sauvegarde partielle : champs manquants completes', () => {
  const s = loadSave(store('{"coins":12}'));
  assert.equal(s.coins, 12);
  assert.deepEqual(s.unlockedWeapons, ['pistolet']);
  assert.equal(s.hand, 'gauche');
});

test('champs de mauvais type ignores', () => {
  const s = loadSave(store('{"coins":"beaucoup","unlockedWeapons":"laser","hand":"nez"}'));
  assert.deepEqual(s, defaultSave());
});

test('writeSave puis loadSave : aller-retour', () => {
  const mem = {};
  const st = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  const save = { ...defaultSave(), coins: 77, hand: 'droite' };
  assert.equal(writeSave(st, save), true);
  assert.deepEqual(loadSave(st), save);
});

test('writeSave renvoie false sans exception si setItem leve ou stockage absent', () => {
  assert.equal(writeSave({ setItem() { throw new Error('plein'); } }, defaultSave()), false);
  assert.equal(writeSave(null, defaultSave()), false);
});

test('coinsForRun', () => {
  assert.equal(coinsForRun({ roomsCleared: 8, bossDefeated: true }), 90);
  assert.equal(coinsForRun({ roomsCleared: 3, bossDefeated: false }), 15);
  assert.equal(coinsForRun({ roomsCleared: 0, bossDefeated: false }), 0);
});

test('purchase : refuse avec 49 pieces, accepte avec 50, refuse le second achat', () => {
  const poor = { ...defaultSave(), coins: 49 };
  assert.equal(purchase(poor, 'laser').ok, false);
  const rich = { ...defaultSave(), coins: 50 };
  const r = purchase(rich, 'laser');
  assert.equal(r.ok, true);
  assert.equal(r.save.coins, 0);
  assert.ok(r.save.unlockedWeapons.includes('laser'));
  assert.equal(rich.coins, 50);
  assert.deepEqual(rich.unlockedWeapons, ['pistolet']);
  assert.equal(purchase({ ...r.save, coins: 500 }, 'laser').ok, false);
});

test('purchase d un bonus et d un article inconnu', () => {
  const r = purchase({ ...defaultSave(), coins: 100 }, 'bonus_coeur');
  assert.equal(r.ok, true);
  assert.deepEqual(r.save.bonuses, ['bonus_coeur']);
  assert.equal(purchase({ ...defaultSave(), coins: 100 }, 'truc').ok, false);
});

test('selectWeapon ignore une arme verrouillee', () => {
  const s = defaultSave();
  assert.equal(selectWeapon(s, 'laser').selectedWeapon, 'pistolet');
  const unlocked = { ...s, unlockedWeapons: ['pistolet', 'laser'] };
  assert.equal(selectWeapon(unlocked, 'laser').selectedWeapon, 'laser');
});

test('applyStartBonuses : bonus_coeur donne 4 coeurs, bonus_vitesse x1,1', () => {
  const p = createPlayer();
  const speed = p.speed;
  applyStartBonuses({ ...defaultSave(), bonuses: ['bonus_coeur', 'bonus_vitesse'] }, p);
  assert.equal(p.hearts, 4);
  assert.equal(p.maxHearts, 4);
  assert.ok(Math.abs(p.speed - speed * 1.1) < 1e-12);
});
