import { useMemo, useState, useEffect, useRef } from "react";
import { MONTHS, fmt } from "../utils/helpers";
import { sectionTotal, monthlyNet } from "../utils/calculations";

/* ── Brand colours ───────────────────────────────────────────────── */
const G = "#1D9E75";   // green
const R = "#E24B4A";   // red
const B = "#378ADD";   // blue
const N = "#1a3a5c";   // navy
const P = "#7F77DD";   // purple
const AM = "#F5A623";  // amber (warning)

/* ── Financial tips (rotate every 6 s) ──────────────────────────── */
const TIPS = [
  "Save at least 20% of your take-home pay each month to build long-term financial security.",
  "The UK ISA allowance is £20,000 per tax year — max it out before 5 April.",
  "Emergency fund goal: 3–6 months of essential expenses in an easy-access savings account.",
  "At 7% annual growth, compound interest doubles your money roughly every 10 years (Rule of 72).",
  "Paying off high-interest debt above 5% is often better than investing — it's a guaranteed return.",
  "Automate your savings: set up a standing order on payday so the money leaves before you can spend it.",
  "Review your direct debits annually — the average UK adult wastes over £600/year on unused subscriptions.",
  "Pension contributions attract tax relief: a basic-rate taxpayer invests £100 for every £80 contributed.",
  "Diversify your investments: a global index fund gives exposure to thousands of companies at low cost.",
  "The Latte Factor: £4/day on coffee is £1,460/year — invested at 7% it grows to £9,800 in 5 years.",
];

/* ── Pure helpers ────────────────────────────────────────────────── */
function safe(n) {
  const v = Number(n);
  return isFinite(v) ? v : 0;
}

