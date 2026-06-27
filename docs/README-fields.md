# Champs requis par vue

Pour chaque page, voici les **tables** et **champs** nécessaires pour la rendre.

## Vue nationale (`/`)
- `students` — count, `engagement_attendance`, `gender`
- `schools` — count, `cycle`, `performance_score`
- `teachers` — count
- `drenas` — count
- `exam_results` — `exam`, `passed`

Obligatoires : compteurs + `performance_score` agrégé. Facultatifs : tendance pluriannuelle (sinon dérivée).

## Vue régionale (`/regions`)
- `drenas` — tous champs
- `schools.drena_id, performance_score, cycle, student_count`
- `students.drena_id, engagement_attendance, gender`
- `teachers.school_id`
- `exam_results` joint via students

## Liste établissements (`/etablissements`)
- `schools` — tous champs
- `drenas` — pour les codes/labels

## Fiche établissement (`/etablissements/:id`)
- `schools` — tous champs (notamment `has_internet`, `has_library`, `has_electricity`, `has_water`, `founded_year`)
- `teachers` (joints) — top 8 affichés
- `students` (joints) — pour `engagement_attendance` agrégé
- `exam_results` joint

## Liste élèves (`/eleves`)
- `students` — `first_name, last_name, gender, birth_year, niveau, serie, drena_id, school_id`
- + champs engagement/skills/context pour le score

## Fiche élève (`/eleves/:id`)
- `students` — tous champs (engagement.*, skills.*, context.*)
- `grades` — `subject, value, coefficient, trimester` (obligatoire pour radar / progression)
- `schools` (pour le nom)

Facultatifs (utilisés si présents) : `sanctions`, `rewards`, `attendance`.

## Enseignants (`/enseignants`)
- `teachers` — tous champs
- `schools.name` (pour le rattachement)

## Analyse prédictive (`/predictif`)
- `students` + `grades` (pour le modèle décrochage et BEPC)
- `schools` (modèle risque)
- `teachers` (modèle accompagnement)

## Orientation Post-Bac (`/orientation`)
- Aucun champ obligatoire : tout est saisi via formulaire.
- Facultatif : pré-remplir avec `students.serie` et `grades` (Seconde / Première / Terminale).

## Rapports (`/rapports`)
- Toutes les tables. Les exports lisent les mêmes services que les vues.

## Classements (`/classements`)
- `students`, `schools`, `teachers`, `drenas`.

## Paramètres (`/parametres`)
- Aucun champ DB — lecture seule du fichier `src/lib/params/index.ts`.
  Pour rendre les paramètres modifiables côté DB, créer `ai_models(params jsonb)`.