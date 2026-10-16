"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSession } from "@/app/(dashboard)/training/sessions/actions";

const CONFIRM = "Dieses Training wirklich löschen? Alle Sätze darin gehen verloren.";

/** Kleines Papierkorb-Symbol für Listenzeilen. */
export function DeleteSessionIcon({ sessionId, label }: { sessionId: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={`${label} löschen`}
      onClick={() => {
        if (!confirm(CONFIRM)) return;
        startTransition(() => deleteSession(sessionId));
      }}
      className="flex size-12 shrink-0 items-center justify-center text-muted-foreground active:text-destructive disabled:opacity-50"
    >
      <Trash2 className="size-5" />
    </button>
  );
}

/** Großer Button am Ende der Trainingsseite. */
export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      size="lg"
      disabled={isPending}
      onClick={() => {
        if (!confirm(CONFIRM)) return;
        startTransition(() => deleteSession(sessionId, true));
      }}
    >
      <Trash2 /> {isPending ? "Löschen…" : "Training löschen"}
    </Button>
  );
}
