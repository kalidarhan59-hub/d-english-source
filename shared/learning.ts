export type LevelCode = "A0" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export type Lesson = {
  id: string;
  level: LevelCode;
  title: string;
  subtitle: string;
  skill: "Reading" | "Vocabulary" | "Grammar" | "Listening";
  duration: number;
  xp: number;
  available: boolean;
};

export const levelMeta: Record<LevelCode, { name: string; description: string; threshold: number; color: string }> = {
  A0: { name: "Start", description: "Первые слова и уверенные шаги", threshold: 0, color: "#f5c400" },
  A1: { name: "Explorer", description: "Повседневные ситуации", threshold: 180, color: "#e8a800" },
  A2: { name: "Connector", description: "Уверенная база для общения", threshold: 420, color: "#d28f00" },
  B1: { name: "Speaker", description: "Самостоятельные диалоги", threshold: 760, color: "#b77900" },
  B2: { name: "Navigator", description: "Точные мысли и аргументы", threshold: 1180, color: "#8e6500" },
  C1: { name: "Strategist", description: "Продвинутая речь", threshold: 1700, color: "#6c4f00" },
  C2: { name: "Master", description: "Языковая гибкость", threshold: 2300, color: "#422f00" },
};

export const levels: LevelCode[] = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];

export const lessons: Lesson[] = [
  { id: "a0-greetings", level: "A0", title: "Hello, I’m here", subtitle: "Поздоровайся и представься", skill: "Vocabulary", duration: 8, xp: 40, available: true },
  { id: "a0-objects", level: "A0", title: "Things around you", subtitle: "Назови предметы вокруг", skill: "Reading", duration: 7, xp: 35, available: true },
  { id: "a1-daily-routine", level: "A1", title: "A day that works", subtitle: "Расскажи о своём дне", skill: "Grammar", duration: 10, xp: 55, available: true },
  { id: "a1-city-sounds", level: "A1", title: "City sounds", subtitle: "Пойми короткий диалог", skill: "Listening", duration: 9, xp: 55, available: false },
  { id: "a2-travel-plans", level: "A2", title: "Ready to travel", subtitle: "Составь план поездки", skill: "Grammar", duration: 12, xp: 70, available: false },
  { id: "a2-health", level: "A2", title: "Feel better", subtitle: "Объясни, что случилось", skill: "Vocabulary", duration: 11, xp: 65, available: false },
  { id: "b1-opinions", level: "B1", title: "Make your point", subtitle: "Вырази мнение уверенно", skill: "Reading", duration: 14, xp: 85, available: false },
  { id: "b2-arguments", level: "B2", title: "Build an argument", subtitle: "Подкрепи идею примерами", skill: "Listening", duration: 15, xp: 95, available: false },
  { id: "c1-precision", level: "C1", title: "Speak with precision", subtitle: "Работай с оттенками смысла", skill: "Grammar", duration: 16, xp: 110, available: false },
  { id: "c2-rhetoric", level: "C2", title: "Rhetoric in motion", subtitle: "Выбирай точные формулировки", skill: "Reading", duration: 18, xp: 130, available: false },
];

export const getLevelFromXp = (xp: number): LevelCode => {
  return levels.reduce<LevelCode>((current, level) => (xp >= levelMeta[level].threshold ? level : current), "A0");
};

export const getNextLesson = (completedLessonIds: string[]) =>
  lessons.find((lesson) => lesson.available && !completedLessonIds.includes(lesson.id)) ?? lessons[0];

export const getLevelProgress = (xp: number, level: LevelCode) => {
  const currentIndex = levels.indexOf(level);
  const nextLevel = levels[currentIndex + 1];
  if (!nextLevel) return 100;
  const currentThreshold = levelMeta[level].threshold;
  const nextThreshold = levelMeta[nextLevel].threshold;
  return Math.min(100, Math.max(0, Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)));
};

export const calculateNextStreak = (currentStreak: number, lastActiveAt: Date | null, now: Date) => {
  if (!lastActiveAt) return 1;
  const lastDay = Date.UTC(lastActiveAt.getUTCFullYear(), lastActiveAt.getUTCMonth(), lastActiveAt.getUTCDate());
  const currentDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const difference = Math.round((currentDay - lastDay) / 86_400_000);
  if (difference <= 0) return Math.max(1, currentStreak);
  return difference === 1 ? Math.max(1, currentStreak) + 1 : 1;
};

export const getCompletionUpdate = (input: {
  xp: number;
  completedLessons: number;
  streak: number;
  lastActiveAt: Date | null;
  lessonXp: number;
  alreadyCompleted: boolean;
  now: Date;
}) => {
  const awardedXp = input.alreadyCompleted ? 0 : input.lessonXp;
  const xp = input.xp + awardedXp;
  return {
    awardedXp,
    xp,
    currentLevel: getLevelFromXp(xp),
    completedLessons: input.completedLessons + (input.alreadyCompleted ? 0 : 1),
    streak: calculateNextStreak(input.streak, input.lastActiveAt, input.now),
  };
};
