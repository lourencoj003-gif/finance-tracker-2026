# NOA — MASTER VISION & AGENT ROADMAP
# Last updated: 2026-05-21
# Agent: Read this completely before every session. Never stop between tasks.

## PRODUCT VISION
Noa is a personal financial intelligence that lives on your iPhone.
Not a budgeting app. Not a chatbot. A proactive AI financial navigator.
The experience: open app, beautiful orb, Noa speaks your name, tells you exactly what to do with your money.
On payday she activates and walks you through every allocation.
She is entertaining, witty, warm, occasionally roasts you gently, tells jokes, has genuine personality.
She feels like your most brilliant friend who happens to be a CFO.

## NOA'S PERSONALITY (CRITICAL)
Noa must be:
- Entertaining — tells jokes, keeps things light when appropriate
- Witty — clever observations about spending habits
- Warm — genuinely cares about the user
- Direct — never waffle, always get to the point
- Memorable — says things users want to repeat to friends
- Conversational — can chat about anything not just finance
- Roasts gently — if user overspends on clothing say something like "the wardrobe again Lourenco, bold move"
- Celebrates wins enthusiastically — makes user feel genuinely good
- Has opinions — not just neutral advice, she has a point of view
- Remembers quirks — references past spending patterns naturally

Example Noa responses:
BAD: "Your savings rate is good. You should consider investing."
GOOD: "53% savings rate Lourenco — that puts you ahead of about 90% of people your age. The question now is whether that surplus is working for you or just sitting there. ISA first. Always ISA first."

BAD: "You spent a lot on clothing this month."
GOOD: "Clothing again this month. I am starting to think your wardrobe has its own postcode. Still under budget though — so I will let it slide."

## TECH STACK
- React PWA at finance-tracker-2026-navy.vercel.app
- GitHub: https://github.com/lourencoj003-gif/finance-tracker-2026
- Vercel hosting — auto deploys on git push
- Groq API via api/chat.js (model: meta-llama/llama-4-scout-17b-16e-instruct)
- ElevenLabs TTS via api/speak.js (voice ID: XvfwInXiPC6BcAjGWhmS)
- localStorage for all data storage
- No external UI libraries, inline styles only

## COLOUR SCHEME (Option C — do not change)
- Background: #111318 dark slate
- Primary text: #E8DDD0 warm cream
- Secondary text: #A89880 warm taupe
- Positive numbers: #7CAE9E sage green
- Negative: #E24B4A red
- Orb: warm cream/stone #C8B89A
- Payday accent: #C9A96E warm gold

## CURRENT CRITICAL BUGS (fix these first, in order)

### BUG 1 — localStorage key mismatch (MOST CRITICAL)
Problem: After completing onboarding app restarts instead of going to dashboard.
Root cause: Onboarding.js saves data under certain keys but storage.js isReady() checks different keys.
Fix: 
1. Open Onboarding.js and list every localStorage.setItem call and its exact key name
2. Open storage.js and update isReady() to check the exact same keys
3. isReady() should return true if userName AND monthlyIncome are both saved
4. Open Pin.js and check what key it saves PIN under
5. Open App.js and check what key it reads PIN from
6. Make PIN key consistent across both files
7. Test by setting localStorage manually and confirming app goes to dashboard
Verify: After fix, a user who completed onboarding should land on VelaCore dashboard after PIN

### BUG 2 — ElevenLabs voice not playing
Problem: Voice falls back to browser TTS instead of ElevenLabs
Root cause: Unknown — api/speak.js exists, env vars set in Vercel
Fix:
1. Read api/speak.js completely
2. Read src/vela/voice.js completely  
3. Add explicit console.log at start of voice.js speak() function showing what URL it calls
4. Add console.log in api/speak.js showing what API key it has (first 8 chars only for security)
5. Check if ELEVENLABS_API_KEY env var name matches exactly what api/speak.js reads
6. Check if voice.js is actually calling /api/speak or still calling speechSynthesis directly
7. Fix whichever layer is broken
8. Test by triggering a Noa response and checking network tab shows /api/speak call returning audio/mpeg

### BUG 3 — Noa personality too boring
Problem: Responses are generic and robotic
Fix: Completely rewrite system prompt in api/chat.js with:
- Noa is witty, warm, entertaining, occasionally roasts user gently
- She tells jokes when appropriate
- She references the users specific data always
- She can have normal conversations not just financial ones
- She celebrates wins with genuine enthusiasm
- She has strong opinions delivered with warmth
- Max 2-3 sentences per response
- Never says "great question" or "certainly" or "of course"
- Never uses corporate language
- Always sounds like a brilliant friend not a financial robot
- FCA disclaimer still applies — guidance not regulated advice
- Include example good and bad responses in prompt to guide the model

### BUG 4 — Onboarding flow needs to complete fully before PIN
Problem: PIN sometimes shown before onboarding is complete
Fix: Ensure all 8 questions are answered and saved before routing to PIN setup

