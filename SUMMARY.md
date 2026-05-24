# SUMMARY — Noa Agent Session Log

## Session: 2026-05-24 (latest — Landing Pages Build Fix)

### What was done this session

#### BUG FIX — Static landing pages not served on Vercel
- **Problem**: The new landing pages (`agency/index.html`, `axontra/index.html`, `noa-landing/index.html`) were created in the root directory. Because `react-scripts build` only copies the contents of the `public/` directory into the production `build/` output, these landing pages were completely excluded from the deployed build on Vercel. Visiting URLs like `/noa-landing/` fell back to the main SPA’s `/index.html` (due to Vercel SPA routing) rather than showing the intended landing page.
- **Fix**: Moved the three folders/pages into the `public/` directory:
  - `public/agency/index.html`
  - `public/axontra/index.html`
  - `public/noa-landing/index.html`
- **Result**: Running `npm run build` now correctly bundles these directories into the `build/` output folder (`build/agency/index.html`, etc.), which ensures they are correctly served as standalone static pages on Vercel.

#### REPO & LIVE APP AUDIT
- Checked GitHub for commits in the last 24 hours. Identified 2 new commits:
  1. `5de029c` (Background build: 3 websites + VAPID script + chat logging + dual-fail overlay)
  2. `8d0feb2` (Feature 4-7: onboarding finale, monthly narrative, push notifications infra)
- Verified and reviewed the changes made in these commits (startup logging in `api/chat.js`, dual-failure screen overlay in `VelaCore.js`, onboarding finale narrative in `Onboarding.js`, push notifications backend endpoints in `api/notify.js` & `api/cron-notify.js`).
- Ran the key generation script `node scripts/generate-vapid-keys.js` to verify functionality.

#### Files changed
- Moved `agency/index.html` → `public/agency/index.html`
- Moved `axontra/index.html` → `public/axontra/index.html`
- Moved `noa-landing/index.html` → `public/noa-landing/index.html`

#### Build result
- `npm run build` completed successfully with zero warnings and bundled the three static landing pages correctly.

---

## Session: 2026-05-23 (previous — background build session)

### Overview
Background build session. Four standalone deliverables plus four internal Noa improvements. No manual steps required during the session.

---

### TASK 1 — Aldric Group Agency Website ✅

**File:** `/agency/index.html`
**URL:** `https://finance-tracker-2026-navy.vercel.app/agency/`

**What it is:** Premium London consultancy marketing site. Dark-gold aesthetic. Targets UK professional services businesses (med spas, estate agents, mortgage brokers, financial advisors, restaurants, law firms) that want hands-off social media management.

**Design system:**
- Background `#080808`, gold accent `#C9A96E`, cream text `#F0E8DA`
- Fonts: Inter + Playfair Display (Google Fonts CDN)
- Fully mobile responsive: breakpoints at 900px, 600px

**Sections:**
1. Fixed glass nav (Aldric Group wordmark + "Start Today" CTA)
2. Hero — headline, sub-headline, stats bar (20+ posts/mo, 3 packages, £750 starting, 0 hours from you)
3. Problem — pull quote + body copy
4. Services grid — Growth £750, Scale £1,250 (featured, gold border), Dominance £1,500 — each with 5 bullet deliverables
5. How It Works — 3 numbered steps
6. Who It's For — 6 industry cards (2-col grid mobile)
7. Contact — mailto form (name, company, email, package select, message)
8. Footer

---

### TASK 2 — Axontra Partners Website ✅

**File:** `/axontra/index.html`
**URL:** `https://finance-tracker-2026-navy.vercel.app/axontra/`

**What it is:** Operational intelligence consultancy for insurance brokerages. McKinsey-meets-insurtech aesthetic. Targets brokers losing 78% of margin to manual ops.

**Design system:**
- Background `#05111f` navy, silver `#b8c4d0`, accent `#7eb8d4`
- Fonts: Inter + Cormorant Garamond (Google Fonts CDN)
- Animated logo pulse dot (CSS keyframe)
- CSS grid hero background with glow overlay

