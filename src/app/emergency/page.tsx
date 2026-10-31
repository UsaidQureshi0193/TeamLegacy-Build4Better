"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, Banknote, Camera, CheckCircle2, ChevronLeft, Circle, ExternalLink, FileWarning, KeyRound, LifeBuoy, Phone,
  PhoneOff, Siren, UserX, type LucideIcon,
} from "lucide-react";
import { EMERGENCY_PLAYBOOKS, OFFICIAL_CHANNELS, type EmergencyPlaybook } from "@/data/help";
import { pick } from "@/data/scenarios";
import { takeHandoff } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { Badge, Button, Card, IconTile, Notice, PageHeader, ProgressBar, SpeakButton, cn } from "@/components/ui";

const ICONS: Record<EmergencyPlaybook["icon"], LucideIcon> = { key: KeyRound, banknote: Banknote, "user-x": UserX, "phone-off": PhoneOff, alert: AlertTriangle };
const STORE = "humraah.emergency.checklist";

function loadChecks(): Record<string, number[]> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? "{}");
  } catch {
    return {};
  }
}

export default function EmergencyPage() {
  const { lang, tx } = useT();
  const [selected, setSelected] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, number[]>>({});

  useEffect(() => {
    // Restore session checklist and accept a handoff from Shield / Assistant (e.g. "shared-otp").
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChecks(loadChecks());
    const h = takeHandoff("emergency");
    if (h && EMERGENCY_PLAYBOOKS.some((p) => p.id === h)) setSelected(h);
  }, []);

  const toggle = (pid: string, i: number) => {
    setChecks((prev) => {
      const cur = prev[pid] ?? [];
      const next = { ...prev, [pid]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] };
      try {
        sessionStorage.setItem(STORE, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const playbook = EMERGENCY_PLAYBOOKS.find((p) => p.id === selected);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Siren}
        tone="danger"
        eyebrow="HUMRAAH Emergency"
        title={tx({ en: "Emergency Help", roman: "Emergency Help", ur: "ایمرجنسی مدد" })}
        subtitle={tx({ en: "Take a breath. We'll go through the most important steps first, one at a time.", roman: "Gehri saans lein. Hum sab se zaroori qadam pehle, ek ek kar ke uthayenge." })}
      />

      <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-danger/30 bg-danger-soft p-5 sm:p-6" role="alert">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-danger text-white shadow-[0_10px_30px_-10px_rgb(197_47_58/0.8)]">
            <Phone className="size-7" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="font-display text-lg font-extrabold text-fg sm:text-xl">
              {tx({ en: "If money or your account is at risk, call your bank now on the number on your card.", roman: "Agar paise ya account khatre mein hai to abhi apne card par likhe number par bank ko call karein.", ur: "اگر رقم یا اکاؤنٹ خطرے میں ہے تو ابھی اپنے کارڈ پر لکھے نمبر پر بینک کو کال کریں۔" })}
            </p>
            <p className="mt-1 text-sm text-muted">
              {tx({ en: "HUMRAAH cannot recover money or accounts, or contact anyone for you. It guides you to the right people quickly.", roman: "HUMRAAH paise ya account wapas nahi dila sakta, na aap ki taraf se kisi se rabta kar sakta hai. Yeh aap ko jaldi sahi logon tak pohanchata hai." })}
            </p>
          </div>
        </div>
      </div>

      {!playbook ? (
        <section aria-labelledby="what-happened">
          <h2 id="what-happened" className="mb-3 font-display text-xl font-bold">{tx({ en: "What happened?", roman: "Kya hua?", ur: "کیا ہوا؟" })}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {EMERGENCY_PLAYBOOKS.map((p) => {
              const Icon = ICONS[p.icon];
              const done = (checks[p.id] ?? []).length;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="group flex min-h-32 flex-col items-start gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-danger/50 cursor-pointer"
                >
                  <IconTile icon={Icon} tone="danger" />
                  <span>
                    <span className="block font-display text-base font-bold">{pick(p.title, lang)}</span>
                    <span className="mt-1 block text-sm text-muted">{pick(p.when, lang)}</span>
                  </span>
                  {done > 0 && <Badge tone="success" icon={CheckCircle2}>{done}/{p.steps.length} {tx({ en: "done", roman: "mukammal" })}</Badge>}
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <Checklist playbook={playbook} done={checks[playbook.id] ?? []} onToggle={(i) => toggle(playbook.id, i)} onBack={() => setSelected(null)} />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <IconTile icon={LifeBuoy} tone="teal" />
            <div>
              <h2 className="font-display text-lg font-bold">{tx({ en: "Official help channels", roman: "Official madad ke zaraye" })}</h2>
              <p className="text-xs text-subtle">{tx({ en: "Checked Oct 2026. Always prefer numbers printed on your own card or bill.", roman: "Oct 2026 mein check kiye gaye. Hamesha apne card ya bill par likhe number ko tarjeeh dein." })}</p>
            </div>
          </div>
          <ul className="flex flex-col gap-2.5">
            {OFFICIAL_CHANNELS.map((c) => {
              const external = c.href?.startsWith("http");
              const inner = (
                <>
                  <span className="flex-1">
                    <span className="block font-semibold">{pick(c.name, lang)}</span>
                    <span className="block text-sm text-muted">{pick(c.detail, lang)}</span>
                  </span>
                  {c.href && (external ? <ExternalLink className="size-5 shrink-0 text-primary" aria-hidden /> : <Phone className="size-5 shrink-0 text-primary" aria-hidden />)}
                </>
              );
              return (
                <li key={c.name.en}>
                  {c.href ? (
                    <a
                      href={c.href}
                      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3.5 transition hover:border-primary/60"
                    >
                      {inner}
                    </a>
                  ) : (
                    <div className="flex min-h-16 items-center gap-3 rounded-2xl border border-line bg-surface-2 p-3.5">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <IconTile icon={Camera} tone="info" />
            <h2 className="font-display text-lg font-bold">{tx({ en: "Preserve evidence safely", roman: "Saboot mehfooz rakhein" })}</h2>
          </div>
          <ul className="flex flex-col gap-3 text-sm">
            {[
              { en: "Take screenshots of the messages, the sender's number and any transactions.", roman: "Messages, bhejne wale ka number aur transactions ke screenshots lein." },
              { en: "Write down the time of calls, the amounts and any complaint numbers you are given.", roman: "Calls ka waqt, raqam aur milne wale complaint numbers likh lein." },
              { en: "Don't forward suspicious links to others — describe them instead.", roman: "Mashkook links aage forward na karein — sirf bayan karein." },
              { en: "Don't delete the messages until you have reported them.", roman: "Report karne se pehle messages delete na karein." },
              { en: "Never share your OTP or PIN with anyone who calls to 'help' recover money.", roman: "Jo shakhs paise wapas dilane ki 'madad' ke liye call kare, use OTP ya PIN na batayein." },
            ].map((tip, i) => (
              <li key={i} className="flex gap-2.5">
                <FileWarning className="mt-0.5 size-4.5 shrink-0 text-info" aria-hidden />
                <span className="text-muted">{tx(tip)}</span>
              </li>
            ))}
          </ul>
          <Notice tone="warning" className="mt-5">
            {tx({ en: "Recovery scams are common: no one can guarantee getting your money back for a fee.", roman: "Recovery ke naam par bhi dhoka hota hai: koi fees le kar paise wapas dilane ki guarantee nahi de sakta." })}
          </Notice>
        </Card>
      </div>
    </div>
  );
}

function Checklist({ playbook, done, onToggle, onBack }: { playbook: EmergencyPlaybook; done: number[]; onToggle: (i: number) => void; onBack: () => void }) {
  const { lang, tx } = useT();
  const Icon = ICONS[playbook.icon];
  const progress = (done.length / playbook.steps.length) * 100;
  const speech = `${pick(playbook.title, lang)}. ${playbook.steps.map((s, i) => `${i + 1}. ${pick(s.text, lang)}`).join(" ")}`;
  return (
    <Card glow className="p-5 sm:p-7 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <IconTile icon={Icon} tone="danger" size="lg" />
          <div>
            <h2 className="font-display text-xl font-extrabold">{pick(playbook.title, lang)}</h2>
            <p className="text-sm text-muted">{pick(playbook.when, lang)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SpeakButton id={`sos-${playbook.id}`} text={speech} size="md" />
          <Button variant="secondary" icon={ChevronLeft} onClick={onBack}>{tx({ en: "Other problems", roman: "Doosre masail" })}</Button>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <ProgressBar value={progress} label="Checklist progress" />
        <span className="shrink-0 text-sm font-bold text-muted">{done.length}/{playbook.steps.length}</span>
      </div>
      <ol className="mt-5 flex flex-col gap-3">
        {playbook.steps.map((s, i) => {
          const checked = done.includes(i);
          return (
            <li key={i}>
              <button
                onClick={() => onToggle(i)}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-start gap-3.5 rounded-2xl border-2 p-4 text-left transition-all cursor-pointer",
                  checked ? "border-success/40 bg-success-soft" : s.urgent ? "border-danger/40 bg-surface hover:border-danger" : "border-line bg-surface-2 hover:border-primary/60",
                )}
              >
                {checked ? <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-success" aria-hidden /> : <Circle className="mt-0.5 size-6 shrink-0 text-subtle" aria-hidden />}
                <span className="flex-1">
                  <span className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-subtle">{tx({ en: "Step", roman: "Qadam" })} {i + 1}</span>
                    {s.urgent && !checked && <Badge tone="danger">{tx({ en: "Do now", roman: "Abhi karein", ur: "ابھی کریں" })}</Badge>}
                  </span>
                  <span className={cn("block text-base font-semibold", checked && "text-muted line-through decoration-1")}>{pick(s.text, lang)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {done.length === playbook.steps.length && (
        <Notice tone="success" className="mt-5" title={tx({ en: "You've completed every step.", roman: "Aap ne har qadam mukammal kar liya." })}>
          {tx({ en: "Well done for acting quickly. Keep an eye on your accounts for the next few days and keep your complaint numbers safe.", roman: "Jaldi qadam uthane par shabash. Agle kuch din account par nazar rakhein aur complaint numbers sambhal kar rakhein." })}
        </Notice>
      )}
    </Card>
  );
}
