"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Mic, MicOff, ShieldCheck, Sparkles, Square } from "lucide-react";
import { ACCEPTED_IMAGES, prepareImage } from "@/lib/client";
import { useT } from "@/lib/i18n";
import { useSpeechRecognition, useSpeechSupport } from "@/lib/speech";
import { Button, cn } from "./ui";

/** Drag/drop, click or paste an image. Calls onImage with a validated, downsized data URL. */
export function ImageDrop({
  onImage,
  onSample,
  sampleLabel,
  label,
  hint,
  privacyNote,
  compact,
}: {
  onImage: (dataUrl: string) => void;
  onSample?: () => void;
  sampleLabel?: string;
  label?: string;
  hint?: string;
  privacyNote?: string;
  compact?: boolean;
}) {
  const { tx } = useT();
  sampleLabel ??= tx({ en: "Try a fictional sample", roman: "Farzi namoona try karein", ur: "فرضی نمونہ آزمائیں" });
  label ??= tx({ en: "Upload a screenshot", roman: "Screenshot upload karein", ur: "اسکرین شاٹ اپ لوڈ کریں" });
  hint ??= tx({ en: "PNG, JPG or WEBP · or paste with Ctrl+V", roman: "PNG, JPG ya WEBP · ya Ctrl+V se paste", ur: "PNG، JPG یا WEBP · یا Ctrl+V سے پیسٹ کریں" });
  privacyNote ??= tx({ en: "Images are not stored. Hide CNIC and card numbers first.", roman: "Tasveerein save nahi hotin. Pehle CNIC aur card number chhupa dein.", ur: "تصاویر محفوظ نہیں کی جاتیں۔ پہلے شناختی کارڈ اور کارڈ نمبر چھپا دیں۔" });
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = useCallback(
    async (file: File | Blob | null | undefined) => {
      if (!file) return;
      setError(null);
      try {
        onImage(await prepareImage(file));
      } catch (e) {
        setError(e instanceof Error ? e.message : "That image could not be used.");
      }
    },
    [onImage],
  );

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      if (item) handle(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handle]);

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          handle(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed text-center transition-colors",
          compact ? "px-4 py-5" : "px-6 py-8",
          drag ? "border-primary bg-primary-soft" : "border-line-strong hover:border-primary/60",
        )}
      >
        <div className="mb-2.5 flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <ImagePlus className="size-5" aria-hidden />
        </div>
        <p className="font-semibold">{label}</p>
        <p className="mt-1 text-xs text-subtle">{hint}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button size="md" onClick={() => inputRef.current?.click()}>
            {tx({ en: "Choose image", roman: "Tasveer chunein", ur: "تصویر منتخب کریں" })}
          </Button>
          {onSample && (
            <Button size="md" variant="secondary" icon={Sparkles} onClick={onSample}>
              {sampleLabel}
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGES}
          className="sr-only"
          aria-label={label}
          onChange={(e) => {
            handle(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-danger">{error}</p>}
      {privacyNote && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
          <ShieldCheck className="size-3.5 text-success" aria-hidden /> {privacyNote}
        </p>
      )}
    </div>
  );
}

/** Animated audio-wave bars. Uses real mic levels when available, otherwise a gentle animation. */
export function Waveform({ active, bars = 28, className, tone = "teal" }: { active: boolean; bars?: number; className?: string; tone?: "teal" | "amber" }) {
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: bars }, () => 0.2));
  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let cancelled = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const step = Math.floor(data.length / bars) || 1;
          setLevels(Array.from({ length: bars }, (_, i) => Math.max(0.12, data[i * step] / 255)));
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch {
        /* permission or device unavailable — CSS animation fallback below */
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
      ctx?.close();
    };
  }, [active, bars]);

  const gradient = tone === "amber" ? "bg-amber" : "bg-primary";
  return (
    <div className={cn("flex h-10 items-center justify-center gap-[3px]", className)} aria-hidden>
      {levels.map((l, i) => (
        <span
          key={i}
          className={cn("w-[3px] origin-center rounded-full opacity-80 transition-[height] duration-75", gradient, active && levels.every((x) => x <= 0.2) && "animate-wave")}
          style={{ height: `${Math.round((active ? l : 0.18) * 100)}%`, animationDelay: `${(i % 7) * 90}ms` }}
        />
      ))}
    </div>
  );
}

/** Big microphone button with listening state, live transcript and graceful fallback. */
export function VoiceMic({ onTranscript, size = "lg", labels }: { onTranscript: (text: string) => void; size?: "md" | "lg"; labels?: { idle: string; listening: string; unsupported: string } }) {
  const { stt } = useSpeechSupport();
  const { state, interim, error, start, stop } = useSpeechRecognition(onTranscript);
  const listening = state === "listening";
  const { tx } = useT();
  const L = labels ?? {
    idle: tx({ en: "Tap and speak", roman: "Tap kar ke bolein", ur: "ٹیپ کر کے بولیں" }),
    listening: tx({ en: "Listening… tap to stop", roman: "Sun raha hoon… rokne ke liye tap", ur: "سن رہا ہوں… روکنے کے لیے ٹیپ کریں" }),
    unsupported: tx({ en: "Voice not supported here — please type", roman: "Yahan awaz nahi chalti — type karein", ur: "یہاں آواز کام نہیں کرتی — لکھ کر بتائیں" }),
  };
  const dim = size === "lg" ? "size-18" : "size-14";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {listening && <span className={cn("absolute inset-0 rounded-full bg-danger/30 animate-pulse-ring", dim)} aria-hidden />}
        <button
          type="button"
          onClick={() => (listening ? stop() : start())}
          disabled={!stt}
          aria-pressed={listening}
          aria-label={listening ? L.listening : stt ? L.idle : L.unsupported}
          className={cn(
            "relative flex items-center justify-center rounded-full text-white transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
            dim,
            listening
              ? "bg-danger"
              : "bg-primary hover:bg-primary-strong",
          )}
        >
          {!stt ? <MicOff className="size-8" /> : listening ? <Square className="size-7 fill-current" /> : <Mic className={size === "lg" ? "size-9" : "size-6"} />}
        </button>
      </div>
      <Waveform active={listening} bars={size === "lg" ? 32 : 20} className={size === "lg" ? "w-full max-w-64" : "w-full max-w-44"} />
      <p className="min-h-6 max-w-md text-center text-sm font-medium text-muted" aria-live="polite">
        {listening ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-danger animate-pulse" aria-hidden /> {interim || L.listening}
          </span>
        ) : stt ? (
          L.idle
        ) : (
          L.unsupported
        )}
      </p>
      {error && <p role="alert" className="max-w-md text-center text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
