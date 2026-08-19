/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SPEECH_RATE_STORAGE_KEY } from "@/lib/speechSettings";

const mocks = vi.hoisted(() => ({ speak: vi.fn(), cancel: vi.fn(), toastError: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true }) }));
vi.mock("@/lib/trpc", () => ({ trpc: { dChat: { ask: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));
vi.mock("./MascotD", () => ({ MascotD: () => null }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/ui/input", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props}/> }));

import { DChat } from "./DChat";

class MockUtterance {
  lang = "";
  rate = 0;
  onerror: (() => void) | null = null;
  constructor(public readonly text: string) {}
}

describe("DChat speech settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.localStorage.setItem(SPEECH_RATE_STORAGE_KEY, "0.55");
    Object.assign(globalThis as unknown as Record<string, unknown>, { React, useAuth: () => ({ isAuthenticated: true }) });
    mocks.speak.mockReset(); mocks.cancel.mockReset(); mocks.toastError.mockReset();
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: MockUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak: mocks.speak, cancel: mocks.cancel } });
  });
  afterEach(() => cleanup());

  it("uses the saved pronunciation rate when D speaks", () => {
    render(<DChat/>);
    fireEvent.click(screen.getByRole("button", { name: "Открыть чат с D" }));
    fireEvent.click(screen.getByRole("button", { name: "Озвучить ответ D" }));
    expect(mocks.speak.mock.calls[0]?.[0]).toMatchObject({ rate: 0.55 });
  });

  it("shows the shared browser guidance when chat speech is unavailable", () => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    render(<DChat/>);
    fireEvent.click(screen.getByRole("button", { name: "Открыть чат с D" }));
    fireEvent.click(screen.getByRole("button", { name: "Озвучить ответ D" }));
    expect(mocks.toastError).toHaveBeenCalledWith("Озвучивание недоступно. Открой сайт в Chrome или Safari и проверь звук на устройстве.");
  });
});
