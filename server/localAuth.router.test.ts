import { describe, expect, it } from "vitest";
import { createAuthRouter, type LocalAuthDependencies } from "./routers";
import type { TrpcContext } from "./_core/context";
import { clearLocalSession, LOCAL_SESSION_COOKIE, setLocalSession } from "./localAuth";
import { completeLessonWithStore, type LessonCompletionStore } from "./db";

function createTestAuth() {
  const users = new Map<string, { id: number; username: string; name: string; passwordHash: string }>();
  const cookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const cleared: Array<{ name: string; options: Record<string, unknown> }> = [];
  let id = 1;
  const deps: LocalAuthDependencies = {
    findByUsername: async (username) => users.get(username),
    create: async (input) => {
      const user = { id: id++, username: input.username, name: input.username, passwordHash: input.passwordHash };
      users.set(input.username, user);
      return user as Awaited<ReturnType<LocalAuthDependencies["create"]>>;
    },
    setSession: async (ctx, userId) => setLocalSession(ctx.req, ctx.res, userId),
    clearSession: (ctx) => clearLocalSession(ctx.req, ctx.res),
  };
  const ctx: TrpcContext = {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => cookies.push({ name, value, options }),
      clearCookie: (name: string, options: Record<string, unknown>) => cleared.push({ name, options }),
    } as TrpcContext["res"],
  };
  return { caller: createAuthRouter(deps).createCaller(ctx), cookies, cleared };
}

describe("local auth router", () => {
  it("registers, writes a local cookie, clears it and logs back into the same account", async () => {
    const auth = createTestAuth();
    const registered = await auth.caller.register({ username: "ProgressUser", email: "progress@example.com", password: "Strong-password-2026", confirmPassword: "Strong-password-2026" });
    await auth.caller.logout();
    const loggedIn = await auth.caller.login({ username: "progressuser", password: "Strong-password-2026" });

    expect(auth.cookies).toHaveLength(2);
    expect(auth.cookies.every((cookie) => cookie.name === LOCAL_SESSION_COOKIE && cookie.value.startsWith("ey") && cookie.options.httpOnly === true)).toBe(true);
    expect(auth.cleared[0]?.name).toBe(LOCAL_SESSION_COOKIE);
    expect(loggedIn.id).toBe(registered.id);
  });

  it("keeps real lesson-completion state tied to the same account after logout and login", async () => {
    const auth = createTestAuth();
    const registered = await auth.caller.register({ username: "learner", email: "learner@example.com", password: "Strong-password-2026", confirmPassword: "Strong-password-2026" });
    const profile = { xp: 0, completedLessons: 0, streak: 0, lastActiveAt: null as Date | null, currentLevel: "A0", mascotStage: "A0" };
    let storedProgress: { completed: number; xpAwarded: number } | undefined;
    const store: LessonCompletionStore = {
      profile,
      getPrevious: async () => storedProgress,
      saveProgress: async (data) => { storedProgress = { completed: 1, xpAwarded: data.xpAwarded }; },
      saveProfile: async (data) => { Object.assign(profile, data); },
    };
    await completeLessonWithStore({ lessonId: "a0-greetings", score: 100 }, store);
    await auth.caller.logout();
    const loggedIn = await auth.caller.login({ username: "LEARNER", password: "Strong-password-2026" });

    expect(loggedIn.id).toBe(registered.id);
    expect(profile).toMatchObject({ xp: 40, completedLessons: 1 });
    expect(storedProgress).toEqual({ completed: 1, xpAwarded: 40 });
  });

  it("returns the appropriate auth errors for a duplicate login and a wrong password", async () => {
    const auth = createTestAuth();
    await auth.caller.register({ username: "student", email: "student@example.com", password: "Strong-password-2026", confirmPassword: "Strong-password-2026" });
    await expect(auth.caller.register({ username: "STUDENT", email: "other@example.com", password: "Strong-password-2026", confirmPassword: "Strong-password-2026" })).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(auth.caller.login({ username: "student", password: "wrong-password" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
