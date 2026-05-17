import { useState, useEffect, useRef } from 'react';
import { getData, getInsights, clearAll } from '../storage';

const PURPLE = '#7F77DD';
const BLUE   = '#378ADD';
const GREEN  = '#4eca8b';
const AMBER  = '#f5a623';
const RED    = '#ff6b6b';
const BG     = '#0a0a0f';

const KEYFRAMES = `
  @keyframes orbIdle {
    0%,100% { transform: scale(1);    filter: brightness(1); }
    50%     { transform: scale(1.06); filter: brightness(1.14); }
  }
  @keyframes orbListening {
    0%,100% { transform: scale(1); }
    50%     { transform: scale(1.14); }
  }
  @keyframes orbThinking {
    0%,100% { transform: scale(1);    filter: brightness(0.85); }
    50%     { transform: scale(1.04); filter: brightness(1.05); }
  }
  @keyframes orbSpeaking {
    0%,100% { transform: scale(1); }
    20%     { transform: scale(1.10); }
    40%     { transform: scale(1.04); }
    60%     { transform: scale(1.12); }
    80%     { transform: scale(1.05); }
  }
  @keyframes ripple {
    0%   { transform: scale(1);   opacity: 0.55; }
    100% { transform: scale(2.6); opacity: 0; }
  }
  @keyframes waveBar {
    0%,100% { transform: scaleY(0.22); }
    50%     { transform: scaleY(1); }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%,100% { opacity: 0.3; }
    50%     { opacity: 1; }
  }
  @keyframes micPulse {
    0%,100% { box-shadow: 0 0 0 0 rgba(55,138,221,0.4); }
    50%     { box-shadow: 0 0 0 12px rgba(55,138,221,0); }
  }
`;

const ORB_CFG = {
  idle: {
    bg:   `radial-gradient(circle at 35% 35%, #b0acee, ${PURPLE} 55%, #3a369e)`,
    glow: `0 0 40px 12px rgba(127,119,221,0.42), 0 0 90px 35px rgba(127,119,221,0.14)`,
    anim: 'orbIdle 3s ease-in-out infinite',
  },
  listening: {
    bg:   `radial-gradient(circle at 35% 35%, #8ec8f8, ${BLUE} 55%, #1a4d9a)`,
    glow: `0 0 60px 22px rgba(55,138,221,0.68), 0 0 130px 55px rgba(55,138,221,0.22)`,
    anim: 'orbListening 0.75s ease-in-out infinite',
  },
  thinking: {
    bg:   `radial-gradient(circle at 35% 35%, #8a86d5, ${PURPLE} 55%, #27246a)`,
    glow: `0 0 28px 8px rgba(127,119,221,0.28), 0 0 60px 20px rgba(127,119,221,0.08)`,
    anim: 'orbThinking 2.2s ease-in-out infinite',
  },
  speaking: {
    bg:   `radial-gradient(circle at 35% 35%, #cac7f8, ${PURPLE} 55%, #5250c0)`,
    glow: `0 0 72px 28px rgba(127,119,221,0.82), 0 0 150px 65px rgba(127,119,221,0.32)`,
    anim: 'orbSpeaking 0.42s ease-in-out infinite',
  },
};

function splitSentences(text) {
  return (text.match(/[^.!?]+[.!?]*/g) || [text]).map(s => s.trim()).filter(Boolean);
}

