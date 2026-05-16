import { useMemo, useState, useEffect, useRef } from "react";
import { MONTHS, fmt } from "../utils/helpers";
import { sectionTotal, monthlyNet } from "../utils/calculations";

/* ── Brand colours ───────────────────────────────────────────────── */
const G  = "#1D9E75";
const R  = "#E24B4A";
const B  = "#378ADD";
const N  = "#1a3a5c";
const P  = "#7F77DD";
const AM = "#F5A623";

/* ── Animation keyframes ─────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes celebPulse {
    0%   { transform: translate(-50%,-50%) scale(0.8); opacity: 0.9; }
    100% { transform: translate(-50%,-50%) scale(3);   opacity: 0;   }
  }
  @keyframes ringDraw {
    from { stroke-dashoffset: var(--ring-start, 339); }
    to   { stroke-dashoffset: var(--ring-end, 0); }
  }
  button { transition: transform 0.15s ease; }
  button:active { transform: scale(0.95); }
`;

/* ── Greeting tips (rotate by day of week) ───────────────────────── */
const GREETING_TIPS = [
  "Check if any subscriptions can be cancelled this month.",
  "Move surplus cash to your ISA before 5 April.",
  "Your emergency fund target is 3–6 months of expenses.",
  "Automate a standing order on payday — out of sight, out of mind.",
  "Paying off high-interest debt above 5% beats most investments.",
  "A global index fund gives exposure to 3,000+ companies at low cost.",
  "Small cuts compound — £10/day saved is £3,650 extra per year.",
];

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
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function fmtPct(n)  { return safe(n).toFixed(1) + "%"; }
function fmtSigned(n) { return (n >= 0 ? "+" : "−") + fmt(Math.abs(n)); }
function compoundFV(monthlyPmt, years, annualRate = 0.07) {
  if (monthlyPmt <= 0) return 0;
  const r = annualRate / 12;
  const n = years * 12;
  return safe(monthlyPmt * ((Math.pow(1 + r, n) - 1) / r));
}

/* ── Shared section title ────────────────────────────────────────── */
function SectionTitle({ children, color = B, sub }) {
  return (
    <div style={{ marginBottom: sub ? 4 : 20 }}>
      <div style={{
        fontSize: 18, fontWeight: 800, color: N,
        borderLeft: `4px solid ${color}`,
        paddingLeft: 12, lineHeight: 1.2, letterSpacing: "-0.01em",
      }}>
        {children}
      </div>
      {sub && <div style={{ fontSize: 12, color: "#999", marginTop: 4, paddingLeft: 16 }}>{sub}</div>}
    </div>
  );
}

/* ── Subtle divider ──────────────────────────────────────────────── */
function Divider() {
  return <div style={{ height: 1, background: "rgba(26,58,92,0.07)", borderRadius: 1, margin: "4px 0" }} />;
}

