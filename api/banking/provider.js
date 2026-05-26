// api/banking/provider.js
// Plaid API abstraction layer — server-side helpers used by all banking endpoints
//
// Exports: createLinkToken(), exchangePublicToken(), getAccounts(), getTransactions()

const PLAID_BASE = 'https://sandbox.plaid.com';

const hdrs = { 'Content-Type': 'application/json' };

const body = (extra) => JSON.stringify({
  client_id: process.env.PLAID_CLIENT_ID,
  secret:    process.env.PLAID_SECRET,
  ...extra,
});

// ── createLinkToken ────────────────────────────────────────────────────────────
// Returns a link_token for initialising Plaid Link on the client.
export async function createLinkToken() {
  const r = await fetch(`${PLAID_BASE}/link/token/create`, {
    method:  'POST',
    headers: hdrs,
    body:    body({
      client_name:   'Noa',
      language:      'en',
      country_codes: ['GB'],
      products:      ['transactions'],
      user:          { client_user_id: 'noa-user' },
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Plaid /link/token/create ${r.status}: ${err}`);
  }
  const d = await r.json();
  return d.link_token;
}

// ── exchangePublicToken ────────────────────────────────────────────────────────
// Exchanges a Plaid public_token (from Link onSuccess) for a persistent access_token.
export async function exchangePublicToken(publicToken) {
  const r = await fetch(`${PLAID_BASE}/item/public_token/exchange`, {
    method:  'POST',
    headers: hdrs,
    body:    body({ public_token: publicToken }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Plaid /item/public_token/exchange ${r.status}: ${err}`);
  }
  const d = await r.json();
  return d.access_token;
}

// ── getAccounts ────────────────────────────────────────────────────────────────
// Returns normalised account list: [{ id, accountId, name, balance, currency }]
export async function getAccounts(accessToken) {
  const r = await fetch(`${PLAID_BASE}/accounts/balance/get`, {
    method:  'POST',
    headers: hdrs,
    body:    body({ access_token: accessToken }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Plaid /accounts/balance/get ${r.status}: ${err}`);
  }
  const d = await r.json();
  return (d.accounts || []).map(a => ({
    id:        a.account_id,
    accountId: a.account_id,
    name:      a.name || a.official_name || 'Account',
    balance:   a.balances?.current ?? a.balances?.available ?? 0,
    currency:  a.balances?.iso_currency_code || 'GBP',
  }));
}

// ── getTransactions ────────────────────────────────────────────────────────────
// Returns raw Plaid transactions for the last 30 days.
export async function getTransactions(accessToken) {
  const dateTo   = new Date().toISOString().slice(0, 10);
  const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const r = await fetch(`${PLAID_BASE}/transactions/get`, {
    method:  'POST',
    headers: hdrs,
    body:    body({
      access_token: accessToken,
      start_date:   dateFrom,
      end_date:     dateTo,
    }),
  });
  if (!r.ok) {
    const err = await r.text();
    throw new Error(`Plaid /transactions/get ${r.status}: ${err}`);
  }
  const d = await r.json();
  return d.transactions || [];
}
