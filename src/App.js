import { useState, useCallback } from 'react';
import { isReady } from './vela/storage';
import { t } from './vela/theme';
import Splash     from './vela/screens/Splash';
import Pin        from './vela/screens/Pin';
import Onboarding from './vela/screens/Onboarding';
import Home       from './vela/screens/Home';
import Chat       from './vela/screens/Chat';

const S = { SPLASH: 'splash', PIN: 'pin', ONBOARD: 'onboard', HOME: 'home', CHAT: 'chat' };

export default function App() {
  const [screen, setScreen] = useState(S.SPLASH);

  const afterSplash     = useCallback(() => setScreen(S.PIN), []);
  const afterPin        = useCallback(() => setScreen(isReady() ? S.HOME : S.ONBOARD), []);
  const afterOnboarding = useCallback(() => setScreen(S.HOME), []);
  const goChat          = useCallback(() => setScreen(S.CHAT), []);
  const goHome          = useCallback(() => setScreen(S.HOME), []);
  const goReset         = useCallback(() => setScreen(S.PIN), []);

  return (
    <div style={{
      maxWidth: t.maxW,
      margin: '0 auto',
      minHeight: '100vh',
      background: t.bg,
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", sans-serif',
      position: 'relative',
    }}>
      {screen === S.SPLASH  && <Splash     onDone={afterSplash} />}
      {screen === S.PIN     && <Pin        onSuccess={afterPin} onForgot={goReset} />}
      {screen === S.ONBOARD && <Onboarding onDone={afterOnboarding} />}
      {screen === S.HOME    && <Home       onChat={goChat} onReset={goReset} />}
      {screen === S.CHAT    && <Chat       onBack={goHome} />}
    </div>
  );
}
