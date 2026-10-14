/**
 * Handschriftliches Trainingsbuch des Vaters (Jun–Okt 2026), von Hand übertragen.
 * Import: npm run db:import-history -- <email>   (idempotent, ersetzt frühere Importe)
 *
 * Konventionen beim Übertragen:
 * - „x3“ hinter einem Gewicht ohne Wiederholungen = 3 Sätze; ohne Angabe = 3 Sätze (Regelfall).
 * - „ps“ = pro Seite der Stange (Einheit „kg/Seite“). Kurzhanteln stehen in kg je Hantel.
 * - Plank etc.: Sekunden (Einheit „s“).
 * - „|“ im Original: alles dahinter sind Notizen seines Trainingspartners (laut Anton)
 *   und gehört nicht zu den Werten des Vaters. Diese Teile sind bewusst NICHT importiert.
 */

export type HistorySet = {
  weight: number | null;
  reps: number | null;
  unit: "kg" | "kg/Seite" | "s";
};
export type HistoryExercise = { name: string; sets: HistorySet[] };
export type HistorySession = { date: string; exercises: HistoryExercise[] };

const n = (count: number, set: HistorySet) => Array.from({ length: count }, () => ({ ...set }));
const kg = (weight: number | null, reps: number | null = null, count = 3) =>
  n(count, { weight, reps, unit: "kg" });
const ps = (weight: number, reps: number | null = null, count = 3) =>
  n(count, { weight, reps, unit: "kg/Seite" });
/** Haltedauer in Sekunden, je Wert ein Satz. */
const hold = (...seconds: number[]): HistorySet[] =>
  seconds.map((s) => ({ weight: null, reps: s, unit: "s" as const }));

const BUTTERFLY = "Butterfly (Brustmaschine)";
const INCLINE = "Schrägbankdrücken (Kurzhantel)";
const LAT = "Latzug (breit)";
const PLANK = "Unterarmstütz (Plank)";
const BENCH = "Bankdrücken";
const LEG_EXT = "Beinstrecker";
const CALF = "Wadenheben (stehend)";
const RDL = "Rumänisches Kreuzheben";
const ROW = "Rudern am Kabelzug (sitzend)";
const CORE = "Rumpfrotation (Maschine)";

