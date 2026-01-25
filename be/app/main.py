from fastapi import FastAPI, HTTPException, Response, Cookie, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, Tuple
import json
import os
import traceback
import jwt
import bcrypt

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/taskers.json")

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

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str
    security_question_1: str
    security_answer_1: str
    security_question_2: str
    security_answer_2: str

class CheckEmailRequest(BaseModel):
    email: str

class CheckPhoneRequest(BaseModel):
    phone: str

class ForgotPasswordRequest(BaseModel):
    email: str
    security_answer_1: str
    security_answer_2: str
    new_password: str

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
def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password according to industry standards.
    Returns: (is_valid, error_message)
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    import re
    
    errors = []
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    
    if not re.search(r'[A-Z]', password):
        errors.append("Password must contain at least one uppercase letter")
    
    if not re.search(r'[a-z]', password):
        errors.append("Password must contain at least one lowercase letter")
    
    if not re.search(r'[0-9]', password):
        errors.append("Password must contain at least one digit")
    
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password):
        errors.append("Password must contain at least one special character (!@#$%^&* etc)")
    
    if errors:
        return False, " | ".join(errors)
    
    return True, ""

def validate_email(email: str) -> Tuple[bool, str]:
    """Validate email format"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        return False, "Invalid email format"
    
    return True, ""

def validate_phone(phone: str) -> Tuple[bool, str]:
    """Validate phone number - accepts 10 digits with optional formatting"""
    import re
    
    # Remove all non-digit characters
    digits_only = re.sub(r'\D', '', phone)
    
    # Must be exactly 10 digits
    if len(digits_only) != 10:
        return False, "Phone number must be exactly 10 digits"
    
    # Check if it's a valid format (digits only, or dashed format)
    valid_formats = [
        r'^\d{10}$',  # 1234567890
        r'^\d{3}-\d{3}-\d{4}$',  # 123-456-7890
    ]
    
    is_valid_format = any(re.match(pattern, phone) for pattern in valid_formats)
    
    if not is_valid_format:
        return False, "Phone must be 10 digits (1234567890) or dashed format (123-456-7890)"
    
    return True, ""

def load_taskers():
    """Load taskers from JSON file"""
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            return data.get('taskers', [])
    except FileNotFoundError:
        return []

def save_taskers(taskers: list) -> bool:
    """Save taskers to JSON file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump({"taskers": taskers}, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving taskers: {e}")
        return False

def generate_tasker_id():
    """Generate a new tasker ID"""
    taskers = load_taskers()
    if not taskers:
        return "task_001"
    ids = [int(t['tasker_id'].split('_')[1]) for t in taskers if 'tasker_id' in t]
    next_id = max(ids) + 1 if ids else 1
    return f"task_{next_id:03d}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hashed password using bcrypt"""
    # Bcrypt has a 72-byte limit, truncate password if necessary
    plain_password = plain_password[:72].encode('utf-8')
    return bcrypt.checkpw(plain_password, hashed_password.encode('utf-8'))

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

@app.post("/api/auth/signup")
async def signup(request: SignupRequest, response: Response):
    """Sign up a new user with validation"""
    taskers = load_taskers()
    
    # Validate email format
    email_valid, email_error = validate_email(request.email)
    if not email_valid:
        raise HTTPException(status_code=400, detail=email_error)
    
    # Check if email already exists (case-insensitive)
    if any(t['email'].lower() == request.email.lower() for t in taskers):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password strength
    password_valid, password_error = validate_password(request.password)
    if not password_valid:
        raise HTTPException(status_code=400, detail=password_error)
    
    # Validate required fields
    if not request.name or len(request.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters")
    
    # Validate phone number
    phone_valid, phone_error = validate_phone(request.phone)
    if not phone_valid:
        raise HTTPException(status_code=400, detail=phone_error)
    
    # Create new tasker
    new_tasker = {
        "tasker_id": generate_tasker_id(),
        "name": request.name,
        "email": request.email,
        "phone": request.phone,
        "password": bcrypt.hashpw(request.password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),  # Hash password with bcrypt (max 72 bytes)
        "auth_token": "",
        "profile_image": f"https://i.pravatar.cc/150?u={request.email}",
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
        "is_verified": False,
        "is_pro": False,
        "security_question_1": request.security_question_1,
        "security_answer_1": request.security_answer_1.lower(),
        "security_question_2": request.security_question_2,
        "security_answer_2": request.security_answer_2.lower()
    }
    
    # Add to taskers list
    taskers.append(new_tasker)
    
    # Save to file
    if not save_taskers(taskers):
        raise HTTPException(status_code=500, detail="Failed to create account")
    
    # Create JWT token
    access_token = create_access_token(new_tasker['tasker_id'], new_tasker['email'])
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {
        "message": "Account created successfully",
        "user": {
            "tasker_id": new_tasker['tasker_id'],
            "name": new_tasker['name'],
            "email": new_tasker['email'],
            "phone": new_tasker['phone'],
            "full_name": new_tasker['name'],
            "is_pro": new_tasker['is_pro']
        }
    }

@app.post("/api/auth/check-email")
async def check_email(request: CheckEmailRequest):
    """Check if email is already registered"""
    if not request.email:
        raise HTTPException(status_code=400, detail="Email required")
    
    taskers = load_taskers()
    exists = any(t['email'].lower() == request.email.lower() for t in taskers)
    
    return {"exists": exists, "email": request.email}

@app.post("/api/auth/check-phone")
async def check_phone(request: CheckPhoneRequest):
    """Check if phone number is already registered"""
    if not request.phone:
        raise HTTPException(status_code=400, detail="Phone required")
    
    # Normalize phone number (remove non-digits)
    import re
    phone_digits = re.sub(r'\D', '', request.phone)
    
    taskers = load_taskers()
    # Check if any tasker has the same phone (comparing digits only)
    exists = any(re.sub(r'\D', '', t.get('phone', '')) == phone_digits for t in taskers)
    
    return {"exists": exists, "phone": request.phone}

@app.post("/api/auth/security-questions")
async def get_security_questions(email: str):
    """Get security questions for password reset"""
    taskers = load_taskers()
    tasker = next((t for t in taskers if t['email'] == email), None)
    
    if not tasker:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "security_question_1": tasker.get('security_question_1', "What is your pet's name?"),
        "security_question_2": tasker.get('security_question_2', "What city were you born in?")
    }

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Reset password using security questions"""
    taskers = load_taskers()
    tasker = next((t for t in taskers if t['email'] == request.email), None)
    
    if not tasker:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify security answers (case-insensitive)
    answer1_correct = request.security_answer_1.lower() == tasker.get('security_answer_1', '').lower()
    answer2_correct = request.security_answer_2.lower() == tasker.get('security_answer_2', '').lower()
    
    if not (answer1_correct and answer2_correct):
        raise HTTPException(status_code=401, detail="Security answers do not match")
    
    # Update password
    tasker['password'] = bcrypt.hashpw(request.new_password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')  # Hash password with bcrypt (max 72 bytes)
    
    # Save updated taskers
    if not save_taskers(taskers):
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    return {"message": "Password updated successfully"}

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
            "password": "password",  # Reference password (for testing)
            "name": tasker['name'],
            "tasker_id": tasker['tasker_id'],
            "note": "Use password: TestPass123! for all test users"
        })
    
    return {"test_users": test_users}
