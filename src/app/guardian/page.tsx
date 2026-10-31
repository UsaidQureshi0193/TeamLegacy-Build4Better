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
import { Badge, Button, Card, IconTile, Notice, PageHeader, ProgressBar, ScoreRing, Section, Segmented, SpeakButton, StepList, cn } from "@/components/ui";

const PERM_ICONS: Record<string, LucideIcon> = { camera: Camera, mic: Mic, "map-pin": MapPin, users: Users, message: MessageSquare, folder: Folder };

type AppType = "torch" | "whatsapp" | "maps" | "game" | "bank";
type Verdict = "fine" | "think" | "no";
type Tab = "checkup" | "permissions" | "passwords" | "twostep";
type Tri = { en: string; roman: string; ur: string };

const APPS: ({ value: AppType } & Tri)[] = [
  { value: "torch", en: "Torch / Flashlight", roman: "Torch", ur: "ٹارچ" },
  { value: "whatsapp", en: "WhatsApp", roman: "WhatsApp", ur: "WhatsApp" },
  { value: "maps", en: "Maps / Ride app", roman: "Maps / Ride app", ur: "نقشہ / سواری کی ایپ" },
  { value: "game", en: "Game", roman: "Game", ur: "گیم" },
  { value: "bank", en: "Banking app", roman: "Bank app", ur: "بینک کی ایپ" },
];

const RULES: Record<AppType, Record<string, Verdict>> = {
  torch: { camera: "think", microphone: "no", location: "no", contacts: "no", sms: "no", files: "no" },
  whatsapp: { camera: "fine", microphone: "fine", location: "think", contacts: "fine", sms: "think", files: "fine" },
  maps: { camera: "no", microphone: "think", location: "fine", contacts: "no", sms: "no", files: "no" },
  game: { camera: "no", microphone: "no", location: "no", contacts: "no", sms: "no", files: "think" },
  bank: { camera: "fine", microphone: "no", location: "think", contacts: "think", sms: "think", files: "think" },
};

const VERDICTS: Record<Verdict, { tone: "success" | "warning" | "danger"; label: Tri; why: Tri }> = {
  fine: {
    tone: "success",
    label: { en: "Usually fine", roman: "Aam tor par theek", ur: "عام طور پر ٹھیک" },
    why: {
      en: "This app normally needs it. Choose “Only while using the app”.",
      roman: "Is app ko aam tor par yeh chahiye. “Only while using the app” chunein.",
      ur: "اس ایپ کو عام طور پر اس کی ضرورت ہوتی ہے۔ “Only while using the app” چنیں۔",
    },
  },
  think: {
    tone: "warning",
    label: { en: "Think twice", roman: "Do baar sochein", ur: "دو بار سوچیں" },
    why: {
      en: "Only some features need this. You can say no.",
      roman: "Sirf kuch features ko is ki zaroorat hai. Inkaar kar sakte hain.",
      ur: "صرف کچھ فیچرز کو اس کی ضرورت ہوتی ہے۔ آپ انکار کر سکتے ہیں۔",
    },
  },
  no: {
    tone: "danger",
    label: { en: "Usually not needed", roman: "Aam tor par zaroorat nahi", ur: "عام طور پر ضرورت نہیں" },
    why: {
      en: "This app doesn't need it. Choose “Don't allow”.",
      roman: "Is app ko iski zaroorat nahi. “Don't allow” chunein.",
      ur: "اس ایپ کو اس کی ضرورت نہیں۔ “Don't allow” چنیں۔",
    },
  },
};

// Passphrase words stay in Latin letters on purpose: they are typed on ordinary keyboards.
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

