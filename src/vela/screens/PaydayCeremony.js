import { useState, useEffect, useRef } from 'react';

const GOLD   = '#C9A96E';
const GREEN  = '#7CAE9E';
const PURPLE = '#C8B89A';
const BLUE   = '#A89880';
const AMBER  = '#C9A96E';
const BG     = '#111318';

const CEREMONY_KF = `
  @keyframes goldPulse {
    0%,100% { transform: scale(1);    box-shadow: 0 0 55px 18px rgba(201,169,110,0.52), 0 0 120px 60px rgba(201,169,110,0.16); }
    50%     { transform: scale(1.07); box-shadow: 0 0 90px 36px rgba(201,169,110,0.80), 0 0 180px 90px rgba(201,169,110,0.28); }
  }
  @keyframes goldRing {
    0%   { transform: scale(1);   opacity: 0.55; }
    100% { transform: scale(3.4); opacity: 0; }
  }
  @keyframes ceremonySlide {
    from { opacity: 0; transform: translateY(56px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes checkPop {
    0%   { transform: scale(0) rotate(-18deg); opacity: 0; }
    65%  { transform: scale(1.28) rotate(4deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg);   opacity: 1; }
  }
  @keyframes doneFloat {
    0%,100% { transform: translateY(0); }
    50%     { transform: translateY(-8px); }
  }
  @keyframes ceremonyFadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes tapPulse {
    0%,100% { opacity: 0.4; transform: scale(1); }
    50%     { opacity: 0.9; transform: scale(1.12); }
  }
`;

function buildSteps(income) {
  const essentials = Math.round(income * 0.50);
  const savings    = Math.round(income * 0.20);
  const lifestyle  = Math.round(income * 0.25);
  const buffer     = Math.max(0, income - essentials - savings - lifestyle);
  return [
    { icon: '🏠', title: 'Essentials',  sub: 'Housing · Food · Transport · Health',   amount: essentials, color: PURPLE },
    { icon: '🏦', title: 'Savings',     sub: 'Emergency Fund · ISA · Pension',         amount: savings,    color: GREEN  },
    { icon: '🎭', title: 'Lifestyle',   sub: 'Entertainment · Clothing · Dining Out',  amount: lifestyle,  color: BLUE   },
    { icon: '🛡',  title: 'Buffer',      sub: 'Unexpected Costs · Peace of Mind',       amount: buffer,     color: AMBER  },
  ];
}

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]*/g) || [text]).map(s => s.trim()).filter(Boolean);
}

