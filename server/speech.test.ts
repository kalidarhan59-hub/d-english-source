import { describe, expect, it, vi } from "vitest";
import { beginEnglishSpeech, canUseSpeechSynthesis, extractEnglishText } from "../shared/speech";

describe("SpeechSynthesis availability", () => {
  it("accepts a supported browser speech engine and rejects incomplete fallbacks", () => {
    const supported = { speak: vi.fn(), cancel: vi.fn() };
    expect(canUseSpeechSynthesis(supported)).toBe(true);
    expect(canUseSpeechSynthesis(undefined)).toBe(false);
    expect(canUseSpeechSynthesis({ speak: vi.fn() })).toBe(false);
    expect(canUseSpeechSynthesis({ cancel: vi.fn() })).toBe(false);
  });

  it("extracts the English phrase that should be spoken from bilingual learning text", () => {
    expect(extractEnglishText("Прочитай: “The data suggests a significant improvement.”")).toBe("The data suggests a significant improvement.");
    expect(extractEnglishText("Введи перевод слова «reliable».")) .toBe("reliable");
    expect(extractEnglishText("Только русский текст")).toBe("");
  });

  it("starts English speech with a readable voice configuration and returns a fallback state when unavailable", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    const utterance = { lang: "", rate: 0, pitch: 0 };
    const started = beginEnglishSpeech("Прочитай: “Good morning!”", { speak, cancel, getVoices: () => [] }, () => utterance);
    expect(started).toMatchObject({ status: "started", text: "Good morning!" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledWith(utterance);
    expect(utterance).toMatchObject({ lang: "en-US", rate: 0.82, pitch: 1 });
    expect(beginEnglishSpeech("hello", undefined, () => utterance)).toMatchObject({ status: "unsupported", text: "hello" });
  });
});
