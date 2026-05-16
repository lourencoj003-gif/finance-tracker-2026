import { useState } from "react";

const NAVY  = "#1a3a5c";
const GREEN = "#1D9E75";
const BLUE  = "#378ADD";
const RED   = "#E24B4A";

function fmt(n) {
  return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function monthsRemaining(targetYear, targetMonth) {
  const now = new Date();
  const diff = (targetYear - now.getFullYear()) * 12 + (targetMonth - 1 - now.getMonth());
  return Math.max(1, diff);
}

function formatMonthYear(year, month) {
  return new Date(year, month - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

function PotCard({ pot, onArchive, onRestore, onDelete, contribValue, onContribChange, onContribAdd }) {
  const months   = monthsRemaining(pot.targetYear, pot.targetMonth);
  const remaining  = pot.target - pot.saved;
  const monthlyNeeded = remaining > 0 ? remaining / months : 0;
  const progress  = Math.min(100, pot.target > 0 ? (pot.saved / pot.target) * 100 : 0);
  const isComplete = pot.saved >= pot.target;

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      boxShadow: "0 1px 4px #0001",
      padding: 18,
      borderLeft: `4px solid ${isComplete ? GREEN : BLUE}`,
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: NAVY }}>{pot.name}</div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
            Target {fmt(pot.target)} by {formatMonthYear(pot.targetYear, pot.targetMonth)}
          </div>
        </div>

        {pot.archived ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={onRestore} style={{ background: "#f0f4f8", color: "#555", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Restore
            </button>
            <button onClick={onDelete} style={{ background: "#ffeaea", color: RED, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={onArchive}
            style={{
              background: isComplete ? GREEN : "#f0f4f8",
              color: isComplete ? "#fff" : "#888",
              border: "none",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isComplete ? "Complete ✓" : "Mark done"}
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ background: "#f0f4f8", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: 6 }}>
        <div style={{
          width: `${progress}%`,
          height: "100%",
          background: isComplete ? GREEN : BLUE,
          borderRadius: 99,
          transition: "width 0.4s",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888", marginBottom: 10 }}>
        <span>Saved: {fmt(pot.saved)}</span>
        <span>{Math.round(progress)}%</span>
      </div>

      {/* Monthly needed + contribution input */}
      {!pot.archived && !isComplete && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, color: NAVY, fontWeight: 600 }}>
            {fmt(monthlyNeeded)}<span style={{ color: "#888", fontWeight: 400 }}>/mo</span>
            <span style={{ color: "#aaa", fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
              {months} month{months !== 1 ? "s" : ""} left
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="number"
              min="0"
              placeholder="Add £"
              value={contribValue}
              onChange={e => onContribChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onContribAdd()}
              style={{
                width: 76,
                border: "1px solid #d0d8e0",
                borderRadius: 6,
                padding: "5px 8px",
                fontSize: 12,
                outline: "none",
                fontFamily: "inherit",
                color: "#333",
              }}
            />
            <button
              onClick={onContribAdd}
              style={{
                background: BLUE,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Add
            </button>
          </div>
        </div>
      )}

      {isComplete && !pot.archived && (
        <div style={{ fontSize: 13, color: GREEN, fontWeight: 700 }}>Goal reached — archive when ready.</div>
      )}
    </div>
  );
}

export default function PotsTab() {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const defaultDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;
  const minDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [pots, setPots]               = useState([]);
  const [form, setForm]               = useState({ name: "", target: "", date: defaultDate });
  const [errors, setErrors]           = useState({});
  const [contribs, setContribs]       = useState({});
  const [showArchived, setShowArchived] = useState(false);

  const activePots   = pots.filter(p => !p.archived);
  const archivedPots = pots.filter(p => p.archived);

  const totalMonthly = activePots.reduce((sum, p) => {
    const months = monthsRemaining(p.targetYear, p.targetMonth);
    return sum + Math.max(0, p.target - p.saved) / months;
  }, 0);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.target || isNaN(Number(form.target)) || Number(form.target) <= 0) e.target = "Enter a valid amount.";
    if (!form.date) e.date = "Pick a target month.";
    return e;
  }

  function addPot() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    const [y, m] = form.date.split("-").map(Number);
    setPots(prev => [...prev, {
      id: Date.now(),
      name: form.name.trim(),
      target: Number(form.target),
      targetYear: y,
      targetMonth: m,
      saved: 0,
      archived: false,
    }]);
    setForm(f => ({ ...f, name: "", target: "" }));
  }

  function archive(id)   { setPots(prev => prev.map(p => p.id === id ? { ...p, archived: true  } : p)); }
  function restore(id)   { setPots(prev => prev.map(p => p.id === id ? { ...p, archived: false } : p)); }
  function remove(id)    { setPots(prev => prev.filter(p => p.id !== id)); }

  function addContrib(id) {
    const val = Number(contribs[id] || 0);
    if (val <= 0) return;
    setPots(prev => prev.map(p => p.id === id
      ? { ...p, saved: Math.min(p.saved + val, p.target) }
      : p
    ));
    setContribs(prev => ({ ...prev, [id]: "" }));
  }

  const inputStyle = (hasError) => ({
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${hasError ? RED : "#d0d8e0"}`,
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
    color: "#333",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Total monthly commitment banner */}
      <div style={{ background: NAVY, borderRadius: 10, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#a8c4e0", fontSize: 12, fontWeight: 500, marginBottom: 2 }}>Total monthly commitment</div>
          <div style={{ color: "#fff", fontSize: 26, fontWeight: 700 }}>{fmt(totalMonthly)}</div>
        </div>
        <div style={{ color: "#a8c4e0", fontSize: 12, textAlign: "right" }}>
          {activePots.length} active pot{activePots.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Add pot form */}
      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px #0001", padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: NAVY, marginBottom: 12 }}>New pot</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Name */}
          <div>
            <input
              placeholder="Name (e.g. New Shoes)"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && addPot()}
              style={inputStyle(errors.name)}
            />
            {errors.name && <div style={{ color: RED, fontSize: 11, marginTop: 3 }}>{errors.name}</div>}
          </div>

          {/* Target amount + date row */}
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                min="1"
                placeholder="Target amount (e.g. 790)"
                value={form.target}
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
                style={inputStyle(errors.target)}
              />
              {errors.target && <div style={{ color: RED, fontSize: 11, marginTop: 3 }}>{errors.target}</div>}
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="month"
                value={form.date}
                min={minDate}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={inputStyle(errors.date)}
              />
              {errors.date && <div style={{ color: RED, fontSize: 11, marginTop: 3 }}>{errors.date}</div>}
            </div>
          </div>

          <button
            onClick={addPot}
            style={{
              alignSelf: "flex-start",
              background: NAVY,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "9px 20px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Add pot
          </button>
        </div>
      </div>

      {/* Empty state */}
      {activePots.length === 0 && (
        <div style={{ textAlign: "center", color: "#bbb", fontSize: 13, padding: "28px 0" }}>
          No active pots — add one above to start saving.
        </div>
      )}

      {/* Active pot cards */}
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

      {/* Archived section */}
      {archivedPots.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived(v => !v)}
            style={{ background: "none", border: "none", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: "2px 0" }}
          >
            {showArchived ? "▼" : "▶"} {archivedPots.length} archived pot{archivedPots.length !== 1 ? "s" : ""}
          </button>
          {showArchived && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8, opacity: 0.75 }}>
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
        background: "#f0f6ff",
        border: "1px solid #c0d8f0",
        borderRadius: 8,
        padding: "10px 14px",
        fontSize: 12,
        color: "#555",
        lineHeight: 1.6,
      }}>
        <strong>Tip:</strong> These amounts are not yet reflected in your budget — ask Marcus to update your plan.
      </div>

    </div>
  );
}
