-- Supabase Database Setup Script
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/tkuzygsytmtdktffeqik/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (this will sync with Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  quiz_data JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active INTEGER DEFAULT 1
);

-- Create quiz_attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id),
  quiz_data JSONB NOT NULL,
  score INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Create quiz_submissions table
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
  submitted_at TIMESTAMP DEFAULT NOW(),
  -- Additional analytical fields
  total_time_spent INTEGER, -- Total time spent on quiz in seconds
  average_time_per_question DECIMAL(10,2), -- Average time per question in seconds
  difficulty_level TEXT DEFAULT 'medium', -- easy, medium, hard
  completion_percentage DECIMAL(5,2) DEFAULT 100.00, -- Percentage of questions attempted
  streak_correct INTEGER DEFAULT 0, -- Longest streak of correct answers
  streak_incorrect INTEGER DEFAULT 0, -- Longest streak of incorrect answers
  first_attempt_correct INTEGER DEFAULT 0, -- Questions answered correctly on first attempt
  questions_skipped INTEGER DEFAULT 0, -- Number of questions skipped
  hints_used INTEGER DEFAULT 0, -- Number of hints used (if applicable)
  review_count INTEGER DEFAULT 0, -- Number of times answers were reviewed
  confidence_score DECIMAL(5,2), -- Average confidence level (1-5 scale)
  learning_objective_mastery JSONB, -- Mastery level for different learning objectives
  question_analytics JSONB -- Detailed per-question analytics
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for quizzes
CREATE POLICY "Anyone can view active quizzes" ON quizzes
  FOR SELECT USING (is_active = 1);

CREATE POLICY "Users can create quizzes" ON quizzes
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own quizzes" ON quizzes
  FOR UPDATE USING (auth.uid() = created_by);

-- Create RLS policies for quiz_attempts
CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz attempts" ON quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for quiz_submissions
CREATE POLICY "Users can view own quiz submissions" ON quiz_submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz submissions" ON quiz_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.quizzes TO anon, authenticated;
GRANT ALL ON public.quiz_attempts TO anon, authenticated;
GRANT ALL ON public.quiz_submissions TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;