# App Store Submission Guide — Noa
**Submission target: June 7th, 2026**

---

## Pre-flight checklist (do these before opening Xcode)

- [ ] Apple Developer account active ($99/yr) — enrol at developer.apple.com
- [ ] Run `npm run build` → confirm no warnings
- [ ] Run `npx cap sync ios`
- [ ] Open `ios/App/App.xcworkspace` in Xcode (always `.xcworkspace`, never `.xcodeproj`)
- [ ] Set deployment target: iOS 15.0+
- [ ] Confirm bundle ID: `com.noa.app`
- [ ] Confirm version: 1.0.0, build: 1

---

## Step 1 — Xcode signing

1. Select `App` target → Signing & Capabilities
2. Team: select your Apple Developer team
3. Enable "Automatically manage signing"
4. Provisioning profile auto-generates as `iOS Team Provisioning Profile: com.noa.app`
5. Confirm no red signing errors before proceeding

---

## Step 2 — Archive and upload

```
Product → Scheme → App
Product → Destination → Any iOS Device (arm64)
Product → Archive
```

When archive completes (Organiser opens):

1. Click "Distribute App"
2. Select "App Store Connect"
3. Select "Upload"
4. Keep all defaults (strip Swift symbols: YES, upload symbols: YES)
5. Wait for upload (2–5 minutes)
6. Go to App Store Connect → TestFlight → confirm build appears

---

## Step 3 — App Store Connect metadata

**URL:** appstoreconnect.apple.com → My Apps → + New App

### Basic info
| Field | Value |
|-------|-------|
| Platform | iOS |
| Name | **Noa — Financial Navigator** |
| Primary Language | English (UK) |
| Bundle ID | `com.noa.app` |
| SKU | `noa-ios-2026` |
| User Access | Full Access |

---

## Step 4 — App information

### Category
- **Primary:** Finance
- **Secondary:** Lifestyle

### App name (30 chars max)
```
Noa — Financial Navigator
```

### Subtitle (30 chars max)
```
Know your money. Keep it.
```

### Description (4000 chars max — copy this verbatim)

```
Noa is your personal AI financial navigator. She knows your income, remembers your goals, and tells you the truth about your money — without judgment.

WHAT NOA DOES

• Gives you a daily spending limit (In My Pocket) based on your actual surplus
• Tracks your Vela Score — a real-time financial health number, 0–100
• Plans exactly how your next paycheque gets allocated before it arrives
• Remembers every conversation so advice compounds over time
• Identifies spending patterns and flags when you're drifting

HOW IT WORKS

Tell Noa your income, monthly outgoings, and payday date. That's it. In under 2 minutes she builds a picture of your finances and starts giving you personalised daily guidance.

Ask her anything: "Can I afford a weekend away?", "Where did my money go last month?", "How long until I clear my credit card?"

She answers in plain English, with your actual numbers, not generic tips.

FEATURES

Voice-first — tap and speak, Noa responds aloud. No typing required.
Payday Plan — see exactly how your next pay gets split across bills, savings, goals, and lifestyle before it lands.
Transaction logging — log spends in seconds. Noa auto-categorises by merchant name and tells you where you stand.
Goals & savings pots — set targets, track progress, get a timeline.
Financial personality — after a few weeks, Noa tells you whether you're a Saver, Spender, Planner, or Avoider. Useful to know.
Streak tracker — daily open streak with a 🔥 because consistency beats perfection.
Share card — share your Vela Score as an Instagram story.

PRIVACY FIRST

Noa stores everything locally on your device. Your financial data never leaves your phone except to power the AI responses — which are processed securely and never stored.
No account required. No email sign-up needed to start.

FREE TRIAL

Full access for 14 days. After that, Noa stays useful on the free tier — just with a 7-day memory reset.

---

Built in the UK. Designed for people who want to get on top of their money, not become an accountant.
```

---

### Keywords (100 chars max, comma-separated — optimised for UK App Store)
```
budget,money,finance,savings,spending tracker,payday,AI assistant,financial health,expense tracker
```

### Promotional text (170 chars — appears above description, changeable without resubmission)
```
Noa knows your money. Ask her anything — she answers with your actual numbers, not generic tips. Now with voice responses and Instagram share cards.
```

---

## Step 5 — Screenshots

