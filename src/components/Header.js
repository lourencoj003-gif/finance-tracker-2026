import { useMemo } from "react";

export default function Header({ data }) {
  const yearNet = useMemo(() => {
    if (!data) return 0;
    let total = 0;
    for (let m = 0; m < 12; m++) {
      const inc = Object.values(data.income || {}).reduce((a, r) => a + (parseFloat(r[m]) || 0), 0);
      const exp = Object.values(data.expenses || {}).reduce((a, r) => a + (parseFloat(r[m]) || 0), 0);
      const inv = Object.values(data.investments || {}).reduce((a, r) => a + (parseFloat(r[m]) || 0), 0);
      total += inc - exp - inv;
    }
    return total;
  }, [data]);

  const formatted = "£" + Math.round(Math.abs(yearNet)).toLocaleString("en-GB");

  return (
    <div style={{ background:"#1a3a5c", color:"#fff", padding:"14px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
      <div>
        <div style={{ fontSize:18, fontWeight:700 }}>Financial Command Centre 2026</div>
        <div style={{ fontSize:12, opacity:0.7, marginTop:2 }}>Your personal finance tracker</div>
      </div>
      <div style={{ textAlign:"right" }}>
        <div style={{ fontSize:22, fontWeight:700, color: yearNet >= 0 ? "#5DCAA5" : "#E24B4A" }}>{formatted}</div>
        <div style={{ fontSize:11, opacity:0.7 }}>{yearNet >= 0 ? "year surplus" : "year deficit"}</div>
      </div>
    </div>
  );
}