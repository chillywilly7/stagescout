from fastapi import FastAPI, HTTPException, Response, Cookie, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict
import json
import os
import traceback
import jwt
import bcrypt
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

# Configuration
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/taskers.json")
RESET_CODE_EXPIRE_MINUTES = 15

# Email configuration (set these environment variables for production)
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "noreply@stagescout.com")

# In-memory store for password reset codes (in production, use Redis or database)
password_reset_codes: Dict[str, dict] = {}

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

class SendResetCodeRequest(BaseModel):
    email: str

class VerifyResetCodeRequest(BaseModel):
    email: str
    code: str

class ResetPasswordWithCodeRequest(BaseModel):
    email: str
    code: str
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

def generate_reset_code() -> str:
    """Generate a 6-digit reset code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

def send_reset_email(email: str, code: str, user_name: str) -> bool:
    """Send password reset email with the code"""
    try:
        # Check if SMTP is configured
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            # Development mode - print to console instead of sending
            print("=" * 50)
            print(f"PASSWORD RESET CODE (Development Mode)")
            print(f"Email: {email}")
            print(f"Name: {user_name}")
            print(f"Reset Code: {code}")
            print(f"This code expires in {RESET_CODE_EXPIRE_MINUTES} minutes")
            print("=" * 50)
            return True
        
        # Production mode - send actual email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'StageScout - Password Reset Code'
        msg['From'] = SMTP_FROM_EMAIL
        msg['To'] = email
        
        # Plain text version
        text = f"""
Hello {user_name},

You requested to reset your password for StageScout.

Your password reset code is: {code}

This code will expire in {RESET_CODE_EXPIRE_MINUTES} minutes.

If you did not request this password reset, please ignore this email.