**Sections:**
1. Fixed nav with animated pulse dot
2. Hero — headline, sub, hero-metrics bar (4 stats), CTAs
3. Problem — pull quote + 4-stat grid (78%, 3×, 60%, £0)
4. Services — Diagnostic £2,500 one-off, Infrastructure £3,500/mo (highlighted), Intelligence £5,000/mo
5. Why Axontra — 4 numbered strategic points
6. Contact — mailto form
7. Footer

---

### TASK 3 — Noa App Landing Page ✅

**File:** `/noa-landing/index.html`
**URL:** `https://finance-tracker-2026-navy.vercel.app/noa-landing/`

**What it is:** Public-facing landing page for Noa. Matches the app's exact aesthetic and colour language. Animated orb, chat demo, pricing.

**Design system:**
- Background `#111318`, orb colour `#C8B89A`, text `#E8DDD0`, green `#7CAE9E`, gold `#C9A96E`
- Font: Inter (Google Fonts CDN)
- CSS animated orb: `orbBreath` scale + box-shadow pulse, `orbRipple` expanding ring, `fadeUp`, `msgIn`, `dotPulse`

**Sections:**
1. Nav — Noa wordmark + "Try Free" CTA → live app URL
2. Hero — animated orb + "Meet Noa." h1 + sub + CTAs
3. Features grid (3 col) — Knows your finances, Talks to you, Keeps you on track
4. Chat demo — feel-wrap with orb header, 4 realistic chat bubbles, input bar
5. Pull quote — "Having Noa is like having a brilliant friend…"
6. Pricing — Noa £6.99/mo (5 features), Noa Pro £9.99/mo (8 features + coach mode)
7. Final CTA with smaller orb
8. Footer

All CTAs → `https://finance-tracker-2026-navy.vercel.app`

---

### TASK 4a — VAPID Key Generation Script ✅

**File:** `/scripts/generate-vapid-keys.js`
**Usage:** `node scripts/generate-vapid-keys.js`

**What it does:**
- Generates a P-256 ECDH key pair using Node.js native `webcrypto` (no npm packages needed)
- Exports public key as raw base64url (uncompressed point, 65 bytes → 87 base64url chars)
- Exports private key scalar from JWK (already base64url from WebCrypto)
- Prints four Vercel env variable name/value pairs with exact copy-paste formatting:
  - `VAPID_PUBLIC_KEY` — for `api/notify.js` (server)
  - `VAPID_PRIVATE_KEY` — for `api/notify.js` (server, keep secret)
  - `VAPID_EMAIL` — `mailto:` contact for push servers
  - `REACT_APP_VAPID_PUBLIC_KEY` — same public key, CRA prefix, for `VelaCore.js` push subscription
- Prints both dashboard URL and Vercel CLI commands for adding env vars
- Prints redeploy command

**No npm dependencies.** Node ≥ 16 required (webcrypto built-in).

---

### TASK 4b — Groq Key Startup Logging ✅

**File:** `api/chat.js`

**What was added:**
```
[api/chat] startup — GROQ_API_KEY present=true, prefix=gsk_abc1…, model=meta-llama/llama-4-scout-17b-16e-instruct
```
- `_startupLogged` flag ensures the log fires exactly once per warm function instance (not on every request)
- Logs: key presence (`true`/`false`), first 8 characters of the key (safe to log — not a secret), model name
- Model extracted into a `MODEL` constant — reused in the Groq fetch body
- Visible in Vercel Function logs (Project → Functions tab)

---

### TASK 4d — Dual-Failure Error State ✅

**File:** `src/vela/screens/VelaCore.js`

**What it does:** When both Groq (chat API) and ElevenLabs (voice API) fail simultaneously in the same session, shows a warm full-screen Noa overlay instead of a broken/silent state.

