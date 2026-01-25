# Authentication Flow Diagrams

## 1. Signup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    SIGNUP WORKFLOW                          │
└─────────────────────────────────────────────────────────────┘

User Opens App
     │
     ↓
┌─────────────────────┐
│ Click "Sign In"     │
│ Button              │
└─────────────────────┘
     │
     ↓
┌─────────────────────────────────────────────┐
│     LoginModal Opens                        │
│  ├─ Email Input                             │
│  ├─ Password Input                          │
│  └─ "Sign Up" Link                          │
└─────────────────────────────────────────────┘
     │
     ↓ (User clicks "Sign Up")
┌──────────────────────────────────────────────────────────────┐
│      SignupModal Opens - STEP 1                              │
│  ├─ Full Name Input (validation: 2+ chars)                  │
│  ├─ Email Input (validation: valid format)                  │
│  ├─ Phone Input (validation: 10+ digits)                    │
│  ├─ Password Input (validation: all 5 requirements)         │
│  │  └─ Real-time strength meter (0-5 score)               │
│  ├─ Confirm Password (must match)                           │
│  └─ Continue Button                                          │
└──────────────────────────────────────────────────────────────┘
     │
     ├─ Validation Check
     │  ├─ Name length ≥ 2?
     │  ├─ Email format valid?
     │  ├─ Phone length ≥ 10?
     │  ├─ Password meets all 5 requirements?
     │  └─ Passwords match?
     │
     ├─ ❌ If ANY validation fails
     │  └─ Show error message
     │     └─ User fixes and retries
     │
     └─ ✅ If ALL validations pass
        │
        ↓
┌──────────────────────────────────────────────────────────────┐
│      SignupModal - STEP 2                                    │
│  ├─ Security Question 1 (dropdown)                          │
│  ├─ Security Answer 1 (text input)                          │
│  ├─ Security Question 2 (dropdown)                          │
│  ├─ Security Answer 2 (text input)                          │
│  ├─ Back Button                                              │
│  └─ Create Account Button                                    │
└──────────────────────────────────────────────────────────────┘
     │
     ├─ Validation Check
     │  ├─ Answer 1 not empty?
     │  └─ Answer 2 not empty?
     │
     ├─ ❌ If validation fails
     │  └─ Show error
     │
     └─ ✅ If validation passes
        │
        ↓
┌──────────────────────────────────────────────────────────────┐
│    POST /api/auth/signup                                     │
│    (Frontend sends all data to Backend)                      │
│                                                              │
│  Payload:                                                    │
│  ├─ email                                                   │
│  ├─ password (hashed in transit)                           │
│  ├─ name                                                    │
│  ├─ phone                                                   │
│  ├─ security_question_1 & answer_1                        │
│  └─ security_question_2 & answer_2                        │
└──────────────────────────────────────────────────────────────┘
     │
     ↓ (Backend Processing)
┌──────────────────────────────────────────────────────────────┐
│         BACKEND VALIDATION                                   │
│  1. Email format valid?                                     │
│     └─ Regex check against pattern                          │
│  2. Email not already registered?                           │
│     └─ Case-insensitive check                              │
│  3. Password meets requirements?                            │
│     ├─ 8+ chars?                                           │
│     ├─ Has uppercase?                                      │
│     ├─ Has lowercase?                                      │
│     ├─ Has digit?                                          │
│     └─ Has special char?                                   │
│  4. Name at least 2 chars?                                 │
│  5. Phone at least 10 digits?                              │
│     └─ Remove non-digits, check length                     │
└──────────────────────────────────────────────────────────────┘
     │
     ├─ ❌ ANY validation fails
     │  └─ Return error response
     │     └─ Frontend shows error message
     │        └─ User can retry
     │
     └─ ✅ ALL validations pass
        │
        ↓
