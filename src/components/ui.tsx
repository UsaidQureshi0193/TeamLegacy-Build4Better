"use client";

// HUMRAAH UI kit — one small set of calm, reusable building blocks.
// Rule of thumb for pages: PageHeader → a few <Section>s → content built from
// Card / ActionCard / Stat / StepList. Avoid stacking extra decoration.

import Link from "next/link";
import { forwardRef, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Info, Loader2, Sparkles, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useSpeaker } from "@/lib/speech";
import type { AiMode, StatusInfo } from "@/lib/types";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

// ── Buttons ──────────────────────────────────────────────

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  // Lime fill + carbon text: the Elevate call-to-action.
  primary: "bg-lime text-on-lime font-bold shadow-[0_2px_12px_rgba(198,255,0,0.25)] hover:shadow-[0_4px_20px_rgba(198,255,0,0.4)] hover:brightness-105 active:scale-[0.97]",
  secondary: "bg-surface text-fg border border-line shadow-sm hover:border-line-strong hover:bg-surface-2 hover:shadow-md active:scale-[0.97]",
  ghost: "text-muted hover:text-fg hover:bg-surface-2 active:scale-[0.97]",
  danger: "bg-gradient-to-r from-danger to-rose-600 text-white font-semibold shadow-[0_2px_12px_rgba(196,36,42,0.3)] hover:brightness-110 active:scale-[0.97]",
  soft: "bg-primary-soft text-primary font-semibold hover:bg-primary-soft/80 active:scale-[0.97]",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5 rounded-full",
  md: "h-11 px-5 text-[0.95rem] gap-2 rounded-full",
  lg: "h-12 px-6 text-base gap-2 rounded-full",
  xl: "min-h-14 px-7 text-lg gap-3 rounded-full",
};
const BUTTON_BASE =
  "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", icon: Icon, loading, className, children, disabled, ...rest },
  ref,
) {
  return (
    <button ref={ref} disabled={disabled || loading} className={cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {loading ? <Loader2 className="size-[1.1em] animate-spin" aria-hidden /> : Icon ? <Icon className="size-[1.1em] shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = "primary", size = "md", icon: Icon, className, children }: { href: string; variant?: Variant; size?: Size; icon?: LucideIcon; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn(BUTTON_BASE, VARIANTS[variant], SIZES[size], className)}>
      {Icon && <Icon className="size-[1.1em] shrink-0" aria-hidden />}
      {children}
    </Link>
  );
}

// ── Surfaces ─────────────────────────────────────────────

/** Plain white surface. `glow` gives the one main card on a page a slightly stronger edge. */
export function Card({ className, children, glow, as: Tag = "div", ...rest }: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean; as?: "div" | "section" | "article" }) {
  return (
    <Tag className={cn("rounded-[var(--radius-lg)] border bg-surface/95 backdrop-blur-sm shadow-card transition-all duration-300", glow ? "border-primary/40 shadow-[0_0_25px_rgba(198,255,0,0.08)]" : "border-line", className)} {...rest}>
      {children}
    </Tag>
  );
}

/** A titled block of a page. Keeps spacing and heading styles identical everywhere. */
export function Section({ title, description, action, children, className }: { title?: string; description?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            {title && <h2 className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Clickable tile: icon, title, one-line description. Used for menus of choices. */
export function ActionCard({ href, onClick, icon, tone = "teal", title, description, meta, className, disabled }: { href?: string; onClick?: () => void; icon: LucideIcon; tone?: Tone; title: string; description?: string; meta?: React.ReactNode; className?: string; disabled?: boolean }) {
  const body = (
    <>
      <IconTile icon={icon} tone={tone} size="md" className="transition-transform duration-300 group-hover:scale-110" />
      <span className="min-w-0 flex-1">
        <span className="block font-display font-semibold leading-snug text-fg group-hover:text-primary transition-colors">{title}</span>
        {description && <span className="mt-1 block text-sm text-muted leading-relaxed line-clamp-2">{description}</span>}
        {meta && <span className="mt-2 block">{meta}</span>}
      </span>
      <ChevronRight className="mt-1 size-4.5 shrink-0 text-subtle transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-primary rtl:rotate-180" aria-hidden />
    </>
  );
  const cls = cn(
    "group flex w-full items-start gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-4 sm:p-5 text-start shadow-card hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
    className,
  );
  return href ? (
    <Link href={href} className={cls}>{body}</Link>
  ) : (
    <button type="button" onClick={onClick} disabled={disabled} className={cls}>{body}</button>
  );
}

/** One number with a label. */
export function Stat({ label, value, hint, icon, tone = "teal" }: { label: string; value: React.ReactNode; hint?: string; icon?: LucideIcon; tone?: Tone }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
      {icon && <IconTile icon={icon} tone={tone} size="sm" />}
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted">{label}</p>
        <p className="font-display text-xl font-extrabold leading-tight tracking-tight">{value}</p>
        {hint && <p className="truncate text-xs text-subtle">{hint}</p>}
      </div>
    </div>
  );
}

/** Numbered list for steps, checklists and safe actions. */
export function StepList({ items, tone = "teal", className }: { items: React.ReactNode[]; tone?: "teal" | "success" | "danger"; className?: string }) {
  const dot = { teal: "bg-primary-soft text-primary", success: "bg-success-soft text-success", danger: "bg-danger-soft text-danger" }[tone];
  return (
    <ol className={cn("space-y-2.5", className)}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold", dot)}>{i + 1}</span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

// ── Labels & icons ───────────────────────────────────────

export type Tone = "teal" | "success" | "warning" | "danger" | "info" | "lavender" | "neutral";
const TONES: Record<Tone, string> = {
  teal: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  lavender: "bg-lavender-soft text-lavender",
  neutral: "bg-surface text-muted ring-1 ring-inset ring-line",
};

export function Badge({ tone = "neutral", icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[tone], className)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

export function IconTile({ icon: Icon, tone = "teal", size = "md", className }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = size === "lg" ? "size-12 rounded-2xl [&>svg]:size-6" : size === "sm" ? "size-8 rounded-xl [&>svg]:size-4" : "size-10 rounded-2xl [&>svg]:size-5";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", TONES[tone], s, className)}>
      <Icon aria-hidden />
    </span>
  );
}

export function PageHeader({ icon, title, subtitle, tone = "teal", actions }: { icon: LucideIcon; title: string; subtitle?: string; tone?: Tone; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5">
        <IconTile icon={icon} tone={tone} size="lg" />
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm sm:text-base text-muted leading-relaxed">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

// ── AI status ────────────────────────────────────────────

let statusCache: Promise<StatusInfo> | null = null;
export function useAiStatus() {
  const [status, setStatus] = useState<StatusInfo | null>(null);
  useEffect(() => {
    statusCache ??= fetch("/api/status").then((r) => r.json()).catch(() => ({ mode: "demo", model: null, provider: null }));
    let alive = true;
    statusCache.then((s) => alive && setStatus(s));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

/** Honest label showing whether a result came from the live AI or the built-in rule engine. */
export function ModeBadge({ mode, className }: { mode: AiMode; className?: string }) {
  const { t } = useT();
  return mode === "live" ? (
    <Badge tone="teal" icon={Sparkles} className={className}>{t("common.live")}</Badge>
  ) : (
    <Badge tone="warning" icon={Info} className={className}>{t("common.demo")}</Badge>
  );
}

// ── Feedback ─────────────────────────────────────────────

export function Notice({ tone = "info", title, children, className, icon }: { tone?: "info" | "warning" | "danger" | "success"; title?: string; children: React.ReactNode; className?: string; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle);
  const styles = {
    info: "bg-info-soft border-info/20",
    warning: "bg-warning-soft border-warning/25",
    danger: "bg-danger-soft border-danger/25",
    success: "bg-success-soft border-success/25",
  }[tone];
  const color = { info: "text-info", warning: "text-warning", danger: "text-danger", success: "text-success" }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-2xl border p-4 text-sm", styles, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", color)} aria-hidden />
      <div className="space-y-0.5">
        {title && <p className="font-semibold text-fg">{title}</p>}
        <div className="text-muted leading-relaxed [&_strong]:text-fg">{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = "teal", className, label }: { value: number; tone?: "teal" | "amber" | "danger"; className?: string; label?: string }) {
  const fill =
    tone === "amber"
      ? "bg-gradient-to-r from-amber to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]"
      : tone === "danger"
        ? "bg-gradient-to-r from-danger to-rose-600 shadow-[0_0_12px_rgba(196,36,42,0.4)]"
        : "bg-gradient-to-r from-lime via-[#9ee600] to-emerald-400 shadow-[0_0_12px_rgba(198,255,0,0.4)]";
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-surface-3 shadow-inner", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ScoreRing({ value, size = 120, stroke = 10, label, sub }: { value: number | null; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 drop-shadow-sm" aria-hidden>
        <defs>
          <linearGradient id="scoreRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c6ff00" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#scoreRingGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * v) / 100}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-3xl font-extrabold tracking-tight">{value === null ? "—" : value}</span>
        {label && <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</span>}
        {sub && <span className="text-[11px] text-subtle">{sub}</span>}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-muted" role="status">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-line-strong px-6 py-10 text-center">
      <IconTile icon={Icon} className="mb-3" />
      <p className="font-semibold">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Inputs ───────────────────────────────────────────────

export function Segmented<T extends string>({ value, onChange, options, className, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: LucideIcon }[]; className?: string; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap gap-1 rounded-full border border-line bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            value === o.value ? "bg-surface text-fg shadow-soft" : "text-muted hover:text-fg",
          )}
        >
          {o.icon && <o.icon className="size-4" aria-hidden />}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Read-aloud toggle for any block of text (Voice principle: every text can be heard). */
export function SpeakButton({ text, id, className, size = "sm" }: { text: string; id: string; className?: string; size?: Size }) {
  const { speak, stop, speakingId, voiceError } = useSpeaker();
  const { t } = useT();
  const active = speakingId === id;
  return (
    <span className="inline-flex flex-col items-start">
      <Button variant="ghost" size={size} icon={active ? VolumeX : Volume2} className={className} onClick={() => (active ? stop() : speak(text, id))} aria-label={active ? t("common.stop") : t("common.listen")}>
        <span className="hidden sm:inline">{active ? t("common.stop") : t("common.listen")}</span>
      </Button>
      {voiceError && <span role="alert" className="max-w-xs px-2 text-xs text-danger">{voiceError}</span>}
    </span>
  );
}

const FIELD = "w-full rounded-xl border border-line bg-surface text-base text-fg placeholder:text-subtle transition focus:border-primary focus:outline-none focus:ring-3 focus:ring-primary/15";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(FIELD, "resize-y p-3.5 leading-relaxed", props.className)} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(FIELD, "h-12 px-4", props.className)} />;
}
