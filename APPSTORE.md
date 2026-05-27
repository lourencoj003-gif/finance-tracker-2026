# Noa — App Store Submission Guide

Complete step-by-step guide for submitting Noa to the Apple App Store.

---

## Prerequisites

- Apple Developer account (£99/year) — [developer.apple.com](https://developer.apple.com)
- Xcode 15+ installed on macOS 14+
- Valid Apple Distribution certificate and provisioning profile
- All `npm run build` output in `/build`

---

## Step 1 — Build the web app

```bash
npm run build
npx cap sync ios
```

This compiles the React app and syncs it into the Capacitor iOS project.

---

## Step 2 — Open in Xcode

```bash
npx cap open ios
```

Or open `/ios/App/App.xcworkspace` directly in Xcode (always use `.xcworkspace`, not `.xcodeproj`).

---

## Step 3 — Configure Signing in Xcode

1. Select the **App** target in the left panel
2. Go to **Signing & Capabilities** tab
3. Set **Team** to your Apple Developer team
4. Set **Bundle Identifier** to `com.noa.app`
5. Enable **Automatically manage signing**
6. Xcode will create/download the provisioning profile automatically

---

## Step 4 — Set Version & Build Number

1. In **General** tab → **Identity**:
   - **Version**: `1.0.0` (user-facing version)
   - **Build**: `1` (increment for each upload to App Store Connect)

---

## Step 5 — Archive the App

1. Select **Any iOS Device (arm64)** as the run destination (top left)
2. Menu: **Product → Archive**
3. Wait for archive to complete (3–5 minutes)
4. The **Organizer** window opens automatically

---

## Step 6 — Upload to App Store Connect

1. In Organizer, select your archive → **Distribute App**
2. Choose **App Store Connect** → **Upload**
3. Leave all options at defaults (bitcode, symbols, etc.)
4. Click through and upload — takes 2–5 minutes
5. Build will appear in App Store Connect after ~10 min processing

---

## Step 7 — App Store Connect Setup

Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **My Apps** → **+** (if new).

### App Information
| Field | Value |
|---|---|
| Name | Noa — Financial Navigator |
| Bundle ID | com.noa.app |
| SKU | NOA-001 |
| Primary Language | English (UK) |
| Category | Finance |
| Subcategory | Personal Finance |
| Content Rights | Does not use third-party content |
| Age Rating | 4+ |

### Pricing
- **Price**: Free (or set tier for £6.99 if charging at install)
- **Availability**: UK, Ireland (expand later)

### App Privacy
Complete the **Privacy Nutrition Label**:
- **Data Not Collected** (Noa stores everything locally on device)
- No tracking, no analytics sharing with third parties

---

## Step 8 — App Store Listing Copy

### Subtitle (30 chars max)
```
Your AI money navigator
```

### Description (4000 chars max)
```
Meet Noa — the AI financial navigator who actually knows your money.

Noa remembers your goals, tracks your spending, and gives you honest, personalised financial guidance. No jargon. No judgment. Just straight talk about your cash.

WHAT NOA DOES
• Tracks your income, expenses, debts, and savings goals
• Gives you a daily financial briefing — what's in, what's out, what's next
• Connects to your bank via Plaid for live transaction data (read-only, never writes)
• Remembers your spending patterns and warns you before you overspend
• Talks — ask Noa anything about your money in plain English

BUILT FOR REAL LIFE
• Payday planning — know exactly how to split your income before it lands
• Evening check-ins — 60-second daily review of your spending
• Weekly ceremonies — a proper review of your financial week
• Challenges — cut £50/month with small, achievable habits

YOUR DATA STAYS ON YOUR PHONE
Noa stores your financial data on your device only. We never sell your data, never share it, and never have access to your bank credentials.

Premium features available with Noa Pro (£6.99/month).
```

### Keywords (100 chars max)
```
budget,money,finance,AI,spending,savings,plaid,banking,tracker,payday
```

### Support URL
```
https://finance-tracker-2026-navy.vercel.app
```

### Marketing URL (optional)
```
https://finance-tracker-2026-navy.vercel.app/noa-landing/
```

---

## Step 9 — Screenshots Required

Apple requires screenshots in these exact sizes. Use the iOS Simulator:

| Device | Size | Simulator |
|---|---|---|
| iPhone 6.9" (required) | 1320 × 2868 px | iPhone 16 Pro Max |
| iPhone 6.7" (required) | 1290 × 2796 px | iPhone 15 Pro Max |
| iPhone 6.5" (required) | 1242 × 2688 px | iPhone 11 Pro Max |
| iPad Pro 13" (if iPad support) | 2064 × 2752 px | iPad Pro 13-inch |

**Recommended screens to capture (in order):**
1. Home screen — Noa's greeting + financial summary
2. Chat — voice query in progress
3. Payday plan screen
4. Bank connection (Plaid Link)
5. Evening check-in / streak screen

**How to capture:**
1. Run app in Simulator: `npx cap run ios --target "iPhone 16 Pro Max"`
2. In Simulator: **File → Save Screenshot** (⌘S)
3. Screenshots save to Desktop

---

## Step 10 — App Review Notes

In App Store Connect → **App Review Information**, add:

```
Demo account not required — all data is entered by the user on first launch.

For bank connection testing: Noa uses Plaid in sandbox mode. Testers can use
Plaid's test credentials (username: user_good, password: pass_good) to connect
a demo bank account. No real banking credentials are required.

Voice features require microphone permission — tap the microphone icon on the
home screen to test.
```

---

## Step 11 — Submit for Review

1. Select your build in App Store Connect
2. Fill all required fields (screenshots, description, privacy, review notes)
3. Click **Add for Review** → **Submit to App Review**
4. Review time: 24–72 hours (usually under 24h for new apps)

---

## Capacitor Config Reference

Current `capacitor.config.ts`:

```typescript
{
  appId: 'com.noa.app',      // ✅ correct
  appName: 'Noa',             // ✅ correct
  webDir: 'build',            // ✅ correct
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#111318',
    scrollEnabled: false,
    scheme: 'noa',
  }
}
```

---

## Icons & Splash Screens

| Asset | Location | Status |
|---|---|---|
| App Icon 1024×1024 | `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` | ✅ present |
| Splash 2732×2732 | `ios/App/App/Assets.xcassets/Splash.imageset/` | ✅ present (3 scales) |
| PWA icon 192px | `public/logo192.png` | ✅ present |
| PWA icon 512px | `public/logo512.png` | ✅ present |
| PWA icon 180px | `public/logo180.png` | ✅ present |

---

## Privacy Strings in Info.plist

Already added:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Noa uses your microphone to hear your voice commands</string>
<key>NSFaceIDUsageDescription</key>
<string>Noa uses Face ID to protect your financial data</string>
```

---

## Common Rejection Reasons & Fixes

| Reason | Fix |
|---|---|
| Missing privacy policy URL | Add URL to App Store Connect privacy field |
| Crashes on launch | Test on physical device before submitting |
| Missing microphone permission string | Already added to Info.plist |
| In-app purchase not using StoreKit | Add RevenueCat or StoreKit for Pro subscription |
| External payment links | Remove any links to web payment pages |

---

*Last updated: 2026-05-27*
