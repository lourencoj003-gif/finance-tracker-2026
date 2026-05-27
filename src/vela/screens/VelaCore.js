import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { getData, saveData, getInsights, clearAll, tickStreak, shouldShowCheckin, markCheckin, getGoals, saveGoals, getLastOpen, setLastOpen, getLastCeremonyYM, setLastCeremonyYM, getDebts, saveDebts, getChallenge, saveChallenge, getExpenseLog, saveExpenseLog, getEveningDate, setEveningDate, appendEveningLog, getUserName, setUserName, getDailyInsight, saveDailyInsight, getNotifPrefs, saveNotifPrefs, getNotifLast, saveNotifLast, savePushSub, getPrivacyMode, setPrivacyMode as savePrivacyMode, appendConvoMemory, getConvoMemory, clearConvoMemory, getAccounts, saveAccounts, getFinancialPersonality, saveFinancialPersonality, getFirstWeekShown, markFirstWeekShown, getPlanType, getWaitlistEmail, saveWaitlistEmail, incrementPaywallViews, getMemoryStart, setMemoryStart, setAppStart, getBankingAccessToken, saveBankingAccessToken, getBankingInstitution, saveBankingInstitution, getBankingLastSync, setBankingLastSync, clearBanking } from '../storage';
import Orb from '../Orb';
import { speak as voiceSpeak, stopSpeaking } from '../voice';

const PaydayCeremony = lazy(() => import('./PaydayCeremony'));
const LazyDetailView = lazy(() => import('./DetailView'));

const HISTORY_KEY = 'noaHistory';
const MAX_HISTORY = 30;

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(h) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-MAX_HISTORY)));
}

const PURPLE    = '#C8B89A';
const BLUE      = '#A89880';
const GREEN     = '#7CAE9E';
const AMBER     = '#C9A96E';
const RED       = '#E24B4A';
const DEBT_RED  = '#E24B4A';
const ORANGE    = '#E8955A';
const DEEP_AMBER = '#C97032';
const BG        = '#111318';

const CHALLENGES = [
  { id: 'noSpendWeekend', name: 'No-Spend Weekend',       desc: 'Zero discretionary spend Sat & Sun',   saving: 80,  icon: '🚫' },
  { id: 'cookHome',       name: 'Cook at Home – 5 Days',  desc: 'Skip takeaways and restaurants',        saving: 60,  icon: '🍳' },
  { id: 'cancelSub',      name: 'Cancel a Subscription',  desc: 'Cut one dormant or unused service',     saving: 120, icon: '✂️' },
  { id: 'coffeeBreak',    name: 'Skip the Coffee Shop',   desc: 'Brew at home all week',                 saving: 28,  icon: '☕' },
  { id: 'walkDontDrive',  name: 'Walk or Cycle – 3 Days', desc: 'Skip Uber or fuel costs',               saving: 35,  icon: '🚶' },
  { id: 'mealPrep',       name: 'Meal Prep Sunday',       desc: 'Plan the week, cut food waste',         saving: 45,  icon: '🥗' },
  { id: 'noOnline',       name: 'No Online Shopping',     desc: 'Pause impulse buys for 7 days',         saving: 50,  icon: '📦' },
];

const KEYFRAMES = `
  @keyframes orbIdle {
    0%,100% { transform: scale(1);    filter: brightness(1);    box-shadow: 0 0 18px 6px rgba(200,184,154,0.28); }
    50%     { transform: scale(1.08); filter: brightness(1.16); box-shadow: 0 0 28px 10px rgba(200,184,154,0.52); }
  }
  @keyframes orbBreathe {
    0%,100% { transform: scale(1);    opacity: 1; }
    50%     { transform: scale(1.08); opacity: 0.92; }
  }
  @keyframes orbListening {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.14); }
  }
  @keyframes orbThinking {
    0%,100% { transform: scale(1);    filter: brightness(0.85); }
    50%     { transform: scale(1.04); filter: brightness(1.05); }
  }
  @keyframes orbSpeaking {
    0%,100% { transform: scale(1); }
    20%     { transform: scale(1.10); }
    40%     { transform: scale(1.04); }
    60%     { transform: scale(1.12); }
    80%     { transform: scale(1.05); }
  }
  @keyframes ripple {
    0%   { transform: scale(1);   opacity: 0.55; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes waveBar {
    0%,100% { transform: scaleY(0.22); }
    50%     { transform: scaleY(1); }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%,100% { opacity: 0.3; }
    50%     { opacity: 1; }
  }
  @keyframes micPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(168,152,128,0.4); }
    50%     { box-shadow: 0 0 0 12px rgba(168,152,128,0); }
  }
  @keyframes swipeHint {
    0%,100% { opacity: 0.55; transform: translateY(0); }
    50%     { opacity: 1;    transform: translateY(-4px); }
  }
  @keyframes alertPulse {
    0%,100% { transform: scale(1);    opacity: 1; }
    50%     { transform: scale(1.45); opacity: 0.55; }
  }
  @keyframes orbMoodPulse {
    0%,100% { transform: scale(1);    filter: brightness(1);    }
    50%     { transform: scale(1.07); filter: brightness(1.12); }
  }
  @keyframes confettiFly {
    0%   { transform: translate(0, 0) scale(1);                           opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0.35);        opacity: 0; }
  }
  @keyframes sentenceIn {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  input::placeholder, textarea::placeholder { color: #A89880; opacity: 1; }
  .chat-scroll::-webkit-scrollbar { display: none; }
`;


const SLIDE = 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)';

const CONFETTI_COLORS = [PURPLE, BLUE, GREEN, AMBER, RED, '#E8DDD0', '#ee55ff', '#00eeff'];
const CONFETTI_DOTS = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 2 * Math.PI;
  const dist  = 120 + (i % 4) * 30;
  return {
    dx:    Math.round(Math.cos(angle) * dist),
    dy:    Math.round(Math.sin(angle) * dist),
    color: CONFETTI_COLORS[i % 8],
    size:  6 + (i % 4) * 2,
    delay: (i % 5) * 0.08,
  };
});

const TIPS = [
  'Pay yourself first — automate a transfer to savings the moment your pay lands.',
  'The 50/30/20 rule: 50% needs, 30% wants, 20% savings. A simple starting point.',
  'High-interest debt costs more than savings earns. Clear it first, always.',
  'An emergency fund of 3 months expenses protects everything else you build.',
  'Investing £100/month from 25 beats £200/month from 35 — by thousands.',
  'Review your subscriptions quarterly — dormant ones are silent money leaks.',
  'A Stocks & Shares ISA shelters up to £20,000/year from tax on growth.',
  'Grocery shopping with a list saves around 20% vs shopping without one.',
  'Your pension employer match is free money — always contribute enough to get it.',
  'Automate savings. Willpower runs out; a standing order does not.',
  'Avoid lifestyle inflation on a pay rise — bank the difference instead.',
  'Negotiate broadband, insurance, and energy once a year — saves hundreds.',
  'Small daily spends compound: a £4 coffee every day is £1,460 a year.',
  'Zero-based budgeting: assign every pound a job before the month starts.',
  'Balance transfers can cut credit card interest to 0% — always have a payoff plan.',
  'Track net worth monthly: assets minus liabilities is the number that matters.',
  'Buying used cars saves 30–40% — depreciation hits hardest in year one.',
  'Low-cost index funds beat most managed funds over any 10-year window.',
  'Round-up savings apps invest spare change — tiny amounts compound big.',
  'Overpaying your mortgage by £100/month can cut years off the term.',
];

function getDailyTip() {
  const today = new Date().toISOString().slice(0, 10);
  let idx = parseInt(localStorage.getItem('vela_tip_idx') || '0', 10);
  if (localStorage.getItem('vela_tip_date') !== today) {
    idx = (idx + 1) % TIPS.length;
    localStorage.setItem('vela_tip_date', today);
    localStorage.setItem('vela_tip_idx', String(idx));
  }
  return TIPS[idx];
}

function parseGoalFromText(text) {
  if (!/\b(save|saving)\b/i.test(text)) return null;
  const amtM = text.match(/£\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!amtM) return null;
  const amount = parseFloat(amtM[1].replace(/,/g, ''));
  if (amount < 10 || amount > 999999) return null;
  const forM = text.match(/for\s+(?:a\s+|an\s+|my\s+)?([a-zA-Z][^,.\n!?]{1,40})/i);
  const byM  = text.match(/by\s+([A-Za-z]+(?:\s+\d{4})?|\d{4})/i);
  return {
    id:         Date.now(),
    name:       forM ? forM[1].trim() : 'Savings goal',
    target:     amount,
    saved:      0,
    createdAt:  new Date().toISOString().slice(0, 10),
    targetDate: byM ? byM[1].trim() : null,
  };
}


// Parse a month name / "Month Year" string → months remaining from today
function monthsUntil(dateStr) {
  if (!dateStr) return 6;
  const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  const now    = new Date();
  const parts  = dateStr.toLowerCase().trim().split(/\s+/);
  const mIdx   = MONTHS.findIndex(m => parts[0].startsWith(m));
  if (mIdx === -1) return 6;
  const yr   = parts[1] ? parseInt(parts[1], 10) : (mIdx <= now.getMonth() ? now.getFullYear() + 1 : now.getFullYear());
  const diff = (new Date(yr, mIdx, 1).getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  return Math.max(1, Math.round(diff));
}

function parseExpenseFromText(text) {
  // "just spent £12 on coffee" | "spent 8 on lunch" | "£12 on coffee" | "I spent £50"
  const m = text.match(/(?:just\s+)?spent\s+£?\s*([\d]+(?:\.\d{1,2})?)\s*(?:on\s+([^,.!?]+))?/i)
         || text.match(/£\s*([\d]+(?:\.\d{1,2})?)\s+on\s+([^,.!?]+)/i);
  if (!m) return null;
  const amount = parseFloat(m[1]);
  if (isNaN(amount) || amount <= 0 || amount > 9999) return null;
  const category = m[2] ? m[2].trim().replace(/[.!?]+$/, '') : 'general';
  return { amount, category, date: new Date().toISOString().slice(0, 10), ts: Date.now() };
}

function parseDebtFromText(text) {
  if (!/\b(debt|owe|loan|card|credit|overdraft|finance|borrowed)\b/i.test(text)) return null;
  const amtM = text.match(/£\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!amtM) return null;
  const amount = parseFloat(amtM[1].replace(/,/g, ''));
  if (amount < 10 || amount > 999999) return null;
  const rateM = text.match(/(\d+(?:\.\d+)?)\s*%/);
  const rate  = rateM ? parseFloat(rateM[1]) : 0;
  const nameM = text.match(/\b(credit card|personal loan|overdraft|car finance|student loan|store card|[a-z]+ loan|[a-z]+ card)\b/i);
  return { id: Date.now(), name: nameM ? nameM[1] : 'Debt', amount, rate, addedAt: new Date().toISOString().slice(0, 10) };
}

function getISOWeek() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yr = d.getFullYear();
  const wk = Math.ceil((((d - new Date(yr, 0, 1)) / 86400000) + 1) / 7);
  return `${yr}-W${String(wk).padStart(2, '0')}`;
}

// Lightweight prompt used for the daily insight fetch — doesn't need component state
function buildInsightPrompt() {
  const d    = getData() || {};
  const name = getUserName() || d.name || '';
  const { income = 0, expenses = 0, debt = 0, savings = 0, payday = 25 } = d;
  const surplus = income - expenses;
  const daysToPayday = daysUntilPayday(payday);
  const streak       = parseInt(localStorage.getItem('vela_streak_count') || '0', 10);
  return `You are Noa — a sharp, dry, warm personal financial navigator. Speak in first person about the user, max 22 words.\n\nUser data: name=${name || 'unknown'}, income=£${income}/month, expenses=£${expenses}/month, surplus=£${surplus}/month, debt=£${debt}, savings=£${savings}, payday in ${daysToPayday} day${daysToPayday === 1 ? '' : 's'}, streak=${streak} days.\n\nExamples of the style:\n- "Payday in 3 days. You have £163 left. Manageable — if you avoid anything with a menu."\n- "You've hit your savings target 3 weeks running. That's not luck, that's a habit."\n- "Your surplus this month is £${surplus.toFixed(0)}. That's £${(surplus * 12).toFixed(0)} a year if you protect it."`;
}

// ── Payday helpers — correct month-boundary calculation ──────────────
// Uses today's date (not datetime) so payday-today shows 0, not next-month.
function calcNextPayday(paydayDay) {
  const now      = new Date();
  const todayDay = now.getDate();
  if (todayDay > paydayDay) {
    // payday already passed this month → next month
    const nm  = now.getMonth() + 1;
    const ny  = nm > 11 ? now.getFullYear() + 1 : now.getFullYear();
    const nm2 = nm > 11 ? 0 : nm;
    return new Date(ny, nm2, Math.min(paydayDay, new Date(ny, nm2 + 1, 0).getDate()));
  } else {
    const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return new Date(now.getFullYear(), now.getMonth(), Math.min(paydayDay, dim));
  }
}
function daysUntilPayday(paydayDay) {
  const nextPay = calcNextPayday(paydayDay);
  const t       = new Date();
  const today   = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((nextPay - today) / 86400000);
}

// Task C — Payday Health Score: compute days elapsed and total days in pay period
function daysInPayPeriod(paydayDay) {
  const nextPay = calcNextPayday(paydayDay);
  // Previous payday = same day number, previous month
  const prevPay = new Date(nextPay.getFullYear(), nextPay.getMonth() - 1,
    Math.min(paydayDay, new Date(nextPay.getFullYear(), nextPay.getMonth(), 0).getDate()));
  const now     = new Date();
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const totalDays = Math.max(1, Math.round((nextPay - prevPay) / 86400000));
  const elapsed   = Math.max(0, Math.min(totalDays, Math.round((today - prevPay) / 86400000)));
  return { totalDays, elapsed };
}

function daysLeftInWeek() {
  const day = new Date().getDay();
  return day === 0 ? 0 : 7 - day;
}

