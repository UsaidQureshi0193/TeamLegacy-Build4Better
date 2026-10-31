import type { Metadata } from "next";

export const metadata: Metadata = { title: "Document Reader" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
