import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from "./db";
import { users, quizAttempts, sessions, quizSubmissions } from "@shared/schema";
import postgres from 'postgres';

export async function migrateDatabase() {
  try {
    // Create tables if they don't exist
    await createTables();
    
    console.log("Database migration completed successfully");
  } catch (error) {
    console.error("Database migration failed:", error);
    console.log("Continuing without migration - tables may already exist");
    // Don't throw error to allow server to continue
  }
}

// Manual migration function for initial setup
export async function createTables() {
  try {
    // Note: In production, you should use proper Drizzle migrations
    // This is for development/testing purposes
    
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }

    // Check if tables already exist first
    const sql = postgres(process.env.DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'quiz_attempts', 'quiz_submissions')
    `;
    
    if (tables.length >= 3) {
      console.log("All tables already exist, skipping creation");
      await sql.end();
      return;
    }
    
    // Enable UUID extension
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT NOT NULL UNIQUE,
        username TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create quiz_attempts table
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        quiz_data JSONB NOT NULL,
        score INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create quiz_submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_submissions (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id),
        quiz_title TEXT NOT NULL,
        subject TEXT NOT NULL,
        chapter TEXT NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER NOT NULL,
        score INTEGER NOT NULL,
        submission_data JSONB NOT NULL,
        submitted_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql.end();
    console.log("Tables created successfully");
  } catch (error) {
    console.error("Table creation failed:", error);
    throw error;
  }
}
