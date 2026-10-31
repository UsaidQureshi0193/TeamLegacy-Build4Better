import type { Metadata } from "next";

export const metadata: Metadata = { title: "Scam Shield" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
