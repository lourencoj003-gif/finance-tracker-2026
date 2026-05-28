# DEPLOYMENT GUIDE

Complete deployment reference for all three businesses. Last updated: 2026-05-28.

---

## 1. Noa — Personal Finance App

**Platform:** Vercel (React SPA)  
**Live URL:** `https://noa.app` (or Vercel project URL until domain is pointed)  
**Build command:** `npm run build`  
**Output directory:** `build`

### Environment Variables (set in Vercel dashboard → Settings → Environment Variables)

| Variable | Description | Required |
|---|---|---|
| `GROQ_API_KEY` | Groq API key for Noa's AI chat (Llama / Mixtral) | ✅ |
| `ELEVENLABS_API_KEY` | ElevenLabs for voice responses (if enabled) | Optional |
| `PLAID_CLIENT_ID` | Plaid Open Banking — client ID | Optional |
| `PLAID_SECRET` | Plaid Open Banking — secret key | Optional |
| `REACT_APP_VAPID_PUBLIC_KEY` | Push notification public key | Optional |
| `VAPID_PRIVATE_KEY` | Push notification private key (server-side only) | Optional |

> **Security rule:** All keys are server-side only. `GROQ_API_KEY` is called via a serverless function — it is never exposed to the browser.

### Deploy steps

1. Connect repo to Vercel (import from GitHub)
2. Set environment variables above
3. Set Node.js version to **20.x** in Vercel project settings → General
4. Deploy — Vercel auto-builds on every push to `main`

### Notes

- `.npmrc` must contain `legacy-peer-deps=true` — already committed; do not delete
- `typescript@4.9.5` is pinned via `overrides` in `package.json` — react-scripts 5 requires `^3.2.1 || ^4`
- Capacitor iOS build is separate — see `APPSTORE.md` for App Store submission

---

## 2. Aldric Group — AI Marketing Agency

**Platform:** Netlify Drop (static HTML)  
**Live URL:** `https://aldricgroup.co.uk`  
**Files:** `public/agency/` directory

### Deploy steps

1. Open [app.netlify.com](https://app.netlify.com)
2. Drag and drop the entire `public/agency/` folder onto the Netlify Drop zone
3. Netlify assigns a random `.netlify.app` URL
4. Connect domain: **Sites → Domain management → Add custom domain → `aldricgroup.co.uk`**

### DNS setup (at domain registrar)

```
Type    Name    Value
A       @       75.2.60.5          (Netlify load balancer)
CNAME   www     [your-site].netlify.app
```

Wait 15–60 min for propagation. Netlify provisions SSL automatically.

### Key files

| File | Purpose |
|---|---|
| `public/agency/index.html` | Main landing page |
| `public/agency/crm.html` | Internal CRM dashboard (password: share with team only) |
| `public/agency/acquisition/agent-system.html` | AI agent system (5 Claude-powered components) |
| `public/agency/og-image.png` | Social preview image (1200×630) |

### Agent system (agent-system.html)

- Requires an Anthropic API key — entered by the user in the UI, saved to `localStorage` as `aldric_claude_key`
- API key is **never sent anywhere except `api.anthropic.com`**
- No backend required — direct browser API calls via `anthropic-dangerous-direct-browser-access: true`
- Model: `claude-sonnet-4-6`

---

## 3. Axontra Partners — Operations Consultancy

**Platform:** Netlify Drop (static HTML)  
**Live URL:** `https://axontrapartners.co.uk`  
**Files:** `public/axontra/` directory

### Deploy steps

1. Open [app.netlify.com](https://app.netlify.com)
2. Drag and drop the `public/axontra/` folder onto the Netlify Drop zone
3. Connect domain: **Sites → Domain management → Add custom domain → `axontrapartners.co.uk`**

### DNS setup (at domain registrar)

```
Type    Name    Value
A       @       75.2.60.5
CNAME   www     [your-site].netlify.app
```

### Key files

| File | Purpose |
|---|---|
| `public/axontra/index.html` | Main landing page |
| `public/axontra/og-image.png` | Social preview image (1200×630) |

### Enquiry storage

- Contact form submissions are saved to `localStorage` as `axontra_enquiries` (JSON array)
- WhatsApp CTA links to `+447599260032`
- No backend — submissions are captured client-side only; for production, replace with a form endpoint (Netlify Forms, Formspree, etc.)

---

## 4. GitHub Pages — Static Sites (automated)

The workflow at `.github/workflows/deploy-sites.yml` auto-deploys on every push to `main`:

| Route | Source |
|---|---|
| `/agency` | `public/agency/` |
| `/axontra` | `public/axontra/` |
| `/noa-landing` | `noa-landing/` (root) |
| `/` | `pages-index.html` |

Deployed to: `https://[github-username].github.io/[repo]/`

---

## 5. Cost Table

| Service | Plan | Cost |
|---|---|---|
| Vercel (Noa) | Hobby (free) → Pro when custom domain needed | £0 / £20/mo |
| Netlify (Aldric) | Free (100GB bandwidth) | £0 |
| Netlify (Axontra) | Free (100GB bandwidth) | £0 |
| Anthropic API (Aldric agents) | Pay-as-you-go | ~$0.003/run |
| Groq API (Noa chat) | Free tier (generous) | £0 |
| Domain: aldricgroup.co.uk | Annual renewal | ~£10/yr |
| Domain: axontrapartners.co.uk | Annual renewal | ~£10/yr |

**Total to launch all three: £0 upfront, ~£20/mo when Noa goes live on custom domain.**

---

## 6. Priority Order

1. **Noa** — highest value; deploy to Vercel first, verify build passes, set env vars
2. **Aldric Group** — revenue-generating; Netlify Drop takes 2 minutes
3. **Axontra** — Netlify Drop, same process as Aldric
4. **Domains** — point DNS after both Netlify sites are live and verified
5. **App Store** — after Noa web version is stable (see `APPSTORE.md`)
