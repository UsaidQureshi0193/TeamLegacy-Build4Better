import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import { demoDocument } from "@/lib/engine/screen";
import { InputError, LANGUAGE_NAME, clampText, errorResponse, parseImage, parseLang, redactSensitive } from "@/lib/safety";
import type { DocumentResult } from "@/lib/types";

const DocSchema = z.object({
  doc_type: z.string(),
  summary: z.string(),
  fields: z.array(z.object({ label: z.string(), value: z.string(), kind: z.enum(["amount", "date", "reference", "name", "other"]) })),
  terms: z.array(z.object({ term: z.string(), meaning: z.string() })),
  checklist: z.array(z.string()),
  warnings: z.array(z.string()),
  limitations: z.array(z.string()),
});

const SYSTEM = `${CORE_RULES}

Task: you are HUMRAAH Document Reader. Read a bill, fee challan, notice, letter or form and explain it simply.
- fields: only values that are clearly legible (amounts, due dates, reference/consumer/PSID numbers, names of the issuing organisation). Copy values exactly. Never guess digits — if unreadable, leave the field out and add a limitation.
- Never output a full CNIC, card or account number; if one is visible, mention it in warnings and tell the user to avoid sharing images of it.
- summary: 2–3 sentences: what the document is and what the person needs to do.
- terms: explain up to 5 difficult words found on it (e.g. arrears, surcharge, FPA, PSID).
- checklist: short ordered actions the user should take, ending with keeping a receipt. Payment only via official channels.
- warnings: anything unusual (payment to a personal mobile number, mismatched details) or sensitive data visible.`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = parseLang(body.language);
    const image = parseImage(body.image);
    const { text, count } = redactSensitive(clampText(body.text, 8000));
    if (!image && !text) throw new InputError("Please upload a document photo first.");

    if (!aiConfigured() || !image) {
      return Response.json({ ...demoDocument(text, lang), mode: "demo", redactions: count } satisfies DocumentResult);
    }
    try {
      const ai = await structuredCall({
        system: SYSTEM,
        schema: DocSchema,
        image,
        effort: "medium",
        text: `Respond in ${LANGUAGE_NAME[lang]} (copy field values exactly as printed).\nOCR text from the browser, for reference (may contain errors; sensitive numbers already masked):\n${text || "(none)"}`,
      });
      return Response.json({ ...ai, mode: "live", redactions: count } satisfies DocumentResult);
    } catch (error) {
      console.warn("[humraah] Document AI call failed, falling back to demo engine:", error);
      const notice = error instanceof AiUnavailableError ? error.message : "Live AI limit reached, using built-in safety engine.";
      return Response.json({ ...demoDocument(text, lang), mode: "demo", notice, redactions: count } satisfies DocumentResult);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
