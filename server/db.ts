import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, learningProfiles, lessonProgress, users } from "../drizzle/schema";
import { ENV } from './_core/env';
import { getCompletionUpdate, lessons } from "../shared/learning";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function ensureLearningProfile(userId: number, createIfMissing = false) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(learningProfiles).where(eq(learningProfiles.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  if (!createIfMissing) return undefined;
  await db.insert(learningProfiles).values({ userId, streak: 1, lastActiveAt: new Date() });
  const created = await db.select().from(learningProfiles).where(eq(learningProfiles.userId, userId)).limit(1);
  return created[0];
}

export async function getLearningProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const existing = await db.select().from(learningProfiles).where(eq(learningProfiles.userId, userId)).limit(1);
  return existing[0];
}

export async function getLearningSummary(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const profile = await ensureLearningProfile(userId);
  if (!profile) return undefined;
  const progress = await db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)).orderBy(desc(lessonProgress.updatedAt));
  return { profile, progress };
}

type CompletionProfile = {
  xp: number;
  completedLessons: number;
  streak: number;
  lastActiveAt: Date | null;
};

type CompletionPrevious = { completed: number; xpAwarded: number } | undefined;

export type LessonCompletionStore = {
  profile: CompletionProfile;
  getPrevious: () => Promise<CompletionPrevious>;
  saveProgress: (data: { score: number; xpAwarded: number; completedAt: Date }) => Promise<void>;
  saveProfile: (data: { xp: number; currentLevel: string; mascotStage: string; completedLessons: number; streak: number; lastActiveAt: Date }) => Promise<void>;
};

export async function completeLessonWithStore(input: { lessonId: string; score: number }, store: LessonCompletionStore) {
  const lesson = lessons.find((item) => item.id === input.lessonId);
  if (!lesson) throw new Error("Unknown lesson");
  const previous = await store.getPrevious();
  const alreadyCompleted = previous?.completed === 1;
  const now = new Date();
  const update = getCompletionUpdate({
    xp: store.profile.xp,
    completedLessons: store.profile.completedLessons,
    streak: store.profile.streak,
    lastActiveAt: store.profile.lastActiveAt,
    lessonXp: lesson.xp,
    alreadyCompleted,
    now,
  });

  await store.saveProgress({
    score: input.score,
    xpAwarded: previous ? previous.xpAwarded : update.awardedXp,
    completedAt: now,
  });

  await store.saveProfile({
    xp: update.xp,
    currentLevel: update.currentLevel,
    mascotStage: update.currentLevel,
    completedLessons: update.completedLessons,
    streak: update.streak,
    lastActiveAt: now,
  });
  return update;
}

export async function completeLessonForUser(input: { userId: number; lessonId: string; score: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const profile = await ensureLearningProfile(input.userId);
  if (!profile) throw new Error("Learning profile unavailable");
  return completeLessonWithStore({ lessonId: input.lessonId, score: input.score }, {
    profile,
    getPrevious: async () => {
      const previous = await db.select().from(lessonProgress).where(and(eq(lessonProgress.userId, input.userId), eq(lessonProgress.lessonId, input.lessonId))).limit(1);
      return previous[0];
    },
    saveProgress: async ({ score, xpAwarded, completedAt }) => {
      await db.insert(lessonProgress).values({ userId: input.userId, lessonId: input.lessonId, score, completed: 1, xpAwarded, completedAt }).onDuplicateKeyUpdate({ set: { score, completed: 1, completedAt } });
    },
    saveProfile: async (data) => {
      await db.update(learningProfiles).set(data).where(eq(learningProfiles.userId, input.userId));
    },
  });
}