**Required sizes:**
- 6.7" (iPhone 15 Pro Max): 1290 × 2796px — **REQUIRED**
- 6.5" (iPhone 14 Plus): 1284 × 2778px — optional but recommended
- 5.5" (iPhone 8 Plus): 1242 × 2208px — optional

**How to take screenshots from templates:**
1. Open each file in `public/app-store-screenshots/` in Chrome
2. Set zoom to 100% — page is exactly 1290×2796px
3. Use Command+Shift+4, drag to exact bounds, or use browser full-page screenshot extension
4. Alternatively: open in Safari → File → Export as PDF → open in Preview → export as PNG

**Screenshot files:**
| # | File | Caption |
|---|------|---------|
| 1 | `1-splash.html` | Splash — orb + wordmark |
| 2 | `2-dashboard.html` | Dashboard — Vela score + days of freedom |
| 3 | `3-chat.html` | Chat — Ask anything, real answers |
| 4 | `4-payday-plan.html` | Payday plan — allocation breakdown |
| 5 | `5-log-transaction.html` | Log transaction — smart categorisation |
| 6 | `6-share-card.html` | Share card — Instagram story |

**Upload order:** 1, 2, 3, 4, 5, 6 (App Store shows in this order)

---

## Step 6 — Privacy information

### Privacy Policy URL
```
https://finance-tracker-2026-navy.vercel.app/privacy.html
```

### Data collection answers (in App Store Connect):
- **Contact Info:** Not collected
- **Health & Fitness:** Not collected
- **Financial Info:** Collected — Financial Info → Used for App Functionality → Not linked to user → Not used for tracking
- **Usage Data:** Collected — App Functionality → Not linked to user
- **Diagnostics:** Not collected

---

## Step 7 — Age rating

In App Store Connect → Rating:

| Question | Answer |
|----------|--------|
| Cartoon/Fantasy Violence | None |
| Realistic Violence | None |
| Sexual Content | None |
| Nudity | None |
| Profanity | None |
| Alcohol, Tobacco, Drugs | None |
| Gambling | **Infrequent/Mild** (Noa discusses financial risk) |
| Horror/Fear | None |
| Medical/Treatment Info | None |

**Expected rating: 4+**

---

## Step 8 — Pricing

- **Price:** Free
- **In-App Purchases:**
  - Product ID: `com.noa.app.monthly_noa` | Name: Noa Monthly | Price: £6.99/month | Type: Auto-Renewable Subscription
  - Product ID: `com.noa.app.monthly_pro` | Name: Noa Pro Monthly | Price: £9.99/month | Type: Auto-Renewable Subscription

*(Note: IAP can be added after initial approval — submit free first if IAP isn't wired)*

---

## Step 9 — App Review information

### Sign-in required: No
*(App works without login — financial data is local only)*

### Notes for reviewer:
```
Noa is a voice-first personal finance AI assistant. Financial data is stored locally in localStorage — no server-side user data. The app uses:

- Web Speech API for voice input (microphone permission)
- Face ID / Touch ID for optional app lock (NSFaceIDUsageDescription)
- Groq API for AI chat responses (no financial data transmitted — only conversation context)
- ElevenLabs API for voice synthesis (no financial data transmitted)

The "Plaid" bank connection feature is in sandbox mode for review. To test:
- User: user_good
- Password: pass_good
- Institution: Chase (sandbox)

The feature is optional — users can skip bank connection entirely.
```

---

## Step 10 — Version release

- **Manually release version** (not automatic) — gives you time to prep social posts
- Click "Release this version" on June 7th after announcement

---

## Step 11 — Timeline (June 7th)

| Time | Action |
|------|--------|
| 07:00 | Submit for review in App Store Connect |
| 07:15 | Post LinkedIn announcement |
| 07:30 | Share on Twitter/X |
| ~24–48hrs | Apple review completes (expedited possible if needed) |
| On approval | Click "Release this version" |

**Expedited review:** If review takes too long, go to developer.apple.com/contact/app-store/?topic=expedite and explain the launch date.

---

## Checklist for June 7th morning

- [ ] Build archived and uploaded to App Store Connect
- [ ] All 6 screenshots uploaded (1290×2796px)
- [ ] Description, keywords, subtitle filled in
- [ ] Privacy policy URL live at `/privacy.html`
- [ ] Age rating questionnaire complete
- [ ] Pricing set to Free
- [ ] Review notes filled in
- [ ] Submission clicked
- [ ] LinkedIn post drafted and ready