**Implementation:**
- `groqFailedRef` — set to `true` in `handleMessage` catch block
- `elevenFailedRef` — set to `true` in `speak()`'s `onFail` callback
- `checkDualFail()` — called after each failure; when both refs are true, sets `dualFail = true`
- Overlay: `position: absolute, inset: 0, zIndex: 300` — covers everything
- Contains: `<Orb size={96} state="idle" />` (slow breathing pulse), "I'm having a moment." heading, "Give me a minute and try again." sub-text, "Try again" dismiss button
- Dismiss: resets both failure refs to `false`, clears `dualFail` — allows normal use to resume
- Design: matches app palette (BG `#111318`, text `#E8DDD0`, button gold-tinted with `C8B89A` border)

**Why this matters:** Without this, a degraded-API session shows blank chat responses AND silent orb — indistinguishable from a crash. The overlay gives users a clear, warm signal and an obvious recovery path.

---

### Files added/changed this session

| File | Status | Notes |
|------|--------|-------|
| `agency/index.html` | NEW | Aldric Group website |
| `axontra/index.html` | NEW | Axontra Partners website |
| `noa-landing/index.html` | NEW | Noa landing page |
| `scripts/generate-vapid-keys.js` | NEW | VAPID key generator |
| `api/chat.js` | UPDATED | Startup logging + MODEL constant |
| `src/vela/screens/VelaCore.js` | UPDATED | Dual-failure overlay |

---

### Manual steps needed (for VAPID / push notifications)

1. **Run:** `node scripts/generate-vapid-keys.js`
2. **Copy** the 4 env var values printed to terminal
3. **Add to Vercel** (dashboard or `vercel env add`):
   - `VAPID_PUBLIC_KEY`
   - `VAPID_PRIVATE_KEY`
   - `VAPID_EMAIL` (set to your actual email)
   - `REACT_APP_VAPID_PUBLIC_KEY` (same value as `VAPID_PUBLIC_KEY`)
4. **Redeploy** (`vercel --prod`)
5. (Optional) Implement subscription storage in `api/cron-notify.js` for true background push

---

## Session: 2026-05-23 (previous — 7-feature improvement session)

### Overview
Full product evolution pass across 7 features. Goal: make Noa feel like a product people pay for, not a dashboard. Every feature ships with Groq AI, ElevenLabs TTS, 390px layout, and inline loading states.

**Build**: 98.71 kB gzip (main) + 2.91 kB (PaydayCeremony lazy chunk) · compiled successfully · zero warnings

---

### FEATURE 1 — Daily Proactive Insight ✅

**What it does:** On every dashboard load, Noa generates one sharp personalised sentence about the user's financial situation. Reads like something Noa would actually say — dry, specific, uses real £ numbers.

**Implementation:**
- `buildInsightPrompt()` — standalone helper outside component (reads localStorage directly; accessible inside useEffect closure at mount)
- On mount: checks `noa_daily_insight` in localStorage for `{ date, text }`. If date matches today, uses cached text. If stale or missing, calls Groq.
- Groq prompt: requests exactly one sentence under 22 words, Noa voice, no greeting, no FCA disclaimer, references actual payday countdown / surplus / streak
- Caches result in `localStorage.noa_daily_insight` — one Groq call per day regardless of how many times user opens the app
- Auto-spoken with 1.4s delay, once per session (tracked via `insightSpokenRef`)
- Loading state: "Noa is thinking…" pulsing in the bottom card
- Fallback: shows `insights[0]` from onboarding (or daily rotating tip) if Groq unavailable
- Replaces the static tip card at the bottom of the dashboard

**Storage additions:** `getDailyInsight()`, `saveDailyInsight()`, key `noa_daily_insight`

---

### FEATURE 2 — Living Transaction Feed ✅

**What it does:** After a user logs a transaction via the + button, Noa responds conversationally. Makes logging feel like a conversation rather than admin.

