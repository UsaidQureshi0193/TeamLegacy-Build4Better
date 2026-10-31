// HUMRAAH Academy — fictional practice scenarios only.
// Every bank, person, number and amount below is invented for training.

export type Bi = { en: string; roman: string };

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

const b = (en: string, roman: string): Bi => ({ en, roman });

export const ESCAPE_ROOMS: EscapeRoom[] = [
  {
    id: "bank-otp",
    title: b("The 'blocked account' SMS", "'Account band' wala SMS"),
    channel: "sms",
    sender: "+92 301 4455821",
    time: "9:41 AM",
    segments: [
      { text: "Dear Customer, your " },
      { text: "Sitara Bank", clue: { id: "brand", label: b("Bank name from a mobile number", "Mobile number se bank ka naam"), explain: b("A real bank alert comes from a short official sender, not a personal 03xx number.", "Asli bank alert chhote official sender se aata hai, kisi 03xx number se nahi.") } },
      { text: " account " },
      { text: "will be BLOCKED within 2 hours", clue: { id: "threat", label: b("Threat with a deadline", "Waqt ki had ke saath dhamki"), explain: b("Pressure and a short deadline are meant to stop you thinking.", "Dabao aur kam waqt aap ko sochne se rokne ke liye hai.") } },
      { text: " due to incomplete KYC. To keep it active " },
      { text: "reply with the 6-digit OTP", clue: { id: "otp", label: b("Asks for your OTP", "OTP maang raha hai"), explain: b("No bank ever asks you to send your OTP. This is the biggest red flag.", "Koi bank kabhi OTP bhejne ko nahi kehta. Yeh sab se bari khatre ki nishani hai.") } },
      { text: " sent to your phone or update at " },
      { text: "sitara-bank-kyc.xyz", clue: { id: "link", label: b("Look-alike website", "Naqli website"), explain: b("Dashes and a '.xyz' ending — not the bank's real website.", "Dash aur '.xyz' — yeh bank ki asli website nahi.") } },
      { text: "." },
    ],
    question: b("What is the safest thing to do?", "Sab se mehfooz kaam kya hai?"),
    choices: [
      { id: "a", text: b("Reply with the OTP so the account stays open", "Account bachane ke liye OTP bhej dein"), correct: false, feedback: b("Sharing the OTP would let the sender into your account.", "OTP batane se bhejne wala aap ke account mein ghus sakta hai.") },
      { id: "b", text: b("Open the link to update KYC", "Link khol kar KYC update karein"), correct: false, feedback: b("The link leads to a look-alike site built to steal details.", "Yeh link naqli site par le jata hai jo maloomat churati hai.") },
      { id: "c", text: b("Don't reply. Call the number on the back of my card", "Jawab na dein. Card ke peeche likhe number par call karein"), correct: true, feedback: b("Exactly. You verify using a number you already trust.", "Bilkul sahi. Aap bharosemand number se khud tasdeeq karte hain.") },
      { id: "d", text: b("Call the number that sent the SMS", "SMS bhejne wale number par call karein"), correct: false, feedback: b("That number belongs to the sender — they'll pretend to be the bank.", "Woh number bhejne wale ka hai — woh bank ban kar baat karega.") },
    ],
    hint: b("Ask: would a real bank ever need my secret code?", "Sochiye: kya asli bank ko kabhi mera khufia code chahiye hoga?"),
    takeaway: b("OTP = your key. Never share it. Verify with the number on your card.", "OTP = aap ki chaabi. Kabhi na batayein. Card wale number se tasdeeq karein."),
  },
  {
    id: "relative-emergency",
    title: b("The 'new number' relative", "'Naya number' wala rishtedar"),
    channel: "whatsapp",
    sender: "+92 345 9081234",
    time: "11:15 PM",
    segments: [
      { text: "Assalam o Alaikum Ammi, " },
      { text: "this is my new number", clue: { id: "newnum", label: b("'New number' story", "'Naya number' ki kahani"), explain: b("Scammers pose as family from an unknown number. Call the old number first.", "Fraudiye anjaan number se rishtedar bante hain. Pehle purane number par call karein.") } },
      { text: ", purana phone kharab ho gaya. " },
      { text: "Bohat emergency hai", clue: { id: "urgent", label: b("Emotional urgency", "Jazbaati jaldi"), explain: b("Urgency plus emotion is designed to make you act before checking.", "Jaldi aur jazbaat aap ko check kiye baghair qadam uthane ke liye hain.") } },
      { text: ", hospital ka bill dena hai. " },
      { text: "Rs 45,000 is Easypaisa number par bhej dein", clue: { id: "money", label: b("Money to an unknown account", "Anjaan account par paise"), explain: b("Money requests to a new account must be verified by voice on a known number.", "Naye account par paison ki darkhwast ki tasdeeq jaane pehchane number par awaz se karein.") } },
      { text: " — " },
      { text: "Abbu ko mat batana", clue: { id: "secret", label: b("Asks for secrecy", "Raaz rakhne ko kehna"), explain: b("Secrecy stops you from checking with family.", "Raaz rakhwana aap ko ghar walon se poochne se rokta hai.") } },
      { text: ", baad mein samjhaunga." },
    ],
    question: b("What should Ammi do first?", "Ammi ko pehle kya karna chahiye?"),
    choices: [
      { id: "a", text: b("Send the money quickly — it's an emergency", "Jaldi paise bhej dein — emergency hai"), correct: false, feedback: b("Money sent to a scammer is very hard to recover.", "Fraudiye ko bheje paise wapas lena bohat mushkil hai.") },
      { id: "b", text: b("Call her son on his OLD number or ask family", "Bete ko PURANE number par call karein ya ghar walon se poochein"), correct: true, feedback: b("Right. A real emergency survives a two-minute check.", "Sahi. Asli emergency do minute ki tasdeeq bardasht kar leti hai.") },
      { id: "c", text: b("Reply asking for a photo to prove it's him", "Saboot ke liye tasveer maangein"), correct: false, feedback: b("Photos can be stolen from social media. A voice call on a known number is better.", "Tasveerein social media se churai ja sakti hain. Jaane pehchane number par call behtar hai.") },
    ],
    hint: b("How could you reach your son without using this new number?", "Is naye number ke baghair bete se kaise rabta karein?"),
    takeaway: b("New number + money + secrecy = stop and call the old number.", "Naya number + paise + raaz = ruk jayein aur purane number par call karein."),
  },
  {
    id: "prize-lottery",
    title: b("The lucky-draw prize", "Lucky draw ka inaam"),
    channel: "sms",
    sender: "PRIZE-ALERT",
    time: "3:02 PM",
    segments: [
      { text: "Mubarak ho! " },
      { text: "Aap ne Rs 5,00,000 ka inaam jeeta hai", clue: { id: "prize", label: b("Prize you never entered", "Aisa inaam jis mein hissa hi nahi liya"), explain: b("You cannot win a draw you did not enter.", "Jis qurandazi mein hissa na liya ho, us mein jeet nahi sakte.") } },
      { text: " Mega Lucky Draw mein. Inaam lene ke liye " },
      { text: "Rs 2,500 processing fee", clue: { id: "fee", label: b("Pay-to-receive fee", "Paane ke liye fees"), explain: b("Real prizes never require you to pay first.", "Asli inaam ke liye pehle paise nahi dene parte.") } },
      { text: " is number par bhejein aur " },
      { text: "apna CNIC number likh kar reply karein", clue: { id: "cnic", label: b("Asks for your CNIC", "CNIC maang raha hai"), explain: b("Your CNIC can be misused to open SIMs or accounts in your name.", "Aap ka CNIC aap ke naam par SIM ya account kholne mein ghalat istemal ho sakta hai.") } },
      { text: ". " },
      { text: "Offer sirf aaj ke liye!", clue: { id: "today", label: b("'Today only' pressure", "'Sirf aaj' ka dabao"), explain: b("Artificial deadlines push quick decisions.", "Banawati waqt ki had jaldi faislay karwati hai.") } },
    ],
    question: b("What is the best response?", "Behtareen jawab kya hai?"),
    choices: [
      { id: "a", text: b("Pay the small fee — the prize is much bigger", "Choti fees de dein — inaam bara hai"), correct: false, feedback: b("The 'fee' is the scam. There is no prize.", "'Fees' hi dhoka hai. Koi inaam nahi.") },
      { id: "b", text: b("Send only the CNIC, not money", "Sirf CNIC bhej dein, paise nahi"), correct: false, feedback: b("Your CNIC is valuable to fraudsters too.", "CNIC bhi fraudiyon ke liye qeemti hai.") },
      { id: "c", text: b("Ignore and delete it; report it as spam", "Nazar andaz kar ke delete karein; spam report karein"), correct: true, feedback: b("Yes — no reply, no fee, no details.", "Haan — na jawab, na fees, na maloomat.") },
    ],
    hint: b("Did you ever enter this lucky draw?", "Kya aap ne kabhi yeh lucky draw join kiya tha?"),
    takeaway: b("A prize that asks for a fee or your CNIC is not a prize.", "Jo inaam fees ya CNIC maange woh inaam nahi."),
  },
  {
    id: "courier-link",
    title: b("The parcel delivery link", "Parcel delivery ka link"),
    channel: "sms",
    sender: "+92 312 7766554",
    time: "10:20 AM",
    segments: [
      { text: "Tez Courier: " },
      { text: "Your parcel is on hold", clue: { id: "hold", label: b("Parcel you may not expect", "Ghair mutawaqqa parcel"), explain: b("Fake delivery messages are sent to thousands hoping someone is expecting a parcel.", "Naqli delivery messages hazaron logon ko bheje jate hain.") } },
      { text: " due to an incomplete address. Pay " },
      { text: "Rs 150 re-delivery charges", clue: { id: "fee", label: b("Small 'redelivery' fee", "Choti 're-delivery' fees"), explain: b("The small fee is bait to collect your card details.", "Choti fees card ki maloomat lene ka chaara hai.") } },
      { text: " at " },
      { text: "bit.ly/tez-parcel-pk", clue: { id: "short", label: b("Shortened link hides the site", "Chhota link asli site chhupata hai"), explain: b("Short links hide where they really go.", "Chhote link chhupate hain ke woh asal mein kahan le jate hain.") } },
      { text: " within 24 hours or it will be returned." },
    ],
    question: b("What should you do?", "Aap ko kya karna chahiye?"),
    choices: [
      { id: "a", text: b("Tap the link and pay Rs 150 — it's small", "Link khol kar Rs 150 de dein — kam hai"), correct: false, feedback: b("The page would ask for full card details, which can be misused for much more.", "Page poori card details maangega jo kahin zyada nuqsan ke liye istemal ho sakti hain.") },
      { id: "b", text: b("Check the order in the shop's app or call the courier's official helpline", "Shop ki app mein order check karein ya courier ki official helpline par call karein"), correct: true, feedback: b("Correct. Check through a channel you open yourself.", "Durust. Us tareeqe se check karein jo aap khud kholte hain.") },
      { id: "c", text: b("Forward it to friends to ask", "Doston ko forward kar ke poochein"), correct: false, feedback: b("Asking is good, but forwarding spreads the risky link. Describe it instead.", "Poochna acha hai, magar forward karne se khatarnaak link phailta hai.") },
    ],
    hint: b("Can you see where the short link really goes?", "Kya aap dekh sakte hain ke chhota link asal mein kahan jata hai?"),
    takeaway: b("Don't pay through links in messages. Open the official app yourself.", "Message ke link se payment na karein. Official app khud kholein."),
  },
  {
    id: "genuine-alert",
    title: b("A normal transaction alert", "Aam transaction alert"),
    channel: "sms",
    sender: "SITARABNK",
    time: "1:47 PM",
    genuine: true,
    segments: [
      { text: "Sitara Bank: Rs 3,200 spent on your debit card ending 4417 at City Pharmacy on 12-Oct. " },
      { text: "If this was not you, call the number on the back of your card.", clue: { id: "verify", label: b("Points you to your own card's number", "Aap ko apne card wale number ki taraf bhejta hai"), explain: b("Genuine alerts send you to a number you already have — they don't give a new one or ask for codes.", "Asli alerts aap ko pehle se maloom number par bhejte hain — naya number ya code nahi maangte.") } },
      { text: " " },
      { text: "Never share your OTP or PIN with anyone.", clue: { id: "warn", label: b("Warns you to protect your OTP", "OTP bachane ki hidayat"), explain: b("Real banks remind you never to share codes.", "Asli bank yaad dilate hain ke code kabhi na batayein.") } },
    ],
    question: b("This message asks for nothing. What's sensible?", "Yeh message kuch nahi maangta. Samajhdari kya hai?"),
    choices: [
      { id: "a", text: b("Panic and reply 'STOP'", "Ghabra kar 'STOP' reply karein"), correct: false, feedback: b("No need to reply. If the purchase was yours, nothing to do.", "Reply ki zaroorat nahi. Agar kharidari aap ki thi to kuch nahi karna.") },
      { id: "b", text: b("If I made this purchase, nothing. If not, call the number on my card", "Agar kharidari meri thi to kuch nahi. Warna card wale number par call"), correct: true, feedback: b("Perfect — calm, and you verify on your own trusted number.", "Behtareen — sukoon se, aur apne bharosemand number par tasdeeq.") },
      { id: "c", text: b("Assume every bank SMS is a scam and block the bank", "Har bank SMS ko dhoka samajh kar bank block kar dein"), correct: false, feedback: b("Blocking real alerts means you'd miss genuine fraud warnings.", "Asli alerts block karne se asli fraud ki khabar nahi milegi.") },
    ],
    hint: b("Does this message ask you to send, tap or share anything?", "Kya yeh message kuch bhejne, kholne ya batane ko kehta hai?"),
    takeaway: b("Genuine alerts inform you and ask for nothing. Still verify using your own numbers.", "Asli alerts sirf khabar dete hain, kuch nahi maangte. Phir bhi apne number se tasdeeq karein."),
  },
];

