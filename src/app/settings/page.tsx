"use client";

import { useState } from "react";
import { Mic, Moon, Settings, ShieldCheck, Sun, Trash2, Volume2 } from "lucide-react";
import { Toggle } from "@/components/shell";
import { Badge, Button, Card, Input, ModeBadge, PageHeader, Section, Segmented, StepList, useAiStatus } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useSpeaker, useSpeechSupport } from "@/lib/speech";
import type { Lang } from "@/lib/types";

/** One settings line: label (and optional hint) on the start side, control on the end side. */
function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const PRIVACY_POINTS = [
  {
    en: "Preferences and progress are stored only on this device.",
    roman: "Preferences aur progress sirf is device par hoti hain.",
    ur: "ترجیحات اور پیش رفت صرف اسی آلے پر محفوظ ہوتی ہیں۔",
  },
  {
    en: "Screenshots and documents are not stored. Card and CNIC numbers are masked before AI.",
    roman: "Screenshots aur documents save nahi hote. AI se pehle card aur CNIC chhupa diye jate hain.",
    ur: "اسکرین شاٹ اور دستاویزات محفوظ نہیں ہوتیں۔ AI سے پہلے کارڈ اور CNIC نمبر چھپا دیے جاتے ہیں۔",
  },
  {
    en: "Never asks for passwords, PINs or OTPs. Voice is not recorded.",
    roman: "Kabhi password, PIN ya OTP nahi maangta. Awaz record nahi hoti.",
    ur: "کبھی پاس ورڈ، PIN یا OTP نہیں مانگتا۔ آواز ریکارڈ نہیں ہوتی۔",
  },
];

