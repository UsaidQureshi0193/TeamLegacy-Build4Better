// HUMRAAH Academy — fictional practice scenarios only.
// Every bank, person, number and amount below is invented for training.

/** Text in English, Roman Urdu and Urdu script. */
export type Bi = { en: string; roman: string; ur: string };

export interface Segment {
  text: string;
  clue?: { id: string; label: Bi; explain: Bi };
}

export interface Choice {
  id: string;
  text: Bi;
  correct: boolean;
  feedback: Bi;
}

export interface EscapeRoom {
  id: string;
  title: Bi;
  channel: "sms" | "whatsapp" | "email";
  sender: string;
  time: string;
  /** Genuine rooms teach that not every message is a scam — the right answer is calm verification. */
  genuine?: boolean;
  segments: Segment[];
  question: Bi;
  choices: Choice[];
  hint: Bi;
  takeaway: Bi;
}

export interface TaskStep {
  prompt: Bi;
  visual?: "bill" | "urls" | "permission" | "portal";
  choices: Choice[];
  hint: Bi;
}

export interface TaskMission {
  id: string;
  title: Bi;
  intro: Bi;
  skill: string;
  steps: TaskStep[];
  takeaway: Bi;
}

const b = (en: string, roman: string, ur: string): Bi => ({ en, roman, ur });

