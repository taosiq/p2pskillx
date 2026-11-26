import { questionBanks } from '../../utils/questionBanks/index.js';

export const QUESTION_COUNT = 10;
export const SECONDS_PER_QUESTION = 30;
export const PASS_MARK = 0.7;
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const LEVEL_BRIEF = {
  Beginner: 'core concepts, definitions and basic usage',
  Intermediate: 'practical day-to-day use, common patterns and typical mistakes',
  Advanced: 'deeper understanding, trade-offs, debugging and less common features',
  Expert: 'mastery: subtle edge cases, internals, performance and expert judgement',
};

// ---------- helpers ----------

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** Keep only well-formed questions; shuffle options so the right answer isn't always "A". */
export function sanitiseQuestions(raw) {
  const seen = new Set();
  const out = [];
  for (const q of raw || []) {
    const question = String(q?.question || '').trim().slice(0, 400);
    const options = Array.isArray(q?.options) ? q.options.map((o) => String(o).trim().slice(0, 200)) : [];
    const correct = Number(q?.correctAnswer);
    if (!question || options.length !== 4 || new Set(options).size !== 4 || !(correct >= 0 && correct <= 3)) continue;
    if (seen.has(question.toLowerCase())) continue;
    seen.add(question.toLowerCase());
    const order = shuffle([0, 1, 2, 3]);
    out.push({
      question,
      options: order.map((i) => options[i]),
      correctAnswer: order.indexOf(correct),
      explanation: String(q?.explanation || '').trim().slice(0, 400),
    });
  }
  return out;
}

const extractJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const m = String(text).match(/\{[\s\S]*\}/);
    return m ? JSON.parse(m[0]) : null;
  }
};

export async function generateWithAI(env, skill, level) {
  const models = String(env.AI_MODELS || '').split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3);
  const prompt = `Write ${QUESTION_COUNT + 2} multiple-choice questions that test "${skill}" at ${level} level (${LEVEL_BRIEF[level]}).
Rules: exactly 4 distinct options each; exactly one correct; no "all/none of the above"; no trick wording; questions must be factual and unambiguous.
Reply with JSON only:
{"questions":[{"question":"...","options":["...","...","...","..."],"correctAnswer":0,"explanation":"one sentence"}]}`;

  // The free models "think" before answering. Keep that thinking short and leave plenty of
  // room for the answer: with a small budget they can spend it all thinking and return nothing.
  // Try the models one at a time (OpenRouter only falls back on errors, not on empty answers),
  // within a total budget that stays under the app's 75-second wait.
  const deadline = Date.now() + 65000;
  let best = [];
  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining < 8000) break;
    const questions = await askModel(env, model, prompt, remaining);
    if (questions.length > best.length) best = questions;
    if (best.length >= QUESTION_COUNT) break;
    console.log(`quiz: ${model} gave ${questions.length} usable questions`);
  }
  return best;
}

async function askModel(env, model, prompt, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://p2pskillx.app',
        'X-Title': 'P2PSkillX',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You write accurate, well-calibrated skill assessment questions. Output strict JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 8000,
        reasoning: { effort: 'low', exclude: true },
      }),
    });
    if (!res.ok) {
      console.log(`quiz: ${model} returned HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const parsed = extractJson(data?.choices?.[0]?.message?.content || '');
    return sanitiseQuestions(parsed?.questions);
  } catch (e) {
    console.log(`quiz: ${model} failed (${e?.name === 'AbortError' ? 'timeout' : 'error'})`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Offline fallback: the curated question banks bundled with the app. */
export function fromBank(skill) {
  const key = Object.keys(questionBanks).find((k) => k.toLowerCase() === skill.toLowerCase()) ||
    Object.keys(questionBanks).find((k) => skill.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(skill.toLowerCase()));
  return key ? sanitiseQuestions(shuffle(questionBanks[key])) : [];
}

// ---------- sealed answer key ----------

const b64u = {
  enc: (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
  dec: (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0)),
};

async function key(secret) {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

/** Encrypt the answer key so the phone can hold it without being able to read it. */
export async function seal(secret, payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(secret), new TextEncoder().encode(JSON.stringify(payload))));
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return b64u.enc(out);
}

export async function unseal(secret, token) {
  try {
    const bytes = b64u.dec(String(token));
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: bytes.slice(0, 12) }, await key(secret), bytes.slice(12));
    return JSON.parse(new TextDecoder().decode(pt));
  } catch {
    return null;
  }
}

export const cleanSkill = (s) => String(s || '').replace(/[.~*/[\]`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50);