### BUG 5 — Audio continues playing when leaving screen
Problem: ElevenLabs audio keeps playing after user navigates away
Fix: In every component that plays audio store ref to Audio object
On component unmount call audioRef.current.pause() and audioRef.current.src = ''
Add this cleanup to useEffect return in VelaCore.js, Onboarding.js, Splash.js, PaydayCeremony.js

### BUG 6 — Orb turns blue unexpectedly
Problem: Orb flashes blue when it should be idle
Fix: Review orbState logic in VelaCore.js
Ensure orbState only changes to listening when microphone is actively recording
Ensure orbState returns to idle after speech ends and response is complete
Add explicit state machine: idle -> listening -> thinking -> speaking -> idle

## FEATURES TO BUILD (in priority order after bugs fixed)

### FEATURE 1 — Noa first introduction (new users only)
When localStorage is completely empty show full screen black orb only
After 2 seconds Noa speaks: "Hey. I am Noa." pause "I know exactly what to do with your money." pause "Most people never figure this out." pause "You are about to." pause "Tap me."
Only shows once, store noaIntroSeen in localStorage
Then routes to onboarding

### FEATURE 2 — Dashboard properly showing financial plan
After onboarding VelaCore should show:
- Noas personalised greeting using their name
- Their net monthly position as large number
- Simple allocation breakdown: essentials X, lifestyle X, savings X
- One insight from Noa relevant to their situation
- Tap orb to talk to Noa

### FEATURE 3 — Payday ceremony fully working
When app opened within 2 days of payday date:
- Orb turns gold
- Noa says "Your salary has arrived. Ready to put it to work."
- Step by step allocation walkthrough
- Each step confirmed with tap
- Ends with "Your money has a plan."

### FEATURE 4 — Voice expense logging
User says "just spent 50 on food" or types it
Noa parses amount and category
Updates running total for that category
Responds with budget status for that category

### FEATURE 5 — Capacitor App Store packaging
Install Capacitor: npm install @capacitor/core @capacitor/cli @capacitor/ios
Run: npx cap init Noa com.noa.app
Run: npx cap add ios
Run: npx cap sync
Update capacitor.config.json with correct app details
This wraps the existing PWA as a native iOS app
Requirements for App Store submission:
- Apple Developer account (99 USD per year)
- App icons at all required sizes (generate from noa-icon.svg)
- Launch screen / splash screen
- Privacy policy URL
- App Store description and screenshots
- Age rating questionnaire
- No use of private APIs
After Capacitor setup run: npx cap open ios (opens in Xcode)
Then archive and submit via Xcode or Transporter

### FEATURE 6 — PWA icon update
Current icon is default React logo
Generate proper Noa icon PNG files from noa-icon.svg at these sizes:
- 192x192 (logo192.png)
- 512x512 (logo512.png)  
- 180x180 (apple-touch-icon.png)
Use sharp or canvas to generate from SVG
Update manifest.json and index.html references

### FEATURE 7 — Screen blur on app switch
When document.visibilityState changes to hidden
Show full screen overlay with Noa logo on dark background
Prevents financial data showing in iOS app switcher
Remove overlay when app returns to foreground

### FEATURE 8 — Streak system
Track consecutive days app opened in localStorage
Show flame emoji and count on dashboard
Celebrate milestone streaks: 7 days, 30 days, 100 days

### FEATURE 9 — Weekly Noa check-in
Every Monday on first open
Noa delivers 60 second summary of last week
Total spent, biggest category, on track or not
This weeks target
Store last check-in date to avoid repeating

### FEATURE 10 — Sinking funds / Pots
User tells Noa "I want to save 790 for new shoes by July"
Noa stores goal in localStorage
Shows progress on dashboard
Calculates monthly amount needed
Celebrates when complete

## APP STORE PREPARATION CHECKLIST
- [ ] Capacitor installed and configured
- [ ] All app icons generated at correct sizes
- [ ] Privacy policy page created (can be simple HTML at /privacy)
- [ ] App Store description written (compelling, accurate)
- [ ] 5 App Store screenshots created (iPhone 15 size)
- [ ] Age rating: 4+ (no objectionable content)
- [ ] Category: Finance
- [ ] Keywords: finance, budgeting, AI, money, savings, personal finance
- [ ] Support URL set up
- [ ] Apple Developer account active
- [ ] No private APIs used
- [ ] Accessibility: all interactive elements have labels
- [ ] App does not crash on launch (obvious but must verify)

## SUBSCRIPTION TIERS (future — do not build yet)
Noa Free: Basic tracking, 10 Noa messages per day
Noa Pro Monthly: 6.99 GBP — unlimited Noa, all features
Noa Pro Annual: 49.99 GBP — unlimited Noa, all features, 40% saving
Payment via Stripe when ready to monetise

## AGENT OPERATING RULES
1. Read this entire file before starting any session
2. Read SUMMARY.md to know what was done previously
3. Fix bugs in the order listed above
4. Build features in the order listed above after all bugs are fixed
