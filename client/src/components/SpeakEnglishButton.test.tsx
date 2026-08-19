/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

import { SpeakEnglishButton } from "./SpeakEnglishButton";

class MockUtterance {
  lang = "";
  rate = 0;
  pitch = 0;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public readonly text: string) {}
}

describe("SpeakEnglishButton on learning surfaces", () => {
  const speak = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    speak.mockReset();
    cancel.mockReset();
    toastError.mockReset();
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: MockUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak, cancel, getVoices: () => [] } });
  });

  afterEach(() => cleanup());

  it("speaks a representative English word or phrase after the learner clicks its speaker control", () => {
    render(<SpeakEnglishButton text="Good morning!" label="Озвучить вариант Good morning"/>);
    fireEvent.click(screen.getByRole("button", { name: "Озвучить вариант Good morning" }));
    const utterance = speak.mock.calls[0]?.[0] as MockUtterance;
    expect(cancel).toHaveBeenCalledOnce();
    expect(utterance).toMatchObject({ text: "Good morning!", lang: "en-US", rate: 0.82, pitch: 1 });
  });

  it("shows the accessible fallback message rather than failing when speech synthesis is unavailable", () => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    render(<SpeakEnglishButton text="reliable" label="Озвучить слово reliable"/>);
    fireEvent.click(screen.getByRole("button", { name: "Озвучить слово reliable" }));
    expect(toastError).toHaveBeenCalledWith("Озвучивание недоступно в этом браузере. Английский текст остаётся видимым.");
    expect(speak).not.toHaveBeenCalled();
  });
});