function pct(numerator, denominator) {
  if (!denominator) return 0;
  return safe((numerator / denominator) * 100);
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function fmtPct(n) {
  return safe(n).toFixed(1) + "%";
}

function fmtSigned(n) {
  return (n >= 0 ? "+" : "−") + fmt(Math.abs(n));
}

function compoundFV(monthlyPmt, years, annualRate = 0.07) {
  if (monthlyPmt <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return safe(monthlyPmt * ((Math.pow(1 + r, n) - 1) / r));
}

/* ════════════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════════════ */
export default function Dashboard({ data }) {
  /* ── Raw monthly arrays ── */
  const incArr = useMemo(() => sectionTotal(data.income),      [data.income]);
  const expArr = useMemo(() => sectionTotal(data.expenses),    [data.expenses]);
  const invArr = useMemo(() => sectionTotal(data.investments), [data.investments]);
  const netArr = useMemo(() => monthlyNet(data),               [data]);

  /* ── Annual totals ── */
  const yearInc = useMemo(() => safe(incArr.reduce((a, v) => a + v, 0)), [incArr]);
  const yearExp = useMemo(() => safe(expArr.reduce((a, v) => a + v, 0)), [expArr]);
  const yearInv = useMemo(() => safe(invArr.reduce((a, v) => a + v, 0)), [invArr]);
  const yearNet = useMemo(() => safe(netArr.reduce((a, v) => a + v, 0)), [netArr]);

  /* ── ISA remaining (UK 2026 allowance: £20,000) ── */
  const isaContrib = useMemo(() => {
    const row = data.investments?.["ISA"] || [];
    return safe(row.reduce((a, v) => a + (parseFloat(v) || 0), 0));
  }, [data.investments]);
  const isaRemaining = Math.max(0, 20000 - isaContrib);

  /* ── Rates ── */
  const savingsRate = pct(yearNet + yearInv, yearInc);
  const expPct      = pct(yearExp, yearInc);
  const invPct      = pct(yearInv, yearInc);
  const netPct      = pct(yearNet, yearInc);

  /* ── Compound growth ── */
  const monthlyContrib = safe(Math.max(0, (yearNet + yearInv) / 12));
  const growth1y = compoundFV(monthlyContrib, 1);
  const growth5y = compoundFV(monthlyContrib, 5);

  /* ── Emergency fund & health score ── */
  const emergencyFundTotal = useMemo(() => {
    const row = data.investments?.["Emergency Fund"] || [];
    return safe(row.reduce((a, v) => a + (parseFloat(v) || 0), 0));
  }, [data.investments]);
  const emergencyTarget = safe(yearExp / 12) * 3;
  const healthScore = Math.round(
    clamp(savingsRate / 20, 0, 1) * 40 +
    (emergencyTarget > 0 ? clamp(emergencyFundTotal / emergencyTarget, 0, 1) * 30 : 0) +
    clamp(isaContrib / 20000, 0, 1) * 30
  );

  /* ── Monthly contribution averages for roadmap ── */
  const efMonthly  = safe(emergencyFundTotal / 12);
  const isaMonthly = safe(isaContrib / 12);

  /* ── Cumulative net (running bank balance above break-even) ── */
  const cumulative = useMemo(() =>
    netArr.reduce((acc, v) => {
      acc.push(safe((acc[acc.length - 1] ?? 0) + v));
      return acc;
    }, []),
  [netArr]);

  /* ── Rotating tip ── */
  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(id);
  }, []);

  /* ── Spending pace ── */
  const spendingPace = useMemo(() => {
    const today      = new Date();
    const cd         = today.getDate();
    const cm         = today.getMonth();
    const dim        = new Date(today.getFullYear(), cm + 1, 0).getDate();
    const dp         = (cd / dim) * 100;
    const monthExp   = expArr[cm] || 0;
    const avg        = yearExp / 12;
    const sp         = avg > 0 ? (cd / dim) * (monthExp / avg) * 100 : 0;
    return { dayPct: dp, spendPct: sp, isAhead: sp > dp + 10, currentDay: cd, daysInMonth: dim };
  }, [expArr, yearExp]);

  /* ── Metric card colour helpers ── */
  const srColor  = savingsRate >= 20 ? G : savingsRate >= 10 ? AM : R;
  const netColor = yearNet >= 0 ? G : R;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── 0. Spending pace alert ────────────────────────────── */}
      <SpendingPaceAlert
        dayPct={spendingPace.dayPct}
        spendPct={spendingPace.spendPct}
        isAhead={spendingPace.isAhead}
        currentDay={spendingPace.currentDay}
        daysInMonth={spendingPace.daysInMonth}
      />

      {/* ── 1. Six metric cards ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12 }}>
        <MetricCard label="Annual Income"    value={fmt(yearInc)}         color={G}       sub="Total earned this year" />
        <MetricCard label="Annual Expenses"  value={fmt(yearExp)}         color={R}       sub="Total spent this year" />
        <MetricCard label="Total Invested"   value={fmt(yearInv)}         color={B}       sub="Across all investments" />
        <MetricCard label="Year Net"         value={fmtSigned(yearNet)}   color={netColor} sub={yearNet >= 0 ? "Cash surplus" : "Cash deficit"} />
        <MetricCard label="Savings Rate"     value={fmtPct(savingsRate)}  color={srColor} sub="Target: ≥ 20%" />
        <MetricCard label="ISA Remaining"    value={fmt(isaRemaining)}    color={P}       sub="of £20,000 allowance" />
      </div>

      {/* ── 1b. Health score + net worth ─────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <HealthScoreCircle score={healthScore} />
        <NetWorthCard yearInc={yearInc} yearExp={yearExp} />
      </div>

      {/* ── 1c. Goals tracker ────────────────────────────────────── */}
      <GoalsTracker
        isaContrib={isaContrib}
        emergencyFundTotal={emergencyFundTotal}
        emergencyTarget={emergencyTarget}
      />

      {/* ── 1d. Expense donut chart ──────────────────────────────── */}
      <ExpenseDonut expenses={data.expenses} />

      {/* ── 2. 50/30/20 Budget Analysis ─────────────────────────── */}
      <BudgetRule
        expPct={expPct}
        invPct={invPct}
        netPct={netPct}
        yearInc={yearInc}
        yearExp={yearExp}
        yearInv={yearInv}
        yearNet={yearNet}
      />

      {/* ── 3. 12-month summary table ───────────────────────────── */}
      <MonthlySummary
        incArr={incArr}
        expArr={expArr}
        invArr={invArr}
        netArr={netArr}
        cumulative={cumulative}
        yearInc={yearInc}
        yearExp={yearExp}
        yearInv={yearInv}
        yearNet={yearNet}
      />

      {/* ── 4. Compound growth projections ──────────────────────── */}
      <CompoundGrowth
        monthlyContrib={monthlyContrib}
        growth1y={growth1y}
        growth5y={growth5y}
      />

      {/* ── 4b. Financial roadmap ───────────────────────────────── */}
      <FinancialRoadmap
        efMonthly={efMonthly}
        efCurrent={emergencyFundTotal}
        efTarget={emergencyTarget}
        isaMonthly={isaMonthly}
        isaCurrent={isaContrib}
      />

      {/* ── 5. Rotating financial tip ───────────────────────────── */}
      <FinancialTip
        tip={TIPS[tipIdx]}
        idx={tipIdx}
        total={TIPS.length}
        onNext={() => setTipIdx(i => (i + 1) % TIPS.length)}
        onPrev={() => setTipIdx(i => (i - 1 + TIPS.length) % TIPS.length)}
      />

    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

