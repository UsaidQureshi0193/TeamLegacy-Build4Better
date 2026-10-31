"use client";

import { usePrefs } from "./prefs";
import type { Lang } from "./types";

type Tri = { en: string; roman: string; ur: string };

/** UI chrome strings. Module content uses its own bilingual data or the AI's language. */
export const STRINGS = {
  "nav.home": { en: "Home", roman: "Home", ur: "ہوم" },
  "nav.assistant": { en: "AI Assistant", roman: "AI Assistant", ur: "اے آئی اسسٹنٹ" },
  "nav.shield": { en: "Scam Shield", roman: "Scam Shield", ur: "اسکیم شیلڈ" },
  "nav.vision": { en: "Vision AI", roman: "Vision AI", ur: "ویژن اے آئی" },
  "nav.guide": { en: "Digital Guide", roman: "Digital Guide", ur: "ڈیجیٹل گائیڈ" },
  "nav.academy": { en: "Academy", roman: "Academy", ur: "اکیڈمی" },
  "nav.guardian": { en: "Guardian Mode", roman: "Guardian Mode", ur: "گارڈین موڈ" },
  "nav.document": { en: "Document Reader", roman: "Document Reader", ur: "ڈاکیومنٹ ریڈر" },
  "nav.emergency": { en: "Emergency Help", roman: "Emergency Help", ur: "ایمرجنسی مدد" },
  "nav.progress": { en: "Progress", roman: "Progress", ur: "پیش رفت" },
  "nav.settings": { en: "Settings", roman: "Settings", ur: "ترتیبات" },
  "nav.protect": { en: "Protect", roman: "Hifazat", ur: "حفاظت" },
  "nav.learn": { en: "Learn", roman: "Seekhein", ur: "سیکھیں" },
  "nav.understand": { en: "Understand", roman: "Samjhein", ur: "سمجھیں" },
  "nav.you": { en: "You", roman: "Aap", ur: "آپ" },
  "top.search": { en: "Search HUMRAAH or a word like “OTP”…", roman: "HUMRAAH ya “OTP” jaisa lafz dhoondein…", ur: "ہمراہ یا “او ٹی پی” جیسا لفظ تلاش کریں…" },
  "top.notifications": { en: "Notifications", roman: "Notifications", ur: "اطلاعات" },
  "top.theme": { en: "Switch theme", roman: "Theme badlein", ur: "تھیم بدلیں" },
  "common.demo": { en: "Demo Mode", roman: "Demo Mode", ur: "ڈیمو موڈ" },
  "common.live": { en: "Live AI", roman: "Live AI", ur: "لائیو اے آئی" },
  "common.analyse": { en: "Analyse", roman: "Jaanch karein", ur: "جانچ کریں" },
  "common.upload": { en: "Upload screenshot", roman: "Screenshot upload karein", ur: "اسکرین شاٹ اپ لوڈ کریں" },
  "common.listen": { en: "Read aloud", roman: "Parh kar sunayein", ur: "پڑھ کر سنائیں" },
  "common.stop": { en: "Stop", roman: "Rokein", ur: "روکیں" },
  "common.tryAgain": { en: "Try again", roman: "Dobara koshish", ur: "دوبارہ کوشش" },
  "common.next": { en: "Next", roman: "Agla", ur: "اگلا" },
  "common.previous": { en: "Previous", roman: "Pichla", ur: "پچھلا" },
  "common.hint": { en: "Hint", roman: "Ishara", ur: "اشارہ" },
  "common.repeat": { en: "Repeat", roman: "Dobara sunayein", ur: "دوبارہ سنائیں" },
  "common.simpler": { en: "Simpler words", roman: "Aasaan alfaaz", ur: "آسان الفاظ" },
  "common.stuck": { en: "I'm stuck", roman: "Main atak gaya/gayi", ur: "میں اٹک گیا ہوں" },
  "common.dontUnderstand": { en: "I don't understand", roman: "Samajh nahi aaya", ur: "سمجھ نہیں آیا" },
  "home.greeting": { en: "Assalam o Alaikum", roman: "Assalam o Alaikum", ur: "السلام علیکم" },
  "home.tagline": { en: "Your Personal Guide to a Safer Digital Life", roman: "Mehfooz digital zindagi ke liye aap ka humraah", ur: "محفوظ ڈیجیٹل زندگی کے لیے آپ کا ہمراہ" },
  "home.promise": { en: "Samjhay bhi. Sikhaye bhi. Hifazat bhi kare.", roman: "Samjhay bhi. Sikhaye bhi. Hifazat bhi kare.", ur: "سمجھائے بھی۔ سکھائے بھی۔ حفاظت بھی کرے۔" },
  "home.speak": { en: "Speak to Humraah", roman: "Humraah se baat karein", ur: "ہمراہ سے بات کریں" },
  "home.check": { en: "Check a Message", roman: "Message check karein", ur: "پیغام چیک کریں" },
  "home.screen": { en: "Understand a Screen", roman: "Screen samjhein", ur: "اسکرین سمجھیں" },
  "home.learnTask": { en: "Learn a Task", roman: "Koi kaam seekhein", ur: "کوئی کام سیکھیں" },
  "home.practice": { en: "Practice Safely", roman: "Mehfooz mashq", ur: "محفوظ مشق" },
} satisfies Record<string, Tri>;

export type StringKey = keyof typeof STRINGS;

export function translate(key: StringKey, lang: Lang) {
  return STRINGS[key][lang];
}

export function useT() {
  const { prefs } = usePrefs();
  const lang = prefs.lang;
  return {
    lang,
    t: (key: StringKey) => STRINGS[key][lang],
    /** Pick from an inline {en, roman, ur?} literal. Urdu falls back to Roman Urdu when not provided. */
    tx: (v: { en: string; roman: string; ur?: string }) => (lang === "en" ? v.en : lang === "ur" ? (v.ur ?? v.roman) : v.roman),
  };
}

export const SPEECH_LANG: Record<Lang, string> = { en: "en-US", roman: "ur-PK", ur: "ur-PK" };
