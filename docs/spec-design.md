# Roguelite une main — Spec de design

> Statut : prête pour relecture. Toutes les sections ont été validées par Macalamar en brainstorming.

## 1. Vision

Roguelite d'arène en temps réel, jouable **entièrement d'une seule main**, au **choix main gauche ou main droite**, dans le navigateur. Inspiration : Vampire Survivors / Brotato (auto-visée, placement et esquive).

Critère de succès : une run complète se joue sans jamais utiliser l'autre main ni la souris, avec n'importe laquelle des deux dispositions.

## 2. Contrôles

Tout le jeu repose sur deux types d'actions : se déplacer et dasher. Le tir est automatique sur l'ennemi le plus proche, donc aucune visée. Pas de touche de compétence en v1.

| Action | Rôle |
|---|---|
| Haut / Bas / Gauche / Droite | Se déplacer ; naviguer dans les menus |
| Dash | Esquive avec brève invulnérabilité ; confirmer dans les menus |
| Pause | Mettre en pause / reprendre |

### 2.1 Dispositions

| | Main gauche | Main droite |
|---|---|---|
| Déplacement | Z Q S D (et W A S D) | Flèches |
| Dash / Confirmer | Espace | Espace |
| Pause | Échap | Échap |

- Espace est atteignable du pouce par les deux mains.
- Les deux dispositions de déplacement sont **actives en même temps** (ZQSD, WASD et flèches). Cela couvre AZERTY et QWERTY sans réglage et permet de changer de main en pleine partie.
- Les menus se pilotent avec les touches de déplacement + Dash, sans souris. Les choix d'amélioration (3 cartes) se font en naviguant gauche/droite puis Dash ; 1/2/3 sont un raccourci optionnel.
- L'écran titre affiche la main active (Tab pour basculer), mémorisée dans `localStorage`. Elle sert à l'affichage des aides de touches.
- Les touches sont remappables dans les options.

## 3. Boucle de jeu

- **Run** de ~15–20 min : 8 salles d'arène puis 1 boss.
- Chaque salle : 2 à 3 vagues d'ennemis, croissantes ; la salle est terminée quand elle est vidée.
- Entre deux salles : choix d'1 amélioration parmi 3.
- Mort ou victoire : gain de monnaie permanente, retour à l'écran titre.

## 4. Contenu de la v1

- **Joueur** : 3 cœurs ; dash ~0,3 s d'invulnérabilité, recharge ~1,2 s.
- **Ennemis (5)** : Rôdeur (fonce), Tireur (garde ses distances), Lourd (lent, beaucoup de PV), Essaim (petits, rapides, en groupe), Kamikaze (explose après un signal d'alerte).
- **Boss (1)** : 3 phases — tirs en cercle, charges, invocation d'ennemis.
- **Armes de départ (4)** : Pistolet (de base), Éventail, Orbes, Laser perçant (les 3 dernières à débloquer).
- **Améliorations (1 parmi 3 entre les salles)** : dégâts, cadence, vitesse, cœur/soin, recharge du dash, projectiles perçants, tir multiple, portée.

## 5. Méta-progression

- La monnaie de fin de run achète les armes à débloquer et quelques bonus de départ légers.
- Sauvegarde dans `localStorage`. Si elle est absente ou corrompue, le jeu repart d'une sauvegarde vide sans planter.

## 6. Technique

- JavaScript vanilla + Canvas 2D, sans dépendance ni outil de build.
- Modules ES natifs : un navigateur bloque ces modules en ouverture directe de fichier, donc un mini serveur local est lancé par une commande unique (à préciser dans le plan).
- Graphismes en formes géométriques. Pas de son ni de réseau en v1.

### 6.1 Structure (dans `roguelite-une-main/`)

```
index.html          page + <canvas>, charge les modules
src/
  main.js           boucle de jeu (requestAnimationFrame, pas de temps fixe)
  input.js          lecture clavier, dispositions, remapping
  state.js          machine d'états : titre, run, choix d'amélioration, pause, fin
  player.js         déplacement, dash, vie
  weapons.js        les 4 armes (tir auto, projectiles)
  enemies.js        les 5 types d'ennemis + le boss
  rooms.js          salles, vagues, progression des 8 salles puis du boss
  upgrades.js       liste des améliorations et tirage de 3 cartes
  meta.js           monnaie, déblocages, sauvegarde (localStorage)
  render.js         dessin, interface, menus
  config.js         toutes les valeurs d'équilibrage
  rng.js            aléatoire à graine (tests reproductibles)
  loop.js           calcul des pas de temps fixe (testable)
tests/              tests de la logique pure (node --test)
docs/               specs et plans
```

### 6.2 Principes

- Un fichier = un rôle. `input.js` traduit les touches en actions abstraites (`haut`, `bas`, `gauche`, `droite`, `dash`, `pause`) ; le reste du code ignore quelle main est utilisée.
- La logique (`player`, `enemies`, `weapons`, `rooms`, `upgrades`, `meta`) ne touche jamais au canvas ; seul `render.js` dessine. Elle est donc testable seule.
- Pas de temps fixe : comportement identique quel que soit le nombre d'images par seconde.
- `config.js` centralise tous les chiffres d'équilibrage.

## 7. Tests

- Tests automatiques sur la logique pure : tirage des améliorations, dégâts, déblocages, génération des vagues, chargement d'une sauvegarde corrompue.
- Vérification manuelle dans le navigateur des deux dispositions (main gauche, main droite), des menus sans souris, et d'une run complète.

## 8. Hors périmètre (v1)

Multijoueur, mobile, manette, génération de niveaux complexe, sons, touche de compétence.