/* ── Metric card ── */
function MetricCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 8,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: "14px 16px",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>{sub}</div>
    </div>
  );
}

/* ── 50/30/20 budget rule ── */
function BudgetRule({ expPct, invPct, netPct, yearInc, yearExp, yearInv, yearNet }) {
  const surplusPct  = Math.max(0, netPct);
  const savePct     = safe(invPct + surplusPct);          // invested + surplus
  const spendColor  = expPct <= 80 ? G : expPct <= 90 ? AM : R;
  const saveColor   = savePct >= 20 ? G : savePct >= 10 ? AM : R;

  /* Stacked bar segments — clamped & normalised so they fill 100% */
  const rawSegments = [
    { label: "Expenses",    raw: clamp(expPct,     0, 200), color: R },
    { label: "Investments", raw: clamp(invPct,     0, 200), color: B },
    { label: "Surplus",     raw: clamp(surplusPct, 0, 200), color: G },
  ];
  const total = rawSegments.reduce((a, s) => a + s.raw, 0) || 1;
  const segments = rawSegments.map(s => ({ ...s, pct: (s.raw / total) * 100 }));

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: N, marginBottom: 4 }}>50 / 30 / 20 Budget Analysis</div>
      <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
        Guideline: spend ≤ 80% of income, save/invest ≥ 20%
      </div>

      {/* Stacked income-allocation bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Income allocation</div>
        <div style={{ display: "flex", height: 30, borderRadius: 6, overflow: "hidden", border: "1px solid #e0e0e0" }}>
          {segments.map(s => (
            <div
              key={s.label}
              title={`${s.label}: ${fmtPct(s.pct)}`}
              style={{
                width: s.pct + "%",
                background: s.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#fff", fontWeight: 700,
                transition: "width 0.4s ease",
                overflow: "hidden", whiteSpace: "nowrap",
              }}
            >
              {s.pct > 9 ? fmtPct(s.pct) : ""}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 8, flexWrap: "wrap" }}>
          {segments.map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#555" }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              {s.label} — {fmtPct(s.raw)}
            </div>
          ))}
        </div>
      </div>

      {/* Individual rule bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <RuleBar
          label="Spending (Expenses)"
          actual={expPct}
          target={80}
          color={spendColor}
          targetLabel="≤80% target"
          flip
        />
        <RuleBar
          label="Saving &amp; Investing (Net + Invested)"
          actual={savePct}
          target={20}
          color={saveColor}
          targetLabel="≥20% target"
        />
      </div>
    </div>
  );
}

function RuleBar({ label, actual, target, color, targetLabel, flip }) {
  const barW  = clamp(actual, 0, 100);
  const tPos  = clamp(target, 0, 100);
  const onTrack = flip ? actual <= target : actual >= target;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: N }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>
          {fmtPct(actual)} {onTrack ? "✓" : "↑"}
        </span>
      </div>
      <div style={{ position: "relative", height: 10, background: "#f0f4f8", borderRadius: 5 }}>
        {/* Progress fill */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: barW + "%",
          background: color,
          borderRadius: 5,
          transition: "width 0.4s ease",
        }} />
        {/* Target marker */}
        <div style={{
          position: "absolute",
          top: -4, bottom: -4,
          left: tPos + "%",
          width: 2,
          background: N,
          borderRadius: 1,
          transform: "translateX(-50%)",
        }} />
      </div>
      <div style={{ position: "relative", height: 18 }}>
        <div style={{
          position: "absolute",
          left: tPos + "%",
          transform: "translateX(-50%)",
          fontSize: 10, color: "#999",
          whiteSpace: "nowrap",
          marginTop: 3,
        }}>
          {targetLabel}
        </div>
      </div>
    </div>
  );
}

