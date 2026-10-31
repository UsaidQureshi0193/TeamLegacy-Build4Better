"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertOctagon, AlertTriangle, Eye, Heading, Info, Keyboard, LifeBuoy, Link2, MousePointerClick, RotateCcw,
  ScanText, ShieldAlert, Tag, Target, type LucideIcon,
} from "lucide-react";
import { ImageDrop } from "@/components/media";
import { Badge, Button, Card, EmptyState, Input, ModeBadge, Notice, PageHeader, ProgressBar, Section, SpeakButton, Spinner, StepList, Textarea, cn } from "@/components/ui";
import { postJSON, runOcr, type OcrResult } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { recordEvent } from "@/lib/progress";
import { samplePortal } from "@/lib/samples";
import type { ElementKind, ExplainResult, RescueResult, ScreenElement, VisionResult } from "@/lib/types";

const KIND_STYLE: Record<ElementKind, { icon: LucideIcon; label: string; text: string; box: string; tone: "teal" | "success" | "warning" | "danger" | "info" | "lavender" | "neutral" }> = {
  button: { icon: MousePointerClick, label: "Buttons", text: "text-primary", box: "border-primary bg-primary/15", tone: "teal" },
  input: { icon: Keyboard, label: "Boxes to fill", text: "text-info", box: "border-info bg-info/15", tone: "info" },
  error: { icon: AlertOctagon, label: "Errors", text: "text-danger", box: "border-danger bg-danger/15", tone: "danger" },
  warning: { icon: AlertTriangle, label: "Warnings", text: "text-warning", box: "border-warning bg-warning/15", tone: "warning" },
  link: { icon: Link2, label: "Links", text: "text-lavender", box: "border-lavender bg-lavender/15", tone: "lavender" },
  heading: { icon: Heading, label: "Titles", text: "text-fg", box: "border-line-strong bg-surface-3/40", tone: "neutral" },
  label: { icon: Tag, label: "Labels", text: "text-muted", box: "border-line-strong bg-surface-3/40", tone: "neutral" },
  info: { icon: Info, label: "Information", text: "text-muted", box: "border-line-strong bg-surface-3/30", tone: "neutral" },
};
const KIND_ORDER: ElementKind[] = ["error", "warning", "button", "input", "link", "heading", "label", "info"];

const SAFE: Record<ExplainResult["safe_to_tap"], { tone: "success" | "warning" | "danger" | "neutral"; en: string; roman: string; ur: string }> = {
  yes: { tone: "success", en: "Safe to tap", roman: "Dabana mehfooz", ur: "دبانا محفوظ ہے" },
  caution: { tone: "warning", en: "Tap with care", roman: "Ehtiyat se dabayein", ur: "احتیاط سے دبائیں" },
  no: { tone: "danger", en: "Don't tap", roman: "Na dabayein", ur: "نہ دبائیں" },
  unknown: { tone: "neutral", en: "Not sure", roman: "Yaqeen nahi", ur: "یقین نہیں" },
};

type Phase = "idle" | "ocr" | "analysing" | "done";

