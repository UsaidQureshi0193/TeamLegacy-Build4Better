"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Eye, FileText, GraduationCap, Lightbulb, Map, MessageSquareWarning, Mic, ShieldAlert, Siren, Sparkles, type LucideIcon } from "lucide-react";
import { VoiceMic } from "@/components/media";
import { Toggle } from "@/components/shell";
import { ActionCard, Button, ButtonLink, Card, ModeBadge, ScoreRing, Section, cn, useAiStatus, type Tone } from "@/components/ui";
import { setHandoff } from "@/lib/client";
import { useT, type StringKey } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { computeScore, useProgress } from "@/lib/progress";
import type { Lang } from "@/lib/types";

type Tri = { en: string; roman: string; ur: string };

const ACTIONS: { href: string; key: StringKey; icon: LucideIcon; tone: Tone; desc: Tri }[] = [
  { href: "/shield", key: "home.check", icon: MessageSquareWarning, tone: "danger", desc: { en: "Is this SMS or WhatsApp safe?", roman: "Kya yeh SMS ya WhatsApp mehfooz hai?", ur: "کیا یہ پیغام محفوظ ہے؟" } },
  { href: "/assistant", key: "home.speak", icon: Mic, tone: "teal", desc: { en: "Ask anything, in Urdu or English", roman: "Urdu ya English mein kuch bhi poochein", ur: "اردو یا انگریزی میں کچھ بھی پوچھیں" } },
  { href: "/vision", key: "home.screen", icon: Eye, tone: "info", desc: { en: "Upload a screenshot to have it explained", roman: "Screenshot dalein, main samjhaunga", ur: "اسکرین شاٹ ڈالیں، میں سمجھاؤں گا" } },
  { href: "/guide", key: "home.learnTask", icon: Map, tone: "success", desc: { en: "Bills, WhatsApp, email — step by step", roman: "Bill, WhatsApp, email — qadam ba qadam", ur: "بل، واٹس ایپ، ای میل — قدم بہ قدم" } },
  { href: "/academy", key: "home.practice", icon: GraduationCap, tone: "lavender", desc: { en: "Spot scams in a safe simulation", roman: "Mehfooz mashq mein dhoka pehchanein", ur: "محفوظ مشق میں دھوکہ پہچانیں" } },
  { href: "/document", key: "nav.document", icon: FileText, tone: "warning", desc: { en: "Due date and amount from any bill", roman: "Bill se tareekh aur raqam", ur: "بل سے تاریخ اور رقم" } },
];

const TIPS = [
  { en: "Your bank will never ask for your OTP — not by call, SMS or WhatsApp.", roman: "Aap ka bank kabhi OTP nahi maangta — na call, na SMS, na WhatsApp par." },
  { en: "A relative asking for money from a 'new number'? Call their old number first.", roman: "'Naye number' se rishtedar paise maange? Pehle purane number par call karein." },
  { en: "Read web addresses from the right: bank.com.pk.verify.top is really verify.top.", roman: "Website ka pata daayein se parhein: bank.com.pk.verify.top asal mein verify.top hai." },
  { en: "If a message makes you panic, pause. Real problems can wait 5 minutes.", roman: "Agar message se ghabrahat ho to ruk jayein. Asli masla 5 minute intezar kar sakta hai." },
  { en: "A torch app doesn't need your contacts. Say 'Don't allow'.", roman: "Torch app ko contacts nahi chahiye. 'Don't allow' dabayein." },
];

const noopSubscribe = () => () => {};

