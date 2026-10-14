import { TabBar } from "@/components/TabBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-28">
        {children}
      </main>
      <TabBar />
    </div>
  );
}
