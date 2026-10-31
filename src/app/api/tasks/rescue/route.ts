import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import { LANGUAGE_NAME, clampText, errorResponse, parseImage, parseLang, redactSensitive } from "@/lib/safety";
import type { Lang, RescueResult } from "@/lib/types";

const RescueSchema = z.object({ message: z.string(), recovery_steps: z.array(z.string()) });

const SYSTEM = `${CORE_RULES}

Task: Rescue Mode. The user is stuck partway through a guided task. Calm them, then give 2–4 short recovery steps to get back on track (e.g. go back, close and reopen the app, check internet, check the exact spelling). Base advice on what they describe or what is visible in the screenshot. Never ask for codes or passwords. If you can't tell what went wrong, say so and suggest a screenshot.`;

function demoRescue(problem: string, lang: Lang): Omit<RescueResult, "mode"> {
  const p = problem.toLowerCase();
  const en = lang === "en";
  const steps: string[] = [];
  if (/(internet|network|loading|connection|load)/.test(p)) steps.push(en ? "Check Wi-Fi or mobile data is on, then pull down to refresh." : "Wi-Fi ya mobile data on hai check karein, phir screen neeche kheench kar refresh karein.");
  if (/(password|wrong|incorrect|invalid)/.test(p)) steps.push(en ? "Re-type slowly. Check Caps Lock and that there are no extra spaces." : "Aahista dobara likhein. Caps Lock aur extra space check karein.");
  if (/(code|otp|sms)/.test(p)) steps.push(en ? "Wait a minute for the code, then use 'Resend'. Type it only in the official app — never share it." : "Code ke liye ek minute intezar karein, phir 'Resend'. Sirf official app mein likhein — kisi ko na batayein.");
  if (/(button|find|where|nahi mil|not see|can't see)/.test(p)) steps.push(en ? "Scroll down slowly — buttons are often at the bottom. Or upload a screenshot to Vision AI." : "Aahista neeche scroll karein — buttons aksar neeche hote hain. Ya screenshot Vision AI mein dalein.");
  steps.push(en ? "Tap the Back arrow once to return to the previous screen and try this step again." : "Back ka teer ek dafa dabakar pichli screen par jayein aur yeh step dobara karein.");
  steps.push(en ? "Still stuck? Close the app fully and open it again — your progress here is saved." : "Phir bhi masla? App poori band kar ke dobara kholein — yahan aap ki progress mehfooz hai.");
  return {
    message: en ? "No worries — getting stuck is normal. Let's get you back on track." : "Fikr na karein — atak jana aam baat hai. Chaliye wapas raste par aate hain.",
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
