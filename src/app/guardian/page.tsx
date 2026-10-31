"use client";

import { useState } from "react";
import {
  Camera, Check, ClipboardCheck, Copy, Folder, KeyRound, Lock, MapPin, MessageSquare, Mic, RefreshCw, RotateCcw,
  ShieldCheck, Smartphone, Users, type LucideIcon,
} from "lucide-react";
import { PERMISSIONS, PRIVACY_CHECKUP } from "@/data/help";
import { pick } from "@/data/scenarios";
import { useT } from "@/lib/i18n";
import { recordEvent } from "@/lib/progress";
import { Badge, Button, Card, IconTile, Notice, PageHeader, ProgressBar, ScoreRing, Segmented, SpeakButton, cn } from "@/components/ui";

const PERM_ICONS: Record<string, LucideIcon> = { camera: Camera, mic: Mic, "map-pin": MapPin, users: Users, message: MessageSquare, folder: Folder };

type AppType = "torch" | "whatsapp" | "maps" | "game" | "bank";
type Verdict = "fine" | "think" | "no";

const APPS: { value: AppType; en: string; roman: string }[] = [
  { value: "torch", en: "Torch / Flashlight", roman: "Torch" },
  { value: "whatsapp", en: "WhatsApp", roman: "WhatsApp" },
  { value: "maps", en: "Maps / Ride app", roman: "Maps / Ride app" },
  { value: "game", en: "Game", roman: "Game" },
  { value: "bank", en: "Banking app", roman: "Bank app" },
];

const RULES: Record<AppType, Record<string, Verdict>> = {
  torch: { camera: "think", microphone: "no", location: "no", contacts: "no", sms: "no", files: "no" },
  whatsapp: { camera: "fine", microphone: "fine", location: "think", contacts: "fine", sms: "think", files: "fine" },
  maps: { camera: "no", microphone: "think", location: "fine", contacts: "no", sms: "no", files: "no" },
  game: { camera: "no", microphone: "no", location: "no", contacts: "no", sms: "no", files: "think" },
  bank: { camera: "fine", microphone: "no", location: "think", contacts: "think", sms: "think", files: "think" },
};

const VERDICTS: Record<Verdict, { tone: "success" | "warning" | "danger"; en: string; roman: string; why: { en: string; roman: string } }> = {
  fine: { tone: "success", en: "Usually fine", roman: "Aam tor par theek", why: { en: "This app normally needs it for its main feature. Choose “Only while using the app” when offered.", roman: "Is app ko apne asal kaam ke liye aam tor par yeh chahiye. Mumkin ho to “Only while using the app” chunein." } },
  think: { tone: "warning", en: "Think twice", roman: "Do baar sochein", why: { en: "Only some features need this. Allow it only when you are using that feature, and you can say no.", roman: "Sirf kuch features ko is ki zaroorat hoti hai. Sirf us waqt ijazat dein jab woh feature istemal karein — inkaar bhi kar sakte hain." } },
  no: { tone: "danger", en: "Usually not needed", roman: "Aam tor par zaroorat nahi", why: { en: "This app doesn't need it to work. Choose “Don't allow” — it may be collecting data it shouldn't.", roman: "Is app ko chalne ke liye iski zaroorat nahi. “Don't allow” chunein — ho sakta hai yeh ghair zaroori data jama kar rahi ho." } },
};

const WORDS = [
  "Chai", "Baarish", "Patang", "Chand", "Sitara", "Darya", "Pahar", "Gulab", "Aam", "Kitab", "Qalam", "Bagh", "Titli", "Bulbul",
  "Samandar", "Badal", "Suraj", "Mitti", "Roti", "Lassi", "Anaar", "Kela", "Seb", "Angoor", "Sheher", "Gaon", "Rail", "Cycle",
  "Chabi", "Darwaza", "Khirki", "Diya", "Mor", "Hiran", "Sher", "Tota", "Machli", "Nadi", "Jheel", "Barf", "Garmi", "Sardi",
  "Mango", "River", "Garden", "Pencil", "Window", "Lantern", "Tiger", "Parrot", "Rocket", "Cloud", "Thunder", "Melody",
  "Castle", "Bridge", "Harbor", "Meadow", "Pebble", "Rainbow", "Saffron", "Cotton",
];

function randomInt(max: number) {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % max;
}

function makePassphrase() {
  const picked: string[] = [];
  while (picked.length < 3) {
    const w = WORDS[randomInt(WORDS.length)];
    if (!picked.includes(w)) picked.push(w);
  }
  return `${picked.join("-")}-${10 + randomInt(90)}`;
}

