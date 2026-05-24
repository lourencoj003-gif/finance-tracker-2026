import { useState, useEffect, useRef } from 'react';
import { parseAmount, parseDebt } from '../scoring';
import { saveData, saveInsights, markReady, markOnboardingDone, setUserName, saveAccounts } from '../storage';
import { speak as voiceSpeak, stopSpeaking } from '../voice';
import Orb from '../Orb';

const PURPLE = '#C8B89A';
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
    ask: ({ name }) => `Nice to meet you, ${name}. What's your monthly take-home pay after tax?`,
    ph:  'e.g. £2,500',
  },
  {
    id: 'payday',
    ask: () => "What day of the month does your salary land?",
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

export default function Onboarding({ onDone }) {
  const [step, setStep]         = useState(0);
  const [input, setInput]       = useState('');
  const [inputError, setInputError] = useState('');
  const [history, setHistory]   = useState([]); // stack of { step, data, input } for back navigation
  const [data, setData]         = useState({ name: '', income: 0, payday: 25, expenses: 0, expenseDetails: '', lifestyleSpend: '', debt: 0, goal: '', savings: 0 });
  const [accountDraft, setAccountDraft] = useState([]);  // accounts being built on step 4
  const [building, setBuilding] = useState(false);
  const [orbState, setOrbState] = useState('idle');
  const [currentQ, setCurrentQ] = useState('');
  const [cardKey, setCardKey]   = useState(0);
  const [expanding, setExpanding] = useState(false);
  const [finaleMsg, setFinaleMsg] = useState('');    // Feature 4 — personalised 3-sentence portrait
  const [showFinale, setShowFinale] = useState(false);
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

  // Feature 4 — speak the finale portrait, then auto-proceed to dashboard
  useEffect(() => {
    if (!showFinale || !finaleMsg || finaleSpokenRef.current) return;
    finaleSpokenRef.current = true;
    setOrbState('speaking');
    voiceSpeak(finaleMsg, {
      onStart: () => setOrbState('speaking'),
      onEnd: () => {
        setOrbState('idle');
        setTimeout(() => { setExpanding(true); setTimeout(onDone, 1600); }, 800);
      },
      onError: () => {
        setOrbState('idle');
        setTimeout(() => { setExpanding(true); setTimeout(onDone, 1600); }, 800);
      },
    });
    // Fallback: always proceed after 8 seconds regardless
    const fallback = setTimeout(() => {
      if (!expanding) { setExpanding(true); setTimeout(onDone, 1600); }
    }, 8000);
    return () => clearTimeout(fallback);
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
    saveAccounts(accs);
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
    else if (step === 1) { nd.income = parseAmount(val); }
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

    const elapsed = Date.now() - started;
    await new Promise(r => setTimeout(r, Math.max(0, 1200 - elapsed)));

    // Show the finale screen — speak, then proceed after speech or 6s max
    setShowFinale(true);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const containerH = vpH ? `${vpH}px` : '100dvh';

  return (
    <div style={{ position: 'relative', height: containerH, background: BG, overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* Progress dots + back button */}
      <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top), 24px)', left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, zIndex: 5, paddingLeft: 52, paddingRight: 52 }}>
        {Q.map((_, i) => (
          <div key={i} style={{
            width: i < step ? 18 : 6, height: 6, borderRadius: 3,
            background: i < step ? PURPLE : 'rgba(232,221,208,0.15)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>
      {/* Back button — only visible when step > 0 and not building */}
      {step > 0 && !building && (
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
              {!building && step < Q.length ? `${step + 1} of ${Q.length}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* ── Question card ── */}
      {currentQ && (
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

      {/* ── Accounts step UI (step 4) ── */}
      {!building && step === 4 && Q[4]?.type === 'accounts' && (
        <AccountsStep
          accounts={accountDraft}
          onChange={setAccountDraft}
          onContinue={() => advanceFromAccounts(accountDraft)}
          onSkip={() => advanceFromAccounts([])}
        />
      )}

      {/* ── Input bar ── */}
      {!building && step < Q.length && Q[step]?.type !== 'accounts' && (
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

      {/* ── Feature 4: Finale — Noa's personalised financial portrait ── */}
      {showFinale && !expanding && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 150, background: BG,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0 28px',
          animation: 'expandFadeIn 0.6s ease-out',
        }}>
          <Orb size={100} state={orbState} />
          <div style={{ height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 20 }}>
            {orbState === 'speaking' ? (
              <WaveBars />
            ) : (
              <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.28)', letterSpacing: '0.4px' }}>Noa</div>
            )}
          </div>
          {finaleMsg && (
            <div style={{
              marginTop: 28,
              fontSize: 17, color: '#E8DDD0', lineHeight: 1.72, fontWeight: 300,
              textAlign: 'center', letterSpacing: '0.01em',
              animation: 'sentenceIn 0.8s ease-out',
              maxWidth: 340,
            }}>
              <AnimatedText key="finale" text={finaleMsg} />
            </div>
          )}
          <button
            onClick={() => { setExpanding(true); setTimeout(onDone, 1600); }}
            style={{
              marginTop: 36, padding: '13px 32px',
              background: 'rgba(200,184,154,0.12)',
              border: '1px solid rgba(200,184,154,0.3)',
              borderRadius: 14, color: PURPLE, fontSize: 15, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.05em',
            }}
          >Let's get to work</button>
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

const PURPOSES = ['Bills and Essentials', 'Daily Spending', 'Savings', 'Investments'];

function AccountsStep({ accounts, onChange, onContinue, onSkip }) {
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [balance, setBalance] = useState('');
  const [err, setErr] = useState('');

  function addAccount() {
    if (!name.trim()) { setErr('Add an account name'); return; }
    if (accounts.length >= 4) { setErr('Maximum 4 accounts'); return; }
    onChange([...accounts, { id: Date.now(), name: name.trim(), purpose, balance: parseFloat(balance) || 0 }]);
    setName(''); setBalance(''); setPurpose(PURPOSES[0]); setErr('');
  }

  function remove(id) { onChange(accounts.filter(a => a.id !== id)); }

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#111318', borderTop: '1px solid rgba(232,221,208,0.07)',
      padding: '14px 16px 0', boxSizing: 'border-box',
      paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
    }}>
      {/* Existing accounts */}
      {accounts.map(a => (
        <div key={a.id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(200,184,154,0.08)', borderRadius: 10,
          padding: '8px 12px', marginBottom: 7,
          border: '1px solid rgba(200,184,154,0.15)',
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#E8DDD0', fontWeight: 600 }}>{a.name}</div>
            <div style={{ fontSize: 10, color: '#A89880' }}>{a.purpose}{a.balance > 0 ? ` · £${a.balance.toLocaleString('en-GB')}` : ''}</div>
          </div>
          <button onClick={() => remove(a.id)} style={{ background: 'none', border: 'none', color: 'rgba(232,221,208,0.3)', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
        </div>
      ))}

      {/* Add form — shown if < 4 accounts */}
      {accounts.length < 4 && (
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
        <button onClick={onSkip} style={{ flex: 1, padding: '11px 0', background: 'transparent', border: '1px solid rgba(232,221,208,0.12)', borderRadius: 12, color: 'rgba(232,221,208,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Skip</button>
        <button onClick={onContinue} style={{ flex: 2, padding: '11px 0', background: 'rgba(200,184,154,0.18)', border: '1px solid rgba(200,184,154,0.35)', borderRadius: 12, color: '#C8B89A', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          {accounts.length > 0 ? `Continue with ${accounts.length} account${accounts.length > 1 ? 's' : ''}` : 'Skip for now'}
        </button>
      </div>
    </div>
  );
}
