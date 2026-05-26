import { useState, useEffect, useRef } from 'react';
import { parseAmount, parseDebt } from '../scoring';
import { saveData, saveInsights, markReady, markOnboardingDone, setUserName, saveAccounts, saveExpenseLog, saveBankingAccessToken, saveBankingInstitution, setBankingLastSync } from '../storage';
import { speak as voiceSpeak, stopSpeaking } from '../voice';
import Orb from '../Orb';

const PURPLE = '#C8B89A';
const GREEN  = '#7CAE9E';
const AMBER  = '#C9A96E';
const BG     = '#111318';

const KEYFRAMES = `
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
  @keyframes sentenceIn {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes orbExpand {
    0%   { transform: scale(1);   opacity: 1; }
    60%  { transform: scale(8);   opacity: 0.6; }
    100% { transform: scale(20);  opacity: 0; }
  }
  @keyframes expandFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  input::placeholder, textarea::placeholder { color: #A89880; opacity: 1; }
`;

const Q = [
  {
    id: 'name',
    ask: () => "Hey, I'm Noa. Before we get started, what's your first name?",
    ph:  'e.g. Alex',
  },
  {
    id: 'income',
    type: 'income',
    ask: ({ name }) => `Nice to meet you, ${name}. Where does your monthly income come from — and how much do you take home after tax?`,
    ph:  '',
  },
  {
    id: 'payday',
    ask: () => "What day of the month does your main salary land?",
    ph:  'e.g. 25th, or "last day of month"',
  },
  {
    id: 'expenses',
    ask: () => "Do you have any fixed monthly costs — things like rent, subscriptions, bills? Tell me what they are and roughly how much each costs.",
    ph:  'e.g. £900 rent, £60 Netflix, £40 gym',
  },
  {
    id: 'accounts',
    type: 'accounts',
    ask: () => "Which bank accounts do you use? Add up to 4 — I'll use them in your payday plan.",
    ph:  '',
  },
  {
    id: 'lifestyle',
    ask: ({ name }) => `Outside of fixed costs, where does most of your money tend to go each month${name ? `, ${name}` : ''}?`,
    ph:  'e.g. Eating out, clothes, weekends away',
  },
  {
    id: 'debt',
    ask: () => "Do you have any debts right now — credit cards, loans, overdrafts, buy now pay later? If yes, what's the total and do you know the interest rate?",
    ph:  'e.g. £3,000 credit card at 24% or "none"',
  },
  {
    id: 'goal',
    ask: ({ name }) => `What's your biggest financial goal right now${name ? `, ${name}` : ''}?`,
    ph:  'e.g. Save a £5,000 emergency fund',
  },
  {
    id: 'savings',
    ask: () => "Do you have any savings currently — and if so, roughly how much?",
    ph:  'e.g. £2,000 or "none"',
  },
];

function parsePayday(val) {
  if (/last|end.?of.?month|eom/i.test(val)) return 28;
  // Use non-word-boundary match so ordinals like "7th", "25th", "1st" are captured
  const m = val.match(/(\d{1,2})(?:st|nd|rd|th)?(?:\s|$|,)/i) || val.match(/(\d{1,2})/);
  return m ? Math.min(31, Math.max(1, parseInt(m[1], 10))) : 25;
}

function parseSavings(val) {
  if (/\b(none|nothing|no|nope|zero|nil|n\/a)\b/i.test(val)) return 0;
  return parseAmount(val);
}

function fallbackInsights({ income, expenses, debt }) {
  const surplus = income - expenses;
  const ins = [];
  if (surplus > 0) {
    ins.push(`Move your £${surplus.toFixed(0)} monthly surplus to a separate savings account the day you get paid — before you can spend it.`);
  } else {
    ins.push(`Cut your biggest non-essential expense to recover the £${Math.abs(surplus).toFixed(0)}/month deficit before anything else.`);
  }
  if (debt > 0) {
    ins.push(`Overpay your debt by at least £50/month above the minimum — on £${debt.toFixed(0)} total that makes a meaningful difference.`);
  } else {
    ins.push(`No debt is a great position — open a Stocks & Shares ISA and commit even £50/month to start building long-term wealth.`);
  }
  ins.push('Review your spending for 5 minutes every Sunday — that single habit beats any budgeting app for building awareness.');
  return ins;
}

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]*/g) || [text]).map(s => s.trim()).filter(Boolean);
}

// Format ordinal for payday display
function ordinalDay(n) {
  if (n === 1 || n === 21 || n === 31) return `${n}st`;
  if (n === 2 || n === 22) return `${n}nd`;
  if (n === 3 || n === 23) return `${n}rd`;
  return `${n}th`;
}

