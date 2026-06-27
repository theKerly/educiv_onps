/**
 * Segmentation de cohorte — clustering k-means sur 4 dimensions
 * (académique, engagement, compétences, contexte). Implémentation
 * déterministe (seed) et embarquée — aucune dépendance externe.
 *
 * Les centroïdes initiaux sont fixés sur des archétypes pédagogiques
 * connus pour garantir une interprétation stable des clusters :
 *   • Excellence — fort partout
 *   • Potentiel sous-exploité — bonnes compétences, engagement faible
 *   • Vulnérables — contexte difficile, performance fragile
 *   • Standard — autour de la moyenne nationale
 */
import type { Student, Grade } from "../types/domain";
import { globalStudentScore } from "./scoring";

export type CohortLabel = "excellence" | "potentiel" | "vulnerable" | "standard";

export interface CohortCentroid {
  label: CohortLabel;
  title: string;
  academic: number;
  engagement: number;
  skills: number;
  context: number;
}

const INITIAL_CENTROIDS: CohortCentroid[] = [
  { label: "excellence",  title: "Excellence",                academic: 82, engagement: 84, skills: 80, context: 72 },
  { label: "potentiel",   title: "Potentiel sous-exploité",   academic: 60, engagement: 52, skills: 74, context: 60 },
  { label: "vulnerable",  title: "Vulnérables",               academic: 48, engagement: 58, skills: 55, context: 35 },
  { label: "standard",    title: "Standard",                  academic: 65, engagement: 68, skills: 65, context: 60 },
];

interface Point { academic: number; engagement: number; skills: number; context: number; }

const dist = (a: Point, b: Point) =>
  Math.hypot(a.academic - b.academic, a.engagement - b.engagement, a.skills - b.skills, a.context - b.context);

export interface CohortAssignment {
  studentId: string;
  cohort: CohortLabel;
  scores: Point;
}

export interface CohortResult {
  centroids: CohortCentroid[];
  assignments: CohortAssignment[];
  /** Counts per cohort + share of total */
  distribution: Array<{ cohort: CohortLabel; title: string; count: number; share: number }>;
  /** Mean academic/engagement/skills/context per cohort, useful for radar charts */
  profiles: Array<CohortCentroid & { count: number }>;
}

export function segmentCohort(
  students: Student[],
  gradesByStudent: Map<string, Grade[]>,
  iterations = 6,
): CohortResult {
  if (students.length === 0) {
    return {
      centroids: INITIAL_CENTROIDS,
      assignments: [],
      distribution: INITIAL_CENTROIDS.map(c => ({ cohort: c.label, title: c.title, count: 0, share: 0 })),
      profiles: INITIAL_CENTROIDS.map(c => ({ ...c, count: 0 })),
    };
  }

  const points: Array<Point & { studentId: string }> = students.map(s => {
    const g = gradesByStudent.get(s.id) ?? [];
    const sc = globalStudentScore(s, g);
    return { studentId: s.id, academic: sc.academic, engagement: sc.engagement, skills: sc.skills, context: sc.context };
  });

  let centroids = INITIAL_CENTROIDS.map(c => ({ ...c }));
  let assignments: CohortAssignment[] = [];

  for (let it = 0; it < iterations; it++) {
    assignments = points.map(p => {
      let best = centroids[0], bestD = dist(p, centroids[0]);
      for (let i = 1; i < centroids.length; i++) {
        const d = dist(p, centroids[i]);
        if (d < bestD) { best = centroids[i]; bestD = d; }
      }
      return { studentId: p.studentId, cohort: best.label, scores: { academic: p.academic, engagement: p.engagement, skills: p.skills, context: p.context } };
    });

    // Recompute centroids (keep label/title fixed)
    centroids = centroids.map(c => {
      const members = assignments.filter(a => a.cohort === c.label);
      if (members.length === 0) return c;
      const m = members.length;
      return {
        label: c.label,
        title: c.title,
        academic: members.reduce((s, a) => s + a.scores.academic, 0) / m,
        engagement: members.reduce((s, a) => s + a.scores.engagement, 0) / m,
        skills: members.reduce((s, a) => s + a.scores.skills, 0) / m,
        context: members.reduce((s, a) => s + a.scores.context, 0) / m,
      };
    });
  }

  const total = assignments.length;
  const distribution = centroids.map(c => {
    const count = assignments.filter(a => a.cohort === c.label).length;
    return { cohort: c.label, title: c.title, count, share: count / total };
  });
  const profiles = centroids.map(c => ({
    ...c,
    count: assignments.filter(a => a.cohort === c.label).length,
  }));

  return { centroids, assignments, distribution, profiles };
}