┌──────────────────────────────────────────────────────────────┐
│         CREATE USER RECORD                                   │
│  1. Generate unique tasker_id (task_001, task_002, ...)     │
│  2. Hash password with bcrypt                               │
│  3. Create user object with all data                        │
│  4. Store security answers (lowercase)                      │
│  5. Add to users list                                       │
│  6. Save to JSON file                                       │
└──────────────────────────────────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│         GENERATE JWT TOKEN                                   │
│  1. Create payload:                                          │
│     ├─ tasker_id                                            │
│     ├─ email                                                │
│     └─ exp (30 min expiration)                             │
│  2. Sign with SECRET_KEY                                    │
│  3. Return JWT token                                        │
└──────────────────────────────────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│         SET SECURE COOKIE                                    │
│  Cookie: access_token = JWT_TOKEN                           │
│  Flags:                                                      │
│    ├─ HttpOnly (prevents JavaScript access)                │
│    ├─ Secure (HTTPS only in production)                    │
│    ├─ SameSite=lax (CSRF protection)                       │
│    └─ Max-Age = 30 min                                     │
└──────────────────────────────────────────────────────────────┘
     │
     ↓
┌──────────────────────────────────────────────────────────────┐
│         RETURN SUCCESS RESPONSE                              │
│  {                                                           │
│    "message": "Account created successfully",               │
│    "user": {                                                │
│      "tasker_id": "task_001",                              │
│      "name": "John Doe",                                   │
│      "email": "john@example.com",                          │
│      "phone": "5551234567",                                │
│      "full_name": "John Doe",                              │
│      "is_pro": false                                       │
│    }                                                        │
│  }                                                          │
└──────────────────────────────────────────────────────────────┘
     │
     ↓ (Frontend receives)
┌──────────────────────────────────────────────────────────────┐
│  1. Store user in state                                      │
│  2. Close signup modal                                       │
│  3. Update header to show logged-in UI                      │
│  4. Show user menu with name                                │
│  5. User is now authenticated!                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Password Strength Validation

```
┌────────────────────────────────────────────────────┐
│    PASSWORD STRENGTH REAL-TIME VALIDATION           │
└────────────────────────────────────────────────────┘

User Types in Password Field
            │
            ↓
┌────────────────────────────────────────────────────┐
│  Frontend: handlePasswordChange()                  │
│  - Get password value                              │
│  - Call validatePasswordStrength()                 │
└────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────┐
│  Validate Each Requirement:                        │
│                                                    │
│  ✓ Length ≥ 8?                                    │
│    └─ password.length >= 8                         │
│                                                    │
│  ✓ Has Uppercase?                                 │
│    └─ /[A-Z]/.test(password)                      │
│                                                    │
│  ✓ Has Lowercase?                                 │
│    └─ /[a-z]/.test(password)                      │
│                                                    │
│  ✓ Has Number?                                    │
│    └─ /[0-9]/.test(password)                      │
│                                                    │
│  ✓ Has Special Char?                              │
│    └─ /[!@#$%^&*...]/.test(password)              │
└────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────┐
│  Calculate Score: Count requirements met           │
│  score = 0;                                        │
│  if (minLength) score++;     // +1                │
│  if (hasUppercase) score++;  // +1                │
│  if (hasLowercase) score++;  // +1                │
│  if (hasNumber) score++;     // +1                │
│  if (hasSpecial) score++;    // +1                │
│                                                    │
│  Result: score = 0 to 5                           │
└────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────┐
│  Update PasswordStrengthMeter Component            │
│                                                    │
│  score: 0  → Red    "Very Weak"                   │
│  score: 1  → Red    "Very Weak"                   │
│  score: 2  → Orange "Weak"                        │
│  score: 3  → Yellow "Fair"                        │
│  score: 4  → Lime   "Good"                        │
│  score: 5  → Green  "Strong"  ✅                  │
│                                                    │
│  Display:                                          │
│  ├─ Color bar (0-100% filled)                     │
│  ├─ Score text (e.g., "4/5")                      │
│  ├─ Strength label                                │
│  └─ Checklist with ✓/✗ for each requirement       │
└────────────────────────────────────────────────────┘
            │
            ↓
┌────────────────────────────────────────────────────┐
│  Submit Button State:                              │
│                                                    │
│  If score < 5:                                    │
│    └─ Button DISABLED (gray, not clickable)       │
│                                                    │
│  If score === 5:                                  │
│    └─ Button ENABLED (blue, clickable)            │
│                                                    │
│  + All other validations must pass                │
│    ├─ Email not empty                             │
│    ├─ Name ≥ 2 chars                              │
│    ├─ Phone ≥ 10 digits                           │
│    └─ Passwords match                             │
└────────────────────────────────────────────────────┘
```

