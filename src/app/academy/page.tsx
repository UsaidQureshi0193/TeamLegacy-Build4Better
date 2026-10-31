"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, BadgeCheck, Battery, CheckCircle2, ChevronLeft, DoorOpen, Eye, FlaskConical, Globe, GraduationCap, KeyRound,
  Lightbulb, Lock, MessageSquare, Phone, Receipt, RotateCcw, Search, ShieldAlert, ShieldCheck, Signal, Sparkles, Trophy, TrendingUp, Video, Wifi, X,
} from "lucide-react";
import { Badge, Button, ButtonLink, Card, IconTile, Notice, PageHeader, ProgressBar, SpeakButton, cn } from "@/components/ui";
import { ESCAPE_ROOMS, TASK_MISSIONS, pick, type EscapeRoom, type TaskMission, type TaskStep } from "@/data/scenarios";
import { takeHandoff } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { recordEvent, useProgress, type SkillId } from "@/lib/progress";

const SKILL_MAP: Record<string, SkillId> = { "bill-payment": "bill-payment", "safe-browsing": "safe-browsing", privacy: "privacy" };

function SimLabel({ className }: { className?: string }) {
  const { tx } = useT();
  return (
    <Badge tone="warning" icon={FlaskConical} className={className}>
      {tx({ en: "Simulation · fictional data", roman: "Simulation · farzi data" })}
    </Badge>
  );
}

// ── Simulated phone ─────────────────────────────────────────
function PhoneFrame({ room, children }: { room: EscapeRoom; children: React.ReactNode }) {
  const wa = room.channel === "whatsapp";
  return (
    <div className="mx-auto w-full max-w-[22rem]">
      <div className="rounded-[2.6rem] bg-[#0a0f18] p-2.5 shadow-float ring-1 ring-white/10">
        <div className="overflow-hidden rounded-[2.1rem] bg-white text-[#111]">
          <div className={cn("flex items-center justify-between px-6 pb-1 pt-3 text-[11px] font-semibold", wa ? "bg-[#075E54] text-white" : "bg-[#f7f7f7]")}>
            <span>{room.time}</span>
            <span className="flex items-center gap-1" aria-hidden>
              <Signal className="size-3" /> <Wifi className="size-3" /> <Battery className="size-3.5" />
            </span>
          </div>
          {wa ? (
            <div className="flex items-center gap-3 bg-[#075E54] px-3 pb-3 pt-1 text-white">
              <ChevronLeft className="size-5" aria-hidden />
              <span className="flex size-9 items-center justify-center rounded-full bg-[#cfd8dc] text-sm font-bold text-[#455a64]">?</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{room.sender}</p>
                <p className="text-[11px] text-white/75">online</p>
              </div>
              <Video className="size-5" aria-hidden />
              <Phone className="size-4.5" aria-hidden />
            </div>
          ) : (
            <div className="flex flex-col items-center border-b border-black/5 bg-[#f7f7f7] pb-3 pt-1">
              <span className="flex size-11 items-center justify-center rounded-full bg-gradient-to-b from-[#a6abb5] to-[#858a94] text-lg font-semibold text-white">
                {/^\+|\d/.test(room.sender) ? <MessageSquare className="size-5" aria-hidden /> : room.sender[0]}
              </span>
              <p className="mt-1 text-[13px] font-semibold">{room.sender}</p>
              <p className="text-[10.5px] text-[#8e8e93]">Text Message · Today {room.time}</p>
            </div>
          )}
          <div className={cn("min-h-[19rem] px-3 py-4", wa ? "bg-[#ece5dd]" : "bg-white")}>{children}</div>
          <div className={cn("flex items-center gap-2 border-t border-black/5 px-3 py-2.5", wa ? "bg-[#f0f0f0]" : "bg-[#f7f7f7]")}>
            <div className="h-8 flex-1 rounded-full border border-black/10 bg-white px-3 text-[12px] leading-8 text-[#8e8e93]">Message</div>
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-wider text-subtle">Simulated phone · not a real message</p>
    </div>
  );
}

