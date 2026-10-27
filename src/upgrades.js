export const UPGRADES = [
  { id: 'degats', label: 'Dégâts', description: '+1 dégât par tir' },
  { id: 'cadence', label: 'Cadence', description: 'Tire 15 % plus vite' },
  { id: 'vitesse', label: 'Vitesse', description: 'Déplacement +10 %' },
  { id: 'coeur', label: 'Cœur', description: '+1 cœur max et +1 cœur soigné' },
  { id: 'dash', label: 'Dash', description: 'Recharge du dash -15 %' },
  { id: 'perforant', label: 'Perforant', description: 'Les tirs traversent +1 ennemi' },
  { id: 'multitir', label: 'Tir multiple', description: '+1 projectile (ou orbe)' },
  { id: 'portee', label: 'Portée', description: 'Portée +20 %' },
];

export function drawChoices(rng, n = 3) {
  const ids = UPGRADES.map((u) => u.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, n);
}

const isNum = (v) => typeof v === 'number';

export function applyUpgrade(player, weapon, id) {
  switch (id) {
    case 'degats':
      weapon.damage += 1;
      break;
    case 'cadence':
      if (isNum(weapon.fireInterval)) weapon.fireInterval *= 0.85;
      else if (isNum(weapon.hitInterval)) weapon.hitInterval *= 0.85;
      break;
    case 'vitesse':
      player.speed *= 1.1;
      break;
    case 'coeur':
      player.maxHearts += 1;
      player.hearts += 1;
      break;
    case 'dash':
      player.dashCooldown *= 0.85;
      break;
    case 'perforant':
      if (isNum(weapon.pierce)) weapon.pierce += 1;
      break;
    case 'multitir':
      if (isNum(weapon.orbCount)) weapon.orbCount += 1;
      else if (isNum(weapon.count)) weapon.count += 1;
      break;
    case 'portee':
      if (isNum(weapon.orbitRadius)) weapon.orbitRadius *= 1.2;
      else if (isNum(weapon.range)) weapon.range *= 1.2;
      break;
    default:
      break;
  }
}
