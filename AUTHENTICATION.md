# Authentication & Sign-Up System Documentation

## Overview
The stagescout application now features a comprehensive, secure authentication system with industry-standard password requirements, JWT token generation, and a multi-step signup process.

## Features Implemented

### 1. **Secure Password Hashing**
- Uses bcrypt for password hashing (via passlib)
- Passwords are never stored in plain text
- Automatic verification during login

### 2. **Password Strength Requirements**
All passwords must meet the following industry-standard criteria:
- **Minimum 8 characters** long
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one digit** (0-9)
- **At least one special character** (!@#$%^&* etc.)

### 3. **JWT Authentication**
- JWT tokens generated upon successful signup/login
- Tokens stored in HTTP-only secure cookies (XSRF protection)
- Automatic token verification on protected routes
- 30-minute token expiration (configurable)

### 4. **Email Validation**
- Checks for valid email format
- Prevents duplicate email registrations (case-insensitive)
- Real-time validation feedback in UI

### 5. **Incremental Tasker ID Assignment**
- Automatic tasker ID generation with format `task_###`
- Sequential numbering ensures uniqueness
- IDs are immutable after creation

### 6. **Multi-Step Sign-Up Process**
**Step 1: Basic Information**
- Full name
- Email address
- Phone number
- Password (with strength meter)
- Confirm password

**Step 2: Security Questions**
- Two security questions for account recovery
- Custom answer support
- Case-insensitive answer matching

### 7. **Password Strength Meter (Frontend)**
Real-time visual feedback:
- Color-coded strength indicator
- Checklist of requirements
- Interactive progress bar
- Shows which requirements are met/not met

### 8. **Real-Time Validation**
- Email format validation
- Phone number validation (minimum 10 digits)
- Password matching verification
- Name length validation (minimum 2 characters)

## Backend Endpoints

### Authentication Routes

#### `POST /api/auth/signup`
Create a new user account
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "5551234567",
  "security_question_1": "What is your pet's name?",
  "security_answer_1": "Fluffy",
  "security_question_2": "What city were you born in?",
  "security_answer_2": "New York"
}

Response (201):
{
  "message": "Account created successfully",
  "user": {
    "tasker_id": "task_001",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "5551234567",
    "full_name": "John Doe",
    "is_pro": false
  }
}
```

#### `POST /api/auth/login`
Sign in with credentials
```json
Request:
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "message": "Login successful",
  "user": {
    "tasker_id": "task_001",
    "name": "John Doe",
    "email": "user@example.com",
    "phone": "5551234567",
    "full_name": "John Doe",
    "is_pro": false
  }
}
```

#### `POST /api/auth/logout`
Sign out and clear authentication cookie
```
Response: { "message": "Logged out successfully" }
```

#### `GET /api/auth/me`
Get current authenticated user
```
Response: { user object or null }
```

#### `POST /api/auth/forgot-password`
Reset password using security questions
```json
Request:
{
  "email": "user@example.com",
  "security_answer_1": "Fluffy",
  "security_answer_2": "New York",
  "new_password": "NewSecurePass123!"
}

Response:
{ "message": "Password updated successfully" }
```

#### `POST /api/auth/security-questions`
Retrieve security questions for a user
```json
Request: { "email": "user@example.com" }

