export type MuscleLink = { slug: string; role: "PRIMARY" | "SECONDARY" };

/** Grobe Körperbereiche für die Analyse („Was fehlt?“) und die Filter im Katalog. */
export const AREAS = [
  { key: "chest", label: "Brust", slugs: ["chest"] },
  { key: "back", label: "Rücken", slugs: ["lats", "middle-back", "traps", "lower-back"] },
  { key: "shoulders", label: "Schultern", slugs: ["shoulders"] },
  { key: "arms", label: "Arme", slugs: ["biceps", "triceps", "forearms"] },
  { key: "core", label: "Bauch", slugs: ["abs"] },
  { key: "legs", label: "Beine", slugs: ["quads", "hamstrings", "calves", "adductors", "abductors"] },
  { key: "glutes", label: "Gesäß", slugs: ["glutes"] },
] as const;

export type AreaKey = (typeof AREAS)[number]["key"];
export type AreaStatus = "trained" | "light" | "missing";

export type CoverageItem = { sets: number; muscles: MuscleLink[] };

export type Coverage = {
  /** Auslastung je Muskelgruppe, 0 bis 1 (für die Körpergrafik). */
  intensity: Record<string, number>;
  areas: { key: AreaKey; label: string; status: AreaStatus; sets: number }[];
  missing: { key: AreaKey; label: string }[];
  summary: string;
};

/** Ab so vielen gewichteten Sätzen gilt ein Muskel als voll ausgelastet. */
const FULL_LOAD = 8;
const SECONDARY_WEIGHT = 0.4;

export function exerciseAreaKeys(muscles: MuscleLink[]): AreaKey[] {
  return AREAS.filter((area) =>
    muscles.some(
      (muscle) => muscle.role === "PRIMARY" && (area.slugs as readonly string[]).includes(muscle.slug),
    ),
  ).map((area) => area.key);
}

export function computeCoverage(items: CoverageItem[]): Coverage {
  const load: Record<string, number> = {};
  for (const item of items) {
    for (const muscle of item.muscles) {
      const weight = muscle.role === "PRIMARY" ? 1 : SECONDARY_WEIGHT;
      load[muscle.slug] = (load[muscle.slug] ?? 0) + item.sets * weight;
    }
  }
  const intensity = Object.fromEntries(
    Object.entries(load).map(([slug, value]) => [slug, Math.min(1, value / FULL_LOAD)]),
  );

  const areas = AREAS.map((area) => {
    let primarySets = 0;
    let secondarySets = 0;
    for (const item of items) {
      for (const muscle of item.muscles) {
        if (!(area.slugs as readonly string[]).includes(muscle.slug)) continue;
        if (muscle.role === "PRIMARY") primarySets += item.sets;
        else secondarySets += item.sets;
      }
    }
    const status: AreaStatus =
      primarySets > 0 ? "trained" : secondarySets > 0 ? "light" : "missing";
    return { key: area.key, label: area.label, status, sets: primarySets };
  });

  const missing = areas
    .filter((area) => area.status !== "trained")
    .map(({ key, label }) => ({ key, label }));

  let summary: string;
  if (items.length === 0) {
    summary = "Ziehe Übungen in dein Workout, dann siehst du hier, welche Muskeln trainiert werden.";
  } else if (missing.length === 0) {
    summary = "Alle großen Muskelgruppen sind abgedeckt. Ein ausgewogenes Ganzkörper-Training.";
  } else if (missing.length <= 3 || items.length < 5) {
    summary = `Es fehlt noch: ${missing.map((m) => m.label).join(", ")}.`;
  } else {
    const trained = areas.filter((area) => area.status === "trained").map((area) => area.label);
    summary = `Dieses Workout trainiert nur ${trained.join(", ")}. Gut für einen Split, kein Ganzkörper-Training.`;
  }

  return { intensity, areas, missing, summary };
}
