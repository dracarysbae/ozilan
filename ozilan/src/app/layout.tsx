import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CompareTray } from "@/components/CompareTray";


export const metadata: Metadata = {
  title: { default: "OzIlan — piyasayı gösteren ilan platformu", template: "%s · OzIlan" },
  description:
    "Emlak, vasıta ve ikinci el ilanları. Her ilanda fiyatın piyasaya göre konumu, otomatik güven taraması ve cümleyle arama.",
  applicationName: "OzIlan",
};

export const viewport: Viewport = { themeColor: "#FFFFFF" };

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
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CompareTray />
        </StoreProvider>
      </body>
    </html>
  );
}
