// Demo-mode assistant: keyword intent routing + curated answers.
// Honest by design — it says what it can do and routes to the right module.

import { DICTIONARY } from "@/data/help";
import { matchTask } from "@/data/tasks";
import type { AssistantAction, ChatReply, Lang, ModuleId } from "../types";
import { analyzeScamRules } from "./scam";

type Tri = Record<Lang, string>;
const t = (en: string, roman: string, ur: string): Tri => ({ en, roman, ur });

const INTENTS: { module: ModuleId; words: RegExp }[] = [
  { module: "emergency", words: /\b(hack|hacked|stolen|chori|shared (?:my )?(?:otp|pin|code)|bata diya|money (?:gone|missing)|paise (?:nikal|chale)|fraud ho gaya|lost (?:my )?phone|phone gum)\b|ہیک|چوری/i },
  { module: "shield", words: /\b(scam|fraud|fake|dhoka|dhoke|suspicious|mashkook|sms|message|msg|link|otp|lottery|prize|inaam|is this real|safe hai|asli hai)\b|دھوکہ|پیغام|مشکوک/i },
  { module: "vision", words: /\b(screen|screenshot|samajh nahi|samjh nahi|what is this|yeh kya hai|button|error)\b|اسکرین/i },
  { module: "document", words: /\b(bill|challan|notice|letter|document|form ka matlab|due date)\b|بل|چالان/i },
  { module: "guardian", words: /\b(permission|privacy|password|2fa|two[- ]step|location|camera access|ijazat)\b|پاس ورڈ|اجازت/i },
  { module: "academy", words: /\b(practice|practise|seekh|learn|quiz|game|escape room|mashq)\b|مشق|سیکھ/i },
  { module: "progress", words: /\b(progress|score|my learning|kitna seekha)\b/i },
];

const ROUTE_LABEL: Record<ModuleId, Tri> = {
  assistant: t("Assistant", "Assistant", "اسسٹنٹ"),
  shield: t("Check this message in Scam Shield", "Scam Shield mein message check karein", "اسکیم شیلڈ میں پیغام چیک کریں"),
  vision: t("Explain a screenshot in Vision AI", "Vision AI mein screenshot samjhein", "ویژن میں اسکرین شاٹ سمجھیں"),
  guide: t("Start a step-by-step guide", "Step by step guide shuru karein", "قدم بہ قدم رہنمائی شروع کریں"),
  academy: t("Practise safely in the Academy", "Academy mein mehfooz mashq karein", "اکیڈمی میں محفوظ مشق کریں"),
  guardian: t("Open Guardian privacy tools", "Guardian privacy tools kholein", "گارڈین پرائیویسی ٹولز کھولیں"),
  document: t("Read a bill or document", "Bill ya document parhein", "بل یا دستاویز پڑھیں"),
  emergency: t("Open Emergency Help now", "Abhi Emergency Help kholein", "ابھی ایمرجنسی ہیلپ کھولیں"),
  progress: t("See my progress", "Apni progress dekhein", "اپنی پیش رفت دیکھیں"),
  settings: t("Settings", "Settings", "ترتیبات"),
};

