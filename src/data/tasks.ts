// Curated guided-task library (HUMRAAH Guide). Steps are written so the USER
// performs every action; HUMRAAH never collects credentials or payment details.
// Content is bilingual (English + Roman Urdu); Urdu-script mode uses Roman Urdu
// for library tasks and live AI for custom goals.

import type { GuideStep, Lang } from "@/lib/types";

type StepText = [instruction: string, why: string, hint: string, simpler: string];

interface StepSrc {
  en: StepText;
  roman: StepText;
  ur?: StepText;
}

export interface LibraryTask {
  id: string;
  icon: "zap" | "video" | "mail" | "file" | "landmark" | "calendar";
  category: string;
  title: { en: string; roman: string; ur?: string };
  blurb: { en: string; roman: string; ur?: string };
  keywords: string[];
  minutes: number;
  safety: { en: string[]; roman: string[]; ur?: string[] };
  steps: StepSrc[];
}

export const TASK_LIBRARY: LibraryTask[] = [
  {
    id: "electricity-bill",
    icon: "zap",
    category: "Bills",
    title: { en: "Understand and pay your electricity bill", roman: "Bijli ka bill samjhein aur jama karein" },
    blurb: { en: "Find the amount, due date and reference number, then pay safely in your own bank app.", roman: "Raqam, aakhri tareekh aur reference number dhoondein, phir apni bank app se mehfooz tareeqe se jama karein." },
    keywords: ["electricity", "bijli", "bill", "wapda", "lesco", "k-electric", "kelectric", "iesco", "mepco", "pay bill", "utility", "بجلی", "بل"],
    minutes: 6,
    safety: {
      en: ["Never share your banking PIN or OTP with anyone.", "Only pay inside your bank's official app or at the bank."],
      roman: ["Apna banking PIN ya OTP kisi ko na batayein.", "Sirf apni bank ki official app ya bank branch se payment karein."],
    },
    steps: [
      {
        en: ["Find the reference number on your bill", "The reference number tells the bank exactly which bill you are paying.", "It is usually printed near the top, labelled “Reference No.” and has 14 digits.", "Look at the top of the bill. Find the long number called Reference No."],
        roman: ["Bill par reference number dhoondein", "Reference number se bank ko pata chalta hai ke aap kaunsa bill de rahe hain.", "Aksar yeh bill ke upar hota hai, “Reference No.” likha hota hai aur 14 hindson ka hota hai.", "Bill ke upar dekhein. Lamba number dhoondein jis ke saath Reference No. likha ho."],
      },
      {
        en: ["Check the amount and the due date", "Paying before the due date avoids a late-payment surcharge.", "Look for “Payable within due date” and “Due Date”. The amount after the due date is higher.", "Find two things: how much to pay, and the last date."],
        roman: ["Raqam aur aakhri tareekh check karein", "Aakhri tareekh se pehle jama karne se jurmana nahi lagta.", "“Payable within due date” aur “Due Date” dhoondein. Tareekh ke baad raqam zyada hoti hai.", "Do cheezein dhoondein: kitne paise dene hain, aur aakhri tareekh."],
      },
      {
        en: ["Open your own bank or wallet app", "Using the official app you installed yourself keeps you away from fake websites.", "Open it from your home screen — not from a link in an SMS or WhatsApp message.", "Tap your bank app icon on the phone screen."],
        roman: ["Apni bank ya wallet app kholein", "Khud install ki hui official app fake websites se bachati hai.", "App ko home screen se kholein — SMS ya WhatsApp ke link se nahi.", "Phone screen par apni bank app ke nishan ko dabayein."],
      },
      {
        en: ["Log in yourself and go to “Bill Payment”", "You type your own password privately — HUMRAAH never needs it.", "The option may be called “Pay Bills”, “Utility Bills” or “Payments”.", "Log in. Then tap Bill Payment."],
        roman: ["Khud log in karein aur “Bill Payment” par jayein", "Password aap khud akele mein likhte hain — HUMRAAH ko is ki zaroorat nahi.", "Yeh option “Pay Bills”, “Utility Bills” ya “Payments” keh laata hai.", "Log in karein. Phir Bill Payment dabayein."],
      },
      {
        en: ["Choose Electricity and your company", "Each electricity company (e.g. LESCO, K-Electric) has its own entry.", "Pick the company name printed at the top of your bill.", "Tap Electricity. Pick the company written on your bill."],
        roman: ["Electricity aur apni company chunein", "Har bijli company (jaise LESCO, K-Electric) ka alag option hota hai.", "Wohi company chunein jis ka naam bill ke upar likha hai.", "Electricity dabayein. Bill par likhi company chunein."],
      },
      {
        en: ["Type the reference number and check the details", "The app shows the name and amount so you can confirm it is your bill.", "Make sure the name and amount on screen match your paper bill before continuing.", "Type the number. Check the name and amount match your bill."],
        roman: ["Reference number likhein aur details check karein", "App naam aur raqam dikhati hai taake aap tasdeeq kar sakein ke yeh aap ka bill hai.", "Aage barhne se pehle screen par naam aur raqam ko kaghaz wale bill se milayein.", "Number likhein. Naam aur raqam bill se milayein."],
      },
      {
        en: ["Confirm the payment yourself and save the receipt", "The final tap is always yours. The receipt is your proof of payment.", "After paying, take a screenshot of the receipt or note the transaction ID.", "Tap Pay. Then save the receipt."],
        roman: ["Payment khud confirm karein aur raseed save karein", "Aakhri button hamesha aap khud dabate hain. Raseed aap ka saboot hai.", "Payment ke baad raseed ka screenshot lein ya transaction ID likh lein.", "Pay dabayein. Phir raseed save karein."],
      },
    ],
  },
  {
    id: "whatsapp-video-call",
    icon: "video",
    category: "Messaging",
    title: { en: "Make a WhatsApp video call", roman: "WhatsApp par video call karein" },
    blurb: { en: "See and talk to family on a video call in a few taps.", roman: "Chand clicks mein ghar walon ko video call par dekhein aur baat karein." },
    keywords: ["whatsapp", "video call", "call", "video", "vedio", "family", "واٹس ایپ", "ویڈیو"],
    minutes: 3,
    safety: {
      en: ["Never share the 6-digit WhatsApp code that arrives by SMS.", "Be careful with video calls from unknown numbers."],
      roman: ["WhatsApp ka 6 hindson wala SMS code kabhi kisi ko na batayein.", "Anjaan numbers ki video call se hoshiyar rahein."],
    },
    steps: [
      {
        en: ["Open WhatsApp", "WhatsApp is the green app with a white phone inside a speech bubble.", "Swipe up on the home screen if you cannot see it.", "Tap the green WhatsApp icon."],
        roman: ["WhatsApp kholein", "WhatsApp hari app hai jis mein safed phone bana hai.", "Agar nazar na aaye to home screen par ungli upar ki taraf sarkayein.", "Hare WhatsApp nishan ko dabayein."],
      },
      {
        en: ["Open the chat of the person you want to call", "The call buttons are inside each person's chat.", "Use the search (magnifying glass) at the top to type their name.", "Tap the person's name."],
        roman: ["Jis ko call karni hai us ki chat kholein", "Call ke button har shakhs ki chat ke andar hote hain.", "Upar search (magnifying glass) dabakar naam likhein.", "Us shakhs ke naam ko dabayein."],
      },
      {
        en: ["Tap the video camera icon at the top", "The camera icon starts a video call; the phone icon starts a voice call.", "It is at the top-right, next to the phone icon.", "Tap the small camera picture at the top."],
        roman: ["Upar video camera ka nishan dabayein", "Camera ka nishan video call shuru karta hai; phone ka nishan sirf awaz wali call.", "Yeh upar daayin taraf phone ke nishan ke saath hota hai.", "Upar chhote camera ki tasveer dabayein."],
      },
      {
        en: ["Allow camera and microphone if asked", "WhatsApp needs them so the other person can see and hear you.", "Tap “Allow” or “While using the app”. This is safe for WhatsApp calls.", "If the phone asks, tap Allow."],
        roman: ["Agar poocha jaye to camera aur microphone ki ijazat dein", "Taake doosra shakhs aap ko dekh aur sun sake.", "“Allow” ya “While using the app” dabayein. WhatsApp call ke liye yeh theek hai.", "Phone pooche to Allow dabayein."],
      },
      {
        en: ["Talk, then tap the red button to end", "The red button hangs up the call.", "If the screen goes dark, tap it once to see the buttons again.", "When finished, tap the red button."],
        roman: ["Baat karein, phir laal button se call band karein", "Laal button call khatam karta hai.", "Agar screen andheri ho jaye to ek dafa tap karein, buttons wapas aa jayenge.", "Baat khatam ho to laal button dabayein."],
      },
    ],
  },
  {
    id: "create-email",
    icon: "mail",
    category: "Accounts",
    title: { en: "Create an email account", roman: "Email account banayein" },
    blurb: { en: "Set up a free email address with a strong password and recovery number.", roman: "Mazboot password aur recovery number ke saath muft email banayein." },
    keywords: ["email", "gmail", "e-mail", "mail", "account", "ای میل", "جی میل"],
    minutes: 8,
    safety: {
      en: ["Write your password somewhere private at home — never share it.", "Add your own phone number for recovery, not someone else's."],
      roman: ["Password ghar mein mehfooz jagah likh lein — kisi ko na batayein.", "Recovery ke liye apna number dein, kisi aur ka nahi."],
    },
    steps: [
      {
        en: ["Open the Gmail app or gmail.com", "Gmail is a free, widely used email service.", "Type gmail.com yourself in the browser instead of tapping ads.", "Open Gmail."],
        roman: ["Gmail app ya gmail.com kholein", "Gmail muft aur aam istemal hone wali email service hai.", "Browser mein gmail.com khud likhein, ads par click na karein.", "Gmail kholein."],
      },
      {
        en: ["Tap “Create account” and choose “For my personal use”", "This makes a personal account for you.", "The button is under the sign-in box.", "Tap Create account."],
        roman: ["“Create account” dabayein aur “For my personal use” chunein", "Is se aap ka zaati account banta hai.", "Yeh button sign-in box ke neeche hota hai.", "Create account dabayein."],
      },
      {
        en: ["Enter your name and date of birth", "This helps the service set up and protect your account.", "Gender is optional — you may choose “Rather not say”.", "Type your name and birthday."],
        roman: ["Apna naam aur tareekh-e-paidaish likhein", "Is se account set up aur mehfooz hota hai.", "Gender lazmi nahi — “Rather not say” chun sakte hain.", "Apna naam aur salgirah likhein."],
      },
      {
        en: ["Pick your email address", "This is your new address, like name.surname@gmail.com.", "If your first choice is taken, add a number, e.g. ahmed.khan1955.", "Choose your new email name."],
        roman: ["Apna email address chunein", "Yeh aap ka naya pata hai, jaise naam.surname@gmail.com.", "Agar pehla naam pehle se liya hua ho to number laga dein, jaise ahmed.khan1955.", "Naya email naam chunein."],
      },
      {
        en: ["Create a strong password privately", "A strong password stops others from guessing it.", "Use 3–4 random words with a number, e.g. Chai-Baarish-Patang-47. Do not reuse your bank password.", "Make a long password from words only you know."],
        roman: ["Akele mein mazboot password banayein", "Mazboot password ka koi andaza nahi laga sakta.", "3–4 alag alfaaz aur ek number milayein, jaise Chai-Baarish-Patang-47. Bank wala password dobara na lagayein.", "Lamba password banayein jo sirf aap jaanein."],
      },
      {
        en: ["Add your phone number for recovery", "If you forget your password, a code comes to your phone to get back in.", "Enter only your own number. The code that arrives is for you alone.", "Add your own mobile number."],
        roman: ["Recovery ke liye apna phone number dein", "Password bhoolne par code aap ke phone par aata hai.", "Sirf apna number dein. Aane wala code sirf aap ke liye hai.", "Apna mobile number likhein."],
      },
      {
        en: ["Review and agree, then send yourself a test email", "Sending a test proves your account works.", "Read the summary, tap “I agree”, then write an email to a family member.", "Tap I agree. Send one email to family."],
        roman: ["Dekh kar agree karein, phir test email bhejein", "Test email se pata chalta hai ke account chal raha hai.", "Summary parhein, “I agree” dabayein, phir ghar walon ko email likhein.", "I agree dabayein. Ghar walon ko ek email bhejein."],
      },
    ],
  },
  {
    id: "online-form",
    icon: "file",
    category: "Forms",
    title: { en: "Fill an online form safely", roman: "Online form mehfooz tareeqe se bharein" },
    blurb: { en: "Read fields carefully, enter correct details and check before you submit.", roman: "Khaane dhyaan se parhein, sahi maloomat likhein aur bhejne se pehle check karein." },
    keywords: ["form", "online form", "apply", "application", "registration", "fill", "فارم"],
    minutes: 7,
    safety: {
      en: ["Check the website address before typing personal details.", "Never type passwords, PINs or OTPs into forms that arrived by link."],
      roman: ["Zaati maloomat likhne se pehle website ka pata check karein.", "Link se aaye form mein kabhi password, PIN ya OTP na likhein."],
    },
    steps: [
      {
        en: ["Check the website address at the top", "Official government sites usually end in .gov.pk.", "Look for the padlock and the exact address. If unsure, close it and search for the official site yourself.", "Look at the address at the top of the screen."],
        roman: ["Upar website ka pata check karein", "Sarkari websites aksar .gov.pk par khatam hoti hain.", "Taala (padlock) aur sahi pata dekhein. Shak ho to band kar ke khud official site dhoondein.", "Screen ke upar likha pata dekhein."],
      },
      {
        en: ["Read the whole form once before typing", "Knowing what is needed helps you gather documents first.", "Fields marked with * are required.", "Read everything first. Fields with * must be filled."],
        roman: ["Likhne se pehle poora form ek dafa parhein", "Pata ho ke kya chahiye to documents pehle ikatthe ho jate hain.", "Jin khaanon par * ho woh lazmi hain.", "Pehle sab parhein. * wale khaane zaroori hain."],
      },
      {
        en: ["Fill one field at a time", "Going slowly reduces mistakes.", "Tap a box, type, then move to the next. Use Point & Explain on a screenshot if a field confuses you.", "Fill one box. Then the next."],
        roman: ["Ek waqt mein ek khaana bharein", "Aahista chalne se ghaltiyan kam hoti hain.", "Box dabayein, likhein, phir agla. Koi khaana samajh na aaye to screenshot par Point & Explain istemal karein.", "Ek box bharein. Phir agla."],
      },
      {
        en: ["Upload documents if asked", "Many forms need a photo or scan of a document.", "Take a clear, well-lit photo. Upload only what the form asks for.", "Add only the papers the form asks for."],
        roman: ["Agar maanga jaye to documents upload karein", "Bohat se forms document ki tasveer maangte hain.", "Saaf aur roshni mein tasveer lein. Sirf wohi upload karein jo maanga gaya ho.", "Sirf maange gaye kaghaz lagayein."],
      },
      {
        en: ["Review everything, then submit yourself", "Mistakes after submitting can be hard to fix.", "Check spellings, numbers and dates. Only you press Submit.", "Check again. Then press Submit."],
        roman: ["Sab dobara dekhein, phir khud submit karein", "Submit ke baad ghalti theek karna mushkil hota hai.", "Hijje, numbers aur tareekhen check karein. Submit sirf aap dabayein.", "Dobara check karein. Phir Submit dabayein."],
      },
      {
        en: ["Save the confirmation number", "It proves you applied and helps you track progress.", "Take a screenshot of the confirmation page.", "Save a picture of the last page."],
        roman: ["Confirmation number save karein", "Is se sabit hota hai ke aap ne apply kiya.", "Confirmation page ka screenshot lein.", "Aakhri page ki tasveer save karein."],
      },
    ],
  },
  {
    id: "government-website",
    icon: "landmark",
    category: "Government",
    title: { en: "Use a government website safely", roman: "Sarkari website mehfooz tareeqe se istemal karein" },
    blurb: { en: "Find the real official site, avoid look-alikes and get what you need.", roman: "Asli sarkari site dhoondein, naqli se bachein aur apna kaam karein." },
    keywords: ["government", "nadra", "fbr", "passport", "gov", "sarkari", "website", "portal", "سرکاری"],
    minutes: 5,
    safety: {
      en: ["Government sites in Pakistan usually end in .gov.pk.", "Government offices do not ask for your OTP over the phone."],
      roman: ["Pakistan ki sarkari sites aksar .gov.pk par khatam hoti hain.", "Sarkari daftar phone par aap ka OTP nahi maangte."],
    },
    steps: [
      {
        en: ["Type the department name in a search engine", "Searching yourself avoids fake links sent in messages.", "Skip results marked “Ad” or “Sponsored”.", "Search the office name. Skip ads."],
        roman: ["Search engine mein mehkame ka naam likhein", "Khud search karne se messages wale fake links se bachte hain.", "“Ad” ya “Sponsored” wale results chhor dein.", "Daftar ka naam search karein. Ads chhor dein."],
      },
      {
        en: ["Check the address ends in .gov.pk", "Look-alike sites copy logos but cannot use .gov.pk.", "Read the address letter by letter; watch for extra words or dashes.", "Make sure the address ends in .gov.pk."],
        roman: ["Check karein ke pata .gov.pk par khatam ho", "Naqli sites logo nakal karti hain magar .gov.pk istemal nahi kar saktin.", "Pata harf ba harf parhein; extra alfaaz ya dash par nazar rakhein.", "Dekhein pata .gov.pk par khatam ho."],
      },
      {
        en: ["Find the service in the menu", "Services are usually grouped under “Services”, “E-Services” or “Online”.", "Use the site's own search box if you can't find it.", "Look for Services in the menu."],
        roman: ["Menu mein service dhoondein", "Services aksar “Services”, “E-Services” ya “Online” mein hoti hain.", "Na milay to site ka apna search box istemal karein.", "Menu mein Services dhoondein."],
      },
      {
        en: ["Read fees and requirements before starting", "Official fees are listed on the official page — not in WhatsApp messages.", "Note documents you need and the official payment method.", "Read what it costs and what papers you need."],
        roman: ["Shuru karne se pehle fees aur sharait parhein", "Asli fees official page par likhi hoti hai — WhatsApp messages mein nahi.", "Zaroori documents aur official payment ka tareeqa note karein.", "Kharcha aur zaroori kaghaz parhein."],
      },
      {
        en: ["Complete the steps and keep the tracking ID", "A tracking ID lets you follow your application.", "Save it in your notes or take a screenshot.", "Save the tracking number."],
        roman: ["Steps mukammal karein aur tracking ID sambhal lein", "Tracking ID se aap application ka haal dekh sakte hain.", "Notes mein likh lein ya screenshot lein.", "Tracking number save karein."],
      },
    ],
  },
  {
    id: "book-appointment",
    icon: "calendar",
    category: "Health",
    title: { en: "Book a doctor's appointment online", roman: "Online doctor ka appointment book karein" },
    blurb: { en: "Choose a doctor, a time slot, and confirm without sharing unnecessary details.", roman: "Doctor aur waqt chunein, aur ghair zaroori maloomat diye baghair confirm karein." },
    keywords: ["appointment", "doctor", "hospital", "clinic", "booking", "book", "ڈاکٹر"],
    minutes: 5,
    safety: {
      en: ["Book only through the hospital's official website or app.", "Pay only at the clinic or through the official app — not to a personal number."],
      roman: ["Sirf hospital ki official website ya app se book karein.", "Payment sirf clinic par ya official app se karein — kisi zaati number par nahi."],
    },
    steps: [
      {
        en: ["Open the hospital's official app or website", "Official channels protect your health details.", "Find it by searching the hospital name yourself.", "Open the hospital's real website."],
        roman: ["Hospital ki official app ya website kholein", "Official tareeqe aap ki sehat ki maloomat mehfooz rakhte hain.", "Hospital ka naam khud search kar ke dhoondein.", "Hospital ki asli website kholein."],
      },
      {
        en: ["Choose the department and doctor", "Departments group doctors by speciality (e.g. Cardiology for heart).", "If unsure, choose “General Physician / Medicine”.", "Pick the type of doctor you need."],
        roman: ["Department aur doctor chunein", "Department doctors ko maharat ke hisaab se rakhte hain (jaise dil ke liye Cardiology).", "Shak ho to “General Physician / Medicine” chunein.", "Jis qisam ka doctor chahiye, chunein."],
      },
      {
        en: ["Pick a date and time slot", "Available slots are usually shown in green or bold.", "Pick a time you can reach comfortably, allowing for traffic.", "Tap a free time."],
        roman: ["Tareekh aur waqt chunein", "Khaali waqt aksar hare ya mote huroof mein hote hain.", "Aisa waqt chunein jis par aap aaram se pohanch sakein.", "Khaali waqt dabayein."],
      },
      {
        en: ["Enter patient details", "The clinic needs a name and contact number to reach you.", "Give only what is asked; your full medical history is not needed to book.", "Type the patient's name and phone."],
        roman: ["Mareez ki maloomat likhein", "Clinic ko naam aur rabte ka number chahiye.", "Sirf wohi dein jo maanga jaye; booking ke liye poori medical history zaroori nahi.", "Mareez ka naam aur phone likhein."],
      },
      {
        en: ["Confirm and save the appointment details", "A confirmation message is your proof of booking.", "Screenshot the confirmation and set a phone reminder.", "Confirm. Save the message."],
        roman: ["Confirm karein aur appointment ki tafseel save karein", "Confirmation message booking ka saboot hai.", "Confirmation ka screenshot lein aur phone par reminder lagayein.", "Confirm karein. Message save karein."],
      },
    ],
  },
];

