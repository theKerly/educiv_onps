import type { Grade, School, Student, Teacher, PredictionResult, Serie } from "../types/domain";
import { DROPOUT_MODEL, EXAM_MODEL, SCHOOL_RISK } from "../params";
import { engagementScore, meanBySubject, progressionScore, weightedMean } from "./scoring";

/** Sigmoid for logistic combination. */
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/**
 * Simulated dropout-risk model. Linear combination + sigmoid. Transparent,
 * configurable via DROPOUT_MODEL in src/lib/params. Not trained on real data.
 */
export function predictDropout(s: Student, grades: Grade[]): PredictionResult<"a_risque" | "stable"> {
  const W = DROPOUT_MODEL.weights;
  const sanctions = (100 - s.engagement.behavior) / 100;
  const pastFail = Math.max(0, (10 - weightedMean(grades)) / 10);
  const z =
    DROPOUT_MODEL.intercept +
    W.attendance       * (s.engagement.attendance / 100) +
    W.progression      * Math.max(0, progressionScore(grades) / 4) +
    W.engagement       * (engagementScore(s) / 100) +
    W.familyStability  * (s.context.familyStability / 100) +
    W.distanceKm       * (s.context.distanceKm / 25) +
    W.sanctions        * sanctions +
    W.pastFailures     * pastFail;

  const p = sigmoid(z);
  const sumAbsW = Object.values(W).reduce((a, b) => a + Math.abs(b), 0);
  return {
    label: p > DROPOUT_MODEL.alertThreshold ? "a_risque" : "stable",
    probability: p,
    confidence: 0.55 + 0.4 * Math.abs(p - 0.5) * 2,
    variables: [
      { name: "Assiduité",         importance: Math.abs(W.attendance) / sumAbsW,      value: s.engagement.attendance },
      { name: "Progression",       importance: Math.abs(W.progression) / sumAbsW,     value: +progressionScore(grades).toFixed(2) },
      { name: "Engagement",        importance: Math.abs(W.engagement) / sumAbsW,      value: engagementScore(s) },
      { name: "Stabilité familiale", importance: Math.abs(W.familyStability) / sumAbsW, value: s.context.familyStability },
      { name: "Distance domicile-école", importance: Math.abs(W.distanceKm) / sumAbsW, value: s.context.distanceKm },
      { name: "Sanctions / comportement", importance: Math.abs(W.sanctions) / sumAbsW, value: +sanctions.toFixed(2) },
      { name: "Échecs antérieurs", importance: Math.abs(W.pastFailures) / sumAbsW,    value: +pastFail.toFixed(2) },
    ].sort((a, b) => b.importance - a.importance),
    explanation:
      p > DROPOUT_MODEL.alertThreshold
        ? "Le faisceau d'indicateurs (assiduité, progression, contexte) suggère un risque élevé de décrochage."
        : "Profil stable : indicateurs majoritairement favorables.",
  };
}

/** BEPC pass probability — weighted subject means projected via logistic. */
export function predictBEPC(grades: Grade[]): PredictionResult<"reussite" | "echec"> {
  const means = meanBySubject(grades);
  const W = EXAM_MODEL.BEPC.subjectWeights;
  const sumAbsW = Object.values(W).reduce((a, b) => a + Math.abs(b), 0);
  const weightedSum = Object.entries(W).reduce((s, [sub, w]) => s + (means[sub] ?? 10) * w, 0);
  const z = EXAM_MODEL.BEPC.intercept + (weightedSum - EXAM_MODEL.BEPC.successThreshold) * 0.6;
  const p = sigmoid(z);
  return {
    label: p > 0.5 ? "reussite" : "echec",
    probability: p,
    confidence: 0.6 + 0.4 * Math.abs(p - 0.5) * 2,
    variables: Object.entries(W).map(([sub, w]) => ({
      name: sub.replace(/_/g, " "),
      importance: Math.abs(w) / sumAbsW,
      value: +(means[sub] ?? 10).toFixed(2),
    })).sort((a, b) => b.importance - a.importance),
    explanation: `Projection logistique pondérée. Moyenne pondérée projetée: ${weightedSum.toFixed(2)}/20.`,
  };
}

/**
 * BAC pass probability — série-dépendante. Utilise les pondérations
 * matières définies dans EXAM_MODEL.BAC.seriesWeights[<serie>]. Tombe
 * en repli sur la série D si la série fournie n'est pas dans le catalogue.
 */
