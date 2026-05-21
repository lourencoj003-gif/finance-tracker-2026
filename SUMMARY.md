# SUMMARY — Noa Agent Session Log

## Session: 2026-05-21

### What was done this session

#### 1. api/speak.js — ElevenLabs env var fix (CRITICAL)
- Removed `REACT_APP_` prefix from `process.env.REACT_APP_ELEVENLABS_API_KEY` — this prefix is compile-time only and does NOT work in Vercel serverless functions
- Changed to `process.env.ELEVENLABS_API_KEY` (serverless-compatible)
- Hardcoded voice ID fallback `XvfwInXiPC6BcAjGWhmS` so ElevenLabs works even without `ELEVENLABS_VOICE_ID` env var set
- **Impact:** ElevenLabs voice was silently failing in production because the API key env var was never available server-side

#### 2. PaydayCeremony.js — Replaced browser TTS with voice.js
- Removed inline `speakLine()` function (was using raw `speechSynthesis`)
- Removed `audioRef` (no longer needed)
- Removed unused `splitSentences` helper
- Added `import { speak as voiceSpeak, stopSpeaking }` from voice.js
- Added `useEffect(() => stopSpeaking, [])` cleanup on unmount
- Both speech calls now route through ElevenLabs via voice.js

#### Files changed this session
- `api/speak.js`
- `src/vela/screens/PaydayCeremony.js`

---

## What was done in prior sessions (accumulated context)

### Voice infrastructure
- `api/speak.js` — ElevenLabs TTS proxy (model: `eleven_turbo_v2`, voice: `XvfwInXiPC6BcAjGWhmS`)
- `src/vela/voice.js` — module-level singleton audio management, `speak()` + `stopSpeaking()`, falls back to browser TTS if ElevenLabs unavailable

### Living Planet Orb (`src/vela/Orb.js`)
- Fully rewritten with 9 CSS keyframes: planetSpin, ringCW, ringCCW, planetBreath, glowPulse, bandA, bandB, speakRipple, particleOrbit
- 6 states: idle, listening, thinking, speaking, payday, debt
- All layers: glow aura, 3 atmosphere rings, speak ripples, 6 orbiting particles, planet body

### Chat UI (`src/vela/screens/VelaCore.js`)
- Replaced scrollable GlassCard stack with clean centered text display
- `NoaMessage` component: sentence-by-sentence fade-in with 500ms stagger
- Only shows last Noa message + last user echo — no history scroll
- iOS keyboard awareness via `window.visualViewport`

### Memory — full onboarding injection
- All 8 onboarding fields injected into every API call via `buildPrompt()`
- Full conversation history sent to API (30-message cap, stored in localStorage)
- `loadHistory()` / `saveHistory()` functions in VelaCore.js

### System prompt (`api/chat.js`)
- Removed all demographic assumptions ("top X% of your age group" etc.)
- Only references facts the user explicitly provided
- Every response uses at least one specific £ figure from user's actual data

### Onboarding (`src/vela/screens/Onboarding.js`)
- Full 8-question flow: name, income, payday, expenses, lifestyle, debt, goal, savings
- All questions spoken via ElevenLabs
- Orb expansion animation on completion before transitioning to home

### iOS fixes
- `font-size: 16px !important` on inputs (prevents zoom)
- `position: fixed` on html/body (prevents scroll)
- `visualViewport` keyboard listener in App.js
- `containerHeight = vpH ? '${vpH}px' : '100svh'`

### Payday ceremony (`src/vela/screens/PaydayCeremony.js`)
- Gold orb, expanding rings, 4 allocation steps (50/20/25/5 split)
- Step-by-step confirm flow with progress dots
- Done phase with float animation

### Splash + Pin
- ElevenLabs voice on splash sequence
- PIN create/confirm/login with shake animation
- Face ID / Touch ID enrolment after first PIN login (WebAuthn)

---

## What still needs doing

### App icons
- `public/manifest.json` still references default CRA `logo192.png` and `logo512.png`
- Custom Noa icon not yet created
- LOW priority — doesn't affect functionality

### Pin.js — Face ID auto-trigger
- Face ID is prompted after PIN login, not auto-triggered on mount
- VISION.md mentions this but it's not in the explicit priority list
- VERY LOW priority

### Payday ceremony trigger
- PaydayCeremony is built but needs to be checked that it triggers correctly on payday date
- Check VelaCore.js for the payday detection logic

### Overall polish
- Verify all screens are consistent with design language (#111318 bg, #E8DDD0 text, #C9A96E gold)
- Test full first-time user flow on actual iPhone

---

## Blockers

None currently. Build passes cleanly (`npm run build` — 88.93 kB gzip).

**Action required by user:** Ensure `ELEVENLABS_API_KEY` is set in Vercel environment variables (Settings → Environment Variables). This is the only external dependency preventing ElevenLabs voice from working in production.

---

## Recommended next priority

1. Verify `ELEVENLABS_API_KEY` is set in Vercel dashboard (user action required)
2. Test full user flow on iPhone (install as PWA, go through onboarding, confirm Noa speaks in ElevenLabs voice)
3. Custom app icon for manifest.json
4. Payday ceremony trigger audit in VelaCore.js
