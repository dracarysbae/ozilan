import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./editorial.css";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { MotionProvider, PageTransition, ScrollProgress } from "@/components/Motion";


export const metadata: Metadata = {
  title: { default: "OzBirArada — hayatının her alanında", template: "%s · OzBirArada" },
  description:
    "İlanlar, alışveriş, çiçek ve hediyeler, yerel hizmetler ve freelance uzmanlıklar. OzBirArada ile keşfet, karşılaştır, planla.",
  applicationName: "OzBirArada",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#020713",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <MotionProvider>
        <StoreProvider>
          <ScrollProgress />
          <Header />
          <main className="flex-1"><PageTransition>{children}</PageTransition></main>
          <Footer />
          <CompareTray />
        </StoreProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