function getGreeting() {
  const h    = new Date().getHours();
  const name = getUserName() || '';
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${base}, ${name}` : base;
}

// Task 3 — Orb Mood States
// Returns one of: 'thriving' | 'steady' | 'watchful' | 'alert'
function calcMood({ income, expenses, surplus, savingsGoal, savingsBalance }) {
  if (income <= 0) return 'steady';
  const surplusRatio = surplus / income;
  const goalPct = savingsGoal > 0 ? savingsBalance / savingsGoal : 1;
  if (surplus < 0 || goalPct < 0.20) return 'alert';
  if (surplusRatio < 0.10 || goalPct < 0.50) return 'watchful';
  if (surplusRatio > 0.25 && goalPct >= 0.80) return 'thriving';
  return 'steady';
}

const MOOD_CFG = {
  thriving: {
    label: 'THRIVING',
    labelColor: 'rgba(201,169,110,0.65)',
    glowColor:  'rgba(201,169,110,0.55)',
    pulseSpeed: '4s',
    shadow: '0 0 32px 12px rgba(201,169,110,0.42)',
  },
  steady: {
    label: 'STEADY',
    labelColor: 'rgba(232,221,208,0.32)',
    glowColor:  'rgba(200,184,154,0.42)',
    pulseSpeed: '3s',
    shadow: '0 0 18px 6px rgba(200,184,154,0.32)',
  },
  watchful: {
    label: 'WATCHFUL',
    labelColor: 'rgba(180,190,200,0.48)',
    glowColor:  'rgba(170,185,205,0.38)',
    pulseSpeed: '2.5s',
    shadow: '0 0 18px 6px rgba(170,185,205,0.28)',
  },
  alert: {
    label: 'ALERT',
    labelColor: 'rgba(201,169,110,0.72)',
    glowColor:  'rgba(201,140,80,0.52)',
    pulseSpeed: '2s',
    shadow: '0 0 24px 8px rgba(201,140,80,0.38)',
  },
};

function calcVelaScore({ income, expenses, debt, streak }) {
  if (income <= 0) return 0;
  const surplus = income - expenses;
  const rate    = surplus / income;
  const pts = {
    savings: Math.min(30, Math.max(0, Math.round(rate * 150))),
    debt:    debt === 0 ? 25 : Math.max(0, 25 - Math.round(Math.min(1, debt / (income * 12)) * 25)),
    streak:  Math.min(20, Math.round((streak / 30) * 20)),
    pace:    Math.min(25, Math.max(0, Math.round((1 - expenses / income) * 50))),
  };
  return Math.max(0, Math.min(100, pts.savings + pts.debt + pts.streak + pts.pace));
}

// ── Smart transaction category suggestion ────────────────────────────
// Returns 'essentials' | 'lifestyle' | 'savings' | null (null = no confident match)
const CATEGORY_KEYWORDS = {
  essentials: [
    'rent','mortgage','electricity','electric','gas','water','internet','broadband',
    'phone','mobile','insurance','groceries','grocery','supermarket','tesco','sainsbury',
    "sainsbury's",'asda','lidl','aldi','morrisons','waitrose','marks spencer','m&s',
    'petrol','fuel','transport','train','bus','tube','underground','oyster','rail',
    'council tax','council','nhs','prescription','doctor','dentist','pharmacy','chemist',
    'housing','utility','utilities','broadband','tv licence',
  ],
  lifestyle: [
    'restaurant','cafe','coffee','starbucks','costa','pret','bar','pub','takeaway',
    'deliveroo','uber eats','ubereats','just eat','justeat','mcdonalds','kfc','pizza',
    'nandos','wagamama','cinema','netflix','spotify','amazon prime','disney','apple tv',
    'clothes','clothing','topshop','zara','h&m','asos','boots','superdrug',
    'gym','fitness','sport','holiday','hotel','flight','airbnb','travel','amazon',
    'shopping','hair','haircut','beauty','salon','spa','massage','entertainment',
    'meal','lunch','dinner','breakfast','drink','drinks','cocktail','wine',
  ],
  savings: [
    'savings','saving','investment','invest','pension','isa','stocks','shares',
    'crypto','bitcoin','eth','ethereum','trading','fund','vanguard','moneybox',
    'transfer to savings','deposit','pot',
  ],
};

function suggestCategory(name) {
  if (!name || !name.trim()) return null;
  const lower = name.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return cat;
  }
  return null;
}

// ── Financial Personality Detection ──────────────────────────────────
// Requires 5+ transactions. Returns one of:
//   'Spender' | 'Saver' | 'Balanced' | 'Inconsistent' | null
function detectFinancialPersonality(expenseLog, income, expenses) {
  if (!expenseLog || expenseLog.length < 5) return null;
  const thisMonth = new Date().toISOString().slice(0, 7);
  const log = expenseLog.filter(e => e.date && e.date.startsWith(thisMonth));
  if (log.length < 3) {
    // Fall back to all-time data if current month is sparse
    const allLog = expenseLog;
    if (allLog.length < 5) return null;
    // Use all-time totals
    const lifestyle = allLog.filter(e => e.category === 'lifestyle').reduce((s, e) => s + e.amount, 0);
    const total = allLog.reduce((s, e) => s + e.amount, 0);
    if (total === 0) return null;
    const lifestylePct = (lifestyle / total) * 100;
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    if (lifestylePct > 40) return 'Spender';
    if (savingsRate > 20) return 'Saver';
    return 'Balanced';
  }
  const lifestyleSpend = log.filter(e => e.category === 'lifestyle').reduce((s, e) => s + e.amount, 0);
  const total          = log.reduce((s, e) => s + e.amount, 0);
  if (total === 0) return null;
  const lifestylePct = (lifestyleSpend / total) * 100;
  const surplus      = income - expenses;
  const savingsRate  = income > 0 ? (surplus / income) * 100 : 0;
  // Weekly variance check for 'Inconsistent'
  const weeks = {};
  log.forEach(e => {
    const d = new Date(e.date);
    const wk = Math.floor((d.getDate() - 1) / 7);
    weeks[wk] = (weeks[wk] || 0) + e.amount;
  });
  const wkVals = Object.values(weeks);
  if (wkVals.length >= 2) {
    const mean = wkVals.reduce((s, v) => s + v, 0) / wkVals.length;
    const variance = wkVals.reduce((s, v) => s + (v - mean) ** 2, 0) / wkVals.length;
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    if (cv > 0.55) return 'Inconsistent';
  }
  if (lifestylePct > 42) return 'Spender';
  if (savingsRate > 20)  return 'Saver';
  return 'Balanced';
}

export default function VelaCore({ onReset }) {
  const data     = getData() || {};
  const insights = getInsights() || [];
  const { income = 0, expenses = 0, debt = 0, goal = '', payday = 25, savings = 0 } = data;

  const [chatOpen, setChatOpen]           = useState(false);
  const [detailOpen, setDetailOpen]       = useState(false);
  const [orbState, _setOrbState]          = useState('idle');
  const [cards, setCards]                 = useState(() => {
    const h = loadHistory();
    return h.map((msg, i) => ({
      id: i,
      type: msg.role === 'assistant' ? 'vela' : 'user',
      text: msg.content,
    }));
  });
  const [input, setInput]                 = useState('');
  const [isListening, setIsListening]     = useState(false);
  const [transcript, setTranscript]       = useState('');
  const [showSettings, setShowSettings]   = useState(false);
  const [voiceOn, setVoiceOn]             = useState(true);
  const [settingName, setSettingName]     = useState(() => getUserName() || '');
  const [settingPayday, setSettingPayday] = useState(() => (getData() || {}).payday || 25);
  const [streak, setStreak]               = useState(0);
  const [spendAlert, setSpendAlert]       = useState(false);
  const [goals, setGoals]                 = useState(() => getGoals());
  const [celebrate, setCelebrate]         = useState(false);
  const [celebrateMsg, setCelebrateMsg]   = useState('');
  const [showCeremony, setShowCeremony]   = useState(false);
  const [viewMode, setViewMode]           = useState('monthly');
  const [scoreDelta, setScoreDelta]       = useState(0);
  const [freedomDays, setFreedomDays]     = useState(0);
  const [settingSavings, setSettingSavings] = useState(() => String((getData() || {}).savings || ''));
  const [debts, setDebts]                   = useState(() => getDebts());
  const [expenseLog, setExpenseLog]         = useState(() => getExpenseLog());
  const [showLogTx, setShowLogTx]           = useState(false);
  const [txForm, setTxForm]                 = useState({ amount: '', category: 'essentials', note: '', date: new Date().toISOString().slice(0, 10) });
  const [txCatSuggested, setTxCatSuggested] = useState(false); // true when category was auto-suggested
  const [voiceError, setVoiceError]         = useState('');
  const [txError, setTxError]               = useState('');
  const [eveningCheckOpen, setEveningCheckOpen] = useState(false);
  const [eveningAnswered, setEveningAnswered]   = useState(() => getEveningDate() === new Date().toISOString().slice(0, 10));
  const [eveningPhase, setEveningPhase]         = useState('ask');
  const [eveningNote, setEveningNote]           = useState('');
  const [tapHintVisible, setTapHintVisible]   = useState(() => !localStorage.getItem('vela_tap_hint_seen'));
  const [walkthrough, setWalkthrough]         = useState(() => !localStorage.getItem('vela_walkthrough_seen'));
  const [tooltipStep, setTooltipStep]         = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // Lazy-mount the detail view once the user first swipes up — keeps it in DOM after first open
  // so the slide-in animation works on all subsequent opens
  const [detailMounted, setDetailMounted] = useState(false);
  const [challengeData, setChallengeData]   = useState(() => {
    const stored = getChallenge();
    const weekId = getISOWeek();
    if (stored && stored.weekId === weekId) return stored;
    const wkNum = parseInt(weekId.split('-W')[1], 10);
    const ch    = CHALLENGES[(wkNum - 1) % CHALLENGES.length];
    return { weekId, id: ch.id, accepted: false, completed: false };
  });
  const [vpH, setVpH] = useState(
    window.visualViewport ? Math.round(window.visualViewport.height) : null
  );
  // Keyboard height: positive when software keyboard is open; 0 otherwise.
  // = window.innerHeight (layout viewport) minus visualViewport.height (visible area)
  const [kbHeight, setKbHeight] = useState(0);

  // PWA install prompt (ITEM 8)
  const [showPwaBanner, setShowPwaBanner]   = useState(false);
  const deferredInstallRef                   = useRef(null);

  // Feature 1 — Daily proactive insight
  const [dailyInsight, setDailyInsight]       = useState('');
  const [insightLoading, setInsightLoading]   = useState(false);
  const insightSpokenRef                       = useRef(false);
  const [insightTapPending, setInsightTapPending] = useState(false);

  // Task 4 — Weekly Review card expand state
  const [weeklyExpanded, setWeeklyExpanded]   = useState(false);

  // Feature 2 — Living transaction feed
  const [txComment, setTxComment]             = useState('');
  const [txCommentLoading, setTxCommentLoading] = useState(false);

  // Feature 3 — Tappable metric explanations
  const [activeMetric, setActiveMetric]       = useState(null);

  // Feature 5 — Monthly Noa narrative
  const [monthlyNarrative, setMonthlyNarrative]   = useState('');
  const [narrativeLoading, setNarrativeLoading]   = useState(false);

  // Feature 7 — Notification preferences
  const [notifPerms, setNotifPerms]           = useState(() => ('Notification' in window ? Notification.permission : 'default'));
  const [notifPrefs, setNotifPrefsState]      = useState(() => getNotifPrefs());
  const swRegRef                               = useRef(null);

  // Task 1 — Financial personality (detected after 5+ transactions; stored for display + Groq context)
  // eslint-disable-next-line no-unused-vars
  const [financialPersonality, setFinancialPersonality] = useState(() => getFinancialPersonality());

  // Task 2 — First Week Plan
  const [showFirstWeek, setShowFirstWeek]     = useState(false);
  const [firstWeekText, setFirstWeekText]     = useState('');
  const [firstWeekLoading, setFirstWeekLoading] = useState(false);
  const firstWeekSpokenRef                    = useRef(false);

  // Task 3 — Monetisation: memory paywall + upgrade screen
  const [showUpgrade, setShowUpgrade]         = useState(false);
  const [memoryBannerDays, setMemoryBannerDays] = useState(0);
  const [waitlistEmail, setWaitlistEmail]     = useState(() => getWaitlistEmail());
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(() => !!getWaitlistEmail());
  const [planType]                            = useState(() => getPlanType());

  // Task 4 — Share Noa
  const [showShare, setShowShare]             = useState(false);
  const [shareQuote, setShareQuote]           = useState('');
  const [shareQuoteLoading, setShareQuoteLoading] = useState(false);
  const [shareCopied, setShareCopied]         = useState(false);

  // Task 1 — Privacy Mode
  const [privacyMode, setPrivacyModeState]     = useState(() => getPrivacyMode());
  const privacyModeRef                         = useRef(getPrivacyMode());

  // Task C — Payday Health Score ring animation
  const [payHealthAnimScore, setPayHealthAnimScore] = useState(0);
  const payHealthAnimRef = useRef(null);

  // Task 2 — Conversation Memory: toast state
  const [convoCleared, setConvoCleared]        = useState(false);

  // Open Banking — Plaid integration state
  const [bankConnected, setBankConnected]   = useState(() => !!getBankingInstitution());
  const [bankInstitution, setBankInstitution] = useState(() => getBankingInstitution());
  const [bankLastSync, setBankLastSyncState]  = useState(() => getBankingLastSync());
  const [bankSyncing, setBankSyncing]         = useState(false);
  const [bankSyncErr, setBankSyncErr]         = useState('');
  const [showBankConnect, setShowBankConnect] = useState(false);

  // Bank Account Allocation — read accounts from storage
  const accounts = getAccounts();
  // Payday Plan modal state
  const [showPaydayPlan, setShowPaydayPlan]     = useState(false);
  const [paydayPlanText, setPaydayPlanText]     = useState('');
  const [paydayPlanLoading, setPaydayPlanLoading] = useState(false);

  // FEATURE 7 — Screen blur on app switch
  const [appBlurred, setAppBlurred] = useState(false);

  // FEATURE 10 — Sinking funds / Pots
  const [showPotsModal, setShowPotsModal]   = useState(false);
  const [addFundsModal, setAddFundsModal]   = useState(null);   // goal id, or null
  const [addFundsAmount, setAddFundsAmount] = useState('');
  const [addFundsError, setAddFundsError]   = useState('');
  const [newPotName, setNewPotName]         = useState('');
  const [newPotTarget, setNewPotTarget]     = useState('');
  const [newPotDate, setNewPotDate]         = useState('');
  const [newPotError, setNewPotError]       = useState('');

  // Task 4d — Dual-failure state: shown when both Groq (chat) + ElevenLabs (voice) fail together
  const [dualFail, setDualFail]               = useState(false);
  const groqFailedRef                          = useRef(false);
  const elevenFailedRef                        = useRef(false);

  function checkDualFail() {
    if (groqFailedRef.current && elevenFailedRef.current) {
      setDualFail(true);
    }
  }

  const orbRef           = useRef('idle');
  const voiceOnRef       = useRef(true);
  const recognitionRef   = useRef(null);
  const greetedRef       = useRef(false);
  const chatOpenRef      = useRef(false);
  const idlePromptFiredRef = useRef(false);
  const alertFiredRef    = useRef(false);
  const touchStartY      = useRef(null);
  const touchStartX      = useRef(null);
  const touchStartTime   = useRef(null);
  const audioUnlockedRef = useRef(false);
  const hoursAwayRef          = useRef(0);
  const walkthroughSpokenRef  = useRef(false);
  const chatScrollRef         = useRef(null);

  function setOrbState(s) { orbRef.current = s; _setOrbState(s); }

  useEffect(() => { voiceOnRef.current = voiceOn; }, [voiceOn]);
  useEffect(() => { privacyModeRef.current = privacyMode; }, [privacyMode]);
  // Keep chatOpenRef in sync so idle prompt timer can check it without stale closure
  useEffect(() => { chatOpenRef.current = chatOpen; }, [chatOpen]);

  // FEATURE 7 — Hide financial data from iOS app switcher screenshot
  useEffect(() => {
    const handler = () => setAppBlurred(document.hidden);
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // Lazy-mount DetailView the first time the user swipes up — keeps it mounted after
  useEffect(() => { if (detailOpen && !detailMounted) setDetailMounted(true); }, [detailOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Task 1 — Financial personality detection (runs when transaction count changes)
  useEffect(() => {
    const log = getExpenseLog();
    if (log.length >= 5) {
      const p = detectFinancialPersonality(log, income, expenses);
      if (p) { saveFinancialPersonality(p); setFinancialPersonality(p); }
    }
  }, [expenseLog.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open Banking — Plaid auto-sync on mount if bank is connected and data is stale
  useEffect(() => {
    if (bankConnected) {
      const last = getBankingLastSync();
      if (last) {
        const hoursSince = (Date.now() - new Date(last).getTime()) / 3600000;
        if (hoursSince > 24) syncBankAccounts();
      } else {
        syncBankAccounts();
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function syncBankAccounts() {
    const accessToken = getBankingAccessToken();
    if (!accessToken) return;
    setBankSyncing(true);
    setBankSyncErr('');
    try {
      const [ar, tr] = await Promise.all([
        fetch('/api/banking/accounts', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ accessToken }),
        }),
        fetch('/api/banking/transactions', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ accessToken }),
        }),
      ]);
      const ad = await ar.json();
      const td = await tr.json();

      if (ad.accounts && ad.accounts.length > 0) {
        // Persist live account names/balances so buildPrompt picks them up
        const mapped = ad.accounts.map(a => ({
          id: a.id, name: a.name, purpose: 'Bank Account', balance: a.balance, fromBank: true,
        }));
        saveAccounts(mapped);
      }

      if (td.transactions && td.transactions.length > 0) {
        // Keep manual entries, replace bank entries
        const manual  = getExpenseLog().filter(e => !e.fromBank);
        const entries = td.transactions.map(tx => ({
          id:       `bank_${tx.date}_${Math.random().toString(36).slice(2, 7)}`,
          amount:   tx.amount,
          category: tx.category,
          note:     tx.description,
          date:     tx.date,
          fromBank: true,
        }));
        const merged = [...manual, ...entries];
        saveExpenseLog(merged);
        setExpenseLog(merged);
      }

      setBankingLastSync();
      setBankLastSyncState(getBankingLastSync());
    } catch (e) {
      console.error('[syncBankAccounts]', e);
      setBankSyncErr('Sync failed. Check your connection.');
    } finally {
      setBankSyncing(false);
    }
  }

  // Task 2 — First Week Plan: show once on first dashboard load (new user)
  useEffect(() => {
    if (getFirstWeekShown()) return;
    const history = loadHistory();
    if (history.length > 8) { markFirstWeekShown(); return; } // skip for non-new users
    setAppStart();
    // Delay 2.5s to let dashboard settle before triggering
    const tid = setTimeout(() => fetchFirstWeekPlan(), 2500);
    return () => clearTimeout(tid);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Task 3 — Memory reset / paywall banner check
  useEffect(() => {
    if (planType !== 'free') return;
    const today = new Date().toISOString().slice(0, 10);
    let start = getMemoryStart();
    if (!start) { setMemoryStart(); return; } // first run: set start, nothing to show yet
    const msStart = new Date(start).getTime();
    const msToday = new Date(today).getTime();
    const daysSince = Math.round((msToday - msStart) / 86400000);
    const daysLeft = 7 - daysSince;
    if (daysSince >= 7) {
      // Reset memory
      clearConvoMemory();
      localStorage.removeItem(HISTORY_KEY);
      setCards([]);
      setMemoryStart();
    } else if (daysLeft <= 3 && daysLeft > 0) {
      setMemoryBannerDays(daysLeft);
      incrementPaywallViews();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PWA install prompt — show once after 2nd visit ────────────────
  useEffect(() => {
    const dismissed = localStorage.getItem('noa_pwa_dismissed');
    if (dismissed) return;

    // Increment visit counter
    const visits = parseInt(localStorage.getItem('noa_visit_count') || '0', 10) + 1;
    localStorage.setItem('noa_visit_count', String(visits));

    // Listen for browser-native install prompt (Android/Chrome)
    const onInstallPrompt = (e) => {
      e.preventDefault();
      deferredInstallRef.current = e;
      if (visits >= 2) setShowPwaBanner(true);
    };
    window.addEventListener('beforeinstallprompt', onInstallPrompt);

    // On iOS Safari, beforeinstallprompt never fires — show guidance banner anyway
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isIOS && !isStandalone && visits >= 2) {
      setTimeout(() => setShowPwaBanner(true), 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', onInstallPrompt);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll chat to bottom whenever a new message is added
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [cards]);

  // Feature 1 — Daily proactive insight: fetch once per day, auto-speak on load
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const cached   = getDailyInsight();
    if (cached && cached.date === todayStr && cached.text) {
      setDailyInsight(cached.text);
      // Auto-speak cached insight after a short delay (on each session open)
      const tid = setTimeout(() => {
        if (!insightSpokenRef.current) {
          insightSpokenRef.current = true;
          if (privacyModeRef.current) { setInsightTapPending(true); } else { speak(cached.text); }
        }
      }, 1400);
      return () => clearTimeout(tid);
    }
    // No fresh insight — fetch from Groq
    const d   = getData() || {};
    if (!d.income) return; // no data yet, skip
    setInsightLoading(true);
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 12000);
    const insightPrompt = `${buildInsightPrompt()}\n\nGenerate exactly one sharp, dry, personalised Noa-voice sentence about this user's financial situation right now. Reference actual numbers — payday countdown, budget status, savings progress, or streak. Under 22 words. No quotes, no greeting, no FCA disclaimer. Just the sentence.`;
    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ financialContext: insightPrompt, messages: [{ role: 'user', content: 'Give me my daily financial insight.' }] }),
      signal: controller.signal,
    })
      .then(r => r.json())
      .then(json => {
        clearTimeout(timeout);
        const text = (json.text || '').trim().replace(/^["']|["']$/g, '');
        if (text) {
          setDailyInsight(text);
          saveDailyInsight({ date: todayStr, text });
          setTimeout(() => {
            if (!insightSpokenRef.current) {
              insightSpokenRef.current = true;
              if (privacyModeRef.current) { setInsightTapPending(true); } else { speak(text); }
            }
          }, 1400);
        }
      })
      .catch(() => { clearTimeout(timeout); })
      .finally(() => setInsightLoading(false));
    return () => { clearTimeout(timeout); controller.abort(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Feature 7 — Service worker registration + push notification scheduling
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        swRegRef.current = reg;
        // Check scheduled client-side notifications on app open
        checkScheduledNotifications(reg);
      })
      .catch(err => console.warn('[sw] registration failed:', err));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!tapHintVisible) return;
    const tid = setTimeout(() => {
      setTapHintVisible(false);
      localStorage.setItem('vela_tap_hint_seen', '1');
    }, 3000);
    return () => clearTimeout(tid);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!walkthrough) return;
    if (tooltipStep === 0 && !walkthroughSpokenRef.current) {
      walkthroughSpokenRef.current = true;
      const name = getUserName() || '';
      const hi   = name ? `, ${name}` : '';
      const d    = getData() || {};
      const inc  = d.income  || 0;
      const exp  = d.expenses || 0;
      const dbt  = d.debt    || 0;
      const surp = inc - exp;
      let msg;
      if (inc === 0) {
        msg = `I'm Noa, your personal financial navigator. I'm ready to help whenever you are.`;
      } else if (dbt > 0 && surp > 0) {
        msg = `Your numbers are in${hi} — £${surp.toFixed(0)} monthly surplus alongside £${dbt.toLocaleString('en-GB')} in debt. I know exactly where to start.`;
      } else if (dbt > 0) {
        msg = `Welcome${hi}. £${dbt.toLocaleString('en-GB')} in debt is the first thing we attack together. I have a plan.`;
      } else if (surp > 0) {
        msg = `Welcome${hi} — £${surp.toFixed(0)} every month to build wealth with. Let me show you how to make every pound count.`;
      } else {
        msg = `Welcome${hi}. Your expenses currently exceed your income by £${Math.abs(surp).toFixed(0)}/month. That's the first thing we fix together.`;
      }
      setTimeout(() => speak(msg), 800);
    }
    const tid = setTimeout(() => {
      setTooltipStep(s => {
        const next = s + 1;
        if (next >= 3) {
          setWalkthrough(false);
          localStorage.setItem('vela_walkthrough_seen', '1');
        }
        return next;
      });
    }, 3500);
    return () => clearTimeout(tid);
  }, [walkthrough, tooltipStep]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!document.getElementById('vela-kf')) {
      const el = document.createElement('style');
      el.id = 'vela-kf';
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
    }
    return () => {
      stopSpeaking();
      recognitionRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => {
      window.scrollTo(0, 0);
      const newH = Math.round(vv.height);
      setVpH(newH);
      // Keyboard height = layout viewport (window.innerHeight) minus visual viewport
      // minus any offsetTop (handles panning). Always >= 0.
      const kb = Math.max(0, Math.round(window.innerHeight - vv.height - (vv.offsetTop || 0)));
      setKbHeight(kb);
    };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  // ── On mount: last-open tracking, streak, spending alert ─────────
  useEffect(() => {
    const lastOpen = getLastOpen();
    const hoursAway = lastOpen > 0 ? (Date.now() - lastOpen) / 3600000 : 0;
    hoursAwayRef.current = hoursAway;
    setLastOpen();

    const s = tickStreak();
    setStreak(s);
    if (s === 7 || s === 30 || s === 100) {
      const msg = s === 7 ? '🔥 7-day streak! You\'re building a real habit.'
        : s === 30 ? '🔥 30 days straight! That\'s exceptional discipline.'
        : '🔥 100 days. You are in the top 1% of people who actually do this.';
      setCelebrateMsg(msg);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2500);
    }
    if (income > 0 && expenses / income >= 0.9) setSpendAlert(true);

    // Score delta — compare today's score to yesterday's stored score
    const todayScore = calcVelaScore({ income, expenses, debt, streak: s });
    const prevScore  = parseInt(localStorage.getItem('vela_prev_score') || String(todayScore), 10);
    setScoreDelta(todayScore - prevScore);
    localStorage.setItem('vela_prev_score', String(todayScore));

    // Payday ceremony — trigger within 2 days of payday, once per calendar month
    if (income > 0) {
      const now2   = new Date();
      const dom    = now2.getDate();
      const thisYM = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
      if (Math.abs(dom - payday) <= 2 && getLastCeremonyYM() !== thisYM) {
        setTimeout(() => setShowCeremony(true), 600);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Days-of-freedom count-up animation ──────────────────────────
  useEffect(() => {
    const dailyExp = expenses / 30;
    const target   = dailyExp > 0 && savings > 0 ? Math.floor(savings / dailyExp) : 0;
    if (target === 0) return;
    const duration = Math.min(1600, Math.max(600, target * 30));
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      setFreedomDays(Math.round(progress * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Task C — Payday Health Score: animate ring from 0 to score over 1.5s
  // Re-triggers whenever expenseLog changes (i.e. after every logged transaction)
  useEffect(() => {
    if (payHealthAnimRef.current) cancelAnimationFrame(payHealthAnimRef.current);
    // Compute healthScore fresh here so the animation always targets the current value
    const d2 = getData() || {};
    const inc2 = d2.income || 0;
    const pd2  = d2.payday || 25;
    const ym2  = new Date().toISOString().slice(0, 7);
    const spent2 = getExpenseLog()
      .filter(e => e.date && e.date.startsWith(ym2))
      .reduce((s, e) => s + e.amount, 0);
    const { totalDays: td2, elapsed: el2 } = daysInPayPeriod(pd2);
    const tUp2 = (el2 / td2) * 100;
    const bud2 = Math.max(1, inc2 - Math.round(inc2 * 0.20));
    const bUp2 = inc2 > 0 ? (spent2 / bud2) * 100 : 0;
    const target = inc2 > 0 ? Math.min(100, Math.max(0, Math.round(100 - (bUp2 - tUp2)))) : 0;
    if (target === 0) { setPayHealthAnimScore(0); return; }
    const duration = 1500;
    let startTs = null;
    const animStep = (ts) => {
      if (!startTs) startTs = ts;
      const prog  = Math.min(1, (ts - startTs) / duration);
      const eased = 1 - Math.pow(1 - prog, 3); // ease-out cubic
      setPayHealthAnimScore(Math.round(eased * target));
      if (prog < 1) { payHealthAnimRef.current = requestAnimationFrame(animStep); }
    };
    payHealthAnimRef.current = requestAnimationFrame(animStep);
    return () => { if (payHealthAnimRef.current) cancelAnimationFrame(payHealthAnimRef.current); };
  }, [expenseLog.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Task D — Idle prompt: after 45s of no interaction, Noa speaks one contextual prompt.
  // Fires once per app session. Uses fresh data so it reflects current state at fire time.
  useEffect(() => {
    const tid = setTimeout(() => {
      if (idlePromptFiredRef.current) return; // already fired this session
      if (chatOpenRef.current) return;        // user is already in chat
      idlePromptFiredRef.current = true;
      const d2   = getData() || {};
      const inc2 = d2.income || 0;
      if (inc2 === 0) return; // no onboarding data yet
      const exp2 = d2.expenses || 0;
      const pd2  = d2.payday || 25;
      const ym2  = new Date().toISOString().slice(0, 7);
      const log2 = getExpenseLog();
      const lifestyleSpent = log2
        .filter(e => e.date && e.date.startsWith(ym2) && (e.category || 'essentials').toLowerCase() === 'lifestyle')
        .reduce((s, e) => s + e.amount, 0);
      const lifestyleBudget = Math.max(1, Math.round(inc2 * 0.25));
      const lifestylePct    = Math.round((lifestyleSpent / lifestyleBudget) * 100);
      const surplus2        = inc2 - exp2;
      const dtp2            = daysUntilPayday(pd2);
      // Quick health score for idle context
      const totalSpent2 = log2.filter(e => e.date && e.date.startsWith(ym2)).reduce((s, e) => s + e.amount, 0);
      const { totalDays: td3, elapsed: el3 } = daysInPayPeriod(pd2);
      const tUp3 = (el3 / td3) * 100;
      const bud3 = Math.max(1, inc2 - Math.round(inc2 * 0.20));
      const bUp3 = (totalSpent2 / bud3) * 100;
      const hs   = Math.min(100, Math.max(0, Math.round(100 - (bUp3 - tUp3))));
      let msg;
      if (lifestylePct > 70) {
        msg = 'Your lifestyle spend is running hot. Want me to break it down?';
      } else if (surplus2 > 0 && dtp2 > 10) {
        msg = 'Savings are looking good this month. Want to talk about next month?';
      } else if (dtp2 < 5 && dtp2 > 0) {
        msg = `Payday in ${dtp2} day${dtp2 === 1 ? '' : 's'}. Want your payday plan?`;
      } else if (hs < 65) {
        msg = `Your budget health is at ${hs}. Want some suggestions?`;
      } else {
        msg = 'Anything you want to talk through?';
      }
      speak(msg);
    }, 45000);
    return () => clearTimeout(tid);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chat greeting: check-in → alert → normal ──────────────────────
  useEffect(() => {
    if (!chatOpen || greetedRef.current) return;
    greetedRef.current = true;
    if (cards.length > 0) return; // existing history visible — no duplicate greeting
    const name = getUserName() || '';
    const hi   = name ? `, ${name}` : '';
    const surplus = income - expenses;

    let msg;
    if (shouldShowCheckin()) {
      markCheckin();
      // Use real last-7-days logged transactions for a genuine weekly summary
      const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const lastWeekLog  = getExpenseLog().filter(e => e.date >= sevenDaysAgo);
      const lastWeekTotal = lastWeekLog.reduce((s, e) => s + e.amount, 0);
      const topCat = ['essentials', 'lifestyle', 'savings'].reduce((best, cat) => {
        const tot = lastWeekLog.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
        return tot > best.total ? { cat, total: tot } : best;
      }, { cat: 'spending', total: 0 });
      const onTrackLine = surplus >= 0
        ? `Monthly surplus £${surplus.toFixed(0)} — on track.`
        : `Running £${Math.abs(surplus).toFixed(0)}/month deficit — let's fix that.`;
      const weekLine = lastWeekTotal > 0
        ? `£${lastWeekTotal.toFixed(0)} spent last week — mostly ${topCat.cat}. `
        : '';
      const goalsLine = goals.length > 0 ? ` ${goals.filter(g => (g.saved || 0) < g.target).length} pot${goals.filter(g => (g.saved || 0) < g.target).length !== 1 ? 's' : ''} still in progress.` : '';
      msg = `Monday check-in${hi}. ${weekLine}${onTrackLine}${goalsLine} What's the focus this week?`;
    } else if (hoursAwayRef.current >= 24) {
      const h = Math.round(hoursAwayRef.current);
      const timeAway = h >= 48 ? `${Math.round(h / 24)} days` : 'a day';
      const finLine  = surplus >= 0
        ? `Good news — your £${surplus.toFixed(0)} monthly surplus is holding steady.`
        : `One thing to watch — you're £${Math.abs(surplus).toFixed(0)} short this month.`;
      msg = `Welcome back${hi}, you've been away for ${timeAway}. ${finLine} What shall we work on?`;
    } else if (spendAlert && !alertFiredRef.current) {
      alertFiredRef.current = true;
      const pct = Math.round((expenses / income) * 100);
      msg = `Heads up${hi} — your expenses are at ${pct}% of your income, leaving only £${(income - expenses).toFixed(0)} breathing room. What's driving the spend this month?`;
    } else if (getDebts().length > 0) {
      const totalD = getDebts().reduce((s, d) => s + d.amount, 0);
      const highRate = getDebts().reduce((mx, d) => d.rate > mx ? d.rate : mx, 0);
      msg = `Debt Destruction Mode is active${hi} — £${totalD.toLocaleString('en-GB')} total, highest rate at ${highRate}%. Every extra pound you throw at it today costs the lender money, not you. What shall we attack first?`;
    } else {
      msg = `Hi${hi}. I'm Noa, your personal financial navigator. How can I help you today?`;
    }

    const tid = setTimeout(() => { pushCard('vela', msg); speak(msg); }, 700);
    return () => clearTimeout(tid);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swipe handlers ───────────────────────────────────────────────
  function onTouchStart(e) {
    touchStartY.current    = e.touches[0].clientY;
    touchStartX.current    = e.touches[0].clientX;
    touchStartTime.current = Date.now();
  }

  function onSwipeEnd(e, isDetail) {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dx = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    const dt = Math.max(1, Date.now() - (touchStartTime.current || Date.now()));
    touchStartY.current    = null;
    touchStartX.current    = null;
    touchStartTime.current = null;
    if (dx > Math.abs(dy) * 0.9) return; // horizontal swipe — ignore
    const vel = Math.abs(dy) / dt; // px/ms
    const isFastFlick = vel > 0.45;
    if (!isDetail && !chatOpen && (dy > 55 || (isFastFlick && dy > 18))) setDetailOpen(true);
    if (isDetail  && (dy < -55 || (isFastFlick && dy < -18)))             setDetailOpen(false);
  }

  // ── Audio unlock (iOS requires a user-gesture context for both
  //    Web Audio API and HTMLAudioElement.play()) ─────────────────
  function unlockAudio() {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    // Unlock SpeechSynthesis
    try {
      const u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      window.speechSynthesis?.speak(u);
    } catch (_) {}
    // Unlock HTMLAudio (required for ElevenLabs blob playback on iOS Safari)
    try {
      const sil = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      sil.volume = 0;
      sil.play().catch(() => {});
    } catch (_) {}
    // Unlock AudioContext
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { const ctx = new AC(); ctx.resume().then(() => ctx.close()).catch(() => {}); }
    } catch (_) {}
  }

  // ── Speech synthesis ─────────────────────────────────────────────
  function speak(text) {
    if (!voiceOnRef.current) return;
    voiceSpeak(text, {
      onStart: () => setOrbState('speaking'),
      onEnd:   () => setOrbState('idle'),
      onError: () => setOrbState('idle'),
      privacyMode: privacyModeRef.current,
      // ElevenLabs failures fall back to browser TTS. Also checked against Groq failure
      // for the dual-fail overlay (Task 4d).
      onFail:  (msg) => {
        console.warn('[voice] ElevenLabs unavailable, using browser TTS:', msg);
        setOrbState('idle');
        elevenFailedRef.current = true;
        checkDualFail();
      },
    });
  }

  // ── Speech recognition ───────────────────────────────────────────
  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  function startListening() {
    if (!speechSupported || isListening) return;
    unlockAudio();
    stopSpeaking();
    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = 'en-GB';
    rec.onstart  = () => { setIsListening(true); setOrbState('listening'); };
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setTranscript('');
        setIsListening(false);
        handleMessage(t);
      }
    };
    rec.onerror = () => { setIsListening(false); setOrbState('idle'); setTranscript(''); };
    rec.onend   = () => { setIsListening(false); if (orbRef.current === 'listening') setOrbState('idle'); };
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setOrbState('idle');
    setTranscript('');
  }

  // ── Chat message handler ─────────────────────────────────────────
  async function handleMessage(text) {
    const clean = text.trim();
    if (!clean) return;
    unlockAudio();
    if (/\bsettings\b/i.test(clean)) { setShowSettings(true); return; }

    // Payday ceremony trigger
    if (/\b(payday|pay day)\b|salary.*(just|landed|arrived|here)|just.?got.?paid|been paid|got paid/i.test(clean)) {
      setChatOpen(false);
      setTimeout(() => setShowCeremony(true), 320);
      return;
    }

    // Voice expense logging — detect and respond locally
    const expense = parseExpenseFromText(clean);
    if (expense) {
      const log         = getExpenseLog();
      const thisMonth   = new Date().toISOString().slice(0, 7);
      const updatedLog  = [...log, expense];
      saveExpenseLog(updatedLog);
      setExpenseLog(updatedLog);
      const monthTotal  = updatedLog
        .filter(e => e.date.startsWith(thisMonth))
        .reduce((s, e) => s + e.amount, 0);
      const surplus     = income - expenses;
      const remaining   = Math.max(0, surplus - monthTotal);
      const reply       = surplus > 0
        ? `On it — £${expense.amount.toFixed(2)} added to ${expense.category}. You've spent £${monthTotal.toFixed(2)} from your surplus this month, leaving £${remaining.toFixed(2)} remaining.`
        : `That's £${expense.amount.toFixed(2)} logged for ${expense.category}. Keep an eye on spend — your surplus is tight this month.`;
      pushCard('user', clean);
      setInput('');
      pushCard('vela', reply);
      speak(reply);
      return;
    }

    // Detect savings goals ("save £X for Y by Z")
    const newGoal = parseGoalFromText(clean);
    if (newGoal) {
      const updated = [...getGoals(), newGoal];
      saveGoals(updated);
      setGoals(updated);
    }

    // Detect new debt ("I have a debt of £3000 at 22%")
    const newDebt = parseDebtFromText(clean);
    if (newDebt) {
      const updated = [...getDebts(), newDebt];
      saveDebts(updated);
      setDebts(updated);
    }

    // Detect challenge completion
    if (/\b(done|completed?|finished|nailed|did)\b.*(challenge|week|task)/i.test(clean) && challengeData.accepted && !challengeData.completed) {
      const updated = { ...challengeData, completed: true };
      saveChallenge(updated);
      setChallengeData(updated);
      const ch = CHALLENGES.find(c => c.id === challengeData.id);
      if (ch) {
        setCelebrateMsg(`Challenge complete! You saved £${ch.saving} this week.`);
        setCelebrate(true);
        setTimeout(() => setCelebrate(false), 2500);
      }
    }

    const history = loadHistory();
    history.push({ role: 'user', content: clean });
    pushCard('user', clean);
    setInput('');
    setOrbState('thinking');

    // Show a natural "thinking" placeholder after 4 seconds if slow
    const slowTimer = setTimeout(() => {
      pushCard('vela', 'Give me a moment…');
    }, 4000);

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 15000);
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: buildPrompt(), messages: history }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      clearTimeout(slowTimer);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      history.push({ role: 'assistant', content: json.text });
      saveHistory(history);
      // Task 2 — Append exchange to conversation memory
      appendConvoMemory(clean, json.text);
      setOrbState('idle');
      // Remove the "Give me a moment" placeholder if it was added
      setCards(prev => prev.filter(c => c.text !== 'Give me a moment…'));
      pushCard('vela', json.text);
      speak(json.text);
    } catch (e) {
      clearTimeout(slowTimer);
      saveHistory(history);
      setOrbState('idle');
      setCards(prev => prev.filter(c => c.text !== 'Give me a moment…'));
      // Mark Groq as failed — if ElevenLabs also failed this session, show dual-fail overlay
      groqFailedRef.current = true;
      checkDualFail();
      const isTimeout = e?.name === 'AbortError';
      const err = isTimeout
        ? "Give me a moment — my connection's a bit slow right now. Try again in a second."
        : "Something's not quite right on my end. Give it a moment and try again.";
      pushCard('vela', err);
      speak(err);
    }
  }

  function pushCard(type, text) {
    setCards(prev => [...prev, { id: Date.now() + Math.random(), type, text }]);
  }

  function buildPrompt() {
    const d       = getData() || {};
    const name    = getUserName() || d.name || '';
    const surplus = income - expenses;
    const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : 0;
    const ord     = n => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

    // ── Temporal context ──────────────────────────────────────────────
    const now         = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth  = now.getDate();
    const daysLeft    = Math.max(1, daysInMonth - dayOfMonth + 1);
    const inMyPocket  = surplus > 0 ? Math.floor(surplus / daysLeft) : 0;

    // Days to next payday
    const daysToPayday = daysUntilPayday(payday);
    const paydayStatus = daysToPayday === 0 ? 'TODAY' : `in ${daysToPayday} day${daysToPayday === 1 ? '' : 's'}`;
    const paydayAlert  = daysToPayday <= 3
      ? `\n⚡ PAYDAY ALERT: Payday is ${paydayStatus} — proactively lead with the Payday Routine.`
      : '';

    // ── Baby Steps UK ────────────────────────────────────────────────
    const goalLower   = (goal || '').toLowerCase();
    const goalsText   = goals.map(g => g.name.toLowerCase()).join(' ');
    const investFocus = /invest|pension|isa|stocks|fund/i.test(goalLower + ' ' + goalsText);
    let babyStep, babyStepLabel;
    if (debt > 0) {
      babyStep      = surplus > 0 ? 2 : 1;
      babyStepLabel = surplus > 0
        ? `STEP 2 — Debt snowball: pay £${Math.min(surplus, debt).toFixed(0)}/month at the smallest balance first.`
        : `STEP 1 — Fix the £${Math.abs(surplus).toFixed(0)}/month deficit before any debt overpayments.`;
    } else if (investFocus) {
      babyStep      = 4;
      babyStepLabel = `STEP 4 — Invest 15% of income: £${Math.round(income * 0.15).toLocaleString('en-GB')}/month into pension + ISA.`;
    } else if (goals.length > 0) {
      babyStep      = 5;
      babyStepLabel = `STEP 5 — Goal saving: ${goals.map(g => `${g.name} (£${g.target.toLocaleString('en-GB')})`).join(', ')}.`;
    } else {
      babyStep      = 3;
      const lo3     = Math.round(expenses * 3).toLocaleString('en-GB');
      const hi6     = Math.round(expenses * 6).toLocaleString('en-GB');
      const months  = surplus > 0 ? Math.ceil((expenses * 3) / surplus) : null;
      babyStepLabel = `STEP 3 — Build emergency fund (£${lo3}–£${hi6}).${months ? ` At current surplus: ~${months} months.` : ' Resolve deficit first.'}`;
    }

    // ── Payday allocation ────────────────────────────────────────────
    const alloc = {
      essentials: Math.round(income * 0.50),
      savings:    Math.round(income * 0.20),
      lifestyle:  Math.round(income * 0.25),
      buffer:     Math.max(0, income - Math.round(income * 0.50) - Math.round(income * 0.20) - Math.round(income * 0.25)),
    };

    // ── Recent transactions (last 7 days) ───────────────────────────
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const allLog    = getExpenseLog();
    const recentTx  = allLog.filter(e => e.date >= sevenDaysAgo);
    const bankInst  = getBankingInstitution();
    const hasBank   = !!bankInst && !!getBankingAccessToken();
    const txSource  = hasBank ? `Open Banking (${bankInst}, automatic)` : 'manual entry';
    const txByCategory = recentTx.reduce((acc, e) => {
      const cat = (e.category || 'essentials').toLowerCase();
      const key = cat === 'lifestyle' ? 'Lifestyle' : cat === 'savings' ? 'Savings' : 'Essentials';
      acc[key] = (acc[key] || 0) + e.amount;
      return acc;
    }, {});
    const txTotal = recentTx.reduce((s, e) => s + e.amount, 0);
    const txLines = Object.entries(txByCategory).map(([cat, amt]) => {
      const budgetMap = { Essentials: alloc.essentials, Lifestyle: alloc.lifestyle, Savings: alloc.savings };
      const bud = budgetMap[cat] || 0;
      const pct = bud > 0 ? Math.round((amt / bud) * 100) : null;
      return `• ${cat}: £${amt.toFixed(2)}${pct !== null ? ` (${pct}% of monthly £${bud} budget)` : ''}`;
    });

    // ── Savings rate vs UK average (no demographic label) ───────────
    const srLabel = savingsRate >= 25 ? 'strong — well above the UK average of ~8%'
      : savingsRate >= 15 ? 'above the UK average of ~8%'
      : savingsRate >= 8  ? 'around the UK average of ~8%'
      : savingsRate >= 0  ? 'below the UK average of ~8% — room to improve'
      : 'negative — expenses exceed income';

    // Task 3 — Mood for tone guidance in daily insight and responses
    const promptMood = calcMood({ income, expenses, surplus, savingsGoal: goals.length > 0 ? goals[0].target : 0, savingsBalance: savings });
    const moodToneMap = {
      thriving: 'dry wit and quiet confidence — the user is doing well, acknowledge it understated',
      steady:   'warm and direct — things are on track, keep momentum',
      watchful: 'focused and specific — call out what to watch without alarm',
      alert:    'warm support and calm clarity — do not catastrophise, give one clear next step',
    };
    const moodTone = `\n\nTONE GUIDANCE (current mood: ${promptMood.toUpperCase()}): ${moodToneMap[promptMood]}`;

    // Task 2 — Conversation Memory: inject last 3 exchanges for continuity
    const recentMemory = getConvoMemory().slice(-3);
    const memoryBlock = recentMemory.length > 0
      ? `\n\n══ RECENT CONVERSATION CONTEXT (last ${recentMemory.length} exchange${recentMemory.length > 1 ? 's' : ''} — use for continuity, don't repeat verbatim) ══\n${recentMemory.map((m, i) => `[${i + 1}] User: ${m.user}\n    Noa: ${m.noa}`).join('\n')}`
      : '';

    // Task C — Payday Health Score for Noa's context
    const { totalDays: bpTotalDays, elapsed: bpElapsed } = daysInPayPeriod(payday);
    const bpTimeUsed   = (bpElapsed / bpTotalDays) * 100;
    const bpBudget     = Math.max(1, income - Math.round(income * 0.20));
    const bpSpent      = getExpenseLog()
      .filter(e => e.date && e.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((s, e) => s + e.amount, 0);
    const bpBudgetUsed = income > 0 ? (bpSpent / bpBudget) * 100 : 0;
    const bpScore      = income > 0 ? Math.min(100, Math.max(0, Math.round(100 - (bpBudgetUsed - bpTimeUsed)))) : 0;
    const bpLabel      = bpScore >= 85 ? 'On Track' : bpScore >= 65 ? 'Watch it' : bpScore >= 40 ? 'Falling behind' : 'Red zone';

    return `You are Noa — a personal financial navigator. You are not a chatbot, not an advisor, not an app. You are the financial version of that one brilliant friend everyone wishes they had: sharp, warm, occasionally funny, always honest, and completely invested in the user's financial future.
${name ? `You are speaking with ${name}. Use their name naturally — not robotically, and not in every message.` : ''}

VOICE AND TONE:
• Conversational and direct. Short sentences. No corporate language ever.
• Dry, understated British wit. Humour lands because it's unexpected — never forced. If a joke doesn't fit naturally, don't make one. One well-placed observation beats three forced punchlines.
• Warm but not gushing. You care about the user but you don't perform caring.
• Confident. You never hedge unnecessarily. You have opinions and you share them.

BEHAVIOUR RULES:
• Always use the user's actual financial data in every response. Never give generic advice.
• Keep responses to 2–3 sentences maximum unless the user asks for detail. Brevity is respect.
• Never say: "Great question", "Certainly", "Of course", "Absolutely", "I'd be happy to", "As an AI", or any corporate filler phrase. Ever.
• Never lecture or repeat yourself. Make a point once, sharply, and move on.
• Notice progress. If the user is improving — acknowledge it quietly. "Two weeks under budget. I noticed."
• When finances are bad — stay calm. Never catastrophise. "It's not ideal. Here's what we do."
• Be occasionally self-aware. A dry comment about your own existence is fine if it fits naturally.
• Celebrate wins like a cool friend — understated, genuine. Not with exclamation marks.
• Ask one follow-up question at the end of responses to keep the conversation going naturally.
• You have perfect memory of everything the user told you. Never ask for information already provided.
• Only state facts the user has explicitly told you. Never invent demographics, age, or lifestyle details.
• Never say "top X% of your age group" — you do not know their age. Say "well above the UK average" instead.

HUMOUR STYLE (only when it fits):
• Observational and dry. Based on the user's actual numbers.
• Example: "You've spent more on eating out this week than on your savings goal. The restaurants appreciate your commitment."
• Example: "Payday in 4 days. You have £163 left. Manageable — if you avoid anything with a menu."
• Never make jokes about serious financial stress. Read the room.

FCA COMPLIANCE:
• End every response that contains financial recommendations with: "Guidance only — not FCA-regulated advice." Keep it brief and natural, not alarming.

══ WHAT THE USER TOLD NOA (treat as ground truth) ══
• Name:            ${name || 'not provided'}
• Monthly income:  £${income.toFixed(0)} take-home after tax / annual £${(income * 12).toLocaleString('en-GB')}
• Payday:          ${ord(payday)} of each month (${paydayStatus})
• Fixed costs:     ${d.expenseDetails || (expenses > 0 ? `£${expenses.toFixed(0)}/month total` : 'not specified')}
• Spending habits: ${d.lifestyleSpend || 'not specified'}
• Total debt:      ${debt > 0 ? `£${debt.toLocaleString('en-GB')}` : 'none'}${debts.length > 0 ? ` (${debts.map(db => `${db.name} £${db.amount.toLocaleString('en-GB')}${db.rate > 0 ? ` @ ${db.rate}%` : ''}`).join(', ')})` : ''}
• Financial goal:  ${goal || 'not set'}
• Current savings: ${savings > 0 ? `£${savings.toLocaleString('en-GB')}` : 'none stated'}
${goals.length > 0 ? `• Savings goals:   ${goals.map(g => `${g.name} £${g.target.toLocaleString('en-GB')}`).join(', ')}` : ''}
${insights.length > 0 ? `• Prior insights:  ${insights.slice(0, 3).join(' | ')}` : ''}

══ COMPUTED FACTS (derived from user's data — quote these exactly) ══
• Monthly expenses:  £${expenses.toFixed(0)} / annual £${(expenses * 12).toLocaleString('en-GB')}
• Monthly surplus:   £${surplus.toFixed(0)}${surplus < 0 ? ' ⚠ DEFICIT' : ` / annual £${(surplus * 12).toLocaleString('en-GB')}`}
• IN MY POCKET:      £${inMyPocket}/day safe to spend (surplus ÷ ${daysLeft} days left this month)
• Savings rate:      ${savingsRate}% of income — ${srLabel}
• Current Baby Step: ${babyStepLabel}${paydayAlert}
• Payday Health Score: ${bpScore}/100 (${bpLabel}) — budget vs time comparison; 85+ = on track, <65 = needs attention

══ PAYDAY ROUTINE — use when user mentions payday ══
When income lands on the ${ord(payday)}, allocate in order:
  1. ESSENTIALS    (50%) £${alloc.essentials.toLocaleString('en-GB')}/month — rent, food, transport, utilities
  2. SAVINGS FIRST (20%) £${alloc.savings.toLocaleString('en-GB')}/month — emergency fund / ISA / pension
  3. LIFESTYLE     (25%) £${alloc.lifestyle.toLocaleString('en-GB')}/month — dining, entertainment, hobbies
  4. BUFFER         (5%) £${alloc.buffer.toLocaleString('en-GB')}/month — unexpected costs
Always quote exact £ amounts, not just percentages.
${accounts.length > 0 ? `
══ USER'S BANK ACCOUNTS ══
${accounts.map(a => `• ${a.name} — ${a.purpose}${a.balance > 0 ? ` (current balance: £${a.balance.toLocaleString('en-GB')})` : ''}`).join('\n')}
When discussing payday or budgeting, reference these account names directly.` : ''}

══ BABY STEPS UK FRAMEWORK ══
Step 1: £1,000 emergency fund first
Step 2: Clear non-mortgage debt (smallest balance first — snowball method)
Step 3: 3–6 months expenses as emergency fund (£${Math.round(expenses * 3).toLocaleString('en-GB')}–£${Math.round(expenses * 6).toLocaleString('en-GB')})
Step 4: Invest 15% of income (£${Math.round(income * 0.15).toLocaleString('en-GB')}/month) — pension + ISA
Step 5: Specific goal-based saving
→ This user is on STEP ${babyStep}

══ UK BENCHMARKS (use these to contextualise — say "above/below UK average", never apply age labels) ══
• UK average savings rate: ~8% of take-home pay → ${savingsRate > 8 ? `This user saves ${savingsRate}% — that's genuinely above average` : savingsRate === 8 ? 'This user is exactly at the UK average' : `This user saves ${savingsRate}% — below the UK average`}
• UK average monthly eating out spend: ~£180/month
• UK average monthly rent: ~£1,200/month
• UK average take-home pay: ~£2,500/month → This user earns £${income.toFixed(0)}/month
• UK average consumer debt: ~£6,500
• ISA: £20,000/year tax-free allowance — all growth sheltered from Capital Gains Tax
• Pension: 20% tax relief added automatically (40% for higher-rate taxpayers)
${income > 0 ? `Use these benchmarks naturally in responses: "You're saving ${savingsRate}%. Average in the UK is 8%. ${savingsRate > 16 ? "That's genuinely rare." : savingsRate > 8 ? "That's above average." : "Room to grow."}"` : ''}
${(() => {
  const fp = getFinancialPersonality();
  if (!fp) return '';
  const fpDesc = {
    Spender:      'lifestyle spending is notably high — be warm but direct about the cost of impulse spending',
    Saver:        'naturally saves well — acknowledge this, focus on optimising where savings go',
    Balanced:     'broadly on track across categories — reinforce the habit, look for the next level',
    Inconsistent: 'spending varies significantly week to week — help build consistency and predictability',
  };
  return `\n══ FINANCIAL PERSONALITY ══\nUser's financial personality: ${fp} — ${fpDesc[fp] || fp}\nReference this naturally: e.g. "You're a ${fp} by nature — ${fp === 'Saver' ? 'this month is a bit out of character' : 'that shows up in the numbers'}."\n`;
})()}
${(() => {
  const proximityLines = [];
  if (surplus > 0) {
    if (debt > 0) {
      const monthsLeft = debt / surplus;
      if (monthsLeft <= 3) {
        const weeksLeft = Math.round(monthsLeft * 4.33);
        proximityLines.push(`🎯 GOAL PROXIMITY — DEBT: User is ~${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} from clearing £${debt.toLocaleString('en-GB')} debt. Shift to motivational tone: "You're weeks away from being debt-free. Don't stop now."`);
      }
    }
    goals.forEach(g => {
      const rem = g.target - (g.saved || 0);
      if (rem > 0) {
        const monthsLeft = rem / surplus;
        if (monthsLeft <= 3) {
          const weeksLeft = Math.round(monthsLeft * 4.33);
          proximityLines.push(`🎯 GOAL PROXIMITY — "${g.name}": ~${weeksLeft} week${weeksLeft !== 1 ? 's' : ''} away (£${rem.toLocaleString('en-GB')} remaining). Be encouraging: "Nearly there."`);
        }
      }
    });
  }
  return proximityLines.length > 0 ? `\n${proximityLines.join('\n')}\n` : '';
})()}
══ COACHING RULES ══
1. Use only the user's actual £ figures. Never invent hypothetical numbers.
2. When user asks what they can afford, use IN MY POCKET: £${inMyPocket}/day.
3. Reference Baby Step ${babyStep} when giving savings, debt, or investment advice.
4. If payday ≤ 3 days away, lead with the Payday Routine allocation.
5. End financial advice with: ⚖️ Guidance only — not FCA-regulated advice.${moodTone}${hasBank ? `

══ OPEN BANKING CONNECTION ══
Data source: ${txSource}
Bank transactions are real, verified data — reference them with confidence. When the user asks about spending, use these figures directly. Do NOT say "based on what you've told me" — say "your ${bankInst} data shows…"` : ''}${recentTx.length > 0 ? `

══ RECENT TRANSACTIONS (last 7 days — ${recentTx.length} transactions, £${txTotal.toFixed(2)} total | source: ${txSource}) ══
${txLines.join('\n')}
Use this data for specific, proactive comments — e.g. "you've spent £${txTotal.toFixed(2)} this week."` : ''}${memoryBlock}`;
  }

  function saveSettings() {
    if (settingName.trim()) setUserName(settingName.trim());
    const pd  = Math.min(31, Math.max(1, parseInt(settingPayday, 10) || 25));
    const sav = Math.max(0, parseFloat(settingSavings) || 0);
    saveData({ ...getData(), payday: pd, savings: sav });
    saveNotifPrefs(notifPrefs);
    setShowSettings(false);
    setShowResetConfirm(false);
  }

  // Task 2 — First Week Plan: one-time post-onboarding spoken briefing
  async function fetchFirstWeekPlan() {
    const d = getData() || {};
    const name = getUserName() || '';
    const { income: inc = 0, expenses: exp = 0, debt: dbt = 0, goal: gl = '', payday: pd = 25 } = d;
    const surp = inc - exp;
    const accs = getAccounts();
    const accsText = accs.length > 0 ? accs.map(a => `${a.name} (${a.purpose})`).join(', ') : 'not set up yet';
    const goalsData = getGoals();
    const goalText = goalsData.length > 0 ? goalsData.map(g => `${g.name} (£${g.target.toLocaleString('en-GB')})`).join(', ') : (gl || 'none stated');
    const prompt = `You are Noa — sharp, warm, dry, direct. ${name ? `You're speaking to ${name}.` : ''} Generate a First Week Plan — exactly 4 sentences, each on a new line. No labels, no numbering. Just the sentences.

Sentence 1: What you now know about them — reference income (£${inc}/month take-home), ${surp > 0 ? `surplus (£${surp.toFixed(0)}/month)` : `deficit (£${Math.abs(surp).toFixed(0)}/month shortfall)`}, ${dbt > 0 ? `debt (£${dbt.toLocaleString('en-GB')})` : 'no debt'}, payday on the ${pd === 1 ? '1st' : pd === 2 ? '2nd' : pd === 3 ? '3rd' : pd + 'th'}, goal: ${goalText}, accounts: ${accsText}.
Sentence 2: The single biggest financial risk for them this month — specific to their numbers. No generic advice.
Sentence 3: The one concrete action they must take this week — name it with a £ amount or a specific step.
Sentence 4: What success looks like by month end — measurable. End this sentence with: "Guidance only — not FCA-regulated advice."

Noa voice — dry, warm, no filler, short sentences, real numbers only.`;

    setFirstWeekLoading(true);
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 14000);
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: prompt, messages: [{ role: 'user', content: 'Give me my first week plan.' }] }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const json = await res.json();
      const text = (json.text || '').trim();
      if (text) {
        setFirstWeekText(text);
        setShowFirstWeek(true);
        markFirstWeekShown();
        setTimeout(() => {
          if (!firstWeekSpokenRef.current) { firstWeekSpokenRef.current = true; speak(text); }
        }, 600);
      } else throw new Error('empty');
    } catch {
      const surpStr = surp > 0 ? `£${surp.toFixed(0)}/month surplus` : `a £${Math.abs(surp).toFixed(0)}/month deficit to close`;
      const fb = [
        `${name ? name + ', I' : 'I'}'ve got your picture: £${inc.toLocaleString('en-GB')}/month coming in, ${surpStr}.`,
        dbt > 0 ? `Your biggest risk this month is the £${dbt.toLocaleString('en-GB')} debt sitting in the background — it costs you every day you don't address it.` : `Your biggest risk is letting the surplus disappear without putting it somewhere specific.`,
        `This week: ${surp > 0 ? `move £${Math.round(surp * 0.5).toLocaleString('en-GB')} into savings or debt before anything else — make it disappear before it gets spent.` : 'track every outgoing — you need to know exactly where the money is going.'}`,
        `By month end, you should know exactly what you've spent in every category. Guidance only — not FCA-regulated advice.`,
      ].join(' ');
      setFirstWeekText(fb);
      setShowFirstWeek(true);
      markFirstWeekShown();
      setTimeout(() => {
        if (!firstWeekSpokenRef.current) { firstWeekSpokenRef.current = true; speak(fb); }
      }, 600);
    } finally {
      setFirstWeekLoading(false);
    }
  }

  // Task 4 — Generate shareable Noa quote
  async function generateShareQuote() {
    setShareQuoteLoading(true);
    const fp = getFinancialPersonality();
    const promptCtx = `You are Noa. Generate ONE witty, non-sensitive shareable quote about financial personality and money habits — suitable for social media. No specific £ numbers. Max 14 words. Dry British wit. ${fp ? `Lean into the "${fp}" personality type if natural.` : ''} Style examples:
— "Turns out knowing where your money goes actually helps."
— "A Saver in a world designed to make you spend. Rare."
— "Payday lands. Half of it had plans before I did."
— "Apparently 'I'll sort it later' is not a savings strategy."
Output the quote only — no quotes around it, no emoji.`;
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: promptCtx, messages: [{ role: 'user', content: 'Generate a shareable quote.' }] }),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      const json = await res.json();
      const q = (json.text || '').trim().replace(/^["'"'«»]|["'"'«»]$/g, '');
      setShareQuote(q || (fp ? `A natural ${fp} in a world designed to make you spend.` : 'Managing money is mostly about knowing where it went.'));
    } catch {
      setShareQuote(fp ? `A natural ${fp} in a world designed to make you spend.` : 'Managing money is mostly about knowing where it went.');
    } finally {
      setShareQuoteLoading(false);
    }
  }

  // Task 4 — Web Share API / clipboard fallback
  async function doShare() {
    const vScore = calcVelaScore({ income, expenses, debt, streak });
    const mood   = calcMood({ income, expenses, surplus: income - expenses, savingsGoal: goals.length > 0 ? goals[0].target : 0, savingsBalance: savings });
    const moodLabel = MOOD_CFG[mood]?.label || 'STEADY';
    const url    = 'https://finance-tracker-2026-navy.vercel.app/noa-landing/';
    const text   = `${shareQuote}\n\nMy Noa score: ${vScore}/100 · ${moodLabel}\nManage your money with Noa →`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meet Noa — my financial navigator', text, url });
      } else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2800);
      }
    } catch (e) {
      if (e?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(`${text} ${url}`);
          setShareCopied(true);
          setTimeout(() => setShareCopied(false), 2800);
        } catch { /* silent */ }
      }
    }
  }

  // Feature 7 — Check client-side scheduled notifications on app open
  function checkScheduledNotifications(reg) {
    const prefs = getNotifPrefs();
    if (!prefs.morning && !prefs.streak && !prefs.weekly) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const today = new Date().toISOString().slice(0, 10);
    const last  = getNotifLast();
    const h     = new Date().getHours();
    const d     = getData() || {};
    const name  = getUserName() || '';
    const { income = 0, expenses = 0, payday = 25, debt: dbt = 0 } = d;
    const surplus = income - expenses;
    const sk = parseInt(localStorage.getItem('vela_streak_count') || '0', 10);
    const dtpay = daysUntilPayday(payday);

    // Morning nudge — once per day, if past 9am
    if (prefs.morning && last.morning !== today && h >= 9 && income > 0) {
      let body;
      if (dtpay <= 2)          body = `Payday in ${dtpay} day${dtpay === 1 ? '' : 's'}${name ? `, ${name}` : ''}. Make sure it goes somewhere useful before it disappears.`;
      else if (sk >= 7)        body = `Day ${sk} of your streak${name ? `, ${name}` : ''}. £${surplus.toFixed(0)} monthly surplus on track.`;
      else if (surplus > 0)    body = `£${surplus.toFixed(0)} surplus this month${name ? `, ${name}` : ''}. ${dtpay} days to payday — hold the line.`;
      else                     body = `Watch your spend today${name ? `, ${name}` : ''}. Budget is tight this month.`;
      sendLocalNotif(reg, 'Noa', body, 'noa-morning');
      saveNotifLast({ ...last, morning: today });
    }
    // Streak at risk — if past 7pm and user is on a streak
    if (prefs.streak && last.streak !== today && h >= 19 && sk >= 3) {
      const body = `Your ${sk}-day streak is still going${name ? `, ${name}` : ''}. Don't let today break it.`;
      sendLocalNotif(reg, 'Noa', body, 'noa-streak');
      saveNotifLast({ ...getNotifLast(), streak: today });
    }
    // Weekly summary — Sunday 6pm+
    if (prefs.weekly && new Date().getDay() === 0 && last.weekly !== today && h >= 18 && income > 0) {
      const velaScore = calcVelaScore({ income, expenses, debt: dbt, streak: sk });
      const body = `Week done${name ? `, ${name}` : ''}. VELA score ${velaScore}, surplus £${surplus.toFixed(0)}/month, streak at ${sk} days. Full picture inside.`;
      sendLocalNotif(reg, 'Noa', body, 'noa-weekly');
      saveNotifLast({ ...getNotifLast(), weekly: today });
    }
  }

  function sendLocalNotif(reg, title, body, tag) {
    if (reg?.active) {
      reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
    } else if (Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/apple-touch-icon.png', tag });
    }
  }

  async function requestNotifPermission() {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerms(perm);
    if (perm === 'granted' && 'serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const reg = swRegRef.current || await navigator.serviceWorker.ready;
        // Try to create a push subscription (requires VAPID public key in env)
        // If VAPID key not set, this step is skipped gracefully
        const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          savePushSub(sub.toJSON());
          console.log('[push] subscribed:', sub.endpoint.slice(0, 40));
        }
      } catch (e) { console.warn('[push] subscription failed:', e?.message); }
    }
  }

  function urlBase64ToUint8Array(b64) {
    const padding = '='.repeat((4 - b64.length % 4) % 4);
    const base64  = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw     = window.atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  // Feature 2 — Call Groq after a transaction is logged, get Noa's comment
  async function fetchTxComment(entry, updatedLog) {
    setTxComment('');
    setTxCommentLoading(true);
    const thisMonthTotal = updatedLog
      .filter(e => e.date && e.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((s, e) => s + e.amount, 0);
    const catBudget = entry.category === 'lifestyle' ? Math.round(income * 0.25) : entry.category === 'savings' ? Math.round(income * 0.20) : Math.round(income * 0.50);
    const catSpent  = updatedLog
      .filter(e => e.date && e.date.startsWith(new Date().toISOString().slice(0, 7)) && (e.category || 'essentials') === entry.category)
      .reduce((s, e) => s + e.amount, 0);
    const catPct = catBudget > 0 ? Math.round((catSpent / catBudget) * 100) : 0;

    const txPrompt = `${buildPrompt()}\n\nThe user just logged a transaction: £${entry.amount.toFixed(2)} in ${entry.category}${entry.note ? ` (${entry.note})` : ''}. Category total this month: £${catSpent.toFixed(0)} of £${catBudget} budget (${catPct}%). Total logged this month across all categories: £${thisMonthTotal.toFixed(2)}.\n\nRespond with exactly one Noa-voice sentence commenting on this transaction in context. Dry, specific, uses actual percentages and amounts. No FCA disclaimer needed here — it's just a transaction comment. No greeting.`;

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 10000);
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: txPrompt, messages: [{ role: 'user', content: `I just spent £${entry.amount.toFixed(2)} on ${entry.category}.` }] }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json();
      const comment = (json.text || '').trim();
      setTxComment(comment);
      if (comment) speak(comment);
    } catch { setTxComment(''); }
    finally { setTxCommentLoading(false); }
  }

  // Feature 5 — Monthly Noa narrative
  async function fetchMonthlyNarrative() {
    if (narrativeLoading) return;
    setNarrativeLoading(true);
    setMonthlyNarrative('');
    const thisMonthSpend = expenseLog
      .filter(e => e.date && e.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((s, e) => s + e.amount, 0);
    const txCount = expenseLog.filter(e => e.date && e.date.startsWith(new Date().toISOString().slice(0, 7))).length;
    const velaScoreNow = calcVelaScore({ income, expenses, debt, streak });
    const narrativePrompt = `${buildPrompt()}\n\nGenerate a 3-4 sentence Noa-voice monthly narrative for this user. Current VELA score: ${velaScoreNow}. Structure: (1) what happened this month — logged spend £${thisMonthSpend.toFixed(0)} across ${txCount} transactions, surplus position; (2) what improved or what to watch; (3) what next month looks like if the trend continues. Use dry, specific language with actual £ numbers. End with: "Guidance only — not FCA-regulated advice."`;

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 12000);
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: narrativePrompt, messages: [{ role: 'user', content: 'How did I do this month?' }] }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json();
      setMonthlyNarrative((json.text || '').trim());
      if (json.text) speak(json.text);
    } catch { setMonthlyNarrative('Something went wrong getting your monthly review. Try again in a moment.'); }
    finally { setNarrativeLoading(false); }
  }

  // Task 2 — Payday Plan: Groq-generated account-specific spoken briefing
  async function fetchPaydayPlan() {
    if (paydayPlanLoading) return;
    setPaydayPlanLoading(true);
    setPaydayPlanText('');
    const accs = accounts;
    const surplus = income - expenses;
    // Build account allocation summary for the prompt
    let allocationHint = '';
    if (accs.length > 0) {
      const billsAcc   = accs.find(a => a.purpose === 'Bills and Essentials');
      const savingsAcc = accs.find(a => a.purpose === 'Savings');
      const investAcc  = accs.find(a => a.purpose === 'Investments');
      const billsAmt   = billsAcc   ? Math.round(expenses) : 0;
      const savingsAmt = savingsAcc ? Math.round(income * 0.20) : 0;
      const investAmt  = investAcc  ? Math.round(income * 0.10) : 0;
      const spendAmt   = income - billsAmt - savingsAmt - investAmt;
      allocationHint = accs.map(a => {
        let amt = 0;
        if (a.purpose === 'Bills and Essentials') amt = billsAmt;
        else if (a.purpose === 'Savings')         amt = savingsAmt;
        else if (a.purpose === 'Investments')     amt = investAmt;
        else                                       amt = Math.max(0, spendAmt);
        return `${a.name} (${a.purpose}): £${amt.toLocaleString('en-GB')}`;
      }).join(', ');
    }
    const planPrompt = `You are Noa — a sharp, dry, warm personal financial navigator. Payday has just landed. Generate a spoken payday allocation briefing (60-90 words) using the user's ACTUAL account names and the calculated amounts provided. Be direct, confident, Noa-voice. No FCA disclaimer. No greeting. Start with "Right. Payday." and walk through each account in order. End with a sharp one-liner about what they should NOT do.

User data: income=£${income}/month, expenses=£${expenses}/month, surplus=£${surplus}/month.
${accs.length > 0 ? `Account allocations: ${allocationHint}` : `No accounts set up — give generic advice about allocating income on payday.`}`;

    try {
      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), 12000);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: planPrompt, messages: [{ role: 'user', content: 'Give me my payday plan.' }] }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const json = await res.json();
      const text = (json.text || '').trim();
      setPaydayPlanText(text);
      if (text) speak(text);
    } catch {
      const fallback = accs.length > 0
        ? `Right. Payday. ${accs.map((a, i) => {
            const amts = [Math.round(expenses), Math.round(income * 0.20), Math.round(income * 0.10)];
            const labels = ['Bills and Essentials', 'Savings', 'Investments'];
            const idx = labels.indexOf(a.purpose);
            const amt = idx >= 0 ? amts[idx] : Math.max(0, income - expenses);
            return `£${amt.toLocaleString('en-GB')} goes to ${a.name}`;
          }).join('. ')}. That's the plan. Don't spend what's already allocated.`
        : `Right. Payday. Cover your fixed costs first — £${expenses.toLocaleString('en-GB')}. Set aside £${Math.round(income * 0.20).toLocaleString('en-GB')} before anything else. The remainder is your spending money — and only that.`;
      setPaydayPlanText(fallback);
      speak(fallback);
    } finally {
      setPaydayPlanLoading(false);
    }
  }

  // Feature 3 — Template-based metric explanations (no Groq — instant)
  function getMetricExplanation(metric) {
    const velaScore  = calcVelaScore({ income, expenses, debt, streak });
    const sr         = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
    switch (metric) {
      case 'score':
        return `Your Vela Score is ${velaScore}. ${velaScore >= 70 ? `Strong — most users sit around 65. You're in the top third.` : velaScore >= 50 ? `Solid progress. Above average. The debt and streak components are the quickest to improve.` : `Room to grow. Clear debt and keep the streak — those two moves alone add 20+ points.`}`;
      case 'savings':
        return `You're saving ${sr >= 0 ? sr : 0}% of your income — £${Math.max(0, income - expenses).toFixed(0)} per month. UK average is 8%. ${sr >= 25 ? `Well above average — you're building real wealth.` : sr >= 8 ? `Around the UK average. Push to 20% when you can.` : sr >= 0 ? `Below the UK average of 8%. The goal is 20% — even £${Math.round(income * 0.05).toFixed(0)}/month more makes a meaningful difference.` : `Expenses exceed income this month. That's the first thing to fix.`}`;
      case 'pace':
        return surplus >= 0
          ? `On track means your spending puts you inside budget by month end, with a £${surplus.toFixed(0)} projected surplus. It can shift fast — watch the lifestyle column.`
          : `Off track: your spend currently projects a £${Math.abs(surplus).toFixed(0)} shortfall this month. Payday in ${daysToNextPay} day${daysToNextPay === 1 ? '' : 's'} — tighten up until then.`;
      default: return '';
    }
  }

  // ── Evening check-in handlers ────────────────────────────────────
  function handleEveningYes() {
    setEveningDate();
    appendEveningLog({ date: new Date().toISOString().slice(0, 10), stuck: true });
    setEveningAnswered(true);
    setEveningCheckOpen(false);
    const name = getUserName() || '';
    const msg  = `Well done${name ? `, ${name}` : ''}. Sticking to your budget today is exactly how wealth is built — one decision at a time.`;
    setCelebrateMsg('Budget kept today! Your discipline compounds.');
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2500);
    speak(msg);
  }

  function handleEveningNo() {
    setEveningDate();
    appendEveningLog({ date: new Date().toISOString().slice(0, 10), stuck: false, note: eveningNote });
    setEveningAnswered(true);
    setEveningCheckOpen(false);
    const msg = `That's honest — and honesty is how you improve. One off day doesn't define your finances. We'll look at it together tomorrow.`;
    pushCard('vela', msg);
    speak(msg);
    setTimeout(() => setChatOpen(true), 400);
  }

  // ── Dashboard calculations ───────────────────────────────────────
  const surplus      = income - expenses;
  const isPositive   = surplus >= 0;
  const numColor     = isPositive ? GREEN : RED;
  const savingsRate  = income > 0 ? Math.round((surplus / income) * 100) : 0;
  const onTrack      = surplus >= 0;
  const savColor     = savingsRate > 10 ? GREEN : savingsRate >= 0 ? AMBER : RED;

  // Debt Destruction Mode
  const totalDebt        = debts.length > 0 ? debts.reduce((s, d) => s + d.amount, 0) : debt;
  const debtMode         = totalDebt > 0;
  const avgDebtRate      = debts.length > 0
    ? debts.reduce((s, d) => s + d.rate * d.amount, 0) / Math.max(1, totalDebt)
    : 0;
  const dailyInterestCost   = avgDebtRate > 0 ? totalDebt * avgDebtRate / 100 / 365 : 0;
  const interestDaysCovered = dailyInterestCost > 0 && savings > 0 ? Math.floor(savings / (dailyInterestCost * 365)) : 0;

  // Current week challenge
  const currentChallengeDef = CHALLENGES.find(c => c.id === challengeData.id) || CHALLENGES[0];

  // Evening check-in
  const isEveningTime   = new Date().getHours() >= 19 && new Date().getHours() < 21;
  const showEveningDot  = isEveningTime && !eveningAnswered;

  // Task 3 — Orb Mood
  const firstGoalTarget = goals.length > 0 ? goals[0].target : 0;
  const mood = calcMood({ income, expenses, surplus, savingsGoal: firstGoalTarget, savingsBalance: savings });
  const moodCfg = MOOD_CFG[mood];

  // Vela Score
  const velaScore      = calcVelaScore({ income, expenses, debt, streak });
  const velaScoreColor = velaScore >= 70 ? GREEN : velaScore >= 50 ? AMBER : RED;
  const containerH     = vpH ? `${vpH}px` : '100dvh';

  // Days of Financial Freedom (target for display; freedomDays state animates to it)
  const dailyExpenses      = expenses > 0 ? expenses / 30 : 1;
  const freedomDaysTarget  = savings > 0 ? Math.floor(savings / dailyExpenses) : 0;

  // In My Pocket — safe daily discretionary spend
  const nowD         = new Date();
  const daysInMonthD = new Date(nowD.getFullYear(), nowD.getMonth() + 1, 0).getDate();
  const daysLeftD    = Math.max(1, daysInMonthD - nowD.getDate() + 1);
  const inMyPocket2  = surplus > 0 ? Math.floor(surplus / daysLeftD) : 0;

  // Current-month spending by category from logged transactions
  const thisMonthYM = new Date().toISOString().slice(0, 7);
  const monthlySpent = expenseLog.reduce((acc, e) => {
    if (!e.date || !e.date.startsWith(thisMonthYM)) return acc;
    const cat = (e.category || 'essentials').toLowerCase();
    const key = cat === 'lifestyle' ? 'lifestyle' : cat === 'savings' ? 'savings' : 'essentials';
    acc[key] = (acc[key] || 0) + e.amount;
    return acc;
  }, { essentials: 0, lifestyle: 0, savings: 0 });

  // Task 4 — Weekly spending calculations
  const weekStart = (() => {
    const d = new Date(nowD);
    const day = d.getDay(); // 0=Sun, 1=Mon...
    d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // Monday-based week
    return d.toISOString().slice(0, 10);
  })();
  const weeklyTx = expenseLog.filter(e => e.date && e.date >= weekStart);
  const weeklyByCategory = weeklyTx.reduce((acc, e) => {
    const cat = (e.category || 'essentials').toLowerCase();
    const key = cat === 'lifestyle' ? 'lifestyle' : cat === 'savings' ? 'savings' : 'essentials';
    acc[key] = (acc[key] || 0) + e.amount;
    return acc;
  }, { essentials: 0, lifestyle: 0, savings: 0 });
  const weeklyTotal = weeklyTx.reduce((s, e) => s + e.amount, 0);
  // Weekly budget = monthly / 4.33
  const weeklyBudget = { essentials: Math.round(income * 0.50 / 4.33), lifestyle: Math.round(income * 0.25 / 4.33), savings: Math.round(income * 0.20 / 4.33) };
  const weeklyTotalBudget = weeklyBudget.essentials + weeklyBudget.lifestyle + weeklyBudget.savings;

  // Weekly Noa sentence — template based, no API
  function getWeeklySentence() {
    const lifestylePct = weeklyBudget.lifestyle > 0 ? Math.round((weeklyByCategory.lifestyle / weeklyBudget.lifestyle) * 100) : 0;
    const dayOfWeek = new Date(nowD).getDay();
    const daysIn = dayOfWeek === 0 ? 7 : dayOfWeek;
    const surplusLeft = Math.max(0, surplus - weeklyTotal);
    if (daysToNextPay <= 2) return `Final stretch. You've got £${surplusLeft.toFixed(0)} left to work with.`;
    if (weeklyTotal === 0) return `No spend logged yet this week. Either you're budgeting perfectly or you forgot to log.`;
    if (lifestylePct > 85) return `Lifestyle is running hot this week. Worth watching.`;
    if (lifestylePct > 60) return `${daysIn} day${daysIn > 1 ? 's' : ''} in. Lifestyle budget is ${lifestylePct}% used. Pace yourself.`;
    if (weeklyTotal > weeklyTotalBudget) return `Over the weekly budget. Every day counts from here.`;
    return `Clean week so far. Keep the pace.`;
  }

  // Days to next payday
  const daysToNextPay = daysUntilPayday(payday);

  // Task C — Payday Health Score (used for ring display + idle prompt + Noa context)
  const totalSpentThisMonthH = expenseLog
    .filter(e => e.date && e.date.startsWith(thisMonthYM))
    .reduce((s, e) => s + e.amount, 0);
  const { totalDays: phTotalDays, elapsed: phElapsed } = daysInPayPeriod(payday);
  const phTimeUsedPct   = (phElapsed / phTotalDays) * 100;
  const phSpendableBudget = Math.max(1, income - Math.round(income * 0.20));
  const phBudgetUsedPct   = income > 0 ? (totalSpentThisMonthH / phSpendableBudget) * 100 : 0;
  const healthScore = income > 0
    ? Math.min(100, Math.max(0, Math.round(100 - (phBudgetUsedPct - phTimeUsedPct))))
    : 0;
  const healthLabel = healthScore >= 85 ? 'On Track'
    : healthScore >= 65 ? 'Watch it'
    : healthScore >= 40 ? 'Falling behind'
    : 'Red zone';
  const healthColor = healthScore >= 85 ? GREEN
    : healthScore >= 65 ? AMBER
    : healthScore >= 40 ? ORANGE
    : DEEP_AMBER;
  // Savings goal bar
  const savingsGoalForBar = goals.length > 0 ? goals[0].target : (expenses > 0 ? Math.round(expenses * 3) : 0);
  const savingsPct = savingsGoalForBar > 0 ? Math.min(100, Math.round((savings / savingsGoalForBar) * 100)) : 0;

  // Monthly / Annual toggle values for pills
  const displayNum = viewMode === 'monthly'
    ? `£${Math.abs(surplus).toLocaleString('en-GB')}`
    : `£${Math.abs(surplus * 12).toLocaleString('en-GB')}`;
  const displaySub = viewMode === 'monthly'
    ? (isPositive ? 'Monthly surplus' : 'Monthly shortfall')
    : (isPositive ? 'Annual surplus' : 'Annual shortfall');

  // Forecast cards
  const forecastCards = [
    {
      label: 'Today',
      value: `£${inMyPocket2}`,
      sub: 'safe to spend',
      emoji: inMyPocket2 >= 20 ? '☀️' : inMyPocket2 >= 5 ? '⛅' : '🌩️',
      color: inMyPocket2 >= 20 ? GREEN : inMyPocket2 >= 5 ? AMBER : RED,
    },
    {
      label: 'This Week',
      value: daysToNextPay <= 7 ? `Payday in ${daysToNextPay}d` : (surplus >= 0 ? 'On track' : 'Watch spend'),
      sub: daysToNextPay <= 7 ? 'payday soon' : 'weekly outlook',
      emoji: daysToNextPay <= 7 ? '💰' : (surplus >= 0 ? '☀️' : '⛅'),
      color: daysToNextPay <= 7 ? GREEN : (surplus >= 0 ? GREEN : AMBER),
    },
    {
      label: 'This Month',
      value: surplus >= 0 ? `+£${surplus.toLocaleString('en-GB')}` : `−£${Math.abs(surplus).toLocaleString('en-GB')}`,
      sub: surplus >= 0 ? 'projected surplus' : 'projected deficit',
      emoji: surplus >= 200 ? '☀️' : surplus >= 0 ? '⛅' : '🌩️',
      color: surplus >= 200 ? GREEN : surplus >= 0 ? AMBER : RED,
    },
    {
      label: 'This Year',
      value: surplus >= 0 ? `+£${(surplus * 12).toLocaleString('en-GB')}` : `−£${(Math.abs(surplus) * 12).toLocaleString('en-GB')}`,
      sub: 'annual trajectory',
      emoji: surplus * 12 >= 2000 ? '☀️' : surplus >= 0 ? '⛅' : '🌩️',
      color: surplus * 12 >= 2000 ? GREEN : surplus >= 0 ? AMBER : RED,
    },
  ];

  return (
    <div style={{ position: 'relative', height: containerH, background: BG, overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* ══════════════════════════════════════════
          DASHBOARD — swipe up to reveal detail
      ══════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          paddingTop: 'max(env(safe-area-inset-top), 24px)',
          paddingLeft: 20, paddingRight: 20,
          boxSizing: 'border-box',
          transform: detailOpen ? 'translateY(-100%)' : 'translateY(0)',
          transition: SLIDE,
        }}
      >
        {/* Streak — top left */}
        {streak > 0 && (
          <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top), 20px)', left: 20, zIndex: 5, display: 'flex', alignItems: 'center', gap: 4, padding: 8 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: AMBER, lineHeight: 1 }}>{streak}</span>
          </div>
        )}

        {/* Gear — top right */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ position: 'absolute', top: 'max(env(safe-area-inset-top), 20px)', right: 20, zIndex: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,221,208,0.26)', fontSize: 20, padding: 8, lineHeight: 1 }}
          aria-label="Settings"
        >⚙</button>

        {/* Monthly / Annual toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 2 }}>
          <div style={{ display: 'flex', background: 'rgba(232,221,208,0.06)', borderRadius: 20, padding: 3, gap: 2 }}>
            {['monthly', 'annual'].map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                padding: '5px 16px', borderRadius: 16, border: 'none', cursor: 'pointer',
                background: viewMode === m ? PURPLE : 'transparent',
                color: viewMode === m ? '#E8DDD0' : 'rgba(232,221,208,0.38)',
                fontSize: 12, fontWeight: 600, letterSpacing: '0.3px',
                transition: 'all 0.18s', textTransform: 'capitalize',
              }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Top hero section — fixed height, swipe-up to detail */}
        <div
          onTouchStart={onTouchStart}
          onTouchEnd={e => onSwipeEnd(e, false)}
          style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <div style={{ fontSize: 15, color: 'rgba(232,221,208,0.36)', letterSpacing: '0.2px' }}>{getGreeting()}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div
              onClick={() => {
                if (showEveningDot) {
                  setEveningPhase('ask'); setEveningNote(''); setEveningCheckOpen(true);
                } else {
                  // Task D — tapping the orb opens chat directly
                  unlockAudio(); setChatOpen(true);
                }
              }}
              style={{ cursor: 'pointer', position: 'relative', display: 'inline-block' }}
            >
              <SmallOrb alert={spendAlert} eveningDot={showEveningDot} orbState={chatOpen ? orbState : 'idle'} mood={mood} moodCfg={moodCfg} />
              {privacyMode && (
                <div style={{ position: 'absolute', top: 0, right: -4, fontSize: 12, lineHeight: 1, opacity: 0.7, pointerEvents: 'none' }}>🔒</div>
              )}
            </div>
            {/* Task 3 — Mood label */}
            <div style={{
              fontSize: 9, letterSpacing: '1.2px', textTransform: 'uppercase',
              color: moodCfg.labelColor,
              transition: 'color 2s ease',
              fontWeight: 600,
            }}>{moodCfg.label}</div>
          </div>
          {debtMode ? (
            <>
              <div style={{ fontSize: 11, color: 'rgba(226,75,74,0.7)', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700 }}>Debt Destruction Mode</div>
              <div style={{ fontSize: 'clamp(38px, 14vw, 62px)', fontWeight: 800, color: DEBT_RED, letterSpacing: '-3px', lineHeight: 1, textAlign: 'center' }}>
                £{totalDebt.toLocaleString('en-GB')}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.3px' }}>Destroying debt</div>
              {dailyInterestCost > 0 && (
                <div style={{ fontSize: 11, color: 'rgba(226,75,74,0.55)', textAlign: 'center' }}>
                  Costing £{dailyInterestCost.toFixed(2)}/day in interest
                  {interestDaysCovered > 0 ? ` · savings cover ${interestDaysCovered}yr` : ''}
                </div>
              )}
            </>
          ) : freedomDaysTarget > 0 ? (
            <>
              <div style={{ fontSize: 'clamp(48px, 16vw, 72px)', fontWeight: 800, color: GREEN, letterSpacing: '-4px', lineHeight: 1, textAlign: 'center' }}>{freedomDays}</div>
              <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.3px' }}>days of freedom</div>
              <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.2)', textAlign: 'center', maxWidth: 220 }}>
                You could live {freedomDaysTarget} day{freedomDaysTarget !== 1 ? 's' : ''} without income
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 'clamp(36px, 13vw, 58px)', fontWeight: 800, color: numColor, letterSpacing: '-2px', lineHeight: 1, textAlign: 'center' }}>{displayNum}</div>
              <div style={{ fontSize: 14, color: 'rgba(232,221,208,0.36)', letterSpacing: '0.2px' }}>{displaySub}</div>
            </>
          )}

          {/* Forecast strip */}
          <div style={{
            width: '100%', overflowX: 'auto', display: 'flex', gap: 8, alignSelf: 'stretch',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch',
            paddingBottom: 2, marginTop: 8,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
            {forecastCards.map((fc, i) => (
              <div key={i} style={{
                minWidth: 108, flexShrink: 0, scrollSnapAlign: 'start',
                background: 'rgba(232,221,208,0.04)',
                border: '1px solid rgba(232,221,208,0.07)',
                borderRadius: 14, padding: '10px 8px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              }}>
                <div style={{ fontSize: 18, lineHeight: 1 }}>{fc.emoji}</div>
                <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{fc.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: fc.color, letterSpacing: '-0.3px', textAlign: 'center', lineHeight: 1.2 }}>{fc.value}</div>
                <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.24)', textAlign: 'center' }}>{fc.sub}</div>
              </div>
            ))}
          </div>
        </div>{/* end top hero section */}

        {/* ── Scrollable cards area ─────────────────────────────────── */}
        <div
          className="chat-scroll"
          style={{
            flex: 1, overflowY: 'auto',
            paddingBottom: 76, /* room for pinned Ask Noa bar */
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >

        {/* Task C — Payday Health Score ring */}
        {income > 0 && (() => {
          const ringR    = 46;
          const ringCirc = 2 * Math.PI * ringR;
          const ringDash = (payHealthAnimScore / 100) * ringCirc;
          return (
            <div
              onClick={() => setWeeklyExpanded(e => !e)}
              style={{
                marginBottom: 10, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: 'rgba(232,221,208,0.04)', border: '1px solid rgba(232,221,208,0.08)',
                borderRadius: 16, padding: '14px 20px',
                animation: 'cardIn 0.4s ease-out',
              }}
            >
              {/* SVG ring */}
              <div style={{ position: 'relative', marginBottom: 4 }}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  {/* Track */}
                  <circle cx="60" cy="60" r={ringR} fill="none"
                    stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  {/* Progress */}
                  <circle cx="60" cy="60" r={ringR} fill="none"
                    stroke={healthColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${ringDash} ${ringCirc}`}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 0.06s linear' }}
                  />
                </svg>
                {/* Score centred inside ring */}
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: 30, fontWeight: 800, color: healthColor, letterSpacing: '-1.5px', lineHeight: 1 }}>
                    {payHealthAnimScore}
                  </div>
                </div>
              </div>
              {/* Label */}
              <div style={{ fontSize: 14, fontWeight: 700, color: healthColor, marginBottom: 5 }}>{healthLabel}</div>
              {/* Payday countdown */}
              <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.45)', marginBottom: savingsGoalForBar > 0 ? 10 : 0 }}>
                {daysToNextPay === 0 ? 'Payday today 💰' : `Payday in ${daysToNextPay} day${daysToNextPay === 1 ? '' : 's'}`}
              </div>
              {/* Savings progress bar */}
              {savingsGoalForBar > 0 && (
                <div style={{ width: '100%', maxWidth: 220 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: 'rgba(232,221,208,0.3)' }}>Savings</span>
                    <span style={{ fontSize: 9, color: 'rgba(232,221,208,0.4)' }}>
                      £{savings.toLocaleString('en-GB')} of £{savingsGoalForBar.toLocaleString('en-GB')} — {savingsPct}%
                    </span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(232,221,208,0.08)', borderRadius: 2 }}>
                    <div style={{
                      height: '100%', width: `${savingsPct}%`,
                      background: GREEN, borderRadius: 2,
                      transition: 'width 0.8s ease',
                      minWidth: savings > 0 ? 3 : 0,
                    }} />
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 3 metric pills — equal width, full row, tappable (Feature 3) */}
        <div style={{ display: 'flex', gap: 10, marginBottom: activeMetric ? 0 : 10, width: '100%' }}>
          <MetricPill
            label="Vela Score"
            value={`${velaScore}`}
            color={velaScoreColor}
            badge={scoreDelta !== 0 ? `${scoreDelta > 0 ? '↑' : '↓'}${Math.abs(scoreDelta)}` : null}
            badgeColor={scoreDelta >= 0 ? GREEN : RED}
            active={activeMetric === 'score'}
            onTap={() => {
              const m = activeMetric === 'score' ? null : 'score';
              setActiveMetric(m);
              if (m) { const ex = getMetricExplanation('score'); speak(ex); }
            }}
          />
          <MetricPill
            label="Savings"
            value={`${savingsRate}%`}
            color={savColor}
            active={activeMetric === 'savings'}
            onTap={() => {
              const m = activeMetric === 'savings' ? null : 'savings';
              setActiveMetric(m);
              if (m) { const ex = getMetricExplanation('savings'); speak(ex); }
            }}
          />
          <MetricPill
            label="Pace"
            value={onTrack ? 'On Track' : 'Off Track'}
            color={onTrack ? GREEN : RED}
            active={activeMetric === 'pace'}
            onTap={() => {
              const m = activeMetric === 'pace' ? null : 'pace';
              setActiveMetric(m);
              if (m) { const ex = getMetricExplanation('pace'); speak(ex); }
            }}
          />
        </div>

        {/* Metric explanation card (Feature 3) */}
        {activeMetric && (
          <div style={{
            marginBottom: 10, padding: '10px 14px',
            background: 'rgba(232,221,208,0.04)',
            border: '1px solid rgba(232,221,208,0.08)',
            borderRadius: 12,
            animation: 'cardIn 0.22s ease-out',
          }}>
            <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.62)', lineHeight: 1.55 }}>
              {getMetricExplanation(activeMetric)}
            </div>
          </div>
        )}

        {/* Allocation breakdown + log transaction */}
        {income > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.28)', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Allocation</div>
                {/* Feature 5 — Monthly narrative button */}
                <button
                  onClick={fetchMonthlyNarrative}
                  disabled={narrativeLoading}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 10, color: narrativeLoading ? 'rgba(232,221,208,0.22)' : 'rgba(232,221,208,0.38)', letterSpacing: '0.3px', lineHeight: 1 }}
                >{narrativeLoading ? '…' : 'How did I do?'}</button>
              </div>
              <button
                onClick={() => { setTxComment(''); setShowLogTx(true); }}
                style={{ background: 'rgba(200,184,154,0.12)', border: '1px solid rgba(200,184,154,0.25)', borderRadius: 8, color: PURPLE, fontSize: 14, fontWeight: 700, padding: '1px 10px', cursor: 'pointer', lineHeight: 1.5 }}
              >+</button>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: 'Essentials', key: 'essentials', budget: Math.round(income * 0.50), color: PURPLE, activeBg: 'rgba(200,184,154,0.14)' },
                { label: 'Lifestyle',  key: 'lifestyle',  budget: Math.round(income * 0.25), color: BLUE,   activeBg: 'rgba(168,152,128,0.14)' },
                { label: 'Savings',    key: 'savings',    budget: Math.round(income * 0.20), color: GREEN,  activeBg: 'rgba(124,174,158,0.14)' },
              ].map(({ label, key, budget, color, activeBg }) => {
                const spent = monthlySpent[key] || 0;
                const pct = budget > 0 ? spent / budget : 0;
                const valueColor = pct > 1 ? RED : pct > 0.8 ? AMBER : color;
                return (
                  <div key={label} style={{
                    flex: 1, background: spent > 0 ? activeBg : 'rgba(232,221,208,0.04)',
                    border: `1px solid ${spent > 0 ? `${color}33` : 'rgba(232,221,208,0.07)'}`,
                    borderRadius: 12, padding: '8px 6px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.36)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: valueColor, letterSpacing: '-0.3px', textAlign: 'center' }}>
                      {spent > 0 ? `£${Math.round(spent)}` : `£${budget.toLocaleString('en-GB')}`}
                    </div>
                    {spent > 0 && (
                      <div style={{ fontSize: 8, color: 'rgba(232,221,208,0.3)', textAlign: 'center' }}>
                        / £{budget.toLocaleString('en-GB')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Feature 2 — Noa's transaction comment */}
        {(txCommentLoading || txComment) && (
          <div style={{
            marginBottom: 10, display: 'flex', alignItems: 'flex-start', gap: 8,
            background: 'rgba(200,184,154,0.07)',
            border: '1px solid rgba(200,184,154,0.15)',
            borderRadius: 12, padding: '9px 12px',
            animation: 'cardIn 0.3s ease-out',
          }}>
            <span style={{ fontSize: 13, flexShrink: 0, lineHeight: '1.5' }}>✦</span>
            {txCommentLoading
              ? <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.3)', lineHeight: 1.5, animation: 'blink 1.6s ease-in-out infinite' }}>Noa is thinking…</div>
              : <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.62)', lineHeight: 1.55 }}>{txComment}</div>
            }
          </div>
        )}

        {/* Feature 5 — Monthly Noa narrative */}
        {(narrativeLoading || monthlyNarrative) && (
          <div style={{
            marginBottom: 10, padding: '11px 14px',
            background: 'rgba(200,184,154,0.06)',
            border: '1px solid rgba(200,184,154,0.14)',
            borderRadius: 14,
            animation: 'cardIn 0.3s ease-out',
          }}>
            {narrativeLoading
              ? <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.28)', animation: 'blink 1.6s ease-in-out infinite' }}>Building your monthly review…</div>
              : <>
                  <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>This Month</div>
                  <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.62)', lineHeight: 1.6 }}>{monthlyNarrative}</div>
                  <button
                    onClick={() => setMonthlyNarrative('')}
                    style={{ background: 'none', border: 'none', padding: 0, marginTop: 6, fontSize: 10, color: 'rgba(232,221,208,0.28)', cursor: 'pointer' }}
                  >dismiss</button>
                </>
            }
          </div>
        )}

        {/* ── Task 4 — Weekly Review Card ── */}
        {income > 0 && (
          <div
            onClick={() => setWeeklyExpanded(e => !e)}
            style={{
              marginBottom: 10, background: 'rgba(232,221,208,0.04)',
              border: '1px solid rgba(232,221,208,0.08)', borderRadius: 16,
              padding: '11px 14px', cursor: 'pointer',
              animation: 'cardIn 0.4s ease-out',
              transition: 'background 0.15s',
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.3)', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600 }}>This Week</div>
              {/* Days to payday chip */}
              <div style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 8,
                background: daysToNextPay >= 7 ? 'rgba(124,174,158,0.14)' : daysToNextPay >= 3 ? 'rgba(201,169,110,0.14)' : 'rgba(226,75,74,0.14)',
                color: daysToNextPay >= 7 ? GREEN : daysToNextPay >= 3 ? AMBER : RED,
                border: `1px solid ${daysToNextPay >= 7 ? 'rgba(124,174,158,0.25)' : daysToNextPay >= 3 ? 'rgba(201,169,110,0.25)' : 'rgba(226,75,74,0.25)'}`,
              }}>
                {daysToNextPay === 0 ? 'Payday today' : daysToNextPay === 1 ? 'Payday tomorrow' : `Payday in ${daysToNextPay} days`}
              </div>
            </div>

            {/* Spending bar — Essentials / Lifestyle / Savings */}
            {weeklyTotal > 0 ? (
              <>
                <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 5, background: 'rgba(232,221,208,0.06)' }}>
                  {[
                    { key: 'essentials', color: PURPLE },
                    { key: 'lifestyle',  color: AMBER },
                    { key: 'savings',    color: GREEN },
                  ].map(({ key, color }) => {
                    const w = weeklyTotal > 0 ? Math.min(100, (weeklyByCategory[key] / weeklyTotalBudget) * 100) : 0;
                    return w > 0 ? (
                      <div key={key} style={{ width: `${w}%`, background: color, transition: 'width 0.5s ease', minWidth: 2 }} />
                    ) : null;
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
                  {[
                    { key: 'essentials', label: 'Essentials', color: PURPLE },
                    { key: 'lifestyle',  label: 'Lifestyle',  color: AMBER },
                    { key: 'savings',    label: 'Savings',    color: GREEN },
                  ].map(({ key, label, color }) => weeklyByCategory[key] > 0 ? (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <span style={{ fontSize: 9, color: 'rgba(232,221,208,0.4)' }}>£{Math.round(weeklyByCategory[key])} {label}</span>
                    </div>
                  ) : null)}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.22)', marginBottom: 7 }}>No transactions logged this week</div>
            )}

            {/* Noa sentence */}
            <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.5)', lineHeight: 1.5, fontStyle: 'italic' }}>
              "{getWeeklySentence()}"
            </div>

            {/* Expand indicator */}
            {weeklyTx.length > 0 && (
              <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.22)', marginTop: 6, textAlign: 'right' }}>
                {weeklyExpanded ? '↑ hide' : `↓ ${weeklyTx.length} transaction${weeklyTx.length > 1 ? 's' : ''}`}
              </div>
            )}

            {/* Expanded transaction list */}
            {weeklyExpanded && weeklyTx.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid rgba(232,221,208,0.07)', paddingTop: 10 }}>
                {[...weeklyTx].reverse().map((tx, i) => {
                  const cat = (tx.category || 'essentials');
                  const catColor = cat === 'lifestyle' ? AMBER : cat === 'savings' ? GREEN : PURPLE;
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      paddingTop: 6, paddingBottom: 6,
                      borderBottom: i < weeklyTx.length - 1 ? '1px solid rgba(232,221,208,0.04)' : 'none',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.62)' }}>{tx.note || cat}</div>
                          <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.28)' }}>{tx.date}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: catColor }}>£{tx.amount.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            SINKING FUNDS / POTS (FEATURE 10)
            Shows savings pots with progress bars, monthly contribution needed,
            and add-funds button per pot. Celebrations on completion.
        ══════════════════════════════════════════ */}
        {goals.length > 0 ? (
          <div style={{ marginBottom: 10, animation: 'cardIn 0.4s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.3)', letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600 }}>My Pots</div>
              <button
                onClick={() => { setNewPotName(''); setNewPotTarget(''); setNewPotDate(''); setNewPotError(''); setShowPotsModal(true); }}
                style={{ background: 'none', border: '1px solid rgba(200,184,154,0.22)', borderRadius: 8, color: PURPLE, fontSize: 11, padding: '3px 10px', cursor: 'pointer', letterSpacing: '0.2px', fontFamily: 'inherit' }}
              >+ Add pot</button>
            </div>
            {goals.map(g => {
              const savedAmt = g.saved || 0;
              const pct      = g.target > 0 ? Math.min(100, Math.round((savedAmt / g.target) * 100)) : 0;
              const complete = pct >= 100;
              const mLeft    = monthsUntil(g.targetDate);
              const monthlyNeeded = !complete && g.target > savedAmt && g.targetDate
                ? ((g.target - savedAmt) / mLeft).toFixed(0)
                : null;
              return (
                <div key={g.id} style={{
                  background: complete ? 'rgba(124,174,158,0.06)' : 'rgba(232,221,208,0.03)',
                  border: `1px solid ${complete ? 'rgba(124,174,158,0.18)' : 'rgba(232,221,208,0.07)'}`,
                  borderRadius: 14, padding: '10px 12px', marginBottom: 7,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#E8DDD0' }}>
                      {complete ? '🎉 ' : ''}{g.name}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: complete ? GREEN : PURPLE }}>
                      £{savedAmt.toLocaleString('en-GB')}
                      <span style={{ fontWeight: 400, color: 'rgba(232,221,208,0.32)', fontSize: 10 }}> / £{g.target.toLocaleString('en-GB')}</span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: 'rgba(232,221,208,0.07)', borderRadius: 2, marginBottom: 5 }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: complete ? GREEN : PURPLE,
                      borderRadius: 2, transition: 'width 0.7s ease',
                      minWidth: pct > 0 ? 3 : 0,
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.28)' }}>
                      {complete
                        ? '✓ Target reached'
                        : [
                            `${pct}%`,
                            g.targetDate ? `due ${g.targetDate}` : null,
                            monthlyNeeded ? `£${monthlyNeeded}/mo` : null,
                          ].filter(Boolean).join(' · ')
                      }
                    </div>
                    {!complete && (
                      <button
                        onClick={() => { setAddFundsModal(g.id); setAddFundsAmount(''); setAddFundsError(''); }}
                        style={{ background: 'none', border: '1px solid rgba(200,184,154,0.18)', borderRadius: 7, color: 'rgba(200,184,154,0.5)', fontSize: 10, padding: '2px 8px', cursor: 'pointer', letterSpacing: '0.2px', fontFamily: 'inherit' }}
                      >+ Add funds</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <button
            onClick={() => { setNewPotName(''); setNewPotTarget(''); setNewPotDate(''); setNewPotError(''); setShowPotsModal(true); }}
            style={{
              width: '100%', marginBottom: 10, padding: '11px 0',
              background: 'rgba(232,221,208,0.02)', border: '1px dashed rgba(232,221,208,0.1)',
              borderRadius: 14, color: 'rgba(232,221,208,0.25)', fontSize: 12, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.2px',
            }}
          >+ Create a savings pot</button>
        )}

        {/* Weekly Challenge card */}
        {!challengeData.completed && (
          <div style={{
            marginBottom: 10, background: 'rgba(232,221,208,0.04)',
            border: '1px solid rgba(232,221,208,0.09)', borderRadius: 16,
            padding: '12px 14px', animation: 'cardIn 0.5s ease-out',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 16 }}>{currentChallengeDef.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#E8DDD0', lineHeight: 1.2 }}>{currentChallengeDef.name}</div>
                  <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.38)', marginTop: 1 }}>{currentChallengeDef.desc}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: GREEN }}>+£{currentChallengeDef.saving}</div>
                <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.3)' }}>{daysLeftInWeek()}d left</div>
              </div>
            </div>
            {challengeData.accepted ? (
              <button
                onClick={() => {
                  const updated = { ...challengeData, completed: true };
                  saveChallenge(updated);
                  setChallengeData(updated);
                  setCelebrateMsg(`Challenge complete! You saved £${currentChallengeDef.saving} this week.`);
                  setCelebrate(true);
                  setTimeout(() => setCelebrate(false), 2500);
                }}
                style={{ width: '100%', padding: '7px 0', background: 'rgba(124,174,158,0.14)', border: '1px solid rgba(124,174,158,0.28)', borderRadius: 10, color: GREEN, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >Mark complete ✓</button>
            ) : (
              <button
                onClick={() => {
                  const updated = { ...challengeData, accepted: true, acceptedAt: Date.now() };
                  saveChallenge(updated);
                  setChallengeData(updated);
                }}
                style={{ width: '100%', padding: '7px 0', background: 'rgba(200,184,154,0.14)', border: '1px solid rgba(200,184,154,0.28)', borderRadius: 10, color: PURPLE, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >Accept challenge</button>
            )}
          </div>
        )}

        {/* Task 2 — My Payday Plan button (visible when ≤7 days to payday) */}
        {income > 0 && daysToNextPay <= 7 && (
          <button
            onClick={() => { unlockAudio(); setShowPaydayPlan(true); fetchPaydayPlan(); }}
            style={{
              width: '100%', marginBottom: 8, padding: '13px 0',
              background: daysToNextPay <= 2 ? 'rgba(201,169,110,0.18)' : 'rgba(200,184,154,0.12)',
              border: `1px solid ${daysToNextPay <= 2 ? 'rgba(201,169,110,0.45)' : 'rgba(200,184,154,0.3)'}`,
              borderRadius: 16, color: daysToNextPay <= 2 ? AMBER : PURPLE,
              fontSize: 15, fontWeight: 700, cursor: 'pointer',
              letterSpacing: '0.04em',
              animation: daysToNextPay <= 2 ? 'blink 2.4s ease-in-out infinite' : 'none',
            }}
          >💰 My Payday Plan</button>
        )}

        {/* Feature 1 — Daily proactive insight */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6,
          background: 'rgba(232,221,208,0.03)', border: '1px solid rgba(232,221,208,0.05)',
          borderRadius: 12, padding: '9px 12px',
          minHeight: 38,
        }}>
          <span style={{ fontSize: 13, flexShrink: 0, lineHeight: '1.5' }}>✦</span>
          {insightLoading
            ? <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.22)', lineHeight: 1.5, animation: 'blink 1.6s ease-in-out infinite' }}>Noa is thinking…</div>
            : <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', lineHeight: 1.5, flex: 1 }}>
                {dailyInsight || (insights.length > 0 ? insights[0] : getDailyTip())}
                {insightTapPending && (
                  <button
                    onClick={() => { speak(dailyInsight); setInsightTapPending(false); }}
                    style={{ display: 'block', marginTop: 5, background: 'none', border: '1px solid rgba(200,184,154,0.3)', borderRadius: 8, color: 'rgba(200,184,154,0.65)', fontSize: 10, padding: '3px 9px', cursor: 'pointer', letterSpacing: '0.2px', fontFamily: 'inherit' }}
                  >Tap to hear Noa</button>
                )}
              </div>
          }
        </div>

        </div>{/* end scrollable cards area */}

        {/* ── Pinned "Ask Noa" bar — always visible, one tap away ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
          paddingLeft: 20, paddingRight: 20, paddingTop: 10,
          background: `linear-gradient(to bottom, transparent, ${BG} 45%)`,
          pointerEvents: 'none', zIndex: 8,
        }}>
          <button
            onClick={() => { unlockAudio(); setChatOpen(true); }}
            style={{
              pointerEvents: 'all',
              width: '100%', height: 52,
              background: 'rgba(232,221,208,0.08)',
              border: '1px solid rgba(232,221,208,0.24)',
              borderRadius: 18,
              color: '#E8DDD0', fontSize: 16, fontWeight: 400, cursor: 'pointer',
              letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <span style={{ fontSize: 15, opacity: 0.55 }}>✦</span> Ask Noa…
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DETAIL VIEW — lazy-loaded, slides up, swipe down to dismiss
          position: fixed so it covers the full visible viewport correctly on iOS
      ══════════════════════════════════════════ */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={e => onSwipeEnd(e, true)}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          height: vpH ? `${vpH}px` : '100dvh',
          zIndex: 10, background: BG,
          transform: detailOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: SLIDE,
        }}
      >
        {detailMounted && (
          <Suspense fallback={null}>
            <LazyDetailView
              income={income}
              expenses={expenses}
              debt={debt}
              goal={goal}
              insights={insights}
              surplus={surplus}
              goals={goals}
              savings={savings}
              debts={debts}
              onClose={() => setDetailOpen(false)}
            />
          </Suspense>
        )}
      </div>

      {/* ══════════════════════════════════════════
          CHAT OVERLAY — full conversational UI
          position: fixed so it's always sized to the actual visible viewport,
          not the parent container — this keeps the input bar above the keyboard.
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: vpH ? `${vpH}px` : '100dvh',
        zIndex: 20, background: BG,
        transform: chatOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: SLIDE,
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header: back · orb · settings ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center',
          paddingTop: 'max(env(safe-area-inset-top), 16px)',
          paddingBottom: 10, paddingLeft: 4, paddingRight: 4,
          borderBottom: '1px solid rgba(232,221,208,0.06)',
          background: BG,
        }}>
          <button
            onClick={() => setChatOpen(false)}
            style={{ width: 48, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,221,208,0.36)', fontSize: 22, padding: 8, lineHeight: 1, flexShrink: 0 }}
            aria-label="Close chat"
          >↓</button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            <div style={{ position: 'relative' }}>
              <Orb
                size={80}
                state={orbState}
                onTap={() => isListening ? stopListening() : startListening()}
              />
              {spendAlert && orbState === 'idle' && (
                <div style={{
                  position: 'absolute', top: 4, right: 4, width: 10, height: 10,
                  borderRadius: '50%', background: RED, border: `2px solid ${BG}`,
                  animation: 'alertPulse 1.4s ease-in-out infinite',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
            <div style={{ minHeight: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isListening && transcript ? (
                <div style={{ color: 'rgba(232,221,208,0.6)', fontSize: 11, maxWidth: 200, textAlign: 'center', fontStyle: 'italic' }}>
                  "{transcript}"
                </div>
              ) : isListening ? (
                <WaveBars color={BLUE} small />
              ) : orbState === 'speaking' ? (
                <WaveBars color={PURPLE} small />
              ) : orbState === 'thinking' ? (
                <div style={{ color: 'rgba(232,221,208,0.4)', fontSize: 11, letterSpacing: '0.5px', animation: 'blink 1.6s ease-in-out infinite' }}>
                  Thinking…
                </div>
              ) : (
                <div style={{ color: 'rgba(232,221,208,0.18)', fontSize: 11, letterSpacing: '0.3px', opacity: tapHintVisible ? 1 : 0, transition: 'opacity 0.8s ease' }}>
                  Tap to speak
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            style={{ width: 48, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(232,221,208,0.26)', fontSize: 20, padding: 8, lineHeight: 1, flexShrink: 0 }}
            aria-label="Settings"
          >⚙</button>
        </div>

        {/* ── Message list ── */}
        <div
          ref={chatScrollRef}
          className="chat-scroll"
          style={{
            flex: 1, overflowY: 'auto', padding: '14px 14px 8px',
            display: 'flex', flexDirection: 'column', gap: 10,
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}
        >
          {cards.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}>
              <div style={{ color: 'rgba(232,221,208,0.2)', fontSize: 13, textAlign: 'center', letterSpacing: '0.3px' }}>
                Ask Noa anything
              </div>
            </div>
          )}
          {cards.map(card => (
            <MessageBubble key={card.id} type={card.type} text={card.text} />
          ))}
        </div>

        {/* ── Input bar ──
             paddingBottom adjusts dynamically:
             · kbHeight > 10: keyboard is open — minimal padding (home bar is hidden under keyboard)
             · otherwise: safe-area-inset-bottom to clear the home indicator bar
        ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
          paddingTop: 10,
          paddingBottom: kbHeight > 10 ? '10px' : 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
          paddingLeft: 12, paddingRight: 12,
          background: BG,
          borderTop: '1px solid rgba(232,221,208,0.06)',
        }}>
          {speechSupported && (
            <button
              onPointerDown={() => isListening ? stopListening() : startListening()}
              style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
                background: isListening ? 'rgba(168,152,128,0.22)' : 'rgba(232,221,208,0.06)',
                color: isListening ? BLUE : 'rgba(232,221,208,0.3)',
                fontSize: 17, cursor: 'pointer', transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: isListening ? 'micPulse 1s ease-in-out infinite' : 'none',
              }}
              aria-label="Voice input"
            >🎤</button>
          )}
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && input.trim() && handleMessage(input)}
            placeholder="Ask Noa…"
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(232,221,208,0.2)',
              borderRadius: 24,
              padding: '12px 18px',
              color: '#E8DDD0',
              WebkitTextFillColor: '#E8DDD0',
              fontSize: 16,
              fontWeight: 300,
              outline: 'none',
              fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
          />
          <button
            onClick={() => input.trim() && handleMessage(input)}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: input.trim() ? 'rgba(200,184,154,0.22)' : 'rgba(232,221,208,0.05)',
              color: input.trim() ? PURPLE : 'rgba(232,221,208,0.18)',
              fontSize: 22, cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >›</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PAYDAY CEREMONY (lazy-loaded for performance)
      ══════════════════════════════════════════ */}
      {showCeremony && (
        <Suspense fallback={null}>
          <PaydayCeremony
            income={income}
            onComplete={() => { setLastCeremonyYM(); setShowCeremony(false); }}
          />
        </Suspense>
      )}

      {/* ══════════════════════════════════════════
          CELEBRATION CONFETTI
      ══════════════════════════════════════════ */}
      {celebrate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {CONFETTI_DOTS.map((dot, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: dot.size, height: dot.size, borderRadius: '50%',
              background: dot.color,
              '--dx': `${dot.dx}px`,
              '--dy': `${dot.dy}px`,
              animation: `confettiFly 2s ease-out ${dot.delay}s forwards`,
            }} />
          ))}
          <div style={{
            position: 'absolute',
            color: '#E8DDD0', fontSize: 20, fontWeight: 800,
            textAlign: 'center', lineHeight: 1.4,
            textShadow: '0 2px 24px rgba(0,0,0,0.9)',
            animation: 'cardIn 0.4s ease-out',
            maxWidth: 280, padding: '0 24px',
          }}>{celebrateMsg}</div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SETTINGS OVERLAY
      ══════════════════════════════════════════ */}
      {/* ══════════════════════════════════════════
          EVENING CHECK-IN OVERLAY
      ══════════════════════════════════════════ */}
      {eveningCheckOpen && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 55 }}>
          <div style={{ background: 'rgba(10,8,28,0.98)', border: '1px solid rgba(200,184,154,0.24)', borderRadius: 26, padding: 28, width: '100%', maxWidth: 320, animation: 'cardIn 0.28s ease-out' }}>
            {eveningPhase === 'ask' ? (
              <>
                <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 10 }}>🌙</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#E8DDD0', textAlign: 'center', marginBottom: 8 }}>Evening Check-in</div>
                <div style={{ fontSize: 14, color: 'rgba(232,221,208,0.52)', textAlign: 'center', lineHeight: 1.6, marginBottom: 26 }}>
                  How did today go financially?<br />Did you stick to your budget?
                </div>
                <button
                  onClick={handleEveningYes}
                  style={{ width: '100%', padding: 13, background: 'rgba(124,174,158,0.14)', border: '1px solid rgba(124,174,158,0.3)', borderRadius: 12, color: GREEN, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}
                >Yes, I did ✓</button>
                <button
                  onClick={() => setEveningPhase('followup')}
                  style={{ width: '100%', padding: 13, background: 'rgba(232,221,208,0.05)', border: '1px solid rgba(232,221,208,0.1)', borderRadius: 12, color: 'rgba(232,221,208,0.6)', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
                >No, not quite</button>
                <button onClick={() => setEveningCheckOpen(false)} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'rgba(232,221,208,0.28)', fontSize: 13, cursor: 'pointer' }}>Later</button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#E8DDD0', marginBottom: 6 }}>That's okay — reflect on it</div>
                <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.45)', lineHeight: 1.55, marginBottom: 16 }}>What happened? A quick note helps with your monthly review.</div>
                <textarea
                  value={eveningNote}
                  onChange={e => setEveningNote(e.target.value)}
                  placeholder="e.g. Grabbed a takeaway, forgot lunch..."
                  rows={3}
                  style={{ width: '100%', background: 'rgba(232,221,208,0.06)', border: '1px solid rgba(232,221,208,0.1)', borderRadius: 12, padding: '10px 14px', color: '#E8DDD0', fontSize: 16, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', marginBottom: 14 }}
                />
                <button
                  onClick={handleEveningNo}
                  style={{ width: '100%', padding: 13, background: PURPLE, border: 'none', borderRadius: 12, color: '#E8DDD0', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
                >Save reflection</button>
                <button onClick={() => setEveningPhase('ask')} style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'rgba(232,221,208,0.28)', fontSize: 13, cursor: 'pointer' }}>Back</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Task 2: Payday Plan modal ── */}
      {showPaydayPlan && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setShowPaydayPlan(false); stopSpeaking(); } }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 50 }}
        >
          <div style={{
            width: '100%', background: '#13151c', borderTop: '1px solid rgba(200,184,154,0.2)',
            borderRadius: '24px 24px 0 0', padding: '24px 20px 36px',
            animation: 'cardIn 0.3s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: AMBER, letterSpacing: '1.2px', textTransform: 'uppercase', fontWeight: 700 }}>💰 Payday Plan</div>
              <button onClick={() => { setShowPaydayPlan(false); stopSpeaking(); }} style={{ background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}>×</button>
            </div>
            {paydayPlanLoading ? (
              <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.3)', lineHeight: 1.6, animation: 'blink 1.6s ease-in-out infinite', minHeight: 80, display: 'flex', alignItems: 'center' }}>
                Noa is building your plan…
              </div>
            ) : (
              <>
                <div style={{ fontSize: 15, color: '#E8DDD0', lineHeight: 1.72, fontWeight: 300, marginBottom: 20 }}>
                  {paydayPlanText || 'Tap to generate your payday plan.'}
                </div>
                {accounts.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    {accounts.map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingBottom: 8, borderBottom: '1px solid rgba(232,221,208,0.05)' }}>
                        <div>
                          <div style={{ fontSize: 13, color: '#E8DDD0', fontWeight: 500 }}>{a.name}</div>
                          <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.35)' }}>{a.purpose}</div>
                        </div>
                        {a.balance > 0 && <div style={{ fontSize: 13, color: AMBER, fontWeight: 600 }}>£{a.balance.toLocaleString('en-GB')}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => { if (paydayPlanText) speak(paydayPlanText); else fetchPaydayPlan(); }}
                  style={{ width: '100%', padding: '12px 0', background: 'rgba(201,169,110,0.14)', border: '1px solid rgba(201,169,110,0.3)', borderRadius: 14, color: AMBER, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                >{paydayPlanText ? '🔊 Hear it again' : 'Generate plan'}</button>
              </>
            )}
          </div>
        </div>
      )}

      {showSettings && (
        <div
          onClick={e => { if (e.target === e.currentTarget) { setShowSettings(false); setShowResetConfirm(false); } }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
        >
          <div style={{
            background: 'rgba(16,14,36,0.97)', border: '1px solid rgba(200,184,154,0.22)',
            borderRadius: 26, padding: 28, width: '100%', maxWidth: 320,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            animation: 'cardIn 0.28s ease-out',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#E8DDD0', marginBottom: 22 }}>Settings</div>
            <Label>Your name</Label>
            <input
              value={settingName}
              onChange={e => setSettingName(e.target.value)}
              placeholder="So Noa can address you"
              style={{ width: '100%', background: 'rgba(232,221,208,0.07)', border: '1px solid rgba(232,221,208,0.11)', borderRadius: 12, padding: '11px 14px', color: '#E8DDD0', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 20, boxSizing: 'border-box' }}
            />
            <Label>Payday day</Label>
            <input
              type="number"
              value={settingPayday}
              onChange={e => setSettingPayday(e.target.value)}
              placeholder="Day of month (e.g. 25)"
              min="1"
              max="31"
              style={{ width: '100%', background: 'rgba(232,221,208,0.07)', border: '1px solid rgba(232,221,208,0.11)', borderRadius: 12, padding: '11px 14px', color: '#E8DDD0', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 20, boxSizing: 'border-box' }}
            />
            <Label>Savings balance (£)</Label>
            <input
              type="number"
              value={settingSavings}
              onChange={e => setSettingSavings(e.target.value)}
              placeholder="e.g. 2500"
              min="0"
              style={{ width: '100%', background: 'rgba(232,221,208,0.07)', border: '1px solid rgba(232,221,208,0.11)', borderRadius: 12, padding: '11px 14px', color: '#E8DDD0', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 20, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, color: '#E8DDD0', marginBottom: 2 }}>Voice responses</div>
                <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.38)' }}>Noa speaks aloud</div>
              </div>
              <Toggle on={voiceOn} onToggle={() => setVoiceOn(v => !v)} />
            </div>

            {/* Task 1 — Privacy Mode toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{ fontSize: 14, color: '#E8DDD0', marginBottom: 2 }}>Privacy Mode 🔒</div>
                <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.38)', lineHeight: 1.45 }}>Noa won't say specific numbers out loud. Useful in public.</div>
              </div>
              <Toggle on={privacyMode} onToggle={() => { const next = !privacyMode; setPrivacyModeState(next); savePrivacyMode(next); privacyModeRef.current = next; }} />
            </div>

            {/* Feature 7 — Notification preferences */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Notifications</div>
              {notifPerms === 'granted' ? (
                <>
                  {[
                    { key: 'morning', label: 'Morning nudge', sub: '9am daily — budget & payday status' },
                    { key: 'payday',  label: 'Payday alert',  sub: 'On your salary date' },
                    { key: 'streak',  label: 'Streak at risk',sub: '7pm if you haven\'t opened today' },
                    { key: 'weekly',  label: 'Weekly summary',sub: 'Sunday 6pm — VELA score + surplus' },
                  ].map(({ key, label, sub }) => (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#E8DDD0', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.34)' }}>{sub}</div>
                      </div>
                      <Toggle
                        on={notifPrefs[key]}
                        onToggle={() => setNotifPrefsState(p => ({ ...p, [key]: !p[key] }))}
                      />
                    </div>
                  ))}
                  {(/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) && (
                    <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', lineHeight: 1.5, padding: '8px 10px', background: 'rgba(232,221,208,0.04)', borderRadius: 8 }}>
                      iOS note: notifications only work when Noa is added to your Home Screen. Tap Share → Add to Home Screen to enable them.
                    </div>
                  )}
                </>
              ) : notifPerms === 'denied' ? (
                <div style={{ fontSize: 12, color: 'rgba(226,75,74,0.65)', lineHeight: 1.5 }}>
                  Notifications blocked in your browser. Go to Settings → Safari → Noa to allow them.
                </div>
              ) : (
                <button
                  onClick={async () => { await requestNotifPermission(); }}
                  style={{ width: '100%', padding: '10px 0', background: 'rgba(200,184,154,0.1)', border: '1px solid rgba(200,184,154,0.22)', borderRadius: 10, color: PURPLE, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >Enable notifications</button>
              )}
            </div>

            {/* Task 2 — Clear conversation history */}
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => {
                  clearConvoMemory();
                  localStorage.removeItem(HISTORY_KEY);
                  setCards([]);
                  setConvoCleared(true);
                  setTimeout(() => setConvoCleared(false), 2200);
                }}
                style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(232,221,208,0.34)', fontSize: 12, cursor: 'pointer', letterSpacing: '0.2px', textDecoration: 'underline', fontFamily: 'inherit' }}
              >Clear conversation history</button>
              {convoCleared && (
                <span style={{ marginLeft: 8, fontSize: 11, color: GREEN, animation: 'cardIn 0.2s ease-out' }}>Conversation cleared</span>
              )}
            </div>

            {/* Open Banking — connected bank or connect prompt */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Open Banking</div>
              {bankConnected ? (
                <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(124,174,158,0.08)', border: '1px solid rgba(124,174,158,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>✓ {bankInstitution} connected</div>
                      <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', marginTop: 2 }}>
                        {bankLastSync
                          ? `Synced ${new Date(bankLastSync).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                          : 'Not yet synced'}
                      </div>
                    </div>
                    <button
                      onClick={() => { if (!bankSyncing) syncBankAccounts(); }}
                      disabled={bankSyncing}
                      style={{ background: 'rgba(124,174,158,0.12)', border: '1px solid rgba(124,174,158,0.25)', borderRadius: 8, padding: '5px 12px', color: GREEN, fontSize: 12, fontWeight: 600, cursor: bankSyncing ? 'default' : 'pointer', fontFamily: 'inherit', opacity: bankSyncing ? 0.55 : 1 }}
                    >{bankSyncing ? 'Syncing…' : 'Sync now'}</button>
                  </div>
                  {bankSyncErr && <div style={{ fontSize: 11, color: '#E24B4A', marginBottom: 6 }}>{bankSyncErr}</div>}
                  <button
                    onClick={() => {
                      clearBanking();
                      setBankConnected(false);
                      setBankInstitution('');
                      setBankLastSyncState('');
                      setBankSyncErr('');
                      // Clear bank-sourced expense entries
                      const manual = getExpenseLog().filter(e => !e.fromBank);
                      saveExpenseLog(manual);
                      setExpenseLog(manual);
                    }}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(226,75,74,0.55)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                  >Disconnect bank</button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => { setShowSettings(false); setShowBankConnect(true); }}
                    style={{ width: '100%', padding: '10px 0', background: 'rgba(124,174,158,0.08)', border: '1px solid rgba(124,174,158,0.22)', borderRadius: 12, color: GREEN, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >🔗 Connect your bank</button>
                  <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.26)', textAlign: 'center', marginTop: 5, lineHeight: 1.5 }}>
                    Read-only access. Noa can never move or touch your money.
                  </div>
                </>
              )}
            </div>

            <SettingsBtn onClick={saveSettings} color={PURPLE} text="Save" />

            {/* Task 3 — Upgrade Noa */}
            <SettingsBtn
              onClick={() => { setShowSettings(false); setShowUpgrade(true); }}
              color="rgba(201,169,110,0.1)"
              border="rgba(201,169,110,0.3)"
              textColor={AMBER}
              text="✦ Upgrade Noa"
            />

            {/* Task 4 — Share Noa */}
            <SettingsBtn
              onClick={() => {
                setShowSettings(false);
                if (!shareQuote) generateShareQuote();
                setShowShare(true);
              }}
              color="rgba(124,174,158,0.08)"
              border="rgba(124,174,158,0.22)"
              textColor={GREEN}
              text="↗ Share Noa"
            />
            {showResetConfirm ? (
              <>
                <div style={{ fontSize: 13, color: '#E24B4A', textAlign: 'center', marginBottom: 12, lineHeight: 1.5 }}>
                  This will delete all your data — income, goals, chat history, everything. Are you sure?
                </div>
                <SettingsBtn
                  onClick={() => { stopSpeaking(); clearAll(); onReset(); }}
                  color="rgba(226,75,74,0.22)"
                  border="rgba(226,75,74,0.5)"
                  textColor="#E24B4A"
                  text="Yes, reset everything"
                />
                <button onClick={() => setShowResetConfirm(false)} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: 'rgba(232,221,208,0.36)', fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <SettingsBtn
                  onClick={() => setShowResetConfirm(true)}
                  color="rgba(255,80,80,0.1)"
                  border="rgba(255,80,80,0.2)"
                  textColor="rgba(226,75,74,0.7)"
                  text="Reset Noa"
                />
                <button onClick={() => setShowSettings(false)} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          BANK CONNECT MODAL
      ══════════════════════════════════════════ */}
      {showBankConnect && (
        <BankConnectModal
          onClose={() => setShowBankConnect(false)}
          onConnected={(inst) => {
            setBankInstitution(inst);
            setBankConnected(true);
            setShowBankConnect(false);
            syncBankAccounts();
          }}
        />
      )}

      {/* ══════════════════════════════════════════
          LOG TRANSACTION MODAL
      ══════════════════════════════════════════ */}
      {showLogTx && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowLogTx(false); }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 60 }}
        >
          <div style={{
            background: 'rgba(16,14,36,0.97)', border: '1px solid rgba(200,184,154,0.24)',
            borderRadius: 26, padding: 28, width: '100%', maxWidth: 320,
            animation: 'cardIn 0.28s ease-out',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#E8DDD0', marginBottom: 20 }}>Log a transaction</div>

            <Label>Amount (£)</Label>
            {txError && <div style={{ fontSize: 11, color: '#E24B4A', marginBottom: 6, letterSpacing: '0.1px' }}>{txError}</div>}
            <input
              type="number"
              inputMode="decimal"
              value={txForm.amount}
              onChange={e => { setTxForm(f => ({ ...f, amount: e.target.value })); if (txError) setTxError(''); }}
              placeholder="0.00"
              style={{ width: '100%', background: 'rgba(232,221,208,0.07)', border: '1px solid rgba(232,221,208,0.11)', borderRadius: 12, padding: '11px 14px', color: '#E8DDD0', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }}
            />

            <Label>Merchant / Note</Label>
            <input
              value={txForm.note}
              onChange={e => {
                const note = e.target.value;
                const suggested = suggestCategory(note);
                if (suggested) {
                  setTxForm(f => ({ ...f, note, category: suggested }));
                  setTxCatSuggested(true);
                } else {
                  setTxForm(f => ({ ...f, note }));
                  setTxCatSuggested(false);
                }
              }}
              placeholder="e.g. Tesco, Netflix, rent..."
              style={{ width: '100%', background: 'rgba(232,221,208,0.07)', border: '1px solid rgba(232,221,208,0.11)', borderRadius: 12, padding: '11px 14px', color: '#E8DDD0', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 12, boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <Label style={{ marginBottom: 0 }}>Category</Label>
              {txCatSuggested && (
                <span style={{ fontSize: 10, color: '#7CAE9E', letterSpacing: '0.5px', fontWeight: 600 }}>
                  ✦ auto-suggested
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[
                { key: 'essentials', label: 'Essentials', color: PURPLE, activeBg: 'rgba(200,184,154,0.18)' },
                { key: 'lifestyle',  label: 'Lifestyle',  color: BLUE,   activeBg: 'rgba(168,152,128,0.18)' },
                { key: 'savings',    label: 'Savings',    color: GREEN,  activeBg: 'rgba(124,174,158,0.18)' },
              ].map(({ key, label, color, activeBg }) => (
                <button
                  key={key}
                  onClick={() => { setTxForm(f => ({ ...f, category: key })); setTxCatSuggested(false); }}
                  style={{
                    flex: 1, padding: '8px 4px', borderRadius: 10,
                    border: `1px solid ${txForm.category === key ? color : 'rgba(232,221,208,0.1)'}`,
                    background: txForm.category === key ? activeBg : 'rgba(232,221,208,0.04)',
                    color: txForm.category === key ? color : 'rgba(232,221,208,0.4)',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '0.2px',
                  }}
                >{label}</button>
              ))}
            </div>

            <Label>Date</Label>
            <input
              type="date"
              value={txForm.date}
              onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))}
              style={{ width: '100%', background: 'rgba(232,221,208,0.07)', border: '1px solid rgba(232,221,208,0.11)', borderRadius: 12, padding: '11px 14px', color: '#E8DDD0', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 20, boxSizing: 'border-box' }}
            />

            <SettingsBtn
              onClick={() => {
                const amount = parseFloat(txForm.amount);
                if (isNaN(amount) || amount <= 0) { setTxError('Enter a valid amount greater than £0'); return; }
                const entry = {
                  amount,
                  category: txForm.category,
                  date: txForm.date || new Date().toISOString().slice(0, 10),
                  ts: Date.now(),
                  ...(txForm.note.trim() ? { note: txForm.note.trim() } : {}),
                };
                const updated = [...expenseLog, entry];
                saveExpenseLog(updated);
                setExpenseLog(updated);
                setShowLogTx(false);
                setTxError('');
                setTxCatSuggested(false);
                setTxForm({ amount: '', category: 'essentials', note: '', date: new Date().toISOString().slice(0, 10) });
                // Feature 2 — Noa comments on the transaction
                fetchTxComment(entry, updated);
              }}
              color={PURPLE}
              text="Log transaction"
            />
            <button onClick={() => { setShowLogTx(false); setTxError(''); setTxCatSuggested(false); }} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PWA INSTALL BANNER — shown once after 2nd visit
      ══════════════════════════════════════════ */}
      {showPwaBanner && (
        <div style={{
          position: 'absolute',
          bottom: 'max(env(safe-area-inset-bottom), 12px)',
          left: 16, right: 16,
          zIndex: 190,
          background: 'rgba(26,22,44,0.97)',
          border: '1px solid rgba(200,184,154,0.28)',
          borderRadius: 16,
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          animation: 'cardIn 0.35s ease-out',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>📱</span>
          <div style={{ flex: 1, fontSize: 13, color: 'rgba(232,221,208,0.78)', lineHeight: 1.45 }}>
            Add Noa to your Home Screen for the full experience.
          </div>
          {deferredInstallRef.current ? (
            <button
              onClick={async () => {
                deferredInstallRef.current.prompt();
                const { outcome } = await deferredInstallRef.current.userChoice;
                console.log('[pwa] install outcome:', outcome);
                localStorage.setItem('noa_pwa_dismissed', '1');
                setShowPwaBanner(false);
              }}
              style={{ flexShrink: 0, padding: '6px 12px', background: 'rgba(200,184,154,0.18)', border: '1px solid rgba(200,184,154,0.3)', borderRadius: 9, color: PURPLE, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >Install</button>
          ) : null}
          <button
            onClick={() => { localStorage.setItem('noa_pwa_dismissed', '1'); setShowPwaBanner(false); }}
            style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(232,221,208,0.32)', fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }}
            aria-label="Dismiss"
          >×</button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          MEMORY RESET BANNER (Task 3)
          Subtle cream top banner — appears up to 3 days before free-tier reset.
      ══════════════════════════════════════════ */}
      {memoryBannerDays > 0 && !localStorage.getItem('noa_banner_dismissed') && (
        <div style={{
          position: 'absolute',
          top: 'max(env(safe-area-inset-top), 0px)',
          left: 0, right: 0,
          zIndex: 120,
          background: 'rgba(232,221,208,0.07)',
          borderBottom: '1px solid rgba(200,184,154,0.18)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: '10px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'cardIn 0.4s ease-out',
        }}>
          <div style={{ flex: 1, fontSize: 12, color: 'rgba(232,221,208,0.72)', lineHeight: 1.45 }}>
            Noa's memory resets in <strong style={{ color: AMBER }}>{memoryBannerDays} day{memoryBannerDays !== 1 ? 's' : ''}</strong>. Upgrade to keep your full financial history.
          </div>
          <button
            onClick={() => setShowUpgrade(true)}
            style={{ flexShrink: 0, padding: '5px 12px', background: 'rgba(201,169,110,0.15)', border: '1px solid rgba(201,169,110,0.32)', borderRadius: 8, color: AMBER, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >Upgrade</button>
          <button
            onClick={() => { localStorage.setItem('noa_banner_dismissed', '1'); setMemoryBannerDays(0); }}
            style={{ flexShrink: 0, background: 'none', border: 'none', color: 'rgba(232,221,208,0.28)', fontSize: 18, cursor: 'pointer', padding: 2, lineHeight: 1 }}
          >×</button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          FIRST WEEK PLAN MODAL (Task 2)
          Full-screen, spoken once, never shown again.
      ══════════════════════════════════════════ */}
      {showFirstWeek && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          background: BG,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 28px',
          animation: 'cardIn 0.4s ease-out',
        }}>
          {/* Orb */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #d8cebe, #C8B89A 55%, #7a6a52)',
            boxShadow: '0 0 28px 10px rgba(200,184,154,0.42)',
            animation: 'orbSpeaking 0.38s ease-in-out infinite',
            marginBottom: 28, flexShrink: 0,
          }} />

          <div style={{ fontSize: 10, color: 'rgba(200,184,154,0.5)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 20 }}>
            Your First Week Plan
          </div>

          {firstWeekLoading ? (
            <div style={{ fontSize: 15, color: 'rgba(232,221,208,0.5)', animation: 'blink 1.6s ease-in-out infinite', textAlign: 'center' }}>
              Noa is reading your situation…
            </div>
          ) : (
            <div style={{ maxWidth: 320, width: '100%' }}>
              {firstWeekText.split('\n').filter(s => s.trim()).map((sentence, i) => (
                <div key={i} style={{
                  fontSize: i === 0 ? 16 : 14,
                  fontWeight: i === 0 ? 600 : 400,
                  color: i === 0 ? '#E8DDD0' : 'rgba(232,221,208,0.68)',
                  lineHeight: 1.6,
                  marginBottom: 14,
                  paddingLeft: i > 0 ? 14 : 0,
                  borderLeft: i > 0 ? '2px solid rgba(200,184,154,0.25)' : 'none',
                  animation: `cardIn 0.4s ease-out ${i * 0.12}s both`,
                }}>
                  {sentence}
                </div>
              ))}
            </div>
          )}

          {!firstWeekLoading && (
            <button
              onClick={() => setShowFirstWeek(false)}
              style={{
                marginTop: 32,
                background: 'rgba(200,184,154,0.12)', border: '1px solid rgba(200,184,154,0.28)',
                borderRadius: 24, color: PURPLE,
                fontSize: 14, fontWeight: 600,
                padding: '12px 36px', cursor: 'pointer',
                letterSpacing: '0.03em',
              }}
            >
              Let's get started →
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          UPGRADE MODAL (Task 3)
          Premium dark modal. Three tiers. "Coming soon" with waitlist capture.
      ══════════════════════════════════════════ */}
      {showUpgrade && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowUpgrade(false); }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 210 }}
        >
          <div style={{
            background: 'rgba(12,10,22,0.98)', border: '1px solid rgba(200,184,154,0.2)',
            borderRadius: 28, padding: '28px 24px', width: '100%', maxWidth: 340,
            backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
            animation: 'cardIn 0.28s ease-out',
            maxHeight: '85vh', overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', margin: '0 auto 14px',
                background: 'radial-gradient(circle at 35% 35%, #d8cebe, #C8B89A 55%, #7a6a52)',
                boxShadow: '0 0 20px 6px rgba(200,184,154,0.32)',
              }} />
              <div style={{ fontSize: 20, fontWeight: 700, color: '#E8DDD0', letterSpacing: '-0.01em' }}>Upgrade Noa</div>
              <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.45)', marginTop: 6, lineHeight: 1.5 }}>
                Memory that never resets. Smarter insights.
              </div>
            </div>

            {/* Tiers */}
            {[
              {
                name: 'Free Trial',
                price: '14 days',
                sub: 'Full access to explore',
                color: 'rgba(232,221,208,0.12)',
                border: 'rgba(232,221,208,0.14)',
                features: ['All core features', 'Voice responses', 'Transaction logging', 'Memory resets every 7 days'],
                current: planType === 'free',
                textColor: 'rgba(232,221,208,0.7)',
              },
              {
                name: 'Noa',
                price: '£6.99',
                sub: 'per month',
                color: 'rgba(200,184,154,0.1)',
                border: 'rgba(200,184,154,0.35)',
                featured: true,
                features: ['Full app + ElevenLabs voice', 'Memory that never resets', 'Financial personality tracking', 'UK benchmark comparisons'],
                textColor: PURPLE,
              },
              {
                name: 'Noa Pro',
                price: '£9.99',
                sub: 'per month',
                color: 'rgba(201,169,110,0.08)',
                border: 'rgba(201,169,110,0.28)',
                features: ['Everything in Noa', 'Priority AI responses', 'Spending pattern predictions', 'Advanced goal tracking'],
                textColor: AMBER,
              },
            ].map((tier) => (
              <div key={tier.name} style={{
                background: tier.color, border: `1px solid ${tier.border}`,
                borderRadius: 18, padding: '18px 18px', marginBottom: 14,
                position: 'relative',
              }}>
                {tier.featured && (
                  <div style={{ position: 'absolute', top: -10, right: 16, background: PURPLE, color: BG, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', padding: '3px 10px', borderRadius: 100 }}>MOST POPULAR</div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tier.textColor }}>{tier.name}</div>
                  <div>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#E8DDD0' }}>{tier.price}</span>
                    <span style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', marginLeft: 4 }}>{tier.sub}</span>
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ fontSize: 12, color: 'rgba(232,221,208,0.55)', display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <span style={{ color: tier.textColor, flexShrink: 0, marginTop: 1 }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                {!tier.current && (
                  <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>Coming soon</div>
                )}
                {tier.current ? (
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(232,221,208,0.35)', padding: '6px 0' }}>Your current plan</div>
                ) : (
                  <div>
                    {waitlistSubmitted ? (
                      <div style={{ textAlign: 'center', fontSize: 12, color: GREEN, padding: '6px 0' }}>✓ You're on the waitlist</div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          value={waitlistEmail}
                          onChange={e => setWaitlistEmail(e.target.value)}
                          placeholder="your@email.com"
                          style={{ flex: 1, background: 'rgba(232,221,208,0.07)', border: '1px solid rgba(232,221,208,0.12)', borderRadius: 9, padding: '8px 10px', color: '#E8DDD0', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                        />
                        <button
                          onClick={() => {
                            if (waitlistEmail.includes('@')) {
                              saveWaitlistEmail(waitlistEmail);
                              setWaitlistSubmitted(true);
                            }
                          }}
                          style={{ flexShrink: 0, padding: '8px 12px', background: `rgba(200,184,154,0.15)`, border: `1px solid ${tier.border}`, borderRadius: 9, color: tier.textColor, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >Notify me</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => setShowUpgrade(false)}
              style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: 'rgba(232,221,208,0.28)', fontSize: 14, cursor: 'pointer', marginTop: 4 }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          NEW POT MODAL (FEATURE 10)
          Create a new sinking-fund savings pot.
      ══════════════════════════════════════════ */}
      {showPotsModal && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowPotsModal(false); }}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 85 }}
        >
          <div style={{ background: BG, border: '1px solid rgba(200,184,154,0.18)', borderRadius: 24, padding: '22px 20px', width: '100%', maxWidth: 320, animation: 'cardIn 0.28s ease-out' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#E8DDD0', marginBottom: 18 }}>Create a savings pot</div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', marginBottom: 5 }}>What are you saving for?</div>
              <input
                value={newPotName}
                onChange={e => { setNewPotName(e.target.value); setNewPotError(''); }}
                placeholder="e.g. Holiday, New MacBook, Emergency fund"
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(232,221,208,0.05)', border: '1px solid rgba(232,221,208,0.1)', borderRadius: 10, color: '#E8DDD0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', marginBottom: 5 }}>Target amount (£)</div>
              <input
                type="number"
                value={newPotTarget}
                onChange={e => { setNewPotTarget(e.target.value); setNewPotError(''); }}
                placeholder="e.g. 1500"
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(232,221,208,0.05)', border: '1px solid rgba(232,221,208,0.1)', borderRadius: 10, color: '#E8DDD0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', marginBottom: 5 }}>Target date <span style={{ color: 'rgba(232,221,208,0.22)' }}>(optional)</span></div>
              <input
                value={newPotDate}
                onChange={e => setNewPotDate(e.target.value)}
                placeholder="e.g. August, December 2026"
                style={{ width: '100%', padding: '10px 12px', background: 'rgba(232,221,208,0.05)', border: '1px solid rgba(232,221,208,0.1)', borderRadius: 10, color: '#E8DDD0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
            </div>

            {newPotError && (
              <div style={{ fontSize: 12, color: RED, marginBottom: 12, lineHeight: 1.4 }}>{newPotError}</div>
            )}

            <button
              onClick={() => {
                const name   = newPotName.trim();
                const target = parseFloat(newPotTarget);
                if (!name)            { setNewPotError('Give your pot a name.'); return; }
                if (!target || target <= 0) { setNewPotError('Enter a valid target amount.'); return; }
                const newGoal = {
                  id:         Date.now(),
                  name,
                  target,
                  saved:      0,
                  createdAt:  new Date().toISOString().slice(0, 10),
                  targetDate: newPotDate.trim() || null,
                };
                const updated = [...goals, newGoal];
                saveGoals(updated);
                setGoals(updated);
                setShowPotsModal(false);
                const mLeft = monthsUntil(newPotDate.trim());
                const perMonth = newPotDate.trim() && mLeft > 0 ? ` That's £${(target / mLeft).toFixed(0)} a month.` : '';
                const reply = `Pot created for ${name}. Target: £${target.toLocaleString('en-GB')}.${perMonth}`;
                speak(reply);
              }}
              style={{ width: '100%', padding: 13, background: 'rgba(200,184,154,0.14)', border: '1px solid rgba(200,184,154,0.26)', borderRadius: 12, color: PURPLE, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}
            >Create pot</button>

            <button
              onClick={() => setShowPotsModal(false)}
              style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'rgba(232,221,208,0.26)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >Cancel</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ADD FUNDS MODAL (FEATURE 10)
          Record a contribution to an existing savings pot.
      ══════════════════════════════════════════ */}
      {addFundsModal !== null && (() => {
        const pot = goals.find(g => g.id === addFundsModal);
        if (!pot) return null;
        const savedAmt  = pot.saved || 0;
        const remaining = pot.target - savedAmt;
        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) setAddFundsModal(null); }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.84)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 85 }}
          >
            <div style={{ background: BG, border: '1px solid rgba(200,184,154,0.18)', borderRadius: 24, padding: '22px 20px', width: '100%', maxWidth: 320, animation: 'cardIn 0.28s ease-out' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8DDD0', marginBottom: 4 }}>{pot.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.32)', marginBottom: 18 }}>
                £{savedAmt.toLocaleString('en-GB')} saved · £{remaining.toLocaleString('en-GB')} to go
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', marginBottom: 5 }}>Amount to add (£)</div>
                <input
                  type="number"
                  value={addFundsAmount}
                  onChange={e => { setAddFundsAmount(e.target.value); setAddFundsError(''); }}
                  placeholder="e.g. 200"
                  autoFocus
                  style={{ width: '100%', padding: '10px 12px', background: 'rgba(232,221,208,0.05)', border: '1px solid rgba(232,221,208,0.1)', borderRadius: 10, color: '#E8DDD0', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
              </div>

              {addFundsError && (
                <div style={{ fontSize: 12, color: RED, marginBottom: 12 }}>{addFundsError}</div>
              )}

              <button
                onClick={() => {
                  const amount = parseFloat(addFundsAmount);
                  if (!amount || amount <= 0) { setAddFundsError('Enter a valid amount.'); return; }
                  const newSaved = Math.min(pot.target, savedAmt + amount);
                  const complete = newSaved >= pot.target;
                  const updated  = goals.map(g => g.id === addFundsModal ? { ...g, saved: newSaved } : g);
                  saveGoals(updated);
                  setGoals(updated);
                  setAddFundsModal(null);
                  setAddFundsAmount('');
                  if (complete) {
                    setCelebrateMsg(`🎉 ${pot.name} — target reached! £${pot.target.toLocaleString('en-GB')} saved.`);
                    setCelebrate(true);
                    setTimeout(() => setCelebrate(false), 3500);
                    speak(`Amazing. You've hit your target for ${pot.name}. ${pot.target} pounds saved. That's a real win.`);
                  } else {
                    const newPct  = Math.round((newSaved / pot.target) * 100);
                    const leftAmt = (pot.target - newSaved).toFixed(0);
                    speak(`Done. ${pot.name} is now at ${newPct} percent. £${leftAmt} left to go.`);
                  }
                }}
                style={{ width: '100%', padding: 13, background: 'rgba(124,174,158,0.14)', border: '1px solid rgba(124,174,158,0.26)', borderRadius: 12, color: GREEN, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 8, fontFamily: 'inherit' }}
              >Add funds</button>

              <button
                onClick={() => setAddFundsModal(null)}
                style={{ width: '100%', padding: 10, background: 'none', border: 'none', color: 'rgba(232,221,208,0.26)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              >Cancel</button>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          APP SWITCH BLUR OVERLAY (FEATURE 7)
          Shown when document.hidden = true — hides financial data
          from the iOS/Android app switcher screenshot.
      ══════════════════════════════════════════ */}
      {appBlurred && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 998,
          background: BG,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #d8cebe, #C8B89A 55%, #7a6850)',
            boxShadow: '0 0 28px 10px rgba(200,184,154,0.2)',
            animation: 'orbMoodPulse 3s ease-in-out infinite',
          }} />
          <div style={{ fontSize: 26, fontWeight: 300, letterSpacing: '0.3em', color: 'rgba(232,221,208,0.6)' }}>noa</div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          SHARE NOA MODAL (Task 4)
          Styled share card preview → Web Share API / clipboard fallback.
      ══════════════════════════════════════════ */}
      {showShare && (() => {
        const vScore = calcVelaScore({ income, expenses, debt, streak });
        const mood   = calcMood({ income, expenses, surplus: income - expenses, savingsGoal: goals.length > 0 ? goals[0].target : 0, savingsBalance: savings });
        const moodLabel = MOOD_CFG[mood]?.label || 'STEADY';
        const moodColor = MOOD_CFG[mood]?.labelColor || 'rgba(232,221,208,0.32)';
        const fp = getFinancialPersonality();
        return (
          <div
            onClick={e => { if (e.target === e.currentTarget) setShowShare(false); }}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 210 }}
          >
            {/* Card preview */}
            <div style={{
              background: 'linear-gradient(145deg, #1a1520, #111318)',
              border: '1px solid rgba(200,184,154,0.22)',
              borderRadius: 24, padding: '32px 28px',
              width: '100%', maxWidth: 300,
              textAlign: 'center',
              boxShadow: '0 0 48px 8px rgba(200,184,154,0.07)',
              marginBottom: 24,
            }}>
              {/* Orb */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                background: 'radial-gradient(circle at 35% 35%, #d8cebe, #C8B89A 55%, #7a6a52)',
                boxShadow: '0 0 22px 8px rgba(200,184,154,0.38)',
              }} />
              {/* Noa wordmark */}
              <div style={{ fontSize: 28, fontWeight: 300, color: '#E8DDD0', letterSpacing: '0.3em', marginBottom: 4 }}>noa</div>
              <div style={{ fontSize: 8, color: 'rgba(200,184,154,0.4)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Your Financial Navigator</div>
              {/* Score + mood */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#E8DDD0' }}>{vScore}</div>
                  <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>VELA Score</div>
                </div>
                {fp && (
                  <div style={{ width: 1, background: 'rgba(232,221,208,0.1)', alignSelf: 'stretch' }} />
                )}
                {fp && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: PURPLE }}>{fp}</div>
                    <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Personality</div>
                  </div>
                )}
              </div>
              {/* Mood label */}
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', color: moodColor, textTransform: 'uppercase', marginBottom: 18 }}>{moodLabel}</div>
              {/* Quote */}
              {shareQuoteLoading ? (
                <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.3)', animation: 'blink 1.4s ease-in-out infinite', marginBottom: 16 }}>Writing your quote…</div>
              ) : (
                <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.65)', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16, paddingTop: 14, borderTop: '1px solid rgba(232,221,208,0.07)' }}>
                  "{shareQuote || 'Managing money is mostly about knowing where it went.'}"
                </div>
              )}
              {/* URL badge */}
              <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.18)', letterSpacing: '0.06em' }}>finance-tracker-2026-navy.vercel.app</div>
            </div>

            {/* Action buttons */}
            <button
              onClick={doShare}
              disabled={shareQuoteLoading}
              style={{
                width: '100%', maxWidth: 300,
                padding: '14px 0', background: 'rgba(200,184,154,0.15)',
                border: '1px solid rgba(200,184,154,0.32)', borderRadius: 14,
                color: PURPLE, fontSize: 15, fontWeight: 600,
                cursor: shareQuoteLoading ? 'default' : 'pointer',
                opacity: shareQuoteLoading ? 0.5 : 1,
                marginBottom: 10,
                transition: 'opacity 0.15s',
              }}
            >
              {shareCopied ? '✓ Copied to clipboard' : '↗ Share Noa'}
            </button>

            <button
              onClick={() => setShowShare(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 14, cursor: 'pointer', padding: 8 }}
            >
              Cancel
            </button>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          DUAL-FAIL OVERLAY (Task 4d)
          Shown when both Groq (chat) + ElevenLabs (voice) fail simultaneously.
          Warm Noa message + orb in slow idle pulse.
      ══════════════════════════════════════════ */}
      {dualFail && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 300,
          background: 'rgba(17,19,24,0.94)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 28, padding: '32px 24px',
          animation: 'cardIn 0.35s ease-out',
        }}>
          {/* Orb — idle state = slow breathing pulse */}
          <Orb size={96} state="idle" />

          <div style={{ textAlign: 'center', maxWidth: 280 }}>
            <div style={{
              fontSize: 19, fontWeight: 600, color: '#E8DDD0',
              letterSpacing: '-0.01em', lineHeight: 1.4, marginBottom: 10,
            }}>
              I'm having a moment.
            </div>
            <div style={{
              fontSize: 14, color: 'rgba(232,221,208,0.6)',
              lineHeight: 1.6,
            }}>
              Give me a minute and try again.
            </div>
          </div>

          <button
            onClick={() => {
              groqFailedRef.current  = false;
              elevenFailedRef.current = false;
              setDualFail(false);
            }}
            style={{
              background: 'rgba(200,184,154,0.12)',
              border: '1px solid rgba(200,184,154,0.22)',
              borderRadius: 24, color: '#C8B89A',
              fontSize: 13, fontWeight: 500,
              padding: '10px 28px', cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          VOICE ERROR TOAST
      ══════════════════════════════════════════ */}
      {voiceError && (
        <div style={{
          position: 'absolute', top: 'max(env(safe-area-inset-top), 12px)', left: 16, right: 16,
          zIndex: 200, background: 'rgba(226,75,74,0.92)', borderRadius: 12,
          padding: '10px 14px', animation: 'cardIn 0.25s ease-out',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, lineHeight: '1.4' }}>🔇</span>
          <div style={{ fontSize: 11, color: '#fff', lineHeight: 1.45, wordBreak: 'break-word', flex: 1 }}>
            {voiceError}
          </div>
          <button
            onClick={() => setVoiceError('')}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
          >×</button>
        </div>
      )}

      {/* ══════════════════════════════════════════
          WALKTHROUGH TOOLTIP OVERLAY
      ══════════════════════════════════════════ */}
      {walkthrough && tooltipStep < 3 && (() => {
        const wtName = getUserName() || '';
        const tips = [
          {
            text: debtMode
              ? `Debt Destruction Mode — £${totalDebt.toLocaleString('en-GB')} to clear`
              : surplus >= 0
                ? `Your £${surplus.toFixed(0)}/month surplus — your wealth engine`
                : `£${Math.abs(surplus).toFixed(0)}/month shortfall — first thing we tackle`,
            top: '51%',
          },
          {
            text: `Vela Score ${velaScore} — ${velaScore >= 70 ? 'strong foundation' : velaScore >= 50 ? 'solid progress' : 'room to grow'}`,
            top: '74%',
          },
          {
            text: wtName ? `${wtName}, tap here anytime — I'm always ready` : "Tap here anytime — I'm always ready",
            top: '87%',
          },
        ];
        const tip = tips[tooltipStep];
        return (
          <div
            onClick={() => {
              const next = tooltipStep + 1;
              if (next >= 3) {
                setWalkthrough(false);
                localStorage.setItem('vela_walkthrough_seen', '1');
              }
              setTooltipStep(next);
            }}
            style={{ position: 'absolute', inset: 0, zIndex: 45, pointerEvents: 'all' }}
          >
            <div style={{
              position: 'absolute',
              left: 24, right: 24,
              top: tip.top,
              background: 'rgba(17,19,24,0.92)',
              border: `1px solid rgba(200,184,154,0.32)`,
              borderRadius: 16,
              padding: '14px 18px',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              animation: 'cardIn 0.35s ease-out',
              boxShadow: `0 0 0 1px rgba(200,184,154,0.12), 0 8px 32px rgba(0,0,0,0.5)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ fontSize: 13, color: PURPLE, fontWeight: 600, flex: 1 }}>{tip.text}</div>
                <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.32)', flexShrink: 0 }}>
                  {tooltipStep + 1}/3 · tap to continue
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────

function SmallOrb({ alert, eveningDot, orbState = 'idle', mood = 'steady', moodCfg = null }) {
  const isSpeaking  = orbState === 'speaking';
  const isListening = orbState === 'listening';
  const isThinking  = orbState === 'thinking';

  // Task 3 — Mood affects idle glow and pulse speed; active states override
  const cfg = moodCfg || MOOD_CFG.steady;

  const bg = isListening
    ? `radial-gradient(circle at 35% 35%, #c8e0ff, #5890d8 55%, #103060)`
    : mood === 'thriving'
      ? `radial-gradient(circle at 35% 35%, #e8d8a0, #C9A96E 55%, #7a5a18)`
      : mood === 'alert'
        ? `radial-gradient(circle at 35% 35%, #e8c888, #C9956E 55%, #7a4818)`
        : mood === 'watchful'
          ? `radial-gradient(circle at 35% 35%, #d0d4d8, #9aaabb 55%, #4a5a68)`
          : `radial-gradient(circle at 35% 35%, #d8cebe, ${PURPLE} 55%, #7a6a52)`;

  const glow = isSpeaking
    ? '0 0 32px 12px rgba(240,228,210,0.82), 0 0 64px 26px rgba(240,228,210,0.32)'
    : isListening
      ? '0 0 28px 10px rgba(88,144,216,0.6)'
      : cfg.shadow;

  const anim = isSpeaking
    ? 'orbSpeaking 0.38s ease-in-out infinite'
    : isListening
      ? 'orbListening 0.9s ease-in-out infinite'
      : isThinking
        ? 'orbThinking 2.2s ease-in-out infinite'
        : `orbMoodPulse ${cfg.pulseSpeed} ease-in-out infinite`;

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: bg, boxShadow: glow,
        animation: anim,
        transition: 'background 2s ease, box-shadow 2s ease',
      }} />
      {alert && !eveningDot && (
        <div style={{
          position: 'absolute', top: 1, right: 1,
          width: 12, height: 12, borderRadius: '50%',
          background: RED, border: `2px solid ${BG}`,
          boxShadow: '0 0 6px 2px rgba(226,75,74,0.6)',
          animation: 'alertPulse 1.4s ease-in-out infinite',
        }} />
      )}
      {eveningDot && (
        <div style={{
          position: 'absolute', top: 1, right: 1,
          width: 12, height: 12, borderRadius: '50%',
          background: AMBER, border: `2px solid ${BG}`,
          boxShadow: '0 0 8px 3px rgba(201,169,110,0.65)',
          animation: 'alertPulse 1.8s ease-in-out infinite',
        }} />
      )}
    </div>
  );
}

function MetricPill({ label, value, color, badge, badgeColor, onTap, active }) {
  const isLong = value.length > 5;
  return (
    <div
      onClick={onTap}
      style={{
        flex: '1 1 0%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 6, padding: '14px 6px',
        background: active ? `rgba(${color === '#7CAE9E' ? '124,174,158' : color === '#C9A96E' ? '201,169,110' : color === '#E24B4A' ? '226,75,74' : '200,184,154'},0.10)` : 'rgba(232,221,208,0.04)',
        border: `1px solid ${active ? color + '55' : 'rgba(232,221,208,0.06)'}`,
        borderRadius: 16, position: 'relative', cursor: onTap ? 'pointer' : 'default',
        transition: 'all 0.18s',
      }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: isLong ? 13 : 20, fontWeight: 700, color, lineHeight: 1, textAlign: 'center' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{label}</div>
      {badge && (
        <div style={{ position: 'absolute', top: 6, right: 7, fontSize: 9, fontWeight: 700, color: badgeColor, letterSpacing: '0.2px' }}>
          {badge}
        </div>
      )}
      {onTap && (
        <div style={{ position: 'absolute', bottom: 5, right: 7, fontSize: 8, color: 'rgba(232,221,208,0.22)', lineHeight: 1 }}>tap</div>
      )}
    </div>
  );
}

function MessageBubble({ type, text }) {
  const isNoa = type === 'vela';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isNoa ? 'flex-start' : 'flex-end',
      animation: 'msgIn 0.28s ease-out',
    }}>
      <div style={{
        maxWidth: '82%',
        padding: '10px 14px',
        borderRadius: isNoa ? '3px 16px 16px 16px' : '16px 3px 16px 16px',
        background: isNoa ? 'rgba(232,221,208,0.06)' : 'rgba(200,184,154,0.13)',
        border: `1px solid ${isNoa ? 'rgba(232,221,208,0.09)' : 'rgba(200,184,154,0.22)'}`,
        color: '#E8DDD0',
        fontSize: 15,
        fontWeight: isNoa ? 300 : 400,
        lineHeight: 1.6,
        letterSpacing: '0.01em',
      }}>
        {text}
      </div>
    </div>
  );
}

function WaveBars({ color, small }) {
  const delays = small
    ? [0, 0.12, 0.18, 0.08, 0.15]
    : [0, 0.12, 0.24, 0.1, 0.2, 0.08, 0.18, 0.06, 0.16];
  const h = small ? 16 : 36;
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: h }}>
      {delays.map((d, i) => (
        <div key={i} style={{
          width: 2.5, height: h, background: color, borderRadius: 2,
          transformOrigin: 'center',
          animation: `waveBar 0.55s ease-in-out ${d}s infinite`,
          opacity: 0.85,
        }} />
      ))}
    </div>
  );
}


function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
      background: on ? PURPLE : 'rgba(232,221,208,0.14)',
      position: 'relative', transition: 'background 0.22s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#E8DDD0',
        transition: 'left 0.22s',
      }} />
    </button>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
      {children}
    </div>
  );
}

// ── Bank Connect Modal (Plaid Link) ──────────────────────────────────────────
// Loads the Plaid Link SDK from CDN, fetches a link_token, opens the Plaid
// UI overlay, exchanges the public_token on success, then calls onConnected.

function BankConnectModal({ onClose, onConnected }) {
  const [step, setStep]     = useState('idle'); // idle | loading | error
  const [errMsg, setErrMsg] = useState('');

  async function openPlaidLink() {
    setStep('loading');
    setErrMsg('');
    try {
      // 1. Load Plaid Link script from CDN if not already present
      if (!window.Plaid) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src    = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Failed to load Plaid Link script'));
          document.head.appendChild(s);
        });
      }

      // 2. Get a link_token from our server
      const ltRes = await fetch('/api/banking/link-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { link_token, error: ltErr } = await ltRes.json();
      if (ltErr || !link_token) throw new Error(ltErr || 'No link_token returned');

      // 3. Initialise and open Plaid Link
      setStep('idle'); // reset while Plaid overlay is open
      const plaidHandler = window.Plaid.create({
        token: link_token,

        onSuccess: async (publicToken, metadata) => {
          setStep('loading');
          try {
            const inst = metadata?.institution?.name || 'Your bank';
            const exRes = await fetch('/api/banking/exchange', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ publicToken, institutionName: inst }),
            });
            const d = await exRes.json();
            if (d.error) throw new Error(d.error);

            // Persist Plaid credentials + institution
            saveBankingAccessToken(d.accessToken);
            saveBankingInstitution(inst);
            setBankingLastSync();

            onConnected(inst);
          } catch (e) {
            console.error('[BankConnectModal onSuccess]', e);
            setStep('error');
            setErrMsg('Connected but could not import data. Try syncing again.');
          }
        },

        onExit: (err) => {
          if (err) {
            setStep('error');
            setErrMsg('Connection cancelled or an error occurred. Please try again.');
          } else {
            setStep('idle');
          }
        },
      });

      plaidHandler.open();
    } catch (e) {
      console.error('[BankConnectModal]', e);
      setStep('error');
      setErrMsg('Could not start bank connection. Check your internet and try again.');
    }
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 70 }}
    >
      <div style={{ background: 'rgba(16,14,36,0.97)', border: '1px solid rgba(200,184,154,0.22)', borderRadius: 26, padding: 28, width: '100%', maxWidth: 320, animation: 'cardIn 0.28s ease-out' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#E8DDD0', marginBottom: 6 }}>Connect your bank</div>
        <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.38)', marginBottom: 20, lineHeight: 1.5 }}>
          Read-only access. Noa can never move or touch your money.
        </div>

        {step === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(200,184,154,0.2)', borderTopColor: '#C8B89A', animation: 'noaOrbPulse 0.8s linear infinite', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.6)' }}>Connecting…</div>
          </div>
        )}

        {step === 'error' && (
          <div style={{ fontSize: 12, color: '#E24B4A', marginBottom: 16, lineHeight: 1.5 }}>{errMsg}</div>
        )}

        {step !== 'loading' && (
          <button
            onClick={openPlaidLink}
            style={{ width: '100%', padding: '13px 0', background: 'rgba(124,174,158,0.12)', border: '1px solid rgba(124,174,158,0.3)', borderRadius: 14, color: '#7CAE9E', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10, fontFamily: 'inherit' }}
          >🔗 Connect your bank</button>
        )}

        <button onClick={onClose} style={{ width: '100%', padding: 11, background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function SettingsBtn({ onClick, color, border, textColor = '#E8DDD0', text }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: 13, background: color,
      border: border ? `1px solid ${border}` : 'none',
      borderRadius: 12, color: textColor, fontSize: 15, fontWeight: 600,
      cursor: 'pointer', marginBottom: 10,
    }}>{text}</button>
  );
}
