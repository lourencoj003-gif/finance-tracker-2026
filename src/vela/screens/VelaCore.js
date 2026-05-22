import { useState, useEffect, useRef } from 'react';
import { getData, saveData, getInsights, clearAll, tickStreak, shouldShowCheckin, markCheckin, getGoals, saveGoals, getLastOpen, setLastOpen, getLastCeremonyYM, setLastCeremonyYM, getDebts, saveDebts, getChallenge, saveChallenge, getExpenseLog, saveExpenseLog, getEveningDate, setEveningDate, appendEveningLog, getUserName } from '../storage';
import PaydayCeremony from './PaydayCeremony';
import Orb from '../Orb';
import { speak as voiceSpeak, stopSpeaking } from '../voice';

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
    0%,100% { transform: scale(1);    filter: brightness(1); }
    50%     { transform: scale(1.06); filter: brightness(1.14); }
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
  const [eveningCheckOpen, setEveningCheckOpen] = useState(false);
  const [eveningAnswered, setEveningAnswered]   = useState(() => getEveningDate() === new Date().toISOString().slice(0, 10));
  const [eveningPhase, setEveningPhase]         = useState('ask');
  const [eveningNote, setEveningNote]           = useState('');
  const [tapHintVisible, setTapHintVisible]   = useState(() => !localStorage.getItem('vela_tap_hint_seen'));
  const [walkthrough, setWalkthrough]         = useState(() => !localStorage.getItem('vela_walkthrough_seen'));
  const [tooltipStep, setTooltipStep]         = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
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

  const orbRef           = useRef('idle');
  const voiceOnRef       = useRef(true);
  const recognitionRef   = useRef(null);
  const greetedRef       = useRef(false);
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

  // Auto-scroll chat to bottom whenever a new message is added
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [cards]);

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
    const update = () => { window.scrollTo(0, 0); setVpH(Math.round(vv.height)); };
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
      const weeklySpend = (expenses / 4.33).toFixed(0);
      const onTrackLine = surplus >= 0
        ? `You're keeping £${surplus.toFixed(0)}/month — solid position.`
        : `You're running a £${Math.abs(surplus).toFixed(0)}/month deficit — let's fix that this week.`;
      msg = `Monday check-in${hi}. You're on pace to spend £${expenses.toFixed(0)} this month — roughly £${weeklySpend} last week. ${onTrackLine} What's the focus this week?`;
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

  // ── Audio unlock (iOS requires speech from a user gesture) ───────
  function unlockAudio() {
    if (audioUnlockedRef.current) return;
    audioUnlockedRef.current = true;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis?.speak(u);
  }

  // ── Speech synthesis ─────────────────────────────────────────────
  function speak(text) {
    if (!voiceOnRef.current) return;
    voiceSpeak(text, {
      onStart: () => setOrbState('speaking'),
      onEnd:   () => setOrbState('idle'),
      onError: () => setOrbState('idle'),
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
    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: buildPrompt(), messages: history }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      history.push({ role: 'assistant', content: json.text });
      saveHistory(history);
      setOrbState('idle');
      pushCard('vela', json.text);
      speak(json.text);
    } catch {
      saveHistory(history);
      setOrbState('idle');
      const err = "I'm having trouble reaching my systems right now. Please try again.";
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
    const ord     = n => n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`;

    // ── Temporal context ──────────────────────────────────────────────
    const now         = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth  = now.getDate();
    const daysLeft    = Math.max(1, daysInMonth - dayOfMonth + 1);
    const inMyPocket  = surplus > 0 ? Math.floor(surplus / daysLeft) : 0;

    // Days to next payday
    let nextPay = new Date(now.getFullYear(), now.getMonth(), payday);
    if (nextPay <= now) {
      const nm  = now.getMonth() + 1;
      const ny  = nm > 11 ? now.getFullYear() + 1 : now.getFullYear();
      const nm2 = nm > 11 ? 0 : nm;
      nextPay   = new Date(ny, nm2, Math.min(payday, new Date(ny, nm2 + 1, 0).getDate()));
    }
    const daysToPayday = Math.ceil((nextPay - now) / 86400000);
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

    // ── Savings rate vs UK average (no demographic label) ───────────
    const srLabel = savingsRate >= 25 ? 'strong — well above the UK average of ~8%'
      : savingsRate >= 15 ? 'above the UK average of ~8%'
      : savingsRate >= 8  ? 'around the UK average of ~8%'
      : savingsRate >= 0  ? 'below the UK average of ~8% — room to improve'
      : 'negative — expenses exceed income';

    return `You are Noa — a sharp, warm personal finance coach. Speak like a trusted friend with CFO-level knowledge. Be proactive, specific, never vague.
${name ? `You are speaking with ${name}. Use their name occasionally — never robotically.` : ''}

ABSOLUTE RULES:
• Only state facts the user has explicitly told you. Never invent demographics, age, or lifestyle details.
• Never say "top X% of your age group" — you do not know their age. Say "well above the UK average" instead.
• Every response must use at least one specific £ figure from the user's actual data.
• Maximum 2–3 sentences. Direct and actionable. No padding, no hedging.
• You have perfect memory of everything the user told you. Never ask for information already provided.
• You are Noa — never say "As an AI" or "As a language model".

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

══ PAYDAY ROUTINE — use when user mentions payday ══
When income lands on the ${ord(payday)}, allocate in order:
  1. ESSENTIALS    (50%) £${alloc.essentials.toLocaleString('en-GB')}/month — rent, food, transport, utilities
  2. SAVINGS FIRST (20%) £${alloc.savings.toLocaleString('en-GB')}/month — emergency fund / ISA / pension
  3. LIFESTYLE     (25%) £${alloc.lifestyle.toLocaleString('en-GB')}/month — dining, entertainment, hobbies
  4. BUFFER         (5%) £${alloc.buffer.toLocaleString('en-GB')}/month — unexpected costs
Always quote exact £ amounts, not just percentages.

══ BABY STEPS UK FRAMEWORK ══
Step 1: £1,000 emergency fund first
Step 2: Clear non-mortgage debt (smallest balance first — snowball method)
Step 3: 3–6 months expenses as emergency fund (£${Math.round(expenses * 3).toLocaleString('en-GB')}–£${Math.round(expenses * 6).toLocaleString('en-GB')})
Step 4: Invest 15% of income (£${Math.round(income * 0.15).toLocaleString('en-GB')}/month) — pension + ISA
Step 5: Specific goal-based saving
→ This user is on STEP ${babyStep}

══ UK BENCHMARKS (context only — do not apply demographic labels without knowing the user's age) ══
• UK average savings rate: ~8% of take-home pay
• UK average consumer debt: ~£6,500
• ISA: £20,000/year tax-free allowance — all growth sheltered from Capital Gains Tax
• Pension: 20% tax relief added automatically (40% for higher-rate taxpayers)

══ COACHING RULES ══
1. Use only the user's actual £ figures. Never invent hypothetical numbers.
2. When user asks what they can afford, use IN MY POCKET: £${inMyPocket}/day.
3. Reference Baby Step ${babyStep} when giving savings, debt, or investment advice.
4. If payday ≤ 3 days away, lead with the Payday Routine allocation.
5. End financial advice with: ⚖️ Guidance only — not FCA-regulated advice.`;
  }

  function saveSettings() {
    localStorage.setItem('vela_name', settingName);
    const pd  = Math.min(31, Math.max(1, parseInt(settingPayday, 10) || 25));
    const sav = Math.max(0, parseFloat(settingSavings) || 0);
    saveData({ ...getData(), payday: pd, savings: sav });
    setShowSettings(false);
    setShowResetConfirm(false);
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

  // Days to next payday
  let nextPayD = new Date(nowD.getFullYear(), nowD.getMonth(), payday);
  if (nextPayD <= nowD) {
    const nm  = nowD.getMonth() + 1;
    const ny  = nm > 11 ? nowD.getFullYear() + 1 : nowD.getFullYear();
    const nm2 = nm > 11 ? 0 : nm;
    nextPayD  = new Date(ny, nm2, Math.min(payday, new Date(ny, nm2 + 1, 0).getDate()));
  }
  const daysToNextPay = Math.ceil((nextPayD - nowD) / 86400000);

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
        onTouchStart={onTouchStart}
        onTouchEnd={e => onSwipeEnd(e, false)}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          paddingTop: 'max(env(safe-area-inset-top), 24px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
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

        {/* Top section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ fontSize: 15, color: 'rgba(232,221,208,0.36)', letterSpacing: '0.2px' }}>{getGreeting()}</div>
          <div
            onClick={() => { if (showEveningDot) { setEveningPhase('ask'); setEveningNote(''); setEveningCheckOpen(true); } }}
            style={{ cursor: showEveningDot ? 'pointer' : 'default' }}
          >
            <SmallOrb alert={spendAlert} eveningDot={showEveningDot} orbState={chatOpen ? orbState : 'idle'} />
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
            width: '100%', overflowX: 'auto', display: 'flex', gap: 8,
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
        </div>

        {/* 3 metric pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <MetricPill
            label="Vela Score"
            value={`${velaScore}`}
            color={velaScoreColor}
            badge={scoreDelta !== 0 ? `${scoreDelta > 0 ? '↑' : '↓'}${Math.abs(scoreDelta)}` : null}
            badgeColor={scoreDelta >= 0 ? GREEN : RED}
          />
          <MetricPill label="Savings" value={`${savingsRate}%`} color={savColor} />
          <MetricPill label="Pace" value={onTrack ? 'On Track' : 'Off Track'} color={onTrack ? GREEN : RED} />
        </div>

        {/* Allocation breakdown */}
        {income > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Essentials', amount: Math.round(income * 0.50), color: PURPLE },
              { label: 'Lifestyle',  amount: Math.round(income * 0.25), color: BLUE   },
              { label: 'Savings',    amount: Math.round(income * 0.20), color: GREEN  },
            ].map(({ label, amount, color }) => (
              <div key={label} style={{
                flex: 1, background: 'rgba(232,221,208,0.04)',
                border: '1px solid rgba(232,221,208,0.07)',
                borderRadius: 12, padding: '8px 6px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              }}>
                <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.36)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '-0.3px' }}>£{amount.toLocaleString('en-GB')}</div>
              </div>
            ))}
          </div>
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

        {/* Talk to Noa button */}
        <button
          onClick={() => { unlockAudio(); setChatOpen(true); }}
          style={{
            width: '100%', height: 58,
            background: 'rgba(232,221,208,0.07)',
            border: '1px solid rgba(232,221,208,0.28)',
            borderRadius: 18,
            color: '#E8DDD0', fontSize: 17, fontWeight: 500, cursor: 'pointer',
            letterSpacing: '0.08em',
          }}
        >Talk to Noa</button>

        {/* Noa insight or daily tip */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10,
          background: 'rgba(232,221,208,0.03)', border: '1px solid rgba(232,221,208,0.05)',
          borderRadius: 12, padding: '9px 12px',
        }}>
          <span style={{ fontSize: 13, flexShrink: 0, lineHeight: '1.5' }}>{insights.length > 0 ? '✦' : '💡'}</span>
          <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.34)', lineHeight: 1.5 }}>
            {insights.length > 0 ? insights[0] : getDailyTip()}
          </div>
        </div>

        {/* Swipe-up hint */}
        <div style={{ textAlign: 'center', marginTop: 8, animation: 'swipeHint 2.6s ease-in-out infinite' }}>
          <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.22)', letterSpacing: '0.5px' }}>↑  details</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DETAIL VIEW — slides up, swipe down to dismiss
      ══════════════════════════════════════════ */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={e => onSwipeEnd(e, true)}
        style={{
          position: 'absolute', inset: 0, zIndex: 10, background: BG,
          transform: detailOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: SLIDE,
        }}
      >
        <DetailView
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
      </div>

      {/* ══════════════════════════════════════════
          CHAT OVERLAY — full conversational UI
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20, background: BG,
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

        {/* ── Input bar ── */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 8,
          paddingTop: 10,
          paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
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
          PAYDAY CEREMONY
      ══════════════════════════════════════════ */}
      {showCeremony && (
        <PaydayCeremony
          income={income}
          onComplete={() => { setLastCeremonyYM(); setShowCeremony(false); }}
        />
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
              <div>
                <div style={{ fontSize: 14, color: '#E8DDD0', marginBottom: 2 }}>Voice responses</div>
                <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.38)' }}>Noa speaks aloud</div>
              </div>
              <Toggle on={voiceOn} onToggle={() => setVoiceOn(v => !v)} />
            </div>
            <SettingsBtn onClick={saveSettings} color={PURPLE} text="Save" />
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

// ── Detail View ─────────────────────────────────────────────────────

function DetailView({ income, expenses, debt, goal, insights, surplus, goals, savings, debts, onClose }) {
  const annualSurplus = surplus * 12;
  const totalDebt     = debts && debts.length > 0 ? debts.reduce((s, d) => s + d.amount, 0) : debt;

  // Estimated spending breakdown (typical UK splits)
  const categories = expenses > 0 ? [
    { name: 'Housing & Bills', amount: Math.round(expenses * 0.35), color: PURPLE },
    { name: 'Food & Groceries', amount: Math.round(expenses * 0.22), color: GREEN },
    { name: 'Transport',        amount: Math.round(expenses * 0.14), color: BLUE },
  ] : [];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      paddingTop: 'max(env(safe-area-inset-top), 16px)',
      paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      boxSizing: 'border-box', overflow: 'hidden',
    }}>

      {/* Fixed header: drag handle + close */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingLeft: 24, paddingRight: 16, paddingTop: 8, marginBottom: 18, position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(232,221,208,0.18)' }} />
        <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 0, background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 24, cursor: 'pointer', padding: 6, lineHeight: 1 }}>×</button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8 }}>

        {/* Large income / expenses numbers */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: 'rgba(124,174,158,0.07)', border: '1px solid rgba(124,174,158,0.16)', borderRadius: 16, padding: '14px 14px' }}>
            <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>Income</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: GREEN, letterSpacing: '-0.5px' }}>£{income.toLocaleString('en-GB')}</div>
            <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.26)', marginTop: 3 }}>per month</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.16)', borderRadius: 16, padding: '14px 14px' }}>
            <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>Expenses</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: AMBER, letterSpacing: '-0.5px' }}>£{expenses.toLocaleString('en-GB')}</div>
            <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.26)', marginTop: 3 }}>per month</div>
          </div>
        </div>

        {/* Estimated spending breakdown */}
        {categories.length > 0 && (
          <>
            <DetailLabel>Estimated Breakdown</DetailLabel>
            {categories.map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid rgba(232,221,208,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.68)' }}>{c.name}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E8DDD0' }}>~£{c.amount.toLocaleString('en-GB')}</div>
              </div>
            ))}
            <HSep />
          </>
        )}

        {/* Monthly position */}
        <DetailLabel>Monthly Position</DetailLabel>
        <NumberRow
          label="Surplus"
          value={surplus >= 0 ? `+£${surplus.toLocaleString('en-GB')}` : `−£${Math.abs(surplus).toLocaleString('en-GB')}`}
          color={surplus >= 0 ? GREEN : RED}
        />
        <NumberRow
          label="Annual trajectory"
          value={annualSurplus >= 0 ? `+£${Math.abs(annualSurplus).toLocaleString('en-GB')}` : `−£${Math.abs(annualSurplus).toLocaleString('en-GB')}`}
          color={annualSurplus >= 0 ? GREEN : RED}
        />
        {totalDebt > 0 && <NumberRow label="Total debt" value={`£${totalDebt.toLocaleString('en-GB')}`} color={AMBER} />}
        {debts && debts.length > 0 && debts.map(d => (
          <NumberRow
            key={d.id}
            label={`${d.name}${d.rate > 0 ? ` (${d.rate}%)` : ''}`}
            value={`£${d.amount.toLocaleString('en-GB')}`}
            color={d.rate >= 20 ? RED : AMBER}
          />
        ))}

        {/* Structured savings goals */}
        {goals.length > 0 && (
          <>
            <HSep />
            <DetailLabel>Savings Goals</DetailLabel>
            {goals.map(g => {
              const saved        = g.saved || 0;
              const pct          = g.target > 0 ? Math.min(100, Math.round((saved / g.target) * 100)) : 0;
              const monthsNeeded = surplus > 0 ? Math.ceil((g.target - saved) / surplus) : null;
              return (
                <div key={g.id} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <div style={{ fontSize: 13, color: '#E8DDD0', fontWeight: 500 }}>{g.name}</div>
                    <div style={{ fontSize: 13, color: PURPLE, fontWeight: 700 }}>£{g.target.toLocaleString('en-GB')}</div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(232,221,208,0.08)', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: PURPLE, borderRadius: 2, transition: 'width 0.7s ease', minWidth: pct > 0 ? 4 : 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.34)' }}>
                    {monthsNeeded
                      ? `~${monthsNeeded} month${monthsNeeded !== 1 ? 's' : ''} at £${surplus.toFixed(0)}/month surplus`
                      : surplus <= 0 ? 'Resolve deficit to start saving' : 'Tracking not yet started'}
                    {g.targetDate ? ` · target: ${g.targetDate}` : ''}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Legacy goal string (shown only when no structured goals) */}
        {goal && goals.length === 0 && (() => {
          let months = null;
          if (surplus > 0) {
            const m = goal.match(/[\d,]+/);
            if (m) { const a = parseInt(m[0].replace(/,/g, ''), 10); if (a > 0) months = Math.ceil(a / surplus); }
          }
          return (
            <>
              <HSep />
              <DetailLabel>Goal</DetailLabel>
              <div style={{ fontSize: 14, color: '#E8DDD0', lineHeight: 1.45, marginBottom: 5 }}>{goal}</div>
              <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.42)' }}>
                {months ? `~${months} month${months !== 1 ? 's' : ''} at current rate` : surplus <= 0 ? 'Resolve shortfall first' : 'Add a £ amount to see timeline'}
              </div>
            </>
          );
        })()}

        {/* Noa's Insights */}
        {insights.length > 0 && (
          <>
            <HSep />
            <DetailLabel>Noa's Insights</DetailLabel>
            {insights.slice(0, 3).map((ins, i) => (
              <div key={i} style={{ fontSize: 12, color: 'rgba(232,221,208,0.52)', lineHeight: 1.55, marginBottom: 10, paddingLeft: 10, borderLeft: '2px solid rgba(200,184,154,0.35)' }}>
                {ins}
              </div>
            ))}
          </>
        )}

        {/* Wealth Timeline */}
        {income > 0 && (
          <>
            <HSep />
            <WealthTimeline income={income} surplus={surplus} savings={savings || 0} totalDebt={totalDebt} />
          </>
        )}
      </div>
    </div>
  );
}


function WealthTimeline({ income, surplus, savings, totalDebt }) {
  const netWorth = savings - totalDebt;
  const annual   = surplus * 12;

  function project(pv, pmt, years) {
    if (years === 0) return pv;
    const r = 0.07;
    return pv * Math.pow(1 + r, years) + (pmt * (Math.pow(1 + r, years) - 1)) / r;
  }

  const milestones = [
    { label: 'Now',      years: 0,  value: netWorth },
    { label: '1 Year',   years: 1,  value: project(netWorth, annual, 1) },
    { label: '5 Years',  years: 5,  value: project(netWorth, annual, 5) },
    { label: '10 Years', years: 10, value: project(netWorth, annual, 10) },
  ];

  const fmt = (n) => {
    const abs = Math.abs(Math.round(n));
    if (abs >= 1000000) return `${n < 0 ? '−' : ''}£${(abs / 1000000).toFixed(1)}m`;
    if (abs >= 1000)    return `${n < 0 ? '−' : ''}£${(abs / 1000).toFixed(0)}k`;
    return `${n < 0 ? '−' : ''}£${abs.toLocaleString('en-GB')}`;
  };

  return (
    <>
      <DetailLabel>Wealth Timeline</DetailLabel>
      <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.26)', marginBottom: 16, marginTop: -8 }}>
        Based on current rate + 7% growth
      </div>
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical connecting line */}
        <div style={{
          position: 'absolute', left: 9, top: 10, bottom: 10,
          width: 2, background: 'linear-gradient(to bottom, rgba(124,174,158,0.5), rgba(124,174,158,0.1))',
          borderRadius: 1,
        }} />
        {milestones.map((m, i) => {
          const isPositive = m.value >= 0;
          const color      = i === 0 ? 'rgba(232,221,208,0.55)' : isPositive ? GREEN : RED;
          return (
            <div key={m.label} style={{ display: 'flex', alignItems: 'center', marginBottom: i < milestones.length - 1 ? 22 : 0 }}>
              <div style={{
                position: 'absolute', left: 5,
                width: 10, height: 10, borderRadius: '50%',
                background: color,
                boxShadow: i > 0 && isPositive ? `0 0 8px 2px rgba(124,174,158,0.4)` : 'none',
                border: `2px solid ${BG}`,
                flexShrink: 0,
              }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.45)' }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{fmt(m.value)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function NumberRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 11, paddingBottom: 11,
      borderBottom: '1px solid rgba(232,221,208,0.05)',
    }}>
      <div style={{ fontSize: 14, color: 'rgba(232,221,208,0.5)' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function HSep() {
  return <div style={{ height: 1, background: 'rgba(232,221,208,0.06)', margin: '18px 0 14px' }} />;
}

function DetailLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.32)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────

function SmallOrb({ alert, eveningDot, orbState = 'idle' }) {
  const isSpeaking  = orbState === 'speaking';
  const isListening = orbState === 'listening';
  const isThinking  = orbState === 'thinking';

  const bg = isListening
    ? `radial-gradient(circle at 35% 35%, #c8e0ff, #5890d8 55%, #103060)`
    : `radial-gradient(circle at 35% 35%, #d8cebe, ${PURPLE} 55%, #7a6a52)`;

  const glow = isSpeaking
    ? '0 0 32px 12px rgba(240,228,210,0.82), 0 0 64px 26px rgba(240,228,210,0.32)'
    : isListening
      ? '0 0 28px 10px rgba(88,144,216,0.6)'
      : '0 0 18px 6px rgba(200,184,154,0.32)';

  const anim = isSpeaking
    ? 'orbSpeaking 0.38s ease-in-out infinite'
    : isListening
      ? 'orbListening 0.9s ease-in-out infinite'
      : isThinking
        ? 'orbThinking 2.2s ease-in-out infinite'
        : 'orbIdle 3.8s ease-in-out infinite';

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: bg, boxShadow: glow,
        animation: anim,
        transition: 'background 0.6s ease, box-shadow 0.5s ease',
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

function MetricPill({ label, value, color, badge, badgeColor }) {
  const isLong = value.length > 5;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '14px 6px',
      background: 'rgba(232,221,208,0.04)',
      border: '1px solid rgba(232,221,208,0.06)',
      borderRadius: 16, position: 'relative',
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: isLong ? 13 : 20, fontWeight: 700, color, lineHeight: 1, textAlign: 'center' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{label}</div>
      {badge && (
        <div style={{ position: 'absolute', top: 6, right: 7, fontSize: 9, fontWeight: 700, color: badgeColor, letterSpacing: '0.2px' }}>
          {badge}
        </div>
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