export const history: HistorySession[] = [
  {
    date: "2026-06-23",
    exercises: [
      { name: BUTTERFLY, sets: kg(15) },
      { name: INCLINE, sets: kg(5) },
      { name: LAT, sets: kg(16) },
      { name: LEG_EXT, sets: kg(45, 8) },
      { name: "Hammer-Curls", sets: kg(10, 8) },
      { name: "Trizepsdrücken am Kabelzug", sets: kg(15, 8) },
      { name: "Beinheben (Leg Raises)", sets: kg(null, 10) },
    ],
  },
  {
    date: "2026-06-25",
    exercises: [
      { name: BUTTERFLY, sets: [...kg(20, 7, 1), ...kg(25, 7, 1)] },
      { name: INCLINE, sets: kg(7.5) },
      { name: LAT, sets: kg(16, 7) },
      { name: "Rhomboiden-Maschine", sets: kg(35, 7) },
    ],
  },
  {
    date: "2026-06-29",
    exercises: [
      // r50x8x3 / L50x8x3: rechtes und linkes Bein getrennt
      { name: "Beinpresse", sets: [...kg(50, 8), ...kg(50, 8)] },
      { name: CALF, sets: [...kg(35, 15, 2), ...kg(40, 10, 1)] },
      { name: LEG_EXT, sets: [...kg(50, 8, 1), ...kg(55, 8, 2)] },
      { name: "Hammer-Curls", sets: kg(10, 7) },
      { name: "Trizepsdrücken am Kabelzug", sets: kg(17.5, 8) },
    ],
  },
  {
    date: "2026-07-02",
    exercises: [
      { name: LAT, sets: [...kg(16, 8, 2), ...kg(20, 8, 1)] }, // nicht übernommen (Partner): „| 28.5 x 8 x3“
      { name: INCLINE, sets: kg(7.5, 8) },
      { name: "Rhomboiden-Maschine", sets: kg(35, 8) }, // nicht übernommen (Partner): „| 50 x 8“
      { name: BUTTERFLY, sets: kg(25, 8) }, // nicht übernommen (Partner): „| 40x10, 45x7x2“
    ],
  },
  {
    date: "2026-07-13",
    exercises: [
      { name: PLANK, sets: hold(45, 53) },
      { name: BENCH, sets: ps(5, 8) },
      { name: LAT, sets: [...kg(16, 8, 1), ...kg(20, 7, 1)] },
    ],
  },
  {
    date: "2026-07-15",
    exercises: [
      { name: PLANK, sets: hold(47, 60) },
      { name: "Abduktoren-Maschine", sets: [...kg(85, null, 2), ...kg(90, null, 1)] },
      { name: "Adduktoren-Maschine", sets: kg(75, 10) },
      { name: RDL, sets: ps(5) },
    ],
  },
  {
    date: "2026-08-11",
    exercises: [
      { name: PLANK, sets: hold(65, 60) },
      { name: BENCH, sets: ps(5, 8, 2) }, // Original: „5psx82“
      { name: LAT, sets: [...kg(16, 8, 1), ...kg(20, 8, 2)] },
      { name: LEG_EXT, sets: [...kg(55, null, 2), ...kg(50, null, 1)] },
    ],
  },
  {
    date: "2026-08-13", // Original: „13:08“
    exercises: [
      { name: "Abduktoren-Maschine", sets: kg(80) },
      { name: "Adduktoren-Maschine", sets: kg(80) },
      { name: PLANK, sets: hold(70, 68) },
      { name: "Rhomboiden-Maschine", sets: kg(40, 8) },
      { name: BUTTERFLY, sets: kg(30) },
      { name: CORE, sets: kg(12) },
    ],
  },
  {
    date: "2026-08-17",
    exercises: [
      { name: PLANK, sets: hold(66, 66) },
      { name: BENCH, sets: ps(6.25, 8) },
      { name: LAT, sets: kg(20, 8) },
      { name: CALF, sets: [...kg(35, 8, 2), ...kg(45, null, 1)] },
    ],
  },
  {
    date: "2026-08-27",
    exercises: [
      { name: PLANK, sets: hold(80, 80) },
      { name: "Abduktoren-Maschine", sets: [...kg(90, null, 1), ...kg(95, null, 2)] },
      { name: "Adduktoren-Maschine", sets: [...kg(90, null, 1), ...kg(95, null, 2)] },
      { name: LEG_EXT, sets: [50, 55, 60, 65].flatMap((w) => kg(w, null, 1)) },
      { name: "Schulterpresse (Maschine)", sets: kg(20) }, // nicht übernommen (Partner): „| 35 x3“
    ],
  },
  {
    date: "2026-09-03",
    exercises: [
      { name: PLANK, sets: hold(90, 93) },
      { name: CORE, sets: kg(15, 8) },
      { name: BENCH, sets: ps(7.5, 6) }, // nicht übernommen (Partner): „| 12,5ps“
      { name: LEG_EXT, sets: kg(60, 6) },
      { name: "Schulterpresse (Maschine)", sets: kg(20, 8) },
    ],
  },
  {
    date: "2026-09-07",
    exercises: [
      { name: PLANK, sets: hold(85, 90) },
      { name: LAT, sets: kg(20) },
      { name: ROW, sets: kg(20) },
      { name: INCLINE, sets: kg(7.5) },
      { name: LEG_EXT, sets: [...kg(60, null, 2), ...kg(65, null, 1)] },
    ],
  },
  {
    date: "2026-09-10",
    exercises: [
      { name: PLANK, sets: hold(100, 100) },
      { name: CORE, sets: kg(15) },
      { name: "Fliegende am Kabelzug", sets: ps(10) },
      { name: RDL, sets: ps(10) },
      { name: LEG_EXT, sets: [...kg(65, null, 2), ...kg(70, null, 1)] },
    ],
  },
  {
    date: "2026-09-14",
    exercises: [
      { name: PLANK, sets: hold(105, 100) },
      { name: "Rhomboiden-Maschine", sets: kg(40, 8) },
      { name: LEG_EXT, sets: [...kg(70, null, 2), ...kg(65, null, 1)] },
      { name: INCLINE, sets: kg(7.5) },
    ],
  },
  {
    date: "2026-09-17",
    exercises: [
      { name: PLANK, sets: hold(115, 120) },
      { name: "Step-Downs", sets: kg(16) },
      { name: ROW, sets: kg(20) },
      { name: LAT, sets: kg(20) },
    ],
  },
  {
    date: "2026-09-21",
    exercises: [
      // Original: „Sideplank 45&35 x2“
      { name: "Seitlicher Unterarmstütz", sets: hold(45, 35) },
      { name: INCLINE, sets: kg(10) },
      // „Bizeps 2,5 + Stange“: 2,5 kg je Seite plus Stange
      { name: "Langhantel-Curls", sets: ps(2.5) },
      { name: "Schulterheben (Schultergürtel)", sets: kg(22.5) },
      { name: "Rudern mit Brustpolster", sets: kg(25) },
    ],
  },
  {
    date: "2026-10-08",
    exercises: [
      { name: PLANK, sets: hold(120, 120) },
      { name: BENCH, sets: ps(5) },
      { name: CORE, sets: kg(15) },
      { name: LEG_EXT, sets: kg(70) },
      { name: BUTTERFLY, sets: kg(30) },
    ],
  },
  {
    date: "2026-10-12",
    exercises: [
      { name: PLANK, sets: hold(120, 120) },
      { name: LEG_EXT, sets: [...kg(75, null, 2), ...kg(65, null, 1)] },
      { name: LAT, sets: kg(20) },
      { name: ROW, sets: kg(20) },
      { name: "Dip-Maschine", sets: kg(35) },
    ],
  },
];

/** Nicht importierte Teile aus dem Original (Notizen des Trainingspartners hinter „|“). */
export const SKIPPED = [
  "02.07.: Latzug „| 28,5 x 8 x 3“",
  "02.07.: Rhomboid „| 50 x 8“",
  "02.07.: Butterfly „| 40 x 10, 45 x 7 x 2“",
  "27.08.: Schulterdrücken „| 35 x 3“",
  "03.09.: Bankdrücken „| 12,5 ps“",
];
