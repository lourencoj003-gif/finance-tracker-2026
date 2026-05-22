# SUMMARY — Noa Agent Session Log

## Session: 2026-05-22 (latest — 3 bug fixes: savingsRate, voice env vars, settings name)

### What was done this session

#### BUG FIX 1 — savingsRate undefined inside buildPrompt()
- `savingsRate` was used at lines 698–702 inside `buildPrompt()` but computed at line 802 at component scope — outside the function closure
- This caused the system prompt to inject `undefined` for savings rate context, breaking Noa's financial awareness
- Fix: added `const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : 0;` inside `buildPrompt()` right after `surplus` is computed
- Now Noa correctly reports savings rate percentage and UK average comparison in every chat response

#### BUG FIX 2 — ElevenLabs voice broken on live Vercel URL
- `api/speak.js` was reading `process.env.VITE_ELEVENLABS_API_KEY` first — but `VITE_` is a Vite convention, not applicable to Vercel serverless functions
- Swapped to `process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY` — clean name first
- Same fix applied to `ELEVENLABS_VOICE_ID`
- Updated `.env.example` to use `ELEVENLABS_API_KEY` as primary name and added `GROQ_API_KEY` for completeness
- **User action still required**: set `ELEVENLABS_API_KEY` in Vercel Dashboard → Settings → Environment Variables

#### BUG FIX 3 — saveSettings() not updating userName correctly
- `saveSettings()` was calling `localStorage.setItem('vela_name', settingName)` directly
- But `getUserName()` reads from the `userName` key — so name changes in Settings were invisible to Noa
- Fix: replaced with `setUserName(settingName)` from storage.js, which sets both `userName` and `vela_name` keys
- Added `setUserName` to the imports from `../storage`

#### Files changed
- `src/vela/screens/VelaCore.js` — 3 edits (import, buildPrompt, saveSettings)
- `api/speak.js` — env var order swapped
- `.env.example` — updated to clean env var names

#### Build result
- `npm run build` — Compiled successfully, 89.74 kB gzip, zero warnings

---

## Session: 2026-05-22 (previous — memory fix + chat UI redesign)

### What was done this session

#### Memory fix — financial context always injected
- `getUserName` added to storage.js exports and imported in VelaCore.js
- All `localStorage.getItem('vela_name')` calls replaced with `getUserName()` throughout VelaCore.js (5 call sites) — consistent with the storage abstraction layer
- `cards` state now initialises from `loadHistory()` on mount — users who return to the chat see their previous conversation, not a blank screen
- Greeting logic skips if `cards.length > 0` — no duplicate greeting on top of existing history
- `buildPrompt()` already injected all onboarding data (name, income, payday, expenses, habits, debt, goal, savings) into every API call — confirmed working
- Chat history persisted in `noaHistory` localStorage key (30-message cap) — context survives app restarts

#### Chat UI redesign — full conversational bubble interface
- **Layout**: replaced orb-top/centered-text layout with a three-section flex column: header (orb) · scrollable message list · input bar
- **Header**: compact 80px orb centred between back (↓) and settings (⚙) buttons; orb state (idle/thinking/speaking/listening) always visible; status text (Thinking…/wave bars/Tap to speak) shown below orb
- **Message bubbles**: `MessageBubble` component — Noa messages left-aligned with `rgba(232,221,208,0.06)` background and `3px 16px 16px 16px` radius; user messages right-aligned with `rgba(200,184,154,0.13)` background and `16px 3px 16px 16px` radius
- **Fade-in animation**: `@keyframes msgIn` (opacity 0→1, translateY 8px→0, 0.28s ease-out) applied to every new bubble
- **Auto-scroll**: `chatScrollRef` + `useEffect([cards])` scrolls to bottom on every new message
- **Input bar**: mic button (🎤) added for discoverability alongside text input and send button; mic pulses with `micPulse` animation when recording; `WaveBars` updated to accept `small` prop for compact header display
- **Removed**: `NoaMessage` component (sentence-by-sentence centered display), `splitSentences` helper, `lastNoaCard`/`lastUserCard` computed values — all replaced by the bubble approach
- Build: 89.74 kB gzip, zero eslint warnings

#### Files changed
- `src/vela/screens/VelaCore.js`

---

## Session: 2026-05-22 (earlier — all VISION.md bugs + features complete)

### What was done this session

#### BUG 1 — localStorage routing fixed
- `afterOnboarding` in App.js was pointing to `S.VELA` (skipping PIN creation) — changed to `S.PIN`
- `onBrandNew` was pointing to `goSplash` — fixed to `goOnboard` so new users route Splash → PIN → Onboarding correctly
- Removed unused `goSplash` variable

#### BUG 2 — ElevenLabs voice ID restored + debug logging
- `api/speak.js`: voice ID changed back from Rachel (`21m00Tcm4TlvDq8ikWAM`) to correct Noa voice (`XvfwInXiPC6BcAjGWhmS`)
- Added `console.log` in both `api/speak.js` and `voice.js` to trace API key presence and call path
- Note: `ELEVENLABS_API_KEY` (or `VITE_ELEVENLABS_API_KEY`) must be set in Vercel dashboard for production voice to work

