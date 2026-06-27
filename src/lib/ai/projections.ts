/**
 * Projections nationales — extrapolation linéaire de la tendance pluri-annuelle
 * des examens (BAC / BEPC) avec intervalle de confiance basé sur l'écart-type
 * résiduel de la régression.
 */
import type { ExamResult } from "../types/domain";

export interface YearlyExamPoint {
  year: number;
  successRate: number; // 0–1
  sample: number;
}

export interface ProjectionPoint extends YearlyExamPoint {
  projected?: boolean;
  confidenceLow?: number;
  confidenceHigh?: number;
}

function linearRegression(xs: number[], ys: number[]) {
  const n = xs.length;
  const xMean = xs.reduce((a, b) => a + b, 0) / n;
  const yMean = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - xMean) * (ys[i] - yMean);
    den += (xs[i] - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const residuals = xs.map((x, i) => ys[i] - (slope * x + intercept));
  const sigma = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / Math.max(1, n - 2));
  return { slope, intercept, sigma };
}

/**
 * Returns observed years + N projected future years with ±1.96σ CI bands.
 */
export function projectExamSuccess(
  exams: ExamResult[],
  examType: "BAC" | "BEPC",
  horizonYears = 3,
): ProjectionPoint[] {
  const byYear = new Map<number, { passed: number; total: number }>();
  for (const e of exams) {
    if (e.exam !== examType) continue;
    const b = byYear.get(e.year) ?? { passed: 0, total: 0 };
    b.total += 1; if (e.passed) b.passed += 1;
    byYear.set(e.year, b);
  }
  const observed: YearlyExamPoint[] = [...byYear.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, v]) => ({ year, successRate: v.passed / Math.max(1, v.total), sample: v.total }));

  if (observed.length < 2) return observed.map(o => ({ ...o }));

  const xs = observed.map(o => o.year);
  const ys = observed.map(o => o.successRate);
  const { slope, intercept, sigma } = linearRegression(xs, ys);
  const lastYear = xs[xs.length - 1];

  const future: ProjectionPoint[] = [];
  for (let k = 1; k <= horizonYears; k++) {
    const year = lastYear + k;
    const yHat = slope * year + intercept;
    const ci = 1.96 * sigma * Math.sqrt(1 + 1 / xs.length);
    future.push({
      year,
      successRate: Math.max(0, Math.min(1, yHat)),
      sample: 0,
      projected: true,
      confidenceLow: Math.max(0, yHat - ci),
      confidenceHigh: Math.min(1, yHat + ci),
    });
  }
  return [...observed.map(o => ({ ...o })), ...future];
}