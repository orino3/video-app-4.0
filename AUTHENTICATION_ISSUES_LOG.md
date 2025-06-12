# Authentication Issues Log

## Overview
This document logs authentication issues encountered during development of the coaching platform and their solutions.

---

## Issue #1: Invalid JWT Structure Error
**Date:** June 4, 2025  
**Location:** `/auth/reset-password` page  
**Error:** `AuthInvalidJwtError: Invalid JWT structure`

### Problem
- Reset password page was throwing JWT structure errors when accessing with invalid/test tokens
- Error occurred when trying to use `setSession` with malformed tokens
- Browser console showed JWT parsing failures

### Root Cause
- Test tokens (`test123`, `test456`) were being passed to Supabase's `setSession` method
- Supabase expected valid JWT tokens but received simple strings
- No validation was performed before attempting to parse tokens

### Solution
1. **Added JWT Format Validation:**
   ```typescript
   const isValidJWT = (token: string) => {
     const parts = token.split('.');
     return parts.length === 3 && parts.every((part) => part.length > 0);
   };
   ```

2. **Enhanced Error Handling:**
   - Validate token format before calling `setSession`
   - Provide user-friendly error messages
   - Graceful fallback to "Request Password Reset" flow

3. **Improved Flow Logic:**
   - Check URL hash parameters first (Supabase commonly uses hash fragments)
   - Check query parameters as fallback
   - Proper session cleanup for security

**Files Modified:**
- `/src/app/auth/reset-password/page.tsx`

---

## Issue #2: Invalid Flow State Error
**Date:** June 4, 2025  
**Location:** `/auth/reset-password` page  
**Error:** `invalid flow state, no valid flow state found`

### Problem
- Users accessing reset password page without valid parameters
- Incorrect implementation of Supabase password reset flow
- Using wrong method (`exchangeCodeForSession` instead of `setSession`)

### Root Cause
- Attempted to use `exchangeCodeForSession` which is not the correct method for password reset
- Missing proper URL parameter handling for Supabase auth redirects
- No proper session state management

### Solution
1. **Corrected Authentication Flow:**
   - Use `setSession` with `access_token` and `refresh_token` from URL
   - Handle both hash fragments and query parameters
   - Proper session validation before showing reset form

2. **Enhanced URL Parameter Handling:**
   - Check `type=recovery` parameter
   - Extract tokens from both hash and query parameters
   - Clean up URL after successful session establishment

**Files Modified:**
- `/src/app/auth/reset-password/page.tsx`

---

## Issue #3: Login Success but Immediate Redirect to Login
**Date:** June 4, 2025  
**Location:** Login flow (`/auth/login` → `/dashboard` → `/auth/login`)  
**Symptom:** User briefly sees dashboard URL then gets redirected back to login

### Problem
- User successfully authenticates with Supabase
- Gets redirected to dashboard
- `ProtectedRoute` component immediately redirects back to login
- Authentication state appears to be lost or not properly initialized

### Root Cause Investigation
1. **Supabase Connection:** ✅ Working (direct API test successful)
2. **Credentials:** ✅ Correct (`orino333@gmail.com` / `qwer1234`)
3. **Environment Variables:** ✅ Properly configured
4. **User in auth.users:** ✅ Exists and confirmed

### Actual Root Cause
**Missing User Profile Data:**
- User existed in `auth.users` table but missing from custom `users` table
- User had no team memberships in `team_members` table
- Auth store's `refreshUserTeams()` function failed to load user data
- `ProtectedRoute` component determined user was not properly authenticated

### Solution
1. **Added Missing User Profile:**
   ```sql
   INSERT INTO users (id, email, full_name) 
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'orino333@gmail.com'),
     'orino333@gmail.com',
     'Test User'
   );
   ```

2. **Added Team Membership:**
   ```sql
   INSERT INTO team_members (user_id, team_id, role, jersey_number) 
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'orino333@gmail.com'),
     '6a3972f5-ad25-4432-8a37-6136267ba0db',
     'coach',
     NULL
   );
   ```

3. **Authentication Flow Fixed:**
   - User can now successfully login
   - Dashboard loads properly
   - No redirect loops

**Files Affected:**
- Database: `users` table
- Database: `team_members` table

---

## Issue #4: React Form State Synchronization (Testing Issue)
**Date:** June 4, 2025  
**Location:** `/auth/login` form testing  
**Error:** `missing email or phone` despite form fields having values

### Problem
- Browser automation filled form inputs but React state wasn't updated
- Form submission sent empty values to Supabase
- DOM values ≠ React component state

### Root Cause
- Puppeteer's `fill` method sets DOM values directly
- React's controlled components rely on `onChange` events to update state
- `onChange` events weren't properly triggered by automation

### Solution
**For Testing:**
- Use proper event simulation:
  ```javascript
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  ```

**For Production:**
- This is not an issue for real users typing manually
- Manual form input works correctly
- Only affects automated testing

**Note:** This was a testing-specific issue, not a production bug.

---

## Preventive Measures for Future Development

### 1. Signup Flow Enhancement
**Current Issue:** New users may face the same profile/team membership issue.

**Recommended Fix:**
- Ensure signup process creates entries in both `auth.users` AND `users` tables
- Implement proper onboarding flow for team assignment
- Add database triggers or signup hooks to maintain data consistency

### 2. Error Handling Improvements
- Add comprehensive error logging for authentication failures
- Implement user-friendly error messages for all auth scenarios
- Add debugging tools for development environment

### 3. Testing Strategy
- Develop proper testing utilities for React form interactions
- Create integration tests for complete auth flows
- Add database seeding for consistent test environments

### 4. Database Consistency
- Implement foreign key constraints properly
- Add database triggers to maintain user profile consistency
- Regular audit scripts to check for orphaned auth users

---

## Key Learnings

1. **Supabase Auth Integration:** Requires careful handling of both Supabase's `auth.users` and custom user tables
2. **Protected Routes:** Must handle edge cases where users exist in auth but lack required profile data
3. **Error Messages:** Generic errors like "invalid flow state" often mask underlying data issues
4. **Testing React Forms:** Requires proper event simulation, not just DOM value setting
5. **Database Relationships:** Auth systems need careful coordination between authentication and application data

---

## Quick Debug Checklist for Future Auth Issues

1. **Check Supabase Connection:**
   ```javascript
   // Test direct API call
   fetch('https://PROJECT.supabase.co/auth/v1/token?grant_type=password', {...})
   ```

2. **Verify User Exists:**
   ```sql
   SELECT * FROM auth.users WHERE email = 'user@example.com';
   SELECT * FROM users WHERE email = 'user@example.com';
   ```

3. **Check Team Memberships:**
   ```sql
   SELECT * FROM team_members WHERE user_id = 'USER_ID';
   ```

4. **Test Auth Store State:**
   - Monitor `useAuth()` hook values
   - Check `isAuthenticated`, `loading`, `initialized` states
   - Verify `teams` array is populated

5. **Review Recent Logs:**
   ```bash
   # Use Supabase MCP to check logs
   mcp__supabase__get_logs(project_id, 'auth')
   ```

---

**Last Updated:** June 4, 2025  
**Status:** All issues resolved ✅