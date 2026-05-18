import { useEffect, useRef } from 'react';

const KEYFRAMES = `
  @keyframes orbCoreSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes orbBreath {
    0%, 100% { transform: scale(1);    opacity: 0.7; }
    50%       { transform: scale(1.08); opacity: 1; }
  }
  @keyframes ringIdle {
    0%, 100% { transform: scale(1);    opacity: 0.35; }
    50%       { transform: scale(1.06); opacity: 0.55; }
  }
  @keyframes ringListening {
    0%, 100% { transform: scale(1.02); opacity: 0.8; }
    50%       { transform: scale(1.12); opacity: 1; }
  }
  @keyframes ringThinking {
    0%   { transform: scale(1) rotate(0deg);   opacity: 0.5; }
    100% { transform: scale(1) rotate(360deg); opacity: 0.5; }
  }
  @keyframes ringSpeaking {
    0%, 100% { transform: scale(1);    opacity: 0.9; }
    25%       { transform: scale(1.18); opacity: 1; }
    50%       { transform: scale(1.08); opacity: 0.85; }
    75%       { transform: scale(1.22); opacity: 1; }
  }
  @keyframes outerRingIdle {
    0%, 100% { transform: scale(1);    opacity: 0.18; }
    50%       { transform: scale(1.04); opacity: 0.28; }
  }
  @keyframes outerRingListening {
    0%, 100% { transform: scale(1.05); opacity: 0.6; }
    50%       { transform: scale(1.15); opacity: 0.8; }
  }
  @keyframes outerRingThinking {
    0%   { transform: scale(1) rotate(0deg);   opacity: 0.4; }
    100% { transform: scale(1) rotate(-360deg); opacity: 0.4; }
  }
  @keyframes outerRingSpeaking {
    0%, 100% { transform: scale(1.1);  opacity: 0.75; }
    50%       { transform: scale(1.22); opacity: 0.9; }
  }
  @keyframes particleOrbitIdle {
    from { transform: rotate(calc(var(--pr) * 1deg)) translateX(calc(var(--r) * 1px)) rotate(calc(var(--pr) * -1deg)); }
    to   { transform: rotate(calc(var(--pr) * 1deg + 360deg)) translateX(calc(var(--r) * 1px)) rotate(calc(var(--pr) * -1deg - 360deg)); }
  }
  @keyframes glowBreath {
    0%, 100% { opacity: 0.65; }
    50%       { opacity: 1; }
  }
  @keyframes glowPulseDebt {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50%       { opacity: 0.9; transform: scale(1.08); }
  }
  @keyframes glowGold {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50%       { opacity: 1;   transform: scale(1.1); }
  }
`;