/* ════════════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════════════ */
export default function Dashboard({ data }) {
  const incArr = useMemo(() => sectionTotal(data.income),      [data.income]);
  const expArr = useMemo(() => sectionTotal(data.expenses),    [data.expenses]);
  const invArr = useMemo(() => sectionTotal(data.investments), [data.investments]);
  const netArr = useMemo(() => monthlyNet(data),               [data]);

  const yearInc = useMemo(() => safe(incArr.reduce((a, v) => a + v, 0)), [incArr]);
  const yearExp = useMemo(() => safe(expArr.reduce((a, v) => a + v, 0)), [expArr]);
  const yearInv = useMemo(() => safe(invArr.reduce((a, v) => a + v, 0)), [invArr]);
  const yearNet = useMemo(() => safe(netArr.reduce((a, v) => a + v, 0)), [netArr]);

  const isaContrib = useMemo(() => {
    const row = data.investments?.["ISA"] || [];
    return safe(row.reduce((a, v) => a + (parseFloat(v) || 0), 0));
  }, [data.investments]);
  const isaRemaining = Math.max(0, 20000 - isaContrib);

  const savingsRate = pct(yearNet + yearInv, yearInc);
  const expPct      = pct(yearExp, yearInc);
  const invPct      = pct(yearInv, yearInc);
  const netPct      = pct(yearNet, yearInc);

  const monthlyContrib = safe(Math.max(0, (yearNet + yearInv) / 12));
  const growth1y = compoundFV(monthlyContrib, 1);
  const growth5y = compoundFV(monthlyContrib, 5);

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

  const efMonthly  = safe(emergencyFundTotal / 12);
  const isaMonthly = safe(isaContrib / 12);

  const cumulative = useMemo(() =>
    netArr.reduce((acc, v) => {
      acc.push(safe((acc[acc.length - 1] ?? 0) + v));
      return acc;
    }, []),
  [netArr]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const [streak, setStreak] = useState(1);
  useEffect(() => {
    try {
      const today     = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const stored    = JSON.parse(localStorage.getItem("financeStreak") || "{}");
      let s = 1;
      if (stored.last === today) s = stored.streak || 1;
      else if (stored.last === yesterday) s = (stored.streak || 0) + 1;
      localStorage.setItem("financeStreak", JSON.stringify({ streak: s, last: today }));
      setStreak(s);
    } catch { /* private browsing */ }
  }, []);

  const [tipIdx, setTipIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTipIdx(i => (i + 1) % TIPS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const spendingPace = useMemo(() => {
    const today    = new Date();
    const cd       = today.getDate();
    const cm       = today.getMonth();
    const dim      = new Date(today.getFullYear(), cm + 1, 0).getDate();
    const dp       = (cd / dim) * 100;
    const monthExp = expArr[cm] || 0;
    const avg      = yearExp / 12;
    const sp       = avg > 0 ? (cd / dim) * (monthExp / avg) * 100 : 0;
    return { dayPct: dp, spendPct: sp, isAhead: sp > dp + 10, currentDay: cd, daysInMonth: dim };
  }, [expArr, yearExp]);

  const srColor  = savingsRate >= 20 ? G : savingsRate >= 10 ? AM : R;
  const netColor = yearNet >= 0 ? G : R;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <style>{GLOBAL_CSS}</style>

      {/* Spending pace — prominent banner at very top */}
      <SpendingPaceAlert
        dayPct={spendingPace.dayPct}
        spendPct={spendingPace.spendPct}
        isAhead={spendingPace.isAhead}
        currentDay={spendingPace.currentDay}
        daysInMonth={spendingPace.daysInMonth}
      />

      {/* Greeting + streak */}
      <GreetingCard streak={streak} />

      <Divider />

      {/* Six metric cards */}
      {isMobile ? (
        <div style={{
          display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
          gap: 12, padding: "4px 2px 12px",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
        }}>
          {[
            { label: "Annual Income",   rawValue: yearInc,      format: "currency", color: G,        sub: "Total earned this year" },
            { label: "Annual Expenses", rawValue: yearExp,      format: "currency", color: R,        sub: "Total spent this year" },
            { label: "Total Invested",  rawValue: yearInv,      format: "currency", color: B,        sub: "Across all investments" },
            { label: "Year Net",        rawValue: yearNet,      format: "signed",   color: netColor, sub: yearNet >= 0 ? "Cash surplus" : "Cash deficit" },
            { label: "Savings Rate",    rawValue: savingsRate,  format: "percent",  color: srColor,  sub: "Target: ≥ 20%", celebrate: savingsRate >= 20 },
            { label: "ISA Remaining",   rawValue: isaRemaining, format: "currency", color: P,        sub: "of £20,000 allowance" },
          ].map(card => (
            <div key={card.label} style={{ scrollSnapAlign: "start", flex: "0 0 calc(100vw - 32px)" }}>
              <MetricCard {...card} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
          <MetricCard label="Annual Income"   rawValue={yearInc}      format="currency" color={G}        sub="Total earned this year" />
          <MetricCard label="Annual Expenses" rawValue={yearExp}      format="currency" color={R}        sub="Total spent this year" />
          <MetricCard label="Total Invested"  rawValue={yearInv}      format="currency" color={B}        sub="Across all investments" />
          <MetricCard label="Year Net"        rawValue={yearNet}      format="signed"   color={netColor} sub={yearNet >= 0 ? "Cash surplus" : "Cash deficit"} />
          <MetricCard label="Savings Rate"    rawValue={savingsRate}  format="percent"  color={srColor}  sub="Target: ≥ 20%" celebrate={savingsRate >= 20} />
          <MetricCard label="ISA Remaining"   rawValue={isaRemaining} format="currency" color={P}        sub="of £20,000 allowance" />
        </div>
      )}

      <Divider />

      {/* Health score + net worth */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
        <HealthScoreCircle score={healthScore} />
        <NetWorthCard yearInc={yearInc} yearExp={yearExp} />
      </div>

      {/* Goals tracker */}
      <GoalsTracker
        isaContrib={isaContrib}
        emergencyFundTotal={emergencyFundTotal}
        emergencyTarget={emergencyTarget}
      />

      <Divider />

      {/* Expense donut */}
      <ExpenseDonut expenses={data.expenses} />

      {/* 50/30/20 Budget Analysis */}
      <BudgetRule
        expPct={expPct} invPct={invPct} netPct={netPct}
        yearInc={yearInc} yearExp={yearExp} yearInv={yearInv} yearNet={yearNet}
      />

      <Divider />

      {/* Monthly summary table */}
      <MonthlySummary
        incArr={incArr} expArr={expArr} invArr={invArr} netArr={netArr}
        cumulative={cumulative}
        yearInc={yearInc} yearExp={yearExp} yearInv={yearInv} yearNet={yearNet}
      />

      {/* Compound growth */}
      <CompoundGrowth monthlyContrib={monthlyContrib} growth1y={growth1y} growth5y={growth5y} />

      <Divider />

      {/* Financial roadmap */}
      <FinancialRoadmap
        efMonthly={efMonthly} efCurrent={emergencyFundTotal} efTarget={emergencyTarget}
        isaMonthly={isaMonthly} isaCurrent={isaContrib}
      />

      {/* Rotating tip */}
      <FinancialTip
        tip={TIPS[tipIdx]} idx={tipIdx} total={TIPS.length}
        onNext={() => setTipIdx(i => (i + 1) % TIPS.length)}
        onPrev={() => setTipIdx(i => (i - 1 + TIPS.length) % TIPS.length)}
      />

    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ════════════════════════════════════════════════════════════════════ */

/* ── Metric card (count-up + hover lift + celebration pulse) ── */
function MetricCard({ label, rawValue, format, color, sub, celebrate }) {
  const [displayed, setDisplayed] = useState(0);
  const [hovered, setHovered]     = useState(false);
  const animated                  = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;
    const target = Math.abs(rawValue || 0);
    if (target === 0) return;
    const steps = 24, interval = 33;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setDisplayed(target * eased);
      if (step >= steps) { setDisplayed(target); clearInterval(id); }
    }, interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  function fmtDisplayed() {
    const d = displayed, isNeg = rawValue < 0;
    if (format === "currency") return "£" + Math.round(d).toLocaleString("en-GB");
    if (format === "percent")  return d.toFixed(1) + "%";
    if (format === "signed")   return (isNeg ? "−" : "+") + "£" + Math.round(d).toLocaleString("en-GB");
    return Math.round(d).toString();
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff", borderRadius: 16,
        boxShadow: hovered ? "0 12px 36px rgba(0,0,0,0.14)" : "0 4px 20px rgba(0,0,0,0.08)",
        padding: "16px 18px", borderLeft: `4px solid ${color}`,
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "all 0.3s ease", position: "relative", overflow: "hidden", cursor: "default",
      }}
    >
      {celebrate && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 48, height: 48, borderRadius: "50%",
          border: "3px solid #1D9E75",
          animation: "celebPulse 1.6s ease-out infinite", pointerEvents: "none",
        }} />
      )}
      <div style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, letterSpacing: "-0.02em", marginBottom: 8 }}>{fmtDisplayed()}</div>
      <div style={{ fontSize: 11, color: "#bbb" }}>{sub}</div>
    </div>
  );
}

