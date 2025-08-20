import fs from 'fs';
import path from 'path';

async function cleanupSQLite() {
  console.log('Starting SQLite cleanup...');

  const filesToRemove = [
    'sqlite.db',
    'server/session-store.ts',
    'server/auth.ts', // Old authentication file
  ];

  const directoriesToCheck = [
    'server',
    '.',
  ];

  // Remove SQLite database file and old auth files
  for (const file of filesToRemove) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`✓ Removed: ${file}`);
      } catch (error) {
        console.error(`✗ Failed to remove ${file}:`, error);
      }
    } else {
      console.log(`- File not found: ${file}`);
    }
  }

  // Update package.json to remove SQLite dependencies
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      const sqliteDeps = [
        'better-sqlite3',
        'sqlite3',
        'connect-pg-simple', // No longer needed with Supabase Auth
        'passport',
        'passport-local',
        'express-session',
        'memorystore',
      ];

      let removed = false;
      
      // Remove from dependencies
      if (packageJson.dependencies) {
        for (const dep of sqliteDeps) {
          if (packageJson.dependencies[dep]) {
            delete packageJson.dependencies[dep];
            console.log(`✓ Removed dependency: ${dep}`);
            removed = true;
          }
        }
      }

      // Remove from devDependencies
      if (packageJson.devDependencies) {
        const devSqliteDeps = [
          '@types/passport',
          '@types/passport-local',
          '@types/express-session',
          '@types/connect-pg-simple',
        ];
        
        for (const dep of devSqliteDeps) {
          if (packageJson.devDependencies[dep]) {
            delete packageJson.devDependencies[dep];
            console.log(`✓ Removed dev dependency: ${dep}`);
            removed = true;
          }
        }
      }

      if (removed) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✓ Updated package.json');
        console.log('\nRun "npm install" to update node_modules');
      } else {
        console.log('- No SQLite dependencies found in package.json');
      }
    } catch (error) {
      console.error('✗ Failed to update package.json:', error);
    }
  }

  // Clean up environment variables
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Remove legacy session secret
      if (envContent.includes('SESSION_SECRET')) {
        envContent = envContent.replace(/# Legacy.*\nSESSION_SECRET=.*\n?/g, '');
        envContent = envContent.replace(/SESSION_SECRET=.*\n?/g, '');
        fs.writeFileSync(envPath, envContent);
        console.log('✓ Cleaned up .env file');
      }
    } catch (error) {
      console.error('✗ Failed to clean up .env file:', error);
    }
  }

  console.log('\n🎉 SQLite cleanup completed!');
  console.log('\nNext steps:');
  console.log('1. Run "npm install" to update dependencies');
  console.log('2. Verify your Supabase configuration in .env');
  console.log('3. Test the application with "npm run dev"');
}

// Run cleanup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupSQLite().catch(console.error);
}

export { cleanupSQLite };