function Onboarding() {
  const { prefs, update } = usePrefs();
  const { tx } = useT();
  const [name, setName] = useState(prefs.name);
  return (
    <Card glow className="mb-6 p-5 sm:p-6">
      <h2 className="text-xl font-bold">{tx({ en: "Welcome! Let's set things up", roman: "Khush aamdeed! Chaliye set up karein", ur: "خوش آمدید! آئیے سیٹ اپ کریں" })}</h2>
      <p className="mt-1 text-sm text-muted">
        {tx({ en: "HUMRAAH never asks for passwords, PINs or OTPs. Your progress stays on this device.", roman: "HUMRAAH kabhi password, PIN ya OTP nahi maangta. Progress isi device par rehti hai." })}
      </p>
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{tx({ en: "Your name (optional)", roman: "Aap ka naam (ikhtiyari)" })}</span>
          <input value={name} onChange={(e) => setName(e.target.value.slice(0, 40))} placeholder="e.g. Abu" className="h-11 w-full rounded-xl border border-line bg-surface-2 px-4 focus:border-primary focus:outline-none" />
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium">{tx({ en: "Language", roman: "Zabaan", ur: "زبان" })}</span>
          <div className="grid grid-cols-3 gap-1.5">
            {([["en", "English"], ["roman", "Roman"], ["ur", "اردو"]] as [Lang, string][]).map(([v, l]) => (
              <button key={v} onClick={() => update({ lang: v })} aria-pressed={prefs.lang === v} className={cn("h-11 rounded-xl border text-sm font-medium cursor-pointer", prefs.lang === v ? "border-primary bg-primary-soft" : "border-line text-muted")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Toggle label={tx({ en: "Bigger text (Elder Mode)", roman: "Bara text (Elder Mode)" })} checked={prefs.elder} onChange={(v) => update({ elder: v })} />
          <Toggle label={tx({ en: "Read answers aloud", roman: "Jawab sunayein" })} checked={prefs.autoSpeak} onChange={(v) => update({ autoSpeak: v })} />
        </div>
      </div>
      <Button className="mt-5" icon={Sparkles} onClick={() => update({ onboarded: true, name: name.trim() })}>
        {tx({ en: "Start", roman: "Shuru karein", ur: "شروع کریں" })}
      </Button>
    </Card>
  );
}

export default function HomePage() {
  const { prefs, ready } = usePrefs();
  const { t, tx, lang } = useT();
  const router = useRouter();
  const { events } = useProgress();
  const status = useAiStatus();
  const score = useMemo(() => computeScore(events), [events]);
  // Day-of-month tip, read only in the browser so prerendering stays deterministic.
  const tipIndex = useSyncExternalStore(noopSubscribe, () => new Date().getDate() % TIPS.length, () => 0);
  const completed = events.filter((e) => e.completed && (e.kind === "escape-room" || e.kind === "mission" || e.kind === "guide-task")).length;
  // Elder Mode keeps only the four most important actions.
  const actions = prefs.elder ? ACTIONS.slice(0, 4) : ACTIONS;

  return (
    <div className="space-y-8">
      {ready && !prefs.onboarded && <Onboarding />}

      {/* Greeting + voice */}
      <section className="hero-gradient relative flex flex-col gap-8 rounded-3xl p-6 sm:p-9 text-white lg:flex-row lg:items-center shadow-xl">
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-10 size-60 rounded-full bg-info/15 blur-2xl" aria-hidden />

        <div className="relative z-10 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/95 backdrop-blur-md ring-1 ring-white/20">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
              {tx({ en: "AI Companion · Voice First", roman: "AI Saathi · Awaz Se Chalta Hai", ur: "ڈیجیٹل ساتھی · آواز سے مدد" })}
            </span>
            {status && <ModeBadge mode={status.mode} className={status.mode === "live" ? "bg-white/15 text-white ring-1 ring-white/25" : ""} />}
          </div>

          <h1 className={cn("mt-4 font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-white", lang === "ur" && "urdu leading-[1.7]")}>
            {t("home.greeting")}
            {prefs.name ? (lang === "ur" ? `، ${prefs.name}` : `, ${prefs.name}`) : ""}
          </h1>
          <p className={cn("mt-2 max-w-xl text-base sm:text-lg text-white/85 leading-relaxed", lang === "ur" && "urdu")}>
            {t("home.tagline")}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/shield"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-white px-5 font-semibold text-[#0B1422] shadow-md transition-all hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShieldAlert className="size-5 text-[#0B1422]" aria-hidden /> {t("home.check")}
            </Link>
            <Link
              href="/emergency"
              className="inline-flex h-12 items-center gap-2.5 rounded-xl border border-rose-400/40 bg-rose-500/20 px-5 font-semibold text-white backdrop-blur-md transition-all hover:bg-rose-500/30 hover:border-rose-400/60 active:scale-[0.98]"
            >
              <Siren className="size-5 text-rose-300" aria-hidden /> {t("nav.emergency")}
            </Link>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center rounded-3xl border border-white/20 bg-white/[0.08] px-7 py-6 shadow-2xl backdrop-blur-xl transition-all hover:border-white/30 [&_p]:!text-white/90">
          <span className="mb-2 text-[11px] font-bold uppercase tracking-wider text-teal-300">
            {tx({ en: "Instant Voice", roman: "Fori Awaz", ur: "فوری آواز" })}
          </span>
          <VoiceMic
            size="md"
            onTranscript={(text) => {
              setHandoff("assistant", text);
              router.push("/assistant");
            }}
            labels={{
              idle: tx({ en: "Tap and speak to Humraah", roman: "Tap kar ke Humraah se bolein", ur: "ٹیپ کر کے ہمراہ سے بولیں" }),
              listening: tx({ en: "Listening… tap to stop", roman: "Sun raha hoon… rokne ke liye tap", ur: "سن رہا ہوں… روکنے کے لیے ٹیپ کریں" }),
              unsupported: tx({ en: "Voice not available — type instead", roman: "Awaz dastyab nahi — type karein", ur: "آواز دستیاب نہیں — ٹائپ کریں" }),
            }}
          />
        </div>
      </section>

      <Section title={tx({ en: "What would you like to do?", roman: "Aap kya karna chahte hain?", ur: "آپ کیا کرنا چاہتے ہیں؟" })}>
        <div className={cn("grid gap-4 sm:grid-cols-2", !prefs.elder && "xl:grid-cols-3")}>
          {actions.map((a) => (
            <ActionCard key={a.href} href={a.href} icon={a.icon} tone={a.tone} title={t(a.key)} description={tx(a.desc)} className={prefs.elder ? "p-6 text-lg" : undefined} />
          ))}
        </div>
      </Section>

      {!prefs.elder && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="flex items-center gap-5 p-5 sm:p-6 card-hover glow-teal border border-primary/20 bg-gradient-to-br from-surface via-surface to-primary/5">
            <ScoreRing value={score.score} size={100} stroke={8} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden />
                <p className="font-display font-bold text-lg text-fg">{tx({ en: "Digital Independence Score", roman: "Digital Independence Score", ur: "ڈیجیٹل آزادی کا اسکور" })}</p>
              </div>
              <p className="mt-1 text-sm text-muted leading-relaxed">
                {score.score === null
                  ? tx({ en: "Starts from real practice. Try the Escape Room to begin.", roman: "Asli mashq se banta hai. Escape Room se shuru karein.", ur: "اصلی مشق سے بنتا ہے۔ اسکیپ روم سے شروع کریں۔" })
                  : tx({ en: `${completed} lessons completed so far.`, roman: `Ab tak ${completed} sabaq mukammal.`, ur: `اب تک ${completed} اسباق مکمل۔` })}
              </p>
              <ButtonLink href={score.score === null ? "/academy" : "/progress"} variant="soft" size="sm" className="mt-3.5 shadow-soft">
                {score.score === null ? tx({ en: "Start practising", roman: "Mashq shuru karein", ur: "مشق شروع کریں" }) : tx({ en: "See progress", roman: "Progress dekhein", ur: "پراگریس دیکھیں" })}
              </ButtonLink>
            </div>
          </Card>
          <Card className="flex gap-4.5 p-5 sm:p-6 card-hover glow-warning border border-amber-500/20 bg-gradient-to-br from-surface via-surface to-amber-500/5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning-soft text-warning shadow-soft animate-pulse-subtle">
              <Lightbulb className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display font-bold text-lg text-fg">{tx({ en: "Today's safety tip", roman: "Aaj ka mashwara", ur: "آج کا مشورہ" })}</p>
              <p className="mt-1 text-sm text-muted leading-relaxed">{tx(TIPS[tipIndex])}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
