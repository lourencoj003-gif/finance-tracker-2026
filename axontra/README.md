# Axontra Partners — Website

Static HTML/CSS website for Axontra Partners, operational intelligence for insurance brokerages.

---

## Deploying to Netlify (Recommended)

### Option A — Netlify Drop (instant, no account needed)
1. Go to **[app.netlify.com/drop](https://app.netlify.com/drop)**
2. Drag and drop the **`axontra/`** folder onto the page
3. Netlify generates a live URL (e.g. `https://random-name.netlify.app`) instantly
4. Continue to connect your custom domain below

### Option B — Netlify CLI
```bash
npm install -g netlify-cli
netlify deploy --dir=public/axontra --prod
```

### Option C — GitHub Integration
1. Push this repo to GitHub
2. Log in to Netlify → **New site from Git**
3. Set **Publish directory** to `public/axontra`
4. Leave Build command blank (pure static)
5. Deploy

---

## Connecting Custom Domain (axontrapartners.co.uk)

1. In Netlify dashboard → **Site settings → Domain management → Add custom domain**
2. Enter `axontrapartners.co.uk`
3. In your DNS provider (GoDaddy, Namecheap, Cloudflare, etc.):
   - Add **CNAME** record: `www` → `your-site-name.netlify.app`
   - Add **A record**: `@` → `75.2.60.5` (Netlify load balancer IP)
4. Enable **HTTPS** in Netlify (free Let's Encrypt cert, auto-renews)
5. Set `axontrapartners.co.uk` as the primary domain

DNS propagation: 1–48 hours.

---

## Environment Variables

Pure static site — **no environment variables required**.

---

## File Structure

```
axontra/
├── index.html    ← Main website (all sections: hero, services, why, contact)
├── pitch.html    ← Sales pitch deck
└── README.md     ← This file
```

---

## Internal Links Audit

All links in `index.html` are anchor links (`#services`, `#why`, `#contact`) — no broken paths.

| Link | Type | Status |
|---|---|---|
| `#services` | Anchor | ✅ |
| `#why` | Anchor | ✅ |
| `#contact` | Anchor | ✅ |
| WhatsApp CTA | External | ✅ (update number before launch) |

**Before launch:** Update the WhatsApp number (`wa.me/447700000000`) in two places in `index.html` to the real Axontra number.

---

## Contact Form — "Request Diagnostic"

The contact form captures:
- Name
- Firm Name
- Role
- Email Address
- Service interest (select)
- Biggest Operational Challenge (textarea)

On submit:
1. Form data saved to `localStorage` key `axontra_enquiries` (array, last 20 entries)
2. Opens `mailto:enquiries@axontrapartners.com` with form data

**To use a proper form backend** (recommended for production):
- Replace the `mailto:` form with [Netlify Forms](https://docs.netlify.com/forms/setup/) — add `netlify` attribute to the `<form>` tag — completely free
- Or use [Formspree](https://formspree.io) — change `action` to `https://formspree.io/f/YOUR_ID`

---

## Open Graph Tags

Already added to `index.html`. To update the OG preview image:
1. Create a 1200×630px image (PNG or JPG)
2. Upload to your domain as `https://axontrapartners.co.uk/og-image.png`
3. Tags will pick it up automatically

---

## Google Analytics

GA4 tracking code is in `index.html` as a commented block. To activate:
1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a GA4 property for `axontrapartners.co.uk`
3. Copy your **Measurement ID** (`G-XXXXXXXXXX`)
4. Uncomment the GA block in `index.html` and replace `G-XXXXXXXXXX`

---

*Axontra Partners — Operational intelligence for the modern brokerage.*
