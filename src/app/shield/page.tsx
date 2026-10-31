"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertOctagon, CheckCircle2, CircleHelp, Dna, ExternalLink, GraduationCap, Image as ImageIcon, Link2, LifeBuoy, MessageSquareText,
  QrCode, RotateCcw, ScanText, ShieldAlert, ShieldCheck, Sparkles, Wand2,
} from "lucide-react";
import { ImageDrop, VoiceMic } from "@/components/media";
import { Badge, Button, Card, IconTile, ModeBadge, Notice, PageHeader, ProgressBar, Segmented, SpeakButton, Spinner, Textarea, cn } from "@/components/ui";
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
    <div>
      <PageHeader
        icon={ShieldAlert}
        tone="danger"
        eyebrow="HUMRAAH Shield"
        title={tx({ en: "Scam Shield", roman: "Scam Shield", ur: "اسکیم شیلڈ" })}
        subtitle={tx({
          en: "Got a strange SMS, WhatsApp, email or QR code? HUMRAAH shows you exactly which parts look risky — and what to do next.",
          roman: "Ajeeb SMS, WhatsApp, email ya QR code aaya? HUMRAAH dikhata hai kaunsa hissa khatarnaak hai — aur ab kya karein.",
        })}
        actions={result && <Button variant="secondary" icon={RotateCcw} onClick={reset}>{tx({ en: "Check another", roman: "Doosra check karein" })}</Button>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card glow className="p-5 sm:p-6">
          <Segmented<Tab>
            label="Input type"
            value={tab}
            onChange={(v) => {
              setTab(v);
              setError(null);
            }}
            options={[
              { value: "text", label: tx({ en: "Paste message", roman: "Message paste" }), icon: MessageSquareText },
              { value: "image", label: tx({ en: "Screenshot", roman: "Screenshot" }), icon: ImageIcon },
              { value: "qr", label: tx({ en: "QR code", roman: "QR code" }), icon: QrCode },
            ]}
            className="mb-5"
          />

          {tab === "text" && (
            <div className="space-y-4">
              <Textarea
                rows={6}
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
                <Button variant="secondary" icon={Sparkles} onClick={() => setText(SAMPLE_SMS_TEXT)}>
                  {tx({ en: "Use fictional sample", roman: "Farzi namoona" })}
                </Button>
              </div>
              <details className="rounded-2xl border border-line bg-surface-2 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-muted">{tx({ en: "Or say it out loud — read the message to me", roman: "Ya bol kar sunayein — message parh kar batayein" })}</summary>
                <div className="pt-4">
                  <VoiceMic size="md" onTranscript={(t) => setText((prev) => (prev ? `${prev} ${t}` : t))} />
                </div>
              </details>
            </div>
          )}

          {tab === "image" && (
            <div className="space-y-4">
              {!image ? (
                <ImageDrop onImage={onImage} onSample={() => onImage(sampleScamSms())} sampleLabel={tx({ en: "Try fictional SMS", roman: "Farzi SMS try karein" })} />
              ) : (
                <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt="Uploaded screenshot" className="max-h-80 w-full rounded-2xl border border-line object-contain bg-surface-2" />
                  <div className="space-y-3">
                    {ocrState.busy ? (
                      <div className="space-y-2 pt-2">
                        <Spinner label={tx({ en: "Reading the text in your screenshot…", roman: "Screenshot ka text parha ja raha hai…" })} />
                        <ProgressBar value={ocrState.progress * 100} label="OCR progress" />
                        <p className="text-xs text-subtle">{tx({ en: "Text is read on your device.", roman: "Text aap ke device par parha ja raha hai." })}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <p className="flex items-center gap-2 text-sm font-bold"><ScanText className="size-4 text-primary" /> {tx({ en: "Text found — please check & correct", roman: "Mila hua text — check aur durust karein" })}</p>
                          {ocrState.confidence !== undefined && <Badge tone={ocrState.confidence > 70 ? "success" : "warning"}>{ocrState.confidence}% clear</Badge>}
                        </div>
                        <Textarea rows={6} value={text} onChange={(e) => setText(e.target.value)} aria-label="Extracted text" />
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
            <div className="space-y-4">
              <Notice tone="info" title={tx({ en: "QR Guard", roman: "QR Guard" })}>
                {tx({
                  en: "HUMRAAH decodes the QR code on your device and shows where it leads — it never opens the link or starts a payment.",
                  roman: "HUMRAAH QR code ko aap ke device par parh kar dikhata hai ke yeh kahan le jata hai — link khud nahi kholta na payment shuru karta hai.",
                })}
              </Notice>
              <ImageDrop onImage={onQr} label={tx({ en: "Upload a photo of the QR code", roman: "QR code ki tasveer upload karein" })} privacyNote="" compact />
              {qr && (
                <div className="rounded-2xl border border-line bg-surface-2 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-subtle">{tx({ en: "This QR code contains", roman: "Is QR code mein yeh hai" })}</p>
                  <p className="mt-1 break-all font-mono text-sm">{qr.content}</p>
                  <p className="mt-2 text-xs text-muted">{tx({ en: "Not opened. Compare it with the shop or company name before paying.", roman: "Khola nahi gaya. Payment se pehle dukaan ya company ke naam se milayein." })}</p>
                </div>
              )}
            </div>
          )}

          {error && <Notice tone="danger" className="mt-4">{error}</Notice>}
          {loading && <div className="mt-5"><Spinner label={tx({ en: "Looking for warning signs…", roman: "Khatre ki nishaniyan dhoondi ja rahi hain…" })} /></div>}
        </Card>

        <aside className="space-y-4">
          <Card className="p-5">
            <p className="font-display font-bold">{tx({ en: "The 3 golden rules", roman: "3 sunehri usool" })}</p>
            <ol className="mt-3 space-y-3 text-sm">
              {[
                { en: "Never share an OTP, PIN or password — with anyone.", roman: "OTP, PIN ya password kabhi kisi ko na batayein." },
                { en: "Don't tap links in unexpected messages. Open the official app yourself.", roman: "Ghair mutawaqqa message ke link na kholein. Official app khud kholein." },
                { en: "Verify by calling the number on your card or bill — not the one in the message.", roman: "Card ya bill wale number par call kar ke tasdeeq karein — message wale par nahi." },
              ].map((r, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{i + 1}</span>
                  <span className="text-muted">{tx(r)}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <IconTile icon={LifeBuoy} tone="danger" />
              <div>
                <p className="font-bold">{tx({ en: "Already shared a code or sent money?", roman: "Code bata diya ya paise bhej diye?" })}</p>
                <p className="mt-1 text-sm text-muted">{tx({ en: "Act now — every minute matters.", roman: "Abhi qadam uthayein — har minute qeemti hai." })}</p>
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setHandoff("emergency", "shared-otp");
                    router.push("/emergency");
                  }}
                >
                  {tx({ en: "Open Emergency Help", roman: "Emergency Help kholein" })}
                </Button>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      {result && risk && dna && (
        <section ref={resultRef} className="mt-8 scroll-mt-28 space-y-6 animate-fade-up" aria-live="polite">
          {/* Risk verdict */}
          <Card glow className="overflow-hidden">
            <div className={cn("flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6", risk.tone === "danger" ? "bg-danger-soft" : risk.tone === "warning" ? "bg-warning-soft" : risk.tone === "success" ? "bg-success-soft" : "bg-info-soft")}>
              <IconTile icon={risk.icon} tone={risk.tone} size="lg" className="bg-surface" />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={cn("text-2xl font-extrabold", { danger: "text-danger", warning: "text-warning", success: "text-success", info: "text-info" }[risk.tone])}>{tx(risk)}</h2>
                  <ModeBadge mode={result.mode} />
                  {result.redactions ? <Badge tone="lavender" icon={ShieldCheck}>{result.redactions} sensitive number(s) hidden</Badge> : null}
                </div>
                <p className={cn("mt-1.5 text-base text-fg", lang === "ur" && "urdu")}>{result.summary}</p>
                <div className="mt-3 max-w-md">
                  <ProgressBar value={risk.meter} tone={risk.tone === "danger" ? "danger" : risk.tone === "warning" ? "amber" : "teal"} label="Risk level" />
                  <div className="mt-1 flex justify-between text-[11px] font-semibold text-subtle"><span>Low</span><span>Medium</span><span>High</span></div>
                </div>
              </div>
              <SpeakButton text={speakText} id="shield-result" size="md" className="self-start" />
            </div>
            {result.notice && <Notice tone="warning" className="m-5 mt-0 sm:m-6 sm:mt-0">{result.notice}</Notice>}
          </Card>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            {/* Scam DNA */}
            <Card className="p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <IconTile icon={Dna} tone="lavender" />
                <div>
                  <h3 className="text-lg font-bold">Scam DNA</h3>
                  <p className="text-sm text-muted">{tx({ en: "The exact words that raised a warning. Tap a highlight.", roman: "Woh alfaaz jin par warning aayi. Highlight par tap karein." })}</p>
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-surface-2 p-4 text-[1.02rem] leading-[2.1]">
                {dna.segments.map((s, i) =>
                  s.idx === undefined ? (
                    <span key={i}>{s.text}</span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setFocus(s.idx!)}
                      className={cn("mx-0.5 rounded-md px-1 py-0.5 font-semibold ring-1 transition cursor-pointer", SEV_STYLE[s.sev!].mark, focus === s.idx && "ring-2")}
                    >
                      {s.text}
                      <sup className="ml-0.5 text-[10px] font-bold">{s.idx! + 1}</sup>
                    </button>
                  ),
                )}
              </div>
              {result.indicators.length === 0 ? (
                <Notice tone="success" className="mt-4" title={tx({ en: "No common warning signs found", roman: "Aam khatre ki nishaniyan nahi milin" })}>
                  {tx({ en: "That isn't a guarantee. If money or personal details are involved, verify with the organisation directly.", roman: "Yeh zamanat nahi. Paise ya zaati maloomat ka maamla ho to idare se khud tasdeeq karein." })}
                </Notice>
              ) : (
                <ul className="mt-5 space-y-3">
                  {result.indicators.map((ind, i) => (
                    <li key={i}>
                      <button
                        onClick={() => setFocus(i)}
                        className={cn("w-full rounded-2xl border p-4 text-left transition cursor-pointer", focus === i ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-line-strong")}
                      >
                        <div className="flex items-start gap-3">
                          <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white", SEV_STYLE[ind.severity].dot)}>{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold">{ind.indicator}</p>
                              <Badge tone={SEV_STYLE[ind.severity].badge}>{ind.severity}</Badge>
                              {!dna.found.has(i) && <Badge tone="neutral">{tx({ en: "from screenshot", roman: "screenshot se" })}</Badge>}
                            </div>
                            <p className="mt-1 break-words text-sm italic text-subtle">“{ind.evidence}”</p>
                            <p className={cn("mt-1.5 text-sm text-muted", lang === "ur" && "urdu")}>{ind.explanation}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <div className="space-y-6">
              <Card className="p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <IconTile icon={CheckCircle2} tone="success" />
                  <h3 className="text-lg font-bold">{tx({ en: "What to do now", roman: "Ab kya karein" })}</h3>
                </div>
                <ol className="space-y-2.5">
                  {result.safe_actions.map((a, i) => (
                    <li key={i} className="flex gap-3 rounded-xl bg-surface-2 p-3 text-sm">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-xs font-bold text-success">{i + 1}</span>
                      <span className={cn(lang === "ur" && "urdu")}>{a}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              {result.links.length > 0 && (
                <Card className="p-5 sm:p-6">
                  <div className="mb-3 flex items-center gap-3">
                    <IconTile icon={Link2} tone="warning" />
                    <h3 className="text-lg font-bold">{tx({ en: "Links in this message", roman: "Is message ke links" })}</h3>
                  </div>
                  <ul className="space-y-3">
                    {result.links.map((l) => (
                      <li key={l.url} className="rounded-xl border border-line p-3">
                        <p className="break-all font-mono text-sm font-semibold text-danger">{l.domain}</p>
                        <p className="mt-0.5 break-all text-xs text-subtle">{l.url}</p>
                        <p className="mt-1.5 text-sm text-muted">{l.note}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              <Card className="p-5 sm:p-6">
                <div className="mb-3 flex items-center gap-3">
                  <IconTile icon={CircleHelp} tone="info" />
                  <h3 className="text-lg font-bold">{tx({ en: "What HUMRAAH can't know", roman: "HUMRAAH kya nahi jaan sakta" })}</h3>
                </div>
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
                  {result.unknowns.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
                <p className="mt-4 rounded-xl bg-surface-2 p-3 text-xs text-subtle">{result.confidence_note}</p>
              </Card>
            </div>
          </div>

          {/* Flagship journey: learn from it */}
          <Card glow className="hero-gradient overflow-hidden p-6 text-white sm:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex-1">
                <Badge className="bg-white/15 text-white" icon={GraduationCap}>{tx({ en: "Learn from this", roman: "Is se seekhein" })}</Badge>
                <h3 className="mt-3 text-2xl font-extrabold text-white">{tx({ en: "Practise spotting this trick — safely", roman: "Yeh chaal pehchanne ki mehfooz mashq karein" })}</h3>
                <p className="mt-2 max-w-xl text-white/75">
                  {tx({
                    en: "Enter the Scam Escape Room with a similar, fictional message. Find the clues yourself and choose the safe response — your result updates your Digital Independence Score.",
                    roman: "Milte julte farzi message ke saath Scam Escape Room mein jayein. Khud nishaniyan dhoondein aur mehfooz jawab chunein — nateeja aap ka Digital Independence Score update karega.",
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
                <button
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-2xl bg-white px-6 font-semibold text-[#0B1422] transition hover:bg-white/90 active:scale-[0.98] cursor-pointer"
                  onClick={() => {
                    setHandoff("academy", result.practice_scenario ?? "bank-otp");
                    router.push("/academy");
                  }}
                >
                  <Wand2 className="size-5" aria-hidden />
                  {tx({ en: "Enter Scam Escape Room", roman: "Scam Escape Room mein jayein" })}
                </button>
                <button
                  className="inline-flex h-13 items-center justify-center gap-2.5 rounded-2xl border border-white/25 px-6 font-semibold text-white transition hover:bg-white/10 cursor-pointer"
                  onClick={() => {
                    setHandoff("assistant", tx({ en: `I received a message that HUMRAAH rated "${tx(risk)}". What should I do?`, roman: `Mujhe aisa message aaya jise HUMRAAH ne "${tx(risk)}" kaha. Main kya karun?` }));
                    router.push("/assistant");
                  }}
                >
                  <ExternalLink className="size-5" aria-hidden />
                  {tx({ en: "Ask HUMRAAH about it", roman: "HUMRAAH se poochein" })}
                </button>
              </div>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
