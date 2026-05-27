# Aldric Group — Website

Static HTML/CSS website for Aldric Group, an AI marketing agency.

---

## Deploying to Netlify (Recommended)

### Option A — Netlify Drop (instant, no account needed)
1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**
2. Drag and drop the **`agency/`** folder onto the page
3. Netlify generates a live URL (e.g. `https://random-name.netlify.app`) instantly
4. Share the link or continue to connect a custom domain

### Option B — Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --dir=public/agency --prod
```

### Option C — GitHub Integration
1. Push this repo to GitHub
2. Log in to Netlify → **New site from Git**
3. Set **Publish directory** to `public/agency`
4. Leave Build command blank (pure static)
5. Deploy

---

## Connecting Custom Domain (aldricgroup.co.uk)

1. In Netlify dashboard → **Site settings → Domain management → Add custom domain**
2. Enter `aldricgroup.co.uk`
3. In your DNS provider (e.g. GoDaddy, Namecheap, Cloudflare):
   - Add a **CNAME** record: `www` → `your-site-name.netlify.app`
   - Add an **A record**: `@` → `75.2.60.5` (Netlify's load balancer IP)
4. Enable **HTTPS** in Netlify (free Let's Encrypt cert, auto-renews)
5. Set `aldricgroup.co.uk` as the primary domain

DNS propagation takes 1–48 hours.

---

## Environment Variables

This is a pure static site — **no environment variables needed** for the website itself.

The only secret is the **Anthropic API key** for the AI Agent System:
- It lives in the browser's `localStorage` (key: `aldric_claude_key`)
- The user enters it at `acquisition/agent-system.html`
- It is **never sent to any server except api.anthropic.com directly**
- No backend required

---

## File Structure

```
agency/
├── index.html              ← Main website (homepage + all sections)
├── case-studies.html       ← Client results and case studies
├── pilot.html              ← 14-day pilot sprint details
├── pitch.html              ← Sales pitch deck
├── crm.html                ← Client CRM tracker
├── kpi.html                ← KPI tracking dashboard
├── contract.html           ← Contract generator
├── onboarding.html         ← Client onboarding form
├── sales-call.html         ← Sales call framework
├── README.md               ← This file
└── acquisition/
    ├── agent-system.html   ← AI Agent Execution System (all 5 Claude agents)
    ├── seven-day-plan.html ← 7-day acquisition plan
    ├── outreach-system.html← LinkedIn SDR outreach system
    ├── automation.html     ← Automation safety framework
    └── retention.html      ← Client retention system
```

---

## Internal Links Audit

All internal links verified as of 2026-05-27:

| Link | Target | Status |
|---|---|---|
| case-studies.html | Client case studies page | ✅ |
| pilot.html | Pilot sprint page | ✅ |
| crm.html | CRM dashboard | ✅ |
| kpi.html | KPI tracker | ✅ |
| contract.html | Contract generator | ✅ |
| onboarding.html | Onboarding form | ✅ |
| sales-call.html | Sales call framework | ✅ |
| acquisition/agent-system.html | AI agent execution | ✅ |
| acquisition/seven-day-plan.html | 7-day plan | ✅ |
| acquisition/outreach-system.html | SDR system | ✅ |
| acquisition/automation.html | Automation safety | ✅ |
| acquisition/retention.html | Retention system | ✅ |

---

## Open Graph Tags

Already added to `index.html`. To update the OG image:
1. Create a 1200×630px image (PNG or JPG)
2. Upload it to your domain as `https://aldricgroup.co.uk/og-image.png`
3. The meta tags will pick it up automatically

---

## Google Analytics

GA4 tracking code is in `index.html` as a commented block. To activate:
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a new GA4 property for `aldricgroup.co.uk`
3. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)
4. In `index.html`, uncomment the GA block and replace `G-XXXXXXXXXX`

---

*Aldric Group — Intelligent marketing. Built to scale.*
