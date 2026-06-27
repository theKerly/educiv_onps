import type { OrientationRecommendation, Serie } from "../types/domain";
import { FILIERES, IVORIAN_BAC_AVERAGES, SKILLS_KEYS, YEAR_CONTRIBUTION, type FiliereDefinition } from "../params";

/**
 * Candidate profile for the Orientation Post-Bac simulator.
 * Every field is OPTIONAL. The simulator gracefully degrades when data is missing.
 */
export interface CandidateProfile {
  serie?: Serie;
  notes?: {
    seconde?: Partial<Record<string, number>>;
    premiere?: Partial<Record<string, number>>;
    terminale?: Partial<Record<string, number>>;
  };
  engagement?: number; // 0-100
  regularity?: number; // 0-100
  skills?: Partial<Record<(typeof SKILLS_KEYS)[number], number>>;
}

/** Combined subject mean across years, weighted by YEAR_CONTRIBUTION. */
function subjectMean(profile: CandidateProfile, subject: string): { value: number; coverage: number } {
  const layers = [
    { year: "Seconde",   w: YEAR_CONTRIBUTION.Seconde,   note: profile.notes?.seconde?.[subject] },
    { year: "Premiere",  w: YEAR_CONTRIBUTION.Premiere,  note: profile.notes?.premiere?.[subject] },
    { year: "Terminale", w: YEAR_CONTRIBUTION.Terminale, note: profile.notes?.terminale?.[subject] },
  ];
  const present = layers.filter(l => typeof l.note === "number");
  if (present.length === 0) return { value: NaN, coverage: 0 };
  const totalW = present.reduce((s, l) => s + l.w, 0);
  const weighted = present.reduce((s, l) => s + (l.note as number) * l.w, 0) / totalW;
  return { value: weighted, coverage: totalW };
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

function scoreFiliere(profile: CandidateProfile, f: FiliereDefinition): OrientationRecommendation {
  const cohort = profile.serie ? IVORIAN_BAC_AVERAGES[profile.serie] ?? {} : {};

  // 1) academic component — normalised z-score vs national cohort means
  let academic = 0;
  let weightSum = 0;
  const subjectContribs: OrientationRecommendation["variableContributions"] = [];
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const [subject, w] of Object.entries(f.subjectWeights)) {
    const { value, coverage } = subjectMean(profile, subject);
    if (!Number.isFinite(value)) continue; // missing → skip, do not penalise
    const ref = cohort[subject] ?? 10.5;
    // normalised: −1 (poor) → 0 (cohort) → +1 (excellent)
    const norm = Math.max(-1, Math.min(1, (value - ref) / 4));
    const score01 = (norm + 1) / 2;
    academic   += w * score01 * coverage;
    weightSum  += w * coverage;
    subjectContribs.push({ name: subject, weight: w, contribution: +(w * score01).toFixed(3) });
    if (norm >= 0.4) strengths.push(`${subject.replace(/_/g, " ")} (${value.toFixed(1)}/20)`);
    if (norm <= -0.4) weaknesses.push(`${subject.replace(/_/g, " ")} (${value.toFixed(1)}/20)`);
    if (f.minPerSubject?.[subject] !== undefined && value < (f.minPerSubject[subject] as number))
      weaknesses.push(`${subject.replace(/_/g, " ")} en dessous du seuil`);
  }
  const academic01 = weightSum > 0 ? academic / weightSum : 0.5;

  // 2) engagement + regularity
  const engagement01 = (profile.engagement ?? 65) / 100;
  const regularity01 = (profile.regularity ?? 65) / 100;

  // 3) transverse skills
  let skills01 = 0;
  let skillW = 0;
  for (const [k, w] of Object.entries(f.skillsWeight)) {
    const v = profile.skills?.[k as (typeof SKILLS_KEYS)[number]];
    if (typeof v !== "number") continue;
    skills01 += (v / 100) * (w as number);
    skillW += w as number;
  }
  const skillsScore01 = skillW > 0 ? skills01 / skillW : 0.6;

  // weighted compatibility 0-1
  const academicWeight = 1 - f.engagementWeight - f.regularityWeight -
    Object.values(f.skillsWeight).reduce((a, b) => a + (b ?? 0), 0) * 0.15;
  const aw = Math.max(0.3, academicWeight);
  const compat01 =
    aw * academic01 +
    f.engagementWeight * engagement01 +
    f.regularityWeight * regularity01 +
    0.15 * skillsScore01;

  // success probability — logistic with difficulty offset
  const z = (compat01 - 0.5) * 4 - (f.difficulty - 0.5) * 2;
  const success = sigmoid(z);

  // confidence based on data coverage
  const coverageRatio = subjectContribs.length / Math.max(1, Object.keys(f.subjectWeights).length);
  const confidence = 0.4 + 0.5 * coverageRatio + (profile.serie ? 0.1 : 0);

  return {
    filiere: f.filiere,
    category: f.category,
    compatibilityScore: Math.round(compat01 * 100),
    successProbability: success,
    confidence: Math.min(0.95, confidence),
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    decisiveSubjects: Object.entries(f.subjectWeights)
      .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s.replace(/_/g, " ")),
    justification:
      `Compatibilité ${Math.round(compat01 * 100)}% — pondération académique ${(aw * 100).toFixed(0)}%, ` +
      `engagement ${(f.engagementWeight * 100).toFixed(0)}%, régularité ${(f.regularityWeight * 100).toFixed(0)}%. ` +
      `Difficulté de la filière : ${(f.difficulty * 100).toFixed(0)}/100.`,
    variableContributions: subjectContribs.sort((a, b) => b.contribution - a.contribution),
  };
}

/**
 * Run the simulator against every catalog filière. The candidate can leave any
 * field blank; missing notes are ignored (never penalised).
 */
export function recommendOrientation(profile: CandidateProfile): OrientationRecommendation[] {
  const candidates = profile.serie ? FILIERES.filter(f => f.series.includes(profile.serie as Serie)) : FILIERES;
  return candidates
    .map(f => scoreFiliere(profile, f))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/** Year-level contribution to an overall score (UI helper). */
export function yearContributions(profile: CandidateProfile) {
  const meanOfYear = (year: keyof NonNullable<CandidateProfile["notes"]>) => {
    const block = profile.notes?.[year] ?? {};
    const vals = Object.values(block).filter((v): v is number => typeof v === "number");
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };
  return [
    { year: "Seconde",   weight: YEAR_CONTRIBUTION.Seconde,   mean: meanOfYear("seconde") },
    { year: "Premiere",  weight: YEAR_CONTRIBUTION.Premiere,  mean: meanOfYear("premiere") },
    { year: "Terminale", weight: YEAR_CONTRIBUTION.Terminale, mean: meanOfYear("terminale") },
  ];
}