import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import { analyzeScamRules, reinforceWithRules } from "@/lib/engine/scam";
import { InputError, LANGUAGE_NAME, clampText, errorResponse, parseImage, parseLang, redactSensitive, softenVerdicts } from "@/lib/safety";
import type { ScamAnalysis } from "@/lib/types";

const ScamSchema = z.object({
  risk_level: z.enum(["high", "medium", "low", "uncertain"]),
  summary: z.string(),
  indicators: z.array(
    z.object({
      type: z.enum([
        "otp_request", "credential_request", "urgency", "threat", "impersonation", "suspicious_link",
        "payment_request", "prize_offer", "secrecy", "unusual_contact", "other",
      ]),
      indicator: z.string(),
      evidence: z.string(),
      explanation: z.string(),
      severity: z.enum(["high", "medium", "low"]),
    }),
  ),
  unknowns: z.array(z.string()),
  safe_actions: z.array(z.string()),
  confidence_note: z.string(),
  links: z.array(z.object({ url: z.string(), domain: z.string(), note: z.string() })),
  practice_scenario: z.enum(["bank-otp", "relative-emergency", "prize-lottery", "courier-link"]),
});

const SYSTEM = `${CORE_RULES}

Task: you are HUMRAAH Shield. Analyse a message the user received (SMS, WhatsApp, email, call transcript) for scam warning signs — the "Scam DNA".
- Each indicator's "evidence" MUST be an exact, short substring copied character-for-character from the message (it is highlighted in the UI). Never paraphrase evidence.
- Only report indicators actually present. Do not treat spelling mistakes or unfamiliar branding alone as proof.
- Genuine notifications exist: a plain transaction alert that tells the user to call the number on their card and asks for nothing is usually "low".
- Use "uncertain" when the text is too short, garbled or lacks context.
- risk_level "high" when the message requests an OTP/PIN/password/card details or money together with pressure, or a disguised link plus pressure.
- unknowns: what you cannot know (true sender, real link destination, etc.).
- safe_actions: 3–6 short, concrete steps. Always include verifying via the number printed on the card/bill or official website. Never invent phone numbers.
- links: every URL in the message with a short note about its shape. You have NOT opened or verified any link — say so.
- confidence_note: state clearly this is an indicator-based assessment, not a confirmed verdict.
- practice_scenario: the closest Academy practice: bank-otp, relative-emergency, prize-lottery or courier-link.`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = parseLang(body.language);
    const rawText = clampText(body.text);
    const image = parseImage(body.image);
    if (!rawText && !image) throw new InputError("Please paste a message or upload a screenshot first.");

    const { text, count } = redactSensitive(rawText);
    const rules = analyzeScamRules(text, lang);

    if (!aiConfigured()) {
      return Response.json({ ...rules, mode: "demo", redactions: count } satisfies ScamAnalysis);
    }

    try {
      const ai = await structuredCall({
        system: SYSTEM,
        schema: ScamSchema,
        image,
        effort: "medium",
        text: `Respond in ${LANGUAGE_NAME[lang]} for all explanation fields (keep "evidence" as an exact quote in the original language).\n\nMessage to analyse${image ? " (also shown in the screenshot; prefer the typed text when they differ)" : ""}:\n"""\n${text || "(see screenshot)"}\n"""`,
      });
      const merged = reinforceWithRules(ai, rules);
      const result: ScamAnalysis = {
        ...merged,
        summary: softenVerdicts(merged.summary),
        indicators: merged.indicators.map((i) => ({ ...i, explanation: softenVerdicts(i.explanation) })),
        mode: "live",
        redactions: count,
      };
      return Response.json(result);
    } catch (error) {
      if (!(error instanceof AiUnavailableError)) throw error;
      return Response.json({ ...rules, mode: "demo", notice: error.message, redactions: count } satisfies ScamAnalysis);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
