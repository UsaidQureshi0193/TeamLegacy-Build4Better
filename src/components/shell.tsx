"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Accessibility, Bell, BookOpenCheck, Bot, ChevronRight, Eye, FileText, GraduationCap, Home, Languages, LifeBuoy, Map,
  Menu, Moon, Search, Settings, ShieldAlert, ShieldCheck, Siren, Sun, TrendingUp, X, type LucideIcon,
} from "lucide-react";
import { DICTIONARY } from "@/data/help";
import { useT, type StringKey } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { markNoticesRead, useProgress } from "@/lib/progress";
import type { Lang } from "@/lib/types";
import { ModeBadge, cn, useAiStatus } from "./ui";

export interface NavItem {
  href: string;
  key: StringKey;
  icon: LucideIcon;
  group: "nav.understand" | "nav.protect" | "nav.learn" | "nav.you";
  keywords: string;
}

export const NAV: NavItem[] = [
  { href: "/", key: "nav.home", icon: Home, group: "nav.understand", keywords: "home dashboard start" },
  { href: "/assistant", key: "nav.assistant", icon: Bot, group: "nav.understand", keywords: "chat voice speak talk ask question baat" },
  { href: "/vision", key: "nav.vision", icon: Eye, group: "nav.understand", keywords: "screenshot screen explain point" },
  { href: "/document", key: "nav.document", icon: FileText, group: "nav.understand", keywords: "bill challan notice letter form document" },
  { href: "/shield", key: "nav.shield", icon: ShieldAlert, group: "nav.protect", keywords: "scam fraud sms whatsapp message link qr otp dhoka" },
  { href: "/guardian", key: "nav.guardian", icon: ShieldCheck, group: "nav.protect", keywords: "privacy permission password 2fa checkup" },
  { href: "/emergency", key: "nav.emergency", icon: Siren, group: "nav.protect", keywords: "emergency help hacked otp shared stolen lost sos" },
  { href: "/guide", key: "nav.guide", icon: Map, group: "nav.learn", keywords: "guide steps task learn how whatsapp email bill" },
  { href: "/academy", key: "nav.academy", icon: GraduationCap, group: "nav.learn", keywords: "practice escape room mission quiz game" },
  { href: "/progress", key: "nav.progress", icon: TrendingUp, group: "nav.you", keywords: "progress score independence skills" },
  { href: "/settings", key: "nav.settings", icon: Settings, group: "nav.you", keywords: "settings theme language elder mode voice" },
];

const GROUPS: NavItem["group"][] = ["nav.understand", "nav.protect", "nav.learn", "nav.you"];

