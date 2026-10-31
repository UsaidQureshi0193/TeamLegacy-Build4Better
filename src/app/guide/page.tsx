"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock, FileText, GraduationCap, HelpCircle, Landmark, Lightbulb,
  LifeBuoy, Mail, Map, PartyPopper, Repeat, ShieldCheck, Sparkles, Target, TrendingUp, Video, Wand2, X, Zap, type LucideIcon,
} from "lucide-react";
import { VoiceMic } from "@/components/media";
import { Badge, Button, ButtonLink, Card, IconTile, Input, ModeBadge, Notice, PageHeader, ProgressBar, Spinner, Textarea, cn } from "@/components/ui";
import { postJSON, takeHandoff } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { priorAttempts, recordEvent } from "@/lib/progress";
import { useSpeaker } from "@/lib/speech";
import type { GuideTask, RescueResult } from "@/lib/types";

interface LibraryCard {
  id: string;
  icon: "zap" | "video" | "mail" | "file" | "landmark" | "calendar";
  category: string;
  title: { en: string; roman: string };
  blurb: { en: string; roman: string };
  minutes: number;
  steps: number;
}

const ICONS: Record<LibraryCard["icon"], LucideIcon> = { zap: Zap, video: Video, mail: Mail, file: FileText, landmark: Landmark, calendar: CalendarDays };
const TONES = ["teal", "info", "lavender", "warning", "success", "danger"] as const;

interface Session {
  task: GuideTask;
  step: number;
  hints: number;
  stuck: number;
  attempt: number;
  /** Practice mode: which steps the learner has already predicted correctly. */
  revealed: number[];
}

const SESSION_KEY = "humraah.guide.session";

function saveSession(s: Session | null) {
  try {
    if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable */
  }
}

function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildChoices(task: GuideTask, idx: number): string[] {
  const correct = task.steps[idx].instruction;
  const others = shuffle(task.steps.filter((_, i) => i !== idx).map((s) => s.instruction)).slice(0, 2);
  return shuffle([correct, ...others]);
}

function level(attempt: number) {
  if (attempt <= 1) return 1;
  if (attempt === 2) return 2;
  return 3;
}

