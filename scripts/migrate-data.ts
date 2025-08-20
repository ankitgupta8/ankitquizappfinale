import Database from 'better-sqlite3';
import { db as pgDb } from '../server/db';
import { users, quizAttempts } from '../shared/schema';
import { supabaseAdmin } from '../server/supabase';

interface SQLiteUser {
  id: number;
  username: string;
  password: string;
}

interface SQLiteQuizAttempt {
  id: number;
  user_id: number;
  quiz_data: string;
  score: number;
  timestamp: string;
}

async function migrateData() {
  console.log('Starting data migration from SQLite to Supabase...');

  // Open SQLite database
  const sqlite = new Database('sqlite.db');

  try {
    // Get all users from SQLite
    const sqliteUsers = sqlite.prepare('SELECT * FROM users').all() as SQLiteUser[];
    console.log(`Found ${sqliteUsers.length} users to migrate`);

    // User mapping for quiz attempts
    const userIdMapping: Record<number, string> = {};

    // Migrate users
    for (const sqliteUser of sqliteUsers) {
      try {
        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: `${sqliteUser.username}@migrated.local`, // Temporary email
          password: 'TempPassword123!', // Temporary password - users will need to reset
          user_metadata: {
            username: sqliteUser.username,
            migrated: true,
          },
          email_confirm: true, // Skip email confirmation for migrated users
        });

        if (authError) {
          console.error(`Failed to create auth user for ${sqliteUser.username}:`, authError);
          continue;
        }

        if (!authUser.user) {
          console.error(`No user returned for ${sqliteUser.username}`);
          continue;
        }

        // Create user in our database
        await pgDb.insert(users).values({
          id: authUser.user.id,
          email: `${sqliteUser.username}@migrated.local`,
          username: sqliteUser.username,
        });

        userIdMapping[sqliteUser.id] = authUser.user.id;
        console.log(`Migrated user: ${sqliteUser.username} -> ${authUser.user.id}`);
      } catch (error) {
        console.error(`Error migrating user ${sqliteUser.username}:`, error);
      }
    }

    // Get all quiz attempts from SQLite
    const sqliteQuizAttempts = sqlite.prepare('SELECT * FROM quiz_attempts').all() as SQLiteQuizAttempt[];
    console.log(`Found ${sqliteQuizAttempts.length} quiz attempts to migrate`);

    // Migrate quiz attempts
    for (const attempt of sqliteQuizAttempts) {
      try {
        const newUserId = userIdMapping[attempt.user_id];
        if (!newUserId) {
          console.warn(`Skipping quiz attempt ${attempt.id} - user not found`);
          continue;
        }

        // Parse quiz data
        let quizData;
        try {
          quizData = JSON.parse(attempt.quiz_data);
        } catch (error) {
          console.error(`Invalid quiz data for attempt ${attempt.id}:`, error);
          continue;
        }

        await pgDb.insert(quizAttempts).values({
          userId: newUserId,
          quizData: quizData,
          score: attempt.score,
          timestamp: new Date(attempt.timestamp),
        });

        console.log(`Migrated quiz attempt ${attempt.id} for user ${newUserId}`);
      } catch (error) {
        console.error(`Error migrating quiz attempt ${attempt.id}:`, error);
      }
    }

    console.log('Data migration completed successfully!');
    console.log('\nIMPORTANT NOTES:');
    console.log('1. All users have been created with temporary emails (@migrated.local)');
    console.log('2. All users have the temporary password: TempPassword123!');
    console.log('3. Users should update their email and password after migration');
    console.log('4. Consider sending password reset emails to all migrated users');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqlite.close();
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData().catch(console.error);
}

export { migrateData };