Response:
{
  "security_question_1": "What is your pet's name?",
  "security_question_2": "What city were you born in?"
}
```

## Frontend Components

### SignupModal.jsx
Multi-step signup form with:
- Real-time password strength validation
- Phone number formatting
- Security question selection
- Error handling and feedback
- Loading states

### PasswordStrengthMeter.jsx
Visual component displaying:
- Strength score (0-5)
- Color-coded indicator
- Requirement checklist
- Real-time updates as user types

### LoginModal.jsx
Sign-in form with:
- Email/password input
- Test user selector (for development)
- Error messaging
- Link to signup form

## API Client Methods

### `base44.auth.signup()`
```javascript
const response = await base44.auth.signup(
  email,
  password,
  name,
  phone,
  securityQuestion1,
  securityAnswer1,
  securityQuestion2,
  securityAnswer2
);
```

### `base44.auth.login()`
```javascript
const response = await base44.auth.login(email, password);
```

### `base44.auth.logout()`
```javascript
const success = await base44.auth.logout();
```

### `base44.auth.me()`
```javascript
const user = await base44.auth.me();
```

## Security Features

1. **HTTP-Only Cookies**: Tokens stored in HTTP-only cookies, preventing XSS attacks
2. **Secure Password Hashing**: bcrypt with automatic salt generation
3. **CSRF Protection**: SameSite=lax cookie policy
4. **Input Validation**: Server-side validation of all inputs
5. **Case-Insensitive Email**: Prevents duplicate accounts with email variations
6. **Rate Limiting Ready**: Structure supports adding rate limiting middleware
7. **JWT Expiration**: Automatic token expiration after 30 minutes

## Database Schema (JSON Storage)

Each tasker/user record includes:
```json
{
  "tasker_id": "task_001",
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "5551234567",
  "password": "$2b$12$...",  // bcrypt hash
  "profile_image": "https://...",
  "service_category": "other",
  "bio": "",
  "hourly_rate": 0,
  "daily_rate": 0,
  "zip_code": "",
  "service_radius_miles": 25,
  "portfolio_images": [],
  "equipment_list": [],
  "average_rating": 0,
  "total_reviews": 0,
  "years_experience": 0,
  "is_verified": false,
  "is_pro": false,
  "security_question_1": "What is your pet's name?",
  "security_answer_1": "fluffy",  // lowercase
  "security_question_2": "What city were you born in?",
  "security_answer_2": "new york",  // lowercase
  "auth_token": ""
}
```

## Testing the Sign-Up Workflow

### Using Test Credentials
1. Open the Login Modal
2. Click "Show Test Users" to see existing test accounts
3. For signup testing:
   - Click "Sign Up" link at the bottom
   - Try with valid email: `newuser@test.com`
   - Use password: `TestPass123!` (meets all requirements)
   - Add any name and phone number
   - Answer security questions
   - Click "Create Account"

### Password Validation Testing
Test these passwords in the signup form:

**Valid Passwords:**
- `SecurePass123!` ✅
- `MyP@ssw0rd` ✅
- `Complex#Pass456` ✅

**Invalid Passwords (and why):**
- `short` ❌ (less than 8 chars)
- `nouppercase123!` ❌ (no uppercase)
- `NOLOWERCASE123!` ❌ (no lowercase)
- `NoNumbers!` ❌ (no digits)
- `NoSpecial123` ❌ (no special char)

### Error Scenarios
Test these scenarios:

1. **Duplicate Email**: Try registering with an existing email
2. **Invalid Email**: Use `notanemail` or `@example.com`
3. **Short Phone**: Use `123` (less than 10 digits)
4. **Mismatched Passwords**: Enter different values in password fields
5. **Empty Fields**: Leave any required field blank

## Future Enhancements

### Phase 2: Two-Factor Authentication
- SMS-based 2FA
- Email verification codes
- Authenticator app support (TOTP)

### Phase 3: OAuth Integration
- Google Sign-Up/Login
- Facebook Sign-Up/Login
- Apple Sign-Up/Login

### Phase 4: Email Verification
- Send verification email on signup
- Verify email before account activation
- Resend verification option
- Email-based password recovery

### Phase 5: Advanced Security
- Rate limiting on auth endpoints
- Brute force protection
- Session management
- Device fingerprinting
- Audit logging

## Environment Variables

Add to `.env` in backend directory:
```
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

For production, ensure:
- `SECRET_KEY` is a strong, random value
- `secure=True` for cookies (HTTPS only)
- CORS origins are restricted to known domains
- Rate limiting is enabled

## Troubleshooting

### Passwords Not Hashing
Ensure `passlib` and `bcrypt` are installed:
```bash
pip install passlib bcrypt
```

### Signup Fails with "Email already registered"
- Email is case-insensitive
- Clear browser cookies if testing multiple accounts
- Check `be/data/taskers.json` for existing entries

### Tokens Not Working
- Ensure cookies are enabled in browser
- Check CORS settings allow credentials
- Verify SECRET_KEY is the same between signup and login

### Frontend Not Finding SignupModal
- Verify `fe/src/components/SignupModal.jsx` exists
- Check import in `Layout.jsx` is correct
- Build frontend with `npm run build` if using production

## Files Modified/Created

**Backend:**
- `be/app/main.py` - Updated password hashing, JWT handling

**Frontend:**
- `fe/src/components/SignupModal.jsx` - New signup form (created)
- `fe/src/components/PasswordStrengthMeter.jsx` - New strength meter (created)
- `fe/src/components/LoginModal.jsx` - Updated with signup link
- `fe/src/api/base44Client.js` - Added signup method
- `fe/src/layout/Layout.jsx` - Integrated signup modal

## Support & Questions

For issues or questions:
1. Check the error message in browser console
2. Review backend logs: `be/app.log`
3. Verify all dependencies are installed
4. Check JSON data file format: `be/data/taskers.json`
