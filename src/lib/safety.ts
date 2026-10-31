// Safety layer shared by every route (blueprint §8 step 5 and §16).
// 1. Mask sensitive identifiers before any text reaches an AI model.
// 2. Enforce honest-uncertainty wording on outputs.
// 3. Validate inputs (size / type).

import type { Lang } from "./types";

export const MAX_TEXT = 6000;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}

/**
 * Masks card numbers (Luhn-valid 13–19 digits), Pakistani CNIC numbers and
 * bare IBANs. OTP-looking codes in scam messages are kept, because they are
 * evidence of the scam pattern and not the user's own secret.
 */
export function redactSensitive(text: string): { text: string; count: number } {
  let count = 0;
  let out = text.replace(/\b(?:\d[ -]?){13,19}\b/g, (m) => {
    const digits = m.replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && luhnValid(digits)) {
      count++;
      return `[card number hidden •••• ${digits.slice(-4)}]`;
    }
    return m;
  });
  out = out.replace(/\b\d{5}-\d{7}-\d\b/g, () => {
    count++;
    return "[CNIC hidden]";
  });
  out = out.replace(/\bPK\d{2}[A-Z]{4}\d{16}\b/gi, () => {
    count++;
    return "[IBAN hidden]";
  });
  return { text: out, count };
}

/** Never let the system say a message is definitively a scam — blueprint §16 fraud rules. */
export function softenVerdicts(text: string): string {
  return text
    .replace(/\bconfirmed (scam|fraud)\b/gi, "high-risk signs of a $1")
    .replace(/\bthis is (definitely|certainly|100%) (a )?(scam|fraud)\b/gi, "this shows strong warning signs of a $3")
    .replace(/\bthis is (definitely|certainly|100%) (safe|genuine|legit(imate)?)\b/gi, "no warning signs were found, but this is not a guarantee it is $2");
}

export function clampText(value: unknown, max = MAX_TEXT): string {
  if (typeof value !== "string") return "";
  return value.slice(0, max).trim();
}

export function parseLang(value: unknown): Lang {
  return value === "ur" || value === "roman" ? value : "en";
}

export interface ImageInput {
  data: string;
  mediaType: AllowedImageType;
}

/** Validates a data-URL image from the browser. Returns null when absent; throws a user-safe message when invalid. */
export function parseImage(value: unknown): ImageInput | null {
  if (typeof value !== "string" || !value) return null;
  const match = /^data:(image\/[a-z+]+);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) throw new InputError("The image could not be read. Please upload a PNG, JPG or WEBP file.");
  const mediaType = match[1] as AllowedImageType;
  if (!ALLOWED_IMAGE_TYPES.includes(mediaType)) {
    throw new InputError("Only PNG, JPG, WEBP or GIF images are supported.");
  }
  const bytes = Math.floor((match[2].length * 3) / 4);
  if (bytes > MAX_IMAGE_BYTES) throw new InputError("This image is larger than 5 MB. Please upload a smaller screenshot.");
  return { data: match[2], mediaType };
}

export class InputError extends Error {}

export function errorResponse(error: unknown) {
  if (error instanceof InputError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  console.error("[humraah] request failed", error);
  return Response.json(
    { error: "Something went wrong on our side. Please try again in a moment." },
    { status: 500 },
  );
}

export const LANGUAGE_NAME: Record<Lang, string> = {
  en: "simple English",
  roman: "Roman Urdu (Urdu written in English letters, e.g. 'Aap ka account mehfooz hai')",
  ur: "Urdu in Urdu script (اردو), simple everyday words",
};
