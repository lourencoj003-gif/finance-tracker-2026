# NOA — PRODUCT VISION DOCUMENT
*This is the living brain of the Noa project. The autonomous agent reads this every morning before doing anything.*

## WHAT NOA IS
Noa is a JARVIS-style AI financial navigator. Not a budgeting app. Not a chatbot. A proactive financial intelligence that lives on your iPhone and tells you exactly what to do with your money.

The user taps a living planet orb to speak to Noa. Noa responds with a premium ElevenLabs voice. The experience should feel like having a private CFO in your pocket.

## CORE DESIGN LANGUAGE
- Background: #111318 dark slate
- Primary text: #E8DDD0 warm cream
- Positive numbers: #7CAE9E sage green
- Secondary text: #A89880 warm taupe
- Negative/debt: #E24B4A red
- Payday accent: #C9A96E warm gold
- Font: system-ui, thin weights 300-400
- No clutter. No noise. Every pixel intentional.

## THE ORB
The orb IS Noa. It is her face. It must feel alive.
Option A Living Planet design:
- Outer atmospheric glow
- Two slowly counter-rotating orbital rings
- Planet surface radial gradient light to dark
- Two blurred atmospheric bands
- Five small dots slowly orbiting
- Soft outer corona glow
States: idle=slow rotation, listening=blue rings accelerate, thinking=surface darkens, speaking=rings pulse outward, payday=warm gold, debt=deep red

## NOA'S PERSONALITY
She is the intersection of:
- Warren Buffett's clarity
- Morgan Housel's warmth
- Ramit Sethi's directness
- Martin Lewis's UK practicality
- A brilliant friend who happens to have a CFO brain

She NEVER:
- Invents statistics or demographics she does not know
- Repeats herself
- Says generic things
- Says great question
- Assumes age, background or lifestyle

She ALWAYS:
- References exact pound amounts from user data
- Gives advice so specific it feels like it was written only for this person
- Ends with a specific action or question
- Speaks in max 2 sentences unless doing a full breakdown
- Addresses user by their first name naturally

## FINANCIAL INTELLIGENCE FRAMEWORK
Noa masters these frameworks and applies them to each user:
1. Baby Steps UK version - emergency fund first, then debt, then invest
2. 50/30/20 rule adapted for debts and goals
3. Payday routine - every pound allocated before it can be spent
4. Envelope method - every pound has a job
5. Compound interest projections at 7% growth
6. Debt avalanche vs snowball based on user situation
7. ISA and SIPP tax wrapper optimisation
8. The one number - days of financial freedom

## USER DATA STRUCTURE
All stored in localStorage:
- userName
- monthlyIncome
- paydayDate
- fixedExpenses (object with categories and amounts)
- spendingHabits
- totalDebt
- debtInterestRate
- financialGoal
- currentSavings
- noaHistory (last 30 messages)

## TECH STACK
- React PWA
- Vercel hosting at finance-tracker-2026-navy.vercel.app
- Groq API via api/chat.js (model: meta-llama/llama-4-scout-17b-16e-instruct)
- ElevenLabs TTS via api/speak.js (voice ID: XvfwInXiPC6BcAjGWhmS)
- localStorage for all data
- No external UI libraries
- Inline styles only

## CURRENT STATUS
### Working:
- PIN login
- Onboarding questionnaire (needs improvement)
- Home dashboard with orb
- Basic Noa chat via Groq
- Vercel deployment pipeline
- PWA installable on iPhone

### NOT Working / Needs fixing:
- ElevenLabs voice not connected (still using browser TTS)
- Chat UI still shows old scrollable box
- Noa memory unreliable between sessions
- System prompt inventing statistics
- Onboarding walkthrough incomplete
- Living planet orb not fully implemented
- iOS keyboard causes layout shift
- Voice and text not in sync

## PRIORITY ORDER FOR AGENT
Fix in this exact order:
1. ElevenLabs voice integration
2. iOS keyboard and scroll fixes
3. Chat UI redesign - no scroll, sentence by sentence
4. Memory - inject all onboarding data every call
5. System prompt intelligence upgrade
6. Living planet orb Option A
7. Personalised post-onboarding walkthrough
8. Payday ceremony
9. Overall polish and consistency

## DEFINITION OF DONE
The app is complete when:
- Noa speaks in ElevenLabs voice on every response
- No scroll anywhere in the app
- No zoom or white bar on keyboard
- Noa remembers everything from onboarding perfectly
- Noa never invents facts
- The orb looks and feels alive
- Payday ceremony works
- First time user experience is flawless
- App feels indistinguishable from a native iPhone app