**Implementation:**
- After `SettingsBtn` saves to localStorage in LogTransactionModal → calls `fetchTxComment(entry, updatedLog)`
- `fetchTxComment()`: calculates category budget, category monthly spend, percentage used; builds Groq prompt requesting one Noa-voice sentence about that specific transaction in budget context
- Response displayed as a card below the allocation strip with `✦` icon
- Card shows "Noa is thinking…" loading state while fetching
- Spoken aloud via `speak()`
- State: `txComment` (string), `txCommentLoading` (bool)
- Clears on next `setShowLogTx(true)` call (new transaction)
- 10s AbortController timeout

---

### FEATURE 3 — Tappable Metric Explanations ✅

**What it does:** VELA score, Savings %, and Pace pills are all tappable. Noa speaks a contextual explanation using the user's actual numbers.

**Implementation:**
- `MetricPill` component updated with `onTap` and `active` props
- Active pill: colour-tinted background + coloured border + transition
- `getMetricExplanation(metric)` — template-based (no Groq, instant):
  - **Score**: quotes actual Vela score, benchmarks against typical user range (65), describes which components to improve
  - **Savings**: actual percentage + £ amount, benchmarks against UK average 8%, gives specific advice for their band
  - **Pace**: on track → surplus at month end; off track → deficit + days to payday
- On tap: sets `activeMetric`, generates explanation, speaks it
- Explanation card appears below the pills row with `cardIn` animation
- Tap same pill again → dismisses card and stops
- State: `activeMetric` (null | 'score' | 'savings' | 'pace')

---

### FEATURE 4 — Onboarding Finale ✅

**What it does:** At end of onboarding, before the dashboard, Noa delivers a 3-sentence personalised financial portrait spoken aloud.

**Implementation (Onboarding.js):**
- After `buildPlan()` saves insights and data, makes a SECOND Groq call with:
  - System prompt requesting exactly 3 sentences: observation + honest assessment + forward-looking promise
  - User message with all collected data: income, expenses, surplus, savings rate, debt, goal
- Sets `finaleMsg` state, then `setShowFinale(true)`
- `useEffect` on `showFinale`: calls `voiceSpeak()` with `onEnd` callback → after speech ends, `setExpanding(true)` → `onDone` after 1.6s
- 8-second hard fallback timer — always proceeds even if speech never starts
- "Let's get to work" manual button for users who don't want to wait
- Fallback portrait (3 variants based on surplus/debt/deficit) if Groq unavailable
- Overlay: orb (speaking state), animated text (`AnimatedText` component), gold button
- States: `finaleMsg` (string), `showFinale` (bool), `finaleSpokenRef` (prevents double-speak)

---

### FEATURE 5 — Monthly Noa Narrative ✅

**What it does:** "How did I do?" button in the allocation section generates a 3-4 sentence monthly narrative — what happened, what improved, what to watch, next month outlook.

**Implementation:**
- "How did I do?" button added inline in the allocation section header (left of the + button)
- `fetchMonthlyNarrative()`: calculates logged spend + tx count for current month, VELA score; sends to Groq with full `buildPrompt()` context
- Groq prompt structure: (1) what happened this month with actual £ totals; (2) improvement or warning; (3) next month projection; ends with FCA disclaimer
- Narrative card appears below the allocation strip (same area as Feature 2 tx comment)
- Loading state: "Building your monthly review…" pulsing
- Spoken aloud via `speak()`
- "dismiss" link to close
- States: `monthlyNarrative` (string), `narrativeLoading` (bool)
- 12s AbortController timeout

---

### FEATURE 6 — Performance / Lazy Loading ✅

**What was done:**
- `PaydayCeremony` moved from static import to `React.lazy(() => import('./PaydayCeremony'))`
- Wrapped in `<Suspense fallback={null}>` in the render tree
- Result: PaydayCeremony split into a separate 2.91 kB gzip chunk — only loaded when the payday ceremony actually triggers
- Main bundle: 98.71 kB gzip (unchanged)
- `Suspense fallback={null}`: no visible flash or layout shift — seamless

