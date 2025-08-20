import { User, InsertUser, CreateUser, QuizAttempt, InsertQuizAttempt, QuizRecord, InsertQuiz, QuizSubmission, InsertQuizSubmission } from "@shared/schema";
import { supabaseAdmin } from "./supabase";
import postgres from 'postgres';

// Create a shared database connection
let sharedSql: postgres.Sql | null = null;

function getDbConnection(): postgres.Sql {
  if (!sharedSql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    sharedSql = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
      max: 1,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    });
  }
  return sharedSql;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createUserWithoutId(user: CreateUser): Promise<User>;
  createQuiz(quiz: InsertQuiz): Promise<QuizRecord>;
  getQuizzes(): Promise<QuizRecord[]>;
  getQuiz(id: number): Promise<QuizRecord | undefined>;
  deleteQuiz(id: number, userId: string): Promise<boolean>;
  createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt>;
  getQuizAttempts(userId: string): Promise<QuizAttempt[]>;
  createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission>;
  getQuizSubmissions(userId: string): Promise<QuizSubmission[]>;
  getQuizSubmission(id: number): Promise<QuizSubmission | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const sql = getDbConnection();
      const [user] = await sql`
        SELECT * FROM users WHERE id = ${id}
      `;
      return user as User;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const sql = getDbConnection();
      const [user] = await sql`
        SELECT * FROM users WHERE email = ${email}
      `;
      return user as User;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const sql = getDbConnection();
      const username = insertUser.username || null;
      const userId = insertUser.id;
      if (!userId) {
        throw new Error("User ID is required");
      }
      const [user] = await sql`
        INSERT INTO users (id, email, username, created_at, updated_at)
        VALUES (${userId}, ${insertUser.email}, ${username}, NOW(), NOW())
        RETURNING *
      `;
      return user as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async createUserWithoutId(insertUser: CreateUser): Promise<User> {
    try {
      const sql = getDbConnection();
      const username = insertUser.username || null;
      const [user] = await sql`
        INSERT INTO users (email, username, created_at, updated_at)
        VALUES (${insertUser.email}, ${username}, NOW(), NOW())
        RETURNING *
      `;
      return user as User;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async createQuiz(quiz: InsertQuiz): Promise<QuizRecord> {
    try {
      const sql = getDbConnection();
      const [createdQuiz] = await sql`
        INSERT INTO quizzes (title, description, subject, quiz_data, created_by, created_at, updated_at, is_active)
        VALUES (${quiz.title}, ${quiz.description || null}, ${quiz.subject}, ${JSON.stringify(quiz.quizData)}, ${quiz.createdBy}, NOW(), NOW(), 1)
        RETURNING *
      `;
      return createdQuiz as QuizRecord;
    } catch (error) {
      console.error("Error creating quiz:", error);
      throw error;
    }
  }

  async getQuizzes(): Promise<QuizRecord[]> {
    try {
      const sql = getDbConnection();
      const quizzes = await sql`
        SELECT * FROM quizzes
        WHERE is_active = 1
        ORDER BY created_at DESC
      `;
      return quizzes.map(quiz => ({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        subject: quiz.subject,
        quizData: quiz.quiz_data,
        createdBy: quiz.created_by,
        createdAt: quiz.created_at,
        updatedAt: quiz.updated_at,
        isActive: quiz.is_active
      })) as QuizRecord[];
    } catch (error) {
      console.error("Error getting quizzes:", error);
      return [];
    }
  }

  async getQuiz(id: number): Promise<QuizRecord | undefined> {
    try {
      const sql = getDbConnection();
      const [quiz] = await sql`
        SELECT * FROM quizzes
        WHERE id = ${id} AND is_active = 1
      `;
      if (!quiz) return undefined;
      
      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        subject: quiz.subject,
        quizData: quiz.quiz_data,
        createdBy: quiz.created_by,
        createdAt: quiz.created_at,
        updatedAt: quiz.updated_at,
        isActive: quiz.is_active
      } as QuizRecord;
    } catch (error) {
      console.error("Error getting quiz:", error);
      return undefined;
    }
  }

  async deleteQuiz(id: number, userId: string): Promise<boolean> {
    try {
      const sql = getDbConnection();
      
      // Check if the quiz exists (no creator restriction)
      const [quiz] = await sql`
        SELECT * FROM quizzes
        WHERE id = ${id} AND is_active = 1
      `;
      
      if (!quiz) {
        return false; // Quiz not found
      }
      
      // Soft delete by setting is_active to 0 (no creator restriction)
      const result = await sql`
        UPDATE quizzes
        SET is_active = 0, updated_at = NOW()
        WHERE id = ${id}
      `;
      
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting quiz:", error);
      return false;
    }
  }

  async createQuizAttempt(attempt: InsertQuizAttempt): Promise<QuizAttempt> {
    try {
      const sql = getDbConnection();
      // Ensure the quiz data is properly structured before saving
      const quizData = attempt.quizData;
      const normalizedQuizData = Array.isArray(quizData) ? quizData : [quizData];

      const [quizAttempt] = await sql`
        INSERT INTO quiz_attempts (user_id, quiz_id, quiz_data, score, timestamp)
        VALUES (${attempt.userId}, ${attempt.quizId}, ${JSON.stringify(normalizedQuizData)}, ${attempt.score}, NOW())
        RETURNING *
      `;
      return quizAttempt as QuizAttempt;
    } catch (error) {
      console.error("Error creating quiz attempt:", error);
      throw error;
    }
  }

  async getQuizAttempts(userId: string): Promise<QuizAttempt[]> {
    try {
      const sql = getDbConnection();
      const attempts = await sql`
        SELECT
          qa.*,
          q.title as quiz_title,
          q.subject as quiz_subject
        FROM quiz_attempts qa
        LEFT JOIN quizzes q ON qa.quiz_id = q.id
        WHERE qa.user_id = ${userId}
        ORDER BY qa.timestamp DESC
      `;

      console.log('Raw quiz attempts from DB:', JSON.stringify(attempts.slice(0, 2), null, 2));

      // Ensure each attempt's quiz data is properly structured and include quiz title
      const mappedAttempts = attempts.map(attempt => ({
        id: attempt.id,
        userId: attempt.user_id,
        quizId: attempt.quiz_id,
        quizData: Array.isArray(attempt.quiz_data) ? attempt.quiz_data : [attempt.quiz_data],
        score: attempt.score,
        timestamp: attempt.timestamp,
        quizTitle: attempt.quiz_title,
        quizSubject: attempt.quiz_subject
      })) as any[];

      console.log('Mapped quiz attempts:', JSON.stringify(mappedAttempts.slice(0, 2), null, 2));
      
      return mappedAttempts;
    } catch (error) {
      console.error("Error getting quiz attempts:", error);
      return [];
    }
  }

  async createQuizSubmission(submission: InsertQuizSubmission): Promise<QuizSubmission> {
    try {
      const sql = getDbConnection();
      const [quizSubmission] = await sql`
        INSERT INTO quiz_submissions (
          user_id, quiz_title, subject, chapter, total_questions, correct_answers, score, submission_data, submitted_at,
          total_time_spent, average_time_per_question, difficulty_level, completion_percentage,
          streak_correct, streak_incorrect, first_attempt_correct, questions_skipped,
          hints_used, review_count, confidence_score, learning_objective_mastery, question_analytics
        )
        VALUES (
          ${submission.userId}, ${submission.quizTitle}, ${submission.subject}, ${submission.chapter},
          ${submission.totalQuestions}, ${submission.correctAnswers}, ${submission.score},
          ${JSON.stringify(submission.submissionData)}, NOW(),
          ${(submission as any).totalTimeSpent || null},
          ${(submission as any).averageTimePerQuestion || null},
          ${(submission as any).difficultyLevel || 'medium'},
          ${(submission as any).completionPercentage || 100.00},
          ${(submission as any).streakCorrect || 0},
          ${(submission as any).streakIncorrect || 0},
          ${(submission as any).firstAttemptCorrect || 0},
          ${(submission as any).questionsSkipped || 0},
          ${(submission as any).hintsUsed || 0},
          ${(submission as any).reviewCount || 0},
          ${(submission as any).confidenceScore || null},
          ${JSON.stringify((submission as any).learningObjectiveMastery || {})},
          ${JSON.stringify((submission as any).questionAnalytics || [])}
        )
        RETURNING *
      `;
      return {
        id: quizSubmission.id,
        userId: quizSubmission.user_id,
        quizTitle: quizSubmission.quiz_title,
        subject: quizSubmission.subject,
        chapter: quizSubmission.chapter,
        totalQuestions: quizSubmission.total_questions,
        correctAnswers: quizSubmission.correct_answers,
        score: quizSubmission.score,
        submissionData: quizSubmission.submission_data,
        submittedAt: quizSubmission.submitted_at,
        // Enhanced analytics fields
        totalTimeSpent: quizSubmission.total_time_spent,
        averageTimePerQuestion: quizSubmission.average_time_per_question,
        difficultyLevel: quizSubmission.difficulty_level,
        completionPercentage: quizSubmission.completion_percentage,
        streakCorrect: quizSubmission.streak_correct,
        streakIncorrect: quizSubmission.streak_incorrect,
        firstAttemptCorrect: quizSubmission.first_attempt_correct,
        questionsSkipped: quizSubmission.questions_skipped,
        hintsUsed: quizSubmission.hints_used,
        reviewCount: quizSubmission.review_count,
        confidenceScore: quizSubmission.confidence_score,
        learningObjectiveMastery: quizSubmission.learning_objective_mastery,
        questionAnalytics: quizSubmission.question_analytics
      } as QuizSubmission;
    } catch (error) {
      console.error("Error creating quiz submission:", error);
      throw error;
    }
  }

  async getQuizSubmissions(userId: string): Promise<QuizSubmission[]> {
    try {
      const sql = getDbConnection();
      const submissions = await sql`
        SELECT * FROM quiz_submissions
        WHERE user_id = ${userId}
        ORDER BY submitted_at DESC
      `;
      
      return submissions.map(submission => {
        // Ensure submissionData is properly parsed as an array
        let submissionData = submission.submission_data;
        if (typeof submissionData === 'string') {
          try {
            submissionData = JSON.parse(submissionData);
          } catch (parseError) {
            console.error("Error parsing submission data:", parseError);
            submissionData = [];
          }
        }
        
        // Ensure it's an array
        if (!Array.isArray(submissionData)) {
          submissionData = [];
        }
        
        return {
          id: submission.id,
          userId: submission.user_id,
          quizTitle: submission.quiz_title,
          subject: submission.subject,
          chapter: submission.chapter,
          totalQuestions: submission.total_questions,
          correctAnswers: submission.correct_answers,
          score: submission.score,
          submissionData: submissionData,
          submittedAt: submission.submitted_at,
          // Enhanced analytics fields
          totalTimeSpent: submission.total_time_spent,
          averageTimePerQuestion: submission.average_time_per_question,
          difficultyLevel: submission.difficulty_level,
          completionPercentage: submission.completion_percentage,
          streakCorrect: submission.streak_correct,
          streakIncorrect: submission.streak_incorrect,
          firstAttemptCorrect: submission.first_attempt_correct,
          questionsSkipped: submission.questions_skipped,
          hintsUsed: submission.hints_used,
          reviewCount: submission.review_count,
          confidenceScore: submission.confidence_score,
          learningObjectiveMastery: submission.learning_objective_mastery,
          questionAnalytics: submission.question_analytics
        };
      }) as QuizSubmission[];
    } catch (error) {
      console.error("Error getting quiz submissions:", error);
      return [];
    }
  }

  async getQuizSubmission(id: number): Promise<QuizSubmission | undefined> {
    try {
      const sql = getDbConnection();
      const [submission] = await sql`
        SELECT * FROM quiz_submissions
        WHERE id = ${id}
      `;
      
      if (!submission) return undefined;
      
      // Ensure submissionData is properly parsed as an array
      let submissionData = submission.submission_data;
      if (typeof submissionData === 'string') {
        try {
          submissionData = JSON.parse(submissionData);
        } catch (parseError) {
          console.error("Error parsing submission data:", parseError);
          submissionData = [];
        }
      }
      
      // Ensure it's an array
      if (!Array.isArray(submissionData)) {
        submissionData = [];
      }
      
      return {
        id: submission.id,
        userId: submission.user_id,
        quizTitle: submission.quiz_title,
        subject: submission.subject,
        chapter: submission.chapter,
        totalQuestions: submission.total_questions,
        correctAnswers: submission.correct_answers,
        score: submission.score,
        submissionData: submissionData,
        submittedAt: submission.submitted_at,
        // Enhanced analytics fields
        totalTimeSpent: submission.total_time_spent,
        averageTimePerQuestion: submission.average_time_per_question,
        difficultyLevel: submission.difficulty_level,
        completionPercentage: submission.completion_percentage,
        streakCorrect: submission.streak_correct,
        streakIncorrect: submission.streak_incorrect,
        firstAttemptCorrect: submission.first_attempt_correct,
        questionsSkipped: submission.questions_skipped,
        hintsUsed: submission.hints_used,
        reviewCount: submission.review_count,
        confidenceScore: submission.confidence_score,
        learningObjectiveMastery: submission.learning_objective_mastery,
        questionAnalytics: submission.question_analytics
      } as QuizSubmission;
    } catch (error) {
      console.error("Error getting quiz submission:", error);
      return undefined;
    }
  }

  // Supabase Auth helper methods
  async syncUserFromSupabase(supabaseUser: any): Promise<User> {
    try {
      // Check if user exists in our database
      let user = await this.getUser(supabaseUser.id);
      
      if (!user) {
        // Create user in our database
        user = await this.createUser({
          id: supabaseUser.id,
          email: supabaseUser.email,
          username: supabaseUser.user_metadata?.username || null,
        });
      }
      
      return user;
    } catch (error) {
      console.error("Error syncing user from Supabase:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
