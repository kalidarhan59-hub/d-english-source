export const SPEECH_RATE_STORAGE_KEY = "d-english-speech-rate";
export const DEFAULT_SPEECH_RATE = 0.7;
export const MIN_SPEECH_RATE = 0.5;
export const MAX_SPEECH_RATE = 1.15;

export function normalizeSpeechRate(value: number) {
  return Math.round(Math.min(MAX_SPEECH_RATE, Math.max(MIN_SPEECH_RATE, value)) * 100) / 100;
}

export function getSpeechRate() {
  if (typeof window === "undefined") return DEFAULT_SPEECH_RATE;
  const stored = Number(window.localStorage.getItem(SPEECH_RATE_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? normalizeSpeechRate(stored) : DEFAULT_SPEECH_RATE;
}

export function saveSpeechRate(value: number) {
  const rate = normalizeSpeechRate(value);
  if (typeof window !== "undefined") window.localStorage.setItem(SPEECH_RATE_STORAGE_KEY, String(rate));
  return rate;
}

export function speechRateLabel(rate: number) {
  if (rate <= 0.65) return "Медленно · для новичка";
  if (rate >= 0.95) return "Быстро · для практики";
  return "Обычно · комфортный темп";
}