---

## 3. Login Flow

```
┌────────────────────────────────────┐
│        LOGIN WORKFLOW              │
└────────────────────────────────────┘

User Opens App
     │
     ↓
┌────────────────────────────────────┐
│ Check Cookie                       │
│ GET /api/auth/me                   │
│ (on app load)                      │
└────────────────────────────────────┘
     │
     ├─ ✅ Cookie exists & valid
     │  └─ User already logged in
     │     └─ Show header with user menu
     │
     └─ ❌ No cookie or invalid
        └─ User not logged in
           └─ Show "Sign In" button
              │
              ↓
         ┌──────────────────────┐
         │ User clicks "Sign In"│
         └──────────────────────┘
              │
              ↓
         ┌──────────────────────────────┐
         │ LoginModal Opens             │
         ├─ Email Input                 │
         ├─ Password Input              │
         ├─ Sign In Button              │
         ├─ "Show Test Users" link      │
         └─ "Sign Up" link              │
              │
              ├─ Enter email
              ├─ Enter password
              │
              ↓
         ┌──────────────────────────────┐
         │ Basic Validation             │
         ├─ Email not empty?            │
         └─ Password not empty?         │
              │
              ├─ ❌ If validation fails
              │  └─ Disable submit button
              │
              └─ ✅ If validation passes
                 │
                 ↓
         ┌───────────────────────────────────┐
         │ POST /api/auth/login               │
         │ Body: {                            │
         │   "email": "...",                  │
         │   "password": "..."                │
         │ }                                  │
         └───────────────────────────────────┘
              │
              ↓ (Backend Processing)
         ┌───────────────────────────────────┐
         │ Backend Validation                 │
         │ 1. Find user by email              │
         │    └─ Case-insensitive match       │
         │ 2. User exists?                    │
         │    ├─ ✅ Yes → continue            │
         │    └─ ❌ No → return error         │
         │ 3. Verify password                 │
         │    └─ bcrypt.verify()              │
         │    ├─ ✅ Match → continue          │
         │    └─ ❌ No match → return error   │
         └───────────────────────────────────┘
              │
              ├─ ❌ User not found or password wrong
              │  └─ Return 401 "Invalid email or password"
              │     │
              │     ↓
              │  Frontend shows error
              │  User can retry
              │
              └─ ✅ Email & password correct
                 │
                 ↓
         ┌───────────────────────────────────┐
         │ Generate JWT Token                 │
         │ - Create payload                   │
         │ - Sign with SECRET_KEY             │
         │ - Set 30 min expiration            │
         └───────────────────────────────────┘
                 │
                 ↓
         ┌───────────────────────────────────┐
         │ Set Secure Cookie                  │
         │ - Token stored in HTTP-only cookie │
         │ - Sent on all future requests      │
         │ - Prevents XSS attacks             │
         └───────────────────────────────────┘
                 │
                 ↓
         ┌───────────────────────────────────┐
         │ Return User Data                   │
         │ {                                  │
         │   "message": "Login successful",   │
         │   "user": { ... }                  │
         │ }                                  │
         └───────────────────────────────────┘
                 │
                 ↓ (Frontend)
         ┌───────────────────────────────────┐
         │ 1. Close LoginModal                │
         │ 2. Store user in state             │
         │ 3. Update header UI                │
         │ 4. Show user menu                  │
         │ 5. User logged in! ✅              │
         └───────────────────────────────────┘
                 │
                 ↓
         On Future Page Loads:
         Cookie automatically sent → User stays logged in
              │
              ↓
         User can Logout:
         POST /api/auth/logout
              │
              ↓
         Cookie cleared from browser
```

