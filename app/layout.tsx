import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/next/react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Training",
  description: "Dein Trainingsplan.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Training",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f5f2",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="de"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <SerwistProvider
          swUrl="/sw.js"
          disable={process.env.NODE_ENV === "development"}
          options={{ type: "classic" }}
        >
          {children}
        </SerwistProvider>
        <Toaster />
      </body>
    </html>
  );
}
