import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import { TASK_LIBRARY, localiseTask, matchTask } from "@/data/tasks";
import { InputError, LANGUAGE_NAME, clampText, errorResponse, parseLang } from "@/lib/safety";
import type { GuideTask, Lang } from "@/lib/types";

const TaskSchema = z.object({
  title: z.string(),
  category: z.string(),
  steps: z.array(z.object({ instruction: z.string(), why: z.string(), hint: z.string(), simpler: z.string() })),
  safety_notes: z.array(z.string()),
  completion_criteria: z.string(),
});

const SYSTEM = `${CORE_RULES}

Task: you are HUMRAAH Guide. Turn the user's goal into 4–8 small, ordered steps the USER performs themselves on their own phone.
- instruction: one action per step, max ~12 words, starting with a verb.
- why: why this step matters (one sentence).
- hint: where to look / what it usually looks like. Use phrases like "usually" — apps differ, never claim exact positions you can't know.
- simpler: the same step in the simplest possible words (max 10 words).
- Never include a step where the user gives HUMRAAH a password, OTP, PIN or card number. Sensitive final actions (pay, submit, send) are always done and confirmed by the user.
- safety_notes: 2–3 short safety reminders specific to this task.
- If the goal is unsafe or impossible (e.g. "get into someone else's account"), return a single step explaining kindly why HUMRAAH can't help with it.`;

function genericTask(goal: string, lang: Lang): GuideTask {
  const en = lang === "en";
  const steps = (en
    ? [
        ["Open the official app or website yourself", "Opening it yourself avoids fake links.", "Use the icon on your home screen or type the address you know.", "Open the real app yourself."],
        ["Find the menu or search for your task", "Most apps group tasks in a menu (☰) or have a search box.", "Look at the top or bottom of the screen for a menu or magnifying glass.", "Look for Menu or Search."],
        ["Read each screen before tapping", "Reading first prevents accidental taps.", "If a screen confuses you, take a screenshot and use Vision AI.", "Read first. Then tap."],
        ["Fill in only what is asked", "Giving less personal data keeps you safer.", "Required boxes are often marked with *.", "Fill only the needed boxes."],
        ["Check the details, then confirm yourself", "The final tap is always yours.", "Compare names, numbers and amounts before pressing confirm.", "Check, then confirm."],
      ]
    : [
        ["Official app ya website khud kholein", "Khud kholne se naqli links se bachte hain.", "Home screen ka icon istemal karein ya jaana pehchana pata likhein.", "Asli app khud kholein."],
        ["Menu ya search mein apna kaam dhoondein", "Aksar apps kaam menu (☰) ya search mein rakhti hain.", "Screen ke upar ya neeche menu ya magnifying glass dhoondein.", "Menu ya Search dhoondein."],
        ["Har screen dabane se pehle parhein", "Pehle parhne se ghalat tap nahi hota.", "Screen samajh na aaye to screenshot le kar Vision AI istemal karein.", "Pehle parhein. Phir dabayein."],
        ["Sirf wohi bharein jo maanga jaye", "Kam zaati maloomat dena zyada mehfooz hai.", "Zaroori khaanon par aksar * hota hai.", "Sirf zaroori khaane bharein."],
        ["Details check karein, phir khud confirm karein", "Aakhri tap hamesha aap ka hai.", "Confirm se pehle naam, number aur raqam milayein.", "Check karein, phir confirm."],
      ]) as [string, string, string, string][];
  return {
    task_id: `custom-${Date.now()}`,
    title: goal.slice(0, 80),
    category: "General",
    language: lang,
    steps: steps.map(([instruction, why, hint, simpler], i) => ({ id: `g-${i + 1}`, instruction, why, hint, simpler })),
    safety_notes: en ? ["Never share OTPs, PINs or passwords.", "Use only official apps and websites."] : ["OTP, PIN ya password kabhi na batayein.", "Sirf official apps aur websites istemal karein."],
    completion_criteria: en ? "You confirm each step yourself." : "Har step aap khud confirm karein.",
    source: "rules",
    mode: "demo",
  };
}

export async function GET() {
  return Response.json(
    TASK_LIBRARY.map((t) => ({ id: t.id, icon: t.icon, category: t.category, title: t.title, blurb: t.blurb, minutes: t.minutes, steps: t.steps.length })),
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = parseLang(body.language);
    const taskId = clampText(body.task_id, 80);
    const goal = clampText(body.goal, 300);
    if (!taskId && !goal) throw new InputError("Tell me what you'd like to learn, e.g. “make a WhatsApp video call”.");

    // 1) Curated library task (reviewed content, works offline).
    const lib = TASK_LIBRARY.find((t) => t.id === taskId) ?? (lang !== "ur" || !aiConfigured() ? matchTask(goal) : null);
    if (lib) {
      return Response.json({ ...localiseTask(lib, lang), language: lang, source: "library", mode: aiConfigured() ? "live" : "demo" } satisfies GuideTask);
    }

    // 2) Custom goal → AI-generated plan, or an honest generic plan in Demo Mode.
    if (!aiConfigured()) {
      const t = genericTask(goal, lang);
      t.notice = lang === "en"
        ? "Demo Mode: this is a general safe plan. Connect an AI key for steps tailored to your exact goal."
        : "Demo Mode: yeh aam mehfooz plan hai. Apne maqsad ke mutabiq steps ke liye AI key lagayein.";
      return Response.json(t);
    }
    try {
      const ai = await structuredCall({
        system: SYSTEM,
        schema: TaskSchema,
        effort: "medium",
        text: `Respond in ${LANGUAGE_NAME[lang]}. The user's goal: "${goal}"`,
      });
      const task: GuideTask = {
        ...ai,
        task_id: `ai-${Date.now()}`,
        language: lang,
        steps: ai.steps.slice(0, 10).map((s, i) => ({ ...s, id: `ai-${i + 1}` })),
        source: "ai",
        mode: "live",
      };
      return Response.json(task);
    } catch (error) {
      if (!(error instanceof AiUnavailableError)) throw error;
      return Response.json({ ...genericTask(goal, lang), notice: error.message });
    }
  } catch (error) {
    return errorResponse(error);
  }
}
