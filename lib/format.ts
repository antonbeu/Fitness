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

/** Versatz von Europe/Berlin zu UTC in Minuten (Sommerzeit berücksichtigt). */
function berlinOffsetMinutes(date: Date) {
  const text = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    timeZoneName: "longOffset",
  }).format(date);
  const match = text.match(/GMT([+-])(\d{2}):(\d{2})/);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

/** Für <input type="datetime-local">: Berliner Ortszeit als „2026-10-16T18:00“. */
export function toDateTimeLocal(iso: string | Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(iso))
    .replace(" ", "T");
}

/** Umkehrung: „2026-10-16T18:00“ als Berliner Ortszeit in einen echten Zeitpunkt. */
export function fromDateTimeLocal(value: string) {
  const naive = new Date(`${value}:00Z`);
  const first = berlinOffsetMinutes(naive);
  let result = new Date(naive.getTime() - first * 60_000);
  const second = berlinOffsetMinutes(result);
  if (second !== first) result = new Date(naive.getTime() - second * 60_000);
  return result;
}
