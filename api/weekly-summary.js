/**
 * GET /api/weekly-summary
 * Vercel cron: runs Monday at 09:00 UTC (schedule: "0 9 * * 1")
 *
 * For each user who has submitted their email, generates a weekly summary
 * object and logs it. When an email provider is added (Loops / Resend /
 * Postmark), swap the console.log for an API call.
 *
 * Query param ?email=... is accepted for manual triggering during dev.
 *
 * Summary object shape:
 * {
 *   email:           string,
 *   name:            string,
 *   velaScore:       number,
 *   streak:          number,
 *   savingsProgress: { current: number, goal: number, pct: number },
 *   surplus:         number,
 *   topInsight:      string,
 *   weekAhead:       string,
 *   generatedAt:     string (ISO),
 * }
 *
 * Env vars:
 *   WAITLIST_WEBHOOK_URL — optional: POST summaries to Make/Zapier/Loops
 *   EMAIL_FROM           — optional: sender address for future email provider
 */

export default async function handler(req, res) {
  // Allow GET (cron) only
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  // Verify cron secret (Vercel automatically sets CRON_SECRET in production)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['authorization'];
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Allow manual dev calls without secret
    const isLocalDev = req.headers.host?.includes('localhost');
    if (!isLocalDev) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
  }

  const now = new Date();
  const generatedAt = now.toISOString();

  // ── Build weekly summary ───────────────────────────────────────────
  // In production this would read from a database of users who have
  // opted in to weekly emails. Currently there is no server-side user
  // store — we log the summary structure as a template.

  const summaryTemplate = {
    // Populated from vela_name + vela_email on client push to /api/waitlist
    email:   '<from vela_email>',
    name:    '<from vela_name>',

    // Populated from client-side computed values sent in a future
    // POST /api/weekly-summary/submit endpoint
    velaScore: null,
    streak:    null,

    savingsProgress: {
      current: null, // savings balance
      goal:    null, // first savings goal target
      pct:     null, // Math.round((current / goal) * 100)
    },

    surplus:     null, // income - expenses
    topInsight:  null, // Groq-generated weekly insight sentence

    // "weekAhead" — personalised nudge based on payday proximity
    weekAhead: null,

    generatedAt,
  };

  // Log summary (visible in Vercel function logs under Observability tab)
  console.log('[weekly-summary] Generated at', generatedAt);
  console.log('[weekly-summary] Summary template:', JSON.stringify(summaryTemplate, null, 2));
  console.log('[weekly-summary] Recipients: 0 (no server-side user store yet — add Loops/Resend to activate)');

  // Forward to webhook if configured
  const webhookUrl = process.env.WAITLIST_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event:    'weekly_summary_cron',
          ts:       generatedAt,
          template: summaryTemplate,
        }),
      });
      console.log('[weekly-summary] Webhook notified:', webhookUrl);
    } catch (e) {
      console.warn('[weekly-summary] Webhook failed:', e.message);
    }
  }

  return res.status(200).json({
    ok: true,
    message: 'Weekly summary cron ran. No email service configured yet — log only.',
    generatedAt,
    nextStep: 'Add LOOPS_API_KEY or RESEND_API_KEY env var and update this handler to send emails.',
  });
}