export default function GuidePage() {
  const { lang, tx, t } = useT();
  const { prefs } = usePrefs();
  const { speak, stop, speakingId } = useSpeaker();

  const [library, setLibrary] = useState<LibraryCard[] | null>(null);
  const [libError, setLibError] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [session, setSession] = useState<Session | null>(null);
  const [simpler, setSimpler] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const [rescueOpen, setRescueOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [rescue, setRescue] = useState<RescueResult | null>(null);
  const [rescueLoading, setRescueLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [done, setDone] = useState<{ task: GuideTask; hints: number; stuck: number; attempt: number; confidence: number } | null>(null);
  const handoffDone = useRef(false);

  const update = useCallback((s: Session | null) => {
    setSession(s);
    saveSession(s);
  }, []);

  const resetStepUi = useCallback((task: GuideTask | null, idx: number) => {
    setSimpler(false);
    setHintOpen(false);
    setWrongPicks([]);
    setRescue(null);
    setRescueOpen(false);
    setProblem("");
    setChoices(task ? buildChoices(task, idx) : []);
  }, []);

  const start = useCallback(
    async (body: { task_id?: string; goal?: string }) => {
      setLoading(true);
      setError(null);
      setDone(null);
      try {
        const task = await postJSON<GuideTask>("/api/tasks", { ...body, language: lang });
        const attempt = priorAttempts("guide-task", task.title) + 1;
        resetStepUi(task, 0);
        update({ task, step: 0, hints: 0, stuck: 0, attempt, revealed: [] });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start this guide.");
      } finally {
        setLoading(false);
      }
    },
    [lang, resetStepUi, update],
  );

  // Library + restore session + handoff from other modules.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/tasks");
        if (!res.ok) throw new Error();
        const data = (await res.json()) as LibraryCard[];
        if (alive) setLibrary(data);
      } catch {
        if (alive) setLibError("The task library could not load. You can still type your own goal below.");
      }
      if (!alive || handoffDone.current) return;
      handoffDone.current = true;
      const handoff = takeHandoff("guide");
      if (handoff) {
        const isId = /^[a-z0-9-]+$/.test(handoff) && handoff.length < 40;
        start(isId ? { task_id: handoff, goal: handoff } : { goal: handoff });
        return;
      }
      const saved = loadSession();
      if (saved?.task?.steps?.length) {
        setSession(saved);
        setChoices(buildChoices(saved.task, saved.step));
      }
    })();
    return () => {
      alive = false;
    };
  }, [start]);

  const task = session?.task ?? null;
  const step = task && session ? task.steps[session.step] : null;
  const lvl = level(session?.attempt ?? 1);
  const mustPredict = Boolean(session && lvl === 3 && !session.revealed.includes(session.step));
  const stepText = step ? (simpler ? step.simpler : step.instruction) : "";

  // Auto read-aloud (Patient Voice) when enabled.
  useEffect(() => {
    if (prefs.autoSpeak && step && !mustPredict) speak(simpler ? step.simpler : step.instruction, "guide-step");
  }, [prefs.autoSpeak, step, simpler, mustPredict, speak]);

  const goTo = (idx: number) => {
    if (!session || !task) return;
    stop();
    resetStepUi(task, idx);
    update({ ...session, step: idx });
  };

  const takeHint = () => {
    if (!session) return;
    if (!hintOpen) update({ ...session, hints: session.hints + 1 });
    setHintOpen(true);
  };

  const dontUnderstand = () => {
    if (!session || !step) return;
    if (!simpler) update({ ...session, hints: session.hints + 1 });
    setSimpler(true);
    speak(step.simpler, "guide-step", 0.85);
  };

  const pickChoice = (c: string) => {
    if (!session || !step) return;
    if (c === step.instruction) {
      update({ ...session, revealed: [...session.revealed, session.step] });
      setWrongPicks([]);
    } else if (!wrongPicks.includes(c)) {
      setWrongPicks((w) => [...w, c]);
      update({ ...session, hints: session.hints + 1 });
    }
  };

  const askRescue = async () => {
    if (!session || !task || !step) return;
    setRescueLoading(true);
    try {
      const r = await postJSON<RescueResult>("/api/tasks/rescue", { task: task.title, step: step.instruction, problem, language: lang });
      setRescue(r);
      update({ ...session, stuck: session.stuck + 1 });
    } catch (e) {
      setRescue({ mode: "demo", message: e instanceof Error ? e.message : "Could not load help.", recovery_steps: [] });
    } finally {
      setRescueLoading(false);
    }
  };

  const finish = (confidence: number) => {
    if (!session || !task) return;
    recordEvent({
      kind: "guide-task",
      skill: task.category === "Bills" ? "bill-payment" : "digital-tasks",
      title: task.title,
      hints: session.hints,
      completed: true,
      independent: session.hints === 0 && session.stuck === 0,
      confidence,
      attempt: session.attempt,
    });
    setDone({ task, hints: session.hints, stuck: session.stuck, attempt: session.attempt, confidence });
    setFinishing(false);
    update(null);
    stop();
  };

  const exit = () => {
    stop();
    update(null);
    setFinishing(false);
  };

  const levelInfo = {
    1: { name: tx({ en: "Level 1 · Full guidance", roman: "Level 1 · Poori rehnumai" }), body: tx({ en: "First time: hints are shown under every step.", roman: "Pehli dafa: har step ke neeche ishara dikhaya jata hai." }) },
    2: { name: tx({ en: "Level 2 · Hints on request", roman: "Level 2 · Ishara maangne par" }), body: tx({ en: "You've done this before, so hints stay hidden until you ask.", roman: "Aap yeh pehle kar chuke hain, is liye ishara sirf maangne par milega." }) },
    3: { name: tx({ en: "Level 3 · Practice mode", roman: "Level 3 · Mashq mode" }), body: tx({ en: "You choose the next step yourself. Wrong guesses count as a hint — that's okay!", roman: "Agla step aap khud chunte hain. Ghalat andaza ishara ginna jata hai — koi baat nahi!" }) },
  }[lvl];

  // ── Completion screen ───────────────────────────────────
  if (done) {
    const independent = done.hints === 0 && done.stuck === 0;
    return (
      <div className="mx-auto max-w-3xl animate-fade-up">
        <Card glow className="overflow-hidden">
          <div className="hero-gradient px-6 py-10 text-center text-white sm:px-10">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-3xl bg-white/15 animate-float">
              <PartyPopper className="size-8" aria-hidden />
            </div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">{tx({ en: "Well done — you did it yourself!", roman: "Shabaash — aap ne khud kar dikhaya!" })}</h1>
            <p className="mt-2 text-white/80">{done.task.title}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-4">
            {[
              { label: tx({ en: "Steps", roman: "Steps" }), value: done.task.steps.length },
              { label: tx({ en: "Hints used", roman: "Ishare" }), value: done.hints },
              { label: tx({ en: "Times stuck", roman: "Atke" }), value: done.stuck },
              { label: tx({ en: "Attempt", roman: "Koshish" }), value: `#${done.attempt}` },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-line bg-surface-2 p-4 text-center">
                <p className="font-display text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs font-semibold text-subtle">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="px-6 pb-6">
            <Notice tone={independent ? "success" : "info"} title={independent ? tx({ en: "Independent completion!", roman: "Khud-mukhtar takmeel!" }) : tx({ en: "Next time, try with fewer hints", roman: "Agli dafa kam isharon ke saath koshish karein" })}>
              {independent
                ? tx({ en: "You needed no help at all. This counts towards your Digital Independence Score.", roman: "Aap ko koi madad nahi chahiye thi. Yeh aap ke Digital Independence Score mein shamil hai." })
                : tx({ en: "HUMRAAH will give a little less help on your next attempt — that's how confidence grows.", roman: "Agli koshish par HUMRAAH thori kam madad dega — isi tarah aitemaad barhta hai." })}
            </Notice>
            <div className="mt-5 flex flex-wrap gap-2">
              <ButtonLink href="/progress" icon={TrendingUp}>{tx({ en: "See your Independence Score update", roman: "Apna Independence Score dekhein" })}</ButtonLink>
              <ButtonLink href="/academy" variant="secondary" icon={GraduationCap}>{tx({ en: "Practise in the Academy", roman: "Academy mein mashq" })}</ButtonLink>
              <Button variant="ghost" icon={Map} onClick={() => setDone(null)}>{tx({ en: "Choose another task", roman: "Koi aur kaam chunein" })}</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ── Task runner (No Confusion Mode) ─────────────────────
  if (session && task && step) {
    const n = task.steps.length;
    const isLast = session.step === n - 1;
    const showHint = lvl === 1 || hintOpen;
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 animate-fade-up">
          <Button variant="ghost" icon={ArrowLeft} onClick={exit}>{tx({ en: "All tasks", roman: "Tamam kaam" })}</Button>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{task.source === "library" ? tx({ en: "Reviewed guide", roman: "Jaancha hua guide" }) : task.source === "ai" ? tx({ en: "AI-generated plan", roman: "AI ka banaya plan" }) : tx({ en: "General safe plan", roman: "Aam mehfooz plan" })}</Badge>
            <ModeBadge mode={task.mode} />
          </div>
        </div>

        <div className="mb-4 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{task.category} · No Confusion Mode</p>
          <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{task.title}</h1>
        </div>

        {task.notice && <Notice tone="warning" className="mb-4">{task.notice}</Notice>}

        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
          <IconTile icon={lvl === 3 ? Target : lvl === 2 ? Lightbulb : Sparkles} tone={lvl === 3 ? "lavender" : lvl === 2 ? "info" : "teal"} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">{levelInfo.name}</p>
            <p className="text-xs text-muted">{levelInfo.body}</p>
          </div>
          <Badge tone="neutral">{tx({ en: `Attempt #${session.attempt}`, roman: `Koshish #${session.attempt}` })}</Badge>
        </div>

        <Card glow className="p-5 sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-muted">
              {tx({ en: `Step ${session.step + 1} of ${n}`, roman: `Step ${session.step + 1} / ${n}` })}
            </p>
            <p className="text-xs font-semibold text-subtle">{tx({ en: `Hints used: ${session.hints}`, roman: `Ishare: ${session.hints}` })}</p>
          </div>
          <ProgressBar value={((session.step + (mustPredict ? 0 : 1)) / n) * 100} label="Task progress" />

          {mustPredict ? (
            <div className="mt-8 animate-fade-up">
              <p className="flex items-center gap-2 font-display text-xl font-bold sm:text-2xl">
                <HelpCircle className="size-6 text-lavender" aria-hidden />
                {tx({ en: "What do you think comes next?", roman: "Aap ke khayal mein agla qadam kya hai?" })}
              </p>
              <div className="mt-5 grid gap-3">
                {choices.map((c) => {
                  const wrong = wrongPicks.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => pickChoice(c)}
                      disabled={wrong}
                      className={cn(
                        "flex min-h-16 items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left text-base font-semibold transition-all cursor-pointer",
                        wrong ? "border-danger/40 bg-danger-soft text-muted line-through" : "border-line bg-surface-2 hover:border-primary hover:bg-primary-soft",
                      )}
                    >
                      {wrong ? <X className="size-5 shrink-0 text-danger" aria-hidden /> : <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden />}
                      {c}
                    </button>
                  );
                })}
              </div>
              {wrongPicks.length > 0 && (
                <p className="mt-3 text-sm text-muted" role="status">{tx({ en: "Not quite — that's a different step. Try again.", roman: "Bilkul nahi — yeh koi aur step hai. Dobara koshish karein." })}</p>
              )}
            </div>
          ) : (
            <div className="mt-8 animate-fade-up" key={`${session.step}-${simpler}`}>
              {simpler && <Badge tone="info" className="mb-3">{tx({ en: "Simpler words", roman: "Aasaan alfaaz" })}</Badge>}
              <p className="font-display text-2xl font-extrabold leading-snug sm:text-[2rem]">{stepText}</p>
              <div className="mt-5 rounded-2xl bg-surface-2 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-subtle">{tx({ en: "Why it matters", roman: "Yeh kyun zaroori hai" })}</p>
                <p className="mt-1 text-base text-muted">{step.why}</p>
              </div>
              {showHint && (
                <div className="mt-3 flex gap-3 rounded-2xl border border-warning/30 bg-warning-soft p-4 animate-fade-up">
                  <Lightbulb className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
                  <p className="text-base text-fg">{step.hint}</p>
                </div>
              )}
            </div>
          )}

          {!mustPredict && (
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Button variant="secondary" icon={Repeat} onClick={() => (speakingId === "guide-step" ? stop() : speak(stepText, "guide-step"))}>
                {speakingId === "guide-step" ? t("common.stop") : t("common.repeat")}
              </Button>
              <Button variant="secondary" icon={Lightbulb} onClick={takeHint} disabled={showHint}>{t("common.hint")}</Button>
              <Button variant="secondary" icon={HelpCircle} onClick={dontUnderstand} disabled={simpler}>{t("common.dontUnderstand")}</Button>
              <Button variant="secondary" icon={LifeBuoy} onClick={() => setRescueOpen((o) => !o)} className="text-danger">{t("common.stuck")}</Button>
            </div>
          )}

          {rescueOpen && (
            <div className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft/60 p-4 animate-fade-up">
              <p className="flex items-center gap-2 font-bold"><LifeBuoy className="size-5 text-danger" aria-hidden /> Rescue Mode</p>
              <p className="mt-1 text-sm text-muted">{tx({ en: "Tell me what you see or what went wrong (optional). Don't type any codes or passwords.", roman: "Batayein aap ko kya nazar aa raha hai ya kya ghalat hua (zaroori nahi). Koi code ya password na likhein." })}</p>
              <Textarea rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} className="mt-3" placeholder={tx({ en: "e.g. The button isn't there / it says error", roman: "Maslan: button nazar nahi aa raha / error aa raha hai" })} />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button icon={Wand2} loading={rescueLoading} onClick={askRescue}>{tx({ en: "Help me get unstuck", roman: "Mujhe nikalne mein madad karein" })}</Button>
                <ButtonLink href="/vision" variant="ghost" icon={Sparkles}>{tx({ en: "Explain a screenshot instead", roman: "Screenshot samjhayein" })}</ButtonLink>
              </div>
              {rescue && (
                <div className="mt-4 rounded-2xl bg-surface p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="font-semibold">{rescue.message}</p>
                    <ModeBadge mode={rescue.mode} />
                  </div>
                  <ol className="list-decimal space-y-1.5 pl-5 text-sm text-muted">
                    {rescue.recovery_steps.map((r) => <li key={r}>{r}</li>)}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="ghost" size="lg" icon={ArrowLeft} disabled={session.step === 0} onClick={() => goTo(session.step - 1)}>{t("common.previous")}</Button>
            {!mustPredict &&
              (isLast ? (
                <Button size="lg" icon={CheckCircle2} onClick={() => setFinishing(true)}>{tx({ en: "I did it — finish", roman: "Ho gaya — mukammal" })}</Button>
              ) : (
                <Button size="lg" icon={Check} onClick={() => goTo(session.step + 1)}>{tx({ en: "I did it — next", roman: "Ho gaya — agla" })}</Button>
              ))}
          </div>

          {finishing && (
            <div className="mt-5 rounded-2xl border border-primary/30 bg-primary-soft p-5 animate-fade-up">
              <p className="font-display text-lg font-bold">{tx({ en: "How confident do you feel doing this on your own now?", roman: "Ab yeh khud karne mein aap kitna pur-aitemaad hain?" })}</p>
              <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label="Confidence from 1 to 5">
                {[1, 2, 3, 4, 5].map((c) => (
                  <button key={c} onClick={() => finish(c)} className="flex h-14 flex-col items-center justify-center rounded-2xl border border-line bg-surface font-display text-xl font-extrabold hover:border-primary hover:bg-surface-2 cursor-pointer">
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-xs text-subtle">
                <span>{tx({ en: "Not yet", roman: "Abhi nahi" })}</span>
                <span>{tx({ en: "Very confident", roman: "Bohat zyada" })}</span>
              </div>
            </div>
          )}
        </Card>

        <Card className="mt-4 p-5">
          <p className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="size-5 text-success" aria-hidden /> {tx({ en: "Stay safe", roman: "Mehfooz rahein" })}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-muted">
            {task.safety_notes.map((s) => (
              <li key={s} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{s}</li>
            ))}
            <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{tx({ en: "You do every step yourself. HUMRAAH never needs your passwords, PINs or codes.", roman: "Har step aap khud karte hain. HUMRAAH ko kabhi password, PIN ya code nahi chahiye." })}</li>
          </ul>
        </Card>
      </div>
    );
  }

  // ── Library view ────────────────────────────────────────
  return (
    <div>
      <PageHeader
        icon={Map}
        eyebrow="HUMRAAH Guide"
        title={tx({ en: "Learn a digital task, one step at a time", roman: "Digital kaam seekhein, ek ek qadam" })}
        subtitle={tx({
          en: "Pick a task or tell me your goal. You do every step yourself — I explain why each step matters and give less help as you improve.",
          roman: "Koi kaam chunein ya apna maqsad batayein. Har qadam aap khud karte hain — main samjhata hoon aur aap ke seekhne ke saath madad kam karta hoon.",
        })}
      />

      {error && <Notice tone="danger" className="mb-4">{error}</Notice>}

      <Card glow className="mb-8 p-5 sm:p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex-1">
            <p className="font-display text-lg font-bold">{tx({ en: "What would you like to learn?", roman: "Aap kya seekhna chahte hain?" })}</p>
            <p className="mt-1 text-sm text-muted">{tx({ en: "Type or speak your goal, e.g. “send a voice note on WhatsApp”.", roman: "Apna maqsad likhein ya bolein, maslan “WhatsApp par voice note bhejna”." })}</p>
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (goal.trim()) start({ goal: goal.trim() });
              }}
            >
              <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={tx({ en: "My goal is…", roman: "Mera maqsad hai…" })} aria-label="Your goal" maxLength={300} />
              <Button type="submit" size="lg" icon={Sparkles} loading={loading} disabled={!goal.trim()} className="shrink-0">
                {tx({ en: "Make my guide", roman: "Guide banayein" })}
              </Button>
            </form>
          </div>
          <div className="md:border-l md:border-line md:pl-6">
            <VoiceMic
              size="md"
              onTranscript={(text) => {
                setGoal(text);
                start({ goal: text });
              }}
              labels={{ idle: tx({ en: "Or say your goal", roman: "Ya apna maqsad bolein" }), listening: tx({ en: "Listening…", roman: "Sun raha hoon…" }), unsupported: tx({ en: "Voice not supported — please type", roman: "Awaz support nahi — likhein" }) }}
            />
          </div>
        </div>
      </Card>

      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="text-xl font-bold">{tx({ en: "Popular guided tasks", roman: "Mashhoor guided kaam" })}</h2>
        <Badge tone="success" icon={ShieldCheck}>{tx({ en: "Reviewed for safety", roman: "Hifazat ke liye jaancha gaya" })}</Badge>
      </div>

      {libError && <Notice tone="warning" className="mb-4">{libError}</Notice>}
      {!library && !libError && <Spinner label={tx({ en: "Loading tasks…", roman: "Kaam load ho rahe hain…" })} />}
      {loading && <div className="mb-4"><Spinner label={tx({ en: "Preparing your guide…", roman: "Aap ka guide tayyar ho raha hai…" })} /></div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {library?.map((c, i) => {
          const Icon = ICONS[c.icon] ?? Map;
          return (
            <button
              key={c.id}
              onClick={() => start({ task_id: c.id })}
              disabled={loading}
              className="group flex flex-col rounded-[var(--radius-lg)] border border-line bg-surface p-5 text-left shadow-card transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-float disabled:opacity-60 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <IconTile icon={Icon} tone={TONES[i % TONES.length]} size="lg" />
                <Badge tone="neutral">{c.category}</Badge>
              </div>
              <p className="mt-4 font-display text-lg font-bold leading-snug">{tx(c.title)}</p>
              <p className="mt-1.5 flex-1 text-sm text-muted">{tx(c.blurb)}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-subtle">
                <span className="flex items-center gap-1.5"><Clock className="size-3.5" aria-hidden /> ~{c.minutes} min · {c.steps} {tx({ en: "steps", roman: "steps" })}</span>
                <span className="flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">{tx({ en: "Start", roman: "Shuru" })} <ArrowRight className="size-3.5" aria-hidden /></span>
              </div>
            </button>
          );
        })}
      </div>

      <Notice tone="info" className="mt-8" title={tx({ en: "How HUMRAAH teaches", roman: "HUMRAAH kaise sikhata hai" })}>
        {tx({
          en: "First attempt: full guidance with hints. Second attempt: hints only when you ask. Third attempt onwards: you choose the next step yourself. Your progress is saved on this device only.",
          roman: "Pehli koshish: isharon ke saath poori rehnumai. Doosri: ishara sirf maangne par. Teesri se: agla step aap khud chunte hain. Aap ki progress sirf isi device par mehfooz hoti hai.",
        })}{" "}
        <Link href="/progress" className="font-semibold text-primary underline-offset-2 hover:underline">{tx({ en: "View progress", roman: "Progress dekhein" })}</Link>
      </Notice>
    </div>
  );
}
