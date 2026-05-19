import { useEffect, useRef } from 'react';

const KEYFRAMES = `
  @keyframes planetSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ringCW {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes ringCCW {
    from { transform: rotate(0deg); }
    to   { transform: rotate(-360deg); }
  }
  @keyframes planetBreath {
    0%, 100% { transform: scale(1); }
    50%       { transform: scale(1.045); }
  }
  @keyframes glowPulse {
    0%, 100% { opacity: 0.72; transform: scale(1); }
    50%       { opacity: 1;    transform: scale(1.07); }
  }
  @keyframes bandA {
    0%   { transform: translateX(-18%) rotate(-7deg); }
    100% { transform: translateX(18%) rotate(-4deg); }
  }
  @keyframes bandB {
    0%   { transform: translateX(12%) rotate(5deg); }
    100% { transform: translateX(-12%) rotate(2deg); }
  }
  @keyframes speakRipple {
    0%   { transform: scale(1);   opacity: 0.85; }
    100% { transform: scale(2.8); opacity: 0; }
  }
  @keyframes particleOrbit {
    from { transform: rotate(calc(var(--pr) * 1deg)) translateX(calc(var(--r) * 1px)) rotate(calc(var(--pr) * -1deg)); }
    to   { transform: rotate(calc(var(--pr) * 1deg + 360deg)) translateX(calc(var(--r) * 1px)) rotate(calc(var(--pr) * -1deg - 360deg)); }
  }
`;

