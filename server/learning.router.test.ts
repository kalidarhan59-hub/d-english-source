import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getLearningSummary: vi.fn(),
  completeLessonForUser: vi.fn(),
}));

import { completeLessonForUser, getLearningSummary } from "./db";
import { appRouter } from "./routers";

function createLearningContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "learning-user",
      email: "learner@example.com",
      name: "Learner",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("learning tRPC procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the persisted profile summary for the signed-in learner", async () => {
    vi.mocked(getLearningSummary).mockResolvedValue({ profile: { xp: 40, currentLevel: "A0", streak: 2, completedLessons: 1 }, progress: [{ lessonId: "a0-greetings", completed: 1 }] } as never);
    const result = await appRouter.createCaller(createLearningContext()).learning.summary();
    expect(getLearningSummary).toHaveBeenCalledWith(42);
    expect(result).toMatchObject({ profile: { xp: 40, completedLessons: 1 }, progress: [{ lessonId: "a0-greetings" }] });
  });

  it("passes first and repeated lesson completions to the persistence layer without changing the learner identity", async () => {
    vi.mocked(completeLessonForUser)
      .mockResolvedValueOnce({ awardedXp: 40, xp: 40, currentLevel: "A0", completedLessons: 1, streak: 1 })
      .mockResolvedValueOnce({ awardedXp: 0, xp: 40, currentLevel: "A0", completedLessons: 1, streak: 1 });
    const caller = appRouter.createCaller(createLearningContext());
    await expect(caller.learning.completeLesson({ lessonId: "a0-greetings", score: 100 })).resolves.toMatchObject({ awardedXp: 40, completedLessons: 1 });
    await expect(caller.learning.completeLesson({ lessonId: "a0-greetings", score: 82 })).resolves.toMatchObject({ awardedXp: 0, completedLessons: 1 });
    expect(completeLessonForUser).toHaveBeenNthCalledWith(1, { userId: 42, lessonId: "a0-greetings", score: 100 });
    expect(completeLessonForUser).toHaveBeenNthCalledWith(2, { userId: 42, lessonId: "a0-greetings", score: 82 });
  });
});