export const ESCAPE_ROOMS: EscapeRoom[] = [
  {
    id: "bank-otp",
    title: b("The 'blocked account' SMS", "'Account band' wala SMS", "'اکاؤنٹ بند' والا SMS"),
    channel: "sms",
    sender: "+92 301 4455821",
    time: "9:41 AM",
    segments: [
      { text: "Dear Customer, your " },
      { text: "Sitara Bank", clue: { id: "brand", label: b("Bank name from a mobile number", "Mobile number se bank ka naam", "موبائل نمبر سے بینک کا نام"), explain: b("A real bank alert comes from a short official sender, not a personal 03xx number.", "Asli bank alert chhote official sender se aata hai, kisi 03xx number se nahi.", "اصلی بینک کا پیغام ایک چھوٹے سرکاری نام سے آتا ہے، کسی ذاتی 03xx نمبر سے نہیں۔") } },
      { text: " account " },
      { text: "will be BLOCKED within 2 hours", clue: { id: "threat", label: b("Threat with a deadline", "Waqt ki had ke saath dhamki", "وقت کی حد کے ساتھ دھمکی"), explain: b("Pressure and a short deadline are meant to stop you thinking.", "Dabao aur kam waqt aap ko sochne se rokne ke liye hai.", "دباؤ اور کم وقت اس لیے دیا جاتا ہے تاکہ آپ سوچ نہ سکیں۔") } },
      { text: " due to incomplete KYC. To keep it active " },
      { text: "reply with the 6-digit OTP", clue: { id: "otp", label: b("Asks for your OTP", "OTP maang raha hai", "آپ کا OTP مانگ رہا ہے"), explain: b("No bank ever asks you to send your OTP. This is the biggest red flag.", "Koi bank kabhi OTP bhejne ko nahi kehta. Yeh sab se bari khatre ki nishani hai.", "کوئی بینک کبھی OTP بھیجنے کو نہیں کہتا۔ یہ سب سے بڑی خطرے کی نشانی ہے۔") } },
      { text: " sent to your phone or update at " },
      { text: "sitara-bank-kyc.xyz", clue: { id: "link", label: b("Look-alike website", "Naqli website", "نقلی ویب سائٹ"), explain: b("Dashes and a '.xyz' ending — not the bank's real website.", "Dash aur '.xyz' — yeh bank ki asli website nahi.", "ڈیش اور '.xyz' کا آخر — یہ بینک کی اصلی ویب سائٹ نہیں۔") } },
      { text: "." },
    ],
    question: b("What is the safest thing to do?", "Sab se mehfooz kaam kya hai?", "سب سے محفوظ کام کیا ہے؟"),
    choices: [
      { id: "a", text: b("Reply with the OTP so the account stays open", "Account bachane ke liye OTP bhej dein", "اکاؤنٹ بچانے کے لیے OTP بھیج دیں"), correct: false, feedback: b("Sharing the OTP would let the sender into your account.", "OTP batane se bhejne wala aap ke account mein ghus sakta hai.", "OTP بتانے سے بھیجنے والا آپ کے اکاؤنٹ میں داخل ہو سکتا ہے۔") },
      { id: "b", text: b("Open the link to update KYC", "Link khol kar KYC update karein", "لنک کھول کر KYC اپڈیٹ کریں"), correct: false, feedback: b("The link leads to a look-alike site built to steal details.", "Yeh link naqli site par le jata hai jo maloomat churati hai.", "یہ لنک ایک نقلی سائٹ پر لے جاتا ہے جو آپ کی معلومات چراتی ہے۔") },
      { id: "c", text: b("Don't reply. Call the number on the back of my card", "Jawab na dein. Card ke peeche likhe number par call karein", "جواب نہ دیں۔ کارڈ کے پیچھے لکھے نمبر پر کال کریں"), correct: true, feedback: b("Exactly. You verify using a number you already trust.", "Bilkul sahi. Aap bharosemand number se khud tasdeeq karte hain.", "بالکل درست! آپ ایسے نمبر سے خود تصدیق کرتے ہیں جس پر آپ کو پہلے سے بھروسہ ہے۔") },
      { id: "d", text: b("Call the number that sent the SMS", "SMS bhejne wale number par call karein", "SMS بھیجنے والے نمبر پر کال کریں"), correct: false, feedback: b("That number belongs to the sender — they'll pretend to be the bank.", "Woh number bhejne wale ka hai — woh bank ban kar baat karega.", "وہ نمبر بھیجنے والے کا ہے — وہ بینک بن کر بات کرے گا۔") },
    ],
    hint: b("Ask: would a real bank ever need my secret code?", "Sochiye: kya asli bank ko kabhi mera khufia code chahiye hoga?", "سوچیں: کیا اصلی بینک کو کبھی میرا خفیہ کوڈ چاہیے ہوگا؟"),
    takeaway: b("OTP = your key. Never share it. Verify with the number on your card.", "OTP = aap ki chaabi. Kabhi na batayein. Card wale number se tasdeeq karein.", "OTP آپ کی چابی ہے۔ کبھی کسی کو نہ بتائیں۔ کارڈ والے نمبر سے تصدیق کریں۔"),
  },
  {
    id: "relative-emergency",
    title: b("The 'new number' relative", "'Naya number' wala rishtedar", "'نیا نمبر' والا رشتہ دار"),
    channel: "whatsapp",
    sender: "+92 345 9081234",
    time: "11:15 PM",
    segments: [
      { text: "Assalam o Alaikum Ammi, " },
      { text: "this is my new number", clue: { id: "newnum", label: b("'New number' story", "'Naya number' ki kahani", "'نیا نمبر' کی کہانی"), explain: b("Scammers pose as family from an unknown number. Call the old number first.", "Fraudiye anjaan number se rishtedar bante hain. Pehle purane number par call karein.", "دھوکے باز انجان نمبر سے رشتہ دار بن جاتے ہیں۔ پہلے پرانے نمبر پر کال کریں۔") } },
      { text: ", purana phone kharab ho gaya. " },
      { text: "Bohat emergency hai", clue: { id: "urgent", label: b("Emotional urgency", "Jazbaati jaldi", "جذباتی جلدی"), explain: b("Urgency plus emotion is designed to make you act before checking.", "Jaldi aur jazbaat aap ko check kiye baghair qadam uthane ke liye hain.", "جلدی اور جذبات اس لیے ہیں تاکہ آپ تصدیق کیے بغیر قدم اٹھا لیں۔") } },
      { text: ", hospital ka bill dena hai. " },
      { text: "Rs 45,000 is Easypaisa number par bhej dein", clue: { id: "money", label: b("Money to an unknown account", "Anjaan account par paise", "انجان اکاؤنٹ پر پیسے"), explain: b("Money requests to a new account must be verified by voice on a known number.", "Naye account par paison ki darkhwast ki tasdeeq jaane pehchane number par awaz se karein.", "نئے اکاؤنٹ پر پیسوں کی درخواست کی تصدیق جانے پہچانے نمبر پر بات کر کے کریں۔") } },
      { text: " — " },
      { text: "Abbu ko mat batana", clue: { id: "secret", label: b("Asks for secrecy", "Raaz rakhne ko kehna", "راز رکھنے کو کہنا"), explain: b("Secrecy stops you from checking with family.", "Raaz rakhwana aap ko ghar walon se poochne se rokta hai.", "راز رکھوانا آپ کو گھر والوں سے پوچھنے سے روکتا ہے۔") } },
      { text: ", baad mein samjhaunga." },
    ],
    question: b("What should Ammi do first?", "Ammi ko pehle kya karna chahiye?", "امی کو پہلے کیا کرنا چاہیے؟"),
    choices: [
      { id: "a", text: b("Send the money quickly — it's an emergency", "Jaldi paise bhej dein — emergency hai", "جلدی پیسے بھیج دیں — ایمرجنسی ہے"), correct: false, feedback: b("Money sent to a scammer is very hard to recover.", "Fraudiye ko bheje paise wapas lena bohat mushkil hai.", "دھوکے باز کو بھیجے گئے پیسے واپس ملنا بہت مشکل ہے۔") },
      { id: "b", text: b("Call her son on his OLD number or ask family", "Bete ko PURANE number par call karein ya ghar walon se poochein", "بیٹے کو پرانے نمبر پر کال کریں یا گھر والوں سے پوچھیں"), correct: true, feedback: b("Right. A real emergency survives a two-minute check.", "Sahi. Asli emergency do minute ki tasdeeq bardasht kar leti hai.", "درست! اصلی ایمرجنسی دو منٹ کی تصدیق کا انتظار کر سکتی ہے۔") },
      { id: "c", text: b("Reply asking for a photo to prove it's him", "Saboot ke liye tasveer maangein", "ثبوت کے لیے تصویر مانگیں"), correct: false, feedback: b("Photos can be stolen from social media. A voice call on a known number is better.", "Tasveerein social media se churai ja sakti hain. Jaane pehchane number par call behtar hai.", "تصویریں سوشل میڈیا سے چرائی جا سکتی ہیں۔ جانے پہچانے نمبر پر کال کرنا بہتر ہے۔") },
    ],
    hint: b("How could you reach your son without using this new number?", "Is naye number ke baghair bete se kaise rabta karein?", "اس نئے نمبر کے بغیر بیٹے سے کیسے رابطہ کریں؟"),
    takeaway: b("New number + money + secrecy = stop and call the old number.", "Naya number + paise + raaz = ruk jayein aur purane number par call karein.", "نیا نمبر + پیسے + راز = رک جائیں اور پرانے نمبر پر کال کریں۔"),
  },
  {
    id: "prize-lottery",
    title: b("The lucky-draw prize", "Lucky draw ka inaam", "لکی ڈرا کا انعام"),
    channel: "sms",
    sender: "PRIZE-ALERT",
    time: "3:02 PM",
    segments: [
      { text: "Mubarak ho! " },
      { text: "Aap ne Rs 5,00,000 ka inaam jeeta hai", clue: { id: "prize", label: b("Prize you never entered", "Aisa inaam jis mein hissa hi nahi liya", "ایسا انعام جس میں حصہ ہی نہیں لیا"), explain: b("You cannot win a draw you did not enter.", "Jis qurandazi mein hissa na liya ho, us mein jeet nahi sakte.", "جس قرعہ اندازی میں حصہ نہ لیا ہو، اس میں جیت نہیں سکتے۔") } },
      { text: " Mega Lucky Draw mein. Inaam lene ke liye " },
      { text: "Rs 2,500 processing fee", clue: { id: "fee", label: b("Pay-to-receive fee", "Paane ke liye fees", "انعام لینے کے لیے فیس"), explain: b("Real prizes never require you to pay first.", "Asli inaam ke liye pehle paise nahi dene parte.", "اصلی انعام کے لیے پہلے پیسے نہیں دینے پڑتے۔") } },
      { text: " is number par bhejein aur " },
      { text: "apna CNIC number likh kar reply karein", clue: { id: "cnic", label: b("Asks for your CNIC", "CNIC maang raha hai", "آپ کا CNIC مانگ رہا ہے"), explain: b("Your CNIC can be misused to open SIMs or accounts in your name.", "Aap ka CNIC aap ke naam par SIM ya account kholne mein ghalat istemal ho sakta hai.", "آپ کے CNIC سے آپ کے نام پر سم یا اکاؤنٹ کھولا جا سکتا ہے۔") } },
      { text: ". " },
      { text: "Offer sirf aaj ke liye!", clue: { id: "today", label: b("'Today only' pressure", "'Sirf aaj' ka dabao", "'صرف آج' کا دباؤ"), explain: b("Artificial deadlines push quick decisions.", "Banawati waqt ki had jaldi faislay karwati hai.", "بناوٹی وقت کی حد جلدی فیصلے کرواتی ہے۔") } },
    ],
    question: b("What is the best response?", "Behtareen jawab kya hai?", "بہترین جواب کیا ہے؟"),
    choices: [
      { id: "a", text: b("Pay the small fee — the prize is much bigger", "Choti fees de dein — inaam bara hai", "چھوٹی فیس دے دیں — انعام بڑا ہے"), correct: false, feedback: b("The 'fee' is the scam. There is no prize.", "'Fees' hi dhoka hai. Koi inaam nahi.", "یہ 'فیس' ہی دھوکہ ہے۔ کوئی انعام نہیں ہے۔") },
      { id: "b", text: b("Send only the CNIC, not money", "Sirf CNIC bhej dein, paise nahi", "صرف CNIC بھیج دیں، پیسے نہیں"), correct: false, feedback: b("Your CNIC is valuable to fraudsters too.", "CNIC bhi fraudiyon ke liye qeemti hai.", "آپ کا CNIC بھی دھوکے بازوں کے لیے قیمتی ہے۔") },
      { id: "c", text: b("Ignore and delete it; report it as spam", "Nazar andaz kar ke delete karein; spam report karein", "نظر انداز کر کے ڈیلیٹ کریں اور اسپیم رپورٹ کریں"), correct: true, feedback: b("Yes — no reply, no fee, no details.", "Haan — na jawab, na fees, na maloomat.", "جی ہاں — نہ جواب، نہ فیس، نہ معلومات۔") },
    ],
    hint: b("Did you ever enter this lucky draw?", "Kya aap ne kabhi yeh lucky draw join kiya tha?", "کیا آپ نے کبھی اس لکی ڈرا میں حصہ لیا تھا؟"),
    takeaway: b("A prize that asks for a fee or your CNIC is not a prize.", "Jo inaam fees ya CNIC maange woh inaam nahi.", "جو انعام فیس یا CNIC مانگے، وہ انعام نہیں۔"),
  },
  {
    id: "courier-link",
    title: b("The parcel delivery link", "Parcel delivery ka link", "پارسل ڈیلیوری کا لنک"),
    channel: "sms",
    sender: "+92 312 7766554",
    time: "10:20 AM",
    segments: [
      { text: "Tez Courier: " },
      { text: "Your parcel is on hold", clue: { id: "hold", label: b("Parcel you may not expect", "Ghair mutawaqqa parcel", "غیر متوقع پارسل"), explain: b("Fake delivery messages are sent to thousands hoping someone is expecting a parcel.", "Naqli delivery messages hazaron logon ko bheje jate hain.", "نقلی ڈیلیوری کے پیغامات ہزاروں لوگوں کو بھیجے جاتے ہیں، اس امید پر کہ کوئی پارسل کا انتظار کر رہا ہو۔") } },
      { text: " due to an incomplete address. Pay " },
      { text: "Rs 150 re-delivery charges", clue: { id: "fee", label: b("Small 'redelivery' fee", "Choti 're-delivery' fees", "چھوٹی 'ری ڈیلیوری' فیس"), explain: b("The small fee is bait to collect your card details.", "Choti fees card ki maloomat lene ka chaara hai.", "یہ چھوٹی فیس آپ کے کارڈ کی معلومات لینے کا چارہ ہے۔") } },
      { text: " at " },
      { text: "bit.ly/tez-parcel-pk", clue: { id: "short", label: b("Shortened link hides the site", "Chhota link asli site chhupata hai", "چھوٹا لنک اصلی سائٹ چھپاتا ہے"), explain: b("Short links hide where they really go.", "Chhote link chhupate hain ke woh asal mein kahan le jate hain.", "چھوٹے لنک یہ چھپاتے ہیں کہ وہ اصل میں کہاں لے جاتے ہیں۔") } },
      { text: " within 24 hours or it will be returned." },
    ],
    question: b("What should you do?", "Aap ko kya karna chahiye?", "آپ کو کیا کرنا چاہیے؟"),
    choices: [
      { id: "a", text: b("Tap the link and pay Rs 150 — it's small", "Link khol kar Rs 150 de dein — kam hai", "لنک کھول کر Rs 150 دے دیں — تھوڑے ہی ہیں"), correct: false, feedback: b("The page would ask for full card details, which can be misused for much more.", "Page poori card details maangega jo kahin zyada nuqsan ke liye istemal ho sakti hain.", "وہ صفحہ پورے کارڈ کی معلومات مانگے گا، جن سے کہیں زیادہ نقصان ہو سکتا ہے۔") },
      { id: "b", text: b("Check the order in the shop's app or call the courier's official helpline", "Shop ki app mein order check karein ya courier ki official helpline par call karein", "دکان کی ایپ میں آرڈر دیکھیں یا کورئیر کی سرکاری ہیلپ لائن پر کال کریں"), correct: true, feedback: b("Correct. Check through a channel you open yourself.", "Durust. Us tareeqe se check karein jo aap khud kholte hain.", "درست! اسی ذریعے سے دیکھیں جو آپ خود کھولتے ہیں۔") },
      { id: "c", text: b("Forward it to friends to ask", "Doston ko forward kar ke poochein", "دوستوں کو فارورڈ کر کے پوچھیں"), correct: false, feedback: b("Asking is good, but forwarding spreads the risky link. Describe it instead.", "Poochna acha hai, magar forward karne se khatarnaak link phailta hai.", "پوچھنا اچھا ہے، مگر فارورڈ کرنے سے خطرناک لنک پھیلتا ہے۔ صرف بتا دیں۔") },
    ],
    hint: b("Can you see where the short link really goes?", "Kya aap dekh sakte hain ke chhota link asal mein kahan jata hai?", "کیا آپ دیکھ سکتے ہیں کہ یہ چھوٹا لنک اصل میں کہاں جاتا ہے؟"),
    takeaway: b("Don't pay through links in messages. Open the official app yourself.", "Message ke link se payment na karein. Official app khud kholein.", "پیغام کے لنک سے ادائیگی نہ کریں۔ سرکاری ایپ خود کھولیں۔"),
  },
  {
    id: "genuine-alert",
    title: b("A normal transaction alert", "Aam transaction alert", "عام لین دین کا پیغام"),
    channel: "sms",
    sender: "SITARABNK",
    time: "1:47 PM",
    genuine: true,
    segments: [
      { text: "Sitara Bank: Rs 3,200 spent on your debit card ending 4417 at City Pharmacy on 12-Oct. " },
      { text: "If this was not you, call the number on the back of your card.", clue: { id: "verify", label: b("Points you to your own card's number", "Aap ko apne card wale number ki taraf bhejta hai", "آپ کو اپنے کارڈ والے نمبر کی طرف بھیجتا ہے"), explain: b("Genuine alerts send you to a number you already have — they don't give a new one or ask for codes.", "Asli alerts aap ko pehle se maloom number par bhejte hain — naya number ya code nahi maangte.", "اصلی پیغامات آپ کو پہلے سے معلوم نمبر کی طرف بھیجتے ہیں — نہ نیا نمبر دیتے ہیں، نہ کوڈ مانگتے ہیں۔") } },
      { text: " " },
      { text: "Never share your OTP or PIN with anyone.", clue: { id: "warn", label: b("Warns you to protect your OTP", "OTP bachane ki hidayat", "OTP بچانے کی ہدایت"), explain: b("Real banks remind you never to share codes.", "Asli bank yaad dilate hain ke code kabhi na batayein.", "اصلی بینک یاد دلاتے ہیں کہ کوڈ کبھی کسی کو نہ بتائیں۔") } },
    ],
    question: b("This message asks for nothing. What's sensible?", "Yeh message kuch nahi maangta. Samajhdari kya hai?", "یہ پیغام کچھ نہیں مانگتا۔ سمجھداری کیا ہے؟"),
    choices: [
      { id: "a", text: b("Panic and reply 'STOP'", "Ghabra kar 'STOP' reply karein", "گھبرا کر 'STOP' کا جواب دیں"), correct: false, feedback: b("No need to reply. If the purchase was yours, nothing to do.", "Reply ki zaroorat nahi. Agar kharidari aap ki thi to kuch nahi karna.", "جواب دینے کی ضرورت نہیں۔ اگر خریداری آپ نے کی تھی تو کچھ نہیں کرنا۔") },
      { id: "b", text: b("If I made this purchase, nothing. If not, call the number on my card", "Agar kharidari meri thi to kuch nahi. Warna card wale number par call", "اگر خریداری میری تھی تو کچھ نہیں۔ ورنہ کارڈ والے نمبر پر کال کروں گا/گی"), correct: true, feedback: b("Perfect — calm, and you verify on your own trusted number.", "Behtareen — sukoon se, aur apne bharosemand number par tasdeeq.", "بہترین! سکون سے، اور اپنے بھروسے والے نمبر پر تصدیق۔") },
      { id: "c", text: b("Assume every bank SMS is a scam and block the bank", "Har bank SMS ko dhoka samajh kar bank block kar dein", "ہر بینک SMS کو دھوکہ سمجھ کر بینک کو بلاک کر دیں"), correct: false, feedback: b("Blocking real alerts means you'd miss genuine fraud warnings.", "Asli alerts block karne se asli fraud ki khabar nahi milegi.", "اصلی پیغامات بلاک کرنے سے آپ کو اصلی دھوکے کی خبر نہیں ملے گی۔") },
    ],
    hint: b("Does this message ask you to send, tap or share anything?", "Kya yeh message kuch bhejne, kholne ya batane ko kehta hai?", "کیا یہ پیغام کچھ بھیجنے، کھولنے یا بتانے کو کہتا ہے؟"),
    takeaway: b("Genuine alerts inform you and ask for nothing. Still verify using your own numbers.", "Asli alerts sirf khabar dete hain, kuch nahi maangte. Phir bhi apne number se tasdeeq karein.", "اصلی پیغامات صرف اطلاع دیتے ہیں، کچھ نہیں مانگتے۔ پھر بھی اپنے نمبر سے تصدیق کریں۔"),
  },
];

