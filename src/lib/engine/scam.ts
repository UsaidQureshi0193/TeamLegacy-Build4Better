// Built-in, explainable scam-indicator engine ("Scam DNA").
// Used as Demo Mode when no AI key is configured, and as a safety net that
// guarantees critical red flags (OTP / credential requests) are never missed.

import type { IndicatorType, Lang, RiskLevel, ScamAnalysis, ScamIndicator } from "../types";

type Tri = Record<Lang, string>;
const t = (en: string, roman: string, ur: string): Tri => ({ en, roman, ur });

interface Detector {
  type: IndicatorType;
  severity: ScamIndicator["severity"];
  patterns: RegExp[];
  title: Tri;
  explain: Tri;
  /** Skip a match if one of these words appears just before it (e.g. "never share your OTP"). */
  negatable?: boolean;
}

const DETECTORS: Detector[] = [
  {
    type: "otp_request",
    severity: "high",
    negatable: true,
    patterns: [
      /\b(share|send|reply(?: with)?|tell|provide|give|forward|confirm|enter)\b[^.!?\n]{0,30}?\b(otp|one[- ]?time[- ]?(?:pass(?:word|code)?|code|pin)|verification code|security code|pin|code)\b/gi,
      /\b(otp|verification code|pin|code)\b[^.!?\n]{0,30}?\b(share|send|reply|bata\w*|bhej\w*|de\s?d[oe]|dein|batain|likh\w*)\b/gi,
      /\b(otp|verification code|pin|code)\b[^.!?\n]{0,20}?\b(maang\w*|chahiye|request\w*|asking|asked|needed)\b/gi,
      /\b(ask(?:s|ed|ing)?|request(?:s|ed|ing)?)\b(?: you)?(?: for)?(?: your| my| the)?\s(otp|pin|verification code|one[- ]?time (?:code|password))\b/gi,
      /(او\s?ٹی\s?پی|کوڈ|پن)[^۔\n]{0,25}(بتائیں|بتا دیں|بھیجیں|بھیج دیں|شیئر|مانگ)/g,
    ],
    title: t("Asks for your OTP or code", "OTP ya code maang raha hai", "او ٹی پی یا کوڈ مانگا جا رہا ہے"),
    explain: t(
      "An OTP is a one-time key to your account. Real banks and companies never ask you to share it by SMS, call or WhatsApp. Anyone who has it can enter your account.",
      "OTP aap ke account ki ek-baar wali chaabi hai. Asli bank kabhi SMS, call ya WhatsApp par OTP nahi maangta. Jis ke paas yeh code ho, woh aap ke account mein ja sakta hai.",
      "او ٹی پی آپ کے اکاؤنٹ کی ایک بار والی چابی ہے۔ اصل بینک کبھی ایس ایم ایس، کال یا واٹس ایپ پر او ٹی پی نہیں مانگتا۔",
    ),
  },
  {
    type: "credential_request",
    severity: "high",
    negatable: true,
    patterns: [
      /\b(password|passcode|login details|user ?name and password|cvv|cvc|card number|atm pin|mpin|account details|bank details|cnic (?:number|no))\b/gi,
      /(پاس ورڈ|اے ٹی ایم پن|کارڈ نمبر|شناختی کارڈ نمبر)/g,
    ],
    title: t("Asks for private login or card details", "Password ya card ki details maang raha hai", "پاس ورڈ یا کارڈ کی معلومات مانگی جا رہی ہیں"),
    explain: t(
      "Passwords, PINs, CVV and card numbers are secrets. A genuine service already has what it needs and will not ask you to type or send them in a message.",
      "Password, PIN, CVV aur card number raaz hain. Asli idara yeh cheezein message mein kabhi nahi maangta.",
      "پاس ورڈ، پن، سی وی وی اور کارڈ نمبر راز ہیں۔ اصل ادارہ یہ چیزیں پیغام میں کبھی نہیں مانگتا۔",
    ),
  },
  {
    type: "urgency",
    severity: "medium",
    patterns: [
      /\b(urgent(?:ly)?|immediately|right now|within \d+\s?(?:hours?|hrs?|minutes?|mins?)|in \d+\s?(?:hours?|minutes?)|today only|last chance|final (?:notice|warning|reminder)|act now|asap|expires? (?:today|soon)|emergency|foran|fori|jaldi|abhi)\b/gi,
      /(فوری|فوراً|جلدی|ابھی|آخری موقع)/g,
    ],
    title: t("Creates panic and hurry", "Jaldi aur ghabrahat paida kar raha hai", "جلدی اور گھبراہٹ پیدا کی جا رہی ہے"),
    explain: t(
      "Scammers rush you so you don't stop to think or ask someone. A real problem can wait the few minutes it takes to call the official number yourself.",
      "Fraud karne wale jaldi is liye machate hain taake aap soch na sakein. Asli masla itna intezar kar sakta hai ke aap khud official number par call kar lein.",
      "دھوکے باز جلدی اس لیے مچاتے ہیں تاکہ آپ سوچ نہ سکیں۔ اصل مسئلہ اتنا انتظار کر سکتا ہے کہ آپ خود سرکاری نمبر پر کال کر لیں۔",
    ),
  },
  {
    type: "threat",
    severity: "medium",
    patterns: [
      /\b(will be (?:blocked|suspended|closed|deactivated|terminated|cancel+ed)|has been (?:blocked|suspended|locked|deactivated)|account (?:is )?(?:blocked|suspended|locked|on hold)|legal action|arrest|penalty|fine of|band ho\w*|block ho\w*)\b/gi,
      /(بند کر دیا جائے گا|بند ہو جائے گا|بلاک|معطل|قانونی کارروائی|گرفتار)/g,
    ],
    title: t("Threatens a loss or punishment", "Nuqsan ya saza ki dhamki", "نقصان یا سزا کی دھمکی"),
    explain: t(
      "Threats like 'your account will be blocked' are used to scare you into acting fast. Check your account in the official app instead of replying.",
      "'Aap ka account band ho jaye ga' jaisi dhamki dara kar jaldi karwane ke liye hoti hai. Jawab dene ke bajaye official app mein khud check karein.",
      "'آپ کا اکاؤنٹ بند ہو جائے گا' جیسی دھمکی ڈرانے کے لیے ہوتی ہے۔ جواب دینے کے بجائے سرکاری ایپ میں خود چیک کریں۔",
    ),
  },
  {
    type: "prize_offer",
    severity: "medium",
    patterns: [
      /\b(you(?:'ve| have)? won|winner|congratulations|lucky draw|lottery|jackpot|prize|reward|free gift|cash ?back of|inaam|inam|qurandazi)\b/gi,
      /(انعام|مبارک ہو|قرعہ اندازی|لاٹری|جیت)/g,
    ],
    title: t("Promises a prize or free money", "Inaam ya muft paison ka laalach", "انعام یا مفت پیسوں کا لالچ"),
    explain: t(
      "If you did not enter a draw, you cannot win it. 'Prize' messages usually end with a fee or a request for your details.",
      "Agar aap ne koi qurandazi join nahi ki to aap jeet nahi sakte. Aise 'inaam' ke baad aksar fees ya details maangi jaati hain.",
      "اگر آپ نے کوئی قرعہ اندازی میں حصہ نہیں لیا تو آپ جیت نہیں سکتے۔ ایسے انعام کے بعد اکثر فیس یا معلومات مانگی جاتی ہیں۔",
    ),
  },
  {
    type: "payment_request",
    severity: "high",
    negatable: true,
    patterns: [
      /\b(?:rs\.?|pkr)\s?[\d,]+[^.!?\n]{0,35}?\b(?:bhej\w*|send|transfer|jama kar\w*|de do|dein)\b/gi,
      /\b(send|transfer|pay|deposit|jama kar\w*|bhej\w*)\b[^.!?\n]{0,25}?\b(rs\.?|pkr|rupees?|money|amount|fee|charges?|paise|raqam)\b/gi,
      /\b(processing|delivery|release|registration|clearance|customs|tax) (?:fee|charges?)\b/gi,
      /\b(easypaisa|jazzcash|jazz cash)\b[^.!?\n]{0,25}?\b(send|bhej\w*|transfer|number)\b/gi,
      /(رقم|پیسے|فیس)[^۔\n]{0,20}(بھیجیں|جمع کروائیں|ٹرانسفر)/g,
    ],
    title: t("Asks you to send money", "Paise bhejne ko keh raha hai", "پیسے بھیجنے کا کہا جا رہا ہے"),
    explain: t(
      "Being asked to pay a 'fee' to receive money, a parcel or a prize is a classic trick. Money sent this way is very hard to get back.",
      "Kuch paane ke liye pehle 'fees' bhejna ek purana dhoka hai. Is tarah bheje gaye paise wapas milna bohat mushkil hota hai.",
      "کچھ حاصل کرنے کے لیے پہلے فیس بھیجنا پرانا دھوکہ ہے۔ اس طرح بھیجے گئے پیسے واپس ملنا بہت مشکل ہوتا ہے۔",
    ),
  },
  {
    type: "impersonation",
    severity: "low",
    patterns: [
      /\b(bank|hbl|ubl|mcb|meezan|allied bank|bank alfalah|state bank|sbp|easypaisa|jazzcash|nadra|fbr|pta|bisp|benazir|ehsaas|customer (?:care|support|service)|helpline|head office|fraud department|security team|tcs|leopards|courier|pakistan post)\b/gi,
      /(بینک|نادرا|بے نظیر|احساس|کسٹمر کیئر|ہیلپ لائن)/g,
    ],
    title: t("Claims to be an official organisation", "Kisi bare idare ka naam le raha hai", "کسی سرکاری یا بڑے ادارے کا نام لیا گیا ہے"),
    explain: t(
      "Anyone can type a bank's or government's name into a message. The name alone proves nothing — verify by calling the number printed on your card, bill or the official website.",
      "Koi bhi message mein bank ya hukoomat ka naam likh sakta hai. Sirf naam se kuch sabit nahi hota — apne card ya official website par diye number se tasdeeq karein.",
      "کوئی بھی پیغام میں بینک یا حکومت کا نام لکھ سکتا ہے۔ صرف نام سے کچھ ثابت نہیں ہوتا۔ اپنے کارڈ یا سرکاری ویب سائٹ پر دیے گئے نمبر سے تصدیق کریں۔",
    ),
  },
  {
    type: "secrecy",
    severity: "medium",
    patterns: [
      /\b(don'?t tell (?:anyone|anybody|\w+)|keep (?:this|it) (?:secret|confidential)|do not inform|\w+ ko (?:mat|na) bata\w*)\b/gi,
      /(کسی کو نہ بتائیں|کسی کو مت بتانا|راز رکھیں)/g,
    ],
    title: t("Asks you to keep it secret", "Raaz rakhne ko keh raha hai", "راز رکھنے کا کہا جا رہا ہے"),
    explain: t(
      "Scammers want to stop you from checking with family or the bank. Talking to someone you trust is always allowed.",
      "Fraud karne wale chahte hain ke aap ghar walon ya bank se na poochein. Kisi bharosemand se baat karna hamesha theek hai.",
      "دھوکے باز چاہتے ہیں کہ آپ گھر والوں یا بینک سے نہ پوچھیں۔ کسی قابل اعتماد شخص سے بات کرنا ہمیشہ ٹھیک ہے۔",
    ),
  },
  {
    type: "unusual_contact",
    severity: "medium",
    patterns: [
      /\b(this is my new number|my new number|changed my number|new whatsapp number|naya number)\b/gi,
      /\b(?:call|contact|whatsapp|reply|helpline)\b[^.!?\n]{0,25}?(?:\+?92[- ]?|\b0)3\d{2}[- ]?\d{7}\b/gi,
      /(میرا نیا نمبر|نیا نمبر)/g,
    ],
    title: t("Unusual number or 'new number' story", "Naya ya ajeeb number", "نیا یا غیر معمولی نمبر"),
    explain: t(
      "Banks use short official numbers, not personal mobile numbers. A relative with a 'new number' should be checked by calling their old number.",
      "Bank personal mobile number se rabta nahi karte. 'Naya number' wale rishtedar ko unke purane number par call kar ke tasdeeq karein.",
      "بینک ذاتی موبائل نمبر سے رابطہ نہیں کرتے۔ نئے نمبر والے رشتہ دار کی تصدیق ان کے پرانے نمبر پر کال کر کے کریں۔",
    ),
  },
];

const URL_RE = /\b((?:https?:\/\/|www\.)[^\s<>"']+|[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:com|net|org|pk|info|xyz|top|click|link|live|online|site|io|co|me|ly|cc|tk|ml|ga|cf|gq|buzz|shop|icu)(?:\/[^\s<>"']*)?)/gi;
const SHORTENERS = ["bit.ly", "tinyurl.com", "cutt.ly", "t.co", "goo.gl", "is.gd", "rb.gy", "shorturl.at", "ow.ly", "tiny.cc", "s.id"];
const RISKY_TLDS = ["xyz", "top", "click", "link", "live", "online", "site", "info", "tk", "ml", "ga", "cf", "gq", "buzz", "icu", "shop"];
const BAIT_WORDS = ["verify", "secure", "update", "login", "unlock", "kyc", "reward", "prize", "claim", "account", "bank", "support", "refund", "bisp", "ehsaas", "delivery", "parcel"];

export function domainOf(raw: string): string {
  const withProto = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    return new URL(withProto).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return raw.toLowerCase();
  }
}

/** Checks a URL's shape. This is NOT verification — we never open the link. */
export function inspectLink(raw: string, lang: Lang): { url: string; domain: string; note: string; risky: boolean } {
  const url = raw.replace(/[).,!?]+$/, "");
  const domain = domainOf(url);
  const reasons: Tri[] = [];
  if (SHORTENERS.includes(domain)) reasons.push(t("it is a shortened link that hides the real website", "yeh chhota kiya hua link hai jo asli website chhupata hai", "یہ چھوٹا کیا ہوا لنک ہے جو اصل ویب سائٹ چھپاتا ہے"));
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain)) reasons.push(t("it uses numbers instead of a website name", "is mein website ke naam ki jagah number hain", "اس میں ویب سائٹ کے نام کی جگہ نمبر ہیں"));
  if (domain.startsWith("xn--") || domain.includes(".xn--")) reasons.push(t("it uses look-alike letters", "is mein milte julte huroof hain", "اس میں ملتے جلتے حروف ہیں"));
  const tld = domain.split(".").pop() ?? "";
  if (RISKY_TLDS.includes(tld)) reasons.push(t(`it ends in “.${tld}”, which official banks rarely use`, `yeh “.${tld}” par khatam hota hai jo bank aam tor par istemal nahi karte`, `یہ “.${tld}” پر ختم ہوتا ہے جو بینک عام طور پر استعمال نہیں کرتے`));
  if (BAIT_WORDS.some((w) => domain.includes(w)) && domain.split(/[.-]/).length > 2) reasons.push(t("its name mixes words like 'verify' or 'bank' to look official", "is ke naam mein 'verify' ya 'bank' jaise alfaaz daal kar asli dikhaya gaya hai", "اس کے نام میں 'verify' یا 'bank' جیسے الفاظ ڈال کر اصلی دکھایا گیا ہے"));
  if ((domain.match(/-/g) ?? []).length >= 2) reasons.push(t("it has many dashes, a common trick in fake sites", "is mein bohat se dash hain, jo naqli sites ka aam tareeqa hai", "اس میں بہت سے ڈیش ہیں جو جعلی سائٹس کا عام طریقہ ہے"));
  if (/^http:\/\//i.test(url)) reasons.push(t("it is not a secure (https) link", "yeh mehfooz (https) link nahi hai", "یہ محفوظ (https) لنک نہیں ہے"));

  const base = t(
    "HUMRAAH did not open or verify this link.",
    "HUMRAAH ne yeh link na khola hai na tasdeeq ki hai.",
    "ہمراہ نے یہ لنک نہ کھولا ہے نہ تصدیق کی ہے۔",
  );
  const note = reasons.length
    ? `${base[lang]} ${t("Warning:", "Khabardar:", "خبردار:")[lang]} ${reasons.map((r) => r[lang]).join("; ")}.`
    : `${base[lang]} ${t("Its shape looks ordinary, but only open websites you type yourself.", "Iski shakal aam lagti hai, phir bhi sirf woh website kholein jo aap khud type karein.", "اس کی شکل عام لگتی ہے، پھر بھی صرف وہ ویب سائٹ کھولیں جو آپ خود ٹائپ کریں۔")[lang]}`;
  return { url, domain, note, risky: reasons.length > 0 };
}

const NEGATIONS = /\b(not|never|don'?t|do not|na|mat|kabhi|nahi|nahin)\b[^.!?\n]{0,12}$|(نہ|مت|کبھی)[^۔\n]{0,10}$/i;

const SAFE_ACTIONS: Partial<Record<IndicatorType, Tri>> = {
  otp_request: t("Do not share any OTP, PIN or code — with anyone, ever.", "Kisi ko bhi kabhi OTP, PIN ya code na batayein.", "کسی کو بھی کبھی او ٹی پی، پن یا کوڈ نہ بتائیں۔"),
  credential_request: t("Do not type your password or card details anywhere this message points to.", "Is message ke kehne par kahin bhi password ya card details na likhein.", "اس پیغام کے کہنے پر کہیں بھی پاس ورڈ یا کارڈ کی معلومات نہ لکھیں۔"),
  suspicious_link: t("Do not tap the link. Open the official app or type the website address yourself.", "Link par click na karein. Official app kholein ya website ka pata khud likhein.", "لنک پر کلک نہ کریں۔ سرکاری ایپ کھولیں یا ویب سائٹ کا پتہ خود لکھیں۔"),
  payment_request: t("Do not send money or pay any 'fee' until you have checked with the organisation yourself.", "Jab tak khud tasdeeq na kar lein, koi paisa ya 'fees' na bhejein.", "جب تک خود تصدیق نہ کر لیں، کوئی رقم یا فیس نہ بھیجیں۔"),
  unusual_contact: t("Call the person or organisation on a number you already know — not the one in the message.", "Us shakhs ya idare ko us number par call karein jo aap ko pehle se maloom hai — message wale number par nahi.", "اس شخص یا ادارے کو اس نمبر پر کال کریں جو آپ کو پہلے سے معلوم ہے، پیغام والے نمبر پر نہیں۔"),
  prize_offer: t("Ignore prize claims you did not enter. Never pay to receive a prize.", "Jis inaam mein aap ne hissa nahi liya, use nazar andaz karein. Inaam ke liye kabhi paise na dein.", "جس انعام میں آپ نے حصہ نہیں لیا اسے نظر انداز کریں۔ انعام کے لیے کبھی پیسے نہ دیں۔"),
  secrecy: t("Talk to a family member or someone you trust before doing anything.", "Kuch bhi karne se pehle ghar walon ya kisi bharosemand se baat karein.", "کچھ بھی کرنے سے پہلے گھر والوں یا کسی قابل اعتماد شخص سے بات کریں۔"),
};

const ALWAYS_ACTIONS: Tri[] = [
  t("Verify by calling the number printed on your card, bill or the official website.", "Apne card, bill ya official website par likhe number par call kar ke tasdeeq karein.", "اپنے کارڈ، بل یا سرکاری ویب سائٹ پر لکھے نمبر پر کال کر کے تصدیق کریں۔"),
  t("If you already shared a code or sent money, open Emergency Help now.", "Agar aap code bata chuke hain ya paise bhej chuke hain to abhi Emergency Help kholein.", "اگر آپ کوڈ بتا چکے ہیں یا پیسے بھیج چکے ہیں تو ابھی ایمرجنسی ہیلپ کھولیں۔"),
];

function findEvidence(text: string, det: Detector): string[] {
  const found: string[] = [];
  for (const re of det.patterns) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      const before = text.slice(Math.max(0, m.index - 20), m.index);
      if (det.negatable && NEGATIONS.test(before)) continue;
      found.push(m[0]);
      if (found.length >= 3) return found;
    }
  }
  return found;
}

const SCORE = { high: 3, medium: 2, low: 1 } as const;

export function analyzeScamRules(text: string, lang: Lang): Omit<ScamAnalysis, "mode"> {
  const indicators: ScamIndicator[] = [];
  for (const det of DETECTORS) {
    const evidence = findEvidence(text, det);
    if (!evidence.length) continue;
    indicators.push({
      type: det.type,
      indicator: det.title[lang],
      evidence: evidence[0],
      explanation: det.explain[lang],
      severity: det.severity,
    });
  }

  const urls = Array.from(new Set(text.match(URL_RE) ?? [])).slice(0, 5);
  const links = urls.map((u) => inspectLink(u, lang));
  const risky = links.filter((l) => l.risky);
  if (links.length) {
    indicators.push({
      type: "suspicious_link",
      indicator: risky.length
        ? t("Contains a suspicious-looking link", "Mashkook link mojood hai", "مشکوک لنک موجود ہے")[lang]
        : t("Contains a link", "Link mojood hai", "لنک موجود ہے")[lang],
      evidence: (risky[0] ?? links[0]).url,
      explanation: (risky[0] ?? links[0]).note,
      severity: risky.length ? "high" : "low",
    });
  }

  // A genuine bank SMS usually *warns* you not to share an OTP. Note it, but don't treat it as proof.
  const warnsAgainstSharing = /\b(never|do not|don'?t)\s+share\b[^.!?\n]{0,25}\b(otp|pin|code|password)\b|kabhi\s+kisi\s+ko\s+(?:otp|pin|code)/i.test(text);

  const score = indicators.reduce((s, i) => s + SCORE[i.severity], 0);
  const hasCritical = indicators.some((i) => i.severity === "high" && i.type !== "suspicious_link") || risky.length > 0;
  let risk: RiskLevel;
  if (text.trim().length < 25 && indicators.length === 0) risk = "uncertain";
  else if (hasCritical && score >= 4) risk = "high";
  else if (hasCritical || score >= 4) risk = "medium";
  else if (score > 0) risk = "low";
  else risk = "low";
  if (risk === "medium" && indicators.filter((i) => i.severity !== "low").length >= 3) risk = "high";

  const summaries: Record<RiskLevel, Tri> = {
    high: t(
      "This message shows strong warning signs of a scam. Do not reply, tap links or share any code.",
      "Is message mein dhoke ki wazeh nishaniyan hain. Jawab na dein, link na kholein aur koi code na batayein.",
      "اس پیغام میں دھوکے کی واضح نشانیاں ہیں۔ جواب نہ دیں، لنک نہ کھولیں اور کوئی کوڈ نہ بتائیں۔",
    ),
    medium: t(
      "This message has some warning signs. Treat it with care and verify through an official channel first.",
      "Is message mein kuch khatre ki nishaniyan hain. Ehtiyat karein aur pehle official tareeqe se tasdeeq karein.",
      "اس پیغام میں کچھ خطرے کی نشانیاں ہیں۔ احتیاط کریں اور پہلے سرکاری ذریعے سے تصدیق کریں۔",
    ),
    low: t(
      "HUMRAAH found few or no common warning signs. That does not prove it is genuine — still verify anything involving money.",
      "HUMRAAH ko khatre ki koi khaas nishani nahi mili. Is ka matlab yeh nahi ke yeh yaqeenan asli hai — paison wale maamlay mein phir bhi tasdeeq karein.",
      "ہمراہ کو خطرے کی کوئی خاص نشانی نہیں ملی۔ اس کا مطلب یہ نہیں کہ یہ یقیناً اصلی ہے۔ پیسوں کے معاملے میں پھر بھی تصدیق کریں۔",
    ),
    uncertain: t(
      "There is not enough text to judge. Please paste the full message or upload a clearer screenshot.",
      "Faisla karne ke liye text kaafi nahi. Poora message paste karein ya saaf screenshot upload karein.",
      "فیصلہ کرنے کے لیے متن کافی نہیں۔ پورا پیغام پیسٹ کریں یا صاف اسکرین شاٹ اپ لوڈ کریں۔",
    ),
  };

  const unknowns: string[] = [
    t("Who really sent this message — HUMRAAH cannot see the sender's identity.", "Yeh message asal mein kis ne bheja — HUMRAAH bhejne wale ki pehchaan nahi dekh sakta.", "یہ پیغام اصل میں کس نے بھیجا، ہمراہ بھیجنے والے کی پہچان نہیں دیکھ سکتا۔")[lang],
  ];
  if (links.length) unknowns.push(t("Where the link really leads — it was not opened or checked against a reputation service.", "Link asal mein kahan le jata hai — use khola ya kisi reputation service se check nahi kiya gaya.", "لنک اصل میں کہاں لے جاتا ہے، اسے کھولا یا کسی سروس سے چیک نہیں کیا گیا۔")[lang]);
  if (warnsAgainstSharing) unknowns.push(t("The message itself warns not to share codes, which genuine bank alerts often do — but scammers can copy this too.", "Message khud code na batane ki hidayat deta hai, jo asli bank alerts mein hota hai — magar fraudiye bhi yeh nakal kar sakte hain.", "پیغام خود کوڈ نہ بتانے کی ہدایت دیتا ہے جو اصل بینک الرٹس میں ہوتا ہے، مگر دھوکے باز بھی یہ نقل کر سکتے ہیں۔")[lang]);

  const safe_actions = [
    ...indicators.map((i) => SAFE_ACTIONS[i.type]?.[lang]).filter((x): x is string => Boolean(x)),
    ...ALWAYS_ACTIONS.map((a) => a[lang]),
  ];

  const has = (type: IndicatorType) => indicators.some((i) => i.type === type);
  const practice_scenario = has("otp_request")
    ? "bank-otp"
    : has("prize_offer")
      ? "prize-lottery"
      : has("unusual_contact") || has("secrecy")
        ? "relative-emergency"
        : links.length
          ? "courier-link"
          : "bank-otp";

  return {
    risk_level: risk,
    summary: summaries[risk][lang],
    indicators,
    unknowns,
    safe_actions: Array.from(new Set(safe_actions)),
    confidence_note: t(
      "This is an indicator-based check by HUMRAAH's built-in rules, not a confirmed verdict. Always verify with the official organisation.",
      "Yeh HUMRAAH ke built-in usoolon par mabni jaanch hai, pakka faisla nahi. Hamesha official idare se tasdeeq karein.",
      "یہ ہمراہ کے اندرونی اصولوں پر مبنی جانچ ہے، حتمی فیصلہ نہیں۔ ہمیشہ سرکاری ادارے سے تصدیق کریں۔",
    )[lang],
    links: links.map(({ url, domain, note }) => ({ url, domain, note })),
    practice_scenario,
  };
}

/** Merge rule hits into an AI result so critical red flags are never dropped. */
export function reinforceWithRules(ai: Omit<ScamAnalysis, "mode">, rules: Omit<ScamAnalysis, "mode">): Omit<ScamAnalysis, "mode"> {
  const critical = rules.indicators.filter(
    (r) => (r.type === "otp_request" || r.type === "credential_request" || r.type === "payment_request") && !ai.indicators.some((a) => a.type === r.type),
  );
  const indicators = [...ai.indicators, ...critical];
  let risk_level = ai.risk_level;
  if (critical.length && (risk_level === "low" || risk_level === "uncertain")) risk_level = "medium";
  return {
    ...ai,
    risk_level,
    indicators,
    links: ai.links.length ? ai.links : rules.links,
    practice_scenario: ai.practice_scenario || rules.practice_scenario,
  };
}
