"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Bot, Eraser, Repeat, Send, ShieldCheck, Sparkles, Turtle, Volume2, VolumeX } from "lucide-react";
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
  { en: "Is this SMS a scam?", roman: "Kya yeh SMS dhoka hai?", ur: "کیا یہ SMS دھوکہ ہے؟" },
  { en: "What is OTP?", roman: "OTP kya hota hai?", ur: "OTP کیا ہوتا ہے؟" },
  { en: "Teach me to pay my electricity bill online", roman: "Bijli ka bill online jama karna sikhayein", ur: "بجلی کا بل آن لائن جمع کرنا سکھائیں" },
  { en: "I shared my OTP with a caller", roman: "Main ne caller ko OTP bata diya", ur: "میں نے کال کرنے والے کو OTP بتا دیا" },
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
        title={t("nav.assistant")}
        subtitle={tx({ en: "Speak or type — I'll explain simply.", roman: "Bolein ya likhein — main aasaan alfaaz mein samjhaunga.", ur: "بولیں یا لکھیں — میں آسان الفاظ میں سمجھاؤں گا۔" })}
        actions={
          <>
            <Segmented label={tx({ en: "Language", roman: "Zabaan", ur: "زبان" })} value={prefs.lang} onChange={(v) => update({ lang: v })} options={LANGS} />
            {!empty && (
              <Button variant="secondary" icon={Eraser} onClick={() => { stop(); setMessages([]); setError(null); }}>
                {tx({ en: "Clear chat", roman: "Chat saaf karein", ur: "چیٹ صاف کریں" })}
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <Card glow className="flex min-h-[60vh] flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-5 scrollbar-thin" aria-live="polite">
            {empty ? (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <h2 className={cn("mb-5 max-w-lg text-xl font-bold", lang === "ur" && "urdu")}>
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
                <div className="mt-6 flex max-w-2xl flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => {
                    const label = tx(s);
                    return (
                      <button
                        key={s.en}
                        onClick={() => void ask(label)}
                        className={cn("rounded-full border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-primary/50 hover:text-fg cursor-pointer", lang === "ur" && "urdu")}
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
                  <div key={m.id} className="flex justify-end">
                    <div className={cn("max-w-[85%] rounded-3xl rounded-ee-md bg-gradient-to-r from-primary to-[#0e8a7d] px-5 py-3 text-on-primary shadow-md", lang === "ur" && "urdu")}>
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
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
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-soft" aria-hidden>
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
            className="border-t border-line/80 bg-surface/50 p-3.5 sm:p-5 backdrop-blur-sm"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(input);
            }}
          >
            <div className="flex items-end gap-2.5">
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
                  className="max-h-40 min-h-12 w-full resize-none rounded-2xl border border-line bg-surface-2 px-4.5 py-3 text-base text-fg placeholder:text-subtle focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 transition-all shadow-inner"
                />
              </label>
              <Button type="submit" size="lg" icon={Send} disabled={!input.trim()} loading={busy} aria-label={tx({ en: "Send", roman: "Bhejein", ur: "بھیجیں" })} className="h-12 px-5 rounded-2xl shadow-sm">
                <span className="hidden sm:inline">{tx({ en: "Send", roman: "Bhejein", ur: "بھیجیں" })}</span>
              </Button>
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-xs text-subtle">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              {tx({ en: "Never type an OTP, PIN or password here.", roman: "Yahan kabhi OTP, PIN ya password na likhein.", ur: "یہاں کبھی او ٹی پی، پن یا پاس ورڈ نہ لکھیں۔" })}
            </p>
          </form>
        </Card>

        <Card className="h-fit space-y-4 p-4 sm:p-5">
          <p className="font-semibold">{tx({ en: "Voice settings", roman: "Awaz ki settings", ur: "آواز کی ترتیبات" })}</p>
          <div>
            <label className="flex items-center justify-between text-sm">
              <span>{tx({ en: "Speaking speed", roman: "Bolne ki raftaar", ur: "بولنے کی رفتار" })}</span>
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
              aria-label={tx({ en: "Speaking speed", roman: "Bolne ki raftaar", ur: "بولنے کی رفتار" })}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm">
            <input type="checkbox" checked={prefs.autoSpeak} onChange={(e) => update({ autoSpeak: e.target.checked })} className="size-4.5 accent-[var(--primary)]" />
            {tx({ en: "Read every answer aloud", roman: "Har jawab sunayein", ur: "ہر جواب سنائیں" })}
          </label>
          <p className="border-t border-line pt-4 text-xs text-subtle">
            {tx({
              en: "Voice works best in Chrome or Edge. Check names and numbers on screen.",
              roman: "Awaz Chrome ya Edge mein behtar hai. Naam aur numbers screen par check karein.",
              ur: "آواز کروم یا ایج میں بہتر ہے۔ نام اور نمبر اسکرین پر دیکھیں۔",
            })}
          </p>
        </Card>
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
          "relative flex size-12 items-center justify-center rounded-2xl text-white transition-all duration-200 cursor-pointer",
          listening
            ? "bg-gradient-to-tr from-danger to-[#ff5364] shadow-md shadow-danger/40 ring-4 ring-danger/30"
            : "bg-gradient-to-tr from-primary to-[#23d1bf] shadow-md shadow-primary/30 hover:scale-105 active:scale-95 ring-2 ring-primary/20",
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
    <div className="flex gap-3.5">
      <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-soft" aria-hidden>
        <Bot className="size-4.5" />
      </span>
      <div className="min-w-0 max-w-[92%] flex-1 sm:max-w-[85%]">
        <div className="rounded-3xl rounded-tl-md border border-line/90 bg-surface-2/95 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {reply && <ModeBadge mode={reply.mode} />}
            {m.simpler && <Badge tone="lavender" icon={Sparkles}>{t("common.simpler")}</Badge>}
          </div>
          <p dir="auto" className={cn("whitespace-pre-wrap leading-relaxed text-fg text-[0.95rem]", urdu && "text-start text-base")}>{m.content}</p>
          {reply?.notice && <p className="mt-2 text-xs font-semibold text-warning">{reply.notice}</p>}
          {!!reply?.redactions && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <ShieldCheck className="size-3.5 text-success" aria-hidden />
              {tx({ en: `${reply.redactions} sensitive number(s) were hidden before analysis.`, roman: `${reply.redactions} hassas number(s) jaanch se pehle chhupa diye gaye.`, ur: `${reply.redactions} حساس نمبر چھپا دیے گئے۔` })}
            </p>
          )}
        </div>

        {reply && reply.actions.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {reply.actions.map((a, i) => (
              <Button key={`${a.module}-${i}`} size="sm" variant={a.module === "emergency" ? "danger" : i === 0 ? "soft" : "secondary"} onClick={() => onAction(a)} className="rounded-xl shadow-soft">
                {a.label} <ArrowRight className="size-3.5" aria-hidden />
              </Button>
            ))}
          </div>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-1" role="group" aria-label={tx({ en: "Patient voice controls", roman: "Sabr wale controls", ur: "صبر والے کنٹرولز" })}>
          <Button size="sm" variant="ghost" icon={speaking ? VolumeX : Volume2} onClick={() => (speaking ? onStop() : onSpeak())} className="rounded-xl">
            {speaking ? t("common.stop") : t("common.listen")}
          </Button>
          <Button size="sm" variant="ghost" icon={Repeat} onClick={() => onSpeak()} className="rounded-xl">
            {t("common.repeat")}
          </Button>
          <Button size="sm" variant="ghost" icon={Turtle} onClick={() => onSpeak(0.7)} className="rounded-xl">
            {tx({ en: "Slower", roman: "Aahista", ur: "آہستہ" })}
          </Button>
          {isLast && m.askedWith && !m.simpler && (
            <Button size="sm" variant="ghost" icon={Sparkles} onClick={onSimpler} disabled={busy} className="rounded-xl">
              {t("common.simpler")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
