import "server-only";
import type { z } from "zod";
import { CLAUDE_MODEL, claudeConfigured, claudeStructuredCall } from "./claude";
import { GEMINI_MODEL, geminiConfigured, geminiStructuredCall } from "./gemini";
import type { StructuredCall } from "./types";

export { AiUnavailableError } from "./types";

type Provider = "claude" | "gemini" | null;

/** Claude is used when its key is set; otherwise Gemini; otherwise the built-in rule engine (Demo Mode). */
function activeProvider(): Provider {
  if (claudeConfigured()) return "claude";
  if (geminiConfigured()) return "gemini";
  return null;
}

/** Live AI is enabled only when a key is configured on the server. Keys never reach the browser. */
export function aiConfigured(): boolean {
  return activeProvider() !== null;
}

export function activeInfo(): { provider: string; model: string } | null {
  const p = activeProvider();
  if (p === "claude") return { provider: "Anthropic Claude", model: CLAUDE_MODEL };
  if (p === "gemini") return { provider: "Google Gemini", model: GEMINI_MODEL };
  return null;
}

/**
 * One structured AI call. Returns schema-validated data or throws
 * AiUnavailableError so the route can fall back to the rule engine honestly.
 */
export function structuredCall<T extends z.ZodType>(opts: StructuredCall<T>): Promise<z.infer<T>> {
  return activeProvider() === "gemini" ? geminiStructuredCall(opts) : claudeStructuredCall(opts);
}

/** Common persona and hard rules shared by every prompt (blueprint §9 "System behaviour rules"). */
export const CORE_RULES = `You are HUMRAAH ("companion"), a patient, warm digital guide for elderly people, first-time smartphone users and anyone who finds technology confusing — mainly in Pakistan.

Hard rules:
- Never ask for, repeat back, or store passwords, PINs, OTPs, full card numbers, CNIC numbers or banking credentials. If the user offers them, tell them kindly not to share them with anyone, including you.
- Never claim you performed an action (paid, sent, blocked, reported, contacted a bank). You only explain, guide, check and teach. The user stays in control.
- Never say a message, link, sender, QR code or person is verified or "confirmed" scam/safe. Talk about "warning signs" and "no warning signs found", and say what you cannot know.
- Never invent buttons, screens, app behaviour, phone numbers or official policies. If unsure, say so and point to the official app/website or the number printed on the user's card or bill.
- Use short sentences, everyday words, one idea at a time. Explain any technical word with a familiar example.
- Be respectful and encouraging, never condescending. Mistakes are normal.`;
