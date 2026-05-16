import { useState, useEffect } from "react";

const ICONS = ["📊", "💰", "💸", "📈", "⚙️", "🤖"];

export default function TabBar({ tabs, active, onChange }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  /* Push page content up so it isn't hidden behind the fixed bottom bar */
  useEffect(() => {
    document.body.style.paddingBottom = isMobile ? "70px" : "";
    return () => { document.body.style.paddingBottom = ""; };
  }, [isMobile]);

  if (isMobile) {
    return (
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: "flex",
        background: "#fff",
        borderTop: "1px solid #d0d8e0",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.08)",
      }}>
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => onChange(i)}
            style={{
              flex: 1,
              minHeight: 56,
              border: "none",
              background: "transparent",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              cursor: "pointer",
              padding: "6px 2px",
              color: active === i ? "#1a3a5c" : "#999",
              borderTop: active === i ? "2px solid #1a3a5c" : "2px solid transparent",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{ICONS[i]}</span>
            <span style={{ fontSize: 10, fontWeight: active === i ? 700 : 400, lineHeight: 1.2 }}>
              {tab}
            </span>
          </button>
        ))}
      </nav>
    );
  }

  /* Desktop: existing top tab bar, unchanged */
  return (
    <div style={{ display:"flex", background:"#f0f4f8", borderBottom:"1px solid #d0d8e0", overflowX:"auto" }}>
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onChange(i)}
          style={{
            padding:"10px 18px",
            border:"none",
            background: active === i ? "#fff" : "transparent",
            borderBottom: active === i ? "2px solid #1a3a5c" : "2px solid transparent",
            color: active === i ? "#1a3a5c" : "#666",
            fontWeight: active === i ? 700 : 400,
            cursor:"pointer",
            fontSize:14,
            whiteSpace:"nowrap",
          }}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
