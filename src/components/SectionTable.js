import { useState, useEffect } from "react";
import { MONTHS, fmt } from "../utils/helpers";

const SEMI_ROW     = "Semi-Annual Sub";
const YELLOW_BG    = "#fffde7";
const YELLOW_BORDER = "#f9e400";
const NAVY         = "#1a3a5c";

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

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const rows      = data[section] || {};
  const rowNames  = Object.keys(rows);
  const monthTotals = MONTHS.map((_, i) =>
    rowNames.reduce((sum, name) => sum + (parseFloat(rows[name][i]) || 0), 0)
  );
  const grandTotal = monthTotals.reduce((a, v) => a + v, 0);

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
            width: "100%",
            border: `1px solid ${NAVY}`,
            borderRadius: 4,
            padding: "3px 6px",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
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

  /* ────────────────────────────────────────────────────────────────
     MOBILE — card per category
  ──────────────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 0, borderRadius: 16, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>

        {/* Header */}
        <div style={{
          background: headerBg,
          padding: "14px 16px",
          fontWeight: 700,
          fontSize: 15,
          color: NAVY,
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          {title}
        </div>

        {/* One card per row */}
        <div style={{ background: "#FAFAF8", display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>
          {rowNames.map(name => {
            const rowTotal = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
            return (
              <div key={name} style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                overflow: "hidden",
              }}>
                {/* Card header */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: "1px solid #f0f0f0",
                  background: "#f8f9fc",
                }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: NAVY, flex: 1 }}>
                    <NameCell name={name} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: NAVY }}>{fmt(rowTotal)}</span>
                    <button
                      onClick={() => onDeleteRow(section, name)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ccc", fontSize: 20, lineHeight: 1, padding: 0,
                        transition: "color 0.2s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#E24B4A"}
                      onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* 4-column month grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 0,
                }}>
                  {MONTHS.map((m, mi) => {
                    const semi = isSemiCell(name, mi);
                    return (
                      <div key={mi} style={{
                        background: semi ? YELLOW_BG : "transparent",
                        borderRight: mi % 4 !== 3 ? "1px solid #f0f0f0" : "none",
                        borderBottom: mi < 8 ? "1px solid #f0f0f0" : "none",
                        padding: "6px 4px 4px",
                      }}>
                        <div style={{ fontSize: 9, color: "#aaa", fontWeight: 600, textAlign: "center", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                          {m}
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={rows[name][mi] === 0 ? "" : rows[name][mi]}
                          placeholder="0"
                          onChange={e => onUpdate(section, name, mi, parseFloat(e.target.value) || 0)}
                          style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            border: "none",
                            background: "transparent",
                            textAlign: "center",
                            fontSize: 12,
                            padding: "2px 2px",
                            outline: "none",
                            color: "#222",
                            MozAppearance: "textfield",
                            fontFamily: "inherit",
                          }}
                          onFocus={e => { e.target.parentElement.style.outline = `2px solid ${NAVY}`; e.target.parentElement.style.outlineOffset = "-2px"; }}
                          onBlur={e => { e.target.parentElement.style.outline = "none"; }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Monthly totals row */}
          {rowNames.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "10px 14px", background: "#f0f4f8", fontWeight: 700, fontSize: 13, color: NAVY, borderBottom: "1px solid #e0e8f0" }}>
                Monthly Totals — {fmt(grandTotal)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
                {monthTotals.map((t, i) => (
                  <div key={i} style={{
                    padding: "6px 4px",
                    borderRight: i % 4 !== 3 ? "1px solid #f0f0f0" : "none",
                    borderBottom: i < 8 ? "1px solid #f0f0f0" : "none",
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 9, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 2 }}>{MONTHS[i]}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: NAVY }}>{t > 0 ? "£" + Math.round(t) : "—"}</div>
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
              flex: 1,
              border: "1px solid #d0d8e0",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.2s ease",
            }}
            onFocus={e => e.target.style.borderColor = NAVY}
            onBlur={e => e.target.style.borderColor = "#d0d8e0"}
          />
          <button
            onClick={addRow}
            style={{
              background: NAVY, color: "#fff", border: "none",
              borderRadius: 8, padding: "8px 16px", cursor: "pointer",
              fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            + Add
          </button>
        </div>
      </div>
    );
  }

  /* ────────────────────────────────────────────────────────────────
     DESKTOP — sticky table with hover highlights
  ──────────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", overflow: "hidden" }}>

      <div style={{
        background: headerBg,
        padding: "14px 18px",
        fontWeight: 700,
        fontSize: 15,
        color: NAVY,
        borderBottom: "1px solid rgba(0,0,0,0.06)",
      }}>
        {title}
      </div>

      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "auto" }}>
          <thead>
            <tr style={{ background: "#f5f7fa" }}>
              <th style={{
                padding: "10px 12px", textAlign: "left", minWidth: 155,
                borderBottom: "1px solid #e8ecf0",
                position: "sticky", left: 0, zIndex: 2, background: "#f5f7fa",
                boxShadow: "2px 0 6px rgba(0,0,0,0.04)",
                color: NAVY, fontWeight: 700,
              }}>
                Category
              </th>
              {MONTHS.map(m => (
                <th key={m} style={{
                  padding: "10px 6px", textAlign: "right", minWidth: 72,
                  borderBottom: "1px solid #e8ecf0",
                  color: "#666", fontWeight: 600,
                }}>
                  {m}
                </th>
              ))}
              <th style={{
                padding: "10px 14px", textAlign: "right", minWidth: 90,
                borderBottom: "1px solid #e8ecf0",
                color: NAVY, fontWeight: 700,
                position: "sticky", right: 0, zIndex: 2, background: "#f5f7fa",
                boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
              }}>
                Total
              </th>
              <th style={{ padding: "10px 4px", borderBottom: "1px solid #e8ecf0", width: 32 }} />
            </tr>
          </thead>

          <tbody>
            {rowNames.map((name, ri) => {
              const rowTotal = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
              const isHovered = hoveredRow === ri;
              const bg = isHovered ? "#f0f6ff" : ri % 2 === 0 ? "#fff" : "#f9fafc";
              const stickyBg = isHovered ? "#f0f6ff" : ri % 2 === 0 ? "#fff" : "#f9fafc";

              return (
                <tr
                  key={name}
                  style={{ background: bg, transition: "background 0.15s ease" }}
                  onMouseEnter={() => setHoveredRow(ri)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <td style={{
                    padding: "6px 12px", borderBottom: "1px solid #f0f0f0",
                    position: "sticky", left: 0, zIndex: 1, background: stickyBg,
                    boxShadow: "2px 0 6px rgba(0,0,0,0.04)",
                    maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    transition: "background 0.15s ease",
                  }}>
                    <NameCell name={name} />
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
                      }}>
                        <input
                          type="number"
                          min="0"
                          value={val === 0 ? "" : val}
                          placeholder="0"
                          onChange={e => onUpdate(section, name, mi, parseFloat(e.target.value) || 0)}
                          style={{
                            display: "block",
                            width: "100%",
                            boxSizing: "border-box",
                            border: "none",
                            background: "transparent",
                            textAlign: "right",
                            fontSize: 13,
                            padding: "5px 4px",
                            outline: "none",
                            color: "#222",
                            MozAppearance: "textfield",
                            fontFamily: "inherit",
                          }}
                          onFocus={e => { e.target.parentElement.style.outline = `2px solid ${NAVY}`; }}
                          onBlur={e => { e.target.parentElement.style.outline = semi ? `1px solid ${YELLOW_BORDER}` : "none"; }}
                        />
                      </td>
                    );
                  })}

                  <td style={{
                    padding: "6px 14px", textAlign: "right",
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: 600, color: NAVY,
                    position: "sticky", right: 0, zIndex: 1, background: stickyBg,
                    boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
                    whiteSpace: "nowrap",
                    transition: "background 0.15s ease",
                  }}>
                    {fmt(rowTotal)}
                  </td>

                  <td style={{ padding: "6px 4px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                    <button
                      onClick={() => onDeleteRow(section, name)}
                      title="Delete row"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ccc", fontSize: 18, lineHeight: 1, padding: "0 2px",
                        borderRadius: 4, transition: "color 0.2s ease",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#E24B4A"}
                      onMouseLeave={e => e.currentTarget.style.color = "#ccc"}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Totals row */}
            <tr style={{ background: "#f0f4f8", fontWeight: 700 }}>
              <td style={{
                padding: "10px 12px", color: NAVY,
                borderTop: "2px solid #d0d8e0",
                position: "sticky", left: 0, zIndex: 1, background: "#f0f4f8",
                boxShadow: "2px 0 6px rgba(0,0,0,0.04)",
              }}>
                Total
              </td>
              {monthTotals.map((t, i) => (
                <td key={i} style={{
                  padding: "10px 6px", textAlign: "right",
                  borderTop: "2px solid #d0d8e0", color: NAVY,
                  whiteSpace: "nowrap",
                }}>
                  {t > 0 ? fmt(t) : "—"}
                </td>
              ))}
              <td style={{
                padding: "10px 14px", textAlign: "right",
                borderTop: "2px solid #d0d8e0", color: NAVY,
                position: "sticky", right: 0, zIndex: 1, background: "#f0f4f8",
                boxShadow: "-2px 0 6px rgba(0,0,0,0.04)",
                whiteSpace: "nowrap",
              }}>
                {fmt(grandTotal)}
              </td>
              <td style={{ borderTop: "2px solid #d0d8e0" }} />
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid rgba(0,0,0,0.05)",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}>
        <input
          value={newRowName}
          onChange={e => setNewRowName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addRow()}
          placeholder="New category name…"
          style={{
            flex: 1,
            border: "1px solid #d0d8e0",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
            transition: "border-color 0.2s ease",
          }}
          onFocus={e => e.target.style.borderColor = NAVY}
          onBlur={e => e.target.style.borderColor = "#d0d8e0"}
        />
        <button
          onClick={addRow}
          style={{
            background: NAVY, color: "#fff", border: "none",
            borderRadius: 8, padding: "8px 18px", cursor: "pointer",
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
