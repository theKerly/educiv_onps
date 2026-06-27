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

## Transparence

Tous les modèles sont des **simulations explicites** (régression logistique / combinaisons linéaires).
Ils ne sont **pas entraînés** sur des données réelles du Ministère. Les paramètres sont éditables dans le fichier ci-dessus pour calibrage.