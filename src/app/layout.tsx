import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const sansFont = Space_Grotesk({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const serifFont = Fraunces({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TruthBomb — AI Fact Verification & GEO Intelligence Platform",
  description:
    "Verify information before the internet believes it. Upload any PDF and TruthBomb's AI will extract claims, search live sources, and generate a professional fact-check report in seconds.",
  keywords: [
    "AI fact checking",
    "PDF fact verification",
    "GEO analytics",
    "generative engine optimization",
    "misinformation detection",
    "claim verification",
  ],
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  openGraph: {
    title: "TruthBomb — AI Fact Verification",
    description: "Verify information before the internet believes it.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sansFont.variable} ${monoFont.variable} ${serifFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
