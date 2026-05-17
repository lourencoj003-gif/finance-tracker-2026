import { useState, useEffect, useRef } from 'react';
import { getData, getInsights, clearAll, tickStreak, shouldShowCheckin, markCheckin, getGoals, saveGoals, getLastOpen, setLastOpen } from '../storage';

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
  @keyframes swipeHint {
    0%,100% { opacity: 0.55; transform: translateY(0); }
    50%     { opacity: 1;    transform: translateY(-4px); }
  }
  @keyframes alertPulse {
    0%,100% { transform: scale(1);    opacity: 1; }
    50%     { transform: scale(1.45); opacity: 0.55; }
  }
  @keyframes confettiFly {
    0%   { transform: translate(0, 0) scale(1);                           opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0.35);        opacity: 0; }
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

const SLIDE = 'transform 0.42s cubic-bezier(0.32, 0.72, 0, 1)';

const CONFETTI_COLORS = [PURPLE, BLUE, GREEN, AMBER, RED, '#ffffff', '#ee55ff', '#00eeff'];
const CONFETTI_DOTS = Array.from({ length: 20 }, (_, i) => {
  const angle = (i / 20) * 2 * Math.PI;
  const dist  = 120 + (i % 4) * 30;
  return {
    dx:    Math.round(Math.cos(angle) * dist),
    dy:    Math.round(Math.sin(angle) * dist),
    color: CONFETTI_COLORS[i % 8],
    size:  6 + (i % 4) * 2,
    delay: (i % 5) * 0.08,
  };
});

const TIPS = [
  'Pay yourself first — automate a transfer to savings the moment your pay lands.',
  'The 50/30/20 rule: 50% needs, 30% wants, 20% savings. A simple starting point.',
  'High-interest debt costs more than savings earns. Clear it first, always.',
  'An emergency fund of 3 months expenses protects everything else you build.',
  'Investing £100/month from 25 beats £200/month from 35 — by thousands.',
  'Review your subscriptions quarterly — dormant ones are silent money leaks.',
  'A Stocks & Shares ISA shelters up to £20,000/year from tax on growth.',
  'Grocery shopping with a list saves around 20% vs shopping without one.',
  'Your pension employer match is free money — always contribute enough to get it.',
  'Automate savings. Willpower runs out; a standing order does not.',
  'Avoid lifestyle inflation on a pay rise — bank the difference instead.',
  'Negotiate broadband, insurance, and energy once a year — saves hundreds.',
  'Small daily spends compound: a £4 coffee every day is £1,460 a year.',
  'Zero-based budgeting: assign every pound a job before the month starts.',
  'Balance transfers can cut credit card interest to 0% — always have a payoff plan.',
  'Track net worth monthly: assets minus liabilities is the number that matters.',
  'Buying used cars saves 30–40% — depreciation hits hardest in year one.',
  'Low-cost index funds beat most managed funds over any 10-year window.',
  'Round-up savings apps invest spare change — tiny amounts compound big.',
  'Overpaying your mortgage by £100/month can cut years off the term.',
];

function getDailyTip() {
  const today = new Date().toISOString().slice(0, 10);
  let idx = parseInt(localStorage.getItem('vela_tip_idx') || '0', 10);
  if (localStorage.getItem('vela_tip_date') !== today) {
    idx = (idx + 1) % TIPS.length;
    localStorage.setItem('vela_tip_date', today);
    localStorage.setItem('vela_tip_idx', String(idx));
  }
  return TIPS[idx];
}

