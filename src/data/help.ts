// Static, carefully checked content for Emergency Help, Digital Dictionary and Guardian.
// Official channels verified Oct 2026: NCCIA cybercrime helpline 1799 (replaced the FIA
// Cyber Crime Wing in 2025) and SBP Sunwai (https://sunwai.sbp.org.pk). Re-check before production.

import type { Bi } from "./scenarios";

const b = (en: string, roman: string, ur: string): Bi => ({ en, roman, ur });

export interface EmergencyPlaybook {
  id: string;
  icon: "key" | "banknote" | "user-x" | "phone-off" | "alert";
  title: Bi;
  when: Bi;
  steps: { text: Bi; urgent?: boolean }[];
}

export const EMERGENCY_PLAYBOOKS: EmergencyPlaybook[] = [
  {
    id: "shared-otp",
    icon: "key",
    title: b("I shared an OTP or PIN", "Main ne OTP ya PIN bata diya", "میں نے OTP یا PIN بتا دیا"),
    when: b(
      "You gave a code, PIN or password to someone by call, SMS or WhatsApp.",
      "Aap ne call, SMS ya WhatsApp par kisi ko code, PIN ya password bata diya.",
      "آپ نے کال، SMS یا WhatsApp پر کسی کو کوڈ، PIN یا پاس ورڈ بتا دیا۔",
    ),
    steps: [
      { urgent: true, text: b("Call your bank now on the number printed on the back of your card. Ask them to block the card and online banking.", "Abhi card ke peeche likhe number par bank ko call karein. Card aur online banking block karwayein.", "ابھی اپنے کارڈ کے پیچھے لکھے نمبر پر بینک کو کال کریں۔ ان سے کارڈ اور آن لائن بینکنگ بند کروائیں۔") },
      { urgent: true, text: b("Change your banking app password and PIN from your own phone.", "Apne phone se banking app ka password aur PIN badlein.", "اپنے فون سے بینکنگ ایپ کا پاس ورڈ اور PIN بدل دیں۔") },
      { text: b("Do not answer further calls from the same person — they may pretend to 'help'.", "Usi shakhs ki mazeed calls na uthayein — woh 'madad' ka bahana kar sakta hai.", "اسی شخص کی مزید کالیں نہ اٹھائیں۔ وہ ’مدد‘ کا بہانہ بنا سکتا ہے۔") },
      { text: b("Check recent transactions in your app and note anything you don't recognise.", "App mein haaliya transactions dekhein aur anjaan cheezein note karein.", "ایپ میں حالیہ لین دین دیکھیں۔ جو آپ نے نہیں کیا، اسے لکھ لیں۔") },
      { text: b("Report cybercrime to NCCIA by calling 1799.", "NCCIA ko 1799 par call kar ke cybercrime report karein.", "سائبر جرم کی رپورٹ کے لیے NCCIA کو 1799 پر کال کریں۔") },
    ],
  },
  {
    id: "unknown-transaction",
    icon: "banknote",
    title: b("Money left my account and it wasn't me", "Mere account se paise nikle jo main ne nahi nikale", "میرے اکاؤنٹ سے پیسے نکلے جو میں نے نہیں نکالے"),
    when: b(
      "You see a debit, transfer or card charge you didn't make.",
      "Aisi kati, transfer ya card charge dikhe jo aap ne nahi kiya.",
      "آپ کو ایسی کٹوتی، ٹرانسفر یا کارڈ کی ادائیگی نظر آئے جو آپ نے نہیں کی۔",
    ),
    steps: [
      { urgent: true, text: b("Call your bank immediately using the number on your card or the bank's official website. Report the transaction.", "Card ya official website wale number se foran bank ko call kar ke transaction report karein.", "فوراً کارڈ یا بینک کی سرکاری ویب سائٹ والے نمبر پر کال کریں۔ اس لین دین کی رپورٹ کریں۔") },
      { urgent: true, text: b("Ask the bank to block your card / account access until it's checked.", "Bank se kahein ke jaanch tak card / account block karein.", "بینک سے کہیں کہ جانچ مکمل ہونے تک کارڈ اور اکاؤنٹ بند رکھیں۔") },
      { text: b("Write down the date, amount and any complaint number the bank gives you.", "Tareekh, raqam aur bank ka diya complaint number likh lein.", "تاریخ، رقم اور بینک کا دیا ہوا شکایت نمبر لکھ لیں۔") },
      { text: b("If the bank does not resolve it, you can escalate via SBP Sunwai (sunwai.sbp.org.pk).", "Agar bank hal na kare to SBP Sunwai (sunwai.sbp.org.pk) par shikayat aage barhayein.", "اگر بینک مسئلہ حل نہ کرے تو SBP Sunwai (sunwai.sbp.org.pk) پر شکایت درج کریں۔") },
      { text: b("If fraud was involved, also report to NCCIA on 1799.", "Agar dhoka hua hai to NCCIA ko 1799 par bhi report karein.", "اگر دھوکہ ہوا ہے تو NCCIA کو 1799 پر بھی رپورٹ کریں۔") },
    ],
  },
  {
    id: "account-hacked",
    icon: "user-x",
    title: b("My WhatsApp / email / social account was taken", "Mera WhatsApp / email / social account chheen liya gaya", "میرا WhatsApp، ای میل یا سوشل اکاؤنٹ کسی نے لے لیا"),
    when: b(
      "You can't log in, or friends get strange messages from you.",
      "Aap log in nahi kar pa rahe, ya doston ko aap ki taraf se ajeeb messages ja rahe hain.",
      "آپ لاگ اِن نہیں کر پا رہے، یا دوستوں کو آپ کی طرف سے عجیب پیغامات جا رہے ہیں۔",
    ),
    steps: [
      { urgent: true, text: b("Warn family and friends from another phone: don't send money or codes to 'you'.", "Doosre phone se ghar walon aur doston ko batayein: 'aap' ko paise ya code na bhejein.", "کسی دوسرے فون سے گھر والوں اور دوستوں کو بتائیں کہ ’آپ‘ کو پیسے یا کوڈ نہ بھیجیں۔") },
      { urgent: true, text: b("Use the app's official 'forgot password' or account recovery option.", "App ka official 'forgot password' ya account recovery istemal karein.", "ایپ کا اپنا ’Forgot password‘ یا اکاؤنٹ واپس لینے کا طریقہ استعمال کریں۔") },
      { text: b("For WhatsApp: re-register your number on your own phone; turn on Two-Step Verification afterwards.", "WhatsApp ke liye: apne phone par number dobara register karein; phir Two-Step Verification on karein.", "WhatsApp کے لیے: اپنے فون پر نمبر دوبارہ رجسٹر کریں۔ اس کے بعد Two-Step Verification آن کریں۔") },
      { text: b("Change passwords of other accounts that used the same password.", "Jin accounts mein yahi password tha unke password bhi badlein.", "جن اکاؤنٹس میں یہی پاس ورڈ تھا، ان کے پاس ورڈ بھی بدل دیں۔") },
      { text: b("Report impersonation to NCCIA on 1799 if money was requested.", "Agar paise maange gaye to NCCIA ko 1799 par report karein.", "اگر آپ کے نام سے پیسے مانگے گئے تو NCCIA کو 1799 پر رپورٹ کریں۔") },
    ],
  },
  {
    id: "lost-phone",
    icon: "phone-off",
    title: b("I lost my phone", "Mera phone gum ho gaya", "میرا فون گم ہو گیا"),
    when: b(
      "Your phone is lost or stolen and has banking apps.",
      "Banking apps wala phone gum ya chori ho gaya.",
      "آپ کا فون گم یا چوری ہو گیا ہے اور اس میں بینکنگ ایپس ہیں۔",
    ),
    steps: [
      { urgent: true, text: b("Call your mobile network to block the SIM so codes can't be received.", "Mobile company ko call kar ke SIM block karwayein taake code na aa sakein.", "موبائل کمپنی کو کال کر کے SIM بند کروائیں تاکہ اس پر کوڈ نہ آ سکیں۔") },
      { urgent: true, text: b("Call your bank to block mobile banking on that phone.", "Bank ko call kar ke us phone par mobile banking band karwayein.", "بینک کو کال کر کے اس فون پر موبائل بینکنگ بند کروائیں۔") },
      { text: b("Use Find My Device (Android) or Find My (iPhone) from another device to lock or erase it.", "Doosre device se Find My Device ya Find My istemal kar ke phone lock ya saaf karein.", "کسی دوسرے فون یا کمپیوٹر سے Find My Device (Android) یا Find My (iPhone) کھولیں اور فون لاک یا صاف کر دیں۔") },
      { text: b("Report theft to the police (15).", "Chori ki report police (15) ko karein.", "چوری کی رپورٹ پولیس کو 15 پر کریں۔") },
    ],
  },
  {
    id: "scam-call",
    icon: "alert",
    title: b("Someone is pressuring me on a call right now", "Abhi call par koi mujh par dabao daal raha hai", "ابھی کال پر کوئی مجھ پر دباؤ ڈال رہا ہے"),
    when: b(
      "A caller claims to be a bank, police, relative or official and wants codes or money.",
      "Caller bank, police, rishtedar ya afsar ban kar code ya paise maang raha hai.",
      "کال کرنے والا خود کو بینک، پولیس، رشتہ دار یا افسر بتا کر کوڈ یا پیسے مانگ رہا ہے۔",
    ),
    steps: [
      { urgent: true, text: b("Hang up. A real organisation will be fine with you calling back.", "Call kaat dein. Asli idara aap ke wapas call karne se naraz nahi hoga.", "کال کاٹ دیں۔ اصل ادارہ آپ کے واپس کال کرنے پر برا نہیں مانے گا۔") },
      { urgent: true, text: b("Call back only on a number you find yourself (card, bill, official website, old contact).", "Sirf us number par wapas call karein jo aap ne khud dhoonda (card, bill, website, purana contact).", "صرف اس نمبر پر واپس کال کریں جو آپ نے خود ڈھونڈا ہو، جیسے کارڈ، بل، سرکاری ویب سائٹ یا پرانا محفوظ نمبر۔") },
      { text: b("Voices can be faked with AI. Ask a family question only the real person knows.", "AI se awaz naqal ho sakti hai. Aisa ghar ka sawal poochein jo sirf asli shakhs jaanta ho.", "آج کل AI سے آواز کی نقل بن سکتی ہے۔ گھر کی کوئی ایسی بات پوچھیں جو صرف اصل شخص جانتا ہو۔") },
      { text: b("Tell a family member what happened.", "Ghar ke kisi fard ko batayein kya hua.", "گھر کے کسی فرد کو بتائیں کہ کیا ہوا۔") },
    ],
  },
];

