/**
 * Centralised parameters for ALL business / IA calculations.
 *
 * Rule: no magic number lives in a React component. Every weight, threshold,
 * coefficient and rule used by the scoring / prediction / orientation engines
 * is defined here so it can be reviewed and tuned without touching UI code.
 *
 * See docs/README-ia.md for the full description of each block.
 */

// ---------- Performance académique ----------
export const ACADEMIC_PARAMS = {
  /** Weight applied to the absolute average vs. the year-over-year progression.
   *  We deliberately reward strong progression more than a stagnant high mean. */
  meanWeight: 0.55,
  progressionWeight: 0.30,
  regularityWeight: 0.15,
  /** Sigma (in /20 points) used to convert a raw mean to a 0–100 score. */
  meanReferenceScale: 20,
  /** Bonus applied per +1 point of year-over-year progression. */
  progressionBonusPerPoint: 8,
};

// ---------- Engagement ----------
export const ENGAGEMENT_WEIGHTS = {
  attendance: 0.22,
  punctuality: 0.10,
  participation: 0.18,
  autonomy: 0.16,
  curiosity: 0.12,
  behavior: 0.12,
  implication: 0.10,
};

// ---------- Compétences transversales ----------
export const SKILLS_KEYS = [
  "espritCritique",
  "communication",
  "creativite",
  "collaboration",
  "leadership",
  "resilience",
  "adaptation",
] as const;

// ---------- Score global élève (4 dimensions) ----------
export const GLOBAL_DIMENSIONS = {
  performance: 0.45,
  engagement: 0.25,
  skills: 0.20,
  context: 0.10, // contextual fit — never a penalty
};

// ---------- Décrochage scolaire ----------
export const DROPOUT_MODEL = {
  weights: {
    attendance: -0.35,
    progression: -0.20,
    engagement: -0.18,
    familyStability: -0.12,
    distanceKm: 0.10,
    sanctions: 0.20,
    pastFailures: 0.25,
  },
  intercept: 0.42,
  /** Above this probability the student is flagged. */
  alertThreshold: 0.55,
};

// ---------- Prédiction de réussite aux examens ----------
export const EXAM_MODEL = {
  BEPC: {
    subjectWeights: {
      Mathematiques: 0.22,
      Francais: 0.20,
      "Sciences Physiques": 0.14,
      SVT: 0.12,
      Histoire_Geographie: 0.10,
      Anglais: 0.10,
      EPS: 0.04,
      Education_Civique: 0.04,
      Technologie: 0.04,
    } as Record<string, number>,
    intercept: -2.1,
    successThreshold: 10,
  },
  BAC: {
    seriesWeights: {
      C: { Mathematiques: 0.32, "Sciences Physiques": 0.22, SVT: 0.14, Francais: 0.12, Philosophie: 0.10, Anglais: 0.10 },
      D: { Mathematiques: 0.22, "Sciences Physiques": 0.20, SVT: 0.22, Francais: 0.12, Philosophie: 0.12, Anglais: 0.12 },
      A: { Philosophie: 0.26, Francais: 0.22, Histoire_Geographie: 0.20, Anglais: 0.16, Mathematiques: 0.08, SVT: 0.08 },
      G: { Economie: 0.26, Comptabilite: 0.24, Mathematiques: 0.16, Francais: 0.14, Anglais: 0.10, Droit: 0.10 },
    } as Record<string, Record<string, number>>,
    intercept: -2.6,
    successThreshold: 10,
  },
};

// ---------- Établissements à risque ----------
export const SCHOOL_RISK = {
  weights: {
    successRateBepc: -0.30,
    successRateBac: -0.25,
    dropoutRate: 0.30,
    teacherRatio: 0.10,    // students per teacher above 40 → penalty
    infrastructure: -0.15,
  },
  intercept: 0.35,
  alertThreshold: 0.60,
};

