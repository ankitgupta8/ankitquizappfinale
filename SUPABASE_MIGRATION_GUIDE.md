# Supabase Migration Guide

This guide will help you migrate your quiz application from SQLite to Supabase with authentication.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project credentials from the Supabase dashboard

## Step 1: Environment Setup

Update your `.env` file with your Supabase credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase Configuration (Server-side)
SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"

# Supabase Configuration (Client-side - Vite)
VITE_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
VITE_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

Replace the placeholders with your actual Supabase project values:
- `[YOUR-PROJECT-REF]`: Your project reference ID
- `[YOUR-PASSWORD]`: Your database password
- `[YOUR-ANON-KEY]`: Your anon/public key
- `[YOUR-SERVICE-ROLE-KEY]`: Your service role key (keep this secret!)

## Step 2: Database Schema Setup

Run the following SQL in your Supabase SQL editor to create the necessary tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (this will sync with Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  username TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  quiz_data JSONB NOT NULL,
  score INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own quiz attempts" ON quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own quiz attempts" ON quiz_attempts
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 3: Install Dependencies

The required dependencies are already installed. If you need to reinstall them:

```bash
npm install @supabase/supabase-js @supabase/ssr postgres
```

## Step 4: Data Migration (Optional)

If you have existing data in SQLite, you can migrate it:

```bash
npm run migrate:data
```

**Note**: The required dependencies should already be installed. If you need to reinstall them manually:

```bash
npm install @supabase/supabase-js @supabase/ssr postgres
```

**Important Notes about Migration:**
- All users will be created with temporary emails (@migrated.local)
- All users will have the temporary password: `TempPassword123!`
- Users should update their email and password after migration
- Consider sending password reset emails to all migrated users

## Step 5: Database Migration

Run the database migration to ensure tables are created:

```bash
npm run db:migrate
```

## Step 6: Start the Application

```bash
npm run dev
```

## Step 7: Test the Migration

1. **Registration**: Try creating a new account
2. **Login**: Test logging in with the new account
3. **Quiz Creation**: Create and take a quiz
4. **Data Persistence**: Verify quiz attempts are saved
5. **Authentication**: Test protected routes

## Authentication Flow Changes

### Before (Custom Auth)
- Username/password authentication
- Server-side sessions with cookies
- Custom password hashing

### After (Supabase Auth)
- Email/password authentication
- JWT tokens with automatic refresh
- Built-in password hashing and security
- Optional social login providers
- Email verification and password reset

## API Changes

### Authentication Headers
All API requests now require the Authorization header:
```javascript
Authorization: Bearer [JWT_TOKEN]
```

### User Object Structure
```typescript
// Before
interface User {
  id: number;
  username: string;
}

// After
interface User {
  id: string; // UUID
  email: string;
  username?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env` file is in the root directory
   - Restart the development server after changes
   - Check that Vite variables start with `VITE_`

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check Supabase project is active
   - Ensure database password is correct

3. **Authentication Issues**
   - Verify SUPABASE_URL and keys are correct
   - Check that RLS policies are properly set up
   - Ensure the trigger function is created

4. **CORS Issues**
   - Add your domain to Supabase Auth settings
   - Check allowed origins in Supabase dashboard

### Rollback Plan

If you need to rollback to SQLite:
1. Restore the original files from git
2. Update `.env` to remove Supabase variables
3. Restart the application

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Service Role Key**: Keep this secret and only use server-side
3. **RLS Policies**: Ensure proper Row Level Security policies are in place
4. **HTTPS**: Always use HTTPS in production
5. **JWT Validation**: The server validates all JWT tokens with Supabase

## Next Steps

1. **Email Templates**: Customize Supabase Auth email templates
2. **Social Login**: Add Google, GitHub, or other OAuth providers
3. **User Profiles**: Extend user profiles with additional fields
4. **Real-time Features**: Use Supabase real-time subscriptions
5. **File Storage**: Use Supabase Storage for file uploads

## Support

If you encounter issues:
1. Check the Supabase documentation
2. Review the browser console for errors
3. Check server logs for authentication issues
4. Verify environment variables are correctly set