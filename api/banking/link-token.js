// api/banking/link-token.js
// Creates a Plaid Link token for initialising Plaid Link on the client.
//
// POST /api/banking/link-token
//   → { link_token }

import { createLinkToken } from './provider.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const link_token = await createLinkToken();
    res.json({ link_token });
  } catch (err) {
    console.error('[banking/link-token]', err.message);
    res.status(500).json({ error: err.message });
  }
}