/* ── Greeting + streak card ── */
function GreetingCard({ streak }) {
  const h        = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  const tip      = GREETING_TIPS[new Date().getDay() % GREETING_TIPS.length];
  return (
    <div style={{
      background: "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)",
      borderRadius: 16, padding: "20px 24px", color: "#fff",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      gap: 16, boxShadow: "0 4px 20px rgba(26,58,92,0.25)", flexWrap: "wrap",
    }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em", marginBottom: 6 }}>{greeting} 👋</div>
        <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.6 }}>💡 {tip}</div>
      </div>
      <div style={{
        textAlign: "center", background: "rgba(255,255,255,0.12)",
        borderRadius: 14, padding: "14px 20px", minWidth: 90, flexShrink: 0,
      }}>
        <div style={{ fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{streak}</div>
        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>day streak</div>
        <div style={{ fontSize: 20, marginTop: 6 }}>🔥</div>
      </div>
    </div>
  );
}

/* ── Spending pace — prominent banner ── */
function SpendingPaceAlert({ dayPct, spendPct, isAhead, currentDay, daysInMonth }) {
  const bg      = isAhead
    ? "linear-gradient(135deg, #fff0f0 0%, #ffe4e4 100%)"
    : "linear-gradient(135deg, #f0faf6 0%, #e4f7ef 100%)";
  const border  = isAhead ? R : G;
  const color   = isAhead ? R : G;
  const icon    = isAhead ? "⚠️" : "✅";
  const heading = isAhead
    ? "Spending ahead of pace"
    : "On track this month";
  const detail  = isAhead
    ? `You've spent ${Math.round(spendPct)}% of your monthly average but are only ${Math.round(dayPct)}% through the month.`
    : `Day ${currentDay} of ${daysInMonth} — spending pace ${Math.round(spendPct)}% of monthly average.`;

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 16,
      padding: "18px 22px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: `0 4px 20px ${border}22`,
    }}>
      <div style={{ fontSize: 32, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, color, fontSize: 16, marginBottom: 4 }}>{heading}</div>
        <div style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{detail}</div>
      </div>
      {/* Pace bar */}
      <div style={{ flexShrink: 0, width: 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color }}>{Math.round(spendPct)}%</div>
        <div style={{ width: "100%", height: 6, background: "rgba(0,0,0,0.08)", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            width: `${Math.min(100, spendPct)}%`, height: "100%",
            background: color, borderRadius: 99, transition: "width 0.6s ease",
          }} />
        </div>
        <div style={{ fontSize: 10, color: "#999", fontWeight: 600 }}>of avg</div>
      </div>
    </div>
  );
}

