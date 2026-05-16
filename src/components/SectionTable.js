import { useState, useEffect, useRef } from "react";
import { MONTHS, fmt } from "../utils/helpers";

const SEMI_ROW      = "Semi-Annual Sub";
const YELLOW_BG     = "#fffde7";
const YELLOW_BORDER = "#f9e400";
const NAVY          = "#1a3a5c";
const GREEN         = "#1D9E75";
const BLUE          = "#378ADD";
const PURPLE        = "#7F77DD";
const RED           = "#E24B4A";
const ORANGE        = "#F5A623";

const MONTHS_ELAPSED = 5; // Jan–May (indices 0–4)
const ISA_LIMIT      = 20000;

/* ── Investment category colours ──────────────────────────────────────── */
const INV_COLORS = {
  "ISA":            GREEN,
  "Pension":        BLUE,
  "Stocks":         PURPLE,
  "Emergency Fund": ORANGE,
  "Crypto":         RED,
};
function invColor(name) { return INV_COLORS[name] || "#9aa3af"; }

/* ── Summary metric card ───────────────────────────────────────────────── */
function SummaryCard({ label, value, color, growth, sub, progress }) {
  const growthPositive = growth >= 0;
  return (
    <div style={{
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 2px 14px rgba(0,0,0,0.08)",
      padding: "14px 18px",
      borderLeft: `4px solid ${color}`,
      flex: "1 1 140px",
      minWidth: 140,
    }}>
      <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {value}
        </span>
        {growth !== null && growth !== undefined && (
          <span style={{
            fontSize: 11, fontWeight: 700,
            color: growthPositive ? GREEN : RED,
            background: growthPositive ? "#f0faf6" : "#fff5f5",
            border: `1px solid ${growthPositive ? "#c0ead8" : "#fcd0d0"}`,
            borderRadius: 99,
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}>
            {growthPositive ? "+" : ""}{growth.toFixed(1)}% Jan→Dec
          </span>
        )}
        {sub && (
          <span style={{ fontSize: 12, color: "#aaa", whiteSpace: "nowrap" }}>{sub}</span>
        )}
      </div>
      {progress !== undefined && (
        <div style={{ marginTop: 10, height: 4, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: Math.min(100, progress) + "%",
            background: color,
            borderRadius: 99,
            transition: "width 0.4s ease",
          }} />
        </div>
      )}
    </div>
  );
}

export default function SectionTable({
  title,
  section,
  data,
  onUpdate,
  onAddRow,
  onDeleteRow,
  onRenameRow,
  headerBg,
  semiMos = [],
}) {
  const [newRowName, setNewRowName]   = useState("");
  const [editingName, setEditingName] = useState(null);
  const [nameInput, setNameInput]     = useState("");
  const [hoveredRow, setHoveredRow]   = useState(null);
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768);
  const canvasRef = useRef(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const isIncome      = section === "income";
  const isExpenses    = section === "expenses";
  const isInvestments = section === "investments";
  const rows          = data[section] || {};
  const rowNames      = Object.keys(rows);

  const monthTotals = MONTHS.map((_, i) =>
    rowNames.reduce((sum, name) => sum + (parseFloat(rows[name][i]) || 0), 0)
  );
  const grandTotal = monthTotals.reduce((a, v) => a + v, 0);

  /* ── Income metrics ── */
  const monthlyAvg  = grandTotal / 12;
  const maxMonthVal = isIncome ? Math.max(0, ...monthTotals) : 0;
  const maxMonthIdx = isIncome ? monthTotals.findIndex(t => t === maxMonthVal) : -1;
  const growth      = isIncome && monthTotals[0] > 0
    ? ((monthTotals[11] - monthTotals[0]) / monthTotals[0]) * 100 : null;

  /* ── Expense metrics ── */
  const totalIncome = isExpenses
    ? Object.values(data.income || {}).reduce(
        (sum, arr) => sum + arr.reduce((a, v) => a + (parseFloat(v) || 0), 0), 0)
    : 0;
  const expIncPct = isExpenses && totalIncome > 0
    ? (grandTotal / totalIncome) * 100 : null;
  const expIncPctColor = expIncPct === null ? NAVY
    : expIncPct < 50 ? GREEN : expIncPct < 70 ? ORANGE : RED;
  const biggestCat = isExpenses && rowNames.length > 0
    ? rowNames.reduce((best, name) => {
        const t = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
        return t > best.total ? { name, total: t } : best;
      }, { name: "", total: 0 })
    : null;

  /* ── Investment metrics ── */
  const isaTotal = isInvestments && rows["ISA"]
    ? rows["ISA"].reduce((a, v) => a + (parseFloat(v) || 0), 0) : 0;
  const proj1yr = isInvestments ? grandTotal * 1.07 : 0;
  const proj5yr = isInvestments ? grandTotal * Math.pow(1.07, 5) : 0;
  const isaProgress = Math.min(100, (isaTotal / ISA_LIMIT) * 100);

  /* ── Portfolio donut chart ── */
  useEffect(() => {
    if (!isInvestments || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = 200, H = 200, cx = 100, cy = 100, outerR = 86, innerR = 56;

    ctx.clearRect(0, 0, W, H);

    const names  = Object.keys(data.investments || {});
    const totals = names.map(n =>
      (data.investments[n] || []).reduce((a, v) => a + (parseFloat(v) || 0), 0)
    );
    const total = totals.reduce((a, v) => a + v, 0);

    if (total <= 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
      ctx.arc(cx, cy, innerR, 0, 2 * Math.PI, true);
      ctx.fillStyle = "#f0f0f0";
      ctx.fill();
    } else {
      let angle = -Math.PI / 2;
      names.forEach((name, i) => {
        if (totals[i] <= 0) return;
        const slice = (totals[i] / total) * 2 * Math.PI;
        ctx.beginPath();
        ctx.arc(cx, cy, outerR, angle, angle + slice);
        ctx.arc(cx, cy, innerR, angle + slice, angle, true);
        ctx.closePath();
        ctx.fillStyle = INV_COLORS[name] || "#9aa3af";
        ctx.fill();
        angle += slice;
      });
    }

    ctx.textAlign = "center";
    ctx.fillStyle = NAVY;
    ctx.font = "bold 13px system-ui, sans-serif";
    ctx.fillText("£" + Math.round(total).toLocaleString(), cx, cy + 5);
    ctx.font = "10px system-ui, sans-serif";
    ctx.fillStyle = "#aaa";
    ctx.fillText("invested", cx, cy + 19);
  }, [isInvestments, data, isMobile]);

  /* ── Expense budget helpers ── */
  function rowYtdActual(name) {
    return rows[name].slice(0, MONTHS_ELAPSED).reduce((a, v) => a + (parseFloat(v) || 0), 0);
  }
  function rowYtdBudget(name) {
    const rt = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
    return (rt / 12) * MONTHS_ELAPSED;
  }

  /* ── Theming ── */
  const thBg       = isIncome
    ? "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)"
    : isExpenses
    ? "linear-gradient(135deg, #c53030 0%, #e05252 100%)"
    : isInvestments
    ? "linear-gradient(135deg, #1b4f72 0%, #2980b9 100%)"
    : "#f5f7fa";
  const stickyThBg = isIncome ? "#1a3a5c"
    : isExpenses    ? "#c53030"
    : isInvestments ? "#1b4f72"
    : "#f5f7fa";
  const thTextColor = (isIncome || isExpenses || isInvestments) ? "#fff" : NAVY;
  const thBorder    = (isIncome || isExpenses || isInvestments) ? "rgba(255,255,255,0.15)" : "#e8ecf0";

  const totalRowBg    = (isIncome || isExpenses || isInvestments) ? GREEN : "#f0f4f8";
  const totalRowText  = (isIncome || isExpenses || isInvestments) ? "#fff" : NAVY;
  const totalRowBdr   = (isIncome || isExpenses || isInvestments) ? `2px solid ${GREEN}` : "2px solid #d0d8e0";
  const stickyTotalBg = (isIncome || isExpenses || isInvestments) ? "#17875f" : "#f0f4f8";

  /* ── Mobile grid columns ── */
  const mobileCols         = isIncome ? 3 : 4;
  const mobileRightBorder  = (mi) => mi % mobileCols !== mobileCols - 1 ? "1px solid #f0f0f0" : "none";
  const mobileBottomBorder = (mi) => mi < 12 - mobileCols ? "1px solid #f0f0f0" : "none";

  function isSemiCell(rowName, monthIdx) {
    return rowName === SEMI_ROW && semiMos.includes(monthIdx);
  }

  function addRow() {
    const trimmed = newRowName.trim();
    if (!trimmed || rows[trimmed]) return;
    onAddRow(section, trimmed);
    setNewRowName("");
  }

  function NameCell({ name }) {
    if (editingName === name) {
      return (
        <input
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onBlur={() => {
            const t = nameInput.trim();
            if (t && t !== name && !rows[t]) onRenameRow(section, name, t);
            setEditingName(null);
          }}
          onKeyDown={e => {
            if (e.key === "Enter") e.target.blur();
            if (e.key === "Escape") setEditingName(null);
          }}
          autoFocus
          style={{
            width: "100%", border: `1px solid ${NAVY}`, borderRadius: 4,
            padding: "3px 6px", fontSize: 13, outline: "none", fontFamily: "inherit",
          }}
        />
      );
    }
    return (
      <span
        onDoubleClick={() => { setEditingName(name); setNameInput(name); }}
        title="Double-click to rename"
        style={{ cursor: "text", display: "block", userSelect: "none" }}
      >
        {name}
      </span>
    );
  }

  /* ──────────────────────────────────────────────────────────────────
     MOBILE
  ────────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{
          background: isIncome
            ? "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)"
            : isExpenses
            ? "linear-gradient(135deg, #c53030 0%, #e05252 100%)"
            : isInvestments
            ? "linear-gradient(135deg, #1b4f72 0%, #2980b9 100%)"
            : headerBg,
          padding: "14px 16px",
          fontWeight: 700, fontSize: 15,
          color: (isIncome || isExpenses || isInvestments) ? "#fff" : NAVY,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          {title}
        </div>

        {/* Summary strip */}
        {(isIncome || isExpenses || isInvestments) && (
          <div style={{
            background: "#f8f9fc", padding: "10px 12px",
            display: "flex", gap: 8, overflowX: "auto",
            borderBottom: "1px solid rgba(0,0,0,0.06)",
            WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
          }}>
            <div style={{ flexShrink: 0, background: "#fff", borderRadius: 10, padding: "8px 14px", borderLeft: `3px solid ${isExpenses ? RED : isInvestments ? BLUE : GREEN}` }}>
              <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Annual</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: isExpenses ? RED : isInvestments ? BLUE : GREEN }}>{fmt(grandTotal)}</div>
            </div>
            <div style={{ flexShrink: 0, background: "#fff", borderRadius: 10, padding: "8px 14px", borderLeft: `3px solid ${BLUE}` }}>
              <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Avg/month</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: BLUE }}>{fmt(monthlyAvg)}</div>
            </div>
            {isInvestments && proj5yr > 0 && (
              <div style={{ flexShrink: 0, background: "#fff", borderRadius: 10, padding: "8px 14px", borderLeft: `3px solid ${GREEN}` }}>
                <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>5yr @7%</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: GREEN }}>{fmt(proj5yr)}</div>
              </div>
            )}
            {isInvestments && (
              <div style={{ flexShrink: 0, background: "#fff", borderRadius: 10, padding: "8px 14px", borderLeft: `3px solid ${GREEN}` }}>
                <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>ISA used</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: isaProgress >= 100 ? RED : GREEN }}>{Math.round(isaProgress)}%</div>
              </div>
            )}
            {isExpenses && biggestCat && biggestCat.total > 0 && (
              <div style={{ flexShrink: 0, background: "#fff", borderRadius: 10, padding: "8px 14px", borderLeft: `3px solid ${PURPLE}` }}>
                <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Biggest</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: PURPLE }}>{biggestCat.name}</div>
              </div>
            )}
            {isExpenses && expIncPct !== null && (
              <div style={{ flexShrink: 0, background: "#fff", borderRadius: 10, padding: "8px 14px", borderLeft: `3px solid ${expIncPctColor}` }}>
                <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>% of income</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: expIncPctColor }}>{Math.round(expIncPct)}%</div>
              </div>
            )}
            {isIncome && maxMonthIdx >= 0 && maxMonthVal > 0 && (
              <div style={{ flexShrink: 0, background: "#fff", borderRadius: 10, padding: "8px 14px", borderLeft: `3px solid ${PURPLE}` }}>
                <div style={{ fontSize: 9, color: "#aaa", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>Peak month</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: PURPLE }}>{MONTHS[maxMonthIdx]}</div>
              </div>
            )}
          </div>
        )}

        {/* Cards */}
        <div style={{ background: "#FAFAF8", display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
          {rowNames.map(name => {
            const rowTotal   = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
            const ytdAct     = isExpenses ? rowYtdActual(name) : 0;
            const ytdBud     = isExpenses ? rowYtdBudget(name) : 0;
            const overBudget = isExpenses && ytdBud > 0 && ytdAct > ytdBud;
            const expBarPct  = isExpenses && ytdBud > 0 ? Math.min(100, (ytdAct / ytdBud) * 100) : 0;
            const invProjAnn = isInvestments ? rowTotal * 1.07 : 0;
            const invIsaPct  = isInvestments ? Math.min(100, (rowTotal / ISA_LIMIT) * 100) : 0;
            const invMonthly = isInvestments ? rowTotal / 12 : 0;
            const color      = isInvestments ? invColor(name) : (isIncome ? GREEN : NAVY);

            return (
              <div key={name} style={{
                background: "#fff", borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden",
                borderLeft: isInvestments
                  ? `3px solid ${invColor(name)}`
                  : isIncome
                  ? `3px solid ${GREEN}`
                  : isExpenses
                  ? `3px solid ${overBudget ? RED : GREEN}`
                  : "none",
              }}>
                {/* Card header */}
                <div style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid #f0f0f0",
                  background: isIncome ? "#f0faf6" : isExpenses ? "#fdf5f5" : isInvestments ? "#f0f6ff" : "#f8f9fc",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: (isExpenses && ytdBud > 0) || isInvestments ? 8 : 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: NAVY, flex: 1 }}>
                      <NameCell name={name} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color }}>{fmt(rowTotal)}</span>
                      {isExpenses && ytdBud > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: overBudget ? RED : GREEN,
                          background: overBudget ? "#fff0f0" : "#f0faf6",
                          border: `1px solid ${overBudget ? "#fcd0d0" : "#c0ead8"}`,
                          borderRadius: 99, padding: "2px 7px", whiteSpace: "nowrap",
                        }}>
                          {overBudget ? "▲ Over" : "✓ Track"}
                        </span>
                      )}
                      <button
                        onClick={() => onDeleteRow(section, name)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 20, lineHeight: 1, padding: 0, transition: "color 0.2s ease" }}
                        onMouseEnter={e => e.currentTarget.style.color = RED}
                        onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
                      >×</button>
                    </div>
                  </div>

                  {/* Investment stats */}
                  {isInvestments && (
                    <div>
                      <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
                        <div>
                          <span style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", fontWeight: 700 }}>Monthly </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: invColor(name) }}>{fmt(invMonthly)}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: 9, color: "#aaa", textTransform: "uppercase", fontWeight: 700 }}>1yr @7% </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: GREEN }}>{fmt(invProjAnn)}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: "#aaa", marginBottom: 3 }}>
                        {Math.round(invIsaPct)}% of £20,000 ISA limit
                      </div>
                      <div style={{ height: 4, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: invIsaPct + "%",
                          background: `linear-gradient(90deg, ${invColor(name)}, ${invColor(name)}99)`,
                          borderRadius: 99, transition: "width 0.4s ease",
                        }} />
                      </div>
                    </div>
                  )}

                  {/* Expense budget bar */}
                  {isExpenses && ytdBud > 0 && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#aaa", marginBottom: 3 }}>
                        <span>YTD spend</span>
                        <span>{fmt(ytdAct)} / {fmt(Math.round(ytdBud))} budget</span>
                      </div>
                      <div style={{ height: 5, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: expBarPct + "%",
                          background: overBudget
                            ? `linear-gradient(90deg, ${RED}, #ff6b6b)`
                            : `linear-gradient(90deg, ${GREEN}, #5DCAA5)`,
                          borderRadius: 99, transition: "width 0.4s ease",
                        }} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Month grid */}
                <div style={{ display: "grid", gridTemplateColumns: `repeat(${mobileCols}, 1fr)`, gap: 0 }}>
                  {MONTHS.map((m, mi) => {
                    const semi = isSemiCell(name, mi);
                    return (
                      <div key={mi} style={{
                        background: semi ? YELLOW_BG : "transparent",
                        borderRight: mobileRightBorder(mi),
                        borderBottom: mobileBottomBorder(mi),
                        padding: "6px 4px 4px",
                        transition: "background 0.15s ease",
                      }}>
                        <div style={{ fontSize: 9, color: "#aaa", fontWeight: 600, textAlign: "center", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          {m}
                        </div>
                        <input
                          type="number" min="0"
                          value={rows[name][mi] === 0 ? "" : rows[name][mi]}
                          placeholder="0"
                          onChange={e => onUpdate(section, name, mi, parseFloat(e.target.value) || 0)}
                          style={{
                            display: "block", width: "100%", boxSizing: "border-box",
                            border: "none", background: "transparent",
                            textAlign: "center", fontSize: 12, padding: "2px 2px",
                            outline: "none", color: "#222",
                            MozAppearance: "textfield", fontFamily: "inherit",
                          }}
                          onFocus={e => {
                            e.target.parentElement.style.background = isIncome ? "#e8f4ff" : (semi ? YELLOW_BG : "#f0f4ff");
                            e.target.parentElement.style.outline = `2px solid ${isIncome || isInvestments ? BLUE : NAVY}`;
                            e.target.parentElement.style.outlineOffset = "-2px";
                          }}
                          onBlur={e => {
                            e.target.parentElement.style.background = semi ? YELLOW_BG : "transparent";
                            e.target.parentElement.style.outline = "none";
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Monthly totals */}
          {rowNames.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{
                padding: "10px 14px",
                background: (isIncome || isExpenses || isInvestments) ? GREEN : "#f0f4f8",
                fontWeight: 700, fontSize: 13,
                color: (isIncome || isExpenses || isInvestments) ? "#fff" : NAVY,
                borderBottom: `1px solid ${(isIncome || isExpenses || isInvestments) ? "#17875f" : "#e0e8f0"}`,
              }}>
                Monthly Totals — {fmt(grandTotal)}
                {isInvestments && proj5yr > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85, marginLeft: 8 }}>
                    · {fmt(proj5yr)} in 5yr @7%
                  </span>
                )}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${mobileCols}, 1fr)`, gap: 0 }}>
                {monthTotals.map((t, i) => (
                  <div key={i} style={{
                    padding: "6px 4px", borderRight: mobileRightBorder(i),
                    borderBottom: mobileBottomBorder(i), textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 2 }}>{MONTHS[i]}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isInvestments ? BLUE : (isIncome || isExpenses) ? GREEN : NAVY }}>
                      {t > 0 ? "£" + Math.round(t) : "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add row */}
        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", gap: 8, background: "#fff" }}>
          <input
            value={newRowName}
            onChange={e => setNewRowName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addRow()}
            placeholder="New category name…"
            style={{
              flex: 1, border: "1px solid #d0d8e0", borderRadius: 8,
              padding: "8px 12px", fontSize: 13, outline: "none",
              fontFamily: "inherit", transition: "border-color 0.2s ease",
            }}
            onFocus={e => e.target.style.borderColor = NAVY}
            onBlur={e => e.target.style.borderColor = "#d0d8e0"}
          />
          <button
            onClick={addRow}
            style={{
              background: NAVY, color: "#fff", border: "none", borderRadius: 8,
              padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600,
              whiteSpace: "nowrap", transition: "all 0.2s ease",
            }}
          >
            + Add
          </button>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────────
     DESKTOP
  ────────────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>

      {/* Section title */}
      <div style={{
        background: isIncome
          ? "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)"
          : isExpenses
          ? "linear-gradient(135deg, #c53030 0%, #e05252 100%)"
          : isInvestments
          ? "linear-gradient(135deg, #1b4f72 0%, #2980b9 100%)"
          : headerBg,
        padding: "16px 20px",
        fontWeight: 700, fontSize: 15,
        color: (isIncome || isExpenses || isInvestments) ? "#fff" : NAVY,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        {title}
      </div>

      {/* Summary bar */}
      {(isIncome || isExpenses || isInvestments) && (
        <div style={{
          display: "flex", gap: 14, padding: "16px 20px",
          background: "#f8f9fc", borderBottom: "1px solid rgba(0,0,0,0.05)",
          flexWrap: "wrap",
        }}>
          {isIncome && (
            <>
              <SummaryCard label="Annual Total"    value={fmt(grandTotal)}  color={GREEN} growth={growth} />
              <SummaryCard label="Monthly Average" value={fmt(monthlyAvg)}  color={BLUE} />
              <SummaryCard
                label="Highest Month"
                value={maxMonthIdx >= 0 && maxMonthVal > 0 ? `${MONTHS[maxMonthIdx]}: ${fmt(maxMonthVal)}` : "—"}
                color={PURPLE}
              />
            </>
          )}
          {isExpenses && (
            <>
              <SummaryCard label="Annual Total"    value={fmt(grandTotal)}  color={RED} />
              <SummaryCard label="Monthly Average" value={fmt(monthlyAvg)}  color={BLUE} />
              {biggestCat && biggestCat.total > 0 && (
                <SummaryCard label="Biggest Category" value={biggestCat.name} color={PURPLE} sub={fmt(biggestCat.total)} />
              )}
              {expIncPct !== null && (
                <SummaryCard label="% of Income" value={Math.round(expIncPct) + "%"} color={expIncPctColor} />
              )}
            </>
          )}
          {isInvestments && (
            <>
              <SummaryCard label="Total Invested"  value={fmt(grandTotal)}  color={BLUE} />
              <SummaryCard label="1yr @7% Return"  value={fmt(proj1yr)}     color={GREEN} />
              <SummaryCard label="5yr @7% Return"  value={fmt(proj5yr)}     color={PURPLE} />
              <SummaryCard
                label="ISA Used"
                value={fmt(isaTotal)}
                color={isaProgress >= 100 ? RED : GREEN}
                sub={`/ £${ISA_LIMIT.toLocaleString()}`}
                progress={isaProgress}
              />
            </>
          )}
        </div>
      )}

      {/* Investment portfolio donut */}
      {isInvestments && rowNames.length > 0 && (
        <div style={{
          display: "flex", gap: 24, padding: "20px 24px",
          background: "#fafbfc", borderBottom: "1px solid rgba(0,0,0,0.05)",
          alignItems: "center", flexWrap: "wrap",
        }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Portfolio Allocation</div>
            <canvas ref={canvasRef} width={200} height={200} style={{ display: "block" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 160 }}>
            {rowNames.map(name => {
              const rt  = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
              const pct = grandTotal > 0 ? (rt / grandTotal) * 100 : 0;
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: invColor(name), flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: NAVY, flex: 1, fontWeight: 500 }}>{name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: invColor(name), minWidth: 70, textAlign: "right" }}>{fmt(rt)}</div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: invColor(name),
                    background: invColor(name) + "22",
                    borderRadius: 99, padding: "2px 8px", minWidth: 44, textAlign: "center",
                  }}>
                    {Math.round(pct)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "auto" }}>
          <thead>
            <tr style={{ background: thBg }}>
              <th style={{
                padding: "11px 14px", textAlign: "left", minWidth: 155,
                borderBottom: `1px solid ${thBorder}`,
                position: "sticky", left: 0, zIndex: 2, background: stickyThBg,
                boxShadow: "2px 0 6px rgba(0,0,0,0.06)",
                color: thTextColor, fontWeight: 700,
              }}>
                Category
              </th>
              {MONTHS.map(m => (
                <th key={m} style={{
                  padding: "11px 6px", textAlign: "right", minWidth: 72,
                  borderBottom: `1px solid ${thBorder}`,
                  color: (isIncome || isExpenses || isInvestments) ? "rgba(255,255,255,0.75)" : "#666",
                  fontWeight: 600, fontSize: 12,
                }}>
                  {m}
                </th>
              ))}
              <th style={{
                padding: "11px 14px", textAlign: "right", minWidth: 90,
                borderBottom: `1px solid ${thBorder}`,
                color: thTextColor, fontWeight: 700,
                position: isExpenses ? "static" : "sticky",
                right: isExpenses ? "auto" : 0,
                zIndex: isExpenses ? "auto" : 2,
                background: isExpenses ? "transparent" : stickyThBg,
                boxShadow: isExpenses ? "none" : "-2px 0 6px rgba(0,0,0,0.06)",
              }}>
                Total
              </th>
              {isExpenses && (
                <th style={{
                  padding: "11px 12px", textAlign: "center", minWidth: 120,
                  borderBottom: `1px solid ${thBorder}`,
                  color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: 12,
                  position: "sticky", right: 32, zIndex: 2, background: stickyThBg,
                  boxShadow: "-2px 0 6px rgba(0,0,0,0.06)",
                }}>
                  YTD vs Budget
                </th>
              )}
              <th style={{
                padding: "11px 4px", borderBottom: `1px solid ${thBorder}`, width: 32,
                background: isExpenses ? stickyThBg : "transparent",
                position: isExpenses ? "sticky" : "static",
                right: isExpenses ? 0 : "auto",
                zIndex: isExpenses ? 2 : "auto",
              }} />
            </tr>
          </thead>

          <tbody>
            {rowNames.map((name, ri) => {
              const rowTotal    = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
              const isHovered   = hoveredRow === ri;
              const evenBg      = "#fff";
              const oddBg       = isIncome ? "#f8f9fa" : "#f9fafc";
              const hoverBg     = isExpenses ? "#fff5f5" : isInvestments ? "#f0f8ff" : "#f0f6ff";
              const bg          = isHovered ? hoverBg : ri % 2 === 0 ? evenBg : oddBg;
              const ytdAct      = isExpenses ? rowYtdActual(name) : 0;
              const ytdBud      = isExpenses ? rowYtdBudget(name) : 0;
              const overBudget  = isExpenses && ytdBud > 0 && ytdAct > ytdBud;
              const variance    = isExpenses ? ytdAct - ytdBud : 0;
              const invIsaPct   = isInvestments ? Math.min(100, (rowTotal / ISA_LIMIT) * 100) : 0;

              return (
                <tr
                  key={name}
                  style={{ background: bg, transition: "background 0.15s ease" }}
                  onMouseEnter={() => setHoveredRow(ri)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{
                    padding: isInvestments ? "6px 14px 2px" : "6px 14px",
                    borderBottom: "1px solid #f0f0f0",
                    position: "sticky", left: 0, zIndex: 1, background: bg,
                    boxShadow: "2px 0 6px rgba(0,0,0,0.04)",
                    maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    transition: "background 0.15s ease",
                    borderLeft: isInvestments ? `3px solid ${invColor(name)}` : "none",
                  }}>
                    <NameCell name={name} />
                    {isInvestments && (
                      <div style={{ marginTop: 4, marginBottom: 4, height: 3, background: "#f0f0f0", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", width: invIsaPct + "%",
                          background: invColor(name),
                          borderRadius: 99, transition: "width 0.4s ease",
                        }} />
                      </div>
                    )}
                  </td>

                  {rows[name].map((val, mi) => {
                    const semi = isSemiCell(name, mi);
                    return (
                      <td key={mi} style={{
                        padding: "2px 3px",
                        borderBottom: "1px solid #f0f0f0",
                        background: semi ? YELLOW_BG : "transparent",
                        outline: semi ? `1px solid ${YELLOW_BORDER}` : "none",
                        outlineOffset: -1,
                        transition: "background 0.15s ease",
                      }}>
                        <input
                          type="number" min="0"
                          value={val === 0 ? "" : val}
                          placeholder="0"
                          onChange={e => onUpdate(section, name, mi, parseFloat(e.target.value) || 0)}
                          style={{
                            display: "block", width: "100%", boxSizing: "border-box",
                            border: "none", background: "transparent",
                            textAlign: "right", fontSize: 13, padding: "5px 4px",
                            outline: "none", color: "#222",
                            MozAppearance: "textfield", fontFamily: "inherit",
                          }}
                          onFocus={e => {
                            e.target.parentElement.style.background = (isIncome || isInvestments) ? "#e8f4ff" : (semi ? YELLOW_BG : "transparent");
                            e.target.parentElement.style.outline = `2px solid ${(isIncome || isInvestments) ? BLUE : NAVY}`;
                            e.target.parentElement.style.outlineOffset = "-1px";
                          }}
                          onBlur={e => {
                            e.target.parentElement.style.background = semi ? YELLOW_BG : "transparent";
                            e.target.parentElement.style.outline = semi ? `1px solid ${YELLOW_BORDER}` : "none";
                          }}
                        />
                      </td>
                    );
                  })}

                  <td style={{
                    padding: "6px 14px", textAlign: "right",
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: 700,
                    color: isIncome ? GREEN : isExpenses ? RED : isInvestments ? invColor(name) : NAVY,
                    position: isExpenses ? "static" : "sticky",
                    right: isExpenses ? "auto" : 0,
                    zIndex: isExpenses ? "auto" : 1,
                    background: isExpenses ? "transparent" : bg,
                    boxShadow: isExpenses ? "none" : "-2px 0 6px rgba(0,0,0,0.04)",
                    whiteSpace: "nowrap", transition: "background 0.15s ease",
                  }}>
                    {fmt(rowTotal)}
                  </td>

                  {isExpenses && (
                    <td style={{
                      padding: "6px 12px", borderBottom: "1px solid #f0f0f0", textAlign: "center",
                      position: "sticky", right: 32, zIndex: 1, background: bg,
                      boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
                      transition: "background 0.15s ease", whiteSpace: "nowrap",
                    }}>
                      {ytdBud > 0 ? (
                        <span style={{
                          display: "inline-block", fontSize: 11, fontWeight: 700,
                          color: overBudget ? RED : GREEN,
                          background: overBudget ? "#fff0f0" : "#f0faf6",
                          border: `1px solid ${overBudget ? "#fcd0d0" : "#c0ead8"}`,
                          borderRadius: 99, padding: "3px 9px",
                        }}>
                          {overBudget ? "▲ +" : "✓ -"}{fmt(Math.abs(variance))}
                        </span>
                      ) : (
                        <span style={{ color: "#ccc", fontSize: 11 }}>—</span>
                      )}
                    </td>
                  )}

                  <td style={{
                    padding: "6px 4px", borderBottom: "1px solid #f0f0f0", textAlign: "center",
                    position: isExpenses ? "sticky" : "static",
                    right: isExpenses ? 0 : "auto",
                    zIndex: isExpenses ? 1 : "auto",
                    background: isExpenses ? bg : "transparent",
                    transition: "background 0.15s ease",
                  }}>
                    <button
                      onClick={() => onDeleteRow(section, name)}
                      title="Delete row"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ccc", fontSize: 18, lineHeight: 1, padding: "0 2px",
                        borderRadius: 4, transition: "color 0.2s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = RED}
                      onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
                    >×</button>
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr style={{ background: totalRowBg, fontWeight: 700 }}>
              <td style={{
                padding: "11px 14px", color: totalRowText, borderTop: totalRowBdr,
                position: "sticky", left: 0, zIndex: 1, background: stickyTotalBg,
                boxShadow: "2px 0 6px rgba(0,0,0,0.06)", fontWeight: 800,
              }}>
                Total
              </td>
              {monthTotals.map((t, i) => (
                <td key={i} style={{
                  padding: "11px 6px", textAlign: "right", borderTop: totalRowBdr,
                  color: totalRowText, whiteSpace: "nowrap",
                }}>
                  {t > 0 ? fmt(t) : "—"}
                </td>
              ))}
              <td style={{
                padding: "11px 14px", textAlign: "right", borderTop: totalRowBdr,
                color: totalRowText,
                position: isExpenses ? "static" : "sticky",
                right: isExpenses ? "auto" : 0,
                zIndex: isExpenses ? "auto" : 1,
                background: isExpenses ? totalRowBg : stickyTotalBg,
                boxShadow: isExpenses ? "none" : "-2px 0 6px rgba(0,0,0,0.06)",
                whiteSpace: "nowrap", fontWeight: 800,
              }}>
                {fmt(grandTotal)}
                {isInvestments && proj5yr > 0 && (
                  <div style={{ fontSize: 10, fontWeight: 500, opacity: 0.8, marginTop: 2 }}>
                    ↗ {fmt(proj5yr)} in 5yr
                  </div>
                )}
              </td>
              {isExpenses && (() => {
                const ytdTotalAct = monthTotals.slice(0, MONTHS_ELAPSED).reduce((a, v) => a + v, 0);
                const ytdTotalBud = (grandTotal / 12) * MONTHS_ELAPSED;
                const over = ytdTotalBud > 0 && ytdTotalAct > ytdTotalBud;
                const diff = ytdTotalAct - ytdTotalBud;
                return (
                  <td style={{
                    padding: "11px 12px", textAlign: "center", borderTop: totalRowBdr,
                    color: totalRowText, position: "sticky", right: 32, zIndex: 1,
                    background: stickyTotalBg, boxShadow: "-2px 0 6px rgba(0,0,0,0.06)",
                    whiteSpace: "nowrap", fontWeight: 800, fontSize: 12,
                  }}>
                    {ytdTotalBud > 0 ? `${over ? "▲ +" : "✓ -"}${fmt(Math.abs(diff))}` : "—"}
                  </td>
                );
              })()}
              <td style={{
                borderTop: totalRowBdr, background: totalRowBg,
                position: isExpenses ? "sticky" : "static",
                right: isExpenses ? 0 : "auto",
                zIndex: isExpenses ? 1 : "auto",
              }} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <div style={{
        padding: "12px 16px", borderTop: "1px solid rgba(0,0,0,0.05)",
        display: "flex", gap: 8, alignItems: "center",
      }}>
        <input
          value={newRowName}
          onChange={e => setNewRowName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addRow()}
          placeholder="New category name…"
          style={{
            flex: 1, border: "1px solid #d0d8e0", borderRadius: 8,
            padding: "8px 12px", fontSize: 13, outline: "none",
            fontFamily: "inherit", transition: "border-color 0.2s ease",
          }}
          onFocus={e => e.target.style.borderColor = NAVY}
          onBlur={e => e.target.style.borderColor = "#d0d8e0"}
        />
        <button
          onClick={addRow}
          style={{
            background: NAVY, color: "#fff", border: "none", borderRadius: 8,
            padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600,
            whiteSpace: "nowrap", transition: "all 0.2s ease",
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
