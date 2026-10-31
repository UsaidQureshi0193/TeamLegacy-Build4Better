"use client";

// Browser helpers: API calls, image preparation, OCR, cross-module handoff.

import type { OcrLine } from "./types";

export async function postJSON<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("You seem to be offline. Please check your internet and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && typeof data.error === "string" && data.error) || "Something went wrong. Please try again.");
  return data as T;
}

export const ACCEPTED_IMAGES = "image/png,image/jpeg,image/webp,image/gif";

/** Validates and downsizes an uploaded image so it stays well under the 5 MB API limit. */
export async function prepareImage(file: File | Blob, maxSide = 1600): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) {
    throw new Error("Please choose a PNG, JPG or WEBP image.");
  }
  if (file.size > 15 * 1024 * 1024) throw new Error("This image is very large. Please choose one under 15 MB.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("This image could not be opened. Try another screenshot."));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Your browser could not process this image.");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.88);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface OcrResult {
  text: string;
  lines: OcrLine[];
  confidence: number;
  width: number;
  height: number;
}

/** Runs Tesseract OCR in the browser (no data leaves the device for this step). */
export async function runOcr(dataUrl: string, onProgress?: (p: number) => void, mode: "document" | "screen" = "document"): Promise<OcrResult> {
  const { createWorker, PSM } = await import("tesseract.js");
  const worker = await createWorker("eng", 1, {
    // First use downloads the reader (~10 MB, then cached): report it as the first 30% of progress.
    logger: (m: { status: string; progress: number }) => {
      if (m.status === "recognizing text") onProgress?.(0.3 + m.progress * 0.7);
      else if (/load|initializ/.test(m.status)) onProgress?.(Math.min(0.3, 0.05 + m.progress * 0.25));
    },
  });
  try {
    // App screens scatter short labels and buttons; sparse-text mode finds text inside boxes that auto mode skips.
    await worker.setParameters({ user_defined_dpi: "300", ...(mode === "screen" ? { tessedit_pageseg_mode: PSM.SPARSE_TEXT } : {}) });
    const { data } = await worker.recognize(dataUrl, {}, { text: true, blocks: true });
    const lines: OcrLine[] = [];
    for (const block of data.blocks ?? []) {
      for (const para of block.paragraphs) {
        for (const line of para.lines) {
          const text = line.text.replace(/\s+/g, " ").trim();
          if (!text) continue;
          lines.push({ id: lines.length, text, confidence: Math.round(line.confidence), bbox: line.bbox });
        }
      }
    }
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      const i = new Image();
      i.onload = () => resolve({ w: i.naturalWidth, h: i.naturalHeight });
      i.onerror = () => resolve({ w: 1, h: 1 });
      i.src = dataUrl;
    });
    return { text: data.text.trim(), lines, confidence: Math.round(data.confidence), width: dims.w, height: dims.h };
  } finally {
    await worker.terminate();
  }
}

// ── Cross-module handoff (e.g. Assistant → Shield with the message prefilled) ──
const HANDOFF = "humraah.handoff";

export function setHandoff(module: string, payload: string) {
  try {
    sessionStorage.setItem(HANDOFF, JSON.stringify({ module, payload, ts: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function takeHandoff(module: string): string | null {
  try {
    const raw = sessionStorage.getItem(HANDOFF);
    if (!raw) return null;
    const h = JSON.parse(raw);
    if (h.module !== module || Date.now() - h.ts > 10 * 60 * 1000) return null;
    sessionStorage.removeItem(HANDOFF);
    return typeof h.payload === "string" ? h.payload : null;
  } catch {
    return null;
  }
}
