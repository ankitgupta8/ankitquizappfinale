import { User, InsertUser, QuizAttempt, InsertQuizAttempt } from "@shared/schema";
import session from "express-session";
import { db, users, quizAttempts } from "./db";
import { eq } from "drizzle-orm";
import { SQLiteStore } from "./session-store";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempts(userId: number): Promise<QuizAttempt[]>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use SQLite store for session storage
    this.sessionStore = new SQLiteStore();
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    // Ensure the quiz data is properly structured before saving
    const quizData = attempt.quizData;
    const normalizedQuizData = Array.isArray(quizData) ? quizData : [quizData];

    const [quizAttempt] = await db
      .insert(quizAttempts)
      .values({
        ...attempt,
        quizData: normalizedQuizData
      })
      .returning();
    return quizAttempt;
  }

  async getQuizAttempts(userId: number): Promise<QuizAttempt[]> {
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(quizAttempts.timestamp);

    // Ensure each attempt's quiz data is properly structured
    return attempts.map(attempt => ({
      ...attempt,
      quizData: Array.isArray(attempt.quizData) ? attempt.quizData : [attempt.quizData]
    }));
  }
}

export const storage = new DatabaseStorage();
