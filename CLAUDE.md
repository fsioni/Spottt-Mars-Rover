# Spottt Mars Rover — test technique AI-assisted

Test technique 2h : simulateur de rover martien avec rendu 3D WebGL. Spec originale dans `docs/consignes.md`.

## Axe d'approfondissement choisi

**Animation / temporalité** (replay, pause, scrub, vitesse) + **gestion propre des inputs malformés**.

Justification complète et tous les arbitrages dans **`docs/decisions.md`** — lecture obligatoire avant tout changement produit ou architecture.

## Stack

- Monorepo pnpm + Turborepo + Biome (Ultracite — voir `.claude/CLAUDE.md` pour les standards de code).
- `packages/core` : TypeScript pur + Vitest (parser + engine rover).
- `apps/web` : React + TanStack Router + React Three Fiber + `@react-three/drei`.
- CI : GitHub Actions (test + typecheck + lint).
- Déploiement : Cloudflare Pages.

## Hors scope — ne pas implémenter

- Multi-rovers (un seul rover par scénario, même si la spec autorise N).
- Planète sphérique.
- Obstacles / terrain non trivial.
- Rendu réaliste (textures, skybox) — lisibilité > esthétique.
- Persistence disque ou réseau. Tout en mémoire, partage via URL.

## Conventions

- **Tests Vitest obligatoires dès le core** (test-first sur parser et engine).
- Branches : `fsioni/<nom-concret>` (≤ 30 caractères).
- PR atomique par ticket, ou regroupée si ensemble logiquement cohérent.
- Code style : Ultracite. `pnpm dlx ultracite fix` avant commit.
- Pas d'emojis dans le code, les commits ou la doc.

## Tickets

13 issues GitHub (#2 → #15), labels `phase-1` / `phase-2` / `phase-3`, `stretch`, `parallelizable`.

```
gh issue list --limit 20
gh issue view <N>
```

Ou https://github.com/fsioni/Spottt-Mars-Rover/issues.

## Dispatch d'agents

Plan d'exécution complet et fenêtres de parallélisation dans `docs/decisions.md` section 7.

Règles :
- Chemin critique solo sur le workspace principal.
- Agent secondaire uniquement sur tickets taggés `parallelizable` dont les dépendances sont mergées sur `main`.
- Avant de modifier un fichier, vérifier qu'il est listé dans le "Scope" du ticket courant.

## Livrables obligatoires

- `README.md` : workflow IA + arbitrage produit (ticket DOC-001).
- `PROMPTS.md` : historique des prompts agents (ticket DOC-002).
- URL de déploiement fonctionnelle Cloudflare Pages (ticket DEPLOY-001).
