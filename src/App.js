import { useState, useCallback } from 'react';
import { isReady } from './vela/storage';
import Splash     from './vela/screens/Splash';
import Pin        from './vela/screens/Pin';
import Onboarding from './vela/screens/Onboarding';
import VelaCore   from './vela/screens/VelaCore';

const S = { SPLASH: 'splash', PIN: 'pin', ONBOARD: 'onboard', VELA: 'vela' };

export default function App() {
  const [screen, setScreen] = useState(S.SPLASH);

  const afterSplash     = useCallback(() => setScreen(S.PIN), []);
  const afterPin        = useCallback(() => setScreen(isReady() ? S.VELA : S.ONBOARD), []);
  const afterOnboarding = useCallback(() => setScreen(S.VELA), []);
  const goReset         = useCallback(() => setScreen(S.PIN), []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 430,
      height: '100%',
      overflow: 'hidden',
      background: '#0a0a0f',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
    }}>
      {screen === S.SPLASH  && <Splash     onDone={afterSplash} />}
      {screen === S.PIN     && <Pin        onSuccess={afterPin} onForgot={goReset} />}
      {screen === S.ONBOARD && <Onboarding onDone={afterOnboarding} />}
      {screen === S.VELA    && <VelaCore   onReset={goReset} />}
    </div>
  );
}
