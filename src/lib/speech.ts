"use client";

// HUMRAAH Voice — browser Speech APIs with honest capability detection.
// Text input always remains available as a fallback.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePrefs } from "./prefs";
import type { Lang } from "./types";

const RECOGNITION_LANG: Record<Lang, string> = { en: "en-US", roman: "ur-PK", ur: "ur-PK" };
const VOICE_LANGS: Record<Lang, string[]> = { en: ["en-US", "en-GB", "en-IN", "en"], roman: ["en-IN", "en-PK", "en-GB", "en"], ur: ["ur-PK", "ur-IN", "ur"] };

/* eslint-disable @typescript-eslint/no-explicit-any */
function getRecognitionCtor(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

const noop = () => () => {};
export function useSpeechSupport() {
  const stt = useSyncExternalStore(noop, () => Boolean(getRecognitionCtor()), () => false);
  const tts = useSyncExternalStore(noop, () => typeof window !== "undefined" && "speechSynthesis" in window, () => false);
  return { stt, tts };
}

export type MicState = "idle" | "listening" | "processing" | "error";

export function useSpeechRecognition(onFinal: (text: string) => void) {
  const { prefs } = usePrefs();
  const [state, setState] = useState<MicState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const finalRef = useRef(onFinal);
  useEffect(() => {
    finalRef.current = onFinal;
  }, [onFinal]);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Voice input isn't supported in this browser. Please type instead — try Chrome or Edge for voice.");
      setState("error");
      return;
    }
    window.speechSynthesis?.cancel();
    const rec = new Ctor();
    rec.lang = RECOGNITION_LANG[prefs.lang];
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onstart = () => {
      setError(null);
      setInterim("");
      setState("listening");
    };
    rec.onresult = (e: any) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else live += r[0].transcript;
      }
      setInterim(finalText + live);
    };
    rec.onerror = (e: any) => {
      const map: Record<string, string> = {
        "not-allowed": "Microphone permission was blocked. Allow the microphone in your browser's address bar, or type instead.",
        "service-not-allowed": "Microphone permission was blocked. Allow the microphone in your browser's address bar, or type instead.",
        "no-speech": "I didn't hear anything. Tap the microphone and speak clearly, or type instead.",
        "audio-capture": "No microphone was found. Please type instead.",
        network: "Voice recognition needs an internet connection. Please type instead.",
        "language-not-supported": "This browser can't recognise speech in the selected language. Try English or type instead.",
      };
      if (e.error !== "aborted") {
        setError(map[e.error] ?? "Voice input stopped unexpectedly. Please try again or type.");
        setState("error");
      }
    };
    rec.onend = () => {
      recRef.current = null;
      const text = finalText.trim();
      if (text) {
        setState("processing");
        finalRef.current(text);
        setState("idle");
      } else {
        setState((s) => (s === "error" ? s : "idle"));
      }
    };
    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setError("Couldn't start the microphone. Please try again.");
      setState("error");
    }
  }, [prefs.lang]);

  useEffect(() => () => recRef.current?.abort(), []);
  return { state, interim, error, start, stop, clearError: () => { setError(null); setState("idle"); } };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  for (const code of VOICE_LANGS[lang]) {
    const v = voices.find((x) => x.lang.toLowerCase() === code.toLowerCase()) ?? voices.find((x) => x.lang.toLowerCase().startsWith(code.toLowerCase()));
    if (v) return v;
  }
  return null;
}

/** Strip emoji / bullets / markdown so speech sounds natural. */
function speakable(text: string) {
  return text.replace(/[*_#>•`]/g, " ").replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/\s+/g, " ").trim();
}

// ── Server voice (Gemini TTS) for Urdu and Roman Urdu ──
// Shared across every component so starting one voice always stops the previous one.
let currentAudio: HTMLAudioElement | null = null;
let currentFetch: AbortController | null = null;
const audioUrls = new Map<string, string>();
let serverVoice: Promise<boolean> | null = null;

function hasServerVoice(): Promise<boolean> {
  serverVoice ??= fetch("/api/status")
    .then((r) => r.json())
    .then((s) => Boolean(s.urduVoice))
    .catch(() => false);
  return serverVoice;
}

function stopEverything() {
  if (typeof window === "undefined") return;
  window.speechSynthesis?.cancel();
  currentAudio?.pause();
  currentAudio = null;
  currentFetch?.abort();
  currentFetch = null;
}

async function serverAudioUrl(text: string, lang: "roman" | "ur"): Promise<string | null> {
  const key = `${lang}:${text}`;
  const cached = audioUrls.get(key);
  if (cached) return cached;
  currentFetch = new AbortController();
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language: lang }),
    signal: currentFetch.signal,
  });
  if (!res.ok) return null;
  const url = URL.createObjectURL(await res.blob());
  audioUrls.set(key, url);
  return url;
}

export function useSpeaker() {
  const { prefs } = usePrefs();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [lastText, setLastText] = useState<{ id: string; text: string } | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    return () => stopEverything();
  }, []);

  /** Browser voice. Returns false when no suitable voice exists (common for Urdu). */
  const speakWithBrowser = useCallback(
    (text: string, id: string, rate: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
      const voice = pickVoice(prefs.lang);
      if (!voice && prefs.lang === "ur") return false;
      const u = new SpeechSynthesisUtterance(text);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = "en-US";
      }
      u.rate = rate;
      u.onstart = () => setSpeakingId(id);
      u.onend = () => setSpeakingId((s) => (s === id ? null : s));
      u.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(u);
      return true;
    },
    [prefs.lang],
  );

  const speak = useCallback(
    (raw: string, id = "default", rateMultiplier = 1) => {
      const text = speakable(raw);
      if (!text || typeof window === "undefined") return false;
      stopEverything();
      setVoiceError(null);
      setLastText({ id, text: raw });
      const rate = Math.max(0.5, Math.min(1.4, prefs.voiceRate * rateMultiplier));
      const lang = prefs.lang;

      if (lang === "en") return speakWithBrowser(text, id, rate);

      // Urdu / Roman Urdu: natural Pakistani voice from the server, browser voice as fallback.
      setSpeakingId(id);
      (async () => {
        try {
          if (await hasServerVoice()) {
            const url = await serverAudioUrl(text, lang);
            if (url) {
              const audio = new Audio(url);
              audio.playbackRate = rate;
              audio.onended = () => setSpeakingId((s) => (s === id ? null : s));
              audio.onerror = () => setSpeakingId(null);
              currentAudio = audio;
              await audio.play();
              return;
            }
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
        if (!speakWithBrowser(text, id, rate)) {
          setSpeakingId(null);
          setVoiceError(
            lang === "ur"
              ? "اس براؤزر میں اردو آواز موجود نہیں۔ اردو آواز کے لیے Gemini key لگائیں یا Microsoft Edge استعمال کریں۔"
              : "Is waqt awaz dastyab nahi. Thori dair baad koshish karein.",
          );
        }
      })();
      return true;
    },
    [prefs.lang, prefs.voiceRate, speakWithBrowser],
  );

  const stop = useCallback(() => {
    stopEverything();
    setSpeakingId(null);
  }, []);

  const repeat = useCallback((slow = false) => {
    if (lastText) speak(lastText.text, lastText.id, slow ? 0.7 : 1);
  }, [lastText, speak]);

  return { speak, stop, repeat, speakingId, speaking: speakingId !== null, voiceError };
}
