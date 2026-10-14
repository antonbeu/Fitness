import "dotenv/config";
import { db } from "../lib/db";

const muscleGroups = [
  { slug: "chest", name: "Brust", bodyRegion: "FRONT" as const },
  { slug: "shoulders", name: "Schultern", bodyRegion: "FRONT" as const },
  { slug: "biceps", name: "Bizeps", bodyRegion: "FRONT" as const },
  { slug: "triceps", name: "Trizeps", bodyRegion: "BACK" as const },
  { slug: "forearms", name: "Unterarme", bodyRegion: "FRONT" as const },
  { slug: "abs", name: "Bauch", bodyRegion: "FRONT" as const },
  { slug: "quads", name: "Quadrizeps", bodyRegion: "FRONT" as const },
  { slug: "hamstrings", name: "Hintere Oberschenkel", bodyRegion: "BACK" as const },
  { slug: "adductors", name: "Adduktoren", bodyRegion: "FRONT" as const },
  { slug: "abductors", name: "Abduktoren", bodyRegion: "BACK" as const },
  { slug: "calves", name: "Waden", bodyRegion: "BACK" as const },
  { slug: "glutes", name: "Gesäß", bodyRegion: "BACK" as const },
  { slug: "lats", name: "Latissimus", bodyRegion: "BACK" as const },
  { slug: "traps", name: "Trapezmuskel", bodyRegion: "BACK" as const },
  { slug: "middle-back", name: "Mittlerer Rücken", bodyRegion: "BACK" as const },
  { slug: "lower-back", name: "Unterer Rücken", bodyRegion: "BACK" as const },
  { slug: "neck", name: "Nacken", bodyRegion: "BACK" as const },
];

async function main() {
  for (const group of muscleGroups) {
    await db.muscleGroup.upsert({
      where: { slug: group.slug },
      update: { name: group.name, bodyRegion: group.bodyRegion },
      create: group,
    });
  }
  console.log(`Seeded ${muscleGroups.length} muscle groups.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
