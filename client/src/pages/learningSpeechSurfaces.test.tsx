/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  toastError: vi.fn(),
  location: vi.fn(),
  startAssessment: vi.fn(),
  speechSpeak: vi.fn(),
  speechCancel: vi.fn(),
}));

const workspace = {
  profile: { xp: 0, currentLevel: "A0", streak: 1, completedLessons: 0, diagnosticComplete: 0, promotionReady: 0, ieltsBand: "5.0" },
  tasks: [{ id: 1, title: "Vocabulary: reliable", taskType: "vocabulary", difficulty: "foundation", prompt: "Translate reliable.", expectedAnswer: "reliable", completed: 0 }],
  vocabulary: [{ id: 1, word: "reliable", translation: "надёжный", mastery: 1 }],
  history: [],
  quests: [],
  plan: { phase: "academic", monthsElapsed: 0, ieltsBand: "5.0", modules: [] },
  videos: [],
  essay: { topic: "Write about a reliable colleague.", body: "" },
};

vi.mock("sonner", () => ({ toast: { error: mocks.toastError } }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: true, user: { name: "Learner" } }) }));
vi.mock("@/components/AppShell", () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>, DMark: () => <span>D</span>, StreakPill: () => <span>streak</span> }));
vi.mock("@/components/MascotD", () => ({ MascotD: () => null }));
vi.mock("@/components/LearningState", () => ({ LearningState: ({ title }: { title: string }) => <div>{title}</div> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props}>{children}</button> }));
vi.mock("@/components/ui/input", () => ({ Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props}/> }));
vi.mock("@/components/ui/textarea", () => ({ Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props}/> }));
vi.mock("@/lib/utils", () => ({ cn: (...values: unknown[]) => values.filter(Boolean).join(" ") }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    academy: {
      profileStatus: { useQuery: () => ({ data: { exists: true }, isLoading: false }) },
      workspace: { useQuery: () => ({ data: workspace, isLoading: false, isError: false }) },
      completeTask: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      saveEssay: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      startAssessment: { useMutation: () => ({ mutate: vi.fn(), mutateAsync: mocks.startAssessment, isPending: false }) },
      answerAssessment: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
      submitAssessment: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
    },
    learning: { completeLesson: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } },
    useUtils: () => ({ academy: { workspace: { invalidate: vi.fn() } } }),
  },
}));
vi.mock("wouter", () => ({ Link: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>, useLocation: () => ["/", mocks.location], useRoute: () => [true, { id: "a0-greetings" }] }));
vi.mock("../../../shared/learning", () => ({ lessons: [{ id: "a0-greetings", title: "Hello", level: "A0", xp: 10 }] }));

import Academy from "./Academy";
import Assessment from "./Assessment";
import Lesson from "./Lesson";
import Profile from "./Profile";

class MockUtterance {
  lang = "";
  rate = 0;
  pitch = 0;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public readonly text: string) {}
}

describe("speech controls on learning pages", () => {
  beforeEach(() => {
    Object.assign(globalThis as unknown as Record<string, unknown>, { React, useAuth: () => ({ isAuthenticated: true, user: { name: "Learner" } }) });
    mocks.location.mockReset();
    mocks.toastError.mockReset();
    mocks.speechSpeak.mockReset();
    mocks.speechCancel.mockReset();
    mocks.startAssessment.mockReset();
    mocks.startAssessment.mockResolvedValue({ id: 1, type: "diagnostic", questions: [{ id: "g1", skill: "grammar", difficulty: "foundation", type: "choice", prompt: "Choose the correct sentence.", options: ["She goes to work every day."] }] });
    Object.defineProperty(window, "SpeechSynthesisUtterance", { configurable: true, value: MockUtterance });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: { speak: mocks.speechSpeak, cancel: mocks.speechCancel, getVoices: () => [] } });
  });

  afterEach(() => cleanup());

  it("starts speech from Academy, Lesson, Assessment and Profile controls", async () => {
    render(<Academy/>);
    fireEvent.click(screen.getByText("Vocabulary: reliable"));
    fireEvent.click(screen.getByRole("button", { name: "Озвучить английский текст задания" }));
    expect(mocks.speechSpeak).toHaveBeenCalled();
    cleanup();

    window.localStorage.setItem("d-english-speech-rate", "0.55");
    render(<Lesson/>);
    fireEvent.click(screen.getByRole("button", { name: "Настроить скорость озвучивания" }));
    expect(screen.getByRole("slider", { name: "Скорость озвучивания" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Озвучить вариант Good morning!" }));
    expect(mocks.speechSpeak).toHaveBeenCalledTimes(2);
    expect(mocks.speechSpeak.mock.calls[1]?.[0]).toMatchObject({ rate: 0.55 });
    cleanup();

    render(<Assessment/>);
    fireEvent.click(screen.getByText("Начать оценку"));
    await screen.findByRole("button", { name: "Озвучить вариант She goes to work every day." });
    fireEvent.click(screen.getByRole("button", { name: "Озвучить вариант She goes to work every day." }));
    expect(mocks.speechSpeak).toHaveBeenCalledTimes(3);
    cleanup();

    render(<Profile/>);
    fireEvent.click(screen.getByRole("button", { name: "Озвучить слово reliable" }));
    expect(mocks.speechSpeak).toHaveBeenCalledTimes(4);
  });

  it("shows the speech fallback toast from a real Lesson page when SpeechSynthesis is missing", () => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: undefined });
    render(<Lesson/>);
    fireEvent.click(screen.getByRole("button", { name: "Озвучить вариант Good morning!" }));
    expect(mocks.toastError).toHaveBeenCalledWith("Озвучивание недоступно. Открой сайт в Chrome или Safari и проверь звук на устройстве.");
  });
});
