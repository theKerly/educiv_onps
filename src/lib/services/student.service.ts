import { getDataset } from "../data";
import { globalStudentScore } from "../ai/scoring";
import { predictBEPC, predictDropout } from "../ai/predictions";

export const studentService = {
  list(filter?: { schoolId?: string; drenaId?: string; niveau?: string }) {
    const ds = getDataset();
    return ds.students.filter(s =>
      (!filter?.schoolId || s.schoolId === filter.schoolId) &&
      (!filter?.drenaId  || s.drenaId  === filter.drenaId) &&
      (!filter?.niveau   || s.niveau   === filter.niveau)
    );
  },
  byId(id: string) {
    const ds = getDataset();
    const student = ds.students.find(s => s.id === id);
    if (!student) return null;
    const grades = ds.grades.filter(g => g.studentId === id);
    const scores = globalStudentScore(student, grades);
    return {
      student,
      grades,
      scores,
      dropoutRisk: predictDropout(student, grades),
      bepcForecast: predictBEPC(grades),
    };
  },
  topPerformers(n = 20) {
    const ds = getDataset();
    return ds.students
      .map(s => {
        const eng = (s.engagement.attendance + s.engagement.participation + s.engagement.implication) / 3;
        const sk  = (s.skills.espritCritique + s.skills.collaboration + s.skills.resilience) / 3;
        const ctx = (s.context.familyStability + s.context.socioEcoIndex) / 2;
        return { student: s, score: 0.5 * eng + 0.3 * sk + 0.2 * ctx };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  },
  topProgressions(n = 20) {
    const ds = getDataset();
    return ds.students
      .map(s => ({
        student: s,
        progression: (s.engagement.implication + s.skills.resilience - s.context.distanceKm * 2) / 10,
      }))
      .sort((a, b) => b.progression - a.progression)
      .slice(0, n);
  },
};