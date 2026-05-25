// DetailView — lazy-loaded on first swipe-up from dashboard.
// Extracted from VelaCore.js for bundle splitting.

const PURPLE = '#C8B89A';
const BLUE   = '#A89880';
const GREEN  = '#7CAE9E';
const AMBER  = '#C9A96E';
const RED    = '#E24B4A';
const BG     = '#111318';

export default function DetailView({ income, expenses, debt, goal, insights, surplus, goals, savings, debts, onClose }) {
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