export default function Onboarding({ onDone }) {
  const [step, setStep]         = useState(0);
  const [input, setInput]       = useState('');
  const [inputError, setInputError] = useState('');
  const [history, setHistory]   = useState([]); // stack of { step, data, input } for back navigation
  const [data, setData]         = useState({ name: '', income: 0, incomeSources: [], payday: 25, expenses: 0, expenseDetails: '', lifestyleSpend: '', debt: 0, goal: '', savings: 0 });
  const [accountDraft, setAccountDraft] = useState([]);  // accounts being built on step 4
  const [incomeDraft, setIncomeDraft]   = useState([]);  // income sources being built on step 1
  const [building, setBuilding] = useState(false);
  const [orbState, setOrbState] = useState('idle');
  const [currentQ, setCurrentQ] = useState('');
  const [cardKey, setCardKey]   = useState(0);
  const [expanding, setExpanding] = useState(false);
  const [finaleMsg, setFinaleMsg] = useState('');    // Feature 4 — personalised 3-sentence portrait
  const [showFinale, setShowFinale] = useState(false);
  const [savedData, setSavedData] = useState(null);  // Task 3 — stored for confirmation screen
  const [savedAccounts, setSavedAccounts] = useState([]);
  const finaleSpokenRef = useRef(false);
  const [vpH, setVpH]           = useState(
    window.visualViewport ? Math.round(window.visualViewport.height) : null
  );

  const buildingRef = useRef(false);
  const hasInit     = useRef(false);

  useEffect(() => { buildingRef.current = building; }, [building]);

  useEffect(() => {
    if (!document.getElementById('vela-kf')) {
      const el = document.createElement('style');
      el.id = 'vela-kf';
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
    }
    return () => { stopSpeaking(); };
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => { window.scrollTo(0, 0); setVpH(Math.round(vv.height)); };
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => { vv.removeEventListener('resize', update); vv.removeEventListener('scroll', update); };
  }, []);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    const q   = Q[0].ask({});
    const tid = setTimeout(() => { setCurrentQ(q); speak(q); }, 700);
    return () => clearTimeout(tid);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function speak(text) {
    voiceSpeak(text, {
      onStart: () => setOrbState('speaking'),
      onEnd:   () => setOrbState(buildingRef.current ? 'thinking' : 'idle'),
    });
  }

  // Feature 4 — speak the finale portrait, then show confirmation screen
  useEffect(() => {
    if (!showFinale || !finaleMsg || finaleSpokenRef.current) return;
    finaleSpokenRef.current = true;
    setOrbState('speaking');
    voiceSpeak(finaleMsg, {
      onStart: () => setOrbState('speaking'),
      onEnd:   () => setOrbState('idle'),
      onError: () => setOrbState('idle'),
    });
  }, [showFinale]); // eslint-disable-line react-hooks/exhaustive-deps

  function goBack() {
    if (step === 0 || history.length === 0) return;
    stopSpeaking();
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setStep(prev.step);
    setData(prev.data);
    setInput(prev.prevInput || '');
    setInputError('');
    const q = Q[prev.step].ask(prev.data);
    setCurrentQ(q);
    setCardKey(k => k + 1);
  }

  // Advance from the accounts step (step 4) — saves accounts and moves forward
  function advanceFromAccounts(accs) {
    setSavedAccounts(accs);
    setHistory(h => [...h, { step, data: { ...data }, prevInput: '' }]);
    const next = step + 1;
    setStep(next);
    setOrbState('thinking');
    setTimeout(() => {
      const q = Q[next].ask(data);
      setCurrentQ(q);
      setCardKey(k => k + 1);
      speak(q);
    }, 650);
  }

  // Advance from the income step (step 1) — saves income sources and moves forward
  function advanceFromIncome(sources) {
    const total = sources.reduce((s, src) => s + src.amount, 0);
    const nd = { ...data, income: total, incomeSources: sources };
    setData(nd);
    setHistory(h => [...h, { step, data: { ...data }, prevInput: '' }]);
    const next = step + 1;
    setStep(next);
    setOrbState('thinking');
    setTimeout(() => {
      const q = Q[next].ask(nd);
      setCurrentQ(q);
      setCardKey(k => k + 1);
      speak(q);
    }, 650);
  }

  function send() {
    const val = input.trim();
    setInputError('');
    if (!val) {
      setInputError('Please enter a response to continue');
      return;
    }
    if (building || step >= Q.length) return;
    // Save state to history before advancing
    setHistory(h => [...h, { step, data: { ...data }, prevInput: input }]);
    setInput('');

    const nd = { ...data };
    if      (step === 0) { nd.name = val; setUserName(val); }
    // step 1 = income — handled via advanceFromIncome, not send()
    else if (step === 2) { nd.payday = parsePayday(val); }
    else if (step === 3) {
      // Sum ALL expense amounts listed (e.g. "£900 rent, £60 Netflix, £40 gym" → 1000)
      const _c = val.replace(/[£$€,]/g, '');
      const _ns = (_c.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(n => n > 0);
      nd.expenses = _ns.length > 0 ? _ns.reduce((a, b) => a + b, 0) : parseAmount(val);
      nd.expenseDetails = val;
    }
    // step 4 = accounts — handled via skipAccounts / advanceFromAccounts, not send()
    else if (step === 5) { nd.lifestyleSpend = val; }
    else if (step === 6) { nd.debt = parseDebt(val); }
    else if (step === 7) { nd.goal = val; }
    else if (step === 8) { nd.savings = parseSavings(val); }
    setData(nd);

    const next = step + 1;
    setStep(next);
    setOrbState('thinking');

    if (next < Q.length) {
      setTimeout(() => {
        const q = Q[next].ask(nd);
        setCurrentQ(q);
        setCardKey(k => k + 1);
        speak(q);
      }, 650);
    } else {
      const name = nd.name || '';
      const finalMsg = `Perfect${name ? ` ${name}` : ''}. I have everything I need. Give me a moment to build your financial picture.`;
      setTimeout(() => {
        setCurrentQ(finalMsg);
        setCardKey(k => k + 1);
        setBuilding(true);
        buildingRef.current = true;
        speak(finalMsg);
        buildPlan(nd);
      }, 650);
    }
  }

  async function buildPlan(d) {
    const { income, expenses, debt, goal } = d;
    const surplus  = income - expenses;
    const name     = d.name || '';
    const started  = Date.now();

    // ── Step 1: Groq insights (JSON array) ──────────────────────────
    const sysPrompt = `You are Noa, a personal finance coach. Respond with exactly 3 short financial insights as a JSON array. Each must be under 28 words, start with an action verb, and reference a specific £ amount. Format: ["insight1","insight2","insight3"] — nothing else.`;
    const userMsg   = `Monthly income: £${income}. Monthly expenses: £${expenses}. Surplus: £${surplus.toFixed(0)}. Total debt: £${debt}. Goal: ${goal}. Savings: £${d.savings || 0}.`;

    let insights;
    try {
      const res  = await Promise.race([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ financialContext: sysPrompt, messages: [{ role: 'user', content: userMsg }] }),
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000)),
      ]);
      const json = await res.json();
      const m    = (json.text || '').match(/\[[\s\S]*?\]/);
      if (m) insights = JSON.parse(m[0]);
    } catch {}

    if (!Array.isArray(insights) || insights.length < 1) {
      insights = fallbackInsights(d);
    }

    saveData(d);
    saveInsights(insights.slice(0, 3));
    saveAccounts(savedAccounts);
    markReady();
    markOnboardingDone();

    // ── Step 2: Feature 4 — personalised 3-sentence financial portrait ──
    const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : 0;
    const finalePrompt = `You are Noa — a sharp, warm personal financial navigator. Write EXACTLY 3 sentences as a spoken financial portrait for this specific user. Structure: (1) an observation about what you see in their numbers right now — be specific with £ amounts; (2) an honest but warm assessment of their position — acknowledge what's good AND what's challenging; (3) a forward-looking promise of what's possible in the next 90 days if they focus. Use first person ("Here's what I see..."). Address them by name if provided. Under 70 words total. Dry, confident, warm. No FCA disclaimer needed here.`;
    const finaleUser = `Name: ${name || 'not given'}. Income: £${income}/month. Expenses: £${expenses}/month. Surplus: £${surplus.toFixed(0)}/month (${savingsRate}% savings rate). Debt: £${debt}. Goal: ${goal || 'not set'}. Savings: £${d.savings || 0}.`;

    let portrait = '';
    try {
      const res2 = await Promise.race([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ financialContext: finalePrompt, messages: [{ role: 'user', content: finaleUser }] }),
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000)),
      ]);
      const json2 = await res2.json();
      portrait = (json2.text || '').trim();
    } catch {}

    // Fallback portrait if Groq fails
    if (!portrait) {
      if (surplus > 0 && debt === 0) {
        portrait = `Here's what I see${name ? `, ${name}` : ''}. £${income.toLocaleString('en-GB')} coming in, £${expenses.toLocaleString('en-GB')} going out — £${surplus.toFixed(0)} a month to work with. That's a solid position. In 90 days, with the right structure, you could have a proper emergency fund and a savings habit that actually sticks.`;
      } else if (surplus > 0 && debt > 0) {
        portrait = `Here's what I see${name ? `, ${name}` : ''}. £${surplus.toFixed(0)} monthly surplus alongside £${debt.toLocaleString('en-GB')} in debt — the surplus is the weapon. The debt is the first target. In 90 days of focused overpayment, you'll see that number drop meaningfully. Let's get to work.`;
      } else {
        portrait = `Here's what I see${name ? `, ${name}` : ''}. Your expenses are currently outpacing your income by £${Math.abs(surplus).toFixed(0)} a month. That's the first thing we fix — and it's fixable. In 90 days, with small targeted cuts, we can close that gap and start building something real.`;
      }
    }

    setFinaleMsg(portrait);
    setSavedData(d);

    const elapsed = Date.now() - started;
    await new Promise(r => setTimeout(r, Math.max(0, 1200 - elapsed)));

    // Show the finale screen (portrait + summary)
    setShowFinale(true);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // Task 3 — "Edit details" from finale: reset onboarding to step 0
  function handleEditDetails() {
    stopSpeaking();
    setShowFinale(false);
    setBuilding(false);
    buildingRef.current = false;
    setStep(0);
    setData({ name: '', income: 0, incomeSources: [], payday: 25, expenses: 0, expenseDetails: '', lifestyleSpend: '', debt: 0, goal: '', savings: 0 });
    setIncomeDraft([]);
    setAccountDraft([]);
    setSavedAccounts([]);
    setHistory([]);
    setInput('');
    setInputError('');
    finaleSpokenRef.current = false;
    const q = Q[0].ask({});
    setCurrentQ(q);
    setCardKey(k => k + 1);
    setTimeout(() => speak(q), 400);
  }

  const containerH = vpH ? `${vpH}px` : '100dvh';
  // Total steps that have a visible dot in the progress bar
  const totalDots = Q.length;

  return (
    <div style={{ position: 'relative', height: containerH, background: BG, overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* ── Progress indicator ── */}
      {!building && !showFinale && (
        <div style={{
          position: 'absolute', top: 'max(env(safe-area-inset-top), 20px)',
          left: 0, right: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          paddingLeft: 52, paddingRight: 52,
        }}>
          {/* Dot row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {Q.map((_, i) => (
              <div key={i} style={{
                width:  i === step ? 28 : i < step ? 20 : 7,
                height: i === step ? 8  : i < step ? 6  : 7,
                borderRadius: 4,
                background: i === step
                  ? PURPLE
                  : i < step
                    ? 'rgba(200,184,154,0.55)'
                    : 'rgba(232,221,208,0.13)',
                transition: 'all 0.35s ease',
                boxShadow: i === step ? '0 0 8px 2px rgba(200,184,154,0.35)' : 'none',
              }} />
            ))}
          </div>
          {/* Step counter text */}
          <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', letterSpacing: '0.05em' }}>
            Step {step + 1} of {totalDots}
          </div>
        </div>
      )}

      {/* Back button — only visible when step > 0 and not building */}
      {step > 0 && !building && !showFinale && (
        <button
          onClick={goBack}
          style={{
            position: 'absolute', top: 'max(env(safe-area-inset-top), 20px)', left: 16, zIndex: 10,
            background: 'none', border: 'none', color: 'rgba(232,221,208,0.38)',
            fontSize: 22, cursor: 'pointer', padding: 8, lineHeight: 1,
          }}
          aria-label="Back"
        >‹</button>
      )}

      {/* ── Orb section ── */}
      {!showFinale && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>

          {/* Living planet orb */}
          <Orb size={140} state={orbState} />

          {/* Orb status */}
          <div style={{ minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {orbState === 'speaking' ? (
              <WaveBars />
            ) : orbState === 'thinking' ? (
              <div style={{ color: 'rgba(232,221,208,0.4)', fontSize: 13, letterSpacing: '0.5px', animation: 'blink 1.6s ease-in-out infinite' }}>
                {building ? 'Building your picture…' : 'Processing…'}
              </div>
            ) : (
              <div style={{ color: 'rgba(232,221,208,0.2)', fontSize: 12, letterSpacing: '0.3px' }}>
                {!building && step < Q.length ? '' : ''}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Question card ── */}
      {currentQ && !showFinale && (
        <div style={{
          position: 'absolute',
          top: '48%',
          left: 0,
          right: 0,
          bottom: (!building && step < Q.length) ? 'calc(max(14px, calc(env(safe-area-inset-bottom) + 8px)) + 52px)' : 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 20px',
        }}>
          <div
            key={cardKey}
            style={{
              position: 'relative',
              background: 'rgba(232,221,208,0.05)',
              border: '1px solid rgba(232,221,208,0.1)',
              borderRadius: 24,
              padding: '22px 24px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              animation: 'cardIn 0.4s ease-out',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(232,221,208,0.06)',
            }}
          >
            <button
              onClick={() => speak(currentQ)}
              style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: 'rgba(232,221,208,0.28)', fontSize: 13, cursor: 'pointer', padding: 4, lineHeight: 1 }}
            >🔊</button>
            <div style={{ fontSize: 10, color: '#A89880', marginBottom: 12, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>
              Noa
            </div>
            <div style={{ fontSize: 17, color: '#E8DDD0', lineHeight: 1.7, whiteSpace: 'pre-wrap', fontWeight: 300, letterSpacing: '0.01em', paddingRight: 22 }}>
              <AnimatedText key={cardKey} text={currentQ} />
            </div>
          </div>
        </div>
      )}

      {/* ── Income step UI (step 1) ── */}
      {!building && !showFinale && step === 1 && Q[1]?.type === 'income' && (
        <IncomeStep
          sources={incomeDraft}
          onChange={setIncomeDraft}
          onContinue={() => advanceFromIncome(incomeDraft)}
        />
      )}

      {/* ── Accounts step UI (step 4) ── */}
      {!building && !showFinale && step === 4 && Q[4]?.type === 'accounts' && (
        <AccountsStep
          accounts={accountDraft}
          onChange={setAccountDraft}
          onContinue={() => advanceFromAccounts(accountDraft)}
          onSkip={() => advanceFromAccounts([])}
        />
      )}

      {/* ── Input bar ── */}
      {!building && !showFinale && step < Q.length && Q[step]?.type !== 'accounts' && Q[step]?.type !== 'income' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', gap: 0,
          paddingTop: 8, paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
          paddingLeft: 16, paddingRight: 16,
          background: BG,
          borderTop: '1px solid rgba(232,221,208,0.06)',
          boxSizing: 'border-box',
        }}>
          {inputError && (
            <div style={{ fontSize: 11, color: '#E24B4A', textAlign: 'center', marginBottom: 6, letterSpacing: '0.1px' }}>
              {inputError}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); if (inputError) setInputError(''); }}
            onKeyDown={onKey}
            placeholder={Q[step]?.ph || 'Type your answer…'}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: inputError ? '0.5px solid rgba(226,75,74,0.5)' : '0.5px solid rgba(232,221,208,0.2)',
              borderRadius: 24,
              padding: '14px 20px',
              color: '#E8DDD0',
              WebkitTextFillColor: '#E8DDD0',
              fontSize: 16,
              fontWeight: 300,
              outline: 'none',
              fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
          />
          <button onClick={send} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: input.trim() ? 'rgba(200,184,154,0.22)' : 'rgba(232,221,208,0.05)',
            color: input.trim() ? PURPLE : 'rgba(232,221,208,0.18)',
            fontSize: 22, cursor: 'pointer',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
          </div>
        </div>
      )}

      {/* ── Task 3 — "Your Noa is ready" finale + confirmation screen ── */}
      {showFinale && !expanding && savedData && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 150, background: BG,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflowY: 'auto', padding: '0 24px',
          paddingTop: 'max(env(safe-area-inset-top), 40px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          animation: 'expandFadeIn 0.6s ease-out',
        }}>
          {/* Orb */}
          <Orb size={96} state={orbState} />
          <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            {orbState === 'speaking' ? <WaveBars /> : <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', letterSpacing: '0.4px' }}>Noa</div>}
          </div>

          {/* Portrait text */}
          {finaleMsg && (
            <div style={{
              marginTop: 20,
              fontSize: 16, color: '#E8DDD0', lineHeight: 1.72, fontWeight: 300,
              textAlign: 'center', letterSpacing: '0.01em',
              animation: 'sentenceIn 0.8s ease-out',
              maxWidth: 320,
            }}>
              <AnimatedText key="finale" text={finaleMsg} />
            </div>
          )}

          {/* ── Summary: what Noa knows ── */}
          <div style={{
            marginTop: 28, width: '100%', maxWidth: 360,
            background: 'rgba(232,221,208,0.04)',
            border: '1px solid rgba(232,221,208,0.1)',
            borderRadius: 20, padding: '16px 20px',
            animation: 'cardIn 0.5s ease-out 0.3s both',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.32)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>
              What Noa knows
            </div>
            <SummaryRow label="Name" value={savedData.name || '—'} />
            {/* Income sources */}
            {savedData.incomeSources && savedData.incomeSources.length > 0
              ? savedData.incomeSources.map((src, i) => (
                  <SummaryRow key={i} label={src.label} value={`£${src.amount.toLocaleString('en-GB')}/mo`} color={GREEN} />
                ))
              : <SummaryRow label="Monthly income" value={`£${(savedData.income || 0).toLocaleString('en-GB')}`} color={GREEN} />
            }
            {savedData.incomeSources && savedData.incomeSources.length > 1 && (
              <SummaryRow label="Total income" value={`£${(savedData.income || 0).toLocaleString('en-GB')}/mo`} color={GREEN} bold />
            )}
            <SummaryRow label="Payday" value={`${ordinalDay(savedData.payday || 25)} of each month`} />
            {savedData.goal && <SummaryRow label="Goal" value={savedData.goal.length > 36 ? savedData.goal.slice(0, 36) + '…' : savedData.goal} />}
            {savedAccounts.length > 0 && (
              <SummaryRow label="Accounts" value={`${savedAccounts.length} account${savedAccounts.length > 1 ? 's' : ''} added`} color={AMBER} />
            )}
          </div>

          {/* CTA buttons */}
          <button
            onClick={() => { setExpanding(true); setTimeout(onDone, 1600); }}
            style={{
              marginTop: 24, width: '100%', maxWidth: 360, padding: '15px 32px',
              background: 'rgba(200,184,154,0.18)',
              border: '1px solid rgba(200,184,154,0.42)',
              borderRadius: 16, color: PURPLE, fontSize: 16, fontWeight: 700,
              cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >Let's get to work →</button>

          <button
            onClick={handleEditDetails}
            style={{
              marginTop: 10, width: '100%', maxWidth: 360, padding: '11px 0',
              background: 'none', border: '1px solid rgba(232,221,208,0.1)',
              borderRadius: 14, color: 'rgba(232,221,208,0.38)', fontSize: 13,
              cursor: 'pointer',
            }}
          >Edit details</button>
        </div>
      )}

      {/* ── Expansion overlay ── */}
      {expanding && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'expandFadeIn 0.4s ease-out',
        }}>
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #d8cebe, ${PURPLE} 55%, #7a6a52)`,
            boxShadow: `0 0 80px 40px rgba(200,184,154,0.5)`,
            animation: 'orbExpand 1.6s ease-in-out forwards',
          }} />
        </div>
      )}
    </div>
  );
}