function getGreeting() {
  const h    = new Date().getHours();
  const name = localStorage.getItem('vela_name') || '';
  const base = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${base}, ${name}` : base;
}

export default function VelaCore({ onReset }) {
  const data     = getData() || {};
  const insights = getInsights() || [];
  const { income = 0, expenses = 0, debt = 0, goal = '' } = data;

  const [chatOpen, setChatOpen]           = useState(false);
  const [orbState, _setOrbState]          = useState('idle');
  const [cards, setCards]                 = useState([]);
  const [input, setInput]                 = useState('');
  const [isListening, setIsListening]     = useState(false);
  const [transcript, setTranscript]       = useState('');
  const [showSettings, setShowSettings]   = useState(false);
  const [voiceOn, setVoiceOn]             = useState(true);
  const [settingName, setSettingName]     = useState(() => localStorage.getItem('vela_name') || '');

  const orbRef         = useRef('idle');
  const voiceOnRef     = useRef(true);
  const recognitionRef = useRef(null);
  const greetedRef     = useRef(false);

  function setOrbState(s) { orbRef.current = s; _setOrbState(s); }

  useEffect(() => { voiceOnRef.current = voiceOn; }, [voiceOn]);

  useEffect(() => {
    if (!document.getElementById('vela-kf')) {
      const el = document.createElement('style');
      el.id = 'vela-kf';
      el.textContent = KEYFRAMES;
      document.head.appendChild(el);
    }
    return () => {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.abort();
    };
  }, []);

  // Greeting fires the first time chat is opened
  useEffect(() => {
    if (!chatOpen || greetedRef.current) return;
    greetedRef.current = true;
    const name = localStorage.getItem('vela_name') || '';
    const msg  = `Hi${name ? `, ${name}` : ''}. I'm Vela, your personal financial navigator. How can I help you today?`;
    const tid  = setTimeout(() => { pushCard('vela', msg); speak(msg); }, 700);
    return () => clearTimeout(tid);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  function speak(text) {
    if (!voiceOnRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}|\u{2600}-\u{27FF}|\u{2300}-\u{23FF}|\u{2B00}-\u{2BFF}|\u{1F300}-\u{1F9FF}|\u{FE00}-\u{FE0F}]/gu, '').trim();
    const sentences = splitSentences(clean);
    const fire = () => {
      const voices   = window.speechSynthesis.getVoices();
      const PRIORITY = ['Samantha', 'Karen', 'Moira', 'Victoria', 'Tessa'];
      const voice    = PRIORITY.reduce((found, name) => found || voices.find(v => v.name.includes(name)), null)
                    || voices.find(v => v.lang === 'en-GB')
                    || voices.find(v => v.lang.startsWith('en'))
                    || null;
      setOrbState('speaking');
      let i = 0;
      const next = () => {
        if (i >= sentences.length) { setOrbState('idle'); return; }
        const u = new SpeechSynthesisUtterance(sentences[i++]);
        u.rate   = 0.92;
        u.pitch  = 1.05;
        u.volume = 1;
        if (voice) u.voice = voice;
        u.onend   = () => setTimeout(next, i < sentences.length ? 150 : 0);
        u.onerror = () => setOrbState('idle');
        window.speechSynthesis.speak(u);
      };
      setTimeout(next, 300);
    };
    window.speechSynthesis.getVoices().length > 0
      ? fire()
      : (window.speechSynthesis.onvoiceschanged = () => { fire(); window.speechSynthesis.onvoiceschanged = null; });
  }

  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  function startListening() {
    if (!speechSupported || isListening) return;
    window.speechSynthesis?.cancel();
    const SR  = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = 'en-GB';
    rec.onstart  = () => { setIsListening(true); setOrbState('listening'); };
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setTranscript('');
        setIsListening(false);
        handleMessage(t);
      }
    };
    rec.onerror = () => { setIsListening(false); setOrbState('idle'); setTranscript(''); };
    rec.onend   = () => { setIsListening(false); if (orbRef.current === 'listening') setOrbState('idle'); };
    rec.start();
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
    setOrbState('idle');
    setTranscript('');
  }

  async function handleMessage(text) {
    const clean = text.trim();
    if (!clean) return;
    if (/\bsettings\b/i.test(clean)) { setShowSettings(true); return; }
    pushCard('user', clean);
    setInput('');
    setOrbState('thinking');
    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financialContext: buildPrompt(), messages: [{ role: 'user', content: clean }] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOrbState('idle');
      pushCard('vela', json.text);
      speak(json.text);
    } catch {
      setOrbState('idle');
      const err = "I'm having trouble reaching my systems right now. Please try again.";
      pushCard('vela', err);
      speak(err);
    }
  }

  function pushCard(type, text) {
    setCards(prev => [...prev, { id: Date.now() + Math.random(), type, text }]);
  }

  function buildPrompt() {
    const name    = localStorage.getItem('vela_name') || '';
    const surplus = income - expenses;
    return `You are Vela, an elite personal finance AI. You have the precision of a CFO, the warmth of a trusted friend, and the directness of JARVIS.
${name ? `\nYou are speaking with ${name}. Use their name occasionally and naturally — never on every message.` : ''}

FINANCIAL SNAPSHOT:
• Monthly income:   £${income.toFixed(0)}
• Monthly expenses: £${expenses.toFixed(0)}
• Monthly surplus:  £${surplus.toFixed(0)}${surplus < 0 ? ' ⚠ deficit' : ''}
• Total debt:       ${debt > 0 ? `£${debt.toFixed(0)}` : 'none'}
• Goal:             ${goal || 'not set'}
${insights.length > 0 ? `• Prior insights:   ${insights.slice(0, 3).join(' | ')}` : ''}

RULES:
1. Always reference exact £ amounts from the snapshot — never vague percentages.
2. Maximum 2 sentences per response — sharp and actionable.
3. Never repeat what the user just said back to them.
4. When discussing the plan, cite specific numbers from the snapshot.
5. Personality: confident, warm, slightly witty, never robotic. You are Vela — never say "As an AI".
6. Always end with either a specific action the user can take today, or a sharp question that moves them forward.
7. You know their full financial picture: monthly income, expenses, net surplus, debt, and goal.
8. End any financial advice with: ⚖️ Guidance only — not FCA-regulated advice.`;
  }

  function saveSettings() {
    localStorage.setItem('vela_name', settingName);
    setShowSettings(false);
  }

  // ── Dashboard calculations ───────────────────────────────────────
  const surplus     = income - expenses;
  const netAnnual   = surplus * 12;
  const isPositive  = surplus >= 0;
  const displayNum  = isPositive
    ? `£${Math.abs(netAnnual).toLocaleString('en-GB')}`
    : `£${Math.abs(surplus).toLocaleString('en-GB')}`;
  const displaySub  = isPositive ? 'Year surplus' : 'Monthly shortfall';
  const numColor    = isPositive ? GREEN : RED;

  const savingsRate  = income > 0 ? Math.round((surplus / income) * 100) : 0;
  const healthNum    = Math.max(0, Math.min(100, Math.round(((income > 0 ? surplus / income : 0) + 0.5) * 100)));
  const onTrack      = surplus >= 0;
  const healthColor  = healthNum >= 70 ? GREEN : healthNum >= 50 ? AMBER : RED;
  const savColor     = savingsRate > 10 ? GREEN : savingsRate >= 0 ? AMBER : RED;

  // ── Chat overlay state ───────────────────────────────────────────
  const cfg          = ORB_CFG[orbState] || ORB_CFG.idle;
  const visibleCards = cards.slice(-3);
  const opacityMap   = { 0: [1], 1: [1], 2: [0.55, 1], 3: [0.32, 0.65, 1] };
  const cardOpacities = opacityMap[Math.min(visibleCards.length, 3)] || [0.32, 0.65, 1];

  return (
    <div style={{ position: 'relative', height: '100vh', background: BG, overflow: 'hidden', fontFamily: 'inherit' }}>

      {/* ══════════════════════════════════════════
          DASHBOARD
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        paddingTop: 'max(env(safe-area-inset-top), 24px)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 28px)',
        paddingLeft: 20, paddingRight: 20,
        boxSizing: 'border-box',
      }}>

        {/* Gear — top right */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ position: 'absolute', top: 'max(env(safe-area-inset-top), 20px)', right: 20, zIndex: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.26)', fontSize: 20, padding: 8, lineHeight: 1 }}
          aria-label="Settings"
        >⚙</button>

        {/* ── Top section ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>

          {/* Greeting */}
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.2px' }}>
            {getGreeting()}
          </div>

          {/* 60px pulsing orb */}
          <SmallOrb />

          {/* Net annual / monthly position */}
          <div style={{ fontSize: 54, fontWeight: 800, color: numColor, letterSpacing: '-2px', lineHeight: 1, textAlign: 'center' }}>
            {displayNum}
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.2px' }}>
            {displaySub}
          </div>
        </div>

        {/* ── 3 metric pills ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <MetricPill label="Health"  value={`${healthNum}`}              color={healthColor} />
          <MetricPill label="Savings" value={`${savingsRate}%`}           color={savColor}    />
          <MetricPill label="Pace"    value={onTrack ? 'On Track' : 'Off Track'} color={onTrack ? GREEN : RED} />
        </div>

        {/* ── Talk to Vela button ── */}
        <button
          onClick={() => setChatOpen(true)}
          style={{
            width: '100%', height: 58, background: PURPLE, border: 'none', borderRadius: 18,
            color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.2px', boxShadow: '0 0 24px 4px rgba(127,119,221,0.22)',
          }}
        >
          Talk to Vela
        </button>
      </div>

      {/* ══════════════════════════════════════════
          CHAT OVERLAY — slides up from bottom
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20, background: BG,
        transform: chatOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>

        {/* Back arrow */}
        <button
          onClick={() => setChatOpen(false)}
          style={{ position: 'absolute', top: 20, left: 18, zIndex: 30, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.36)', fontSize: 22, padding: 8, lineHeight: 1 }}
          aria-label="Close chat"
        >↓</button>

        {/* Gear */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ position: 'absolute', top: 20, right: 18, zIndex: 30, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.26)', fontSize: 20, padding: 8, lineHeight: 1 }}
          aria-label="Settings"
        >⚙</button>

        {/* Orb section */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '52%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>

          <div
            onClick={() => isListening ? stopListening() : startListening()}
            style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {orbState === 'speaking' && [0, 1, 2].map(i => (
              <div key={i} style={{
                position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
                border: '1.5px solid rgba(127,119,221,0.48)',
                animation: `ripple 1.9s ease-out ${i * 0.63}s infinite`,
                pointerEvents: 'none',
              }} />
            ))}
            <div style={{
              width: 140, height: 140, borderRadius: '50%',
              background: cfg.bg, boxShadow: cfg.glow, animation: cfg.anim,
              transition: 'background 0.7s ease, box-shadow 0.7s ease',
            }} />
          </div>

          <div style={{ minHeight: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isListening && transcript ? (
              <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 14, maxWidth: 260, textAlign: 'center', fontStyle: 'italic', padding: '0 20px' }}>
                "{transcript}"
              </div>
            ) : isListening ? (
              <WaveBars color={BLUE} />
            ) : orbState === 'speaking' ? (
              <WaveBars color={PURPLE} />
            ) : orbState === 'thinking' ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: '0.5px', animation: 'blink 1.6s ease-in-out infinite' }}>
                Thinking…
              </div>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13, letterSpacing: '0.4px' }}>
                Tap orb or mic to speak
              </div>
            )}
          </div>

          <MicBtn
            listening={isListening}
            supported={speechSupported}
            onPress={isListening ? stopListening : startListening}
          />
        </div>

        {/* Cards */}
        <div style={{
          position: 'absolute', top: '52%', bottom: 72, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          padding: '0 16px 8px', overflowY: 'hidden',
        }}>
          {visibleCards.map((c, idx) => (
            <GlassCard key={c.id} card={c} opacity={cardOpacities[idx] ?? 1} />
          ))}
        </div>

        {/* Input bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 72,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', paddingBottom: 'max(0px, env(safe-area-inset-bottom))',
          background: `linear-gradient(to top, ${BG} 60%, transparent)`,
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && input.trim() && handleMessage(input)}
            placeholder="Ask Vela…"
            style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 22, padding: '10px 16px', color: '#fff', fontSize: 16,
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={() => input.trim() && handleMessage(input)}
            style={{
              width: 42, height: 42, borderRadius: '50%', border: 'none', flexShrink: 0,
              background: input.trim() ? 'rgba(127,119,221,0.22)' : 'rgba(255,255,255,0.05)',
              color: input.trim() ? PURPLE : 'rgba(255,255,255,0.18)',
              fontSize: 22, cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >›</button>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SETTINGS OVERLAY
      ══════════════════════════════════════════ */}
      {showSettings && (
        <div
          onClick={e => e.target === e.currentTarget && setShowSettings(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.78)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 50 }}
        >
          <div style={{
            background: 'rgba(16,14,36,0.97)', border: '1px solid rgba(127,119,221,0.22)',
            borderRadius: 26, padding: 28, width: '100%', maxWidth: 320,
            backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
            animation: 'cardIn 0.28s ease-out',
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 22 }}>Settings</div>

            <Label>Your name</Label>
            <input
              value={settingName}
              onChange={e => setSettingName(e.target.value)}
              placeholder="So Vela can address you"
              style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.11)', borderRadius: 12, padding: '11px 14px', color: '#fff', fontSize: 16, outline: 'none', fontFamily: 'inherit', marginBottom: 20, boxSizing: 'border-box' }}
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26 }}>
              <div>
                <div style={{ fontSize: 14, color: '#fff', marginBottom: 2 }}>Voice responses</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Vela speaks aloud</div>
              </div>
              <Toggle on={voiceOn} onToggle={() => setVoiceOn(v => !v)} />
            </div>

            <SettingsBtn onClick={saveSettings} color={PURPLE} text="Save" />
            <SettingsBtn
              onClick={() => { clearAll(); onReset(); }}
              color="rgba(255,80,80,0.18)"
              border="rgba(255,80,80,0.28)"
              textColor="#ff6b6b"
              text="Reset Vela"
            />
            <button onClick={() => setShowSettings(false)} style={{ width: '100%', padding: 12, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function SmallOrb() {
  return (
    <div style={{
      width: 60, height: 60, borderRadius: '50%',
      background: `radial-gradient(circle at 35% 35%, #b0acee, ${PURPLE} 55%, #3a369e)`,
      boxShadow: '0 0 18px 6px rgba(127,119,221,0.32)',
      animation: 'orbIdle 3s ease-in-out infinite',
    }} />
  );
}

function MetricPill({ label, value, color }) {
  const isLong = value.length > 5;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 6, padding: '14px 6px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <div style={{ fontSize: isLong ? 13 : 20, fontWeight: 700, color, lineHeight: 1, textAlign: 'center' }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
        {label}
      </div>
    </div>
  );
}

function GlassCard({ card, opacity = 1 }) {
  const isUser = card.type === 'user';
  return (
    <div style={{
      background: isUser ? 'rgba(127,119,221,0.08)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isUser ? 'rgba(127,119,221,0.26)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 20, padding: '12px 16px', marginBottom: 10,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      animation: 'cardIn 0.35s ease-out', opacity, transition: 'opacity 0.5s ease',
    }}>
      <div style={{ fontSize: 10, color: isUser ? 'rgba(127,119,221,0.65)' : 'rgba(255,255,255,0.28)', marginBottom: 5, letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600 }}>
        {isUser ? 'You' : 'Vela'}
      </div>
      <div style={{ fontSize: 14, color: '#eeeeff', lineHeight: 1.62, whiteSpace: 'pre-wrap' }}>
        {card.text}
      </div>
    </div>
  );
}

function WaveBars({ color }) {
  const delays = [0, 0.12, 0.24, 0.1, 0.2, 0.08, 0.18, 0.06, 0.16];
  return (
    <div style={{ display: 'flex', gap: 3.5, alignItems: 'center', height: 36 }}>
      {delays.map((d, i) => (
        <div key={i} style={{
          width: 3, height: 36, background: color, borderRadius: 2,
          transformOrigin: 'center',
          animation: `waveBar 0.55s ease-in-out ${d}s infinite`,
          opacity: 0.85,
        }} />
      ))}
    </div>
  );
}

function MicBtn({ listening, supported, onPress }) {
  return (
    <button
      onPointerDown={onPress}
      disabled={!supported}
      style={{
        width: 52, height: 52, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: listening ? 'rgba(55,138,221,0.22)' : 'rgba(127,119,221,0.14)',
        color: listening ? BLUE : PURPLE,
        fontSize: 20, cursor: supported ? 'pointer' : 'not-allowed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: listening ? 'micPulse 1s ease-in-out infinite' : 'none',
        transition: 'background 0.2s', opacity: supported ? 1 : 0.4,
      }}
    >🎤</button>
  );
}

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{
      width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
      background: on ? PURPLE : 'rgba(255,255,255,0.14)',
      position: 'relative', transition: 'background 0.22s', flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 25 : 3,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.22s',
      }} />
    </button>
  );
}

function Label({ children }) {
  return (
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 600 }}>
      {children}
    </div>
  );
}

function SettingsBtn({ onClick, color, border, textColor = '#fff', text }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: 13, background: color,
      border: border ? `1px solid ${border}` : 'none',
      borderRadius: 12, color: textColor, fontSize: 15, fontWeight: 600,
      cursor: 'pointer', marginBottom: 10,
    }}>{text}</button>
  );
}
