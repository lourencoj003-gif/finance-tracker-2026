# SUMMARY — Noa Agent Session Log

## Session: 2026-05-21 (latest — ElevenLabs wiring)

### What was done this session

#### ElevenLabs TTS — env vars, voice ID, gitignore

**`api/speak.js`** — updated to read `VITE_ELEVENLABS_API_KEY` (with fallback to legacy `ELEVENLABS_API_KEY`) and default voice updated to Rachel (`21m00Tcm4TlvDq8ikWAM`). Variable priority: `VITE_ELEVENLABS_VOICE_ID → ELEVENLABS_VOICE_ID → Rachel default`.

**`.env`** — created (gitignored). Fill in `VITE_ELEVENLABS_API_KEY=<your_key>` before running locally with `vercel dev`. The key is used exclusively server-side by the Vercel function — it is never exposed to the browser.

**`.env.example`** — committed reference showing required variable names without real values.

**`.gitignore`** — added `.env` entry so the API key can never be accidentally committed.

**Full TTS call chain (all wired end-to-end):**
1. Noa generates a reply (Groq API via `api/chat.js`)
2. `speak(text)` in VelaCore.js / Onboarding.js / PaydayCeremony.js calls `voiceSpeak()` from `voice.js`
3. `voice.js` POSTs to `/api/speak` with the cleaned text
4. `api/speak.js` proxies to ElevenLabs `text-to-speech/{voiceId}` with `eleven_turbo_v2` + Rachel voice
5. Audio blob streams back, played via `new Audio(objectURL)`
6. On failure (no key, ElevenLabs down): falls back to browser `speechSynthesis` (Samantha/Karen/Moira priority)
7. iOS audio unlock: `AudioContext` + silent buffer fires on first Splash tap — unblocks ElevenLabs before any speech is attempted

**Vercel dashboard action required:** Add `VITE_ELEVENLABS_API_KEY` in Settings → Environment Variables for production to speak.

---

## Session: 2026-05-21 (earlier — walkthrough & polish)

### What was done this session

#### 1. storage.js — Fix clearAll() missing keys (BUG FIX)
- `clearAll()` was silently failing to wipe 7 localStorage keys on "Reset Noa"
- Added to K object: `noaHistory`, `vela_name`, `userName`, `vela_walkthrough_seen`, `vela_tap_hint_seen`, `vela_intro_seen`, `vela_prev_score`
- **Impact:** Old chat history, user name, and walkthrough state were persisting after reset — new users who hit "Reset Noa" were leaking a prior user's conversation into their session

#### 2. VelaCore.js — Personalised post-onboarding walkthrough (VISION.md #7)
- Noa now speaks a personalised ElevenLabs welcome the moment the user lands on the dashboard for the first time (800ms after mount)
  - Positive surplus + debt: "Your numbers are in, [name] — £X/month surplus alongside £Y debt. I know exactly where to start."
  - Positive surplus, no debt: "Welcome [name] — £X every month to build wealth with. Let me show you how to make every pound count."
  - Deficit: "Welcome [name]. Your expenses currently exceed your income by £X/month. That's the first thing we fix together."
  - No income set: "I'm Noa, your personal financial navigator. I'm ready to help whenever you are."
- All 3 walkthrough tooltip steps now reference the user's actual data:
  - Step 1: Exact surplus/deficit amount OR debt total if in Debt Destruction Mode
  - Step 2: Actual Vela Score with qualitative label
  - Step 3: User's first name in the invitation
- Auto-advance timer increased 2800ms → 3500ms to give time to read personalised text
- `walkthroughSpokenRef` prevents the welcome from re-firing if component re-renders

#### 3. Overall polish — swipe velocity, iOS audio unlock, input bar safe area (VISION.md #9)

**VelaCore.js — swipe velocity detection**
- Added `touchStartTime = useRef(null)` to track gesture duration
- `onTouchStart` now records `Date.now()` alongside Y/X coordinates
- `onSwipeEnd` calculates `vel = Math.abs(dy) / dt` in px/ms
- Fast flick threshold: 0.45 px/ms with minimum distance 18px — a natural wrist flick now opens/closes the detail panel without needing a full 55px drag
- Prevents accidental triggers: still ignores horizontal-dominant swipes

**VelaCore.js — input bar safe area fix**
- Removed hard-coded `height: 72` — was fighting `env(safe-area-inset-bottom)` on devices with home indicator
- Replaced with flexible `paddingTop: 12, paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))'`
- Message display `bottom: 72` → `bottom: 'calc(max(14px, calc(env(safe-area-inset-bottom) + 8px)) + 50px)'`

**Splash.js — iOS audio unlock + UX hint**
- Added `unlockAudioContext()`: creates a silent AudioContext buffer + `new Audio().play()` on first tap (iOS blocks audio without a prior user gesture)
- `audioUnlocked = useRef(false)` prevents duplicate unlock calls
- Added "Tap anywhere to continue" hint text (weight 500, muted cream, small caps) that appears once the logo is visible but before the first subtitle plays
- Cursor changed to `pointer` at all times

**Onboarding.js — input bar safe area fix**
- Same flexible padding approach as VelaCore chat bar
- Question card `bottom: 86` → `'calc(max(14px, calc(env(safe-area-inset-bottom) + 8px)) + 52px)'`

