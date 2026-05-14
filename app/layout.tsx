import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camob Residence — Maisonettes near Charterhouse Lagos",
  description:
    "Two self-contained maisonettes in Ogombo, Lekki — a minute from Charterhouse Lagos, fifteen from VI. Private entrance, 24/7 power, fast Wi-Fi, gated compound.",
  metadataBase: new URL("https://camob-residence.vercel.app"),
  openGraph: {
    title: "Camob Residence",
    description: "Two maisonettes a minute from Charterhouse Lagos.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-ink antialiased bg-surface-soft">{children}</body>
    </html>
  );
}
