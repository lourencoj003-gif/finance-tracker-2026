import { useEffect, useState } from 'react';
import { t } from '../theme';

export default function Splash({ onDone }) {
  const [visible, setVisible] = useState(false);
  const [lineLen, setLineLen] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 80);
    const t2 = setTimeout(() => setLineLen(1), 500);
    const t3 = setTimeout(() => onDone(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: t.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease',
    }}>

      {/* SVG V logo with navigation arc */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{ marginBottom: 28, filter: 'drop-shadow(0 0 24px rgba(127,119,221,0.6))' }}
      >
        {/* Navigation arc through the V — drawn first (behind) */}
        <path
          d="M 18 38 Q 60 95 102 38"
          stroke="rgba(127,119,221,0.55)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="120"
          strokeDashoffset={lineLen === 0 ? 120 : 0}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}
        />

        {/* Compass/bearing dot on the arc */}
        <circle
          cx="60"
          cy="78"
          r="3"
          fill="#7F77DD"
          opacity={lineLen === 1 ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease 1.3s' }}
        />

        {/* Serif V — two strokes meeting at a point */}
        {/* Left stroke of V */}
        <path
          d="M 22 28 L 60 82"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right stroke of V */}
        <path
          d="M 98 28 L 60 82"
          stroke="white"
          strokeWidth="7"
          strokeLinecap="round"
          fill="none"
        />
        {/* Serif crossbar — left top */}
        <path
          d="M 14 28 L 30 28"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Serif crossbar — right top */}
        <path
          d="M 90 28 L 106 28"
          stroke="white"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Subtle tick mark above the compass dot — navigation bearing */}
        <path
          d="M 60 62 L 60 68"
          stroke="rgba(127,119,221,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={lineLen === 1 ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease 1.5s' }}
        />
      </svg>

      <div style={{
        fontSize: 13,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.7)',
        letterSpacing: '0.26em',
        textTransform: 'uppercase',
        marginBottom: 6,
      }}>
        Your Financial Navigator
      </div>

      <div style={{
        fontSize: 11,
        color: 'rgba(127,119,221,0.5)',
        letterSpacing: '0.1em',
        marginTop: 6,
      }}>
        Vela
      </div>
    </div>
  );
}