---

## 4. Email & ID Assignment Flow

```
┌────────────────────────────────────────────────────┐
│    EMAIL & TASKER ID ASSIGNMENT                    │
└────────────────────────────────────────────────────┘

User submits signup form with email
            │
            ↓
┌────────────────────────────────────────────────────┐
│ Frontend: Validate email format                    │
│ Regex: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[...]   │
│                                                    │
│ Examples:                                          │
│ ✅ john@example.com    → Valid                    │
│ ✅ user.name@test.co.uk → Valid                   │
│ ❌ notanemail           → Invalid                  │
│ ❌ @example.com         → Invalid                  │
│ ❌ user@.com            → Invalid                  │
└────────────────────────────────────────────────────┘
            │
            ├─ ❌ Frontend validation fails
            │  └─ Show error, don't submit
            │
            └─ ✅ Frontend validation passes
               │
               ↓ (Send to Backend)
         ┌────────────────────────────────────────┐
         │ Backend: Double-check email format     │
         │ Same regex validation                  │
         └────────────────────────────────────────┘
               │
               ├─ ❌ Invalid format
               │  └─ Return 400 "Invalid email format"
               │
               └─ ✅ Valid format
                  │
                  ↓
         ┌────────────────────────────────────────┐
         │ Check for Duplicate Email               │
         │ (Case-insensitive)                      │
         │                                         │
         │ for user in all_users:                  │
         │   if user.email.lower() ==              │
         │      new_email.lower():                 │
         │     ❌ DUPLICATE FOUND                  │
         │        return error                    │
         │   else:                                 │
         │     ✅ UNIQUE                           │
         │        continue                        │
         └────────────────────────────────────────┘
               │
               ├─ ❌ Email already exists
               │  └─ Return 400 "Email already registered"
               │
               └─ ✅ Email is unique
                  │
                  ↓
         ┌────────────────────────────────────────┐
         │ Generate Unique Tasker ID               │
         │                                         │
         │ Format: task_### (zero-padded)          │
         │                                         │
         │ Algorithm:                              │
         │ 1. Load all existing taskers            │
         │ 2. Extract IDs and get numbers:         │
         │    - task_001 → 1                       │
         │    - task_002 → 2                       │
         │    - task_005 → 5                       │
         │ 3. Find max number                      │
         │    - max = 5                            │
         │ 4. Add 1                                │
         │    - next = 6                           │
         │ 5. Zero-pad to 3 digits                 │
         │    - "006"                              │
         │ 6. Prepend "task_"                      │
         │    - "task_006"                         │
         │                                         │
         │ Examples:                               │
         │ First user:  task_001                   │
         │ Second user: task_002                   │
         │ 10th user:   task_010                   │
         │ 100th user:  task_100                   │
         │ 1000th user: task_1000                  │
         └────────────────────────────────────────┘
                  │
                  ↓
         ┌────────────────────────────────────────┐
         │ Create User Record                      │
         │ {                                       │
         │   "tasker_id": "task_006",     ← New   │
         │   "email": "john@example.com", ← Saved │
         │   "password": "$2b$12$...",    ← Hashed│
         │   "name": "John Doe",                  │
         │   "phone": "5551234567",               │
         │   ... other fields ...                 │
         │ }                                       │
         └────────────────────────────────────────┘
                  │
                  ↓
         ✅ User Created Successfully!
```

---

## 5. Session & Cookie Management

