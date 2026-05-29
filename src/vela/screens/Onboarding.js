import { useState, useEffect, useRef } from 'react';
import { parseAmount } from '../scoring';
import { saveData, saveInsights, markReady, markOnboardingDone, setUserName, saveAccounts, saveEmail, isSignupLogged, markSignupLogged } from '../storage';
import { speak as voiceSpeak, stopSpeaking } from '../voice';
import Orb from '../Orb';

const PURPLE = '#C8B89A';
const GREEN  = '#7CAE9E';
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

// ── 4-step question set ─────────────────────────────────────────────────────
const Q = [
  {
    id: 'name_email',
    type: 'name_email',
    ask: () => "Hey, I'm Noa. Before we start — what's your name?",
    helper: 'Your first name and email so Noa can personalise your experience and send your weekly financial summary.',
  },
  {
    id: 'income',
    ask: ({ name }) => `${name ? `Nice to meet you, ${name}. ` : ''}What's your monthly take-home after tax?`,
    ph:     'e.g. £2,800',
    helper: 'Your total monthly income after tax — all sources combined.',
    hint:   'Noa uses this to calculate your monthly surplus, set a realistic budget, and measure your savings rate. Never shared or stored outside this device.',
  },
  {
    id: 'expenses',
    ask: () => "What are your fixed monthly outgoings — rent, bills, subscriptions?",
    ph:     'e.g. £900 rent, £120 bills, £200 food',
    helper: 'Give a total or list individual items — Noa will add them up.',
    hint:   'Fixed costs are the baseline Noa works around. The more accurate, the better your payday plan.',
    quickAdd: true,
  },
  {
    id: 'payday_goal',
    type: 'payday_goal',
    ask: ({ name }) => `${name ? `Almost done, ${name}. ` : 'Almost there. '}When does your salary land, and what's your main financial goal?`,
    helper: 'Noa uses your payday date to activate each month and walk you through exactly where your money goes.',
  },
];

