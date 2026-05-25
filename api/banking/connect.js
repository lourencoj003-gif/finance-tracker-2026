// api/banking/connect.js
// Nordigen (GoCardless Bank Account Data) OAuth integration
//
// POST /api/banking/connect
//   { action: 'initiate', institutionId, redirectUri }
//     → { link, requisitionId }
//   { action: 'complete', requisitionId }
//     → { accountIds, institutionId }

const NORDIGEN_BASE = 'https://bankaccountdata.gocardless.com/api/v2';

async function getNordigenToken() {
  const r = await fetch(`${NORDIGEN_BASE}/token/new/`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body:    JSON.stringify({
      secret_id:  process.env.NORDIGEN_SECRET_ID,
      secret_key: process.env.NORDIGEN_SECRET_KEY,
    }),
  });
  if (!r.ok) {
    const body = await r.text();
    throw new Error(`Nordigen token error ${r.status}: ${body}`);
  }
  const d = await r.json();
  return d.access;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, institutionId, redirectUri, requisitionId } = req.body || {};

  try {
    const token = await getNordigenToken();

    // ── Initiate: create requisition, return bank link ────────────────
    if (action === 'initiate') {
      if (!institutionId || !redirectUri) {
        return res.status(400).json({ error: 'Missing institutionId or redirectUri' });
      }
      const r = await fetch(`${NORDIGEN_BASE}/requisitions/`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept:         'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({
          redirect:        redirectUri,
          institution_id:  institutionId,
          reference:       `noa-${Date.now()}`,
          user_language:   'EN',
        }),
      });
      if (!r.ok) {
        const err = await r.text();
        return res.status(502).json({ error: `Nordigen requisition failed: ${err}` });
      }
      const d = await r.json();
      return res.json({ link: d.link, requisitionId: d.id });
    }

    // ── Complete: fetch requisition to get account IDs ─────────────────
    if (action === 'complete') {
      if (!requisitionId) {
        return res.status(400).json({ error: 'Missing requisitionId' });
      }
      const r = await fetch(`${NORDIGEN_BASE}/requisitions/${requisitionId}/`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!r.ok) {
        return res.status(502).json({ error: `Nordigen requisition fetch failed: ${r.status}` });
      }
      const d = await r.json();
      if (!d.accounts || d.accounts.length === 0) {
        return res.status(202).json({
          accountIds: [],
          message: 'No accounts linked yet — user may not have completed bank authorisation',
        });
      }
      return res.json({ accountIds: d.accounts, institutionId: d.institution_id });
    }

    return res.status(400).json({ error: 'Invalid action. Use "initiate" or "complete".' });
  } catch (err) {
    console.error('[banking/connect]', err.message);
    res.status(500).json({ error: err.message });
  }
}
