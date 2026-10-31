"use client";

// HUMRAAH Voice — browser Speech APIs with honest capability detection.
// Text input always remains available as a fallback.

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePrefs } from "./prefs";
import type { Lang } from "./types";

const RECOGNITION_LANG: Record<Lang, string> = { en: "en-US", roman: "ur-PK", ur: "ur-PK" };
const VOICE_LANGS: Record<Lang, string[]> = { en: ["en-US", "en-GB", "en-IN", "en"], roman: ["en-IN", "en-PK", "en-GB", "en"], ur: ["ur-PK", "ur", "hi-IN"] };

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

export function useSpeaker() {
  const { prefs } = usePrefs();
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [lastText, setLastText] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.getVoices();
    return () => window.speechSynthesis.cancel();
  }, []);

  const speak = useCallback(
    (text: string, id = "default", rateMultiplier = 1) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(speakable(text));
      const voice = pickVoice(prefs.lang);
      if (voice) {
        u.voice = voice;
        u.lang = voice.lang;
      } else {
        u.lang = prefs.lang === "en" ? "en-US" : "ur-PK";
      }
      u.rate = Math.max(0.5, Math.min(1.4, prefs.voiceRate * rateMultiplier));
      u.onstart = () => setSpeakingId(id);
      u.onend = () => setSpeakingId((s) => (s === id ? null : s));
      u.onerror = () => setSpeakingId(null);
      setLastText({ id, text });
      synth.speak(u);
      return true;
    },
    [prefs.lang, prefs.voiceRate],
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeakingId(null);
  }, []);

  const repeat = useCallback((slow = false) => {
    if (lastText) speak(lastText.text, lastText.id, slow ? 0.7 : 1);
  }, [lastText, speak]);

  return { speak, stop, repeat, speakingId, speaking: speakingId !== null };
}
