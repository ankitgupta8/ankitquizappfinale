import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function addTestQuiz() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    console.log('Adding test quiz...');
    
    // First, let's create a test user if it doesn't exist
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'; // UUID format
    
    const existingUser = await sql`
      SELECT id FROM users WHERE id = ${testUserId}
    `;
    
    if (existingUser.length === 0) {
      await sql`
        INSERT INTO users (id, email, username, created_at, updated_at)
        VALUES (${testUserId}, 'test@example.com', 'testuser', NOW(), NOW())
      `;
      console.log('Test user created');
    }
    
    // Create a test quiz
    const testQuizData = {
      subject: "Mathematics",
      chapters: [
        {
          chapterName: "Basic Arithmetic",
          quizQuestions: [
            {
              question: "What is 2 + 2?",
              options: ["3", "4", "5", "6"],
              correctAnswer: "4",
              explanation: "2 + 2 equals 4"
            },
            {
              question: "What is 5 × 3?",
              options: ["12", "15", "18", "20"],
              correctAnswer: "15",
              explanation: "5 × 3 equals 15"
            }
          ]
        }
      ]
    };
    
    const [quiz] = await sql`
      INSERT INTO quizzes (title, description, subject, quiz_data, created_by, created_at, updated_at, is_active)
      VALUES (
        'Basic Math Quiz',
        'A simple quiz to test basic arithmetic skills',
        'Mathematics',
        ${JSON.stringify(testQuizData)},
        ${testUserId},
        NOW(),
        NOW(),
        1
      )
      RETURNING *
    `;
    
    console.log('Test quiz created:', quiz);
    
    // Verify the quiz was created
    const quizCount = await sql`SELECT COUNT(*) as count FROM quizzes`;
    console.log('Total quizzes in database:', quizCount[0].count);
    
  } catch (error) {
    console.error('Failed to add test quiz:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

addTestQuiz().catch(console.error);