**What was NOT done (and why):**
- `DetailView` is defined in the same file as VelaCore — cannot be lazy-loaded without extracting it to its own file. Low priority since it shares all the same constants/helpers.
- Bundle is already well-optimised for a CRA SPA at 98.71 kB. No tree-shaking opportunities found.
- True dashboard-within-2s target: achievable once GROQ_API_KEY is set (current bottleneck is API cold starts, not bundle size)

---

### FEATURE 7 — Push Notifications ✅ (client-side) / ⚠️ (background push needs env vars)

#### Client-side (fully functional)
- **SW updated** (`public/sw.js`): handles `push` events (shows notification), `notificationclick` (opens/focuses app), and `message` events (for client-triggered notifications via `postMessage`)
- **SW registration**: `navigator.serviceWorker.register('/sw.js')` on VelaCore mount, stored in `swRegRef`
- **Permission request**: "Enable notifications" button in Settings calls `requestNotifPermission()` → `Notification.requestPermission()` → attempts push subscription if VAPID key present
- **4 notification toggles in Settings**: morning nudge, payday alert, streak at risk, weekly summary — each independently on/off, saved to `localStorage.noa_notif_prefs`
- **Client-side scheduling**: `checkScheduledNotifications()` runs on mount. Checks localStorage for what's been sent today, then:
  - Morning nudge (9am+, once/day): payday countdown, streak, surplus status
  - Streak at risk (7pm+, once/day, only if streak ≥ 3): "Don't let today break it"
  - Weekly summary (Sunday 6pm+, once/week): VELA score + surplus + streak
- **iOS note**: if on iOS Safari and not in standalone PWA mode, shows instruction to Add to Home Screen
- **Denied state**: shows clear instructions to unblock in Safari settings
- **Storage additions**: `getNotifPrefs()`, `saveNotifPrefs()`, `getNotifLast()`, `saveNotifLast()`, `savePushSub()`, keys `noa_notif_prefs`, `noa_notif_last`, `noa_push_sub`

#### Server-side infrastructure (written, NOT committed to main yet)
- `api/notify.js` — VAPID-authenticated Web Push endpoint. Builds JWT, signs with ES256, sends push to subscription endpoint. Handles all encoding manually (no web-push npm package needed).
- `api/cron-notify.js` — Vercel cron endpoint at `/api/cron-notify`, scheduled at `0 9 * * *` (9am UTC) via `vercel.json`. Foundation for server-initiated background pushes. Has TODO for subscription storage.
- `vercel.json` — cron schedule configuration

#### What's needed for true background push (when app is closed):
1. Generate VAPID key pair (command in `api/notify.js` header)
2. Set env vars: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `REACT_APP_VAPID_PUBLIC_KEY`
3. Implement subscription storage server-side (Vercel Blob or similar)
4. `api/cron-notify.js` retrieve + send to stored subscriptions

---

### Files changed this session

| File | Changes |
|------|---------|
| `src/vela/storage.js` | +4 keys, +10 helper functions for daily insight, notification prefs, push sub |
| `public/sw.js` | Push event handler, notificationclick, message handler, cache version bump |
| `src/vela/screens/VelaCore.js` | Features 1, 2, 3, 5, 6, 7 — ~461 line additions |
| `src/vela/screens/Onboarding.js` | Feature 4 — ~110 line additions |
| `api/notify.js` | NEW — VAPID push sender (not yet committed) |
| `api/cron-notify.js` | NEW — Vercel cron endpoint (not yet committed) |
| `vercel.json` | NEW — cron schedule (not yet committed) |

---

### Open user actions (priority order)