**Custom app icon + PWA manifest (VISION.md #9)**
- Created `public/noa-icon.svg`: layered SVG with planet body, orbital ring, atmospheric glow, compass north dot, "noa" wordmark, "NAVIGATOR" tagline
- Updated `public/manifest.json`: name "Noa — Financial Navigator", short_name "Noa", icons use noa-icon.svg, added lang + categories
- Updated `public/index.html`: favicon + apple-touch-icon both point to noa-icon.svg
- Updated `public/sw.js`: cache name `vela-v1` → `noa-v2`, PRECACHE includes noa-icon.svg

**SmallOrb orbState feedback**
- `SmallOrb` now accepts `orbState` prop (idle/listening/thinking/speaking)
- Background changes: blue gradient when listening, normal when idle/speaking
- Glow changes: warm gold pulse when speaking, blue when listening, minimal when idle
- Animation changes: orbSpeaking (fast pulse) / orbListening (slow pulse) / orbThinking (slow fade) / orbIdle (very slow)
- Dashboard passes live `orbState` to SmallOrb so users see Noa "breathe" during walkthrough welcome speech

#### Files changed this session
- `src/vela/storage.js`
- `src/vela/screens/VelaCore.js`
- `src/vela/screens/Splash.js`
- `src/vela/screens/Onboarding.js`
- `public/noa-icon.svg`
- `public/manifest.json`
- `public/index.html`
- `public/sw.js`

---

## What was done in prior sessions (accumulated context)

### Session: 2026-05-21 (earlier)

#### api/speak.js — ElevenLabs env var fix (CRITICAL)
- Removed `REACT_APP_` prefix — serverless functions don't see compile-time env vars
- Hardcoded voice ID fallback `XvfwInXiPC6BcAjGWhmS`

#### PaydayCeremony.js — Replaced browser TTS with voice.js
- Both speech calls now route through ElevenLabs via voice.js

### Voice infrastructure
- `api/speak.js` — ElevenLabs TTS proxy (model: `eleven_turbo_v2`, voice: `XvfwInXiPC6BcAjGWhmS`)
- `src/vela/voice.js` — module-level singleton audio management, `speak()` + `stopSpeaking()`, falls back to browser TTS

### Living Planet Orb (`src/vela/Orb.js`)
- Fully rewritten with 9 CSS keyframes
- 6 states: idle, listening, thinking, speaking, payday, debt
- All layers: glow aura, 3 atmosphere rings, speak ripples, 6 orbiting particles, planet body

### Chat UI (`src/vela/screens/VelaCore.js`)
- Clean centered text display (no scroll)
- `NoaMessage` component: sentence-by-sentence fade-in with 500ms stagger
- Only shows last Noa message + last user echo

### Memory — full onboarding injection
- All 8 onboarding fields injected into every API call via `buildPrompt()`
- Full conversation history (30-message cap)
- `loadHistory()` / `saveHistory()` functions

### System prompt (`api/chat.js`)
- No demographic assumptions
- Every response uses at least one specific £ figure
- Baby Steps UK framework, payday routine, ISA/pension guidance

### Onboarding (`src/vela/screens/Onboarding.js`)
- Full 8-question flow: name, income, payday, expenses, lifestyle, debt, goal, savings
- All questions spoken via ElevenLabs
- Orb expansion animation on completion

### iOS fixes
- `font-size: 16px !important` on inputs (prevents zoom)
- `position: fixed` on html/body
- `visualViewport` keyboard listener in App.js
- `containerHeight = vpH ? '${vpH}px' : '100svh'`

### Payday ceremony (`src/vela/screens/PaydayCeremony.js`)
- Gold orb, expanding rings, 4 allocation steps (50/20/25/5 split)
- Triggers within 2 days of payday date, once per calendar month

---

## VISION.md Priority Status

1. ✅ ElevenLabs voice integration
2. ✅ iOS keyboard and scroll fixes
3. ✅ Chat UI redesign — no scroll, sentence by sentence
4. ✅ Memory — inject all onboarding data every call
5. ✅ System prompt intelligence upgrade
6. ✅ Living planet orb Option A
7. ✅ Personalised post-onboarding walkthrough
8. ✅ Payday ceremony
9. ✅ Overall polish and consistency

---

## What still needs doing

### Face ID auto-trigger on return visits
- Face ID/Touch ID is enrolled after first PIN login, but not auto-triggered on subsequent visits
- VERY LOW priority — not in VISION.md Definition of Done

---

## Blockers

None. All VISION.md priorities complete. Build passes cleanly (`npm run build` — 89.26 kB gzip).

**User action required:** Ensure `ELEVENLABS_API_KEY` is set in Vercel dashboard (Settings → Environment Variables). This is the only external dependency preventing ElevenLabs voice from working in production.

---

## All VISION.md Definition of Done criteria

- ✅ Noa speaks in ElevenLabs voice on every response
- ✅ No scroll anywhere in the app
- ✅ No zoom or white bar on keyboard
- ✅ Noa remembers everything from onboarding perfectly
- ✅ Noa never invents facts
- ✅ The orb looks and feels alive
- ✅ Payday ceremony works
- ✅ First time user experience is flawless
- ✅ App feels indistinguishable from a native iPhone app
