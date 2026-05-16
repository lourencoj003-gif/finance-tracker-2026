import { useState, useEffect, useRef } from "react";

const ICONS = ["📊", "💰", "💸", "📈", "⚙️", "🤖", "🪣"];

const KEYFRAMES = `
  @keyframes tabBounce {
    0%   { transform: scale(1)    translateY(0); }
    30%  { transform: scale(1.3)  translateY(-7px); }
    65%  { transform: scale(0.9)  translateY(0); }
    100% { transform: scale(1)    translateY(0); }
  }
`;

export default function TabBar({ tabs, active, onChange }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [bounceIdx, setBounceIdx] = useState(null);
  const tabRefs = useRef([]);
  const [indicatorLeft, setIndicatorLeft]   = useState(0);
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const [indicatorReady, setIndicatorReady] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    document.body.style.paddingBottom = isMobile ? "80px" : "";
    return () => { document.body.style.paddingBottom = ""; };
  }, [isMobile]);

  /* Slide the desktop underline to the active tab */
  useEffect(() => {
    if (isMobile) return;
    const btn = tabRefs.current[active];
    if (btn) {
      setIndicatorLeft(btn.offsetLeft);
      setIndicatorWidth(btn.offsetWidth);
      setIndicatorReady(true);
    }
  }, [active, isMobile, tabs.length]);

  function handleChange(i) {
    onChange(i);
    setBounceIdx(i);
    setTimeout(() => setBounceIdx(null), 450);
  }

  /* ── Mobile bottom nav ── */
  if (isMobile) {
    return (
      <>
        <style>{KEYFRAMES}</style>
        <nav style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 1000,
          height: 70,
          display: "flex",
          background: "#fff",
          borderTop: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.09)",
        }}>
          {tabs.map((tab, i) => {
            const isActive = active === i;
            return (
              <button
                key={tab}
                onClick={() => handleChange(i)}
                style={{
                  flex: 1,
                  border: "none",
                  background: "transparent",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 2,
                  cursor: "pointer",
                  padding: "6px 2px 10px",
                  WebkitTapHighlightColor: "transparent",
                  position: "relative",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Green dot indicator */}
                <div style={{
                  position: "absolute",
                  top: 6,
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: isActive ? "#1D9E75" : "transparent",
                  transition: "background 0.3s ease",
                  boxShadow: isActive ? "0 0 6px rgba(29,158,117,0.6)" : "none",
                }} />

                <span style={{
                  fontSize: 28,
                  lineHeight: 1,
                  display: "block",
                  animation: bounceIdx === i ? "tabBounce 0.45s ease" : "none",
                }}>
                  {ICONS[i]}
                </span>

                <span style={{
                  fontSize: 9,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? "#1a3a5c" : "#aaa",
                  lineHeight: 1.2,
                  transition: "all 0.25s ease",
                  letterSpacing: "0.01em",
                }}>
                  {tab}
                </span>
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  /* ── Desktop top tab bar with sliding underline ── */
  return (
    <div style={{
      display: "flex",
      background: "#fff",
      borderBottom: "1px solid rgba(0,0,0,0.07)",
      overflowX: "auto",
      position: "relative",
      boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
    }}>
      {tabs.map((tab, i) => {
        const isActive = active === i;
        return (
          <button
            key={tab}
            ref={el => { tabRefs.current[i] = el; }}
            onClick={() => onChange(i)}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = "#1a3a5c";
                e.currentTarget.style.background = "rgba(26,58,92,0.05)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = "#999";
                e.currentTarget.style.background = "transparent";
              }
            }}
            style={{
              padding: "14px 22px",
              border: "none",
              background: "transparent",
              color: isActive ? "#1a3a5c" : "#999",
              fontWeight: isActive ? 700 : 400,
              fontSize: 14,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "color 0.25s ease, background 0.25s ease",
              fontFamily: "inherit",
            }}
          >
            {tab}
          </button>
        );
      })}

      {/* Sliding underline indicator */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: indicatorLeft,
        width: indicatorWidth,
        height: 3,
        background: "#1a3a5c",
        borderRadius: "3px 3px 0 0",
        transition: indicatorReady
          ? "left 0.3s ease, width 0.3s ease"
          : "none",
        opacity: indicatorReady ? 1 : 0,
      }} />
    </div>
  );
}