const STATE_CFG = {
  idle: {
    core:       'conic-gradient(from 180deg, #8a7a62, #C8B89A, #a08870, #6a5c48, #C8B89A)',
    coreAnim:   'orbCoreSpin 10s linear infinite',
    sphere:     'radial-gradient(circle at 32% 28%, rgba(240,232,220,0.88) 0%, #C8B89A 42%, #8a7a62 72%, #3d3328 100%)',
    ring:       'rgba(200,184,154,0.45)',
    ringAnim:   'ringIdle 3.2s ease-in-out infinite',
    outerRing:  'rgba(200,184,154,0.22)',
    outerAnim:  'outerRingIdle 4s ease-in-out infinite',
    particle:   '#C8B89A',
    orbitDur:   '9s',
    particleOp: 0.7,
    glowColor:  'rgba(200,184,154,0.45)',
    glowAnim:   'glowBreath 3.2s ease-in-out infinite',
    glowSize:   '0 0 40px 12px rgba(200,184,154,0.35), 0 0 80px 30px rgba(200,184,154,0.1)',
  },
  listening: {
    core:       'conic-gradient(from 0deg, #a89880, #E8DDD0, #C8B89A, #8a7860, #C8B89A)',
    coreAnim:   'orbCoreSpin 3s linear infinite',
    sphere:     'radial-gradient(circle at 32% 28%, rgba(248,242,234,0.95) 0%, #E8DDD0 35%, #C8B89A 65%, #6a5c48 100%)',
    ring:       'rgba(232,221,208,0.75)',
    ringAnim:   'ringListening 0.7s ease-in-out infinite',
    outerRing:  'rgba(232,221,208,0.45)',
    outerAnim:  'outerRingListening 0.9s ease-in-out infinite',
    particle:   '#E8DDD0',
    orbitDur:   '3s',
    particleOp: 1,
    glowColor:  'rgba(232,221,208,0.65)',
    glowAnim:   'glowBreath 0.7s ease-in-out infinite',
    glowSize:   '0 0 60px 22px rgba(232,221,208,0.55), 0 0 130px 55px rgba(232,221,208,0.18)',
  },
  thinking: {
    core:       'conic-gradient(from 90deg, #7CAE9E, #C8B89A, #5a8e7e, #A89880, #7CAE9E)',
    coreAnim:   'orbCoreSpin 2s linear infinite',
    sphere:     'radial-gradient(circle at 32% 28%, rgba(200,228,220,0.85) 0%, #7CAE9E 38%, #4a8070 65%, #1a3830 100%)',
    ring:       'rgba(124,174,158,0.6)',
    ringAnim:   'ringThinking 1.8s linear infinite',
    outerRing:  'rgba(124,174,158,0.35)',
    outerAnim:  'outerRingThinking 2.4s linear infinite',
    particle:   '#7CAE9E',
    orbitDur:   '4s',
    particleOp: 0.85,
    glowColor:  'rgba(124,174,158,0.45)',
    glowAnim:   'glowBreath 1.8s ease-in-out infinite',
    glowSize:   '0 0 35px 10px rgba(124,174,158,0.35), 0 0 70px 25px rgba(124,174,158,0.1)',
  },
  speaking: {
    core:       'conic-gradient(from 270deg, #d8cebe, #F0E8DC, #C8B89A, #a09080, #d8cebe)',
    coreAnim:   'orbCoreSpin 1.5s linear infinite',
    sphere:     'radial-gradient(circle at 32% 28%, rgba(248,244,238,0.95) 0%, #E8DDD0 35%, #C8B89A 62%, #6a5c48 100%)',
    ring:       'rgba(232,221,208,0.85)',
    ringAnim:   'ringSpeaking 0.38s ease-in-out infinite',
    outerRing:  'rgba(200,184,154,0.55)',
    outerAnim:  'outerRingSpeaking 0.48s ease-in-out infinite',
    particle:   '#E8DDD0',
    orbitDur:   '2s',
    particleOp: 1,
    glowColor:  'rgba(232,221,208,0.75)',
    glowAnim:   'glowBreath 0.4s ease-in-out infinite',
    glowSize:   '0 0 72px 28px rgba(232,221,208,0.65), 0 0 150px 65px rgba(232,221,208,0.22)',
  },
  payday: {
    core:       'conic-gradient(from 0deg, #8a6820, #C9A96E, #a07830, #6a4e10, #C9A96E)',
    coreAnim:   'orbCoreSpin 4s linear infinite',
    sphere:     'radial-gradient(circle at 32% 28%, rgba(255,240,190,0.95) 0%, #C9A96E 42%, #8a6820 70%, #3d3010 100%)',
    ring:       'rgba(201,169,110,0.75)',
    ringAnim:   'ringIdle 2s ease-in-out infinite',
    outerRing:  'rgba(201,169,110,0.5)',
    outerAnim:  'glowGold 2.4s ease-in-out infinite',
    particle:   '#C9A96E',
    orbitDur:   '5s',
    particleOp: 1,
    glowColor:  'rgba(201,169,110,0.7)',
    glowAnim:   'glowGold 2s ease-in-out infinite',
    glowSize:   '0 0 60px 20px rgba(201,169,110,0.65), 0 0 130px 50px rgba(201,169,110,0.2)',
  },
  debt: {
    core:       'conic-gradient(from 180deg, #8a1a1a, #e85858, #E24B4A, #5a1010, #E24B4A)',
    coreAnim:   'orbCoreSpin 6s linear infinite',
    sphere:     'radial-gradient(circle at 32% 28%, rgba(255,180,180,0.85) 0%, #E24B4A 40%, #8a1a1a 75%, #3a0808 100%)',
    ring:       'rgba(226,75,74,0.6)',
    ringAnim:   'ringIdle 2.8s ease-in-out infinite',
    outerRing:  'rgba(226,75,74,0.3)',
    outerAnim:  'glowPulseDebt 2.8s ease-in-out infinite',
    particle:   '#e85858',
    orbitDur:   '7s',
    particleOp: 0.8,
    glowColor:  'rgba(226,75,74,0.6)',
    glowAnim:   'glowPulseDebt 2.8s ease-in-out infinite',
    glowSize:   '0 0 45px 14px rgba(226,75,74,0.55), 0 0 100px 40px rgba(226,75,74,0.14)',
  },
};

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  angle: (i / 6) * 360,
  delay: -((i / 6) * 9),
  size:  i % 2 === 0 ? 5 : 4,
}));

