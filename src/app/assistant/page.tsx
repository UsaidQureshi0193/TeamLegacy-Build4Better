"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Eraser, Gauge, Lightbulb, Repeat, Send, ShieldCheck, Sparkles, Turtle, User, Volume2, VolumeX } from "lucide-react";
import { VoiceMic } from "@/components/media";
import { Badge, Button, Card, ModeBadge, Notice, PageHeader, Segmented, Spinner, cn } from "@/components/ui";
import { postJSON, setHandoff, takeHandoff } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useSpeaker, useSpeechRecognition, useSpeechSupport } from "@/lib/speech";
import type { AssistantAction, ChatReply, ChatTurn, Lang } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  reply?: ChatReply;
  /** For assistant messages: the user text that produced it (used by "Simpler words"). */
  askedWith?: string;
  simpler?: boolean;
}

const SUGGESTIONS: { en: string; roman: string; ur: string }[] = [
  { en: "I want to make a WhatsApp video call", roman: "Mujhe WhatsApp par video call karni hai", ur: "مجھے واٹس ایپ پر ویڈیو کال کرنی ہے" },
  { en: "Is this SMS a scam?", roman: "Kya yeh SMS dhoka hai?", ur: "کیا یہ ایس ایم ایس دھوکہ ہے؟" },
  { en: "What is OTP?", roman: "OTP kya hota hai?", ur: "او ٹی پی کیا ہے؟" },
  { en: "Teach me to pay my electricity bill online", roman: "Bijli ka bill online jama karna sikhayein", ur: "بجلی کا بل آن لائن جمع کرنا سکھائیں" },
  { en: "I shared my OTP with a caller", roman: "Main ne caller ko OTP bata diya", ur: "میں نے کال کرنے والے کو او ٹی پی بتا دیا" },
];

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "English" },
  { value: "roman", label: "Roman Urdu" },
  { value: "ur", label: "اردو" },
];

let idSeq = 0;
const newId = () => `m${Date.now()}-${idSeq++}`;