/* ── 12-month summary table ── */
function MonthlySummary({ incArr, expArr, invArr, netArr, cumulative, yearInc, yearExp, yearInv, yearNet }) {
  const yearSR  = pct(yearNet + yearInv, yearInc);
  const yearCum = cumulative[11] ?? 0;

  const thStyle = (color, minW = 88) => ({
    padding: "8px 10px", textAlign: "right",
    borderBottom: "1px solid #e0e0e0",
    color, fontWeight: 600, minWidth: minW,
    whiteSpace: "nowrap",
  });

  const tdStyle = (extra = {}) => ({
    padding: "7px 10px", textAlign: "right",
    borderBottom: "1px solid #f0f0f0",
    color: "#333",
    whiteSpace: "nowrap",
    ...extra,
  });

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>
      <div style={{ padding: "12px 16px", fontWeight: 700, fontSize: 15, color: N, borderBottom: "1px solid #e0e0e0" }}>
        Monthly Summary
      </div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f5f7fa" }}>
              <th style={{ padding: "8px 12px", textAlign: "left", borderBottom: "1px solid #e0e0e0", position: "sticky", left: 0, background: "#f5f7fa", zIndex: 1, minWidth: 48, color: N }}>Month</th>
              <th style={thStyle(G)}>Income</th>
              <th style={thStyle(R)}>Expenses</th>
              <th style={thStyle(B)}>Invested</th>
              <th style={thStyle(N)}>Net</th>
              <th style={thStyle(P, 76)}>Save&nbsp;%</th>
              <th style={{ ...thStyle("#555", 100), paddingRight: 14 }}>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((m, i) => {
              const net = netArr[i];
              const inc = incArr[i];
              const exp = expArr[i];
              const inv = invArr[i];
              const cum = cumulative[i];
              const sr  = pct(net + inv, inc);
              const rowBg = i % 2 === 0 ? "#fff" : "#f9fafc";

              return (
                <tr key={m} style={{ background: rowBg }}>
                  <td style={{ padding: "7px 12px", borderBottom: "1px solid #f0f0f0", fontWeight: 700, color: N, position: "sticky", left: 0, background: rowBg, zIndex: 1 }}>{m}</td>
                  <td style={tdStyle()}>{inc > 0 ? fmt(inc) : "—"}</td>
                  <td style={tdStyle()}>{exp > 0 ? fmt(exp) : "—"}</td>
                  <td style={tdStyle()}>{inv > 0 ? fmt(inv) : "—"}</td>
                  <td style={tdStyle({ fontWeight: 600, color: net >= 0 ? G : R })}>{fmtSigned(net)}</td>
                  <td style={tdStyle({ color: inc > 0 ? (sr >= 20 ? G : sr >= 10 ? AM : R) : "#aaa", fontWeight: 500 })}>
                    {inc > 0 ? fmtPct(sr) : "—"}
                  </td>
                  <td style={{ ...tdStyle({ fontWeight: 500, color: cum >= 0 ? G : R }), paddingRight: 14 }}>
                    {fmtSigned(cum)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0f4f8", fontWeight: 700 }}>
              <td style={{ padding: "9px 12px", borderTop: "2px solid #d0d8e0", color: N, position: "sticky", left: 0, background: "#f0f4f8", zIndex: 1 }}>Year</td>
              <td style={{ ...thStyle(G), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmt(yearInc)}</td>
              <td style={{ ...thStyle(R), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmt(yearExp)}</td>
              <td style={{ ...thStyle(B), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmt(yearInv)}</td>
              <td style={{ ...thStyle(yearNet >= 0 ? G : R), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmtSigned(yearNet)}</td>
              <td style={{ ...thStyle(yearSR >= 20 ? G : yearSR >= 10 ? AM : R, 76), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>
                {yearInc > 0 ? fmtPct(yearSR) : "—"}
              </td>
              <td style={{ ...thStyle(yearCum >= 0 ? G : R, 100), borderTop: "2px solid #d0d8e0", borderBottom: "none", paddingRight: 14 }}>
                {fmtSigned(yearCum)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Compound growth projections ── */
function CompoundGrowth({ monthlyContrib, growth1y, growth5y }) {
  const totalContrib5y = monthlyContrib * 60;
  const interestEarned = safe(growth5y - totalContrib5y);
  const noContrib      = monthlyContrib === 0;

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: N, marginBottom: 4 }}>Compound Growth Projections</div>
      <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
        {noContrib
          ? "No monthly surplus to invest — reduce expenses or increase income to see projections."
          : `Based on ${fmt(monthlyContrib)}/month invested at 7% annual growth (historic global equity average)`}
      </div>

      {noContrib ? (
        <div style={{ background: "#fff5f5", border: `1px solid ${R}`, borderRadius: 6, padding: "12px 14px", fontSize: 13, color: R }}>
          Your current monthly surplus is £0 or less. The projections will appear once you have a positive net balance after expenses.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 12 }}>
            <GrowthCard label="After 1 Year"    value={fmt(growth1y)}      sub={`${fmt(monthlyContrib * 12)} contributed`} color={B} />
            <GrowthCard label="After 5 Years"   value={fmt(growth5y)}      sub={`${fmt(totalContrib5y)} contributed`}      color={P} />
            <GrowthCard label="Interest Earned"  value={fmt(interestEarned)} sub="over 5 years at 7%"                      color={G} />
          </div>
          <div style={{ fontSize: 11, color: "#bbb" }}>
            Uses future value of annuity formula (end-of-period). Assumes constant contributions and a fixed 7% p.a. return. Past performance does not guarantee future results.
          </div>
        </>
      )}
    </div>
  );
}

function GrowthCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#f5f7fa", borderRadius: 8, padding: "14px 16px", borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ── Rotating financial tip ── */
function FinancialTip({ tip, idx, total, onNext, onPrev }) {
  return (
    <div style={{ background: N, borderRadius: 8, padding: 20, color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Financial Tip {idx + 1} / {total}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <TipBtn onClick={onPrev} label="‹ Prev" />
          <TipBtn onClick={onNext} label="Next ›" />
        </div>
      </div>

      <div style={{ fontSize: 14, lineHeight: 1.7, minHeight: 44 }}>{tip}</div>

      {/* Dot progress indicators */}
      <div style={{ display: "flex", gap: 5, marginTop: 14, justifyContent: "center" }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            width: i === idx ? 18 : 6,
            height: 6,
            borderRadius: 3,
            background: i === idx ? "#fff" : "rgba(255,255,255,0.3)",
            transition: "width 0.3s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

function TipBtn({ onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 4,
        color: "#fff", fontSize: 12, padding: "4px 10px", cursor: "pointer",
        fontWeight: 600, lineHeight: 1.4,
      }}
    >
      {label}
    </button>
  );
}

/* ── Expense donut chart ── */
const CATEGORY_COLORS = {
  "Housing":         "#5DCAA5",
  "Food":            "#378ADD",
  "Transport":       "#7F77DD",
  "Entertainment":   "#D4537E",
  "Clothing":        "#EF9F27",
  "Health":          "#639922",
  "Monthly Sub":     "#D85A30",
  "Semi-Annual Sub": "#A32D2D",
  "Date Night":      "#1a3a5c",
  "Other":           "#888780",
};

function ExpenseDonut({ expenses }) {
  const canvasRef = useRef(null);

  const segments = useMemo(() => {
    const cm = new Date().getMonth();
    return Object.entries(expenses || {})
      .map(([name, vals]) => ({
        name,
        value: parseFloat(vals[cm]) || 0,
        color: CATEGORY_COLORS[name] || "#ccc",
      }))
      .filter(s => s.value > 0);
  }, [expenses]);

  const total = useMemo(() => segments.reduce((a, s) => a + s.value, 0), [segments]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = 100, cy = 100, outerR = 90, innerR = 60;

    ctx.clearRect(0, 0, 200, 200);

    if (total === 0 || segments.length === 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
      ctx.fillStyle = "#f0f4f8";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
      ctx.fillStyle = "#fff";
      ctx.fill();
      return;
    }

    let startAngle = -Math.PI / 2;
    const gap = segments.length > 1 ? 0.025 : 0;

    segments.forEach(seg => {
      const slice = (seg.value / total) * 2 * Math.PI;
      const a0 = startAngle + gap / 2;
      const a1 = startAngle + slice - gap / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, a0, a1);
      ctx.arc(cx, cy, innerR, a1, a0, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      startAngle += slice;
    });

    /* Centre label */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = N;
    ctx.font = "bold 15px system-ui,sans-serif";
    ctx.fillText("£" + Math.round(total).toLocaleString("en-GB"), cx, cy - 7);
    ctx.font = "10px system-ui,sans-serif";
    ctx.fillStyle = "#999";
    ctx.fillText("this month", cx, cy + 9);
  }, [segments, total]);

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: N, marginBottom: 16 }}>Expense Breakdown</div>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <canvas ref={canvasRef} width={200} height={200} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 140, display: "flex", flexDirection: "column", gap: 7, paddingTop: 4 }}>
          {segments.map(seg => (
            <div key={seg.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, color: "#555" }}>{seg.name}</span>
              <span style={{ fontWeight: 600, color: N }}>£{Math.round(seg.value).toLocaleString("en-GB")}</span>
            </div>
          ))}
          {segments.length === 0 && (
            <div style={{ fontSize: 13, color: "#aaa" }}>No expenses this month</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Spending pace alert ── */
function SpendingPaceAlert({ dayPct, spendPct, isAhead, currentDay, daysInMonth }) {
  const bg     = isAhead ? "#fff5f5" : "#f0faf5";
  const border = isAhead ? R : G;
  const color  = isAhead ? R : G;
  const icon   = isAhead ? "⚠" : "✓";
  const msg    = isAhead
    ? "You are spending ahead of pace — slow down to hit your monthly budget."
    : "You are on track with your spending this month.";

  return (
    <div style={{
      background: bg, border: `1px solid ${border}`, borderRadius: 8,
      padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ fontSize: 18, color, flexShrink: 0, marginTop: 1 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color, fontSize: 14, marginBottom: 4 }}>{msg}</div>
        <div style={{ fontSize: 12, color: "#666" }}>
          Day {currentDay} of {daysInMonth} ({Math.round(dayPct)}% through the month)
          {" · "}Spending pace: {Math.round(spendPct)}% of monthly average
        </div>
      </div>
    </div>
  );
}

/* ── Financial roadmap ── */
function FinancialRoadmap({ efMonthly, efCurrent, efTarget, isaMonthly, isaCurrent }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: N, marginBottom: 4 }}>Financial Roadmap</div>
      <div style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
        Estimated milestone dates based on current monthly contributions
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 }}>
        <MilestoneCard
          name="Emergency Fund Complete"
          monthly={efMonthly}
          current={efCurrent}
          target={efTarget}
        />
        <MilestoneCard
          name="ISA Full"
          monthly={isaMonthly}
          current={isaCurrent}
          target={20000}
        />
      </div>
    </div>
  );
}

function MilestoneCard({ name, monthly, current, target }) {
  let dateStr;
  if (target <= 0) {
    dateStr = "—";
  } else if (current >= target) {
    dateStr = "Complete!";
  } else if (monthly <= 0) {
    dateStr = "Not yet started";
  } else {
    const monthsLeft = Math.ceil((target - current) / monthly);
    const now        = new Date();
    const totalMos   = now.getMonth() + monthsLeft;
    const yr         = now.getFullYear() + Math.floor(totalMos / 12);
    const mo         = totalMos % 12;
    const MO_NAMES   = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    dateStr = MO_NAMES[mo] + " " + yr;
  }

  const isComplete  = target > 0 && current >= target;
  const accentColor = isComplete ? G : monthly > 0 ? B : "#aaa";

  return (
    <div style={{ background: "#f5f7fa", borderRadius: 8, padding: 16, borderLeft: `3px solid ${accentColor}` }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
        {name}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: accentColor, marginBottom: 10 }}>{dateStr}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 12, color: "#666" }}>Monthly contribution: <strong>{monthly > 0 ? fmt(monthly) : "£0"}</strong></div>
        <div style={{ fontSize: 12, color: "#666" }}>Target: <strong>{fmt(target)}</strong></div>
        <div style={{ fontSize: 12, color: "#666" }}>Saved so far: <strong>{fmt(current)}</strong></div>
      </div>
    </div>
  );
}