export default function SettingsPage() {
  const { prefs, update } = usePrefs();
  const { tx } = useT();
  const status = useAiStatus();
  const { stt, tts } = useSpeechSupport();
  const { speak, stop, speaking } = useSpeaker();
  const [cleared, setCleared] = useState(false);

  const testVoice = () => {
    if (speaking) return stop();
    speak(
      tx({
        en: "Hello! I am HUMRAAH, your digital companion. I will speak at this speed.",
        roman: "Assalam o Alaikum! Main HUMRAAH hoon, aap ka digital humsafar. Main is raftaar se bolunga.",
        ur: "السلام علیکم! میں ہمراہ ہوں، آپ کا ڈیجیٹل ساتھی۔ میں اسی رفتار سے بولوں گا۔",
      }),
      "settings-test",
    );
  };

  const clearAll = () => {
    const ok = window.confirm(
      tx({
        en: "Delete all HUMRAAH data on this device (preferences and progress)? This cannot be undone.",
        roman: "Is device se HUMRAAH ka saara data (preferences aur progress) delete kar dein? Yeh wapas nahi hoga.",
        ur: "کیا اس آلے سے ہمراہ کا تمام ڈیٹا (ترجیحات اور پیش رفت) مٹا دیں؟ یہ واپس نہیں ہو سکے گا۔",
      }),
    );
    if (!ok) return;
    try {
      for (const store of [localStorage, sessionStorage]) {
        Object.keys(store).filter((k) => k.startsWith("humraah.")).forEach((k) => store.removeItem(k));
      }
    } catch {
      /* storage unavailable */
    }
    setCleared(true);
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        icon={Settings}
        tone="info"
        title={tx({ en: "Settings", roman: "Settings", ur: "ترتیبات" })}
        subtitle={tx({ en: "Make HUMRAAH comfortable for you.", roman: "HUMRAAH ko apne liye aaraamdeh banayein.", ur: "ہمراہ کو اپنے لیے آرام دہ بنائیں۔" })}
      />

      <Section title={tx({ en: "General", roman: "Aam", ur: "عام" })}>
        <Card className="divide-y divide-line">
          <Row label={tx({ en: "Your name", roman: "Aap ka naam", ur: "آپ کا نام" })} hint={tx({ en: "Only used to greet you.", roman: "Sirf salam ke liye.", ur: "صرف آپ کو سلام کرنے کے لیے۔" })}>
            <Input
              value={prefs.name}
              maxLength={40}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={tx({ en: "e.g. Abu", roman: "jaise Abu", ur: "مثلاً ابو" })}
              autoComplete="nickname"
              className="h-10 sm:w-56"
            />
          </Row>
          <Row label={tx({ en: "Language", roman: "Zabaan", ur: "زبان" })}>
            <Segmented<Lang>
              label={tx({ en: "Language", roman: "Zabaan", ur: "زبان" })}
              value={prefs.lang}
              onChange={(v) => update({ lang: v })}
              options={[
                { value: "en", label: "English" },
                { value: "roman", label: "Roman Urdu" },
                { value: "ur", label: "اردو" },
              ]}
            />
          </Row>
          <Row label={tx({ en: "Theme", roman: "Theme", ur: "تھیم" })}>
            <Segmented<"light" | "dark">
              label={tx({ en: "Theme", roman: "Theme", ur: "تھیم" })}
              value={prefs.theme}
              onChange={(v) => update({ theme: v })}
              options={[
                { value: "light", label: tx({ en: "Light", roman: "Roshan", ur: "روشن" }), icon: Sun },
                { value: "dark", label: tx({ en: "Dark", roman: "Andhera", ur: "گہرا" }), icon: Moon },
              ]}
            />
          </Row>
        </Card>
      </Section>

      <Section title={tx({ en: "Accessibility & voice", roman: "Aasaani aur awaz", ur: "آسانی اور آواز" })}>
        <Card className="divide-y divide-line">
          <Toggle
            className="px-4 py-3"
            label={tx({ en: "Elder Mode", roman: "Elder Mode", ur: "بزرگ موڈ" })}
            description={tx({ en: "Bigger text and buttons.", roman: "Bara text aur buttons.", ur: "بڑا متن اور بڑے بٹن۔" })}
            checked={prefs.elder}
            onChange={(v) => update({ elder: v })}
          />
          <Toggle
            className="px-4 py-3"
            label={tx({ en: "Reduce motion", roman: "Harkat kam karein", ur: "حرکت کم کریں" })}
            description={tx({ en: "Turns off animations.", roman: "Animations band.", ur: "اینیمیشن بند۔" })}
            checked={prefs.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
          />
          <Toggle
            className="px-4 py-3"
            label={tx({ en: "Read answers aloud", roman: "Jawab parh kar sunayein", ur: "جواب پڑھ کر سنائیں" })}
            checked={prefs.autoSpeak}
            onChange={(v) => update({ autoSpeak: v })}
          />
          <Row label={tx({ en: "Speaking speed", roman: "Bolne ki raftaar", ur: "بولنے کی رفتار" })} hint={`${prefs.voiceRate.toFixed(2)}×`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.6}
                max={1.3}
                step={0.05}
                value={prefs.voiceRate}
                onChange={(e) => update({ voiceRate: Number(e.target.value) })}
                className="h-8 w-40 cursor-pointer accent-[var(--primary)]"
                aria-label={tx({ en: "Speaking speed", roman: "Bolne ki raftaar", ur: "بولنے کی رفتار" })}
              />
              <Button variant="secondary" size="sm" icon={Volume2} onClick={testVoice} disabled={!tts && prefs.lang === "en"}>
                {speaking ? tx({ en: "Stop", roman: "Rokein", ur: "روکیں" }) : tx({ en: "Test", roman: "Test", ur: "آزمائیں" })}
              </Button>
            </div>
          </Row>
          <div className="flex flex-wrap gap-2 p-4">
            <Badge tone={stt ? "success" : "warning"} icon={Mic}>
              {stt
                ? tx({ en: "Voice input works", roman: "Awaz input chalta hai", ur: "آواز سے لکھنا کام کرتا ہے" })
                : tx({ en: "No voice input — use Chrome/Edge", roman: "Awaz input nahi — Chrome/Edge", ur: "آواز سے لکھنا دستیاب نہیں — Chrome یا Edge استعمال کریں" })}
            </Badge>
            <Badge tone={tts ? "success" : "warning"} icon={Volume2}>
              {tts
                ? tx({ en: "Read-aloud works", roman: "Parh kar sunana chalta hai", ur: "پڑھ کر سنانا کام کرتا ہے" })
                : tx({ en: "No read-aloud", roman: "Parh kar sunana nahi", ur: "پڑھ کر سنانا دستیاب نہیں" })}
            </Badge>
          </div>
        </Card>
      </Section>

      <Section title={tx({ en: "AI engine", roman: "AI engine", ur: "AI انجن" })}>
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {status ? <ModeBadge mode={status.mode} /> : <Badge>…</Badge>}
            {status?.provider && <span className="text-sm text-muted" dir="ltr">{status.provider} · {status.model}</span>}
          </div>
          {status?.mode === "live" ? (
            <p className="mt-3 text-sm text-muted">
              {tx({ en: "Live AI is on. Answers are checked by HUMRAAH's safety rules.", roman: "Live AI on hai. Jawab HUMRAAH ke safety rules check karte hain.", ur: "لائیو AI چل رہی ہے۔ جوابات ہمراہ کے حفاظتی اصول جانچتے ہیں۔" })}
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted">
                {tx({ en: "Demo Mode uses HUMRAAH's built-in safety rules. To turn on live AI:", roman: "Demo Mode HUMRAAH ke built-in rules istemal karta hai. Live AI on karne ke liye:", ur: "ڈیمو موڈ ہمراہ کے اندرونی حفاظتی اصول استعمال کرتا ہے۔ لائیو AI چلانے کے لیے:" })}
              </p>
              <StepList
                className="mt-3"
                items={[
                  tx({ en: "Create a file named .env.local in the project folder.", roman: "Project folder mein .env.local file banayein.", ur: "پروجیکٹ فولڈر میں .env.local نام کی فائل بنائیں۔" }),
                  tx({
                    en: "Add GEMINI_API_KEY=… (free key from aistudio.google.com) or ANTHROPIC_API_KEY=… with your key.",
                    roman: "Us mein GEMINI_API_KEY=… (aistudio.google.com se free key) ya ANTHROPIC_API_KEY=… apni key ke saath likhein.",
                    ur: "اس میں GEMINI_API_KEY=… (aistudio.google.com سے مفت key) یا ANTHROPIC_API_KEY=… اپنی key کے ساتھ لکھیں۔",
                  }),
                  tx({ en: "Restart the server (npm run dev).", roman: "Server dobara chalayein (npm run dev).", ur: "سرور دوبارہ چلائیں (npm run dev)۔" }),
                ]}
              />
              <p className="mt-3 text-xs text-subtle">
                {tx({ en: "Keys stay on the server, never in the browser.", roman: "Keys server par rehti hain, browser mein kabhi nahi.", ur: "Keys سرور پر رہتی ہیں، براؤزر میں کبھی نہیں۔" })}
              </p>
            </>
          )}
        </Card>
      </Section>

      <Section title={tx({ en: "Privacy & your data", roman: "Privacy aur aap ka data", ur: "پرائیویسی اور آپ کا ڈیٹا" })}>
        <Card className="p-5">
          <ul className="space-y-2.5 text-sm">
            {PRIVACY_POINTS.map((x, i) => (
              <li key={i} className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>{tx(x)}</span>
              </li>
            ))}
          </ul>
          <Button variant="danger" size="sm" icon={Trash2} className="mt-4" onClick={clearAll} disabled={cleared}>
            {tx({ en: "Clear all my data", roman: "Mera saara data mitayein", ur: "میرا تمام ڈیٹا مٹائیں" })}
          </Button>
        </Card>
      </Section>

      <Section title={tx({ en: "About", roman: "Baare mein", ur: "تعارف" })}>
        <Card className="space-y-2 p-5 text-sm">
          <p className="font-medium italic">{tx({ en: "Samjhay bhi. Sikhaye bhi. Hifazat bhi kare.", roman: "Samjhay bhi. Sikhaye bhi. Hifazat bhi kare.", ur: "سمجھائے بھی۔ سکھائے بھی۔ حفاظت بھی کرے۔" })}</p>
          <p className="text-muted">
            {tx({
              en: "HUMRAAH is a guidance and learning companion — not a bank, authority or fraud-verification service. AI can make mistakes; verify important things with the official provider.",
              roman: "HUMRAAH rehnumai aur seekhne ka saathi hai — bank, idara ya fraud tasdeeq ki service nahi. AI ghalti kar sakta hai; zaroori baatein official idare se tasdeeq karein.",
              ur: "ہمراہ رہنمائی اور سیکھنے کا ساتھی ہے — بینک، سرکاری ادارہ یا دھوکے کی تصدیق کی سروس نہیں۔ AI غلطی کر سکتی ہے؛ اہم باتوں کی تصدیق متعلقہ ادارے سے کریں۔",
            })}
          </p>
          <p className="text-xs text-subtle">
            <span dir="ltr">Anthropic Claude · Google Gemini · Tesseract.js · Web Speech API · Lucide · Recharts · Next.js · Tailwind CSS.</span>{" "}
            {tx({ en: "All practice data is fictional.", roman: "Tamam practice data farzi hai.", ur: "تمام مشقی ڈیٹا فرضی ہے۔" })}
          </p>
        </Card>
      </Section>
    </div>
  );
}
