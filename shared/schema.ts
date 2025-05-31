import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull(),
  expiresAt: integer("expires_at"),
  data: text("data").notNull(),
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  quizData: blob("quiz_data", { mode: "json" }).notNull(),
  score: integer("score").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Single quiz question schema
const quizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string()
});

// Chapter schema
const chapterSchema = z.object({
  chapterName: z.string(),
  quizQuestions: z.array(quizQuestionSchema)
});

// Quiz schema - allows either a single subject or an array of subjects
export const quizSchema = z.union([
  // Single subject format
  z.object({
    subject: z.string(),
    chapters: z.array(chapterSchema)
  }),
  // Array of subjects format
  z.array(z.object({
    subject: z.string(),
    chapters: z.array(chapterSchema)
  }))
]);

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  userId: true,
  quizData: true,
  score: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type Quiz = z.infer<typeof quizSchema>;