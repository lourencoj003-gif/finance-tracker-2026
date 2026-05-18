import { useEffect, useState, useRef, useCallback } from 'react';
import { t } from '../theme';

const INTRO_KEY = 'vela_intro_seen';

const SENTENCES = [
  { text: 'Hey. I am Marcus.',                            delay: 2000 },
  { text: 'I know exactly what to do with your money.',   delay: 2500 },
  { text: 'Most people never figure this out.',           delay: 2500 },
  { text: 'You are about to.',                            delay: 2000 },
  { text: 'Tap me.',                                      delay: 2000 },
];

function trySpeak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const fire = () => {
    const voices   = window.speechSynthesis.getVoices();
    const PRIORITY = ['Samantha', 'Karen', 'Moira', 'Victoria', 'Tessa'];
    const voice    = PRIORITY.reduce((f, n) => f || voices.find(v => v.name.includes(n)), null)
                  || voices.find(v => v.lang === 'en-GB')
                  || voices.find(v => v.lang.startsWith('en'))
                  || null;
    const u = new SpeechSynthesisUtterance(text);
    u.rate   = 0.86;
    u.pitch  = 1.05;
    u.volume = 1;
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  };
  window.speechSynthesis.getVoices().length > 0
    ? fire()
    : (window.speechSynthesis.onvoiceschanged = () => { fire(); window.speechSynthesis.onvoiceschanged = null; });
}

export default function Splash({ onDone }) {
  const [visible,         setVisible]         = useState(false);
  const [lineLen,         setLineLen]          = useState(0);
  const [subtitle,        setSubtitle]         = useState('');
  const [subtitleOpacity, setSubtitleOpacity]  = useState(0);
  const doneRef     = useRef(false);
  const timersRef   = useRef([]);
  const isFirstTime = !localStorage.getItem(INTRO_KEY);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    timersRef.current.forEach(clearTimeout);
    window.speechSynthesis?.cancel();
    localStorage.setItem(INTRO_KEY, '1');
    onDone();
  }, [onDone]);

  useEffect(() => {
    const push = (fn, ms) => { const id = setTimeout(fn, ms); timersRef.current.push(id); return id; };

    push(() => setVisible(true), 80);
    push(() => setLineLen(1), 500);

    if (!isFirstTime) {
      push(finish, 2600);
      const earlyTimers = timersRef.current;
      return () => { earlyTimers.forEach(clearTimeout); };
    }

    // Build cumulative delay schedule
    let t = 0;
    SENTENCES.forEach((s, i) => {
      t += s.delay;
      const showAt  = t;
      const hideAt  = i < SENTENCES.length - 1 ? showAt + 1600 : null;

      push(() => {
        setSubtitle(s.text);
        setSubtitleOpacity(1);
        trySpeak(s.text);
      }, showAt);

      if (hideAt !== null) {
        push(() => setSubtitleOpacity(0), hideAt);
      }
    });

    // Auto-advance after last sentence
    push(finish, t + 2000);

    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      window.speechSynthesis?.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={isFirstTime ? finish : undefined}
      style={{
        position: 'fixed', inset: 0, background: t.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease',
        cursor: isFirstTime ? 'pointer' : 'default',
      }}
    >

      {/* SVG V logo with navigation arc */}
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        style={{ marginBottom: 28, filter: 'drop-shadow(0 0 24px rgba(127,119,221,0.6))' }}
      >
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
        <circle
          cx="60"
          cy="78"
          r="3"
          fill="#7F77DD"
          opacity={lineLen === 1 ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease 1.3s' }}
        />
        <path d="M 22 28 L 60 82" stroke="white" strokeWidth="7"   strokeLinecap="round" fill="none" />
        <path d="M 98 28 L 60 82" stroke="white" strokeWidth="7"   strokeLinecap="round" fill="none" />
        <path d="M 14 28 L 30 28" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path d="M 90 28 L 106 28" stroke="white" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        <path
          d="M 60 62 L 60 68"
          stroke="rgba(127,119,221,0.7)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={lineLen === 1 ? 1 : 0}
          style={{ transition: 'opacity 0.4s ease 1.5s' }}
        />
      </svg>

      {/* Speech subtitle */}
      {isFirstTime && (
        <div style={{
          height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 8,
          padding: '0 36px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 17,
            fontWeight: 500,
            color: 'rgba(255,255,255,0.88)',
            letterSpacing: '0.01em',
            lineHeight: 1.45,
            opacity: subtitleOpacity,
            transition: 'opacity 0.55s ease',
          }}>
            {subtitle}
          </div>
        </div>
      )}

      {!isFirstTime && (
        <>
          <div style={{
            fontSize: 13, fontWeight: 700,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: '0.26em', textTransform: 'uppercase',
            marginBottom: 6,
          }}>
            Your Financial Navigator
          </div>
          <div style={{ fontSize: 11, color: 'rgba(127,119,221,0.5)', letterSpacing: '0.1em', marginTop: 6 }}>
            Vela
          </div>
        </>
      )}
    </div>
  );
}
