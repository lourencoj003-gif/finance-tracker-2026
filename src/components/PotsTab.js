import { useState } from "react";

const NAVY   = "#1a3a5c";
const GREEN  = "#1D9E75";
const BLUE   = "#378ADD";
const RED    = "#E24B4A";
const ORANGE = "#F5A623";

const CIRC = 2 * Math.PI * 50; // circumference for r=50

function fmt(n) {
  return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthsRemaining(targetYear, targetMonth) {
  const now  = new Date();
  const diff = (targetYear - now.getFullYear()) * 12 + (targetMonth - 1 - now.getMonth());
  return Math.max(1, diff);
}

function formatMonthYear(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function urgencyGradient(months, isComplete) {
  if (isComplete) return "linear-gradient(135deg, #17875f 0%, #1D9E75 100%)";
  if (months > 6)  return "linear-gradient(135deg, #1D9E75 0%, #0d7a58 100%)";
  if (months >= 3) return "linear-gradient(135deg, #e0951a 0%, #F5A623 100%)";
  return "linear-gradient(135deg, #c93c3b 0%, #E24B4A 100%)";
}

function urgencyLabel(months, isComplete) {
  if (isComplete) return { text: "Complete", bg: "rgba(255,255,255,0.25)" };
  if (months > 6)  return { text: months + " months away", bg: "rgba(255,255,255,0.2)" };
  if (months >= 3) return { text: months + " months — soon", bg: "rgba(0,0,0,0.15)" };
  return { text: months + " month" + (months !== 1 ? "s" : "") + " — urgent!", bg: "rgba(0,0,0,0.2)" };
}

function PotCard({ pot, onArchive, onRestore, onDelete, contribValue, onContribChange, onContribAdd }) {
  const months        = monthsRemaining(pot.targetYear, pot.targetMonth);
  const remaining     = Math.max(0, pot.target - pot.saved);
  const monthlyNeeded = remaining > 0 ? remaining / months : 0;
  const progress      = Math.min(100, pot.target > 0 ? (pot.saved / pot.target) * 100 : 0);
  const isComplete    = pot.saved >= pot.target;
  const offset        = CIRC - (progress / 100) * CIRC;
  const { text: urgText, bg: urgBg } = urgencyLabel(months, isComplete);

  return (
    <div style={{
      background: urgencyGradient(months, isComplete),
      borderRadius: 20,
      padding: "22px 22px 18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
      color: "#fff",
      position: "relative",
      overflow: "hidden",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.22)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)";   e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.18)"; }}
    >
      {/* Decorative circles */}
      <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -50, left: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative" }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>{pot.name}</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, opacity: 0.8 }}>Target {fmt(pot.target)} · {formatMonthYear(pot.targetYear, pot.targetMonth)}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, background: urgBg,
              borderRadius: 99, padding: "2px 8px", whiteSpace: "nowrap",
            }}>
              {urgText}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {pot.archived ? (
            <>
              <button onClick={onRestore} style={{ background: "rgba(255,255,255,0.22)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Restore
              </button>
              <button onClick={onDelete} style={{ background: "rgba(0,0,0,0.18)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                Delete
              </button>
            </>
          ) : (
            <button
              onClick={onArchive}
              style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 8, padding: "5px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.32)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            >
              {isComplete ? "Archive" : "Done"}
            </button>
          )}
        </div>
      </div>

      {/* Circle progress + stats */}
      <div style={{ display: "flex", gap: 18, alignItems: "center", position: "relative" }}>
        {/* SVG ring */}
        <div style={{ flexShrink: 0 }}>
          <svg width="108" height="108" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="9" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke="#fff" strokeWidth="9"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            {isComplete ? (
              <text x="60" y="68" textAnchor="middle" fill="#fff" fontSize="28" fontFamily="system-ui, sans-serif">✓</text>
            ) : (
              <>
                <text x="60" y="57" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="bold" fontFamily="system-ui, sans-serif">
                  {Math.round(progress)}%
                </text>
                <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10" fontFamily="system-ui, sans-serif">
                  saved
                </text>
              </>
            )}
          </svg>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!isComplete && (
            <>
              <div style={{ fontSize: 27, fontWeight: 800, lineHeight: 1, marginBottom: 2 }}>{fmt(monthlyNeeded)}</div>
              <div style={{ fontSize: 11, opacity: 0.72, marginBottom: 12 }}>needed per month</div>
            </>
          )}
          {isComplete && (
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 12, lineHeight: 1.3 }}>
              Goal reached!<br />
              <span style={{ fontSize: 12, fontWeight: 500, opacity: 0.8 }}>Archive when ready.</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>Saved</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(pot.saved)}</div>
            </div>
            {!isComplete && (
              <div>
                <div style={{ fontSize: 10, opacity: 0.65, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 1 }}>To go</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{fmt(remaining)}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contribution input */}
      {!pot.archived && !isComplete && (
        <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
          <input
            type="number" min="0"
            placeholder="Add £…"
            value={contribValue}
            onChange={e => onContribChange(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onContribAdd()}
            style={{
              flex: 1, background: "rgba(255,255,255,0.18)",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: 8, padding: "9px 12px",
              fontSize: 13, fontWeight: 600, color: "#fff",
              outline: "none", fontFamily: "inherit",
            }}
          />
          <button
            onClick={onContribAdd}
            style={{
              background: "rgba(255,255,255,0.22)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: 8, padding: "9px 18px",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.34)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export default function PotsTab() {
  const now       = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defaultDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  const minDate     = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [pots, setPots]               = useState([]);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState({ name: "", target: "", date: defaultDate });
  const [errors, setErrors]           = useState({});
  const [contribs, setContribs]       = useState({});
  const [showArchived, setShowArchived] = useState(false);

  const activePots   = pots.filter(p => !p.archived);
  const archivedPots = pots.filter(p => p.archived);

  const totalMonthly = activePots.reduce((sum, p) => {
    const m = monthsRemaining(p.targetYear, p.targetMonth);
    return sum + Math.max(0, p.target - p.saved) / m;
  }, 0);

  function validate() {
    const e = {};
    if (!form.name.trim())   e.name   = "Name required";
    if (!form.target || isNaN(Number(form.target)) || Number(form.target) <= 0) e.target = "Valid amount required";
    if (!form.date)          e.date   = "Pick a month";
    return e;
  }

  function addPot() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    const [y, m] = form.date.split("-").map(Number);
    setPots(prev => [...prev, {
      id: Date.now(), name: form.name.trim(),
      target: Number(form.target), targetYear: y, targetMonth: m,
      saved: 0, archived: false,
    }]);
    setForm(f => ({ ...f, name: "", target: "" }));
    setShowForm(false);
  }

  function archive(id) { setPots(prev => prev.map(p => p.id === id ? { ...p, archived: true  } : p)); }
  function restore(id) { setPots(prev => prev.map(p => p.id === id ? { ...p, archived: false } : p)); }
  function remove(id)  { setPots(prev => prev.filter(p => p.id !== id)); }

  function addContrib(id) {
    const val = Number(contribs[id] || 0);
    if (val <= 0) return;
    setPots(prev => prev.map(p => p.id === id ? { ...p, saved: Math.min(p.saved + val, p.target) } : p));
    setContribs(prev => ({ ...prev, [id]: "" }));
  }

  const errStyle = { color: RED, fontSize: 11, marginTop: 3 };
  const inputStyle = (hasErr) => ({
    width: "100%", boxSizing: "border-box",
    border: `1px solid ${hasErr ? RED : "#d0d8e0"}`, borderRadius: 8,
    padding: "10px 12px", fontSize: 13, outline: "none",
    fontFamily: "inherit", color: "#333", transition: "border-color 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)",
        borderRadius: 16, padding: "18px 22px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        boxShadow: "0 4px 20px rgba(26,58,92,0.3)",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Total monthly commitment
          </div>
          <div style={{ color: "#fff", fontSize: 30, fontWeight: 800, lineHeight: 1 }}>{fmt(totalMonthly)}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }}>{activePots.length} active pot{activePots.length !== 1 ? "s" : ""}</div>
            {activePots.length > 0 && (
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{fmt(totalMonthly * 12)} /year</div>
            )}
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setErrors({}); }}
            style={{
              background: showForm ? "rgba(255,255,255,0.15)" : GREEN,
              color: "#fff", border: "none", borderRadius: 10,
              padding: "10px 20px", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s",
              boxShadow: showForm ? "none" : "0 4px 14px rgba(29,158,117,0.45)",
            }}
          >
            {showForm ? "✕ Cancel" : "+ New Pot"}
          </button>
        </div>
      </div>

      {/* Add pot form (modal-style card) */}
      {showForm && (
        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
          border: "1px solid rgba(26,58,92,0.1)",
          overflow: "hidden",
        }}>
          <div style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Create New Pot</div>
            <button
              onClick={() => { setShowForm(false); setErrors({}); }}
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", borderRadius: 6, width: 28, height: 28, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ×
            </button>
          </div>

          <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Pot name</div>
              <input
                placeholder="e.g. New Shoes, Holiday, Emergency Fund"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addPot()}
                style={inputStyle(errors.name)}
                onFocus={e => e.target.style.borderColor = NAVY}
                onBlur={e => e.target.style.borderColor = errors.name ? RED : "#d0d8e0"}
              />
              {errors.name && <div style={errStyle}>{errors.name}</div>}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Target amount</div>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 14, pointerEvents: "none" }}>£</span>
                  <input
                    type="number" min="1"
                    placeholder="0"
                    value={form.target}
                    onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                    style={{ ...inputStyle(errors.target), paddingLeft: 28 }}
                    onFocus={e => e.target.style.borderColor = NAVY}
                    onBlur={e => e.target.style.borderColor = errors.target ? RED : "#d0d8e0"}
                  />
                </div>
                {errors.target && <div style={errStyle}>{errors.target}</div>}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Target month</div>
                <input
                  type="month"
                  value={form.date}
                  min={minDate}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  style={inputStyle(errors.date)}
                  onFocus={e => e.target.style.borderColor = NAVY}
                  onBlur={e => e.target.style.borderColor = errors.date ? RED : "#d0d8e0"}
                />
                {errors.date && <div style={errStyle}>{errors.date}</div>}
              </div>
            </div>

            {/* Preview calculation */}
            {form.target && form.date && !isNaN(Number(form.target)) && Number(form.target) > 0 && (() => {
              const [y, m] = form.date.split("-").map(Number);
              const mos = monthsRemaining(y, m);
              const monthly = Number(form.target) / mos;
              return (
                <div style={{ background: "#f0faf6", borderRadius: 10, padding: "10px 14px", display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase" }}>Monthly needed</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>{fmt(monthly)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "#aaa", fontWeight: 700, textTransform: "uppercase" }}>Months remaining</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>{mos}</div>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={addPot}
              style={{
                background: NAVY, color: "#fff", border: "none", borderRadius: 10,
                padding: "12px 24px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", alignSelf: "flex-start",
                transition: "all 0.2s", boxShadow: "0 4px 14px rgba(26,58,92,0.3)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#16325a"}
              onMouseLeave={e => e.currentTarget.style.background = NAVY}
            >
              + Create Pot
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {activePots.length === 0 && !showForm && (
        <div style={{
          textAlign: "center", padding: "48px 20px",
          background: "#fff", borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🪣</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 6 }}>No active pots</div>
          <div style={{ fontSize: 13, color: "#aaa" }}>Click "+ New Pot" to start saving towards a goal</div>
        </div>
      )}

      {/* Active pot cards — 2-col on wide screens */}
      {activePots.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14,
        }}>
          {activePots.map(pot => (
            <PotCard
              key={pot.id}
              pot={pot}
              onArchive={() => archive(pot.id)}
              onRestore={() => restore(pot.id)}
              onDelete={() => remove(pot.id)}
              contribValue={contribs[pot.id] || ""}
              onContribChange={v => setContribs(prev => ({ ...prev, [pot.id]: v }))}
              onContribAdd={() => addContrib(pot.id)}
            />
          ))}
        </div>
      )}

      {/* Archived section */}
      {archivedPots.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(v => !v)}
            style={{
              background: "none", border: "none", color: "#aaa",
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              padding: "6px 0", display: "flex", alignItems: "center", gap: 6,
              transition: "color 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.color = NAVY}
            onMouseLeave={e => e.currentTarget.style.color = "#aaa"}
          >
            {showArchived ? "▼" : "▶"}
            <span>{archivedPots.length} archived pot{archivedPots.length !== 1 ? "s" : ""}</span>
          </button>
          {showArchived && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14, marginTop: 10, opacity: 0.7 }}>
              {archivedPots.map(pot => (
                <PotCard
                  key={pot.id}
                  pot={pot}
                  onArchive={() => archive(pot.id)}
                  onRestore={() => restore(pot.id)}
                  onDelete={() => remove(pot.id)}
                  contribValue={contribs[pot.id] || ""}
                  onContribChange={v => setContribs(prev => ({ ...prev, [pot.id]: v }))}
                  onContribAdd={() => addContrib(pot.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      <div style={{
        background: "#f0f6ff", border: "1px solid #c0d8f0",
        borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "#555", lineHeight: 1.6,
      }}>
        <strong>Tip:</strong> These amounts are not yet reflected in your budget — ask Marcus in the Advisor tab to update your plan.
      </div>

    </div>
  );
}
