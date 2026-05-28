const K = {
  PIN:             'vela_pin',
  READY:           'vela_ready',
  ONBOARDING_DONE: 'noaOnboardingDone',
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
  EXPENSE_LOG:  'vela_expense_log',
  EVENING_DATE: 'vela_evening_date',
  EVENING_LOG:  'vela_evening_log',
  HISTORY:      'noaHistory',
  NAME:         'vela_name',
  USER_NAME:    'userName',
  WALKTHROUGH:  'vela_walkthrough_seen',
  TAP_HINT:     'vela_tap_hint_seen',
  INTRO_SEEN:   'vela_intro_seen',
  PREV_SCORE:   'vela_prev_score',
  DAILY_INSIGHT:  'noa_daily_insight',
  NOTIF_PREFS:    'noa_notif_prefs',
  NOTIF_LAST:     'noa_notif_last',
  PUSH_SUB:       'noa_push_sub',
  PRIVACY_MODE:   'vela_privacy_mode',      // Task 1 — Privacy Mode
  CONV_MEMORY:    'noa_conversation_memory', // Task 2 — Conversation Memory
  ACCOUNTS:       'vela_accounts',           // Task 2 — Bank Account Allocation
  // Intelligence + monetisation additions
  FINANCIAL_PERSONALITY: 'vela_financial_personality',
  FIRST_WEEK:     'vela_first_week_shown',
  PLAN_TYPE:      'vela_plan_type',          // 'free' | 'noa' | 'pro'
  WAITLIST_EMAIL: 'vela_waitlist_email',
  PAYWALL_VIEWS:  'vela_paywall_views',
  MEMORY_START:   'vela_memory_start',       // ISO date memory period started
  APP_START:      'vela_app_start',          // ISO date of first install
  // Plaid Open Banking
  BANKING_ACCESS_TOKEN: 'vela_banking_access_token', // Plaid access token (persisted for sync)
  BANKING_LAST_SYNC:    'vela_banking_last_sync',    // ISO timestamp of last sync
  BANKING_INSTITUTION:  'vela_banking_institution',  // e.g. 'Monzo'
  // Voice preference
  VOICE_ON: 'noa_voice_on', // persisted voice toggle (default true)
};

export const getPin              = ()    => localStorage.getItem(K.PIN);
export const setPin              = (p)   => localStorage.setItem(K.PIN, p);
export const getUserName         = ()    => localStorage.getItem(K.USER_NAME);
export const setUserName         = (n)   => { localStorage.setItem(K.USER_NAME, n); localStorage.setItem(K.NAME, n); };
export const isOnboardingDone    = ()    => localStorage.getItem(K.ONBOARDING_DONE) === '1';
export const markOnboardingDone  = ()    => localStorage.setItem(K.ONBOARDING_DONE, '1');
export const markReady           = ()    => localStorage.setItem(K.READY, '1');
export const isReady             = ()    => {
  if (!isOnboardingDone()) return false;
  const name = getUserName();
  const data = getData();
  return !!(name && data && typeof data.income === 'number');
};
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

export const getDebts      = ()    => { const r = localStorage.getItem(K.DEBTS);       return r ? JSON.parse(r) : []; };
export const saveDebts     = (d)   => localStorage.setItem(K.DEBTS, JSON.stringify(d));
export const getChallenge  = ()    => { const r = localStorage.getItem(K.CHALLENGE);   return r ? JSON.parse(r) : null; };
export const saveChallenge = (c)   => localStorage.setItem(K.CHALLENGE, JSON.stringify(c));
export const getExpenseLog = ()    => { const r = localStorage.getItem(K.EXPENSE_LOG); return r ? JSON.parse(r) : []; };
export const saveExpenseLog = (d)  => localStorage.setItem(K.EXPENSE_LOG, JSON.stringify(d));
export const getEveningDate = ()   => localStorage.getItem(K.EVENING_DATE) || '';
export const setEveningDate = ()   => localStorage.setItem(K.EVENING_DATE, new Date().toISOString().slice(0, 10));
export const getEveningLog  = ()   => { const r = localStorage.getItem(K.EVENING_LOG); return r ? JSON.parse(r) : []; };
export const appendEveningLog = (entry) => {
  const log = getEveningLog();
  log.push(entry);
  localStorage.setItem(K.EVENING_LOG, JSON.stringify(log));
};

export const clearAll  = ()    => Object.values(K).forEach(k => localStorage.removeItem(k));

// Daily AI insight — one Groq-generated sentence, cached per calendar day
export const getDailyInsight  = ()    => { const r = localStorage.getItem(K.DAILY_INSIGHT); return r ? JSON.parse(r) : null; };
export const saveDailyInsight = (obj) => localStorage.setItem(K.DAILY_INSIGHT, JSON.stringify(obj));

// Notification preferences — which types the user wants
export const getNotifPrefs  = ()    => { const r = localStorage.getItem(K.NOTIF_PREFS); return r ? JSON.parse(r) : { morning: true, payday: true, streak: true, weekly: true }; };
export const saveNotifPrefs = (p)   => localStorage.setItem(K.NOTIF_PREFS, JSON.stringify(p));

