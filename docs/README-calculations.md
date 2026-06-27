# Calculs et formules

Tous les calculs métier vivent dans `src/lib/ai/` et `src/lib/services/`. Les **coefficients** proviennent de `src/lib/params/index.ts`.

## Performance académique — `academicScore(grades)`

```
meanComponent        = (mean / meanReferenceScale) * 100 * meanWeight
progressionComponent = clamp01(50 + progression * progressionBonusPerPoint) * progressionWeight
regularityComponent  = regularityScore * regularityWeight
academicScore        = round(meanComponent + progressionComponent + regularityComponent)
```

Une **progression** importante (T3 − T1) est mieux valorisée qu'une moyenne haute mais stagnante.

## Engagement — `engagementScore(student)`
Combinaison linéaire pondérée des 7 indicateurs (`ENGAGEMENT_WEIGHTS`).

## Compétences — `skillsScore(student)`
Moyenne arithmétique des 7 axes (`SKILLS_KEYS`).

## Contexte — `contextFitScore(student)`
Score 0–100 combinant éducation des parents, stabilité familiale, indice socio-éco, accès Internet/livres, pénalité de distance. **Non pénalisant** : sert uniquement à expliquer/contextualiser.

## Score global — `globalStudentScore(student, grades)`
```
global = academic   * GLOBAL_DIMENSIONS.performance
       + engagement * GLOBAL_DIMENSIONS.engagement
       + skills     * GLOBAL_DIMENSIONS.skills
       + context    * GLOBAL_DIMENSIONS.context
```
Pondérations actuelles : 45 / 25 / 20 / 10.

## Prédiction décrochage — `predictDropout(student, grades)`
Régression logistique :
```
z = intercept + Σ wᵢ · xᵢ   ;   p = sigmoid(z)
```
Variables : assiduité, progression, engagement, stabilité familiale, distance, sanctions, échecs passés.

## Prédiction examens — `predictBEPC(grades)` / `predictBAC(grades, serie)`
Moyenne pondérée des matières via `EXAM_MODEL.BEPC.subjectWeights` puis logistique.

## Risque établissement — `predictSchoolRisk(school)`
Indicateurs : réussite BEPC/BAC, abandon, ratio élèves/enseignant, infrastructure.

## Orientation — `recommendOrientation(profile)`
1. Pour chaque filière du catalogue (`FILIERES`), calcul d'un **score académique** normalisé vs. cohorte ivoirienne (`IVORIAN_BAC_AVERAGES`).
2. Ajout de la composante engagement / régularité / compétences (pondérations `engagementWeight`, `regularityWeight`, `skillsWeight`).
3. **Probabilité de réussite** = `sigmoid((compat - 0.5) * 4 - (difficulté - 0.5) * 2)`.
4. **Confiance** dépend du taux de couverture des données fournies.

## Services principaux
| Fichier | Rôle |
|---|---|
| `national.service.ts` | KPIs nationaux, tendance pluriannuelle |
| `drena.service.ts` | Liste / stats / classement par DRENA |
| `school.service.ts` | Liste, fiche, top, risques |
| `student.service.ts` | Liste, fiche complète, top performers / progressions |
| `teacher.service.ts` | Liste, top, recommandations d'accompagnement |