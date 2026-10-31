import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { AiUnavailableError, type StructuredCall } from "./types";

export const CLAUDE_MODEL = process.env.HUMRAAH_MODEL || "claude-opus-5-5";

let client: Anthropic | null = null;

export function claudeConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ timeout: 60_000, maxRetries: 1 });
  return client;
}

export async function claudeStructuredCall<T extends z.ZodType>(opts: StructuredCall<T>): Promise<z.infer<T>> {
  const content: Anthropic.Beta.BetaContentBlockParam[] = [];
  if (opts.image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: opts.image.mediaType, data: opts.image.data },
    });
  }
  content.push({ type: "text", text: opts.text });

  try {
    const response = await getClient().beta.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      output_config: { effort: opts.effort ?? "low", format: betaZodOutputFormat(opts.schema) },
      messages: [...(opts.history ?? []), { role: "user", content }],
    });

    if (response.stop_reason === "refusal") {
      throw new AiUnavailableError("The AI model declined this request.");
    }
    if (!response.parsed_output) {
      throw new AiUnavailableError("The AI response could not be read.");
    }
    return response.parsed_output as z.infer<T>;
  } catch (error) {
    if (error instanceof AiUnavailableError) throw error;
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiUnavailableError("The AI key is invalid, so HUMRAAH used its built-in safety engine.");
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiUnavailableError("The AI service is busy right now, so HUMRAAH used its built-in safety engine.");
    }
    if (error instanceof Anthropic.APIError) {
      console.error("[humraah] Claude API error", error.status, error.message);
      throw new AiUnavailableError("The AI service had a problem, so HUMRAAH used its built-in safety engine.");
    }
    console.error("[humraah] AI call failed", error);
    throw new AiUnavailableError("The AI service could not be reached, so HUMRAAH used its built-in safety engine.");
  }
}
