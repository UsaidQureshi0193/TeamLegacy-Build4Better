# HUMRAAH — Your Personal Guide to a Safer Digital Life

> *Samjhay bhi. Sikhaye bhi. Hifazat bhi kare.*

HUMRAAH is an AI-powered, voice-first digital companion for parents, grandparents, first-time smartphone users and anyone who finds technology confusing. It helps people **understand** what they see on a screen, **stay safe** from scams, **learn by doing** in safe simulations, and **become independent**, with progress measured from real activity.

HUMRAAH explains, checks and teaches. It never takes over accounts, never asks for passwords, PINs or OTPs, and never claims to have done something it only explained.

---

## Flagship journey (try this first)

1. **Scam Shield** → *Use fictional sample* (or *Screenshot → Try fictional SMS*) → **Check for scam signs**
2. **Scam DNA** highlights the exact words that are risky (OTP request, threat, deadline, look-alike link), with a reason for each. It also lists what HUMRAAH *can't* know.
3. **What to do now** gives safe next steps. *Already shared a code?* opens **Emergency Help** with the right checklist.
4. **Enter Scam Escape Room** opens a matching fictional scenario. Find the clues yourself, then choose the safe response.
5. **Progress** updates your **Digital Independence Score** with a transparent formula.

## Modules

| Module | What works |
|---|---|
| **Home** | Onboarding (language, Elder Mode, read-aloud), voice hero, quick actions, flagship journey, independence snapshot, daily tip. Elder Mode shows a simplified 4-button home. |
| **AI Assistant + Voice** | Chat by voice or text in English, Roman Urdu or Urdu. Intent routing to modules with one-tap handoff. Patient Voice Mode: read aloud, repeat, slower, simpler words. Waveform and listening state. Text fallback always works. |
| **Scam Shield** | Paste text, upload a screenshot (OCR, editable before analysis), or decode a **QR code** (QR Guard: shows the destination, never opens it). Risk level, Scam DNA highlighting, indicators with evidence, unknowns, safe actions and link-shape inspection. |
| **Vision AI** | Screenshot → OCR → screen summary, safe next step, grouped elements, highlight boxes on the image. **Point & Explain**: tap any box for a focused explanation and a "safe to tap?" rating. **Rescue Mode** for "I'm stuck". |
| **Document Reader** | Bill/challan photo → amounts, due dates, reference numbers, hard terms explained, an action checklist and warnings. Card and CNIC numbers are masked. Hands off to the bill-payment guide. |
| **Digital Guide** | 6 reviewed tasks (electricity bill, WhatsApp video call, email, online forms, government sites, appointments) plus custom goals. One instruction at a time with Previous, Next, Hint, Repeat, *I don't understand* and *I'm stuck*. **Teach-then-fade**: help is reduced on each repeat attempt. The current step survives a reload. |
| **Academy** | **Scam Escape Room** with 5 rooms, including a *genuine* alert so learners don't treat everything as a scam. Plus 3 task missions with fictional visuals. Clues, hints, retries, scoring and feedback. All data is fictional and labelled. |
| **Guardian Mode** | Privacy Checkup with a score, app-permission explainer and a "Should I allow?" checker, an on-device passphrase generator, and two-step verification how-tos. |
| **Emergency Help** | 5 playbooks (shared OTP, unknown transaction, hacked account, lost phone, scam call in progress) with prioritised checklists, plus official channels: your bank's number on your card, NCCIA **1799**, Police **15**, SBP **Sunwai**. |
| **Progress** | Digital Independence Score with its formula shown, stat tiles, accuracy and hints-per-completion charts, skill bars, activity timeline, export and reset. |
| **Settings** | Light/Dark theme, language, Elder Mode, reduced motion, voice speed and test, AI status, privacy and clear-all-data. |

Global: sidebar plus mobile bottom navigation, **search** (modules and the Digital Dictionary, `Ctrl K`), notifications, theme switcher, language and accessibility menu, SOS button, RTL layout and Nastaliq font for Urdu.

## Live AI vs Demo Mode — honest by design

Every AI result shows a **Live AI** or **Demo Mode** badge.

| | Live AI (`GEMINI_API_KEY` or `ANTHROPIC_API_KEY` set) | Demo Mode (no key) |
|---|---|---|
| Assistant | AI: conversational, routes to modules, adapts language and simplicity | Keyword intent routing, curated answers, inline Scam DNA, dictionary |
| Scam Shield | AI analysis, **reinforced** by the rule engine so OTP, credential and payment red flags are never dropped | Built-in, explainable Scam DNA rule engine (English, Roman Urdu, Urdu patterns) |
| Vision / Point & Explain | AI vision on the screenshot plus OCR line ids for highlights | OCR-text-only classification (cannot see icons or colours, and says so) |
| Document Reader | AI vision extraction | OCR plus pattern extraction |
| Guide (custom goal) | AI generates tailored steps | General safe plan (library tasks work fully in both modes) |
| Rescue Mode | AI, optionally with a screenshot | Keyword-based recovery steps |

If the AI call fails (bad key, rate limit, network, refusal), the app falls back to the rule engine and **tells the user** in a notice.

