import { describe, expect, it } from "vitest";
import { completeLessonWithStore } from "./db";

describe("completeLessonWithStore", () => {
  it("persists first completion rewards and prevents a repeated XP award", async () => {
    const profile = { xp: 0, completedLessons: 0, streak: 0, lastActiveAt: null as Date | null };
    let previous: { completed: number; xpAwarded: number } | undefined;
    const savedProgress: Array<{ score: number; xpAwarded: number }> = [];
    const savedProfiles: Array<{ xp: number; completedLessons: number; streak: number }> = [];
    const store = {
      profile,
      getPrevious: async () => previous,
      saveProgress: async (data: { score: number; xpAwarded: number; completedAt: Date }) => {
        savedProgress.push(data);
        previous = { completed: 1, xpAwarded: data.xpAwarded };
      },
      saveProfile: async (data: { xp: number; currentLevel: string; mascotStage: string; completedLessons: number; streak: number; lastActiveAt: Date }) => {
        profile.xp = data.xp;
        profile.completedLessons = data.completedLessons;
        profile.streak = data.streak;
        profile.lastActiveAt = data.lastActiveAt;
        savedProfiles.push(data);
      },
    };

    await expect(completeLessonWithStore({ lessonId: "a0-greetings", score: 100 }, store)).resolves.toMatchObject({ awardedXp: 40, xp: 40, completedLessons: 1, streak: 1 });
    await expect(completeLessonWithStore({ lessonId: "a0-greetings", score: 80 }, store)).resolves.toMatchObject({ awardedXp: 0, xp: 40, completedLessons: 1, streak: 1 });
    expect(savedProgress).toEqual([{ score: 100, xpAwarded: 40, completedAt: expect.any(Date) }, { score: 80, xpAwarded: 40, completedAt: expect.any(Date) }]);
    expect(savedProfiles).toHaveLength(2);
    expect(profile).toMatchObject({ xp: 40, completedLessons: 1, streak: 1 });
  });
});
