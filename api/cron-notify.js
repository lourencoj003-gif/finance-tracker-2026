/**
 * GET /api/cron-notify
 * Vercel cron job — fires at 9:00am UTC daily.
 * Sends morning notification via Web Push to any stored push subscription.
 *
 * How to use server-side push (full flow):
 * 1. Generate VAPID keys (see api/notify.js for the command)
 * 2. Add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL to Vercel env vars
 * 3. Add REACT_APP_VAPID_PUBLIC_KEY = same public key (prefix for CRA env)
 * 4. After a user grants notification permission, the app calls /api/notify
 *    with the subscription object; store it server-side (Vercel Blob, etc.)
 * 5. This cron job fetches stored subscriptions and calls /api/notify for each
 *
 * For the current single-user PWA architecture, the client-side notification
 * approach in VelaCore.js (on app open) handles most cases without this cron.
 * This endpoint is the foundation for server-initiated background pushes.
 */

export default async function handler(req, res) {
  // Vercel cron jobs send GET requests — reject anything else
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  // In production you'd fetch stored subscriptions from Vercel Blob or a DB.
  // Placeholder: log that the cron fired.
  console.log('[cron-notify] daily cron fired at', new Date().toISOString());

  // TODO: retrieve stored subscription(s) and call /api/notify for each.
  // Example:
  // const sub = await getStoredSubscription(); // from Vercel Blob
  // if (sub) {
  //   await fetch(`${process.env.VERCEL_URL}/api/notify`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ subscription: sub, title: 'Noa', body: 'Morning nudge text here.' }),
  //   });
  // }

  return res.status(200).json({ ok: true, ts: new Date().toISOString() });
}