export default function AssistantPage() {
  const router = useRouter();
  const { prefs, update } = usePrefs();
  const { tx, t, lang } = useT();
  const { speak, stop, speakingId } = useSpeaker();
  const { stt } = useSpeechSupport();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const ask = useCallback(
    async (text: string, opts?: { simpler?: boolean }) => {
      const message = text.trim();
      if (!message || busy) return;
      setError(null);
      const history: ChatTurn[] = messages.slice(-12).map((m) => ({ role: m.role, content: m.content }));
      if (!opts?.simpler) setMessages((prev) => [...prev, { id: newId(), role: "user", content: message }]);
      setInput("");
      setBusy(true);
      try {
        const reply = await postJSON<ChatReply>("/api/assistant/chat", { message, language: prefs.lang, history, style: opts?.simpler ? "simpler" : "normal" });
        const id = newId();
        setMessages((prev) => [...prev, { id, role: "assistant", content: reply.reply, reply, askedWith: message, simpler: opts?.simpler }]);
        if (prefs.autoSpeak) speak(reply.reply, id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, messages, prefs.lang, prefs.autoSpeak, speak],
  );

  // Incoming question from another module (e.g. Home "Speak to Humraah").
  const pending = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (pending.current === undefined) pending.current = takeHandoff("assistant");
    if (!pending.current) return;
    const timer = setTimeout(() => {
      const payload = pending.current;
      pending.current = null;
      if (payload) void ask(payload);
    }, 0);
    return () => clearTimeout(timer);
  }, [ask]);

  const runAction = (a: AssistantAction) => {
    if (a.payload) setHandoff(a.module, a.payload);
    router.push(`/${a.module}`);
  };

  const empty = messages.length === 0;
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div>
      <PageHeader
        icon={Bot}
        eyebrow="HUMRAAH AI · Voice"
        title={t("nav.assistant")}
        subtitle={tx({
          en: "Speak or type in English, Roman Urdu or Urdu. I'll explain things simply, one step at a time.",
          roman: "English, Roman Urdu ya Urdu mein bolein ya likhein. Main aasaan alfaaz mein, ek ek qadam samjhaunga.",
          ur: "انگریزی، رومن اردو یا اردو میں بولیں یا لکھیں۔ میں آسان الفاظ میں سمجھاؤں گا۔",
        })}
        actions={
          <>
            <Segmented label="Language" value={prefs.lang} onChange={(v) => update({ lang: v })} options={LANGS} />
            {!empty && (
              <Button variant="secondary" icon={Eraser} onClick={() => { stop(); setMessages([]); setError(null); }}>
                {tx({ en: "Clear chat", roman: "Chat saaf karein", ur: "چیٹ صاف کریں" })}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card glow className="flex min-h-[60vh] flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6 scrollbar-thin" aria-live="polite">
            {empty ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center animate-fade-up">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                  <Sparkles className="size-3.5" aria-hidden /> {tx({ en: "Patient Voice Mode", roman: "Patient Voice Mode", ur: "صبر والا وائس موڈ" })}
                </div>
                <h2 className={cn("mb-6 max-w-lg text-2xl font-extrabold sm:text-3xl", lang === "ur" && "urdu")}>
                  {tx({ en: "How can I help you today?", roman: "Aaj main aap ki kya madad karun?", ur: "آج میں آپ کی کیا مدد کروں؟" })}
                </h2>
                <VoiceMic
                  onTranscript={(text) => void ask(text)}
                  labels={{
                    idle: tx({ en: "Tap the microphone and speak", roman: "Mic dabayein aur bolein", ur: "مائیک دبائیں اور بولیں" }),
                    listening: tx({ en: "Listening… tap to stop", roman: "Sun raha hoon… rokne ke liye dabayein", ur: "سن رہا ہوں… روکنے کے لیے دبائیں" }),
                    unsupported: tx({ en: "Voice isn't supported in this browser — please type below", roman: "Is browser mein awaz kaam nahi karti — neeche likhein", ur: "اس براؤزر میں آواز کام نہیں کرتی، نیچے لکھیں" }),
                  }}
                />
                <div className="mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => {
                    const label = tx(s);
                    return (
                      <button
                        key={s.en}
                        onClick={() => void ask(label)}
                        className={cn("rounded-full border border-line bg-surface-2 px-4 py-2.5 text-sm font-semibold text-muted transition hover:border-primary hover:text-fg cursor-pointer", lang === "ur" && "urdu")}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end gap-3 animate-fade-up">
                    <div className={cn("max-w-[85%] rounded-3xl rounded-br-lg bg-[linear-gradient(135deg,var(--primary),var(--brand-emerald))] px-4 py-3 text-on-primary shadow-soft", lang === "ur" && "urdu")}>
                      <p className="whitespace-pre-wrap text-[1.02rem] leading-relaxed">{m.content}</p>
                    </div>
                    <span className="mt-1 hidden size-9 shrink-0 items-center justify-center rounded-full bg-surface-3 text-muted sm:flex" aria-hidden>
                      <User className="size-4.5" />
                    </span>
                  </div>
                ) : (
                  <AssistantBubble
                    key={m.id}
                    m={m}
                    speaking={speakingId === m.id}
                    onSpeak={(rate) => speak(m.content, m.id, rate)}
                    onStop={stop}
                    onSimpler={() => m.askedWith && void ask(m.askedWith, { simpler: true })}
                    onAction={runAction}
                    busy={busy}
                    isLast={m.id === lastAssistant?.id}
                  />
                ),
              )
            )}
            {busy && (
              <div className="flex items-center gap-3 animate-fade-up">
                <span className="flex size-9 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden>
                  <Bot className="size-4.5" />
                </span>
                <Spinner label={tx({ en: "HUMRAAH is thinking…", roman: "HUMRAAH soch raha hai…", ur: "ہمراہ سوچ رہا ہے…" })} />
              </div>
            )}
            <div ref={endRef} />
          </div>

          {error && (
            <div className="px-4 pb-2 sm:px-6">
              <Notice tone="danger">{error}</Notice>
            </div>
          )}

          <form
            className="border-t border-line bg-surface-2/70 p-3 sm:p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <div className="flex items-end gap-2">
              {stt && !empty && <CompactMic onTranscript={(text) => void ask(text)} />}
              <label className="flex-1">
                <span className="sr-only">{tx({ en: "Type your message", roman: "Apna paigham likhein", ur: "اپنا پیغام لکھیں" })}</span>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void ask(input);
                    }
                  }}
                  rows={1}
                  maxLength={4000}
                  dir="auto"
                  placeholder={tx({ en: "Type here… e.g. “How do I fill an online form?”", roman: "Yahan likhein… jaise “Online form kaise bharun?”", ur: "یہاں لکھیں…" })}
                  className="max-h-40 min-h-12 w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base text-fg placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                />
              </label>
              <Button type="submit" size="lg" icon={Send} disabled={!input.trim()} loading={busy} aria-label="Send" className="h-12 px-4">
                <span className="hidden sm:inline">{tx({ en: "Send", roman: "Bhejein", ur: "بھیجیں" })}</span>
              </Button>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              {tx({
                en: "HUMRAAH never asks for your OTP, PIN or passwords. Don't type them here.",
                roman: "HUMRAAH kabhi aap ka OTP, PIN ya password nahi maangta. Yahan na likhein.",
                ur: "ہمراہ کبھی آپ کا او ٹی پی، پن یا پاس ورڈ نہیں مانگتا۔",
              })}
            </p>
          </form>
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-bold">
              <Lightbulb className="size-5 text-amber" aria-hidden /> {tx({ en: "Patient controls", roman: "Sabr wale controls", ur: "صبر والے کنٹرولز" })}
            </h2>
            <ul className="mt-3 space-y-2.5 text-sm text-muted">
              <li className="flex gap-2.5"><Volume2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{tx({ en: "Read aloud — hear any answer.", roman: "Parh kar sunayein — har jawab sunein.", ur: "پڑھ کر سنائیں — ہر جواب سنیں۔" })}</li>
              <li className="flex gap-2.5"><Repeat className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{tx({ en: "Repeat — as many times as you like.", roman: "Dobara — jitni baar chahein.", ur: "دوبارہ — جتنی بار چاہیں۔" })}</li>
              <li className="flex gap-2.5"><Turtle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{tx({ en: "Slower — speaks more slowly.", roman: "Aahista — aahista bolta hai.", ur: "آہستہ — آہستہ بولتا ہے۔" })}</li>
              <li className="flex gap-2.5"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{tx({ en: "Simpler words — explains again, more simply.", roman: "Aasaan alfaaz — dobara aasaani se samjhata hai.", ur: "آسان الفاظ — دوبارہ آسانی سے سمجھاتا ہے۔" })}</li>
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <label className="flex items-center gap-3 text-sm font-semibold">
                <Gauge className="size-4.5 text-subtle" aria-hidden />
                <span className="flex-1">{tx({ en: "Speaking speed", roman: "Bolne ki raftaar", ur: "بولنے کی رفتار" })}</span>
                <span className="tabular-nums text-subtle">{prefs.voiceRate.toFixed(2)}×</span>
              </label>
              <input
                type="range"
                min={0.6}
                max={1.3}
                step={0.05}
                value={prefs.voiceRate}
                onChange={(e) => update({ voiceRate: Number(e.target.value) })}
                className="mt-2 w-full accent-[var(--primary)]"
                aria-label="Speaking speed"
              />
              <label className="mt-3 flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input type="checkbox" checked={prefs.autoSpeak} onChange={(e) => update({ autoSpeak: e.target.checked })} className="size-5 accent-[var(--primary)]" />
                {tx({ en: "Read every answer aloud automatically", roman: "Har jawab khud-ba-khud parh kar sunayein", ur: "ہر جواب خود بخود سنائیں" })}
              </label>
            </div>
          </Card>
          <Notice tone="info" title={tx({ en: "Voice tips", roman: "Awaz ke mashwaray", ur: "آواز کے مشورے" })}>
            {tx({
              en: "Voice works best in Chrome or Edge. Speech can mishear names and numbers — always check the text on screen.",
              roman: "Awaz Chrome ya Edge mein behtar chalti hai. Naam aur numbers ghalat sunay ja sakte hain — screen par text zaroor check karein.",
              ur: "آواز کروم یا ایج میں بہتر چلتی ہے۔ نام اور نمبر غلط سنے جا سکتے ہیں، اسکرین پر متن ضرور دیکھیں۔",
            })}
          </Notice>
          <Card className="p-5">
            <h2 className="font-display text-base font-bold">{tx({ en: "I can route you to", roman: "Main yahan le ja sakta hoon", ur: "میں یہاں لے جا سکتا ہوں" })}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["shield", "Scam Shield"],
                ["vision", "Vision AI"],
                ["guide", "Digital Guide"],
                ["academy", "Academy"],
                ["document", "Document Reader"],
                ["emergency", "Emergency Help"],
              ].map(([m, label]) => (
                <button key={m} onClick={() => router.push(`/${m}`)} className="cursor-pointer">
                  <Badge tone={m === "emergency" ? "danger" : "teal"}>{label}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function CompactMic({ onTranscript }: { onTranscript: (text: string) => void }) {
  const { state, start, stop, error } = useSpeechRecognition(onTranscript);
  const listening = state === "listening";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (listening ? stop() : start())}
        aria-pressed={listening}
        aria-label={listening ? "Stop listening" : "Speak"}
        title={error ?? undefined}
        className={cn(
          "relative flex size-12 items-center justify-center rounded-2xl text-white transition cursor-pointer",
          listening ? "bg-[linear-gradient(135deg,#ff6b75,#f4b544)]" : "bg-[linear-gradient(135deg,var(--brand-teal),var(--brand-emerald))]",
        )}
      >
        {listening && <span className="absolute inset-0 rounded-2xl bg-danger/40 animate-pulse-ring" aria-hidden />}
        {listening ? <span className="size-4 rounded-sm bg-white" /> : <MicIcon />}
      </button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
    </svg>
  );
}

