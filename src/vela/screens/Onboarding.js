import { useState, useEffect, useRef } from 'react';
import { parseAmount, parseDebt } from '../scoring';
import { saveData, saveInsights, markReady } from '../storage';
import { t } from '../theme';
import Orb from '../Orb';

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
  const [msgs, setMsgs]         = useState([]);
  const [step, setStep]         = useState(0);
  const [input, setInput]       = useState('');
  const [data, setData]         = useState({ income: 0, expenses: 0, debt: 0, goal: '' });
  const [building, setBuilding] = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    const tid = setTimeout(() => push('vela', Q[0].ask({})), 600);
    return () => clearTimeout(tid);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, building]);

  function push(role, text) {
    setMsgs(m => [...m, { role, text }]);
  }

  function send() {
    const val = input.trim();
    if (!val || building || step >= Q.length) return;
    setInput('');
    push('user', val);

    const nd = { ...data };
    if (step === 0)      nd.income   = parseAmount(val);
    else if (step === 1) nd.expenses = parseAmount(val);
    else if (step === 2) nd.debt     = parseDebt(val);
    else if (step === 3) nd.goal     = val;
    setData(nd);

    const next = step + 1;
    setStep(next);

    if (next < Q.length) {
      setTimeout(() => push('vela', Q[next].ask(nd)), 700);
    } else {
      setTimeout(() => {
        push('vela', 'Perfect. Give me a moment to build your financial picture ✨');
        setBuilding(true);
        buildPlan(nd);
      }, 700);
    }
  }

  async function buildPlan(d) {
    const { income, expenses, debt, goal } = d;
    const surplus   = income - expenses;
    const started   = Date.now();

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.bg }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Orb size={34} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Vela</div>
            <div style={{ fontSize: 11, color: t.accent }}>Setting up your plan</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: t.muted }}>{Math.min(step, Q.length)}/{Q.length}</div>
        </div>
        <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
          <div style={{
            height: '100%', background: t.accent, borderRadius: 2,
            width: `${(Math.min(step, Q.length) / Q.length) * 100}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
            {m.role === 'vela' && <Orb size={26} />}
            <div style={{
              maxWidth: '78%', padding: '10px 14px',
              fontSize: 15, lineHeight: 1.55, whiteSpace: 'pre-wrap',
              fontWeight: m.role === 'user' ? 500 : 400,
              background: m.role === 'user' ? t.accent : t.card,
              color:      m.role === 'user' ? '#0d1b2a' : t.text,
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            }}>{m.text}</div>
          </div>
        ))}
        {building && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Orb size={26} />
            <TypingDots />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!building && step < Q.length && (
        <div style={{ padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: `1px solid ${t.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={Q[step]?.ph || ''}
            style={{
              flex: 1, background: t.card, border: `1px solid ${t.border}`,
              borderRadius: 24, padding: '12px 16px', color: t.text,
              fontSize: 16, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button onClick={send} style={{
            width: 46, height: 46, borderRadius: '50%', border: 'none', flexShrink: 0,
            background: input.trim() ? t.accent : 'rgba(255,255,255,0.1)',
            color: input.trim() ? '#0d1b2a' : t.muted,
            fontSize: 22, cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>›</button>
        </div>
      )}
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, padding: '11px 14px', background: t.card, borderRadius: '16px 16px 16px 4px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: t.muted,
          animation: `vDot 1.3s ease-in-out ${i * 0.2}s infinite`,
        }} />
      ))}
      <style>{`@keyframes vDot { 0%,80%,100%{opacity:.3;transform:translateY(0)} 40%{opacity:1;transform:translateY(-4px)} }`}</style>
    </div>
  );
}