**Works fully without any key:** OCR (Tesseract.js, in the browser), QR decoding, voice (Web Speech API), Academy, Guide library, Guardian, Emergency, Progress and Settings.

## Architecture

```
Next.js 16 (App Router, TypeScript, Tailwind v4)
├─ src/app/*                 pages (client components) + per-route metadata
├─ src/app/api/*             backend: route handlers (server only; keys never reach the browser)
│   ├─ assistant/chat        intent + reply + module actions
│   ├─ shield/analyze        scam analysis (AI + rule reinforcement)
│   ├─ vision/analyze|explain  screen understanding, Point & Explain
│   ├─ document/analyze      bill/notice extraction
│   ├─ tasks, tasks/rescue   guided tasks, Rescue Mode
│   └─ status                live/demo status
├─ src/lib/ai/provider.ts    picks Claude → Gemini → Demo Mode; shared prompt rules
├─ src/lib/ai/claude.ts      Claude: structured JSON outputs (zod), refusal handling, server-side fallbacks
├─ src/lib/ai/gemini.ts      Gemini: JSON-schema output, validated with the same zod schemas
├─ src/lib/engine/*          explainable rule engines (Demo Mode + safety net)
├─ src/lib/safety.ts         input validation, redaction of card/CNIC/IBAN numbers, verdict softening
├─ src/lib/progress.ts       learning events + transparent Independence Score
├─ src/lib/{prefs,i18n,speech,client,samples}.ts   theme/lang prefs, UI strings, voice, OCR, fictional samples
└─ src/data/*                reviewed task library, practice scenarios, dictionary, emergency playbooks
```

**Why Next.js route handlers instead of a separate FastAPI service?** The blueprint recommends a modular monolith. One TypeScript codebase deploys to Vercel in one step, shares the API contracts (`src/lib/types.ts`) between UI and backend, and still keeps every AI call and key on the server.

**Persistence:** preferences and learning progress are stored **on the device** (localStorage) by design: private by default, no account needed. Supabase sync with row-level security is on the roadmap.

## Setup

Requirements: Node.js 20+ (tested with Node 24) and npm.

```bash
npm install
cp .env.example .env.local      # optional: add GEMINI_API_KEY (free) or ANTHROPIC_API_KEY for Live AI
npm run dev                     # http://localhost:3000
```

Production:

```bash
npm run build && npm start
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | No | **Free** Live AI via Google Gemini — get a key at https://aistudio.google.com ("Get API key"). |
| `GEMINI_MODEL` | No | Main Gemini model (default `gemini-3.5-flash`). When the free tier is busy, HUMRAAH falls back to `gemini-flash-lite-latest` automatically. |
| `ANTHROPIC_API_KEY` | No | Live AI via Anthropic Claude (paid). Takes priority over Gemini if both are set. |
| `HUMRAAH_MODEL` | No | Override the Claude model (default `claude-opus-5-5`). |

With no key, HUMRAAH runs in labelled Demo Mode.

### Deploy to Vercel

Import the repo, add `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) under *Project → Settings → Environment Variables*, and deploy. No other services are needed.

## Safety, privacy & responsible AI

- Never requests or stores passwords, PINs, OTPs, card numbers or banking credentials. Card, CNIC and IBAN numbers are masked **before** any text reaches an AI model.
- Never says "confirmed scam" or "verified safe". Outputs say *warning signs* and list what HUMRAAH can't know. AI wording is softened server-side if needed.
- Links and QR codes are **never opened**. Link checks are shape-based and labelled "not verified".
- Screenshots and documents are processed for the request and **not stored**. OCR runs in the browser.
- All Academy banks, people, numbers and amounts are fictional and labelled as simulations.
- Microphone use is visible and only starts on tap. No audio is recorded or kept.
- The user always performs sensitive final actions themselves.

Tested responsible-AI cases (Demo Mode): an obvious OTP scam → **high**; a legitimate transaction alert → **low**; a short ambiguous message → **uncertain**; Roman Urdu relative-in-emergency scam → **high**; a "we will never ask for your OTP" notice is not mistaken for an OTP request.

## Known limitations

- **Voice:** speech recognition depends on the browser (best in Chrome/Edge; Urdu uses `ur-PK` where supported). Text input always works. Speech may misrecognise names and numbers, so check transcripts.
- **OCR:** reads English text. The first use downloads ~10 MB of language data from a CDN (then cached). Low-contrast or white-on-colour text can be missed. Live AI vision does not have this limitation.
- **Urdu script:** the UI chrome and rule engines support Urdu script. Curated library and scenario content is English and Roman Urdu (Urdu mode shows Roman Urdu there). Live AI answers in Urdu script.
- **Not verification:** HUMRAAH does not check URLs against a reputation service, verify senders, or detect deepfakes.
- **Progress is per device:** clearing browser data resets it (Export is available).
- **Family Circle** (consent-based sharing) and Supabase sync are roadmap items, not built.

## Credits

Anthropic Claude and Google Gemini (AI), Tesseract.js (OCR), jsQR (QR decoding), Web Speech API (voice), Next.js, Tailwind CSS, Lucide icons, Recharts, Zod. Product design follows the *HUMRAAH Complete Project Blueprint*.