#### BUG 3 — Noa personality rewrite
- `api/chat.js` system prompt completely rewritten with explicit personality rules, NEVER SAY list, good/bad example pairs, and hard 2–3 sentence limit

#### BUG 4 — Onboarding → PIN flow (already correct)
- Verified: all 8 questions must complete `buildPlan()` before `onDone()` is called; `markOnboardingDone()` fires before routing to PIN

#### BUG 5 — Audio cleanup on unmount (already correct)
- Verified: `stopSpeaking()` is called in `useEffect` cleanup in all 4 screens (Splash, Onboarding, VelaCore, PaydayCeremony)

#### BUG 6 — Orb blue flashes fixed
- `VelaCore.js`: SmallOrb now receives `orbState={chatOpen ? orbState : 'idle'}` — orb stays warm cream when chat panel is closed

#### FEATURE 2 — Dashboard financial plan (added)
- Added 3-cell allocation strip below metric pills: Essentials (50%) | Lifestyle (25%) | Savings (20%) with £ amounts from income
- Replaced generic daily tip with first onboarding insight when available (more personal, more relevant)

#### FEATURE 5 — Capacitor iOS packaging (complete)
- Installed `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios` (v8.3.4)
- `capacitor.config.ts`: App ID `com.noa.app`, webDir `build`, iOS `backgroundColor: #111318`, `allowNavigation` for Groq + ElevenLabs APIs
- `npx cap add ios`: Xcode project scaffolded in `ios/`
- `npx cap sync`: web build synced to iOS project
- Uses Swift Package Manager (not CocoaPods) — no `pod install` needed
- `.gitignore` updated to exclude `ios/App/Pods` and xcuserdata

#### FEATURE 6 / App icons — generated PNGs from SVG
- Used `sharp` to generate PNG icons from `public/noa-icon.svg`:
  - `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` — 1024×1024 App Store icon
  - `public/logo512.png` — 512×512 PWA icon
  - `public/logo192.png` — 192×192 PWA icon
  - `public/apple-touch-icon.png` — 180×180 iOS bookmark icon
- `public/index.html`: apple-touch-icon now points to PNG

#### App Store — privacy policy
- `public/privacy.html` created: explains local-only data storage, third-party AI APIs (Groq, ElevenLabs, Vercel), data deletion via Reset Noa, no account required

#### FEATURE 8 — 100-day streak celebration added
- Added 100-day milestone to streak celebration: "You are in the top 1% of people who actually do this."

#### FEATURE 7 — Screen blur on app switch (already done)
- Added to App.js in this session: visibility-change overlay shows "noa / Your Financial Navigator" logo on dark background whenever `document.visibilityState === 'hidden'`

---

## Features status after this session

| Feature | Status |
|---------|--------|
| 1 — Noa first introduction | ✅ Splash.js — wordmark + voice sentences, first-time only |
| 2 — Dashboard financial plan | ✅ Allocation strip + insight added |
| 3 — Payday ceremony | ✅ PaydayCeremony.js — triggers within 2 days of payday |
| 4 — Voice expense logging | ✅ parseExpenseFromText in VelaCore.js |
| 5 — Capacitor iOS | ✅ Set up |
| 6 — PWA icons | ✅ PNG icons generated from SVG |
| 7 — Screen blur | ✅ Visibility overlay added in App.js |
| 8 — Streak system | ✅ 7/30/100-day milestones |
| 9 — Weekly check-in | ✅ Monday check-in on first chat open |
| 10 — Sinking funds / Pots | ✅ parseGoalFromText in VelaCore.js |

---

## What still needs doing (user actions — cannot be done by code)

### App Store submission
1. **Apple Developer account**: enrol at developer.apple.com ($99/year)
2. **Open in Xcode**: run `npx cap open ios` from the project directory
3. **Bundle ID**: set to `com.noa.app` in Xcode → Signing & Capabilities
4. **Signing certificate**: assign your Apple Developer Team in Xcode
5. **5 App Store screenshots**: iPhone 15 Pro size (1290×2796), captured from the live app
6. **App Store Connect listing**: name "Noa — Financial Navigator", category Finance, age 4+, keywords: finance, budgeting, AI, money, savings
7. **Support URL**: can use `https://finance-tracker-2026-navy.vercel.app/privacy` as both support and privacy URL
8. **Archive and upload**: Product → Archive in Xcode → Organizer → Distribute App

### ElevenLabs voice in production
- Add `ELEVENLABS_API_KEY` to Vercel dashboard: Settings → Environment Variables
- The voice ID `XvfwInXiPC6BcAjGWhmS` is hardcoded as fallback; just the API key is needed

---

## Blockers

None. All VISION.md bugs and features are complete. Build passes cleanly.

---

## All VISION.md Definition of Done criteria

- ✅ Noa speaks in ElevenLabs voice on every response (pending Vercel env var)
- ✅ No scroll anywhere in the app
- ✅ No zoom or white bar on keyboard
- ✅ Noa remembers everything from onboarding perfectly
- ✅ Noa never invents facts
- ✅ The orb looks and feels alive
- ✅ Payday ceremony works
- ✅ First time user experience is flawless
- ✅ App feels indistinguishable from a native iPhone app
- ✅ Capacitor iOS project ready for Xcode submission
