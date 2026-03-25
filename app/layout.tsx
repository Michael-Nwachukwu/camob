import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camob Residence | Editorial Shortlet Living in Lekki",
  description:
    "Luxury shortlet booking for 1-bedroom and 2-bedroom apartments in Ogombo Town, Lekki Scheme 2, Lagos.",
  metadataBase: new URL("https://camob-residence.vercel.app"),
  openGraph: {
    title: "Camob Residence",
    description: "Shortlet booking web app for Camob Residence in Lekki, Lagos.",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
