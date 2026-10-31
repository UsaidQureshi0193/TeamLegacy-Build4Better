"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowRight, Bot, Eye, FileText, GraduationCap, HeartHandshake, Lightbulb, Lock, Map, MessageSquareWarning, Mic, ShieldAlert,
  ShieldCheck, Siren, Sparkles, TrendingUp, type LucideIcon,
} from "lucide-react";
import { VoiceMic } from "@/components/media";
import { Toggle } from "@/components/shell";
import { Badge, Button, ButtonLink, Card, IconTile, ModeBadge, ScoreRing, cn, useAiStatus } from "@/components/ui";
import { setHandoff } from "@/lib/client";
import { useT, type StringKey } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { SKILLS, computeScore, useProgress } from "@/lib/progress";
import type { Lang } from "@/lib/types";

const ACTIONS: { href: string; key: StringKey; icon: LucideIcon; tone: "teal" | "danger" | "info" | "success" | "lavender"; desc: { en: string; roman: string; ur: string } }[] = [
  { href: "/assistant", key: "home.speak", icon: Mic, tone: "teal", desc: { en: "Ask anything by voice or text, in Urdu or English.", roman: "Awaz ya text se kuch bhi poochein, Urdu ya English mein.", ur: "آواز یا متن سے کچھ بھی پوچھیں۔" } },
  { href: "/shield", key: "home.check", icon: MessageSquareWarning, tone: "danger", desc: { en: "See exactly why an SMS or WhatsApp looks risky.", roman: "Dekhein SMS ya WhatsApp kyun khatarnaak lagta hai.", ur: "دیکھیں پیغام کیوں خطرناک لگتا ہے۔" } },
  { href: "/vision", key: "home.screen", icon: Eye, tone: "info", desc: { en: "Upload a screenshot — tap any part to have it explained.", roman: "Screenshot dalein — kisi bhi hissay par tap kar ke samjhein.", ur: "اسکرین شاٹ ڈالیں اور سمجھیں۔" } },
  { href: "/guide", key: "home.learnTask", icon: Map, tone: "success", desc: { en: "One simple step at a time: bills, WhatsApp, email…", roman: "Ek waqt mein ek qadam: bill, WhatsApp, email…", ur: "ایک وقت میں ایک قدم۔" } },
  { href: "/academy", key: "home.practice", icon: GraduationCap, tone: "lavender", desc: { en: "Scam Escape Room and missions with fictional data.", roman: "Scam Escape Room aur farzi data wale missions.", ur: "فرضی ڈیٹا کے ساتھ مشق۔" } },
];

const TIPS = [
  { en: "Your bank will never ask for your OTP — not by call, SMS or WhatsApp.", roman: "Aap ka bank kabhi OTP nahi maangta — na call, na SMS, na WhatsApp par." },
  { en: "A relative asking for money from a 'new number'? Call their old number first.", roman: "'Naye number' se rishtedar paise maange? Pehle purane number par call karein." },
  { en: "Read web addresses from the right: bank.com.pk.verify.top is really verify.top.", roman: "Website ka pata daayein se parhein: bank.com.pk.verify.top asal mein verify.top hai." },
  { en: "If a message makes you panic, pause. Real problems can wait 5 minutes.", roman: "Agar message se ghabrahat ho to ruk jayein. Asli masla 5 minute intezar kar sakta hai." },
  { en: "A torch app doesn't need your contacts. Say 'Don't allow'.", roman: "Torch app ko contacts nahi chahiye. 'Don't allow' dabayein." },
];

const JOURNEY = [
  { icon: MessageSquareWarning, en: "A strange bank SMS arrives", roman: "Ajeeb bank SMS aata hai", href: "/shield" },
  { icon: ShieldAlert, en: "Scam DNA shows the red flags", roman: "Scam DNA khatre dikhata hai", href: "/shield" },
  { icon: Siren, en: "Clear, safe next steps", roman: "Wazeh, mehfooz agle qadam", href: "/emergency" },
  { icon: GraduationCap, en: "Practise in the Escape Room", roman: "Escape Room mein mashq", href: "/academy" },
  { icon: TrendingUp, en: "Independence grows", roman: "Khud-mukhtari barhti hai", href: "/progress" },
];

const noopSubscribe = () => () => {};

function greetingName(name: string, lang: Lang) {
  if (!name) return "";
  return lang === "ur" ? `، ${name}` : `, ${name}`;
}

