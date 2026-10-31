import { z } from "zod";
import { AiUnavailableError, CORE_RULES, aiConfigured, structuredCall } from "@/lib/ai/provider";
import type { HistoryTurn } from "@/lib/ai/types";
import { demoChat } from "@/lib/engine/assistant";
import { InputError, LANGUAGE_NAME, clampText, errorResponse, parseLang, redactSensitive, softenVerdicts } from "@/lib/safety";
import type { ChatReply, ChatTurn } from "@/lib/types";

const MODULES = ["assistant", "shield", "vision", "guide", "academy", "guardian", "document", "emergency", "progress", "settings"] as const;

const ReplySchema = z.object({
  reply: z.string(),
  module: z.enum([...MODULES, "general"]),
  actions: z.array(z.object({ label: z.string(), module: z.enum(MODULES), payload: z.string().optional() })),
});

const SYSTEM = `${CORE_RULES}

You are the HUMRAAH Assistant — the companion's conversational front door. You understand the user's goal and either answer simply or route them to the right HUMRAAH module.

Modules you can route to (as "actions"; the user taps them, you never open them yourself):
- shield: check a suspicious SMS/WhatsApp/email/call. payload = the message text if the user pasted it.
- vision: explain a screenshot of any screen ("I don't understand this screen").
- guide: step-by-step task guidance. payload = the user's goal in their words (e.g. "pay electricity bill online").
- academy: safe practice — Scam Escape Room and fictional task missions.
- guardian: privacy, app permissions, passwords, two-step verification.
- document: read a bill, challan, notice or form.
- emergency: user shared an OTP/PIN, lost money, account hacked, lost phone, or is being pressured on a call right now. Prioritise this.
- progress: their learning progress.

Reply style:
- 2–5 short sentences, warm and patient. One idea at a time. No markdown headings, no tables.
- If the user pasted a suspicious message, briefly name the top warning signs and offer the shield action with the message as payload.
- If the request is ambiguous, ask ONE clarifying question.
- Offer 1–3 actions only when they genuinely help. Action labels are short verbs in the reply language.
- module = the main module your answer relates to, or "general".`;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = parseLang(body.language);
    const style = body.style === "simpler" ? "simpler" : "normal";
    const history: ChatTurn[] = Array.isArray(body.history) ? body.history.slice(-12) : [];
    const raw = clampText(body.message, 4000);
    if (!raw) throw new InputError("Please type or say something first.");
    const { text, count } = redactSensitive(raw);

    if (!aiConfigured()) {
      return Response.json({ ...demoChat(text, lang, style), mode: "demo", redactions: count } satisfies ChatReply);
    }

    const prior: HistoryTurn[] = history
      .filter((h) => (h.role === "user" || h.role === "assistant") && typeof h.content === "string" && h.content)
      .map((h) => ({ role: h.role, content: redactSensitive(h.content.slice(0, 2000)).text }));
    // The API requires the first turn to be from the user.
    while (prior.length && prior[0].role !== "user") prior.shift();

    try {
      const ai = await structuredCall({
        system: SYSTEM,
        schema: ReplySchema,
        history: prior,
        effort: "low",
        maxTokens: 4000,
        text: `[Reply in ${LANGUAGE_NAME[lang]}.${style === "simpler" ? " The user asked for SIMPLER words: use very short sentences, the simplest everyday words, and at most 3 sentences." : ""}]\n\n${text}`,
      });
      const reply: ChatReply = { ...ai, reply: softenVerdicts(ai.reply), language: lang, mode: "live", redactions: count };
      return Response.json(reply);
    } catch (error) {
      if (!(error instanceof AiUnavailableError)) throw error;
      return Response.json({ ...demoChat(text, lang, style), mode: "demo", notice: error.message, redactions: count } satisfies ChatReply);
    }
  } catch (error) {
    return errorResponse(error);
  }
}
