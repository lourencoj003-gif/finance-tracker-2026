import { useState, useEffect, useRef } from 'react';
import { parseAmount, parseDebt } from '../scoring';
import { saveData, saveInsights, markReady } from '../storage';

const PURPLE = '#7F77DD';
const BG     = '#0a0a0f';

const KEYFRAMES = `
  @keyframes orbIdle {
    0%,100% { transform: scale(1);    filter: brightness(1); }
    50%     { transform: scale(1.06); filter: brightness(1.14); }
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
`;

const ORB_CFG = {
  idle: {
    bg:   `radial-gradient(circle at 35% 35%, #b0acee, ${PURPLE} 55%, #3a369e)`,
    glow: `0 0 40px 12px rgba(127,119,221,0.42), 0 0 90px 35px rgba(127,119,221,0.14)`,
    anim: 'orbIdle 3s ease-in-out infinite',
  },
  thinking: {
    bg:   `radial-gradient(circle at 35% 35%, #8a86d5, ${PURPLE} 55%, #27246a)`,
    glow: `0 0 28px 8px rgba(127,119,221,0.28), 0 0 60px 20px rgba(127,119,221,0.08)`,
    anim: 'orbThinking 2.2s ease-in-out infinite',
  },
  speaking: {
    bg:   `radial-gradient(circle at 35% 35%, #cac7f8, ${PURPLE} 55%, #5250c0)`,
    glow: `0 0 72px 28px rgba(127,119,221,0.82), 0 0 150px 65px rgba(127,119,221,0.32)`,
    anim: 'orbSpeaking 0.42s ease-in-out infinite',
  },
};

const Q = [
  {
    ask: ()           => "Hi, I'm Vela 👋 I'm your personal finance coach — think of me as the friend who actually knows money.\n\nLet's build your picture. First: what's your monthly take-home pay?",
    ph:  'e.g. £2,500',
  },
  {
    ask: ({ income }) => `Got it — £${income.toFixed(0)}/month. Now roughly how much do you spend each month? Rent, food, transport, subscriptions — give me a total.`,
    ph:  'e.g. £1,800',
  },
  {
    ask: ({ income, expenses }) => {
      const s = income - expenses;
      return s >= 0
        ? `You're keeping £${s.toFixed(0)}/month — solid start. Any debts? Credit card, loan, overdraft. Give me the total or say "none".`
        : `Spending £${Math.abs(s).toFixed(0)} more than you earn right now — we'll fix that. Any debts on top? Or say "none".`;
    },
    ph: 'e.g. £3,000 or "none"',
  },
  {
    ask: () => "Got it. Last one — what's your main financial goal right now? Save for something, pay off debt, build an emergency fund — anything.",
    ph:  'e.g. Save a £5,000 emergency fund',
  },
];

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

