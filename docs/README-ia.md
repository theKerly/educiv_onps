# Paramètres IA

Tous les paramètres vivent dans `src/lib/params/index.ts`. Aucun composant ne contient de constante métier.

## Blocs

- `ACADEMIC_PARAMS` — poids moyenne / progression / régularité.
- `ENGAGEMENT_WEIGHTS` — 7 axes, somme ≈ 1.
- `SKILLS_KEYS` — 7 compétences transversales.
- `GLOBAL_DIMENSIONS` — pondération des 4 dimensions (perf / engagement / skills / contexte).
- `DROPOUT_MODEL` — `weights`, `intercept`, `alertThreshold`.
- `EXAM_MODEL.BEPC` / `EXAM_MODEL.BAC` — poids par matière et par série.
- `SCHOOL_RISK` — `weights`, `intercept`, `alertThreshold`.
- `IVORIAN_BAC_AVERAGES` — moyennes système par série/matière (référence orientation).
- `FILIERES` — catalogue de filières (BTS, Université, Prépa, Ingénieur, Commerce, Pro).
- `YEAR_CONTRIBUTION` — Seconde 20 % / Première 35 % / Terminale 45 %.
- `UI_THRESHOLDS` — seuils visuels (excellent / bon / alerte / critique).

## Variables expliquées par modèle

| Modèle | Variables | Sortie |
|---|---|---|
| Décrochage | assiduité, progression, engagement, stabilité familiale, distance, sanctions, échecs | probability + label |
| Réussite BEPC | moyennes par matière (Maths, Français, SP, SVT, HG, Anglais…) | probability |
| Risque école | réussite BEPC/BAC, abandon, ratio classe, infra | probability |
| Accompagnement enseignant | 5 KPIs pédagogiques | probability |
| Orientation | académique + engagement + régularité + compétences + difficulté filière | compatibilityScore, successProbability, confidence |
| Réussite BAC | moyennes pondérées série-dépendantes (`predictBAC(grades, serie)`) | probability + label |
| Cohortes (k-means) | 4 dimensions (académique/engagement/skills/contexte) | 4 profils : excellence / potentiel / vulnérable / standard |
| Équité éducative | académique par genre, urbanité, tiers socio-éco | index 0–100 par dimension + global |
| Projections nationales | série temporelle examen + régression linéaire | taux projetés + IC 95 % |

## Modules complémentaires

| Fichier | Rôle |
|---|---|
| `src/lib/ai/cohorts.ts`     | Segmentation k-means embarquée, centroïdes initiaux fixés. |
| `src/lib/ai/equity.ts`      | Index d'équité (genre, urbain/rural, socio-éco). |
| `src/lib/ai/projections.ts` | Régression linéaire + intervalle de confiance pour BAC / BEPC. |
| `src/lib/services/analytics.service.ts` | Agrège cohortes/équité/projections (cache mémoire). |

## Réalisme du dataset synthétique

Le générateur (`src/lib/data/generator.ts`) **n'est pas indépendant** : il
couple explicitement le talent latent d'un élève à son contexte familial,
à la qualité de son établissement et au biais structurel de sa DRENA
(`DRENA_BIAS`). Les notes sont ensuite tirées de ce talent + une dérive
par trimestre influencée par l'implication. Les taux de réussite
aux examens nationaux sont calibrés sur les ordres de grandeur ivoiriens
(BAC ≈ 40 %, BEPC ≈ 55 %), puis modulés par le talent et la DRENA. Cinq
cohortes historiques d'examens (2021 → 2025) sont générées par école pour
permettre les analyses pluri-annuelles et les projections.

## Transparence

Tous les modèles sont des **simulations explicites** (régression logistique / combinaisons linéaires).
Ils ne sont **pas entraînés** sur des données réelles du Ministère. Les paramètres sont éditables dans le fichier ci-dessus pour calibrage.