export const OFFICIAL_CHANNELS = [
  {
    name: b("Your bank's helpline", "Aap ke bank ki helpline", "آپ کے بینک کی ہیلپ لائن"),
    detail: b("Printed on the back of your debit/credit card and on the bank's official website.", "Debit/credit card ke peeche aur bank ki official website par likhi hoti hai.", "یہ نمبر آپ کے ڈیبٹ یا کریڈٹ کارڈ کے پیچھے اور بینک کی سرکاری ویب سائٹ پر لکھا ہوتا ہے۔"),
    href: null as string | null,
  },
  {
    name: b("NCCIA cybercrime helpline — 1799", "NCCIA cybercrime helpline — 1799", "NCCIA سائبر کرائم ہیلپ لائن — 1799"),
    detail: b("National Cyber Crime Investigation Agency (replaced the FIA Cyber Crime Wing).", "National Cyber Crime Investigation Agency (FIA Cyber Crime Wing ki jagah).", "نیشنل سائبر کرائم انویسٹی گیشن ایجنسی (جو FIA سائبر کرائم ونگ کی جگہ آئی ہے)۔"),
    href: "tel:1799",
  },
  {
    name: b("Police — 15", "Police — 15", "پولیس — 15"),
    detail: b("For theft, threats or immediate danger.", "Chori, dhamki ya fori khatre ke liye.", "چوری، دھمکی یا فوری خطرے کی صورت میں۔"),
    href: "tel:15",
  },
  {
    name: b("SBP Sunwai", "SBP Sunwai", "SBP Sunwai"),
    detail: b("State Bank of Pakistan complaint portal, if your bank does not resolve a complaint.", "State Bank ka complaint portal, agar bank shikayat hal na kare.", "اسٹیٹ بینک آف پاکستان کا شکایت پورٹل، اگر آپ کا بینک شکایت حل نہ کرے۔"),
    href: "https://sunwai.sbp.org.pk",
  },
];