export function predictBAC(
  grades: Grade[],
  serie: Serie = "D",
): PredictionResult<"reussite" | "echec"> {
  const W = EXAM_MODEL.BAC.seriesWeights[serie] ?? EXAM_MODEL.BAC.seriesWeights.D;
  const means = meanBySubject(grades);
  const sumAbsW = Object.values(W).reduce((a, b) => a + Math.abs(b), 0);
  const weightedSum = Object.entries(W).reduce((s, [sub, w]) => s + (means[sub] ?? 10) * w, 0);
  const z = EXAM_MODEL.BAC.intercept + (weightedSum - EXAM_MODEL.BAC.successThreshold) * 0.55;
  const p = sigmoid(z);
  return {
    label: p > 0.5 ? "reussite" : "echec",
    probability: p,
    confidence: 0.55 + 0.4 * Math.abs(p - 0.5) * 2,
    variables: Object.entries(W).map(([sub, w]) => ({
      name: sub.replace(/_/g, " "),
      importance: Math.abs(w) / sumAbsW,
      value: +(means[sub] ?? 10).toFixed(2),
    })).sort((a, b) => b.importance - a.importance),
    explanation:
      `Projection logistique série ${serie}. Moyenne pondérée projetée : ${weightedSum.toFixed(2)}/20.`,
  };
}

/** Generic school-risk model. */
export function predictSchoolRisk(s: School): PredictionResult<"a_risque" | "stable"> {
  const W = SCHOOL_RISK.weights;
  const infraScore = (Number(s.hasInternet) + Number(s.hasLibrary) + Number(s.hasElectricity) + Number(s.hasWater)) / 4;
  const ratio = s.studentCount / Math.max(1, s.teacherCount);
  const successBepc = Math.min(1, Math.max(0, 0.40 + (s.performanceScore - 50) / 100));
  const successBac  = Math.min(1, Math.max(0, 0.36 + (s.performanceScore - 50) / 110));
  const dropout = Math.max(0, 0.20 - (s.performanceScore - 50) / 200);
  const z =
    SCHOOL_RISK.intercept +
    W.successRateBepc * successBepc +
    W.successRateBac  * successBac +
    W.dropoutRate     * dropout +
    W.teacherRatio    * Math.max(0, (ratio - 40) / 40) +
    W.infrastructure  * infraScore;
  const p = sigmoid(z);
  const sumAbsW = Object.values(W).reduce((a, b) => a + Math.abs(b), 0);
  return {
    label: p > SCHOOL_RISK.alertThreshold ? "a_risque" : "stable",
    probability: p,
    confidence: 0.6 + 0.3 * Math.abs(p - 0.5) * 2,
    variables: [
      { name: "Taux de réussite BEPC", importance: Math.abs(W.successRateBepc) / sumAbsW, value: +successBepc.toFixed(2) },
      { name: "Taux de réussite BAC",  importance: Math.abs(W.successRateBac) / sumAbsW,  value: +successBac.toFixed(2) },
      { name: "Taux d'abandon",        importance: Math.abs(W.dropoutRate) / sumAbsW,     value: +dropout.toFixed(2) },
      { name: "Ratio élèves/enseignant", importance: Math.abs(W.teacherRatio) / sumAbsW,  value: +ratio.toFixed(1) },
      { name: "Infrastructures",       importance: Math.abs(W.infrastructure) / sumAbsW,  value: +infraScore.toFixed(2) },
    ].sort((a, b) => b.importance - a.importance),
    explanation: p > SCHOOL_RISK.alertThreshold
      ? "Combinaison d'indicateurs peu favorables — accompagnement renforcé recommandé."
      : "Établissement globalement stable.",
  };
}

/** Teacher needs-support model: low aggregate performance → suggested accompaniment. */
export function predictTeacherSupport(t: Teacher): PredictionResult<"accompagnement" | "ok"> {
  const agg = (t.maitriseSavoirs + t.gestionClasse + t.capaciteRemediation + t.efficacitePedagogique + t.progressionEleves) / 5;
  const p = 1 - agg / 100;
  return {
    label: p > 0.45 ? "accompagnement" : "ok",
    probability: p,
    confidence: 0.55 + 0.4 * Math.abs(p - 0.5) * 2,
    variables: [
      { name: "Maîtrise des savoirs",     importance: 0.22, value: t.maitriseSavoirs },
      { name: "Gestion de classe",        importance: 0.22, value: t.gestionClasse },
      { name: "Capacité de remédiation",  importance: 0.20, value: t.capaciteRemediation },
      { name: "Efficacité pédagogique",   importance: 0.20, value: t.efficacitePedagogique },
      { name: "Progression des élèves",   importance: 0.16, value: t.progressionEleves },
    ],
    explanation: p > 0.45
      ? "Profil pédagogique indiquant un besoin d'accompagnement ciblé."
      : "Profil pédagogique satisfaisant.",
  };
}