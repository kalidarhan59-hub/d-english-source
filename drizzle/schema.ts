import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Внутренний технический идентификатор учётной записи. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  username: varchar("username", { length: 32 }).unique(),
  passwordHash: varchar("passwordHash", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const learningProfiles = mysqlTable("learning_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  currentLevel: varchar("currentLevel", { length: 2 }).notNull().default("A0"),
  xp: int("xp").notNull().default(0),
  streak: int("streak").notNull().default(0),
  completedLessons: int("completedLessons").notNull().default(0),
  lastActiveAt: timestamp("lastActiveAt"),
  mascotStage: varchar("mascotStage", { length: 2 }).notNull().default("A0"),
  interfaceTheme: mysqlEnum("interfaceTheme", ["light", "dark", "system"]).notNull().default("system"),
  diagnosticComplete: int("diagnosticComplete").notNull().default(0),
  diagnosticLevel: varchar("diagnosticLevel", { length: 2 }).notNull().default("A0"),
  diagnosticScore: int("diagnosticScore").notNull().default(0),
  learningTrack: varchar("learningTrack", { length: 32 }).notNull().default("academic"),
  careerTrack: varchar("careerTrack", { length: 100 }).notNull().default("engineering"),
  academicStartedAt: timestamp("academicStartedAt"),
  dailyTaskCount: int("dailyTaskCount").notNull().default(0),
  dailyTaskDate: varchar("dailyTaskDate", { length: 10 }),
  promotionReady: int("promotionReady").notNull().default(0),
  ieltsBand: varchar("ieltsBand", { length: 4 }).notNull().default("6.0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const lessonProgress = mysqlTable("lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: varchar("lessonId", { length: 80 }).notNull(),
  score: int("score").notNull().default(0),
  completed: int("completed").notNull().default(0),
  xpAwarded: int("xpAwarded").notNull().default(0),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("lesson_progress_user_lesson_idx").on(table.userId, table.lessonId)]);

export const assessmentAttempts = mysqlTable("assessment_attempts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentType: mysqlEnum("assessmentType", ["diagnostic", "promotion", "ielts"]).notNull(),
  targetLevel: varchar("targetLevel", { length: 2 }).notNull().default("A0"),
  questionsPayload: text("questionsPayload").notNull(),
  score: int("score"),
  passed: int("passed").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export const dailyTasks = mysqlTable("daily_tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskDate: varchar("taskDate", { length: 10 }).notNull(),
  taskKey: varchar("taskKey", { length: 80 }).notNull(),
  taskType: varchar("taskType", { length: 32 }).notNull(),
  level: varchar("level", { length: 8 }).notNull(),
  difficulty: varchar("difficulty", { length: 16 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  prompt: text("prompt").notNull(),
  expectedAnswer: text("expectedAnswer").notNull(),
  completed: int("completed").notNull().default(0),
  score: int("score").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("daily_tasks_user_date_key_idx").on(table.userId, table.taskDate, table.taskKey)]);

export const vocabularyProgress = mysqlTable("vocabulary_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  word: varchar("word", { length: 180 }).notNull(),
  translation: varchar("translation", { length: 240 }).notNull(),
  source: varchar("source", { length: 120 }).notNull(),
  mastery: int("mastery").notNull().default(1),
  lastReviewedAt: timestamp("lastReviewedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [uniqueIndex("vocabulary_progress_user_word_idx").on(table.userId, table.word)]);

export const essayEntries = mysqlTable("essay_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  taskDate: varchar("taskDate", { length: 10 }).notNull(),
  topic: text("topic").notNull(),
  body: text("body"),
  status: mysqlEnum("status", ["new", "draft", "submitted"]).notNull().default("new"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("essay_entries_user_date_idx").on(table.userId, table.taskDate)]);

export const questProgress = mysqlTable("quest_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  questKey: varchar("questKey", { length: 80 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  goal: int("goal").notNull(),
  current: int("current").notNull().default(0),
  completed: int("completed").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => [uniqueIndex("quest_progress_user_key_idx").on(table.userId, table.questKey)]);

export type LearningProfile = typeof learningProfiles.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
