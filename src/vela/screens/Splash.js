import { useEffect, useState } from 'react';
import { t } from '../theme';
import Orb from '../Orb';

export default function Splash({ onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 80);
    const t2 = setTimeout(() => onDone(), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: t.bg,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease',
    }}>
      <div style={{ marginBottom: 24, animation: 'orbPulse 2.4s ease-in-out infinite' }}>
        <Orb size={88} />
      </div>
      <div style={{ fontSize: 40, fontWeight: 800, color: t.text, letterSpacing: '-1.5px', lineHeight: 1 }}>
        Vela
      </div>
      <div style={{ fontSize: 16, color: t.muted, marginTop: 10, letterSpacing: '0.3px' }}>
        Meet Vela
      </div>
      <style>{`
        @keyframes orbPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50%       { transform: scale(1.08); filter: brightness(1.2); }
        }
      `}</style>
    </div>
  );
}
