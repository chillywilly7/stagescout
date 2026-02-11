# StagePros FastAPI Backend

The Python FastAPI backend for the StagePros platform — connecting customers with SXSW scouts and stage professionals.

## Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. (Optional) Copy and configure the environment file for email features:
```bash
cp env.example .env
# Edit .env with your SMTP credentials
```

### Running the Server

Option 1: Using the startup script (macOS/Linux):
```bash
chmod +x run_server.sh
./run_server.sh
```

Option 2: Direct command:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

### Accessing the API

- **API Documentation**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc

## API Endpoints

### Authentication

| Method | Endpoint | Description | Used by FE |
|--------|----------|-------------|:----------:|
| `POST` | `/api/auth/login` | Sign in (customer or pro via `user_type`) | ✅ |
| `POST` | `/api/auth/signup` | Sign up (customer or pro via `user_type`) | ✅ |
| `POST` | `/api/auth/logout` | Sign out (clears auth cookie) | ✅ |
| `GET`  | `/api/auth/me` | Get current authenticated user from cookie | ✅ |
| `POST` | `/api/auth/check-email` | Check if email is already registered | ✅ |
| `POST` | `/api/auth/check-phone` | Check if phone is already registered | ✅ |
| `POST` | `/api/auth/security-questions` | Get a user's security questions for reset | ✅ |
| `POST` | `/api/auth/forgot-password` | Verify security question answers | ✅ |
| `POST` | `/api/auth/forgot-password/send-code` | Send password reset code via email | ✅ |
| `POST` | `/api/auth/forgot-password/verify-code` | Verify the emailed reset code | ✅ |
| `POST` | `/api/auth/forgot-password/reset` | Set new password after verification | ✅ |

### Scouts

| Method | Endpoint | Description | Used by FE |
|--------|----------|-------------|:----------:|
| `GET`  | `/api/scouts` | List/filter scouts (supports `sort_by`, `limit`, `id`, `is_verified`, etc.) | ✅ |
| `GET`  | `/api/scouts/{scout_id}` | Get single scout by ID | ❌ (FE uses filter with `?id=`) |
| `POST` | `/api/scouts` | Create a new scout profile | ✅ |
| `PUT`  | `/api/scouts/{scout_id}` | Update a scout profile | ✅ |

### Booking Requests

| Method | Endpoint | Description | Used by FE |
|--------|----------|-------------|:----------:|
| `GET`  | `/api/bookings` | List/filter bookings (`requester_email`, `scout_id`, `customer_id`, `status`) | ✅ |
| `GET`  | `/api/bookings/{booking_id}` | Get single booking by ID | ❌ (FE uses filter) |
| `POST` | `/api/bookings` | Create a new booking request | ✅ |
| `PUT`  | `/api/bookings/{booking_id}` | Update a booking | ✅ |
| `DELETE`| `/api/bookings/{booking_id}` | Delete a booking | ❌ |

### Customer Accounts

| Method | Endpoint | Description | Used by FE |
|--------|----------|-------------|:----------:|
| `GET`  | `/api/customers` | List/filter customers (`email`, `is_verified`) | ✅ |
| `POST` | `/api/customers` | Create a customer record | ❌ (FE uses `/api/auth/signup`) |
| `PUT`  | `/api/customers/{customer_id}` | Update a customer profile | ✅ |

### Pro Accounts

| Method | Endpoint | Description | Used by FE |
|--------|----------|-------------|:----------:|
| `GET`  | `/api/pros` | List/filter pro accounts (`email`, `is_verified`) | ✅ |
| `POST` | `/api/pros` | Create a pro account record | ✅ |
| `PUT`  | `/api/pros/{pro_id}` | Update a pro account | ✅ |

### Legacy Tasker Endpoints

| Method | Endpoint | Description | Used by FE |
|--------|----------|-------------|:----------:|
| `GET`  | `/api/taskers` | List taskers (sorting, limit) | ❌ |
| `GET`  | `/api/taskers/{tasker_id}` | Get tasker by ID | ❌ |
| `GET`  | `/api/taskers/category/{category}` | Get taskers by category | ❌ |

> These are leftover from the original codebase. The FE now uses `/api/scouts` instead.

### Utility

| Method | Endpoint | Description | Used by FE |
|--------|----------|-------------|:----------:|
| `GET`  | `/api/health` | Health check | ❌ |

### Not Yet Implemented (FE expects these)

| Method | Endpoint | FE calls it from |
|--------|----------|------------------|
| `POST` | `/api/upload` | ScoutOnboarding, ProfileForm (file uploads) |
| `POST` | `/api/email/send` | ScoutOnboarding, ProfileForm (send email) |
| `POST` | `/api/logs/page-view` | NavigationTracker (page analytics) |
| `GET/POST` | `/api/messages` | BookingChat (chat messages) |
| `POST` | `/api/auth/customer/send-verification` | CustomerSignup (email verification) |

## Authentication

Authentication uses two user types: **customer** and **pro**.

1. On login or signup, a JWT token is generated
2. The token is stored in an HTTP-only cookie (`access_token`)
3. The cookie is automatically sent with subsequent requests via `credentials: "include"`
4. Tokens expire after 30 minutes
5. Password reset supports two flows: **security questions** and **email code verification**

Both user types share the same auth endpoints and are distinguished by the `user_type` field in the request body.

## Data Storage

Data is stored in JSON files under `/data/`:

| File | Contents |
|------|----------|
| `users.json` | Unified user store (customers + pros) with hashed passwords |
| `taskers.json` | Pro/tasker profiles (legacy — duplicates some user data) |
| `Scout.json` | Scout profiles (public-facing) |
| `BookingRequest.json` | Booking requests between customers and scouts |
| `CustomerAccount.json` | Legacy customer data (migrated to users.json) |
| `ProAccount.json` | Legacy pro data (migrated to users.json) |

> ⚠️ JSON file storage is for development only. A real database (PostgreSQL, etc.) is required for production.

## CORS Configuration

The API allows requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (React dev server)
- `http://localhost:5174` (Alternative dev port)

Update these in `app/main.py` when deploying to a production domain.

## Environment Variables

Create a `.env` file in the `be/` directory (see `env.example`):

```
# Security (REQUIRED in production — generate with: python -c "import secrets; print(secrets.token_hex(32))")
SECRET_KEY=your-secret-key-here

# Set to "production" when deploying (enables secure cookies, requires HTTPS)
ENVIRONMENT=development

# Comma-separated allowed frontend origins for CORS
# CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# SMTP for password reset & verification emails
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

If SMTP is not configured, reset codes are printed to the server console instead of emailed.

## Architecture

- **Framework**: FastAPI
- **Server**: Uvicorn
- **Authentication**: JWT tokens in HTTP-only cookies (PyJWT)
- **Password Hashing**: bcrypt
- **Data Validation**: Pydantic models
- **Frontend**: React + Vite (in `fe-2/`), communicates via `fetch` with `credentials: "include"`
