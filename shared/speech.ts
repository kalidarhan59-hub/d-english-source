export type SpeechSynthesisLike = {
  speak: (utterance: unknown) => void;
  cancel: () => void;
  getVoices?: () => SpeechSynthesisVoice[];
};

export type EnglishUtterance = {
  lang: string;
  rate: number;
  pitch: number;
  voice?: SpeechSynthesisVoice | null;
  onstart?: unknown;
  onend?: unknown;
  onerror?: unknown;
};

export const canUseSpeechSynthesis = (value: unknown): value is SpeechSynthesisLike => {
  return Boolean(value && typeof (value as SpeechSynthesisLike).speak === "function" && typeof (value as SpeechSynthesisLike).cancel === "function");
};

export const extractEnglishText = (value: string) => {
  return (value.match(/[A-Za-z][A-Za-z0-9.,!?;:'"’()\-]*/g) ?? []).join(" ").trim();
};

export function beginEnglishSpeech(text: string, engine: unknown, createUtterance: (text: string) => EnglishUtterance, rate = 0.7) {
  const englishText = extractEnglishText(text);
  if (!englishText) return { status: "empty" as const, text: englishText };
  if (!canUseSpeechSynthesis(engine)) return { status: "unsupported" as const, text: englishText };
  engine.cancel();
  const utterance = createUtterance(englishText);
  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.pitch = 1;
  const voice = engine.getVoices?.().find((item) => item.lang.toLowerCase().startsWith("en"));
  if (voice) utterance.voice = voice;
  engine.speak(utterance);
  return { status: "started" as const, text: englishText, utterance };
}
