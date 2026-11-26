// AI models used for MCQ generation via OpenRouter.
// ":free" models cost nothing (daily request limit applies, no card needed).
// OpenRouter tries them in order, so the second is an automatic fallback.
// OpenRouter allows at most 3 models here.
// See the current free list at https://openrouter.ai/models?q=free
export const AI_MODELS = [
  'baidu/ernie-5.5-flash-preview:free', // fastest in testing (~4s)
  'nvidia/nemotron-3.5-super-vl:free',   // reliable (~11s)
  'google/gemma-4-31b-it:free',          // often rate-limited at peak times
];
