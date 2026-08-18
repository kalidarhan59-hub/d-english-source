import { describe, expect, it } from "vitest";
import { createAssessment, getAdaptiveNextQuestion, mapScoreToLevel, normalizeAnswer } from "../shared/assessment";

describe("adaptive assessment", () => {
  it("creates a fresh mixed-skill assessment from the internal bank", () => {
    const questions = createAssessment("student-a-2026-08-18", "A2", 8);
    expect(questions).toHaveLength(8);
    expect(new Set(questions.map((question) => question.skill)).size).toBeGreaterThanOrEqual(4);
    expect(questions.some((question) => question.difficulty === "foundation")).toBe(true);
    expect(questions.some((question) => question.difficulty === "stretch")).toBe(true);
  });

  it("maps the score to a level and compares answers without punctuation noise", () => {
    expect(mapScoreToLevel(20)).toBe("A0");
    expect(mapScoreToLevel(57)).toBe("A2");
    expect(mapScoreToLevel(90)).toBe("B2");
    expect(normalizeAnswer("I study English every morning!")).toBe(normalizeAnswer("i study English every morning"));
  });

  it("moves to a stretch question after a correct answer and returns to a foundation check after an error", () => {
    const questions = createAssessment("adaptive-student", "A1", 8);
    const first = questions[0];
    const afterCorrect = getAdaptiveNextQuestion(questions, [first.id], true);
    const afterError = getAdaptiveNextQuestion(questions, [first.id], false);
    expect(afterCorrect?.difficulty).toBe("stretch");
    expect(afterError?.difficulty).toBe("foundation");
  });
});
