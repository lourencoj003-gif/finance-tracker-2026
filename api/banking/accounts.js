// api/banking/accounts.js
// Fetch live account balances for a connected Plaid item.
//
// POST /api/banking/accounts
//   { accessToken }
//   → { accounts: [{ id, name, balance, currency }] }

import { getAccounts } from './provider.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessToken } = req.body || {};
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing accessToken' });
  }

  try {
    const accounts = await getAccounts(accessToken);
    res.json({ accounts });
  } catch (err) {
    console.error('[banking/accounts]', err.message);
    res.status(500).json({ error: err.message });
  }
}
