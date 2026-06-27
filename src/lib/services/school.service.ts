import { getDataset } from "../data";
import type { School } from "../types/domain";
import { predictSchoolRisk } from "../ai/predictions";

export const schoolService = {
  list(): School[] { return getDataset().schools; },
  byId(id: string) { return getDataset().schools.find(s => s.id === id); },
  byDrena(drenaId: string) { return this.list().filter(s => s.drenaId === drenaId); },
  topPerforming(n = 10) {
    return [...this.list()].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, n);
  },
  atRisk(n = 10) {
    return this.list()
      .map(s => ({ school: s, risk: predictSchoolRisk(s) }))
      .filter(r => r.risk.label === "a_risque")
      .sort((a, b) => b.risk.probability - a.risk.probability)
      .slice(0, n);
  },
  details(id: string) {
    const s = this.byId(id); if (!s) return null;
    const ds = getDataset();
    const teachers = ds.teachers.filter(t => t.schoolId === id);
    const students = ds.students.filter(st => st.schoolId === id);
    const exams = ds.exams.filter(e => students.some(st => st.id === e.studentId));
    const bepcExams = exams.filter(e => e.exam === "BEPC");
    const bacExams = exams.filter(e => e.exam === "BAC");
    return {
      school: s,
      teacherCount: teachers.length,
      studentCount: students.length,
      successBepc: bepcExams.filter(e => e.passed).length / Math.max(1, bepcExams.length),
      successBac:  bacExams.filter(e => e.passed).length / Math.max(1, bacExams.length),
      attendanceAvg: students.reduce((acc, x) => acc + x.engagement.attendance, 0) / Math.max(1, students.length),
      risk: predictSchoolRisk(s),
    };
  },
};