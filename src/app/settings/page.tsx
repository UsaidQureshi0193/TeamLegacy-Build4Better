"use client";

import { useState } from "react";
import { Mic, Moon, Settings, ShieldCheck, Sun, Trash2, Volume2 } from "lucide-react";
import { Toggle } from "@/components/shell";
import { Badge, Button, Card, Input, ModeBadge, PageHeader, Section, Segmented, StepList, useAiStatus } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useSpeaker, useSpeechSupport } from "@/lib/speech";
import type { Lang } from "@/lib/types";

/** One settings line: label (and optional hint) on the left, control on the right. */
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
  { en: "Preferences and progress are stored only on this device.", roman: "Preferences aur progress sirf is device par hoti hain." },
  { en: "Screenshots and documents are not stored. Card and CNIC numbers are masked before AI.", roman: "Screenshots aur documents save nahi hote. AI se pehle card aur CNIC chhupa diye jate hain." },
  { en: "Never asks for passwords, PINs or OTPs. Voice is not recorded.", roman: "Kabhi password, PIN ya OTP nahi maangta. Awaz record nahi hoti." },
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
        ur: "السلام علیکم! میں ہمراہ ہوں، آپ کا ڈیجیٹل ساتھی۔",
      }),
      "settings-test",
    );
  };

  const clearAll = () => {
    if (!window.confirm(tx({ en: "Delete all HUMRAAH data on this device (preferences and progress)? This cannot be undone.", roman: "Is device se HUMRAAH ka saara data (preferences aur progress) delete kar dein? Yeh wapas nahi hoga." }))) return;
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
        subtitle={tx({ en: "Make HUMRAAH comfortable for you.", roman: "HUMRAAH ko apne liye aaraamdeh banayein." })}
      />

      <Section title={tx({ en: "General", roman: "Aam" })}>
        <Card className="divide-y divide-line">
          <Row label={tx({ en: "Your name", roman: "Aap ka naam" })} hint={tx({ en: "Only used to greet you.", roman: "Sirf salam ke liye." })}>
            <Input value={prefs.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Abu" autoComplete="nickname" className="h-10 sm:w-56" />
          </Row>
          <Row label={tx({ en: "Language", roman: "Zabaan", ur: "زبان" })}>
            <Segmented<Lang>
              label="Language"
              value={prefs.lang}
              onChange={(v) => update({ lang: v })}
              options={[
                { value: "en", label: "English" },
                { value: "roman", label: "Roman Urdu" },
                { value: "ur", label: "اردو" },
              ]}
            />
          </Row>
          <Row label={tx({ en: "Theme", roman: "Theme" })}>
            <Segmented<"light" | "dark">
              label="Theme"
              value={prefs.theme}
              onChange={(v) => update({ theme: v })}
              options={[
                { value: "light", label: tx({ en: "Light", roman: "Roshan" }), icon: Sun },
                { value: "dark", label: tx({ en: "Dark", roman: "Andhera" }), icon: Moon },
              ]}
            />
          </Row>
        </Card>
      </Section>

      <Section title={tx({ en: "Accessibility & voice", roman: "Aasaani aur awaz" })}>
        <Card className="divide-y divide-line">
          <div className="px-4 py-2">
            <Toggle label={tx({ en: "Elder Mode", roman: "Elder Mode" })} description={tx({ en: "Bigger text and buttons.", roman: "Bara text aur buttons." })} checked={prefs.elder} onChange={(v) => update({ elder: v })} />
          </div>
          <div className="px-4 py-2">
            <Toggle label={tx({ en: "Reduce motion", roman: "Harkat kam karein" })} description={tx({ en: "Turns off animations.", roman: "Animations band." })} checked={prefs.reduceMotion} onChange={(v) => update({ reduceMotion: v })} />
          </div>
          <div className="px-4 py-2">
            <Toggle label={tx({ en: "Read answers aloud", roman: "Jawab parh kar sunayein" })} checked={prefs.autoSpeak} onChange={(v) => update({ autoSpeak: v })} />
          </div>
          <Row label={tx({ en: "Speaking speed", roman: "Bolne ki raftaar" })} hint={`${prefs.voiceRate.toFixed(2)}×`}>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0.6}
                max={1.3}
                step={0.05}
                value={prefs.voiceRate}
                onChange={(e) => update({ voiceRate: Number(e.target.value) })}
                className="h-8 w-40 cursor-pointer accent-[var(--primary)]"
                aria-label="Speaking speed"
              />
              <Button variant="secondary" size="sm" icon={Volume2} onClick={testVoice} disabled={!tts}>
                {speaking ? tx({ en: "Stop", roman: "Rokein" }) : tx({ en: "Test", roman: "Test" })}
              </Button>
            </div>
          </Row>
          <div className="flex flex-wrap gap-2 p-4">
            <Badge tone={stt ? "success" : "warning"} icon={Mic}>{stt ? tx({ en: "Voice input works", roman: "Awaz input chalta hai" }) : tx({ en: "No voice input — use Chrome/Edge", roman: "Awaz input nahi — Chrome/Edge" })}</Badge>
            <Badge tone={tts ? "success" : "warning"} icon={Volume2}>{tts ? tx({ en: "Read-aloud works", roman: "Parh kar sunana chalta hai" }) : tx({ en: "No read-aloud", roman: "Parh kar sunana nahi" })}</Badge>
          </div>
        </Card>
      </Section>

      <Section title={tx({ en: "AI engine", roman: "AI engine" })}>
        <Card className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            {status ? <ModeBadge mode={status.mode} /> : <Badge>…</Badge>}
            {status?.provider && <span className="text-sm text-muted">{status.provider} · {status.model}</span>}
          </div>
          {status?.mode === "live" ? (
            <p className="mt-3 text-sm text-muted">{tx({ en: "Live AI is on. Answers are checked by HUMRAAH's safety rules.", roman: "Live AI on hai. Jawab HUMRAAH ke safety rules check karte hain." })}</p>
          ) : (
            <>
              <p className="mt-3 text-sm text-muted">{tx({ en: "Demo Mode uses HUMRAAH's built-in safety rules. To turn on live AI:", roman: "Demo Mode HUMRAAH ke built-in rules istemal karta hai. Live AI on karne ke liye:" })}</p>
              <StepList
                className="mt-3"
                items={[
                  tx({ en: "Create a file named .env.local in the project folder.", roman: "Project folder mein .env.local file banayein." }),
                  tx({ en: "Add GEMINI_API_KEY=… (free key from aistudio.google.com) or ANTHROPIC_API_KEY=… with your key.", roman: "Us mein GEMINI_API_KEY=… (aistudio.google.com se free key) ya ANTHROPIC_API_KEY=… apni key ke saath likhein." }),
                  tx({ en: "Restart the server (npm run dev).", roman: "Server dobara chalayein (npm run dev)." }),
                ]}
              />
              <p className="mt-3 text-xs text-subtle">{tx({ en: "Keys stay on the server, never in the browser.", roman: "Keys server par rehti hain, browser mein kabhi nahi." })}</p>
            </>
          )}
        </Card>
      </Section>

      <Section title={tx({ en: "Privacy & your data", roman: "Privacy aur aap ka data" })}>
        <Card className="p-5">
          <ul className="space-y-2.5 text-sm">
            {PRIVACY_POINTS.map((x, i) => (
              <li key={i} className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                <span>{tx(x)}</span>
              </li>
            ))}
          </ul>
          <Button variant="danger" size="sm" icon={Trash2} className="mt-4" onClick={clearAll} disabled={cleared}>{tx({ en: "Clear all my data", roman: "Mera saara data mitayein" })}</Button>
        </Card>
      </Section>

      <Section title={tx({ en: "About", roman: "Baare mein" })}>
        <Card className="space-y-2 p-5 text-sm">
          <p className="font-medium italic">Samjhay bhi. Sikhaye bhi. Hifazat bhi kare.</p>
          <p className="text-muted">
            {tx({
              en: "HUMRAAH is a guidance and learning companion — not a bank, authority or fraud-verification service. AI can make mistakes; verify important things with the official provider.",
              roman: "HUMRAAH rehnumai aur seekhne ka saathi hai — bank, idara ya fraud tasdeeq ki service nahi. AI ghalti kar sakta hai; zaroori baatein official idare se tasdeeq karein.",
            })}
          </p>
          <p className="text-xs text-subtle">
            Anthropic Claude · Google Gemini · Tesseract.js · Web Speech API · Lucide · Recharts · Next.js · Tailwind CSS. {tx({ en: "All practice data is fictional.", roman: "Tamam practice data farzi hai." })}
          </p>
        </Card>
      </Section>
    </div>
  );
}
