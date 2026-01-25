# FastAPI Backend Setup & Testing Guide

## Quick Start

### 1. Install Python Dependencies

```bash
cd /Users/DanielGtz/Desktop/Coder/stagescout/fe
pip install -r requirements.txt
```

### 2. Start the FastAPI Server

```bash
# Make the script executable (macOS/Linux)
chmod +x run_server.sh

# Run the server
./run_server.sh
```

Or directly:
```bash
cd /Users/DanielGtz/Desktop/Coder/stagescout/fe
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at **http://localhost:8000**

### 3. View API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 4. Test the API

You can test the API using:
- Swagger UI at http://localhost:8000/docs (interactive)
- curl commands
- Postman or Insomnia

#### Example: Get Test Users
```bash
curl http://localhost:8000/api/test-users
```

#### Example: Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alex@example.com","password":"password"}' \
  -c cookies.txt
```

#### Example: List Taskers
```bash
curl http://localhost:8000/api/taskers?sort_by=average_rating&limit=10 \
  -b cookies.txt
```

## Test Users

All test users have password: **`password`**

| Email | Name | Role | Rating |
|-------|------|------|--------|
| alex@example.com | Alex Johnson | DJ | 4.8★ |
| maria@example.com | Maria Rodriguez | Photographer | 4.9★ |
| david@example.com | David Chen | Lighting | 4.7★ |
| emma@example.com | Emma Thompson | Live Music | 4.9★ |
| james@example.com | James Wilson | Audio Rental | 4.6★ |
| sarah@example.com | Sarah Miller | DJ | 4.8★ |

## Frontend Integration

The React frontend in `/be` folder is already configured to:
1. Use the new FastAPI backend endpoints
2. Handle HTTP-only cookie authentication
3. Display a login modal when "Sign In" is clicked
4. Show test users for easy development

### Key Components:
- **API Client**: `/be/src/api/base44Client.js` - Updated to call FastAPI endpoints
- **Login Modal**: `/be/src/components/LoginModal.jsx` - New component for user login
- **Layout Component**: `/be/src/layout/Layout.jsx` - Updated to use login modal

## Authentication Flow

1. User clicks "Sign In" button
2. LoginModal component opens
3. User enters email and password (or selects a test user)
4. API validates credentials and returns JWT token
5. Token is stored in HTTP-only cookie
6. Cookie is automatically included in all subsequent API requests
7. User state is updated and displayed in the UI

## Important Notes

- **HTTP-Only Cookies**: Auth tokens are stored in secure HTTP-only cookies and cannot be accessed by JavaScript, protecting against XSS attacks
- **CORS Enabled**: The API accepts requests from localhost development servers
- **Mock Data**: Currently using JSON files for storage. In production, replace with a proper database
- **Password Security**: For proof of concept, all test passwords are "password". In production, implement proper password hashing

## Troubleshooting

### Port 8000 Already in Use
If port 8000 is already in use, you can specify a different port:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

Then update the API base URL in `/be/src/api/base44Client.js`

### CORS Errors
Make sure the frontend is running on one of the allowed origins:
- http://localhost:5173 (Vite)
- http://localhost:3000 (React)
- http://localhost:5174 (Alternative)

### Cookie Not Being Set
Ensure:
1. Frontend is making requests with `credentials: 'include'`
2. Backend is running on localhost (not 127.0.0.1)
3. Browser is not in private/incognito mode

## Next Steps

Once this is working, you can:
1. Implement booking endpoints
2. Add messaging functionality
3. Create review system
4. Implement payment integration
5. Add database persistence (SQLite, PostgreSQL, etc.)