/* ── Financial health score — animated ring on load ── */
function HealthScoreCircle({ score }) {
  const radius       = 56;
  const circumference = 2 * Math.PI * radius;
  const targetOffset  = circumference - (score / 100) * circumference;
  const [offset, setOffset] = useState(circumference);
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setOffset(targetOffset), 150);
    return () => clearTimeout(t1);
  }, [targetOffset]);

  useEffect(() => {
    const steps = 28, interval = 30;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setDisplayed(Math.round(score * eased));
      if (step >= steps) { setDisplayed(score); clearInterval(id); }
    }, interval);
    return () => clearInterval(id);
  }, [score]);

  const color = score >= 70 ? G : score >= 40 ? AM : R;
  const label = score >= 70 ? "Great" : score >= 40 ? "Fair" : "Needs Work";
  const bgColor = score >= 70 ? "#f0faf6" : score >= 40 ? "#fffbf0" : "#fff5f5";

  return (
    <div style={{
      background: bgColor, borderRadius: 16,
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      padding: 24, display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <SectionTitle color={color}>Health Score</SectionTitle>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {/* Track */}
        <circle cx={70} cy={70} r={radius} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={14} />
        {/* Animated fill */}
        <circle
          cx={70} cy={70} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
        {/* Glow layer */}
        <circle
          cx={70} cy={70} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          opacity={0.25}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.34,1.56,0.64,1)", filter: "blur(4px)" }}
        />
        <text x={70} y={64} textAnchor="middle" dominantBaseline="middle" fontSize={32} fontWeight={800} fill={color}>{displayed}</text>
        <text x={70} y={90} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={600} fill="#999">{label}</text>
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
  const color   = surplus >= 0 ? G : R;
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24 }}>
      <SectionTitle color={color}>Net Worth</SectionTitle>
      <div style={{ fontSize: 12, color: "#bbb", marginBottom: 20, paddingLeft: 16 }}>Annual income minus expenses</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f0faf6", borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: "#555" }}>Total Income</span>
          <span style={{ fontWeight: 700, color: G, fontSize: 15 }}>{fmt(yearInc)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#fff5f5", borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: "#555" }}>Total Expenses</span>
          <span style={{ fontWeight: 700, color: R, fontSize: 15 }}>{fmt(yearExp)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: surplus >= 0 ? "#f0faf6" : "#fff5f5", borderRadius: 10, border: `1.5px solid ${color}` }}>
          <span style={{ fontWeight: 800, color: N, fontSize: 15 }}>Net</span>
          <span style={{ fontWeight: 800, color, fontSize: 20 }}>{surplus >= 0 ? "+" : "−"}{fmt(Math.abs(surplus))}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Goals tracker — gradient cards with animated fill ── */
