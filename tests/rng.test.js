import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, pick } from '../src/rng.js';

test('deux generateurs de meme graine produisent la meme suite', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 5; i++) assert.equal(a(), b());
});

test('toutes les valeurs sont dans [0,1)', () => {
  const r = mulberry32(7);
  for (let i = 0; i < 1000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1);
  }
});

test('pick renvoie toujours un element du tableau', () => {
  const r = mulberry32(3);
  const arr = ['a', 'b', 'c'];
  for (let i = 0; i < 100; i++) assert.ok(arr.includes(pick(r, arr)));
});
