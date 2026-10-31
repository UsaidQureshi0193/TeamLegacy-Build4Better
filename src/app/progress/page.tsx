"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Download, Eye, FileText, GraduationCap, Lightbulb, Map, ShieldAlert, ShieldCheck, Smile, Target, Trash2, TrendingUp, Trophy,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { SKILLS, computeScore, exportProgress, resetProgress, useProgress, type EventKind, type SkillId } from "@/lib/progress";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, ProgressBar, ScoreRing, Section, Stat } from "@/components/ui";

type Tri = { en: string; roman: string; ur: string };

const KIND_META: Record<EventKind, { icon: LucideIcon; label: Tri }> = {
  "escape-room": { icon: GraduationCap, label: { en: "Scam Escape Room", roman: "Scam Escape Room", ur: "اسکیم ایسکیپ روم" } },
  mission: { icon: Target, label: { en: "Practice mission", roman: "Practice mission", ur: "مشقی مشن" } },
  "guide-task": { icon: Map, label: { en: "Guided task", roman: "Guided task", ur: "رہنمائی والا کام" } },
  "scam-check": { icon: ShieldAlert, label: { en: "Message check", roman: "Message check", ur: "پیغام کی جانچ" } },
  vision: { icon: Eye, label: { en: "Screen explained", roman: "Screen samjhi", ur: "اسکرین سمجھی" } },
  document: { icon: FileText, label: { en: "Document read", roman: "Document parha", ur: "دستاویز پڑھی" } },
  "privacy-checkup": { icon: ShieldCheck, label: { en: "Privacy Checkup", roman: "Privacy Checkup", ur: "پرائیویسی چیک اپ" } },
};

/** Score part names, translated by id (computeScore() returns English labels). */
const PART_LABELS: Record<string, Tri> = {
  accuracy: { en: "Safe decisions in practice", roman: "Mashq mein mehfooz faislay", ur: "مشق میں محفوظ فیصلے" },
  independence: { en: "Independent completions", roman: "Bina madad mukammal", ur: "بغیر مدد مکمل" },
  breadth: { en: "Skills practised", roman: "Mashq ki gayi maharatein", ur: "مشق کی گئی مہارتیں" },
  habits: { en: "Safety habits (Privacy Checkup)", roman: "Hifazati aadatein (Privacy Checkup)", ur: "حفاظتی عادتیں (پرائیویسی چیک اپ)" },
};

const PRACTICE: EventKind[] = ["escape-room", "mission"];
const DOABLE: EventKind[] = ["escape-room", "mission", "guide-task"];
const SKILL_TARGET = 5;

const noop = () => () => {};
function useMounted() {
  return useSyncExternalStore(noop, () => true, () => false);
}

const AXIS = { stroke: "var(--border)", tick: { fill: "var(--text-subtle)", fontSize: 12 }, tickLine: false };

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number; name: string; payload: { title?: string } }[]; label?: string | number; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-elevated px-3 py-2 text-xs shadow-float">
      <p className="font-semibold">{payload[0].payload.title ?? `#${label}`}</p>
      <p className="text-muted">
        {payload[0].name}: <span className="font-semibold text-fg">{payload[0].value}{unit}</span>
      </p>
    </div>
  );
}

function ChartCard({ title, hint, empty, children }: { title: string; hint: string; empty: string | null; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted">{hint}</p>
      {/* Charts stay left-to-right so axes read correctly in Urdu mode too. */}
      <div dir="ltr" className="mt-4 h-56">
        {empty ? <p dir="auto" className="flex h-full items-center justify-center text-sm text-subtle">{empty}</p> : children}
      </div>
    </Card>
  );
}

