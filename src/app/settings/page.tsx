"use client";

import { useState } from "react";
import {
  Accessibility, Bot, Check, Database, Heart, Info, Languages, Mic, Moon, Palette, Settings, ShieldCheck, Sun, Trash2,
  User, Volume2,
} from "lucide-react";
import { Toggle } from "@/components/shell";
import { Badge, Button, Card, IconTile, Input, ModeBadge, Notice, PageHeader, Segmented, cn, useAiStatus } from "@/components/ui";
import { useT } from "@/lib/i18n";
import { usePrefs } from "@/lib/prefs";
import { useSpeaker, useSpeechSupport } from "@/lib/speech";
import type { Lang } from "@/lib/types";

function Section({ icon, title, subtitle, children, tone = "teal" }: { icon: typeof Settings; title: string; subtitle?: string; children: React.ReactNode; tone?: "teal" | "info" | "lavender" | "success" | "warning" }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <IconTile icon={icon} tone={tone} />
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function ThemeCard({ mode, active, onClick, label }: { mode: "light" | "dark"; active: boolean; onClick: () => void; label: string }) {
  const dark = mode === "dark";
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn("flex-1 rounded-2xl border-2 p-2 text-left transition-all cursor-pointer", active ? "border-primary" : "border-line hover:border-line-strong")}
    >
      <div className={cn("h-24 overflow-hidden rounded-xl p-2.5", dark ? "bg-[#0B1422]" : "bg-[#F3F7F6]")} aria-hidden>
        <div className="flex gap-2">
          <div className={cn("h-18 w-8 rounded-lg", dark ? "bg-[#111e31]" : "bg-white")} />
          <div className="flex-1 space-y-2">
            <div className={cn("h-3 w-2/3 rounded", dark ? "bg-[#1f3350]" : "bg-[#dde7e6]")} />
            <div className={cn("h-8 rounded-lg", dark ? "bg-[#111e31] shadow-[0_0_0_1px_rgb(24_185_168/0.35)]" : "bg-white shadow")} />
            <div className="h-3 w-1/2 rounded bg-[linear-gradient(90deg,#18B9A8,#16A36A)]" />
          </div>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-2 px-1 text-sm font-semibold">
        {dark ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />} {label}
        {active && <Check className="ml-auto size-4 text-primary" aria-hidden />}
      </p>
    </button>
  );
}

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
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Settings}
        tone="info"
        eyebrow="HUMRAAH"
        title={tx({ en: "Settings & accessibility", roman: "Settings aur aasaani", ur: "ترتیبات اور رسائی" })}
        subtitle={tx({ en: "Make HUMRAAH comfortable for your eyes, ears and language.", roman: "HUMRAAH ko apni aankhon, kaanon aur zabaan ke liye aaraamdeh banayein." })}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Section icon={User} title={tx({ en: "Profile", roman: "Profile" })} subtitle={tx({ en: "Only used to greet you. Stays on this device.", roman: "Sirf salam ke liye. Isi device par rehta hai." })}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">{tx({ en: "What should we call you?", roman: "Hum aap ko kya kahein?" })}</span>
            <Input value={prefs.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} placeholder={tx({ en: "e.g. Abu, Ammi, Nana", roman: "maslan Abu, Ammi, Nana" })} autoComplete="nickname" />
          </label>
          <p className="mt-2 text-xs text-subtle">{tx({ en: "Please don't enter CNIC, phone or bank details here.", roman: "Yahan CNIC, phone ya bank details na likhein." })}</p>
        </Section>

        <Section icon={Palette} tone="lavender" title={tx({ en: "Appearance", roman: "Shakal o soorat" })}>
          <div className="flex gap-3">
            <ThemeCard mode="light" label={tx({ en: "Light", roman: "Roshan" })} active={prefs.theme === "light"} onClick={() => update({ theme: "light" })} />
            <ThemeCard mode="dark" label={tx({ en: "Dark", roman: "Andhera" })} active={prefs.theme === "dark"} onClick={() => update({ theme: "dark" })} />
          </div>
        </Section>

        <Section icon={Languages} title={tx({ en: "Language · Zabaan · زبان", roman: "Zabaan · Language · زبان" })} subtitle={tx({ en: "Applies to menus, AI answers and voice.", roman: "Menus, AI jawab aur awaz par lagu hota hai." })}>
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
          <p className="mt-3 text-xs text-subtle">
            {tx({ en: "Some practice content is in English and Roman Urdu only; live AI answers in all three.", roman: "Kuch practice content sirf English aur Roman Urdu mein hai; live AI teeno mein jawab deta hai." })}
          </p>
        </Section>

        <Section icon={Accessibility} tone="success" title={tx({ en: "Accessibility", roman: "Aasaani" })}>
          <div className="divide-y divide-line">
            <Toggle
              label={tx({ en: "Elder Mode", roman: "Elder Mode" })}
              description={tx({ en: "Bigger text, larger buttons and stronger contrast.", roman: "Bara text, bare buttons aur wazeh rang." })}
              checked={prefs.elder}
              onChange={(v) => update({ elder: v })}
            />
            <Toggle
              label={tx({ en: "Reduce motion", roman: "Harkat kam karein" })}
              description={tx({ en: "Turns off animations.", roman: "Animations band." })}
              checked={prefs.reduceMotion}
              onChange={(v) => update({ reduceMotion: v })}
            />
          </div>
          <div className="mt-3 rounded-2xl border border-line bg-surface-2 p-4" aria-hidden>
            <p className="text-xs font-bold uppercase tracking-wider text-subtle">{tx({ en: "Preview", roman: "Jhalak" })}</p>
            <p className="mt-1 font-display text-lg font-bold">{tx({ en: "Check a Message", roman: "Message check karein" })}</p>
            <p className="text-sm text-muted">{tx({ en: "Text and buttons grow when Elder Mode is on.", roman: "Elder Mode on karne par text aur buttons bare ho jate hain." })}</p>
          </div>
        </Section>

        <Section icon={Volume2} title={tx({ en: "Voice", roman: "Awaz" })} subtitle={tx({ en: "Voice-first, never voice-only — typing always works.", roman: "Awaz pehle, magar sirf awaz nahi — likhna hamesha chalta hai." })}>
          <label className="block">
            <span className="mb-2 flex items-center justify-between text-sm font-semibold">
              {tx({ en: "Speaking speed", roman: "Bolne ki raftaar" })}
              <span className="text-muted">{prefs.voiceRate.toFixed(2)}×</span>
            </span>
            <input
              type="range"
              min={0.6}
              max={1.3}
              step={0.05}
              value={prefs.voiceRate}
              onChange={(e) => update({ voiceRate: Number(e.target.value) })}
              className="w-full accent-[var(--primary)] h-8 cursor-pointer"
              aria-label="Speaking speed"
            />
            <span className="flex justify-between text-xs text-subtle">
              <span>{tx({ en: "Slower", roman: "Aahista" })}</span>
              <span>{tx({ en: "Faster", roman: "Tez" })}</span>
            </span>
          </label>
          <div className="mt-3">
            <Button variant="secondary" icon={Volume2} onClick={testVoice} disabled={!tts}>
              {speaking ? tx({ en: "Stop", roman: "Rokein" }) : tx({ en: "Test voice", roman: "Awaz test karein" })}
            </Button>
          </div>
          <div className="mt-3 divide-y divide-line">
            <Toggle
              label={tx({ en: "Read answers aloud automatically", roman: "Jawab khud parh kar sunayein" })}
              checked={prefs.autoSpeak}
              onChange={(v) => update({ autoSpeak: v })}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone={stt ? "success" : "warning"} icon={Mic}>{stt ? tx({ en: "Voice input supported", roman: "Awaz se input mumkin" }) : tx({ en: "Voice input not supported — use Chrome/Edge", roman: "Awaz input nahi — Chrome/Edge istemal karein" })}</Badge>
            <Badge tone={tts ? "success" : "warning"} icon={Volume2}>{tts ? tx({ en: "Read-aloud supported", roman: "Parh kar sunana mumkin" }) : tx({ en: "Read-aloud not supported", roman: "Parh kar sunana mumkin nahi" })}</Badge>
          </div>
          <p className="mt-2 text-xs text-subtle">{tx({ en: "Urdu speech depends on the voices installed on your device. Always check important numbers on screen.", roman: "Urdu awaz aap ke device ki voices par munhasir hai. Zaroori numbers hamesha screen par check karein." })}</p>
        </Section>

        <Section icon={Bot} tone="info" title={tx({ en: "AI engine", roman: "AI engine" })}>
          <div className="flex flex-wrap items-center gap-2">
            {status ? <ModeBadge mode={status.mode} /> : <Badge>…</Badge>}
            {status?.model && <Badge tone="neutral">{status.model}</Badge>}
            {status?.provider && <Badge tone="neutral">{status.provider}</Badge>}
          </div>
          {status?.mode === "live" ? (
            <p className="mt-3 text-sm text-muted">
              {tx({ en: "Live AI is on. Answers are generated by the model, checked by HUMRAAH's safety rules, and labelled “Live AI”.", roman: "Live AI on hai. Jawab model banata hai, HUMRAAH ke safety rules check karte hain, aur “Live AI” likha hota hai." })}
            </p>
          ) : (
            <div className="mt-3 text-sm text-muted">
              <p>{tx({ en: "Demo Mode: HUMRAAH is using its built-in, rule-based safety engine and on-device OCR. Results are real but less flexible, and are labelled “Demo Mode”.", roman: "Demo Mode: HUMRAAH apna built-in rules wala safety engine aur device par OCR istemal kar raha hai. Natije asal hain magar kam lachakdaar, aur “Demo Mode” likha hota hai." })}</p>
              <p className="mt-2 font-semibold text-fg">{tx({ en: "To enable live AI (for the person running the server):", roman: "Live AI on karne ke liye (server chalane wale ke liye):" })}</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                <li>{tx({ en: "Create a file named .env.local in the project folder.", roman: "Project folder mein .env.local file banayein." })}</li>
                <li>{tx({ en: "Add GEMINI_API_KEY=… (free key from aistudio.google.com) or ANTHROPIC_API_KEY=… with your key.", roman: "Us mein GEMINI_API_KEY=… (aistudio.google.com se free key) ya ANTHROPIC_API_KEY=… apni key ke saath likhein." })}</li>
                <li>{tx({ en: "Restart the server (npm run dev).", roman: "Server dobara chalayein (npm run dev)." })}</li>
              </ol>
              <p className="mt-2 text-xs text-subtle">{tx({ en: "Keys stay on the server and are never shown or sent to the browser.", roman: "Keys server par rehti hain, browser ko kabhi nahi bheji jaatin." })}</p>
            </div>
          )}
        </Section>

        <Section icon={Database} tone="warning" title={tx({ en: "Privacy & your data", roman: "Privacy aur aap ka data" })}>
          <ul className="flex flex-col gap-2.5 text-sm">
            {[
              { en: "Preferences and learning progress are stored only on this device.", roman: "Preferences aur progress sirf is device par mehfooz hoti hain." },
              { en: "Screenshots and documents are processed for the analysis and not stored.", roman: "Screenshots aur documents sirf jaanch ke liye istemal hote hain, save nahi hote." },
              { en: "Text is read on your device first; card numbers and CNICs are masked before any AI analysis.", roman: "Text pehle aap ke device par parha jata hai; AI se pehle card aur CNIC number chhupa diye jate hain." },
              { en: "Nothing is sent anywhere except to the AI provider when live AI is on.", roman: "Live AI on ho to sirf AI provider ko bheja jata hai, aur kahin nahi." },
              { en: "HUMRAAH never asks for or stores passwords, PINs or OTPs. Voice is not recorded.", roman: "HUMRAAH kabhi password, PIN ya OTP nahi maangta na save karta hai. Awaz record nahi hoti." },
            ].map((x, i) => (
              <li key={i} className="flex gap-2.5">
                <ShieldCheck className="mt-0.5 size-4.5 shrink-0 text-success" aria-hidden />
                <span className="text-muted">{tx(x)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Button variant="danger" icon={Trash2} onClick={clearAll} disabled={cleared}>{tx({ en: "Clear all my data", roman: "Mera saara data mitayein" })}</Button>
          </div>
        </Section>
      </div>

      <Card glow className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-start">
          <IconTile icon={Heart} tone="teal" size="lg" />
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">{tx({ en: "About HUMRAAH", roman: "HUMRAAH ke baare mein" })}</h2>
            <p className="mt-1 font-display text-lg italic text-gradient">Samjhay bhi. Sikhaye bhi. Hifazat bhi kare.</p>
            <p className="mt-3 text-sm text-muted">
              {tx({
                en: "HUMRAAH is a guidance and learning platform, not a bank, payment processor, government authority, antivirus or guaranteed fraud-verification service. It explains, guides, checks and teaches — you stay in control of every sensitive action. AI can make mistakes; verify important things with the official provider.",
                roman: "HUMRAAH rehnumai aur seekhne ka platform hai — bank, payment processor, sarkari idara, antivirus ya pakki fraud tasdeeq ki service nahi. Yeh samjhata, rasta dikhata, check karta aur sikhata hai — har hassaas qadam aap ke haath mein rehta hai. AI ghalti kar sakta hai; zaroori baatein official idare se tasdeeq karein.",
              })}
            </p>
            <Notice tone="info" icon={Info} className="mt-4" title={tx({ en: "Credits", roman: "Credits" })}>
              Anthropic Claude (AI analysis, when configured) · Tesseract.js (on-device OCR) · Web Speech API (voice) · Lucide (icons) · Recharts (charts) · Next.js &amp; Tailwind CSS. {tx({ en: "All banks, people and numbers in samples and practice are fictional.", roman: "Samples aur practice mein tamam bank, log aur numbers farzi hain." })}
            </Notice>
          </div>
        </div>
      </Card>
    </div>
  );
}
