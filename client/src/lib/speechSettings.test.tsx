/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SPEECH_RATE, getSpeechRate, MAX_SPEECH_RATE, MIN_SPEECH_RATE, saveSpeechRate, SPEECH_RATE_STORAGE_KEY, speechRateLabel } from "./speechSettings";

describe("speech speed setting", () => {
  afterEach(() => window.localStorage.clear());

  it("starts at a beginner-friendly speed and persists a selected slider value", () => {
    expect(getSpeechRate()).toBe(DEFAULT_SPEECH_RATE);
    expect(saveSpeechRate(0.6)).toBe(0.6);
    expect(window.localStorage.getItem(SPEECH_RATE_STORAGE_KEY)).toBe("0.6");
    expect(getSpeechRate()).toBe(0.6);
    expect(speechRateLabel(0.6)).toContain("Медленно");
  });

  it("clamps values to the safe slider range", () => {
    expect(saveSpeechRate(0.1)).toBe(MIN_SPEECH_RATE);
    expect(saveSpeechRate(3)).toBe(MAX_SPEECH_RATE);
  });
});
