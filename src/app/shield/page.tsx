"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertOctagon, CircleHelp, Dna, ExternalLink, GraduationCap, Image as ImageIcon, Link2, LifeBuoy, MessageSquareText,
  QrCode, RotateCcw, ShieldAlert, ShieldCheck, Sparkles, Wand2,
} from "lucide-react";
import { ImageDrop, VoiceMic } from "@/components/media";
import { Badge, Button, Card, IconTile, ModeBadge, Notice, PageHeader, ProgressBar, Section, Segmented, SpeakButton, Spinner, StepList, Textarea, cn } from "@/components/ui";
import { postJSON, runOcr, setHandoff, takeHandoff } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { recordEvent } from "@/lib/progress";
import { SAMPLE_SMS_TEXT, sampleScamSms } from "@/lib/samples";
import type { RiskLevel, ScamAnalysis, ScamIndicator } from "@/lib/types";

type Tab = "text" | "image" | "qr";

const RISK: Record<RiskLevel, { tone: "danger" | "warning" | "success" | "info"; icon: typeof ShieldAlert; en: string; roman: string; ur: string; meter: number }> = {
  high: { tone: "danger", icon: AlertOctagon, en: "High risk", roman: "Zyada khatra", ur: "زیادہ خطرہ", meter: 92 },
  medium: { tone: "warning", icon: ShieldAlert, en: "Some warning signs", roman: "Kuch khatre ki nishaniyan", ur: "کچھ خطرے کی نشانیاں", meter: 60 },
  low: { tone: "success", icon: ShieldCheck, en: "Few or no warning signs", roman: "Khatre ki nishaniyan kam ya nahi", ur: "خطرے کی نشانیاں کم", meter: 22 },
  uncertain: { tone: "info", icon: CircleHelp, en: "Not enough information", roman: "Maloomat kaafi nahi", ur: "معلومات کافی نہیں", meter: 45 },
};

const SEV_STYLE = {
  high: { mark: "bg-danger/20 ring-danger/60 text-fg", dot: "bg-danger", badge: "danger" as const },
  medium: { mark: "bg-warning/25 ring-warning/60 text-fg", dot: "bg-warning", badge: "warning" as const },
  low: { mark: "bg-info/20 ring-info/50 text-fg", dot: "bg-info", badge: "info" as const },
};

/** Split the message into plain and highlighted runs using each indicator's exact evidence quote. */
function scamDnaSegments(text: string, indicators: ScamIndicator[]) {
  const lower = text.toLowerCase();
  const ranges: { start: number; end: number; idx: number; sev: ScamIndicator["severity"] }[] = [];
  const rank = { high: 3, medium: 2, low: 1 };
  indicators.forEach((ind, idx) => {
    const ev = ind.evidence.trim().toLowerCase();
    if (ev.length < 2) return;
    const start = lower.indexOf(ev);
    if (start >= 0) ranges.push({ start, end: start + ev.length, idx, sev: ind.severity });
  });
  ranges.sort((a, b) => a.start - b.start || rank[b.sev] - rank[a.sev]);
  const merged: typeof ranges = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start < last.end) {
      if (r.end > last.end) last.end = r.end;
      if (rank[r.sev] > rank[last.sev]) {
        last.sev = r.sev;
        last.idx = r.idx;
      }
    } else merged.push({ ...r });
  }
  const out: { text: string; idx?: number; sev?: ScamIndicator["severity"] }[] = [];
  let pos = 0;
  for (const r of merged) {
    if (r.start > pos) out.push({ text: text.slice(pos, r.start) });
    out.push({ text: text.slice(r.start, r.end), idx: r.idx, sev: r.sev });
    pos = r.end;
  }
  if (pos < text.length) out.push({ text: text.slice(pos) });
  return { segments: out, found: new Set(merged.map((m) => m.idx)) };
}

async function decodeQr(dataUrl: string): Promise<string | null> {
  const jsQR = (await import("jsqr")).default;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  return jsQR(data.data, c.width, c.height, { inversionAttempts: "attemptBoth" })?.data ?? null;
}