Best regards,
The StageScout Team
        """
        
        # HTML version
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">StageScout</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
                <h2 style="color: #333;">Password Reset Request</h2>
                <p style="color: #666;">Hello {user_name},</p>
                <p style="color: #666;">You requested to reset your password. Use the code below to complete the process:</p>
                <div style="text-align: center; padding: 20px;">
                    <div style="background: #1e293b; color: white; font-size: 32px; letter-spacing: 8px; padding: 20px 40px; border-radius: 10px; display: inline-block;">
                        {code}
                    </div>
                </div>
                <p style="color: #999; font-size: 14px;">This code will expire in {RESET_CODE_EXPIRE_MINUTES} minutes.</p>
                <p style="color: #999; font-size: 14px;">If you did not request this password reset, please ignore this email.</p>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #1e293b;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2024 StageScout. All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(text, 'plain'))
        msg.attach(MIMEText(html, 'html'))
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"Reset email sent to {email}")
        return True
        
    except Exception as e:
        print(f"Error sending email: {e}")
        traceback.print_exc()
        return False

def store_reset_code(email: str, code: str):
    """Store reset code with expiration"""
    password_reset_codes[email.lower()] = {
        'code': code,
        'expires': datetime.utcnow() + timedelta(minutes=RESET_CODE_EXPIRE_MINUTES),
        'attempts': 0
    }

def verify_reset_code(email: str, code: str) -> Tuple[bool, str]:
    """Verify reset code for email"""
    email_lower = email.lower()
    
    if email_lower not in password_reset_codes:
        return False, "No reset code found. Please request a new one."
    
    stored = password_reset_codes[email_lower]
    
    # Check if expired
    if datetime.utcnow() > stored['expires']:
        del password_reset_codes[email_lower]
        return False, "Reset code has expired. Please request a new one."
    
    # Check attempts (max 5)
    if stored['attempts'] >= 5:
        del password_reset_codes[email_lower]
        return False, "Too many failed attempts. Please request a new code."
    
    # Verify code
    if stored['code'] != code:
        stored['attempts'] += 1
        return False, f"Invalid code. {5 - stored['attempts']} attempts remaining."
    
    return True, "Code verified"

def clear_reset_code(email: str):
    """Remove reset code after successful password reset"""
    email_lower = email.lower()
    if email_lower in password_reset_codes:
        del password_reset_codes[email_lower]

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

# Data file paths
CUSTOMER_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/CustomerAccount_export.csv")
PRO_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/ProAccount_export.csv")

def load_customers():
    """Load customers from CSV file"""
    import csv
    customers = []
    try:
        with open(CUSTOMER_DATA_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                customers.append(row)
        return customers
    except FileNotFoundError:
        return []

def save_customers(customers):
    """Save customers to CSV file"""
    import csv
    if not customers:
        return
    fieldnames = customers[0].keys()
    with open(CUSTOMER_DATA_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(customers)

# Routes
@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.post("/api/auth/customer/login")
async def customer_login(request: LoginRequest, response: Response):
    """Customer sign in endpoint"""
    try:
        customers = load_customers()
        
        # Find customer by email
        customer = next((c for c in customers if c['email'] == request.email), None)
        
        if not customer:
            raise HTTPException(status_code=401, detail="Account not found. Please sign up first.")
        
        # Check if verified
        if customer.get('is_verified', '').lower() != 'true':
            raise HTTPException(status_code=401, detail="Account not verified. Please verify your email first.")
        
        # Check password
        if customer.get('password') != request.password:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create token
        customer_id = customer.get('id', customer.get('email'))
        access_token = create_access_token(customer_id, customer['email'])
        
        # Set HTTP-only secure cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        
        return {
            "message": "Login successful",
            "user": {
                "id": customer_id,
                "name": customer.get('name', ''),
                "email": customer['email'],
                "phone": customer.get('phone', ''),
                "full_name": customer.get('name', ''),
                "user_type": "customer"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Customer login error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/customers")
async def list_customers(email: Optional[str] = None, is_verified: Optional[str] = None):
    """Get list of customers with optional filtering"""
    customers = load_customers()
    
    # Apply filters
    if email:
        customers = [c for c in customers if c.get('email') == email]
    if is_verified:
        customers = [c for c in customers if c.get('is_verified', '').lower() == is_verified.lower()]
    
    # Remove sensitive fields
    for customer in customers:
        customer.pop('password', None)
        customer.pop('verification_code', None)
    
    return {"customers": customers}

@app.post("/api/customers")
async def create_customer(data: dict):
    """Create a new customer account"""
    customers = load_customers()
    
    # Check if email already exists
    existing = next((c for c in customers if c.get('email') == data.get('email')), None)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Generate ID and verification code
    import uuid
    import random
    new_customer = {
        "id": str(uuid.uuid4())[:24],
        "email": data.get('email'),
        "password": data.get('password'),
        "name": data.get('name', ''),
        "phone": data.get('phone', ''),
        "preferences": data.get('preferences', ''),
        "verification_code": str(random.randint(100000, 999999)),
        "is_verified": "false",
        "created_date": datetime.utcnow().isoformat(),
        "updated_date": datetime.utcnow().isoformat(),
        "created_by_id": "",
        "created_by": data.get('email'),
        "is_sample": "false"
    }
    
    customers.append(new_customer)
    save_customers(customers)
    
    # Return without sensitive data
    return_customer = {k: v for k, v in new_customer.items() if k not in ['password', 'verification_code']}
    return {"customer": return_customer, "message": "Account created successfully"}

@app.put("/api/customers/{customer_id}")
async def update_customer(customer_id: str, data: dict):
    """Update a customer account"""
    customers = load_customers()
    
    customer_idx = next((i for i, c in enumerate(customers) if c.get('id') == customer_id), None)
    if customer_idx is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update fields
    for key, value in data.items():
        if key not in ['id', 'created_date', 'created_by_id', 'created_by']:
            customers[customer_idx][key] = value
    
    customers[customer_idx]['updated_date'] = datetime.utcnow().isoformat()
    save_customers(customers)
    
    return {"message": "Customer updated successfully"}

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

@app.post("/api/auth/forgot-password/send-code")
async def send_password_reset_code(request: SendResetCodeRequest):
    """Send password reset code to user's email"""
    taskers = load_taskers()
    tasker = next((t for t in taskers if t['email'].lower() == request.email.lower()), None)
    
    if not tasker:
        # Don't reveal if email exists for security
        # But still return success to prevent email enumeration
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
    # Generate and store reset code
    code = generate_reset_code()
    store_reset_code(request.email, code)
    
    # Send email
    if not send_reset_email(request.email, code, tasker['name']):
        raise HTTPException(status_code=500, detail="Failed to send reset email. Please try again later.")
    
    return {"message": "Reset code sent to your email", "email": request.email}

