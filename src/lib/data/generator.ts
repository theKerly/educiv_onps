import type { ClassRoom, Drena, School, Student, Teacher, Grade, ExamResult, Niveau, Serie } from "../types/domain";
import { createRng, pick, intBetween, floatBetween, clamp, gaussian } from "./seed";
import {
  DRENAS, FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES,
  SCHOOL_PREFIXES, NIVEAUX_COLLEGE, NIVEAUX_LYCEE,
  SUBJECTS_GENERAL, TEACHER_SUBJECTS,
} from "./catalog";

/**
 * Per-DRENA performance bias (−1 difficile … +1 favorable).
 * Abidjan & Yamoussoukro sont urbains et mieux dotés ; les régions du Nord
 * et de l'Ouest accusent un retard structurel — calibré à partir des écarts
 * historiques observés aux examens nationaux ivoiriens.
 */
const DRENA_BIAS: Record<string, number> = {
  ABJ1: +0.55, ABJ2: +0.60, ABJ3: +0.45, ABJ4: +0.40,
  YAM: +0.35, BKE: +0.05, SP: +0.10, DAL: -0.05,
  ABG: +0.00, MAN: -0.30, KORH: -0.40, ODI: -0.55,
};

export interface GenerateOptions {
  schools: number;
  teachersPerSchool: [number, number];
  studentsPerSchool: [number, number];
  seed?: number;
}

export interface Dataset {
  drenas: Drena[];
  schools: School[];
  classes: ClassRoom[];
  teachers: Teacher[];
  students: Student[];
  grades: Grade[];
  exams: ExamResult[];
}

/** Cohort years used to populate exam history (oldest → newest). */
const EXAM_YEARS = [2021, 2022, 2023, 2024, 2025] as const;

