export type SpeechSynthesisLike = { speak: (utterance: unknown) => void; cancel: () => void };

export const canUseSpeechSynthesis = (value: unknown): value is SpeechSynthesisLike => {
  return Boolean(value && typeof (value as SpeechSynthesisLike).speak === "function" && typeof (value as SpeechSynthesisLike).cancel === "function");
};
