import type { Metadata, Viewport } from "next";
import { Inter, Noto_Nastaliq_Urdu, Plus_Jakarta_Sans } from "next/font/google";
import { AppShell } from "@/components/shell";
import { PrefsProvider, THEME_BOOT_SCRIPT } from "@/lib/prefs";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], weight: ["500", "600", "700", "800"], display: "swap" });
const urdu = Noto_Nastaliq_Urdu({ variable: "--font-urdu", subsets: ["arabic"], weight: ["400", "600", "700"], display: "swap" });

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
    { media: "(prefers-color-scheme: light)", color: "#F3F7F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1422" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jakarta.variable} ${urdu.variable}`} suppressHydrationWarning>
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