const REPLIES: Partial<Record<ModuleId, Tri>> = {
  emergency: t(
    "I'm sorry this happened — let's act calmly and quickly. First, call your bank on the number printed on the back of your card and ask them to block your card and online banking. Emergency Help has a step-by-step checklist.",
    "Mujhe afsos hai — chaliye sukoon se magar jaldi qadam uthate hain. Pehle card ke peeche likhe number par bank ko call kar ke card aur online banking block karwayein. Emergency Help mein step by step checklist hai.",
    "مجھے افسوس ہے، آئیے سکون سے مگر جلدی قدم اٹھاتے ہیں۔ پہلے کارڈ کے پیچھے لکھے نمبر پر بینک کو کال کر کے کارڈ اور آن لائن بینکنگ بند کروائیں۔",
  ),
  shield: t(
    "I can check that for you. Paste the message or upload a screenshot in Scam Shield, and I'll show you exactly which parts look risky — and why. Until then: don't reply, don't tap links and never share a code.",
    "Main check kar sakta hoon. Scam Shield mein message paste karein ya screenshot upload karein, main bataunga kaunsa hissa khatarnaak hai aur kyun. Tab tak: jawab na dein, link na kholein aur code kabhi na batayein.",
    "میں چیک کر سکتا ہوں۔ اسکیم شیلڈ میں پیغام پیسٹ کریں یا اسکرین شاٹ اپ لوڈ کریں۔ تب تک جواب نہ دیں، لنک نہ کھولیں اور کوڈ کبھی نہ بتائیں۔",
  ),
  vision: t(
    "No problem — screens can be confusing. Take a screenshot and upload it in Vision AI. I'll explain what the screen is asking, and you can tap any part to ask about it.",
    "Koi baat nahi — screens uljha deti hain. Screenshot le kar Vision AI mein upload karein. Main bataunga screen kya keh rahi hai, aur aap kisi bhi hissay par tap kar ke pooch sakte hain.",
    "کوئی بات نہیں۔ اسکرین شاٹ لے کر ویژن میں اپ لوڈ کریں۔ میں بتاؤں گا کہ اسکرین کیا کہہ رہی ہے۔",
  ),
  document: t(
    "I can read bills and notices with you. Upload a photo in Document Reader and I'll pick out the amount, due date and reference number, and explain any hard words. Please cover your CNIC number before uploading.",
    "Main bill aur notices parhne mein madad kar sakta hoon. Document Reader mein tasveer upload karein, main raqam, aakhri tareekh aur reference number nikaal kar mushkil alfaaz samjhaunga. Upload se pehle CNIC number chhupa dein.",
    "میں بل اور نوٹس پڑھنے میں مدد کر سکتا ہوں۔ ڈاکیومنٹ ریڈر میں تصویر اپ لوڈ کریں۔ اپ لوڈ سے پہلے شناختی کارڈ نمبر چھپا دیں۔",
  ),
  guardian: t(
    "Good question — privacy matters. Guardian has a 2-minute Privacy Checkup, plain explanations of app permissions, and how to turn on two-step verification.",
    "Acha sawal — privacy zaroori hai. Guardian mein 2 minute ka Privacy Checkup, app permissions ki aasaan wazahat aur two-step verification on karne ka tareeqa hai.",
    "اچھا سوال۔ گارڈین میں دو منٹ کا پرائیویسی چیک اپ اور ایپ اجازتوں کی آسان وضاحت ہے۔",
  ),
  academy: t(
    "Practice is the best teacher! The Academy has a Scam Escape Room and practice missions with fictional data — mistakes there are completely safe.",
    "Mashq behtareen ustaad hai! Academy mein Scam Escape Room aur farzi data wale missions hain — wahan ghalti bilkul mehfooz hai.",
    "مشق بہترین استاد ہے! اکیڈمی میں اسکیم ایسکیپ روم اور فرضی ڈیٹا والی مشقیں ہیں۔",
  ),
  progress: t("Your progress page shows what you've learned, hints used and your Digital Independence Score.", "Progress page par aap ka seekha hua, hints aur Digital Independence Score nazar aata hai.", "پیش رفت کے صفحے پر آپ کا سیکھا ہوا اور اسکور نظر آتا ہے۔"),
};

const FALLBACK = t(
  "I'm here to help, one step at a time. I can check suspicious messages, explain a screenshot or bill, guide you through tasks like WhatsApp calls or bill payment, and let you practise safely. What would you like to do?",
  "Main madad ke liye haazir hoon, ek ek qadam. Main mashkook messages check kar sakta hoon, screenshot ya bill samjha sakta hoon, WhatsApp call ya bill payment jaise kaam sikha sakta hoon, aur mehfooz mashq karwa sakta hoon. Aap kya karna chahenge?",
  "میں مدد کے لیے حاضر ہوں۔ میں مشکوک پیغامات چیک کر سکتا ہوں، اسکرین شاٹ یا بل سمجھا سکتا ہوں، اور کام قدم بہ قدم سکھا سکتا ہوں۔ آپ کیا کرنا چاہیں گے؟",
);

