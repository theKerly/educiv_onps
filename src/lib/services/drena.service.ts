import { getDataset } from "../data";
import type { Drena } from "../types/domain";

export const drenaService = {
  list(): Drena[] { return getDataset().drenas; },
  byId(id: string): Drena | undefined { return getDataset().drenas.find(d => d.id === id); },
  stats(id: string) {
    const ds = getDataset();
    const schools = ds.schools.filter(s => s.drenaId === id);
    const schoolIds = new Set(schools.map(s => s.id));
    const students = ds.students.filter(s => s.drenaId === id);
    const teachers = ds.teachers.filter(t => schoolIds.has(t.schoolId));
    const exams = ds.exams.filter(e => students.some(st => st.id === e.studentId));
    const bac = exams.filter(e => e.exam === "BAC");
    const bepc = exams.filter(e => e.exam === "BEPC");
    const attendanceAvg = students.reduce((s, x) => s + x.engagement.attendance, 0) / Math.max(1, students.length);
    return {
      schools: schools.length,
      students: students.length,
      teachers: teachers.length,
      attendanceAvg,
      performanceAvg: schools.reduce((s, x) => s + x.performanceScore, 0) / Math.max(1, schools.length),
      successBepc: bepc.filter(e => e.passed).length / Math.max(1, bepc.length),
      successBac: bac.filter(e => e.passed).length / Math.max(1, bac.length),
      dropoutRate: 0.07 + (100 - attendanceAvg) / 250,
      genderParity: students.filter(s => s.gender === "F").length / Math.max(1, students.length),
    };
  },
  ranking() {
    return this.list()
      .map(d => ({ drena: d, ...this.stats(d.id) }))
      .sort((a, b) => b.performanceAvg - a.performanceAvg);
  },
};