/* ── Goals tracker ── */
function GoalsTracker({ isaContrib, emergencyFundTotal, emergencyTarget }) {
  const isaTarget = 20000;
  const isaPct = Math.min(100, isaTarget > 0 ? (isaContrib / isaTarget) * 100 : 0);
  const efPct  = Math.min(100, emergencyTarget > 0 ? (emergencyFundTotal / emergencyTarget) * 100 : 0);

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", padding: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: N, marginBottom: 16 }}>Goals Tracker</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <GoalBar
          label="Emergency Fund"
          current={emergencyFundTotal}
          target={emergencyTarget}
          pct={efPct}
          sub={`3 months expenses — target ${fmt(emergencyTarget)}`}
        />
        <GoalBar
          label="ISA"
          current={isaContrib}
          target={isaTarget}
          pct={isaPct}
          sub="Annual allowance — target £20,000"
        />
      </div>
    </div>
  );
}

function GoalBar({ label, current, target, pct, sub }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: N }}>{label}</span>
        <span style={{ fontSize: 13, color: "#555" }}>{fmt(current)} / {fmt(target)}</span>
      </div>
      <div style={{ height: 10, background: "#f0f4f8", borderRadius: 5, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: pct + "%",
          background: "#1D9E75",
          borderRadius: 5,
          transition: "width 0.4s ease",
        }} />
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: "#aaa" }}>{sub} — {pct.toFixed(1)}% complete</div>
    </div>
  );
}

