// api/banking/transactions.js
// Fetch last 30 days of transactions from a Plaid-connected bank.
// Categorises to Essentials / Lifestyle / Savings and infers income.
//
// POST /api/banking/transactions
//   { accessToken }
//   → { transactions, summary, inferredIncome }

import { getTransactions } from './provider.js';

// Map a transaction name/Plaid category to Essentials | Lifestyle | Savings
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
  return 'essentials';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { accessToken } = req.body || {};
  if (!accessToken) {
    return res.status(400).json({ error: 'Missing accessToken' });
  }

  try {
    const rawTxs = await getTransactions(accessToken);

    // Debits only (Plaid: positive amount = money out of account)
    const transactions = rawTxs
      .filter(tx => tx.amount > 0 && !tx.pending)
      .map(tx => ({
        date:        tx.date,
        description: tx.name || tx.merchant_name || 'Transaction',
        amount:      parseFloat(Math.abs(tx.amount).toFixed(2)),
        category:    categorise(tx.name || tx.merchant_name || '', tx.category || []),
        currency:    tx.iso_currency_code || 'GBP',
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    // Category totals
    const summary = transactions.reduce((acc, tx) => {
      acc[tx.category] = parseFloat(((acc[tx.category] || 0) + tx.amount).toFixed(2));
      return acc;
    }, {});

    // Infer income: largest single credit > £500
    const inferredIncome = rawTxs
      .filter(tx => tx.amount < 0 && Math.abs(tx.amount) > 500)
      .reduce((max, tx) => Math.max(max, Math.abs(tx.amount)), 0);

    res.json({
      transactions,
      summary,
      inferredIncome: parseFloat(inferredIncome.toFixed(2)),
    });
  } catch (err) {
    console.error('[banking/transactions]', err.message);
    res.status(500).json({ error: err.message });
  }
}
