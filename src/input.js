export const DEFAULT_BINDINGS = {
  haut: ['KeyW', 'ArrowUp'],
  bas: ['KeyS', 'ArrowDown'],
  gauche: ['KeyA', 'ArrowLeft'],
  droite: ['KeyD', 'ArrowRight'],
  dash: ['Space'],
  pause: ['Escape'],
};

const ACTIONS = Object.keys(DEFAULT_BINDINGS);

export function actionsFromKeys(pressed, bindings = DEFAULT_BINDINGS) {
  const out = {};
  for (const action of ACTIONS) {
    out[action] = (bindings[action] || []).some((code) => pressed.has(code));
  }
  return out;
}

export function moveVector(actions) {
  const x = (actions.droite ? 1 : 0) - (actions.gauche ? 1 : 0);
  const y = (actions.bas ? 1 : 0) - (actions.haut ? 1 : 0);
  if (x === 0 && y === 0) return { x: 0, y: 0 };
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

export function rebind(bindings, action, code) {
  return { ...bindings, [action]: [code] };
}

export function createInput(target, bindings = DEFAULT_BINDINGS) {
  const pressed = new Set();
  const justPressedSet = new Set();
  const bound = new Set(Object.values(bindings).flat());

  target.addEventListener('keydown', (e) => {
    if (bound.has(e.code) || e.code === 'Tab' || /^Digit[1-3]$/.test(e.code)) e.preventDefault();
    if (e.repeat) return;
    const before = actionsFromKeys(pressed, bindings);
    pressed.add(e.code);
    const after = actionsFromKeys(pressed, bindings);
    for (const a of ACTIONS) if (after[a] && !before[a]) justPressedSet.add(a);
    justPressedSet.add(e.code);
  });
  target.addEventListener('keyup', (e) => pressed.delete(e.code));
  target.addEventListener('blur', () => pressed.clear());

  return {
    actions: () => actionsFromKeys(pressed, bindings),
    justPressed: (action) => justPressedSet.has(action),
    endFrame: () => justPressedSet.clear(),
  };
}