function GoalsTracker({ isaContrib, emergencyFundTotal, emergencyTarget }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24 }}>
      <SectionTitle color={G} sub="Progress towards your financial goals">Goals Tracker</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        <GoalCard
          label="Emergency Fund"
          current={emergencyFundTotal}
          target={emergencyTarget}
          sub="3 months of expenses"
          gradient="linear-gradient(135deg, #1D9E75 0%, #0d7a56 100%)"
          accentColor="#1D9E75"
        />
        <GoalCard
          label="ISA 2026"
          current={isaContrib}
          target={20000}
          sub="Annual ISA allowance"
          gradient="linear-gradient(135deg, #378ADD 0%, #1a3a5c 100%)"
          accentColor="#378ADD"
        />
      </div>
    </div>
  );
}

function GoalCard({ label, current, target, sub, gradient, accentColor }) {
  const pct       = Math.min(100, target > 0 ? (current / target) * 100 : 0);
  const [anim, setAnim] = useState(0);
  const done      = useRef(false);

  useEffect(() => {
    if (done.current || pct === 0) return;
    done.current = true;
    const steps = 30, interval = 28;
    let step = 0;
    const id = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      setAnim(pct * eased);
      if (step >= steps) { setAnim(pct); clearInterval(id); }
    }, interval);
    return () => clearInterval(id);
  }, []); // eslint-disable-line

  const isOver50   = pct > 50;
  const isComplete = pct >= 100;

  return (
    <div style={{
      borderRadius: 16, background: gradient,
      padding: "22px 22px 20px",
      color: "#fff",
      boxShadow: `0 8px 28px ${accentColor}44`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative circle */}
      <div style={{
        position: "absolute", top: -24, right: -24,
        width: 110, height: 110, borderRadius: "50%",
        background: "rgba(255,255,255,0.08)", pointerEvents: "none",
      }} />

      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", opacity: 0.7, marginBottom: 10 }}>
        {label}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em" }}>
            {Math.round(anim)}%
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{sub}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 17, fontWeight: 700 }}>{fmt(current)}</div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>of {fmt(target)}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 10, background: "rgba(255,255,255,0.2)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          width: `${anim}%`, height: "100%",
          background: "#fff", borderRadius: 99,
          boxShadow: isOver50 ? "0 0 16px rgba(255,255,255,0.95)" : "none",
          transition: "box-shadow 0.4s ease",
        }} />
      </div>

      {isComplete && (
        <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, opacity: 0.95 }}>🎉 Goal complete!</div>
      )}
    </div>
  );
}

