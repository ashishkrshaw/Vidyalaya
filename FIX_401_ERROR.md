# Quick Fix: 401 Unauthorized Error

## Problem
Getting `401 Unauthorized` when trying to set up MFA.

## Root Cause
Your authentication token is either:
1. Missing from localStorage
2. Expired
3. Your account is not in "active" status

## Quick Fix Steps

### Step 1: Check Your Login Status
Open browser DevTools (F12) and run:
```javascript
console.log('Token:', localStorage.getItem('accessToken'));
console.log('School Info:', localStorage.getItem('schoolInfo'));
```

### Step 2: If Token is Missing - Log In Again
1. Go to http://localhost:5173/?view=login
2. Enter your credentials
3. Click Login

### Step 3: If Account is "Pending" - Activate It
Your account needs to be approved by a developer first.

**Quick Activation:**
1. Go to http://localhost:5173/developer
2. Use developer secret from your `.env` file
3. Find your school in the list
4. Click "Activate" button

### Step 4: After Activation - Log In Again
1. Return to login page
2. Log in with your credentials
3. Now try MFA setup - it should work!

## Test MFA Setup
Once logged in with an active account:
1. Navigate to Admin Profile (click school name/logo)
2. Scroll to Security section
3. Click "Use Auth App" or "Use Passkey"
4. Follow the setup wizard

## Still Having Issues?

Check the backend logs for the exact error:
- Look for the JWT decode error message
- Verify your account `status` field in MongoDB is set to "active"
