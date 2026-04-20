# Décisions produit & techniques

Ce document synthétise les arbitrages tranchés lors du cadrage. Il sert de référence pour tout agent (ou toute reprise du projet). **Ne pas remettre en cause ces décisions sans raison explicite.**

---

## 1. Axe d'approfondissement retenu

**Animation / temporalité** (replay, pause, scrub, vitesse) + **gestion propre des inputs malformés**.

Justification : démontre la séparation logique métier / rendu temporel (évalué par le jury), et la robustesse du parser (code prod-ready). Ces deux axes se renforcent — un scrubber n'a de sens que si la logique est déterministe et pure.

## 2. Écartés volontairement

| Axe | Raison |
|---|---|
| Multi-rovers parallèles | Un seul rover par scénario. La spec autorise N rovers séquentiels, mais on limite à 1 pour simplifier la timeline et l'UI. |
| Planète sphérique | Trop coûteux en temps (modélisation géométrique + cohérence F/L/R sur surface courbe). |
| Obstacles / terrain non trivial | Hors périmètre choisi, grille vide. |
| Rendu réaliste (textures, skybox) | Le jury a explicitement dit que la beauté des textures n'est pas évaluée. |
| Persistence disque/réseau | Tout en mémoire. Partage de scénarios par URL. |

## 3. Stack

| Couche | Techno |
|---|---|
| Monorepo | pnpm + Turborepo + Biome (Ultracite) |
| Logique rover | `packages/core` — TypeScript pur + Vitest |
| App | `apps/web` — React + TanStack Router + React Three Fiber + `@react-three/drei` |
| CI | GitHub Actions (test + typecheck + lint) |
| Déploiement | Cloudflare Pages |

## 4. Décisions de cadrage

### 4.1 Axes géométriques

- Plan XZ, Y = up (standard Three.js).
- Mapping spec → scène : `rover.x → scene.x`, `rover.y → -scene.z`.
- Conséquence : en vue orbit par défaut (caméra face +Z), le Nord (+y spec) pointe vers le fond de la scène. Lisible.
- On s'appuie sur `<Grid>` de drei pour la grille — pas de géométrie maison.

### 4.2 Sémantique LOST

- Quand un rover sort de la grille : marqué LOST, **commandes restantes ignorées**, dernière position valide conservée.
- Pas de "marqueur mémoire" sur la grille (version simple du problème classique).
- Un seul rover → la question du comportement des rovers suivants ne se pose pas.

### 4.3 Stratégie parser

- **Hard-fail session entière** : une seule erreur → liste complète d'erreurs retournée, zéro rover chargé.
- Erreurs catégorisées (pour affichage UX clair, pas juste un "invalid input") :
  - `InvalidGridHeader` : première ligne mal formée
  - `InvalidRoverLine` : ligne rover mal formée
  - `InvalidOrientation` : orientation hors {N, E, S, W}
  - `InvalidCommandChar` : caractère de commande hors {F, L, R}
  - `OutOfBoundsInitial` : position initiale hors grille
  - `EmptyInput` : input vide
  - `DuplicateRoverCount` : ≥ 2 rovers (on limite à 1)
- Chaque erreur porte une position (ligne, colonne si applicable) pour l'affichage.

### 4.4 Affichage des états finaux

- **Label 3D** via `<Html>` drei au-dessus du rover.
- Format `(x,y,O)` pendant / en fin de trace, `(x,y,O) LOST` en rouge si perdu.
- Pas d'overlay HTML global (sauf les erreurs parser + états finaux dans le terminal input).

### 4.5 Timeline / replay

- **1 step = 1 commande atomique** (F, L ou R).
- Durée par défaut : 400ms par step.
- **Slider vitesse continu** : 0.1× à 5×.
- Scrubber : seek d'un step arbitraire = **recalcul déterministe depuis le début** via `execute` (pas de mutation d'état, garantit reproductibilité).
- Contrôles : play, pause, step prev, step next, reset.
- Interpolation position (lerp) et orientation (slerp) pour des transitions fluides.

### 4.6 Saisie du scénario

