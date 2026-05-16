import { useMemo, useState, useRef } from "react";
import { fmt } from "../utils/helpers";
import { sectionTotal, monthlyNet } from "../utils/calculations";

const INJECTION_PATTERNS = [
  /ignore previous instructions/gi,
  /system prompt/gi,
  /you are now/gi,
];

function sanitise(text) {
  let out = text;
  for (const pat of INJECTION_PATTERNS) out = out.replace(pat, "");
  return out.trim();
}

export default function AIAdvisor({ data }) {
  const [chatInput, setChatInput] = useState("");
  const [cooldown, setCooldown] = useState(false);
  const timerRef = useRef(null);

  const insights = useMemo(() => {
    const inc = sectionTotal(data.income);
    const exp = sectionTotal(data.expenses);
    const inv = sectionTotal(data.investments);
    const net = monthlyNet(data);

    const yearInc = inc.reduce((a, v) => a + v, 0);
    const yearExp = exp.reduce((a, v) => a + v, 0);
    const yearInv = inv.reduce((a, v) => a + v, 0);
    const yearNet = net.reduce((a, v) => a + v, 0);

    const tips = [];

    const savingsRate = yearInc > 0 ? ((yearNet + yearInv) / yearInc) * 100 : 0;
    if (savingsRate >= 20) {
      tips.push({ type:"good", text:`Your savings rate is ${Math.round(savingsRate)}% — excellent! Financial advisors recommend at least 20%.` });
    } else if (savingsRate >= 10) {
      tips.push({ type:"ok", text:`Your savings rate is ${Math.round(savingsRate)}%. Consider increasing it towards 20% for long-term financial security.` });
    } else {
      tips.push({ type:"warn", text:`Your savings rate is only ${Math.round(savingsRate)}%. Try to reduce expenses or increase income to save more.` });
    }

    const expRatio = yearInc > 0 ? (yearExp / yearInc) * 100 : 0;
    if (expRatio > 70) {
      tips.push({ type:"warn", text:`Expenses are ${Math.round(expRatio)}% of income. The 50/30/20 rule suggests keeping essential spending under 50%.` });
    } else {
      tips.push({ type:"good", text:`Expenses are ${Math.round(expRatio)}% of income — within a healthy range.` });
    }

    if (yearInv > 0) {
      tips.push({ type:"good", text:`You're investing ${fmt(yearInv)} this year. Consistent investing compounds significantly over time.` });
    } else {
      tips.push({ type:"warn", text:`No investments detected. Even small monthly contributions to an ISA or pension can make a big long-term difference.` });
    }

    const negativeMonths = net.filter(v => v < 0).length;
    if (negativeMonths === 0) {
      tips.push({ type:"good", text:"Every month shows a positive net — great cash flow management!" });
    } else {
      tips.push({ type:"ok", text:`${negativeMonths} month(s) show a deficit. Make sure you have an emergency fund covering at least 3 months of expenses.` });
    }

    return tips;
  }, [data]);

  const colors = { good:"#5DCAA5", ok:"#F5A623", warn:"#E24B4A" };
  const icons  = { good:"✓", ok:"!", warn:"⚠" };

  function handleSend() {
    const clean = sanitise(chatInput);
    if (!clean || cooldown) return;
    // Future: send `clean` to API here
    setChatInput("");
    setCooldown(true);
    timerRef.current = setTimeout(() => setCooldown(false), 3000);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

      {/* FCA disclaimer */}
      <div style={{
        background: "#fffbe6",
        border: "1px solid #f0d060",
        borderRadius: 8,
        padding: 12,
        fontSize: 11,
        lineHeight: 1.6,
        color: "#555",
        marginBottom: 0,
      }}>
        <strong>Disclaimer:</strong> This tool provides financial guidance only and is not regulated financial advice.
        Marcus is not an FCA authorised advisor. Always consult a qualified financial professional before making financial decisions.
      </div>

      {/* Header card */}
      <div style={{ background:"#fff", borderRadius:8, boxShadow:"0 1px 4px #0001", padding:20 }}>
        <div style={{ fontWeight:700, fontSize:16, color:"#1a3a5c", marginBottom:4 }}>AI Financial Advisor</div>
        <div style={{ fontSize:13, color:"#888" }}>Personalised insights based on your 2026 financial data</div>
      </div>

      {/* Insight cards */}
      {insights.map((tip, i) => (
        <div key={i} style={{ background:"#fff", borderRadius:8, boxShadow:"0 1px 4px #0001", padding:16, display:"flex", gap:12, alignItems:"flex-start", borderLeft:`4px solid ${colors[tip.type]}` }}>
          <div style={{ width:24, height:24, borderRadius:"50%", background:colors[tip.type], color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, flexShrink:0 }}>
            {icons[tip.type]}
          </div>
          <div style={{ fontSize:14, color:"#333", lineHeight:1.6 }}>{tip.text}</div>
        </div>
      ))}

      {/* Chat input with rate limiting */}
      <div style={{ background:"#fff", borderRadius:8, boxShadow:"0 1px 4px #0001", padding:16 }}>
        <div style={{ fontWeight:600, fontSize:13, color:"#1a3a5c", marginBottom:8 }}>Ask a question</div>
        <div style={{ display:"flex", gap:8 }}>
          <textarea
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. How can I improve my savings rate?"
            rows={2}
            style={{
              flex: 1,
              border: "1px solid #d0d8e0",
              borderRadius: 6,
              padding: "8px 10px",
              fontSize: 13,
              resize: "none",
              outline: "none",
              fontFamily: "inherit",
              color: "#333",
            }}
          />
          <button
            onClick={handleSend}
            disabled={cooldown || !chatInput.trim()}
            style={{
              minHeight: 44,
              padding: "0 18px",
              background: cooldown || !chatInput.trim() ? "#d0d8e0" : "#1a3a5c",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: cooldown || !chatInput.trim() ? "not-allowed" : "pointer",
              alignSelf: "flex-end",
              transition: "background 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {cooldown ? "Wait…" : "Send"}
          </button>
        </div>
        {cooldown && (
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
            Please wait 3 seconds before sending another message.
          </div>
        )}
      </div>

    </div>
  );
}
