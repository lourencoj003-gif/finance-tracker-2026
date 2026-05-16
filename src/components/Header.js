import { useMemo } from "react";

const TODAY = new Date().toLocaleDateString("en-GB", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

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
  const netColor = yearNet >= 0 ? "#5DCAA5" : "#E24B4A";

  return (
    <div style={{
      background: "linear-gradient(135deg, #1a3a5c 0%, #2d5a8e 100%)",
      color: "#fff",
      padding: "18px 24px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
      boxShadow: "0 2px 16px rgba(26,58,92,0.35)",
    }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          Finance Command Centre
        </div>
        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 5, fontWeight: 400 }}>
          {TODAY}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: netColor, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {formatted}
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 5 }}>
          {yearNet >= 0 ? "year surplus" : "year deficit"}
        </div>
      </div>
    </div>
  );
}