export function demoChat(message: string, lang: Lang, style: "normal" | "simpler"): Omit<ChatReply, "mode"> {
  const msg = message.trim();
  const actions: AssistantAction[] = [];

  // A pasted message long enough to analyse → run Scam DNA inline.
  if (msg.length > 60 && /(otp|link|http|www\.|account|bank|prize|inaam|send|bhej|rs\.?\s?\d|urgent|blocked)/i.test(msg)) {
    const scan = analyzeScamRules(msg, lang);
    // Only answer inline when real warning signs were found; a "low" result on a user's own description
    // would be falsely reassuring, so those fall through to normal routing below.
    if (scan.risk_level === "high" || scan.risk_level === "medium") {
      const flags = scan.indicators.filter((i) => i.severity !== "low").slice(0, 3).map((i) => `• ${i.indicator}: “${i.evidence}”`).join("\n");
      return {
        reply: `${scan.summary}\n\n${flags}\n\n${scan.safe_actions[0] ?? ""}`,
        language: lang,
        module: "shield",
        actions: [
          { label: ROUTE_LABEL.shield[lang], module: "shield", payload: msg },
          { label: ROUTE_LABEL.emergency[lang], module: "emergency" },
        ],
      };
    }
  }

  // Dictionary question ("what is OTP")
  const lower = msg.toLowerCase();
  const term = DICTIONARY.find((d) => [d.term.toLowerCase(), ...d.aliases].some((a) => new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lower)));
  const asksMeaning = /\b(what is|what's|matlab|kya hai|kya hota|meaning|explain)\b|کیا ہے|مطلب/i.test(msg);
  if (term && asksMeaning) {
    const body = lang === "en" ? term.en : lang === "roman" ? term.roman : term.ur;
    const ex = lang === "en" ? term.example.en : term.example.roman;
    return {
      reply: style === "simpler" ? body.split(". ")[0] + "." : `${term.term}: ${body}\n\n${ex}`,
      language: lang,
      module: "general",
      actions: [{ label: ROUTE_LABEL.academy[lang], module: "academy" }],
    };
  }

  // A task the Guide can teach
  const task = matchTask(msg);
  const wantsHowTo = /\b(how|kaise|kese|sikha|seekhna|teach|help me|madad|karna hai|karni hai|chahta|chahti)\b|کیسے|سکھا/i.test(msg);
  if (task && wantsHowTo) {
    const title = lang === "en" ? task.title.en : task.title.roman;
    actions.push({ label: ROUTE_LABEL.guide[lang], module: "guide", payload: task.id });
    actions.push({ label: ROUTE_LABEL.academy[lang], module: "academy" });
    return {
      reply: t(
        `Yes, I can teach you: “${title}”. We'll go one step at a time, and you'll do each step yourself. It takes about ${task.minutes} minutes. Shall we start?`,
        `Ji haan, main sikha sakta hoon: “${title}”. Hum ek ek qadam chalenge aur har qadam aap khud karenge. Taqreeban ${task.minutes} minute lagenge. Shuru karein?`,
        `جی ہاں، میں سکھا سکتا ہوں: “${title}”۔ ہم ایک ایک قدم چلیں گے۔ تقریباً ${task.minutes} منٹ لگیں گے۔`,
      )[lang],
      language: lang,
      module: "guide",
      actions,
    };
  }

  for (const intent of INTENTS) {
    if (intent.words.test(msg)) {
      const reply = REPLIES[intent.module]?.[lang] ?? FALLBACK[lang];
      actions.push({ label: ROUTE_LABEL[intent.module][lang], module: intent.module, payload: intent.module === "shield" && msg.length > 40 ? msg : undefined });
      if (intent.module === "shield") actions.push({ label: ROUTE_LABEL.emergency[lang], module: "emergency" });
      return { reply: style === "simpler" ? reply.split(". ").slice(0, 2).join(". ") + "." : reply, language: lang, module: intent.module, actions };
    }
  }

  if (/\b(otp|pin|password)\b\s*[:=]?\s*\d{4,}/i.test(msg)) {
    return {
      reply: t(
        "Please don't share codes or passwords with anyone — including me. I never need them. If someone asked you for this code, open Emergency Help.",
        "Meharbani kar ke code ya password kisi ko na batayein — mujhe bhi nahi. Mujhe kabhi in ki zaroorat nahi. Agar kisi ne yeh code maanga tha to Emergency Help kholein.",
        "براہ کرم کوڈ یا پاس ورڈ کسی کو نہ بتائیں، مجھے بھی نہیں۔",
      )[lang],
      language: lang,
      module: "emergency",
      actions: [{ label: ROUTE_LABEL.emergency[lang], module: "emergency" }],
    };
  }

  return {
    reply: FALLBACK[lang],
    language: lang,
    module: "general",
    actions: [
      { label: ROUTE_LABEL.shield[lang], module: "shield" },
      { label: ROUTE_LABEL.guide[lang], module: "guide" },
      { label: ROUTE_LABEL.academy[lang], module: "academy" },
    ],
  };
}