function PrivacyCheckup() {
  const { lang, tx } = useT();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const q = PRIVACY_CHECKUP[index];
  const chosen = q ? answers[q.id] : undefined;
  const max = PRIVACY_CHECKUP.length * 2;
  const score = Object.values(answers).reduce((s, v) => s + v, 0);

  const finish = () => {
    setDone(true);
    recordEvent({ kind: "privacy-checkup", skill: "privacy", title: "Privacy Checkup", hints: 0, completed: true, independent: true, score, maxScore: max });
  };
  const restart = () => {
    setAnswers({});
    setPicked({});
    setIndex(0);
    setDone(false);
  };

  if (done) {
    const fixes = PRIVACY_CHECKUP.filter((p) => (answers[p.id] ?? 0) < 2);
    const pctScore = Math.round((score / max) * 100);
    return (
      <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-start">
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface-2 p-6">
          <ScoreRing value={pctScore} label={tx({ en: "Protected", roman: "Hifazat" })} />
          <p className="text-sm font-semibold text-muted">{score} / {max} {tx({ en: "points", roman: "points" })}</p>
          <Badge tone={pctScore >= 80 ? "success" : pctScore >= 50 ? "warning" : "danger"}>
            {pctScore >= 80 ? tx({ en: "Well protected", roman: "Achi hifazat" }) : pctScore >= 50 ? tx({ en: "Some gaps", roman: "Kuch kamiyan" }) : tx({ en: "Needs attention", roman: "Tawajjo chahiye" })}
          </Badge>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold">{fixes.length ? tx({ en: "Your personal fix-list", roman: "Aap ki zaati fix-list" }) : tx({ en: "Excellent habits!", roman: "Behtareen aadatein!" })}</h3>
          {fixes.length === 0 ? (
            <p className="mt-2 text-muted">{tx({ en: "You answered every question the safest way. Re-check every few months.", roman: "Aap ne har sawal ka sab se mehfooz jawab diya. Har chand mahine baad dobara check karein." })}</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2.5">
              {fixes.map((f, i) => (
                <li key={f.id} className="flex gap-3 rounded-2xl border border-line bg-surface-2 p-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{i + 1}</span>
                  <span>
                    <span className="block text-sm font-semibold">{pick(f.q, lang)}</span>
                    <span className="mt-0.5 block text-sm text-muted">{pick(f.tip, lang)}</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" icon={RotateCcw} onClick={restart}>{tx({ en: "Take it again", roman: "Dobara karein" })}</Button>
            <SpeakButton id="checkup-fixes" text={fixes.map((f) => pick(f.tip, lang)).join(". ") || tx({ en: "Excellent habits", roman: "Behtareen aadatein" })} size="md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-muted">
          {tx({ en: "Question", roman: "Sawal" })} {index + 1} / {PRIVACY_CHECKUP.length}
        </span>
        <ProgressBar value={((index + (chosen !== undefined ? 1 : 0)) / PRIVACY_CHECKUP.length) * 100} className="max-w-[12rem]" label="Checkup progress" />
      </div>
      <p className="font-display text-xl font-bold leading-snug">{pick(q.q, lang)}</p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {q.options.map((o, i) => {
          const selected = picked[q.id] === i;
          return (
            <button
              key={i}
              onClick={() => {
                if (chosen !== undefined) return;
                setAnswers((a) => ({ ...a, [q.id]: o.points }));
                setPicked((p) => ({ ...p, [q.id]: i }));
              }}
              disabled={chosen !== undefined}
              aria-pressed={selected}
              className={cn(
                "min-h-14 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-all cursor-pointer disabled:cursor-default",
                selected ? (o.points === 2 ? "border-success bg-success-soft" : "border-warning bg-warning-soft") : "border-line bg-surface-2 hover:border-primary/60",
                chosen !== undefined && !selected && "opacity-60",
              )}
            >
              {pick(o.text, lang)}
            </button>
          );
        })}
      </div>
      {chosen !== undefined && (
        <div className="mt-4 animate-fade-up">
          <Notice tone={chosen === 2 ? "success" : "info"} title={chosen === 2 ? tx({ en: "Great — that's the safe habit.", roman: "Zabardast — yahi mehfooz aadat hai." }) : tx({ en: "Here's how to improve", roman: "Behtar kaise karein" })}>
            {pick(q.tip, lang)}
          </Notice>
          <div className="mt-4 flex justify-end">
            {index < PRIVACY_CHECKUP.length - 1 ? (
              <Button size="lg" onClick={() => setIndex((i) => i + 1)}>{tx({ en: "Next question", roman: "Agla sawal" })}</Button>
            ) : (
              <Button size="lg" icon={ClipboardCheck} onClick={finish}>{tx({ en: "See my results", roman: "Natija dekhein" })}</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PermissionChecker() {
  const { lang, tx } = useT();
  const [app, setApp] = useState<AppType>("torch");
  const [perm, setPerm] = useState("contacts");
  const verdict = VERDICTS[RULES[app][perm]];
  const permName = PERMISSIONS.find((p) => p.id === perm);
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4 sm:p-5">
      <p className="font-display text-base font-bold">{tx({ en: "Should I allow it?", roman: "Kya ijazat doon?" })}</p>
      <p className="text-sm text-muted">{tx({ en: "Pick the app and what it's asking for.", roman: "App aur us ki maangi hui ijazat chunein." })}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-subtle">{tx({ en: "App", roman: "App" })}</span>
          <select value={app} onChange={(e) => setApp(e.target.value as AppType)} className="h-12 w-full rounded-2xl border border-line bg-surface px-3 font-semibold text-fg focus:border-primary focus:outline-none">
            {APPS.map((a) => <option key={a.value} value={a.value}>{lang === "en" ? a.en : a.roman}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-subtle">{tx({ en: "Asks for", roman: "Maang rahi hai" })}</span>
          <select value={perm} onChange={(e) => setPerm(e.target.value)} className="h-12 w-full rounded-2xl border border-line bg-surface px-3 font-semibold text-fg focus:border-primary focus:outline-none">
            {PERMISSIONS.map((p) => <option key={p.id} value={p.id}>{pick(p.name, lang)}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 animate-fade-up" key={`${app}-${perm}`}>
        <Notice tone={verdict.tone} title={`${lang === "en" ? verdict.en : verdict.roman}${permName ? ` — ${pick(permName.name, lang)}` : ""}`}>
          {pick(verdict.why, lang)}
        </Notice>
      </div>
    </div>
  );
}

function PassphraseGenerator() {
  const { tx } = useT();
  const [phrase, setPhrase] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const generate = () => {
    setPhrase(makePassphrase());
    setCopied(false);
  };
  const copy = async () => {
    if (!phrase) return;
    try {
      await navigator.clipboard.writeText(phrase);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4 sm:p-5">
      <p className="font-display text-base font-bold">{tx({ en: "Strong password idea", roman: "Mazboot password ka idea" })}</p>
      <p className="text-sm text-muted">{tx({ en: "Three random words and a number are easy to remember and hard to guess.", roman: "Teen alag alfaaz aur ek number yaad rakhna aasaan aur andaza lagana mushkil." })}</p>
      <div className="mt-4 flex min-h-16 items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-3 text-center font-display text-xl font-bold tracking-wide break-all" aria-live="polite">
        {phrase ?? <span className="text-base font-semibold text-subtle">{tx({ en: "Tap “Generate” to create one", roman: "“Generate” dabayein" })}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button icon={RefreshCw} onClick={generate}>{phrase ? tx({ en: "Another one", roman: "Aur ek" }) : tx({ en: "Generate", roman: "Generate" })}</Button>
        <Button variant="secondary" icon={copied ? Check : Copy} onClick={copy} disabled={!phrase}>{copied ? tx({ en: "Copied", roman: "Copy ho gaya" }) : tx({ en: "Copy", roman: "Copy" })}</Button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
        <ShieldCheck className="size-3.5 text-success" aria-hidden />
        {tx({ en: "Generated on your device, never sent anywhere or saved.", roman: "Aap ke device par bana, kahin bheja ya save nahi kiya gaya." })}
      </p>
    </div>
  );
}

const TWO_STEP = {
  whatsapp: {
    en: ["Open WhatsApp and tap the three dots (⋮) or Settings.", "Tap Account → Two-step verification.", "Tap Turn on and choose a 6-digit PIN only you know.", "Add your email so you can reset the PIN if you forget it.", "Done — WhatsApp will occasionally ask for this PIN."],
    roman: ["WhatsApp kholein aur teen dots (⋮) ya Settings dabayein.", "Account → Two-step verification dabayein.", "Turn on dabayein aur 6 hindson ka PIN chunein jo sirf aap jaanein.", "Apna email dein taake PIN bhoolne par reset ho sake.", "Mukammal — WhatsApp kabhi kabhi yeh PIN poochega."],
  },
  gmail: {
    en: ["Open myaccount.google.com (type it yourself).", "Tap Security → 2-Step Verification.", "Tap Get started and sign in yourself.", "Add your own phone number and choose to receive a code or prompt.", "Turn it on. New sign-ins will need your phone too."],
    roman: ["myaccount.google.com khud likh kar kholein.", "Security → 2-Step Verification dabayein.", "Get started dabayein aur khud sign in karein.", "Apna phone number dein aur code ya prompt chunein.", "On kar dein. Naye sign-in par phone bhi chahiye hoga."],
  },
};

export default function GuardianPage() {
  const { lang, tx } = useT();
  const l = lang === "en" ? "en" : "roman";
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={ShieldCheck}
        tone="success"
        eyebrow="HUMRAAH Guardian"
        title={tx({ en: "Guardian Mode — privacy protection", roman: "Guardian Mode — privacy ki hifazat", ur: "گارڈین موڈ — پرائیویسی کی حفاظت" })}
        subtitle={tx({ en: "Check your safety habits, understand app permissions and protect your passwords and codes.", roman: "Apni hifazati aadatein check karein, app ki ijazatein samjhein aur password aur codes mehfooz rakhein." })}
      />

      <Card glow className="p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <IconTile icon={ClipboardCheck} tone="teal" />
          <div>
            <h2 className="font-display text-xl font-bold">{tx({ en: "2-minute Privacy Checkup", roman: "2 minute ka Privacy Checkup" })}</h2>
            <p className="text-sm text-muted">{tx({ en: "7 quick questions. No personal data is collected — only your answers' score is saved on this device.", roman: "7 chhote sawal. Koi zaati data jama nahi hota — sirf score is device par save hota hai." })}</p>
          </div>
        </div>
        <PrivacyCheckup />
      </Card>

      <Card className="p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <IconTile icon={Smartphone} tone="info" />
          <div>
            <h2 className="font-display text-xl font-bold">{tx({ en: "App permissions, explained", roman: "App ki ijazatein, aasaan alfaaz mein" })}</h2>
            <p className="text-sm text-muted">{tx({ en: "A permission isn't bad by itself. Ask: does this feature need it?", roman: "Ijazat khud buri nahi. Sochiye: kya is feature ko iski zaroorat hai?" })}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PERMISSIONS.map((p) => {
            const Icon = PERM_ICONS[p.icon] ?? Lock;
            return (
              <div key={p.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex items-center gap-3">
                  <IconTile icon={Icon} size="sm" tone="teal" />
                  <p className="font-display font-bold">{pick(p.name, lang)}</p>
                </div>
                <p className="mt-3 text-sm"><span className="font-semibold">{tx({ en: "Used for: ", roman: "Kis liye: " })}</span><span className="text-muted">{pick(p.why, lang)}</span></p>
                <p className="mt-1.5 text-sm"><span className="font-semibold text-warning">{tx({ en: "Careful: ", roman: "Ehtiyat: " })}</span><span className="text-muted">{pick(p.caution, lang)}</span></p>
              </div>
            );
          })}
        </div>
        <div className="mt-5">
          <PermissionChecker />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <IconTile icon={KeyRound} tone="warning" />
            <h2 className="font-display text-xl font-bold">{tx({ en: "Passwords & OTP safety", roman: "Password aur OTP ki hifazat" })}</h2>
          </div>
          <PassphraseGenerator />
          <ul className="mt-5 flex flex-col gap-2.5 text-sm">
            {[
              { en: "Use a different password for your email and your bank.", roman: "Email aur bank ke liye alag password rakhein." },
              { en: "An OTP is a one-time key — never read it to anyone, even someone saying they are from the bank.", roman: "OTP ek baar ki chaabi hai — kisi ko na sunayein, chahe woh bank ka hone ka daawa kare." },
              { en: "HUMRAAH will never ask you for a password, PIN or OTP.", roman: "HUMRAAH aap se kabhi password, PIN ya OTP nahi maangega." },
              { en: "If you think someone knows your password, change it from your own phone right away.", roman: "Agar lagta hai kisi ko password pata hai to foran apne phone se badal dein." },
            ].map((tip, i) => (
              <li key={i} className="flex gap-2.5">
                <Check className="mt-0.5 size-4.5 shrink-0 text-success" aria-hidden />
                <span className="text-muted">{tx(tip)}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <IconTile icon={Lock} tone="lavender" />
            <div>
              <h2 className="font-display text-xl font-bold">{tx({ en: "Turn on two-step verification", roman: "Two-step verification on karein" })}</h2>
              <p className="text-sm text-muted">{tx({ en: "A second lock, so a stolen password alone isn't enough.", roman: "Doosra taala, taake sirf chura hua password kaafi na ho." })}</p>
            </div>
          </div>
          <TwoStepTabs l={l} />
        </Card>
      </div>
    </div>
  );
}

function TwoStepTabs({ l }: { l: "en" | "roman" }) {
  const [tab, setTab] = useState<"whatsapp" | "gmail">("whatsapp");
  const steps = TWO_STEP[tab][l];
  return (
    <div>
      <Segmented label="App" value={tab} onChange={setTab} options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "gmail", label: "Gmail / Google" }]} />
      <ol className="mt-4 flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl border border-line bg-surface-2 p-3.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lavender-soft text-sm font-bold text-lavender">{i + 1}</span>
            <span className="text-sm font-medium">{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-3">
        <SpeakButton id={`2sv-${tab}`} text={steps.join(". ")} size="md" />
      </div>
    </div>
  );
}
