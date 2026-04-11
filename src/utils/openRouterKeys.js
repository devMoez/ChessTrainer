// API key pool — rotates on 402/429, tries every key before giving up.
//
// Key types (auto-detected):
//   AIza…      → Google AI Studio (FREE) — generativelanguage.googleapis.com
//   sk-or-v1-… → OpenRouter (paid)       — openrouter.ai

const POOL = [
  // Google AI — FREE tier, try first
  'AIzaSyBunfgB-RYi47OlTayVl6WhwDbH11gEHb4',
  // OpenRouter fallbacks (all currently depleted — kept for future top-up)
  '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',
  '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',
  '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',
  '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',
];

const LS_INDEX = 'orKeyIdx';

function getIndex() {
  return (parseInt(localStorage.getItem(LS_INDEX) ?? '0', 10) || 0) % POOL.length;
}

function advanceIndex() {
  localStorage.setItem(LS_INDEX, String((getIndex() + 1) % POOL.length));
}

function isGoogleKey(key) {
  return key.startsWith('AIza');
}

function endpointFor(key) {
  return isGoogleKey(key)
    ? 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
    : 'https://openrouter.ai/api/v1/chat/completions';
}

// Maps OpenRouter-style "provider/model-name" to the plain name Google expects.
function resolveModel(key, model) {
  if (!isGoogleKey(key)) return model;
  if (model && model.includes('gemini')) {
    return model.split('/').pop().replace(/-\d{3}$/, '').replace(/-exp$/, '');
  }
  return 'gemini-2.0-flash'; // fallback for claude / other models
}

export function getActiveKey() {
  return POOL[getIndex()];
}

export async function fetchOpenRouter(body) {
  // Always start from index 0 (Google key) if nothing is stored yet.
  // Walk through every key in rotation order.
  const start = getIndex();

  for (let i = 0; i < POOL.length; i++) {
    const key = POOL[(start + i) % POOL.length];
    const endpoint = endpointFor(key);
    const model = resolveModel(key, body.model);

    console.log(`[API] Trying key ${(start + i) % POOL.length + 1}/${POOL.length} (${isGoogleKey(key) ? 'Google' : 'OpenRouter'}) model=${model}`);

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, model }),
      });
    } catch (networkErr) {
      console.error('[API] Network error:', networkErr);
      throw new Error(`Network error: ${networkErr.message}`);
    }

    console.log(`[API] Response status: ${res.status}`);

    // Rotate on no-credits (402) or rate-limit (429)
    if (res.status === 402 || res.status === 429) {
      const errBody = await res.clone().json().catch(() => null);
      console.warn(`[API] Key ${(start + i) % POOL.length + 1} returned ${res.status}, rotating.`, errBody);
      advanceIndex();
      continue;
    }

    if (!res.ok) {
      const errBody = await res.clone().json().catch(() => null);
      console.error(`[API] Error ${res.status}:`, errBody);
    }

    return res;
  }

  throw new Error('All API keys exhausted');
}
