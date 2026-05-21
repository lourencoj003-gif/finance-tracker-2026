import { useState, useEffect, useRef } from 'react';
import { parseAmount, parseDebt } from '../scoring';
import { saveData, saveInsights, markReady } from '../storage';
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
  const m = val.match(/\b(\d{1,2})\b/);
  return m ? Math.min(31, Math.max(1, parseInt(m[0], 10))) : 25;
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
  const [data, setData]         = useState({ name: '', income: 0, payday: 25, expenses: 0, expenseDetails: '', lifestyleSpend: '', debt: 0, goal: '', savings: 0 });
  const [building, setBuilding] = useState(false);
  const [orbState, setOrbState] = useState('idle');
  const [currentQ, setCurrentQ] = useState('');
  const [cardKey, setCardKey]   = useState(0);
  const [expanding, setExpanding] = useState(false);
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

  function send() {
    const val = input.trim();
    if (!val || building || step >= Q.length) return;
    setInput('');

    const nd = { ...data };
    if      (step === 0) { nd.name = val; localStorage.setItem('vela_name', val); localStorage.setItem('userName', val); }
    else if (step === 1) { nd.income = parseAmount(val); }
    else if (step === 2) { nd.payday = parsePayday(val); }
    else if (step === 3) { nd.expenses = parseAmount(val); nd.expenseDetails = val; }
    else if (step === 4) { nd.lifestyleSpend = val; }
    else if (step === 5) { nd.debt = parseDebt(val); }
    else if (step === 6) { nd.goal = val; }
    else if (step === 7) { nd.savings = parseSavings(val); }
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
    const surplus = income - expenses;
    const started = Date.now();

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

    const elapsed = Date.now() - started;
    await new Promise(r => setTimeout(r, Math.max(0, 1800 - elapsed)));

    setExpanding(true);
    setTimeout(onDone, 1600);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const containerH = vpH ? `${vpH}px` : '100dvh';

  return (
    <div style={{ position: 'relative', height: containerH, background: BG, overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* Progress dots */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 7, zIndex: 5 }}>
        {Q.map((_, i) => (
          <div key={i} style={{
            width: i < step ? 18 : 6, height: 6, borderRadius: 3,
            background: i < step ? PURPLE : 'rgba(232,221,208,0.15)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

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

      {/* ── Input bar ── */}
      {!building && step < Q.length && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', gap: 10,
          paddingTop: 12, paddingBottom: 'max(14px, calc(env(safe-area-inset-bottom) + 8px))',
          paddingLeft: 16, paddingRight: 16,
          background: BG,
          borderTop: '1px solid rgba(232,221,208,0.06)',
          boxSizing: 'border-box',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={Q[step]?.ph || ''}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '0.5px solid rgba(232,221,208,0.2)',
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
            fontSize: 22, cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
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
