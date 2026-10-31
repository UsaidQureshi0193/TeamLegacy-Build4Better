// Static, carefully checked content for Emergency Help, Digital Dictionary and Guardian.
// Official channels verified Oct 2026: NCCIA cybercrime helpline 1799 (replaced the FIA
// Cyber Crime Wing in 2025) and SBP Sunwai (https://sunwai.sbp.org.pk). Re-check before production.

import type { Bi } from "./scenarios";

const b = (en: string, roman: string): Bi => ({ en, roman });

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
    title: b("I shared an OTP or PIN", "Main ne OTP ya PIN bata diya"),
    when: b("You gave a code, PIN or password to someone by call, SMS or WhatsApp.", "Aap ne call, SMS ya WhatsApp par kisi ko code, PIN ya password bata diya."),
    steps: [
      { urgent: true, text: b("Call your bank now on the number printed on the back of your card. Ask them to block the card and online banking.", "Abhi card ke peeche likhe number par bank ko call karein. Card aur online banking block karwayein.") },
      { urgent: true, text: b("Change your banking app password and PIN from your own phone.", "Apne phone se banking app ka password aur PIN badlein.") },
      { text: b("Do not answer further calls from the same person — they may pretend to 'help'.", "Usi shakhs ki mazeed calls na uthayein — woh 'madad' ka bahana kar sakta hai.") },
      { text: b("Check recent transactions in your app and note anything you don't recognise.", "App mein haaliya transactions dekhein aur anjaan cheezein note karein.") },
      { text: b("Report cybercrime to NCCIA by calling 1799.", "NCCIA ko 1799 par call kar ke cybercrime report karein.") },
    ],
  },
  {
    id: "unknown-transaction",
    icon: "banknote",
    title: b("Money left my account and it wasn't me", "Mere account se paise nikle jo main ne nahi nikale"),
    when: b("You see a debit, transfer or card charge you didn't make.", "Aisi kati, transfer ya card charge dikhe jo aap ne nahi kiya."),
    steps: [
      { urgent: true, text: b("Call your bank immediately using the number on your card or the bank's official website. Report the transaction.", "Card ya official website wale number se foran bank ko call kar ke transaction report karein.") },
      { urgent: true, text: b("Ask the bank to block your card / account access until it's checked.", "Bank se kahein ke jaanch tak card / account block karein.") },
      { text: b("Write down the date, amount and any complaint number the bank gives you.", "Tareekh, raqam aur bank ka diya complaint number likh lein.") },
      { text: b("If the bank does not resolve it, you can escalate via SBP Sunwai (sunwai.sbp.org.pk).", "Agar bank hal na kare to SBP Sunwai (sunwai.sbp.org.pk) par shikayat aage barhayein.") },
      { text: b("If fraud was involved, also report to NCCIA on 1799.", "Agar dhoka hua hai to NCCIA ko 1799 par bhi report karein.") },
    ],
  },
  {
    id: "account-hacked",
    icon: "user-x",
    title: b("My WhatsApp / email / social account was taken", "Mera WhatsApp / email / social account chheen liya gaya"),
    when: b("You can't log in, or friends get strange messages from you.", "Aap log in nahi kar pa rahe, ya doston ko aap ki taraf se ajeeb messages ja rahe hain."),
    steps: [
      { urgent: true, text: b("Warn family and friends from another phone: don't send money or codes to 'you'.", "Doosre phone se ghar walon aur doston ko batayein: 'aap' ko paise ya code na bhejein.") },
      { urgent: true, text: b("Use the app's official 'forgot password' or account recovery option.", "App ka official 'forgot password' ya account recovery istemal karein.") },
      { text: b("For WhatsApp: re-register your number on your own phone; turn on Two-Step Verification afterwards.", "WhatsApp ke liye: apne phone par number dobara register karein; phir Two-Step Verification on karein.") },
      { text: b("Change passwords of other accounts that used the same password.", "Jin accounts mein yahi password tha unke password bhi badlein.") },
      { text: b("Report impersonation to NCCIA on 1799 if money was requested.", "Agar paise maange gaye to NCCIA ko 1799 par report karein.") },
    ],
  },
  {
    id: "lost-phone",
    icon: "phone-off",
    title: b("I lost my phone", "Mera phone gum ho gaya"),
    when: b("Your phone is lost or stolen and has banking apps.", "Banking apps wala phone gum ya chori ho gaya."),
    steps: [
      { urgent: true, text: b("Call your mobile network to block the SIM so codes can't be received.", "Mobile company ko call kar ke SIM block karwayein taake code na aa sakein.") },
      { urgent: true, text: b("Call your bank to block mobile banking on that phone.", "Bank ko call kar ke us phone par mobile banking band karwayein.") },
      { text: b("Use Find My Device (Android) or Find My (iPhone) from another device to lock or erase it.", "Doosre device se Find My Device ya Find My istemal kar ke phone lock ya saaf karein.") },
      { text: b("Report theft to the police (15).", "Chori ki report police (15) ko karein.") },
    ],
  },
  {
    id: "scam-call",
    icon: "alert",
    title: b("Someone is pressuring me on a call right now", "Abhi call par koi mujh par dabao daal raha hai"),
    when: b("A caller claims to be a bank, police, relative or official and wants codes or money.", "Caller bank, police, rishtedar ya afsar ban kar code ya paise maang raha hai."),
    steps: [
      { urgent: true, text: b("Hang up. A real organisation will be fine with you calling back.", "Call kaat dein. Asli idara aap ke wapas call karne se naraz nahi hoga.") },
      { urgent: true, text: b("Call back only on a number you find yourself (card, bill, official website, old contact).", "Sirf us number par wapas call karein jo aap ne khud dhoonda (card, bill, website, purana contact).") },
      { text: b("Voices can be faked with AI. Ask a family question only the real person knows.", "AI se awaz naqal ho sakti hai. Aisa ghar ka sawal poochein jo sirf asli shakhs jaanta ho.") },
      { text: b("Tell a family member what happened.", "Ghar ke kisi fard ko batayein kya hua.") },
    ],
  },
];

