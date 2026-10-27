# Roguelite une main — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un roguelite d'arène temps réel jouable d'une main (gauche ou droite) dans le navigateur.

**Architecture:** Modules ES natifs sans dépendance. La logique de jeu (fichiers purs, sans canvas ni DOM) est testée avec le lanceur intégré de Node (`node --test`). `render.js` et `main.js` sont les seuls fichiers qui touchent au canvas/DOM, vérifiés à la main dans le navigateur.

**Tech Stack:** JavaScript vanilla (ES modules), Canvas 2D, `node:test` pour les tests (outil de dev uniquement), `python -m http.server` pour servir les fichiers.

**Spec:** `docs/spec-design.md`

## Global Constraints

- Dossier du projet : `roguelite-une-main/`. Rien n'est créé à la racine de `proj/`.
- JavaScript vanilla + Canvas 2D, aucune dépendance de production, aucun build.
- Une seule main : 4 directions + Dash (+ Pause). Pas de touche de compétence. Pas de clic souris requis, y compris dans les menus.
- Les touches sont lues avec `event.code` (position physique) : `KeyW/KeyA/KeyS/KeyD` couvrent à la fois ZQSD (AZERTY) et WASD (QWERTY) ; les flèches sont toujours actives en même temps. Dash/Confirmer = `Space`, Pause = `Escape`.
- Joueur : 3 cœurs ; dash 0,3 s d'invulnérabilité, recharge 1,2 s ; tir automatique sur l'ennemi le plus proche.
- Run : 8 salles de 2 à 3 vagues, puis 1 boss à 3 phases (tirs en cercle, charges, invocation).
- 5 ennemis : Rôdeur, Tireur, Lourd, Essaim, Kamikaze. 4 armes : Pistolet (de base), Éventail, Orbes, Laser perçant. 8 améliorations, choix 1 parmi 3.
- Pas de son, pas de réseau. Graphismes en formes géométriques.
- Pas de temps fixe `1/60` s ; la logique ne dépend pas du nombre d'images par seconde.
- Toutes les valeurs d'équilibrage vivent dans `src/config.js`.
- Sauvegarde dans `localStorage` ; absente ou corrompue → sauvegarde vide, sans plantage.
- Écarts avec la spec §6.1 (déjà reportés dans la spec) : fichiers `src/rng.js` (aléatoire à graine) et `src/loop.js` (pas de temps fixe), dossier `tests/`.

## Review Focus

1. Deux directions opposées tenues ensemble (gauche + droite) → le joueur ne bouge pas sur cet axe, pas de `NaN`.
2. Dash sans direction tenue → dash dans la dernière direction de déplacement (jamais de dash immobile ni de `NaN`).
3. Aucun ennemi vivant → les armes ne tirent pas et ne plantent pas.
4. Onglet resté en arrière-plan (énorme `dt` au retour) → le temps est plafonné, les ennemis ne téléportent pas le joueur.
5. `localStorage` indisponible ou JSON corrompu → partie jouable avec une sauvegarde vide.

---

### Task 1: Squelette, config, rng

**Files:**
- Create: `package.json`, `index.html`, `src/config.js`, `src/rng.js`, `tests/rng.test.js`, `.gitignore`

**Interfaces:**
- Produces: `CONFIG` (export nommé de `src/config.js`) ; `mulberry32(seed: number) -> () => number` (valeurs dans `[0,1)`) et `pick(rng, array) -> element` dans `src/rng.js`.