// Notification last-sent log — { morning: 'YYYY-MM-DD', streak: 'YYYY-MM-DD', ... }
export const getNotifLast  = ()    => { const r = localStorage.getItem(K.NOTIF_LAST); return r ? JSON.parse(r) : {}; };
export const saveNotifLast = (d)   => localStorage.setItem(K.NOTIF_LAST, JSON.stringify(d));

// Push subscription endpoint (stored for reference; server sends pushes using this)
export const getPushSub  = ()    => { const r = localStorage.getItem(K.PUSH_SUB); return r ? JSON.parse(r) : null; };
export const savePushSub = (sub) => localStorage.setItem(K.PUSH_SUB, JSON.stringify(sub));

// Task 1 — Privacy Mode: suppress specific £ figures from being spoken aloud
export const getPrivacyMode  = ()    => localStorage.getItem(K.PRIVACY_MODE) === 'true';
export const setPrivacyMode  = (on)  => localStorage.setItem(K.PRIVACY_MODE, on ? 'true' : 'false');

// Task 2 — Conversation Memory: last 10 exchanges (user + Noa), injected into prompts
// Each entry: { user: string, noa: string, ts: number }
const MAX_MEMORY = 10;
export const getConvoMemory   = ()    => { const r = localStorage.getItem(K.CONV_MEMORY); return r ? JSON.parse(r) : []; };
export const saveConvoMemory  = (arr) => localStorage.setItem(K.CONV_MEMORY, JSON.stringify(arr.slice(-MAX_MEMORY)));
export const clearConvoMemory = ()    => localStorage.removeItem(K.CONV_MEMORY);
// Bank Account Allocation — up to 4 accounts with name, purpose, balance
export const getAccounts  = ()    => { const r = localStorage.getItem(K.ACCOUNTS); return r ? JSON.parse(r) : []; };
export const saveAccounts = (arr) => localStorage.setItem(K.ACCOUNTS, JSON.stringify(arr));

export const appendConvoMemory = (user, noa) => {
  const mem = getConvoMemory();
  mem.push({ user, noa, ts: Date.now() });
  saveConvoMemory(mem);
};

// Financial personality — detected after 5+ transactions
export const getFinancialPersonality  = ()    => localStorage.getItem(K.FINANCIAL_PERSONALITY);
export const saveFinancialPersonality = (p)   => localStorage.setItem(K.FINANCIAL_PERSONALITY, p);

// First Week Plan — shown once after first dashboard load
export const getFirstWeekShown  = ()  => localStorage.getItem(K.FIRST_WEEK) === '1';
export const markFirstWeekShown = ()  => localStorage.setItem(K.FIRST_WEEK, '1');

// Plan type — 'free' (default), 'noa', 'pro'
export const getPlanType  = ()    => localStorage.getItem(K.PLAN_TYPE) || 'free';
export const savePlanType = (t)   => localStorage.setItem(K.PLAN_TYPE, t);

// Waitlist email capture
export const getWaitlistEmail  = ()  => localStorage.getItem(K.WAITLIST_EMAIL) || '';
export const saveWaitlistEmail = (e) => localStorage.setItem(K.WAITLIST_EMAIL, e);

// Paywall banner view count
export const getPaywallViews      = ()  => parseInt(localStorage.getItem(K.PAYWALL_VIEWS) || '0', 10);
export const incrementPaywallViews = () => localStorage.setItem(K.PAYWALL_VIEWS, String(getPaywallViews() + 1));

// Memory period tracking — when current 7-day free period started
export const getMemoryStart  = ()  => localStorage.getItem(K.MEMORY_START) || '';
export const setMemoryStart  = ()  => localStorage.setItem(K.MEMORY_START, new Date().toISOString().slice(0, 10));

// App start date — set once on first install
export const getAppStart  = ()  => localStorage.getItem(K.APP_START) || '';
export const setAppStart  = ()  => { if (!localStorage.getItem(K.APP_START)) localStorage.setItem(K.APP_START, new Date().toISOString().slice(0, 10)); };

// Plaid Open Banking
export const getBankingAccessToken  = ()    => localStorage.getItem(K.BANKING_ACCESS_TOKEN) || '';
export const saveBankingAccessToken = (t)   => localStorage.setItem(K.BANKING_ACCESS_TOKEN, t);
export const getBankingLastSync     = ()    => localStorage.getItem(K.BANKING_LAST_SYNC) || '';
export const setBankingLastSync     = ()    => localStorage.setItem(K.BANKING_LAST_SYNC, new Date().toISOString());
export const getBankingInstitution  = ()    => localStorage.getItem(K.BANKING_INSTITUTION) || '';
export const saveBankingInstitution = (n)   => localStorage.setItem(K.BANKING_INSTITUTION, n);
export const clearBanking           = ()    => {
  [K.BANKING_ACCESS_TOKEN, K.BANKING_LAST_SYNC, K.BANKING_INSTITUTION]
    .forEach(k => localStorage.removeItem(k));
};

// Voice preference — persisted so toggle survives reload
export const getVoiceOn  = ()    => localStorage.getItem(K.VOICE_ON) !== 'false'; // default true
export const saveVoiceOn = (on)  => localStorage.setItem(K.VOICE_ON, on ? 'true' : 'false');
