const K = {
  PIN:          'vela_pin',
  READY:        'vela_ready',
  DATA:         'vela_data',
  INSIGHTS:     'vela_insights',
  BIO_ENABLED:  'vela_biometric_enabled',
  BIO_CRED:     'vela_biometric_cred',
  STREAK_DATE:  'vela_streak_date',
  STREAK_COUNT: 'vela_streak_count',
  CHECKIN_DATE: 'vela_checkin_date',
  GOALS:        'vela_goals',
  TIP_DATE:     'vela_tip_date',
  TIP_IDX:      'vela_tip_idx',
  LAST_OPEN:    'vela_last_open',
  CEREMONY_YM:  'vela_ceremony_ym',
  DEBTS:        'vela_debts',
  CHALLENGE:    'vela_challenge',
};

export const getPin            = ()    => localStorage.getItem(K.PIN);
export const setPin            = (p)   => localStorage.setItem(K.PIN, p);
export const isReady           = ()    => localStorage.getItem(K.READY) === '1';
export const markReady         = ()    => localStorage.setItem(K.READY, '1');
export const getData           = ()    => { const r = localStorage.getItem(K.DATA);     return r ? JSON.parse(r) : null; };
export const saveData          = (d)   => localStorage.setItem(K.DATA, JSON.stringify(d));
export const getInsights       = ()    => { const r = localStorage.getItem(K.INSIGHTS); return r ? JSON.parse(r) : null; };
export const saveInsights      = (ins) => localStorage.setItem(K.INSIGHTS, JSON.stringify(ins));
export const getBiometricEnabled = ()  => localStorage.getItem(K.BIO_ENABLED) === 'true';
export const setBiometricEnabled = ()  => localStorage.setItem(K.BIO_ENABLED, 'true');
export const getBiometricCred  = ()    => localStorage.getItem(K.BIO_CRED);
export const setBiometricCred  = (c)   => localStorage.setItem(K.BIO_CRED, c);
export const clearBiometric    = ()    => { localStorage.removeItem(K.BIO_ENABLED); localStorage.removeItem(K.BIO_CRED); };

// Returns today's ISO date string, e.g. '2026-05-17'
const today = () => new Date().toISOString().slice(0, 10);

export const tickStreak = () => {
  const t     = today();
  const stored = localStorage.getItem(K.STREAK_DATE);
  const count  = parseInt(localStorage.getItem(K.STREAK_COUNT) || '0', 10);
  if (stored === t) return count || 1;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const next = stored === yesterday ? count + 1 : 1;
  localStorage.setItem(K.STREAK_DATE, t);
  localStorage.setItem(K.STREAK_COUNT, String(next));
  return next;
};
export const getStreak = () => parseInt(localStorage.getItem(K.STREAK_COUNT) || '0', 10);

export const shouldShowCheckin = () => {
  if (new Date().getDay() !== 1) return false; // 1 = Monday
  return localStorage.getItem(K.CHECKIN_DATE) !== today();
};
export const markCheckin = () => localStorage.setItem(K.CHECKIN_DATE, today());

export const getGoals  = ()    => { const r = localStorage.getItem(K.GOALS); return r ? JSON.parse(r) : []; };
export const saveGoals = (g)   => localStorage.setItem(K.GOALS, JSON.stringify(g));

export const getLastOpen = () => parseInt(localStorage.getItem(K.LAST_OPEN) || '0', 10);
export const setLastOpen = () => localStorage.setItem(K.LAST_OPEN, String(Date.now()));

export const getLastCeremonyYM = () => localStorage.getItem(K.CEREMONY_YM) || '';
export const setLastCeremonyYM = () => {
  const n = new Date();
  localStorage.setItem(K.CEREMONY_YM, `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`);
};

export const getDebts      = ()    => { const r = localStorage.getItem(K.DEBTS);     return r ? JSON.parse(r) : []; };
export const saveDebts     = (d)   => localStorage.setItem(K.DEBTS, JSON.stringify(d));
export const getChallenge  = ()    => { const r = localStorage.getItem(K.CHALLENGE); return r ? JSON.parse(r) : null; };
export const saveChallenge = (c)   => localStorage.setItem(K.CHALLENGE, JSON.stringify(c));

export const clearAll  = ()    => Object.values(K).forEach(k => localStorage.removeItem(k));
