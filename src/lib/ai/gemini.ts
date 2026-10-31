import "server-only";
import { ApiError, GoogleGenAI, type Content, type Part } from "@google/genai";
import { z } from "zod";
import { AiUnavailableError, type StructuredCall } from "./types";

// Free-tier models tried in order. Each model has its own separate quota and rate limit.
// If one model is busy, slow, or reaches its daily quota (429), HUMRAAH automatically
// cascades to the next candidate model so it never drops to demo mode unnecessarily.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.8-flash",
].filter(Boolean) as string[];

const PER_MODEL_TIMEOUT_MS = 20_000;

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

/** Overloaded (500/503), retired (404), quota limit (429), timed out or dropped connection — try next model. */
function isBusy(e: unknown): boolean {
  if (e instanceof ApiError) {
    return e.status === 503 || e.status === 500 || e.status === 404 || e.status === 429;
  }
  return e instanceof Error && (e.name === "AbortError" || e.name === "TimeoutError" || /fetch failed|quota|rate limit|busy/i.test(e.message));
}

/** Try candidate models in order so busy or quota-exhausted models don't fail the user request. */
async function withBusyRetry<R>(run: (model: string) => Promise<R>): Promise<R> {
  const models = Array.from(new Set(CANDIDATE_MODELS));
  let last: unknown;
  for (const model of models) {
    try {
      return await run(model);
    } catch (error) {
      if (!isBusy(error)) throw error;
      console.warn(`[humraah] Model ${model} busy or quota reached (${error instanceof ApiError ? error.status : "timeout"}), trying fallback model...`);
      last = error;
    }
  }
  throw last;
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

  const request = (model: string) =>
    getClient().models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: opts.system,
        responseMimeType: "application/json",
        responseJsonSchema: toGeminiSchema(opts.schema),
        maxOutputTokens: opts.maxTokens ?? 8192,
        abortSignal: AbortSignal.timeout(PER_MODEL_TIMEOUT_MS),
      },
    });

  let raw: string | undefined;
  try {
    raw = (await withBusyRetry(request)).text;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error("[humraah] Gemini API error", error.status, error.message);
      if (isBusy(error)) {
        throw new AiUnavailableError("The AI engine is busy right now, so HUMRAAH used its built-in safety engine. Please try again in a minute.");
      }
      if (error.status === 400 || error.status === 401 || error.status === 403) {
        throw new AiUnavailableError("The AI engine configuration is invalid, so HUMRAAH used its built-in safety engine.");
      }
      if (error.status === 429) {
        throw new AiUnavailableError("The AI engine limit was reached for now, so HUMRAAH used its built-in safety engine. Try again in a minute.");
      }
      if (error.status === 404) {
        throw new AiUnavailableError("The AI engine model was not found, so HUMRAAH used its built-in safety engine.");
      }
      throw new AiUnavailableError("The AI service had a problem, so HUMRAAH used its built-in safety engine.");
    }
    console.error("[humraah] AI call failed", error);
    if (isBusy(error)) {
      throw new AiUnavailableError("The AI engine is busy right now, so HUMRAAH used its built-in safety engine. Please try again in a minute.");
    }
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

// ── Text-to-speech (Urdu / Roman Urdu voice) ─────────────
// Browsers rarely ship an Urdu voice, so Urdu and Roman Urdu are spoken by Gemini TTS.
const TTS_MODELS = [
  process.env.GEMINI_TTS_MODEL || "gemini-3.8-flash-lite-tts",
  "gemini-3.8-flash-tts",
  "gemini-3.1-flash-tts-preview",
];
const TTS_TIMEOUT_MS = 12_000;

/** Wraps raw 16-bit mono PCM in a WAV header so browsers can play it. */
function pcmToWav(pcm: Buffer, sampleRate: number): Buffer {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export async function geminiSpeak(text: string): Promise<Buffer> {
  const clean = text.trim();
  if (!clean) throw new AiUnavailableError("No text provided for speech.");

  let last: unknown;
  for (const model of TTS_MODELS) {
    try {
      const response = await getClient().models.generateContent({
        model,
        contents: [{ role: "user", parts: [{ text: clean }] }],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } },
          abortSignal: AbortSignal.timeout(TTS_TIMEOUT_MS),
        },
      });
      const audio = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
      if (!audio?.data) throw new AiUnavailableError("No audio returned.");
      const bytes = Buffer.from(audio.data, "base64");
      if (/wav/i.test(audio.mimeType ?? "")) return bytes;
      const rate = Number(/rate=(\d+)/.exec(audio.mimeType ?? "")?.[1]) || 24000;
      return pcmToWav(bytes, rate);
    } catch (error) {
      console.warn("[humraah] Gemini TTS failed on", model, error instanceof Error ? error.message.slice(0, 120) : error);
      last = error;
    }
  }
  throw last instanceof AiUnavailableError ? last : new AiUnavailableError("Voice is not available right now.");
}
