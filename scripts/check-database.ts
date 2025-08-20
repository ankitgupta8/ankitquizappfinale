import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

async function checkDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    console.log('Checking database structure...');
    
    // Check if tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('Tables:', tables.map(t => t.table_name));
    
    // Check quizzes table structure
    const quizzesColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quizzes' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Quizzes table columns:', quizzesColumns);
    
    // Check quiz_attempts table structure
    const attemptsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'quiz_attempts' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Quiz attempts table columns:', attemptsColumns);
    
    // Check if there are any quizzes
    const quizCount = await sql`SELECT COUNT(*) as count FROM quizzes`;
    console.log('Number of quizzes:', quizCount[0].count);
    
  } catch (error) {
    console.error('Database check failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

checkDatabase().catch(console.error);