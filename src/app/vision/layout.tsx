import type { Metadata } from "next";

export const metadata: Metadata = { title: "Vision AI" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