const STATE_CFG = {
  idle: {
    glowColor:  'rgba(200,184,154,0.4)',
    glowAnim:   'glowPulse 3.6s ease-in-out infinite',
    rings: [
      { scale: 1.46, border: '1px dashed rgba(200,184,154,0.28)', dir: 'ringCW',  dur: '34s', op: 0.58 },
      { scale: 1.23, border: '1px solid rgba(200,184,154,0.38)',  dir: 'ringCCW', dur: '24s', op: 0.68 },
      { scale: 1.09, border: '1.5px dotted rgba(200,184,154,0.44)', dir: 'ringCW', dur: '16s', op: 0.52 },
    ],
    core:     'conic-gradient(from 180deg, #8a7a62, #C8B89A, #a08870, #6a5c48, #C8B89A)',
    coreAnim: 'planetSpin 14s linear infinite',
    sphere:   'radial-gradient(circle at 32% 28%, rgba(240,232,220,0.92) 0%, #C8B89A 42%, #8a7a62 70%, #2d2318 100%)',
    band1: 'rgba(180,162,134,0.2)', bandADur: '20s',
    band2: 'rgba(158,140,114,0.14)', bandBDur: '26s',
    bodyAnim:  'planetBreath 4s ease-in-out infinite',
    particle:  '#C8B89A', pOrbitDur: '11s', pOp: 0.65,
    glowShadow: '0 0 44px 14px rgba(200,184,154,0.36), 0 0 90px 38px rgba(200,184,154,0.11)',
    ripple: false,
  },
  listening: {
    glowColor:  'rgba(88,152,220,0.5)',
    glowAnim:   'glowPulse 0.9s ease-in-out infinite',
    rings: [
      { scale: 1.52, border: '1.5px dashed rgba(100,168,240,0.62)', dir: 'ringCW',  dur: '7s',   op: 0.88 },
      { scale: 1.26, border: '1.5px solid rgba(140,198,255,0.78)',  dir: 'ringCCW', dur: '4.5s', op: 0.96 },
      { scale: 1.1,  border: '2px solid rgba(168,220,255,0.9)',     dir: 'ringCW',  dur: '2.8s', op: 1 },
    ],
    core:     'conic-gradient(from 0deg, #306cb0, #8cbce8, #4888c8, #1048a0, #8cbce8)',
    coreAnim: 'planetSpin 3.5s linear infinite',
    sphere:   'radial-gradient(circle at 32% 28%, rgba(200,228,255,0.95) 0%, #68a4d8 38%, #3470b8 65%, #102040 100%)',
    band1: 'rgba(110,168,230,0.3)', bandADur: '7s',
    band2: 'rgba(88,148,210,0.22)', bandBDur: '9s',
    bodyAnim:  'planetBreath 0.85s ease-in-out infinite',
    particle:  '#8cbce8', pOrbitDur: '4s', pOp: 1,
    glowShadow: '0 0 72px 28px rgba(88,152,220,0.64), 0 0 155px 68px rgba(88,152,220,0.22)',
    ripple: false,
  },
  thinking: {
    glowColor:  'rgba(124,174,158,0.38)',
    glowAnim:   'glowPulse 2s ease-in-out infinite',
    rings: [
      { scale: 1.44, border: '1px dashed rgba(124,174,158,0.28)', dir: 'ringCW',  dur: '28s', op: 0.46 },
      { scale: 1.2,  border: '1px solid rgba(124,174,158,0.42)',  dir: 'ringCCW', dur: '20s', op: 0.54 },
      { scale: 1.08, border: '1.5px dotted rgba(124,174,158,0.5)', dir: 'ringCW', dur: '13s', op: 0.44 },
    ],
    core:     'conic-gradient(from 90deg, #3a7a68, #7CAE9E, #4a8070, #1a5048, #7CAE9E)',
    coreAnim: 'planetSpin 2.8s linear infinite',
    sphere:   'radial-gradient(circle at 32% 28%, rgba(175,215,205,0.88) 0%, #5a9e8e 38%, #3a7060 65%, #0a2020 100%)',
    band1: 'rgba(80,160,138,0.22)', bandADur: '12s',
    band2: 'rgba(60,138,118,0.16)', bandBDur: '16s',
    bodyAnim:  'planetBreath 2.2s ease-in-out infinite',
    particle:  '#7CAE9E', pOrbitDur: '7s', pOp: 0.7,
    glowShadow: '0 0 36px 11px rgba(124,174,158,0.35), 0 0 72px 28px rgba(124,174,158,0.1)',
    ripple: false,
  },
  speaking: {
    glowColor:  'rgba(232,221,208,0.65)',
    glowAnim:   'glowPulse 0.44s ease-in-out infinite',
    rings: [
      { scale: 1.55, border: '1.5px solid rgba(232,221,208,0.62)', dir: 'ringCW',  dur: '5.5s', op: 0.82 },
      { scale: 1.28, border: '2px solid rgba(232,221,208,0.78)',   dir: 'ringCCW', dur: '3.8s', op: 0.92 },
      { scale: 1.12, border: '2.5px solid rgba(232,221,208,0.96)', dir: 'ringCW',  dur: '2.4s', op: 1 },
    ],
    core:     'conic-gradient(from 270deg, #d8cebe, #F0E8DC, #C8B89A, #a09080, #d8cebe)',
    coreAnim: 'planetSpin 1.8s linear infinite',
    sphere:   'radial-gradient(circle at 32% 28%, rgba(255,252,248,0.98) 0%, #E8DDD0 30%, #C8B89A 58%, #5a4a38 100%)',
    band1: 'rgba(225,215,200,0.34)', bandADur: '5s',
    band2: 'rgba(210,200,185,0.26)', bandBDur: '7s',
    bodyAnim:  'planetBreath 0.42s ease-in-out infinite',
    particle:  '#E8DDD0', pOrbitDur: '2.5s', pOp: 1,
    glowShadow: '0 0 82px 34px rgba(232,221,208,0.74), 0 0 175px 78px rgba(232,221,208,0.27)',
    ripple: true,
  },
  payday: {
    glowColor:  'rgba(201,169,110,0.58)',
    glowAnim:   'glowPulse 2.3s ease-in-out infinite',
    rings: [
      { scale: 1.46, border: '1px dashed rgba(201,169,110,0.52)', dir: 'ringCW',  dur: '11s',  op: 0.76 },
      { scale: 1.23, border: '1.5px solid rgba(201,169,110,0.66)', dir: 'ringCCW', dur: '7.5s', op: 0.86 },
      { scale: 1.09, border: '2px solid rgba(201,169,110,0.82)',   dir: 'ringCW',  dur: '4.5s', op: 0.96 },
    ],
    core:     'conic-gradient(from 0deg, #8a6820, #C9A96E, #a07830, #6a4e10, #C9A96E)',
    coreAnim: 'planetSpin 5s linear infinite',
    sphere:   'radial-gradient(circle at 32% 28%, rgba(255,242,195,0.96) 0%, #C9A96E 40%, #8a6820 68%, #2d2208 100%)',
    band1: 'rgba(201,169,110,0.28)', bandADur: '14s',
    band2: 'rgba(178,148,88,0.2)',   bandBDur: '18s',
    bodyAnim:  'planetBreath 2.4s ease-in-out infinite',
    particle:  '#C9A96E', pOrbitDur: '6s', pOp: 1,
    glowShadow: '0 0 66px 24px rgba(201,169,110,0.66), 0 0 148px 60px rgba(201,169,110,0.22)',
    ripple: false,
  },
  debt: {
    glowColor:  'rgba(226,75,74,0.52)',
    glowAnim:   'glowPulse 3.2s ease-in-out infinite',
    rings: [
      { scale: 1.44, border: '1px dashed rgba(226,75,74,0.34)',   dir: 'ringCW',  dur: '22s', op: 0.48 },
      { scale: 1.2,  border: '1px solid rgba(226,75,74,0.5)',     dir: 'ringCCW', dur: '16s', op: 0.58 },
      { scale: 1.08, border: '1.5px solid rgba(226,75,74,0.62)', dir: 'ringCW',  dur: '10s', op: 0.54 },
    ],
    core:     'conic-gradient(from 180deg, #7a1a1a, #E24B4A, #a02020, #4a0808, #E24B4A)',
    coreAnim: 'planetSpin 7s linear infinite',
    sphere:   'radial-gradient(circle at 32% 28%, rgba(255,185,185,0.9) 0%, #E24B4A 38%, #8a1a1a 70%, #2a0505 100%)',
    band1: 'rgba(200,60,60,0.24)', bandADur: '22s',
    band2: 'rgba(172,40,40,0.17)', bandBDur: '28s',
    bodyAnim:  'planetBreath 3.4s ease-in-out infinite',
    particle:  '#e85858', pOrbitDur: '9s', pOp: 0.72,
    glowShadow: '0 0 50px 17px rgba(226,75,74,0.55), 0 0 115px 48px rgba(226,75,74,0.16)',
    ripple: false,
  },
};

