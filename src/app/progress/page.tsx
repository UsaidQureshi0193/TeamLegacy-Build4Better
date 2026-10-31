"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Download, Eye, FileText, GraduationCap, Lightbulb, Map, ShieldAlert, ShieldCheck, Smile, Target, Trash2, TrendingUp, Trophy,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { SKILLS, computeScore, exportProgress, resetProgress, useProgress, type EventKind, type SkillId } from "@/lib/progress";
import { Badge, Button, ButtonLink, Card, EmptyState, PageHeader, ProgressBar, ScoreRing, Section, Stat, cn } from "@/components/ui";

const KIND_META: Record<EventKind, { icon: LucideIcon; label: { en: string; roman: string } }> = {
  "escape-room": { icon: GraduationCap, label: { en: "Scam Escape Room", roman: "Scam Escape Room" } },
  mission: { icon: Target, label: { en: "Practice mission", roman: "Practice mission" } },
  "guide-task": { icon: Map, label: { en: "Guided task", roman: "Guided task" } },
  "scam-check": { icon: ShieldAlert, label: { en: "Message check", roman: "Message check" } },
  vision: { icon: Eye, label: { en: "Screen explained", roman: "Screen samjhi" } },
  document: { icon: FileText, label: { en: "Document read", roman: "Document parha" } },
  "privacy-checkup": { icon: ShieldCheck, label: { en: "Privacy Checkup", roman: "Privacy Checkup" } },
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
      <div className="mt-4 h-56">{empty ? <p className="flex h-full items-center justify-center text-sm text-subtle">{empty}</p> : children}</div>
    </Card>
  );
}

