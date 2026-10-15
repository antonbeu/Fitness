export type IconKind =
  | "squat"
  | "goblet"
  | "legpress"
  | "legext"
  | "legcurl"
  | "lunge"
  | "deadlift"
  | "calf"
  | "bridge"
  | "bench"
  | "incline"
  | "chestpress"
  | "fly"
  | "cablefly"
  | "pushup"
  | "press"
  | "lateral"
  | "facepull"
  | "pulldown"
  | "pullup"
  | "row"
  | "bentrow"
  | "hyperext"
  | "curl"
  | "pushdown"
  | "dips"
  | "plank"
  | "sideplank"
  | "crunch"
  | "legraise"
  | "twist"
  | "abductor"
  | "adductor"
  | "shrug"
  | "generic";

/** Zuordnung nach Übungsname (Namen kommen aus prisma/basics.ts und prisma/extra-exercises.ts). */
export const kindByName: Record<string, IconKind> = {
  "Kniebeugen (Langhantel)": "squat",
  "Goblet-Kniebeugen": "goblet",
  Beinpresse: "legpress",
  Beinstrecker: "legext",
  "Beinbeuger (liegend)": "legcurl",
  "Ausfallschritte (Kurzhantel)": "lunge",
  "Step-Downs": "lunge",
  "Rumänisches Kreuzheben": "deadlift",
  Kreuzheben: "deadlift",
  "Wadenheben (stehend)": "calf",
  "Beckenheben (Glute Bridge)": "bridge",
  Bankdrücken: "bench",
  "Bankdrücken (Kurzhantel)": "bench",
  "Schrägbankdrücken (Kurzhantel)": "incline",
  Brustpresse: "chestpress",
  "Butterfly (Brustmaschine)": "fly",
  "Fliegende am Kabelzug": "cablefly",
  Liegestütze: "pushup",
  "Schulterdrücken (Langhantel)": "press",
  "Schulterdrücken (Kurzhantel)": "press",
  "Schulterpresse (Maschine)": "press",
  Seitheben: "lateral",
  "Face Pull": "facepull",
  "Latzug (breit)": "pulldown",
  Klimmzüge: "pullup",
  "Rudern am Kabelzug (sitzend)": "row",
  "Rhomboiden-Maschine": "row",
  "Rudern mit Brustpolster": "row",
  "Langhantelrudern (vorgebeugt)": "bentrow",
  "Kurzhantelrudern (einarmig)": "bentrow",
  Rückenstrecker: "hyperext",
  "Langhantel-Curls": "curl",
  "Kurzhantel-Curls": "curl",
  "Hammer-Curls": "curl",
  "Trizepsdrücken am Kabelzug": "pushdown",
  Dips: "dips",
  "Dip-Maschine": "dips",
  "Unterarmstütz (Plank)": "plank",
  "Seitlicher Unterarmstütz": "sideplank",
  Crunches: "crunch",
  "Beinheben (Leg Raises)": "legraise",
  "Rumpfrotation (Kabelzug)": "twist",
  "Abduktoren-Maschine": "abductor",
  "Adduktoren-Maschine": "adductor",
  "Schulterheben (Schultergürtel)": "shrug",
};

export function iconKindFor(name: string): IconKind {
  return kindByName[name] ?? "generic";
}
