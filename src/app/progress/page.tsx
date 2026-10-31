"use client";

import { useMemo, useSyncExternalStore } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, BadgeCheck, Download, Eye, FileText, GraduationCap, Lightbulb, Map, ShieldAlert, ShieldCheck, Smile, Target,
  Trash2, TrendingUp, Trophy, type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/i18n";
import { SKILLS, computeScore, exportProgress, resetProgress, useProgress, type ActivityEvent, type EventKind, type SkillId } from "@/lib/progress";
import { Badge, ButtonLink, Button, Card, EmptyState, IconTile, Notice, PageHeader, ProgressBar, ScoreRing, cn } from "@/components/ui";

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

const AXIS = { stroke: "var(--border)", tick: { fill: "var(--text-subtle)", fontSize: 12 } };

function ChartTooltip({ active, payload, label, unit }: { active?: boolean; payload?: { value: number; name: string; color?: string; payload: { title?: string } }[]; label?: string | number; unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-float">
      <p className="font-bold">{payload[0].payload.title ?? `#${label}`}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-muted">
          {p.name}: <span className="font-bold text-fg">{p.value}{unit}</span>
        </p>
      ))}
    </div>
  );
}

function Stat({ icon, label, value, sub, tone = "teal" }: { icon: LucideIcon; label: string; value: string; sub?: string; tone?: "teal" | "success" | "warning" | "info" | "lavender" }) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <IconTile icon={icon} tone={tone} size="sm" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-subtle">{label}</p>
        <p className="font-display text-2xl font-extrabold leading-tight">{value}</p>
        {sub && <p className="truncate text-xs text-muted">{sub}</p>}
      </div>
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
    const completedMissions = events.filter((e) => DOABLE.includes(e.kind) && e.completed);
    const independent = completedMissions.filter((e) => e.independent).length;
    const hintsTotal = events.reduce((s, e) => s + (e.hints || 0), 0);
    const avgHints = completedMissions.length ? completedMissions.reduce((s, e) => s + e.hints, 0) / completedMissions.length : null;
    const practice = events.filter((e) => PRACTICE.includes(e.kind) && (e.decisions ?? 0) > 0);
    const dec = practice.reduce((s, e) => s + (e.decisions ?? 0), 0);
    const cor = practice.reduce((s, e) => s + (e.correct ?? 0), 0);
    const conf = events.filter((e) => typeof e.confidence === "number");
    const confAvg = conf.length ? conf.reduce((s, e) => s + (e.confidence ?? 0), 0) / conf.length : null;
    return { completed: completedMissions.length, independent, hintsTotal, avgHints, accuracy: dec ? Math.round((cor / dec) * 100) : null, confAvg, confCount: conf.length };
  }, [events]);

  const accuracySeries = useMemo(() => {
    const practice = events.filter((e) => PRACTICE.includes(e.kind) && (e.decisions ?? 0) > 0);
    const series: { n: number; title: string; attempt: number; overall: number }[] = [];
    const totals = { dec: 0, cor: 0 };
    for (const [i, e] of practice.entries()) {
      totals.dec += e.decisions ?? 0;
      totals.cor += e.correct ?? 0;
      series.push({ n: i + 1, title: e.title, attempt: Math.round(((e.correct ?? 0) / (e.decisions ?? 1)) * 100), overall: Math.round((totals.cor / totals.dec) * 100) });
    }
    return series;
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

  const recent = useMemo(() => [...events].reverse().slice(0, 10), [events]);

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
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={TrendingUp}
        tone="teal"
        eyebrow="HUMRAAH Progress"
        title={tx({ en: "Your Independence Journey", roman: "Aap ka Independence ka safar", ur: "آپ کا خود مختاری کا سفر" })}
        subtitle={tx({ en: "Every number here comes from what you actually did in HUMRAAH — no guesses.", roman: "Yahan har number aap ke asal kaam se bana hai — koi andaza nahi." })}
        actions={
          <>
            <Button variant="secondary" icon={Download} onClick={download} disabled={!events.length}>{tx({ en: "Export data", roman: "Data export" })}</Button>
            <Button variant="ghost" icon={Trash2} onClick={reset} disabled={!events.length}>{tx({ en: "Reset", roman: "Reset" })}</Button>
          </>
        }
      />

      <Card glow className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,20rem)_1fr]">
          <div className="hero-gradient flex flex-col items-center justify-center gap-3 p-7 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">Digital Independence Score</p>
            <div className="rounded-full bg-white/5 p-2 [&_span]:text-white">
              <ScoreRing value={score} size={150} stroke={13} label={tx({ en: "out of 100", roman: "100 mein se" })} />
            </div>
            {score === null ? (
              <>
                <p className="text-sm text-white/80">{tx({ en: "Complete a practice to start your score.", roman: "Score shuru karne ke liye ek practice mukammal karein." })}</p>
                <ButtonLink href="/academy" icon={GraduationCap} size="md">{tx({ en: "Start practising", roman: "Mashq shuru karein" })}</ButtonLink>
              </>
            ) : (
              <Badge tone={score >= 75 ? "success" : score >= 45 ? "warning" : "info"} className="bg-white/10 text-white">
                {score >= 75 ? tx({ en: "Confident & independent", roman: "Pur-aitmaad aur khud-mukhtar" }) : score >= 45 ? tx({ en: "Growing steadily", roman: "Mustaqil behtari" }) : tx({ en: "Getting started", roman: "Aaghaaz" })}
              </Badge>
            )}
          </div>
          <div className="p-5 sm:p-7">
            <h2 className="font-display text-lg font-bold">{tx({ en: "How this is calculated", roman: "Yeh kaise hisaab hota hai" })}</h2>
            <p className="mt-1 text-sm text-muted">
              {tx({
                en: "Your score is a weighted mix of four measured parts. Parts you haven't tried yet count as 0, so the score only grows from real activity. It's a learning guide, not a formal assessment.",
                roman: "Aap ka score chaar napay gaye hisson ka wazni majmua hai. Jo hissay abhi nahi kiye woh 0 shumar hote hain, is liye score sirf asal kaam se barhta hai. Yeh seekhne ka rehnuma hai, rasmi imtihan nahi.",
              })}
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-subtle">
                    <th className="py-2 pr-3 font-bold">{tx({ en: "Part", roman: "Hissa" })}</th>
                    <th className="py-2 pr-3 font-bold">{tx({ en: "Weight", roman: "Wazan" })}</th>
                    <th className="py-2 pr-3 font-bold">{tx({ en: "Your value", roman: "Aap ki value" })}</th>
                    <th className="py-2 font-bold">{tx({ en: "Based on", roman: "Bunyaad" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.parts.map((p) => (
                    <tr key={p.id} className="border-b border-line last:border-0">
                      <td className="py-3 pr-3 font-semibold">{p.label}</td>
                      <td className="py-3 pr-3 text-muted">{p.weight}%</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="w-10 font-bold">{p.value === null ? "—" : `${p.value}%`}</span>
                          <ProgressBar value={p.value ?? 0} className="w-20" label={p.label} />
                        </div>
                      </td>
                      <td className="py-3 text-muted">{p.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {score !== null && (
              <p className="mt-3 text-xs text-subtle">
                = {breakdown.parts.map((p) => `${p.value ?? 0}% × ${p.weight}%`).join(" + ")} = <span className="font-bold text-fg">{score}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat icon={Trophy} label={tx({ en: "Completed", roman: "Mukammal" })} value={String(stats.completed)} sub={tx({ en: "missions & tasks", roman: "missions aur tasks" })} />
        <Stat icon={BadgeCheck} tone="success" label={tx({ en: "Independent", roman: "Khud se" })} value={String(stats.independent)} sub={tx({ en: "without hints", roman: "bina hints" })} />
        <Stat icon={Lightbulb} tone="warning" label={tx({ en: "Hints used", roman: "Hints" })} value={String(stats.hintsTotal)} sub={tx({ en: "in total", roman: "kul" })} />
        <Stat icon={Activity} tone="info" label={tx({ en: "Avg hints", roman: "Ausat hints" })} value={stats.avgHints === null ? "—" : stats.avgHints.toFixed(1)} sub={tx({ en: "per completion", roman: "har mukammal par" })} />
        <Stat icon={ShieldAlert} tone="teal" label={tx({ en: "Scam accuracy", roman: "Scam accuracy" })} value={stats.accuracy === null ? "—" : `${stats.accuracy}%`} sub={tx({ en: "first-try decisions", roman: "pehli koshish" })} />
        <Stat icon={Smile} tone="lavender" label={tx({ en: "Confidence", roman: "Aitmaad" })} value={stats.confAvg === null ? "—" : `${stats.confAvg.toFixed(1)}/5`} sub={stats.confCount ? `${stats.confCount} ${tx({ en: "ratings", roman: "ratings" })}` : tx({ en: "not rated yet", roman: "abhi rating nahi" })} />
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={tx({ en: "Your journey starts with one practice", roman: "Aap ka safar ek practice se shuru hota hai" })}
          body={tx({ en: "Try the Scam Escape Room or a guided task. Your charts and skills will appear here — stored only on this device.", roman: "Scam Escape Room ya guided task try karein. Aap ke charts aur skills yahan nazar aayenge — sirf is device par mehfooz." })}
          action={<ButtonLink href="/academy" icon={GraduationCap} size="lg">{tx({ en: "Open the Academy", roman: "Academy kholein" })}</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">{tx({ en: "Safe decisions over time", roman: "Waqt ke saath mehfooz faislay" })}</h2>
              <p className="text-sm text-muted">{tx({ en: "First-try accuracy in each practice, and your overall accuracy.", roman: "Har practice mein pehli koshish ki durustagi, aur kul durustagi." })}</p>
              <div className="mt-4 h-64">
                {mounted && accuracySeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={accuracySeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                      <defs>
                        <linearGradient id="acc-fill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#18B9A8" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#18B9A8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="n" {...AXIS} tickLine={false} />
                      <YAxis domain={[0, 100]} {...AXIS} tickLine={false} unit="%" />
                      <Tooltip content={<ChartTooltip unit="%" />} />
                      <Area type="monotone" dataKey="overall" name={tx({ en: "Overall", roman: "Kul" })} stroke="#18B9A8" strokeWidth={2.5} fill="url(#acc-fill)" />
                      <Area type="monotone" dataKey="attempt" name={tx({ en: "This practice", roman: "Yeh practice" })} stroke="#4D9EFF" strokeWidth={1.5} strokeDasharray="4 4" fill="transparent" dot={{ r: 3, fill: "#4D9EFF" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-subtle">{tx({ en: "Complete an Academy practice to see this chart.", roman: "Yeh chart dekhne ke liye Academy practice karein." })}</p>
                )}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="font-display text-lg font-bold">{tx({ en: "Hints per completion", roman: "Har mukammal par hints" })}</h2>
              <p className="text-sm text-muted">{tx({ en: "This should go down as you learn — that's your independence growing.", roman: "Seekhne ke saath yeh kam hona chahiye — yahi aap ki khud-mukhtari hai." })}</p>
              <div className="mt-4 h-64">
                {mounted && hintSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hintSeries} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="n" {...AXIS} tickLine={false} />
                      <YAxis allowDecimals={false} {...AXIS} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--surface-3)" }} />
                      <Bar dataKey="hints" name={tx({ en: "Hints", roman: "Hints" })} fill="#F4B544" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-subtle">{tx({ en: "Finish a mission or guided task to see this chart.", roman: "Yeh chart dekhne ke liye mission ya guided task mukammal karein." })}</p>
                )}
              </div>
              {hintTrend && (
                <p className={cn("mt-2 text-sm font-semibold", hintTrend.last <= hintTrend.first ? "text-success" : "text-warning")}>
                  {hintTrend.last <= hintTrend.first
                    ? tx({ en: `Great — from ${hintTrend.first.toFixed(1)} to ${hintTrend.last.toFixed(1)} hints on average.`, roman: `Zabardast — ausat ${hintTrend.first.toFixed(1)} se ${hintTrend.last.toFixed(1)} hints.` })
                    : tx({ en: "Hints went up recently — that's fine, new topics take time.", roman: "Haal mein hints barhe — koi baat nahi, naye mauzoo waqt lete hain." })}
                </p>
              )}
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 font-display text-lg font-bold">{tx({ en: "Skills", roman: "Skills" })}</h2>
              <ul className="flex flex-col gap-4">
                {(Object.keys(SKILLS) as SkillId[]).map((k) => {
                  const n = skillCounts[k] ?? 0;
                  return (
                    <li key={k}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold">{SKILLS[k][lang]}</span>
                        <span className="text-xs text-muted">{n} {tx({ en: "completed", roman: "mukammal" })}{n >= SKILL_TARGET ? " · ✓" : ""}</span>
                      </div>
                      <ProgressBar value={(Math.min(n, SKILL_TARGET) / SKILL_TARGET) * 100} label={SKILLS[k].en} />
                    </li>
                  );
                })}
              </ul>
              <p className="mt-4 text-xs text-subtle">{tx({ en: `Each bar fills after ${SKILL_TARGET} completed activities in that area.`, roman: `Har bar ${SKILL_TARGET} mukammal activities ke baad bharti hai.` })}</p>
            </Card>

            <Card className="p-5 sm:p-6">
              <h2 className="mb-4 font-display text-lg font-bold">{tx({ en: "Recent activity", roman: "Haaliya activity" })}</h2>
              <ol className="relative flex flex-col gap-4 border-l border-line pl-5">
                {recent.map((e) => (
                  <TimelineItem key={e.id} e={e} l={l} />
                ))}
              </ol>
            </Card>
          </div>
        </>
      )}

      <Notice tone="info" icon={ShieldCheck}>
        {tx({ en: "Stored only on this device. Nothing here is shared with family or anyone else. Use Export to keep a copy, or Reset to clear it.", roman: "Sirf is device par mehfooz. Yeh kisi ghar wale ya kisi aur se share nahi hota. Copy ke liye Export, mitane ke liye Reset." })}
      </Notice>
    </div>
  );
}

function TimelineItem({ e, l }: { e: ActivityEvent; l: "en" | "roman" }) {
  const meta = KIND_META[e.kind];
  const Icon = meta.icon;
  const when = new Date(e.ts).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <li className="relative">
      <span className="absolute -left-[1.95rem] top-0.5 flex size-7 items-center justify-center rounded-full border border-line bg-surface text-primary">
        <Icon className="size-3.5" aria-hidden />
      </span>
      <p className="text-sm font-semibold">{e.title}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        <span>{meta.label[l]}</span>
        <span aria-hidden>·</span>
        <span>{when}</span>
        {e.attempt > 1 && <Badge tone="neutral">{l === "en" ? `Attempt ${e.attempt}` : `Koshish ${e.attempt}`}</Badge>}
        {typeof e.score === "number" && typeof e.maxScore === "number" && <Badge tone="teal">{e.score}/{e.maxScore}</Badge>}
        {e.completed && e.independent && DOABLE.includes(e.kind) && <Badge tone="success">{l === "en" ? "No hints" : "Bina hints"}</Badge>}
        {e.hints > 0 && <Badge tone="warning">{e.hints} {l === "en" ? "hints" : "hints"}</Badge>}
      </p>
    </li>
  );
}
