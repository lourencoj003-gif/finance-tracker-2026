import { useState } from 'react';
import { getData, getInsights, clearAll } from '../storage';
import { calcHealthScore, scoreColor, scoreLabel } from '../scoring';
import { t } from '../theme';
import Orb from '../Orb';

export default function Home({ onChat, onReset }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const data     = getData() || {};
  const insights = getInsights() || [];
  const { income = 0, expenses = 0, debt = 0, goal = '' } = data;
  const surplus  = income - expenses;
  const health   = calcHealthScore({ income, expenses, debt });
  const sc       = scoreColor(health);

  function doReset() {
    clearAll();
    onReset();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: t.bg }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>

        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '20px 20px 10px', gap: 10 }}>
          <Orb size={30} />
          <span style={{ fontSize: 18, fontWeight: 800, color: t.text, letterSpacing: '-0.5px' }}>Vela</span>
          <button onClick={() => setConfirmReset(true)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: t.muted, fontSize: 12, cursor: 'pointer', padding: '4px 8px' }}>
            Reset
          </button>
        </div>

        {/* Net position hero */}
        <div style={{ margin: '10px 20px 14px', padding: '28px 24px', background: t.card, borderRadius: 22, border: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 8 }}>
            Monthly net position
          </div>
          <div style={{ fontSize: 58, fontWeight: 900, letterSpacing: '-3px', lineHeight: 1, color: surplus >= 0 ? t.success : t.danger }}>
            {surplus >= 0 ? '+' : '−'}£{Math.abs(surplus).toFixed(0)}
          </div>
          <div style={{ display: 'flex', gap: 28, marginTop: 18 }}>
            <Stat label="Income"   value={`£${income.toFixed(0)}`} />
            <Stat label="Expenses" value={`£${expenses.toFixed(0)}`} />
            {debt > 0 && <Stat label="Debt" value={`£${debt.toFixed(0)}`} color={t.danger} />}
          </div>
        </div>

        {/* Health score */}
        <div style={{ margin: '0 20px 14px', padding: '20px 24px', background: t.card, borderRadius: 22, border: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 20 }}>
          <ScoreRing score={health} color={sc} />
          <div>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 4 }}>Financial health</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: sc }}>{scoreLabel(health)}</div>
            {goal ? <div style={{ fontSize: 13, color: t.muted, marginTop: 3 }}>Goal: {goal}</div> : null}
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div style={{ margin: '0 20px 14px' }}>
            <div style={{ fontSize: 11, color: t.muted, letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600, marginBottom: 12 }}>
              Vela's insights
            </div>
            {insights.map((ins, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '14px 16px', background: t.card, borderRadius: 16, border: `1px solid ${t.border}`, marginBottom: 10 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: t.accentBg, color: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: 14, color: t.text, lineHeight: 1.55 }}>{ins}</div>
              </div>
            ))}
          </div>
        )}

        {/* Ask Vela CTA */}
        <button onClick={onChat} style={{ margin: '0 20px', width: 'calc(100% - 40px)', padding: '16px 20px', background: t.accentBg, border: `1px solid ${t.accent}30`, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
          <Orb size={26} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: t.accent }}>Ask Vela anything</div>
            <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>Personalised advice based on your numbers</div>
          </div>
          <div style={{ color: t.accent, fontSize: 22, lineHeight: 1 }}>›</div>
        </button>

      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: t.maxW,
        background: t.card, borderTop: `1px solid ${t.border}`,
        display: 'flex', paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        <NavItem icon="⊙" label="Home" active />
        <NavItem icon="💬" label="Chat" onClick={onChat} />
      </div>

      {/* Reset confirmation */}
      {confirmReset && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}>
          <div style={{ background: t.card, borderRadius: 22, padding: 28, border: `1px solid ${t.border}`, width: '100%', maxWidth: 320, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: t.text, marginBottom: 10 }}>Reset Vela?</div>
            <div style={{ fontSize: 14, color: t.muted, marginBottom: 28, lineHeight: 1.55 }}>
              This will delete your financial data and PIN. You'll need to start from scratch.
            </div>
            <button onClick={doReset} style={{ width: '100%', padding: 14, background: t.danger, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}>
              Yes, reset everything
            </button>
            <button onClick={() => setConfirmReset(false)} style={{ width: '100%', padding: 14, background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 12, color: t.muted, fontSize: 15, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: t.muted, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: color || t.text }}>{value}</div>
    </div>
  );
}

function ScoreRing({ score, color }) {
  const r = 28, circ = 2 * Math.PI * r;
  return (
    <svg width={72} height={72} style={{ flexShrink: 0 }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle
        cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill={color} fontSize={18} fontWeight={800}>
        {score}
      </text>
    </svg>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, color: active ? t.accent : t.muted }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: active ? 600 : 400 }}>{label}</div>
    </button>
  );
}
