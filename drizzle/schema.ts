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
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
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

export type LearningProfile = typeof learningProfiles.$inferSelect;
export type LessonProgress = typeof lessonProgress.$inferSelect;
