# Malunita Security Policies & Authentication Configuration

**Last Updated:** 2025-11-11  
**Status:** Production-Ready  
**Compliance Level:** Industry-Grade

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication Security](#authentication-security)
3. [Password Policies](#password-policies)
4. [Rate Limiting](#rate-limiting)
5. [API Security](#api-security)
6. [Backend Configuration](#backend-configuration)
7. [Security Testing](#security-testing)
8. [Incident Response](#incident-response)

---

## Overview

Malunita implements multi-layered security controls to protect user accounts and data. This document outlines all security measures, configurations, and best practices implemented across the application.

**Security Principles:**
- Defense in depth (multiple security layers)
- Principle of least privilege
- Zero-trust architecture for all API endpoints
- Automated threat detection and prevention
- Secure by default

---

## Authentication Security

### 1. User Registration Security

**Email Verification (Backend Configuration Required)**
- All new users must verify their email address before account activation
- Verification links expire after 24 hours
- Prevention of account enumeration attacks

**Configuration Location:**  
Backend Dashboard → Authentication → Providers → Email

```
☑️ Enable Email Confirmation
```

### 2. Password Security

**Leaked Password Protection (Backend Configuration Required)**
- Integration with HaveIBeenPwned database
- Blocks passwords that appear in known data breaches
- Real-time validation during signup and password changes

**Configuration Location:**  
Backend Dashboard → Authentication → Providers → Email

```
☑️ Enable Leaked Password Protection
```

**User-Facing Error Message:**
```
"This password has appeared in known data breaches. 
Please choose a more secure password."
```

### 3. Session Management

- **Session Persistence:** Stored securely in localStorage
- **Auto Token Refresh:** Enabled by default
- **Session Timeout:** Configurable per user preference
- **Remember Me:** Optional device trust for 30 days

---

## Password Policies

### Client-Side Validation (`src/lib/authValidation.ts`)

**Minimum Requirements (Enforced):**
- ✅ Minimum 10 characters
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*)

**Backend Configuration (Manual):**

Backend Dashboard → Authentication → Providers → Email → Password Settings

```
Minimum Password Length: 10 characters
☑️ Enforce password complexity
```

**Password Validation Flow:**
1. User enters password during signup
2. Client-side validation checks all requirements
3. Real-time feedback displays missing requirements
4. Backend validates against leaked password database
5. Account created only if all checks pass

### Password Reset Security

- Reset links expire after 1 hour
- One-time use only (invalidated after use)
- Requires email verification
- Previous password cannot be reused immediately

---

## Rate Limiting

### Authentication Rate Limits (`src/lib/authValidation.ts`)

**Login Attempt Protection:**
- **Max Attempts:** 5 failed login attempts
- **Lockout Duration:** 15 minutes
- **Scope:** Per email address
- **Reset Condition:** Successful login

**Implementation:**
```typescript
MAX_ATTEMPTS = 5
LOCKOUT_DURATION = 15 minutes (900,000 ms)
```

**User Experience:**
- Attempts 1-4: "Invalid credentials. X attempts remaining"
- Attempt 5: Account locked for 15 minutes
- Locked state: "Too many failed attempts. Try again in X minutes"

### API Rate Limits (Backend - Supabase Edge Functions)

**Per-Endpoint Limits:**

| Endpoint | Max Requests | Time Window | Purpose |
|----------|--------------|-------------|---------|
| transcribe-audio | 20 | 1 minute | Speech-to-text processing |
| chat-completion | 30 | 1 minute | AI conversation |
| text-to-speech | 20 | 1 minute | Audio generation |
| categorize-task | 30 | 1 minute | Task categorization |
| suggest-tasks | 10 | 1 minute | AI task suggestions |
| split-tasks | 15 | 1 minute | Task parsing |
| extract-tasks | 20 | 1 minute | Task extraction |
| suggest-focus | 10 | 1 minute | Focus recommendations |
| send-push-notification | 30 | 1 minute | Push notifications |

**Rate Limit Response:**
```json
{
  "error": "Rate limit exceeded. Please try again in a moment.",
  "status": 429
}
```

**Database Implementation:**
- Table: `rate_limits`
- Automatic cleanup of records older than 1 hour
- Per-user tracking with UUID isolation

---

## API Security

### Edge Function Authentication

**JWT Verification Status:**

| Function | Auth Required | Public Access |
|----------|---------------|---------------|
| transcribe-audio | ✅ Required | ❌ No |
| chat-completion | ✅ Required | ❌ No |
| text-to-speech | ✅ Required | ❌ No |
| categorize-task | ✅ Required | ❌ No |
| suggest-tasks | ✅ Required | ❌ No |
| split-tasks | ✅ Required | ❌ No |
| extract-tasks | ✅ Required | ❌ No |
| suggest-focus | ✅ Required | ❌ No |
| send-push-notification | ✅ Required | ❌ No |
| runway-review | ✅ Required | ❌ No |
| check-admin | ✅ Required | ❌ No |
| admin-stats | ✅ Required | ❌ No |
| daily-runway-reminder | ❌ Not Required | ✅ Yes (Cron job) |

**Configuration:** `supabase/config.toml`

### Input Validation

**All Edge Functions Validate:**
- ✅ Data type verification
- ✅ Length restrictions
- ✅ Format validation
- ✅ SQL injection prevention
- ✅ XSS attack prevention

**Example Limits:**
- Text input: Maximum 5,000 characters
- Audio data: Maximum 25MB
- Array sizes: Maximum 100 items
- Email: Maximum 255 characters

### Error Handling

**Security-Conscious Error Responses:**
- ❌ No internal implementation details exposed
- ❌ No database structure information leaked
- ❌ No API provider details revealed
- ✅ Generic error messages to users
- ✅ Detailed logs on server-side only

**Example:**
```typescript
// Client receives:
{ "error": "Service temporarily unavailable" }

// Server logs:
"OpenAI API error: 429 Rate limit exceeded [detailed stack trace]"
```

---

## Backend Configuration

### Required Manual Configuration Steps

**1. Enable Leaked Password Protection**

Path: Backend Dashboard → Authentication → Providers → Email

```
☑️ Enable Leaked Password Protection
```

**2. Enable Email Confirmation**

Path: Backend Dashboard → Authentication → Providers → Email

```
☑️ Require email confirmation for sign-ups
```

**3. Set Password Minimum Length**

Path: Backend Dashboard → Authentication → Providers → Email → Password Settings

```
Minimum Password Length: 10
```

**4. Configure Redirect URLs**

Path: Backend Dashboard → Authentication → Settings

```
Site URL: https://malunita-your-calm-guide.lovable.app
Redirect URLs:
  - https://malunita-your-calm-guide.lovable.app
  - https://malunita-your-calm-guide.lovable.app/reset-password
  - [Your custom domain if applicable]
```

### Row-Level Security (RLS)

**All Tables Have RLS Enabled:**
- ✅ `profiles` - User data isolation
- ✅ `tasks` - Per-user task access
- ✅ `conversation_history` - Private conversations
- ✅ `custom_categories` - User-specific categories
- ✅ `push_subscriptions` - Subscription privacy
- ✅ `task_learning_feedback` - Learning data isolation
- ✅ `rate_limits` - Rate limit tracking
- ✅ `api_usage_logs` - Restricted to service role
- ✅ `user_roles` - Admin access only

**Admin Role Security:**
- Separate `user_roles` table (not on profiles)
- `has_role()` security definer function
- Prevents privilege escalation attacks

---

## Security Testing

### Pre-Production Checklist

**Authentication:**
- [ ] Password complexity enforced on signup
- [ ] Leaked password detection working
- [ ] Email verification required
- [ ] Rate limiting active on login
- [ ] Lockout mechanism functioning
- [ ] Password reset flow secure

**Authorization:**
- [ ] All API endpoints require JWT
- [ ] RLS policies prevent data leakage
- [ ] Admin functions restricted properly
- [ ] Rate limits enforce on all endpoints

**Error Handling:**
- [ ] No sensitive info in error messages
- [ ] Proper HTTP status codes
- [ ] User-friendly error messages

### Testing Commands

**Test Password Validation:**
```bash
# Weak password (should fail)
Password: test123
Expected: ❌ Does not meet requirements

# Strong password (should pass)
Password: MyP@ssw0rd2024!
Expected: ✅ Account created
```

**Test Rate Limiting:**
```bash
# Attempt 6 logins with wrong password
Expected: Account locked after 5th attempt
```

**Test API Authentication:**
```bash
# Call edge function without auth header
curl -X POST [endpoint] -d '{"data": "test"}'
Expected: 401 Unauthorized
```

---

## Incident Response

### Security Incident Categories

**Critical (Immediate Response Required):**
- Data breach or unauthorized access
- API key exposure
- Authentication bypass
- Mass account compromise

**High (Response within 4 hours):**
- Repeated rate limit violations
- Suspicious login patterns
- Failed RLS policy

**Medium (Response within 24 hours):**
- Individual account lockout
- Password reset abuse
- Input validation errors

### Response Procedures

**1. Detection:**
- Monitor edge function logs
- Review auth logs in backend dashboard
- Check rate limit violations

**2. Containment:**
- Revoke compromised tokens/sessions
- Temporarily disable affected endpoints
- Lock compromised accounts

**3. Investigation:**
- Review access logs
- Identify attack vector
- Assess scope of impact

**4. Recovery:**
- Apply security patches
- Force password resets if needed
- Re-enable services

**5. Post-Incident:**
- Update security policies
- Improve monitoring
- Document lessons learned

### Contact Information

**Security Team:** [Add contact email]  
**On-Call Engineer:** [Add contact]  
**Incident Hotline:** [Add hotline]

---

## Compliance & Auditing

### Audit Log Locations

- **Authentication Events:** Backend Dashboard → Logs → Auth Logs
- **API Usage:** `api_usage_logs` table
- **Rate Limiting:** `rate_limits` table
- **Edge Function Logs:** Backend Dashboard → Edge Functions → Logs

### Regular Security Reviews

**Weekly:**
- Review auth logs for suspicious patterns
- Check rate limit violations
- Monitor API usage

**Monthly:**
- Audit RLS policies
- Review failed login attempts
- Update password blacklists

**Quarterly:**
- Full security audit
- Penetration testing
- Policy review and updates

---

## Additional Recommendations

### Future Enhancements

**High Priority:**
- [ ] Two-Factor Authentication (2FA) using TOTP
- [ ] Passkey/WebAuthn support
- [ ] Device fingerprinting
- [ ] Geolocation-based anomaly detection

**Medium Priority:**
- [ ] Security headers (CSP, HSTS)
- [ ] API key rotation policy
- [ ] Automated security scanning
- [ ] DDoS protection

**Low Priority:**
- [ ] Biometric authentication
- [ ] Hardware security keys
- [ ] Blockchain-based identity

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-11-11 | Initial security policy documentation | AI Assistant |

---

**Document Status:** ✅ Active  
**Next Review Date:** 2025-12-11  
**Classification:** Internal Use Only