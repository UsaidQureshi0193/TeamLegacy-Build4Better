import type { z } from "zod";
import type { ImageInput } from "../safety";

export class AiUnavailableError extends Error {}

export interface HistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface StructuredCall<T extends z.ZodType> {
  system: string;
  schema: T;
  /** Prior conversation, oldest first, starting with a user turn. The final user turn is built from `text` / `image`. */
  history?: HistoryTurn[];
  text: string;
  image?: ImageInput | null;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}
