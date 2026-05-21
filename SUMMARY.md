# SUMMARY — Noa Agent Session Log

## Session: 2026-05-21 (latest)

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

#### Files changed this session
- `src/vela/storage.js`
- `src/vela/screens/VelaCore.js`

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
9. 🔲 Overall polish and consistency

---

## What still needs doing

### Custom app icon
- `public/manifest.json` still references default CRA `logo192.png` and `logo512.png`
- No custom Noa icon created yet
- LOW priority — doesn't affect functionality but matters for PWA install UX

### SmallOrb visual feedback
- The 60px SmallOrb on the dashboard doesn't change appearance when Noa speaks
- The full `Orb` component (with state-driven visuals) is only used in the chat overlay
- Could pass `orbState` to SmallOrb so users see Noa "breathing" when she speaks during walkthrough
- MEDIUM priority

### Face ID auto-trigger on return visits
- Face ID/Touch ID is enrolled after first PIN login, but not auto-triggered on subsequent visits
- VERY LOW priority

---

## Blockers

None. Build passes cleanly (`npm run build` — 89.41 kB gzip).

**User action required:** Ensure `ELEVENLABS_API_KEY` is set in Vercel dashboard (Settings → Environment Variables). This is the only external dependency preventing ElevenLabs voice from working in production.

---

## Recommended next priority

1. **Custom app icon** — create Noa-branded icons for manifest.json and public/ so the PWA looks polished on the iPhone home screen
2. **SmallOrb orbState feedback** — pass `orbState` to SmallOrb so users see visual Noa feedback during the walkthrough welcome speech
3. **Final iPhone test** — install as PWA, go through fresh onboarding, confirm walkthrough speaks with ElevenLabs voice and tooltips show personalised data