export default function Onboarding({ onDone }) {
  const [step, setStep]           = useState(0);
  const [input, setInput]         = useState('');
  const [data, setData]           = useState({ income: 0, expenses: 0, debt: 0, goal: '' });
  const [building, setBuilding]   = useState(false);
  const [orbState, setOrbState]   = useState('idle');
  const [currentQ, setCurrentQ]   = useState('');
  const [cardKey, setCardKey]     = useState(0);

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
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    const q   = Q[0].ask({});
    const tid = setTimeout(() => { setCurrentQ(q); speak(q); }, 700);
    return () => clearTimeout(tid);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate  = 0.93;
    utter.pitch = 1.05;
    const fire = () => {
      const voices   = window.speechSynthesis.getVoices();
      const priority = ['Samantha', 'Victoria', 'Karen', 'Moira', 'Tessa', 'Fiona',
                        'Google UK English Female', 'Microsoft Zira'];
      const voice    = voices.find(v => priority.some(p => v.name.includes(p)))
                    || voices.find(v => /female/i.test(v.name))
                    || voices.find(v => v.lang === 'en-GB')
                    || voices.find(v => v.lang.startsWith('en'));
      if (voice) utter.voice = voice;
      utter.onstart = () => setOrbState('speaking');
      utter.onend   = () => setOrbState(buildingRef.current ? 'thinking' : 'idle');
      utter.onerror = () => setOrbState(buildingRef.current ? 'thinking' : 'idle');
      window.speechSynthesis.speak(utter);
    };
    window.speechSynthesis.getVoices().length > 0
      ? fire()
      : (window.speechSynthesis.onvoiceschanged = () => { fire(); window.speechSynthesis.onvoiceschanged = null; });
  }

  function send() {
    const val = input.trim();
    if (!val || building || step >= Q.length) return;
    setInput('');

    const nd = { ...data };
    if (step === 0)      nd.income   = parseAmount(val);
    else if (step === 1) nd.expenses = parseAmount(val);
    else if (step === 2) nd.debt     = parseDebt(val);
    else if (step === 3) nd.goal     = val;
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
      const finalMsg = 'Perfect. Give me a moment to build your financial picture ✨';
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

    const sysPrompt = `You are Vela, a personal finance coach. Respond with exactly 3 short financial insights as a JSON array. Each must be under 28 words, start with an action verb, and reference a specific £ amount. Format: ["insight1","insight2","insight3"] — nothing else.`;
    const userMsg   = `Monthly income: £${income}. Monthly expenses: £${expenses}. Surplus: £${surplus.toFixed(0)}. Total debt: £${debt}. Goal: ${goal}.`;

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
    await new Promise(r => setTimeout(r, Math.max(0, 2400 - elapsed)));
    onDone();
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const cfg = ORB_CFG[orbState] || ORB_CFG.idle;

  return (
    <div style={{ position: 'relative', height: '100vh', background: BG, overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* Progress dots */}
      <div style={{ position: 'absolute', top: 32, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 5 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: i < step ? 22 : 7, height: 7, borderRadius: 4,
            background: i < step ? PURPLE : 'rgba(255,255,255,0.15)',
            transition: 'all 0.4s ease',
          }} />
        ))}
      </div>

      {/* ── Orb section ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '48%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>

        {/* Orb */}
        <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {orbState === 'speaking' && [0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
              border: '1.5px solid rgba(127,119,221,0.48)',
              animation: `ripple 1.9s ease-out ${i * 0.63}s infinite`,
              pointerEvents: 'none',
            }} />
          ))}
          <div style={{
            width: 140, height: 140, borderRadius: '50%',
            background: cfg.bg,
            boxShadow: cfg.glow,
            animation: cfg.anim,
            transition: 'background 0.7s ease, box-shadow 0.7s ease',
          }} />
        </div>

        {/* Orb status */}
        <div style={{ minHeight: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {orbState === 'speaking' ? (
            <WaveBars />
          ) : orbState === 'thinking' ? (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: '0.5px', animation: 'blink 1.6s ease-in-out infinite' }}>
              {building ? 'Building your picture…' : 'Processing…'}
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, letterSpacing: '0.3px' }}>
              {!building && step < Q.length ? `Question ${step + 1} of ${Q.length}` : ''}
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
          bottom: (!building && step < Q.length) ? 86 : 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 20px',
        }}>
          <div
            key={cardKey}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 24,
              padding: '22px 24px',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              animation: 'cardIn 0.4s ease-out',
              boxShadow: '0 8px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(127,119,221,0.7)', marginBottom: 12, letterSpacing: '0.9px', textTransform: 'uppercase', fontWeight: 600 }}>
              Vela
            </div>
            <div style={{ fontSize: 16, color: '#eeeeff', lineHeight: 1.68, whiteSpace: 'pre-wrap', fontWeight: 400 }}>
              {currentQ}
            </div>
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      {!building && step < Q.length && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 86,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
          background: `linear-gradient(to top, ${BG} 65%, transparent)`,
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={Q[step]?.ph || ''}
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 22, padding: '11px 16px', color: '#fff', fontSize: 16,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button onClick={send} style={{
            width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: input.trim() ? 'rgba(127,119,221,0.22)' : 'rgba(255,255,255,0.05)',
            color: input.trim() ? PURPLE : 'rgba(255,255,255,0.18)',
            fontSize: 22, cursor: input.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
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