export default function VisionPage() {
  const { prefs } = usePrefs();
  const { tx, t } = useT();
  const [image, setImage] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocr, setOcr] = useState<OcrResult | null>(null);
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScreenElement | null>(null);
  const [explain, setExplain] = useState<ExplainResult | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [rescueOpen, setRescueOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [rescue, setRescue] = useState<RescueResult | null>(null);
  const [rescuing, setRescuing] = useState(false);
  const explainRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setImage(null);
    setPhase("idle");
    setOcr(null);
    setResult(null);
    setError(null);
    setSelected(null);
    setExplain(null);
    setRescue(null);
    setRescueOpen(false);
    setOcrProgress(0);
  };

  const analyse = async (img: string) => {
    setError(null);
    setResult(null);
    setSelected(null);
    setExplain(null);
    setRescue(null);
    setPhase("ocr");
    setOcrProgress(0);
    try {
      const o = await runOcr(img, setOcrProgress, "screen");
      setOcr(o);
      setPhase("analysing");
      const r = await postJSON<VisionResult>("/api/vision/analyze", { image: img, lines: o.lines, language: prefs.lang, question: question || undefined });
      setResult(r);
      setPhase("done");
      recordEvent({ kind: "vision", skill: "screen-reading", title: "Explained a screenshot", hints: 0, completed: true, independent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The screenshot could not be analysed. Please try again.");
      setPhase(ocr ? "done" : "idle");
    }
  };

  const onImage = (img: string) => {
    setImage(img);
    setPhase("idle");
    setResult(null);
    setOcr(null);
    setSelected(null);
    setExplain(null);
    setRescue(null);
  };

  const pointExplain = async (el: ScreenElement) => {
    setSelected(el);
    setExplain(null);
    setExplaining(true);
    requestAnimationFrame(() => explainRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
    try {
      const r = await postJSON<ExplainResult>("/api/vision/explain", { element: el.text, context: ocr?.text ?? "", image, language: prefs.lang });
      setExplain(r);
    } catch (e) {
      setExplain({ explanation: e instanceof Error ? e.message : "Couldn't explain this part.", safe_to_tap: "unknown", tip: "", mode: "demo" });
    } finally {
      setExplaining(false);
    }
  };

  const askRescue = async () => {
    setRescuing(true);
    setRescue(null);
    try {
      const r = await postJSON<RescueResult>("/api/tasks/rescue", { problem, task: "Understanding a screen", step: result?.summary ?? "", image, language: prefs.lang });
      setRescue(r);
    } catch (e) {
      setRescue({ message: e instanceof Error ? e.message : "Please try again.", recovery_steps: [], mode: "demo" });
    } finally {
      setRescuing(false);
    }
  };

  const lineById = useMemo(() => new Map((ocr?.lines ?? []).map((l) => [l.id, l])), [ocr]);
  const boxes = useMemo(
    () => (result?.elements ?? []).filter((e) => e.line_id !== null && lineById.has(e.line_id)),
    [result, lineById],
  );
  const grouped = useMemo(() => {
    const g = new Map<ElementKind, ScreenElement[]>();
    for (const e of result?.elements ?? []) g.set(e.kind, [...(g.get(e.kind) ?? []), e]);
    return KIND_ORDER.filter((k) => g.has(k)).map((k) => ({ kind: k, items: g.get(k)! }));
  }, [result]);

  const busy = phase === "ocr" || phase === "analysing";

  return (
    <div className="space-y-8">
      <PageHeader
        icon={Eye}
        tone="info"
        title={t("nav.vision")}
        subtitle={tx({ en: "Upload a screenshot — I'll explain it, then tap any part.", roman: "Screenshot dalein — main samjhaunga, phir kisi hissay par tap karein.", ur: "اسکرین شاٹ ڈالیں — میں سمجھاؤں گا۔" })}
        actions={image ? <Button variant="secondary" icon={RotateCcw} onClick={reset}>{tx({ en: "New screenshot", roman: "Naya screenshot", ur: "نیا اسکرین شاٹ" })}</Button> : undefined}
      />

      {!image ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <Card glow className="p-4 sm:p-5">
            <ImageDrop
              onImage={onImage}
              onSample={() => onImage(samplePortal())}
              sampleLabel={tx({ en: "Try a sample bill portal", roman: "Sample portal azmayein", ur: "نمونہ پورٹل آزمائیں" })}
              label={tx({ en: "Upload a screenshot", roman: "Screenshot upload karein", ur: "اسکرین شاٹ اپ لوڈ کریں" })}
            />
          </Card>
          <HowItWorks />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <Card className="overflow-hidden p-3 sm:p-4">
              <div dir="ltr" className="relative mx-auto w-fit max-w-full">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                <img src={image} alt={tx({ en: "Your screenshot", roman: "Aap ka screenshot", ur: "آپ کا اسکرین شاٹ" })} className="block max-h-[70vh] w-auto max-w-full rounded-xl" />
                {ocr &&
                  boxes.map((el, i) => {
                    const l = lineById.get(el.line_id!)!;
                    const s = KIND_STYLE[el.kind];
                    const pad = 0.4;
                    const active = selected === el;
                    return (
                      <button
                        key={`${el.line_id}-${i}`}
                        onClick={() => pointExplain(el)}
                        aria-label={`${tx({ en: "Explain", roman: "Samjhayein", ur: "سمجھائیں" })}: ${el.text}`}
                        title={el.text}
                        className={cn(
                          "absolute rounded border-2 transition-colors cursor-pointer focus-visible:outline-offset-1",
                          s.box,
                          active && "ring-2 ring-amber border-amber",
                        )}
                        style={{
                          left: `${Math.max(0, (l.bbox.x0 / ocr.width) * 100 - pad)}%`,
                          top: `${Math.max(0, (l.bbox.y0 / ocr.height) * 100 - pad)}%`,
                          width: `${((l.bbox.x1 - l.bbox.x0) / ocr.width) * 100 + pad * 2}%`,
                          height: `${((l.bbox.y1 - l.bbox.y0) / ocr.height) * 100 + pad * 2}%`,
                        }}
                      />
                    );
                  })}
                {busy && (
                  <>
                    <div className="pointer-events-none absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-lime to-transparent shadow-[0_0_15px_#c6ff00,0_0_30px_#c6ff00] animate-scan-laser z-20" />
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-[2px] z-10">
                      <div className="rounded-2xl border border-white/10 bg-surface/90 px-6 py-5 shadow-float backdrop-blur-md">
                        <Spinner label={phase === "ocr" ? tx({ en: "Reading the text…", roman: "Text parh raha hoon…", ur: "متن پڑھ رہا ہوں…" }) : tx({ en: "Understanding the screen…", roman: "Screen samajh raha hoon…", ur: "اسکرین سمجھ رہا ہوں…" })} />
                        {phase === "ocr" && <ProgressBar value={ocrProgress * 100} className="mt-3 w-52" label={tx({ en: "Reading progress", roman: "Parhne ki progress", ur: "پڑھنے کی پیش رفت" })} />}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {result && boxes.length > 0 && (
                <p className="mt-3 flex items-center justify-center gap-2 text-center text-sm text-muted">
                  <Target className="size-4 text-primary" aria-hidden />
                  {tx({ en: "Tap any highlighted box to ask what it means", roman: "Kisi bhi highlighted box par tap kar ke matlab poochein", ur: "کسی بھی نمایاں خانے پر ٹیپ کریں" })}
                </p>
              )}
            </Card>

            {phase === "idle" && (
              <Card glow className="p-4 sm:p-5">
                <label className="block text-sm font-semibold" htmlFor="vq">{tx({ en: "Anything specific you want to know? (optional)", roman: "Koi khaas sawal? (ikhtiyari)", ur: "کوئی خاص سوال؟ (اختیاری)" })}</label>
                <Input id="vq" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder={tx({ en: "e.g. Where do I type the reference number?", roman: "Jaise: reference number kahan likhun?", ur: "مثلاً: ریفرنس نمبر کہاں لکھوں؟" })} className="mt-2" />
                <Button size="lg" icon={ScanText} className="mt-3 w-full sm:w-auto" onClick={() => analyse(image)}>
                  {tx({ en: "Explain this screen", roman: "Yeh screen samjhayein", ur: "یہ اسکرین سمجھائیں" })}
                </Button>
                <p className="mt-3 text-xs text-subtle">{tx({ en: "Text is read on your device first. The image is not stored.", roman: "Text pehle aap ke device par parha jata hai. Tasveer save nahi hoti.", ur: "متن پہلے آپ کے آلے پر پڑھا جاتا ہے۔ تصویر محفوظ نہیں ہوتی۔" })}</p>
              </Card>
            )}
            {error && (
              <Notice tone="danger" title={tx({ en: "Something went wrong", roman: "Kuch ghalat ho gaya", ur: "کچھ غلط ہو گیا" })}>
                {error}{" "}
                <button className="font-bold text-primary underline cursor-pointer" onClick={() => analyse(image)}>{t("common.tryAgain")}</button>
              </Notice>
            )}
          </div>

          <div className="space-y-4">
            {!result && !busy && phase !== "idle" && !error && <EmptyState icon={Eye} title={tx({ en: "No result yet", roman: "Abhi koi nateeja nahi", ur: "ابھی کوئی نتیجہ نہیں" })} />}
            {result && (
              <>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge tone="info" icon={Eye}>{result.screen_type}</Badge>
                    <div className="flex items-center gap-1">
                      <ModeBadge mode={result.mode} />
                      <SpeakButton id="vision-summary" text={`${result.summary} ${result.next_step}`} />
                    </div>
                  </div>
                  <p dir="auto" className={cn("mt-3 leading-relaxed", prefs.lang === "ur" && "urdu")}>{result.summary}</p>
                  <div className="mt-4 border-t border-line pt-4">
                    <p className="text-sm font-medium text-primary">{tx({ en: "Safe next step", roman: "Agla mehfooz qadam", ur: "اگلا محفوظ قدم" })}</p>
                    <p dir="auto" className={cn("mt-0.5 font-semibold", prefs.lang === "ur" && "urdu")}>{result.next_step}</p>
                  </div>
                  {result.notice && <p className="mt-3 text-xs font-medium text-warning">{result.notice}</p>}
                </Card>

                {result.sensitive_warning && (
                  <Notice tone="warning" icon={ShieldAlert} title={tx({ en: "Sensitive information", roman: "Hassas maloomat", ur: "حساس معلومات" })}>
                    {result.sensitive_warning}
                  </Notice>
                )}

                <div ref={explainRef}>
                  {selected && (
                    <Card className="border-amber/50 p-4 sm:p-5">
                      <p className="text-xs text-subtle">{tx({ en: "Point & Explain", roman: "Point & Explain", ur: "اشارہ کریں اور سمجھیں" })}</p>
                      <p className="mt-0.5 font-semibold">“{selected.text}”</p>
                      {explaining ? (
                        <div className="mt-3"><Spinner label={tx({ en: "Explaining…", roman: "Samjha raha hoon…", ur: "سمجھا رہا ہوں…" })} /></div>
                      ) : explain && (
                        <>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge tone={SAFE[explain.safe_to_tap].tone}>{tx(SAFE[explain.safe_to_tap])}</Badge>
                            <ModeBadge mode={explain.mode} />
                            <SpeakButton id="vision-explain" text={`${explain.explanation} ${explain.tip}`} />
                          </div>
                          <p dir="auto" className={cn("mt-3 leading-relaxed", prefs.lang === "ur" && "urdu")}>{explain.explanation}</p>
                          {explain.tip && (
                            <p dir="auto" className="mt-3 text-sm text-muted">
                              <strong className="text-fg">{tx({ en: "Tip: ", roman: "Mashwara: ", ur: "مشورہ: " })}</strong>{explain.tip}
                            </p>
                          )}
                        </>
                      )}
                    </Card>
                  )}
                </div>

                {grouped.length > 0 && (
                  <Card className="p-4 sm:p-5">
                    <Section title={tx({ en: "What I can see", roman: "Mujhe kya nazar aa raha hai", ur: "مجھے کیا نظر آ رہا ہے" })}>
                    <div className="max-h-[26rem] space-y-4 overflow-y-auto pe-1 scrollbar-thin">
                      {grouped.map(({ kind, items }) => {
                        const s = KIND_STYLE[kind];
                        return (
                          <div key={kind}>
                            <p className={cn("mb-1 flex items-center gap-1.5 text-xs font-semibold", s.text)}>
                              <s.icon className="size-4" aria-hidden /> {s.label} · {items.length}
                            </p>
                            <ul>
                              {items.map((el, i) => (
                                <li key={`${kind}-${i}`}>
                                  <button
                                    onClick={() => pointExplain(el)}
                                    className={cn("w-full rounded-lg px-2.5 py-2 text-start transition-colors cursor-pointer", selected === el ? "bg-warning-soft" : "hover:bg-surface-2")}
                                  >
                                    <span className="block text-sm font-semibold">{el.text}</span>
                                    <span dir="auto" className="mt-0.5 block text-xs text-muted">{el.explanation}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                    </Section>
                  </Card>
                )}

                {result.limitations.length > 0 && (
                  <Notice tone="info" title={tx({ en: "What I can't be sure about", roman: "Jis ka mujhe yaqeen nahi", ur: "جس کا مجھے یقین نہیں" })}>
                    <ul className="list-disc space-y-1 ps-4">
                      {result.limitations.map((l, i) => <li key={i}>{l}</li>)}
                    </ul>
                  </Notice>
                )}

                <Card className="p-4 sm:p-5">
                  {!rescueOpen ? (
                    <Button variant="soft" icon={LifeBuoy} className="w-full" onClick={() => setRescueOpen(true)}>
                      {t("common.stuck")} — Rescue Mode
                    </Button>
                  ) : (
                    <div>
                      <p className="flex items-center gap-2 font-semibold"><LifeBuoy className="size-4.5 text-primary" aria-hidden /> Rescue Mode</p>
                      <label htmlFor="rescue" className="mt-2 block text-sm text-muted">{tx({ en: "What went wrong? (optional)", roman: "Kya ghalat hua? (ikhtiyari)", ur: "کیا غلط ہوا؟ (اختیاری)" })}</label>
                      <Textarea id="rescue" rows={3} value={problem} onChange={(e) => setProblem(e.target.value)} maxLength={800} className="mt-2" placeholder={tx({ en: "e.g. I pressed Continue and it says invalid", roman: "Jaise: Continue dabaya to invalid likha aa gaya", ur: "مثلاً: کنٹینیو دبایا تو غلط لکھا آیا" })} />
                      <Button className="mt-3" icon={LifeBuoy} loading={rescuing} onClick={askRescue}>
                        {tx({ en: "Help me recover", roman: "Wapas raste par layein", ur: "واپس راستے پر لائیں" })}
                      </Button>
                      {rescue && (
                        <div className="mt-4 border-t border-line pt-4">
                          <div className="flex items-center justify-between gap-2">
                            <p dir="auto" className="font-semibold">{rescue.message}</p>
                            <ModeBadge mode={rescue.mode} />
                          </div>
                          <StepList className="mt-3" items={rescue.recovery_steps.map((s, i) => <span key={i} dir="auto">{s}</span>)} />
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              </>
            )}
            {phase === "idle" && <HowItWorks />}
          </div>
        </div>
      )}
    </div>
  );
}

function HowItWorks() {
  const { tx } = useT();
  const steps = [
    { en: "I read the visible text on your device.", roman: "Main aap ke device par text parhta hoon.", ur: "میں آپ کے فون پر نظر آنے والا متن پڑھتا ہوں۔" },
    { en: "I explain what the screen is asking.", roman: "Main batata hoon screen kya keh rahi hai.", ur: "میں بتاتا ہوں کہ اسکرین کیا کہہ رہی ہے۔" },
    { en: "Tap any highlighted part to learn more.", roman: "Kisi highlighted hissay par tap karein.", ur: "مزید جاننے کے لیے کسی نمایاں حصے پر ٹیپ کریں۔" },
    { en: "Stuck? Rescue Mode helps you recover.", roman: "Atak gaye? Rescue Mode madad karega.", ur: "اٹک گئے؟ ریسکیو موڈ مدد کرے گا۔" },
  ];
  return (
    <Card className="h-fit p-4 sm:p-5">
      <Section title={tx({ en: "How it works", roman: "Yeh kaise kaam karta hai", ur: "یہ کیسے کام کرتا ہے" })}>
        <StepList items={steps.map((st) => <span key={st.en} className="text-muted">{tx(st)}</span>)} />
        <p className="text-xs text-subtle">
          {tx({ en: "I only describe what is visible and say when I'm unsure.", roman: "Main sirf nazar aane wali cheez batata hoon, aur shak ho to bata deta hoon.", ur: "میں صرف نظر آنے والی چیز بتاتا ہوں۔" })}
        </p>
      </Section>
    </Card>
  );
}