export const OFFICIAL_CHANNELS = [
  { name: b("Your bank's helpline", "Aap ke bank ki helpline"), detail: b("Printed on the back of your debit/credit card and on the bank's official website.", "Debit/credit card ke peeche aur bank ki official website par likhi hoti hai."), href: null as string | null },
  { name: b("NCCIA cybercrime helpline — 1799", "NCCIA cybercrime helpline — 1799"), detail: b("National Cyber Crime Investigation Agency (replaced the FIA Cyber Crime Wing).", "National Cyber Crime Investigation Agency (FIA Cyber Crime Wing ki jagah)."), href: "tel:1799" },
  { name: b("Police — 15", "Police — 15"), detail: b("For theft, threats or immediate danger.", "Chori, dhamki ya fori khatre ke liye."), href: "tel:15" },
  { name: b("SBP Sunwai", "SBP Sunwai"), detail: b("State Bank of Pakistan complaint portal, if your bank does not resolve a complaint.", "State Bank ka complaint portal, agar bank shikayat hal na kare."), href: "https://sunwai.sbp.org.pk" },
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
  { term: "OTP", aliases: ["one time password", "code", "otp"], en: "A one-time code sent to your phone to confirm it is really you. It works like a key that can be used once.", roman: "Ek baar istemal hone wala code jo aap ke phone par aata hai taake tasdeeq ho ke aap hi hain. Yeh ek baar wali chaabi hai.", ur: "ایک بار استعمال ہونے والا کوڈ جو تصدیق کے لیے آپ کے فون پر آتا ہے۔", example: b("Like a token at a counter: only the person holding it gets served. Never hand it to anyone.", "Jaise counter ka token: jis ke paas ho usi ka kaam hota hai. Kisi ko na dein.") },
  { term: "PIN", aliases: ["pin code", "atm pin", "mpin"], en: "A short secret number (usually 4–6 digits) that unlocks your card or app.", roman: "Chhota khufia number (aksar 4–6 hindse) jo card ya app kholta hai.", ur: "چھوٹا خفیہ نمبر جو کارڈ یا ایپ کھولتا ہے۔", example: b("Like the combination of a lock at home.", "Ghar ke taale ka combination.") },
  { term: "Password", aliases: ["passcode"], en: "A secret word or phrase you choose to protect an account.", roman: "Khufia lafz ya jumla jo account ki hifazat karta hai.", ur: "خفیہ لفظ یا جملہ جو اکاؤنٹ کی حفاظت کرتا ہے۔", example: b("Long phrases like Chai-Baarish-Patang-47 are strong.", "Lamba jumla jaise Chai-Baarish-Patang-47 mazboot hai.") },
  { term: "Two-factor authentication", aliases: ["2fa", "two step verification", "2-step"], en: "A second check after your password, such as a code on your phone, so a stolen password alone isn't enough.", roman: "Password ke baad doosri jaanch, jaise phone par code, taake sirf chura hua password kaafi na ho.", ur: "پاس ورڈ کے بعد دوسری جانچ تاکہ صرف چرایا گیا پاس ورڈ کافی نہ ہو۔", example: b("Like a door with two locks.", "Do taalon wala darwaza.") },
  { term: "Phishing", aliases: ["phishing", "fake link"], en: "A trick message pretending to be from a trusted company to steal your details.", roman: "Dhoke ka message jo bharosemand company ban kar maloomat churata hai.", ur: "دھوکے کا پیغام جو بھروسہ مند کمپنی بن کر معلومات چراتا ہے۔", example: b("A 'bank' SMS with a link asking you to 'verify'.", "'Bank' ka SMS jis mein 'verify' ka link ho.") },
  { term: "Link / URL", aliases: ["url", "link", "website address"], en: "The address of a web page, like sitarabank.com.pk. The ending tells you which website it really is.", roman: "Web page ka pata. Aakhri hissa batata hai ke asal website kaunsi hai.", ur: "ویب صفحے کا پتہ۔ آخری حصہ بتاتا ہے کہ اصل ویب سائٹ کون سی ہے۔", example: b("Read from the right: in bank.com.pk.verify.top the real site is verify.top.", "Daayein se parhein: bank.com.pk.verify.top mein asal site verify.top hai.") },
  { term: "Browser", aliases: ["chrome", "safari", "browser"], en: "The app you use to open websites, such as Chrome or Safari.", roman: "Websites kholne wali app, jaise Chrome ya Safari.", ur: "ویب سائٹس کھولنے والی ایپ، جیسے کروم۔", example: b("Like a window you look through to see websites.", "Khirki jis se websites dekhte hain.") },
  { term: "CAPTCHA", aliases: ["captcha", "i'm not a robot"], en: "A small puzzle that checks you are a person, not a computer program.", roman: "Chhota sa pehli jo check karti hai ke aap insaan hain, computer program nahi.", ur: "چھوٹی پہیلی جو جانچتی ہے کہ آپ انسان ہیں۔", example: b("'Tick the box' or 'select all buses'.", "'Box tick karein' ya 'saari buses chunein'.") },
  { term: "Cloud storage", aliases: ["cloud", "google drive", "icloud"], en: "Saving your files on a company's computers over the internet, so they're safe if your phone is lost.", roman: "Files internet par company ke computers mein mehfooz karna, taake phone gum ho to bhi bachi rahein.", ur: "فائلیں انٹرنیٹ پر محفوظ کرنا تاکہ فون گم ہو تو بھی بچی رہیں۔", example: b("Like a locker at the bank for your photos.", "Tasveeron ke liye bank ka locker.") },
  { term: "App permission", aliases: ["permission", "allow"], en: "Your approval for an app to use something like the camera, microphone, contacts or location.", roman: "App ko camera, mic, contacts ya location istemal karne ki ijazat.", ur: "ایپ کو کیمرہ، مائیک، رابطے یا مقام استعمال کرنے کی اجازت۔", example: b("A torch app asking for contacts doesn't need them — say no.", "Torch app ko contacts nahi chahiye — mana kar dein.") },
  { term: "KYC", aliases: ["kyc", "biometric"], en: "'Know Your Customer' — checks a bank does to confirm your identity, usually at the branch or in the official app.", roman: "'Know Your Customer' — bank ki shanakht ki jaanch, aksar branch ya official app mein.", ur: "بینک کی شناخت کی جانچ، عام طور پر برانچ یا سرکاری ایپ میں۔", example: b("Scammers often say 'update KYC' to get your codes.", "Fraudiye 'KYC update' keh kar code maangte hain.") },
  { term: "Wi-Fi", aliases: ["wifi", "internet"], en: "Wireless internet from a router at home or in public places.", roman: "Router se aane wala wireless internet.", ur: "راؤٹر سے آنے والا وائرلیس انٹرنیٹ۔", example: b("Avoid banking on free public Wi-Fi.", "Muft public Wi-Fi par banking na karein.") },
  { term: "Screenshot", aliases: ["screen shot", "screenshot"], en: "A picture of what's on your screen right now.", roman: "Screen par jo hai us ki tasveer.", ur: "اسکرین پر جو ہے اس کی تصویر۔", example: b("On most phones: press Power + Volume Down together.", "Aksar phones par: Power aur Volume Down ek saath dabayein.") },
];

