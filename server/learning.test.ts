import { describe, expect, it } from "vitest";
import { canCompleteDailyTask, canOpenPromotionTest, calculateNextStreak, getCompletionUpdate, getLevelFromXp, getLevelProgress, getNextLesson } from "../shared/learning";

describe("learning progression", () => {
  it("maps XP to the standard A0–C2 levels", () => {
    expect(getLevelFromXp(0)).toBe("A0");
    expect(getLevelFromXp(180)).toBe("A1");
    expect(getLevelFromXp(760)).toBe("B1");
    expect(getLevelFromXp(2500)).toBe("C2");
  });

  it("keeps level progress within a readable percentage range", () => {
    expect(getLevelProgress(0, "A0")).toBe(0);
    expect(getLevelProgress(10000, "C2")).toBe(100);
  });

  it("recommends the first available lesson that is not complete", () => {
    expect(getNextLesson([])?.id).toBe("a0-greetings");
    expect(getNextLesson(["a0-greetings"])?.id).toBe("a0-objects");
  });

  it("updates XP, completion count, level and streak only for the first completion", () => {
    const now = new Date("2026-08-18T12:00:00.000Z");
    const update = getCompletionUpdate({ xp: 150, completedLessons: 2, streak: 4, lastActiveAt: new Date("2026-08-17T10:00:00.000Z"), lessonXp: 40, alreadyCompleted: false, now });
    expect(update).toMatchObject({ awardedXp: 40, xp: 190, currentLevel: "A1", completedLessons: 3, streak: 5 });
    expect(getCompletionUpdate({ xp: 190, completedLessons: 3, streak: 5, lastActiveAt: now, lessonXp: 40, alreadyCompleted: true, now })).toMatchObject({ awardedXp: 0, xp: 190, completedLessons: 3, streak: 5 });
  });

  it("resets a missed streak without penalising the lesson completion itself", () => {
    expect(calculateNextStreak(12, new Date("2026-08-14T12:00:00.000Z"), new Date("2026-08-18T12:00:00.000Z"))).toBe(1);
    expect(calculateNextStreak(12, new Date("2026-08-18T01:00:00.000Z"), new Date("2026-08-18T18:00:00.000Z"))).toBe(12);
  });

  it("limits the study day to five tasks and protects level-up tests with multiple requirements", () => {
    expect(canCompleteDailyTask(4)).toBe(true);
    expect(canCompleteDailyTask(5)).toBe(false);
    expect(canOpenPromotionTest({ allPerfect: true, streak: 7, xp: 200, nextLevel: "A1" })).toBe(true);
    expect(canOpenPromotionTest({ allPerfect: true, streak: 2, xp: 200, nextLevel: "A1" })).toBe(false);
    expect(canOpenPromotionTest({ allPerfect: false, streak: 7, xp: 200, nextLevel: "A1" })).toBe(false);
  });
});