export function Logo({ compact }: { compact?: boolean }) {
  const { tx } = useT();
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="HUMRAAH home">
      <span className="relative flex size-10 items-center justify-center rounded-xl bg-lime">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
          <path d="M9 7v18M23 7v18M9 16h14" stroke="#080A08" strokeWidth="3.6" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.6" fill="#080A08" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-lg font-extrabold tracking-[0.08em] group-hover:text-primary transition-colors">HUMRAAH</span>
          <span className="mt-0.5 block text-[10.5px] font-semibold uppercase tracking-[0.16em] text-subtle">{tx({ en: "Digital companion", roman: "Digital saathi", ur: "ڈیجیٹل ساتھی" })}</span>
        </span>
      )}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { t } = useT();
  return (
    <nav aria-label="Main" className="flex flex-col gap-5">
      {GROUPS.map((g) => (
        <div key={g}>
          <p className="mb-1.5 px-3.5 text-[11px] font-bold uppercase tracking-wider text-subtle">{t(g)}</p>
          <ul className="flex flex-col gap-1">
            {NAV.filter((n) => n.group === g).map((n) => {
              const active = isActive(pathname, n.href);
              const danger = n.href === "/emergency";
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.93rem] font-medium transition-colors",
                      active ? "bg-surface-3 text-fg font-semibold" : "text-muted hover:bg-surface-2 hover:text-fg",
                    )}
                  >
                    {active && <span className="absolute end-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-lime ring-2 ring-primary/30" aria-hidden />}
                    <n.icon
                      className={cn(
                        "size-5 shrink-0",
                        active ? "text-fg" : danger ? "text-danger" : "text-subtle group-hover:text-fg",
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{t(n.key)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter() {
  const status = useAiStatus();
  const { tx } = useT();
  return (
    <div className="space-y-2 border-t border-line px-2 pt-4 text-xs text-subtle">
      {status && (
        <p className="flex items-center justify-between gap-2">
          <span>{status.provider ?? tx({ en: "Built-in safety rules", roman: "Built-in hifazati usool", ur: "اندرونی حفاظتی اصول" })}</span>
          <ModeBadge mode={status.mode} />
        </p>
      )}
      <p className="flex items-center gap-1.5">
        <ShieldCheck className="size-3.5 shrink-0 text-success" aria-hidden /> {tx({ en: "Never asks for OTP or PIN", roman: "Kabhi OTP ya PIN nahi maangta", ur: "کبھی OTP یا PIN نہیں مانگتا" })}
      </p>
    </div>
  );
}

const LANG_OPTIONS: { value: Lang; label: string; short: string }[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "roman", label: "Roman Urdu", short: "RU" },
  { value: "ur", label: "اردو", short: "اردو" },
];

function useOutside(ref: React.RefObject<HTMLElement | null>, onClose: () => void, open: boolean) {
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && onClose();
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => {
      document.removeEventListener("mousedown", h);
      document.removeEventListener("keydown", k);
    };
  }, [ref, onClose, open]);
}

function SearchBox() {
  const { t, tx, lang } = useT();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useOutside(ref, () => setOpen(false), open);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return { pages: NAV.slice(1, 6), terms: DICTIONARY.slice(0, 3) };
    return {
      pages: NAV.filter((n) => t(n.key).toLowerCase().includes(s) || n.keywords.includes(s)).slice(0, 6),
      terms: DICTIONARY.filter((d) => d.term.toLowerCase().includes(s) || d.aliases.some((a) => a.includes(s))).slice(0, 4),
    };
  }, [q, t]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <label className="relative block">
        <span className="sr-only">Search</span>
        <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4.5 -translate-y-1/2 text-subtle" aria-hidden />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.pages[0]) go(results.pages[0].href);
          }}
          placeholder={t("top.search")}
          className="h-11 w-full rounded-full border border-line bg-surface ps-10 pe-14 text-sm text-fg placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
        />
        <kbd className="pointer-events-none absolute end-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-surface px-1.5 py-0.5 text-[10px] font-semibold text-subtle sm:block">Ctrl K</kbd>
      </label>
      {open && (
        <div id="search-results" className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border border-line bg-elevated shadow-float animate-fade-up">
          {results.pages.length > 0 && (
            <div className="p-2">
              <p className="px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-subtle">{tx({ en: "Go to", roman: "Yahan jayein", ur: "یہاں جائیں" })}</p>
              {results.pages.map((p) => (
                <button key={p.href} onClick={() => go(p.href)} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm font-semibold hover:bg-surface-2 cursor-pointer">
                  <p.icon className="size-4.5 text-primary" aria-hidden /> {t(p.key)}
                  <ChevronRight className="ms-auto size-4 text-subtle rtl:rotate-180" aria-hidden />
                </button>
              ))}
            </div>
          )}
          {results.terms.length > 0 && (
            <div className="border-t border-line p-2">
              <p className="flex items-center gap-1.5 px-2 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wider text-subtle">
                <BookOpenCheck className="size-3.5" aria-hidden /> {tx({ en: "Digital Dictionary", roman: "Digital Dictionary", ur: "ڈیجیٹل لغت" })}
              </p>
              {results.terms.map((d) => (
                <div key={d.term} className="rounded-xl px-2.5 py-2">
                  <p className="text-sm font-bold">{d.term}</p>
                  <p className={cn("text-xs text-muted", lang === "ur" && "urdu")}>{lang === "en" ? d.en : lang === "ur" ? d.ur : d.roman}</p>
                </div>
              ))}
            </div>
          )}
          {!results.pages.length && !results.terms.length && <p className="p-4 text-sm text-muted">{tx({ en: "No matches. Try “scam”, “bill” or “OTP”.", roman: "Kuch nahi mila. “scam”, “bill” ya “OTP” likh kar dekhein.", ur: "کچھ نہیں ملا۔ “بل” یا “OTP” لکھ کر دیکھیں۔" })}</p>}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { notices } = useProgress();
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  const unread = notices.filter((n) => !n.read).length;
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open && unread) setTimeout(markNoticesRead, 1200);
        }}
        aria-label={`${t("top.notifications")}${unread ? ` (${unread} new)` : ""}`}
        aria-expanded={open}
        className="relative flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-fg cursor-pointer"
      >
        <Bell className="size-5" aria-hidden />
        {unread > 0 && <span className="absolute end-2 top-2 flex size-4 items-center justify-center rounded-full bg-lime text-[10px] font-bold text-on-lime">{unread}</span>}
      </button>
      {open && (
        <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-elevated shadow-float animate-fade-up">
          <p className="border-b border-line px-4 py-3 text-sm font-bold">{t("top.notifications")}</p>
          <ul className="max-h-80 overflow-y-auto scrollbar-thin">
            {notices.length === 0 && <li className="p-4 text-sm text-muted">{lang === "en" ? "You're all caught up." : lang === "ur" ? "کوئی نئی اطلاع نہیں۔" : "Koi nayi itla nahi."}</li>}
            {notices.map((n) => (
              <li key={n.id} className="border-b border-line last:border-0">
                <Link href={n.href ?? "#"} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-surface-2">
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-surface-3" : "bg-primary")} aria-hidden />
                  <span>
                    <span className="block text-sm font-semibold">{noticeText(n, lang).title}</span>
                    <span className="block text-xs text-muted">{noticeText(n, lang).body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const NOTICE_TEXT: Record<string, { en: [string, string]; roman: [string, string]; ur: [string, string] }> = {
  welcome: {
    en: ["Welcome to HUMRAAH", "Try the Scam Escape Room — a safe place to practise spotting tricks."],
    roman: ["HUMRAAH mein khush aamdeed", "Scam Escape Room try karein — dhoka pehchanne ki mehfooz mashq."],
    ur: ["ہمراہ میں خوش آمدید", "اسکیم ایسکیپ روم آزمائیں — دھوکہ پہچاننے کی محفوظ مشق۔"],
  },
  privacy: {
    en: ["2-minute Privacy Checkup", "See how protected your phone and accounts are."],
    roman: ["2 minute ka Privacy Checkup", "Dekhein aap ka phone aur accounts kitne mehfooz hain."],
    ur: ["دو منٹ کا پرائیویسی چیک اپ", "دیکھیں آپ کا فون اور اکاؤنٹس کتنے محفوظ ہیں۔"],
  },
  skill: {
    en: ["New skill started", "Your Digital Independence Score was updated."],
    roman: ["Nayi maharat shuru", "Aap ka Digital Independence Score update ho gaya."],
    ur: ["نئی مہارت شروع", "آپ کا ڈیجیٹل خود مختاری اسکور اپڈیٹ ہو گیا۔"],
  },
};

function noticeText(n: { id: string; title: string; body: string }, lang: Lang) {
  const key = n.id.startsWith("skill-") ? "skill" : n.id;
  const entry = NOTICE_TEXT[key];
  if (!entry) return { title: n.title, body: n.body };
  const [title, body] = entry[lang];
  return { title, body };
}

function QuickSettings() {
  const { prefs, update, toggleTheme } = usePrefs();
  const { t, tx } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false), open);
  return (
    <div className="flex items-center gap-2">
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Language and accessibility"
          aria-expanded={open}
          className="flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-muted hover:text-fg cursor-pointer"
        >
          <Languages className="size-5" aria-hidden />
          <span className="hidden md:inline">{LANG_OPTIONS.find((l) => l.value === prefs.lang)?.short}</span>
          <Accessibility className="hidden size-5 md:block" aria-hidden />
        </button>
        {open && (
          <div className="absolute end-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-line bg-elevated p-3 shadow-float animate-fade-up">
            <p className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wider text-subtle">{tx({ en: "Language", roman: "Zabaan", ur: "زبان" })}</p>
            <div className="grid grid-cols-3 gap-1.5">
              {LANG_OPTIONS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => update({ lang: l.value })}
                  aria-pressed={prefs.lang === l.value}
                  className={cn("rounded-xl border px-2 py-2 text-sm font-semibold cursor-pointer", prefs.lang === l.value ? "border-primary bg-primary-soft text-fg" : "border-line text-muted hover:text-fg")}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="px-1 pb-2 pt-4 text-[11px] font-bold uppercase tracking-wider text-subtle">{tx({ en: "Accessibility", roman: "Aasaani", ur: "آسانی" })}</p>
            <Toggle label={tx({ en: "Elder Mode — bigger text & buttons", roman: "Elder Mode — bara text aur buttons", ur: "بزرگ موڈ — بڑا متن اور بٹن" })} checked={prefs.elder} onChange={(v) => update({ elder: v })} />
            <Toggle label={tx({ en: "Reduce motion", roman: "Kam harkat", ur: "کم حرکت" })} checked={prefs.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
            <Toggle label={tx({ en: "Read answers aloud automatically", roman: "Jawab khud parh kar sunayein", ur: "جواب خود پڑھ کر سنائیں" })} checked={prefs.autoSpeak} onChange={(v) => update({ autoSpeak: v })} />
          </div>
        )}
      </div>
      <button onClick={toggleTheme} aria-label={t("top.theme")} className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-fg cursor-pointer">
        {prefs.theme === "dark" ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
      </button>
    </div>
  );
}

export function Toggle({ label, checked, onChange, description, className }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string; className?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl px-1 py-2", className)}>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors cursor-pointer", checked ? "bg-primary" : "bg-surface-3 ring-1 ring-line")}
      >
        <span className={cn("absolute top-1 size-5 rounded-full bg-white shadow transition-all", checked ? "start-6" : "start-1")} />
      </button>
    </label>
  );
}

function Avatar() {
  const { prefs } = usePrefs();
  const initials = (prefs.name || "You").split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  return (
    <Link href="/settings" aria-label="Your profile and settings" className="flex size-11 items-center justify-center rounded-full bg-carbon font-display text-sm font-bold text-lime dark:bg-lime dark:text-on-lime">
      {initials}
    </Link>
  );
}

const MOBILE_TABS = ["/", "/assistant", "/shield", "/academy", "/progress"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();
  const { t } = useT();

  return (
    <div className="ambient relative min-h-dvh overflow-x-hidden">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        Skip to content
      </a>

      {/* Floating background ambient aurora orbs */}
      <div className="pointer-events-none fixed -right-28 -top-28 size-[520px] rounded-full bg-primary/15 blur-[130px] animate-float-slow" aria-hidden />
      <div className="pointer-events-none fixed -left-28 bottom-20 size-[450px] rounded-full bg-info/10 blur-[140px] animate-float" aria-hidden />
      <div className="pointer-events-none fixed right-1/4 bottom-1/3 size-[350px] rounded-full bg-lavender/5 blur-[120px]" aria-hidden />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-[17rem] flex-col border-e border-line bg-surface px-4 py-5 lg:flex">
        <div className="px-2">
          <Logo />
        </div>
        <div className="mt-7 flex-1 overflow-y-auto scrollbar-thin pe-1">
          <SideNav />
        </div>
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-carbon/60 backdrop-blur-sm" aria-label="Close menu" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[min(20rem,85vw)] flex-col bg-elevated px-4 py-5 shadow-float animate-fade-up">
            <div className="flex items-center justify-between px-2">
              <Logo />
              <button onClick={() => setDrawer(false)} aria-label="Close menu" className="flex size-10 items-center justify-center rounded-xl text-muted hover:bg-surface-2 cursor-pointer">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <SideNav onNavigate={() => setDrawer(false)} />
            </div>
            <SidebarFooter />
          </div>
        </div>
      )}

      <div className="lg:ps-[17rem]">
        <header className="sticky top-0 z-30 px-3 pt-3 sm:px-5 lg:px-7">
          <div className="glass mx-auto flex h-16 max-w-[1400px] items-center gap-3 rounded-full border border-line px-3 shadow-float sm:px-4">
            <button onClick={() => setDrawer(true)} aria-label="Open menu" className="flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted lg:hidden cursor-pointer">
              <Menu className="size-5" />
            </button>
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="hidden flex-1 sm:block">
              <SearchBox />
            </div>
            <div className="ms-auto flex items-center gap-2">
              <Link href="/emergency" className="hidden h-11 items-center gap-2.5 rounded-full border border-danger/25 bg-danger-soft px-4 text-sm font-bold text-danger hover:brightness-105 transition-colors md:flex">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-danger opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-danger" />
                </span>
                <LifeBuoy className="size-4.5" aria-hidden /> SOS
              </Link>
              <QuickSettings />
              <Notifications />
              <Avatar />
            </div>
          </div>
          <div className="mt-2 sm:hidden">
            <SearchBox />
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav aria-label="Quick" className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line pb-[env(safe-area-inset-bottom)] lg:hidden">
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {MOBILE_TABS.map((href) => {
            const n = NAV.find((x) => x.href === href)!;
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold", active ? "text-fg" : "text-subtle")}>
                  <n.icon className="size-6" aria-hidden />
                  <span className="max-w-[4.5rem] truncate">{t(n.key)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
