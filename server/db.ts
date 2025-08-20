import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create PostgreSQL connection
const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 1, // Limit connections for development
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

// Create drizzle database instance
export const db = drizzle(sql, { schema });

export const { users, quizzes, quizAttempts, sessions } = schema;