/* ── Expense donut — 260 px, pill legend ── */
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
  const SIZE = 260, CX = 130, CY = 130, OUTER = 118, INNER = 76;

  const segments = useMemo(() => {
    const cm = new Date().getMonth();
    return Object.entries(expenses || {})
      .map(([name, vals]) => ({ name, value: parseFloat(vals[cm]) || 0, color: CATEGORY_COLORS[name] || "#ccc" }))
      .filter(s => s.value > 0);
  }, [expenses]);

  const total = useMemo(() => segments.reduce((a, s) => a + s.value, 0), [segments]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, SIZE, SIZE);

    if (total === 0 || segments.length === 0) {
      ctx.beginPath(); ctx.arc(CX, CY, OUTER, 0, 2 * Math.PI); ctx.fillStyle = "#f0f4f8"; ctx.fill();
      ctx.beginPath(); ctx.arc(CX, CY, INNER, 0, 2 * Math.PI); ctx.fillStyle = "#fff";    ctx.fill();
      return;
    }

    let start = -Math.PI / 2;
    const gap = segments.length > 1 ? 0.02 : 0;
    segments.forEach(seg => {
      const slice = (seg.value / total) * 2 * Math.PI;
      ctx.beginPath();
      ctx.arc(CX, CY, OUTER, start + gap / 2, start + slice - gap / 2);
      ctx.arc(CX, CY, INNER, start + slice - gap / 2, start + gap / 2, true);
      ctx.closePath();
      ctx.fillStyle = seg.color;
      ctx.fill();
      start += slice;
    });

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = N;
    ctx.font = `bold 18px system-ui,sans-serif`;
    ctx.fillText("£" + Math.round(total).toLocaleString("en-GB"), CX, CY - 10);
    ctx.font = `11px system-ui,sans-serif`;
    ctx.fillStyle = "#999";
    ctx.fillText("this month", CX, CY + 12);
  }, [segments, total]);

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24 }}>
      <SectionTitle color={AM}>Expense Breakdown</SectionTitle>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ flexShrink: 0, maxWidth: "100%" }} />
        <div style={{ flex: 1, minWidth: 160 }}>
          {segments.length === 0 ? (
            <div style={{ fontSize: 13, color: "#aaa", paddingTop: 8 }}>No expenses this month</div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, paddingTop: 4 }}>
              {segments.map(seg => (
                <div key={seg.name} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: seg.color + "22",
                  border: `1px solid ${seg.color}44`,
                  borderRadius: 99, padding: "5px 12px",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: seg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: seg.color }}>{seg.name}</span>
                  <span style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>£{Math.round(seg.value).toLocaleString("en-GB")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 50/30/20 budget rule ── */
function BudgetRule({ expPct, invPct, netPct, yearInc, yearExp, yearInv, yearNet }) {
  const surplusPct = Math.max(0, netPct);
  const savePct    = safe(invPct + surplusPct);
  const spendColor = expPct <= 80 ? G : expPct <= 90 ? AM : R;
  const saveColor  = savePct >= 20 ? G : savePct >= 10 ? AM : R;

  const rawSegments = [
    { label: "Expenses",    raw: clamp(expPct,     0, 200), color: R },
    { label: "Investments", raw: clamp(invPct,     0, 200), color: B },
    { label: "Surplus",     raw: clamp(surplusPct, 0, 200), color: G },
  ];
  const total    = rawSegments.reduce((a, s) => a + s.raw, 0) || 1;
  const segments = rawSegments.map(s => ({ ...s, pct: (s.raw / total) * 100 }));

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24 }}>
      <SectionTitle color={AM} sub="Guideline: spend ≤ 80% of income, save/invest ≥ 20%">50 / 30 / 20 Budget Analysis</SectionTitle>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Income allocation</div>
        <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden" }}>
          {segments.map(s => (
            <div key={s.label} title={`${s.label}: ${fmtPct(s.pct)}`} style={{
              width: s.pct + "%", background: s.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#fff", fontWeight: 700,
              transition: "width 0.4s ease", overflow: "hidden", whiteSpace: "nowrap",
            }}>
              {s.pct > 9 ? fmtPct(s.pct) : ""}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
          {segments.map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#555" }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              {s.label} — {fmtPct(s.raw)}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <RuleBar label="Spending (Expenses)" actual={expPct} target={80} color={spendColor} targetLabel="≤80% target" flip />
        <RuleBar label="Saving & Investing (Net + Invested)" actual={savePct} target={20} color={saveColor} targetLabel="≥20% target" />
      </div>
    </div>
  );
}

function RuleBar({ label, actual, target, color, targetLabel, flip }) {
  const barW    = clamp(actual, 0, 100);
  const tPos    = clamp(target, 0, 100);
  const onTrack = flip ? actual <= target : actual >= target;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: N }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{fmtPct(actual)} {onTrack ? "✓" : "↑"}</span>
      </div>
      <div style={{ position: "relative", height: 10, background: "#f0f4f8", borderRadius: 5 }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: barW + "%", background: color, borderRadius: 5, transition: "width 0.4s ease" }} />
        <div style={{ position: "absolute", top: -4, bottom: -4, left: tPos + "%", width: 2, background: N, borderRadius: 1, transform: "translateX(-50%)" }} />
      </div>
      <div style={{ position: "relative", height: 18 }}>
        <div style={{ position: "absolute", left: tPos + "%", transform: "translateX(-50%)", fontSize: 10, color: "#999", whiteSpace: "nowrap", marginTop: 3 }}>{targetLabel}</div>
      </div>
    </div>
  );
}