// ── Escape Room player ──────────────────────────────────────
function RoomPlayer({ room, onExit, onNext }: { room: EscapeRoom; onExit: () => void; onNext: (() => void) | null }) {
  const { tx, lang } = useT();
  const clues = room.segments.filter((s) => s.clue).map((s) => s.clue!);
  const [found, setFound] = useState<string[]>([]);
  const [lastFound, setLastFound] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [missMsg, setMissMsg] = useState(false);
  const [hints, setHints] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [phase, setPhase] = useState<"clues" | "decide" | "result">("clues");
  const [wrong, setWrong] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState(true);
  const [chosen, setChosen] = useState<string | null>(null);
  const recorded = useRef(false);

  const allFound = found.length === clues.length;
  const cluesFound = found.length;
  const score = Math.max(0, cluesFound * 10 + (firstTry ? 40 : 20) - hints * 5);
  const maxScore = clues.length * 10 + 40;

  const tapClue = (id: string) => {
    if (phase !== "clues") return;
    setMissMsg(false);
    if (!found.includes(id)) {
      setFound((f) => [...f, id]);
      setLastFound(id);
    }
  };
  const tapMiss = () => {
    if (phase !== "clues") return;
    setMisses((m) => m + 1);
    setMissMsg(true);
  };
  const showHint = () => {
    if (!hintShown) setHints((h) => h + 1);
    setHintShown(true);
  };
  const revealAll = () => {
    const remaining = clues.filter((c) => !found.includes(c.id));
    setHints((h) => h + remaining.length);
    setFound(clues.map((c) => c.id));
    setLastFound(null);
  };

  const choose = (id: string, correct: boolean) => {
    setChosen(id);
    if (correct) {
      setPhase("result");
      if (!recorded.current) {
        recorded.current = true;
        const ft = firstTry && wrong.length === 0;
        const finalScore = Math.max(0, cluesFound * 10 + (ft ? 40 : 20) - hints * 5);
        recordEvent({
          kind: "escape-room",
          skill: "scam-detection",
          title: room.title.en,
          decisions: 1,
          correct: ft ? 1 : 0,
          hints,
          completed: true,
          independent: hints === 0 && ft,
          score: finalScore,
          maxScore,
          meta: { room: room.id, misses },
        });
      }
    } else {
      if (!wrong.includes(id)) setWrong((w) => [...w, id]);
      setFirstTry(false);
    }
  };

  const last = clues.find((c) => c.id === lastFound);
  const genuine = Boolean(room.genuine);

  return (
    <div className="animate-fade-up">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" icon={ArrowLeft} onClick={onExit}>{tx({ en: "Escape Room hub", roman: "Escape Room hub" })}</Button>
        <SimLabel />
      </div>
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Scam Escape Room</p>
        <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{pick(room.title, lang)}</h1>
      </div>

      <div className="mb-6 flex flex-wrap gap-2" aria-label="Room stages">
        {[
          { id: "clues", label: tx({ en: "1 · Find the clues", roman: "1 · Nishaniyan dhoondein" }) },
          { id: "decide", label: tx({ en: "2 · Decide", roman: "2 · Faisla" }) },
          { id: "result", label: tx({ en: "3 · Escape", roman: "3 · Nikal jayein" }) },
        ].map((s, i) => {
          const idx = ["clues", "decide", "result"].indexOf(phase);
          return (
            <span key={s.id} className={cn("rounded-full px-3 py-1.5 text-xs font-bold", i < idx ? "bg-success-soft text-success" : i === idx ? "bg-primary-soft text-primary ring-1 ring-primary/40" : "bg-surface-3 text-subtle")}>
              {s.label}
            </span>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <PhoneFrame room={room}>
          <div className={cn("max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[14.5px] leading-relaxed shadow-sm", room.channel === "whatsapp" ? "rounded-tl-sm bg-white" : "rounded-bl-sm bg-[#e9e9eb]")}>
            {room.segments.map((s, i) => {
              if (!s.clue) {
                return (
                  <span key={i} onClick={tapMiss} className={cn(phase === "clues" && "cursor-pointer")}>
                    {s.text}
                  </span>
                );
              }
              const isFound = found.includes(s.clue.id);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => tapClue(s.clue!.id)}
                  disabled={phase !== "clues"}
                  className={cn(
                    "inline rounded px-0.5 text-left transition-colors",
                    phase === "clues" && "cursor-pointer",
                    isFound && (genuine ? "bg-[#c8f0dc] text-[#0b5e38] underline decoration-[#16A36A] decoration-2 underline-offset-2" : "bg-[#ffd9dc] text-[#9b1c26] underline decoration-[#c52f3a] decoration-wavy decoration-2 underline-offset-2"),
                  )}
                  aria-label={isFound ? `${s.text} — ${pick(s.clue.label, lang)}` : s.text}
                >
                  {s.text}
                </button>
              );
            })}
            <span className="mt-1 block text-right text-[10px] text-[#8e8e93]">{room.time}</span>
          </div>
        </PhoneFrame>

        <div className="flex flex-col gap-4">
          {phase === "clues" && (
            <Card glow className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <IconTile icon={genuine ? BadgeCheck : Search} tone={genuine ? "success" : "danger"} />
                <div>
                  <p className="font-display text-lg font-bold">
                    {genuine
                      ? tx({ en: "Find the signs this message could be REAL", roman: "Woh nishaniyan dhoondein jo is message ko ASLI dikhati hain" })
                      : tx({ en: "Tap the suspicious parts of the message", roman: "Message ke mashkook hisson par tap karein" })}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {genuine
                      ? tx({ en: "Not every message is a scam. Tap the parts that show this alert behaves like a genuine one.", roman: "Har message dhoka nahi hota. Woh hissay dabayein jo asli alert jaise hain." })
                      : tx({ en: "This is Scam DNA practice — find every clue hidden in the text.", roman: "Yeh Scam DNA ki mashq hai — text mein chhupi har nishani dhoondein." })}
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold">
                  <span>{tx({ en: `${cluesFound} of ${clues.length} clues found`, roman: `${clues.length} mein se ${cluesFound} nishaniyan mili` })}</span>
                  <span className="text-subtle">{tx({ en: `Hints: ${hints}`, roman: `Ishare: ${hints}` })}</span>
                </div>
                <ProgressBar value={(cluesFound / clues.length) * 100} label="Clues found" />
              </div>

              {last && (
                <div className={cn("mt-4 rounded-2xl border p-4 animate-fade-up", genuine ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft")} role="status">
                  <p className={cn("flex items-center gap-2 font-bold", genuine ? "text-success" : "text-danger")}>
                    {genuine ? <ShieldCheck className="size-4.5" aria-hidden /> : <ShieldAlert className="size-4.5" aria-hidden />} {pick(last.label, lang)}
                  </p>
                  <p className="mt-1 text-sm text-fg">{pick(last.explain, lang)}</p>
                </div>
              )}
              {missMsg && !allFound && (
                <p className="mt-3 text-sm text-muted" role="status">
                  {genuine
                    ? tx({ en: "That part is ordinary detail. Look for what the message tells you to do.", roman: "Yeh aam tafseel hai. Dekhein message aap ko kya karne ko kehta hai." })
                    : tx({ en: "That part looks normal. Look for requests, pressure, links or strange numbers.", roman: "Yeh hissa aam lagta hai. Darkhwast, dabao, links ya ajeeb numbers dhoondein." })}
                </p>
              )}
              {hintShown && (
                <div className="mt-3 flex gap-2 rounded-2xl border border-warning/30 bg-warning-soft p-3 text-sm">
                  <Lightbulb className="mt-0.5 size-4.5 shrink-0 text-warning" aria-hidden /> {pick(room.hint, lang)}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {allFound ? (
                  <Button size="lg" icon={ArrowRight} onClick={() => setPhase("decide")}>{tx({ en: "All found — now decide", roman: "Sab mil gayi — ab faisla" })}</Button>
                ) : (
                  <>
                    <Button variant="secondary" icon={Lightbulb} onClick={showHint} disabled={hintShown}>{tx({ en: "Hint", roman: "Ishara" })}</Button>
                    <Button variant="ghost" icon={Eye} onClick={revealAll}>{tx({ en: "Reveal remaining", roman: "Baqi dikhayein" })}</Button>
                  </>
                )}
              </div>

              {found.length > 0 && (
                <ul className="mt-5 space-y-2 border-t border-line pt-4">
                  {clues.filter((c) => found.includes(c.id)).map((c) => (
                    <li key={c.id} className="flex gap-2 text-sm">
                      <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", genuine ? "text-success" : "text-danger")} aria-hidden />
                      <span><strong>{pick(c.label, lang)}</strong> <span className="text-muted">— {pick(c.explain, lang)}</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {phase === "decide" && (
            <Card glow className="p-5 sm:p-6 animate-fade-up">
              <div className="flex items-start justify-between gap-3">
                <p className="font-display text-xl font-bold">{pick(room.question, lang)}</p>
                <SpeakButton id={`q-${room.id}`} text={`${pick(room.question, lang)} ${room.choices.map((c) => pick(c.text, lang)).join(". ")}`} />
              </div>
              <div className="mt-4 grid gap-3">
                {room.choices.map((c) => {
                  const isWrong = wrong.includes(c.id);
                  return (
                    <div key={c.id}>
                      <button
                        onClick={() => choose(c.id, c.correct)}
                        disabled={isWrong}
                        className={cn(
                          "flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left text-base font-semibold transition-all cursor-pointer",
                          isWrong ? "border-danger/40 bg-danger-soft text-muted" : "border-line bg-surface-2 hover:border-primary hover:bg-primary-soft",
                        )}
                      >
                        {isWrong ? <X className="size-5 shrink-0 text-danger" aria-hidden /> : <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden />}
                        {pick(c.text, lang)}
                      </button>
                      {isWrong && <p className="mt-1.5 px-2 text-sm text-danger" role="status">{pick(c.feedback, lang)}</p>}
                    </div>
                  );
                })}
              </div>
              {wrong.length > 0 && <p className="mt-3 text-sm text-muted">{tx({ en: "That's okay — mistakes here are safe. Try another option.", roman: "Koi baat nahi — yahan ghalti mehfooz hai. Koi aur option chunein." })}</p>}
            </Card>
          )}

          {phase === "result" && (
            <Card glow className="overflow-hidden animate-fade-up">
              <div className="hero-gradient p-6 text-white">
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15"><DoorOpen className="size-6" aria-hidden /></span>
                  <div>
                    <p className="text-sm font-semibold text-white/75">{tx({ en: "You escaped!", roman: "Aap nikal gaye!" })}</p>
                    <p className="font-display text-3xl font-extrabold">{score} <span className="text-lg text-white/70">/ {maxScore}</span></p>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                {chosen && (
                  <Notice tone="success" title={firstTry ? tx({ en: "Right on the first try", roman: "Pehli koshish mein sahi" }) : tx({ en: "You got there", roman: "Aap pohanch gaye" })}>
                    {pick(room.choices.find((c) => c.id === chosen)!.feedback, lang)}
                  </Notice>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: tx({ en: "Clues", roman: "Nishaniyan" }), v: `${cluesFound}/${clues.length}` },
                    { l: tx({ en: "Hints", roman: "Ishare" }), v: hints },
                    { l: tx({ en: "First try", roman: "Pehli dafa" }), v: firstTry ? "✓" : "—" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-2xl border border-line bg-surface-2 p-3">
                      <p className="font-display text-xl font-extrabold">{s.v}</p>
                      <p className="text-xs font-semibold text-subtle">{s.l}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-subtle">
                  {tx({ en: "Score = 10 per clue + 40 for a first-try safe decision (20 after a retry) − 5 per hint.", roman: "Score = har nishani 10 + pehli koshish mein sahi faisla 40 (dobara 20) − har ishara 5." })}
                </p>
                <div className="mt-4 rounded-2xl bg-primary-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">{tx({ en: "Remember", roman: "Yaad rakhein" })}</p>
                  <p className="mt-1 font-semibold">{pick(room.takeaway, lang)}</p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {onNext && <Button icon={ArrowRight} onClick={onNext}>{tx({ en: "Next room", roman: "Agla kamra" })}</Button>}
                  <ButtonLink href="/progress" variant="secondary" icon={TrendingUp}>{tx({ en: "See your Independence Score update", roman: "Apna Independence Score dekhein" })}</ButtonLink>
                  <Button variant="ghost" icon={ArrowLeft} onClick={onExit}>{tx({ en: "Back", roman: "Wapas" })}</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mission visuals (fictional) ─────────────────────────────
function MissionVisual({ kind }: { kind: TaskStep["visual"] }) {
  if (!kind) return null;
  if (kind === "bill")
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#e5e1d6] bg-[#fffdf7] text-[#111] shadow-soft">
        <div className="flex items-center justify-between bg-[#16324f] px-4 py-2.5 text-white">
          <span className="text-sm font-bold tracking-wide">ROSHNI POWER CO.</span>
          <span className="rounded bg-white/15 px-2 py-0.5 text-[10px] font-bold">SAMPLE</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 p-4 text-[13px]">
          <dt className="text-[#555]">Reference No.</dt><dd className="font-mono font-bold">0412 3456 7890 12</dd>
          <dt className="text-[#555]">Meter No.</dt><dd className="font-mono">88213</dd>
          <dt className="text-[#555]">Units consumed</dt><dd>245 kWh</dd>
          <dt className="text-[#555]">Due date</dt><dd className="font-semibold">18 Oct 2026</dd>
        </dl>
        <div className="mx-4 mb-4 rounded-xl bg-[#e8f6f3] p-3 text-[13px]">
          <p className="font-bold text-[#0b4a47]">Payable within due date: Rs 4,860</p>
          <p className="text-[#9a3b00]">After due date: Rs 5,346</p>
        </div>
      </div>
    );
  if (kind === "urls")
    return (
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-soft">
        <div className="flex items-center gap-1.5 border-b border-line px-3 py-2" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-muted">
            <Lock className="size-4 text-success" aria-hidden />
            <span className="truncate">which address is the real Sitara Bank?</span>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-subtle"><Globe className="size-3.5" aria-hidden /> Tip: read the address from the right, up to the first single “/”.</p>
        </div>
      </div>
    );
  if (kind === "permission")
    return (
      <div className="mx-auto w-full max-w-xs rounded-[1.75rem] bg-[#2b2f36] p-5 text-white shadow-float">
        <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-[#8ab4f8]/20 text-[#8ab4f8]">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <p className="text-center text-[15px] leading-snug">Allow <strong>Super Torch</strong> to access your contacts?</p>
        <div className="mt-5 space-y-2 text-center text-[14px] font-semibold text-[#8ab4f8]">
          <p className="rounded-full bg-white/5 py-2.5">Allow</p>
          <p className="rounded-full bg-white/5 py-2.5">Don&apos;t allow</p>
        </div>
        <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-white/50">Simulated permission dialog</p>
      </div>
    );
  return (
    <div className="mx-auto w-full max-w-xs overflow-hidden rounded-[1.75rem] border border-line bg-white text-[#111] shadow-float">
      <div className="bg-[#0b8577] px-5 py-3 text-white">
        <p className="text-sm font-bold">Sitara Bank</p>
        <p className="text-[11px] text-white/75">Practice app · fictional</p>
      </div>
      <div className="p-5">
        <p className="text-[13px] text-[#555]">Bill payment · Rs 4,860 · Roshni Power</p>
        <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold"><KeyRound className="size-4" aria-hidden /> Enter OTP sent to your phone</p>
        <div className="mt-2 flex gap-1.5" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => <span key={i} className="h-10 flex-1 rounded-lg border-2 border-[#d0d7d6] bg-[#f6faf9]" />)}
        </div>
        <p className="mt-4 rounded-lg bg-[#0b8577] py-2.5 text-center text-sm font-bold text-white">Confirm payment</p>
      </div>
    </div>
  );
}

// ── Mission player ──────────────────────────────────────────
function MissionPlayer({ mission, onExit }: { mission: TaskMission; onExit: () => void }) {
  const { tx, lang } = useT();
  const [idx, setIdx] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [solved, setSolved] = useState<string | null>(null);
  const [firstCorrect, setFirstCorrect] = useState(0);
  const [hints, setHints] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [finished, setFinished] = useState<{ score: number; max: number; correct: number } | null>(null);

  const step = mission.steps[idx];
  const total = mission.steps.length;

  const choose = (id: string, correct: boolean) => {
    if (solved) return;
    if (correct) {
      setSolved(id);
      if (wrong.length === 0) setFirstCorrect((n) => n + 1);
    } else if (!wrong.includes(id)) setWrong((w) => [...w, id]);
  };

  const next = () => {
    if (idx < total - 1) {
      setIdx(idx + 1);
      setWrong([]);
      setSolved(null);
      setHintShown(false);
      return;
    }
    const max = total * 20;
    // firstCorrect already includes the current step if applicable.
    const score = Math.max(0, firstCorrect * 20 + (total - firstCorrect) * 10 - hints * 5);
    recordEvent({
      kind: "mission",
      skill: SKILL_MAP[mission.skill] ?? "digital-tasks",
      title: mission.title.en,
      decisions: total,
      correct: firstCorrect,
      hints,
      completed: true,
      independent: hints === 0 && firstCorrect === total,
      score,
      maxScore: max,
      meta: { mission: mission.id },
    });
    setFinished({ score, max, correct: firstCorrect });
  };

  if (finished)
    return (
      <Card glow className="mx-auto max-w-2xl overflow-hidden animate-fade-up">
        <div className="hero-gradient p-6 text-center text-white">
          <Trophy className="mx-auto size-10 animate-float" aria-hidden />
          <p className="mt-2 font-display text-2xl font-extrabold">{tx({ en: "Mission complete!", roman: "Mission mukammal!" })}</p>
          <p className="mt-1 text-white/80">{pick(mission.title, lang)}</p>
          <p className="mt-3 font-display text-4xl font-extrabold">{finished.score}<span className="text-xl text-white/70"> / {finished.max}</span></p>
        </div>
        <div className="p-6">
          <p className="text-sm text-muted">{tx({ en: `${finished.correct} of ${total} answers right on the first try · ${hints} hints used.`, roman: `${total} mein se ${finished.correct} jawab pehli dafa sahi · ${hints} ishare.` })}</p>
          <p className="mt-1 text-xs text-subtle">{tx({ en: "Score = 20 per first-try answer, 10 after a retry, −5 per hint.", roman: "Score = pehli dafa sahi 20, dobara 10, har ishara −5." })}</p>
          <div className="mt-4 rounded-2xl bg-primary-soft p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">{tx({ en: "Remember", roman: "Yaad rakhein" })}</p>
            <p className="mt-1 font-semibold">{pick(mission.takeaway, lang)}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href="/progress" icon={TrendingUp}>{tx({ en: "See your Independence Score update", roman: "Apna Independence Score dekhein" })}</ButtonLink>
            <Button variant="secondary" icon={ArrowLeft} onClick={onExit}>{tx({ en: "Back to Academy", roman: "Academy wapas" })}</Button>
          </div>
        </div>
      </Card>
    );

  return (
    <div className="mx-auto max-w-4xl animate-fade-up">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" icon={ArrowLeft} onClick={onExit}>{tx({ en: "Academy", roman: "Academy" })}</Button>
        <SimLabel />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{tx({ en: "Practice mission", roman: "Mashq mission" })}</p>
      <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{pick(mission.title, lang)}</h1>
      <p className="mt-1 text-muted">{pick(mission.intro, lang)}</p>

      <Card glow className="mt-5 p-5 sm:p-7">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold">
          <span>{tx({ en: `Question ${idx + 1} of ${total}`, roman: `Sawal ${idx + 1} / ${total}` })}</span>
          <span className="text-subtle">{tx({ en: `Hints: ${hints}`, roman: `Ishare: ${hints}` })}</span>
        </div>
        <ProgressBar value={((idx + (solved ? 1 : 0)) / total) * 100} label="Mission progress" />

        {step.visual && <div className="mt-6"><MissionVisual kind={step.visual} /></div>}

        <div className="mt-6 flex items-start justify-between gap-3">
          <p className="font-display text-xl font-bold leading-snug">{pick(step.prompt, lang)}</p>
          <SpeakButton id={`m-${mission.id}-${idx}`} text={pick(step.prompt, lang)} />
        </div>

        <div className="mt-4 grid gap-3">
          {step.choices.map((c) => {
            const isWrong = wrong.includes(c.id);
            const isRight = solved === c.id;
            return (
              <div key={c.id}>
                <button
                  onClick={() => choose(c.id, c.correct)}
                  disabled={isWrong || Boolean(solved)}
                  className={cn(
                    "flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-5 py-3.5 text-left text-base font-semibold transition-all cursor-pointer disabled:cursor-default",
                    isRight ? "border-success bg-success-soft" : isWrong ? "border-danger/40 bg-danger-soft text-muted" : "border-line bg-surface-2 hover:border-primary hover:bg-primary-soft",
                    solved && !isRight && !isWrong && "opacity-60",
                  )}
                >
                  {isRight ? <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden /> : isWrong ? <X className="size-5 shrink-0 text-danger" aria-hidden /> : <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden />}
                  <span className="break-all sm:break-normal">{pick(c.text, lang)}</span>
                </button>
                {(isWrong || isRight) && <p className={cn("mt-1.5 px-2 text-sm", isRight ? "text-success" : "text-danger")} role="status">{pick(c.feedback, lang)}</p>}
              </div>
            );
          })}
        </div>

        {hintShown && !solved && (
          <div className="mt-4 flex gap-2 rounded-2xl border border-warning/30 bg-warning-soft p-3 text-sm">
            <Lightbulb className="mt-0.5 size-4.5 shrink-0 text-warning" aria-hidden /> {pick(step.hint, lang)}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-line pt-5">
          <Button
            variant="secondary"
            icon={Lightbulb}
            disabled={hintShown || Boolean(solved)}
            onClick={() => {
              setHints((h) => h + 1);
              setHintShown(true);
            }}
          >
            {tx({ en: "Hint", roman: "Ishara" })}
          </Button>
          {solved && (
            <Button size="lg" icon={idx < total - 1 ? ArrowRight : CheckCircle2} onClick={next}>
              {idx < total - 1 ? tx({ en: "Next question", roman: "Agla sawal" }) : tx({ en: "Finish mission", roman: "Mission mukammal" })}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Hub ─────────────────────────────────────────────────────
const MISSION_ICONS = { "bill-portal": Receipt, "spot-real-site": Globe, "permission-check": ShieldCheck } as const;

export default function AcademyPage() {
  const { tx, lang } = useT();
  const { events } = useProgress();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);

  useEffect(() => {
    const h = takeHandoff("academy");
    if (h && ESCAPE_ROOMS.some((r) => r.id === h)) {
      queueMicrotask(() => setRoomId(h));
    }
  }, []);

  const roomStats = (id: string) => {
    const evs = events.filter((e) => e.kind === "escape-room" && e.meta?.room === id);
    return { done: evs.length > 0, best: evs.reduce((m, e) => Math.max(m, e.score ?? 0), 0), max: evs[0]?.maxScore ?? 0 };
  };
  const missionStats = (id: string) => {
    const evs = events.filter((e) => e.kind === "mission" && e.meta?.mission === id);
    return { done: evs.length > 0, best: evs.reduce((m, e) => Math.max(m, e.score ?? 0), 0), max: evs[0]?.maxScore ?? 0 };
  };

  const openRoom = (id: string) => {
    setMissionId(null);
    setRoomId(id);
    setRunKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const exit = () => {
    setRoomId(null);
    setMissionId(null);
  };

  const room = ESCAPE_ROOMS.find((r) => r.id === roomId);
  if (room) {
    const i = ESCAPE_ROOMS.indexOf(room);
    const nextRoom = ESCAPE_ROOMS[i + 1];
    return <RoomPlayer key={`${room.id}-${runKey}`} room={room} onExit={exit} onNext={nextRoom ? () => openRoom(nextRoom.id) : null} />;
  }
  const mission = TASK_MISSIONS.find((m) => m.id === missionId);
  if (mission) return <MissionPlayer key={`${mission.id}-${runKey}`} mission={mission} onExit={exit} />;

  const roomsDone = ESCAPE_ROOMS.filter((r) => roomStats(r.id).done).length;

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        tone="lavender"
        eyebrow="HUMRAAH Academy"
        title={tx({ en: "Practise safely — mistakes here cost nothing", roman: "Mehfooz mashq — yahan ghalti ka koi nuqsan nahi" })}
        subtitle={tx({
          en: "Interactive simulations with fictional banks, people and money. Learn to spot tricks and complete tasks before you face them for real.",
          roman: "Farzi bank, log aur paison ke saath interactive mashq. Asal zindagi se pehle dhoke pehchanna aur kaam karna seekhein.",
        })}
        actions={<SimLabel />}
      />

      <Card glow className="mb-8 overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
          <div className="hero-gradient relative p-6 text-white sm:p-8">
            <div className="grid-dots absolute inset-0 opacity-30" aria-hidden />
            <div className="relative">
              <Badge tone="warning" icon={DoorOpen} className="bg-white/15 text-white">Scam Escape Room</Badge>
              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">{tx({ en: "Can you escape all 5 rooms?", roman: "Kya aap 5 kamron se nikal sakte hain?" })}</h2>
              <p className="mt-2 max-w-md text-white/80">
                {tx({
                  en: "Each room is a message on a simulated phone. Find the hidden clues, then choose the safe action to escape. One room is a genuine alert — can you tell?",
                  roman: "Har kamra simulated phone par ek message hai. Chhupi nishaniyan dhoondein, phir mehfooz qadam chun kar niklein. Ek kamra asli alert hai — kya aap pehchan sakte hain?",
                })}
              </p>
              <div className="mt-5 max-w-xs">
                <div className="mb-1.5 flex justify-between text-sm font-semibold text-white/85">
                  <span>{tx({ en: "Rooms escaped", roman: "Kamre paar" })}</span>
                  <span>{roomsDone} / {ESCAPE_ROOMS.length}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-gradient-to-r from-amber to-[#ffd98a] transition-[width] duration-700" style={{ width: `${(roomsDone / ESCAPE_ROOMS.length) * 100}%` }} />
                </div>
              </div>
              <Button size="lg" className="mt-6 bg-white !text-navy shadow-none hover:brightness-95 [background-image:none]" icon={DoorOpen} onClick={() => openRoom((ESCAPE_ROOMS.find((r) => !roomStats(r.id).done) ?? ESCAPE_ROOMS[0]).id)}>
                {roomsDone ? tx({ en: "Continue", roman: "Jaari rakhein" }) : tx({ en: "Enter the first room", roman: "Pehle kamre mein jayein" })}
              </Button>
            </div>
          </div>
          <ol className="divide-y divide-line">
            {ESCAPE_ROOMS.map((r, i) => {
              const s = roomStats(r.id);
              return (
                <li key={r.id}>
                  <button onClick={() => openRoom(r.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2 cursor-pointer">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl font-display font-extrabold", s.done ? "bg-success-soft text-success" : "bg-surface-3 text-muted")}>
                      {s.done ? <CheckCircle2 className="size-5" aria-hidden /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{pick(r.title, lang)}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-subtle">
                        {r.channel === "whatsapp" ? "WhatsApp" : "SMS"} · {r.segments.filter((x) => x.clue).length} {tx({ en: "clues", roman: "nishaniyan" })}
                      </span>
                    </span>
                    {s.done ? (
                      <Badge tone="success">{tx({ en: "Best", roman: "Behtareen" })} {s.best}/{s.max}</Badge>
                    ) : (
                      <ArrowRight className="size-4.5 text-subtle" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </Card>

      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold">{tx({ en: "Digital task missions", roman: "Digital kaam ke missions" })}</h2>
        <SimLabel />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {TASK_MISSIONS.map((m) => {
          const s = missionStats(m.id);
          const Icon = MISSION_ICONS[m.id as keyof typeof MISSION_ICONS] ?? Sparkles;
          return (
            <button
              key={m.id}
              onClick={() => {
                setRoomId(null);
                setMissionId(m.id);
                setRunKey((k) => k + 1);
              }}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-float cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <IconTile icon={Icon} tone="lavender" size="lg" />
                {s.done ? <Badge tone="success" icon={CheckCircle2}>{s.best}/{s.max}</Badge> : <Badge tone="neutral">{m.steps.length} {tx({ en: "questions", roman: "sawal" })}</Badge>}
              </div>
              <p className="mt-4 font-display text-lg font-bold leading-snug">{pick(m.title, lang)}</p>
              <p className="mt-1.5 flex-1 text-sm text-muted">{pick(m.intro, lang)}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary">
                {s.done ? <><RotateCcw className="size-4" aria-hidden /> {tx({ en: "Practise again", roman: "Dobara mashq" })}</> : <>{tx({ en: "Start mission", roman: "Mission shuru" })} <ArrowRight className="size-4" aria-hidden /></>}
              </span>
            </button>
          );
        })}
      </div>

      <Notice tone="info" className="mt-8" title={tx({ en: "Everything here is pretend", roman: "Yahan sab kuch farzi hai" })}>
        {tx({
          en: "Banks, names, numbers, links and amounts are invented for training. Nothing connects to real money or accounts. Your results are saved on this device and feed your Digital Independence Score.",
          roman: "Bank, naam, number, links aur raqam training ke liye farzi hain. Kuch bhi asli paison ya accounts se nahi juda. Aap ke nataij isi device par mehfooz hote hain aur Digital Independence Score mein shamil hote hain.",
        })}
      </Notice>
    </div>
  );
}
