# Deployment Configuration for Supabase Migration

This document outlines the deployment configuration for the quiz application after migrating to Supabase.

## Environment Variables for Production

Create these environment variables in your deployment platform:

### Required Environment Variables

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration (Server-side)
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]

# Supabase Configuration (Client-side - Vite)
VITE_SUPABASE_URL=https://[PROJECT-REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# Node Environment
NODE_ENV=production
```

## Platform-Specific Deployment

### Vercel

1. **vercel.json** (already configured for the existing setup)
2. **Environment Variables**: Add all variables in Vercel dashboard
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`

### Railway

1. **Environment Variables**: Add in Railway dashboard
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`

### Render

1. **Environment Variables**: Add in Render dashboard
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start`

### Heroku

1. **Procfile**:
   ```
   web: npm start
   ```
2. **Environment Variables**: Use `heroku config:set`
3. **Buildpacks**: Node.js buildpack (automatic)

## Database Setup in Production

### Supabase Configuration

1. **Database Tables**: Run the SQL from `SUPABASE_MIGRATION_GUIDE.md`
2. **Row Level Security**: Ensure RLS policies are active
3. **Auth Settings**:
   - Configure allowed redirect URLs
   - Set up email templates
   - Configure password requirements

### Environment-Specific Settings

#### Development
- Use development Supabase project
- Enable detailed logging
- Disable email confirmation for testing

#### Staging
- Use staging Supabase project
- Enable email confirmation
- Test with production-like data

#### Production
- Use production Supabase project
- Enable all security features
- Configure monitoring and alerts

## Security Checklist

### Environment Variables
- [ ] All sensitive keys are in environment variables
- [ ] No hardcoded secrets in code
- [ ] Service role key is only used server-side
- [ ] Anon key is properly scoped

### Supabase Security
- [ ] Row Level Security (RLS) is enabled
- [ ] Proper RLS policies are in place
- [ ] Auth settings are configured
- [ ] API rate limiting is enabled

### Application Security
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] JWT tokens are validated
- [ ] Error messages don't leak sensitive info

## Monitoring and Logging

### Supabase Dashboard
- Monitor database performance
- Track authentication metrics
- Review API usage
- Set up alerts for errors

### Application Monitoring
- Log authentication events
- Monitor API response times
- Track user registration/login
- Monitor quiz creation/completion

## Backup and Recovery

### Database Backups
- Supabase provides automatic backups
- Configure backup retention policy
- Test restore procedures

### Data Export
- Regular exports of quiz data
- User data backup procedures
- Migration rollback plan

## Performance Optimization

### Database
- Index frequently queried columns
- Optimize quiz data JSON queries
- Monitor slow queries

### Frontend
- Implement proper caching
- Optimize bundle size
- Use CDN for static assets

### API
- Implement request caching
- Optimize database queries
- Use connection pooling

## Scaling Considerations

### Database Scaling
- Supabase handles automatic scaling
- Monitor connection limits
- Consider read replicas for heavy read workloads

### Application Scaling
- Horizontal scaling with load balancers
- Stateless application design
- CDN for global distribution

## Troubleshooting

### Common Production Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify Supabase project status
   - Check connection limits

2. **Authentication Issues**
   - Verify JWT token validation
   - Check RLS policies
   - Validate redirect URLs

3. **CORS Errors**
   - Configure allowed origins in Supabase
   - Check API endpoint configurations
   - Verify request headers

### Debug Commands

```bash
# Check environment variables
npm run check

# Test database connection
npm run db:migrate

# Verify build process
npm run build
```

## Migration Rollback

If issues occur in production:

1. **Immediate Rollback**:
   - Revert to previous deployment
   - Switch DNS back to old version
   - Restore from backup if needed

2. **Data Recovery**:
   - Export data from Supabase
   - Import to SQLite if needed
   - Sync user accounts

3. **Gradual Migration**:
   - Run both systems in parallel
   - Gradually migrate users
   - Monitor for issues

## Post-Deployment Tasks

1. **Verify Functionality**:
   - Test user registration/login
   - Create and take quizzes
   - Verify data persistence

2. **Performance Testing**:
   - Load test authentication
   - Test concurrent quiz taking
   - Monitor response times

3. **User Communication**:
   - Notify users of changes
   - Provide migration instructions
   - Set up support channels

## Support and Maintenance

### Regular Tasks
- Monitor Supabase usage
- Review security logs
- Update dependencies
- Backup verification

### Emergency Contacts
- Supabase support
- Deployment platform support
- Database administrator
- Development team lead