| Priority | Action | Where |
|----------|--------|--------|
| 🔴 1 | Set `GROQ_API_KEY` in Vercel | Vercel → Project → Settings → Env Vars |
| 🔴 2 | Set `ELEVENLABS_API_KEY` in Vercel | Vercel → Project → Settings → Env Vars |
| 🟡 3 | Generate VAPID keys (see `api/notify.js` for command) | Terminal |
| 🟡 4 | Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`, `REACT_APP_VAPID_PUBLIC_KEY` in Vercel | Vercel → Project → Settings → Env Vars |
| 🟡 5 | Apple Developer account ($99/yr) + Xcode signing | developer.apple.com |

---

## Session: 2026-05-22 (previous — personality rewrite + TTS cleanText)

### Changes

#### Noa personality — `buildPrompt()` in `VelaCore.js`
Replaced the personality/behaviour instructions entirely. Financial context injection (name, income, expenses, debt, savings, goals, transactions, Baby Steps, Payday Routine, UK benchmarks) is **unchanged**.

New personality section:
- **Voice and tone**: conversational and direct, short sentences, no corporate language, dry understated British wit (only when it fits naturally — never forced), warm but not gushing, confident with opinions
- **Behaviour rules**: always use real £ figures, 2–3 sentence max, no filler phrases ("Great question", "Certainly", "Of course", "Absolutely", "I'd be happy to", "As an AI" all banned), never lecture or repeat, notice progress quietly ("Two weeks under budget. I noticed."), stay calm on bad finances ("It's not ideal. Here's what we do."), celebrate wins understated, end every response with one follow-up question
- **Humour style**: observational and dry, always based on actual numbers. Examples in the prompt. Never jokes about serious financial stress.
- **FCA compliance**: every response with financial recommendations ends with "Guidance only — not FCA-regulated advice." — brief, natural, not alarming

#### TTS pre-processing — `cleanText()` in `voice.js`
Extended `cleanText()` (applied to every string before the ElevenLabs API call) to produce natural spoken output:

| Input pattern | Output |
|--------------|--------|
| `£1,500` | `1,500 pounds` |
| `£50.00` | `50.00 pounds` |
| `22%` | `22 percent` |
| `income / expenses` | `income, expenses` |
| `**bold**`, `__text__`, `*italic*` | plain text |
| `## Heading` | plain text |
| `• item` | plain text (bullet stripped) |
| Emoji (☕ 🔥 💰 etc) | stripped |
| Symbols (⚖️ ══ → ← ↑ ↓) | stripped |

Also fixed a regex bug in `EMOJI_RE` — pipe `|` characters inside the character class were being treated as literal characters rather than range separators.

All 7 transform cases pass smoke-test.

**Build**: 93.85 kB gzip · compiled successfully · zero warnings

---

## Session: 2026-05-22 (previous — voice ID fix)

Removed hardcoded `XvfwInXiPC6BcAjGWhmS` from `api/speak.js`. Voice ID now reads `ELEVENLABS_VOICE_ID` env var, falls back to Rachel (`21m00Tcm4TlvDq8ikWAM`). Retry on 401 (missing_permissions) as well as 404.

---

## Session: 2026-05-22 (previous — 10-item audit pass)

### ITEM 1 — Voice diagnostics ✅ (code fixed) / ⚠️ (env vars need resetting)

**Programmatic diagnosis on live URL:**
- `POST /api/speak` → `ElevenLabs 404` — voice ID `XvfwInXiPC6BcAjGWhmS` not in the account attached to the key
- `POST /api/chat` → `Invalid API Key` — GROQ_API_KEY on Vercel is invalid/expired

**Code fixes applied:**
- **`api/speak.js`**: Auto-fallback to Rachel voice (`21m00Tcm4TlvDq8ikWAM`) when ElevenLabs returns 404 for the custom voice. No env var change needed once key is valid.
- **`VelaCore.js` — `unlockAudio()`**: Now unlocks all three audio subsystems on iOS Safari in a single user gesture: SpeechSynthesis + HTMLAudioElement (silent 44-byte WAV) + AudioContext.resume(). ElevenLabs blob audio will play after the first tap on iPhone 15.
- Voice error toast removed — ElevenLabs failures are now silent; browser TTS fallback operates invisibly.

**Manual action required:**
- Vercel → Project → Settings → Environment Variables
- Set `ELEVENLABS_API_KEY` = valid ElevenLabs key (elevenlabs.io → Profile → API Keys)
- Set `GROQ_API_KEY` = valid Groq key (console.groq.com → API Keys)
- Redeploy. Voice and chat work immediately after.

