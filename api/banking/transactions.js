// api/banking/transactions.js
// Fetch last 30 days of transactions from Nordigen, auto-categorise to
// Essentials / Lifestyle / Savings, and infer recurring income.
//
// POST /api/banking/transactions
//   { accountIds: ['id1', ...] }
//   → { transactions: [...], summary: { essentials, lifestyle, savings }, inferredIncome }

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

// Map a transaction description to Essentials / Lifestyle / Savings
function categorise(desc = '') {
  const d = desc.toLowerCase();

  if (/pension|isa|saving|invest|vanguard|hargreaves|moneybox|trading 212|freetrade|nutmeg/i.test(d)) {
    return 'savings';
  }
  if (
    /deliveroo|uber eats|just eat|menulog|netflix|spotify|amazon prime|disney\+|apple tv|cinema|cineworld|odeon|vue|pub|bar\b|restaurant|bistro|brasserie|café|cafe|coffee|starbucks|costa|pret|gym|fitness|leisure|hotel|airbnb|holiday|travel|booking\.com|expedia|fashion|asos|zara|h&m|primark|next\b|topshop|beauty|salon|barber|hair/i.test(d)
  ) {
    return 'lifestyle';
  }
  // Default: essentials (rent, supermarket, bills, insurance, transport)
  return 'essentials';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { accountIds } = req.body || {};
  if (!accountIds || !Array.isArray(accountIds) || accountIds.length === 0) {
    return res.status(400).json({ error: 'Missing or empty accountIds array' });
  }

  const dateTo   = new Date().toISOString().slice(0, 10);
  const dateFrom = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  try {
    const token = await getNordigenToken();
    const expenses        = [];
    const incomeCandidates = [];

    await Promise.all(accountIds.map(async (id) => {
      const r = await fetch(
        `${NORDIGEN_BASE}/accounts/${id}/transactions/?date_from=${dateFrom}&date_to=${dateTo}`,
        { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
      );
      if (!r.ok) return;

      const data   = await r.json();
      const booked = data.transactions?.booked || [];

      booked.forEach(tx => {
        const amount = parseFloat(tx.transactionAmount?.amount || 0);
        const desc   =
          tx.remittanceInformationUnstructured ||
          tx.creditorName ||
          tx.debtorName   ||
          tx.additionalInformation ||
          'Transaction';

        if (amount < 0) {
          // Debit — expense
          expenses.push({
            date:        tx.bookingDate || tx.valueDate || dateTo,
            description: desc,
            amount:      parseFloat(Math.abs(amount).toFixed(2)),
            category:    categorise(desc),
            currency:    tx.transactionAmount?.currency || 'GBP',
          });
        } else if (amount > 500) {
          // Large credit — potential salary / recurring income
          incomeCandidates.push(amount);
        }
      });
    }));

    // Sort newest first
    expenses.sort((a, b) => (a.date < b.date ? 1 : -1));

    // Category totals
    const summary = expenses.reduce((acc, tx) => {
      acc[tx.category] = parseFloat(((acc[tx.category] || 0) + tx.amount).toFixed(2));
      return acc;
    }, {});

    // Best-guess monthly income (largest single credit ≥ £500 in the period)
    const inferredIncome = incomeCandidates.length > 0
      ? parseFloat(Math.max(...incomeCandidates).toFixed(2))
      : 0;

    res.json({ transactions: expenses, summary, inferredIncome });
  } catch (err) {
    console.error('[banking/transactions]', err.message);
    res.status(500).json({ error: err.message });
  }
}
