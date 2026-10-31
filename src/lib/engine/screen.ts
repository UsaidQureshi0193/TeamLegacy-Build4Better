// Demo-mode Vision + Document engines. They work only from the OCR text the
// browser extracted (Tesseract), so they never invent anything that isn't visible.

import { DICTIONARY } from "@/data/help";
import type { DocField, DocumentResult, ElementKind, ExplainResult, Lang, OcrLine, ScreenElement, VisionResult } from "../types";

type Tri = Record<Lang, string>;
const t = (en: string, roman: string, ur: string): Tri => ({ en, roman, ur });

const KIND_RULES: { kind: ElementKind; re: RegExp }[] = [
  { kind: "error", re: /\b(error|failed|invalid|incorrect|wrong|not found|try again|unable|denied|expired|ghalat|nakaam)\b/i },
  { kind: "warning", re: /\b(warning|caution|do not share|never share|alert|suspicious)\b/i },
  { kind: "button", re: /^(?:[^\w]*)(pay|pay now|submit|next|continue|confirm|send|ok|okay|login|log in|sign in|sign up|register|cancel|back|save|apply|proceed|verify|done|allow|deny|don'?t allow|accept|agree|i agree|search|download|install|update|open|call|reply|delete|skip|retry|try again|add|start|get started|create account)(?:[^\w]*)$/i },
  { kind: "link", re: /(https?:\/\/|www\.|\.com\b|\.pk\b|forgot password|click here|learn more)/i },
  { kind: "input", re: /\b(enter|type|your (?:name|email|number|phone|address)|user ?name|password|e-?mail|mobile (?:no|number)|reference (?:no|number)|consumer (?:no|number)|cnic|amount|otp|pin|date of birth)\b|:\s*$|_{3,}/i },
];

const BUTTON_WORDS = /^(pay|submit|next|continue|confirm|send|ok|login|cancel|back|save|apply|proceed|verify|done|allow|deny|accept|agree|retry|skip|close)$/i;

function classify(text: string): ElementKind {
  const words = text.replace(/[^w ]/g, " ").trim().split(/s+/);
  if (words.length > 1 && words.length <= 4 && words.every((w) => BUTTON_WORDS.test(w))) return "button";
  for (const r of KIND_RULES) if (r.re.test(text)) return r.kind;
  if (text.length < 40 && /^[A-Z][A-Za-z ]+$/.test(text) && text.split(" ").length <= 5) return "heading";
  return "info";
}

const KIND_EXPLAIN: Record<ElementKind, Tri> = {
  button: t("This looks like a button. Tapping it does an action — read it carefully before tapping.", "Yeh button lagta hai. Isay dabane se koi kaam hota hai — dabane se pehle dhyaan se parhein.", "یہ بٹن لگتا ہے۔ اسے دبانے سے کوئی کام ہوتا ہے۔"),
  input: t("This looks like a box where you type information. Only type details you are sure this official app needs.", "Yeh aisa khaana lagta hai jahan aap maloomat likhte hain. Sirf woh likhein jo is official app ko waqai chahiye.", "یہ ایسا خانہ لگتا ہے جہاں آپ معلومات لکھتے ہیں۔"),
  label: t("This is a label describing a nearby field.", "Yeh label hai jo qareebi khaane ko bayan karta hai.", "یہ لیبل ہے۔"),
  error: t("This looks like an error message — something didn't work. It often tells you what to fix.", "Yeh error message lagta hai — kuch kaam nahi hua. Aksar yeh batata hai kya theek karna hai.", "یہ خرابی کا پیغام لگتا ہے۔"),
  heading: t("This looks like a title telling you which page or section you are on.", "Yeh title lagta hai jo batata hai aap kis page par hain.", "یہ عنوان لگتا ہے۔"),
  link: t("This looks like a link to another page or website. Check where it leads before tapping.", "Yeh kisi aur page ya website ka link lagta hai. Dabane se pehle dekhein kahan le jata hai.", "یہ کسی اور صفحے کا لنک لگتا ہے۔"),
  info: t("This is information shown on the screen.", "Yeh screen par dikhai gayi maloomat hai.", "یہ اسکرین پر دکھائی گئی معلومات ہے۔"),
  warning: t("This is a warning — read it slowly. It is there to protect you.", "Yeh warning hai — aahista parhein. Yeh aap ki hifazat ke liye hai.", "یہ انتباہ ہے، آہستہ پڑھیں۔"),
};

export function demoVision(lines: OcrLine[], lang: Lang): Omit<VisionResult, "mode"> {
  const usable = lines.filter((l) => l.text.trim().length > 1 && l.confidence > 35);
  const limitations: string[] = [
    t("Demo Mode: HUMRAAH read only the text on this image (OCR). It cannot see icons, pictures or colours.", "Demo Mode: HUMRAAH ne sirf tasveer ka text parha (OCR). Icons, tasveerein ya rang nahi dekh sakta.", "ڈیمو موڈ: ہمراہ نے صرف تصویر کا متن پڑھا۔")[lang],
  ];
  const lowConf = lines.filter((l) => l.confidence <= 55).length;
  if (!usable.length) {
    return {
      summary: t("I can't read enough text on this screenshot. Please upload a clearer, brighter screenshot.", "Is screenshot par kaafi text parha nahi ja raha. Meharbani kar ke saaf aur roshan screenshot upload karein.", "اس اسکرین شاٹ پر کافی متن نہیں پڑھا جا رہا۔ براہ کرم صاف اسکرین شاٹ اپ لوڈ کریں۔")[lang],
      screen_type: t("Unknown", "Na maloom", "نامعلوم")[lang],
      next_step: t("Take a new screenshot (Power + Volume Down) and upload it.", "Naya screenshot lein (Power + Volume Down) aur upload karein.", "نیا اسکرین شاٹ لیں۔")[lang],
      elements: [],
      limitations: [...limitations, t("The image was blurry or had too little text.", "Tasveer dhundli thi ya text kam tha.", "تصویر دھندلی تھی۔")[lang]],
    };
  }
  if (lowConf > lines.length / 3) limitations.push(t("Some text was hard to read, so parts may be missing or wrong.", "Kuch text parhna mushkil tha, is liye kuch hissay ghalat ya ghaib ho sakte hain.", "کچھ متن پڑھنا مشکل تھا۔")[lang]);

  const elements: ScreenElement[] = usable.slice(0, 40).map((l) => {
    const kind = classify(l.text.trim());
    return { line_id: l.id, text: l.text.trim(), kind, explanation: KIND_EXPLAIN[kind][lang] };
  });
  const all = usable.map((l) => l.text).join(" ").toLowerCase();

  const types: { re: RegExp; name: Tri; next: Tri }[] = [
    { re: /(otp|verification code|one.?time)/, name: t("Code / verification screen", "Code / verification screen", "کوڈ کی تصدیق کا صفحہ"), next: t("Only type a code here if YOU started this action in your own official app. Never read it to anyone.", "Code sirf tab likhein jab yeh kaam aap ne khud apni official app mein shuru kiya ho. Kisi ko na sunayein.", "کوڈ صرف تب لکھیں جب یہ کام آپ نے خود شروع کیا ہو۔") },
    { re: /(password|sign in|log ?in|username)/, name: t("Login screen", "Login screen", "لاگ ان کا صفحہ"), next: t("Check the app or website is the official one, then type your details privately.", "Tasdeeq karein ke app ya website official hai, phir akele mein apni details likhein.", "پہلے تصدیق کریں کہ ایپ اصلی ہے۔") },
    { re: /(bill|amount|due date|payable|reference)/, name: t("Bill or payment screen", "Bill ya payment screen", "بل یا ادائیگی کا صفحہ"), next: t("Check the amount and reference number match your paper bill before you continue.", "Aage barhne se pehle raqam aur reference number apne bill se milayein.", "رقم اور ریفرنس نمبر بل سے ملائیں۔") },
    { re: /(error|failed|invalid|try again)/, name: t("Error message", "Error message", "خرابی کا پیغام"), next: t("Read the error text — it usually says what to fix. You can tap “I'm stuck” for recovery steps.", "Error ka text parhein — aksar yeh batata hai kya theek karna hai. “I'm stuck” dabakar madad lein.", "خرابی کا متن پڑھیں۔") },
    { re: /(allow|permission|access to)/, name: t("Permission request", "Permission request", "اجازت کی درخواست"), next: t("Ask yourself: does this app need this to do what you want? If not, choose Don't allow.", "Sochiye: kya is app ko aap ke kaam ke liye yeh chahiye? Agar nahi to Don't allow chunein.", "سوچیں: کیا ایپ کو یہ چاہیے؟") },
    { re: /(form|name|address|date of birth|submit)/, name: t("Form", "Form", "فارم"), next: t("Fill one box at a time, then review everything before you press Submit.", "Ek waqt mein ek khaana bharein, phir Submit se pehle sab dobara dekhein.", "ایک وقت میں ایک خانہ بھریں۔") },
  ];
  const match = types.find((ty) => ty.re.test(all));
  const buttons = elements.filter((e) => e.kind === "button").map((e) => `“${e.text}”`);
  const inputs = elements.filter((e) => e.kind === "input").length;
  const errors = elements.filter((e) => e.kind === "error");

  const summaryParts = [
    t(`This looks like a ${match ? match.name.en.toLowerCase() : "screen with information"}.`, `Yeh ${match ? match.name.roman.toLowerCase() : "maloomat wali screen"} lagti hai.`, `یہ ${match ? match.name.ur : "معلومات والا صفحہ"} لگتا ہے۔`)[lang],
  ];
  if (buttons.length) summaryParts.push(t(`I can see these buttons: ${buttons.slice(0, 4).join(", ")}.`, `Mujhe yeh buttons nazar aa rahe hain: ${buttons.slice(0, 4).join(", ")}.`, `یہ بٹن نظر آ رہے ہیں: ${buttons.slice(0, 4).join("، ")}۔`)[lang]);
  if (inputs) summaryParts.push(t(`There ${inputs === 1 ? "is 1 box" : `are ${inputs} boxes`} to fill.`, `${inputs} khaane bharne hain.`, `${inputs} خانے بھرنے ہیں۔`)[lang]);
  if (errors.length) summaryParts.push(t(`There is an error: “${errors[0].text}”.`, `Ek error hai: “${errors[0].text}”.`, `ایک خرابی ہے: “${errors[0].text}”۔`)[lang]);

  const sensitive = /(otp|password|pin|cvv|card number)/.test(all);
  return {
    summary: summaryParts.join(" "),
    screen_type: match ? match.name[lang] : t("General screen", "Aam screen", "عام صفحہ")[lang],
    next_step: match ? match.next[lang] : t("Tap any highlighted line to ask what it means.", "Kisi bhi highlighted line par tap kar ke matlab poochein.", "کسی بھی نمایاں لائن پر ٹیپ کریں۔")[lang],
    elements,
    limitations,
    sensitive_warning: sensitive
      ? t("This screen involves a code or password. HUMRAAH will never ask for it — type it only yourself, inside the official app.", "Is screen par code ya password hai. HUMRAAH kabhi nahi maangega — sirf khud official app mein likhein.", "اس صفحے پر کوڈ یا پاس ورڈ ہے۔ ہمراہ کبھی نہیں مانگے گا۔")[lang]
      : undefined,
  };
}

export function demoExplain(text: string, context: string, lang: Lang): Omit<ExplainResult, "mode"> {
  const kind = classify(text);
  const lower = text.toLowerCase();
  let safe: ExplainResult["safe_to_tap"] = "unknown";
  let tip = t("If you're not sure, don't tap — ask a trusted person or take a screenshot and ask me.", "Agar yaqeen na ho to na dabayein — kisi bharosemand se poochein.", "اگر یقین نہ ہو تو نہ دبائیں۔")[lang];
  if (/(otp|pin|password|cvv)/.test(lower)) {
    safe = "caution";
    tip = t("Only type secret codes inside an official app you opened yourself — never because a call or message told you to.", "Khufia code sirf us official app mein likhein jo aap ne khud kholi — kisi call ya message ke kehne par nahi.", "خفیہ کوڈ صرف اپنی کھولی ہوئی ایپ میں لکھیں۔")[lang];
  } else if (/(cancel|back|close|don'?t allow|deny)/.test(lower)) {
    safe = "yes";
    tip = t("This usually takes you back without doing anything — it is a safe choice when unsure.", "Yeh aksar bina kuch kiye wapas le jata hai — shak ho to mehfooz choice hai.", "یہ عام طور پر محفوظ انتخاب ہے۔")[lang];
  } else if (/(pay|send|confirm|transfer|submit|agree|continue|next|proceed)/.test(lower)) {
    safe = "caution";
    tip = t("This button completes an action. Check the details on screen are correct first — the final tap is yours.", "Yeh button kaam mukammal karta hai. Pehle screen ki details check karein — aakhri tap aap ka hai.", "پہلے تفصیلات چیک کریں۔")[lang];
  } else if (kind === "link") {
    safe = "caution";
  } else if (kind === "info" || kind === "heading" || kind === "label") {
    safe = "yes";
  }
  const term = DICTIONARY.find((d) => [d.term.toLowerCase(), ...d.aliases].some((a) => lower.includes(a)));
  const termLine = term ? ` ${term.term}: ${lang === "en" ? term.en : lang === "roman" ? term.roman : term.ur}` : "";
  return {
    explanation: `“${text}” — ${KIND_EXPLAIN[kind][lang]}${termLine}${context ? "" : ""}`,
    safe_to_tap: safe,
    tip,
  };
}

// ── Document reader ─────────────────────────────────────
const MONTHS = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";

export function demoDocument(text: string, lang: Lang): Omit<DocumentResult, "mode"> {
  const fields: DocField[] = [];
  const seen = new Set<string>();
  const add = (f: DocField) => {
    const key = `${f.kind}:${f.value}`;
    if (!seen.has(key) && fields.length < 12) {
      seen.add(key);
      fields.push(f);
    }
  };
  // Amounts: label each with the words before it on the same line (OCR keeps table rows on one line).
  for (const line of text.split(/\n+/)) {
    for (const m of line.matchAll(/(?:rs\.?|pkr|₨)\s?([\d,]+(?:\.\d{1,2})?)/gi)) {
      const before = line.slice(0, m.index).replace(/[:\-–|]+\s*$/, "").trim().split(/\s{2,}|[|]/).pop()?.slice(-48).trim();
      add({ label: before && /[a-z]/i.test(before) ? before.replace(/\b\w/g, (c) => c.toUpperCase()) : t("Amount", "Raqam", "رقم")[lang], value: `Rs ${m[1]}`, kind: "amount" });
    }
  }
  const dateRe = new RegExp(`(?:(due date|issue date|bill date|last date|date)[^\\n\\d]{0,15})?\\b(\\d{1,2}[-/.](?:\\d{1,2}|${MONTHS})[a-z]*[-/.]\\d{2,4})\\b`, "gi");
  for (const m of text.matchAll(dateRe)) add({ label: m[1] ? m[1].replace(/\b\w/g, (c) => c.toUpperCase()) : t("Date", "Tareekh", "تاریخ")[lang], value: m[2], kind: "date" });
  for (const m of text.matchAll(/(reference|ref|consumer|account|customer|challan|psid|tracking)\s*(?:no\.?|number|id|#)?\s*[:\-]?\s*([A-Z0-9][A-Z0-9 \-]{5,24}\d)/gi)) {
    add({ label: `${m[1].replace(/\b\w/g, (c) => c.toUpperCase())} No.`, value: m[2].trim(), kind: "reference" });
  }

  const lower = text.toLowerCase();
  const terms = DICTIONARY.filter((d) => [d.term.toLowerCase(), ...d.aliases].some((a) => lower.includes(a))).slice(0, 4).map((d) => ({ term: d.term, meaning: lang === "en" ? d.en : lang === "roman" ? d.roman : d.ur }));
  const BILL_TERMS: [RegExp, Tri][] = [
    [/surcharge|late payment/, t("Late payment surcharge: extra money added if you pay after the due date.", "Late payment surcharge: aakhri tareekh ke baad dene par izafi raqam.", "تاخیر سے ادائیگی پر اضافی رقم۔")],
    [/units?|kwh/, t("Units (kWh): how much electricity you used this month.", "Units (kWh): is mahine kitni bijli istemal hui.", "یونٹس: اس مہینے کتنی بجلی استعمال ہوئی۔")],
    [/arrears/, t("Arrears: unpaid money from earlier bills.", "Arrears: pichle bills ki baqaya raqam.", "بقایا: پچھلے بلوں کی رقم۔")],
    [/fpa|fuel (price|adjustment)/, t("FPA (fuel price adjustment): a charge that changes with fuel costs.", "FPA: fuel ki qeemat ke hisaab se badalne wala charge.", "ایندھن کی قیمت کا ایڈجسٹمنٹ۔")],
    [/gst|sales tax|income tax/, t("Tax: government tax included in your bill.", "Tax: bill mein shamil sarkari tax.", "ٹیکس: سرکاری ٹیکس۔")],
  ];
  for (const [re, m] of BILL_TERMS) if (re.test(lower)) {
    const [term, ...rest] = m[lang].split(":");
    terms.push({ term: term.trim(), meaning: rest.join(":").trim() });
  }

  const isBill = /(bill|units|kwh|payable|electric|gas|water|due date)/.test(lower);
  const isChallan = /(challan|psid|fee)/.test(lower);
  const docType = isBill ? t("Utility bill", "Utility bill", "یوٹیلیٹی بل")[lang] : isChallan ? t("Fee challan", "Fee challan", "فیس چالان")[lang] : t("Document", "Document", "دستاویز")[lang];

  const amounts = fields.filter((f) => f.kind === "amount");
  const amount = amounts.find((f) => /within|payable|total|net/i.test(f.label) && !/after|late|surcharge/i.test(f.label)) ?? amounts[0];
  const date = fields.find((f) => f.kind === "date" && /due|last/i.test(f.label)) ?? fields.find((f) => f.kind === "date");
  const ref = fields.find((f) => f.kind === "reference");
  const summary = fields.length
    ? t(
        `This looks like a ${docType.toLowerCase()}.${amount ? ` The amount shown is ${amount.value}.` : ""}${date ? ` A date on it is ${date.value}.` : ""}${ref ? ` Its ${ref.label} is ${ref.value}.` : ""} Please double-check these against the paper.`,
        `Yeh ${docType.toLowerCase()} lagta hai.${amount ? ` Raqam ${amount.value} hai.` : ""}${date ? ` Is par tareekh ${date.value} hai.` : ""}${ref ? ` Is ka ${ref.label} ${ref.value} hai.` : ""} Kaghaz se dobara mila lein.`,
        `یہ ${docType} لگتا ہے۔${amount ? ` رقم ${amount.value} ہے۔` : ""}${date ? ` تاریخ ${date.value} ہے۔` : ""} کاغذ سے دوبارہ ملا لیں۔`,
      )[lang]
    : t("I couldn't find clear amounts, dates or reference numbers. Try a sharper, well-lit photo taken straight from above.", "Wazeh raqam, tareekh ya reference number nahi mila. Upar se seedhi, roshni mein saaf tasveer lein.", "واضح رقم یا تاریخ نہیں ملی۔ صاف تصویر لیں۔")[lang];

  const checklist: string[] = [];
  if (amount) checklist.push(t(`Prepare ${amount.value} for payment.`, `${amount.value} ki payment tayyar rakhein.`, `${amount.value} کی ادائیگی تیار رکھیں۔`)[lang]);
  if (date) checklist.push(t(`Pay or act before ${date.value} to avoid extra charges.`, `${date.value} se pehle payment karein taake izafi charges na lagein.`, `${date.value} سے پہلے ادائیگی کریں۔`)[lang]);
  if (ref) checklist.push(t(`Keep the ${ref.label} handy — the bank or app will ask for it.`, `${ref.label} paas rakhein — bank ya app maangegi.`, `${ref.label} پاس رکھیں۔`)[lang]);
  checklist.push(t("Pay only through your bank's official app, a bank branch or an official agent.", "Sirf bank ki official app, branch ya official agent se payment karein.", "صرف سرکاری ایپ یا برانچ سے ادائیگی کریں۔")[lang]);
  checklist.push(t("Keep the receipt after paying.", "Payment ke baad raseed sambhal lein.", "ادائیگی کے بعد رسید سنبھال لیں۔")[lang]);

  const warnings: string[] = [];
  if (/\b\d{5}-\d{7}-\d\b|\[CNIC hidden\]/.test(text)) warnings.push(t("This document shows a CNIC number. HUMRAAH hid it — avoid sharing photos of it.", "Is document par CNIC number hai. HUMRAAH ne chhupa diya — is ki tasveer share karne se bachein.", "اس پر شناختی کارڈ نمبر ہے۔")[lang]);
  if (/(whatsapp|easypaisa|jazzcash)\s*(to|on|par)?\s*0?3\d{2}/i.test(text)) warnings.push(t("It asks for payment to a mobile number — official bills don't. Verify before paying.", "Is mein mobile number par payment ka kaha gaya hai — official bills aisa nahi karte. Tasdeeq karein.", "موبائل نمبر پر ادائیگی کا کہا گیا ہے، تصدیق کریں۔")[lang]);

  return {
    doc_type: docType,
    summary,
    fields,
    terms,
    checklist,
    warnings,
    limitations: [
      t("Demo Mode: values were found by reading the text (OCR) and pattern matching. Always confirm them on the original paper.", "Demo Mode: values text parh kar (OCR) nikali gayi hain. Hamesha asal kaghaz se tasdeeq karein.", "ڈیمو موڈ: اصل کاغذ سے تصدیق کریں۔")[lang],
    ],
  };
}
