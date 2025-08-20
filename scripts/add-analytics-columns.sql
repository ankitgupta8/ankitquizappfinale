-- Add new analytics columns to quiz_submissions table
ALTER TABLE quiz_submissions 
ADD COLUMN IF NOT EXISTS total_time_spent INTEGER,
ADD COLUMN IF NOT EXISTS average_time_per_question DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS difficulty_level TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS completion_percentage DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS streak_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_incorrect INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_attempt_correct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS questions_skipped INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS learning_objective_mastery JSONB,
ADD COLUMN IF NOT EXISTS question_analytics JSONB;