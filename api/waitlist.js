/**
 * POST /api/waitlist
 * Captures a waitlist email or welcome signup for Noa.
 *
 * Body:
 *   email:    string  (required)
 *   name?:    string  (optional — present on onboarding signups)
 *   context?: string  — tag e.g. 'welcome' | 'day11_trigger' | 'upgrade_modal' | 'manual'
 *   welcome?: boolean — true when called from onboarding completion (first signup)
 *
 * On success: { ok: true }
 * On error:   { error: string }
 *
 * Storage: logs the entry to Vercel function logs (searchable in dashboard).
 * If WAITLIST_WEBHOOK_URL env var is set, also POSTs to that URL (e.g. Make,
 * Zapier, or a simple webhook → Google Sheet / Mailchimp / Loops.so).
 *
 * Log entry shape:
 * {
 *   email:    string,
 *   name?:    string,
 *   context:  string,
 *   welcome:  boolean,
 *   ts:       string (ISO),
 * }
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, context = 'unknown', welcome = false } = req.body || {};

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const entry = {
    email:   email.trim().toLowerCase(),
    ...(name ? { name: name.trim() } : {}),
    context: welcome ? 'welcome' : context,
    welcome: !!welcome,
    ts:      new Date().toISOString(),
  };

  // Log to Vercel function logs — visible in Observability tab
  if (welcome) {
    console.log('[waitlist:signup]', JSON.stringify(entry));
  } else {
    console.log('[waitlist:upgrade-interest]', JSON.stringify(entry));
  }

  // Optional: forward to a webhook (Make / Zapier / Loops / custom)
  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(entry),
      });
    } catch (e) {
      // Non-fatal — webhook failures don't block the response
      console.warn('[waitlist] webhook failed:', e.message);
    }
  }

  return res.status(200).json({ ok: true });
}
