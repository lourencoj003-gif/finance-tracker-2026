const K = {
  PIN:      'vela_pin',
  READY:    'vela_ready',
  DATA:     'vela_data',
  INSIGHTS: 'vela_insights',
};

export const getPin       = ()    => localStorage.getItem(K.PIN);
export const setPin       = (p)   => localStorage.setItem(K.PIN, p);
export const isReady      = ()    => localStorage.getItem(K.READY) === '1';
export const markReady    = ()    => localStorage.setItem(K.READY, '1');
export const getData      = ()    => { const r = localStorage.getItem(K.DATA);     return r ? JSON.parse(r) : null; };
export const saveData     = (d)   => localStorage.setItem(K.DATA, JSON.stringify(d));
export const getInsights  = ()    => { const r = localStorage.getItem(K.INSIGHTS); return r ? JSON.parse(r) : null; };
export const saveInsights = (ins) => localStorage.setItem(K.INSIGHTS, JSON.stringify(ins));
export const clearAll     = ()    => Object.values(K).forEach(k => localStorage.removeItem(k));