export const TASK_MISSIONS: TaskMission[] = [
  {
    id: "bill-portal",
    title: b("Pay a bill on a practice portal", "Practice portal par bill jama karein"),
    intro: b("A fictional electricity bill and a fictional bank app. No real money is involved.", "Farzi bijli ka bill aur farzi bank app. Koi asli paisa shamil nahi."),
    skill: "bill-payment",
    steps: [
      {
        prompt: b("Which number on the bill do you type into the app?", "Bill ka kaunsa number app mein likhein ge?"),
        visual: "bill",
        choices: [
          { id: "a", text: b("Reference No. 0412 3456 7890 12", "Reference No. 0412 3456 7890 12"), correct: true, feedback: b("Yes — the reference number identifies your bill.", "Haan — reference number aap ka bill pehchanta hai.") },
          { id: "b", text: b("Meter No. 88213", "Meter No. 88213"), correct: false, feedback: b("The meter number is for the device, not for payment.", "Meter number aale ka hai, payment ka nahi.") },
          { id: "c", text: b("Units consumed: 245", "Istemal shuda units: 245"), correct: false, feedback: b("That's how much electricity you used.", "Yeh bijli ka istemal hai.") },
        ],
        hint: b("Look for the long 14-digit number near the top.", "Upar 14 hindson wala lamba number dhoondein."),
      },
      {
        prompt: b("The bill says Rs 4,860 by 18 Oct, Rs 5,346 after. Today is 15 Oct. How much do you pay?", "Bill par 18 Oct tak Rs 4,860, baad mein Rs 5,346. Aaj 15 Oct hai. Kitna denge?"),
        choices: [
          { id: "a", text: b("Rs 4,860", "Rs 4,860"), correct: true, feedback: b("Right — you are before the due date.", "Sahi — abhi aakhri tareekh nahi guzri.") },
          { id: "b", text: b("Rs 5,346", "Rs 5,346"), correct: false, feedback: b("That's the late amount, only after the due date.", "Yeh der wali raqam hai, aakhri tareekh ke baad.") },
        ],
        hint: b("Compare today's date with the due date.", "Aaj ki tareekh ko aakhri tareekh se milayein."),
      },
      {
        prompt: b("The practice app shows a box: 'Enter OTP sent to your phone to confirm'. Who should type it?", "Practice app mein box: 'Confirm karne ke liye OTP likhein'. Kaun likhe?"),
        visual: "portal",
        choices: [
          { id: "a", text: b("Me, privately, inside my own bank app", "Main khud, akele, apni bank app ke andar"), correct: true, feedback: b("Yes. Inside your own app, the code is for you alone.", "Haan. Apni app ke andar code sirf aap ke liye hai.") },
          { id: "b", text: b("I read it out to the helper on the phone", "Phone par madadgar ko parh kar sunaun"), correct: false, feedback: b("Never read an OTP to anyone — even a 'helper'.", "OTP kabhi kisi ko na sunayein — 'madadgar' ko bhi nahi.") },
          { id: "c", text: b("I paste it into HUMRAAH to check it", "HUMRAAH mein paste karun"), correct: false, feedback: b("HUMRAAH never needs your OTP.", "HUMRAAH ko kabhi aap ka OTP nahi chahiye.") },
        ],
        hint: b("Codes belong only inside the official app, typed by you.", "Code sirf official app mein, aap ke haath se."),
      },
    ],
    takeaway: b("Reference number → check amount & date → confirm yourself in your own app.", "Reference number → raqam aur tareekh → apni app mein khud confirm."),
  },
  {
    id: "spot-real-site",
    title: b("Spot the real website", "Asli website pehchanein"),
    intro: b("You want to visit the fictional Sitara Bank website. Only one address is real.", "Aap farzi Sitara Bank ki website kholna chahte hain. Sirf ek pata asli hai."),
    skill: "safe-browsing",
    steps: [
      {
        prompt: b("Which address is most likely the real bank site?", "Kaunsa pata asli bank site lagta hai?"),
        visual: "urls",
        choices: [
          { id: "a", text: b("https://sitarabank.com.pk", "https://sitarabank.com.pk"), correct: true, feedback: b("Plain name, Pakistani ending, no extra words.", "Saada naam, Pakistani ending, koi extra alfaaz nahi.") },
          { id: "b", text: b("http://sitara-bank-secure-login.xyz", "http://sitara-bank-secure-login.xyz"), correct: false, feedback: b("Extra words, many dashes, '.xyz' and no https.", "Extra alfaaz, bohat dash, '.xyz' aur https nahi.") },
          { id: "c", text: b("https://bit.ly/sitara-pk", "https://bit.ly/sitara-pk"), correct: false, feedback: b("A short link hides the real destination.", "Chhota link asal manzil chhupata hai.") },
          { id: "d", text: b("https://sitarabank.com.pk.verify-id.top", "https://sitarabank.com.pk.verify-id.top"), correct: false, feedback: b("Read from the right: the real site is 'verify-id.top'.", "Daayein se parhein: asli site 'verify-id.top' hai.") },
        ],
        hint: b("Read the part just before the first single slash, from the right.", "Pehle slash se pehle wala hissa daayein se parhein."),
      },
      {
        prompt: b("Best way to reach your bank's website in future?", "Aainda bank website tak pohanchne ka behtareen tareeqa?"),
        choices: [
          { id: "a", text: b("Tap links in SMS from the bank", "Bank ke SMS wale link par click"), correct: false, feedback: b("Scammers copy bank SMS. Avoid message links.", "Fraudiye bank SMS nakal karte hain.") },
          { id: "b", text: b("Use the official app or a saved bookmark", "Official app ya saved bookmark"), correct: true, feedback: b("Yes — a path you set up yourself.", "Haan — aap ka apna banaya rasta.") },
        ],
        hint: b("Which path did you create yourself?", "Kaunsa rasta aap ne khud banaya?"),
      },
    ],
    takeaway: b("Check the real ending of a web address; prefer the official app.", "Pate ka asli aakhri hissa dekhein; official app behtar hai."),
  },
  {
    id: "permission-check",
    title: b("Answer an app permission", "App permission ka jawab"),
    intro: b("A fictional 'Super Torch' flashlight app asks for permissions.", "Farzi 'Super Torch' app ijazatein maang rahi hai."),
    skill: "privacy",
    steps: [
      {
        prompt: b("'Super Torch' wants access to your Contacts. What do you do?", "'Super Torch' Contacts ki ijazat maang rahi hai. Kya karein?"),
        visual: "permission",
        choices: [
          { id: "a", text: b("Allow — apps need permissions", "Allow — apps ko ijazat chahiye"), correct: false, feedback: b("A torch doesn't need contacts. This data could be sold or misused.", "Torch ko contacts ki zaroorat nahi.") },
          { id: "b", text: b("Don't allow — a torch has no reason to see contacts", "Don't allow — torch ko contacts ki zaroorat nahi"), correct: true, feedback: b("Right. Ask: does the feature need this?", "Sahi. Sochiye: kya is kaam ke liye yeh zaroori hai?") },
        ],
        hint: b("What does a flashlight actually need to work?", "Torch ko chalne ke liye asal mein kya chahiye?"),
      },
      {
        prompt: b("WhatsApp asks for the microphone when you start a voice call. Reasonable?", "Voice call par WhatsApp microphone maangta hai. Theek hai?"),
        choices: [
          { id: "a", text: b("Yes, allow while using the app", "Haan, app istemal karte waqt allow"), correct: true, feedback: b("A call needs the microphone — this matches the feature.", "Call ke liye microphone zaroori hai.") },
          { id: "b", text: b("No, never allow microphones", "Nahi, microphone kabhi nahi"), correct: false, feedback: b("Then the other person couldn't hear you. Match permissions to features.", "Phir doosra aap ko sun nahi payega.") },
        ],
        hint: b("Does the feature you're using need it?", "Kya jo kaam aap kar rahe hain us ke liye yeh zaroori hai?"),
      },
    ],
    takeaway: b("Allow a permission only when the feature clearly needs it.", "Ijazat tabhi dein jab feature ko waqai zaroorat ho."),
  },
];

export function pick(bi: Bi, lang: string) {
  return lang === "en" ? bi.en : bi.roman;
}
