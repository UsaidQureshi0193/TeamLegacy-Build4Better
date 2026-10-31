import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import { demoExplain } from "@/lib/engine/screen";
import { InputError, LANGUAGE_NAME, clampText, errorResponse, parseImage, parseLang, redactSensitive } from "@/lib/safety";
import type { ExplainResult } from "@/lib/types";

const ExplainSchema = z.object({
  explanation: z.string(),
  safe_to_tap: z.enum(["yes", "caution", "no", "unknown"]),
  tip: z.string(),
});

const SYSTEM = `${CORE_RULES}

Task: Point & Explain. The user tapped ONE element on their screenshot. Explain just that element in 2–3 short sentences: what it is, what happens if they tap or fill it, and whether that is safe.
- safe_to_tap: "yes" (harmless, e.g. Back), "caution" (completes an action, involves money/codes/personal data, or a link), "no" (clearly risky in context), "unknown" (can't tell).
- tip: one practical, protective tip.
- Only use what is visible. If the element is unclear, say so.`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = parseLang(body.language);
    const element = redactSensitive(clampText(body.element, 300)).text;
    const context = redactSensitive(clampText(body.context, 3000)).text;
    const image = parseImage(body.image);
    if (!element) throw new InputError("Please choose a part of the screen to explain.");

    if (!aiConfigured()) {
      return Response.json({ ...demoExplain(element, context, lang), mode: "demo" } satisfies ExplainResult);
    }
    try {
      const ai = await structuredCall({
        system: SYSTEM,
        schema: ExplainSchema,
        image,
        effort: "low",
        maxTokens: 3000,
        text: `Respond in ${LANGUAGE_NAME[lang]}.\nThe user tapped: "${element}"\nOther text on the screen for context:\n${context}`,
      });
      return Response.json({ ...ai, mode: "live" } satisfies ExplainResult);
    } catch (error) {
      console.warn("[humraah] Vision explain call failed, falling back to demo engine:", error);
      const notice = error instanceof AiUnavailableError ? error.message : "Live AI limit reached, using built-in safety engine.";
      return Response.json({ ...demoExplain(element, context, lang), mode: "demo", notice } satisfies ExplainResult);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