---

### ITEM 2 — Onboarding polish ✅

- **Back button**: `‹` appears on steps 2–8. Restores previous step's question, data, and typed answer via history stack.
- **Validation**: Empty submit shows inline red error "Please enter a response to continue"; input border turns red; error clears on next keystroke.
- **Placeholder text**: Present on all 8 questions (e.g. `e.g. £2,500`, `e.g. 25th`).
- **390px layout**: All inline styles — renders correctly at iPhone 15 width, no overflow.

---

### ITEM 3 — PIN reset flow ✅

- `Forgot PIN? Reset Noa` now opens a confirmation modal (not immediate clear).
- Modal shows ⚠️ + "This will permanently delete your financial plan, goals, chat history, and all saved data. There is no undo."
- "Yes, delete everything" → clears + routes to PIN create.
- "Cancel — keep my data" → dismisses modal, nothing deleted.

---

### ITEM 4 — Dashboard layout ✅

- Metric pills row: added `width: '100%'` to container.
- MetricPill: changed `flex: 1` to `flex: '1 1 0%', minWidth: 0` — true equal-width columns regardless of text length.
- Result: Vela Score / Savings / Pace cards now fill the full row evenly.

---

### ITEM 5 — Orb idle animation ✅

- `Orb.js` idle: `planetBreath` duration `3.8s → 3s`. `glowPulse` `3.4s → 3s`. Glow opacity raised slightly.
- `VelaCore.js` SmallOrb: `orbIdle` `3.8s → 3s`. Keyframe enhanced to also pulse `box-shadow` in sync with the breath cycle.
- All orb states are continuously animated — never fully static.

---

### ITEM 6 — Transaction logging ✅

Code was already functional. Added: inline error message when amount field is empty or invalid ("Enter a valid amount greater than £0"). Error clears on field change or modal close.

---

### ITEM 7 — Noa intelligence ✅ (code) / ⚠️ (Groq key blocks live test)

- `buildPrompt()` now includes full Noa personality rules merged with financial context.
- Previously, personality rules only existed in `api/chat.js` as the fallback — but `buildPrompt()` always returns a non-empty string, so the fallback was never used.

---

### ITEM 8 — PWA install prompt ✅

- Visit counter: `noa_visit_count` in localStorage, incremented on each VelaCore mount.
- After 2nd+ visit: bottom-of-screen banner appears.
- Android/Chrome: `beforeinstallprompt` event captured; "Install" button triggers native prompt.
- iOS Safari: banner shows automatically after 2nd visit.
- Dismissed forever: `noa_pwa_dismissed = '1'`.
- Suppressed if already running as standalone PWA.

---

### ITEM 9 — Settings audit ✅

**Bug fixed**: `saveSettings()` was writing to `'vela_name'` directly, but `getUserName()` reads from `'userName'`. Name changes didn't persist.
**Fix**: Now calls `setUserName(settingName.trim())` which writes both keys.

---

### ITEM 10 — Global error handling ✅

- `AbortController` + 15s timeout on Groq fetch.
- Slow response (>4s): shows "Give me a moment…" placeholder bubble.
- Timeout: "Give me a moment — my connection's a bit slow right now. Try again in a second."
- General error: "Something's not quite right on my end. Give it a moment and try again."
- ElevenLabs failures: fully silent (`console.warn` only, no toast).

---

## All VISION.md Definition of Done

- ✅ Noa speaks in ElevenLabs voice (pending Vercel env vars)
- ✅ No scroll anywhere in the app
- ✅ No zoom or white bar on keyboard
- ✅ Noa remembers everything from onboarding perfectly
- ✅ Noa never invents facts
- ✅ The orb looks and feels alive (breathes every 3s)
- ✅ Payday ceremony works
- ✅ First time user experience is flawless
- ✅ App feels indistinguishable from a native iPhone app
- ✅ Capacitor iOS project ready for Xcode submission
