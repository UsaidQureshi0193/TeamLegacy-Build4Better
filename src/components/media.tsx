"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Mic, MicOff, ShieldCheck, Sparkles, Square } from "lucide-react";
import { ACCEPTED_IMAGES, prepareImage } from "@/lib/client";
import { useSpeechRecognition, useSpeechSupport } from "@/lib/speech";
import { Button, cn } from "./ui";

/** Drag/drop, click or paste an image. Calls onImage with a validated, downsized data URL. */
export function ImageDrop({
  onImage,
  onSample,
  sampleLabel = "Try a fictional sample",
  label = "Upload a screenshot",
  hint = "PNG, JPG or WEBP · up to 15 MB · you can also paste (Ctrl+V)",
  privacyNote = "Hide CNIC, card and account numbers before uploading. Images are not stored.",
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
          "group relative flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed text-center transition-all",
          compact ? "px-4 py-6" : "px-6 py-10",
          drag ? "border-primary bg-primary-soft" : "border-line-strong bg-surface-2/60 hover:border-primary/60",
        )}
      >
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-transform group-hover:scale-105">
          <ImagePlus className="size-7" aria-hidden />
        </div>
        <p className="font-display text-base font-bold">{label}</p>
        <p className="mt-1 text-xs text-subtle">{hint}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button size="md" icon={ImagePlus} onClick={() => inputRef.current?.click()}>
            Choose image
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

  const gradient = tone === "amber" ? "from-amber to-[#ffd98a]" : "from-teal to-emerald";
  return (
    <div className={cn("flex h-12 items-center justify-center gap-[3px]", className)} aria-hidden>
      {levels.map((l, i) => (
        <span
          key={i}
          className={cn("w-[4px] origin-center rounded-full bg-gradient-to-t transition-[height] duration-75", gradient, active && levels.every((x) => x <= 0.2) && "animate-wave")}
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
  const L = labels ?? { idle: "Tap and speak", listening: "Listening… tap to stop", unsupported: "Voice not supported here — please type" };
  const dim = size === "lg" ? "size-20" : "size-14";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {listening && <span className={cn("absolute inset-0 rounded-full bg-primary/40 animate-pulse-ring", dim)} aria-hidden />}
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
              ? "bg-[linear-gradient(135deg,#ff6b75,#f4b544)] shadow-[0_0_40px_-6px_rgb(255_107_117/0.8)]"
              : "bg-[linear-gradient(135deg,var(--brand-teal),var(--brand-emerald))] shadow-[0_12px_40px_-10px_rgb(24_185_168/0.9)] hover:scale-105",
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