export default function Orb({ size = 140, state = 'idle', onTap }) {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    const el = document.createElement('style');
    el.id = 'vela-orb-kf';
    el.textContent = KEYFRAMES;
    document.head.appendChild(el);
    return () => {};
  }, []);

  const cfg = STATE_CFG[state] || STATE_CFG.idle;
  const r   = Math.round(size * 0.48);

  return (
    <div
      onClick={onTap}
      style={{
        position: 'relative',
        width:  size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onTap ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    >
      {/* Layer 5 — breathing glow */}
      <div style={{
        position: 'absolute',
        width:  size * 1.6,
        height: size * 1.6,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 70%)`,
        animation: cfg.glowAnim,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Layer 3 — outer state-pulse ring */}
      <div style={{
        position:     'absolute',
        width:        size * 1.32,
        height:       size * 1.32,
        borderRadius: '50%',
        border:       `1.5px solid ${cfg.outerRing}`,
        animation:    cfg.outerAnim,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Layer 2 — middle ring */}
      <div style={{
        position:     'absolute',
        width:        size * 1.14,
        height:       size * 1.14,
        borderRadius: '50%',
        border:       `2px solid ${cfg.ring}`,
        animation:    cfg.ringAnim,
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Layer 4 — 6 orbiting particle dots */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position:     'absolute',
            width:        p.size,
            height:       p.size,
            borderRadius: '50%',
            background:   cfg.particle,
            opacity:      cfg.particleOp,
            '--r':        r,
            '--pr':       p.angle,
            animation:    `particleOrbitIdle ${cfg.orbitDur} linear ${p.delay}s infinite`,
            pointerEvents: 'none',
            zIndex: 3,
            boxShadow:    `0 0 4px 1px ${cfg.particle}`,
          }}
        />
      ))}

      {/* Layer 1 — 3D glass sphere */}
      <div style={{
        position:     'relative',
        width:        size,
        height:       size,
        borderRadius: '50%',
        overflow:     'hidden',
        zIndex:       4,
        boxShadow:    cfg.glowSize,
        transition:   'box-shadow 0.7s ease',
        flexShrink:   0,
      }}>
        <div style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '50%',
          background:   cfg.core,
          animation:    cfg.coreAnim,
          transition:   'background 0.7s ease',
        }} />
        <div style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '50%',
          background:   cfg.sphere,
          transition:   'background 0.7s ease',
        }} />
        {/* Glass highlight */}
        <div style={{
          position:     'absolute',
          top:          '8%',
          left:         '14%',
          width:        '38%',
          height:       '28%',
          borderRadius: '50%',
          background:   'radial-gradient(ellipse, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.06) 70%, transparent 100%)',
          transform:    'rotate(-20deg)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position:     'absolute',
          bottom:       '6%',
          right:        '10%',
          width:        '22%',
          height:       '14%',
          borderRadius: '50%',
          background:   'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