export interface PrivacyQuestion {
  id: string;
  q: Bi;
  options: { text: Bi; points: number }[];
  tip: Bi;
}

export const PRIVACY_CHECKUP: PrivacyQuestion[] = [
  { id: "lock", q: b("Does your phone have a screen lock (PIN, pattern or fingerprint)?", "Kya phone par screen lock (PIN, pattern ya fingerprint) hai?"), options: [{ text: b("Yes", "Haan"), points: 2 }, { text: b("No", "Nahi"), points: 0 }, { text: b("Not sure", "Pata nahi"), points: 0 }], tip: b("Settings → Security → Screen lock. Choose a PIN only you know.", "Settings → Security → Screen lock. Aisa PIN chunein jo sirf aap jaanein.") },
  { id: "share-otp", q: b("Have you ever told someone a code that arrived by SMS?", "Kya kabhi SMS par aaya code kisi ko bataya hai?"), options: [{ text: b("Never", "Kabhi nahi"), points: 2 }, { text: b("Once or twice", "Ek do baar"), points: 0 }, { text: b("Only to family", "Sirf ghar walon ko"), points: 1 }], tip: b("Codes are for you alone — even family should not need them.", "Code sirf aap ke liye hain — ghar walon ko bhi zaroorat nahi honi chahiye.") },
  { id: "whatsapp-2sv", q: b("Is WhatsApp Two-Step Verification turned on?", "Kya WhatsApp Two-Step Verification on hai?"), options: [{ text: b("Yes", "Haan"), points: 2 }, { text: b("No", "Nahi"), points: 0 }, { text: b("Don't know what that is", "Maloom nahi kya hai"), points: 0 }], tip: b("WhatsApp → Settings → Account → Two-step verification → Turn on.", "WhatsApp → Settings → Account → Two-step verification → Turn on.") },
  { id: "same-password", q: b("Do you use the same password for many accounts?", "Kya bohat se accounts ka ek hi password hai?"), options: [{ text: b("No, they're different", "Nahi, alag alag hain"), points: 2 }, { text: b("Yes", "Haan"), points: 0 }, { text: b("Some are the same", "Kuch ek jaise"), points: 1 }], tip: b("At least make your email and bank passwords unique.", "Kam az kam email aur bank ke password alag rakhein.") },
  { id: "app-source", q: b("Where do you install apps from?", "Apps kahan se install karte hain?"), options: [{ text: b("Only Play Store / App Store", "Sirf Play Store / App Store"), points: 2 }, { text: b("Sometimes from links or APK files", "Kabhi links ya APK files se"), points: 0 }], tip: b("APK files from WhatsApp or websites can contain harmful apps.", "WhatsApp ya websites ki APK files mein nuqsan deh apps ho sakti hain.") },
  { id: "permissions", q: b("When did you last check which apps can see your location or contacts?", "Aakhri baar kab check kiya ke kaun si apps location ya contacts dekh sakti hain?"), options: [{ text: b("Recently", "Haal hi mein"), points: 2 }, { text: b("Never", "Kabhi nahi"), points: 0 }], tip: b("Settings → Privacy → Permission manager. Remove access apps don't need.", "Settings → Privacy → Permission manager. Ghair zaroori ijazatein hatayein.") },
  { id: "updates", q: b("Do you install phone updates when asked?", "Kya phone updates install karte hain?"), options: [{ text: b("Yes, soon", "Haan, jaldi"), points: 2 }, { text: b("I ignore them", "Nazar andaz karta/karti hoon"), points: 0 }], tip: b("Updates fix security holes. Install them on Wi-Fi while charging.", "Updates security ke suraakh band karte hain. Wi-Fi aur charging par install karein.") },
];

