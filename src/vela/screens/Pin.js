import { useState } from 'react';
import { getPin, setPin, clearAll } from '../storage';
import { t } from '../theme';

const PIN_LENGTH = 4;

export default function Pin({ onSuccess, onForgot }) {
  const existing              = getPin();
  const [phase, setPhase]     = useState(existing ? 'login' : 'create');
  const [digits, setDigits]   = useState([]);
  const [temp, setTemp]       = useState('');
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);

  function triggerShake(msg) {
    setError(msg);
    setShake(true);
    setTimeout(() => { setShake(false); setDigits([]); }, 500);
  }

  function press(d) {
    if (digits.length >= PIN_LENGTH) return;
    const next = [...digits, d];
    setDigits(next);
    if (next.length < PIN_LENGTH) return;
    const pin = next.join('');
    setTimeout(() => attempt(pin), 120);
  }

  function attempt(pin) {
    if (phase === 'create') {
      setTemp(pin);
      setDigits([]);
      setPhase('confirm');
      setError('');
    } else if (phase === 'confirm') {
      if (pin === temp) {
        setPin(pin);
        onSuccess();
      } else {
        setTemp('');
        setPhase('create');
        triggerShake("PINs don't match — try again");
      }
    } else {
      if (pin === getPin()) {
        onSuccess();
      } else {
        triggerShake('Incorrect PIN');
      }
    }
  }

  const titles = { login: 'Welcome back', create: 'Create your PIN', confirm: 'Confirm your PIN' };
  const subs   = { login: 'Enter your 4-digit PIN', create: 'Choose a 4-digit PIN to protect your data', confirm: 'Enter your PIN one more time' };

  return (
    <div style={{ height: '100vh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 32, fontWeight: 800, color: t.accent, marginBottom: 28 }}>Vela</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: t.text, marginBottom: 6, textAlign: 'center' }}>{titles[phase]}</div>
      <div style={{ fontSize: 14, color: t.muted, marginBottom: 40, textAlign: 'center' }}>{subs[phase]}</div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 10, animation: shake ? 'pinShake 0.45s' : 'none' }}>
        {Array(PIN_LENGTH).fill(0).map((_, i) => (
          <div key={i} style={{
            width: 13, height: 13, borderRadius: '50%',
            background: i < digits.length ? t.accent : 'rgba(255,255,255,0.15)',
            transition: 'background 0.1s',
          }} />
        ))}
      </div>

      <div style={{ minHeight: 32, marginBottom: 20, fontSize: 13, color: t.danger, textAlign: 'center' }}>{error}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 70px)', gap: 14 }}>
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <PadBtn key={n} label={String(n)} onPress={() => press(String(n))} />
        ))}
        <div />
        <PadBtn label="0" onPress={() => press('0')} />
        <PadBtn label="⌫" onPress={() => { setDigits(d => d.slice(0, -1)); setError(''); }} dim />
      </div>

      {phase === 'login' && (
        <button
          onClick={() => { clearAll(); onForgot(); }}
          style={{ marginTop: 36, background: 'none', border: 'none', color: t.muted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Forgot PIN? Reset Vela
        </button>
      )}

      <style>{`
        @keyframes pinShake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-10px); }
          60%     { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}

function PadBtn({ label, onPress, dim }) {
  const [active, setActive] = useState(false);
  return (
    <button
      onPointerDown={() => { setActive(true); onPress(); }}
      onPointerUp={() => setActive(false)}
      onPointerLeave={() => setActive(false)}
      style={{
        width: 70, height: 70, borderRadius: '50%', border: 'none', cursor: 'pointer',
        background: dim ? 'transparent' : active ? t.accent : 'rgba(255,255,255,0.09)',
        color: dim ? t.muted : active ? '#0a0a0f' : t.text,
        fontSize: dim ? 22 : 24, fontWeight: 500,
        transform: active ? 'scale(0.90)' : 'scale(1)',
        transition: 'all 0.1s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >{label}</button>
  );
}