export interface Term {
  term: string;
  aliases: string[];
  en: string;
  roman: string;
  ur: string;
  example: Bi;
}

export const DICTIONARY: Term[] = [
  {
    term: "OTP", aliases: ["one time password", "code", "otp"],
    en: "A one-time code sent to your phone to confirm it is really you. It works like a key that can be used once.",
    roman: "Ek baar istemal hone wala code jo aap ke phone par aata hai taake tasdeeq ho ke aap hi hain. Yeh ek baar wali chaabi hai.",
    ur: "ایک بار استعمال ہونے والا کوڈ جو آپ کے فون پر آتا ہے، تاکہ تصدیق ہو کہ آپ ہی ہیں۔ یہ ایک بار کی چابی کی طرح ہے۔",
    example: b("Like a token at a counter: only the person holding it gets served. Never hand it to anyone.", "Jaise counter ka token: jis ke paas ho usi ka kaam hota hai. Kisi ko na dein.", "جیسے کاؤنٹر کا ٹوکن: جس کے پاس ہو، اسی کا کام ہوتا ہے۔ یہ کسی کو نہ دیں۔"),
  },
  {
    term: "PIN", aliases: ["pin code", "atm pin", "mpin"],
    en: "A short secret number (usually 4–6 digits) that unlocks your card or app.",
    roman: "Chhota khufia number (aksar 4–6 hindse) jo card ya app kholta hai.",
    ur: "ایک چھوٹا خفیہ نمبر (عام طور پر 4 سے 6 ہندسے) جو آپ کا کارڈ یا ایپ کھولتا ہے۔",
    example: b("Like the combination of a lock at home.", "Ghar ke taale ka combination.", "جیسے گھر کے تالے کا خفیہ نمبر۔"),
  },
  {
    term: "Password", aliases: ["passcode"],
    en: "A secret word or phrase you choose to protect an account.",
    roman: "Khufia lafz ya jumla jo account ki hifazat karta hai.",
    ur: "ایک خفیہ لفظ یا جملہ جو آپ خود چنتے ہیں تاکہ آپ کا اکاؤنٹ محفوظ رہے۔",
    example: b("Long phrases like Chai-Baarish-Patang-47 are strong.", "Lamba jumla jaise Chai-Baarish-Patang-47 mazboot hai.", "لمبا جملہ، جیسے Chai-Baarish-Patang-47، مضبوط پاس ورڈ ہوتا ہے۔"),
  },
  {
    term: "Two-factor authentication", aliases: ["2fa", "two step verification", "2-step"],
    en: "A second check after your password, such as a code on your phone, so a stolen password alone isn't enough.",
    roman: "Password ke baad doosri jaanch, jaise phone par code, taake sirf chura hua password kaafi na ho.",
    ur: "پاس ورڈ کے بعد ایک دوسری جانچ، جیسے فون پر آنے والا کوڈ۔ اس طرح صرف چرایا ہوا پاس ورڈ کافی نہیں ہوتا۔",
    example: b("Like a door with two locks.", "Do taalon wala darwaza.", "جیسے دو تالوں والا دروازہ۔"),
  },
  {
    term: "Phishing", aliases: ["phishing", "fake link"],
    en: "A trick message pretending to be from a trusted company to steal your details.",
    roman: "Dhoke ka message jo bharosemand company ban kar maloomat churata hai.",
    ur: "دھوکے کا پیغام جو کسی بھروسہ مند کمپنی کا بن کر آپ کی معلومات چراتا ہے۔",
    example: b("A 'bank' SMS with a link asking you to 'verify'.", "'Bank' ka SMS jis mein 'verify' ka link ho.", "’بینک‘ کا SMS جس میں ’verify‘ کرنے کا لنک ہو۔"),
  },
  {
    term: "Link / URL", aliases: ["url", "link", "website address"],
    en: "The address of a web page, like sitarabank.com.pk. The ending tells you which website it really is.",
    roman: "Web page ka pata. Aakhri hissa batata hai ke asal website kaunsi hai.",
    ur: "کسی ویب صفحے کا پتہ، جیسے sitarabank.com.pk۔ اس کا آخری حصہ بتاتا ہے کہ اصل ویب سائٹ کون سی ہے۔",
    example: b("Read from the right: in bank.com.pk.verify.top the real site is verify.top.", "Daayein se parhein: bank.com.pk.verify.top mein asal site verify.top hai.", "پتہ آخر سے پڑھیں: bank.com.pk.verify.top میں اصل سائٹ verify.top ہے۔"),
  },
  {
    term: "Browser", aliases: ["chrome", "safari", "browser"],
    en: "The app you use to open websites, such as Chrome or Safari.",
    roman: "Websites kholne wali app, jaise Chrome ya Safari.",
    ur: "وہ ایپ جس سے ویب سائٹس کھولی جاتی ہیں، جیسے Chrome یا Safari۔",
    example: b("Like a window you look through to see websites.", "Khirki jis se websites dekhte hain.", "جیسے ایک کھڑکی جس سے آپ ویب سائٹس دیکھتے ہیں۔"),
  },
  {
    term: "CAPTCHA", aliases: ["captcha", "i'm not a robot"],
    en: "A small puzzle that checks you are a person, not a computer program.",
    roman: "Chhota sa pehli jo check karti hai ke aap insaan hain, computer program nahi.",
    ur: "ایک چھوٹی سی پہیلی جو جانچتی ہے کہ آپ انسان ہیں، کمپیوٹر پروگرام نہیں۔",
    example: b("'Tick the box' or 'select all buses'.", "'Box tick karein' ya 'saari buses chunein'.", "جیسے ’خانے پر نشان لگائیں‘ یا ’ساری بسیں منتخب کریں‘۔"),
  },
  {
    term: "Cloud storage", aliases: ["cloud", "google drive", "icloud"],
    en: "Saving your files on a company's computers over the internet, so they're safe if your phone is lost.",
    roman: "Files internet par company ke computers mein mehfooz karna, taake phone gum ho to bhi bachi rahein.",
    ur: "اپنی فائلیں انٹرنیٹ کے ذریعے کسی کمپنی کے کمپیوٹرز میں محفوظ کرنا، تاکہ فون گم ہو جائے تب بھی وہ بچی رہیں۔",
    example: b("Like a locker at the bank for your photos.", "Tasveeron ke liye bank ka locker.", "جیسے آپ کی تصویروں کے لیے بینک کا لاکر۔"),
  },
  {
    term: "App permission", aliases: ["permission", "allow"],
    en: "Your approval for an app to use something like the camera, microphone, contacts or location.",
    roman: "App ko camera, mic, contacts ya location istemal karne ki ijazat.",
    ur: "کسی ایپ کو کیمرہ، مائیکروفون، رابطے یا مقام استعمال کرنے کی آپ کی اجازت۔",
    example: b("A torch app asking for contacts doesn't need them — say no.", "Torch app ko contacts nahi chahiye — mana kar dein.", "ٹارچ ایپ کو رابطوں کی ضرورت نہیں۔ اسے منع کر دیں۔"),
  },
  {
    term: "KYC", aliases: ["kyc", "biometric"],
    en: "'Know Your Customer' — checks a bank does to confirm your identity, usually at the branch or in the official app.",
    roman: "'Know Your Customer' — bank ki shanakht ki jaanch, aksar branch ya official app mein.",
    ur: "’Know Your Customer‘ — بینک کی طرف سے آپ کی شناخت کی جانچ، جو عام طور پر برانچ یا بینک کی اپنی ایپ میں ہوتی ہے۔",
    example: b("Scammers often say 'update KYC' to get your codes.", "Fraudiye 'KYC update' keh kar code maangte hain.", "دھوکے باز اکثر ’KYC اپڈیٹ کریں‘ کہہ کر آپ سے کوڈ مانگتے ہیں۔"),
  },
  {
    term: "Wi-Fi", aliases: ["wifi", "internet"],
    en: "Wireless internet from a router at home or in public places.",
    roman: "Router se aane wala wireless internet.",
    ur: "گھر یا عوامی جگہوں پر راؤٹر سے آنے والا بغیر تار کا انٹرنیٹ۔",
    example: b("Avoid banking on free public Wi-Fi.", "Muft public Wi-Fi par banking na karein.", "مفت عوامی Wi-Fi پر بینکنگ نہ کریں۔"),
  },
  {
    term: "Screenshot", aliases: ["screen shot", "screenshot"],
    en: "A picture of what's on your screen right now.",
    roman: "Screen par jo hai us ki tasveer.",
    ur: "اس وقت آپ کی اسکرین پر جو کچھ ہے، اس کی تصویر۔",
    example: b("On most phones: press Power + Volume Down together.", "Aksar phones par: Power aur Volume Down ek saath dabayein.", "زیادہ تر فونز پر پاور اور آواز کم کرنے والا بٹن ایک ساتھ دبائیں۔"),
  },
];

