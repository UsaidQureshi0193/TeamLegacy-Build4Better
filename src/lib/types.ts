// Shared API contracts between the UI and the /api route handlers.
// Shapes follow the blueprint (Section 9 & 13) so modules stay interchangeable.

export type Lang = "en" | "roman" | "ur";

/** "live" = answered by the configured AI model. "demo" = answered by HUMRAAH's built-in rule engine. */
export type AiMode = "live" | "demo";

export type ModuleId =
  | "assistant"
  | "shield"
  | "vision"
  | "guide"
  | "academy"
  | "guardian"
  | "document"
  | "emergency"
  | "progress"
  | "settings";

export interface Meta {
  mode: AiMode;
  /** Shown to the user when we fell back or hid something (never contains secrets). */
  notice?: string;
  /** Count of sensitive values (card numbers, CNIC, OTP-looking codes) masked before analysis. */
  redactions?: number;
}

// ── Assistant ──────────────────────────────────────────────
export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantAction {
  label: string;
  module: ModuleId;
  /** Optional text to hand to the target module (e.g. a message to analyse, a task goal). */
  payload?: string;
}

export interface ChatReply extends Meta {
  reply: string;
  language: Lang;
  module: ModuleId | "general";
  actions: AssistantAction[];
}

// ── Shield ─────────────────────────────────────────────────
export type RiskLevel = "high" | "medium" | "low" | "uncertain";
export type IndicatorType =
  | "otp_request"
  | "credential_request"
  | "urgency"
  | "threat"
  | "impersonation"
  | "suspicious_link"
  | "payment_request"
  | "prize_offer"
  | "secrecy"
  | "unusual_contact"
  | "other";

export interface ScamIndicator {
  type: IndicatorType;
  indicator: string;
  /** Exact quote copied from the submitted message — used for Scam DNA highlighting. */
  evidence: string;
  explanation: string;
  severity: "high" | "medium" | "low";
}

export interface ScamAnalysis extends Meta {
  risk_level: RiskLevel;
  summary: string;
  indicators: ScamIndicator[];
  unknowns: string[];
  safe_actions: string[];
  confidence_note: string;
  links: { url: string; domain: string; note: string }[];
  /** Which Academy scenario practises this pattern. */
  practice_scenario?: string;
}

// ── Vision ─────────────────────────────────────────────────
export interface OcrBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OcrLine {
  id: number;
  text: string;
  confidence: number;
  bbox: OcrBox;
}

export type ElementKind = "button" | "input" | "label" | "error" | "heading" | "link" | "info" | "warning";

export interface ScreenElement {
  /** OCR line id this element came from (used to draw its highlight). */
  line_id: number | null;
  text: string;
  kind: ElementKind;
  explanation: string;
}

export interface VisionResult extends Meta {
  summary: string;
  screen_type: string;
  next_step: string;
  elements: ScreenElement[];
  limitations: string[];
  sensitive_warning?: string;
}

export interface ExplainResult extends Meta {
  explanation: string;
  safe_to_tap: "yes" | "caution" | "no" | "unknown";
  tip: string;
}

// ── Guide ──────────────────────────────────────────────────
export interface GuideStep {
  id: string;
  instruction: string;
  why: string;
  hint: string;
  simpler: string;
}

export interface GuideTask extends Meta {
  task_id: string;
  title: string;
  category: string;
  language: Lang;
  steps: GuideStep[];
  safety_notes: string[];
  completion_criteria: string;
  source: "library" | "ai" | "rules";
}

export interface RescueResult extends Meta {
  message: string;
  recovery_steps: string[];
}

// ── Document ───────────────────────────────────────────────
export interface DocField {
  label: string;
  value: string;
  kind: "amount" | "date" | "reference" | "name" | "other";
}

export interface DocumentResult extends Meta {
  doc_type: string;
  summary: string;
  fields: DocField[];
  terms: { term: string; meaning: string }[];
  checklist: string[];
  warnings: string[];
  limitations: string[];
}

export interface StatusInfo {
  mode: AiMode;
  model: string | null;
  provider: string | null;
}
