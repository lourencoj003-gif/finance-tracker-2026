# MONDAY — Launch Checklist
*Aldric Group · Complete launch checklist for going live as a social media agency*

---

## ☐ PRE-LAUNCH — Do Before Anything Goes Live

### Domain & Hosting
- [ ] Purchase `aldricgroup.co.uk` (or `.com`) — Namecheap / GoDaddy / Cloudflare Registrar (~£12/yr)
- [ ] Point DNS to Netlify (A record `75.2.60.5`, CNAME `www → [netlify-subdomain].netlify.app`)
- [ ] Enable HTTPS (auto via Netlify Let's Encrypt — takes ~10 mins after DNS propagates)
- [ ] Test all pages load at the custom domain (no 404s, no mixed-content warnings)
- [ ] Set up `www` → apex redirect (or apex → `www`) — choose one canonical form
- [ ] Add `robots.txt` and `sitemap.xml` (can use Netlify redirect for sitemap to static file)

### Email Setup
- [ ] Create professional email via Google Workspace (~£5.20/mo) or Zoho Mail (free tier)
  - Primary: `hello@aldricgroup.co.uk`
  - Alias: `anthony@aldricgroup.co.uk`
- [ ] Verify domain ownership with email provider (TXT record)
- [ ] Set SPF record: `v=spf1 include:_spf.google.com ~all` (or Zoho equivalent)
- [ ] Set DKIM record (provided by email provider — paste into DNS)
- [ ] Set DMARC record: `v=DMARC1; p=none; rua=mailto:hello@aldricgroup.co.uk`
- [ ] Test deliverability via mail-tester.com — aim for 10/10
- [ ] Update all `mailto:` links on the website to the live email address

### Netlify Deployment
- [ ] Connect GitHub repo to Netlify (Site → Import from Git)
  - Build command: `npm run build`
  - Publish directory: `build`
- [ ] Set environment variables in Netlify dashboard (Settings → Environment Variables):
  - `REACT_APP_VAPID_PUBLIC_KEY`
  - `GROQ_API_KEY` (server-side only — Netlify Functions if needed)
  - `ELEVENLABS_API_KEY` (server-side only)
  - Any other server-side keys
- [ ] **NEVER** expose `PLAID_CLIENT_ID`, `PLAID_SECRET`, or API keys in client-side build vars
- [ ] Enable Netlify Forms on any contact forms (add `netlify` attribute to `<form>` tags)
- [ ] Test deploy preview on Netlify preview URL before going live
- [ ] Set up deploy notifications (email on deploy fail)
- [ ] Enable branch deploys for `main` only (prevent accidental production deploys from feature branches)

### Analytics & Tracking
- [ ] Create Google Analytics 4 property for `aldricgroup.co.uk`
- [ ] Add GA4 tracking snippet to `public/index.html` (or Netlify plugin)
- [ ] Set up Google Search Console — verify via DNS TXT record
- [ ] Submit sitemap to Search Console
- [ ] Create Hotjar (or Microsoft Clarity — free) account for session recordings
- [ ] Set up a simple Google Sheet for manual lead tracking until CRM is needed

---

## ☐ LINKEDIN PROFILE OPTIMISATION

### Personal Profile (Anthony)
- [ ] Professional headshot (plain background, suit or smart casual, natural light)
- [ ] Background banner (1584×396px) — Aldric Group branding, tagline, website URL
- [ ] Headline: `Helping UK [niche] businesses grow with done-for-you social media | Aldric Group`
- [ ] Summary (About section, 300+ words):
  - Open with pain point: "Most [niche] businesses lose leads because their social presence doesn't match their reputation."
  - Your story — what you saw working in financial services/insurance
  - What Aldric Group does + who it's for
  - Social proof placeholder (replace with real once you have it): "Working with [X] clients across [niches]"
  - CTA: "DM me or visit aldricgroup.co.uk for a free consultation call"
- [ ] Featured section: Link to website + add 1–2 content samples (screenshots of posts or results)
- [ ] Skills: Social Media Marketing, Content Strategy, Lead Generation, LinkedIn Marketing, Instagram Marketing, Digital Marketing, B2B Marketing, Financial Services Marketing, Professional Services
- [ ] Get 5+ recommendations (ask former colleagues/connections now)
- [ ] Connect with 50+ relevant prospects before launch (estate agents, mortgage brokers, IFAs in your area)
- [ ] Turn on "Open to" → Finding clients (Creator mode)
- [ ] Set profile to Public

### Aldric Group Company Page
- [ ] Create LinkedIn Company Page at `linkedin.com/company/aldric-group`
- [ ] Logo (400×400px): Aldric Group mark on `#080808` background
- [ ] Banner (1128×191px): tagline + website
- [ ] About section (250 chars): concise value prop — "Done-for-you social media management for UK professional services firms. We build your brand, generate leads, and free you to focus on your clients."
- [ ] Website: `https://aldricgroup.co.uk`
- [ ] Industry: Marketing & Advertising
- [ ] Company size: 1–10 employees
- [ ] Post 3 pieces of content before launch (see Content Calendar below) so the page isn't empty

---

## ☐ FIRST WEEK SCHEDULE (Days 1–7)

### Day 1 — Monday (Go Live)
- [ ] Deploy site to custom domain (confirm HTTPS, all pages working)
- [ ] Announce on LinkedIn personal profile: "I'm launching Aldric Group today…" (tell your story, no hard sell)
- [ ] Email 10 warm contacts (not cold): tell them what you're doing, ask if they know anyone who'd benefit
- [ ] DM 5 LinkedIn connections who are in target niches — genuine catch-up, no pitch yet
- [ ] Post on Aldric Group company page: "Day 1 — here's why I started Aldric Group"
- [ ] Set `aldric_outreach_start` in localStorage to today (starts 7-day outreach plan)

### Day 2 — Tuesday
- [ ] Cold outreach batch 1: 20 DMs via `agency/automation.html` — estate agents in [your city]
- [ ] Engage with 15 posts from target prospects (comments, not just likes) — 30 min
- [ ] Create + schedule 3 pieces of "proof of concept" content for Aldric Group page
- [ ] Check follow-up reminders in automation dashboard — respond to any Day 2 replies

### Day 3 — Wednesday
- [ ] Cold outreach batch 2: 20 DMs — mortgage brokers
- [ ] LinkedIn article: "5 reasons [your niche] firms lose clients on social media" (thought leadership)
- [ ] Follow-up on Day 1 DMs that opened but didn't reply
- [ ] Schedule 1 discovery call if anyone has booked/replied positively

### Day 4 — Thursday
- [ ] Call day: reach out to 5 warm leads by phone/voice note DM (more personal than text)
- [ ] Post: behind-the-scenes "how we build a content calendar" (process post — builds credibility)
- [ ] Cold outreach: 5 personalised LinkedIn notes (quality over quantity today)

### Day 5 — Friday
- [ ] Cold outreach batch 3: 20 DMs — IFAs / accountancies
- [ ] Engage 15 prospects' posts (comments, thoughtful responses)
- [ ] Review week: how many DMs sent, responses, calls booked, warm leads
- [ ] Update `aldric_crm_v2` with all leads from the week

### Day 6 — Saturday
- [ ] Content creation day: write/film/design 5–7 posts for next week
- [ ] Schedule content for client pages (if first client onboarded)
- [ ] Review engagement metrics (LinkedIn: profile views, post impressions)
- [ ] Prep for any discovery calls booked for next week (use `axontra/discovery.html`)

### Day 7 — Sunday
- [ ] Week 1 review: total DMs, reply rate, calls booked, leads in pipeline
- [ ] Write Week 2 plan (adjust niche targets based on response rates)
- [ ] Respond to any outstanding DMs / follow-ups
- [ ] Set `aldric_outreach_start` to reset if starting a new 7-day sprint

---

## ☐ CLIENT ONBOARDING CHECKLIST

*Use alongside `agency/client-setup.html` for the digital workflow*

### Signed & Admin
- [ ] Send proposal (use results-simulator to build it) — include pricing, deliverables, timeline
- [ ] Contract signed (use a simple 1-page agreement or Docusign) — include:
  - Scope of work (posts/month, platforms, format)
  - Revision policy (max 2 rounds per post)
  - Payment terms (invoice 1st of month, 14 days net)
  - 30-day cancellation clause
  - IP ownership (client owns final content)
- [ ] Invoice raised for first month (use Wave, FreeAgent, or QuickBooks — free tiers available)
- [ ] Add to `aldric_crm_v2` with status "Active Client"

### Brand Brief (via `agency/client-setup.html` Step 1)
- [ ] Business name, website, tagline
- [ ] Target customer profile (age, profession, location, pain points)
- [ ] Brand voice (professional/approachable/authoritative/friendly — pick 3 adjectives)
- [ ] Competitor references (who does good content in their space?)
- [ ] Content restrictions (anything they can't mention — regulatory, legal, personal)
- [ ] Logo + brand colours (ask for brand guidelines if they exist)
- [ ] Login details for their social accounts (use LastPass or 1Password for secure sharing)

### Content Setup
- [ ] 30-day content calendar generated (Step 2 of client-setup.html)
- [ ] First 5 posts drafted and approved by client (Step 3)
- [ ] Profile optimised (bio, profile pic, highlights if Instagram, pinned post)
- [ ] Scheduling tool set up (Buffer free tier, Later, or Metricool)
- [ ] Client added as admin/collaborator on scheduling tool

### Launch
- [ ] Welcome email sent to client (Step 5 of client-setup.html)
- [ ] Client onboarding call scheduled (30 mins — walk through calendar, approval process, communication cadence)
- [ ] First post published (with client approval)
- [ ] Reporting template set up: monthly Google Sheet or Notion page with key metrics

---

## ☐ FINANCIAL SETUP

- [ ] Open a dedicated business bank account (Tide, Monzo Business, or Starling — all free)
- [ ] Set up Wave Accounting (free) or FreeAgent (£12/mo) for invoicing + expenses
- [ ] Register as a sole trader with HMRC (free, do it at gov.uk/set-up-sole-trader) — required if earning above the trading allowance (£1,000/yr)
- [ ] Keep receipts for all business expenses (software, domain, tools — all deductible)
- [ ] Pricing structure confirmed:
  - Starter: £500/mo (3 posts/wk, 1 platform, monthly report)
  - Growth: £900/mo (daily posts, 2 platforms, engagement management, monthly report)
  - Scale: £1,500/mo (everything + 2 short-form videos/mo, ad copy, strategy call)

---

## ☐ TOOLS STACK (Confirm Accounts Created)

| Tool | Purpose | Cost | Status |
|------|---------|------|--------|
| Netlify | Hosting | Free | ☐ |
| Google Workspace | Email | £5.20/mo | ☐ |
| GA4 | Analytics | Free | ☐ |
| Buffer / Metricool | Scheduling | Free tier | ☐ |
| Canva Pro | Design | £10.99/mo | ☐ |
| ChatGPT / Claude | Content assist | £16–20/mo | ☐ |
| Wave / FreeAgent | Invoicing | Free / £12 | ☐ |
| Calendly | Booking | Free | ☐ |
| Notion | Internal ops | Free | ☐ |
| LinkedIn Sales Nav | Prospecting | £69/mo (trial) | ☐ |

---

## ☐ FIRST CLIENT TARGET

*Aim: first paid client within 14 days of launch*

- Niche shortlist (rank by response rate from Week 1 outreach): _______________
- Target location: _______________
- Minimum contract value: £500/mo
- Discovery calls booked: _______________
- Proposal stage: _______________
- **Deadline: close first client by **: _______________

---

## ✅ LAUNCH CONFIDENCE CHECKLIST

Before announcing publicly, confirm all of these:

- [ ] Website live at custom domain with HTTPS
- [ ] Professional email working (send + receive test)
- [ ] LinkedIn personal profile fully optimised
- [ ] Company page has ≥3 posts
- [ ] All agency tool pages working (automation, CRM, email-gen, client-setup, discovery-call)
- [ ] Outreach system tested (generate → copy → send at least 1 message end-to-end)
- [ ] Pricing confirmed and proposal template ready
- [ ] Contract template ready
- [ ] Invoicing tool set up
- [ ] Business bank account open

---

*Last updated: 2026-05-29 | Use `agency/automation.html` to run daily outreach after launch*
