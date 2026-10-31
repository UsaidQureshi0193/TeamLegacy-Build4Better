import { createHash } from "node:crypto";
import { geminiConfigured, geminiSpeak } from "@/lib/ai/gemini";
import { AiUnavailableError } from "@/lib/ai/types";
import { InputError, clampText, errorResponse } from "@/lib/safety";

// Small in-memory cache so "Repeat" and "Slower" don't spend the free quota again.
const cache = new Map<string, Buffer>();
const MAX_CACHE = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lang = body.language === "ur" ? "ur" : body.language === "roman" ? "roman" : null;
    const text = clampText(body.text, 1200);
    if (!lang) throw new InputError("Server voice is only used for Urdu and Roman Urdu.");
    if (!text) throw new InputError("Nothing to read aloud.");
    if (!geminiConfigured()) return Response.json({ error: "Urdu voice needs a Gemini key." }, { status: 503 });

    const key = createHash("sha256").update(`${lang}:${text}`).digest("hex");
    let audio = cache.get(key);
    if (!audio) {
      audio = await geminiSpeak(text, lang);
      if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value!);
      cache.set(key, audio);
    }
    return new Response(new Uint8Array(audio), { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=3600" } });
  } catch (error) {
    if (error instanceof AiUnavailableError) return Response.json({ error: error.message }, { status: 503 });
    return errorResponse(error);
  }
}
