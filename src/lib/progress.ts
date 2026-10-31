"use client";

// Learning-progress store (HUMRAAH Progress). Stored on this device only — privacy
// by design (blueprint §16). Every number on the Progress page is derived from these
// recorded events with the transparent formula in computeScore().

import { useSyncExternalStore } from "react";

export type SkillId = "scam-detection" | "safe-browsing" | "privacy" | "bill-payment" | "digital-tasks" | "screen-reading";

export const SKILLS: Record<SkillId, { en: string; roman: string; ur: string }> = {
  "scam-detection": { en: "Spotting scams", roman: "Dhoka pehchanna", ur: "دھوکہ پہچاننا" },
  "safe-browsing": { en: "Safe links & websites", roman: "Mehfooz links aur websites", ur: "محفوظ لنکس" },
  privacy: { en: "Privacy & permissions", roman: "Privacy aur ijazatein", ur: "پرائیویسی" },
  "bill-payment": { en: "Bills & payments", roman: "Bills aur payments", ur: "بل اور ادائیگیاں" },
  "digital-tasks": { en: "Everyday digital tasks", roman: "Rozmarra digital kaam", ur: "روزمرہ ڈیجیٹل کام" },
  "screen-reading": { en: "Understanding screens & documents", roman: "Screens aur documents samajhna", ur: "اسکرین اور دستاویزات سمجھنا" },
};

export type EventKind = "escape-room" | "mission" | "guide-task" | "scam-check" | "vision" | "document" | "privacy-checkup";

export interface ActivityEvent {
  id: string;
  kind: EventKind;
  skill: SkillId;
  title: string;
  ts: number;
  /** Decisions made in practice; `correct` counts first-try correct decisions. */
  decisions?: number;
  correct?: number;
  hints: number;
  attempt: number;
  completed: boolean;
  /** Completed with zero hints and no "I'm stuck" requests. */
  independent: boolean;
  score?: number;
  maxScore?: number;
  confidence?: number;
  meta?: Record<string, string | number | boolean>;
}

export interface Notice {
  id: string;
  ts: number;
  title: string;
  body: string;
  href?: string;
  read: boolean;
}

interface State {
  events: ActivityEvent[];
  notices: Notice[];
}

const KEY = "humraah.progress.v1";
const EMPTY: State = { events: [], notices: [] };
let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load(): State {
  if (loaded) return state;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    state = EMPTY;
  }
  if (!state.notices.length) {
    state = {
      ...state,
      notices: [
        { id: "welcome", ts: Date.now(), read: false, title: "Welcome to HUMRAAH", body: "Try the Scam Escape Room — a safe place to practise spotting tricks.", href: "/academy" },
        { id: "privacy", ts: Date.now() - 1000, read: false, title: "2-minute Privacy Checkup", body: "See how protected your phone and accounts are.", href: "/guardian" },
      ],
    };
  }
  return state;
}

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — keep in memory */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export function useProgress(): State {
  return useSyncExternalStore(subscribe, load, () => EMPTY);
}

/** How many times this activity was attempted before (used for "teach, then fade support"). */
export function priorAttempts(kind: EventKind, title: string): number {
  return load().events.filter((e) => e.kind === kind && e.title === title).length;
}

export function recordEvent(e: Omit<ActivityEvent, "id" | "ts" | "attempt"> & { attempt?: number }) {
  const s = load();
  const attempt = e.attempt ?? priorAttempts(e.kind, e.title) + 1;
  const event: ActivityEvent = { ...e, attempt, id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: Date.now() };
  const notices = [...s.notices];
  const firstForSkill = !s.events.some((x) => x.skill === e.skill && x.completed);
  if (e.completed && firstForSkill) {
    notices.unshift({
      id: `skill-${e.skill}-${event.ts}`,
      ts: event.ts,
      read: false,
      title: `New skill started: ${SKILLS[e.skill].en}`,
      body: "Your Digital Independence Score was updated.",
      href: "/progress",
    });
  }
  commit({ events: [...s.events, event].slice(-500), notices: notices.slice(0, 30) });
  return event;
}

export function addNotice(n: Omit<Notice, "id" | "ts" | "read">) {
  const s = load();
  commit({ ...s, notices: [{ ...n, id: `n-${Date.now()}`, ts: Date.now(), read: false }, ...s.notices].slice(0, 30) });
}

export function markNoticesRead() {
  const s = load();
  commit({ ...s, notices: s.notices.map((n) => ({ ...n, read: true })) });
}

export function resetProgress() {
  commit({ events: [], notices: [] });
}

export function exportProgress(): string {
  return JSON.stringify(load(), null, 2);
}

// ── Digital Independence Score ───────────────────────────
export interface ScoreBreakdown {
  score: number | null;
  parts: { id: string; label: string; weight: number; value: number | null; detail: string }[];
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

export function computeScore(events: ActivityEvent[]): ScoreBreakdown {
  const practice = events.filter((e) => (e.kind === "escape-room" || e.kind === "mission") && (e.decisions ?? 0) > 0);
  const decisions = practice.reduce((s, e) => s + (e.decisions ?? 0), 0);
  const correct = practice.reduce((s, e) => s + (e.correct ?? 0), 0);

  const doable = events.filter((e) => (e.kind === "escape-room" || e.kind === "mission" || e.kind === "guide-task") && e.completed);
  const independent = doable.filter((e) => e.independent).length;

  const skills = new Set(events.filter((e) => e.completed).map((e) => e.skill));
  const checkups = events.filter((e) => e.kind === "privacy-checkup" && e.maxScore);
  const lastCheckup = checkups[checkups.length - 1];

  const parts: ScoreBreakdown["parts"] = [
    { id: "accuracy", label: "Safe decisions in practice", weight: 40, value: pct(correct, decisions), detail: `${correct} of ${decisions} decisions right on the first try` },
    { id: "independence", label: "Independent completions", weight: 30, value: pct(independent, doable.length), detail: `${independent} of ${doable.length} completed without hints` },
    { id: "breadth", label: "Skills practised", weight: 20, value: events.length ? pct(skills.size, Object.keys(SKILLS).length) : null, detail: `${skills.size} of ${Object.keys(SKILLS).length} skill areas` },
    { id: "habits", label: "Safety habits (Privacy Checkup)", weight: 10, value: lastCheckup ? pct(lastCheckup.score ?? 0, lastCheckup.maxScore ?? 1) : null, detail: lastCheckup ? `Latest checkup: ${lastCheckup.score}/${lastCheckup.maxScore}` : "Not taken yet" },
  ];
  const measured = parts.filter((p) => p.value !== null);
  if (!measured.length) return { score: null, parts };
  // Unmeasured parts count as 0 so the score only grows from real activity.
  const score = Math.round(parts.reduce((s, p) => s + ((p.value ?? 0) * p.weight) / 100, 0));
  return { score, parts };
}