export default function PaydayCeremony({ income, onComplete }) {
  const [phase, setPhase]           = useState('intro'); // 'intro' | 'steps' | 'done'
  const [stepIdx, setStepIdx]       = useState(0);
  const [stepKey, setStepKey]       = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed]   = useState([false, false, false, false]);

  const audioRef = useRef(false);
  const steps    = buildSteps(income);

  useEffect(() => {
    if (document.getElementById('vela-ceremony-kf')) return;
    const el = document.createElement('style');
    el.id = 'vela-ceremony-kf';
    el.textContent = CEREMONY_KF;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // ── Self-contained speech (needs its own iOS unlock) ──────────────
  function speakLine(text, onEnd) {
    if (!window.speechSynthesis) { onEnd?.(); return; }
    if (!audioRef.current) {
      audioRef.current = true;
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
    window.speechSynthesis.cancel();
    const clean     = text.replace(/[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27FF}|\u{2300}-\u{23FF}|\u{2B00}-\u{2BFF}|\u{1F300}-\u{1F9FF}|\u{FE00}-\u{FE0F}]/gu, '').trim();
    const sentences = splitSentences(clean);
    const fire = () => {
      const voices   = window.speechSynthesis.getVoices();
      const PRIORITY = ['Samantha', 'Karen', 'Moira', 'Victoria', 'Tessa'];
      const voice    = PRIORITY.reduce((f, n) => f || voices.find(v => v.name.includes(n)), null)
                    || voices.find(v => v.lang === 'en-GB')
                    || voices.find(v => v.lang.startsWith('en'))
                    || null;
      let i = 0;
      const next = () => {
        if (i >= sentences.length) { onEnd?.(); return; }
        const u   = new SpeechSynthesisUtterance(sentences[i++]);
        u.rate    = 0.90;
        u.pitch   = 1.05;
        u.volume  = 1;
        if (voice) u.voice = voice;
        u.onend   = () => setTimeout(next, i < sentences.length ? 160 : 0);
        u.onerror = () => onEnd?.();
        window.speechSynthesis.speak(u);
      };
      setTimeout(next, 350);
    };
    window.speechSynthesis.getVoices().length > 0
      ? fire()
      : (window.speechSynthesis.onvoiceschanged = () => { fire(); window.speechSynthesis.onvoiceschanged = null; });
  }

  // ── Orb tap starts the ceremony ────────────────────────────────────
  function handleOrbTap() {
    if (phase !== 'intro') return;
    speakLine(
      'Your salary has arrived. Ready to put it to work.',
      () => setTimeout(() => setPhase('steps'), 500)
    );
    // Fallback: transition even if speech is silent
    setTimeout(() => setPhase(p => p === 'intro' ? 'steps' : p), 4200);
  }

  // ── Confirm a step ─────────────────────────────────────────────────
  function handleConfirm() {
    if (confirming) return;
    setConfirming(true);
    const next = confirmed.map((v, i) => i === stepIdx ? true : v);
    setConfirmed(next);

    setTimeout(() => {
      setConfirming(false);
      if (stepIdx < steps.length - 1) {
        setStepIdx(s => s + 1);
        setStepKey(k => k + 1);
      } else {
        setPhase('done');
        setTimeout(() => speakLine('Your money has a plan.', () => {}), 600);
        setTimeout(onComplete, 7000);
      }
    }, 720);
  }

  const step = steps[stepIdx];
  const isDone = phase === 'done';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: BG,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: 'inherit', overflow: 'hidden',
      paddingTop: 'max(env(safe-area-inset-top), 52px)',
      paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      boxSizing: 'border-box',
    }}>

      {/* ══ Gold → Purple Orb ══════════════════════════════════════ */}
      <div
        onClick={handleOrbTap}
        style={{
          position: 'relative',
          width: 140, height: 140,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: phase === 'intro' ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        {/* Expanding rings */}
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '1.5px solid rgba(201,169,110,0.45)',
            animation: `goldRing 2.3s ease-out ${i * 0.76}s infinite`,
            opacity: isDone ? 0 : 1,
            transition: 'opacity 1s ease',
            pointerEvents: 'none',
          }} />
        ))}

        {/* Gold orb */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle at 34% 32%, #f5e8d0, ${GOLD} 50%, #7a6020)`,
          animation: 'goldPulse 2.5s ease-in-out infinite',
          opacity: isDone ? 0 : 1,
          transition: 'opacity 1.3s ease',
        }} />

        {/* Purple orb (cross-fades in on done) */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, #d8cebe, ${PURPLE} 55%, #7a6a52)`,
          boxShadow: '0 0 42px 14px rgba(200,184,154,0.44), 0 0 90px 38px rgba(200,184,154,0.14)',
          opacity: isDone ? 1 : 0,
          transition: 'opacity 1.3s ease',
        }} />
      </div>

      {/* ══ INTRO phase ════════════════════════════════════════════ */}
      {phase === 'intro' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 32px', gap: 12,
          animation: 'ceremonyFadeUp 0.55s ease-out',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, color: GOLD, letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700, opacity: 0.85 }}>
            Payday
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#E8DDD0', letterSpacing: '-0.6px', lineHeight: 1.22, marginTop: 4 }}>
            Your salary<br />has arrived
          </div>
          <div style={{ fontSize: 14, color: 'rgba(232,221,208,0.4)', lineHeight: 1.6, marginTop: 10 }}>
            Tap the orb to begin your<br />payday allocation routine
          </div>
          {/* Tap indicator */}
          <div style={{
            marginTop: 20, fontSize: 22,
            animation: 'tapPulse 2s ease-in-out infinite',
            color: GOLD,
          }}>↑</div>
        </div>
      )}

      {/* ══ STEPS phase ════════════════════════════════════════════ */}
      {phase === 'steps' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          width: '100%', padding: '0 18px',
          boxSizing: 'border-box',
        }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 18, marginBottom: 18 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                height: 7,
                width: confirmed[i] ? 22 : i === stepIdx ? 14 : 7,
                borderRadius: 4,
                background: confirmed[i]
                  ? GOLD
                  : i === stepIdx
                    ? `rgba(201,169,110,0.5)`
                    : 'rgba(232,221,208,0.14)',
                transition: 'all 0.38s ease',
              }} />
            ))}
          </div>

          {/* Step card */}
          <div
            key={stepKey}
            style={{
              flex: 1,
              background: 'rgba(232,221,208,0.04)',
              border: `1px solid ${step.color}40`,
              borderRadius: 28,
              padding: '24px 22px 22px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              position: 'relative', overflow: 'hidden',
              animation: 'ceremonySlide 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Step label */}
            <div style={{ fontSize: 11, color: 'rgba(232,221,208,0.28)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 14 }}>
              Step {stepIdx + 1} of {steps.length}
            </div>

            {/* Icon */}
            <div style={{ fontSize: 46, lineHeight: 1, marginBottom: 12 }}>{step.icon}</div>

            {/* Title */}
            <div style={{ fontSize: 24, fontWeight: 800, color: '#E8DDD0', letterSpacing: '-0.3px', marginBottom: 8 }}>
              {step.title}
            </div>

            {/* Subtitle */}
            <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.36)', letterSpacing: '0.2px', textAlign: 'center', marginBottom: 22, lineHeight: 1.55 }}>
              {step.sub}
            </div>

            {/* Amount */}
            <div style={{ fontSize: 56, fontWeight: 800, color: GOLD, letterSpacing: '-2.5px', lineHeight: 1 }}>
              £{step.amount.toLocaleString('en-GB')}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(232,221,208,0.3)', marginTop: 5, marginBottom: 'auto' }}>
              per month
            </div>

            {/* Bottom accent bar */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: step.color, opacity: 0.55 }} />

            {/* Confirm button / checkmark */}
            <div style={{ width: '100%', marginTop: 26 }}>
              {confirming ? (
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', margin: '0 auto',
                  background: 'rgba(124,174,158,0.18)', border: `2px solid ${GREEN}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: GREEN,
                  animation: 'checkPop 0.38s ease-out',
                }}>✓</div>
              ) : (
                <button
                  onClick={handleConfirm}
                  style={{
                    width: '100%', height: 56, borderRadius: 18, border: 'none',
                    background: GOLD,
                    color: '#000', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    letterSpacing: '0.1px',
                    boxShadow: `0 0 28px 6px rgba(201,169,110,0.30)`,
                  }}
                >
                  Confirm £{step.amount.toLocaleString('en-GB')} → {step.title}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ DONE phase ═════════════════════════════════════════════ */}
      {phase === 'done' && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 28px', gap: 8,
          animation: 'ceremonyFadeUp 0.55s ease-out',
        }}>
          {/* Confirmed ticks row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {steps.map((s, i) => (
              <div key={i} style={{
                width: 42, height: 42, borderRadius: '50%',
                background: 'rgba(124,174,158,0.14)',
                border: `1.5px solid ${GREEN}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: GREEN,
                animation: `checkPop 0.38s ease-out ${i * 0.12}s backwards`,
              }}>✓</div>
            ))}
          </div>

          {/* Headline */}
          <div style={{
            fontSize: 34, fontWeight: 800, color: GOLD,
            textAlign: 'center', letterSpacing: '-0.9px', lineHeight: 1.22,
            animation: 'doneFloat 3.2s ease-in-out infinite',
            textShadow: '0 0 48px rgba(201,169,110,0.38)',
          }}>
            Your money<br />has a plan.
          </div>

          <div style={{ fontSize: 14, color: 'rgba(232,221,208,0.36)', textAlign: 'center', lineHeight: 1.6, marginTop: 10 }}>
            All {steps.length} allocations confirmed.
            {income > 0 && (
              <><br />£{income.toLocaleString('en-GB')}/month — working for you.</>
            )}
          </div>

          {/* Back button */}
          <button
            onClick={onComplete}
            style={{
              marginTop: 30, width: '100%', height: 56, borderRadius: 18,
              background: 'rgba(201,169,110,0.09)',
              border: '1px solid rgba(201,169,110,0.32)',
              color: GOLD, fontSize: 16, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.1px',
            }}
          >Back to Noa →</button>
        </div>
      )}
    </div>
  );
}
