"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, FileText, GraduationCap, HelpCircle, Landmark, Lightbulb,
  LifeBuoy, Mail, Map, PartyPopper, Repeat, ShieldCheck, Sparkles, TrendingUp, Video, Wand2, X, Zap, type LucideIcon,
} from "lucide-react";
import { VoiceMic } from "@/components/media";
import { ActionCard, Badge, Button, ButtonLink, Card, IconTile, Input, ModeBadge, Notice, PageHeader, ProgressBar, Section, Spinner, Stat, StepList, Textarea, cn } from "@/components/ui";
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
    1: { name: tx({ en: "Level 1 · Full guidance", roman: "Level 1 · Poori rehnumai", ur: "لیول 1 · مکمل رہنمائی" }), body: tx({ en: "hints shown", roman: "ishare dikhte hain", ur: "اشارے نظر آتے ہیں" }) },
    2: { name: tx({ en: "Level 2 · Hints on request", roman: "Level 2 · Ishara maangne par", ur: "لیول 2 · مانگنے پر اشارہ" }), body: tx({ en: "ask when you need one", roman: "zaroorat par maangein", ur: "ضرورت ہو تو مانگیں" }) },
    3: { name: tx({ en: "Level 3 · Practice mode", roman: "Level 3 · Mashq mode", ur: "لیول 3 · مشق موڈ" }), body: tx({ en: "you choose the next step", roman: "agla step aap chunein", ur: "اگلا قدم آپ خود چنیں" }) },
  }[lvl];

  // ── Completion screen ───────────────────────────────────
  if (done) {
    const independent = done.hints === 0 && done.stuck === 0;
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card glow className="p-6 text-center sm:p-8">
          <IconTile icon={PartyPopper} tone="success" size="lg" className="mx-auto" />
          <h1 className="mt-4 text-2xl font-bold">{tx({ en: "Well done — you did it yourself!", roman: "Shabaash — aap ne khud kar dikhaya!", ur: "شاباش — آپ نے خود کر دکھایا!" })}</h1>
          <p className="mt-1 text-muted">{done.task.title}</p>
        </Card>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={tx({ en: "Steps", roman: "Steps", ur: "قدم" })} value={done.task.steps.length} />
          <Stat label={tx({ en: "Hints used", roman: "Ishare", ur: "اشارے" })} value={done.hints} />
          <Stat label={tx({ en: "Times stuck", roman: "Atke", ur: "اٹکے" })} value={done.stuck} />
          <Stat label={tx({ en: "Attempt", roman: "Koshish", ur: "کوشش" })} value={`#${done.attempt}`} />
        </div>
        <Notice tone={independent ? "success" : "info"} title={independent ? tx({ en: "Independent completion!", roman: "Khud-mukhtar takmeel!", ur: "خود مکمل کیا!" }) : tx({ en: "Next time, try with fewer hints", roman: "Agli dafa kam isharon ke saath koshish karein", ur: "اگلی بار کم اشاروں کے ساتھ کوشش کریں" })}>
          {independent
            ? tx({ en: "No help needed — this counts towards your Independence Score.", roman: "Koi madad nahi chahiye thi — yeh aap ke score mein shamil hai.", ur: "کوئی مدد نہیں چاہیے تھی — یہ آپ کے اسکور میں شامل ہے۔" })
            : tx({ en: "Next time HUMRAAH will give a little less help.", roman: "Agli dafa HUMRAAH thori kam madad dega.", ur: "اگلی بار ہمراہ تھوڑی کم مدد دے گا۔" })}
        </Notice>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/progress" icon={TrendingUp}>{tx({ en: "See your progress", roman: "Progress dekhein", ur: "اپنی پیش رفت دیکھیں" })}</ButtonLink>
          <ButtonLink href="/academy" variant="secondary" icon={GraduationCap}>{tx({ en: "Practise in the Academy", roman: "Academy mein mashq", ur: "اکیڈمی میں مشق کریں" })}</ButtonLink>
          <Button variant="ghost" icon={Map} onClick={() => setDone(null)}>{tx({ en: "Another task", roman: "Koi aur kaam", ur: "کوئی اور کام" })}</Button>
        </div>
      </div>
    );
  }

  // ── Task runner (No Confusion Mode) ─────────────────────
  if (session && task && step) {
    const n = task.steps.length;
    const isLast = session.step === n - 1;
    const showHint = lvl === 1 || hintOpen;
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={exit}>{tx({ en: "All tasks", roman: "Tamam kaam", ur: "تمام کام" })}</Button>
          <div className="flex items-center gap-2">
            <Badge tone="neutral">{task.source === "library" ? tx({ en: "Reviewed guide", roman: "Jaancha hua guide", ur: "جانچی ہوئی رہنمائی" }) : task.source === "ai" ? tx({ en: "AI plan", roman: "AI plan", ur: "AI منصوبہ" }) : tx({ en: "General plan", roman: "Aam plan", ur: "عام منصوبہ" })}</Badge>
            <ModeBadge mode={task.mode} />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <p className="mt-1 text-sm text-muted">
            <span className="font-semibold text-fg">{levelInfo.name}</span> · {levelInfo.body} · {tx({ en: `Attempt #${session.attempt}`, roman: `Koshish #${session.attempt}`, ur: `کوشش #${session.attempt}` })}
          </p>
        </div>

        {task.notice && <Notice tone="warning">{task.notice}</Notice>}

        <Card glow className="p-5 sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold">{tx({ en: `Step ${session.step + 1} of ${n}`, roman: `Step ${session.step + 1} / ${n}`, ur: `قدم ${session.step + 1} از ${n}` })}</span>
            <span className="text-subtle">{tx({ en: `Hints: ${session.hints}`, roman: `Ishare: ${session.hints}`, ur: `اشارے: ${session.hints}` })}</span>
          </div>
          <ProgressBar value={((session.step + (mustPredict ? 0 : 1)) / n) * 100} label="Task progress" />

          {mustPredict ? (
            <div className="mt-6">
              <p className="flex items-center gap-2 text-lg font-semibold">
                <HelpCircle className="size-5 text-lavender" aria-hidden />
                {tx({ en: "What do you think comes next?", roman: "Aap ke khayal mein agla qadam kya hai?", ur: "آپ کے خیال میں اگلا قدم کیا ہے؟" })}
              </p>
              <div className="mt-4 grid gap-2.5">
                {choices.map((c) => {
                  const wrong = wrongPicks.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => pickChoice(c)}
                      disabled={wrong}
                      className={cn(
                        "flex min-h-14 items-center gap-3 rounded-xl border px-4 py-3 text-left font-medium transition-colors cursor-pointer",
                        wrong ? "border-danger/30 bg-danger-soft text-muted line-through" : "border-line hover:border-primary hover:bg-primary-soft",
                      )}
                    >
                      {wrong ? <X className="size-5 shrink-0 text-danger" aria-hidden /> : <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden />}
                      {c}
                    </button>
                  );
                })}
              </div>
              {wrongPicks.length > 0 && (
                <p className="mt-3 text-sm text-muted" role="status">{tx({ en: "Not quite — that's a different step. Try again.", roman: "Yeh koi aur step hai. Dobara koshish karein.", ur: "یہ کوئی اور قدم ہے۔ دوبارہ کوشش کریں۔" })}</p>
              )}
            </div>
          ) : (
            <div className="mt-6" key={`${session.step}-${simpler}`}>
              {simpler && <Badge tone="info" className="mb-2">{tx({ en: "Simpler words", roman: "Aasaan alfaaz", ur: "آسان الفاظ" })}</Badge>}
              <p className="font-display text-xl font-bold leading-snug sm:text-2xl">{stepText}</p>
              <p className="mt-3 text-muted">{step.why}</p>
              {showHint && (
                <p className="mt-3 flex gap-2 rounded-xl bg-warning-soft p-3 text-sm text-fg">
                  <Lightbulb className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                  {step.hint}
                </p>
              )}
            </div>
          )}

          {!mustPredict && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" icon={Repeat} onClick={() => (speakingId === "guide-step" ? stop() : speak(stepText, "guide-step"))}>
                {speakingId === "guide-step" ? t("common.stop") : t("common.repeat")}
              </Button>
              <Button variant="secondary" size="sm" icon={Lightbulb} onClick={takeHint} disabled={showHint}>{t("common.hint")}</Button>
              <Button variant="secondary" size="sm" icon={HelpCircle} onClick={dontUnderstand} disabled={simpler}>{t("common.dontUnderstand")}</Button>
              <Button variant="ghost" size="sm" icon={LifeBuoy} onClick={() => setRescueOpen((o) => !o)} className="text-danger">{t("common.stuck")}</Button>
            </div>
          )}

          {rescueOpen && (
            <div className="mt-4 space-y-3 rounded-xl bg-danger-soft p-4">
              <p className="font-semibold">Rescue Mode</p>
              <Textarea rows={2} value={problem} onChange={(e) => setProblem(e.target.value)} placeholder={tx({ en: "What went wrong? (optional — never type codes)", roman: "Kya ghalat hua? (zaroori nahi — code na likhein)", ur: "کیا غلط ہوا؟ (ضروری نہیں — کوئی کوڈ نہ لکھیں)" })} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" icon={Wand2} loading={rescueLoading} onClick={askRescue}>{tx({ en: "Help me get unstuck", roman: "Madad karein", ur: "میری مدد کریں" })}</Button>
                <ButtonLink href="/vision" variant="ghost" size="sm" icon={Sparkles}>{tx({ en: "Explain a screenshot", roman: "Screenshot samjhayein", ur: "اسکرین شاٹ سمجھائیں" })}</ButtonLink>
              </div>
              {rescue && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{rescue.message}</p>
                    <ModeBadge mode={rescue.mode} />
                  </div>
                  <StepList items={rescue.recovery_steps} tone="danger" />
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Button variant="ghost" icon={ArrowLeft} disabled={session.step === 0} onClick={() => goTo(session.step - 1)}>{t("common.previous")}</Button>
            {!mustPredict &&
              (isLast ? (
                <Button size="lg" icon={CheckCircle2} onClick={() => setFinishing(true)}>{tx({ en: "I did it — finish", roman: "Ho gaya — mukammal", ur: "ہو گیا — مکمل" })}</Button>
              ) : (
                <Button size="lg" icon={Check} onClick={() => goTo(session.step + 1)}>{tx({ en: "I did it — next", roman: "Ho gaya — agla", ur: "ہو گیا — اگلا" })}</Button>
              ))}
          </div>

          {finishing && (
            <div className="mt-5 rounded-xl bg-primary-soft p-4">
              <p className="font-semibold">{tx({ en: "How confident do you feel doing this alone now?", roman: "Ab yeh khud karne mein aap kitna pur-aitemaad hain?", ur: "اب یہ کام خود کرنے میں آپ کتنا پُراعتماد ہیں؟" })}</p>
              <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label="Confidence from 1 to 5">
                {[1, 2, 3, 4, 5].map((c) => (
                  <button key={c} onClick={() => finish(c)} className="h-12 rounded-xl border border-line bg-surface text-lg font-bold hover:border-primary cursor-pointer">
                    {c}
                  </button>
                ))}
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-subtle">
                <span>{tx({ en: "Not yet", roman: "Abhi nahi", ur: "ابھی نہیں" })}</span>
                <span>{tx({ en: "Very confident", roman: "Bohat zyada", ur: "بہت زیادہ" })}</span>
              </div>
            </div>
          )}
        </Card>

        <details className="rounded-xl border border-line px-4 py-3 text-sm">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-success" aria-hidden /> {tx({ en: "Stay safe", roman: "Mehfooz rahein", ur: "محفوظ رہیں" })}
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
            {task.safety_notes.map((s) => <li key={s}>{s}</li>)}
            <li>{tx({ en: "You do every step yourself. HUMRAAH never needs your passwords, PINs or codes.", roman: "Har step aap khud karte hain. HUMRAAH ko kabhi password, PIN ya code nahi chahiye.", ur: "ہر قدم آپ خود کرتے ہیں۔ ہمراہ کو کبھی پاس ورڈ، PIN یا کوڈ نہیں چاہیے۔" })}</li>
          </ul>
        </details>
      </div>
    );
  }

  // ── Library view ────────────────────────────────────────
  return (
    <div className="space-y-8">
      <PageHeader
        icon={Map}
        title={tx({ en: "Digital Guide", roman: "Digital Guide", ur: "ڈیجیٹل گائیڈ" })}
        subtitle={tx({ en: "Learn any task one simple step at a time.", roman: "Koi bhi kaam ek ek aasaan qadam mein seekhein.", ur: "کوئی بھی کام ایک ایک آسان قدم میں سیکھیں۔" })}
      />

      {error && <Notice tone="danger">{error}</Notice>}

      <Card glow className="flex flex-col gap-4 p-5 md:flex-row md:items-center">
        <form
          className="flex flex-1 flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (goal.trim()) start({ goal: goal.trim() });
          }}
        >
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder={tx({ en: "What do you want to learn? e.g. send a voice note", roman: "Kya seekhna hai? maslan voice note bhejna", ur: "کیا سیکھنا ہے؟ مثلاً وائس نوٹ بھیجنا" })} aria-label="Your goal" maxLength={300} />
          <Button type="submit" size="lg" icon={Sparkles} loading={loading} disabled={!goal.trim()} className="shrink-0">
            {tx({ en: "Make my guide", roman: "Guide banayein", ur: "رہنمائی بنائیں" })}
          </Button>
        </form>
        <VoiceMic
          size="md"
          onTranscript={(text) => {
            setGoal(text);
            start({ goal: text });
          }}
          labels={{ idle: tx({ en: "Or say it", roman: "Ya bolein", ur: "یا بول کر بتائیں" }), listening: tx({ en: "Listening…", roman: "Sun raha hoon…", ur: "سن رہا ہوں…" }), unsupported: tx({ en: "Voice not supported", roman: "Awaz support nahi", ur: "آواز دستیاب نہیں" }) }}
        />
      </Card>

      <Section
        title={tx({ en: "Popular tasks", roman: "Mashhoor kaam", ur: "مقبول کام" })}
        description={tx({ en: "Help fades as you improve: full hints first, then on request, then you choose the next step.", roman: "Seekhne ke saath madad kam hoti hai: pehle poore ishare, phir maangne par, phir agla step aap chunte hain.", ur: "سیکھنے کے ساتھ مدد کم ہوتی ہے: پہلے پورے اشارے، پھر مانگنے پر، پھر اگلا قدم آپ خود چنتے ہیں۔" })}
      >
        {libError && <Notice tone="warning">{libError}</Notice>}
        {!library && !libError && <Spinner label={tx({ en: "Loading tasks…", roman: "Kaam load ho rahe hain…", ur: "کام لوڈ ہو رہے ہیں…" })} />}
        {loading && <Spinner label={tx({ en: "Preparing your guide…", roman: "Guide tayyar ho raha hai…", ur: "رہنمائی تیار ہو رہی ہے…" })} />}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {library?.map((c, i) => (
            <ActionCard
              key={c.id}
              icon={ICONS[c.icon] ?? Map}
              tone={TONES[i % TONES.length]}
              title={tx(c.title)}
              description={tx(c.blurb)}
              meta={<span className="text-xs text-subtle">~{c.minutes} min · {c.steps} {tx({ en: "steps", roman: "steps", ur: "قدم" })}</span>}
              onClick={() => !loading && start({ task_id: c.id })}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