/* ── Financial health score circle ── */
function HealthScoreCircle({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? G : score >= 40 ? AM : R;
  const label = score >= 70 ? "Great" : score >= 40 ? "Fair" : "Needs Work";

  return (
    <div style={{
      background: "#fff", borderRadius: 8,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: 20, display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 12 }}>
        Financial Health Score
      </div>
      <svg width={128} height={128} viewBox="0 0 128 128">
        <circle cx={64} cy={64} r={radius} fill="none" stroke="#f0f4f8" strokeWidth={12} />
        <circle
          cx={64} cy={64} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x={64} y={58} textAnchor="middle" dominantBaseline="middle" fontSize={28} fontWeight={700} fill={color}>{score}</text>
        <text x={64} y={84} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="#999">{label}</text>
      </svg>
      <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 4 }}>
        Savings rate · emergency fund · ISA
      </div>
    </div>
  );
}

/* ── Net worth summary card ── */
function NetWorthCard({ yearInc, yearExp }) {
  const surplus = yearInc - yearExp;
  const color = surplus >= 0 ? G : R;

  return (
    <div style={{
      background: "#fff", borderRadius: 8,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: 20,
    }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
        Net Worth Summary
      </div>
      <div style={{ fontSize: 11, color: "#bbb", marginBottom: 16 }}>Annual income minus expenses</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: "#666" }}>Total Income</span>
          <span style={{ fontWeight: 600, color: G }}>{fmt(yearInc)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
          <span style={{ color: "#666" }}>Total Expenses</span>
          <span style={{ fontWeight: 600, color: R }}>{fmt(yearExp)}</span>
        </div>
        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, display: "flex", justifyContent: "space-between", fontSize: 16 }}>
          <span style={{ fontWeight: 700, color: N }}>Net</span>
          <span style={{ fontWeight: 700, color }}>{surplus >= 0 ? "+" : "−"}{fmt(Math.abs(surplus))}</span>
        </div>
      </div>
    </div>
  );
}