function AssistantBubble({
  m, speaking, onSpeak, onStop, onSimpler, onAction, busy, isLast,
}: {
  m: Message;
  speaking: boolean;
  onSpeak: (rate?: number) => void;
  onStop: () => void;
  onSimpler: () => void;
  onAction: (a: AssistantAction) => void;
  busy: boolean;
  isLast: boolean;
}) {
  const { tx, t } = useT();
  const reply = m.reply;
  const urdu = reply?.language === "ur";
  return (
    <div className="flex gap-3 animate-fade-up">
      <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#18B9A8,#16A36A)] text-[#04211e] shadow-soft" aria-hidden>
        <Bot className="size-4.5" />
      </span>
      <div className="min-w-0 max-w-[92%] flex-1 sm:max-w-[85%]">
        <div className="rounded-3xl rounded-tl-lg border border-line bg-surface-2 px-4 py-3.5 shadow-soft">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {reply && <ModeBadge mode={reply.mode} />}
            {m.simpler && <Badge tone="lavender" icon={Sparkles}>{t("common.simpler")}</Badge>}
            {reply && reply.module !== "general" && <Badge tone="neutral">{reply.module}</Badge>}
          </div>
          <p dir="auto" className={cn("whitespace-pre-wrap text-[1.05rem] leading-relaxed text-fg", urdu && "urdu text-right")}>{m.content}</p>
          {reply?.notice && <p className="mt-2 text-xs font-medium text-warning">{reply.notice}</p>}
          {!!reply?.redactions && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
              <ShieldCheck className="size-3.5" aria-hidden />
              {tx({ en: `${reply.redactions} sensitive number(s) were hidden before analysis.`, roman: `${reply.redactions} hassas number(s) jaanch se pehle chhupa diye gaye.`, ur: `${reply.redactions} حساس نمبر چھپا دیے گئے۔` })}
            </p>
          )}
        </div>

        {reply && reply.actions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {reply.actions.map((a, i) => (
              <Button key={`${a.module}-${i}`} size="sm" variant={a.module === "emergency" ? "danger" : i === 0 ? "primary" : "secondary"} onClick={() => onAction(a)}>
                {a.label} <ArrowRight className="size-4" aria-hidden />
              </Button>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label="Patient voice controls">
          <Button size="sm" variant="ghost" icon={speaking ? VolumeX : Volume2} onClick={() => (speaking ? onStop() : onSpeak())}>
            {speaking ? t("common.stop") : t("common.listen")}
          </Button>
          <Button size="sm" variant="ghost" icon={Repeat} onClick={() => onSpeak()}>
            {t("common.repeat")}
          </Button>
          <Button size="sm" variant="ghost" icon={Turtle} onClick={() => onSpeak(0.7)}>
            {tx({ en: "Slower", roman: "Aahista", ur: "آہستہ" })}
          </Button>
          {isLast && m.askedWith && !m.simpler && (
            <Button size="sm" variant="ghost" icon={Sparkles} onClick={onSimpler} disabled={busy}>
              {t("common.simpler")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
