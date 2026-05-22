const RACHEL_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // ElevenLabs Rachel — free-tier default

async function callElevenLabs(text, apiKey, voiceId) {
  return fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  const apiKey  = process.env.ELEVENLABS_API_KEY || process.env.VITE_ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID || process.env.VITE_ELEVENLABS_VOICE_ID || RACHEL_VOICE_ID;

  console.log('[api/speak] key:', apiKey ? apiKey.slice(0, 8) + '...' : 'MISSING', '| voice:', voiceId);

  if (!apiKey) {
    return res.status(503).json({ error: 'ElevenLabs not configured' });
  }

  try {
    let elevenRes = await callElevenLabs(text, apiKey, voiceId);

    // If the configured voice doesn't exist, retry with Rachel (free-tier default)
    if ((elevenRes.status === 404 || elevenRes.status === 401) && voiceId !== RACHEL_VOICE_ID) {
      console.log('[api/speak] voice unavailable (%s), retrying with Rachel', elevenRes.status);
      elevenRes = await callElevenLabs(text, apiKey, RACHEL_VOICE_ID);
    }

    if (!elevenRes.ok) {
      const err = await elevenRes.text();
      console.error('[api/speak] ElevenLabs error:', elevenRes.status, err);
      return res.status(elevenRes.status).json({ error: `ElevenLabs ${elevenRes.status}: ${err}` });
    }

    const buffer = await elevenRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('api/speak error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
