import { useState, useRef, useEffect } from 'react';
import { getData } from '../storage';
import { t } from '../theme';
import Orb from '../Orb';

export default function Chat({ onBack }) {
  const [input, setInput]     = useState('');
  const [msgs, setMsgs]       = useState([{ role: 'vela', text: "Hey! What's on your mind? Ask me anything about your finances — I know your numbers." }]);
  const [loading, setLoading] = useState(false);
  const bottomRef             = useRef(null);
  const data                  = getData();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  function buildSysPrompt() {
    if (!data) return `You are Vela, a personal finance coach — direct, warm, no-nonsense. Give exactly 3 numbered actionable steps with specific £ amounts. End with: "⚖️ Guidance only — not FCA-regulated advice."`;
    const { income = 0, expenses = 0, debt = 0, goal = '' } = data;
    const surplus = income - expenses;
    return `You are Vela, a personal finance coach — the friend who actually knows finance. Direct, warm, no-nonsense.

CLIENT'S NUMBERS:
• Monthly income:   £${income.toFixed(0)}
• Monthly expenses: £${expenses.toFixed(0)}
• Monthly surplus:  £${surplus.toFixed(0)}${surplus < 0 ? ' (deficit)' : ''}
• Total debt:       ${debt > 0 ? `£${debt.toFixed(0)}` : 'none'}
• Main goal:        ${goal || 'not set'}

RULES — every response:
1. Give exactly 3 numbered, specific, actionable steps.
2. Always name £ amounts from the data above — no vague percentages.
3. Be personal and direct — call out wins, name gaps, give the fix.
4. Conversational tone — mate, not a formal report.
5. End with: "⚖️ Guidance only — not FCA-regulated advice."`;
  }

  async function send() {
    const val = input.trim();
    if (!val || loading) return;
    setInput('');
    setLoading(true);
    setMsgs(m => [...m, { role: 'user', text: val }]);
    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: buildSysPrompt(), messages: [{ role: 'user', content: val }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setMsgs(m => [...m, { role: 'vela', text: json.text }]);
    } catch {
      setMsgs(m => [...m, { role: 'vela', text: 'Something went wrong. Try again in a moment.' }]);
    } finally {
      setLoading(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.bg }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: `1px solid ${t.border}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: t.muted, fontSize: 26, cursor: 'pointer', padding: 0, lineHeight: 1, marginRight: 2 }}>‹</button>
        <Orb size={32} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: t.text }}>Vela</div>
          <div style={{ fontSize: 11, color: t.accent }}>● Always here</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
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
        {loading && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Orb size={26} />
            <TypingDots />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: `1px solid ${t.border}`, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask Vela anything..."
          style={{
            flex: 1, background: t.card, border: `1px solid ${t.border}`,
            borderRadius: 24, padding: '12px 16px', color: t.text,
            fontSize: 16, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={send} disabled={!input.trim() || loading} style={{
          width: 46, height: 46, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: input.trim() && !loading ? t.accent : 'rgba(255,255,255,0.09)',
          color: input.trim() && !loading ? '#0d1b2a' : t.muted,
          fontSize: 22, cursor: 'pointer', transition: 'all 0.15s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>›</button>
      </div>
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