// ── Summary row helper ──────────────────────────────────────────────
function SummaryRow({ label, value, color, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      paddingTop: 7, paddingBottom: 7,
      borderBottom: '1px solid rgba(232,221,208,0.05)',
    }}>
      <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.38)' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: color || '#E8DDD0', textAlign: 'right', maxWidth: '62%' }}>{value}</div>
    </div>
  );
}

function WaveBars() {
  const delays = [0, 0.12, 0.24, 0.1, 0.2, 0.08, 0.16];
  return (
    <div style={{ display: 'flex', gap: 3.5, alignItems: 'center', height: 28 }}>
      {delays.map((d, i) => (
        <div key={i} style={{
          width: 3, height: 28, background: PURPLE, borderRadius: 2,
          transformOrigin: 'center',
          animation: `waveBar 0.55s ease-in-out ${d}s infinite`,
          opacity: 0.75,
        }} />
      ))}
    </div>
  );
}

function AnimatedText({ text }) {
  const [visibleCount, setVisibleCount] = useState(1);
  useEffect(() => {
    const sentences = splitSentences(text);
    setVisibleCount(1);
    if (sentences.length <= 1) return;
    let count = 1;
    const id = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= sentences.length) clearInterval(id);
    }, 400);
    return () => clearInterval(id);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {splitSentences(text).slice(0, visibleCount).map((s, i) => (
        <span key={i} style={{ animation: 'sentenceIn 0.6s ease-out', display: 'inline' }}>{s} </span>
      ))}
    </>
  );
}

