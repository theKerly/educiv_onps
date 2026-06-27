import { getDataset } from "../data";
import { segmentCohort } from "../ai/cohorts";
import { computeEquity } from "../ai/equity";
import { projectExamSuccess } from "../ai/projections";
import type { Grade } from "../types/domain";

/**
 * Couche analytique de second niveau — agrège des analyses transverses
 * (cohortes, équité, projections) à partir du dataset en mémoire.
 * Les vues UI ne doivent JAMAIS recalculer ces agrégats elles-mêmes.
 */
let _cache: {
  cohorts: ReturnType<typeof segmentCohort>;
  equity: ReturnType<typeof computeEquity>;
  bacProjection: ReturnType<typeof projectExamSuccess>;
  bepcProjection: ReturnType<typeof projectExamSuccess>;
} | null = null;

function build() {
  const ds = getDataset();
  const gradesByStudent = new Map<string, Grade[]>();
  for (const g of ds.grades) {
    const arr = gradesByStudent.get(g.studentId);
    if (arr) arr.push(g); else gradesByStudent.set(g.studentId, [g]);
  }
  // Échantillon raisonnable pour le clustering (perf)
  const sample = ds.students.slice(0, 2000);
  return {
    cohorts: segmentCohort(sample, gradesByStudent),
    equity: computeEquity(sample, ds.grades),
    bacProjection: projectExamSuccess(ds.exams, "BAC", 3),
    bepcProjection: projectExamSuccess(ds.exams, "BEPC", 3),
  };
}

export const analyticsService = {
  all() { if (!_cache) _cache = build(); return _cache; },
  cohorts()  { return this.all().cohorts; },
  equity()   { return this.all().equity; },
  projections() {
    const { bacProjection, bepcProjection } = this.all();
    return { bac: bacProjection, bepc: bepcProjection };
  },
  reset() { _cache = null; },
};