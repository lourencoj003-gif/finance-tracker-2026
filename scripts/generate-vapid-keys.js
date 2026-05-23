#!/usr/bin/env node
/**
 * generate-vapid-keys.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates a VAPID key pair (P-256 ECDH) for Web Push notifications.
 *
 * Usage:
 *   node scripts/generate-vapid-keys.js
 *
 * Then add the printed values to your Vercel project:
 *   vercel env add VAPID_PUBLIC_KEY
 *   vercel env add VAPID_PRIVATE_KEY
 *   vercel env add VAPID_EMAIL
 *   vercel env add REACT_APP_VAPID_PUBLIC_KEY   ← same value as VAPID_PUBLIC_KEY
 *
 * Or paste them directly in the Vercel dashboard under
 *   Project → Settings → Environment Variables
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { webcrypto } = require('crypto');
const { subtle }   = webcrypto;

// Base64url encode a buffer (no padding, URL-safe chars)
function b64u(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function main() {
  // Generate a P-256 ECDH key pair (required for VAPID / Web Push)
  const keyPair = await subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,            // extractable
    ['deriveKey'],   // usage (just needs to be non-empty for export)
  );

  // Export public key as raw bytes (uncompressed point: 04 || x || y = 65 bytes)
  const pubRaw  = await subtle.exportKey('raw',  keyPair.publicKey);
  // Export private key as PKCS8, then extract the raw scalar from the JWK
  const privJwk = await subtle.exportKey('jwk',  keyPair.privateKey);

  const publicKey  = b64u(pubRaw);
  const privateKey = privJwk.d;           // already base64url from WebCrypto

  // ── Output ────────────────────────────────────────────────────────────────
  const border = '─'.repeat(70);

  console.log('\n' + border);
  console.log('  ✅  VAPID KEY PAIR GENERATED');
  console.log(border);

  console.log('\n📋  Copy-paste these exact values into Vercel:\n');

  console.log('  Variable name :  VAPID_PUBLIC_KEY');
  console.log('  Value         :  ' + publicKey);
  console.log('  Environment   :  Production, Preview, Development\n');

  console.log('  Variable name :  VAPID_PRIVATE_KEY');
  console.log('  Value         :  ' + privateKey);
  console.log('  Environment   :  Production, Preview, Development\n');

  console.log('  Variable name :  VAPID_EMAIL');
  console.log('  Value         :  mailto:YOUR_EMAIL@example.com   ← replace with yours');
  console.log('  Environment   :  Production, Preview, Development\n');

  console.log('  Variable name :  REACT_APP_VAPID_PUBLIC_KEY');
  console.log('  Value         :  ' + publicKey);
  console.log('  Note          :  Same public key — needed by the React app (CRA prefix)');
  console.log('  Environment   :  Production, Preview, Development\n');

  console.log(border);
  console.log('  ⚠️   KEEP VAPID_PRIVATE_KEY SECRET — never commit it to git');
  console.log(border);

  console.log('\n🔗  Vercel dashboard: https://vercel.com/dashboard');
  console.log('    Project → Settings → Environment Variables → Add New\n');

  console.log('  Or add via CLI (run each command and paste the value when prompted):');
  console.log('    vercel env add VAPID_PUBLIC_KEY');
  console.log('    vercel env add VAPID_PRIVATE_KEY');
  console.log('    vercel env add VAPID_EMAIL');
  console.log('    vercel env add REACT_APP_VAPID_PUBLIC_KEY\n');

  console.log('  After adding env vars, redeploy:');
  console.log('    vercel --prod\n');

  console.log(border + '\n');
}

main().catch(err => {
  console.error('\n❌  Key generation failed:', err.message);
  process.exit(1);
});