// ── Income step — multiple income sources ───────────────────────────
const INCOME_LABELS = ['Salary', 'Freelance', 'Side job', 'Other'];

function IncomeStep({ sources, onChange, onContinue }) {
  const [label, setLabel]     = useState('Salary');
  const [customLabel, setCustomLabel] = useState('');
  const [amount, setAmount]   = useState('');
  const [err, setErr]         = useState('');

  const total = sources.reduce((s, src) => s + src.amount, 0);

  function addSource() {
    const a = parseFloat(amount);
    if (!amount || isNaN(a) || a <= 0) { setErr('Enter a valid amount'); return; }
    const lbl = label === 'Other' && customLabel.trim() ? customLabel.trim() : label;
    onChange([...sources, { id: Date.now(), label: lbl, amount: a }]);
    setAmount(''); setCustomLabel(''); setLabel('Salary'); setErr('');
  }

  function remove(id) { onChange(sources.filter(s => s.id !== id)); }

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#111318', borderTop: '1px solid rgba(232,221,208,0.07)',
      padding: '14px 16px 0', boxSizing: 'border-box',
      paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
      maxHeight: '54%', overflowY: 'auto',
    }}>
      {/* Running total */}
      {total > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 11, color: 'rgba(232,221,208,0.34)' }}>Total: </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: GREEN }}>£{total.toLocaleString('en-GB')}/month</span>
        </div>
      )}

      {/* Existing sources */}
      {sources.map(src => (
        <div key={src.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(124,174,158,0.08)', borderRadius: 10,
          padding: '8px 12px', marginBottom: 7,
          border: '1px solid rgba(124,174,158,0.18)',
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#E8DDD0', fontWeight: 600 }}>{src.label}</div>
            <div style={{ fontSize: 11, color: GREEN }}>£{src.amount.toLocaleString('en-GB')}/month</div>
          </div>
          <button onClick={() => remove(src.id)} style={{ background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
      ))}

      {/* Add form */}
      {sources.length < 5 && (
        <>
          {err && <div style={{ fontSize: 11, color: '#E24B4A', marginBottom: 5 }}>{err}</div>}
          {/* Label chips */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
            {INCOME_LABELS.map(l => (
              <button key={l} onClick={() => { setLabel(l); setErr(''); }} style={{
                padding: '5px 12px', borderRadius: 20,
                border: `1px solid ${label === l ? PURPLE : 'rgba(232,221,208,0.15)'}`,
                background: label === l ? 'rgba(200,184,154,0.16)' : 'transparent',
                color: label === l ? PURPLE : 'rgba(232,221,208,0.45)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>{l}</button>
            ))}
          </div>
          {/* Custom label input when "Other" is selected */}
          {label === 'Other' && (
            <input
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder='Label (e.g. Rental income)…'
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(232,221,208,0.2)', borderRadius: 10, padding: '9px 14px', color: '#E8DDD0', fontSize: 14, outline: 'none', fontFamily: 'inherit', marginBottom: 8, boxSizing: 'border-box' }}
            />
          )}
          {/* Amount + add */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input
              value={amount}
              onChange={e => { setAmount(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSource(); } }}
              placeholder='Monthly amount (£)…'
              type='number'
              inputMode='decimal'
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(232,221,208,0.2)', borderRadius: 10, padding: '10px 14px', color: '#E8DDD0', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={addSource} style={{
              padding: '10px 18px', background: 'rgba(124,174,158,0.12)',
              border: '1px solid rgba(124,174,158,0.28)', borderRadius: 10,
              color: GREEN, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}>+ Add</button>
          </div>
        </>
      )}

      {/* Continue button */}
      <button
        onClick={() => {
          if (sources.length === 0) { setErr('Add at least one income source'); return; }
          onContinue();
        }}
        style={{
          width: '100%', padding: '13px 0',
          background: sources.length > 0 ? 'rgba(200,184,154,0.18)' : 'rgba(232,221,208,0.05)',
          border: `1px solid ${sources.length > 0 ? 'rgba(200,184,154,0.38)' : 'rgba(232,221,208,0.1)'}`,
          borderRadius: 12, color: sources.length > 0 ? PURPLE : 'rgba(232,221,208,0.3)',
          fontSize: 14, fontWeight: 700, cursor: sources.length > 0 ? 'pointer' : 'default',
          fontFamily: 'inherit',
        }}
      >
        {sources.length > 0 ? `Continue — £${total.toLocaleString('en-GB')}/month total` : 'Add an income source to continue'}
      </button>
    </div>
  );
}

const PURPOSES = ['Bills and Essentials', 'Daily Spending', 'Savings', 'Investments'];

function AccountsStep({ accounts, onChange, onContinue, onSkip }) {
  const [name, setName]       = useState('');
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [balance, setBalance] = useState('');
  const [err, setErr]         = useState('');

  // Plaid connection state: 'idle' | 'loading' | 'connected' | 'error'
  const [bankStep, setBankStep]     = useState('idle');
  const [bankName, setBankName]     = useState('');
  const [bankErrMsg, setBankErrMsg] = useState('');

  // Open Plaid Link: load CDN script → get link_token → open Plaid UI → exchange on success
  async function openPlaidLink() {
    setBankStep('loading');
    setBankErrMsg('');
    try {
      // 1. Load Plaid Link SDK from CDN
      if (!window.Plaid) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src    = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
          s.onload = resolve;
          s.onerror = () => reject(new Error('Failed to load Plaid Link script'));
          document.head.appendChild(s);
        });
      }

      // 2. Get link_token from server
      const ltRes = await fetch('/api/banking/link-token', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { link_token, error: ltErr } = await ltRes.json();
      if (ltErr || !link_token) throw new Error(ltErr || 'No link_token returned');

      // 3. Open Plaid Link
      setBankStep('idle');
      const plaidHandler = window.Plaid.create({
        token: link_token,

        onSuccess: async (publicToken, metadata) => {
          setBankStep('loading');
          const inst = metadata?.institution?.name || 'Your bank';
          setBankName(inst);
          try {
            // Exchange public_token and fetch accounts + transactions in one shot
            const exRes = await fetch('/api/banking/exchange', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ publicToken, institutionName: inst }),
            });
            const d = await exRes.json();
            if (d.error) throw new Error(d.error);

            // Persist Plaid access token + institution
            saveBankingAccessToken(d.accessToken);
            saveBankingInstitution(inst);
            setBankingLastSync();

            // Auto-populate accounts list from bank data
            if (d.accounts && d.accounts.length > 0) {
              const built = d.accounts.map(a => ({
                id:       a.id,
                name:     a.name,
                purpose:  'Bank Account',
                balance:  a.balance,
                fromBank: true,
              }));
              onChange(built);
            }

            // Store 30-day transaction history
            if (d.transactions && d.transactions.length > 0) {
              const entries = d.transactions.map(tx => ({
                id:       `bank_${tx.date}_${Math.random().toString(36).slice(2, 7)}`,
                amount:   tx.amount,
                category: tx.category,
                note:     tx.description,
                date:     tx.date,
                fromBank: true,
              }));
              saveExpenseLog(entries);
            }

            setBankStep('connected');
          } catch (e) {
            console.error('[AccountsStep onSuccess]', e);
            setBankStep('error');
            setBankErrMsg('Connected but could not import data. Continue manually below.');
          }
        },

        onExit: (exitErr) => {
          if (exitErr) {
            setBankStep('error');
            setBankErrMsg('Connection cancelled. You can try again or add accounts manually.');
          } else {
            setBankStep('idle');
          }
        },
      });

      plaidHandler.open();
    } catch (e) {
      console.error('[AccountsStep openPlaidLink]', e);
      setBankStep('error');
      setBankErrMsg('Could not start connection — check your internet and try again.');
    }
  }

  function addAccount() {
    if (!name.trim()) { setErr('Add an account name'); return; }
    if (accounts.length >= 4) { setErr('Maximum 4 accounts'); return; }
    onChange([...accounts, { id: Date.now(), name: name.trim(), purpose, balance: parseFloat(balance) || 0 }]);
    setName(''); setBalance(''); setPurpose(PURPOSES[0]); setErr('');
  }

  function remove(id) { onChange(accounts.filter(a => a.id !== id)); }

  const bankConnected = bankStep === 'connected';

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#111318', borderTop: '1px solid rgba(232,221,208,0.07)',
      padding: '14px 16px 0', boxSizing: 'border-box',
      paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
      overflowY: 'auto', maxHeight: '72vh',
    }}>

      {/* ── Plaid Open Banking section ───────────────────────────────── */}
      {bankConnected ? (
        /* Connected state */
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(124,174,158,0.1)', border: '1px solid rgba(124,174,158,0.25)',
        }}>
          <div style={{ fontSize: 18, lineHeight: 1 }}>✅</div>
          <div>
            <div style={{ fontSize: 13, color: '#7CAE9E', fontWeight: 600 }}>{bankName} connected</div>
            <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.38)' }}>Accounts and transactions imported via Plaid</div>
          </div>
        </div>
      ) : bankStep === 'loading' ? (
        /* Loading / exchanging */
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
          padding: '10px 14px', borderRadius: 12,
          background: 'rgba(200,184,154,0.06)', border: '1px solid rgba(200,184,154,0.15)',
        }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(200,184,154,0.2)', borderTopColor: '#C8B89A', animation: 'noaOrbPulse 0.8s linear infinite', flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: 'rgba(232,221,208,0.6)' }}>
            {bankName ? `Importing from ${bankName}…` : 'Connecting…'}
          </div>
        </div>
      ) : (
        /* Idle or error — single Plaid Link button */
        <div style={{ marginBottom: 12 }}>
          <button onClick={openPlaidLink} style={{
            width: '100%', padding: '11px 0',
            background: 'rgba(124,174,158,0.1)', border: '1px solid rgba(124,174,158,0.28)',
            borderRadius: 12, color: '#7CAE9E', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>🔗 Connect your bank</button>
          <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', textAlign: 'center', marginTop: 5, lineHeight: 1.5 }}>
            Read-only access. Noa can never move or touch your money.
          </div>
          {bankStep === 'error' && (
            <div style={{ fontSize: 11, color: '#E24B4A', textAlign: 'center', marginTop: 5 }}>{bankErrMsg}</div>
          )}
        </div>
      )}

      {/* ── Manual section divider ────────────────────────────────────── */}
      {!bankConnected && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(232,221,208,0.08)' }} />
          <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Or add manually</div>
          <div style={{ flex: 1, height: 1, background: 'rgba(232,221,208,0.08)' }} />
        </div>
      )}

      {/* ── Existing accounts list ────────────────────────────────────── */}
      {accounts.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: a.fromBank ? 'rgba(124,174,158,0.07)' : 'rgba(200,184,154,0.08)',
          borderRadius: 10, padding: '8px 12px', marginBottom: 7,
          border: `1px solid ${a.fromBank ? 'rgba(124,174,158,0.2)' : 'rgba(200,184,154,0.15)'}`,
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#E8DDD0', fontWeight: 600 }}>
              {a.fromBank && <span style={{ color: '#7CAE9E', marginRight: 4 }}>✓</span>}
              {a.name}
            </div>
            <div style={{ fontSize: 10, color: '#A89880' }}>{a.purpose}{a.balance > 0 ? ` · £${a.balance.toLocaleString('en-GB')}` : ''}</div>
          </div>
          {!a.fromBank && (
            <button onClick={() => remove(a.id)} style={{ background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
          )}
        </div>
      ))}

      {/* ── Manual add form — shown if < 4 accounts and not in picker ── */}
      {!bankConnected && bankStep !== 'picker' && accounts.length < 4 && (
        <>
          {err && <div style={{ fontSize: 11, color: '#E24B4A', marginBottom: 5 }}>{err}</div>}
          <div style={{ display: 'flex', gap: 7, marginBottom: 7 }}>
            <input
              value={name}
              onChange={e => { setName(e.target.value); setErr(''); }}
              placeholder='Account name…'
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(232,221,208,0.2)', borderRadius: 10, padding: '10px 14px', color: '#E8DDD0', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
            <input
              value={balance}
              onChange={e => setBalance(e.target.value)}
              placeholder='£ balance'
              type='number'
              style={{ width: 90, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(232,221,208,0.2)', borderRadius: 10, padding: '10px 10px', color: '#E8DDD0', fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {PURPOSES.map(p => (
              <button key={p} onClick={() => setPurpose(p)} style={{
                padding: '5px 11px', borderRadius: 20, border: `1px solid ${purpose === p ? '#C8B89A' : 'rgba(232,221,208,0.15)'}`,
                background: purpose === p ? 'rgba(200,184,154,0.16)' : 'transparent',
                color: purpose === p ? '#C8B89A' : 'rgba(232,221,208,0.45)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              }}>{p}</button>
            ))}
          </div>
          <button onClick={addAccount} style={{
            width: '100%', padding: '11px 0', background: 'rgba(200,184,154,0.1)',
            border: '1px solid rgba(200,184,154,0.25)', borderRadius: 12,
            color: '#C8B89A', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            marginBottom: 10, fontFamily: 'inherit',
          }}>+ Add account</button>
        </>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onSkip} style={{ flex: 1, padding: '11px 0', background: 'transparent', border: '1px solid rgba(232,221,208,0.12)', borderRadius: 12, color: 'rgba(232,221,208,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Skip for now</button>
        <button onClick={onContinue} style={{ flex: 2, padding: '11px 0', background: 'rgba(200,184,154,0.18)', border: '1px solid rgba(200,184,154,0.35)', borderRadius: 12, color: '#C8B89A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {accounts.length > 0 ? `Continue with ${accounts.length} account${accounts.length > 1 ? 's' : ''}` : 'Continue'}
        </button>
      </div>
    </div>
  );
}
