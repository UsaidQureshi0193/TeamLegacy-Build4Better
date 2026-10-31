"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Banknote, CheckCircle2, ChevronLeft, Circle, ExternalLink, KeyRound, Phone, PhoneOff, Siren, UserX, type LucideIcon } from "lucide-react";
import { EMERGENCY_PLAYBOOKS, OFFICIAL_CHANNELS, type EmergencyPlaybook } from "@/data/help";
import { pick } from "@/data/scenarios";
import { takeHandoff } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { ActionCard, Badge, Button, Card, Notice, PageHeader, ProgressBar, Section, SpeakButton, cn } from "@/components/ui";

const ICONS: Record<EmergencyPlaybook["icon"], LucideIcon> = { key: KeyRound, banknote: Banknote, "user-x": UserX, "phone-off": PhoneOff, alert: AlertTriangle };
const STORE = "humraah.emergency.checklist";

const EVIDENCE_TIPS = [
  {
    en: "Screenshot the messages, the sender's number and any transactions.",
    roman: "Messages, bhejne wale ka number aur transactions ke screenshot lein.",
    ur: "پیغامات، بھیجنے والے کے نمبر اور لین دین کے اسکرین شاٹ لے لیں۔",
  },
  {
    en: "Write down call times, amounts and complaint numbers.",
    roman: "Calls ka waqt, raqam aur complaint numbers likh lein.",
    ur: "کال کا وقت، رقم اور شکایت نمبر لکھ لیں۔",
  },
  {
    en: "Don't forward suspicious links or delete messages before reporting.",
    roman: "Report se pehle mashkook links forward ya messages delete na karein.",
    ur: "رپورٹ کرنے سے پہلے مشکوک لنک آگے نہ بھیجیں اور پیغامات نہ مٹائیں۔",
  },
  {
    en: "No one can guarantee getting money back for a fee — that's a scam too.",
    roman: "Koi fees le kar paise wapas dilane ki guarantee nahi de sakta — yeh bhi dhoka hai.",
    ur: "کوئی فیس لے کر رقم واپس دلانے کی ضمانت نہیں دے سکتا — یہ بھی دھوکہ ہے۔",
  },
];

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
    <div className="space-y-8">
      <div>
        <PageHeader
          icon={Siren}
          tone="danger"
          title={tx({ en: "Emergency Help", roman: "Emergency Help", ur: "ایمرجنسی مدد" })}
          subtitle={tx({ en: "Take a breath. Most important steps first.", roman: "Gehri saans lein. Sab se zaroori qadam pehle.", ur: "گہری سانس لیں۔ سب سے ضروری قدم پہلے۔" })}
        />
        <div className="flex gap-3 rounded-[var(--radius-lg)] bg-danger-soft p-4" role="alert">
          <Phone className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
          <div>
            <p className="font-semibold">
              {tx({ en: "Money or account at risk? Call your bank now on the number on your card.", roman: "Paise ya account khatre mein? Abhi card par likhe number par bank ko call karein.", ur: "رقم یا اکاؤنٹ خطرے میں؟ ابھی کارڈ پر لکھے نمبر پر بینک کو کال کریں۔" })}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {tx({ en: "HUMRAAH can't recover money or contact anyone for you.", roman: "HUMRAAH paise wapas nahi dila sakta, na aap ki taraf se kisi se rabta kar sakta hai.", ur: "ہمراہ رقم واپس نہیں دلا سکتا، نہ آپ کی طرف سے کسی سے رابطہ کر سکتا ہے۔" })}
            </p>
          </div>
        </div>
      </div>

      {!playbook ? (
        <Section title={tx({ en: "What happened?", roman: "Kya hua?", ur: "کیا ہوا؟" })}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {EMERGENCY_PLAYBOOKS.map((p) => {
              const done = (checks[p.id] ?? []).length;
              return (
                <ActionCard
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  icon={ICONS[p.icon]}
                  tone="danger"
                  title={pick(p.title, lang)}
                  description={pick(p.when, lang)}
                  meta={done > 0 ? <Badge tone="success">{done}/{p.steps.length} {tx({ en: "done", roman: "mukammal", ur: "مکمل" })}</Badge> : undefined}
                />
              );
            })}
          </div>
        </Section>
      ) : (
        <Checklist playbook={playbook} done={checks[playbook.id] ?? []} onToggle={(i) => toggle(playbook.id, i)} onBack={() => setSelected(null)} />
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Section
          title={tx({ en: "Official help", roman: "Official madad", ur: "سرکاری مدد" })}
          description={tx({ en: "Prefer numbers printed on your own card or bill.", roman: "Apne card ya bill par likhe number ko tarjeeh dein.", ur: "اپنے کارڈ یا بل پر لکھے نمبر کو ترجیح دیں۔" })}
        >
          <Card className="divide-y divide-line">
            {OFFICIAL_CHANNELS.map((c) => {
              const external = c.href?.startsWith("http");
              const inner = (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{pick(c.name, lang)}</span>
                    <span className="block text-sm text-muted">{pick(c.detail, lang)}</span>
                  </span>
                  {c.href && (external ? <ExternalLink className="size-4.5 shrink-0 text-primary" aria-hidden /> : <Phone className="size-4.5 shrink-0 text-primary" aria-hidden />)}
                </>
              );
              return c.href ? (
                <a key={c.name.en} href={c.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-2">
                  {inner}
                </a>
              ) : (
                <div key={c.name.en} className="flex items-center gap-3 p-4">{inner}</div>
              );
            })}
          </Card>
        </Section>

        <Section title={tx({ en: "Keep evidence safely", roman: "Saboot mehfooz rakhein", ur: "ثبوت محفوظ رکھیں" })}>
          <Card className="p-5">
            <ul className="space-y-3 text-sm">
              {EVIDENCE_TIPS.map((tip, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{tx(tip)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      </div>
    </div>
  );
}

function Checklist({ playbook, done, onToggle, onBack }: { playbook: EmergencyPlaybook; done: number[]; onToggle: (i: number) => void; onBack: () => void }) {
  const { lang, tx } = useT();
  const speech = `${pick(playbook.title, lang)}. ${playbook.steps.map((s, i) => `${i + 1}. ${pick(s.text, lang)}`).join(" ")}`;
  return (
    <Section
      title={pick(playbook.title, lang)}
      description={pick(playbook.when, lang)}
      action={
        <div className="flex flex-wrap gap-2">
          <SpeakButton id={`sos-${playbook.id}`} text={speech} size="md" />
          <Button variant="secondary" icon={ChevronLeft} className="rtl:[&>svg]:rotate-180" onClick={onBack}>
            {tx({ en: "Other problems", roman: "Doosre masail", ur: "دوسرے مسائل" })}
          </Button>
        </div>
      }
    >
      <Card glow className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <ProgressBar value={(done.length / playbook.steps.length) * 100} label={tx({ en: "Checklist progress", roman: "Checklist ki progress", ur: "چیک لسٹ کی پیش رفت" })} />
          <span className="shrink-0 text-sm text-muted" dir="ltr">{done.length}/{playbook.steps.length}</span>
        </div>
        <ol className="space-y-2">
          {playbook.steps.map((s, i) => {
            const checked = done.includes(i);
            return (
              <li key={i}>
                <button
                  onClick={() => onToggle(i)}
                  aria-pressed={checked}
                  className={cn("flex w-full items-start gap-3 rounded-xl p-3 text-start transition-colors cursor-pointer", checked ? "bg-success-soft" : "hover:bg-surface-2")}
                >
                  {checked ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <Circle className="mt-0.5 size-5 shrink-0 text-subtle" aria-hidden />}
                  <span className="flex-1">
                    <span className={cn("font-medium", checked && "text-muted line-through decoration-1")}>{pick(s.text, lang)}</span>
                    {s.urgent && !checked && <Badge tone="danger" className="ms-2 align-middle">{tx({ en: "Do now", roman: "Abhi karein", ur: "ابھی کریں" })}</Badge>}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
        {done.length === playbook.steps.length && (
          <Notice tone="success" className="mt-4">
            {tx({
              en: "All steps done. Watch your accounts for a few days and keep your complaint numbers safe.",
              roman: "Saare qadam mukammal. Kuch din account par nazar rakhein aur complaint numbers sambhal kar rakhein.",
              ur: "تمام قدم مکمل۔ کچھ دن اپنے اکاؤنٹ پر نظر رکھیں اور شکایت نمبر سنبھال کر رکھیں۔",
            })}
          </Notice>
        )}
      </Card>
    </Section>
  );
}
