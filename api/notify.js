/**
 * POST /api/notify
 * Sends a Web Push notification to a stored subscription.
 *
 * Requires:
 *   VAPID_PUBLIC_KEY  — env var (base64url-encoded)
 *   VAPID_PRIVATE_KEY — env var (base64url-encoded)
 *   VAPID_EMAIL       — env var (mailto:you@example.com)
 *
 * Body: { subscription, title, body, tag? }
 *
 * To generate VAPID keys, run once in the terminal:
 *   node -e "const crypto = require('crypto'); const kp = crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' }); console.log('Public:', kp.publicKey.export({ type: 'spki', format: 'der' }).slice(26).toString('base64url')); console.log('Private:', kp.privateKey.export({ type: 'pkcs8', format: 'der' }).slice(36).toString('base64url'));"
 *
 * Then add to Vercel env vars:
 *   VAPID_PUBLIC_KEY  = <output above>
 *   VAPID_PRIVATE_KEY = <output above>
 *   VAPID_EMAIL       = mailto:your@email.com
 *   REACT_APP_VAPID_PUBLIC_KEY = <same public key> (used by the client)
 */

// Encode bytes to base64url
function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

// Decode base64url to Buffer
function fromB64url(str) {
  return Buffer.from(str, 'base64url');
}

// Build the JWT for VAPID auth
async function buildVapidJwt(audience, privateKeyB64) {
  const header  = b64url(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
  const payload = b64url(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 3600,
    sub: process.env.VAPID_EMAIL || 'mailto:noa@example.com',
  }));
  const data    = `${header}.${payload}`;

  // Import ECDSA private key (P-256 PKCS8)
  const pkcs8 = Buffer.concat([
    Buffer.from('308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420', 'hex'),
    fromB64url(privateKeyB64),
  ]);
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8', pkcs8,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false, ['sign']
  );

  const sig    = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    cryptoKey,
    Buffer.from(data)
  );
  return `${data}.${b64url(sig)}`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { subscription, title = 'Noa', body = '', tag = 'noa-push' } = req.body || {};
  if (!subscription?.endpoint) return res.status(400).json({ error: 'subscription required' });

  const publicKey  = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return res.status(503).json({ error: 'VAPID keys not configured. See api/notify.js for setup instructions.' });
  }

  try {
    const url      = new URL(subscription.endpoint);
    const audience = `${url.protocol}//${url.host}`;
    const jwt      = await buildVapidJwt(audience, privateKey);
    const vapidAuth = `vapid t=${jwt},k=${publicKey}`;

    const payload = JSON.stringify({ title, body, tag, url: '/' });

    const pushRes = await fetch(subscription.endpoint, {
      method:  'POST',
      headers: {
        'Authorization':  vapidAuth,
        'Content-Type':   'application/octet-stream',
        'Content-Length': Buffer.byteLength(payload),
        'TTL':            '86400',
      },
      body: payload,
    });

    if (pushRes.status === 201 || pushRes.status === 200) {
      return res.status(200).json({ ok: true });
    }
    const errText = await pushRes.text();
    console.error('[notify] push server responded:', pushRes.status, errText);
    return res.status(pushRes.status).json({ error: errText });
  } catch (err) {
    console.error('[notify] error:', err?.message);
    return res.status(500).json({ error: err?.message || 'Internal error' });
  }
}