@app.post("/api/auth/forgot-password/verify-code")
async def verify_password_reset_code(request: VerifyResetCodeRequest):
    """Verify the password reset code"""
    is_valid, message = verify_reset_code(request.email, request.code)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    return {"message": "Code verified successfully", "valid": True}

@app.post("/api/auth/forgot-password/reset")
async def reset_password_with_code(request: ResetPasswordWithCodeRequest):
    """Reset password using the verified code"""
    # Verify code first
    is_valid, message = verify_reset_code(request.email, request.code)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Validate new password
    is_valid_password, password_error = validate_password(request.new_password)
    if not is_valid_password:
        raise HTTPException(status_code=400, detail=password_error)
    
    # Find user and update password
    taskers = load_taskers()
    tasker = next((t for t in taskers if t['email'].lower() == request.email.lower()), None)
    
    if not tasker:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash and update password
    tasker['password'] = bcrypt.hashpw(request.new_password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Save updated taskers
    if not save_taskers(taskers):
        raise HTTPException(status_code=500, detail="Failed to update password")
    
    # Clear the reset code
    clear_reset_code(request.email)
    
    return {"message": "Password has been reset successfully"}

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


# Scout Data File
SCOUT_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/Scout_export.csv")

def load_scouts():
    """Load scouts from CSV file"""
    import csv
    import ast
    scouts = []
    try:
        with open(SCOUT_DATA_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Parse JSON-like array fields
                for field in ['services', 'portfolio_images', 'gear_highlights', 'style_tags', 'venue_types', 'availability_dates']:
                    if row.get(field):
                        try:
                            row[field] = ast.literal_eval(row[field])
                        except:
                            row[field] = []
                    else:
                        row[field] = []
                
                # Convert boolean strings
                for field in ['is_verified', 'available_last_minute', 'is_austin_based']:
                    if row.get(field):
                        row[field] = row[field].lower() == 'true'
                    else:
                        row[field] = False
                
                # Convert numeric fields
                for field in ['budget_min', 'budget_max', 'turnaround_days', 'sxsw_years', 'rating', 'review_count']:
                    if row.get(field) and row[field] != '':
                        try:
                            row[field] = float(row[field]) if '.' in str(row[field]) else int(row[field])
                        except:
                            row[field] = None
                    else:
                        row[field] = None
                
                scouts.append(row)
        return scouts
    except FileNotFoundError:
        return []

@app.get("/api/scouts")
async def list_scouts(
    sort_by: str = "sxsw_years",
    limit: int = 10,
    is_verified: Optional[str] = None,
    services: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None
):
    """Get list of scouts with optional sorting and filtering"""
    scouts = load_scouts()
    
    # Apply filters
    if is_verified is not None:
        verified = is_verified.lower() == 'true'
        scouts = [s for s in scouts if s.get('is_verified') == verified]
    
    if services:
        scouts = [s for s in scouts if services in s.get('services', [])]
    
    if location:
        scouts = [s for s in scouts if s.get('location') == location]
    
    if experience_level:
        scouts = [s for s in scouts if s.get('experience_level') == experience_level]
    
    # Sort scouts
    if sort_by == "sxsw_years":
        scouts.sort(key=lambda x: x.get('sxsw_years') or 0, reverse=True)
    elif sort_by == "budget_min":
        scouts.sort(key=lambda x: x.get('budget_min') or 0)
    elif sort_by == "rating":
        scouts.sort(key=lambda x: x.get('rating') or 0, reverse=True)
    elif sort_by == "name":
        scouts.sort(key=lambda x: x.get('name', ''))
    
    return {"scouts": scouts[:limit]}

@app.get("/api/scouts/{scout_id}")
async def get_scout(scout_id: str):
    """Get single scout by ID"""
    scouts = load_scouts()
    scout = next((s for s in scouts if s.get('id') == scout_id), None)
    
    if not scout:
        raise HTTPException(status_code=404, detail="Scout not found")
    
    return scout
