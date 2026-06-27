# ONPS — Observatoire National de la Performance Scolaire

Plateforme nationale de pilotage de la performance scolaire en Côte d'Ivoire, combinant **Business Intelligence**, **Data Analytics**, **Data Visualisation**, **Intelligence Artificielle** et **Analyse prédictive**.

## Stack technique

- React 19 + TypeScript + Vite
- TanStack Router (file-based) + TanStack Query
- Tailwind CSS v4 + shadcn/ui
- Recharts pour la dataviz
- Lovable Cloud (Supabase PostgreSQL) — couche backend optionnelle

## Organisation du projet

```
src/
├── routes/                     # pages (file-based routing)
│   ├── __root.tsx              # shell global (sidebar + topbar)
│   ├── index.tsx               # Vue nationale
│   ├── regions.tsx             # Vue régionale (DRENA)
│   ├── etablissements/         # Liste + fiche établissement
│   ├── eleves/                 # Liste + fiche élève (4 dimensions)
│   ├── enseignants/            # Pilotage RH pédagogique
│   ├── predictif.tsx           # Catalogue des modèles IA
│   ├── orientation.tsx         # Simulateur Post-Bac
│   ├── rapports.tsx            # Génération PDF/Excel/CSV
│   ├── classements.tsx         # Top élèves / écoles / enseignants
│   ├── parametres.tsx          # Paramètres des modèles
│   └── docs.tsx                # Index documentation
├── components/
│   ├── layout/AppSidebar.tsx
│   ├── dashboard/              # KpiCard, ChartCard, PageShell, SectionHeader
│   └── ui/                     # shadcn/ui
├── lib/
│   ├── types/domain.ts         # types métier
│   ├── params/index.ts         # ⚙️ TOUS les coefficients / poids / seuils
│   ├── data/                   # générateur déterministe (preset lourd)
│   ├── ai/                     # scoring, prédictions, orientation
│   └── services/               # couche de service (UI ⇄ data)
└── styles.css                  # palette CI (orange / vert / blanc)
```

## Principes

1. **Aucun calcul métier dans les composants React.** Tout passe par `lib/ai/*` et `lib/services/*`.
2. **Aucune constante** (poids, seuils, coefficients) ne vit dans un composant — voir `lib/params/index.ts`.
3. Les composants consomment uniquement des **types du domaine** (`lib/types/domain.ts`), pas des lignes SQL.
4. La couche service est le **seul** point qui convertit les rows DB → objets de domaine.
5. Données simulées : 12 DRENA · ~200 établissements · ~10 000 élèves · ~1 500 enseignants (générateur déterministe).

## Voir aussi

- [`README-postgresql.md`](./README-postgresql.md) — schéma PostgreSQL
- [`README-fields.md`](./README-fields.md) — champs par vue
- [`README-calculations.md`](./README-calculations.md) — formules et calculs
- [`README-ia.md`](./README-ia.md) — paramètres IA
- [`README-backend.md`](./README-backend.md) — connexion backend / PostgreSQL