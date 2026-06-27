import { getDataset } from "../data";
import { predictTeacherSupport } from "../ai/predictions";

export const teacherService = {
  list(filter?: { schoolId?: string }) {
    const ds = getDataset();
    return ds.teachers.filter(t => !filter?.schoolId || t.schoolId === filter.schoolId);
  },
  byId(id: string) {
    const t = getDataset().teachers.find(x => x.id === id);
    if (!t) return null;
    return { teacher: t, support: predictTeacherSupport(t) };
  },
  topPerforming(n = 20) {
    return [...this.list()]
      .map(t => ({
        teacher: t,
        score: (t.maitriseSavoirs + t.efficacitePedagogique + t.progressionEleves + t.gestionClasse) / 4,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, n);
  },
  needingSupport(n = 20) {
    return this.list()
      .map(t => ({ teacher: t, support: predictTeacherSupport(t) }))
      .filter(x => x.support.label === "accompagnement")
      .sort((a, b) => b.support.probability - a.support.probability)
      .slice(0, n);
  },
};