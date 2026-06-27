/**
 * Index d'équité — mesure les écarts de performance entre sous-populations.
 * Sortie 0–100 : 100 = parité parfaite, 0 = écart maximal.
 *
 * Trois dimensions surveillées :
 *   • Genre (M vs F)
 *   • Urbanité (DRENA favorable vs défavorable)
 *   • Socio-éco (tiers supérieur vs tiers inférieur)
 */
import type { Student, Grade } from "../types/domain";
import { academicScore } from "./scoring";

const URBAN_DRENAS = new Set(["drena_1", "drena_2", "drena_3", "drena_4", "drena_5"]); // Abidjan 1-4 + Yamoussoukro

export interface EquityReport {
  global: number; // 0–100
  dimensions: Array<{
    name: string;
    groupA: { label: string; mean: number; n: number };
    groupB: { label: string; mean: number; n: number };
    gap: number;        // |meanA - meanB| en points
    parityIndex: number; // 0–100
    interpretation: string;
  }>;
}

function mean(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

function gapToParity(gap: number): number {
  // gap 0 → 100 ; gap ≥ 25 → 0
  return Math.round(Math.max(0, Math.min(100, 100 - (gap / 25) * 100)));
}

export function computeEquity(students: Student[], grades: Grade[]): EquityReport {
  const gradesById = new Map<string, Grade[]>();
  for (const g of grades) {
    const arr = gradesById.get(g.studentId);
    if (arr) arr.push(g); else gradesById.set(g.studentId, [g]);
  }
  const academicById = new Map<string, number>(
    students.map(s => [s.id, academicScore(gradesById.get(s.id) ?? [])]),
  );

  // --- Genre ---
  const fillesScores = students.filter(s => s.gender === "F").map(s => academicById.get(s.id) ?? 0);
  const garconsScores = students.filter(s => s.gender === "M").map(s => academicById.get(s.id) ?? 0);
  const genderGap = Math.abs(mean(fillesScores) - mean(garconsScores));

  // --- Urbanité ---
  const urbain = students.filter(s => URBAN_DRENAS.has(s.drenaId)).map(s => academicById.get(s.id) ?? 0);
  const rural  = students.filter(s => !URBAN_DRENAS.has(s.drenaId)).map(s => academicById.get(s.id) ?? 0);
  const urbanGap = Math.abs(mean(urbain) - mean(rural));

  // --- Socio-éco (tiers) ---
  const sorted = [...students].sort((a, b) => a.context.socioEcoIndex - b.context.socioEcoIndex);
  const tierSize = Math.floor(sorted.length / 3);
  const bas = sorted.slice(0, tierSize).map(s => academicById.get(s.id) ?? 0);
  const haut = sorted.slice(-tierSize).map(s => academicById.get(s.id) ?? 0);
  const socioGap = Math.abs(mean(bas) - mean(haut));

  const dims = [
    {
      name: "Genre",
      groupA: { label: "Filles", mean: +mean(fillesScores).toFixed(1), n: fillesScores.length },
      groupB: { label: "Garçons", mean: +mean(garconsScores).toFixed(1), n: garconsScores.length },
      gap: +genderGap.toFixed(1),
      parityIndex: gapToParity(genderGap),
      interpretation: genderGap < 3
        ? "Parité quasi parfaite filles/garçons."
        : `Écart de ${genderGap.toFixed(1)} pts entre filles et garçons.`,
    },
    {
      name: "Urbanité",
      groupA: { label: "Urbain (Abidjan/Yam)", mean: +mean(urbain).toFixed(1), n: urbain.length },
      groupB: { label: "Rural / Nord", mean: +mean(rural).toFixed(1), n: rural.length },
      gap: +urbanGap.toFixed(1),
      parityIndex: gapToParity(urbanGap),
      interpretation: urbanGap > 10
        ? "Fracture territoriale marquée — investissement périphérique requis."
        : "Écart urbain/rural contenu.",
    },
    {
      name: "Socio-économique",
      groupA: { label: "Tiers supérieur", mean: +mean(haut).toFixed(1), n: haut.length },
      groupB: { label: "Tiers inférieur", mean: +mean(bas).toFixed(1), n: bas.length },
      gap: +socioGap.toFixed(1),
      parityIndex: gapToParity(socioGap),
      interpretation: socioGap > 12
        ? "Inégalité socio-économique fortement corrélée à la performance."
        : "Reproduction sociale modérée des résultats.",
    },
  ];

  const global = Math.round(dims.reduce((s, d) => s + d.parityIndex, 0) / dims.length);
  return { global, dimensions: dims };
}