function parseGoalFromText(text) {
  if (!/\b(save|saving)\b/i.test(text)) return null;
  const amtM = text.match(/£\s*([\d,]+(?:\.\d{1,2})?)/);
  if (!amtM) return null;
  const amount = parseFloat(amtM[1].replace(/,/g, ''));
  if (amount < 10 || amount > 999999) return null;
  const forM = text.match(/for\s+(?:a\s+|an\s+|my\s+)?([a-zA-Z][^,.\n!?]{1,40})/i);
  const byM  = text.match(/by\s+([A-Za-z]+(?:\s+\d{4})?|\d{4})/i);
  return {
    id:         Date.now(),
    name:       forM ? forM[1].trim() : 'Savings goal',
    target:     amount,
    saved:      0,
    createdAt:  new Date().toISOString().slice(0, 10),
    targetDate: byM ? byM[1].trim() : null,
  };
}

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
  const [detailOpen, setDetailOpen]       = useState(false);
  const [orbState, _setOrbState]          = useState('idle');
  const [cards, setCards]                 = useState([]);
  const [input, setInput]                 = useState('');
  const [isListening, setIsListening]     = useState(false);
  const [transcript, setTranscript]       = useState('');
  const [showSettings, setShowSettings]   = useState(false);
  const [voiceOn, setVoiceOn]             = useState(true);
  const [settingName, setSettingName]     = useState(() => localStorage.getItem('vela_name') || '');
  const [streak, setStreak]               = useState(0);
  const [spendAlert, setSpendAlert]       = useState(false);
  const [goals, setGoals]                 = useState(() => getGoals());
  const [celebrate, setCelebrate]         = useState(false);
  const [celebrateMsg, setCelebrateMsg]   = useState('');

  const orbRef           = useRef('idle');
  const voiceOnRef       = useRef(true);
  const recognitionRef   = useRef(null);
  const greetedRef       = useRef(false);
  const alertFiredRef    = useRef(false);
  const touchStartY      = useRef(null);
  const touchStartX      = useRef(null);
  const audioUnlockedRef = useRef(false);
  const hoursAwayRef     = useRef(0);

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

  // ── On mount: last-open tracking, streak, spending alert ─────────
  useEffect(() => {
    const lastOpen = getLastOpen();
    const hoursAway = lastOpen > 0 ? (Date.now() - lastOpen) / 3600000 : 0;
    hoursAwayRef.current = hoursAway;
    setLastOpen();

    const s = tickStreak();
    setStreak(s);
    if (s === 7 || s === 30) {
      const msg = s === 7 ? '🔥 7-day streak! You\'re building a real habit.' : '🔥 30 days straight! That\'s exceptional discipline.';
      setCelebrateMsg(msg);
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2500);
    }
    if (income > 0 && expenses / income >= 0.9) setSpendAlert(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chat greeting: check-in → alert → normal ──────────────────────
  useEffect(() => {
    if (!chatOpen || greetedRef.current) return;
    greetedRef.current = true;
    const name = localStorage.getItem('vela_name') || '';
    const hi   = name ? `, ${name}` : '';
    const surplus = income - expenses;

    let msg;
    if (shouldShowCheckin()) {
      markCheckin();
      const weeklySpend = (expenses / 4.33).toFixed(0);
      const onTrackLine = surplus >= 0
        ? `You're keeping £${surplus.toFixed(0)}/month — solid position.`
        : `You're running a £${Math.abs(surplus).toFixed(0)}/month deficit — let's fix that this week.`;
      msg = `Monday check-in${hi}. You're on pace to spend £${expenses.toFixed(0)} this month — roughly £${weeklySpend} last week. ${onTrackLine} What's the focus this week?`;
    } else if (hoursAwayRef.current >= 24) {
      const h = Math.round(hoursAwayRef.current);
      const timeAway = h >= 48 ? `${Math.round(h / 24)} days` : 'a day';
      const finLine  = surplus >= 0
        ? `Good news — your £${surplus.toFixed(0)} monthly surplus is holding steady.`
        : `One thing to watch — you're £${Math.abs(surplus).toFixed(0)} short this month.`;
      msg = `Welcome back${hi}, you've been away for ${timeAway}. ${finLine} What shall we work on?`;
    } else if (spendAlert && !alertFiredRef.current) {
      alertFiredRef.current = true;
      const pct = Math.round((expenses / income) * 100);
      msg = `Heads up${hi} — your expenses are at ${pct}% of your income, leaving only £${(income - expenses).toFixed(0)} breathing room. What's driving the spend this month?`;
    } else {
      msg = `Hi${hi}. I'm Vela, your personal financial navigator. How can I help you today?`;
    }

    const tid = setTimeout(() => { pushCard('vela', msg); speak(msg); }, 700);
    return () => clearTimeout(tid);
  }, [chatOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swipe handlers ───────────────────────────────────────────────
  function onTouchStart(e) {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }

  function onSwipeEnd(e, isDetail) {
    if (touchStartY.current === null) return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dx = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
    touchStartY.current = null;
    touchStartX.current = null;
    if (dx > Math.abs(dy) * 0.9) return; // horizontal swipe — ignore
    if (!isDetail && dy > 55 && !chatOpen) setDetailOpen(true);
    if (isDetail  && dy < -55)             setDetailOpen(false);
  }

  // ── Audio unlock (iOS requires speech from a user gesture) ───────
  function unlockAudio() {
    if (audioUnlockedRef.current || !window.speechSynthesis) return;
    audioUnlockedRef.current = true;
    const u = new SpeechSynthesisUtterance('');
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }

  // ── Speech synthesis ─────────────────────────────────────────────
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

  // ── Speech recognition ───────────────────────────────────────────
  const speechSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  function startListening() {
    if (!speechSupported || isListening) return;
    unlockAudio();
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

  // ── Chat message handler ─────────────────────────────────────────
  async function handleMessage(text) {
    const clean = text.trim();
    if (!clean) return;
    unlockAudio();
    if (/\bsettings\b/i.test(clean)) { setShowSettings(true); return; }

    // Detect savings goals ("save £X for Y by Z")
    const newGoal = parseGoalFromText(clean);
    if (newGoal) {
      const updated = [...getGoals(), newGoal];
      saveGoals(updated);
      setGoals(updated);
    }

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
    return `You are Vela — Cleo's warmth meets JARVIS's precision. You are a sharp, witty personal finance AI who celebrates wins and faces problems head-on — never robotic, never vague.
${name ? `\nYou are speaking with ${name}. Use their name occasionally and naturally — never on every message.` : ''}

VOCABULARY TO USE NATURALLY: "Well done", "On it", "Here's the situation", "Good news", "One thing to watch". Rotate these in naturally — never all in one message.

FINANCIAL SNAPSHOT:
• Monthly income:   £${income.toFixed(0)}
• Monthly expenses: £${expenses.toFixed(0)}
• Monthly surplus:  £${surplus.toFixed(0)}${surplus < 0 ? ' ⚠ deficit' : ''}
• Total debt:       ${debt > 0 ? `£${debt.toFixed(0)}` : 'none'}
• Goal:             ${goal || 'not set'}
${goals.length > 0 ? `• Savings goals:    ${goals.map(g => `${g.name} (£${g.target})`).join(', ')}` : ''}
${insights.length > 0 ? `• Prior insights:   ${insights.slice(0, 3).join(' | ')}` : ''}

RULES:
1. Always reference exact £ amounts from the snapshot — never vague percentages alone.
2. Maximum 2 sentences per response — sharp, actionable, memorable.
3. Never repeat what the user just said back to them.
4. Celebrate wins warmly; address problems directly — no sugarcoating, no doom.
5. You are Vela — never say "As an AI".
6. Always end with a specific action the user can take today, or a sharp question that moves them forward.
7. End any financial advice with: ⚖️ Guidance only — not FCA-regulated advice.`;
  }

  function saveSettings() {
    localStorage.setItem('vela_name', settingName);
    setShowSettings(false);
  }

  // ── Dashboard calculations ───────────────────────────────────────
  const surplus      = income - expenses;
  const netAnnual    = surplus * 12;
  const isPositive   = surplus >= 0;
  const displayNum   = isPositive
    ? `£${Math.abs(netAnnual).toLocaleString('en-GB')}`
    : `£${Math.abs(surplus).toLocaleString('en-GB')}`;
  const displaySub   = isPositive ? 'Year surplus' : 'Monthly shortfall';
  const numColor     = isPositive ? GREEN : RED;
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
          DASHBOARD — swipe up to reveal detail
      ══════════════════════════════════════════ */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={e => onSwipeEnd(e, false)}
        style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          paddingTop: 'max(env(safe-area-inset-top), 24px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          paddingLeft: 20, paddingRight: 20,
          boxSizing: 'border-box',
          transform: detailOpen ? 'translateY(-100%)' : 'translateY(0)',
          transition: SLIDE,
        }}
      >
        {/* Streak — top left */}
        {streak > 0 && (
          <div style={{ position: 'absolute', top: 'max(env(safe-area-inset-top), 20px)', left: 20, zIndex: 5, display: 'flex', alignItems: 'center', gap: 4, padding: 8 }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: AMBER, lineHeight: 1 }}>{streak}</span>
          </div>
        )}

        {/* Gear — top right */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ position: 'absolute', top: 'max(env(safe-area-inset-top), 20px)', right: 20, zIndex: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.26)', fontSize: 20, padding: 8, lineHeight: 1 }}
          aria-label="Settings"
        >⚙</button>

        {/* Top section */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.2px' }}>{getGreeting()}</div>
          <SmallOrb alert={spendAlert} />
          <div style={{ fontSize: 54, fontWeight: 800, color: numColor, letterSpacing: '-2px', lineHeight: 1, textAlign: 'center' }}>{displayNum}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.36)', letterSpacing: '0.2px' }}>{displaySub}</div>
        </div>

        {/* 3 metric pills */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <MetricPill label="Health"  value={`${healthNum}`}                     color={healthColor} />
          <MetricPill label="Savings" value={`${savingsRate}%`}                  color={savColor}    />
          <MetricPill label="Pace"    value={onTrack ? 'On Track' : 'Off Track'} color={onTrack ? GREEN : RED} />
        </div>

        {/* Talk to Vela button */}
        <button
          onClick={() => { unlockAudio(); setChatOpen(true); }}
          style={{
            width: '100%', height: 58, background: PURPLE, border: 'none', borderRadius: 18,
            color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer',
            letterSpacing: '0.2px', boxShadow: '0 0 24px 4px rgba(127,119,221,0.22)',
          }}
        >Talk to Vela</button>

        {/* Daily tip */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: 12, padding: '9px 12px',
        }}>
          <span style={{ fontSize: 13, flexShrink: 0, lineHeight: '1.5' }}>💡</span>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.34)', lineHeight: 1.5 }}>{getDailyTip()}</div>
        </div>

        {/* Swipe-up hint */}
        <div style={{ textAlign: 'center', marginTop: 8, animation: 'swipeHint 2.6s ease-in-out infinite' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.5px' }}>↑  details</div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DETAIL VIEW — slides up, swipe down to dismiss
      ══════════════════════════════════════════ */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={e => onSwipeEnd(e, true)}
        style={{
          position: 'absolute', inset: 0, zIndex: 10, background: BG,
          transform: detailOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: SLIDE,
        }}
      >
        <DetailView
          income={income}
          expenses={expenses}
          debt={debt}
          goal={goal}
          insights={insights}
          surplus={surplus}
          goals={goals}
          onClose={() => setDetailOpen(false)}
        />
      </div>

      {/* ══════════════════════════════════════════
          CHAT OVERLAY — slides up from bottom
      ══════════════════════════════════════════ */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 20, background: BG,
        transform: chatOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: SLIDE,
      }}>

        <button
          onClick={() => setChatOpen(false)}
          style={{ position: 'absolute', top: 20, left: 18, zIndex: 30, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.36)', fontSize: 22, padding: 8, lineHeight: 1 }}
          aria-label="Close chat"
        >↓</button>

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
            {spendAlert && orbState === 'idle' && (
              <div style={{
                position: 'absolute', top: 8, right: 8, width: 14, height: 14,
                borderRadius: '50%', background: RED, border: `2px solid ${BG}`,
                boxShadow: '0 0 8px 3px rgba(255,107,107,0.55)',
                animation: 'alertPulse 1.4s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
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
            <GlassCard
              key={c.id} card={c} opacity={cardOpacities[idx] ?? 1}
              onSpeak={c.type === 'vela' ? () => { unlockAudio(); speak(c.text); } : null}
            />
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
          CELEBRATION CONFETTI
      ══════════════════════════════════════════ */}
      {celebrate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          {CONFETTI_DOTS.map((dot, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: dot.size, height: dot.size, borderRadius: '50%',
              background: dot.color,
              '--dx': `${dot.dx}px`,
              '--dy': `${dot.dy}px`,
              animation: `confettiFly 2s ease-out ${dot.delay}s forwards`,
            }} />
          ))}
          <div style={{
            position: 'absolute',
            color: '#fff', fontSize: 20, fontWeight: 800,
            textAlign: 'center', lineHeight: 1.4,
            textShadow: '0 2px 24px rgba(0,0,0,0.9)',
            animation: 'cardIn 0.4s ease-out',
            maxWidth: 280, padding: '0 24px',
          }}>{celebrateMsg}</div>
        </div>
      )}

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

// ── Detail View ─────────────────────────────────────────────────────

function DetailView({ income, expenses, debt, goal, insights, surplus, goals, onClose }) {
  const annualSurplus = surplus * 12;

  // Estimated spending breakdown (typical UK splits)
  const categories = expenses > 0 ? [
    { name: 'Housing & Bills', amount: Math.round(expenses * 0.35), color: PURPLE },
    { name: 'Food & Groceries', amount: Math.round(expenses * 0.22), color: GREEN },
    { name: 'Transport',        amount: Math.round(expenses * 0.14), color: BLUE },
  ] : [];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column',
      paddingTop: 'max(env(safe-area-inset-top), 16px)',
      paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
      boxSizing: 'border-box', overflow: 'hidden',
    }}>

      {/* Fixed header: drag handle + close */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingLeft: 24, paddingRight: 16, paddingTop: 8, marginBottom: 18, position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.18)' }} />
        <button onClick={onClose} style={{ position: 'absolute', right: 16, top: 0, background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 24, cursor: 'pointer', padding: 6, lineHeight: 1 }}>×</button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 8 }}>

        {/* Large income / expenses numbers */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, background: 'rgba(78,202,139,0.07)', border: '1px solid rgba(78,202,139,0.16)', borderRadius: 16, padding: '14px 14px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>Income</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: GREEN, letterSpacing: '-0.5px' }}>£{income.toLocaleString('en-GB')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', marginTop: 3 }}>per month</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.16)', borderRadius: 16, padding: '14px 14px' }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 6 }}>Expenses</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: AMBER, letterSpacing: '-0.5px' }}>£{expenses.toLocaleString('en-GB')}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', marginTop: 3 }}>per month</div>
          </div>
        </div>

        {/* Estimated spending breakdown */}
        {categories.length > 0 && (
          <>
            <DetailLabel>Estimated Breakdown</DetailLabel>
            {categories.map(c => (
              <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.68)' }}>{c.name}</div>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>~£{c.amount.toLocaleString('en-GB')}</div>
              </div>
            ))}
            <HSep />
          </>
        )}

        {/* Monthly position */}
        <DetailLabel>Monthly Position</DetailLabel>
        <NumberRow
          label="Surplus"
          value={surplus >= 0 ? `+£${surplus.toLocaleString('en-GB')}` : `−£${Math.abs(surplus).toLocaleString('en-GB')}`}
          color={surplus >= 0 ? GREEN : RED}
        />
        <NumberRow
          label="Annual trajectory"
          value={annualSurplus >= 0 ? `+£${Math.abs(annualSurplus).toLocaleString('en-GB')}` : `−£${Math.abs(annualSurplus).toLocaleString('en-GB')}`}
          color={annualSurplus >= 0 ? GREEN : RED}
        />
        {debt > 0 && <NumberRow label="Total debt" value={`£${debt.toLocaleString('en-GB')}`} color={AMBER} />}

        {/* Structured savings goals */}
        {goals.length > 0 && (
          <>
            <HSep />
            <DetailLabel>Savings Goals</DetailLabel>
            {goals.map(g => {
              const saved        = g.saved || 0;
              const pct          = g.target > 0 ? Math.min(100, Math.round((saved / g.target) * 100)) : 0;
              const monthsNeeded = surplus > 0 ? Math.ceil((g.target - saved) / surplus) : null;
              return (
                <div key={g.id} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{g.name}</div>
                    <div style={{ fontSize: 13, color: PURPLE, fontWeight: 700 }}>£{g.target.toLocaleString('en-GB')}</div>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: PURPLE, borderRadius: 2, transition: 'width 0.7s ease', minWidth: pct > 0 ? 4 : 0 }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.34)' }}>
                    {monthsNeeded
                      ? `~${monthsNeeded} month${monthsNeeded !== 1 ? 's' : ''} at £${surplus.toFixed(0)}/month surplus`
                      : surplus <= 0 ? 'Resolve deficit to start saving' : 'Tracking not yet started'}
                    {g.targetDate ? ` · target: ${g.targetDate}` : ''}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Legacy goal string (shown only when no structured goals) */}
        {goal && goals.length === 0 && (() => {
          let months = null;
          if (surplus > 0) {
            const m = goal.match(/[\d,]+/);
            if (m) { const a = parseInt(m[0].replace(/,/g, ''), 10); if (a > 0) months = Math.ceil(a / surplus); }
          }
          return (
            <>
              <HSep />
              <DetailLabel>Goal</DetailLabel>
              <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.45, marginBottom: 5 }}>{goal}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.42)' }}>
                {months ? `~${months} month${months !== 1 ? 's' : ''} at current rate` : surplus <= 0 ? 'Resolve shortfall first' : 'Add a £ amount to see timeline'}
              </div>
            </>
          );
        })()}

        {/* Vela's Insights */}
        {insights.length > 0 && (
          <>
            <HSep />
            <DetailLabel>Vela's Insights</DetailLabel>
            {insights.slice(0, 3).map((ins, i) => (
              <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.52)', lineHeight: 1.55, marginBottom: 10, paddingLeft: 10, borderLeft: '2px solid rgba(127,119,221,0.35)' }}>
                {ins}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}


function NumberRow({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: 11, paddingBottom: 11,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function HSep() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '18px 0 14px' }} />;
}

function DetailLabel({ children }) {
  return (
    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.32)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 12 }}>
      {children}
    </div>
  );
}

