import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./editorial.css";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";
import { MotionProvider, PageTransition, ScrollProgress } from "@/components/Motion";
import { assetRecoveryScript } from "@/lib/asset-recovery";

const FONT_URL = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";


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
        <script id="ozilan-asset-recovery" dangerouslySetInnerHTML={{__html:assetRecoveryScript(process.env.NEXT_PUBLIC_BASE_PATH??"")}}/>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Non-blocking web font: a slow or blocked Google Fonts request must never hold the first paint on mobile. */}
        <link id="oz-font" rel="stylesheet" media="print" href={FONT_URL} />
        <script dangerouslySetInnerHTML={{__html:`(function(l){if(!l)return;function on(){l.media="all"}if(l.sheet)on();else l.addEventListener("load",on)})(document.getElementById("oz-font"))`}}/>
        <noscript><link rel="stylesheet" href={FONT_URL} /></noscript>
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