function Onboarding() {
  const { prefs, update } = usePrefs();
  const { tx } = useT();
  const [name, setName] = useState(prefs.name);
  return (
    <Card glow className="mb-6 overflow-hidden p-6 sm:p-8 animate-fade-up">
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <Badge tone="teal" icon={HeartHandshake}>{tx({ en: "Welcome · Khush aamdeed", roman: "Khush aamdeed", ur: "خوش آمدید" })}</Badge>
          <h2 className="mt-3 text-2xl font-extrabold">{tx({ en: "Let's set HUMRAAH up for you", roman: "Chaliye HUMRAAH ko aap ke liye tayyar karein", ur: "آئیے ہمراہ کو آپ کے لیے تیار کریں" })}</h2>
          <p className="mt-2 max-w-xl text-muted">
            {tx({
              en: "HUMRAAH explains, checks and teaches — you stay in control. It will never ask for your passwords, PINs or OTPs, and your progress stays on this device.",
              roman: "HUMRAAH samjhata, check karta aur sikhata hai — ikhtiyar aap ke paas rehta hai. Yeh kabhi password, PIN ya OTP nahi maangega, aur progress isi device par rehti hai.",
            })}
          </p>
          <label className="mt-5 block max-w-sm">
            <span className="mb-1.5 block text-sm font-semibold">{tx({ en: "What should I call you? (optional)", roman: "Main aap ko kya kahun? (ikhtiyari)" })}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 40))}
              placeholder="e.g. Abu"
              className="h-12 w-full rounded-2xl border border-line bg-surface-2 px-4 text-base focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
            />
          </label>
        </div>
        <div className="w-full space-y-4 lg:w-80">
          <div>
            <p className="mb-2 text-sm font-semibold">{tx({ en: "Language", roman: "Zabaan", ur: "زبان" })}</p>
            <div className="grid grid-cols-3 gap-2">
              {([["en", "English"], ["roman", "Roman Urdu"], ["ur", "اردو"]] as [Lang, string][]).map(([v, l]) => (
                <button key={v} onClick={() => update({ lang: v })} aria-pressed={prefs.lang === v} className={cn("rounded-xl border px-2 py-3 text-sm font-semibold cursor-pointer", prefs.lang === v ? "border-primary bg-primary-soft" : "border-line text-muted")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface-2 px-3">
            <Toggle label={tx({ en: "Elder Mode (bigger text)", roman: "Elder Mode (bara text)" })} checked={prefs.elder} onChange={(v) => update({ elder: v })} />
            <Toggle label={tx({ en: "Read answers aloud", roman: "Jawab parh kar sunayein" })} checked={prefs.autoSpeak} onChange={(v) => update({ autoSpeak: v })} />
          </div>
          <Button size="lg" className="w-full" icon={Sparkles} onClick={() => update({ onboarded: true, name: name.trim() })}>
            {tx({ en: "Start using HUMRAAH", roman: "HUMRAAH shuru karein", ur: "ہمراہ شروع کریں" })}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/** Elder Mode home: four huge actions, one per row on phones (blueprint §04.11). */
function ElderHome() {
  const { t, tx } = useT();
  const items = [ACTIONS[0], ACTIONS[1], ACTIONS[2], ACTIONS[4]];
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((a) => (
        <Link key={a.href} href={a.href} className="group flex min-h-40 items-center gap-5 rounded-[var(--radius-xl)] border-2 border-line bg-surface p-6 shadow-card transition hover:border-primary">
          <IconTile icon={a.icon} tone={a.tone} size="lg" className="size-20 [&>svg]:size-10" />
          <span>
            <span className="block font-display text-2xl font-extrabold">{t(a.key)}</span>
            <span className="mt-1 block text-base text-muted">{tx(a.desc)}</span>
          </span>
        </Link>
      ))}
      <Link href="/emergency" className="flex items-center justify-center gap-3 rounded-[var(--radius-xl)] bg-danger-soft p-5 text-xl font-bold text-danger sm:col-span-2">
        <Siren className="size-7" /> {t("nav.emergency")}
      </Link>
    </div>
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
  const recent = events.slice(-4).reverse();
  const skillsDone = new Set(events.filter((e) => e.completed).map((e) => e.skill)).size;

  const onVoice = (text: string) => {
    setHandoff("assistant", text);
    router.push("/assistant");
  };

  return (
    <div className="space-y-6">
      {ready && !prefs.onboarded && <Onboarding />}

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden rounded-[var(--radius-xl)] p-6 text-white shadow-float sm:p-10 animate-fade-up">
        <div className="grid-dots pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/12 text-white" icon={ShieldCheck}>{tx({ en: "Your digital companion", roman: "Aap ka digital saathi", ur: "آپ کا ڈیجیٹل ساتھی" })}</Badge>
              {status && <ModeBadge mode={status.mode} className={status.mode === "live" ? "bg-white/12 text-white" : ""} />}
            </div>
            <h1 className={cn("mt-4 text-3xl font-extrabold leading-tight text-white sm:text-5xl", lang === "ur" && "urdu leading-[1.6]")}>
              {t("home.greeting")}
              {greetingName(prefs.name, lang)}.
              <span className="mt-1 block bg-gradient-to-r from-[#7ff0e2] via-[#5ee0a0] to-[#ffd98a] bg-clip-text text-transparent">{t("home.tagline")}</span>
            </h1>
            <p className={cn("mt-4 text-lg italic text-white/80", lang === "ur" && "urdu not-italic")}>“{t("home.promise")}”</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/shield" className="inline-flex h-13 items-center gap-2.5 rounded-2xl bg-white px-6 font-semibold text-[#0B1422] transition hover:bg-white/90">
                <ShieldAlert className="size-5" aria-hidden /> {t("home.check")}
              </Link>
              <Link href="/academy" className="inline-flex h-13 items-center gap-2.5 rounded-2xl border border-white/25 px-6 font-semibold text-white transition hover:bg-white/10">
                <GraduationCap className="size-5" aria-hidden /> {t("home.practice")}
              </Link>
            </div>
          </div>
          <div className="flex min-w-0 flex-col items-center rounded-[var(--radius-xl)] border border-white/15 bg-white/[0.06] px-5 py-6 sm:px-8 backdrop-blur-md [&_p]:text-white/80">
            <p className="mb-3 font-display text-lg font-bold !text-white">{t("home.speak")}</p>
            <VoiceMic
              onTranscript={onVoice}
              labels={{
                idle: tx({ en: "Tap and speak — Urdu or English", roman: "Tap kar ke bolein — Urdu ya English", ur: "ٹیپ کر کے بولیں" }),
                listening: tx({ en: "Listening… tap to stop", roman: "Sun raha hoon… rokne ke liye tap", ur: "سن رہا ہوں…" }),
                unsupported: tx({ en: "Voice isn't available in this browser — tap below to type", roman: "Is browser mein awaz nahi — type karne ke liye neeche tap karein" }),
              }}
            />
            <Link href="/assistant" className="mt-2 text-sm font-semibold text-[#7ff0e2] hover:underline">
              {tx({ en: "or type a question →", roman: "ya sawal type karein →", ur: "یا سوال لکھیں ←" })}
            </Link>
          </div>
        </div>
      </section>

      {prefs.elder ? (
        <ElderHome />
      ) : (
        <>
          {/* Main actions */}
          <section aria-label="Quick actions" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {ACTIONS.map((a, i) => (
              <Link
                key={a.href}
                href={a.href}
                className="group relative flex flex-col rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 dark:hover:shadow-glow animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <IconTile icon={a.icon} tone={a.tone} size="lg" />
                <span className="mt-4 font-display text-lg font-bold">{t(a.key)}</span>
                <span className={cn("mt-1 text-sm text-muted", lang === "ur" && "urdu")}>{tx(a.desc)}</span>
                <ArrowRight className="absolute right-5 top-6 size-5 text-subtle transition group-hover:translate-x-1 group-hover:text-primary rtl:rotate-180" aria-hidden />
              </Link>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            {/* Flagship journey */}
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{tx({ en: "How HUMRAAH protects you", roman: "HUMRAAH aap ki hifazat kaise karta hai" })}</p>
                  <h2 className="mt-1 text-xl font-extrabold">{tx({ en: "From a scary SMS to real confidence", roman: "Daraune wale SMS se asli aitmaad tak" })}</h2>
                </div>
                <ButtonLink href="/shield" variant="soft" size="sm" icon={ArrowRight}>{tx({ en: "Try it now", roman: "Abhi try karein" })}</ButtonLink>
              </div>
              <ol className="mt-6 grid gap-3 sm:grid-cols-5">
                {JOURNEY.map((s, i) => (
                  <li key={i} className="relative">
                    <Link href={s.href} className="flex h-full flex-col items-center rounded-2xl border border-line bg-surface-2 p-4 text-center transition hover:border-primary/50">
                      <span className="relative">
                        <IconTile icon={s.icon} tone={i === 0 ? "danger" : i === 1 ? "lavender" : i === 2 ? "warning" : i === 3 ? "info" : "success"} />
                        <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-on-primary">{i + 1}</span>
                      </span>
                      <span className="mt-3 text-sm font-semibold leading-snug">{tx(s)}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-warning-soft p-4">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                <div>
                  <p className="text-sm font-bold">{tx({ en: "Today's safety tip", roman: "Aaj ka hifazati mashwara" })}</p>
                  <p className="text-sm text-muted">{tx(TIPS[tipIndex])}</p>
                </div>
              </div>
            </Card>

            {/* Independence snapshot */}
            <Card glow className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold">{tx({ en: "Digital Independence", roman: "Digital Khud-mukhtari" })}</h2>
                <Link href="/progress" className="text-sm font-semibold text-primary hover:underline">{tx({ en: "Details", roman: "Tafseel" })}</Link>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <ScoreRing value={score.score} label={tx({ en: "score", roman: "score" })} />
                <div className="space-y-2 text-sm">
                  <p><span className="font-display text-xl font-extrabold">{events.filter((e) => e.completed && (e.kind === "escape-room" || e.kind === "mission" || e.kind === "guide-task")).length}</span> <span className="text-muted">{tx({ en: "lessons completed", roman: "sabaq mukammal" })}</span></p>
                  <p><span className="font-display text-xl font-extrabold">{events.filter((e) => e.independent && e.completed).length}</span> <span className="text-muted">{tx({ en: "done without help", roman: "baghair madad" })}</span></p>
                  <p><span className="font-display text-xl font-extrabold">{skillsDone}/{Object.keys(SKILLS).length}</span> <span className="text-muted">{tx({ en: "skill areas", roman: "maharatein" })}</span></p>
                </div>
              </div>
              {score.score === null ? (
                <p className="mt-4 text-sm text-muted">{tx({ en: "Your score starts from real practice — nothing is made up. Try the Escape Room to begin.", roman: "Aap ka score asli mashq se banta hai — kuch farzi nahi. Shuru karne ke liye Escape Room try karein." })}</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {recent.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                      <span className="truncate">{e.title}</span>
                      {e.maxScore ? <Badge tone="teal">{e.score}/{e.maxScore}</Badge> : <Badge tone="neutral">{new Date(e.ts).toLocaleDateString()}</Badge>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* More tools */}
          <section className="grid gap-4 md:grid-cols-3">
            {[
              { href: "/document", icon: FileText, tone: "info" as const, title: t("nav.document"), body: { en: "Due date, amount and reference number from any bill.", roman: "Kisi bhi bill se tareekh, raqam aur reference number." } },
              { href: "/guardian", icon: Lock, tone: "success" as const, title: t("nav.guardian"), body: { en: "2-minute Privacy Checkup and app-permission advice.", roman: "2 minute Privacy Checkup aur app permissions ka mashwara." } },
              { href: "/emergency", icon: Siren, tone: "danger" as const, title: t("nav.emergency"), body: { en: "Shared an OTP? Lost money? Calm steps, right now.", roman: "OTP bata diya? Paise gaye? Abhi sukoon se qadam." } },
            ].map((c) => (
              <Link key={c.href} href={c.href} className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-5 shadow-card transition hover:border-primary/50">
                <IconTile icon={c.icon} tone={c.tone} />
                <span>
                  <span className="block font-bold">{c.title}</span>
                  <span className="block text-sm text-muted">{tx(c.body)}</span>
                </span>
              </Link>
            ))}
          </section>

          <p className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-subtle">
            <Bot className="size-4" aria-hidden />
            {tx({
              en: "HUMRAAH is a guidance and learning companion — not a bank or authority. Always verify important actions with the official provider.",
              roman: "HUMRAAH rehnumai aur taleem ka saathi hai — bank ya idara nahi. Aham kaam hamesha official idare se tasdeeq karein.",
            })}
          </p>
        </>
      )}
    </div>
  );
}
