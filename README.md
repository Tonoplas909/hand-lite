# Roguelite une main

Roguelite d'arène en temps réel, jouable **entièrement d'une seule main** (gauche ou droite), dans le navigateur. On se déplace, on esquive, le tir est automatique sur l'ennemi le plus proche.

## Le jeu

- Une run : **8 salles** de 2 à 3 vagues, puis un **boss** à 3 phases (tirs en cercle, charges, invocations).
- **5 ennemis** : Rôdeur, Tireur, Lourd, Essaim, Kamikaze.
- **4 armes** : Pistolet (de base), Éventail, Orbes, Laser perçant (les trois dernières se débloquent à la boutique).
- **8 améliorations**, une à choisir parmi trois entre chaque salle.
- Pièces gagnées en fin de run, dépensées à la boutique ; sauvegarde dans le `localStorage` du navigateur.

## Contrôles

| Action | Main gauche | Main droite |
|---|---|---|
| Se déplacer / naviguer dans les menus | Z Q S D (ou W A S D) | Flèches |
| Dash (esquive) / valider | Espace (ou 0 du pavé numérique) | Espace (ou 0 du pavé numérique) |
| Pause | Échap | Échap |
| Changer de main (écran titre) | Tab | Tab |

Les deux dispositions sont actives en même temps. Aucun clic de souris n'est nécessaire. Dans le choix d'amélioration, `1`, `2`, `3` sont des raccourcis.

## Lancer le jeu

Prérequis : Python 3 (pour servir les fichiers, les modules ES ne s'ouvrent pas depuis `file://`).

```bash
npm start
```

Puis ouvrir <http://localhost:8123>.

## Tests

Prérequis : Node.js 18 ou plus. Aucune dépendance à installer.

```bash
npm test
```

## Structure

```
index.html     page et canvas
src/           code du jeu (logique pure + render.js et main.js pour le canvas/DOM)
tests/         tests de la logique pure (node --test)
docs/          spec de design et plan d'implémentation
```

- Spec : [docs/spec-design.md](docs/spec-design.md)
- Plan : [docs/plans/2026-10-27-roguelite-une-main-plan.md](docs/plans/2026-10-27-roguelite-une-main-plan.md)
- Toutes les valeurs d'équilibrage sont dans [src/config.js](src/config.js).

## Licence

[MIT](LICENSE)
