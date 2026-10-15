"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, Dumbbell, History, Library } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Training", icon: Dumbbell },
  { href: "/training/exercises", label: "Übungen", icon: Library },
  { href: "/statistik", label: "Statistik", icon: ChartLine },
  { href: "/training", label: "Verlauf", icon: History },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return (
      pathname === "/" ||
      pathname.startsWith("/training/workouts") ||
      pathname.startsWith("/training/sessions")
    );
  }
  if (href === "/training") return pathname === "/training";
  return pathname.startsWith(href);
}

export function TabBar() {
  const pathname = usePathname();

  // Beim Zusammenstellen eines Workouts hat die Seite eine eigene Leiste.
  if (pathname.startsWith("/training/workouts/")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 rounded-t-[2rem] border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-12px_rgb(60_45_20/0.18)] backdrop-blur">
      <ul className="mx-auto flex max-w-2xl px-2 pt-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 pb-2 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active && "bg-tile-sage",
                  )}
                >
                  <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