export default function ShieldPage() {
  const { tx, lang } = useT();
  const { prefs } = usePrefs();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("text");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [ocrState, setOcrState] = useState<{ busy: boolean; progress: number; confidence?: number }>({ busy: false, progress: 0 });
  const [qr, setQr] = useState<{ content: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScamAnalysis | null>(null);
  const [analysedText, setAnalysedText] = useState("");
  const [focus, setFocus] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = takeHandoff("shield");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time handoff from another module
    if (h) setText(h);
  }, []);

  const analyse = async (msg: string, img: string | null) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setFocus(null);
    try {
      const r = await postJSON<ScamAnalysis>("/api/shield/analyze", { text: msg, image: img, language: prefs.lang });
      setResult(r);
      setAnalysedText(msg);
      recordEvent({ kind: "scam-check", skill: "scam-detection", title: "Checked a message in Scam Shield", hints: 0, completed: true, independent: true, meta: { risk: r.risk_level } });
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: prefs.reduceMotion ? "auto" : "smooth", block: "start" }), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onImage = async (dataUrl: string) => {
    setImage(dataUrl);
    setResult(null);
    setError(null);
    setOcrState({ busy: true, progress: 0 });
    try {
      const ocr = await runOcr(dataUrl, (p) => setOcrState((s) => ({ ...s, progress: p })));
      setText(ocr.text);
      setOcrState({ busy: false, progress: 1, confidence: ocr.confidence });
      if (!ocr.text) setError(tx({ en: "I couldn't read any text. Try a clearer screenshot, or type the message.", roman: "Koi text parha nahi gaya. Saaf screenshot dein ya message type karein." }));
    } catch {
      setOcrState({ busy: false, progress: 0 });
      setError(tx({ en: "Text reading (OCR) failed. It needs an internet connection the first time. You can still type the message.", roman: "Text parhna (OCR) nakaam hua. Pehli dafa internet chahiye. Aap message type kar sakte hain." }));
    }
  };

  const onQr = async (dataUrl: string) => {
    setImage(dataUrl);
    setResult(null);
    setError(null);
    try {
      const content = await decodeQr(dataUrl);
      if (!content) {
        setQr(null);
        setError(tx({ en: "No QR code found. Make sure the whole code is visible and in focus.", roman: "QR code nahi mila. Poora code saaf nazar aana chahiye." }));
        return;
      }
      setQr({ content });
      setText(content);
      analyse(content, null);
    } catch {
      setError(tx({ en: "This image couldn't be read as a QR code.", roman: "Is tasveer se QR code parha nahi ja saka." }));
    }
  };

  const reset = () => {
    setText("");
    setImage(null);
    setQr(null);
    setResult(null);
    setError(null);
    setOcrState({ busy: false, progress: 0 });
  };

  const dna = useMemo(() => (result ? scamDnaSegments(analysedText, result.indicators) : null), [result, analysedText]);
  const risk = result ? RISK[result.risk_level] : null;
  const speakText = result ? [result.summary, ...result.indicators.map((i) => `${i.indicator}. ${i.explanation}`), ...result.safe_actions].join(" ") : "";

  return (
    <div className="space-y-8">
      <PageHeader
        icon={ShieldAlert}
        tone="danger"
        title={tx({ en: "Scam Shield", roman: "Scam Shield", ur: "اسکیم شیلڈ" })}
        subtitle={tx({ en: "Check a message, screenshot or QR code for scam signs.", roman: "Message, screenshot ya QR code mein dhoke ki nishaniyan check karein." })}
        actions={result && <Button variant="secondary" icon={RotateCcw} onClick={reset}>{tx({ en: "Check another", roman: "Doosra check karein" })}</Button>}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card glow className="p-4 sm:p-5">
          <Segmented<Tab>
            label="Input type"
            value={tab}
            onChange={(v) => {
              setTab(v);
              setError(null);
            }}
            options={[
              { value: "text", label: tx({ en: "Message", roman: "Message" }), icon: MessageSquareText },
              { value: "image", label: tx({ en: "Screenshot", roman: "Screenshot" }), icon: ImageIcon },
              { value: "qr", label: tx({ en: "QR code", roman: "QR code" }), icon: QrCode },
            ]}
            className="mb-4"
          />

          {tab === "text" && (
            <div className="space-y-3">
              <Textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={tx({ en: "Paste or type the message you received…", roman: "Jo message aaya hai woh yahan paste ya type karein…" })}
                aria-label="Message to check"
                maxLength={6000}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button size="lg" icon={Dna} loading={loading} disabled={!text.trim()} onClick={() => analyse(text, null)}>
                  {tx({ en: "Check for scam signs", roman: "Dhoke ki nishaniyan check karein" })}
                </Button>
                <Button variant="ghost" icon={Sparkles} onClick={() => setText(SAMPLE_SMS_TEXT)}>
                  {tx({ en: "Use fictional sample", roman: "Farzi namoona" })}
                </Button>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-muted hover:text-fg">{tx({ en: "Or read the message out loud", roman: "Ya message bol kar sunayein" })}</summary>
                <div className="pt-4">
                  <VoiceMic size="md" onTranscript={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
                </div>
              </details>
            </div>
          )}

          {tab === "image" && (
            <div className="space-y-3">
              {!image ? (
                <ImageDrop onImage={onImage} onSample={() => onImage(sampleScamSms())} sampleLabel={tx({ en: "Try fictional SMS", roman: "Farzi SMS try karein" })} />
              ) : (
                <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Uploaded screenshot" className="max-h-72 w-full rounded-xl border border-line bg-surface-2 object-contain" />
                  <div className="space-y-3">
                    {ocrState.busy ? (
                      <div className="space-y-2 pt-2">
                        <Spinner label={tx({ en: "Reading the text on your device…", roman: "Text aap ke device par parha ja raha hai…" })} />
                        <ProgressBar value={ocrState.progress * 100} label="OCR progress" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{tx({ en: "Text found — check & correct it", roman: "Mila hua text — check aur durust karein" })}</p>
                          {ocrState.confidence !== undefined && <Badge tone={ocrState.confidence > 70 ? "success" : "warning"}>{ocrState.confidence}% clear</Badge>}
                        </div>
                        <Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} aria-label="Extracted text" />
                        <div className="flex flex-wrap gap-2">
                          <Button size="lg" icon={Dna} loading={loading} disabled={!text.trim()} onClick={() => analyse(text, image)}>
                            {tx({ en: "Check for scam signs", roman: "Dhoke ki nishaniyan check karein" })}
                          </Button>
                          <Button variant="ghost" icon={RotateCcw} onClick={reset}>{tx({ en: "Another image", roman: "Doosri tasveer" })}</Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "qr" && (
            <div className="space-y-3">
              <p className="text-sm text-muted">
                {tx({ en: "HUMRAAH shows where a QR code leads. It never opens the link or starts a payment.", roman: "HUMRAAH batata hai QR code kahan le jata hai. Link khud nahi kholta na payment shuru karta hai." })}
              </p>
              <ImageDrop onImage={onQr} label={tx({ en: "Upload a photo of the QR code", roman: "QR code ki tasveer upload karein" })} privacyNote="" compact />
              {qr && (
                <div className="rounded-xl bg-surface-2 p-4">
                  <p className="text-xs font-medium text-subtle">{tx({ en: "This QR code contains", roman: "Is QR code mein yeh hai" })}</p>
                  <p className="mt-1 break-all font-mono text-sm">{qr.content}</p>
                </div>
              )}
            </div>
          )}

          {error && <Notice tone="danger" className="mt-4">{error}</Notice>}
          {loading && <div className="mt-4"><Spinner label={tx({ en: "Looking for warning signs…", roman: "Khatre ki nishaniyan dhoondi ja rahi hain…" })} /></div>}
        </Card>

        <Card className="space-y-4 p-4 sm:p-5">
          <div>
            <p className="mb-3 font-semibold">{tx({ en: "3 golden rules", roman: "3 sunehri usool" })}</p>
            <StepList
              items={[
                { en: "Never share an OTP, PIN or password.", roman: "OTP, PIN ya password kabhi na batayein." },
                { en: "Don't tap links in unexpected messages.", roman: "Ghair mutawaqqa message ke link na kholein." },
                { en: "Call the number on your card — not the one in the message.", roman: "Card wale number par call karein — message wale par nahi." },
              ].map((r) => <span key={r.en} className="text-muted">{tx(r)}</span>)}
            />
          </div>
          <div className="border-t border-line pt-4">
            <p className="text-sm font-semibold">{tx({ en: "Already shared a code or sent money?", roman: "Code bata diya ya paise bhej diye?" })}</p>
            <Button
              variant="danger"
              size="sm"
              icon={LifeBuoy}
              className="mt-2"
              onClick={() => {
                setHandoff("emergency", "shared-otp");
                router.push("/emergency");
              }}
            >
              {tx({ en: "Open Emergency Help", roman: "Emergency Help kholein" })}
            </Button>
          </div>
        </Card>
      </div>

      {result && risk && dna && (
        <section ref={resultRef} className="scroll-mt-28 space-y-8" aria-live="polite">
          {/* Risk verdict */}
          <div
            className={cn(
              "rounded-3xl border p-5 sm:p-6 shadow-md backdrop-blur-md transition-all",
              {
                danger: "bg-gradient-to-r from-danger-soft via-danger-soft/85 to-surface border-danger/30 shadow-danger/5",
                warning: "bg-gradient-to-r from-warning-soft via-warning-soft/85 to-surface border-warning/30 shadow-warning/5",
                success: "bg-gradient-to-r from-success-soft via-success-soft/85 to-surface border-success/30 shadow-success/5",
                info: "bg-gradient-to-r from-info-soft via-info-soft/85 to-surface border-info/30 shadow-info/5",
              }[risk.tone],
            )}
          >
            <div className="flex items-start gap-4">
              <IconTile icon={risk.icon} tone={risk.tone} size="lg" className="bg-surface shadow-soft" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className={cn("font-display text-xl sm:text-2xl font-extrabold tracking-tight", { danger: "text-danger", warning: "text-warning", success: "text-success", info: "text-info" }[risk.tone])}>
                    {tx(risk)}
                  </h2>
                  <ModeBadge mode={result.mode} />
                </div>
                <p className={cn("mt-1.5 text-base text-fg leading-relaxed", lang === "ur" && "urdu")}>{result.summary}</p>
                <ProgressBar value={risk.meter} tone={risk.tone === "danger" ? "danger" : risk.tone === "warning" ? "amber" : "teal"} label="Risk level" className="mt-3.5 max-w-sm h-2.5 shadow-inner" />
                {result.redactions ? (
                  <p className="mt-2.5 flex items-center gap-1.5 text-xs text-muted">
                    <ShieldCheck className="size-3.5 text-success" aria-hidden /> {result.redactions} sensitive number(s) hidden before checking
                  </p>
                ) : null}
              </div>
              <SpeakButton text={speakText} id="shield-result" size="md" />
            </div>
            {result.notice && <Notice tone="warning" className="mt-4 bg-surface/90 border-warning/30">{result.notice}</Notice>}
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            {/* Scam DNA */}
            <Card className="p-4 sm:p-5">
              <Section title="Scam DNA" description={tx({ en: "Words that raised a warning. Tap one to see why.", roman: "Woh alfaaz jin par warning aayi. Tap kar ke wajah dekhein." })}>
                <div className="rounded-xl bg-surface-2 p-4 leading-[2.1]">
                  {dna.segments.map((s, i) =>
                    s.idx === undefined ? (
                      <span key={i}>{s.text}</span>
                    ) : (
                      <button
                        key={i}
                        onClick={() => setFocus(s.idx!)}
                        className={cn("mx-0.5 rounded px-1 py-0.5 font-medium ring-1 transition cursor-pointer", SEV_STYLE[s.sev!].mark, focus === s.idx && "ring-2")}
                      >
                        {s.text}
                        <sup className="ml-0.5 text-[10px] font-bold">{s.idx! + 1}</sup>
                      </button>
                    ),
                  )}
                </div>
                {result.indicators.length === 0 ? (
                  <Notice tone="success" title={tx({ en: "No common warning signs found", roman: "Aam khatre ki nishaniyan nahi milin" })}>
                    {tx({ en: "That isn't a guarantee — verify anything involving money.", roman: "Yeh zamanat nahi — paison ka maamla ho to tasdeeq karein." })}
                  </Notice>
                ) : (
                  <ul className="divide-y divide-line">
                    {result.indicators.map((ind, i) => (
                      <li key={i}>
                        <button
                          onClick={() => setFocus(i)}
                          className={cn("flex w-full items-start gap-3 rounded-lg px-2 py-3 text-left transition-colors cursor-pointer", focus === i ? "bg-primary-soft" : "hover:bg-surface-2")}
                        >
                          <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white", SEV_STYLE[ind.severity].dot)}>{i + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold">{ind.indicator}</span>
                              <Badge tone={SEV_STYLE[ind.severity].badge}>{ind.severity}</Badge>
                              {!dna.found.has(i) && <Badge tone="neutral">{tx({ en: "from screenshot", roman: "screenshot se" })}</Badge>}
                            </span>
                            <span className="mt-0.5 block break-words text-sm italic text-subtle">“{ind.evidence}”</span>
                            <span className={cn("mt-1 block text-sm text-muted", lang === "ur" && "urdu")}>{ind.explanation}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </Section>
            </Card>

            <Card className="space-y-6 p-4 sm:p-5">
              <Section title={tx({ en: "What to do now", roman: "Ab kya karein" })}>
                <StepList tone="success" items={result.safe_actions.map((a, i) => <span key={i} className={cn(lang === "ur" && "urdu")}>{a}</span>)} />
              </Section>

              {result.links.length > 0 && (
                <Section title={tx({ en: "Links in this message", roman: "Is message ke links" })} className="border-t border-line pt-5">
                  <ul className="space-y-3">
                    {result.links.map((l) => (
                      <li key={l.url} className="flex gap-2.5 text-sm">
                        <Link2 className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                        <span className="min-w-0">
                          <span className="block break-all font-mono font-semibold text-danger">{l.domain}</span>
                          <span className="mt-0.5 block text-muted">{l.note}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title={tx({ en: "What HUMRAAH can't know", roman: "HUMRAAH kya nahi jaan sakta" })} className="border-t border-line pt-5">
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                  {result.unknowns.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
                <p className="text-xs text-subtle">{result.confidence_note}</p>
              </Section>
            </Card>
          </div>

          {/* Flagship journey: learn from it */}
          <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
            <IconTile icon={GraduationCap} tone="lavender" />
            <div className="flex-1">
              <p className="font-semibold">{tx({ en: "Practise spotting this trick — safely", roman: "Yeh chaal pehchanne ki mehfooz mashq karein" })}</p>
              <p className="text-sm text-muted">{tx({ en: "A similar fictional message in the Scam Escape Room. Your result updates your score.", roman: "Scam Escape Room mein milta julta farzi message. Nateeja aap ka score update karega." })}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                icon={Wand2}
                onClick={() => {
                  setHandoff("academy", result.practice_scenario ?? "bank-otp");
                  router.push("/academy");
                }}
              >
                {tx({ en: "Enter Scam Escape Room", roman: "Scam Escape Room mein jayein" })}
              </Button>
              <Button
                variant="ghost"
                icon={ExternalLink}
                onClick={() => {
                  setHandoff("assistant", tx({ en: `I received a message that HUMRAAH rated "${tx(risk)}". What should I do?`, roman: `Mujhe aisa message aaya jise HUMRAAH ne "${tx(risk)}" kaha. Main kya karun?` }));
                  router.push("/assistant");
                }}
              >
                {tx({ en: "Ask HUMRAAH about it", roman: "HUMRAAH se poochein" })}
              </Button>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
