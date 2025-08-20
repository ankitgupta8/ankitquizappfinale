import 'dotenv/config';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runAnalyticsMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sql = postgres(process.env.DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    max: 1,
  });

  try {
    console.log('Running analytics columns migration...');
    
    // Read the SQL migration file
    const migrationSQL = readFileSync(join(__dirname, 'add-analytics-columns.sql'), 'utf8');
    
    // Execute the migration
    await sql.unsafe(migrationSQL);
    
    console.log('Analytics columns migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

runAnalyticsMigration().catch(console.error);