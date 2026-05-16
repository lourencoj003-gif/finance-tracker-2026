import { useState } from "react";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const NAVY  = "#1a3a5c";
const GREEN = "#1D9E75";
const RED   = "#E24B4A";

function fmt(n) {
  return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const DEFAULT_BUDGETS = [
  { id: 1, category: "Food",          monthly: 100 },
  { id: 2, category: "Transport",     monthly: 32  },
  { id: 3, category: "Entertainment", monthly: 20  },
  { id: 4, category: "Clothing",      monthly: 150 },
  { id: 5, category: "Monthly Sub",   monthly: 58  },
  { id: 6, category: "Date Night",    monthly: 300 },
];

export default function SettingsTab({ semiMos, setSemiMos, semiAmt, setSemiAmt }) {
  const [budgets, setBudgets]     = useState(() => {
    try { const s = localStorage.getItem("financeBudgets"); return s ? JSON.parse(s) : DEFAULT_BUDGETS; }
    catch { return DEFAULT_BUDGETS; }
  });
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]     = useState("");
  const [editCat, setEditCat]     = useState("");
  const [newCat, setNewCat]       = useState("");
  const [newAmt, setNewAmt]       = useState("");
  const [amtInput, setAmtInput]   = useState(String(semiAmt));

  function saveBudgets(next) {
    setBudgets(next);
    localStorage.setItem("financeBudgets", JSON.stringify(next));
  }

  function toggleMonth(i) {
    setSemiMos(prev =>
      prev.includes(i) ? prev.filter(m => m !== i) : [...prev, i].sort((a, b) => a - b)
    );
  }

  function commitAmt() {
    const v = parseFloat(amtInput);
    if (!isNaN(v) && v > 0) setSemiAmt(v);
  }

  function startEdit(id, cat, monthly) {
    setEditingId(id); setEditCat(cat); setEditVal(String(monthly));
  }

  function saveEdit(id) {
    saveBudgets(budgets.map(b =>
      b.id === id ? { ...b, category: editCat.trim() || b.category, monthly: parseFloat(editVal) || b.monthly } : b
    ));
    setEditingId(null);
  }

  function addBudget() {
    if (!newCat.trim() || !newAmt) return;
    saveBudgets([...budgets, { id: Date.now(), category: newCat.trim(), monthly: parseFloat(newAmt) || 0 }]);
    setNewCat(""); setNewAmt("");
  }

  const totalBudget = budgets.reduce((a, b) => a + b.monthly, 0);

  const fieldStyle = (err) => ({
    width: "100%", boxSizing: "border-box",
    border: `1px solid ${err ? RED : "#d0d8e0"}`, borderRadius: 8,
    padding: "10px 12px", fontSize: 13, outline: "none",
    fontFamily: "inherit", color: "#333", transition: "border-color 0.2s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 820 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)", borderRadius: 16, padding: "20px 24px", color: "#fff" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Settings</div>
        <div style={{ fontSize: 13, opacity: 0.75 }}>Configure your finance tracker preferences</div>
      </div>

      {/* Semi-annual subscription configurator */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 2 }}>Semi-Annual Subscription</div>
          <div style={{ fontSize: 12, color: "#999" }}>Select which months your subscription is charged and the amount</div>
        </div>

        <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Month pills */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Charge months
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {MONTHS_SHORT.map((m, i) => {
                const active = semiMos.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleMonth(i)}
                    style={{
                      padding: "8px 14px", borderRadius: 99,
                      border: `2px solid ${active ? GREEN : "#e0e8f0"}`,
                      background: active ? GREEN : "#fff",
                      color: active ? "#fff" : "#888",
                      fontSize: 12, fontWeight: 700, cursor: "pointer",
                      transition: "all 0.2s ease",
                      transform: active ? "scale(1.06)" : "scale(1)",
                      boxShadow: active ? `0 4px 12px ${GREEN}55` : "none",
                    }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = GREEN; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "#e0e8f0"; }}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11, color: "#bbb", marginTop: 8 }}>
              {semiMos.length === 0
                ? "No months selected — click months above to set charge dates"
                : `Charged in: ${semiMos.map(i => MONTHS_SHORT[i]).join(", ")}`}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Subscription amount
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "0 0 160px" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: 14, pointerEvents: "none" }}>£</span>
                <input
                  type="number" min="0"
                  value={amtInput}
                  onChange={e => setAmtInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && commitAmt()}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    border: "1px solid #d0d8e0", borderRadius: 8,
                    padding: "10px 12px 10px 28px",
                    fontSize: 17, fontWeight: 700, color: NAVY,
                    outline: "none", fontFamily: "inherit", transition: "border-color 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = NAVY}
                  onBlur={e => { e.target.style.borderColor = "#d0d8e0"; commitAmt(); }}
                />
              </div>
              <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.6 }}>
                per charge<br />
                <strong style={{ color: NAVY }}>{fmt(semiAmt * semiMos.length)}</strong> per year ({semiMos.length} charge{semiMos.length !== 1 ? "s" : ""})
              </div>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
              Preview in expenses table
            </div>
            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #f0f0f0", overflowX: "auto" }}>
              <div style={{ display: "flex", background: "#f5f7fa", minWidth: 600 }}>
                <div style={{ padding: "7px 14px", minWidth: 130, flexShrink: 0, fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Category
                </div>
                {MONTHS_SHORT.map((m, i) => (
                  <div key={i} style={{ flex: 1, padding: "7px 3px", textAlign: "center", fontSize: 10, fontWeight: 700, color: "#aaa" }}>{m}</div>
                ))}
              </div>
              <div style={{ display: "flex", background: "#fff", minWidth: 600 }}>
                <div style={{ padding: "9px 14px", minWidth: 130, flexShrink: 0, fontWeight: 600, color: NAVY, fontSize: 12 }}>
                  Semi-Annual Sub
                </div>
                {MONTHS_SHORT.map((_, i) => {
                  const charged = semiMos.includes(i);
                  return (
                    <div key={i} style={{
                      flex: 1, padding: "7px 3px", textAlign: "center",
                      background: charged ? "#fffde7" : "transparent",
                      outline: charged ? "1px solid #f9e400" : "none",
                      outlineOffset: -1,
                      color: charged ? "#b8860b" : "#ccc",
                      fontWeight: charged ? 700 : 400,
                      fontSize: 11,
                    }}>
                      {charged ? String(semiAmt.toFixed(0)) : "—"}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly budget targets */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 2 }}>Monthly Budget Targets</div>
            <div style={{ fontSize: 12, color: "#999" }}>Set spending limits per category</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, lineHeight: 1 }}>{fmt(totalBudget)}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>total / month</div>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8f9fc" }}>
                <th style={{ padding: "10px 20px", textAlign: "left",  fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Category</th>
                <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Monthly</th>
                <th style={{ padding: "10px 20px", textAlign: "right", fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Annual</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {budgets.map((b, idx) => (
                <tr key={b.id} style={{ background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "10px 20px", borderBottom: "1px solid #f5f5f5" }}>
                    {editingId === b.id ? (
                      <input
                        value={editCat}
                        onChange={e => setEditCat(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveEdit(b.id)}
                        autoFocus
                        style={{ border: `1px solid ${NAVY}`, borderRadius: 6, padding: "4px 8px", fontSize: 13, outline: "none", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 500, color: NAVY }}>{b.category}</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #f5f5f5" }}>
                    {editingId === b.id ? (
                      <input
                        type="number" min="0"
                        value={editVal}
                        onChange={e => setEditVal(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveEdit(b.id)}
                        style={{ border: `1px solid ${NAVY}`, borderRadius: 6, padding: "4px 8px", fontSize: 13, outline: "none", fontFamily: "inherit", width: 90, textAlign: "right" }}
                      />
                    ) : (
                      <span style={{ fontWeight: 700, color: NAVY }}>{fmt(b.monthly)}</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 20px", textAlign: "right", borderBottom: "1px solid #f5f5f5", color: "#aaa", fontWeight: 500 }}>
                    {editingId !== b.id && fmt(b.monthly * 12)}
                  </td>
                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #f5f5f5", textAlign: "center" }}>
                    {editingId === b.id ? (
                      <button
                        onClick={() => saveEdit(b.id)}
                        style={{ background: GREEN, color: "#fff", border: "none", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        Save
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                        <button
                          onClick={() => startEdit(b.id, b.category, b.monthly)}
                          title="Edit"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 14, padding: "2px 5px", borderRadius: 4, transition: "color 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.color = NAVY}
                          onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
                        >✎</button>
                        <button
                          onClick={() => saveBudgets(budgets.filter(x => x.id !== b.id))}
                          title="Delete"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#ccc", fontSize: 17, padding: "2px 5px", borderRadius: 4, transition: "color 0.2s" }}
                          onMouseEnter={e => e.currentTarget.style.color = RED}
                          onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
                        >×</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ padding: "12px 20px", borderTop: "1px solid #f5f5f5", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addBudget()}
            placeholder="Category name…"
            style={fieldStyle(false)}
          />
          <input
            type="number" min="0"
            value={newAmt}
            onChange={e => setNewAmt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addBudget()}
            placeholder="£/month"
            style={{ ...fieldStyle(false), maxWidth: 120, textAlign: "right" }}
          />
          <button
            onClick={addBudget}
            style={{ background: NAVY, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s", flexShrink: 0 }}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Quick reference */}
      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", padding: "18px 20px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 12 }}>Quick Reference</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            ["Double-click a category name", "to rename it in any tab"],
            ["Click + Add", "to add a new category row"],
            ["Click ×", "to delete a row"],
            ["Advisor tab", "AI-powered personalised financial insights"],
            ["Pots tab", "track sinking funds and savings goals"],
          ].map(([key, val]) => (
            <div key={key} style={{ display: "flex", gap: 12, alignItems: "baseline", fontSize: 13, borderBottom: "1px solid #f8f8f8", paddingBottom: 8 }}>
              <span style={{ fontWeight: 600, color: NAVY, minWidth: 200, flexShrink: 0 }}>{key}</span>
              <span style={{ color: "#888" }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
