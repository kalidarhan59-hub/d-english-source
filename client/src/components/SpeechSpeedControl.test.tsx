/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SPEECH_RATE_STORAGE_KEY } from "@/lib/speechSettings";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
import { SpeechSpeedControl } from "./SpeechSpeedControl";

describe("SpeechSpeedControl", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("shows a beginner-friendly slow speed and persists a slider adjustment", () => {
    render(<SpeechSpeedControl/>);
    const slider = screen.getByRole("slider", { name: "Скорость озвучивания" }) as HTMLInputElement;
    expect(slider.value).toBe("0.7");
    expect(screen.getByText("Обычно · комфортный темп")).toBeTruthy();
    fireEvent.change(slider, { target: { value: "0.55" } });
    expect(slider.value).toBe("0.55");
    expect(screen.getByText("Медленно · для новичка")).toBeTruthy();
    expect(window.localStorage.getItem(SPEECH_RATE_STORAGE_KEY)).toBe("0.55");
  });
});
