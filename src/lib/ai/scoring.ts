import type { Grade, Student } from "../types/domain";
import { ACADEMIC_PARAMS, ENGAGEMENT_WEIGHTS, GLOBAL_DIMENSIONS, SKILLS_KEYS } from "../params";

/** Weighted average over a Grade[]. */
export function weightedMean(grades: Grade[]): number {
  if (grades.length === 0) return 0;
  const num = grades.reduce((s, g) => s + g.value * g.coefficient, 0);
  const den = grades.reduce((s, g) => s + g.coefficient, 0);
  return den === 0 ? 0 : num / den;
}

/** Mean per subject. */
export function meanBySubject(grades: Grade[]): Record<string, number> {
  const acc: Record<string, { sum: number; n: number }> = {};
  for (const g of grades) {
    const a = (acc[g.subject] ||= { sum: 0, n: 0 });
    a.sum += g.value; a.n += 1;
  }
  return Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, v.sum / v.n]));
}

/** Trimester-to-trimester progression (T3 - T1) in raw /20. */
export function progressionScore(grades: Grade[]): number {
  const t1 = grades.filter(g => g.trimester === 1);
  const t3 = grades.filter(g => g.trimester === 3);
  return weightedMean(t3) - weightedMean(t1);
}

/** Standard deviation of trimester means — lower → more regular. */
export function regularityScore(grades: Grade[]): number {
  const means = [1, 2, 3].map(t => weightedMean(grades.filter(g => g.trimester === t)));
  const m = means.reduce((s, v) => s + v, 0) / means.length;
  const variance = means.reduce((s, v) => s + (v - m) ** 2, 0) / means.length;
  const std = Math.sqrt(variance);
  // map std∈[0,4] → score∈[100, 0]
  return Math.max(0, 100 - (std / 4) * 100);
}

/**
 * Academic score 0–100. Rewards progression more than a stagnant high mean
 * (see ACADEMIC_PARAMS in src/lib/params).
 */
export function academicScore(grades: Grade[]): number {
  const mean = weightedMean(grades);
  const meanComponent = (mean / ACADEMIC_PARAMS.meanReferenceScale) * 100 * ACADEMIC_PARAMS.meanWeight;
  const progressionRaw = progressionScore(grades);
  const progressionComponent =
    Math.max(0, Math.min(100, 50 + progressionRaw * ACADEMIC_PARAMS.progressionBonusPerPoint)) *
    ACADEMIC_PARAMS.progressionWeight;
  const regularityComponent = regularityScore(grades) * ACADEMIC_PARAMS.regularityWeight;
  return Math.round(meanComponent + progressionComponent + regularityComponent);
}

export function engagementScore(s: Student): number {
  const e = s.engagement;
  return Math.round(
    e.attendance     * ENGAGEMENT_WEIGHTS.attendance +
    e.punctuality    * ENGAGEMENT_WEIGHTS.punctuality +
    e.participation  * ENGAGEMENT_WEIGHTS.participation +
    e.autonomy       * ENGAGEMENT_WEIGHTS.autonomy +
    e.curiosity      * ENGAGEMENT_WEIGHTS.curiosity +
    e.behavior       * ENGAGEMENT_WEIGHTS.behavior +
    e.implication    * ENGAGEMENT_WEIGHTS.implication
  );
}

export function skillsScore(s: Student): number {
  const vals = SKILLS_KEYS.map(k => s.skills[k]);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export function contextFitScore(s: Student): number {
  const c = s.context;
  const parentBoost = { aucune: 40, primaire: 55, secondaire: 70, superieur: 85 }[c.parentsEducation];
  const distancePenalty = Math.max(0, c.distanceKm - 2) * 2.5;
  return Math.round(Math.max(0, Math.min(100,
    0.30 * parentBoost +
    0.25 * c.familyStability +
    0.20 * c.socioEcoIndex +
    0.15 * (c.internetAtHome ? 80 : 50) +
    0.10 * (c.booksAtHome ? 80 : 50) -
    distancePenalty
  )));
}

/** Global four-dimension score, weights from GLOBAL_DIMENSIONS. */
export function globalStudentScore(s: Student, grades: Grade[]) {
  const academic = academicScore(grades);
  const engagement = engagementScore(s);
  const skills = skillsScore(s);
  const context = contextFitScore(s);
  const global = Math.round(
    academic   * GLOBAL_DIMENSIONS.performance +
    engagement * GLOBAL_DIMENSIONS.engagement  +
    skills     * GLOBAL_DIMENSIONS.skills      +
    context    * GLOBAL_DIMENSIONS.context
  );
  return { academic, engagement, skills, context, global };
}