- [ ] **Step 1: Initialiser le projet.** Le dépôt git est déjà initialisé et relié à `origin` (ne pas refaire `git init`). `package.json` : `"type": "module"`, scripts `"test": "node --test tests/"` et `"start": "python -m http.server 8080"`. `.gitignore` : `node_modules/`.
- [ ] **Step 2: Écrire le test qui échoue** `tests/rng.test.js` : deux `mulberry32(42)` produisent la même suite de 5 valeurs ; toutes les valeurs sont dans `[0,1)` ; `pick(rng, ['a','b','c'])` renvoie toujours un élément du tableau sur 100 tirages.
- [ ] **Step 3: Lancer** `npm test` → échec (module absent).
- [ ] **Step 4: Implémenter `src/rng.js`** (algorithme mulberry32 standard).
- [ ] **Step 5: Écrire `src/config.js`** exportant `CONFIG` avec exactement ces clés et valeurs :
  - `FIXED_DT: 1/60`, `MAX_FRAME_DT: 0.25`, `ARENA: {w: 960, h: 540}`
  - `PLAYER: {hearts: 3, speed: 220, radius: 12, dashSpeed: 600, dashDuration: 0.3, dashCooldown: 1.2, hitInvuln: 1.0}`
  - `ROOMS: {count: 8, minWaves: 2, maxWaves: 3}`
  - `ENEMIES`: `rodeur {hp 3, speed 90, radius 10}` ; `tireur {hp 3, speed 60, radius 10, range 260, fireInterval 1.6, projectileSpeed 200}` ; `lourd {hp 12, speed 40, radius 18}` ; `essaim {hp 1, speed 140, radius 6}` ; `kamikaze {hp 2, speed 130, radius 10, fuse 0.6, blastRadius 60}` ; contact = 1 dégât pour tous, explosion kamikaze = 1 dégât.
  - `BOSS: {hp: 150, radius: 36, phase2At: 0.66, phase3At: 0.33, ringCount: 12, ringInterval: 1.5, chargeSpeed: 380, chargeInterval: 2.5, summonInterval: 5, summonCount: 3}`
  - `WEAPONS`: `pistolet {damage 1, fireInterval 0.4, projectileSpeed 420, range 320, count 1, spread 0, pierce 0}` ; `eventail {damage 1, fireInterval 0.7, projectileSpeed 420, range 260, count 5, spread 0.8, pierce 0}` ; `orbes {damage 1, orbCount 3, orbitRadius 50, angularSpeed 3, hitInterval 0.5}` ; `laser {damage 2, fireInterval 0.9, projectileSpeed 700, range 500, count 1, spread 0, pierce 99}`
  - `META: {coinsPerRoom: 5, bossBonus: 50, shop: {eventail: 30, orbes: 40, laser: 50, bonus_coeur: 60, bonus_vitesse: 40}}`
