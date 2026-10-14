// Geräte und Übungen aus dem Gym des Vaters, die nicht in free-exercise-db stehen.
// category "Zeit" markiert Haltedauer-Übungen (Satz = Sekunden statt kg × Wdh.).
export type ExtraExercise = {
  id: string;
  name: string;
  equipment: string;
  category?: string;
  primary: string[];
  secondary?: string[];
};

export const extraExercises: ExtraExercise[] = [
  { id: "custom-butterfly", name: "Butterfly (Brustmaschine)", equipment: "Maschine", primary: ["chest"], secondary: ["shoulders"] },
  { id: "custom-cable-fly", name: "Fliegende am Kabelzug", equipment: "Kabelzug", primary: ["chest"], secondary: ["shoulders"] },
  { id: "custom-hammer-curl", name: "Hammer-Curls", equipment: "Kurzhantel", primary: ["biceps"], secondary: ["forearms"] },
  { id: "custom-leg-raise", name: "Beinheben (Leg Raises)", equipment: "Körpergewicht", primary: ["abs"] },
  { id: "custom-rhomboid", name: "Rhomboiden-Maschine", equipment: "Maschine", primary: ["middle-back"], secondary: ["lats", "shoulders", "traps"] },
  { id: "custom-abductor", name: "Abduktoren-Maschine", equipment: "Maschine", primary: ["abductors"], secondary: ["glutes"] },
  { id: "custom-adductor", name: "Adduktoren-Maschine", equipment: "Maschine", primary: ["adductors"] },
  { id: "custom-core-rotation", name: "Rumpfrotation (Maschine)", equipment: "Maschine", primary: ["abs"] },
  { id: "custom-step-down", name: "Step-Downs", equipment: "Körpergewicht", primary: ["quads"], secondary: ["glutes"] },
  { id: "custom-side-plank", name: "Seitlicher Unterarmstütz", equipment: "Körpergewicht", category: "Zeit", primary: ["abs"] },
  { id: "custom-shoulder-press-machine", name: "Schulterpresse (Maschine)", equipment: "Maschine", primary: ["shoulders"], secondary: ["triceps"] },
  { id: "custom-shrug", name: "Schulterheben (Schultergürtel)", equipment: "Maschine", primary: ["traps"], secondary: ["shoulders"] },
  { id: "custom-chest-supported-row", name: "Rudern mit Brustpolster", equipment: "Maschine", primary: ["middle-back"], secondary: ["lats", "biceps"] },
  { id: "custom-dip-machine", name: "Dip-Maschine", equipment: "Maschine", primary: ["triceps"], secondary: ["chest", "shoulders"] },
];

/** Basisübungen, die Haltedauer statt Wiederholungen haben. */
export const timedBasicNames = ["Unterarmstütz (Plank)"];
