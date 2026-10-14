const TZ = "Europe/Berlin";

export function formatDate(iso: string | Date, options?: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleDateString("de-DE", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(iso: string | Date) {
  return new Date(iso).toLocaleString("de-DE", {
    timeZone: TZ,
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** 62.5 → „62,5“, 60 → „60“ */
export function formatNumber(value: number) {
  return value.toLocaleString("de-DE", { maximumFractionDigits: 1 });
}

/** 125 → „2:05“ */
export function formatDuration(seconds: number) {
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export type SetLike = { weight: number | null; reps: number | null; unit?: string };

export function formatSet(set: SetLike) {
  if (set.unit === "s") return formatDuration(set.reps ?? 0);
  const unit = set.unit ?? "kg";
  const weight = set.weight === null ? null : `${formatNumber(set.weight)} ${unit}`;
  if (weight && set.reps !== null) return `${weight} × ${set.reps}`;
  if (weight) return weight;
  if (set.reps !== null) return `${set.reps} Wdh.`;
  return "–";
}

/** Gleiche aufeinanderfolgende Sätze zusammenfassen: „3× 20 kg × 8 · 25 kg × 8“ */
export function summarizeSets(sets: SetLike[]) {
  const groups: { text: string; count: number }[] = [];
  for (const set of sets) {
    const text = formatSet(set);
    const last = groups.at(-1);
    if (last && last.text === text) last.count += 1;
    else groups.push({ text, count: 1 });
  }
  return groups
    .map((group) => (group.count > 1 ? `${group.count}× ${group.text}` : group.text))
    .join(" · ");
}

export function relativeDays(iso: string | Date) {
  const day = (date: Date) =>
    new Date(date.toLocaleDateString("en-CA", { timeZone: TZ })).getTime();
  const diff = Math.round((day(new Date()) - day(new Date(iso))) / 86_400_000);
  if (diff <= 0) return "heute";
  if (diff === 1) return "gestern";
  return `vor ${diff} Tagen`;
}