export function localiseTask(task: LibraryTask, lang: Lang) {
  // Urdu script falls back to Roman Urdu for any text not yet translated.
  const pickText = <T,>(v: { en: T; roman: T; ur?: T }): T => (lang === "en" ? v.en : lang === "ur" ? (v.ur ?? v.roman) : v.roman);
  const steps: GuideStep[] = task.steps.map((s, i) => {
    const [instruction, why, hint, simpler] = pickText(s);
    return { id: `${task.id}-${i + 1}`, instruction, why, hint, simpler };
  });
  return {
    task_id: task.id,
    title: pickText(task.title),
    category: task.category,
    steps,
    safety_notes: pickText(task.safety),
    completion_criteria: pickText({
      en: "You confirm that you completed every step yourself.",
      roman: "Aap tasdeeq karein ke har step aap ne khud mukammal kiya.",
      ur: "آپ تصدیق کریں کہ ہر قدم آپ نے خود مکمل کیا۔",
    }),
  };
}

export function matchTask(goal: string): LibraryTask | null {
  const g = goal.toLowerCase();
  let best: { task: LibraryTask; score: number } | null = null;
  for (const task of TASK_LIBRARY) {
    const score = task.keywords.reduce((s, k) => (g.includes(k) ? s + k.length : s), 0);
    if (score > 0 && (!best || score > best.score)) best = { task, score };
  }
  return best?.task ?? null;
}