const PARTICLES = Array.from({ length: 6 }, (_, i) => ({
  angle: (i / 6) * 360,
  delay: -((i / 6) * 9),
  size:  i % 2 === 0 ? 5 : 3.5,
}));

export default function Orb({ size = 140, state = 'idle', onTap }) {
  const styleInjected = useRef(false);

  useEffect(() => {
    if (styleInjected.current) return;
    styleInjected.current = true;
    if (!document.getElementById('vela-orb-kf')) {
      const el = document.createElement('style');
      el.id = 'vela-orb-kf';
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
    }
  }, []);

  const cfg = STATE_CFG[state] || STATE_CFG.idle;
  const r   = Math.round(size * 0.5);

  return (
    <div
      onClick={onTap}
      style={{
        position: 'relative',
        width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: onTap ? 'pointer' : 'default',
        flexShrink: 0,
      }}
    >
      {/* Glow aura */}
      <div style={{
        position: 'absolute',
        width: size * 1.78, height: size * 1.78,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${cfg.glowColor} 0%, transparent 68%)`,
        animation: cfg.glowAnim,
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Atmosphere rings */}
      {cfg.rings.map((ring, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size * ring.scale, height: size * ring.scale,
          borderRadius: '50%',
          border: ring.border,
          animation: `${ring.dir} ${ring.dur} linear infinite`,
          opacity: ring.op,
          pointerEvents: 'none', zIndex: 1,
        }} />
      ))}

      {/* Speak ripples */}
      {cfg.ripple && [0, 1, 2].map(i => (
        <div key={`rip${i}`} style={{
          position: 'absolute',
          width: size, height: size,
          borderRadius: '50%',
          border: '1.5px solid rgba(232,221,208,0.55)',
          animation: `speakRipple 2.1s ease-out ${i * 0.7}s infinite`,
          pointerEvents: 'none', zIndex: 2,
        }} />
      ))}

      {/* Orbiting surface particles */}
      {PARTICLES.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: p.size, height: p.size,
          borderRadius: '50%',
          background: cfg.particle,
          opacity: cfg.pOp,
          '--r':  r,
          '--pr': p.angle,
          animation: `particleOrbit ${cfg.pOrbitDur} linear ${p.delay}s infinite`,
          pointerEvents: 'none', zIndex: 4,
          boxShadow: `0 0 4px 1px ${cfg.particle}`,
        }} />
      ))}

      {/* Planet body */}
      <div style={{
        position: 'relative',
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        zIndex: 3,
        boxShadow: cfg.glowShadow,
        animation: cfg.bodyAnim,
        transition: 'box-shadow 0.7s ease',
        flexShrink: 0,
      }}>
        {/* Rotating core gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: cfg.core,
          animation: cfg.coreAnim,
          transition: 'background 0.7s ease',
        }} />

        {/* Static sphere surface overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: cfg.sphere,
          transition: 'background 0.7s ease',
        }} />

        {/* Atmospheric band 1 */}
        <div style={{
          position: 'absolute',
          top: '36%', left: '-22%',
          width: '144%', height: '13%',
          background: cfg.band1,
          filter: 'blur(5px)',
          borderRadius: '50%',
          animation: `bandA ${cfg.bandADur} ease-in-out alternate infinite`,
          pointerEvents: 'none',
          transition: 'background 0.7s ease',
        }} />

        {/* Atmospheric band 2 */}
        <div style={{
          position: 'absolute',
          top: '60%', left: '-16%',
          width: '132%', height: '9%',
          background: cfg.band2,
          filter: 'blur(3px)',
          borderRadius: '50%',
          animation: `bandB ${cfg.bandBDur} ease-in-out alternate infinite`,
          pointerEvents: 'none',
          transition: 'background 0.7s ease',
        }} />

        {/* Glass highlight */}
        <div style={{
          position: 'absolute',
          top: '8%', left: '14%',
          width: '36%', height: '26%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.07) 70%, transparent 100%)',
          transform: 'rotate(-20deg)',
          pointerEvents: 'none',
        }} />

        {/* Bottom rim light */}
        <div style={{
          position: 'absolute',
          bottom: '6%', right: '10%',
          width: '22%', height: '13%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