// ── Shared sub-components ───────────────────────────────────────────

function SmallOrb({ alert }) {
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, #b0acee, ${PURPLE} 55%, #3a369e)`,
        boxShadow: '0 0 18px 6px rgba(127,119,221,0.32)',
        animation: 'orbIdle 3s ease-in-out infinite',
      }} />
      {alert && (
        <div style={{
          position: 'absolute', top: 1, right: 1,
          width: 12, height: 12, borderRadius: '50%',
          background: RED, border: `2px solid ${BG}`,
          boxShadow: '0 0 6px 2px rgba(255,107,107,0.6)',
          animation: 'alertPulse 1.4s ease-in-out infinite',
        }} />
      )}
    </div>
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
      <div style={{ fontSize: isLong ? 13 : 20, fontWeight: 700, color, lineHeight: 1, textAlign: 'center' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function GlassCard({ card, opacity = 1, onSpeak }) {
  const isUser = card.type === 'user';
  return (
    <div style={{
      position: 'relative',
      background: isUser ? 'rgba(127,119,221,0.08)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${isUser ? 'rgba(127,119,221,0.26)' : 'rgba(255,255,255,0.1)'}`,
      borderRadius: 20, padding: '12px 16px', marginBottom: 10,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      animation: 'cardIn 0.35s ease-out', opacity, transition: 'opacity 0.5s ease',
    }}>
      {!isUser && onSpeak && (
        <button
          onClick={onSpeak}
          style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', color: 'rgba(255,255,255,0.28)', fontSize: 13, cursor: 'pointer', padding: 4, lineHeight: 1 }}
        >🔊</button>
      )}
      <div style={{ fontSize: 10, color: isUser ? 'rgba(127,119,221,0.65)' : 'rgba(255,255,255,0.28)', marginBottom: 5, letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600 }}>
        {isUser ? 'You' : 'Vela'}
      </div>
      <div style={{ fontSize: 14, color: '#eeeeff', lineHeight: 1.62, whiteSpace: 'pre-wrap', paddingRight: onSpeak ? 22 : 0 }}>{card.text}</div>
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
