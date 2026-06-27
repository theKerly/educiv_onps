import type { ClassRoom, Drena, School, Student, Teacher, Grade, ExamResult, Niveau, Serie } from "../types/domain";
import { createRng, pick, intBetween, floatBetween, clamp, gaussian } from "./seed";
import {
  DRENAS, FIRST_NAMES_F, FIRST_NAMES_M, LAST_NAMES,
  SCHOOL_PREFIXES, NIVEAUX_COLLEGE, NIVEAUX_LYCEE,
  SUBJECTS_GENERAL, TEACHER_SUBJECTS,
} from "./catalog";

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
    const cycle: "primaire" | "college" | "lycee" =
      rng() < 0.55 ? "lycee" : rng() < 0.8 ? "college" : "primaire";
    const studentTarget = intBetween(rng, opts.studentsPerSchool[0], opts.studentsPerSchool[1]);
    const teacherTarget = intBetween(rng, opts.teachersPerSchool[0], opts.teachersPerSchool[1]);

    const school: School = {
      id: `sch_${i + 1}`,
      name: `${pick(rng, SCHOOL_PREFIXES)} ${drena.region.split(" ")[0]} ${i + 1}`,
      drenaId: drena.id,
      type: rng() < 0.7 ? "public" : rng() < 0.5 ? "prive_laique" : "prive_confessionnel",
      cycle,
      city: drena.region,
      studentCount: studentTarget,
      teacherCount: teacherTarget,
      classroomCount: Math.ceil(studentTarget / 35),
      hasInternet: rng() < 0.65,
      hasLibrary: rng() < 0.55,
      hasElectricity: rng() < 0.92,
      hasWater: rng() < 0.78,
      foundedYear: intBetween(rng, 1968, 2018),
      performanceScore: clamp(gaussian(rng, 62, 14)),
    };
    schools.push(school);

    const schoolTeacherIds: string[] = [];
    for (let t = 0; t < teacherTarget; t++) {
      const isMale = rng() < 0.62;
      const teacher: Teacher = {
        id: `tch_${i + 1}_${t + 1}`,
        firstName: pick(rng, isMale ? FIRST_NAMES_M : FIRST_NAMES_F),
        lastName: pick(rng, LAST_NAMES),
        schoolId: school.id,
        subjectMain: pick(rng, TEACHER_SUBJECTS),
        yearsExperience: intBetween(rng, 1, 32),
        diploma: pick(rng, ["CAFOP","Licence","Master","Doctorat"] as const),
        maitriseSavoirs: clamp(gaussian(rng, 72, 12)),
        ethique: clamp(gaussian(rng, 78, 9)),
        exemplarite: clamp(gaussian(rng, 74, 11)),
        gestionClasse: clamp(gaussian(rng, 70, 14)),
        capaciteRemediation: clamp(gaussian(rng, 66, 13)),
        efficacitePedagogique: clamp(gaussian(rng, 68, 12)),
        progressionEleves: clamp(gaussian(rng, 65, 14)),
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
          distanceKm: clamp(gaussian(rng, 3.5, 4), 0.1, 25),
          transport: pick(rng, ["marche","velo","bus","voiture"] as const),
          internetAtHome: rng() < 0.40,
          booksAtHome: rng() < 0.55,
          parentsEducation: pick(rng, ["aucune","primaire","secondaire","superieur"] as const),
          familyStability: clamp(gaussian(rng, 70, 18)),
          socioEcoIndex: clamp(gaussian(rng, 55, 22)),
        },
        engagement: {
          attendance: clamp(gaussian(rng, 82, 12)),
          punctuality: clamp(gaussian(rng, 78, 14)),
          participation: clamp(gaussian(rng, 68, 16)),
          autonomy: clamp(gaussian(rng, 65, 17)),
          curiosity: clamp(gaussian(rng, 64, 18)),
          behavior: clamp(gaussian(rng, 75, 14)),
          implication: clamp(gaussian(rng, 67, 16)),
        },
        skills: {
          espritCritique: clamp(gaussian(rng, 62, 16)),
          communication: clamp(gaussian(rng, 66, 15)),
          creativite: clamp(gaussian(rng, 64, 17)),
          collaboration: clamp(gaussian(rng, 70, 14)),
          leadership: clamp(gaussian(rng, 58, 18)),
          resilience: clamp(gaussian(rng, 66, 15)),
          adaptation: clamp(gaussian(rng, 65, 15)),
        },
      };
      students.push(student);
      const idx = classes.findIndex(c => c.id === cls.id);
      if (idx >= 0) classes[idx].studentCount += 1;

      const studentTalent = floatBetween(rng, -3, 3);
      for (const subject of SUBJECTS_GENERAL) {
        for (const trimester of [1, 2, 3] as const) {
          const base = 10 + studentTalent + gaussian(rng, 0, 2.4) + (trimester - 2) * 0.4;
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

      if (niveau === "Tle" || niveau === "3e") {
        const passed = rng() < (niveau === "Tle" ? 0.46 : 0.62);
        const avg = passed ? floatBetween(rng, 10, 16.5) : floatBetween(rng, 7, 9.9);
        exams.push({
          studentId: student.id,
          exam: niveau === "Tle" ? "BAC" : "BEPC",
          year: 2025,
          mention: passed
            ? avg > 16 ? "Excellent" : avg > 14 ? "TresBien" : avg > 12 ? "Bien" : avg > 11 ? "AssezBien" : "Passable"
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