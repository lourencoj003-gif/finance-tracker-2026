import { useState, useCallback, useEffect } from 'react';
import { isReady } from './vela/storage';
import Splash     from './vela/screens/Splash';
import Pin        from './vela/screens/Pin';
import Onboarding from './vela/screens/Onboarding';
import VelaCore   from './vela/screens/VelaCore';

const S = { SPLASH: 'splash', PIN: 'pin', ONBOARD: 'onboard', VELA: 'vela' };

export default function App() {
  const [screen, setScreen] = useState(S.SPLASH);
  const [hidden, setHidden]  = useState(false);
  const [vpHeight, setVpHeight] = useState(
    window.visualViewport ? Math.round(window.visualViewport.height) : null
  );

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      window.scrollTo(0, 0);
      setVpHeight(Math.round(vv.height));
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const afterSplash     = useCallback(() => setScreen(S.PIN), []);
  const afterPin        = useCallback(() => setScreen(isReady() ? S.VELA : S.ONBOARD), []);
  const afterOnboarding = useCallback(() => setScreen(S.PIN), []);
  const goOnboard       = useCallback(() => setScreen(S.ONBOARD), []);
  const goReset         = useCallback(() => setScreen(S.PIN), []);

  const containerHeight = vpHeight ? `${vpHeight}px` : '100svh';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: containerHeight,
      overflow: 'hidden',
      touchAction: 'none',
      background: '#111318',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxSizing: 'border-box',
    }}>
      {screen === S.SPLASH  && <Splash     onDone={afterSplash} />}
      {screen === S.PIN     && <Pin        onSuccess={afterPin} onForgot={goReset} onBrandNew={goOnboard} />}
      {screen === S.ONBOARD && <Onboarding onDone={afterOnboarding} />}
      {screen === S.VELA    && <VelaCore   onReset={goReset} />}

      {hidden && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#111318',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 42, fontWeight: 300, color: '#E8DDD0', letterSpacing: '0.3em' }}>noa</div>
          <div style={{ fontSize: 7, fontWeight: 500, color: '#A89880', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Your Financial Navigator
          </div>
        </div>
      )}
    </div>
  );
}