- UX "terminal de commande" : `<textarea>` stylée (police mono, thème sombre, préfixe décoratif `rover>` par ligne).
- Pas de vraie lib terminal (xterm.js overkill pour le besoin).
- Ctrl+Enter → sérialisation dans URL search param → parse par le core.
- Sous le terminal :
  - Bloc erreurs catégorisées (ex : `[E02] Invalid command char 'X' at line 2 col 17`)
  - Bloc états finaux au format spec (`(4,4,E)\n(0,4,W) LOST`)

### 4.7 URL / partage

- **TanStack Router** avec search params **Zod-validés**.
- Param unique `scenario` : texte brut multi-lignes URL-encodé.
- Permet le partage de scénarios par simple copie d'URL.
- Source unique de vérité : l'URL. Le composant terminal = éditeur qui écrit dans l'URL.

### 4.8 Caméras

- **MVP** : Orbit uniquement (drei `<OrbitControls>`).
- **Stretch** (ticket séparé APP-007) : Follow + FPV.
  - Follow : caméra à `rover + offset arrière-haut`, `lookAt(rover)`, lerp smooth.
  - FPV : caméra à la position du rover, direction d'orientation. Rotation L/R lerpée sur 200ms pour éviter le snap.

## 5. Bonus retenus (ordre de priorité)

1. **Timeline scrubber** + contrôles vitesse — **MVP**
2. Ghost trail (cases visitées, opacité dégradée) — **stretch**
3. Caméras Follow + FPV — **stretch**
4. Bench perf 10k commandes < 50ms — **stretch**

## 6. Contraintes non-négociables

- Phase 1 (core + tests) = 100% solo, fondation.
- Tests Vitest écrits dès le core (test-first sur parser et engine).
- Chaque ticket ≤ 25min.
- `README.md` et `PROMPTS.md` = tickets à part entière, pas un "reste à faire" final.
- Dernier ticket = déploiement Cloudflare + vérification prod.

---

## 7. Timeline d'exécution

### Chemin critique

```
T=0    CORE-001 (#2)          20min  [main]
T=20   CORE-002 (#3)          20min  [main]
T=40   CORE-003 (#4) stretch  10min  [main] — fold dans PR core si rapide
T=50   APP-001  (#5)          20min  [main]

T=70   APP-002  (#6)          25min  [main]
       CI-001   (#12)         10min  [agent2] — lancer ici, zéro conflit

T=95   APP-003  (#7)          25min  [main]

T=120  APP-004  (#8)          25min  [main]
       APP-005  (#9)          10min  [agent2] — 1 ligne Scene.tsx, merge trivial

T=145  POINT DE DÉCISION BUDGET
         Option stretch active :
T=145    APP-006 (#10)        20min  [main]
T=165    APP-007 (#11)        20min  [main]

       Finalisation :
T=185  DOC-001  (#13)         15min  [main]
       DOC-002  (#14)         10min  [agent2]

T=200  DEPLOY-001 (#15)       15min  [main]
```

Fin MVP sans stretch : T=175 (2h55).
Fin avec stretch complet : T=215 (3h35).

### Parallélisation Conductor

2 workspaces maximum. Agent secondaire a 3 fenêtres d'activité :

| Fenêtre | Ticket | Branche suggérée | Conflit |
|---|---|---|---|
| T=70 → T=80 | CI-001 | `fsioni/ci-workflow` | zéro (fichier neuf) |
| T=120 → T=130 | APP-005 | `fsioni/rover-label` | 1 ligne dans `Scene.tsx` (trivial) |
| T=185 → T=195 | DOC-002 | `fsioni/prompts-md` | zéro (fichier neuf) |

### Règles de dispatch

- Agent principal sur chemin critique séquentiel.
- Agent secondaire UNIQUEMENT si :
  - Dépendances mergées sur `main`.
  - Fichiers touchés disjoints OU conflit trivial documenté dans le ticket.
- Avant de toucher un fichier, vérifier que le ticket le liste dans son "Scope".
- Branches : prefix `fsioni/` + nom concret (≤ 30 chars).
