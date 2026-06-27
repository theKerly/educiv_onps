/** Reference catalogs: the 12 DRENAs of Côte d'Ivoire, plus name pools. */
export const DRENAS = [
  { code: "ABJ1", name: "DRENA Abidjan 1",  region: "Abidjan",       lat: 5.359,  lng: -4.008, pop: 2_100_000 },
  { code: "ABJ2", name: "DRENA Abidjan 2",  region: "Abidjan",       lat: 5.395,  lng: -4.000, pop: 2_400_000 },
  { code: "ABJ3", name: "DRENA Abidjan 3",  region: "Abidjan",       lat: 5.310,  lng: -3.950, pop: 1_800_000 },
  { code: "ABJ4", name: "DRENA Abidjan 4",  region: "Abidjan",       lat: 5.330,  lng: -4.050, pop: 1_650_000 },
  { code: "YAM",  name: "DRENA Yamoussoukro",region: "Yamoussoukro", lat: 6.827,  lng: -5.289, pop: 360_000 },
  { code: "BKE",  name: "DRENA Bouaké",     region: "Vallée du Bandama", lat: 7.690, lng: -5.030, pop: 832_000 },
  { code: "KORH", name: "DRENA Korhogo",    region: "Poro",          lat: 9.458,  lng: -5.629, pop: 540_000 },
  { code: "SP",   name: "DRENA San Pedro",  region: "Bas-Sassandra", lat: 4.748,  lng: -6.636, pop: 410_000 },
  { code: "DAL",  name: "DRENA Daloa",      region: "Haut-Sassandra",lat: 6.872,  lng: -6.450, pop: 580_000 },
  { code: "MAN",  name: "DRENA Man",        region: "Tonkpi",        lat: 7.412,  lng: -7.553, pop: 360_000 },
  { code: "ABG",  name: "DRENA Abengourou", region: "Indénié-Djuablin", lat: 6.730, lng: -3.490, pop: 280_000 },
  { code: "ODI",  name: "DRENA Odienné",    region: "Kabadougou",    lat: 9.508,  lng: -7.572, pop: 180_000 },
] as const;

export const FIRST_NAMES_M = ["Aboubacar","Kouadio","Yao","Konan","Brou","Koffi","Adama","Ibrahim","Moussa","Souleymane","Drissa","Mamadou","Hervé","Cédric","Jean","Patrick","Eric","Olivier","Bakary","Issouf","Seydou","Ladji","Tidiane","Aristide"];
export const FIRST_NAMES_F = ["Aminata","Mariam","Fatou","Awa","Adjoua","Affoué","Adèle","Christelle","Laetitia","Marie","Aïcha","Salimata","Naomi","Sarah","Inès","Yasmine","Esther","Grace","Précieuse","Bénédicte","Stéphanie","Constance"];
export const LAST_NAMES = ["Kouassi","Koffi","Yao","Brou","Konan","Diabaté","Touré","Coulibaly","Ouattara","Bamba","Diallo","Camara","Cissé","Soro","Bakayoko","Yéo","Silué","Tagro","Gnamien","Tanoh","Adou","N'Guessan","Aké","Zadi","Goré","Anoman"];
export const SCHOOL_PREFIXES = ["Lycée Moderne","Collège Moderne","Lycée Municipal","Lycée Privé","Collège Privé","Lycée Technique","Lycée Sainte-Marie","Collège Saint-Viateur"];
export const SUBJECTS_GENERAL = ["Mathematiques","Francais","Sciences Physiques","SVT","Histoire_Geographie","Anglais","Philosophie","EPS","Education_Civique"];
export const NIVEAUX_LYCEE = ["2nde","1ere","Tle"] as const;
export const NIVEAUX_COLLEGE = ["6e","5e","4e","3e"] as const;
export const TEACHER_SUBJECTS = ["Mathematiques","Francais","Sciences Physiques","SVT","Histoire-Géographie","Anglais","Philosophie","Économie","Comptabilité","EPS","Technologie"];