```
┌──────────────────────────────────────────────┐
│    COOKIE & SESSION MANAGEMENT              │
└──────────────────────────────────────────────┘

Login Successful
        │
        ↓
┌──────────────────────────────────────────────┐
│ Create JWT Token (Backend)                   │
│                                              │
│ Payload:                                     │
│ {                                            │
│   "tasker_id": "task_001",                  │
│   "email": "user@example.com",              │
│   "exp": 1705968123  (30 min from now)      │
│ }                                            │
│                                              │
│ Sign with SECRET_KEY (HS256)                │
│ Result: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXV...│
└──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────┐
│ Set HTTP-Only Cookie (Backend)              │
│                                              │
│ Set-Cookie: access_token=JWT_VALUE           │
│ Flags:                                       │
│   HttpOnly   → JS cannot access (XSS safe)   │
│   Secure    → HTTPS only (production)        │
│   SameSite  → lax (CSRF protection)          │
│   Max-Age   → 1800 seconds (30 minutes)      │
└──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────┐
│ Browser Receives Response                    │
│                                              │
│ 1. Read Set-Cookie header                    │
│ 2. Store access_token in cookie jar          │
│ 3. JavaScript CANNOT read it (HttpOnly)      │
│ 4. Browser includes cookie on all requests   │
│    to API domain                             │
└──────────────────────────────────────────────┘
        │
        ↓
┌──────────────────────────────────────────────┐
│ On All Future Requests                       │
│                                              │
│ Browser automatically includes:              │
│ Cookie: access_token=JWT_VALUE               │
│                                              │
│ Backend receives cookie:                     │
│ 1. Extract JWT from cookie                   │
│ 2. Decode JWT                                │
│ 3. Verify signature (using SECRET_KEY)       │
│ 4. Check expiration                          │
│ 5. Use tasker_id to get user info            │
└──────────────────────────────────────────────┘
        │
        ├─ ✅ Valid token & not expired
        │  └─ Process request as authenticated
        │
        └─ ❌ Invalid or expired
           └─ Return 401 "Not authenticated"
              │
              ↓
           Frontend redirects to login
           User sees "Session expired"

Logout:
        │
        ↓
┌──────────────────────────────────────────────┐
│ POST /api/auth/logout                        │
│                                              │
│ Backend sends:                               │
│ Set-Cookie: access_token=; Max-Age=0        │
│                                              │
│ This tells browser to delete cookie          │
└──────────────────────────────────────────────┘
        │
        ↓
Browser removes access_token cookie
        │
        ↓
Future requests have NO cookie
        │
        ↓
Backend returns 401 (not authenticated)
```

---

## 6. Error Handling Flow

```
┌──────────────────────────────────────────────┐
│    ERROR HANDLING & USER FEEDBACK            │
└──────────────────────────────────────────────┘

Signup Validation Error
        │
        ├─ Invalid Email Format
        │  └─ "Invalid email format"
        │
        ├─ Email Already Registered
        │  └─ "Email already registered"
        │
        ├─ Weak Password
        │  └─ "Password must contain... | Password must..."
        │
        ├─ Passwords Don't Match
        │  └─ "Passwords do not match"
        │
        ├─ Invalid Name
        │  └─ "Name must be at least 2 characters"
        │
        ├─ Invalid Phone
        │  └─ "Valid phone number required"
        │
        └─ Missing Fields
           └─ Button disabled (CONTINUE button grayed out)

Login Errors
        │
        ├─ User Not Found
        │  └─ "Invalid email or password"
        │
        ├─ Wrong Password
        │  └─ "Invalid email or password"
        │  (Generic for security - don't reveal which)
        │
        └─ Server Error
           └─ "Login failed. Please try again."

Frontend Error Display:
        │
        ├─ Error Message Box
        │  ├─ Red background (#500)
        │  ├─ Error icon
        │  └─ Clear message
        │
        └─ Form stays open
           └─ User can try again
```

---

**These diagrams illustrate the complete authentication flow from signup through login and session management.**
