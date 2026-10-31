import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import { LANGUAGE_NAME, clampText, errorResponse, parseImage, parseLang, redactSensitive } from "@/lib/safety";
import type { Lang, RescueResult } from "@/lib/types";

const RescueSchema = z.object({ message: z.string(), recovery_steps: z.array(z.string()) });

const SYSTEM = `${CORE_RULES}

Task: Rescue Mode. The user is stuck partway through a guided task. Calm them, then give 2–4 short recovery steps to get back on track (e.g. go back, close and reopen the app, check internet, check the exact spelling). Base advice on what they describe or what is visible in the screenshot. Never ask for codes or passwords. If you can't tell what went wrong, say so and suggest a screenshot.`;

function demoRescue(problem: string, lang: Lang): Omit<RescueResult, "mode"> {
  const p = problem.toLowerCase();
  const pick = (en: string, roman: string, ur: string) => (lang === "en" ? en : lang === "ur" ? ur : roman);
  const steps: string[] = [];
  if (/(internet|network|loading|connection|load|انٹرنیٹ|نیٹ|لوڈ)/.test(p)) {
    steps.push(pick("Check Wi-Fi or mobile data is on, then pull down to refresh.", "Wi-Fi ya mobile data on hai check karein, phir screen neeche kheench kar refresh karein.", "دیکھیں کہ Wi-Fi یا موبائل ڈیٹا آن ہے، پھر اسکرین کو نیچے کھینچ کر ریفریش کریں۔"));
  }
  if (/(password|wrong|incorrect|invalid|پاس ورڈ|غلط)/.test(p)) {
    steps.push(pick("Re-type slowly. Check Caps Lock and that there are no extra spaces.", "Aahista dobara likhein. Caps Lock aur extra space check karein.", "آہستہ آہستہ دوبارہ لکھیں۔ دیکھیں کہ Caps Lock بند ہو اور کوئی اضافی خالی جگہ نہ ہو۔"));
  }
  if (/(code|otp|sms|کوڈ|میسج)/.test(p)) {
    steps.push(pick("Wait a minute for the code, then use 'Resend'. Type it only in the official app — never share it.", "Code ke liye ek minute intezar karein, phir 'Resend'. Sirf official app mein likhein — kisi ko na batayein.", "کوڈ کے لیے ایک منٹ انتظار کریں، پھر “Resend” دبائیں۔ کوڈ صرف سرکاری ایپ میں لکھیں، کسی کو نہ بتائیں۔"));
  }
  if (/(button|find|where|nahi mil|not see|can't see|بٹن|نہیں مل|کہاں)/.test(p)) {
    steps.push(pick("Scroll down slowly — buttons are often at the bottom. Or upload a screenshot to Vision AI.", "Aahista neeche scroll karein — buttons aksar neeche hote hain. Ya screenshot Vision AI mein dalein.", "اسکرین کو آہستہ سے نیچے کریں، بٹن اکثر نیچے ہوتے ہیں۔ یا اسکرین شاٹ لے کر “Vision AI” میں ڈالیں۔"));
  }
  steps.push(pick("Tap the Back arrow once to return to the previous screen and try this step again.", "Back ka teer ek dafa dabakar pichli screen par jayein aur yeh step dobara karein.", "واپسی کا تیر (Back) ایک بار دبا کر پچھلی اسکرین پر جائیں اور یہ قدم دوبارہ کریں۔"));
  steps.push(pick("Still stuck? Close the app fully and open it again — your progress here is saved.", "Phir bhi masla? App poori band kar ke dobara kholein — yahan aap ki progress mehfooz hai.", "پھر بھی مسئلہ ہے؟ ایپ پوری طرح بند کر کے دوبارہ کھولیں۔ یہاں آپ کی پیش رفت محفوظ ہے۔"));
  return {
    message: pick("No worries — getting stuck is normal. Let's get you back on track.", "Fikr na karein — atak jana aam baat hai. Chaliye wapas raste par aate hain.", "فکر نہ کریں، اٹک جانا عام بات ہے۔ آئیے دوبارہ صحیح راستے پر چلتے ہیں۔"),
    recovery_steps: steps.slice(0, 4),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = parseLang(body.language);
    const problem = redactSensitive(clampText(body.problem, 800)).text;
    const step = clampText(body.step, 300);
    const task = clampText(body.task, 200);
    const image = parseImage(body.image);

    if (!aiConfigured()) return Response.json({ ...demoRescue(problem, lang), mode: "demo" } satisfies RescueResult);
    try {
      const ai = await structuredCall({
        system: SYSTEM,
        schema: RescueSchema,
        image,
        effort: "low",
        maxTokens: 3000,
        text: `Respond in ${LANGUAGE_NAME[lang]}.\nTask: ${task}\nCurrent step: ${step}\nWhat the user says went wrong: ${problem || "(not described)"}`,
      });
      return Response.json({ ...ai, mode: "live" } satisfies RescueResult);
    } catch (error) {
      console.warn("[humraah] Rescue AI call failed, falling back to demo engine:", error);
      const notice = error instanceof AiUnavailableError ? error.message : "Live AI limit reached, using built-in safety engine.";
      return Response.json({ ...demoRescue(problem, lang), mode: "demo", notice } satisfies RescueResult);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
