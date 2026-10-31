"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen, CalendarClock, CheckSquare, FileSearch, FileText, Hash, ListChecks, Map, RotateCcw, ShieldAlert, ShieldCheck,
  Square, User, Wallet, type LucideIcon,
} from "lucide-react";
import { ImageDrop } from "@/components/media";
import { Badge, Button, Card, ModeBadge, Notice, PageHeader, ProgressBar, Section, SpeakButton, Spinner, Stat, cn } from "@/components/ui";
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
    <div className="space-y-8">
      <PageHeader
        icon={FileText}
        tone="lavender"
        title={t("nav.document")}
        subtitle={tx({ en: "Photograph a bill or notice — I'll pick out what matters.", roman: "Bill ya notice ki tasveer lein — main zaroori baatein nikaal dunga.", ur: "بل یا نوٹس کی تصویر لیں — میں اہم باتیں نکال دوں گا۔" })}
        actions={image ? <Button variant="secondary" icon={RotateCcw} onClick={reset}>{tx({ en: "Read another", roman: "Doosra parhein", ur: "دوسرا پڑھیں" })}</Button> : undefined}
      />

      <Notice tone="warning" icon={ShieldAlert}>
        {tx({
          en: "Cover your CNIC, card and account numbers before taking the photo. Images are not stored.",
          roman: "Tasveer se pehle CNIC, card aur account number dhaanp dein. Tasveerein save nahi hotin.",
          ur: "تصویر سے پہلے شناختی کارڈ، کارڈ اور اکاؤنٹ نمبر چھپا دیں۔ تصاویر محفوظ نہیں ہوتیں۔",
        })}
      </Notice>

      {!image ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Card glow className="p-4 sm:p-5">
            <ImageDrop
              onImage={analyse}
              onSample={() => analyse(sampleBill())}
              sampleLabel={tx({ en: "Try a sample electricity bill", roman: "Sample bijli ka bill", ur: "نمونہ بجلی کا بل" })}
              label={tx({ en: "Upload a document photo", roman: "Document ki tasveer upload karein", ur: "دستاویز کی تصویر اپ لوڈ کریں" })}
              hint={tx({ en: "Straight from above, in good light", roman: "Seedha upar se, achi roshni mein", ur: "اوپر سے سیدھی، اچھی روشنی میں" })}
              privacyNote=""
            />
          </Card>
          <Card className="h-fit p-4 sm:p-5">
            <Section title={tx({ en: "What I look for", roman: "Main kya dhoondta hoon", ur: "میں کیا ڈھونڈتا ہوں" })}>
              <ul className="space-y-2.5 text-sm text-muted">
                {[
                  { icon: Wallet, en: "Amount to pay", roman: "Kitni raqam deni hai" },
                  { icon: CalendarClock, en: "Due date and late charges", roman: "Aakhri tareekh aur jurmana" },
                  { icon: Hash, en: "Reference / consumer number", roman: "Reference / consumer number" },
                  { icon: BookOpen, en: "Difficult words explained", roman: "Mushkil alfaaz ki wazahat" },
                  { icon: ListChecks, en: "A checklist of what to do", roman: "Kya karna hai ki checklist" },
                ].map((x) => (
                  <li key={x.en} className="flex items-center gap-2.5">
                    <x.icon className="size-4 shrink-0 text-primary" aria-hidden /> {tx(x)}
                  </li>
                ))}
              </ul>
            </Section>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="space-y-4">
            <Card className="p-3">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                <img src={image} alt={tx({ en: "Your document", roman: "Aap ka document", ur: "آپ کی دستاویز" })} className="block max-h-[60vh] w-full rounded-xl object-contain" />
                {busy && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-navy/40">
                    <div className="rounded-xl bg-elevated px-5 py-4">
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
                <button className="font-semibold text-primary underline cursor-pointer" onClick={() => analyse(image)}>{t("common.tryAgain")}</button>
              </Notice>
            )}
          </div>

          {result && (
            <div className="space-y-6">
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge tone="lavender" icon={FileSearch}>{result.doc_type}</Badge>
                  <div className="flex items-center gap-1">
                    <ModeBadge mode={result.mode} />
                    <SpeakButton id="doc-summary" text={result.summary} />
                  </div>
                </div>
                <p dir="auto" className={cn("mt-3 leading-relaxed", urdu && "urdu")}>{result.summary}</p>
                {result.notice && <p className="mt-2 text-xs text-warning">{result.notice}</p>}
                {!!result.redactions && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                    <ShieldCheck className="size-3.5 text-success" aria-hidden />
                    {tx({ en: `${result.redactions} sensitive number(s) were hidden before analysis.`, roman: `${result.redactions} hassas number(s) chhupa diye gaye.`, ur: `${result.redactions} حساس نمبر چھپا دیے گئے۔` })}
                  </p>
                )}
                {isBill && (
                  <Button
                    className="mt-4"
                    variant="soft"
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
                <Section title={tx({ en: "Important details", roman: "Aham tafseelat", ur: "اہم تفصیلات" })} description={tx({ en: "Confirm each on the paper.", roman: "Har cheez kaghaz se milayein.", ur: "ہر چیز کاغذ سے ملائیں۔" })}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {result.fields.map((f, i) => {
                      const s = FIELD_STYLE[f.kind];
                      return <Stat key={i} icon={s.icon} tone={s.tone} label={f.label} value={<span className="break-words text-lg">{f.value}</span>} />;
                    })}
                  </div>
                </Section>
              )}

              {(result.checklist.length > 0 || result.terms.length > 0) && (
                <Card className="space-y-6 p-4 sm:p-5">
                  {result.checklist.length > 0 && (
                    <Section
                      title={tx({ en: "What to do", roman: "Kya karna hai", ur: "کیا کرنا ہے" })}
                      action={<span className="text-xs text-subtle">{done.size}/{result.checklist.length}</span>}
                    >
                      <ProgressBar value={(done.size / result.checklist.length) * 100} label="Checklist progress" />
                      <ul>
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
                                className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-surface-2 cursor-pointer"
                              >
                                {checked ? <CheckSquare className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <Square className="mt-0.5 size-5 shrink-0 text-subtle" aria-hidden />}
                                <span dir="auto" className={cn("text-sm", checked && "text-muted line-through")}>{c}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </Section>
                  )}

                  {result.terms.length > 0 && (
                    <Section title={tx({ en: "Words explained", roman: "Alfaaz ki wazahat", ur: "الفاظ کی وضاحت" })} className={result.checklist.length > 0 ? "border-t border-line pt-5" : undefined}>
                      <dl className="space-y-3">
                        {result.terms.map((term, i) => (
                          <div key={i}>
                            <dt className="text-sm font-semibold">{term.term}</dt>
                            <dd dir="auto" className={cn("text-sm text-muted", urdu && "urdu")}>{term.meaning}</dd>
                          </div>
                        ))}
                      </dl>
                    </Section>
                  )}
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
