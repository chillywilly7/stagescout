from fastapi import FastAPI, HTTPException, Response, Cookie, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import json
import os
import traceback
import jwt
from passlib.context import CryptContext

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/taskers.json")

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# FastAPI app
app = FastAPI(title="Rent-A-Speaker API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class LoginRequest(BaseModel):
    email: str
    password: str

class TaskerResponse(BaseModel):
    tasker_id: str
    name: str
    email: str
    phone: str
    profile_image: str
    service_category: str
    bio: str
    hourly_rate: float
    daily_rate: float
    zip_code: str
    service_radius_miles: float
    portfolio_images: list
    equipment_list: list
    average_rating: float
    total_reviews: int
    years_experience: int
    is_verified: bool

class UserResponse(BaseModel):
    tasker_id: str
    name: str
    email: str
    phone: str
    full_name: str

# Helper functions
def load_taskers():
    """Load taskers from JSON file"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            return data.get('taskers', [])
    except FileNotFoundError:
        return []

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """For proof of concept, we'll do simple comparison. In production, use proper hashing."""
    # Since we're using mock tokens, we'll do a simple check
    return plain_password == "password"  # All test users have password "password"

def create_access_token(tasker_id: str, email: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"tasker_id": tasker_id, "email": email, "exp": expire}
    try:
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        # Handle both old (bytes) and new (str) return types
        if isinstance(encoded_jwt, bytes):
            encoded_jwt = encoded_jwt.decode("utf-8")
        return encoded_jwt
    except Exception as e:
        print(f"Error encoding JWT: {e}")
        raise

def verify_token(token: Optional[str] = Cookie(None)) -> Optional[dict]:
    """Verify JWT token from cookie"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Routes
@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/api/auth/login")
async def login(request: LoginRequest, response: Response):
    """Sign in endpoint"""
    try:
        taskers = load_taskers()
        
        # Find tasker by email
        tasker = next((t for t in taskers if t['email'] == request.email), None)
        
        if not tasker:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Simple password verification (in production, verify hashed password)
        if not verify_password(request.password, tasker['password']):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create token
        access_token = create_access_token(tasker['tasker_id'], tasker['email'])
        
        # Set HTTP-only secure cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,  # Set to False for localhost development
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return {
            "message": "Login successful",
            "user": {
                "tasker_id": tasker['tasker_id'],
                "name": tasker['name'],
                "email": tasker['email'],
                "phone": tasker['phone'],
                "full_name": tasker['name'],
                "is_pro": tasker.get('is_pro', False)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout(response: Response):
    """Sign out endpoint - securely clears authentication cookie"""
    # Clear the JWT token cookie with security flags
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,  # Prevents JavaScript access (XSS protection)
        secure=False,  # Set to True in production (HTTPS only)
        samesite="lax"  # CSRF protection
    )
    return {"message": "Logged out successfully"}

@app.get("/api/auth/me")
async def get_current_user(token: Optional[str] = Cookie(None)):
    """Get current authenticated user"""
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        tasker_id = payload.get("tasker_id")
        email = payload.get("email")
        
        if not tasker_id or not email:
            return None
        
        taskers = load_taskers()
        tasker = next((t for t in taskers if t['tasker_id'] == tasker_id), None)
        
        if not tasker:
            return None
        
        return {
            "tasker_id": tasker['tasker_id'],
            "name": tasker['name'],
            "email": tasker['email'],
            "phone": tasker['phone'],
            "full_name": tasker['name'],
            "is_pro": tasker.get('is_pro', False)
        }
    except jwt.InvalidTokenError:
        return None

@app.get("/api/taskers")
async def list_taskers(sort_by: str = "average_rating", limit: int = 10):
    """Get list of taskers with optional sorting"""
    taskers = load_taskers()
    
    # Remove sensitive fields
    for tasker in taskers:
        tasker.pop('password', None)
        tasker.pop('auth_token', None)
    
    # Sort taskers
    if sort_by == "average_rating":
        taskers.sort(key=lambda x: x.get('average_rating', 0), reverse=True)
    elif sort_by == "hourly_rate":
        taskers.sort(key=lambda x: x.get('hourly_rate', 0))
    elif sort_by == "experience":
        taskers.sort(key=lambda x: x.get('years_experience', 0), reverse=True)
    
    return {"taskers": taskers[:limit]}

@app.get("/api/taskers/{tasker_id}")
async def get_tasker(tasker_id: str):
    """Get single tasker by ID"""
    taskers = load_taskers()
    tasker = next((t for t in taskers if t['tasker_id'] == tasker_id), None)
    
    if not tasker:
        raise HTTPException(status_code=404, detail="Tasker not found")
    
    # Remove sensitive fields
    tasker.pop('password', None)
    tasker.pop('auth_token', None)
    
    return tasker

@app.get("/api/taskers/category/{category}")
async def get_taskers_by_category(category: str, limit: int = 10):
    """Get taskers by service category"""
    taskers = load_taskers()
    filtered = [t for t in taskers if t['service_category'] == category]
    
    # Remove sensitive fields
    for tasker in filtered:
        tasker.pop('password', None)
        tasker.pop('auth_token', None)
    
    return {"taskers": filtered[:limit]}

@app.get("/api/test-users")
async def get_test_users():
    """Get list of test users and their credentials for development"""
    taskers = load_taskers()
    test_users = []
    
    for tasker in taskers:
        test_users.append({
            "email": tasker['email'],
            "password": "password",  # All test users have this password
            "name": tasker['name'],
            "tasker_id": tasker['tasker_id']
        })
    
    return {"test_users": test_users}