export interface PrivacyQuestion {
  id: string;
  q: Bi;
  options: { text: Bi; points: number }[];
  tip: Bi;
}

export const PRIVACY_CHECKUP: PrivacyQuestion[] = [
  {
    id: "lock",
    q: b("Does your phone have a screen lock (PIN, pattern or fingerprint)?", "Kya phone par screen lock (PIN, pattern ya fingerprint) hai?", "کیا آپ کے فون پر اسکرین لاک (PIN، پیٹرن یا فنگر پرنٹ) لگا ہے؟"),
    options: [
      { text: b("Yes", "Haan", "جی ہاں"), points: 2 },
      { text: b("No", "Nahi", "نہیں"), points: 0 },
      { text: b("Not sure", "Pata nahi", "معلوم نہیں"), points: 0 },
    ],
    tip: b("Settings → Security → Screen lock. Choose a PIN only you know.", "Settings → Security → Screen lock. Aisa PIN chunein jo sirf aap jaanein.", "“Settings → Security → Screen lock” میں جائیں۔ ایسا PIN چنیں جو صرف آپ جانتے ہوں۔"),
  },
  {
    id: "share-otp",
    q: b("Have you ever told someone a code that arrived by SMS?", "Kya kabhi SMS par aaya code kisi ko bataya hai?", "کیا آپ نے کبھی SMS پر آیا ہوا کوڈ کسی کو بتایا ہے؟"),
    options: [
      { text: b("Never", "Kabhi nahi", "کبھی نہیں"), points: 2 },
      { text: b("Once or twice", "Ek do baar", "ایک دو بار"), points: 0 },
      { text: b("Only to family", "Sirf ghar walon ko", "صرف گھر والوں کو"), points: 1 },
    ],
    tip: b("Codes are for you alone — even family should not need them.", "Code sirf aap ke liye hain — ghar walon ko bhi zaroorat nahi honi chahiye.", "کوڈ صرف آپ کے لیے ہوتے ہیں۔ گھر والوں کو بھی ان کی ضرورت نہیں ہونی چاہیے۔"),
  },
  {
    id: "whatsapp-2sv",
    q: b("Is WhatsApp Two-Step Verification turned on?", "Kya WhatsApp Two-Step Verification on hai?", "کیا WhatsApp میں Two-Step Verification آن ہے؟"),
    options: [
      { text: b("Yes", "Haan", "جی ہاں"), points: 2 },
      { text: b("No", "Nahi", "نہیں"), points: 0 },
      { text: b("Don't know what that is", "Maloom nahi kya hai", "معلوم نہیں یہ کیا ہے"), points: 0 },
    ],
    tip: b("WhatsApp → Settings → Account → Two-step verification → Turn on.", "WhatsApp → Settings → Account → Two-step verification → Turn on.", "WhatsApp میں “Settings → Account → Two-step verification → Turn on” دبائیں۔"),
  },
  {
    id: "same-password",
    q: b("Do you use the same password for many accounts?", "Kya bohat se accounts ka ek hi password hai?", "کیا آپ بہت سے اکاؤنٹس میں ایک ہی پاس ورڈ استعمال کرتے ہیں؟"),
    options: [
      { text: b("No, they're different", "Nahi, alag alag hain", "نہیں، سب الگ ہیں"), points: 2 },
      { text: b("Yes", "Haan", "جی ہاں"), points: 0 },
      { text: b("Some are the same", "Kuch ek jaise", "کچھ ایک جیسے ہیں"), points: 1 },
    ],
    tip: b("At least make your email and bank passwords unique.", "Kam az kam email aur bank ke password alag rakhein.", "کم از کم ای میل اور بینک کے پاس ورڈ باقی سب سے الگ رکھیں۔"),
  },
  {
    id: "app-source",
    q: b("Where do you install apps from?", "Apps kahan se install karte hain?", "آپ ایپس کہاں سے انسٹال کرتے ہیں؟"),
    options: [
      { text: b("Only Play Store / App Store", "Sirf Play Store / App Store", "صرف Play Store یا App Store سے"), points: 2 },
      { text: b("Sometimes from links or APK files", "Kabhi links ya APK files se", "کبھی لنکس یا APK فائلوں سے"), points: 0 },
    ],
    tip: b("APK files from WhatsApp or websites can contain harmful apps.", "WhatsApp ya websites ki APK files mein nuqsan deh apps ho sakti hain.", "WhatsApp یا ویب سائٹس سے آنے والی APK فائلوں میں نقصان دہ ایپس ہو سکتی ہیں۔"),
  },
  {
    id: "permissions",
    q: b("When did you last check which apps can see your location or contacts?", "Aakhri baar kab check kiya ke kaun si apps location ya contacts dekh sakti hain?", "آپ نے آخری بار کب دیکھا تھا کہ کون سی ایپس آپ کا مقام یا رابطے دیکھ سکتی ہیں؟"),
    options: [
      { text: b("Recently", "Haal hi mein", "حال ہی میں"), points: 2 },
      { text: b("Never", "Kabhi nahi", "کبھی نہیں"), points: 0 },
    ],
    tip: b("Settings → Privacy → Permission manager. Remove access apps don't need.", "Settings → Privacy → Permission manager. Ghair zaroori ijazatein hatayein.", "“Settings → Privacy → Permission manager” میں جائیں۔ جن ایپس کو ضرورت نہیں، ان کی اجازت ہٹا دیں۔"),
  },
  {
    id: "updates",
    q: b("Do you install phone updates when asked?", "Kya phone updates install karte hain?", "جب فون اپڈیٹ کا کہے تو کیا آپ اپڈیٹ انسٹال کرتے ہیں؟"),
    options: [
      { text: b("Yes, soon", "Haan, jaldi", "جی ہاں، جلدی"), points: 2 },
      { text: b("I ignore them", "Nazar andaz karta/karti hoon", "میں انہیں نظر انداز کر دیتا/دیتی ہوں"), points: 0 },
    ],
    tip: b("Updates fix security holes. Install them on Wi-Fi while charging.", "Updates security ke suraakh band karte hain. Wi-Fi aur charging par install karein.", "اپڈیٹس حفاظتی کمزوریاں دور کرتی ہیں۔ انہیں Wi-Fi پر اور چارجنگ کے دوران انسٹال کریں۔"),
  },
];

