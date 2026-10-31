// Re-mounts on every navigation, so each page gets a soft entrance (disabled by reduced motion).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