- [ ] **Step 6: `index.html`** : un `<canvas id="game" width="960" height="540">` centré, fond sombre, `<script type="module" src="src/main.js">`. (`main.js` arrive en Task 11 ; la page peut être vide d'ici là.)
- [ ] **Step 7: Lancer** `npm test` → PASS.
- [ ] **Step 8: Commit** `git add -A && git commit -m "chore: squelette, config et rng"`.

---

### Task 2: input.js — touches vers actions

**Files:**
- Create: `src/input.js`, `tests/input.test.js`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `DEFAULT_BINDINGS: {haut: string[], bas: string[], gauche: string[], droite: string[], dash: string[], pause: string[]}` (valeurs = `event.code`) : haut `['KeyW','ArrowUp']`, bas `['KeyS','ArrowDown']`, gauche `['KeyA','ArrowLeft']`, droite `['KeyD','ArrowRight']`, dash `['Space']`, pause `['Escape']`.
  - `actionsFromKeys(pressed: Set<string>, bindings = DEFAULT_BINDINGS) -> {haut, bas, gauche, droite, dash, pause: boolean}`
  - `moveVector(actions) -> {x: number, y: number}` : composantes dans `{-1,0,1}`, axe annulé si deux directions opposées sont tenues, vecteur normalisé en diagonale (norme 1).
  - `rebind(bindings, action, code) -> bindings` (copie ; remplace les touches de l'action).
  - `createInput(target: EventTarget) -> {actions(): ReturnType<actionsFromKeys>, justPressed(action: string): boolean, endFrame(): void}` (couche DOM mince, `keydown`/`keyup`, `preventDefault` sur les touches liées).

- [ ] **Step 1: Tests qui échouent** : `KeyW` seul → `haut: true` ; `ArrowUp` seul → `haut: true` ; `KeyA`+`ArrowRight` → `gauche` et `droite` vrais ; `moveVector` pour gauche+droite → `x === 0` (Review Focus 1) ; `moveVector` pour haut+droite → norme ≈ 1 (`Math.hypot` à 1e-9 près) ; `moveVector` sans touche → `{x:0, y:0}` sans `NaN` ; `rebind(DEFAULT_BINDINGS,'dash','KeyE')` → `actionsFromKeys(new Set(['KeyE'])).dash` vrai sans toucher l'objet d'origine.
- [ ] **Step 2: Lancer** `node --test tests/input.test.js` → échec.
- [ ] **Step 3: Implémenter** les fonctions pures ci-dessus.
- [ ] **Step 4: Implémenter `createInput`** (non testé automatiquement : dépend du DOM) ; `justPressed` vaut vrai jusqu'à `endFrame()`.
- [ ] **Step 5: Lancer** `npm test` → PASS.
- [ ] **Step 6: Commit** `feat: lecture des touches et dispositions`.

---

### Task 3: state.js — machine d'états

**Files:**
- Create: `src/state.js`, `tests/state.test.js`

**Interfaces:**
- Produces: `nextState(current: string, event: string) -> string`. États : `'title' | 'run' | 'upgrade' | 'pause' | 'end'`. Événements : `'start'`, `'roomCleared'`, `'upgradePicked'`, `'pause'`, `'resume'`, `'playerDead'`, `'bossDefeated'`, `'toTitle'`. Un événement invalide pour l'état courant renvoie l'état courant (jamais d'exception).

- [ ] **Step 1: Tests qui échouent** : `title+start→run` ; `run+roomCleared→upgrade` ; `upgrade+upgradePicked→run` ; `run+pause→pause` ; `pause+resume→run` ; `run+playerDead→end` ; `run+bossDefeated→end` ; `end+toTitle→title` ; `title+roomCleared→title` (ignoré) ; `upgrade+pause→upgrade` (pas de pause pendant un choix).
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter** avec une table de transitions. **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: machine d'états`.

---

### Task 4: player.js — déplacement, dash, vie

**Files:**
- Create: `src/player.js`, `tests/player.test.js`

**Interfaces:**
- Consumes: `CONFIG.PLAYER`, `CONFIG.ARENA`, `moveVector` de `input.js`.
- Produces:
  - `createPlayer() -> Player` avec `{x, y, radius, speed, hearts, maxHearts, dashCooldown, dashTimer, dashCooldownTimer, hitTimer, facing: {x, y}}` (départ au centre de l'arène, `facing` = `{x:1,y:0}`).
  - `updatePlayer(p, actions, dt) -> void` : déplace, gère le dash, décrémente les minuteurs, garde le joueur dans l'arène.
  - `isInvulnerable(p) -> boolean` (vrai pendant le dash ou `hitTimer > 0`).
  - `damagePlayer(p, amount = 1) -> boolean` (vrai si le dégât a été appliqué ; faux si invulnérable) ; déclenche `hitTimer = hitInvuln`.
  - `isDead(p) -> boolean` (`hearts <= 0`).

- [ ] **Step 1: Tests qui échouent** : vitesse 220 px/s vers la droite sur 1 s ≈ +220 px ; diagonale pas plus rapide que l'axe ; le joueur ne sort pas de l'arène ; dash pendant 0,3 s rend `isInvulnerable` vrai puis faux ; seconde demande de dash avant 1,2 s ignorée ; **dash sans direction tenue part dans `facing`** (Review Focus 2) ; `damagePlayer` renvoie `false` pendant l'invulnérabilité et ne retire pas de cœur ; deux dégâts espacés de plus de `hitInvuln` retirent 2 cœurs ; `isDead` après 3 dégâts.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter.** **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: joueur`.

---

### Task 5: weapons.js — armes et projectiles

**Files:**
- Create: `src/weapons.js`, `tests/weapons.test.js`

**Interfaces:**
- Consumes: `CONFIG.WEAPONS`. Un ennemi est un objet `{x, y, radius, hp}` (au moins) ; `hp <= 0` signifie mort.
- Produces:
  - `createWeapon(id: 'pistolet'|'eventail'|'orbes'|'laser') -> Weapon` : copie des stats de `CONFIG.WEAPONS[id]` plus `{id, timer: 0, angle: 0}`.
  - `nearestEnemy(from: {x,y}, enemies: Enemy[]) -> Enemy | null` (ignore les ennemis morts).
  - `updateWeapon(w, owner: {x,y}, enemies, dt) -> Projectile[]` : pistolet/éventail/laser renvoient les projectiles créés quand `timer` atteint `fireInterval` ; renvoie `[]` sans ennemi vivant (Review Focus 3) ou pour `orbes`.
  - `Projectile = {x, y, vx, vy, damage, pierce, remaining, radius, hitIds: Set}` ; `updateProjectile(p, dt) -> boolean` (faux quand la portée est épuisée).
  - `orbPositions(w, owner) -> {x, y, radius}[]` (pour `orbes`, `orbCount` positions régulièrement réparties sur `orbitRadius`, tournant de `angularSpeed`).
  - `projectileHits(p, enemies) -> Enemy[]` : ennemis vivants touchés et jamais touchés par ce projectile ; ajoute leur id à `hitIds` ; un projectile non perçant (`pierce` 0) est consommé au premier impact (l'appelant le supprime si `pierce` ne permet plus de continuer — la fonction décrémente `pierce` et la règle est : le projectile continue tant que `pierce >= 0` après décrément).

- [ ] **Step 1: Tests qui échouent** : `nearestEnemy` choisit le plus proche et ignore les morts ; `nearestEnemy` sur liste vide → `null` ; pistolet : aucun projectile avant 0,4 s, un projectile à 0,4 s dirigé vers l'ennemi ; **aucun ennemi vivant → `[]` sans exception** ; éventail : 5 projectiles couvrant 0,8 rad centrés sur la cible ; laser : un projectile avec `pierce` 99 touche deux ennemis alignés, le pistolet n'en touche qu'un ; `updateProjectile` renvoie `false` après `range` px parcourus ; `orbPositions` renvoie 3 points à 50 px du joueur.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter.** **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: armes`.

---

### Task 6: enemies.js — les 5 ennemis

**Files:**
- Create: `src/enemies.js`, `tests/enemies.test.js`

**Interfaces:**
- Consumes: `CONFIG.ENEMIES`, `Player` (au moins `{x, y}`).
- Produces:
  - `ENEMY_TYPES: ['rodeur','tireur','lourd','essaim','kamikaze']`.
  - `createEnemy(type, x, y) -> Enemy` : `{id, type, x, y, hp, radius, speed, timer: 0, fuseTimer: null}` (`id` unique croissant).
  - `updateEnemy(e, player, dt) -> {projectiles: EnemyProjectile[], explosion: {x, y, radius} | null}` : rôdeur/lourd/essaim foncent vers le joueur ; tireur se rapproche jusqu'à `range` puis tire toutes les `fireInterval` (projectile `{x,y,vx,vy,radius:4,damage:1}`) ; kamikaze fonce, démarre `fuseTimer` à portée de contact, explose quand `fuseTimer` atteint `fuse` (il meurt, `hp = 0`).
  - `damageEnemy(e, amount) -> boolean` (vrai si l'ennemi meurt).
  - `touchesPlayer(e, player) -> boolean` (contact cercle/cercle).

- [ ] **Step 1: Tests qui échouent** : le rôdeur se rapproche du joueur de `speed*dt` ; le lourd est plus lent que le rôdeur ; l'essaim est plus rapide ; le tireur à plus de `range` s'approche, à portée il ne bouge plus et émet un projectile après 1,6 s ; le kamikaze explose 0,6 s après le contact, renvoie une `explosion` de rayon 60 et `hp === 0` ; `damageEnemy` renvoie `true` quand `hp` tombe à 0 ; `touchesPlayer` vrai/faux selon la distance ; aucun `NaN` si l'ennemi est exactement sur le joueur.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter.** **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: ennemis`.

---

### Task 7: boss (dans enemies.js)

**Files:**
- Modify: `src/enemies.js`
- Test: `tests/boss.test.js`

**Interfaces:**
- Consumes: `CONFIG.BOSS`, `createEnemy`, `damageEnemy`.
- Produces:
  - `createBoss(x, y) -> Boss` : un `Enemy` avec `type: 'boss'`, `hp = CONFIG.BOSS.hp`, plus `{phase: 1, chargeVx: 0, chargeVy: 0}`.
  - `bossPhase(b) -> 1|2|3` selon `hp / BOSS.hp` (phase 2 sous 0,66, phase 3 sous 0,33).
  - `updateBoss(b, player, dt) -> {projectiles: EnemyProjectile[], summons: {type, x, y}[]}` : phase 1 = anneau de `ringCount` projectiles toutes les `ringInterval` s ; phase 2 = charges vers le joueur toutes les `chargeInterval` s (vitesse `chargeSpeed`) en plus de l'anneau ; phase 3 = invoque `summonCount` rôdeurs toutes les `summonInterval` s en plus des charges et de l'anneau.

- [ ] **Step 1: Tests qui échouent** : `bossPhase` renvoie 1/2/3 à 100 %, 50 % et 20 % de PV ; phase 1 : 12 projectiles espacés de 2π/12 après 1,5 s, aucune invocation ; phase 2 : après 2,5 s la position du boss a changé vers le joueur ; phase 3 : 3 invocations de type `'rodeur'` après 5 s ; aucun `NaN` quand le boss est sur le joueur.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter.** **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: boss`.

---

### Task 8: rooms.js — salles et vagues

**Files:**
- Create: `src/rooms.js`, `tests/rooms.test.js`

**Interfaces:**
- Consumes: `CONFIG.ROOMS`, `CONFIG.ARENA`, `ENEMY_TYPES`, `mulberry32`/`pick` de `rng.js`.
- Produces:
  - `buildWaves(roomIndex: number /*0..7*/, rng) -> Spawn[][]` : de 2 à 3 vagues ; chaque vague est une liste de `{type, x, y}` (position sur le bord de l'arène) ; le nombre d'ennemis croît avec `roomIndex` ; le Lourd n'apparaît pas avant la salle 2, le Kamikaze pas avant la salle 3 ; le total d'une salle est toujours ≥ 1.
  - `createRoom(roomIndex, rng) -> Room` avec `{index, waves, waveIndex: 0, cleared: false}` ; `nextWave(room) -> Spawn[] | null` (renvoie la vague suivante et avance, `null` s'il n'y en a plus) ; `updateRoom(room, aliveCount: number) -> void` marque `cleared` quand toutes les vagues sont lancées et `aliveCount === 0`.
  - `isBossRoom(roomIndex) -> boolean` (vrai pour `roomIndex === CONFIG.ROOMS.count`).

- [ ] **Step 1: Tests qui échouent** (avec `mulberry32(1)`) : les salles 0..7 ont 2 ou 3 vagues ; le total d'ennemis de la salle 7 est strictement supérieur à celui de la salle 0 ; aucun `lourd` en salle 0 ou 1, aucun `kamikaze` en salle 0 à 2 (sur 50 graines) ; mêmes graines → mêmes vagues ; toutes les positions sont dans l'arène ; `nextWave` renvoie `null` après la dernière ; la salle n'est `cleared` ni avant la dernière vague ni tant qu'il reste des ennemis ; `isBossRoom(8)` vrai, `isBossRoom(7)` faux.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter.** **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: salles et vagues`.

---

### Task 9: upgrades.js — améliorations

**Files:**
- Create: `src/upgrades.js`, `tests/upgrades.test.js`

**Interfaces:**
- Consumes: `Player` (Task 4), `Weapon` (Task 5), `rng`.
- Produces:
  - `UPGRADES: {id, label, description}[]` avec les 8 ids : `degats`, `cadence`, `vitesse`, `coeur`, `dash`, `perforant`, `multitir`, `portee`.
  - `drawChoices(rng, n = 3) -> string[]` : `n` ids distincts (ou tous si moins de `n`).
  - `applyUpgrade(player, weapon, id) -> void` : `degats` +1 dégât ; `cadence` `fireInterval` ×0,85 ; `vitesse` `player.speed` ×1,1 ; `coeur` +1 `maxHearts` et +1 `hearts` ; `dash` `dashCooldown` ×0,85 ; `perforant` +1 `pierce` ; `multitir` +1 `count` (`orbCount` pour `orbes`) ; `portee` `range` ×1,2 (`orbitRadius` ×1,2 pour `orbes`). Id inconnu → sans effet, sans exception.

- [ ] **Step 1: Tests qui échouent** : `drawChoices` renvoie 3 ids distincts tous présents dans `UPGRADES` ; mêmes graines → mêmes choix ; `drawChoices(rng, 20)` renvoie les 8 ids ; chaque `applyUpgrade` modifie exactement la propriété annoncée (une assertion par amélioration) ; `coeur` augmente aussi `hearts` ; sur un `orbes`, `multitir` augmente `orbCount` ; id inconnu ne change rien.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter.** **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: améliorations`.

---

### Task 10: meta.js — monnaie, déblocages, sauvegarde

**Files:**
- Create: `src/meta.js`, `tests/meta.test.js`

**Interfaces:**
- Consumes: `CONFIG.META`.
- Produces:
  - `defaultSave() -> Save` : `{coins: 0, unlockedWeapons: ['pistolet'], bonuses: [], selectedWeapon: 'pistolet', hand: 'gauche'}`.
  - `loadSave(storage: {getItem}|null|undefined) -> Save` : renvoie `defaultSave()` si `storage` est absent, si `getItem` lève une exception, si le JSON est invalide ou si la forme est incorrecte (Review Focus 5) ; fusionne les champs manquants avec les valeurs par défaut.
  - `writeSave(storage, save) -> boolean` (faux, sans exception, si l'écriture échoue). Clé : `'roguelite-une-main-save'`.
  - `coinsForRun({roomsCleared: number, bossDefeated: boolean}) -> number` (`roomsCleared * 5`, + 50 si boss).
  - `purchase(save, itemId) -> {ok: boolean, save: Save}` : refuse si pièces insuffisantes ou déjà possédé ; sinon débite, ajoute l'arme à `unlockedWeapons` ou le bonus à `bonuses` ; ne modifie pas l'objet d'origine.
  - `selectWeapon(save, weaponId) -> Save` (ignoré si l'arme n'est pas débloquée) ; `applyStartBonuses(save, player) -> void` (`bonus_coeur` : +1 `maxHearts` et `hearts` ; `bonus_vitesse` : `speed` ×1,1).

- [ ] **Step 1: Tests qui échouent** : `loadSave(null)`, `loadSave` avec `getItem` qui lève, `loadSave` avec `'{pas du json'` et avec `'42'` → tous égaux à `defaultSave()` ; sauvegarde partielle `{"coins":12}` → `coins 12` et les autres champs par défaut ; `writeSave` avec `setItem` qui lève → `false` ; `coinsForRun({roomsCleared:8, bossDefeated:true})` = 90 ; `purchase` de `laser` avec 49 pièces → `ok: false` ; avec 50 pièces → `ok: true`, `coins` à 0, `laser` débloqué ; second achat → `ok: false` ; `selectWeapon` d'une arme verrouillée ne change rien ; `applyStartBonuses` avec `bonus_coeur` donne 4 cœurs.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter.** **Step 4: Lancer** → PASS.
- [ ] **Step 5: Commit** `feat: méta-progression et sauvegarde`.

---

### Task 11: render.js et main.js — le jeu jouable

**Files:**
- Create: `src/render.js`, `src/main.js`, `tests/loop.test.js`
- Modify: `index.html` (si besoin)

**Interfaces:**
- Consumes: tous les modules précédents.
- Produces:
  - `stepFrames(accumulator: number, frameDt: number) -> {steps: number, accumulator: number}` exporté de `src/loop.js` (fichier pur, donc testable) : plafonne `frameDt` à `CONFIG.MAX_FRAME_DT`, renvoie le nombre de pas de `FIXED_DT` à exécuter et le reste.
  - `render.js` : `drawTitle(ctx, save)`, `drawRun(ctx, game)`, `drawUpgrade(ctx, choices, selectedIndex)`, `drawPause(ctx)`, `drawEnd(ctx, summary, save)`, `drawShop(ctx, save, selectedIndex)`. Aucune ne modifie l'état du jeu.
  - `main.js` : crée le canvas, `createInput(window)`, charge la sauvegarde, exécute la boucle `requestAnimationFrame` avec `stepFrames`, et relie logique et affichage.

- [ ] **Step 1: Test qui échoue** `tests/loop.test.js` : `stepFrames(0, 1/60)` → 1 pas ; `stepFrames(0, 0.1)` → 6 pas ; **`stepFrames(0, 60)` (onglet en arrière-plan) → au plus `0.25 / FIXED_DT` pas** (Review Focus 4) ; le reste est toujours `< FIXED_DT`.
- [ ] **Step 2: Lancer** → échec. **Step 3: Implémenter `src/loop.js`.** **Step 4: Lancer** `npm test` → PASS.
- [ ] **Step 5: Implémenter `render.js`** : formes géométriques (cercles pour joueur/ennemis/projectiles, jauge de vie du boss, cœurs en haut à gauche, numéro de salle). Écran titre : titre, **main active (Gauche/Droite) avec les touches à utiliser, Tab pour basculer**, « Espace : jouer », accès à la boutique.
- [ ] **Step 6: Implémenter `main.js`** : glue des états de `state.js`. `run` : met à jour joueur, armes, ennemis, projectiles, collisions (projectiles joueur→ennemis, projectiles et contact ennemis→joueur, explosions), lance la vague suivante quand `aliveCount === 0`, déclenche `roomCleared`, puis le boss après la salle 8. `upgrade` : 3 cartes, navigation gauche/droite + Dash, raccourcis `Digit1..3`. Fin de run : crédite `coinsForRun`, sauvegarde, écran de fin puis titre. La main choisie (Tab) est enregistrée dans la sauvegarde. Applique `applyStartBonuses` et l'arme sélectionnée au début de chaque run. Menus et boutique : uniquement haut/bas/gauche/droite + Dash.
- [ ] **Step 7: Vérification manuelle** : `npm start`, ouvrir `http://localhost:8080`. Attendus : (a) l'écran titre s'affiche et Tab bascule l'indication de main ; (b) avec ZQSD **puis** avec les flèches, le joueur bouge, le tir part tout seul, Espace dash ; (c) tout le jeu (titre, run, choix d'amélioration, pause, fin, boutique) se pilote sans souris ; (d) la console ne montre aucune erreur.
- [ ] **Step 8: Commit** `feat: rendu et boucle principale`.

---

### Task 12: Run complète et réglage

**Files:**
- Modify: `src/config.js` (valeurs d'équilibrage uniquement, si nécessaire)

- [ ] **Step 1: Jouer une run complète** avec la disposition main gauche, puis une avec la main droite : 8 salles, boss, écran de fin, pièces créditées. Attendu : durée entre 12 et 25 minutes ; chaque ennemi et chaque phase du boss est observable.
- [ ] **Step 2: Vérifier la persistance** : recharger la page → pièces, armes débloquées et main choisie conservées. Acheter l'éventail, le sélectionner, lancer une run : l'éventail tire 5 projectiles.
- [ ] **Step 3: Vérifier la robustesse** : vider le `localStorage` ou y mettre `{pas du json`, recharger → le jeu démarre normalement ; laisser l'onglet en arrière-plan 30 s puis revenir → aucun saut anormal.
- [ ] **Step 4: Ajuster `config.js`** si la run est trop facile ou trop dure, relancer `npm test` (PASS attendu), noter les changements dans le message de commit.
- [ ] **Step 5: Commit** `chore: équilibrage v1`.

---

### Task 13: Finitions et bonnes pratiques du dépôt

**Files:**
- Create: `README.md`, `LICENSE`, `.editorconfig`, `.gitattributes`, `.github/workflows/ci.yml`
- Modify: `.gitignore`, `package.json`

Le dépôt git existe déjà et est relié à `https://github.com/Tonoplas909/hand-lite.git` (branche `main`) : ne pas refaire `git init`.

- [ ] **Step 1: `README.md`** : titre et pitch d'une phrase ; section Jeu (principe, jouable d'une main, contenu : 8 salles + boss, 5 ennemis, 4 armes, 8 améliorations) ; tableau des contrôles (ZQSD/WASD + flèches, Espace = dash/confirmer, Échap = pause, Tab = changer de main) ; Lancer le jeu (`npm start` puis `http://localhost:8080`, prérequis Python 3) ; Tests (`npm test`, prérequis Node ≥ 18) ; structure du dossier (`src/`, `tests/`, `docs/`) avec renvoi vers `docs/spec-design.md` et le plan ; licence.
- [ ] **Step 2: `.gitignore`** : compléter avec `node_modules/`, `.DS_Store`, `Thumbs.db`, `*.log`, `.vscode/`, `.idea/`, `.env`, `.claude/`.
- [ ] **Step 3: `.editorconfig`** (UTF-8, fin de ligne LF, indentation 2 espaces, newline final, suppression des espaces en fin de ligne) et `.gitattributes` (`* text=auto eol=lf`).
- [ ] **Step 4: `LICENSE`** (MIT, année 2026, titulaire Tonoplas909) ; renseigner `"license": "MIT"` dans `package.json`, ainsi que `description`, `repository` (URL du dépôt), `engines.node` (`>=18`) et `"private": true`.
- [ ] **Step 5: CI** `.github/workflows/ci.yml` : sur `push` et `pull_request` vers `main`, job Ubuntu avec `actions/checkout`, `actions/setup-node` (Node 20), puis `npm test`.
- [ ] **Step 6: Vérifier** : `npm test` → PASS ; relire le README en suivant ses propres instructions depuis zéro (cloner dans un dossier vide, `npm start`, le jeu s'ouvre) ; `git status` ne montre aucun fichier parasite.
- [ ] **Step 7: Commit et push** `docs: readme, licence et configuration du dépôt` puis `git push`. Vérifier que la CI passe au vert sur GitHub.

---

## Self-review (faite)

- **Couverture de la spec** : contrôles et dispositions (T2, T11), boucle de jeu et 8 salles + boss (T8, T7, T11), 5 ennemis (T6), boss à 3 phases (T7), 4 armes (T5), 8 améliorations (T9), méta et sauvegarde (T10), temps fixe (T11), tests (toutes les tâches) — aucun manque.
- **Cohérence des types** : `Player`, `Weapon`, `Enemy`, `Projectile` définis en T4–T6 et réutilisés tels quels en T7–T11 ; `moveVector`, `actionsFromKeys`, `nextState`, `drawChoices`, `applyUpgrade` gardent les mêmes noms partout.
- **Écart avec la spec** : ajout de `src/rng.js` et `src/loop.js` (fichiers purs, un rôle chacun) ; la spec §6.1 est à compléter.