export function generateDataset(opts: GenerateOptions): Dataset {
  const rng = createRng(opts.seed ?? 0xC0DE01);

  const drenas: Drena[] = DRENAS.map((d, i) => ({
    id: `drena_${i + 1}`,
    code: d.code,
    name: d.name,
    region: d.region,
    lat: d.lat,
    lng: d.lng,
    population: d.pop,
  }));

  const schools: School[] = [];
  const classes: ClassRoom[] = [];
  const teachers: Teacher[] = [];
  const students: Student[] = [];
  const grades: Grade[] = [];
  const exams: ExamResult[] = [];

  for (let i = 0; i < opts.schools; i++) {
    const drena = drenas[i % drenas.length];
    const drenaBias = DRENA_BIAS[drena.code] ?? 0;
    /** Per-school quality multiplier — private confessional & private laïque
     *  tend to outperform public schools on average in Côte d'Ivoire. */
    const typeRoll = rng();
    const schoolType: School["type"] =
      typeRoll < 0.70 ? "public" : typeRoll < 0.88 ? "prive_laique" : "prive_confessionnel";
    const typeBoost =
      schoolType === "prive_confessionnel" ? +0.35 :
      schoolType === "prive_laique" ? +0.20 : 0;
    const schoolTalent = drenaBias + typeBoost + floatBetween(rng, -0.25, 0.25);

    const cycle: "primaire" | "college" | "lycee" =
      rng() < 0.55 ? "lycee" : rng() < 0.8 ? "college" : "primaire";
    const studentTarget = intBetween(rng, opts.studentsPerSchool[0], opts.studentsPerSchool[1]);
    const teacherTarget = intBetween(rng, opts.teachersPerSchool[0], opts.teachersPerSchool[1]);

    /** Performance composite calibré : 50 + 18·talent + bruit gaussien. */
    const perfScore = clamp(gaussian(rng, 50 + schoolTalent * 18, 8));

    const school: School = {
      id: `sch_${i + 1}`,
      name: `${pick(rng, SCHOOL_PREFIXES)} ${drena.region.split(" ")[0]} ${i + 1}`,
      drenaId: drena.id,
      type: schoolType,
      cycle,
      city: drena.region,
      studentCount: studentTarget,
      teacherCount: teacherTarget,
      classroomCount: Math.ceil(studentTarget / 35),
      // Infrastructure corrélée au biais DRENA (Abidjan > rural).
      hasInternet:    rng() < 0.45 + drenaBias * 0.35,
      hasLibrary:     rng() < 0.40 + drenaBias * 0.30,
      hasElectricity: rng() < 0.78 + drenaBias * 0.20,
      hasWater:       rng() < 0.62 + drenaBias * 0.25,
      foundedYear: intBetween(rng, 1968, 2018),
      performanceScore: perfScore,
    };
    schools.push(school);

    const schoolTeacherIds: string[] = [];
    for (let t = 0; t < teacherTarget; t++) {
      const isMale = rng() < 0.62;
      // Qualité pédagogique corrélée au talent de l'école (les bons
      // établissements attirent / retiennent les bons enseignants).
      const teacherMean = 65 + schoolTalent * 8;
      const teacher: Teacher = {
        id: `tch_${i + 1}_${t + 1}`,
        firstName: pick(rng, isMale ? FIRST_NAMES_M : FIRST_NAMES_F),
        lastName: pick(rng, LAST_NAMES),
        schoolId: school.id,
        subjectMain: pick(rng, TEACHER_SUBJECTS),
        yearsExperience: intBetween(rng, 1, 32),
        diploma: pick(rng, ["CAFOP","Licence","Master","Doctorat"] as const),
        maitriseSavoirs:      clamp(gaussian(rng, teacherMean + 7, 11)),
        ethique:              clamp(gaussian(rng, 78, 9)),
        exemplarite:          clamp(gaussian(rng, 74, 11)),
        gestionClasse:        clamp(gaussian(rng, teacherMean + 5, 13)),
        capaciteRemediation:  clamp(gaussian(rng, teacherMean,     13)),
        efficacitePedagogique:clamp(gaussian(rng, teacherMean + 3, 12)),
        progressionEleves:    clamp(gaussian(rng, teacherMean,     14)),
      };
      teachers.push(teacher);
      schoolTeacherIds.push(teacher.id);
    }

    const niveauPool: readonly Niveau[] =
      cycle === "lycee" ? NIVEAUX_LYCEE
      : cycle === "college" ? NIVEAUX_COLLEGE
      : (["CP1","CP2","CE1","CE2","CM1","CM2"] as const);

    const classIdsByNiveau: Array<{ niveau: Niveau; serie?: Serie; id: string }> = [];
    let cidx = 0;
    for (const niveau of niveauPool) {
      const seriesForNiveau: (Serie | undefined)[] =
        cycle === "lycee" && (niveau === "1ere" || niveau === "Tle")
          ? ["A","C","D","G"]
          : [undefined];
      for (const serie of seriesForNiveau) {
        cidx++;
        const cls: ClassRoom = {
          id: `cls_${i + 1}_${cidx}`,
          schoolId: school.id,
          niveau,
          serie,
          label: serie ? `${niveau} ${serie}` : niveau,
          studentCount: 0,
          mainTeacherId: schoolTeacherIds[cidx % Math.max(schoolTeacherIds.length, 1)] ?? schoolTeacherIds[0] ?? "",
        };
        classes.push(cls);
        classIdsByNiveau.push({ niveau, serie, id: cls.id });
      }
    }

    for (let s = 0; s < studentTarget; s++) {
      const cls = classIdsByNiveau[s % classIdsByNiveau.length];
      const isMale = rng() < 0.52;
      const niveau = cls.niveau;
      const baseAge = niveauToAge(niveau);

      // -------- Contexte corrélé au DRENA + bruit individuel --------
      const urbanity = drenaBias; // [-1,+1]
      const familyStability = clamp(gaussian(rng, 65 + urbanity * 10, 18));
      const socioEcoIndex   = clamp(gaussian(rng, 48 + urbanity * 22, 20));
      const parentsEdu: Student["context"]["parentsEducation"] =
        rng() < 0.20 + Math.max(0, urbanity) * 0.30 ? "superieur"
        : rng() < 0.40 + Math.max(0, urbanity) * 0.20 ? "secondaire"
        : rng() < 0.55 ? "primaire" : "aucune";
      const internetAtHome = rng() < 0.20 + Math.max(0, urbanity) * 0.45;
      const booksAtHome    = rng() < 0.35 + Math.max(0, urbanity) * 0.35;
      const distanceKm     = clamp(gaussian(rng, 4 - urbanity * 1.5, 4), 0.2, 25);

      // -------- Talent latent : héritage (école+contexte) + dotation propre --
      const contextLift = (familyStability - 60) / 60 + (socioEcoIndex - 50) / 70
        + (parentsEdu === "superieur" ? 0.25 : parentsEdu === "secondaire" ? 0.10 : 0);
      const studentTalent = schoolTalent * 0.6 + contextLift * 0.5 + gaussian(rng, 0, 0.55);

      // -------- Engagement / compétences influencés par talent --------
      const engBase = 70 + studentTalent * 6;
      const skillBase = 65 + studentTalent * 7;

      const student: Student = {
        id: `std_${i + 1}_${s + 1}`,
        firstName: pick(rng, isMale ? FIRST_NAMES_M : FIRST_NAMES_F),
        lastName: pick(rng, LAST_NAMES),
        gender: isMale ? "M" : "F",
        birthYear: new Date().getFullYear() - baseAge + intBetween(rng, -1, 1),
        classId: cls.id,
        schoolId: school.id,
        drenaId: drena.id,
        niveau,
        serie: cls.serie,
        context: {
          distanceKm,
          transport: pick(rng, ["marche","velo","bus","voiture"] as const),
          internetAtHome,
          booksAtHome,
          parentsEducation: parentsEdu,
          familyStability,
          socioEcoIndex,
        },
        engagement: {
          attendance:    clamp(gaussian(rng, engBase + 12, 10)),
          punctuality:   clamp(gaussian(rng, engBase + 8,  12)),
          participation: clamp(gaussian(rng, engBase - 2,  14)),
          autonomy:      clamp(gaussian(rng, engBase - 5,  15)),
          curiosity:     clamp(gaussian(rng, engBase - 6,  16)),
          behavior:      clamp(gaussian(rng, engBase + 5,  12)),
          implication:   clamp(gaussian(rng, engBase - 3,  14)),
        },
        skills: {
          espritCritique: clamp(gaussian(rng, skillBase - 3, 14)),
          communication:  clamp(gaussian(rng, skillBase + 1, 13)),
          creativite:     clamp(gaussian(rng, skillBase - 1, 15)),
          collaboration:  clamp(gaussian(rng, skillBase + 5, 12)),
          leadership:     clamp(gaussian(rng, skillBase - 7, 16)),
          resilience:     clamp(gaussian(rng, skillBase + 1, 13)),
          adaptation:     clamp(gaussian(rng, skillBase,     13)),
        },
      };
      students.push(student);
      const idx = classes.findIndex(c => c.id === cls.id);
      if (idx >= 0) classes[idx].studentCount += 1;

      // -------- Notes : couplées au talent + matière + trimestre --------
      // Tendance positive (progression) renforcée chez élèves engagés.
      const progBias = (student.engagement.implication - 65) / 80; // ±0.5
      for (const subject of SUBJECTS_GENERAL) {
        // Matière-spécifique : un peu plus difficile pour maths/SP, plus facile EPS.
        const subjAdj = subject === "Mathematiques" || subject === "Sciences Physiques" ? -0.6
                       : subject === "EPS" ? +1.2 : 0;
        for (const trimester of [1, 2, 3] as const) {
          const trend = (trimester - 2) * (0.5 + progBias);
          const base = 10.5 + studentTalent * 2.1 + subjAdj + trend + gaussian(rng, 0, 1.8);
          grades.push({
            studentId: student.id,
            schoolYear: "2024-2025",
            trimester,
            subject,
            value: clamp(base, 0, 20),
            coefficient: subject === "Mathematiques" || subject === "Francais" ? 4 : 2,
          });
        }
      }

      // -------- Examens : historique multi-annuel pour les niveaux terminaux ----
      if (niveau === "Tle" || niveau === "3e") {
        // Calibration nationale : BAC ~40%, BEPC ~55%, modulé par talent + DRENA.
        const examType: "BAC" | "BEPC" = niveau === "Tle" ? "BAC" : "BEPC";
        const basePass = examType === "BAC" ? 0.40 : 0.55;
        const passProb = clamp(basePass + studentTalent * 0.12 + drenaBias * 0.08, 0.05, 0.95);
        const passed = rng() < passProb;
        const avg = passed
          ? clamp(gaussian(rng, 11.5 + studentTalent, 1.3), 10, 18)
          : clamp(gaussian(rng, 8.5 + studentTalent, 1.1), 4, 9.9);
        exams.push({
          studentId: student.id,
          exam: examType,
          year: 2025,
          mention: passed
            ? avg > 16 ? "Excellent" : avg > 14 ? "TresBien" : avg > 12 ? "Bien" : avg > 11 ? "AssezBien" : "Passable"
            : "Echec",
          average: avg,
          passed,
        });
      }
    }

    // -------- Historique d'examens synthétique par école (5 cohortes) --------
    // Génère des résultats "rétrospectifs" pour permettre les analyses
    // pluri-annuelles, sans lier ces résultats aux élèves actifs.
    for (const year of EXAM_YEARS) {
      if (year === 2025) continue; // déjà couverte ci-dessus
      const cohortSize = Math.round(studentTarget / 8);
      for (let h = 0; h < cohortSize; h++) {
        const examType: "BAC" | "BEPC" = rng() < 0.5 ? "BAC" : "BEPC";
        const basePass = examType === "BAC" ? 0.40 : 0.55;
        const yearTrend = (year - 2023) * 0.012; // amélioration progressive
        const p = clamp(basePass + schoolTalent * 0.15 + yearTrend, 0.05, 0.95);
        const passed = rng() < p;
        const avg = passed ? floatBetween(rng, 10, 16) : floatBetween(rng, 6, 9.8);
        exams.push({
          studentId: `hist_${school.id}_${year}_${h}`,
          exam: examType,
          year,
          mention: passed
            ? avg > 14 ? "Bien" : avg > 12 ? "AssezBien" : "Passable"
            : "Echec",
          average: avg,
          passed,
        });
      }
    }
  }

  return { drenas, schools, classes, teachers, students, grades, exams };
}

function niveauToAge(n: Niveau): number {
  const m: Record<Niveau, number> = {
    CP1: 6, CP2: 7, CE1: 8, CE2: 9, CM1: 10, CM2: 11,
    "6e": 12, "5e": 13, "4e": 14, "3e": 15,
    "2nde": 16, "1ere": 17, "Tle": 18,
  };
  return m[n];
}