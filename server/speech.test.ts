import { describe, expect, it, vi } from "vitest";
import { canUseSpeechSynthesis } from "../shared/speech";

describe("SpeechSynthesis availability", () => {
  it("accepts a supported browser speech engine and rejects incomplete fallbacks", () => {
    const supported = { speak: vi.fn(), cancel: vi.fn() };
    expect(canUseSpeechSynthesis(supported)).toBe(true);
    expect(canUseSpeechSynthesis(undefined)).toBe(false);
    expect(canUseSpeechSynthesis({ speak: vi.fn() })).toBe(false);
    expect(canUseSpeechSynthesis({ cancel: vi.fn() })).toBe(false);
  });
});
