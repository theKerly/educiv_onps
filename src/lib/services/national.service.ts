import { getDataset } from "../data";
import type { NationalKpis } from "../types/domain";

export const nationalService = {
  kpis(): NationalKpis {
    const { students, schools, teachers, drenas, exams } = getDataset();
    const bacExams = exams.filter(e => e.exam === "BAC");
    const bepcExams = exams.filter(e => e.exam === "BEPC");
    const attendance = students.reduce((s, x) => s + x.engagement.attendance, 0) / students.length;
    const perf = schools.reduce((s, x) => s + x.performanceScore, 0) / schools.length;
    const females = students.filter(s => s.gender === "F").length;
    return {
      studentTotal: students.length,
      schoolTotal: schools.length,
      teacherTotal: teachers.length,
      drenaTotal: drenas.length,
      successRateBepc: bepcExams.filter(e => e.passed).length / Math.max(1, bepcExams.length),
      successRateBac:  bacExams.filter(e => e.passed).length / Math.max(1, bacExams.length),
      dropoutRate: 0.085 + (1 - attendance / 100) * 0.4,
      attendanceAvg: attendance,
      performanceAvg: perf,
      genderParity: females / students.length,
    };
  },

  yearlyEvolution() {
    // Synthetic trend — derived deterministically from current KPIs.
    const k = this.kpis();
    const base = k.performanceAvg;
    return [2019, 2020, 2021, 2022, 2023, 2024, 2025].map((year, i) => ({
      year,
      performance: +(base - 6 + i * 1.1).toFixed(1),
      successBepc: +(k.successRateBepc * 100 - 8 + i * 1.4).toFixed(1),
      successBac:  +(k.successRateBac * 100 - 7 + i * 1.2).toFixed(1),
      dropout: +(k.dropoutRate * 100 + 3 - i * 0.5).toFixed(1),
    }));
  },
};