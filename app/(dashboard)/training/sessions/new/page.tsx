import { startSession } from "../actions";

export default async function NewSessionPage({
  searchParams,
}: {
  searchParams: Promise<{ workoutId?: string }>;
}) {
  const { workoutId } = await searchParams;
  await startSession(workoutId ?? null);
  return null;
}
