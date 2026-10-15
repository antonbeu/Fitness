import { auth } from "@/auth";
import { getStatsOverview } from "@/lib/training/stats";
import { formatDate, relativeDays } from "@/lib/format";
import { Page } from "@/components/Page";
import { StatsList } from "@/components/training/StatsList";

function Tile({
  label,
  value,
  hint,
  tone = "bg-card",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-3xl px-4 py-4 ${tone}`}>
      <p className="text-xs text-foreground/70">{label}</p>
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="text-xs text-foreground/70">{hint}</p>}
    </div>
  );
}

export default async function StatsPage() {
  const session = await auth();
  const { overview, sessionCount, setCount, firstDate } = await getStatsOverview(
    session!.user.id,
  );
  const lastDate = overview.reduce<string | null>(
    (latest, item) => (latest === null || item.lastDate > latest ? item.lastDate : latest),
    null,
  );

  return (
    <Page>
      <h1 className="text-3xl font-bold tracking-tight">Statistik</h1>

      {overview.length === 0 ? (
        <div className="rounded-3xl border border-dashed bg-card px-4 py-10 text-center">
          <p className="font-medium">Noch keine Daten</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Sobald du ein Training mit Sätzen speicherst, erscheinen hier deine Fortschritte.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Tile tone="bg-tile-sage" label="Trainings" value={String(sessionCount)} hint={firstDate ? `seit ${formatDate(firstDate, { day: undefined })}` : undefined} />
            <Tile tone="bg-tile-sand" label="Sätze gesamt" value={String(setCount)} />
            <Tile tone="bg-tile-clay" label="Übungen" value={String(overview.length)} hint="mit Daten" />
            <Tile label="Letztes Training" value={lastDate ? relativeDays(lastDate) : "–"} />
          </div>
          <p className="text-sm text-muted-foreground">
            Tippe auf eine Übung für das Diagramm. Rechts: letzter Höchstwert und Veränderung
            seit dem ersten Training.
          </p>
          <StatsList items={overview} />
        </>
      )}
    </Page>
  );
}
