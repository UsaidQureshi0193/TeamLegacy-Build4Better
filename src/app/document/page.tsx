"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, CalendarClock, CheckSquare, FileSearch, FileText, Hash, ListChecks, Map, RotateCcw, ShieldAlert, ShieldCheck,
  Square, User, Wallet, type LucideIcon,
} from "lucide-react";
import { ImageDrop } from "@/components/media";
import { Badge, Button, Card, IconTile, ModeBadge, Notice, PageHeader, ProgressBar, SpeakButton, Spinner, cn } from "@/components/ui";
import { postJSON, runOcr, setHandoff } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { recordEvent } from "@/lib/progress";
import { sampleBill } from "@/lib/samples";
import type { DocField, DocumentResult } from "@/lib/types";

const FIELD_STYLE: Record<DocField["kind"], { icon: LucideIcon; tone: "teal" | "warning" | "info" | "lavender" | "neutral" }> = {
  amount: { icon: Wallet, tone: "teal" },
  date: { icon: CalendarClock, tone: "warning" },
  reference: { icon: Hash, tone: "info" },
  name: { icon: User, tone: "lavender" },
  other: { icon: FileText, tone: "neutral" },
};

type Phase = "idle" | "ocr" | "analysing" | "done";

export default function DocumentPage() {
  const router = useRouter();
  const { prefs } = usePrefs();
  const { tx, t } = useT();
  const [image, setImage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DocumentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  const analyse = async (img: string) => {
    setImage(img);
    setError(null);
    setResult(null);
    setDone(new Set());
    setPhase("ocr");
    setProgress(0);
    try {
      const ocr = await runOcr(img, setProgress);
      setPhase("analysing");
      const r = await postJSON<DocumentResult>("/api/document/analyze", { image: img, text: ocr.text, language: prefs.lang });
      setResult(r);
      setPhase("done");
      recordEvent({ kind: "document", skill: "screen-reading", title: "Read a document", hints: 0, completed: true, independent: true, meta: { fields: r.fields.length } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "The document could not be read. Please try again.");
      setPhase("done");
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setPhase("idle");
  };

  const busy = phase === "ocr" || phase === "analysing";
  const urdu = prefs.lang === "ur";
  const isBill = result ? /bill|challan|بل|چالان/i.test(result.doc_type) || result.fields.some((f) => f.kind === "amount") : false;

  return (
    <div>
      <PageHeader
        icon={FileText}
        tone="lavender"
        eyebrow="HUMRAAH Document"
        title={t("nav.document")}
        subtitle={tx({
          en: "Photograph a bill, fee challan, notice or form. I'll pick out the amount, dates and reference numbers and explain hard words.",
          roman: "Bill, fee challan, notice ya form ki tasveer lein. Main raqam, tareekhen aur reference number nikaal kar mushkil alfaaz samjhaunga.",
          ur: "بل، فیس چالان، نوٹس یا فارم کی تصویر لیں۔ میں رقم، تاریخیں اور ریفرنس نمبر نکال کر مشکل الفاظ سمجھاؤں گا۔",
        })}
        actions={image ? <Button variant="secondary" icon={RotateCcw} onClick={reset}>{tx({ en: "Read another", roman: "Doosra parhein", ur: "دوسرا پڑھیں" })}</Button> : undefined}
      />

      <Notice tone="warning" icon={ShieldAlert} className="mb-6" title={tx({ en: "Protect your identity first", roman: "Pehle apni pehchaan mehfooz karein", ur: "پہلے اپنی شناخت محفوظ کریں" })}>
        {tx({
          en: "Cover your CNIC number, card numbers and account numbers before taking the photo. HUMRAAH also hides any it detects, and images are not stored.",
          roman: "Tasveer lene se pehle CNIC, card aur account number dhaanp dein. HUMRAAH bhi jo number pehchaane chhupa deta hai, aur tasveerein save nahi hotin.",
          ur: "تصویر لینے سے پہلے شناختی کارڈ، کارڈ اور اکاؤنٹ نمبر چھپا دیں۔ تصاویر محفوظ نہیں ہوتیں۔",
        })}
      </Notice>

      {!image ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card glow className="p-5 sm:p-7">
            <ImageDrop
              onImage={analyse}
              onSample={() => analyse(sampleBill())}
              sampleLabel={tx({ en: "Try a sample electricity bill", roman: "Sample bijli ka bill", ur: "نمونہ بجلی کا بل" })}
              label={tx({ en: "Upload a document photo", roman: "Document ki tasveer upload karein", ur: "دستاویز کی تصویر اپ لوڈ کریں" })}
              hint={tx({ en: "Take it straight from above, in good light · PNG, JPG or WEBP", roman: "Seedha upar se, achi roshni mein · PNG, JPG ya WEBP", ur: "اوپر سے سیدھی، اچھی روشنی میں" })}
            />
          </Card>
          <Card className="p-5">
            <h2 className="font-display text-base font-bold">{tx({ en: "What I look for", roman: "Main kya dhoondta hoon", ur: "میں کیا ڈھونڈتا ہوں" })}</h2>
            <ul className="mt-3 space-y-3">
              {[
                { icon: Wallet, tone: "teal" as const, en: "Amount to pay", roman: "Kitni raqam deni hai" },
                { icon: CalendarClock, tone: "warning" as const, en: "Due date and late charges", roman: "Aakhri tareekh aur jurmana" },
                { icon: Hash, tone: "info" as const, en: "Reference / consumer number", roman: "Reference / consumer number" },
                { icon: BookOpen, tone: "lavender" as const, en: "Difficult words explained", roman: "Mushkil alfaaz ki wazahat" },
                { icon: ListChecks, tone: "teal" as const, en: "A checklist of what to do", roman: "Kya karna hai ki checklist" },
              ].map((x) => (
                <li key={x.en} className="flex items-center gap-3 text-sm font-semibold">
                  <IconTile icon={x.icon} tone={x.tone} size="sm" /> {tx(x)}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <div className="space-y-4">
            <Card className="p-3">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                <img src={image} alt={tx({ en: "Your document", roman: "Aap ka document", ur: "آپ کی دستاویز" })} className="block max-h-[60vh] w-full rounded-xl object-contain" />
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-navy/45 backdrop-blur-[2px]">
                    <div className="rounded-2xl bg-elevated px-5 py-4 shadow-float">
                      <Spinner label={phase === "ocr" ? tx({ en: "Reading the document…", roman: "Document parh raha hoon…", ur: "دستاویز پڑھ رہا ہوں…" }) : tx({ en: "Understanding it…", roman: "Samajh raha hoon…", ur: "سمجھ رہا ہوں…" })} />
                      {phase === "ocr" && <ProgressBar value={progress * 100} className="mt-3 w-52" label="OCR progress" />}
                    </div>
                  </div>
                )}
              </div>
            </Card>
            {error && (
              <Notice tone="danger">
                {error}{" "}
                <button className="font-bold text-primary underline cursor-pointer" onClick={() => analyse(image)}>{t("common.tryAgain")}</button>
              </Notice>
            )}
          </div>

          {result && (
            <div className="space-y-4 animate-fade-up">
              <Card glow className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="lavender" icon={FileSearch}>{result.doc_type}</Badge>
                  <div className="flex items-center gap-1">
                    <ModeBadge mode={result.mode} />
                    <SpeakButton id="doc-summary" text={result.summary} />
                  </div>
                </div>
                <p dir="auto" className={cn("mt-3 text-[1.05rem] leading-relaxed", urdu && "urdu")}>{result.summary}</p>
                {result.notice && <p className="mt-2 text-xs font-medium text-warning">{result.notice}</p>}
                {!!result.redactions && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-success">
                    <ShieldCheck className="size-3.5" aria-hidden />
                    {tx({ en: `${result.redactions} sensitive number(s) were hidden before analysis.`, roman: `${result.redactions} hassas number(s) chhupa diye gaye.`, ur: `${result.redactions} حساس نمبر چھپا دیے گئے۔` })}
                  </p>
                )}
                {isBill && (
                  <Button
                    className="mt-4"
                    icon={Map}
                    onClick={() => {
                      setHandoff("guide", "electricity-bill");
                      router.push("/guide");
                    }}
                  >
                    {tx({ en: "Learn to pay this bill step by step", roman: "Yeh bill step by step jama karna seekhein", ur: "یہ بل قدم بہ قدم جمع کرنا سیکھیں" })}
                  </Button>
                )}
              </Card>

              {result.fields.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="font-display text-base font-bold">{tx({ en: "Important details", roman: "Aham tafseelat", ur: "اہم تفصیلات" })}</h2>
                    <span className="text-xs font-semibold text-subtle">{tx({ en: "Confirm each on the paper", roman: "Har cheez kaghaz se milayein", ur: "ہر چیز کاغذ سے ملائیں" })}</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.fields.map((f, i) => {
                      const s = FIELD_STYLE[f.kind];
                      return (
                        <Card key={i} className="flex items-center gap-3 p-4">
                          <IconTile icon={s.icon} tone={s.tone} />
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold uppercase tracking-wider text-subtle">{f.label}</p>
                            <p className="break-words font-display text-lg font-bold">{f.value}</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {result.checklist.length > 0 && (
                <Card className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 font-display text-base font-bold">
                      <ListChecks className="size-5 text-primary" aria-hidden /> {tx({ en: "What to do", roman: "Kya karna hai", ur: "کیا کرنا ہے" })}
                    </h2>
                    <span className="text-xs font-semibold text-subtle">{done.size}/{result.checklist.length}</span>
                  </div>
                  <ProgressBar value={(done.size / result.checklist.length) * 100} className="mt-3" label="Checklist progress" />
                  <ul className="mt-3 space-y-2">
                    {result.checklist.map((c, i) => {
                      const checked = done.has(i);
                      return (
                        <li key={i}>
                          <button
                            role="checkbox"
                            aria-checked={checked}
                            onClick={() => setDone((d) => {
                              const n = new Set(d);
                              if (n.has(i)) n.delete(i);
                              else n.add(i);
                              return n;
                            })}
                            className={cn("flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition cursor-pointer", checked ? "border-success/40 bg-success-soft" : "border-line bg-surface-2 hover:border-primary")}
                          >
                            {checked ? <CheckSquare className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <Square className="mt-0.5 size-5 shrink-0 text-subtle" aria-hidden />}
                            <span dir="auto" className={cn("text-sm font-medium", checked && "text-muted line-through")}>{c}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              )}

              {result.terms.length > 0 && (
                <Card className="p-5">
                  <h2 className="flex items-center gap-2 font-display text-base font-bold">
                    <BookOpen className="size-5 text-lavender" aria-hidden /> {tx({ en: "Words explained", roman: "Alfaaz ki wazahat", ur: "الفاظ کی وضاحت" })}
                  </h2>
                  <dl className="mt-3 space-y-3">
                    {result.terms.map((term, i) => (
                      <div key={i} className="rounded-xl bg-surface-2 p-3">
                        <dt className="font-bold">{term.term}</dt>
                        <dd dir="auto" className={cn("mt-0.5 text-sm text-muted", urdu && "urdu")}>{term.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              )}

              {result.warnings.length > 0 && (
                <Notice tone="danger" title={tx({ en: "Please note", roman: "Dhyaan dein", ur: "توجہ دیں" })}>
                  <ul className="list-disc space-y-1 pl-4">{result.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </Notice>
              )}
              {result.limitations.length > 0 && (
                <Notice tone="info" title={tx({ en: "Limits of this reading", roman: "Is jaanch ki hudood", ur: "اس جانچ کی حدود" })}>
                  <ul className="list-disc space-y-1 pl-4">{result.limitations.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </Notice>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