export const PERMISSIONS = [
  { id: "camera", icon: "camera", name: b("Camera", "Camera"), why: b("Photos, video calls, scanning QR codes.", "Tasveerein, video calls, QR scan."), caution: b("A game or torch app rarely needs it.", "Game ya torch app ko aksar zaroorat nahi.") },
  { id: "microphone", icon: "mic", name: b("Microphone", "Microphone"), why: b("Calls, voice notes, voice search.", "Calls, voice notes, awaz se search."), caution: b("Choose 'Only while using the app'.", "'Only while using the app' chunein.") },
  { id: "location", icon: "map-pin", name: b("Location", "Location"), why: b("Maps, ride apps, delivery.", "Maps, ride apps, delivery."), caution: b("Your location shows where you live and go — share carefully.", "Location batati hai aap kahan rehte hain — soch samajh kar dein.") },
  { id: "contacts", icon: "users", name: b("Contacts", "Contacts"), why: b("Messaging and calling apps.", "Messaging aur calling apps."), caution: b("Giving contacts exposes your family's numbers too.", "Contacts dene se ghar walon ke number bhi chale jate hain.") },
  { id: "sms", icon: "message", name: b("SMS", "SMS"), why: b("Very few apps need to read your SMS.", "Bohat kam apps ko SMS parhne ki zaroorat hoti hai."), caution: b("SMS contains your OTPs — be very careful.", "SMS mein aap ke OTP hote hain — bohat ehtiyat karein.") },
  { id: "files", icon: "folder", name: b("Photos & files", "Photos aur files"), why: b("Sharing pictures or documents.", "Tasveerein ya documents bhejna."), caution: b("Prefer 'selected photos only' if offered.", "Mumkin ho to 'sirf chuni hui tasveerein' chunein.") },
];
