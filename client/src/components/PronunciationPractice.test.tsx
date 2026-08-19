// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/SpeakEnglishButton", () => ({ SpeakEnglishButton: ({ label, showLabel }: { label: string; showLabel?: boolean }) => <button aria-label={label}>{showLabel ? "Прослушать оригинал" : label}</button> }));
import { PronunciationPractice } from "./PronunciationPractice";

class MockRecorder {
  static instance: MockRecorder | null = null;
  state: RecordingState = "inactive";
  mimeType = "audio/webm";
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: ((event: Event) => void) | null = null;
  constructor(_stream: MediaStream) { MockRecorder.instance = this; }
  start() { this.state = "recording"; }
  stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob(["voice"]) } as BlobEvent); this.onstop?.(new Event("stop")); }
}

describe("PronunciationPractice", () => {
  const stop = vi.fn();
  const getUserMedia = vi.fn();

  beforeEach(() => {
    stop.mockReset();
    getUserMedia.mockReset();
    getUserMedia.mockResolvedValue({ getTracks: () => [{ stop }] });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia } });
    vi.stubGlobal("MediaRecorder", MockRecorder);
    vi.stubGlobal("URL", { ...URL, createObjectURL: vi.fn(() => "blob:recording"), revokeObjectURL: vi.fn() });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("records a learner attempt and makes it available for playback", async () => {
    const { container } = render(<PronunciationPractice phrase="Nice to meet you."/>);
    fireEvent.click(screen.getByRole("button", { name: "Записать голос" }));
    await screen.findByRole("button", { name: "Остановить" });
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
    fireEvent.click(screen.getByRole("button", { name: "Остановить" }));
    await waitFor(() => expect(screen.getByText(/Готово. Прослушай свой вариант/)).toBeTruthy());
    expect(container.querySelector("audio")?.getAttribute("src")).toBe("blob:recording");
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it("explains how to continue when microphone access is denied", async () => {
    getUserMedia.mockRejectedValue(new DOMException("denied", "NotAllowedError"));
    render(<PronunciationPractice phrase="Nice to meet you."/>);
    fireEvent.click(screen.getByRole("button", { name: "Записать голос" }));
    expect(await screen.findByText(/Микрофон заблокирован/)).toBeTruthy();
  });
});