export const TASK_MISSIONS: TaskMission[] = [
  {
    id: "bill-portal",
    title: b("Pay a bill on a practice portal", "Practice portal par bill jama karein", "مشق والے پورٹل پر بل جمع کریں"),
    intro: b("A fictional electricity bill and a fictional bank app. No real money is involved.", "Farzi bijli ka bill aur farzi bank app. Koi asli paisa shamil nahi.", "فرضی بجلی کا بل اور فرضی بینک ایپ۔ کوئی اصلی پیسہ شامل نہیں۔"),
    skill: "bill-payment",
    steps: [
      {
        prompt: b("Which number on the bill do you type into the app?", "Bill ka kaunsa number app mein likhein ge?", "بل کا کون سا نمبر ایپ میں لکھیں گے؟"),
        visual: "bill",
        choices: [
          { id: "a", text: b("Reference No. 0412 3456 7890 12", "Reference No. 0412 3456 7890 12", "ریفرنس نمبر 0412 3456 7890 12"), correct: true, feedback: b("Yes — the reference number identifies your bill.", "Haan — reference number aap ka bill pehchanta hai.", "جی ہاں — ریفرنس نمبر سے آپ کا بل پہچانا جاتا ہے۔") },
          { id: "b", text: b("Meter No. 88213", "Meter No. 88213", "میٹر نمبر 88213"), correct: false, feedback: b("The meter number is for the device, not for payment.", "Meter number aale ka hai, payment ka nahi.", "میٹر نمبر میٹر کا ہے، ادائیگی کا نہیں۔") },
          { id: "c", text: b("Units consumed: 245", "Istemal shuda units: 245", "استعمال شدہ یونٹ: 245"), correct: false, feedback: b("That's how much electricity you used.", "Yeh bijli ka istemal hai.", "یہ بتاتا ہے کہ آپ نے کتنی بجلی استعمال کی۔") },
        ],
        hint: b("Look for the long 14-digit number near the top.", "Upar 14 hindson wala lamba number dhoondein.", "اوپر 14 ہندسوں والا لمبا نمبر ڈھونڈیں۔"),
      },
      {
        prompt: b("The bill says Rs 4,860 by 18 Oct, Rs 5,346 after. Today is 15 Oct. How much do you pay?", "Bill par 18 Oct tak Rs 4,860, baad mein Rs 5,346. Aaj 15 Oct hai. Kitna denge?", "بل پر 18 اکتوبر تک Rs 4,860 اور بعد میں Rs 5,346 لکھا ہے۔ آج 15 اکتوبر ہے۔ آپ کتنے دیں گے؟"),
        choices: [
          { id: "a", text: b("Rs 4,860", "Rs 4,860", "Rs 4,860"), correct: true, feedback: b("Right — you are before the due date.", "Sahi — abhi aakhri tareekh nahi guzri.", "درست — ابھی آخری تاریخ نہیں گزری۔") },
          { id: "b", text: b("Rs 5,346", "Rs 5,346", "Rs 5,346"), correct: false, feedback: b("That's the late amount, only after the due date.", "Yeh der wali raqam hai, aakhri tareekh ke baad.", "یہ دیر والی رقم ہے، جو آخری تاریخ کے بعد لگتی ہے۔") },
        ],
        hint: b("Compare today's date with the due date.", "Aaj ki tareekh ko aakhri tareekh se milayein.", "آج کی تاریخ کو آخری تاریخ سے ملائیں۔"),
      },
      {
        prompt: b("The practice app shows a box: 'Enter OTP sent to your phone to confirm'. Who should type it?", "Practice app mein box: 'Confirm karne ke liye OTP likhein'. Kaun likhe?", "مشق والی ایپ میں خانہ ہے: 'تصدیق کے لیے OTP لکھیں'۔ اسے کون لکھے؟"),
        visual: "portal",
        choices: [
          { id: "a", text: b("Me, privately, inside my own bank app", "Main khud, akele, apni bank app ke andar", "میں خود، اکیلے میں، اپنی بینک ایپ کے اندر"), correct: true, feedback: b("Yes. Inside your own app, the code is for you alone.", "Haan. Apni app ke andar code sirf aap ke liye hai.", "جی ہاں۔ اپنی ایپ کے اندر یہ کوڈ صرف آپ کے لیے ہے۔") },
          { id: "b", text: b("I read it out to the helper on the phone", "Phone par madadgar ko parh kar sunaun", "فون پر مددگار کو پڑھ کر سناؤں"), correct: false, feedback: b("Never read an OTP to anyone — even a 'helper'.", "OTP kabhi kisi ko na sunayein — 'madadgar' ko bhi nahi.", "OTP کبھی کسی کو نہ سنائیں — 'مددگار' کو بھی نہیں۔") },
          { id: "c", text: b("I paste it into HUMRAAH to check it", "HUMRAAH mein paste karun", "ہمراہ میں پیسٹ کر کے چیک کرواؤں"), correct: false, feedback: b("HUMRAAH never needs your OTP.", "HUMRAAH ko kabhi aap ka OTP nahi chahiye.", "ہمراہ کو کبھی آپ کا OTP نہیں چاہیے۔") },
        ],
        hint: b("Codes belong only inside the official app, typed by you.", "Code sirf official app mein, aap ke haath se.", "کوڈ صرف سرکاری ایپ میں، آپ کے اپنے ہاتھ سے لکھا جائے۔"),
      },
    ],
    takeaway: b("Reference number → check amount & date → confirm yourself in your own app.", "Reference number → raqam aur tareekh → apni app mein khud confirm.", "ریفرنس نمبر ← رقم اور تاریخ دیکھیں ← اپنی ایپ میں خود تصدیق کریں۔"),
  },
  {
    id: "spot-real-site",
    title: b("Spot the real website", "Asli website pehchanein", "اصلی ویب سائٹ پہچانیں"),
    intro: b("You want to visit the fictional Sitara Bank website. Only one address is real.", "Aap farzi Sitara Bank ki website kholna chahte hain. Sirf ek pata asli hai.", "آپ فرضی ستارہ بینک کی ویب سائٹ کھولنا چاہتے ہیں۔ صرف ایک پتہ اصلی ہے۔"),
    skill: "safe-browsing",
    steps: [
      {
        prompt: b("Which address is most likely the real bank site?", "Kaunsa pata asli bank site lagta hai?", "کون سا پتہ اصلی بینک کی سائٹ لگتا ہے؟"),
        visual: "urls",
        choices: [
          { id: "a", text: b("https://sitarabank.com.pk", "https://sitarabank.com.pk", "https://sitarabank.com.pk"), correct: true, feedback: b("Plain name, Pakistani ending, no extra words.", "Saada naam, Pakistani ending, koi extra alfaaz nahi.", "سادہ نام، پاکستانی آخر (.pk)، کوئی اضافی لفظ نہیں۔") },
          { id: "b", text: b("http://sitara-bank-secure-login.xyz", "http://sitara-bank-secure-login.xyz", "http://sitara-bank-secure-login.xyz"), correct: false, feedback: b("Extra words, many dashes, '.xyz' and no https.", "Extra alfaaz, bohat dash, '.xyz' aur https nahi.", "اضافی لفظ، بہت سے ڈیش، '.xyz' اور https بھی نہیں۔") },
          { id: "c", text: b("https://bit.ly/sitara-pk", "https://bit.ly/sitara-pk", "https://bit.ly/sitara-pk"), correct: false, feedback: b("A short link hides the real destination.", "Chhota link asal manzil chhupata hai.", "چھوٹا لنک اصل منزل چھپاتا ہے۔") },
          { id: "d", text: b("https://sitarabank.com.pk.verify-id.top", "https://sitarabank.com.pk.verify-id.top", "https://sitarabank.com.pk.verify-id.top"), correct: false, feedback: b("Read from the right: the real site is 'verify-id.top'.", "Daayein se parhein: asli site 'verify-id.top' hai.", "دائیں طرف سے پڑھیں: اصل سائٹ 'verify-id.top' ہے۔") },
        ],
        hint: b("Read the part just before the first single slash, from the right.", "Pehle slash se pehle wala hissa daayein se parhein.", "پہلے سلیش (/) سے پہلے والا حصہ دائیں طرف سے پڑھیں۔"),
      },
      {
        prompt: b("Best way to reach your bank's website in future?", "Aainda bank website tak pohanchne ka behtareen tareeqa?", "آئندہ بینک کی ویب سائٹ تک پہنچنے کا بہترین طریقہ کیا ہے؟"),
        choices: [
          { id: "a", text: b("Tap links in SMS from the bank", "Bank ke SMS wale link par click", "بینک کے SMS والے لنک پر کلک کریں"), correct: false, feedback: b("Scammers copy bank SMS. Avoid message links.", "Fraudiye bank SMS nakal karte hain.", "دھوکے باز بینک کے SMS کی نقل کرتے ہیں۔ پیغام کے لنک سے بچیں۔") },
          { id: "b", text: b("Use the official app or a saved bookmark", "Official app ya saved bookmark", "سرکاری ایپ یا محفوظ کیا ہوا بک مارک"), correct: true, feedback: b("Yes — a path you set up yourself.", "Haan — aap ka apna banaya rasta.", "جی ہاں — وہ راستہ جو آپ نے خود بنایا۔") },
        ],
        hint: b("Which path did you create yourself?", "Kaunsa rasta aap ne khud banaya?", "کون سا راستہ آپ نے خود بنایا؟"),
      },
    ],
    takeaway: b("Check the real ending of a web address; prefer the official app.", "Pate ka asli aakhri hissa dekhein; official app behtar hai.", "ویب پتے کا اصل آخری حصہ دیکھیں؛ سرکاری ایپ بہتر ہے۔"),
  },
  {
    id: "permission-check",
    title: b("Answer an app permission", "App permission ka jawab", "ایپ کی اجازت کا جواب دیں"),
    intro: b("A fictional 'Super Torch' flashlight app asks for permissions.", "Farzi 'Super Torch' app ijazatein maang rahi hai.", "فرضی 'Super Torch' ٹارچ ایپ اجازتیں مانگ رہی ہے۔"),
    skill: "privacy",
    steps: [
      {
        prompt: b("'Super Torch' wants access to your Contacts. What do you do?", "'Super Torch' Contacts ki ijazat maang rahi hai. Kya karein?", "'Super Torch' آپ کے رابطوں (Contacts) کی اجازت مانگ رہی ہے۔ آپ کیا کریں گے؟"),
        visual: "permission",
        choices: [
          { id: "a", text: b("Allow — apps need permissions", "Allow — apps ko ijazat chahiye", "“Allow” — ایپس کو اجازت چاہیے ہوتی ہے"), correct: false, feedback: b("A torch doesn't need contacts. This data could be sold or misused.", "Torch ko contacts ki zaroorat nahi.", "ٹارچ کو رابطوں کی ضرورت نہیں۔ یہ معلومات بیچی یا غلط استعمال ہو سکتی ہیں۔") },
          { id: "b", text: b("Don't allow — a torch has no reason to see contacts", "Don't allow — torch ko contacts ki zaroorat nahi", "“Don't allow” — ٹارچ کو رابطے دیکھنے کی کوئی وجہ نہیں"), correct: true, feedback: b("Right. Ask: does the feature need this?", "Sahi. Sochiye: kya is kaam ke liye yeh zaroori hai?", "درست! خود سے پوچھیں: کیا اس کام کے لیے یہ ضروری ہے؟") },
        ],
        hint: b("What does a flashlight actually need to work?", "Torch ko chalne ke liye asal mein kya chahiye?", "ٹارچ کو چلنے کے لیے اصل میں کیا چاہیے؟"),
      },
      {
        prompt: b("WhatsApp asks for the microphone when you start a voice call. Reasonable?", "Voice call par WhatsApp microphone maangta hai. Theek hai?", "آواز والی کال پر WhatsApp مائیکروفون مانگتا ہے۔ کیا یہ ٹھیک ہے؟"),
        choices: [
          { id: "a", text: b("Yes, allow while using the app", "Haan, app istemal karte waqt allow", "جی ہاں، ایپ استعمال کرتے وقت اجازت دیں"), correct: true, feedback: b("A call needs the microphone — this matches the feature.", "Call ke liye microphone zaroori hai.", "کال کے لیے مائیکروفون ضروری ہے — یہ اجازت کام کے مطابق ہے۔") },
          { id: "b", text: b("No, never allow microphones", "Nahi, microphone kabhi nahi", "نہیں، مائیکروفون کی اجازت کبھی نہیں"), correct: false, feedback: b("Then the other person couldn't hear you. Match permissions to features.", "Phir doosra aap ko sun nahi payega.", "پھر دوسرا شخص آپ کو سن نہیں پائے گا۔ اجازت کام کے مطابق دیں۔") },
        ],
        hint: b("Does the feature you're using need it?", "Kya jo kaam aap kar rahe hain us ke liye yeh zaroori hai?", "جو کام آپ کر رہے ہیں، کیا اس کے لیے یہ ضروری ہے؟"),
      },
    ],
    takeaway: b("Allow a permission only when the feature clearly needs it.", "Ijazat tabhi dein jab feature ko waqai zaroorat ho.", "اجازت تبھی دیں جب اس کام کو واقعی اس کی ضرورت ہو۔"),
  },
];

export function pick(bi: Bi, lang: string) {
  return lang === "en" ? bi.en : lang === "ur" ? bi.ur : bi.roman;
}