/* ── Monthly summary table ── */
function MonthlySummary({ incArr, expArr, invArr, netArr, cumulative, yearInc, yearExp, yearInv, yearNet }) {
  const yearSR  = pct(yearNet + yearInv, yearInc);
  const yearCum = cumulative[11] ?? 0;

  const thStyle = (color, minW = 88) => ({
    padding: "10px 10px", textAlign: "right",
    borderBottom: "1px solid #e8ecf0",
    color, fontWeight: 600, minWidth: minW, whiteSpace: "nowrap",
  });
  const tdStyle = (extra = {}) => ({
    padding: "8px 10px", textAlign: "right",
    borderBottom: "1px solid #f0f0f0",
    color: "#333", whiteSpace: "nowrap", ...extra,
  });

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <div style={{ padding: "20px 24px 16px" }}>
        <SectionTitle color={N}>Monthly Summary</SectionTitle>
      </div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f5f7fa" }}>
              <th style={{ padding: "10px 14px", textAlign: "left", borderBottom: "1px solid #e8ecf0", position: "sticky", left: 0, background: "#f5f7fa", zIndex: 1, minWidth: 48, color: N }}>Month</th>
              <th style={thStyle(G)}>Income</th>
              <th style={thStyle(R)}>Expenses</th>
              <th style={thStyle(B)}>Invested</th>
              <th style={thStyle(N)}>Net</th>
              <th style={thStyle(P, 76)}>Save %</th>
              <th style={{ ...thStyle("#555", 100), paddingRight: 14 }}>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((m, i) => {
              const net = netArr[i], inc = incArr[i], exp = expArr[i], inv = invArr[i], cum = cumulative[i];
              const sr  = pct(net + inv, inc);
              const bg  = i % 2 === 0 ? "#fff" : "#f9fafc";
              return (
                <tr key={m} style={{ background: bg }}>
                  <td style={{ padding: "8px 14px", borderBottom: "1px solid #f0f0f0", fontWeight: 700, color: N, position: "sticky", left: 0, background: bg, zIndex: 1 }}>{m}</td>
                  <td style={tdStyle()}>{inc > 0 ? fmt(inc) : "—"}</td>
                  <td style={tdStyle()}>{exp > 0 ? fmt(exp) : "—"}</td>
                  <td style={tdStyle()}>{inv > 0 ? fmt(inv) : "—"}</td>
                  <td style={tdStyle({ fontWeight: 600, color: net >= 0 ? G : R })}>{fmtSigned(net)}</td>
                  <td style={tdStyle({ color: inc > 0 ? (sr >= 20 ? G : sr >= 10 ? AM : R) : "#aaa", fontWeight: 500 })}>{inc > 0 ? fmtPct(sr) : "—"}</td>
                  <td style={{ ...tdStyle({ fontWeight: 500, color: cum >= 0 ? G : R }), paddingRight: 14 }}>{fmtSigned(cum)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0f4f8", fontWeight: 700 }}>
              <td style={{ padding: "10px 14px", borderTop: "2px solid #d0d8e0", color: N, position: "sticky", left: 0, background: "#f0f4f8", zIndex: 1 }}>Year</td>
              <td style={{ ...thStyle(G), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmt(yearInc)}</td>
              <td style={{ ...thStyle(R), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmt(yearExp)}</td>
              <td style={{ ...thStyle(B), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmt(yearInv)}</td>
              <td style={{ ...thStyle(yearNet >= 0 ? G : R), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{fmtSigned(yearNet)}</td>
              <td style={{ ...thStyle(yearSR >= 20 ? G : yearSR >= 10 ? AM : R, 76), borderTop: "2px solid #d0d8e0", borderBottom: "none" }}>{yearInc > 0 ? fmtPct(yearSR) : "—"}</td>
              <td style={{ ...thStyle(yearCum >= 0 ? G : R, 100), borderTop: "2px solid #d0d8e0", borderBottom: "none", paddingRight: 14 }}>{fmtSigned(yearCum)}</td>
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
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24 }}>
      <SectionTitle color={P} sub={noContrib ? "Add income or reduce expenses to see projections" : `Based on ${fmt(monthlyContrib)}/month at 7% annual growth`}>
        Compound Growth Projections
      </SectionTitle>
      {noContrib ? (
        <div style={{ background: "#fff5f5", border: `1px solid ${R}`, borderRadius: 10, padding: "14px 16px", fontSize: 13, color: R, marginTop: 8 }}>
          Your current monthly surplus is £0 or less. The projections will appear once you have a positive net balance.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 14 }}>
            <GrowthCard label="After 1 Year"     value={fmt(growth1y)}       sub={`${fmt(monthlyContrib * 12)} contributed`} color={B} />
            <GrowthCard label="After 5 Years"    value={fmt(growth5y)}       sub={`${fmt(totalContrib5y)} contributed`}      color={P} />
            <GrowthCard label="Interest Earned"  value={fmt(interestEarned)} sub="over 5 years at 7%"                        color={G} />
          </div>
          <div style={{ fontSize: 11, color: "#bbb" }}>
            Uses future value of annuity formula. Assumes constant contributions and a fixed 7% p.a. return. Past performance does not guarantee future results.
          </div>
        </>
      )}
    </div>
  );
}

function GrowthCard({ label, value, sub, color }) {
  return (
    <div style={{ background: "#f8f9fc", borderRadius: 12, padding: "14px 16px", borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: 11, color: "#999", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

/* ── Financial roadmap — vertical timeline ── */
function FinancialRoadmap({ efMonthly, efCurrent, efTarget, isaMonthly, isaCurrent }) {
  const MO = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function getMilestone(monthly, current, target) {
    if (target <= 0)      return { str: "—",            monthsLeft: null };
    if (current >= target) return { str: "Complete!",   monthsLeft: 0 };
    if (monthly <= 0)     return { str: "Not started",  monthsLeft: Infinity };
    const ml     = Math.ceil((target - current) / monthly);
    const now    = new Date();
    const totMo  = now.getMonth() + ml;
    const yr     = now.getFullYear() + Math.floor(totMo / 12);
    const mo     = totMo % 12;
    return { str: `${MO[mo]} ${yr}`, monthsLeft: ml };
  }

  function nodeColor(ml) {
    if (ml === null)     return "#bbb";
    if (ml === 0)        return G;
    if (!isFinite(ml))   return "#bbb";
    if (ml > 12)         return G;
    if (ml > 3)          return AM;
    return R;
  }

  const milestones = [
    { name: "Emergency Fund", icon: "🛡️", monthly: efMonthly,  current: efCurrent, target: efTarget },
    { name: "ISA Full",       icon: "📈", monthly: isaMonthly, current: isaCurrent, target: 20000 },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: 24 }}>
      <SectionTitle color={B} sub="Estimated milestone dates based on current monthly contributions">Financial Roadmap</SectionTitle>

      <div style={{ position: "relative", paddingLeft: 36, marginTop: 8 }}>
        {/* Vertical connecting line */}
        <div style={{
          position: "absolute", left: 12, top: 12, bottom: 12, width: 2,
          background: `linear-gradient(to bottom, ${G}, ${AM}, ${R})`,
          borderRadius: 2,
        }} />

        {milestones.map((m, idx) => {
          const info   = getMilestone(m.monthly, m.current, m.target);
          const nc     = nodeColor(info.monthsLeft);
          const isComp = info.monthsLeft === 0;
          const progPct = m.target > 0 ? Math.min(100, (m.current / m.target) * 100) : 0;

          return (
            <div key={m.name} style={{ position: "relative", marginBottom: idx < milestones.length - 1 ? 28 : 0 }}>
              {/* Timeline node */}
              <div style={{
                position: "absolute", left: -36, top: 14,
                width: 24, height: 24, borderRadius: "50%",
                background: nc, border: "3px solid #fff",
                boxShadow: `0 0 0 2px ${nc}, 0 3px 10px ${nc}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#fff", fontWeight: 800,
              }}>
                {isComp ? "✓" : idx + 1}
              </div>

              {/* Card */}
              <div style={{
                background: "#f8f9fc", borderRadius: 14,
                padding: "16px 18px",
                borderLeft: `3px solid ${nc}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: N }}>{m.name}</span>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: nc }}>{info.str}</div>
                </div>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#777", marginBottom: 12 }}>
                  <span>Monthly: <strong style={{ color: N }}>{m.monthly > 0 ? fmt(m.monthly) : "£0"}</strong></span>
                  <span>Saved: <strong style={{ color: N }}>{fmt(m.current)}</strong></span>
                  <span>Target: <strong style={{ color: N }}>{fmt(m.target)}</strong></span>
                </div>

                {m.target > 0 && (
                  <div>
                    <div style={{ height: 8, background: "rgba(0,0,0,0.07)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${progPct}%`, height: "100%", background: nc, borderRadius: 99, transition: "width 0.6s ease" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>{progPct.toFixed(1)}% complete</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Rotating financial tip ── */
function FinancialTip({ tip, idx, total, onNext, onPrev }) {
  return (
    <div style={{ background: N, borderRadius: 16, padding: 24, color: "#fff", boxShadow: "0 4px 20px rgba(26,58,92,0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontSize: 11, opacity: 0.6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Financial Tip {idx + 1} / {total}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <TipBtn onClick={onPrev} label="‹ Prev" />
          <TipBtn onClick={onNext} label="Next ›" />
        </div>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.7, minHeight: 44 }}>{tip}</div>
      <div style={{ display: "flex", gap: 5, marginTop: 16, justifyContent: "center" }}>
        {Array.from({ length: total }, (_, i) => (
          <div key={i} style={{
            width: i === idx ? 18 : 6, height: 6, borderRadius: 3,
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
    <button onClick={onClick} style={{
      background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 6,
      color: "#fff", fontSize: 12, padding: "5px 12px", cursor: "pointer",
      fontWeight: 600, lineHeight: 1.4, fontFamily: "inherit",
    }}>
      {label}
    </button>
  );
}