export default function ProgressPage() {
  const { events } = useProgress();
  const { lang, tx } = useT();
  const mounted = useMounted();

  const breakdown = useMemo(() => computeScore(events), [events]);

  const stats = useMemo(() => {
    const completed = events.filter((e) => DOABLE.includes(e.kind) && e.completed);
    const independent = completed.filter((e) => e.independent).length;
    const hintsTotal = events.reduce((s, e) => s + (e.hints || 0), 0);
    const avgHints = completed.length ? completed.reduce((s, e) => s + e.hints, 0) / completed.length : null;
    const practice = events.filter((e) => PRACTICE.includes(e.kind) && (e.decisions ?? 0) > 0);
    const dec = practice.reduce((s, e) => s + (e.decisions ?? 0), 0);
    const cor = practice.reduce((s, e) => s + (e.correct ?? 0), 0);
    const conf = events.filter((e) => typeof e.confidence === "number");
    const confAvg = conf.length ? conf.reduce((s, e) => s + (e.confidence ?? 0), 0) / conf.length : null;
    const skills = new Set(events.filter((e) => e.completed).map((e) => e.skill)).size;
    const checkups = events.filter((e) => e.kind === "privacy-checkup" && e.maxScore);
    const lastCheckup = checkups[checkups.length - 1];
    return {
      completed: completed.length,
      independent,
      hintsTotal,
      avgHints,
      dec,
      cor,
      accuracy: dec ? Math.round((cor / dec) * 100) : null,
      confAvg,
      confCount: conf.length,
      skills,
      lastCheckup,
    };
  }, [events]);

  const skillTotal = Object.keys(SKILLS).length;

  /** Detail line for each score part, built from the numbers in the current language. */
  const partDetail = (id: string): string => {
    switch (id) {
      case "accuracy":
        return tx({
          en: `${stats.cor} of ${stats.dec} decisions right on the first try`,
          roman: `${stats.dec} mein se ${stats.cor} faislay pehli koshish mein sahi`,
          ur: `${stats.dec} میں سے ${stats.cor} فیصلے پہلی کوشش میں درست`,
        });
      case "independence":
        return tx({
          en: `${stats.independent} of ${stats.completed} completed without hints`,
          roman: `${stats.completed} mein se ${stats.independent} bina hints mukammal`,
          ur: `${stats.completed} میں سے ${stats.independent} بغیر اشارے کے مکمل`,
        });
      case "breadth":
        return tx({
          en: `${stats.skills} of ${skillTotal} skill areas`,
          roman: `${skillTotal} mein se ${stats.skills} maharatein`,
          ur: `${skillTotal} میں سے ${stats.skills} مہارتیں`,
        });
      case "habits":
        return stats.lastCheckup
          ? tx({
              en: `Latest checkup: ${stats.lastCheckup.score}/${stats.lastCheckup.maxScore}`,
              roman: `Aakhri checkup: ${stats.lastCheckup.score}/${stats.lastCheckup.maxScore}`,
              ur: `آخری چیک اپ: ${stats.lastCheckup.score}/${stats.lastCheckup.maxScore}`,
            })
          : tx({ en: "Not taken yet", roman: "Abhi tak nahi kiya", ur: "ابھی تک نہیں کیا" });
      default:
        return "";
    }
  };

  const accuracySeries = useMemo(() => {
    const practice = events.filter((e) => PRACTICE.includes(e.kind) && (e.decisions ?? 0) > 0);
    const totals = { dec: 0, cor: 0 };
    return practice.map((e, i) => {
      totals.dec += e.decisions ?? 0;
      totals.cor += e.correct ?? 0;
      return { n: i + 1, title: e.title, overall: Math.round((totals.cor / totals.dec) * 100) };
    });
  }, [events]);

  const tryWord = tx({ en: "try", roman: "koshish", ur: "کوشش" });
  const hintSeries = useMemo(
    () => events.filter((e) => DOABLE.includes(e.kind) && e.completed).slice(-20).map((e, i) => ({ n: i + 1, title: `${e.title} · ${tryWord} ${e.attempt}`, hints: e.hints })),
    [events, tryWord],
  );

  const skillCounts = useMemo(() => {
    const c = Object.fromEntries(Object.keys(SKILLS).map((k) => [k, 0])) as Record<SkillId, number>;
    for (const e of events) if (e.completed) c[e.skill] = (c[e.skill] ?? 0) + 1;
    return c;
  }, [events]);

  const recent = useMemo(() => [...events].reverse().slice(0, 8), [events]);

  const hintTrend = useMemo(() => {
    if (hintSeries.length < 4) return null;
    const half = Math.floor(hintSeries.length / 2);
    const avg = (arr: { hints: number }[]) => arr.reduce((s, x) => s + x.hints, 0) / arr.length;
    return { first: avg(hintSeries.slice(0, half)), last: avg(hintSeries.slice(half)) };
  }, [hintSeries]);

  const download = () => {
    const blob = new Blob([exportProgress()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `humraah-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    const ok = window.confirm(
      tx({
        en: "Delete all your learning progress on this device? This cannot be undone.",
        roman: "Is device se saari progress delete kar dein? Yeh wapas nahi hogi.",
        ur: "کیا اس آلے سے آپ کی تمام پیش رفت مٹا دیں؟ یہ واپس نہیں ہو سکے گی۔",
      }),
    );
    if (ok) resetProgress();
  };

  const score = breakdown.score;
  const hintsWord = tx({ en: "hints", roman: "hints", ur: "اشارے" });

  return (
    <div className="space-y-8">
      <PageHeader
        icon={TrendingUp}
        title={tx({ en: "Your Progress", roman: "Aap ki Progress", ur: "آپ کی پیش رفت" })}
        subtitle={tx({ en: "Built only from what you actually did. Stored on this device.", roman: "Sirf aap ke asal kaam se bani. Isi device par mehfooz.", ur: "صرف آپ کے اصل کام سے بنی۔ اسی آلے پر محفوظ۔" })}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={download} disabled={!events.length}>
              {tx({ en: "Export", roman: "Export", ur: "ڈاؤن لوڈ" })}
            </Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={reset} disabled={!events.length}>
              {tx({ en: "Reset", roman: "Reset", ur: "صاف کریں" })}
            </Button>
          </>
        }
      />

      <Card glow className="flex flex-col gap-6 p-5 md:flex-row md:items-center">
        <div className="flex flex-col items-center gap-2 md:w-48">
          <ScoreRing value={score} size={132} label={tx({ en: "out of 100", roman: "100 mein se", ur: "100 میں سے" })} />
          {score === null ? (
            <ButtonLink href="/academy" size="sm" icon={GraduationCap}>{tx({ en: "Start practising", roman: "Mashq shuru karein", ur: "مشق شروع کریں" })}</ButtonLink>
          ) : (
            <Badge tone={score >= 75 ? "success" : score >= 45 ? "warning" : "info"}>
              {score >= 75
                ? tx({ en: "Confident", roman: "Pur-aitmaad", ur: "پُراعتماد" })
                : score >= 45
                  ? tx({ en: "Growing", roman: "Behtar ho rahe", ur: "بہتر ہو رہے ہیں" })
                  : tx({ en: "Getting started", roman: "Aaghaaz", ur: "آغاز" })}
            </Badge>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{tx({ en: "How your score is calculated", roman: "Score kaise banta hai", ur: "اسکور کیسے بنتا ہے" })}</p>
          <ul className="mt-3 divide-y divide-line">
            {breakdown.parts.map((p) => {
              const label = PART_LABELS[p.id] ? tx(PART_LABELS[p.id]) : p.label;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium">{label}</span>
                    <span className="block text-xs text-muted">{partDetail(p.id) || p.detail}</span>
                  </span>
                  <span className="text-xs text-subtle" dir="ltr">{p.weight}%</span>
                  <ProgressBar value={p.value ?? 0} className="w-20" label={label} />
                  <span className="w-10 text-end font-semibold" dir="ltr">{p.value === null ? "—" : `${p.value}%`}</span>
                </li>
              );
            })}
          </ul>
          {score !== null && (
            <p className="mt-2 text-xs text-subtle" dir="ltr">
              = {breakdown.parts.map((p) => `${p.value ?? 0}% × ${p.weight}%`).join(" + ")} = <span className="font-semibold text-fg">{score}</span>
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Trophy}
          label={tx({ en: "Completed", roman: "Mukammal", ur: "مکمل" })}
          value={stats.completed}
          hint={`${stats.independent} ${tx({ en: "without hints", roman: "bina hints", ur: "بغیر اشارے" })}`}
        />
        <Stat
          icon={Lightbulb}
          tone="warning"
          label={tx({ en: "Avg hints", roman: "Ausat hints", ur: "اوسط اشارے" })}
          value={stats.avgHints === null ? "—" : stats.avgHints.toFixed(1)}
          hint={`${stats.hintsTotal} ${tx({ en: "in total", roman: "kul", ur: "کل" })}`}
        />
        <Stat
          icon={ShieldAlert}
          tone="info"
          label={tx({ en: "Scam accuracy", roman: "Scam accuracy", ur: "دھوکہ پہچاننے کی درستگی" })}
          value={stats.accuracy === null ? "—" : `${stats.accuracy}%`}
          hint={tx({ en: "first try", roman: "pehli koshish", ur: "پہلی کوشش" })}
        />
        <Stat
          icon={Smile}
          tone="lavender"
          label={tx({ en: "Confidence", roman: "Aitmaad", ur: "اعتماد" })}
          value={stats.confAvg === null ? "—" : `${stats.confAvg.toFixed(1)}/5`}
          hint={stats.confCount ? `${stats.confCount} ${tx({ en: "ratings", roman: "ratings", ur: "درجہ بندیاں" })}` : undefined}
        />
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={tx({ en: "Your journey starts with one practice", roman: "Safar ek practice se shuru hota hai", ur: "سفر ایک مشق سے شروع ہوتا ہے" })}
          body={tx({ en: "Try the Scam Escape Room or a guided task.", roman: "Scam Escape Room ya guided task try karein.", ur: "اسکیم ایسکیپ روم یا رہنمائی والا کوئی کام آزمائیں۔" })}
          action={<ButtonLink href="/academy" icon={GraduationCap}>{tx({ en: "Open the Academy", roman: "Academy kholein", ur: "اکیڈمی کھولیں" })}</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={tx({ en: "Safe decisions", roman: "Mehfooz faislay", ur: "محفوظ فیصلے" })}
              hint={tx({ en: "Your overall first-try accuracy.", roman: "Pehli koshish ki kul durustagi.", ur: "پہلی کوشش میں آپ کی کل درستگی۔" })}
              empty={accuracySeries.length ? null : tx({ en: "Finish an Academy practice to see this.", roman: "Dekhne ke liye Academy practice karein.", ur: "یہ دیکھنے کے لیے اکیڈمی کی کوئی مشق مکمل کریں۔" })}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracySeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="n" {...AXIS} />
                    <YAxis domain={[0, 100]} {...AXIS} unit="%" />
                    <Tooltip content={<ChartTooltip unit="%" />} />
                    <Line type="monotone" dataKey="overall" name={tx({ en: "Accuracy", roman: "Durustagi", ur: "درستگی" })} stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title={tx({ en: "Hints per completion", roman: "Har mukammal par hints", ur: "ہر مکمل کام پر اشارے" })}
              hint={
                hintTrend
                  ? hintTrend.last <= hintTrend.first
                    ? tx({
                        en: `Going down: ${hintTrend.first.toFixed(1)} → ${hintTrend.last.toFixed(1)}. Nice!`,
                        roman: `Kam ho rahe: ${hintTrend.first.toFixed(1)} → ${hintTrend.last.toFixed(1)}. Shabash!`,
                        ur: `کم ہو رہے ہیں: ${hintTrend.first.toFixed(1)} سے ${hintTrend.last.toFixed(1)}۔ شاباش!`,
                      })
                    : tx({ en: "Went up recently — new topics take time.", roman: "Haal mein barhe — naye mauzoo waqt lete hain.", ur: "حال میں بڑھے — نئے موضوعات وقت لیتے ہیں۔" })
                  : tx({ en: "This should go down as you learn.", roman: "Seekhne ke saath yeh kam hona chahiye.", ur: "سیکھنے کے ساتھ یہ کم ہونا چاہیے۔" })
              }
              empty={hintSeries.length ? null : tx({ en: "Finish a mission or guided task to see this.", roman: "Dekhne ke liye mission ya guided task karein.", ur: "یہ دیکھنے کے لیے کوئی مشن یا رہنمائی والا کام مکمل کریں۔" })}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hintSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="n" {...AXIS} />
                    <YAxis allowDecimals={false} {...AXIS} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                    <Bar dataKey="hints" name={tx({ en: "Hints", roman: "Hints", ur: "اشارے" })} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            <Section
              title={tx({ en: "Skills", roman: "Maharatein", ur: "مہارتیں" })}
              description={tx({
                en: `A bar fills after ${SKILL_TARGET} activities.`,
                roman: `${SKILL_TARGET} activities ke baad bar bharti hai.`,
                ur: `${SKILL_TARGET} سرگرمیوں کے بعد پٹی بھر جاتی ہے۔`,
              })}
            >
              <Card className="space-y-4 p-5">
                {(Object.keys(SKILLS) as SkillId[]).map((k) => {
                  const n = skillCounts[k] ?? 0;
                  return (
                    <div key={k}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{SKILLS[k][lang]}</span>
                        <span className="text-xs text-muted">{n}</span>
                      </div>
                      <ProgressBar value={(Math.min(n, SKILL_TARGET) / SKILL_TARGET) * 100} label={SKILLS[k][lang]} />
                    </div>
                  );
                })}
              </Card>
            </Section>

            <Section title={tx({ en: "Recent activity", roman: "Haaliya activity", ur: "حالیہ سرگرمی" })}>
              <Card className="divide-y divide-line">
                {recent.map((e) => {
                  const meta = KIND_META[e.kind];
                  const Icon = meta.icon;
                  const when = new Date(e.ts).toLocaleString(lang === "ur" ? "ur-PK" : undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={e.id} className="flex items-center gap-3 p-4">
                      <Icon className="size-4.5 shrink-0 text-primary" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted">{tx(meta.label)} · {when}</p>
                      </div>
                      {typeof e.score === "number" && typeof e.maxScore === "number" ? (
                        <Badge tone="teal"><span dir="ltr">{e.score}/{e.maxScore}</span></Badge>
                      ) : e.hints > 0 ? (
                        <Badge tone="warning">{e.hints} {hintsWord}</Badge>
                      ) : null}
                      {e.completed && e.independent && DOABLE.includes(e.kind) && (
                        <span className="text-xs font-medium text-success">{tx({ en: "No hints", roman: "Bina hints", ur: "بغیر اشارے" })}</span>
                      )}
                    </div>
                  );
                })}
              </Card>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
