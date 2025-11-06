# Security Guidelines

## ⚠️ Critical Security Issues to Address Before Production

### 1. Environment Variables & Secret Management

**Current Risk**: `.env.local` contains real API keys and secrets
**Status**: ✅ File is gitignored (verify with `git log --all --full-history -- .env.local`)

**Required Actions**:
- [ ] Rotate ALL API keys immediately if `.env.local` was ever committed
  - Supabase service role key
  - Google OAuth client secret
  - Creem Payment API key
  - Cloudflare R2 credentials
  - kie.ai API key
  - NextAuth secret

- [ ] Use a secrets management service for production:
  - Vercel Environment Variables
  - AWS Secrets Manager
  - HashiCorp Vault
  - Google Cloud Secret Manager

- [ ] Never commit `.env.local` or any file containing real secrets

### 2. Authentication & Authorization

**Fixed Issues**:
- ✅ Restored ProtectedRoute wrapper on `/text-to-video` page
- ✅ Added authentication check before API calls
- ✅ Fixed `handleRetry` missing userId parameter

**Verify**:
- Test that unauthenticated users cannot access `/text-to-video`
- Test that API calls properly reject requests without valid userId
- Review all API endpoints for proper authentication middleware

### 3. Payment Integration (Creem Payment)

**Current Status**: 🚨 **MOCK IMPLEMENTATION - DO NOT USE IN PRODUCTION**

**Critical Issues**:
- Webhook signature verification returns `true` in development
- Subscription creation is mocked
- No actual payment processing

**Before Production Deployment**:
1. Implement proper webhook signature verification:
   ```javascript
   const crypto = require('crypto');
   const expectedSignature = crypto
     .createHmac('sha256', webhookSecret)
     .update(body)
     .digest('hex');
   return crypto.timingSafeEqual(
     Buffer.from(signature),
     Buffer.from(expectedSignature)
   );
   ```

2. Replace mock subscription creation with actual Creem Payment API
3. Add proper error handling and retry logic
4. Test all payment flows in staging environment
5. Set up monitoring and alerting for payment failures

**Current Protection**:
- Webhook verification automatically rejects all requests in `NODE_ENV=production`
- See warnings in `src/lib/creem-payment.ts`

### 4. Database Security (Supabase)

**Review Required**:
- [ ] Audit Row Level Security (RLS) policies on all tables
- [ ] Ensure service role key is only used in secure server-side code
- [ ] Verify that users can only access their own data
- [ ] Check that sensitive data is not exposed via public anon key

### 5. API Security

**To Implement**:
- [ ] Rate limiting on all API endpoints
- [ ] Input validation and sanitization
- [ ] CORS configuration review
- [ ] API key rotation strategy
- [ ] Request logging and monitoring

### 6. Git History

**If secrets were ever committed**:
```bash
# Check if sensitive files are in git history
git log --all --full-history -- .env.local
git log --all --full-history -- .env

# If found, use BFG Repo-Cleaner or git-filter-repo to remove
# Then force push (requires team coordination)
```

## Security Checklist Before Deployment

- [ ] All API keys rotated and stored in secure vault
- [ ] Payment webhook signature verification implemented
- [ ] RLS policies audited and tested
- [ ] Authentication required on all protected routes
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Security headers configured (CSP, HSTS, etc.)
- [ ] Dependencies audited (`npm audit`)
- [ ] Staging environment tested thoroughly
- [ ] Incident response plan documented

## Reporting Security Issues

If you discover a security vulnerability, please email support@saro2.ai

**DO NOT** open a public GitHub issue for security vulnerabilities.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

