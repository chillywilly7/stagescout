# Rent-A-Speaker FastAPI Backend

This is the Python FastAPI backend for the Rent-A-Speaker application.

## Setup

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
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
- `POST /api/auth/login` - Sign in with email and password
- `POST /api/auth/logout` - Sign out (clears auth cookie)
- `GET /api/auth/me` - Get current authenticated user

### Taskers
- `GET /api/taskers` - List all taskers (with sorting and limit)
- `GET /api/taskers/{tasker_id}` - Get single tasker by ID
- `GET /api/taskers/category/{category}` - Get taskers by service category

### Development
- `GET /api/test-users` - Get list of test users and their credentials
- `GET /api/health` - Health check endpoint

## Test Users

All test users have the password: `password`

Available test users:
- alex@example.com - DJ
- maria@example.com - Photographer
- david@example.com - Lighting
- emma@example.com - Live Music
- james@example.com - Audio Rental
- sarah@example.com - DJ

## Authentication

Authentication is handled via HTTP-only secure cookies. When a user logs in:
1. A JWT token is generated
2. The token is stored in an HTTP-only cookie (cannot be accessed by JavaScript)
3. The cookie is automatically sent with all requests
4. Token expires after 30 minutes of inactivity

## Data Storage

For proof of concept, data is stored in:
- `/data/taskers.json` - Mock tasker database

## CORS Configuration

The API allows requests from:
- http://localhost:5173 (Vite dev server)
- http://localhost:3000 (React dev server)
- http://localhost:5174 (Alternative dev port)

## Environment Variables

Create a `.env` file if needed (optional for development):
```
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## Architecture

- **Framework**: FastAPI
- **Server**: Uvicorn
- **Authentication**: JWT tokens in HTTP-only cookies
- **Password Hashing**: Passlib with bcrypt (for future)
- **Data Validation**: Pydantic models
