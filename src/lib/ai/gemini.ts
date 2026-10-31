import "server-only";
import { ApiError, GoogleGenAI, type Content, type Part } from "@google/genai";
import { z } from "zod";
import { AiUnavailableError, type StructuredCall } from "./types";

// "gemini-flash-latest" always points to Google's current Flash model, which is on the free tier.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

let client: GoogleGenAI | null = null;

export function geminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
}

/** Gemini accepts a JSON Schema subset; drop the "$schema" marker zod adds. */
function toGeminiSchema(schema: z.ZodType): unknown {
  const json = z.toJSONSchema(schema) as Record<string, unknown>;
  delete json.$schema;
  return json;
}

export async function geminiStructuredCall<T extends z.ZodType>(opts: StructuredCall<T>): Promise<z.infer<T>> {
  const contents: Content[] = (opts.history ?? []).map((h) => ({
    role: h.role === "assistant" ? "model" : "user",
    parts: [{ text: h.content }],
  }));
  const parts: Part[] = [];
  if (opts.image) parts.push({ inlineData: { mimeType: opts.image.mediaType, data: opts.image.data } });
  parts.push({ text: opts.text });
  contents.push({ role: "user", parts });

  let raw: string | undefined;
  try {
    const response = await getClient().models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        systemInstruction: opts.system,
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiSchema(opts.schema),
        maxOutputTokens: opts.maxTokens ?? 8192,
        abortSignal: AbortSignal.timeout(60_000),
      },
    });
    raw = response.text;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[humraah] Gemini API error", error.status, error.message);
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw new AiUnavailableError("The Gemini key or model setting is invalid, so HUMRAAH used its built-in safety engine.");
      }
      if (error.status === 429) {
        throw new AiUnavailableError("The free AI limit was reached for now, so HUMRAAH used its built-in safety engine. Try again in a minute.");
      }
      if (error.status === 404) {
        throw new AiUnavailableError("The Gemini model name was not found, so HUMRAAH used its built-in safety engine.");
      }
      throw new AiUnavailableError("The AI service had a problem, so HUMRAAH used its built-in safety engine.");
    }
    console.error("[humraah] Gemini call failed", error);
    throw new AiUnavailableError("The AI service could not be reached, so HUMRAAH used its built-in safety engine.");
  }

  if (!raw) throw new AiUnavailableError("The AI gave an empty answer (it may have been blocked), so HUMRAAH used its built-in safety engine.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new AiUnavailableError("The AI response could not be read, so HUMRAAH used its built-in safety engine.");
  }
  // Validate against the same schema the UI relies on — never trust shape blindly.
  const result = opts.schema.safeParse(parsed);
  if (!result.success) {
    console.error("[humraah] Gemini output failed validation", result.error.issues.slice(0, 3));
    throw new AiUnavailableError("The AI response was incomplete, so HUMRAAH used its built-in safety engine.");
  }
  return result.data as z.infer<T>;
}
