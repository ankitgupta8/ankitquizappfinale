import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupSupabaseAuth, verifySupabaseToken } from "./supabase-auth";
import { storage } from "./storage";
import { quizSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  setupSupabaseAuth(app);

  // Create a new quiz
  app.post("/api/quizzes", verifySupabaseToken, async (req, res) => {
    try {
      const { title, description, subject, quizData } = req.body;
      const validatedQuizData = quizSchema.parse(quizData);

      const quiz = await storage.createQuiz({
        title,
        description,
        subject,
        quizData: validatedQuizData,
        createdBy: req.user!.id
      });

      res.status(201).json(quiz);
    } catch (error) {
      console.error('Quiz creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Invalid quiz data format",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Server error" });
      }
    }
  });

  // Get all available quizzes (public endpoint - no auth required)
  app.get("/api/quizzes", async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get a specific quiz
  app.get("/api/quizzes/:id", verifySupabaseToken, async (req, res) => {
    try {
      const quizId = parseInt(req.params.id);
      const quiz = await storage.getQuiz(quizId);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      res.json(quiz);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Submit a quiz attempt
  app.post("/api/quiz-attempts", verifySupabaseToken, async (req, res) => {
    try {
      const { quizId, score } = req.body;
      
      // Get the quiz to store its data snapshot
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }

      const attempt = await storage.createQuizAttempt({
        userId: req.user!.id,
        quizId,
        quizData: quiz.quizData as any,
        score
      });

      res.status(201).json(attempt);
    } catch (error) {
      console.error('Quiz attempt error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's quiz attempts
  app.get("/api/quiz-attempts", verifySupabaseToken, async (req, res) => {
    try {
      const attempts = await storage.getQuizAttempts(req.user!.id);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Submit a quiz with detailed results
  app.post("/api/quiz-submissions", verifySupabaseToken, async (req, res) => {
    try {
      const {
        quizTitle,
        subject,
        chapter,
        totalQuestions,
        correctAnswers,
        score,
        submissionData,
        // Enhanced analytics fields
        totalTimeSpent,
        averageTimePerQuestion,
        difficultyLevel,
        completionPercentage,
        streakCorrect,
        streakIncorrect,
        firstAttemptCorrect,
        questionsSkipped,
        hintsUsed,
        reviewCount,
        confidenceScore,
        learningObjectiveMastery,
        questionAnalytics
      } = req.body;
      
      const submission = await storage.createQuizSubmission({
        userId: req.user!.id,
        quizTitle,
        subject,
        chapter,
        totalQuestions,
        correctAnswers,
        score,
        submissionData,
        // Enhanced analytics fields
        totalTimeSpent,
        averageTimePerQuestion,
        difficultyLevel,
        completionPercentage,
        streakCorrect,
        streakIncorrect,
        firstAttemptCorrect,
        questionsSkipped,
        hintsUsed,
        reviewCount,
        confidenceScore,
        learningObjectiveMastery,
        questionAnalytics
      });

      res.status(201).json(submission);
    } catch (error) {
      console.error('Quiz submission error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's quiz submissions
  app.get("/api/quiz-submissions", verifySupabaseToken, async (req, res) => {
    try {
      const submissions = await storage.getQuizSubmissions(req.user!.id);
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching quiz submissions:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Get a specific quiz submission
  app.get("/api/quiz-submissions/:id", verifySupabaseToken, async (req, res) => {
    try {
      const submissionId = parseInt(req.params.id);
      const submission = await storage.getQuizSubmission(submissionId);
      
      if (!submission) {
        return res.status(404).json({ message: "Quiz submission not found" });
      }
      
      // Ensure user can only access their own submissions
      if (submission.userId !== req.user!.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(submission);
    } catch (error) {
      console.error('Error fetching quiz submission:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
