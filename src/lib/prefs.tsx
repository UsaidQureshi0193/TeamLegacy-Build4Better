"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import type { Lang } from "./types";

export interface Prefs {
  theme: "light" | "dark";
  lang: Lang;
  elder: boolean;
  reduceMotion: boolean;
  voiceRate: number;
  autoSpeak: boolean;
  name: string;
  onboarded: boolean;
}

const KEY = "humraah.prefs.v1";
const DEFAULTS: Prefs = {
  theme: "dark",
  lang: "en",
  elder: false,
  reduceMotion: false,
  voiceRate: 0.95,
  autoSpeak: false,
  name: "",
  onboarded: false,
};

let current: Prefs = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load(): Prefs {
  if (loaded) return current;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) current = { ...DEFAULTS, ...JSON.parse(raw) };
    else current = { ...DEFAULTS, theme: matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark" };
  } catch {
    current = DEFAULTS;
  }
  return current;
}

function save(next: Prefs) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — preferences still apply for this session */
  }
  listeners.forEach((l) => l());
}

export function applyToDocument(p: Prefs) {
  const el = document.documentElement;
  el.classList.toggle("dark", p.theme === "dark");
  el.classList.toggle("elder", p.elder);
  el.classList.toggle("reduce-motion", p.reduceMotion);
  el.lang = p.lang === "ur" ? "ur" : "en";
  el.dir = p.lang === "ur" ? "rtl" : "ltr";
}

/** Inline script run before paint so the saved theme never flashes. */
export const THEME_BOOT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${KEY}")||"null");var d=document.documentElement;var dark=p?p.theme==="dark":!matchMedia("(prefers-color-scheme: light)").matches;d.classList.toggle("dark",dark);if(p&&p.elder)d.classList.add("elder");if(p&&p.reduceMotion)d.classList.add("reduce-motion");if(p&&p.lang==="ur"){d.lang="ur";d.dir="rtl";}}catch(e){document.documentElement.classList.add("dark");}})();`;

interface Ctx {
  prefs: Prefs;
  ready: boolean;
  update: (patch: Partial<Prefs>) => void;
  toggleTheme: () => void;
}

const PrefsContext = createContext<Ctx | null>(null);

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const prefs = useSyncExternalStore(subscribe, load, () => DEFAULTS);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);

  useEffect(() => {
    if (ready) applyToDocument(prefs);
  }, [prefs, ready]);

  const update = useCallback((patch: Partial<Prefs>) => save({ ...load(), ...patch }), []);
  const toggleTheme = useCallback(() => save({ ...load(), theme: load().theme === "dark" ? "light" : "dark" }), []);

  const value = useMemo(() => ({ prefs, ready, update, toggleTheme }), [prefs, ready, update, toggleTheme]);
  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