export const PERMISSIONS = [
  {
    id: "camera", icon: "camera",
    name: b("Camera", "Camera", "کیمرہ"),
    why: b("Photos, video calls, scanning QR codes.", "Tasveerein, video calls, QR scan.", "تصویریں، ویڈیو کالز اور QR کوڈ اسکین کرنا۔"),
    caution: b("A game or torch app rarely needs it.", "Game ya torch app ko aksar zaroorat nahi.", "گیم یا ٹارچ ایپ کو عموماً اس کی ضرورت نہیں ہوتی۔"),
  },
  {
    id: "microphone", icon: "mic",
    name: b("Microphone", "Microphone", "مائیکروفون"),
    why: b("Calls, voice notes, voice search.", "Calls, voice notes, awaz se search.", "کالز، وائس نوٹس اور آواز سے تلاش۔"),
    caution: b("Choose 'Only while using the app'.", "'Only while using the app' chunein.", "’Only while using the app‘ چنیں۔"),
  },
  {
    id: "location", icon: "map-pin",
    name: b("Location", "Location", "مقام (لوکیشن)"),
    why: b("Maps, ride apps, delivery.", "Maps, ride apps, delivery.", "نقشے، رائیڈ ایپس اور ڈیلیوری۔"),
    caution: b("Your location shows where you live and go — share carefully.", "Location batati hai aap kahan rehte hain — soch samajh kar dein.", "آپ کا مقام بتاتا ہے کہ آپ کہاں رہتے اور جاتے ہیں۔ سوچ سمجھ کر دیں۔"),
  },
  {
    id: "contacts", icon: "users",
    name: b("Contacts", "Contacts", "رابطے (کانٹیکٹس)"),
    why: b("Messaging and calling apps.", "Messaging aur calling apps.", "پیغام اور کال والی ایپس۔"),
    caution: b("Giving contacts exposes your family's numbers too.", "Contacts dene se ghar walon ke number bhi chale jate hain.", "رابطے دینے سے آپ کے گھر والوں کے نمبر بھی چلے جاتے ہیں۔"),
  },
  {
    id: "sms", icon: "message",
    name: b("SMS", "SMS", "SMS"),
    why: b("Very few apps need to read your SMS.", "Bohat kam apps ko SMS parhne ki zaroorat hoti hai.", "بہت کم ایپس کو آپ کے SMS پڑھنے کی ضرورت ہوتی ہے۔"),
    caution: b("SMS contains your OTPs — be very careful.", "SMS mein aap ke OTP hote hain — bohat ehtiyat karein.", "SMS میں آپ کے OTP آتے ہیں، اس لیے بہت احتیاط کریں۔"),
  },
  {
    id: "files", icon: "folder",
    name: b("Photos & files", "Photos aur files", "تصاویر اور فائلیں"),
    why: b("Sharing pictures or documents.", "Tasveerein ya documents bhejna.", "تصویریں یا دستاویزات بھیجنا۔"),
    caution: b("Prefer 'selected photos only' if offered.", "Mumkin ho to 'sirf chuni hui tasveerein' chunein.", "اگر آپشن ہو تو صرف منتخب تصاویر کی اجازت دیں۔"),
  },
];
