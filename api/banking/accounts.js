// api/banking/accounts.js
// Fetch live balances for a list of Nordigen account IDs
//
// POST /api/banking/accounts
//   { accountIds: ['id1', 'id2', ...] }
//   → { accounts: [{ id, name, iban, balance, currency }, ...] }

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
  if (!r.ok) throw new Error(`Nordigen token error: ${r.status}`);
  const d = await r.json();
  return d.access;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accountIds } = req.body || {};
  if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
    return res.status(400).json({ error: 'Missing or empty accountIds array' });
  }

  try {
    const token = await getNordigenToken();

    const accounts = await Promise.all(accountIds.map(async (id) => {
      const [detailRes, balRes] = await Promise.all([
        fetch(`${NORDIGEN_BASE}/accounts/${id}/`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
        fetch(`${NORDIGEN_BASE}/accounts/${id}/balances/`,
          { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
      ]);

      const detail  = detailRes.ok  ? await detailRes.json() : {};
      const balData = balRes.ok     ? await balRes.json()    : {};
      const bals    = balData.balances || [];

      // Prefer interimAvailable → closingBooked → first available
      const bal =
        bals.find(b => b.balanceType === 'interimAvailable') ||
        bals.find(b => b.balanceType === 'closingBooked')    ||
        bals[0] || null;

      return {
        id,
        name:     detail.product || detail.name || 'Account',
        iban:     detail.iban || '',
        balance:  bal ? parseFloat(bal.balanceAmount?.amount  || 0) : 0,
        currency: bal ? (bal.balanceAmount?.currency || 'GBP') : 'GBP',
      };
    }));

    res.json({ accounts });
  } catch (err) {
    console.error('[banking/accounts]', err.message);
    res.status(500).json({ error: err.message });
  }
}
