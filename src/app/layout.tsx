import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Arabic } from "next/font/google";
import { AppShell } from "@/components/shell";
import { PrefsProvider, THEME_BOOT_SCRIPT } from "@/lib/prefs";
import "./globals.css";

// Same type family as the team's Elevate product.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const urdu = Noto_Sans_Arabic({ variable: "--font-urdu", subsets: ["arabic"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "HUMRAAH — Your Personal Guide to a Safer Digital Life", template: "%s · HUMRAAH" },
  description:
    "HUMRAAH is an AI-powered, voice-first digital companion that helps people understand technology, avoid online scams and confidently complete everyday digital tasks.",
  applicationName: "HUMRAAH",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F8F4" },
    { media: "(prefers-color-scheme: dark)", color: "#080A08" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${geist.variable} ${geistMono.variable} ${urdu.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <PrefsProvider>
          <AppShell>{children}</AppShell>
        </PrefsProvider>
      </body>
    </html>
  );
}