// ---------- Orientation Post-Bac ----------
/**
 * Moyennes "système" du baccalauréat ivoirien par série / matière.
 * Servent à normaliser et à comparer un dossier candidat au cohorte nationale.
 * Valeurs plausibles, ajustables — voir docs/README-ia.md.
 */
export const IVORIAN_BAC_AVERAGES: Record<Serie, Record<string, number>> = {
  C: { Mathematiques: 11.2, "Sciences Physiques": 10.6, SVT: 11.0, Francais: 10.4, Anglais: 10.8, Philosophie: 10.2 },
  D: { Mathematiques: 10.4, "Sciences Physiques": 10.6, SVT: 11.4, Francais: 10.6, Anglais: 10.6, Philosophie: 10.4 },
  A: { Philosophie: 11.0, Francais: 11.2, Histoire_Geographie: 11.4, Anglais: 11.0, Mathematiques: 9.4, SVT: 10.0 },
  G: { Economie: 10.8, Comptabilite: 11.0, Mathematiques: 10.0, Francais: 10.6, Anglais: 10.8, Droit: 10.6 },
  TI: { Mathematiques: 10.4, Technologie: 11.2, "Sciences Physiques": 10.6, Francais: 10.2, Anglais: 10.4 },
  Pro: { Specialite: 11.4, Mathematiques: 9.8, Francais: 10.2, Anglais: 10.0 },
};

type Serie = import("../types/domain").Serie;

export interface FiliereDefinition {
  filiere: string;
  category: "BTS" | "Universite" | "GrandeEcole" | "Prepa" | "Ingenieur" | "Commerce" | "Professionnel";
  /** Subject → weight in [0,1]. Must sum to ~1. */
  subjectWeights: Record<string, number>;
  /** Required minimum average per subject — soft constraint. */
  minPerSubject?: Record<string, number>;
  /** Compatible bac series. */
  series: Serie[];
  /** Importance of engagement, regularity, transverse skills in compatibility. */
  engagementWeight: number;
  regularityWeight: number;
  skillsWeight: { [k in (typeof SKILLS_KEYS)[number]]?: number };
  /** Difficulty 0–1 (drives success probability calibration). */
  difficulty: number;
}

