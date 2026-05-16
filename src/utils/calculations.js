export function sectionTotal(rows) {
  return Object.values(rows || {}).reduce(
    (totals, row) => totals.map((v, i) => v + (parseFloat(row[i]) || 0)),
    Array(12).fill(0)
  );
}

export function monthlyNet(data) {
  const inc = sectionTotal(data.income);
  const exp = sectionTotal(data.expenses);
  const inv = sectionTotal(data.investments);
  return inc.map((v, i) => v - exp[i] - inv[i]);
}
