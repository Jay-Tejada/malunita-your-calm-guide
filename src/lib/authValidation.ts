import { z } from 'zod';

/**
 * Password validation schema with industry-standard requirements
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*)');

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

/**
 * Authentication form schema
 */
export const authSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

/**
 * Validate authentication credentials
 */
export function validateAuthCredentials(email: string, password: string) {
  try {
    authSchema.parse({ email, password });
    return { success: true, errors: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => err.message),
      };
    }
    return {
      success: false,
      errors: ['Invalid input'],
    };
  }
}

/**
 * Rate limiting for authentication attempts
 * Tracks failed login attempts per email address
 */
interface LoginAttempt {
  count: number;
  lockedUntil: number | null;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * Check if an email is currently locked out
 */
export function isLockedOut(email: string): boolean {
  const attempt = loginAttempts.get(email);
  if (!attempt || !attempt.lockedUntil) return false;
  
  const now = Date.now();
  if (now < attempt.lockedUntil) {
    const minutesRemaining = Math.ceil((attempt.lockedUntil - now) / 60000);
    return true;
  }
  
  // Lockout expired, reset
  loginAttempts.delete(email);
  return false;
}

/**
 * Get remaining lockout time in minutes
 */
export function getLockoutTimeRemaining(email: string): number {
  const attempt = loginAttempts.get(email);
  if (!attempt || !attempt.lockedUntil) return 0;
  
  const now = Date.now();
  if (now >= attempt.lockedUntil) return 0;
  
  return Math.ceil((attempt.lockedUntil - now) / 60000);
}

/**
 * Record a failed login attempt
 */
export function recordFailedLogin(email: string): void {
  const attempt = loginAttempts.get(email) || { count: 0, lockedUntil: null };
  attempt.count += 1;
  
  if (attempt.count >= MAX_ATTEMPTS) {
    attempt.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  
  loginAttempts.set(email, attempt);
}

/**
 * Reset login attempts after successful login
 */
export function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

/**
 * Get current attempt count for an email
 */
export function getAttemptCount(email: string): number {
  return loginAttempts.get(email)?.count || 0;
}

/**
 * Get attempts remaining before lockout
 */
export function getAttemptsRemaining(email: string): number {
  const count = getAttemptCount(email);
  return Math.max(0, MAX_ATTEMPTS - count);
}