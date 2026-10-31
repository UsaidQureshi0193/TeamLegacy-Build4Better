"use client";

import Link from "next/link";
import { forwardRef, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Info, Loader2, Sparkles, Volume2, VolumeX, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useSpeaker } from "@/lib/speech";
import type { AiMode, StatusInfo } from "@/lib/types";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "soft";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary:
    "text-on-primary bg-[linear-gradient(135deg,var(--primary),var(--brand-emerald))] shadow-[0_8px_24px_-10px_rgb(24_185_168/0.7)] hover:brightness-110 dark:shadow-glow",
  secondary: "bg-surface text-fg border border-line hover:border-line-strong hover:bg-surface-2 shadow-soft",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
  danger: "bg-danger text-white hover:brightness-110 shadow-[0_8px_24px_-10px_rgb(197_47_58/0.6)]",
  soft: "bg-primary-soft text-primary hover:brightness-105",
};
const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5 rounded-[10px]",
  md: "h-11 px-4 text-[0.95rem] gap-2 rounded-xl",
  lg: "h-13 px-6 text-base gap-2.5 rounded-2xl",
  xl: "min-h-16 px-7 text-lg gap-3 rounded-2xl",
};

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
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-[1.15em] animate-spin" aria-hidden /> : Icon ? <Icon className="size-[1.15em] shrink-0" aria-hidden /> : null}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = "primary", size = "md", icon: Icon, className, children }: { href: string; variant?: Variant; size?: Size; icon?: LucideIcon; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98]", VARIANTS[variant], SIZES[size], className)}>
      {Icon && <Icon className="size-[1.15em] shrink-0" aria-hidden />}
      {children}
    </Link>
  );
}

export function Card({ className, children, glow, as: Tag = "div", ...rest }: React.HTMLAttributes<HTMLDivElement> & { glow?: boolean; as?: "div" | "section" | "article" }) {
  return (
    <Tag
      className={cn(
        "rounded-[var(--radius-lg)] border border-line bg-surface shadow-card",
        glow && "gradient-border dark:shadow-glow",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

type Tone = "teal" | "success" | "warning" | "danger" | "info" | "lavender" | "neutral";
const TONES: Record<Tone, string> = {
  teal: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  lavender: "bg-lavender-soft text-lavender",
  neutral: "bg-surface-3 text-muted",
};

export function Badge({ tone = "neutral", icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", TONES[tone], className)}>
      {Icon && <Icon className="size-3.5" aria-hidden />}
      {children}
    </span>
  );
}

export function IconTile({ icon: Icon, tone = "teal", size = "md", className }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg"; className?: string }) {
  const s = size === "lg" ? "size-14 rounded-2xl [&>svg]:size-7" : size === "sm" ? "size-9 rounded-xl [&>svg]:size-4.5" : "size-11 rounded-xl [&>svg]:size-5.5";
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center", TONES[tone], s, className)}>
      <Icon aria-hidden />
    </span>
  );
}

export function PageHeader({ icon, title, subtitle, tone = "teal", actions, eyebrow }: { icon: LucideIcon; title: string; subtitle?: string; tone?: Tone; actions?: React.ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-fade-up">
      <div className="flex items-start gap-4">
        <IconTile icon={icon} tone={tone} size="lg" />
        <div>
          {eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>}
          <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

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
    <Badge tone="teal" icon={Sparkles} className={className}>
      {t("common.live")}
    </Badge>
  ) : (
    <Badge tone="warning" icon={Info} className={className}>
      {t("common.demo")}
    </Badge>
  );
}

export function Notice({ tone = "info", title, children, className, icon }: { tone?: "info" | "warning" | "danger" | "success"; title?: string; children: React.ReactNode; className?: string; icon?: LucideIcon }) {
  const Icon = icon ?? (tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertTriangle);
  const styles = {
    info: "border-info/25 bg-info-soft",
    warning: "border-warning/30 bg-warning-soft",
    danger: "border-danger/30 bg-danger-soft",
    success: "border-success/30 bg-success-soft",
  }[tone];
  const color = { info: "text-info", warning: "text-warning", danger: "text-danger", success: "text-success" }[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-3 rounded-2xl border p-4 text-sm", styles, className)}>
      <Icon className={cn("mt-0.5 size-5 shrink-0", color)} aria-hidden />
      <div className="text-fg">
        {title && <p className="mb-0.5 font-bold">{title}</p>}
        <div className="text-muted [&_strong]:text-fg">{children}</div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = "teal", className, label }: { value: number; tone?: "teal" | "amber" | "danger"; className?: string; label?: string }) {
  const fill = tone === "amber" ? "from-amber to-[#f7cf7a]" : tone === "danger" ? "from-danger to-[#ff9aa1]" : "from-teal to-emerald";
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-surface-3", className)} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className={cn("h-full rounded-full bg-gradient-to-r transition-[width] duration-700", fill)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ScoreRing({ value, size = 132, stroke = 12, label, sub }: { value: number | null; size?: number; stroke?: number; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value ?? 0;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#18B9A8" />
            <stop offset="100%" stopColor="#16A36A" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--surface-3)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="url(#ring-grad)" strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} style={{ transition: "stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-display text-3xl font-extrabold">{value === null ? "—" : value}</span>
        {label && <span className="text-[11px] font-semibold uppercase tracking-wider text-subtle">{label}</span>}
        {sub && <span className="text-[11px] text-subtle">{sub}</span>}
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-muted" role="status">
      <Loader2 className="size-5 animate-spin text-primary" aria-hidden />
      {label && <span className="text-sm font-medium">{label}</span>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-line-strong bg-surface-2/60 px-6 py-12 text-center">
      <IconTile icon={Icon} size="lg" className="mb-4" />
      <p className="font-display text-lg font-bold">{title}</p>
      {body && <p className="mt-1 max-w-md text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, className, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; icon?: LucideIcon }[]; className?: string; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap gap-1 rounded-2xl border border-line bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all cursor-pointer",
            value === o.value ? "bg-surface text-fg shadow-soft ring-1 ring-line" : "text-muted hover:text-fg",
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
  const { speak, stop, speakingId } = useSpeaker();
  const { t } = useT();
  const active = speakingId === id;
  return (
    <Button variant="ghost" size={size} icon={active ? VolumeX : Volume2} className={className} onClick={() => (active ? stop() : speak(text, id))} aria-label={active ? t("common.stop") : t("common.listen")}>
      <span className="hidden sm:inline">{active ? t("common.stop") : t("common.listen")}</span>
    </Button>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full resize-y rounded-2xl border border-line bg-surface-2 p-4 text-base leading-relaxed text-fg placeholder:text-subtle",
        "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 transition",
        props.className,
      )}
    />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 text-base text-fg placeholder:text-subtle",
        "focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 transition",
        props.className,
      )}
    />
  );
}
