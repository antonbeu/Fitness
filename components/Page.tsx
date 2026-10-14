import { cn } from "@/lib/utils";

/** Schmale Lesespalte für normale Seiten; der Workout-Builder nutzt die volle Breite. */
export function Page({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-2xl flex-col gap-5", className)}>
      {children}
    </div>
  );
}
