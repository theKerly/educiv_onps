/**
 * Domain types for the Observatoire National de la Performance Scolaire (ONPS).
 *
 * These types mirror the PostgreSQL schema (see supabase/migrations and
 * docs/README-postgresql.md). The services layer (src/lib/services) is the
 * only place that converts DB rows → these domain objects. UI components
 * MUST consume only these types, never raw DB rows.
 */

export type Cycle = "primaire" | "college" | "lycee";
export type Serie = "A" | "C" | "D" | "G" | "TI" | "Pro";
export type Niveau =
  | "CP1" | "CP2" | "CE1" | "CE2" | "CM1" | "CM2"
  | "6e" | "5e" | "4e" | "3e"
  | "2nde" | "1ere" | "Tle";

export interface Drena {
  id: string;
  code: string;
  name: string;
  region: string;
  /** rough centre lat/lng for the regional map */
  lat: number;
  lng: number;
  population: number;
}

export interface School {
  id: string;
  name: string;
  drenaId: string;
  type: "public" | "prive_laique" | "prive_confessionnel";
  cycle: Cycle;
  city: string;
  studentCount: number;
  teacherCount: number;
  classroomCount: number;
  hasInternet: boolean;
  hasLibrary: boolean;
  hasElectricity: boolean;
  hasWater: boolean;
  foundedYear: number;
  /** 0–100 — composite establishment performance score (computed in services) */
  performanceScore: number;
}

export interface ClassRoom {
  id: string;
  schoolId: string;
  niveau: Niveau;
  serie?: Serie;
  label: string;
  studentCount: number;
  mainTeacherId: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  schoolId: string;
  subjectMain: string;
  yearsExperience: number;
  diploma: "CAFOP" | "Licence" | "Master" | "Doctorat";
  // KPIs computed by services/ai (0–100)
  maitriseSavoirs: number;
  ethique: number;
  exemplarite: number;
  gestionClasse: number;
  capaciteRemediation: number;
  efficacitePedagogique: number;
  progressionEleves: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  birthYear: number;
  classId: string;
  schoolId: string;
  drenaId: string;
  niveau: Niveau;
  serie?: Serie;
  // contextual factors (used to contextualise, never to penalise)
  context: {
    distanceKm: number;
    transport: "marche" | "velo" | "bus" | "voiture";
    internetAtHome: boolean;
    booksAtHome: boolean;
    parentsEducation: "aucune" | "primaire" | "secondaire" | "superieur";
    familyStability: number; // 0–100
    socioEcoIndex: number;   // 0–100
  };
  // engagement (0–100, computed by ai/scoring)
  engagement: {
    attendance: number;
    punctuality: number;
    participation: number;
    autonomy: number;
    curiosity: number;
    behavior: number;
    implication: number;
  };
  // transverse skills (0–100, computed by ai/scoring)
  skills: {
    espritCritique: number;
    communication: number;
    creativite: number;
    collaboration: number;
    leadership: number;
    resilience: number;
    adaptation: number;
  };
}

export interface Grade {
  studentId: string;
  schoolYear: string; // e.g. "2024-2025"
  trimester: 1 | 2 | 3;
  subject: string;
  value: number;    // /20
  coefficient: number;
  appreciation?: string;
}

export interface ExamResult {
  studentId: string;
  exam: "BEPC" | "BAC" | "CEPE";
  year: number;
  mention: "Echec" | "Passable" | "AssezBien" | "Bien" | "TresBien" | "Excellent";
  average: number;
  passed: boolean;
}

/* Computed aggregates — produced by services & ai layers */

export interface NationalKpis {
  studentTotal: number;
  schoolTotal: number;
  teacherTotal: number;
  drenaTotal: number;
  successRateBepc: number;
  successRateBac: number;
  dropoutRate: number;
  attendanceAvg: number;
  performanceAvg: number;
  genderParity: number; // 0–1
}

export interface PredictionResult<T extends string = string> {
  label: T;
  probability: number;        // 0–1
  confidence: number;         // 0–1
  variables: Array<{ name: string; importance: number; value: number | string }>;
  explanation: string;
}

export interface OrientationRecommendation {
  filiere: string;
  category: "BTS" | "Universite" | "GrandeEcole" | "Prepa" | "Ingenieur" | "Commerce" | "Professionnel";
  compatibilityScore: number; // 0–100
  successProbability: number; // 0–1
  confidence: number;         // 0–1
  strengths: string[];
  weaknesses: string[];
  decisiveSubjects: string[];
  justification: string;
  variableContributions: Array<{ name: string; weight: number; contribution: number }>;
}