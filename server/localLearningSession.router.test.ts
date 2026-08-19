import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const user = {
  id: 91,
  openId: "local-test-user",
  name: "sessionstudent",
  email: "session@example.com",
  loginMethod: "local",
  username: "sessionstudent",
  passwordHash: null,
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

let profile = { xp: 0, currentLevel: "A0", streak: 0, completedLessons: 0 };
let progress: Array<{ lessonId: string; completed: number; score: number }> = [];

vi.mock("./db", () => ({
  getUserByUsername: vi.fn(),
  createLocalUser: vi.fn(),
  completeLessonForUser: vi.fn(),
  getLearningSummary: vi.fn(),
}));

import { createLocalUser, completeLessonForUser, getLearningSummary, getUserByUsername } from "./db";
import { appRouter } from "./routers";

function context(currentUser: TrpcContext["user"]): TrpcContext {
  return {
    user: currentUser,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as TrpcContext["res"],
  };
}

describe("local session learning router flow", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "router-session-test-secret";
    profile = { xp: 0, currentLevel: "A0", streak: 0, completedLessons: 0 };
    progress = [];
    vi.mocked(createLocalUser).mockImplementation(async (input) => {
      user.passwordHash = input.passwordHash;
      return user as never;
    });
    vi.mocked(getUserByUsername).mockResolvedValueOnce(undefined).mockResolvedValue(user as never);
    vi.mocked(completeLessonForUser).mockImplementation(async ({ lessonId, score }) => {
      profile = { xp: profile.xp + 40, currentLevel: "A0", streak: 1, completedLessons: profile.completedLessons + 1 };
      progress = [{ lessonId, completed: 1, score }];
      return { awardedXp: 40, ...profile } as never;
    });
    vi.mocked(getLearningSummary).mockImplementation(async () => ({ profile, progress }) as never);
  });

  it("reads the same persisted learning progress through appRouter after logout and repeat local login", async () => {
    const anonymousCaller = appRouter.createCaller(context(null));
    const registered = await anonymousCaller.auth.register({ username: "sessionstudent", email: "session@example.com", password: "Strong-password-2026", confirmPassword: "Strong-password-2026" });
    const firstSession = appRouter.createCaller(context({ ...user, id: registered.id }));
    await firstSession.learning.completeLesson({ lessonId: "a0-greetings", score: 100 });
    await anonymousCaller.auth.logout();
    const relogged = await anonymousCaller.auth.login({ username: "SESSIONSTUDENT", password: "Strong-password-2026" });
    const secondSession = appRouter.createCaller(context({ ...user, id: relogged.id }));
    const summary = await secondSession.learning.summary();

    expect(relogged.id).toBe(registered.id);
    expect(completeLessonForUser).toHaveBeenCalledWith({ userId: registered.id, lessonId: "a0-greetings", score: 100 });
    expect(getLearningSummary).toHaveBeenCalledWith(relogged.id);
    expect(summary).toMatchObject({ profile: { xp: 40, completedLessons: 1, streak: 1 }, progress: [{ lessonId: "a0-greetings", completed: 1, score: 100 }] });
  });
});
