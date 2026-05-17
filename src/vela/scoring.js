export function parseAmount(text = '') {
  const clean = text.replace(/[£$€,]/g, '');
  const match = clean.match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

export function parseDebt(text = '') {
  if (/\b(no|none|nothing|zero|clear|nope|nah|n\/a)\b/i.test(text)) return 0;
  return parseAmount(text);
}

export function calcHealthScore({ income, expenses, debt }) {
  if (!income || income <= 0) return 50;
  let score = 100;
  const rate = (income - expenses) / income;

  if (rate < 0)        score -= 40;
  else if (rate < 0.1) score -= 25;
  else if (rate < 0.2) score -= 10;

  if (debt > 0) {
    const ratio = debt / (income * 12);
    if (ratio > 1)        score -= 30;
    else if (ratio > 0.5) score -= 20;
    else if (ratio > 0.2) score -= 10;
    else                  score -= 5;
  }

  return Math.max(5, Math.min(100, Math.round(score)));
}

export function scoreColor(s) {
  if (s >= 75) return '#4eca8b';
  if (s >= 50) return '#f5a623';
  return '#ff6b6b';
}

export function scoreLabel(s) {
  if (s >= 80) return 'Excellent';
  if (s >= 65) return 'Good';
  if (s >= 50) return 'Fair';
  if (s >= 35) return 'Needs work';
  return 'Critical';
}
