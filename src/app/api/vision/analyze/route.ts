import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import { demoVision } from "@/lib/engine/screen";
import { InputError, LANGUAGE_NAME, clampText, errorResponse, parseImage, parseLang, redactSensitive } from "@/lib/safety";
import type { OcrLine, VisionResult } from "@/lib/types";

const VisionSchema = z.object({
  summary: z.string(),
  screen_type: z.string(),
  next_step: z.string(),
  elements: z.array(
    z.object({
      line_id: z.number().int().nullable(),
      text: z.string(),
      kind: z.enum(["button", "input", "label", "error", "heading", "link", "info", "warning"]),
      explanation: z.string(),
    }),
  ),
  limitations: z.array(z.string()),
  sensitive_warning: z.string().optional(),
});

const SYSTEM = `${CORE_RULES}

Task: you are HUMRAAH Vision. Explain a screenshot to someone who finds screens confusing.
- Describe ONLY what is visible. Never invent buttons, fields or menu items. If part of the image is unreadable, say so in limitations.
- summary: 2–3 sentences: what this screen is and what it is asking the user to do.
- next_step: one safe, concrete next action the user can take themselves.
- elements: the important visible buttons, input boxes, labels, errors, links and warnings (max 20). If an element matches one of the OCR lines provided, set line_id to that line's id so it can be highlighted; otherwise null. "text" is the visible label exactly as shown.
- explanation: one plain sentence per element: what it is and what happens if tapped.
- sensitive_warning: include only if the screen involves OTP/PIN/password/card details — remind them to type it only themselves, inside the official app.
- limitations: honest notes (blurry, cropped, can't tell which app this is, etc.).`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = parseLang(body.language);
    const image = parseImage(body.image);
    const question = clampText(body.question, 500);
    const lines: OcrLine[] = Array.isArray(body.lines)
      ? body.lines.slice(0, 120).map((l: OcrLine, i: number) => ({
          id: Number.isFinite(l?.id) ? l.id : i,
          text: redactSensitive(String(l?.text ?? "").slice(0, 300)).text,
          confidence: Number(l?.confidence) || 0,
          bbox: l?.bbox ?? { x0: 0, y0: 0, x1: 0, y1: 0 },
        }))
      : [];
    if (!image && !lines.length) throw new InputError("Please upload a screenshot first.");

    if (!aiConfigured() || !image) {
      return Response.json({ ...demoVision(lines, lang), mode: "demo" } satisfies VisionResult);
    }

    try {
      const ocrList = lines.map((l) => `[${l.id}] ${l.text}`).join("\n");
      const ai = await structuredCall({
        system: SYSTEM,
        schema: VisionSchema,
        image,
        effort: "medium",
        text: `Respond in ${LANGUAGE_NAME[lang]} (keep element "text" exactly as shown on screen).\n${question ? `The user asks: "${question}"\n` : ""}\nOCR lines detected in the browser (id + text) — use these ids for line_id:\n${ocrList || "(none detected)"}`,
      });
      return Response.json({ ...ai, mode: "live" } satisfies VisionResult);
    } catch (error) {
      console.warn("[humraah] Vision AI call failed, falling back to demo engine:", error);
      const notice = error instanceof AiUnavailableError ? error.message : "Live AI limit reached, using built-in safety engine.";
      return Response.json({ ...demoVision(lines, lang), mode: "demo", notice } satisfies VisionResult);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