function parsePayday(val) {
  if (/last|end.?of.?month|eom/i.test(val)) return 28;
  const m = val.match(/(\d{1,2})(?:st|nd|rd|th)?(?:\s|$|,)/i) || val.match(/(\d{1,2})/);
  return m ? Math.min(31, Math.max(1, parseInt(m[1], 10))) : 25;
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

function ordinalDay(n) {
  if (n === 1 || n === 21 || n === 31) return `${n}st`;
  if (n === 2 || n === 22) return `${n}nd`;
  if (n === 3 || n === 23) return `${n}rd`;
  return `${n}th`;
}

// ── Main onboarding component ───────────────────────────────────────────────
export default function Onboarding({ onDone }) {
  const [step, setStep]             = useState(0);
  const [input, setInput]           = useState('');
  const [inputError, setInputError] = useState('');
  const [history, setHistory]       = useState([]);
  const [data, setData]             = useState({
    name: '', email: '', income: 0, incomeSources: [],
    payday: 25, expenses: 0, expenseDetails: '',
    lifestyleSpend: '', debt: 0, goal: '', savings: 0,
  });
  const [building, setBuilding]     = useState(false);
  const [orbState, setOrbState]     = useState('idle');
  const [currentQ, setCurrentQ]     = useState('');
  const [cardKey, setCardKey]       = useState(0);
  const [expanding, setExpanding]   = useState(false);
  const [finaleMsg, setFinaleMsg]   = useState('');
  const [showFinale, setShowFinale] = useState(false);
  const [savedData, setSavedData]   = useState(null);
  const [hintOpen, setHintOpen]     = useState(false);
  const finaleSpokenRef             = useRef(false);
  const [vpH, setVpH]               = useState(
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
    setHintOpen(false);
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

  // Called by NameEmailStep when name + email confirmed
  function advanceFromNameEmail(name, email) {
    const nd = { ...data, name, email };
    setData(nd);
    saveEmail(email);
    setUserName(name);
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

  // Called by PaydayGoalStep when payday + goal confirmed
  function advanceFromPaydayGoal(payday, goal) {
    const nd = { ...data, payday, goal };
    setData(nd);
    setHistory(h => [...h, { step, data: { ...data }, prevInput: '' }]);
    setOrbState('thinking');
    const finalMsg = `Perfect${nd.name ? ` ${nd.name}` : ''}. I have everything I need. Give me a moment to build your financial picture.`;
    setTimeout(() => {
      setCurrentQ(finalMsg);
      setCardKey(k => k + 1);
      setBuilding(true);
      buildingRef.current = true;
      speak(finalMsg);
      buildPlan(nd);
    }, 650);
  }

  function send() {
    const val = input.trim();
    setInputError('');
    if (!val) { setInputError('Please enter a response to continue'); return; }
    if (building || step >= Q.length) return;
    setHintOpen(false);
    setHistory(h => [...h, { step, data: { ...data }, prevInput: input }]);
    setInput('');

    const nd = { ...data };
    if (step === 1) {
      // Income — single figure
      nd.income = parseAmount(val) || 0;
    } else if (step === 2) {
      // Expenses — sum all amounts
      const _c  = val.replace(/[£$€,]/g, '');
      const _ns = (_c.match(/\d+(?:\.\d+)?/g) || []).map(Number).filter(n => n > 0);
      nd.expenses = _ns.length > 0 ? _ns.reduce((a, b) => a + b, 0) : parseAmount(val);
      nd.expenseDetails = val;
    }
    setData(nd);

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

  async function buildPlan(d) {
    const { income, expenses, debt, goal } = d;
    const surplus  = income - expenses;
    const name     = d.name || '';
    const started  = Date.now();

    const sysPrompt = `You are Noa, a personal finance coach. Respond with exactly 3 short financial insights as a JSON array. Each must be under 28 words, start with an action verb, and reference a specific £ amount. Format: ["insight1","insight2","insight3"] — nothing else.`;
    const userMsg   = `Monthly income: £${income}. Monthly expenses: £${expenses}. Surplus: £${surplus.toFixed(0)}. Total debt: £${debt}. Goal: ${goal}. Savings: £${d.savings || 0}.`;

    let insights;
    try {
      const res = await Promise.race([
        fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ financialContext: sysPrompt, messages: [{ role: 'user', content: userMsg }] }),
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 9000)),
      ]);
      const json = await res.json();
      const m = (json.text || '').match(/\[[\s\S]*?\]/);
      if (m) insights = JSON.parse(m[0]);
    } catch {}

    if (!Array.isArray(insights) || insights.length < 1) {
      insights = fallbackInsights(d);
    }

    saveData(d);
    saveInsights(insights.slice(0, 3));
    saveAccounts([]);
    markReady();
    markOnboardingDone();

    // Portrait
    const savingsRate = income > 0 ? Math.round((surplus / income) * 100) : 0;
    const finalePrompt = `You are Noa — a sharp, warm personal financial navigator. Write EXACTLY 3 sentences as a spoken financial portrait for this specific user. Structure: (1) an observation about what you see in their numbers right now — be specific with £ amounts; (2) an honest but warm assessment of their position — acknowledge what's good AND what's challenging; (3) a forward-looking promise of what's possible in the next 90 days if they focus. Use first person ("Here's what I see..."). Address them by name if provided. Under 70 words total. Dry, confident, warm.`;
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
    setShowFinale(true);
  }

  function handleEditDetails() {
    stopSpeaking();
    setShowFinale(false);
    setBuilding(false);
    buildingRef.current = false;
    setStep(0);
    setData({ name: '', email: '', income: 0, incomeSources: [], payday: 25, expenses: 0, expenseDetails: '', lifestyleSpend: '', debt: 0, goal: '', savings: 0 });
    setSavedData(null);
    setHistory([]);
    setInput('');
    setInputError('');
    finaleSpokenRef.current = false;
    const q = Q[0].ask({});
    setCurrentQ(q);
    setCardKey(k => k + 1);
    setTimeout(() => speak(q), 400);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const containerH = vpH ? `${vpH}px` : '100dvh';
  const totalDots  = Q.length;

  return (
    <div style={{ position: 'relative', height: containerH, background: BG, overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* Progress dots */}
      {!building && !showFinale && (
        <div style={{
          position: 'absolute', top: 'max(env(safe-area-inset-top), 18px)',
          left: 0, right: 0, zIndex: 5,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          paddingLeft: 52, paddingRight: 52,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            {Q.map((_, i) => (
              <div key={i} style={{
                width:  i === step ? 32 : i < step ? 22 : 8,
                height: i === step ? 10 : i < step ? 7  : 8,
                borderRadius: 5,
                background: i === step
                  ? PURPLE
                  : i < step
                    ? 'rgba(200,184,154,0.60)'
                    : 'rgba(232,221,208,0.15)',
                transition: 'all 0.35s ease',
                boxShadow: i === step ? '0 0 10px 3px rgba(200,184,154,0.4)' : 'none',
              }} />
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', letterSpacing: '0.06em', fontWeight: 500 }}>
            Step {step + 1} of {totalDots}
          </div>
        </div>
      )}

      {/* Back button */}
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

      {/* Orb section */}
      {!showFinale && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '42%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <Orb size={140} state={orbState} />
          <div style={{ minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {orbState === 'speaking' ? (
              <WaveBars />
            ) : orbState === 'thinking' ? (
              <div style={{ color: 'rgba(232,221,208,0.4)', fontSize: 13, letterSpacing: '0.5px', animation: 'blink 1.6s ease-in-out infinite' }}>
                {building ? 'Building your picture…' : 'Processing…'}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Question card */}
      {currentQ && !showFinale && (
        <div style={{
          position: 'absolute',
          top: '42%',
          left: 0, right: 0,
          bottom: (!building && step < Q.length) ? 'calc(max(14px, calc(env(safe-area-inset-bottom) + 8px)) + 52px)' : 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
          padding: '0 20px', paddingTop: 12,
          pointerEvents: 'none',
        }}>
          <div
            key={cardKey}
            style={{
              position: 'relative',
              background: 'rgba(232,221,208,0.05)',
              border: '1px solid rgba(232,221,208,0.1)',
              borderRadius: 24,
              padding: '18px 20px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              animation: 'cardIn 0.4s ease-out',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(232,221,208,0.06)',
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={() => speak(currentQ)}
              style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', color: 'rgba(232,221,208,0.28)', fontSize: 13, cursor: 'pointer', padding: 4 }}
            >🔊</button>
            <div style={{ fontSize: 10, color: '#A89880', marginBottom: 10, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 500 }}>Noa</div>
            <div style={{ fontSize: 16, color: '#E8DDD0', lineHeight: 1.7, fontWeight: 300, letterSpacing: '0.01em', paddingRight: 22 }}>
              <AnimatedText key={cardKey} text={currentQ} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 0: Name + Email ── */}
      {!building && !showFinale && step === 0 && Q[0]?.type === 'name_email' && (
        <NameEmailStep
          initialName={data.name}
          initialEmail={data.email}
          onContinue={advanceFromNameEmail}
        />
      )}

      {/* ── Step 3: Payday + Goal ── */}
      {!building && !showFinale && step === 3 && Q[3]?.type === 'payday_goal' && (
        <PaydayGoalStep
          initialPayday={data.payday}
          initialGoal={data.goal}
          onContinue={advanceFromPaydayGoal}
        />
      )}

      {/* ── Input bar (steps 1 and 2 only) ── */}
      {!building && !showFinale && step < Q.length && Q[step]?.type !== 'name_email' && Q[step]?.type !== 'payday_goal' && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', gap: 0,
          paddingTop: 10, paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
          paddingLeft: 16, paddingRight: 16,
          background: BG,
          borderTop: '1px solid rgba(232,221,208,0.06)',
          boxSizing: 'border-box',
          maxHeight: '60%', overflowY: 'auto',
        }}>

          {/* Quick-add expense chips */}
          {Q[step]?.quickAdd && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Quick add</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { label: 'Rent',      amount: 900 },
                  { label: 'Bills',     amount: 120 },
                  { label: 'Food',      amount: 200 },
                  { label: 'Transport', amount: 80  },
                  { label: 'Phone',     amount: 30  },
                  { label: 'Netflix',   amount: 18  },
                  { label: 'Gym',       amount: 35  },
                  { label: 'Insurance', amount: 50  },
                ].map(({ label, amount }) => (
                  <button
                    key={label}
                    onClick={() => {
                      const entry = `£${amount} ${label.toLowerCase()}`;
                      setInput(prev => prev ? `${prev}, ${entry}` : entry);
                      if (inputError) setInputError('');
                    }}
                    style={{
                      padding: '5px 11px', borderRadius: 16, fontSize: 11, fontWeight: 500,
                      background: 'rgba(200,184,154,0.08)',
                      border: '1px solid rgba(200,184,154,0.2)',
                      color: 'rgba(232,221,208,0.7)', cursor: 'pointer',
                      fontFamily: 'inherit', whiteSpace: 'nowrap',
                      transition: 'all 0.15s',
                    }}
                  >+ {label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Helper text */}
          {Q[step]?.helper && (
            <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.38)', marginBottom: 7, letterSpacing: '0.1px', lineHeight: 1.5 }}>
              {Q[step].helper}
            </div>
          )}

          {/* Why do we ask? */}
          {Q[step]?.hint && (
            <div style={{ marginBottom: 8 }}>
              <button
                onClick={() => setHintOpen(h => !h)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(200,184,154,0.5)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {hintOpen ? '↑ Hide' : '? Why do we ask this?'}
              </button>
              {hintOpen && (
                <div style={{
                  marginTop: 6, padding: '9px 12px',
                  background: 'rgba(200,184,154,0.06)',
                  border: '1px solid rgba(200,184,154,0.14)',
                  borderRadius: 10, fontSize: 11, color: 'rgba(232,221,208,0.5)',
                  lineHeight: 1.6, animation: 'cardIn 0.2s ease-out',
                }}>
                  {Q[step].hint}
                </div>
              )}
            </div>
          )}

          {inputError && (
            <div style={{ fontSize: 11, color: '#E24B4A', textAlign: 'center', marginBottom: 6 }}>{inputError}</div>
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
                borderRadius: 24, padding: '14px 20px',
                color: '#E8DDD0', WebkitTextFillColor: '#E8DDD0',
                fontSize: 16, fontWeight: 300, outline: 'none',
                fontFamily: 'inherit', WebkitAppearance: 'none',
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

      {/* ── Finale screen ── */}
      {showFinale && !expanding && savedData && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 150, background: BG,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          overflowY: 'auto', padding: '0 24px',
          paddingTop: 'max(env(safe-area-inset-top), 40px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
          animation: 'expandFadeIn 0.6s ease-out',
        }}>
          <Orb size={96} state={orbState} />
          <div style={{ height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            {orbState === 'speaking' ? <WaveBars /> : <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.28)', letterSpacing: '0.4px' }}>Noa</div>}
          </div>

          {finaleMsg && (
            <div style={{
              marginTop: 24, fontSize: 17, color: '#E8DDD0', lineHeight: 1.8, fontWeight: 300,
              textAlign: 'center', letterSpacing: '0.015em',
              animation: 'sentenceIn 1.2s ease-out', maxWidth: 340,
            }}>
              <AnimatedText key="finale" text={finaleMsg} slow />
            </div>
          )}

          <div style={{
            marginTop: 28, width: '100%', maxWidth: 360,
            background: 'rgba(232,221,208,0.04)',
            border: '1px solid rgba(232,221,208,0.1)',
            borderRadius: 20, padding: '16px 20px',
            animation: 'cardIn 0.5s ease-out 0.3s both',
          }}>
            <div style={{ fontSize: 9, color: 'rgba(232,221,208,0.32)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>What Noa knows</div>
            <SummaryRow label="Name" value={savedData.name || '—'} />
            {savedData.email && <SummaryRow label="Email" value={savedData.email} />}
            <SummaryRow label="Monthly income" value={`£${(savedData.income || 0).toLocaleString('en-GB')}/mo`} color={GREEN} />
            <SummaryRow label="Monthly expenses" value={`£${(savedData.expenses || 0).toLocaleString('en-GB')}/mo`} />
            <SummaryRow label="Monthly surplus" value={`£${Math.max(0, (savedData.income || 0) - (savedData.expenses || 0)).toLocaleString('en-GB')}/mo`} color={GREEN} />
            <SummaryRow label="Payday" value={`${ordinalDay(savedData.payday || 25)} of each month`} />
            {savedData.goal && <SummaryRow label="Goal" value={savedData.goal.length > 36 ? savedData.goal.slice(0, 36) + '…' : savedData.goal} />}
          </div>

          {/* "Complete your profile" hint */}
          <div style={{
            marginTop: 12, width: '100%', maxWidth: 360,
            background: 'rgba(200,184,154,0.04)',
            border: '1px solid rgba(200,184,154,0.1)',
            borderRadius: 14, padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'cardIn 0.5s ease-out 0.5s both',
          }}>
            <div style={{ fontSize: 16 }}>💡</div>
            <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.45)', lineHeight: 1.5 }}>
              You can add bank accounts, debts, and lifestyle spending from the dashboard later — it takes 2 minutes and makes Noa significantly smarter.
            </div>
          </div>

          <button
            onClick={() => {
              setExpanding(true);
              // Fire onboarding signup to waitlist API (once per user, fire-and-forget)
              if (!isSignupLogged()) {
                const email = savedData?.email || '';
                const name  = savedData?.name  || '';
                if (email) {
                  markSignupLogged();
                  fetch('/api/waitlist', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body:    JSON.stringify({ email, name, context: 'welcome', welcome: true }),
                  }).catch(() => {}); // non-fatal
                }
              }
              setTimeout(onDone, 2400);
            }}
            style={{
              marginTop: 20, width: '100%', maxWidth: 360, padding: '15px 32px',
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

      {/* Expansion overlay */}
      {expanding && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200, background: BG,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'expandFadeIn 0.4s ease-out',
        }}>
          <div style={{
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, #e8ddd0, ${PURPLE} 45%, #7a6a52)`,
            boxShadow: `0 0 120px 60px rgba(200,184,154,0.55)`,
            animation: 'orbExpand 2.4s ease-in-out forwards',
          }} />
        </div>
      )}
    </div>
  );
}

// ── Summary row ─────────────────────────────────────────────────────────────
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

function AnimatedText({ text, slow = false }) {
  const [visibleCount, setVisibleCount] = useState(1);
  const delay = slow ? 750 : 400;
  useEffect(() => {
    const sentences = splitSentences(text);
    setVisibleCount(1);
    if (sentences.length <= 1) return;
    let count = 1;
    const id = setInterval(() => {
      count++;
      setVisibleCount(count);
      if (count >= sentences.length) clearInterval(id);
    }, delay);
    return () => clearInterval(id);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      {splitSentences(text).slice(0, visibleCount).map((s, i) => (
        <span key={i} style={{ animation: `sentenceIn ${slow ? '1s' : '0.6s'} ease-out`, display: 'inline' }}>{s} </span>
      ))}
    </>
  );
}

// ── Step 0: Name + Email ────────────────────────────────────────────────────
function NameEmailStep({ initialName, initialEmail, onContinue }) {
  const [name,  setName]  = useState(initialName  || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [err,   setErr]   = useState('');

  function submit() {
    if (!name.trim()) { setErr('Enter your first name to continue'); return; }
    onContinue(name.trim(), email.trim());
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#111318', borderTop: '1px solid rgba(232,221,208,0.06)',
      padding: '16px 16px 0', boxSizing: 'border-box',
      paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
    }}>
      {err && <div style={{ fontSize: 11, color: '#E24B4A', marginBottom: 8 }}>{err}</div>}

      <input
        autoFocus
        value={name}
        onChange={e => { setName(e.target.value); setErr(''); }}
        onKeyDown={onKey}
        placeholder="First name…"
        style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: err ? '0.5px solid rgba(226,75,74,0.5)' : '0.5px solid rgba(232,221,208,0.2)',
          borderRadius: 14, padding: '14px 18px',
          color: '#E8DDD0', WebkitTextFillColor: '#E8DDD0',
          fontSize: 16, fontWeight: 300, outline: 'none',
          fontFamily: 'inherit', WebkitAppearance: 'none',
          boxSizing: 'border-box', marginBottom: 10,
        }}
      />

      <div style={{ position: 'relative' }}>
        <input
          type="email"
          inputMode="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={onKey}
          placeholder="Email (optional) — for your weekly summary"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '0.5px solid rgba(232,221,208,0.12)',
            borderRadius: 14, padding: '14px 18px',
            color: '#E8DDD0', WebkitTextFillColor: '#E8DDD0',
            fontSize: 15, fontWeight: 300, outline: 'none',
            fontFamily: 'inherit', WebkitAppearance: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.25)', marginTop: 6, marginBottom: 12, lineHeight: 1.5, letterSpacing: '0.1px' }}>
        We'll send your weekly financial summary. Stored only on this device.
      </div>

      <button
        onClick={submit}
        style={{
          width: '100%', padding: '14px 0',
          background: name.trim() ? 'rgba(200,184,154,0.18)' : 'rgba(232,221,208,0.05)',
          border: `1px solid ${name.trim() ? 'rgba(200,184,154,0.42)' : 'rgba(232,221,208,0.1)'}`,
          borderRadius: 14, color: name.trim() ? '#C8B89A' : 'rgba(232,221,208,0.3)',
          fontSize: 15, fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
          fontFamily: 'inherit', letterSpacing: '0.03em',
        }}
      >
        Continue →
      </button>
    </div>
  );
}

// ── Step 3: Payday + Goal ───────────────────────────────────────────────────
function PaydayGoalStep({ initialPayday, initialGoal, onContinue }) {
  const [payday, setPayday]   = useState(initialPayday ? String(initialPayday) : '');
  const [goal,   setGoal]     = useState(initialGoal  || '');
  const [err,    setErr]      = useState('');

  function submit() {
    if (!payday.trim()) { setErr('Enter your payday date to continue'); return; }
    onContinue(parsePayday(payday), goal.trim());
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: '#111318', borderTop: '1px solid rgba(232,221,208,0.06)',
      padding: '16px 16px 0', boxSizing: 'border-box',
      paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
    }}>
      {err && <div style={{ fontSize: 11, color: '#E24B4A', marginBottom: 8 }}>{err}</div>}

      <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
        Payday date
      </div>
      <input
        autoFocus
        value={payday}
        onChange={e => { setPayday(e.target.value); setErr(''); }}
        onKeyDown={onKey}
        placeholder='e.g. 25th, or "last day of month"'
        style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: err ? '0.5px solid rgba(226,75,74,0.5)' : '0.5px solid rgba(232,221,208,0.2)',
          borderRadius: 14, padding: '14px 18px',
          color: '#E8DDD0', WebkitTextFillColor: '#E8DDD0',
          fontSize: 16, fontWeight: 300, outline: 'none',
          fontFamily: 'inherit', WebkitAppearance: 'none',
          boxSizing: 'border-box', marginBottom: 12,
        }}
      />

      <div style={{ fontSize: 10, color: 'rgba(232,221,208,0.32)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>
        Biggest financial goal <span style={{ color: 'rgba(232,221,208,0.2)' }}>(optional)</span>
      </div>
      <input
        value={goal}
        onChange={e => setGoal(e.target.value)}
        onKeyDown={onKey}
        placeholder='e.g. Save a £5,000 emergency fund'
        style={{
          width: '100%', background: 'rgba(255,255,255,0.05)',
          border: '0.5px solid rgba(232,221,208,0.12)',
          borderRadius: 14, padding: '14px 18px',
          color: '#E8DDD0', WebkitTextFillColor: '#E8DDD0',
          fontSize: 15, fontWeight: 300, outline: 'none',
          fontFamily: 'inherit', WebkitAppearance: 'none',
          boxSizing: 'border-box', marginBottom: 14,
        }}
      />

      <button
        onClick={submit}
        style={{
          width: '100%', padding: '14px 0',
          background: payday.trim() ? 'rgba(200,184,154,0.18)' : 'rgba(232,221,208,0.05)',
          border: `1px solid ${payday.trim() ? 'rgba(200,184,154,0.42)' : 'rgba(232,221,208,0.1)'}`,
          borderRadius: 14, color: payday.trim() ? '#C8B89A' : 'rgba(232,221,208,0.3)',
          fontSize: 15, fontWeight: 700, cursor: payday.trim() ? 'pointer' : 'default',
          fontFamily: 'inherit', letterSpacing: '0.03em',
        }}
      >
        Build my picture →
      </button>
    </div>
  );
}
