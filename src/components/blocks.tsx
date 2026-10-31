"use client";

// Richer, Elevate-style building blocks for feature pages and dashboards.
// Built on the same tokens as ui.tsx; keep page code declarative by composing these.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "./ui";

/** Small uppercase label above a section title ("SAFE IN 3 STEPS"). */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("text-[11px] font-bold uppercase tracking-[0.14em] text-primary", className)}>{children}</p>;
}

/** Lime marker underline for the key words of a heading. */
export function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="mark-lime">{children}</span>;
}

/** Centered section intro: eyebrow, big title, one-line description. */
export function SectionIntro({ eyebrow, title, description, className }: { eyebrow?: string; title: string; description?: string; className?: string }) {
  return (
    <div className={cn("mx-auto max-w-2xl text-center", className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
      {description && <p className="mt-2 text-muted">{description}</p>}
    </div>
  );
}

/** White pill badge with a hairline, used in card corners ("Live check", "Fictional"). */
export function CornerBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex shrink-0 items-center rounded-full border border-line bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-muted">{children}</span>;
}

/** Square icon tile with a hairline border — Elevate's neutral icon style. */
export function IconBox({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-fg", className)}>
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

/**
 * Feature tile: icon + corner badge, optional "STEP 01" label and a faint large step number,
 * title, description and an optional live preview (children) pinned to the bottom.
 */
export function FeatureCard({
  icon,
  badge,
  step,
  title,
  description,
  href,
  children,
  className,
}: {
  icon: LucideIcon;
  badge?: string;
  step?: string;
  title: string;
  description?: string;
  href?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <IconBox icon={icon} />
        {badge && <CornerBadge>{badge}</CornerBadge>}
      </div>
      {step && <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-widest text-primary">STEP {step}</p>}
      <h3 className={cn("font-bold tracking-tight", step ? "mt-1" : "mt-4")}>{title}</h3>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>}
      {children && <div className="mt-auto pt-4">{children}</div>}
      {step && (
        <span aria-hidden className="pointer-events-none absolute -bottom-3 end-3 select-none font-display text-7xl font-extrabold leading-none text-fg/[0.05]">
          {step}
        </span>
      )}
    </>
  );
  const cls = cn(
    "relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card",
    href && "card-hover",
    className,
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Mini "data row" shown inside previews: label on one side, value on the other. */
export function PreviewRow({ label, value, tone = "default", mono }: { label: React.ReactNode; value: React.ReactNode; tone?: "default" | "good" | "bad"; mono?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-xs", mono && "font-mono")}>
      <span className="min-w-0 truncate text-muted">{label}</span>
      <span className={cn("shrink-0 font-bold", tone === "good" && "text-primary", tone === "bad" && "text-danger")}>{value}</span>
    </div>
  );
}

/** Animates a number from 0 when it scrolls into view (respects reduced motion). */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.classList.contains("reduce-motion");
    let raf = 0;
    const run = () => {
      if (reduce || value === 0) {
        setShown(value);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 900);
        setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        run();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);
  return (
    <span ref={ref}>
      {shown}
      {suffix}
    </span>
  );
}

/** Row of headline numbers separated by hairlines (Elevate's stats strip). */
export function StatStrip({ items }: { items: { icon: LucideIcon; value: React.ReactNode; label: string }[] }) {
  return (
    <div className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-xl)] border border-line bg-surface/70 lg:grid-cols-4">
      {items.map((it, i) => (
        <div
          key={i}
          className={cn(
            "flex flex-col items-center gap-1.5 px-4 py-6 text-center",
            i % 2 === 1 && "border-s border-line",
            i >= 2 && "border-t border-line lg:border-t-0",
            i === 2 && "lg:border-s",
          )}
        >
          <IconBox icon={it.icon} className="size-8 rounded-lg [&>svg]:size-4" />
          <p className="mt-1 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{it.value}</p>
          <p className="text-xs text-muted">{it.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Fades content up the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={cn("transition-[opacity,transform] duration-700 ease-out", visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Shimmering placeholder while content loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-xl", className)} />;
}
