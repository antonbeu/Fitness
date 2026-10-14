import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "../lib/db";
import { basics } from "./basics";
import { extraExercises, timedBasicNames } from "./extra-exercises";

type SourceExercise = {
  id: string;
  name: string;
  category: string;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  images: string[];
};

const muscleSlugByName: Record<string, string> = {
  abdominals: "abs",
  abductors: "abductors",
  adductors: "adductors",
  biceps: "biceps",
  calves: "calves",
  chest: "chest",
  forearms: "forearms",
  glutes: "glutes",
  hamstrings: "hamstrings",
  lats: "lats",
  "lower back": "lower-back",
  "middle back": "middle-back",
  neck: "neck",
  quadriceps: "quads",
  shoulders: "shoulders",
  traps: "traps",
  triceps: "triceps",
};

const equipmentDe: Record<string, string> = {
  "body only": "Körpergewicht",
  machine: "Maschine",
  barbell: "Langhantel",
  dumbbell: "Kurzhantel",
  kettlebells: "Kettlebell",
  cable: "Kabelzug",
  bands: "Widerstandsband",
  "medicine ball": "Medizinball",
  "exercise ball": "Gymnastikball",
  "foam roll": "Faszienrolle",
  "e-z curl bar": "SZ-Stange",
  other: "Sonstiges",
};

const categoryDe: Record<string, string> = {
  strength: "Kraft",
  cardio: "Cardio",
  stretching: "Dehnen",
  plyometrics: "Plyometrisch",
  powerlifting: "Powerlifting",
  strongman: "Strongman",
  "olympic weightlifting": "Gewichtheben",
};

async function main() {
  const raw = readFileSync(
    join(__dirname, "data", "free-exercise-db.json"),
    "utf-8",
  );
  const all: SourceExercise[] = JSON.parse(raw);
  const nameById = new Map(basics.map((b) => [b.id, b.name]));
  const source = all.filter((e) => nameById.has(e.id));
  if (source.length !== basics.length) {
    const found = new Set(source.map((e) => e.id));
    throw new Error(`Unbekannte Basis-IDs: ${basics.filter((b) => !found.has(b.id)).map((b) => b.id).join(", ")}`);
  }

  const muscleGroups = await db.muscleGroup.findMany();
  const muscleGroupIdBySlug = new Map(muscleGroups.map((m) => [m.slug, m.id]));

  let imported = 0;
  let skippedMuscles = 0;

  const chunkSize = 25;
  for (let i = 0; i < source.length; i += chunkSize) {
    const chunk = source.slice(i, i + chunkSize);
    await Promise.all(
      chunk.map(async (item) => {
        const id = `import-${item.id}`;
        const exercise = await db.exercise.upsert({
          where: { id },
          update: {
            name: nameById.get(item.id)!,
            equipment: item.equipment ? equipmentDe[item.equipment] ?? item.equipment : null,
            category: categoryDe[item.category] ?? item.category,
            instructions: null,
            images: [],
          },
          create: {
            id,
            name: nameById.get(item.id)!,
            equipment: item.equipment ? equipmentDe[item.equipment] ?? item.equipment : null,
            category: categoryDe[item.category] ?? item.category,
            instructions: null,
            images: [],
            source: "import",
          },
        });

        const links = [
          ...item.primaryMuscles.map((m) => ({ muscle: m, role: "PRIMARY" as const })),
          ...item.secondaryMuscles.map((m) => ({ muscle: m, role: "SECONDARY" as const })),
        ];

        for (const link of links) {
          const slug = muscleSlugByName[link.muscle];
          const muscleGroupId = slug ? muscleGroupIdBySlug.get(slug) : undefined;
          if (!muscleGroupId) {
            skippedMuscles += 1;
            continue;
          }
          await db.exerciseMuscleGroup.upsert({
            where: {
              exerciseId_muscleGroupId: {
                exerciseId: exercise.id,
                muscleGroupId,
              },
            },
            update: { role: link.role },
            create: {
              exerciseId: exercise.id,
              muscleGroupId,
              role: link.role,
            },
          });
        }

        imported += 1;
      }),
    );
    process.stdout.write(`\r${imported}/${source.length} imported...`);
  }

  console.log(`\nImported ${imported} exercises.`);

  for (const name of timedBasicNames) {
    await db.exercise.updateMany({ where: { name }, data: { category: "Zeit" } });
  }

  for (const extra of extraExercises) {
    const data = {
      name: extra.name,
      equipment: extra.equipment,
      category: extra.category ?? "Kraft",
      instructions: null,
      images: [],
    };
    const exercise = await db.exercise.upsert({
      where: { id: extra.id },
      update: data,
      create: { id: extra.id, ...data, source: "custom" },
    });
    const links = [
      ...extra.primary.map((slug) => ({ slug, role: "PRIMARY" as const })),
      ...(extra.secondary ?? []).map((slug) => ({ slug, role: "SECONDARY" as const })),
    ];
    for (const link of links) {
      const muscleGroupId = muscleGroupIdBySlug.get(link.slug);
      if (!muscleGroupId) throw new Error(`Unbekannte Muskelgruppe: ${link.slug}`);
      await db.exerciseMuscleGroup.upsert({
        where: { exerciseId_muscleGroupId: { exerciseId: exercise.id, muscleGroupId } },
        update: { role: link.role },
        create: { exerciseId: exercise.id, muscleGroupId, role: link.role },
      });
    }
  }
  console.log(`Ensured ${extraExercises.length} extra exercises.`);

  const removed = await db.exercise.deleteMany({
    where: {
      id: {
        notIn: [
          ...source.map((e) => `import-${e.id}`),
          ...extraExercises.map((e) => e.id),
        ],
      },
      workoutExercises: { none: {} },
      sessionExercises: { none: {} },
    },
  });
  console.log(`Removed ${removed.count} non-basic exercises.`);
  if (skippedMuscles > 0) {
    console.log(`${skippedMuscles} muscle links skipped (unmapped muscle name).`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
