let currentAudio = null;

const EMOJI_RE = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{1F300}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{1FA00}-\u{1FFFF}]/gu;

// cleanText — makes text natural for text-to-speech before sending to ElevenLabs.
// Applied to every string before the ElevenLabs API call.
function cleanText(t) {
  return t
    // £ amounts → spoken form  e.g. "£1,500" → "1,500 pounds", "£50.00" → "50 pounds"
    .replace(/£([\d,]+(?:\.\d+)?)/g, (_, n) => `${n} pounds`)
    // Percentages → "X percent"
    .replace(/([\d.]+)%/g, (_, n) => `${n} percent`)
    // Slashes → natural pause (space)
    .replace(/\s*\/\s*/g, ', ')
    // Markdown bold/italic  **text**, __text__, *text*, _text_
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Markdown headings  ## Heading
    .replace(/#{1,6}\s*/g, '')
    // Markdown list markers  • · – —  (keep the following text)
    .replace(/^[\s]*[•·\-–—]\s*/gm, '')
    // Remaining emoji and misc symbols
    .replace(EMOJI_RE, '')
    .replace(/[⚖️══►◄▸▹→←↑↓]/g, '')
    // Collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    try { currentAudio.src = ''; } catch (_) {}
    currentAudio = null;
  }
  window.speechSynthesis?.cancel();
}

function fallback(text, onEnd, onError) {
  if (!window.speechSynthesis) { if (onError) onError(); return; }
  window.speechSynthesis.cancel();
  const fire = () => {
    const voices = window.speechSynthesis.getVoices();
    const PRIORITY = ['Samantha', 'Karen', 'Moira', 'Victoria', 'Tessa'];
    const voice = PRIORITY.reduce((f, n) => f || voices.find(v => v.name.includes(n)), null)
               || voices.find(v => v.lang === 'en-GB')
               || voices.find(v => v.lang.startsWith('en')) || null;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.78; u.pitch = 0.95; u.volume = 1;
    if (voice) u.voice = voice;
    u.onend   = onEnd   || null;
    u.onerror = onError || null;
    window.speechSynthesis.speak(u);
  };
  window.speechSynthesis.getVoices().length > 0
    ? fire()
    : (window.speechSynthesis.onvoiceschanged = () => { fire(); window.speechSynthesis.onvoiceschanged = null; });
}

export async function speak(text, { onStart, onEnd, onError, onFail } = {}) {
  stopSpeaking();
  const clean = cleanText(text);
  if (!clean) { if (onEnd) onEnd(); return; }
  if (onStart) onStart();
  console.log('[voice] calling /api/speak, text length:', clean.length);
  try {
    const res = await fetch('/api/speak', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: clean }),
    });
    if (!res.ok) {
      let errBody = '';
      try { errBody = await res.text(); } catch (_) {}
      console.error('[voice] /api/speak failed:', res.status, errBody);
      if (onFail) onFail(`Voice API ${res.status}: ${errBody.slice(0, 160)}`);
      fallback(clean, onEnd, onError);
      return;
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (onEnd) onEnd();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      if (currentAudio === audio) currentAudio = null;
      if (onError) onError(); else if (onEnd) onEnd();
    };
    audio.play().catch(playErr => {
      console.error('[voice] audio.play() failed:', playErr?.message);
      fallback(clean, onEnd, onError);
    });
  } catch (err) {
    console.error('[voice] speak() threw:', err?.message);
    if (onFail) onFail(`Voice error: ${err?.message || 'network failure'}`);
    fallback(clean, onEnd, onError);
  }
}
