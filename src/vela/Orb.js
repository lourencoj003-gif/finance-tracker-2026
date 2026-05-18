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
  @keyframes orbBreathFast {
    0%, 100% { transform: scale(1);    opacity: 0.8; }
    50%       { transform: scale(1.15); opacity: 1; }
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
  @keyframes particleOrbitFast {
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
    core:        'conic-gradient(from 180deg, #6a65cc, #9b97f0, #7F77DD, #4a469a, #7F77DD)',
    coreAnim:    'orbCoreSpin 8s linear infinite',
    sphere:      'radial-gradient(circle at 32% 28%, rgba(200,196,255,0.9) 0%, #7F77DD 40%, #3a369e 75%, #1a1860 100%)',
    ring:        'rgba(127,119,221,0.45)',
    ringAnim:    'ringIdle 3.2s ease-in-out infinite',
    outerRing:   'rgba(127,119,221,0.22)',
    outerAnim:   'outerRingIdle 4s ease-in-out infinite',
    particle:    '#9b97f0',
    orbitDur:    '9s',
    particleOp:  0.7,
    glowColor:   'rgba(127,119,221,0.55)',
    glowAnim:    'glowBreath 3.2s ease-in-out infinite',
    glowSize:    '0 0 40px 12px rgba(127,119,221,0.42), 0 0 80px 30px rgba(127,119,221,0.14)',
  },
  listening: {
    core:        'conic-gradient(from 0deg, #1a6ec0, #60b8ff, #378ADD, #0a4a9a, #378ADD)',
    coreAnim:    'orbCoreSpin 3s linear infinite',
    sphere:      'radial-gradient(circle at 32% 28%, rgba(180,230,255,0.9) 0%, #378ADD 40%, #1a4d9a 75%, #0a2860 100%)',
    ring:        'rgba(55,138,221,0.75)',
    ringAnim:    'ringListening 0.7s ease-in-out infinite',
    outerRing:   'rgba(55,138,221,0.45)',
    outerAnim:   'outerRingListening 0.9s ease-in-out infinite',
    particle:    '#60b8ff',
    orbitDur:    '3s',
    particleOp:  1,
    glowColor:   'rgba(55,138,221,0.75)',
    glowAnim:    'glowBreath 0.7s ease-in-out infinite',
    glowSize:    '0 0 60px 22px rgba(55,138,221,0.68), 0 0 130px 55px rgba(55,138,221,0.22)',
  },
  thinking: {
    core:        'conic-gradient(from 90deg, #2db8c8, #7F77DD, #1a9aaa, #4a469a, #2db8c8)',
    coreAnim:    'orbCoreSpin 2s linear infinite',
    sphere:      'radial-gradient(circle at 32% 28%, rgba(180,240,255,0.85) 0%, #2db8c8 35%, #1a7a85 65%, #0a3840 100%)',
    ring:        'rgba(45,184,200,0.6)',
    ringAnim:    'ringThinking 1.8s linear infinite',
    outerRing:   'rgba(45,184,200,0.35)',
    outerAnim:   'outerRingThinking 2.4s linear infinite',
    particle:    '#2db8c8',
    orbitDur:    '4s',
    particleOp:  0.85,
    glowColor:   'rgba(45,184,200,0.5)',
    glowAnim:    'glowBreath 1.8s ease-in-out infinite',
    glowSize:    '0 0 35px 10px rgba(45,184,200,0.4), 0 0 70px 25px rgba(45,184,200,0.12)',
  },
  speaking: {
    core:        'conic-gradient(from 270deg, #9b97f0, #d0ceff, #7F77DD, #5250c0, #9b97f0)',
    coreAnim:    'orbCoreSpin 1.5s linear infinite',
    sphere:      'radial-gradient(circle at 32% 28%, rgba(220,218,255,0.95) 0%, #9b97f0 35%, #5250c0 65%, #2a2870 100%)',
    ring:        'rgba(155,151,240,0.85)',
    ringAnim:    'ringSpeaking 0.38s ease-in-out infinite',
    outerRing:   'rgba(127,119,221,0.55)',
    outerAnim:   'outerRingSpeaking 0.48s ease-in-out infinite',
    particle:    '#d0ceff',
    orbitDur:    '2s',
    particleOp:  1,
    glowColor:   'rgba(127,119,221,0.85)',
    glowAnim:    'glowBreath 0.4s ease-in-out infinite',
    glowSize:    '0 0 72px 28px rgba(127,119,221,0.82), 0 0 150px 65px rgba(127,119,221,0.32)',
  },
  payday: {
    core:        'conic-gradient(from 0deg, #c8960a, #ffe066, #d4a017, #8a6500, #d4a017)',
    coreAnim:    'orbCoreSpin 4s linear infinite',
    sphere:      'radial-gradient(circle at 32% 28%, rgba(255,248,180,0.95) 0%, #e8b800 40%, #a07800 70%, #503c00 100%)',
    ring:        'rgba(232,184,0,0.75)',
    ringAnim:    'ringIdle 2s ease-in-out infinite',
    outerRing:   'rgba(212,160,23,0.5)',
    outerAnim:   'glowGold 2.4s ease-in-out infinite',
    particle:    '#ffe066',
    orbitDur:    '5s',
    particleOp:  1,
    glowColor:   'rgba(232,184,0,0.75)',
    glowAnim:    'glowGold 2s ease-in-out infinite',
    glowSize:    '0 0 60px 20px rgba(232,184,0,0.7), 0 0 130px 50px rgba(232,184,0,0.22)',
  },
  debt: {
    core:        'conic-gradient(from 180deg, #8a1a1a, #e85858, #E24B4A, #5a1010, #E24B4A)',
    coreAnim:    'orbCoreSpin 6s linear infinite',
    sphere:      'radial-gradient(circle at 32% 28%, rgba(255,180,180,0.85) 0%, #E24B4A 40%, #8a1a1a 75%, #3a0808 100%)',
    ring:        'rgba(226,75,74,0.6)',
    ringAnim:    'ringIdle 2.8s ease-in-out infinite',
    outerRing:   'rgba(226,75,74,0.3)',
    outerAnim:   'glowPulseDebt 2.8s ease-in-out infinite',
    particle:    '#e85858',
    orbitDur:    '7s',
    particleOp:  0.8,
    glowColor:   'rgba(226,75,74,0.6)',
    glowAnim:    'glowPulseDebt 2.8s ease-in-out infinite',
    glowSize:    '0 0 45px 14px rgba(226,75,74,0.55), 0 0 100px 40px rgba(226,75,74,0.14)',
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
      {/* Layer 5 — breathing glow (outermost) */}
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
        position:    'absolute',
        width:       size * 1.32,
        height:      size * 1.32,
        borderRadius: '50%',
        border:      `1.5px solid ${cfg.outerRing}`,
        animation:   cfg.outerAnim,
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Layer 2 — amplitude-reactive middle ring */}
      <div style={{
        position:    'absolute',
        width:       size * 1.14,
        height:      size * 1.14,
        borderRadius: '50%',
        border:      `2px solid ${cfg.ring}`,
        animation:   cfg.ringAnim,
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* Layer 4 — 6 orbiting particle dots */}
      {PARTICLES.map((p, i) => (
        <div
          key={i}
          style={{
            position:    'absolute',
            width:       p.size,
            height:      p.size,
            borderRadius: '50%',
            background:  cfg.particle,
            opacity:     cfg.particleOp,
            '--r':       r,
            '--pr':      p.angle,
            animation:   `particleOrbitIdle ${cfg.orbitDur} linear ${p.delay}s infinite`,
            pointerEvents: 'none',
            zIndex: 3,
            boxShadow:   `0 0 4px 1px ${cfg.particle}`,
          }}
        />
      ))}

      {/* Layer 1 — 3D glass sphere (innermost) */}
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
        {/* Rotating gradient core */}
        <div style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '50%',
          background:   cfg.core,
          animation:    cfg.coreAnim,
          transition:   'background 0.7s ease',
        }} />
        {/* Sphere surface */}
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
          background:   'radial-gradient(ellipse, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 70%, transparent 100%)',
          transform:    'rotate(-20deg)',
          pointerEvents: 'none',
        }} />
        {/* Bottom reflection */}
        <div style={{
          position:     'absolute',
          bottom:       '6%',
          right:        '10%',
          width:        '22%',
          height:       '14%',
          borderRadius: '50%',
          background:   'radial-gradient(ellipse, rgba(255,255,255,0.18) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
