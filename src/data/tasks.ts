// Curated guided-task library (HUMRAAH Guide). Steps are written so the USER
// performs every action; HUMRAAH never collects credentials or payment details.
// Content is trilingual: English, Roman Urdu and Urdu script (`ur`).

import type { GuideStep, Lang } from "@/lib/types";

type StepText = [instruction: string, why: string, hint: string, simpler: string];

interface StepSrc {
  en: StepText;
  roman: StepText;
  ur: StepText;
}

export interface LibraryTask {
  id: string;
  icon: "zap" | "video" | "mail" | "file" | "landmark" | "calendar";
  category: string;
  title: { en: string; roman: string; ur: string };
  blurb: { en: string; roman: string; ur: string };
  keywords: string[];
  minutes: number;
  safety: { en: string[]; roman: string[]; ur: string[] };
  steps: StepSrc[];
}

export const TASK_LIBRARY: LibraryTask[] = [
  {
    id: "electricity-bill",
    icon: "zap",
    category: "Bills",
    title: { en: "Understand and pay your electricity bill", roman: "Bijli ka bill samjhein aur jama karein", ur: "بجلی کا بل سمجھیں اور جمع کروائیں" },
    blurb: { en: "Find the amount, due date and reference number, then pay safely in your own bank app.", roman: "Raqam, aakhri tareekh aur reference number dhoondein, phir apni bank app se mehfooz tareeqe se jama karein.", ur: "رقم، آخری تاریخ اور ریفرنس نمبر ڈھونڈیں، پھر اپنی بینک ایپ سے محفوظ طریقے سے بل جمع کروائیں۔" },
    keywords: ["electricity", "bijli", "bill", "wapda", "lesco", "k-electric", "kelectric", "iesco", "mepco", "pay bill", "utility", "بجلی", "بل", "بجلی کا بل", "بل جمع", "ادائیگی"],
    minutes: 6,
    safety: {
      en: ["Never share your banking PIN or OTP with anyone.", "Only pay inside your bank's official app or at the bank."],
      roman: ["Apna banking PIN ya OTP kisi ko na batayein.", "Sirf apni bank ki official app ya bank branch se payment karein."],
      ur: ["اپنا بینکنگ PIN یا OTP کبھی کسی کو نہ بتائیں۔","ادائیگی صرف اپنے بینک کی سرکاری ایپ میں یا بینک جا کر کریں۔"],
    },
    steps: [
      {
        en: ["Find the reference number on your bill", "The reference number tells the bank exactly which bill you are paying.", "It is usually printed near the top, labelled “Reference No.” and has 14 digits.", "Look at the top of the bill. Find the long number called Reference No."],
        roman: ["Bill par reference number dhoondein", "Reference number se bank ko pata chalta hai ke aap kaunsa bill de rahe hain.", "Aksar yeh bill ke upar hota hai, “Reference No.” likha hota hai aur 14 hindson ka hota hai.", "Bill ke upar dekhein. Lamba number dhoondein jis ke saath Reference No. likha ho."],
        ur: ["بل پر ریفرنس نمبر ڈھونڈیں","ریفرنس نمبر سے بینک کو پتہ چلتا ہے کہ آپ کون سا بل جمع کروا رہے ہیں۔","یہ عموماً بل کے اوپر والے حصے میں ہوتا ہے، اس کے ساتھ “Reference No.” لکھا ہوتا ہے اور اس میں 14 ہندسے ہوتے ہیں۔","بل کے اوپر دیکھیں۔ وہ لمبا نمبر ڈھونڈیں جس کے ساتھ “Reference No.” لکھا ہو۔"],
      },
      {
        en: ["Check the amount and the due date", "Paying before the due date avoids a late-payment surcharge.", "Look for “Payable within due date” and “Due Date”. The amount after the due date is higher.", "Find two things: how much to pay, and the last date."],
        roman: ["Raqam aur aakhri tareekh check karein", "Aakhri tareekh se pehle jama karne se jurmana nahi lagta.", "“Payable within due date” aur “Due Date” dhoondein. Tareekh ke baad raqam zyada hoti hai.", "Do cheezein dhoondein: kitne paise dene hain, aur aakhri tareekh."],
        ur: ["رقم اور آخری تاریخ دیکھیں","آخری تاریخ سے پہلے بل جمع کروانے سے جرمانہ نہیں لگتا۔","“Payable within due date” اور “Due Date” تلاش کریں۔ آخری تاریخ کے بعد رقم زیادہ ہو جاتی ہے۔","دو چیزیں ڈھونڈیں: کتنے پیسے دینے ہیں، اور آخری تاریخ۔"],
      },
      {
        en: ["Open your own bank or wallet app", "Using the official app you installed yourself keeps you away from fake websites.", "Open it from your home screen — not from a link in an SMS or WhatsApp message.", "Tap your bank app icon on the phone screen."],
        roman: ["Apni bank ya wallet app kholein", "Khud install ki hui official app fake websites se bachati hai.", "App ko home screen se kholein — SMS ya WhatsApp ke link se nahi.", "Phone screen par apni bank app ke nishan ko dabayein."],
        ur: ["اپنی بینک یا والٹ ایپ کھولیں","جو سرکاری ایپ آپ نے خود انسٹال کی ہو، وہ آپ کو جعلی ویب سائٹس سے بچاتی ہے۔","ایپ کو فون کی ہوم اسکرین سے کھولیں، SMS یا WhatsApp میں آئے لنک سے نہیں۔","فون پر اپنی بینک ایپ کے نشان کو دبائیں۔"],
      },
      {
        en: ["Log in yourself and go to “Bill Payment”", "You type your own password privately — HUMRAAH never needs it.", "The option may be called “Pay Bills”, “Utility Bills” or “Payments”.", "Log in. Then tap Bill Payment."],
        roman: ["Khud log in karein aur “Bill Payment” par jayein", "Password aap khud akele mein likhte hain — HUMRAAH ko is ki zaroorat nahi.", "Yeh option “Pay Bills”, “Utility Bills” ya “Payments” keh laata hai.", "Log in karein. Phir Bill Payment dabayein."],
        ur: ["خود لاگ اِن کریں اور “Bill Payment” پر جائیں","پاس ورڈ آپ خود اکیلے میں لکھتے ہیں۔ ہمراہ کو اس کی کبھی ضرورت نہیں۔","یہ آپشن “Pay Bills”، “Utility Bills” یا “Payments” کے نام سے بھی ہو سکتا ہے۔","لاگ اِن کریں۔ پھر “Bill Payment” دبائیں۔"],
      },
      {
        en: ["Choose Electricity and your company", "Each electricity company (e.g. LESCO, K-Electric) has its own entry.", "Pick the company name printed at the top of your bill.", "Tap Electricity. Pick the company written on your bill."],
        roman: ["Electricity aur apni company chunein", "Har bijli company (jaise LESCO, K-Electric) ka alag option hota hai.", "Wohi company chunein jis ka naam bill ke upar likha hai.", "Electricity dabayein. Bill par likhi company chunein."],
        ur: ["“Electricity” اور اپنی بجلی کمپنی چنیں","ہر بجلی کمپنی (جیسے LESCO یا K-Electric) کا الگ آپشن ہوتا ہے۔","وہی کمپنی چنیں جس کا نام آپ کے بل کے اوپر لکھا ہے۔","“Electricity” دبائیں۔ بل پر لکھی کمپنی چنیں۔"],
      },
      {
        en: ["Type the reference number and check the details", "The app shows the name and amount so you can confirm it is your bill.", "Make sure the name and amount on screen match your paper bill before continuing.", "Type the number. Check the name and amount match your bill."],
        roman: ["Reference number likhein aur details check karein", "App naam aur raqam dikhati hai taake aap tasdeeq kar sakein ke yeh aap ka bill hai.", "Aage barhne se pehle screen par naam aur raqam ko kaghaz wale bill se milayein.", "Number likhein. Naam aur raqam bill se milayein."],
        ur: ["ریفرنس نمبر لکھیں اور تفصیل چیک کریں","ایپ نام اور رقم دکھاتی ہے تاکہ آپ تسلی کر لیں کہ یہ آپ کا ہی بل ہے۔","آگے بڑھنے سے پہلے اسکرین پر لکھا نام اور رقم اپنے کاغذی بل سے ملا لیں۔","نمبر لکھیں۔ نام اور رقم بل سے ملائیں۔"],
      },
      {
        en: ["Confirm the payment yourself and save the receipt", "The final tap is always yours. The receipt is your proof of payment.", "After paying, take a screenshot of the receipt or note the transaction ID.", "Tap Pay. Then save the receipt."],
        roman: ["Payment khud confirm karein aur raseed save karein", "Aakhri button hamesha aap khud dabate hain. Raseed aap ka saboot hai.", "Payment ke baad raseed ka screenshot lein ya transaction ID likh lein.", "Pay dabayein. Phir raseed save karein."],
        ur: ["ادائیگی خود کنفرم کریں اور رسید محفوظ کریں","آخری بٹن ہمیشہ آپ خود دباتے ہیں۔ رسید آپ کی ادائیگی کا ثبوت ہے۔","ادائیگی کے بعد رسید کا اسکرین شاٹ لے لیں یا Transaction ID لکھ لیں۔","“Pay” دبائیں۔ پھر رسید محفوظ کر لیں۔"],
      },
    ],
  },
  {
    id: "whatsapp-video-call",
    icon: "video",
    category: "Messaging",
    title: { en: "Make a WhatsApp video call", roman: "WhatsApp par video call karein", ur: "WhatsApp پر ویڈیو کال کریں" },
    blurb: { en: "See and talk to family on a video call in a few taps.", roman: "Chand clicks mein ghar walon ko video call par dekhein aur baat karein.", ur: "چند ٹیپ میں گھر والوں کو ویڈیو کال پر دیکھیں اور ان سے بات کریں۔" },
    keywords: ["whatsapp", "video call", "call", "video", "vedio", "family", "واٹس ایپ", "ویڈیو", "ویڈیو کال", "کال", "واٹس اپ"],
    minutes: 3,
    safety: {
      en: ["Never share the 6-digit WhatsApp code that arrives by SMS.", "Be careful with video calls from unknown numbers."],
      roman: ["WhatsApp ka 6 hindson wala SMS code kabhi kisi ko na batayein.", "Anjaan numbers ki video call se hoshiyar rahein."],
      ur: ["WhatsApp کا 6 ہندسوں والا SMS کوڈ کبھی کسی کو نہ بتائیں۔","انجان نمبروں سے آنے والی ویڈیو کالز سے ہوشیار رہیں۔"],
    },
    steps: [
      {
        en: ["Open WhatsApp", "WhatsApp is the green app with a white phone inside a speech bubble.", "Swipe up on the home screen if you cannot see it.", "Tap the green WhatsApp icon."],
        roman: ["WhatsApp kholein", "WhatsApp hari app hai jis mein safed phone bana hai.", "Agar nazar na aaye to home screen par ungli upar ki taraf sarkayein.", "Hare WhatsApp nishan ko dabayein."],
        ur: ["WhatsApp کھولیں","WhatsApp سبز رنگ کی ایپ ہے جس میں سفید فون بنا ہوتا ہے۔","اگر نظر نہ آئے تو ہوم اسکرین پر انگلی نیچے سے اوپر کی طرف کھینچیں۔","سبز WhatsApp کے نشان کو دبائیں۔"],
      },
      {
        en: ["Open the chat of the person you want to call", "The call buttons are inside each person's chat.", "Use the search (magnifying glass) at the top to type their name.", "Tap the person's name."],
        roman: ["Jis ko call karni hai us ki chat kholein", "Call ke button har shakhs ki chat ke andar hote hain.", "Upar search (magnifying glass) dabakar naam likhein.", "Us shakhs ke naam ko dabayein."],
        ur: ["جسے کال کرنی ہے، اس کی چیٹ کھولیں","کال کے بٹن ہر شخص کی چیٹ کے اندر ہوتے ہیں۔","اوپر سرچ کا نشان (محدب شیشہ) دبا کر ان کا نام لکھیں۔","اس شخص کے نام کو دبائیں۔"],
      },
      {
        en: ["Tap the video camera icon at the top", "The camera icon starts a video call; the phone icon starts a voice call.", "It is at the top-right, next to the phone icon.", "Tap the small camera picture at the top."],
        roman: ["Upar video camera ka nishan dabayein", "Camera ka nishan video call shuru karta hai; phone ka nishan sirf awaz wali call.", "Yeh upar daayin taraf phone ke nishan ke saath hota hai.", "Upar chhote camera ki tasveer dabayein."],
        ur: ["اوپر ویڈیو کیمرے کا نشان دبائیں","کیمرے کا نشان ویڈیو کال شروع کرتا ہے، اور فون کا نشان صرف آواز والی کال۔","یہ عموماً اوپر کونے میں فون کے نشان کے ساتھ ہوتا ہے۔","اوپر چھوٹے کیمرے کی تصویر دبائیں۔"],
      },
      {
        en: ["Allow camera and microphone if asked", "WhatsApp needs them so the other person can see and hear you.", "Tap “Allow” or “While using the app”. This is safe for WhatsApp calls.", "If the phone asks, tap Allow."],
        roman: ["Agar poocha jaye to camera aur microphone ki ijazat dein", "Taake doosra shakhs aap ko dekh aur sun sake.", "“Allow” ya “While using the app” dabayein. WhatsApp call ke liye yeh theek hai.", "Phone pooche to Allow dabayein."],
        ur: ["پوچھا جائے تو کیمرہ اور مائیک کی اجازت دیں","اس سے دوسرا شخص آپ کو دیکھ اور سن سکتا ہے۔","“Allow” یا “While using the app” دبائیں۔ WhatsApp کال کے لیے یہ بالکل ٹھیک ہے۔","فون پوچھے تو “Allow” دبائیں۔"],
      },
      {
        en: ["Talk, then tap the red button to end", "The red button hangs up the call.", "If the screen goes dark, tap it once to see the buttons again.", "When finished, tap the red button."],
        roman: ["Baat karein, phir laal button se call band karein", "Laal button call khatam karta hai.", "Agar screen andheri ho jaye to ek dafa tap karein, buttons wapas aa jayenge.", "Baat khatam ho to laal button dabayein."],
        ur: ["بات کریں، پھر سرخ بٹن سے کال ختم کریں","سرخ بٹن کال بند کر دیتا ہے۔","اگر اسکرین اندھیری ہو جائے تو ایک بار ٹیپ کریں، بٹن واپس آ جائیں گے۔","بات ختم ہو تو سرخ بٹن دبائیں۔"],
      },
    ],
  },
  {
    id: "create-email",
    icon: "mail",
    category: "Accounts",
    title: { en: "Create an email account", roman: "Email account banayein", ur: "ای میل اکاؤنٹ بنائیں" },
    blurb: { en: "Set up a free email address with a strong password and recovery number.", roman: "Mazboot password aur recovery number ke saath muft email banayein.", ur: "مضبوط پاس ورڈ اور ریکوری نمبر کے ساتھ مفت ای میل ایڈریس بنائیں۔" },
    keywords: ["email", "gmail", "e-mail", "mail", "account", "ای میل", "جی میل", "اکاؤنٹ", "ای میل اکاؤنٹ"],
    minutes: 8,
    safety: {
      en: ["Write your password somewhere private at home — never share it.", "Add your own phone number for recovery, not someone else's."],
      roman: ["Password ghar mein mehfooz jagah likh lein — kisi ko na batayein.", "Recovery ke liye apna number dein, kisi aur ka nahi."],
      ur: ["پاس ورڈ گھر میں کسی محفوظ جگہ لکھ لیں اور کسی کو نہ بتائیں۔","ریکوری کے لیے اپنا فون نمبر دیں، کسی اور کا نہیں۔"],
    },
    steps: [
      {
        en: ["Open the Gmail app or gmail.com", "Gmail is a free, widely used email service.", "Type gmail.com yourself in the browser instead of tapping ads.", "Open Gmail."],
        roman: ["Gmail app ya gmail.com kholein", "Gmail muft aur aam istemal hone wali email service hai.", "Browser mein gmail.com khud likhein, ads par click na karein.", "Gmail kholein."],
        ur: ["Gmail ایپ یا gmail.com کھولیں","Gmail ایک مفت اور عام استعمال ہونے والی ای میل سروس ہے۔","اشتہارات پر کلک کرنے کے بجائے براؤزر میں gmail.com خود لکھیں۔","Gmail کھولیں۔"],
      },
      {
        en: ["Tap “Create account” and choose “For my personal use”", "This makes a personal account for you.", "The button is under the sign-in box.", "Tap Create account."],
        roman: ["“Create account” dabayein aur “For my personal use” chunein", "Is se aap ka zaati account banta hai.", "Yeh button sign-in box ke neeche hota hai.", "Create account dabayein."],
        ur: ["“Create account” دبائیں اور “For my personal use” چنیں","اس سے آپ کا ذاتی اکاؤنٹ بنتا ہے۔","یہ بٹن سائن اِن والے خانے کے نیچے ہوتا ہے۔","“Create account” دبائیں۔"],
      },
      {
        en: ["Enter your name and date of birth", "This helps the service set up and protect your account.", "Gender is optional — you may choose “Rather not say”.", "Type your name and birthday."],
        roman: ["Apna naam aur tareekh-e-paidaish likhein", "Is se account set up aur mehfooz hota hai.", "Gender lazmi nahi — “Rather not say” chun sakte hain.", "Apna naam aur salgirah likhein."],
        ur: ["اپنا نام اور تاریخِ پیدائش لکھیں","اس سے اکاؤنٹ بنتا ہے اور اس کی حفاظت ہوتی ہے۔","جنس بتانا ضروری نہیں، آپ “Rather not say” بھی چن سکتے ہیں۔","اپنا نام اور سالگرہ لکھیں۔"],
      },
      {
        en: ["Pick your email address", "This is your new address, like name.surname@gmail.com.", "If your first choice is taken, add a number, e.g. ahmed.khan1955.", "Choose your new email name."],
        roman: ["Apna email address chunein", "Yeh aap ka naya pata hai, jaise naam.surname@gmail.com.", "Agar pehla naam pehle se liya hua ho to number laga dein, jaise ahmed.khan1955.", "Naya email naam chunein."],
        ur: ["اپنا ای میل ایڈریس چنیں","یہ آپ کا نیا پتہ ہے، جیسے name.surname@gmail.com","اگر پہلا نام پہلے سے لیا جا چکا ہو تو ساتھ نمبر لگا دیں، جیسے ahmed.khan1955","اپنا نیا ای میل نام چنیں۔"],
      },
      {
        en: ["Create a strong password privately", "A strong password stops others from guessing it.", "Use 3–4 random words with a number, e.g. Chai-Baarish-Patang-47. Do not reuse your bank password.", "Make a long password from words only you know."],
        roman: ["Akele mein mazboot password banayein", "Mazboot password ka koi andaza nahi laga sakta.", "3–4 alag alfaaz aur ek number milayein, jaise Chai-Baarish-Patang-47. Bank wala password dobara na lagayein.", "Lamba password banayein jo sirf aap jaanein."],
        ur: ["اکیلے میں ایک مضبوط پاس ورڈ بنائیں","مضبوط پاس ورڈ کا کوئی اندازہ نہیں لگا سکتا۔","3 یا 4 الگ الفاظ اور ایک نمبر ملائیں، جیسے Chai-Baarish-Patang-47۔ بینک والا پاس ورڈ دوبارہ استعمال نہ کریں۔","ایسا لمبا پاس ورڈ بنائیں جو صرف آپ جانتے ہوں۔"],
      },
      {
        en: ["Add your phone number for recovery", "If you forget your password, a code comes to your phone to get back in.", "Enter only your own number. The code that arrives is for you alone.", "Add your own mobile number."],
        roman: ["Recovery ke liye apna phone number dein", "Password bhoolne par code aap ke phone par aata hai.", "Sirf apna number dein. Aane wala code sirf aap ke liye hai.", "Apna mobile number likhein."],
        ur: ["ریکوری کے لیے اپنا فون نمبر دیں","پاس ورڈ بھول جائیں تو آپ کے فون پر کوڈ آتا ہے جس سے اکاؤنٹ واپس ملتا ہے۔","صرف اپنا نمبر دیں۔ آنے والا کوڈ صرف آپ کے لیے ہے۔","اپنا موبائل نمبر لکھیں۔"],
      },
      {
        en: ["Review and agree, then send yourself a test email", "Sending a test proves your account works.", "Read the summary, tap “I agree”, then write an email to a family member.", "Tap I agree. Send one email to family."],
        roman: ["Dekh kar agree karein, phir test email bhejein", "Test email se pata chalta hai ke account chal raha hai.", "Summary parhein, “I agree” dabayein, phir ghar walon ko email likhein.", "I agree dabayein. Ghar walon ko ek email bhejein."],
        ur: ["پڑھ کر منظور کریں، پھر ایک آزمائشی ای میل بھیجیں","آزمائشی ای میل سے پتہ چلتا ہے کہ اکاؤنٹ ٹھیک کام کر رہا ہے۔","خلاصہ پڑھیں، “I agree” دبائیں، پھر گھر کے کسی فرد کو ای میل لکھیں۔","“I agree” دبائیں۔ گھر والوں کو ایک ای میل بھیجیں۔"],
      },
    ],
  },
  {
    id: "online-form",
    icon: "file",
    category: "Forms",
    title: { en: "Fill an online form safely", roman: "Online form mehfooz tareeqe se bharein", ur: "آن لائن فارم محفوظ طریقے سے بھریں" },
    blurb: { en: "Read fields carefully, enter correct details and check before you submit.", roman: "Khaane dhyaan se parhein, sahi maloomat likhein aur bhejne se pehle check karein.", ur: "خانے دھیان سے پڑھیں، درست معلومات لکھیں اور بھیجنے سے پہلے چیک کریں۔" },
    keywords: ["form", "online form", "apply", "application", "registration", "fill", "فارم", "آن لائن فارم", "درخواست", "رجسٹریشن"],
    minutes: 7,
    safety: {
      en: ["Check the website address before typing personal details.", "Never type passwords, PINs or OTPs into forms that arrived by link."],
      roman: ["Zaati maloomat likhne se pehle website ka pata check karein.", "Link se aaye form mein kabhi password, PIN ya OTP na likhein."],
      ur: ["ذاتی معلومات لکھنے سے پہلے ویب سائٹ کا پتہ چیک کریں۔","لنک سے آئے فارم میں کبھی پاس ورڈ، PIN یا OTP نہ لکھیں۔"],
    },
    steps: [
      {
        en: ["Check the website address at the top", "Official government sites usually end in .gov.pk.", "Look for the padlock and the exact address. If unsure, close it and search for the official site yourself.", "Look at the address at the top of the screen."],
        roman: ["Upar website ka pata check karein", "Sarkari websites aksar .gov.pk par khatam hoti hain.", "Taala (padlock) aur sahi pata dekhein. Shak ho to band kar ke khud official site dhoondein.", "Screen ke upar likha pata dekhein."],
        ur: ["اوپر ویب سائٹ کا پتہ چیک کریں","سرکاری ویب سائٹس عموماً .gov.pk پر ختم ہوتی ہیں۔","تالے کا نشان اور درست پتہ دیکھیں۔ شک ہو تو صفحہ بند کر کے سرکاری سائٹ خود تلاش کریں۔","اسکرین کے اوپر لکھا پتہ دیکھیں۔"],
      },
      {
        en: ["Read the whole form once before typing", "Knowing what is needed helps you gather documents first.", "Fields marked with * are required.", "Read everything first. Fields with * must be filled."],
        roman: ["Likhne se pehle poora form ek dafa parhein", "Pata ho ke kya chahiye to documents pehle ikatthe ho jate hain.", "Jin khaanon par * ho woh lazmi hain.", "Pehle sab parhein. * wale khaane zaroori hain."],
        ur: ["لکھنے سے پہلے پورا فارم ایک بار پڑھ لیں","پتہ ہو کہ کیا چاہیے تو کاغذات پہلے سے اکٹھے ہو جاتے ہیں۔","جن خانوں پر * لگا ہو، وہ بھرنا ضروری ہے۔","پہلے سب پڑھیں۔ * والے خانے ضروری ہیں۔"],
      },
      {
        en: ["Fill one field at a time", "Going slowly reduces mistakes.", "Tap a box, type, then move to the next. Use Point & Explain on a screenshot if a field confuses you.", "Fill one box. Then the next."],
        roman: ["Ek waqt mein ek khaana bharein", "Aahista chalne se ghaltiyan kam hoti hain.", "Box dabayein, likhein, phir agla. Koi khaana samajh na aaye to screenshot par Point & Explain istemal karein.", "Ek box bharein. Phir agla."],
        ur: ["ایک وقت میں ایک خانہ بھریں","آہستہ چلنے سے غلطیاں کم ہوتی ہیں۔","خانے کو دبائیں، لکھیں، پھر اگلے پر جائیں۔ کوئی خانہ سمجھ نہ آئے تو اسکرین شاٹ لے کر “Point & Explain” استعمال کریں۔","ایک خانہ بھریں۔ پھر اگلا۔"],
      },
      {
        en: ["Upload documents if asked", "Many forms need a photo or scan of a document.", "Take a clear, well-lit photo. Upload only what the form asks for.", "Add only the papers the form asks for."],
        roman: ["Agar maanga jaye to documents upload karein", "Bohat se forms document ki tasveer maangte hain.", "Saaf aur roshni mein tasveer lein. Sirf wohi upload karein jo maanga gaya ho.", "Sirf maange gaye kaghaz lagayein."],
        ur: ["کہا جائے تو کاغذات اپ لوڈ کریں","بہت سے فارم کسی کاغذ کی تصویر یا اسکین مانگتے ہیں۔","اچھی روشنی میں صاف تصویر لیں۔ صرف وہی اپ لوڈ کریں جو فارم مانگے۔","صرف مانگے گئے کاغذات لگائیں۔"],
      },
      {
        en: ["Review everything, then submit yourself", "Mistakes after submitting can be hard to fix.", "Check spellings, numbers and dates. Only you press Submit.", "Check again. Then press Submit."],
        roman: ["Sab dobara dekhein, phir khud submit karein", "Submit ke baad ghalti theek karna mushkil hota hai.", "Hijje, numbers aur tareekhen check karein. Submit sirf aap dabayein.", "Dobara check karein. Phir Submit dabayein."],
        ur: ["سب کچھ دوبارہ دیکھیں، پھر خود جمع کروائیں","جمع کروانے کے بعد غلطی ٹھیک کرنا مشکل ہو سکتا ہے۔","ہجے، نمبر اور تاریخیں چیک کریں۔ “Submit” صرف آپ خود دبائیں۔","دوبارہ چیک کریں۔ پھر “Submit” دبائیں۔"],
      },
      {
        en: ["Save the confirmation number", "It proves you applied and helps you track progress.", "Take a screenshot of the confirmation page.", "Save a picture of the last page."],
        roman: ["Confirmation number save karein", "Is se sabit hota hai ke aap ne apply kiya.", "Confirmation page ka screenshot lein.", "Aakhri page ki tasveer save karein."],
        ur: ["تصدیقی نمبر محفوظ کر لیں","اس سے ثابت ہوتا ہے کہ آپ نے درخواست دی، اور آپ اس کی صورتحال دیکھ سکتے ہیں۔","تصدیقی صفحے کا اسکرین شاٹ لے لیں۔","آخری صفحے کی تصویر محفوظ کر لیں۔"],
      },
    ],
  },
  {
    id: "government-website",
    icon: "landmark",
    category: "Government",
    title: { en: "Use a government website safely", roman: "Sarkari website mehfooz tareeqe se istemal karein", ur: "سرکاری ویب سائٹ محفوظ طریقے سے استعمال کریں" },
    blurb: { en: "Find the real official site, avoid look-alikes and get what you need.", roman: "Asli sarkari site dhoondein, naqli se bachein aur apna kaam karein.", ur: "اصل سرکاری سائٹ ڈھونڈیں، نقلی سائٹس سے بچیں اور اپنا کام کریں۔" },
    keywords: ["government", "nadra", "fbr", "passport", "gov", "sarkari", "website", "portal", "سرکاری", "سرکاری ویب سائٹ", "ویب سائٹ", "نادرا", "پاسپورٹ", "پورٹل"],
    minutes: 5,
    safety: {
      en: ["Government sites in Pakistan usually end in .gov.pk.", "Government offices do not ask for your OTP over the phone."],
      roman: ["Pakistan ki sarkari sites aksar .gov.pk par khatam hoti hain.", "Sarkari daftar phone par aap ka OTP nahi maangte."],
      ur: ["پاکستان کی سرکاری ویب سائٹس عموماً .gov.pk پر ختم ہوتی ہیں۔","سرکاری دفاتر فون پر آپ کا OTP نہیں مانگتے۔"],
    },
    steps: [
      {
        en: ["Type the department name in a search engine", "Searching yourself avoids fake links sent in messages.", "Skip results marked “Ad” or “Sponsored”.", "Search the office name. Skip ads."],
        roman: ["Search engine mein mehkame ka naam likhein", "Khud search karne se messages wale fake links se bachte hain.", "“Ad” ya “Sponsored” wale results chhor dein.", "Daftar ka naam search karein. Ads chhor dein."],
        ur: ["سرچ میں محکمے کا نام لکھیں","خود تلاش کرنے سے پیغامات میں آئے جعلی لنکس سے بچت ہوتی ہے۔","جن نتائج پر “Ad” یا “Sponsored” لکھا ہو، انہیں چھوڑ دیں۔","دفتر کا نام تلاش کریں۔ اشتہار چھوڑ دیں۔"],
      },
      {
        en: ["Check the address ends in .gov.pk", "Look-alike sites copy logos but cannot use .gov.pk.", "Read the address letter by letter; watch for extra words or dashes.", "Make sure the address ends in .gov.pk."],
        roman: ["Check karein ke pata .gov.pk par khatam ho", "Naqli sites logo nakal karti hain magar .gov.pk istemal nahi kar saktin.", "Pata harf ba harf parhein; extra alfaaz ya dash par nazar rakhein.", "Dekhein pata .gov.pk par khatam ho."],
        ur: ["چیک کریں کہ پتہ .gov.pk پر ختم ہو","نقلی سائٹس لوگو کی نقل کر لیتی ہیں مگر .gov.pk استعمال نہیں کر سکتیں۔","پتہ حرف بہ حرف پڑھیں۔ اضافی الفاظ یا ڈیش پر نظر رکھیں۔","دیکھیں کہ پتہ .gov.pk پر ختم ہو۔"],
      },
      {
        en: ["Find the service in the menu", "Services are usually grouped under “Services”, “E-Services” or “Online”.", "Use the site's own search box if you can't find it.", "Look for Services in the menu."],
        roman: ["Menu mein service dhoondein", "Services aksar “Services”, “E-Services” ya “Online” mein hoti hain.", "Na milay to site ka apna search box istemal karein.", "Menu mein Services dhoondein."],
        ur: ["مینو میں اپنی سروس ڈھونڈیں","سروسز عموماً “Services”، “E-Services” یا “Online” میں ہوتی ہیں۔","نہ ملے تو سائٹ کا اپنا سرچ خانہ استعمال کریں۔","مینو میں “Services” ڈھونڈیں۔"],
      },
      {
        en: ["Read fees and requirements before starting", "Official fees are listed on the official page — not in WhatsApp messages.", "Note documents you need and the official payment method.", "Read what it costs and what papers you need."],
        roman: ["Shuru karne se pehle fees aur sharait parhein", "Asli fees official page par likhi hoti hai — WhatsApp messages mein nahi.", "Zaroori documents aur official payment ka tareeqa note karein.", "Kharcha aur zaroori kaghaz parhein."],
        ur: ["شروع کرنے سے پہلے فیس اور شرائط پڑھیں","اصل فیس سرکاری صفحے پر لکھی ہوتی ہے، WhatsApp پیغامات میں نہیں۔","ضروری کاغذات اور ادائیگی کا سرکاری طریقہ نوٹ کر لیں۔","خرچہ اور ضروری کاغذات پڑھیں۔"],
      },
      {
        en: ["Complete the steps and keep the tracking ID", "A tracking ID lets you follow your application.", "Save it in your notes or take a screenshot.", "Save the tracking number."],
        roman: ["Steps mukammal karein aur tracking ID sambhal lein", "Tracking ID se aap application ka haal dekh sakte hain.", "Notes mein likh lein ya screenshot lein.", "Tracking number save karein."],
        ur: ["مراحل مکمل کریں اور ٹریکنگ آئی ڈی سنبھال لیں","ٹریکنگ آئی ڈی سے آپ اپنی درخواست کی صورتحال دیکھ سکتے ہیں۔","اسے نوٹس میں لکھ لیں یا اسکرین شاٹ لے لیں۔","ٹریکنگ نمبر محفوظ کر لیں۔"],
      },
    ],
  },
  {
    id: "book-appointment",
    icon: "calendar",
    category: "Health",
    title: { en: "Book a doctor's appointment online", roman: "Online doctor ka appointment book karein", ur: "آن لائن ڈاکٹر کی اپوائنٹمنٹ بک کریں" },
    blurb: { en: "Choose a doctor, a time slot, and confirm without sharing unnecessary details.", roman: "Doctor aur waqt chunein, aur ghair zaroori maloomat diye baghair confirm karein.", ur: "ڈاکٹر اور وقت چنیں، اور غیر ضروری معلومات دیے بغیر بکنگ کنفرم کریں۔" },
    keywords: ["appointment", "doctor", "hospital", "clinic", "booking", "book", "ڈاکٹر", "اپوائنٹمنٹ", "ہسپتال", "کلینک", "بکنگ"],
    minutes: 5,
    safety: {
      en: ["Book only through the hospital's official website or app.", "Pay only at the clinic or through the official app — not to a personal number."],
      roman: ["Sirf hospital ki official website ya app se book karein.", "Payment sirf clinic par ya official app se karein — kisi zaati number par nahi."],
      ur: ["بکنگ صرف ہسپتال کی سرکاری ویب سائٹ یا ایپ سے کریں۔","ادائیگی صرف کلینک پر یا سرکاری ایپ سے کریں، کسی ذاتی نمبر پر نہیں۔"],
    },
    steps: [
      {
        en: ["Open the hospital's official app or website", "Official channels protect your health details.", "Find it by searching the hospital name yourself.", "Open the hospital's real website."],
        roman: ["Hospital ki official app ya website kholein", "Official tareeqe aap ki sehat ki maloomat mehfooz rakhte hain.", "Hospital ka naam khud search kar ke dhoondein.", "Hospital ki asli website kholein."],
        ur: ["ہسپتال کی سرکاری ایپ یا ویب سائٹ کھولیں","سرکاری ذرائع آپ کی صحت کی معلومات محفوظ رکھتے ہیں۔","ہسپتال کا نام خود سرچ کر کے اسے ڈھونڈیں۔","ہسپتال کی اصل ویب سائٹ کھولیں۔"],
      },
      {
        en: ["Choose the department and doctor", "Departments group doctors by speciality (e.g. Cardiology for heart).", "If unsure, choose “General Physician / Medicine”.", "Pick the type of doctor you need."],
        roman: ["Department aur doctor chunein", "Department doctors ko maharat ke hisaab se rakhte hain (jaise dil ke liye Cardiology).", "Shak ho to “General Physician / Medicine” chunein.", "Jis qisam ka doctor chahiye, chunein."],
        ur: ["شعبہ اور ڈاکٹر چنیں","شعبوں میں ڈاکٹر ان کی مہارت کے حساب سے ہوتے ہیں، جیسے دل کے لیے “Cardiology”۔","شک ہو تو “General Physician” یا “Medicine” چنیں۔","جس قسم کا ڈاکٹر چاہیے، وہ چنیں۔"],
      },
      {
        en: ["Pick a date and time slot", "Available slots are usually shown in green or bold.", "Pick a time you can reach comfortably, allowing for traffic.", "Tap a free time."],
        roman: ["Tareekh aur waqt chunein", "Khaali waqt aksar hare ya mote huroof mein hote hain.", "Aisa waqt chunein jis par aap aaram se pohanch sakein.", "Khaali waqt dabayein."],
        ur: ["تاریخ اور وقت چنیں","خالی اوقات عموماً سبز یا موٹے حروف میں دکھائے جاتے ہیں۔","ایسا وقت چنیں جس پر آپ آرام سے پہنچ سکیں، ٹریفک کا بھی خیال رکھیں۔","کوئی خالی وقت دبائیں۔"],
      },
      {
        en: ["Enter patient details", "The clinic needs a name and contact number to reach you.", "Give only what is asked; your full medical history is not needed to book.", "Type the patient's name and phone."],
        roman: ["Mareez ki maloomat likhein", "Clinic ko naam aur rabte ka number chahiye.", "Sirf wohi dein jo maanga jaye; booking ke liye poori medical history zaroori nahi.", "Mareez ka naam aur phone likhein."],
        ur: ["مریض کی معلومات لکھیں","کلینک کو آپ سے رابطے کے لیے نام اور فون نمبر چاہیے۔","صرف وہی دیں جو مانگا جائے۔ بکنگ کے لیے پوری میڈیکل ہسٹری ضروری نہیں۔","مریض کا نام اور فون نمبر لکھیں۔"],
      },
      {
        en: ["Confirm and save the appointment details", "A confirmation message is your proof of booking.", "Screenshot the confirmation and set a phone reminder.", "Confirm. Save the message."],
        roman: ["Confirm karein aur appointment ki tafseel save karein", "Confirmation message booking ka saboot hai.", "Confirmation ka screenshot lein aur phone par reminder lagayein.", "Confirm karein. Message save karein."],
        ur: ["کنفرم کریں اور اپوائنٹمنٹ کی تفصیل محفوظ کریں","تصدیقی پیغام آپ کی بکنگ کا ثبوت ہے۔","تصدیق کا اسکرین شاٹ لیں اور فون میں یاد دہانی لگا لیں۔","کنفرم کریں۔ پیغام محفوظ کر لیں۔"],
      },
    ],
  },
];

export function localiseTask(task: LibraryTask, lang: Lang) {
  const pickText = <T,>(v: { en: T; roman: T; ur: T }): T => (lang === "en" ? v.en : lang === "ur" ? v.ur : v.roman);
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