export default function ProgressPage() {
  const { events } = useProgress();
  const { lang, tx } = useT();
  const mounted = useMounted();
  const l = lang === "en" ? "en" : "roman";

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
    return { completed: completed.length, independent, hintsTotal, avgHints, accuracy: dec ? Math.round((cor / dec) * 100) : null, confAvg, confCount: conf.length };
  }, [events]);

  const accuracySeries = useMemo(() => {
    const practice = events.filter((e) => PRACTICE.includes(e.kind) && (e.decisions ?? 0) > 0);
    const totals = { dec: 0, cor: 0 };
    return practice.map((e, i) => {
      totals.dec += e.decisions ?? 0;
      totals.cor += e.correct ?? 0;
      return { n: i + 1, title: e.title, overall: Math.round((totals.cor / totals.dec) * 100) };
    });
  }, [events]);

  const hintSeries = useMemo(
    () => events.filter((e) => DOABLE.includes(e.kind) && e.completed).slice(-20).map((e, i) => ({ n: i + 1, title: `${e.title} · try ${e.attempt}`, hints: e.hints })),
    [events],
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
    if (window.confirm(tx({ en: "Delete all your learning progress on this device? This cannot be undone.", roman: "Is device se saari progress delete kar dein? Yeh wapas nahi hogi." }))) resetProgress();
  };

  const score = breakdown.score;

  return (
    <div className="space-y-8">
      <PageHeader
        icon={TrendingUp}
        title={tx({ en: "Your Progress", roman: "Aap ki Progress", ur: "آپ کی پیش رفت" })}
        subtitle={tx({ en: "Built only from what you actually did. Stored on this device.", roman: "Sirf aap ke asal kaam se bani. Isi device par mehfooz." })}
        actions={
          <>
            <Button variant="secondary" size="sm" icon={Download} onClick={download} disabled={!events.length}>{tx({ en: "Export", roman: "Export" })}</Button>
            <Button variant="ghost" size="sm" icon={Trash2} onClick={reset} disabled={!events.length}>{tx({ en: "Reset", roman: "Reset" })}</Button>
          </>
        }
      />

      <Card glow className="flex flex-col gap-6 p-5 md:flex-row md:items-center">
        <div className="flex flex-col items-center gap-2 md:w-48">
          <ScoreRing value={score} size={132} label={tx({ en: "out of 100", roman: "100 mein se" })} />
          {score === null ? (
            <ButtonLink href="/academy" size="sm" icon={GraduationCap}>{tx({ en: "Start practising", roman: "Mashq shuru karein" })}</ButtonLink>
          ) : (
            <Badge tone={score >= 75 ? "success" : score >= 45 ? "warning" : "info"}>
              {score >= 75 ? tx({ en: "Confident", roman: "Pur-aitmaad" }) : score >= 45 ? tx({ en: "Growing", roman: "Behtar ho rahe" }) : tx({ en: "Getting started", roman: "Aaghaaz" })}
            </Badge>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{tx({ en: "How your score is calculated", roman: "Score kaise banta hai" })}</p>
          <ul className="mt-3 divide-y divide-line">
            {breakdown.parts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{p.label}</span>
                  <span className="block text-xs text-muted">{p.detail}</span>
                </span>
                <span className="text-xs text-subtle">{p.weight}%</span>
                <ProgressBar value={p.value ?? 0} className="w-20" label={p.label} />
                <span className="w-10 text-right font-semibold">{p.value === null ? "—" : `${p.value}%`}</span>
              </li>
            ))}
          </ul>
          {score !== null && (
            <p className="mt-2 text-xs text-subtle">
              = {breakdown.parts.map((p) => `${p.value ?? 0}% × ${p.weight}%`).join(" + ")} = <span className="font-semibold text-fg">{score}</span>
            </p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Trophy} label={tx({ en: "Completed", roman: "Mukammal" })} value={stats.completed} hint={`${stats.independent} ${tx({ en: "without hints", roman: "bina hints" })}`} />
        <Stat icon={Lightbulb} tone="warning" label={tx({ en: "Avg hints", roman: "Ausat hints" })} value={stats.avgHints === null ? "—" : stats.avgHints.toFixed(1)} hint={`${stats.hintsTotal} ${tx({ en: "in total", roman: "kul" })}`} />
        <Stat icon={ShieldAlert} tone="info" label={tx({ en: "Scam accuracy", roman: "Scam accuracy" })} value={stats.accuracy === null ? "—" : `${stats.accuracy}%`} hint={tx({ en: "first try", roman: "pehli koshish" })} />
        <Stat icon={Smile} tone="lavender" label={tx({ en: "Confidence", roman: "Aitmaad" })} value={stats.confAvg === null ? "—" : `${stats.confAvg.toFixed(1)}/5`} hint={stats.confCount ? `${stats.confCount} ${tx({ en: "ratings", roman: "ratings" })}` : undefined} />
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={tx({ en: "Your journey starts with one practice", roman: "Safar ek practice se shuru hota hai" })}
          body={tx({ en: "Try the Scam Escape Room or a guided task.", roman: "Scam Escape Room ya guided task try karein." })}
          action={<ButtonLink href="/academy" icon={GraduationCap}>{tx({ en: "Open the Academy", roman: "Academy kholein" })}</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-2">
            <ChartCard
              title={tx({ en: "Safe decisions", roman: "Mehfooz faislay" })}
              hint={tx({ en: "Your overall first-try accuracy.", roman: "Pehli koshish ki kul durustagi." })}
              empty={accuracySeries.length ? null : tx({ en: "Finish an Academy practice to see this.", roman: "Dekhne ke liye Academy practice karein." })}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accuracySeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="n" {...AXIS} />
                    <YAxis domain={[0, 100]} {...AXIS} unit="%" />
                    <Tooltip content={<ChartTooltip unit="%" />} />
                    <Line type="monotone" dataKey="overall" name={tx({ en: "Accuracy", roman: "Durustagi" })} stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard
              title={tx({ en: "Hints per completion", roman: "Har mukammal par hints" })}
              hint={
                hintTrend
                  ? hintTrend.last <= hintTrend.first
                    ? tx({ en: `Going down: ${hintTrend.first.toFixed(1)} → ${hintTrend.last.toFixed(1)}. Nice!`, roman: `Kam ho rahe: ${hintTrend.first.toFixed(1)} → ${hintTrend.last.toFixed(1)}. Shabash!` })
                    : tx({ en: "Went up recently — new topics take time.", roman: "Haal mein barhe — naye mauzoo waqt lete hain." })
                  : tx({ en: "This should go down as you learn.", roman: "Seekhne ke saath yeh kam hona chahiye." })
              }
              empty={hintSeries.length ? null : tx({ en: "Finish a mission or guided task to see this.", roman: "Dekhne ke liye mission ya guided task karein." })}
            >
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hintSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="n" {...AXIS} />
                    <YAxis allowDecimals={false} {...AXIS} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-2)" }} />
                    <Bar dataKey="hints" name={tx({ en: "Hints", roman: "Hints" })} fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-8 xl:grid-cols-2">
            <Section title={tx({ en: "Skills", roman: "Skills" })} description={tx({ en: `A bar fills after ${SKILL_TARGET} activities.`, roman: `${SKILL_TARGET} activities ke baad bar bharti hai.` })}>
              <Card className="space-y-4 p-5">
                {(Object.keys(SKILLS) as SkillId[]).map((k) => {
                  const n = skillCounts[k] ?? 0;
                  return (
                    <div key={k}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-medium">{SKILLS[k][lang]}</span>
                        <span className="text-xs text-muted">{n}</span>
                      </div>
                      <ProgressBar value={(Math.min(n, SKILL_TARGET) / SKILL_TARGET) * 100} label={SKILLS[k].en} />
                    </div>
                  );
                })}
              </Card>
            </Section>

            <Section title={tx({ en: "Recent activity", roman: "Haaliya activity" })}>
              <Card className="divide-y divide-line">
                {recent.map((e) => {
                  const meta = KIND_META[e.kind];
                  const Icon = meta.icon;
                  const when = new Date(e.ts).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
                  return (
                    <div key={e.id} className="flex items-center gap-3 p-4">
                      <Icon className="size-4.5 shrink-0 text-primary" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted">{meta.label[l]} · {when}</p>
                      </div>
                      {typeof e.score === "number" && typeof e.maxScore === "number" ? (
                        <Badge tone="teal">{e.score}/{e.maxScore}</Badge>
                      ) : e.hints > 0 ? (
                        <Badge tone="warning">{e.hints} hints</Badge>
                      ) : null}
                      {e.completed && e.independent && DOABLE.includes(e.kind) && (
                        <span className={cn("text-xs font-medium text-success")}>{l === "en" ? "No hints" : "Bina hints"}</span>
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
