import { useState } from "react";
import { MONTHS, fmt } from "../utils/helpers";

const SEMI_ROW = "Semi-Annual Sub";
const YELLOW_BG = "#fffde7";
const YELLOW_BORDER = "#f9e400";

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
  const [newRowName, setNewRowName] = useState("");
  const [editingName, setEditingName] = useState(null);
  const [nameInput, setNameInput] = useState("");

  const rows = data[section] || {};
  const rowNames = Object.keys(rows);

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

  const rowBg = (ri) => (ri % 2 === 0 ? "#fff" : "#f9fafc");

  return (
    <div style={{ background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden" }}>

      {/* Section header */}
      <div style={{ background: headerBg, padding: "12px 16px", fontWeight: 700, fontSize: 15, color: "#1a3a5c", borderBottom: "1px solid #e0e0e0" }}>
        {title}
      </div>

      {/* Scrollable table */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, tableLayout: "auto" }}>

          <thead>
            <tr style={{ background: "#f5f7fa" }}>
              {/* Sticky category header */}
              <th style={{
                padding: "8px 10px", textAlign: "left", minWidth: 150,
                borderBottom: "1px solid #e0e0e0",
                position: "sticky", left: 0, zIndex: 2, background: "#f5f7fa",
                boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
              }}>
                Category
              </th>

              {/* Month headers */}
              {MONTHS.map((m, mi) => (
                <th key={m} style={{
                  padding: "8px 6px", textAlign: "right", minWidth: 72,
                  borderBottom: "1px solid #e0e0e0",
                  color: "#555", fontWeight: 600,
                }}>
                  {m}
                </th>
              ))}

              {/* Total header */}
              <th style={{
                padding: "8px 12px", textAlign: "right", minWidth: 90,
                borderBottom: "1px solid #e0e0e0",
                color: "#1a3a5c", fontWeight: 700,
                position: "sticky", right: 0, zIndex: 2, background: "#f5f7fa",
                boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
              }}>
                Total
              </th>

              {/* Delete button column */}
              <th style={{ padding: "8px 4px", borderBottom: "1px solid #e0e0e0", width: 30 }} />
            </tr>
          </thead>

          <tbody>
            {rowNames.map((name, ri) => {
              const rowTotal = rows[name].reduce((a, v) => a + (parseFloat(v) || 0), 0);
              const bg = rowBg(ri);

              return (
                <tr key={name} style={{ background: bg }}>

                  {/* Sticky category cell */}
                  <td style={{
                    padding: "5px 10px", borderBottom: "1px solid #f0f0f0",
                    position: "sticky", left: 0, zIndex: 1, background: bg,
                    boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
                    maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {editingName === name ? (
                      <input
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        onBlur={() => {
                          const trimmed = nameInput.trim();
                          if (trimmed && trimmed !== name && !rows[trimmed]) {
                            onRenameRow(section, name, trimmed);
                          }
                          setEditingName(null);
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") e.target.blur();
                          if (e.key === "Escape") setEditingName(null);
                        }}
                        autoFocus
                        style={{ width: "100%", border: "1px solid #1a3a5c", borderRadius: 3, padding: "2px 5px", fontSize: 13 }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => { setEditingName(name); setNameInput(name); }}
                        title="Double-click to rename"
                        style={{ cursor: "text", display: "block", userSelect: "none" }}
                      >
                        {name}
                      </span>
                    )}
                  </td>

                  {/* Month input cells */}
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
                          }}
                          onFocus={e => {
                            e.target.parentElement.style.outline = `2px solid #1a3a5c`;
                          }}
                          onBlur={e => {
                            e.target.parentElement.style.outline = semi ? `1px solid ${YELLOW_BORDER}` : "none";
                          }}
                        />
                      </td>
                    );
                  })}

                  {/* Row total */}
                  <td style={{
                    padding: "5px 12px", textAlign: "right",
                    borderBottom: "1px solid #f0f0f0",
                    fontWeight: 600, color: "#1a3a5c",
                    position: "sticky", right: 0, zIndex: 1, background: bg,
                    boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
                    whiteSpace: "nowrap",
                  }}>
                    {fmt(rowTotal)}
                  </td>

                  {/* Delete button */}
                  <td style={{ padding: "5px 4px", borderBottom: "1px solid #f0f0f0", textAlign: "center" }}>
                    <button
                      onClick={() => onDeleteRow(section, name)}
                      title="Delete row"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ccc", fontSize: 18, lineHeight: 1, padding: "0 2px",
                        borderRadius: 3,
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
                padding: "8px 10px", color: "#1a3a5c",
                borderTop: "2px solid #d0d8e0",
                position: "sticky", left: 0, zIndex: 1, background: "#f0f4f8",
                boxShadow: "2px 0 4px rgba(0,0,0,0.04)",
              }}>
                Total
              </td>
              {monthTotals.map((t, i) => (
                <td key={i} style={{
                  padding: "8px 6px", textAlign: "right",
                  borderTop: "2px solid #d0d8e0", color: "#1a3a5c",
                  whiteSpace: "nowrap",
                }}>
                  {t > 0 ? fmt(t) : "—"}
                </td>
              ))}
              <td style={{
                padding: "8px 12px", textAlign: "right",
                borderTop: "2px solid #d0d8e0", color: "#1a3a5c",
                position: "sticky", right: 0, zIndex: 1, background: "#f0f4f8",
                boxShadow: "-2px 0 4px rgba(0,0,0,0.04)",
                whiteSpace: "nowrap",
              }}>
                {fmt(grandTotal)}
              </td>
              <td style={{ borderTop: "2px solid #d0d8e0" }} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add row */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #f0f0f0", display: "flex", gap: 8, alignItems: "center" }}>
        <input
          value={newRowName}
          onChange={e => setNewRowName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addRow()}
          placeholder="New category name…"
          style={{ flex: 1, border: "1px solid #d0d8e0", borderRadius: 4, padding: "6px 10px", fontSize: 13, outline: "none" }}
          onFocus={e => e.target.style.borderColor = "#1a3a5c"}
          onBlur={e => e.target.style.borderColor = "#d0d8e0"}
        />
        <button
          onClick={addRow}
          style={{
            background: "#1a3a5c", color: "#fff", border: "none",
            borderRadius: 4, padding: "6px 16px", cursor: "pointer",
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
