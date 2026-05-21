import { useEffect, useState, useRef, useCallback } from 'react';
import { t } from '../theme';
import { speak as voiceSpeak, stopSpeaking } from '../voice';

const INTRO_KEY = 'vela_intro_seen';

const SENTENCES = [
  { text: 'Hey. I am Noa.',                              delay: 2000 },
  { text: 'I know exactly what to do with your money.',   delay: 2500 },
  { text: 'Most people never figure this out.',           delay: 2500 },
  { text: 'You are about to.',                            delay: 2000 },
  { text: 'Tap me.',                                      delay: 2000 },
];


function unlockAudioContext() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ac = new AudioContext();
      const buf = ac.createBuffer(1, 1, 22050);
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(ac.destination);
      src.start(0);
      setTimeout(() => ac.close(), 100);
    }
    const silent = new Audio();
    silent.play().catch(() => {});
  } catch (_) {}
}

export default function Splash({ onDone }) {
  const [visible,         setVisible]         = useState(false);
  const [lineLen,         setLineLen]          = useState(0);
  const [subtitle,        setSubtitle]         = useState('');
  const [subtitleOpacity, setSubtitleOpacity]  = useState(0);
  const doneRef         = useRef(false);
  const timersRef       = useRef([]);
  const audioUnlocked   = useRef(false);
  const isFirstTime     = !localStorage.getItem(INTRO_KEY);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    timersRef.current.forEach(clearTimeout);
    stopSpeaking();
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
      return () => { earlyTimers.forEach(clearTimeout); stopSpeaking(); };
    }

    let cumulative = 0;
    SENTENCES.forEach((s, i) => {
      cumulative += s.delay;
      const showAt = cumulative;
      const hideAt = i < SENTENCES.length - 1 ? showAt + 1600 : null;

      push(() => {
        setSubtitle(s.text);
        setSubtitleOpacity(1);
        voiceSpeak(s.text);
      }, showAt);

      if (hideAt !== null) {
        push(() => setSubtitleOpacity(0), hideAt);
      }
    });

    push(finish, cumulative + 2000);

    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      stopSpeaking();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={() => {
        if (!audioUnlocked.current) {
          audioUnlocked.current = true;
          unlockAudioContext();
        }
        if (isFirstTime) finish();
      }}
      style={{
        position: 'fixed', inset: 0, background: t.bg,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0, transition: 'opacity 0.7s ease',
        cursor: 'pointer',
      }}
    >
      {/* ── Noa wordmark logo ── */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
      }}>
        {/* Compass north dot above the 'o' */}
        <div style={{
          position: 'absolute',
          top: -14,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#7CAE9E',
          opacity: lineLen === 1 ? 1 : 0,
          transition: 'opacity 0.5s ease 0.8s',
          boxShadow: '0 0 6px 2px rgba(124,174,158,0.6)',
        }} />

        {/* The wordmark */}
        <div style={{
          fontSize: 52,
          fontWeight: 300,
          color: '#E8DDD0',
          letterSpacing: '0.3em',
          lineHeight: 1,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
          filter: 'drop-shadow(0 0 20px rgba(232,221,208,0.25))',
        }}>
          noa
        </div>
      </div>

      {/* Tagline */}
      <div style={{
        fontSize: 7,
        fontWeight: 500,
        color: '#A89880',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        marginBottom: 32,
        opacity: lineLen === 1 ? 1 : 0,
        transition: 'opacity 0.5s ease 0.6s',
      }}>
        Your Financial Navigator
      </div>

      {/* Subtle underline accent */}
      <div style={{
        width: lineLen === 1 ? 48 : 0,
        height: 1,
        background: 'rgba(124,174,158,0.5)',
        marginBottom: 32,
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1) 0.3s',
      }} />

      {/* Speech subtitle — first time only */}
      {isFirstTime && (
        <div style={{
          height: 52,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 36px',
          textAlign: 'center',
        }}>
          {subtitle ? (
            <div style={{
              fontSize: 17,
              fontWeight: 400,
              color: 'rgba(232,221,208,0.82)',
              letterSpacing: '0.01em',
              lineHeight: 1.45,
              opacity: subtitleOpacity,
              transition: 'opacity 0.55s ease',
            }}>
              {subtitle}
            </div>
          ) : lineLen === 1 ? (
            <div style={{
              fontSize: 11,
              fontWeight: 500,
              color: 'rgba(232,221,208,0.28)',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
            }}>
              Tap anywhere to continue
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