const SELECT = "h-11 w-full rounded-xl border border-line bg-surface-2 px-3 font-medium text-fg focus:border-primary focus:outline-none";

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
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing value={pctScore} label={tx({ en: "Protected", roman: "Hifazat", ur: "حفاظت" })} />
          <Badge tone={pctScore >= 80 ? "success" : pctScore >= 50 ? "warning" : "danger"}>
            {pctScore >= 80
              ? tx({ en: "Well protected", roman: "Achi hifazat", ur: "اچھی حفاظت" })
              : pctScore >= 50
                ? tx({ en: "Some gaps", roman: "Kuch kamiyan", ur: "کچھ کمیاں" })
                : tx({ en: "Needs attention", roman: "Tawajjo chahiye", ur: "توجہ کی ضرورت" })}
          </Badge>
        </div>
        <div className="flex-1">
          <p className="font-semibold">
            {fixes.length
              ? tx({ en: "What to fix", roman: "Kya theek karein", ur: "کیا ٹھیک کریں" })
              : tx({ en: "Excellent habits!", roman: "Behtareen aadatein!", ur: "بہترین عادتیں!" })}
          </p>
          {fixes.length > 0 && (
            <StepList
              className="mt-3"
              items={fixes.map((f) => (
                <>
                  <span className="block font-medium">{pick(f.q, lang)}</span>
                  <span className="block text-muted">{pick(f.tip, lang)}</span>
                </>
              ))}
            />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="secondary" icon={RotateCcw} onClick={restart}>{tx({ en: "Take it again", roman: "Dobara karein", ur: "دوبارہ کریں" })}</Button>
            <SpeakButton
              id="checkup-fixes"
              text={fixes.map((f) => pick(f.tip, lang)).join(". ") || tx({ en: "Excellent habits", roman: "Behtareen aadatein", ur: "بہترین عادتیں" })}
              size="md"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm text-muted">
          {tx({ en: "Question", roman: "Sawal", ur: "سوال" })} <span dir="ltr">{index + 1} / {PRIVACY_CHECKUP.length}</span>
        </span>
        <ProgressBar
          value={((index + (chosen !== undefined ? 1 : 0)) / PRIVACY_CHECKUP.length) * 100}
          className="max-w-[10rem]"
          label={tx({ en: "Checkup progress", roman: "Checkup ki progress", ur: "چیک اپ کی پیش رفت" })}
        />
      </div>
      <p className="text-lg font-semibold leading-snug">{pick(q.q, lang)}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
                "min-h-12 rounded-xl border px-4 py-2.5 text-start font-medium transition-colors cursor-pointer disabled:cursor-default",
                selected ? (o.points === 2 ? "border-success bg-success-soft" : "border-warning bg-warning-soft") : "border-line hover:border-primary/50",
                chosen !== undefined && !selected && "opacity-50",
              )}
            >
              {pick(o.text, lang)}
            </button>
          );
        })}
      </div>
      {chosen !== undefined && (
        <div className="mt-4 space-y-3">
          <Notice tone={chosen === 2 ? "success" : "info"}>{pick(q.tip, lang)}</Notice>
          <div className="flex justify-end">
            {index < PRIVACY_CHECKUP.length - 1 ? (
              <Button onClick={() => setIndex((i) => i + 1)}>{tx({ en: "Next question", roman: "Agla sawal", ur: "اگلا سوال" })}</Button>
            ) : (
              <Button icon={ClipboardCheck} onClick={finish}>{tx({ en: "See my results", roman: "Natija dekhein", ur: "نتیجہ دیکھیں" })}</Button>
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
  return (
    <Card className="p-5">
      <p className="font-semibold">{tx({ en: "Should I allow it?", roman: "Kya ijazat doon?", ur: "کیا اجازت دوں؟" })}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs text-muted">{tx({ en: "App", roman: "App", ur: "ایپ" })}</span>
          <select value={app} onChange={(e) => setApp(e.target.value as AppType)} className={SELECT}>
            {APPS.map((a) => <option key={a.value} value={a.value}>{tx(a)}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-muted">{tx({ en: "Asks for", roman: "Maang rahi hai", ur: "مانگ رہی ہے" })}</span>
          <select value={perm} onChange={(e) => setPerm(e.target.value)} className={SELECT}>
            {PERMISSIONS.map((p) => <option key={p.id} value={p.id}>{pick(p.name, lang)}</option>)}
          </select>
        </label>
      </div>
      <Notice className="mt-4" tone={verdict.tone} title={tx(verdict.label)}>
        {tx(verdict.why)}
      </Notice>
    </Card>
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
    <Card className="p-5">
      <p className="font-semibold">{tx({ en: "Strong password idea", roman: "Mazboot password ka idea", ur: "مضبوط پاس ورڈ کا خیال" })}</p>
      <p className="text-sm text-muted">{tx({ en: "Three random words and a number.", roman: "Teen alag alfaaz aur ek number.", ur: "تین مختلف الفاظ اور ایک نمبر۔" })}</p>
      <div dir="ltr" className="mt-4 flex min-h-14 items-center justify-center rounded-xl bg-surface-2 px-4 py-3 text-center font-display text-lg font-semibold tracking-wide break-all" aria-live="polite">
        {phrase ?? <span className="text-sm font-normal text-subtle">{tx({ en: "Tap Generate", roman: "Generate dabayein", ur: "“بنائیں” دبائیں" })}</span>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button icon={RefreshCw} onClick={generate}>
          {phrase ? tx({ en: "Another one", roman: "Aur ek", ur: "ایک اور" }) : tx({ en: "Generate", roman: "Generate", ur: "بنائیں" })}
        </Button>
        <Button variant="secondary" icon={copied ? Check : Copy} onClick={copy} disabled={!phrase}>
          {copied ? tx({ en: "Copied", roman: "Copy ho gaya", ur: "کاپی ہو گیا" }) : tx({ en: "Copy", roman: "Copy", ur: "کاپی کریں" })}
        </Button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-subtle">
        <ShieldCheck className="size-3.5 text-success" aria-hidden />
        {tx({ en: "Made on your device. Never sent or saved.", roman: "Aap ke device par bana. Na bheja, na save hua.", ur: "آپ کے آلے پر بنا۔ نہ بھیجا گیا، نہ محفوظ ہوا۔" })}
      </p>
    </Card>
  );
}

const PASSWORD_TIPS: Tri[] = [
  { en: "Use a different password for your email and your bank.", roman: "Email aur bank ke liye alag password rakhein.", ur: "ای میل اور بینک کے لیے الگ پاس ورڈ رکھیں۔" },
  {
    en: "Never read an OTP to anyone — even someone saying they are from the bank.",
    roman: "OTP kisi ko na sunayein — chahe woh bank ka hone ka daawa kare.",
    ur: "OTP کسی کو نہ سنائیں — چاہے وہ بینک کا ہونے کا دعویٰ کرے۔",
  },
  { en: "HUMRAAH will never ask for a password, PIN or OTP.", roman: "HUMRAAH kabhi password, PIN ya OTP nahi maangega.", ur: "ہمراہ کبھی پاس ورڈ، PIN یا OTP نہیں مانگے گا۔" },
  { en: "If someone may know your password, change it right away.", roman: "Agar kisi ko password pata ho sakta hai to foran badal dein.", ur: "اگر کسی کو آپ کا پاس ورڈ معلوم ہو سکتا ہے تو فوراً بدل دیں۔" },
];

const TWO_STEP: Record<"whatsapp" | "gmail", Record<"en" | "roman" | "ur", string[]>> = {
  whatsapp: {
    en: ["Open WhatsApp and tap the three dots (⋮) or Settings.", "Tap Account → Two-step verification.", "Tap Turn on and choose a 6-digit PIN only you know.", "Add your email so you can reset the PIN if you forget it.", "Done — WhatsApp will occasionally ask for this PIN."],
    roman: ["WhatsApp kholein aur teen dots (⋮) ya Settings dabayein.", "Account → Two-step verification dabayein.", "Turn on dabayein aur 6 hindson ka PIN chunein jo sirf aap jaanein.", "Apna email dein taake PIN bhoolne par reset ho sake.", "Mukammal — WhatsApp kabhi kabhi yeh PIN poochega."],
    ur: [
      "WhatsApp کھولیں اور تین نقطے (⋮) یا Settings دبائیں۔",
      "Account ← Two-step verification دبائیں۔",
      "Turn on دبائیں اور 6 ہندسوں کا PIN چنیں جو صرف آپ جانتے ہوں۔",
      "اپنا ای میل دیں تاکہ PIN بھولنے پر اسے دوبارہ بنا سکیں۔",
      "مکمل — WhatsApp کبھی کبھی یہ PIN پوچھے گا۔",
    ],
  },
  gmail: {
    en: ["Open myaccount.google.com (type it yourself).", "Tap Security → 2-Step Verification.", "Tap Get started and sign in yourself.", "Add your own phone number and choose to receive a code or prompt.", "Turn it on. New sign-ins will need your phone too."],
    roman: ["myaccount.google.com khud likh kar kholein.", "Security → 2-Step Verification dabayein.", "Get started dabayein aur khud sign in karein.", "Apna phone number dein aur code ya prompt chunein.", "On kar dein. Naye sign-in par phone bhi chahiye hoga."],
    ur: [
      "myaccount.google.com خود لکھ کر کھولیں۔",
      "Security ← 2-Step Verification دبائیں۔",
      "Get started دبائیں اور خود سائن اِن کریں۔",
      "اپنا فون نمبر دیں اور کوڈ یا پرامپٹ چنیں۔",
      "اسے آن کر دیں۔ نئے سائن اِن پر فون بھی چاہیے ہوگا۔",
    ],
  },
};

function TwoStep() {
  const { lang, tx } = useT();
  const [app, setApp] = useState<"whatsapp" | "gmail">("whatsapp");
  const steps = TWO_STEP[app][lang];
  return (
    <Section
      title={tx({ en: "Turn on two-step verification", roman: "Two-step verification on karein", ur: "دو مرحلہ تصدیق آن کریں" })}
      description={tx({ en: "A second lock, so a stolen password isn't enough.", roman: "Doosra taala, taake chura hua password kaafi na ho.", ur: "دوسرا تالا، تاکہ چرایا ہوا پاس ورڈ کافی نہ ہو۔" })}
    >
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented label={tx({ en: "App", roman: "App", ur: "ایپ" })} value={app} onChange={setApp} options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "gmail", label: "Gmail" }]} />
          <SpeakButton id={`2sv-${app}`} text={steps.join(". ")} />
        </div>
        <StepList className="mt-4" items={steps} />
      </Card>
    </Section>
  );
}

export default function GuardianPage() {
  const { lang, tx } = useT();
  const [tab, setTab] = useState<Tab>("checkup");
  return (
    <div>
      <PageHeader
        icon={ShieldCheck}
        tone="success"
        title={tx({ en: "Guardian Mode", roman: "Guardian Mode", ur: "گارڈین موڈ" })}
        subtitle={tx({ en: "Protect your privacy, passwords and codes.", roman: "Apni privacy, password aur codes mehfooz rakhein.", ur: "اپنی پرائیویسی، پاس ورڈ اور کوڈ محفوظ رکھیں۔" })}
      />

      <Segmented<Tab>
        label={tx({ en: "Section", roman: "Hissa", ur: "حصہ" })}
        value={tab}
        onChange={setTab}
        className="mb-6"
        options={[
          { value: "checkup", label: tx({ en: "Checkup", roman: "Checkup", ur: "چیک اپ" }), icon: ClipboardCheck },
          { value: "permissions", label: tx({ en: "Permissions", roman: "Ijazatein", ur: "اجازتیں" }), icon: Smartphone },
          { value: "passwords", label: tx({ en: "Passwords", roman: "Password", ur: "پاس ورڈ" }), icon: KeyRound },
          { value: "twostep", label: tx({ en: "Two-step", roman: "Two-step", ur: "دو مرحلہ تصدیق" }), icon: Lock },
        ]}
      />

      {tab === "checkup" && (
        <Section
          title={tx({ en: "2-minute Privacy Checkup", roman: "2 minute ka Privacy Checkup", ur: "دو منٹ کا پرائیویسی چیک اپ" })}
          description={tx({ en: "7 quick questions. Only your score is saved, on this device.", roman: "7 chhote sawal. Sirf score is device par save hota hai.", ur: "7 مختصر سوال۔ صرف آپ کا اسکور اسی آلے پر محفوظ ہوتا ہے۔" })}
        >
          <Card glow className="p-5">
            <PrivacyCheckup />
          </Card>
        </Section>
      )}

      {tab === "permissions" && (
        <div className="space-y-8">
          <Section
            title={tx({ en: "App permissions", roman: "App ki ijazatein", ur: "ایپ کی اجازتیں" })}
            description={tx({ en: "Ask yourself: does this feature need it?", roman: "Sochiye: kya is feature ko iski zaroorat hai?", ur: "خود سے پوچھیں: کیا اس فیچر کو اس کی ضرورت ہے؟" })}
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PERMISSIONS.map((p) => (
                <div key={p.id} className="flex gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4">
                  <IconTile icon={PERM_ICONS[p.icon] ?? Lock} size="sm" />
                  <div className="min-w-0">
                    <p className="font-semibold">{pick(p.name, lang)}</p>
                    <p className="text-sm text-muted">{pick(p.why, lang)}</p>
                    <p className="mt-1 text-xs text-warning">{pick(p.caution, lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <PermissionChecker />
        </div>
      )}

      {tab === "passwords" && (
        <Section title={tx({ en: "Passwords & OTP safety", roman: "Password aur OTP ki hifazat", ur: "پاس ورڈ اور OTP کی حفاظت" })}>
          <div className="grid gap-4 lg:grid-cols-2">
            <PassphraseGenerator />
            <Card className="p-5">
              <ul className="space-y-3 text-sm">
                {PASSWORD_TIPS.map((tip, i) => (
                  <li key={i} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                    <span>{tx(tip)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </Section>
      )}

      {tab === "twostep" && <TwoStep />}
    </div>
  );
}
