const TRANSITIONS = {
  title: { start: 'run' },
  run: { roomCleared: 'upgrade', pause: 'pause', playerDead: 'end', bossDefeated: 'end' },
  upgrade: { upgradePicked: 'run' },
  pause: { resume: 'run' },
  end: { toTitle: 'title' },
};

export function nextState(current, event) {
  const row = TRANSITIONS[current];
  return (row && row[event]) || current;
}
