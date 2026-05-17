import { useState, useEffect } from 'react';
import { getPin, setPin, clearAll, getBiometricEnabled, setBiometricEnabled, getBiometricCred, setBiometricCred, clearBiometric } from '../storage';
import { t } from '../theme';

const PIN_LENGTH = 4;

export default function Pin({ onSuccess, onForgot }) {
  const existing              = getPin();
  const [phase, setPhase]     = useState(existing ? 'login' : 'create');
  const [digits, setDigits]   = useState([]);
  const [temp, setTemp]       = useState('');
  const [error, setError]     = useState('');
  const [shake, setShake]     = useState(false);

  const [biometricAvailable, setBiometricAvailable]   = useState(false);
  const [biometricEnabled, setBiometricEnabledState]  = useState(getBiometricEnabled);
  const [showBioPrompt, setShowBioPrompt]             = useState(false);
  const [bioError, setBioError]                       = useState('');

  useEffect(() => {
    if (!window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) return;
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(ok => setBiometricAvailable(ok))
      .catch(() => {});
  }, []);

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
        if (biometricAvailable && !getBiometricEnabled()) {
          setDigits([]);
          setShowBioPrompt(true);
        } else {
          onSuccess();
        }
      } else {
        triggerShake('Incorrect PIN');
      }
    }
  }

  async function attemptBiometric() {
    setBioError('');
    try {
      const credStr = getBiometricCred();
      if (!credStr) return;
      const credBytes = Uint8Array.from(atob(credStr), c => c.charCodeAt(0));
      await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          allowCredentials: [{ type: 'public-key', id: credBytes, transports: ['internal'] }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      onSuccess();
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        setBioError('Biometric failed — enter your PIN');
      }
    }
  }

  async function registerBiometric() {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'Vela', id: window.location.hostname },
          user: {
            id: new TextEncoder().encode('vela-user'),
            name: 'vela',
            displayName: 'Vela',
          },
          pubKeyCredParams: [
            { alg: -7,   type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
        },
      });
      const credId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      setBiometricCred(credId);
      setBiometricEnabled();
      setBiometricEnabledState(true);
      setShowBioPrompt(false);
      onSuccess();
    } catch {
      // User cancelled or device error — proceed without biometric
      setShowBioPrompt(false);
      onSuccess();
    }
  }

  function handleReset() {
    clearAll();
    clearBiometric();
    setBiometricEnabledState(false);
    onForgot();
  }

  const titles = { login: 'Welcome back', create: 'Create your PIN', confirm: 'Confirm your PIN' };
  const subs   = { login: 'Enter your 4-digit PIN', create: 'Choose a 4-digit PIN to protect your data', confirm: 'Enter your PIN one more time' };

  return (
    <div style={{ position: 'relative', height: '100vh', background: t.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', boxSizing: 'border-box' }}>
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

      {/* Face ID / Touch ID button */}
      {phase === 'login' && biometricAvailable && biometricEnabled && (
        <button
          onClick={attemptBiometric}
          style={{
            marginTop: 28, display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(127,119,221,0.10)', border: '1px solid rgba(127,119,221,0.22)',
            borderRadius: 14, padding: '11px 26px', color: t.accent,
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 18 }}>🔐</span>
          Face ID / Touch ID
        </button>
      )}

      {bioError && (
        <div style={{ marginTop: 10, fontSize: 12, color: t.danger, textAlign: 'center' }}>{bioError}</div>
      )}

      {phase === 'login' && (
        <button
          onClick={handleReset}
          style={{ marginTop: biometricAvailable && biometricEnabled ? 14 : 36, background: 'none', border: 'none', color: t.muted, fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
        >
          Forgot PIN? Reset Vela
        </button>
      )}

      {/* Biometric enrolment prompt — shown after first successful PIN login */}
      {showBioPrompt && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 32, zIndex: 20,
        }}>
          <div style={{
            background: '#111118', border: '1px solid rgba(127,119,221,0.22)',
            borderRadius: 26, padding: 30, width: '100%', maxWidth: 300,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
              Enable Face ID?
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', marginBottom: 28, lineHeight: 1.55 }}>
              Sign in faster with Face ID or Touch ID instead of entering your PIN each time.
            </div>
            <button
              onClick={registerBiometric}
              style={{ width: '100%', padding: 14, background: t.accent, border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 }}
            >
              Enable Face ID
            </button>
            <button
              onClick={() => { setShowBioPrompt(false); onSuccess(); }}
              style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 14, cursor: 'pointer' }}
            >
              Not now
            </button>
          </div>
        </div>
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