export const FILIERES: FiliereDefinition[] = [
  {
    filiere: "Médecine (UFHB)",
    category: "Universite",
    series: ["C", "D"],
    subjectWeights: { SVT: 0.32, "Sciences Physiques": 0.26, Mathematiques: 0.20, Francais: 0.10, Anglais: 0.12 },
    minPerSubject: { SVT: 12, "Sciences Physiques": 11 },
    engagementWeight: 0.20,
    regularityWeight: 0.20,
    skillsWeight: { resilience: 0.30, espritCritique: 0.25, collaboration: 0.20, adaptation: 0.15, communication: 0.10 },
    difficulty: 0.85,
  },
  {
    filiere: "Classe Préparatoire MPSI",
    category: "Prepa",
    series: ["C"],
    subjectWeights: { Mathematiques: 0.45, "Sciences Physiques": 0.30, Francais: 0.10, Anglais: 0.15 },
    minPerSubject: { Mathematiques: 13, "Sciences Physiques": 12 },
    engagementWeight: 0.25,
    regularityWeight: 0.20,
    skillsWeight: { espritCritique: 0.40, resilience: 0.30, adaptation: 0.20, leadership: 0.10 },
    difficulty: 0.90,
  },
  {
    filiere: "INP-HB Yamoussoukro — Ingénieur",
    category: "Ingenieur",
    series: ["C", "D", "TI"],
    subjectWeights: { Mathematiques: 0.35, "Sciences Physiques": 0.28, SVT: 0.10, Francais: 0.10, Anglais: 0.17 },
    minPerSubject: { Mathematiques: 12 },
    engagementWeight: 0.22,
    regularityWeight: 0.18,
    skillsWeight: { espritCritique: 0.30, collaboration: 0.25, leadership: 0.20, creativite: 0.15, adaptation: 0.10 },
    difficulty: 0.78,
  },
  {
    filiere: "BTS Informatique de Gestion",
    category: "BTS",
    series: ["G", "C", "D", "TI"],
    subjectWeights: { Mathematiques: 0.28, Comptabilite: 0.18, Economie: 0.14, Technologie: 0.18, Francais: 0.10, Anglais: 0.12 },
    engagementWeight: 0.20,
    regularityWeight: 0.20,
    skillsWeight: { creativite: 0.25, collaboration: 0.25, adaptation: 0.20, communication: 0.20, espritCritique: 0.10 },
    difficulty: 0.50,
  },
  {
    filiere: "BTS Commerce International",
    category: "BTS",
    series: ["G", "A"],
    subjectWeights: { Economie: 0.24, Comptabilite: 0.18, Francais: 0.18, Anglais: 0.22, Droit: 0.10, Mathematiques: 0.08 },
    engagementWeight: 0.20,
    regularityWeight: 0.15,
    skillsWeight: { communication: 0.35, leadership: 0.25, collaboration: 0.20, adaptation: 0.20 },
    difficulty: 0.45,
  },
  {
    filiere: "École Supérieure de Commerce (HEC Abidjan)",
    category: "Commerce",
    series: ["G", "A", "D"],
    subjectWeights: { Economie: 0.22, Mathematiques: 0.20, Francais: 0.18, Anglais: 0.20, Comptabilite: 0.10, Philosophie: 0.10 },
    minPerSubject: { Anglais: 11, Francais: 11 },
    engagementWeight: 0.22,
    regularityWeight: 0.18,
    skillsWeight: { communication: 0.30, leadership: 0.30, collaboration: 0.20, creativite: 0.20 },
    difficulty: 0.70,
  },
  {
    filiere: "Université — Lettres Modernes",
    category: "Universite",
    series: ["A", "D", "G"],
    subjectWeights: { Francais: 0.36, Philosophie: 0.22, Histoire_Geographie: 0.18, Anglais: 0.14, Mathematiques: 0.10 },
    engagementWeight: 0.20,
    regularityWeight: 0.20,
    skillsWeight: { espritCritique: 0.35, communication: 0.30, creativite: 0.20, adaptation: 0.15 },
    difficulty: 0.40,
  },
  {
    filiere: "Université — Droit",
    category: "Universite",
    series: ["A", "G", "D"],
    subjectWeights: { Droit: 0.20, Francais: 0.22, Histoire_Geographie: 0.22, Philosophie: 0.18, Anglais: 0.10, Economie: 0.08 },
    engagementWeight: 0.20,
    regularityWeight: 0.20,
    skillsWeight: { espritCritique: 0.40, communication: 0.30, leadership: 0.20, adaptation: 0.10 },
    difficulty: 0.55,
  },
  {
    filiere: "École Professionnelle de la Santé (infirmier/sage-femme)",
    category: "Professionnel",
    series: ["D", "C"],
    subjectWeights: { SVT: 0.30, "Sciences Physiques": 0.20, Francais: 0.18, Mathematiques: 0.16, Anglais: 0.16 },
    minPerSubject: { SVT: 11 },
    engagementWeight: 0.25,
    regularityWeight: 0.20,
    skillsWeight: { resilience: 0.30, collaboration: 0.25, communication: 0.20, adaptation: 0.15, leadership: 0.10 },
    difficulty: 0.55,
  },
];

// ---------- Year contributions (importance des années) ----------
export const YEAR_CONTRIBUTION = {
  Seconde: 0.20,
  Premiere: 0.35,
  Terminale: 0.45,
};

// ---------- UI thresholds ----------
export const UI_THRESHOLDS = {
  excellent: 80,
  good: 65,
  warning: 50,
  critical: 35,
};