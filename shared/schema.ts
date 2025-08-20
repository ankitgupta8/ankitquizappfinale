import { pgTable, text, serial, integer, jsonb, timestamp, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - now integrated with Supabase Auth
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(), // Supabase Auth uses UUID
  email: text("email").notNull().unique(),
  username: text("username").unique(), // Optional username field
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Sessions table - will be removed as Supabase handles sessions
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  expiresAt: timestamp("expires_at"),
  data: text("data").notNull(),
});

// Quizzes table - stores available quizzes that can be taken
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  quizData: jsonb("quiz_data").notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: integer("is_active").default(1), // 1 for active, 0 for inactive
});

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  quizData: jsonb("quiz_data").notNull(), // Store snapshot of quiz at time of attempt
  score: integer("score").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Quiz submissions table - stores detailed results of each quiz submission
export const quizSubmissions = pgTable("quiz_submissions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  quizTitle: text("quiz_title").notNull(),
  subject: text("subject").notNull(),
  chapter: text("chapter").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  score: integer("score").notNull(), // Percentage score
  submissionData: jsonb("submission_data").notNull(), // Detailed question-by-question results
  submittedAt: timestamp("submitted_at").defaultNow(),
  // Enhanced analytics fields
  totalTimeSpent: integer("total_time_spent"), // Total time spent on quiz in seconds
  averageTimePerQuestion: decimal("average_time_per_question", { precision: 10, scale: 2 }), // Average time per question in seconds
  difficultyLevel: text("difficulty_level").default("medium"), // easy, medium, hard
  completionPercentage: decimal("completion_percentage", { precision: 5, scale: 2 }).default("100.00"), // Percentage of questions attempted
  streakCorrect: integer("streak_correct").default(0), // Longest streak of correct answers
  streakIncorrect: integer("streak_incorrect").default(0), // Longest streak of incorrect answers
  firstAttemptCorrect: integer("first_attempt_correct").default(0), // Questions answered correctly on first attempt
  questionsSkipped: integer("questions_skipped").default(0), // Number of questions skipped
  hintsUsed: integer("hints_used").default(0), // Number of hints used (if applicable)
  reviewCount: integer("review_count").default(0), // Number of times answers were reviewed
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }), // Average confidence level (1-5 scale)
  learningObjectiveMastery: jsonb("learning_objective_mastery"), // Mastery level for different learning objectives
  questionAnalytics: jsonb("question_analytics"), // Detailed per-question analytics
});

export const insertUserSchema = createInsertSchema(users);

// For creating users without specifying ID (Supabase will provide it)
export const createUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertQuizSchema = createInsertSchema(quizzes).pick({
  title: true,
  description: true,
  subject: true,
  quizData: true,
  createdBy: true,
});

export const insertQuizAttemptSchema = createInsertSchema(quizAttempts).pick({
  userId: true,
  quizId: true,
  quizData: true,
  score: true,
});

export const insertQuizSubmissionSchema = createInsertSchema(quizSubmissions).pick({
  userId: true,
  quizTitle: true,
  subject: true,
  chapter: true,
  totalQuestions: true,
  correctAnswers: true,
  score: true,
  submissionData: true,
  // Enhanced analytics fields
  totalTimeSpent: true,
  averageTimePerQuestion: true,
  difficultyLevel: true,
  completionPercentage: true,
  streakCorrect: true,
  streakIncorrect: true,
  firstAttemptCorrect: true,
  questionsSkipped: true,
  hintsUsed: true,
  reviewCount: true,
  confidenceScore: true,
  learningObjectiveMastery: true,
  questionAnalytics: true,
});

// Auth schemas for Supabase integration
export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type QuizRecord = typeof quizzes.$inferSelect;
export type InsertQuizAttempt = z.infer<typeof insertQuizAttemptSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertQuizSubmission = z.infer<typeof insertQuizSubmissionSchema>;
export type QuizSubmission = typeof quizSubmissions.$inferSelect;
export type Quiz = z.infer<typeof quizSchema>;
export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;