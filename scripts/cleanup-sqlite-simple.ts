import fs from 'fs';
import path from 'path';

async function cleanupSQLite() {
  console.log('Starting SQLite cleanup...');

  const filesToRemove = [
    'sqlite.db',
  ];

  // Remove SQLite database file
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
        'connect-pg-simple',
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

  console.log('\n🎉 SQLite cleanup completed!');
  console.log('\nNext steps:');
  console.log('1. Run "npm install" to update dependencies');
  console.log('2. Configure your Supabase credentials in .env');
  console.log('3. Follow the SUPABASE_MIGRATION_GUIDE.md for setup');
}

// Run cleanup
cleanupSQLite().catch(console.error);