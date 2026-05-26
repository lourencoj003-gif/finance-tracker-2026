// api/banking/exchange.js
// Exchanges a Plaid public_token for an access_token, then fetches accounts
// and the last 30 days of transactions in a single server-side round trip.
//
// POST /api/banking/exchange
//   { publicToken, institutionName }
//   → { accessToken, institution, accounts, transactions, inferredIncome }
//
// accounts:     [{ id, name, balance, currency }]
// transactions: [{ date, description, amount, category, currency }]  (debits only, positive £)
// inferredIncome: largest single credit > £500 in the period (salary proxy)

import { exchangePublicToken, getAccounts, getTransactions } from './provider.js';

// Map a transaction description/category to Essentials | Lifestyle | Savings
function categorise(name = '', plaidCategory = []) {
  const d = (name + ' ' + plaidCategory.join(' ')).toLowerCase();

  if (/pension|isa|saving|invest|vanguard|hargreaves|moneybox|trading 212|freetrade|nutmeg|wealthify|moneyfarm/i.test(d)) {
    return 'savings';
  }
  if (
    /deliveroo|uber eats|just eat|menulog|netflix|spotify|amazon prime|disney\+|apple tv|cinema|cineworld|odeon|vue|pub\b|bar\b|restaurant|bistro|brasserie|café|cafe|coffee|starbucks|costa|pret|gym|fitness|leisure|hotel|airbnb|holiday|travel|booking\.com|expedia|fashion|asos|zara|h&m|primark|next\b|topshop|beauty|salon|barber|hair/i.test(d)
  ) {
    return 'lifestyle';
  }
  // Default: essentials (rent, supermarket, bills, insurance, transport)
  return 'essentials';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { publicToken, institutionName } = req.body || {};
  if (!publicToken) {
    return res.status(400).json({ error: 'Missing publicToken' });
  }

  try {
    // 1. Exchange public_token → access_token
    const accessToken = await exchangePublicToken(publicToken);

    // 2. Fetch accounts + transactions in parallel
    const [rawAccounts, rawTxs] = await Promise.all([
      getAccounts(accessToken),
      getTransactions(accessToken),
    ]);

    // 3. Normalise accounts
    const accounts = rawAccounts.map(a => ({
      id:       a.id,
      name:     a.name,
      balance:  a.balance,
      currency: a.currency,
    }));

    // 4. Filter to debits only (Plaid: positive amount = money out)
    //    and apply Noa category mapping
    const transactions = rawTxs
      .filter(tx => tx.amount > 0 && !tx.pending)
      .map(tx => ({
        date:        tx.date,
        description: tx.name || tx.merchant_name || 'Transaction',
        amount:      parseFloat(Math.abs(tx.amount).toFixed(2)),
        category:    categorise(
          tx.name || tx.merchant_name || '',
          tx.category || []
        ),
        currency: tx.iso_currency_code || 'GBP',
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    // 5. Infer income: largest single credit > £500 in the period
    const inferredIncome = rawTxs
      .filter(tx => tx.amount < 0 && Math.abs(tx.amount) > 500)
      .reduce((max, tx) => Math.max(max, Math.abs(tx.amount)), 0);

    // 6. Category summary
    const summary = transactions.reduce((acc, tx) => {
      acc[tx.category] = parseFloat(((acc[tx.category] || 0) + tx.amount).toFixed(2));
      return acc;
    }, {});

    res.json({
      accessToken,
      institution:   institutionName || 'Your bank',
      accounts,
      transactions,
      summary,
      inferredIncome: parseFloat(inferredIncome.toFixed(2)),
    });
  } catch (err) {
    console.error('[banking/exchange]', err.message);
    res.status(500).json({ error: err.message });
  }
}
