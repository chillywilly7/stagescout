from fastapi import FastAPI, HTTPException, Response, Cookie, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
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

# Import data layer for database/JSON abstraction
try:
    from . import data_layer
except ImportError:
    import data_layer

# Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # "development" or "production"
IS_PRODUCTION = ENVIRONMENT.lower() == "production"

_secret_from_env = os.getenv("SECRET_KEY")
if not _secret_from_env and IS_PRODUCTION:
    raise RuntimeError("SECRET_KEY environment variable is required in production")
if not _secret_from_env:
    _secret_from_env = secrets.token_hex(32)  # random 256-bit key for dev
    print("\n⚠️  WARNING: No SECRET_KEY set — using a random key. Sessions won't survive restarts.")
    print("   Set SECRET_KEY in your .env file for stable development sessions.\n")

SECRET_KEY = _secret_from_env
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
# Data file paths
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
_default_origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174"]
_env_origins = os.getenv("CORS_ORIGINS", "")  # comma-separated list for production
ALLOWED_ORIGINS = [o.strip() for o in _env_origins.split(",") if o.strip()] if _env_origins else _default_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class LoginRequest(BaseModel):
    email: str
    password: str
    user_type: str = "pro"  # 'customer' or 'pro'

class SignupRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""
    user_type: str = "pro"  # 'customer' or 'pro'
    security_question_1: str = ""
    security_answer_1: str = ""
    security_question_2: str = ""
    security_answer_2: str = ""

class CheckEmailRequest(BaseModel):
    email: str
    user_type: str = "pro"  # 'customer' or 'pro'

class CheckPhoneRequest(BaseModel):
    phone: str
    user_type: str = "pro"  # 'customer' or 'pro'

class CheckNameRequest(BaseModel):
    name: str
    user_type: str = "pro"  # For pro accounts, check Scout name availability

class SecurityQuestionsRequest(BaseModel):
    email: str
    user_type: str = "pro"

class ForgotPasswordRequest(BaseModel):
    email: str
    security_answer_1: str
    security_answer_2: str
    new_password: Optional[str] = None  # Optional - only used if resetting in one step
    user_type: str = "pro"

class SendResetCodeRequest(BaseModel):
    email: str
    user_type: str = "pro"

class VerifyResetCodeRequest(BaseModel):
    email: str
    code: str
    user_type: str = "pro"

class ResetPasswordWithCodeRequest(BaseModel):
    email: str
    new_password: str
    user_type: str = "pro"

class CustomerSignupRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: str = ""

class CustomerVerifyRequest(BaseModel):
    email: str
    code: str

class ProSignupRequest(BaseModel):
    email: str
    password: str
    name: str = ""
    phone: str = ""
    security_question_1: str = "What is your pet's name?"
    security_answer_1: str = ""
    security_question_2: str = "What city were you born in?"
    security_answer_2: str = ""

class SendVerificationCodeRequest(BaseModel):
    email: str
    name: str = ""
    user_type: str = "customer"  # 'customer' or 'pro'

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
    """
    Validate email format with industry-standard (FAANG-level) checks.
    Returns: (is_valid, error_message)
    
    Checks:
    - No whitespace (spaces, tabs, newlines)
    - Valid format (RFC 5322 simplified)
    - Length limits (local part <= 64, domain <= 255, total <= 320)
    - No consecutive dots
    - No leading/trailing dots in local part
    - Valid TLD (at least 2 chars)
    - Blocks common disposable email domains
    """
    import re
    
    if not email:
        return False, "Email is required"
    
    # Strip and check for any whitespace characters (spaces, tabs, newlines)
    if email != email.strip():
        return False, "Email cannot have leading or trailing whitespace"
    
    if re.search(r'\s', email):
        return False, "Email cannot contain spaces or whitespace characters"
    
    # Length checks per RFC 5321
    if len(email) > 320:
        return False, "Email address is too long (max 320 characters)"
    
    # Must have exactly one @
    if email.count('@') != 1:
        return False, "Email must contain exactly one @ symbol"
    
    local_part, domain = email.rsplit('@', 1)
    
    # Local part validations
    if not local_part:
        return False, "Email local part (before @) cannot be empty"
    
    if len(local_part) > 64:
        return False, "Email local part is too long (max 64 characters)"
    
    if local_part.startswith('.') or local_part.endswith('.'):
        return False, "Email cannot start or end with a dot before @"
    
    if '..' in local_part:
        return False, "Email cannot contain consecutive dots"
    
    # Domain validations
    if not domain:
        return False, "Email domain (after @) cannot be empty"
    
    if len(domain) > 255:
        return False, "Email domain is too long (max 255 characters)"
    
    if domain.startswith('.') or domain.endswith('.'):
        return False, "Email domain cannot start or end with a dot"
    
    if domain.startswith('-') or domain.endswith('-'):
        return False, "Email domain cannot start or end with a hyphen"
    
    if '..' in domain:
        return False, "Email domain cannot contain consecutive dots"
    
    # Must have at least one dot in domain (for TLD)
    if '.' not in domain:
        return False, "Email must have a valid domain with TLD (e.g., .com, .org)"
    
    # TLD must be at least 2 characters
    tld = domain.rsplit('.', 1)[-1]
    if len(tld) < 2:
        return False, "Email TLD must be at least 2 characters"
    
    # TLD should only contain letters
    if not tld.isalpha():
        return False, "Email TLD must contain only letters"
    
    # Comprehensive regex pattern for valid characters
    # Local part: alphanumeric, dots, hyphens, underscores, plus signs
    # Domain: alphanumeric, dots, hyphens
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(pattern, email):
        return False, "Email contains invalid characters"
    
    # Block common disposable/temporary email domains
    disposable_domains = [
        'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
        '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
        'maildrop.cc', 'yopmail.com', 'sharklasers.com', 'getnada.com'
    ]
    
    if domain.lower() in disposable_domains:
        return False, "Disposable email addresses are not allowed"
    
    return True, ""

def validate_phone(phone: str) -> Tuple[bool, str]:
    """
    Validate phone number with industry-standard (FAANG-level) checks.
    Returns: (is_valid, error_message)
    
    Accepts US phone numbers in various formats:
    - 10 digits: 5125551234
    - With dashes: 512-555-1234
    - With dots: 512.555.1234
    - With spaces: 512 555 1234
    - Parentheses: (512) 555-1234
    - With country code: +1 512-555-1234, 1-512-555-1234
    
    Checks:
    - Extracts exactly 10 digits (or 11 with leading 1)
    - Valid US area code (cannot start with 0 or 1)
    - Valid exchange code (cannot start with 0 or 1)
    - Not a fake/reserved number (555-01XX)
    """
    import re
    
    if not phone:
        return False, "Phone number is required"
    
    # Strip whitespace
    phone = phone.strip()
    
    if not phone:
        return False, "Phone number is required"
    
    # Remove all non-digit characters except leading +
    cleaned = re.sub(r'[^\d+]', '', phone)
    
    # Handle country code
    if cleaned.startswith('+1'):
        cleaned = cleaned[2:]
    elif cleaned.startswith('+'):
        return False, "Only US phone numbers (+1) are supported"
    elif cleaned.startswith('1') and len(cleaned) == 11:
        cleaned = cleaned[1:]
    
    # Must be exactly 10 digits now
    if len(cleaned) != 10:
        return False, "Phone number must be exactly 10 digits (US format)"
    
    # Must be all digits
    if not cleaned.isdigit():
        return False, "Phone number must contain only digits"
    
    area_code = cleaned[:3]
    exchange = cleaned[3:6]
    subscriber = cleaned[6:]
    
    # Area code validation (NPA)
    # - Cannot start with 0 or 1
    # - Second digit cannot be 9 (reserved for future use)
    if area_code[0] in '01':
        return False, "Invalid area code: cannot start with 0 or 1"
    
    # Exchange validation (NXX)
    # - Cannot start with 0 or 1
    if exchange[0] in '01':
        return False, "Invalid phone number format"
    
    # Block fake 555 numbers (555-0100 to 555-0199 are reserved for fiction)
    if exchange == '555' and subscriber.startswith('01'):
        return False, "This appears to be a fictional phone number"
    
    # Block obvious fake patterns
    fake_patterns = [
        '0000000000', '1111111111', '2222222222', '3333333333',
        '4444444444', '5555555555', '6666666666', '7777777777',
        '8888888888', '9999999999', '1234567890', '0123456789'
    ]
    
    if cleaned in fake_patterns:
        return False, "Please enter a valid phone number"
    
    return True, ""


def normalize_phone(phone: str) -> str:
    """
    Normalize phone number to standard 10-digit format.
    Returns empty string if invalid.
    """
    import re
    
    if not phone:
        return ""
    
    # Remove all non-digit characters
    cleaned = re.sub(r'\D', '', phone)
    
    # Handle country code
    if cleaned.startswith('1') and len(cleaned) == 11:
        cleaned = cleaned[1:]
    
    if len(cleaned) == 10:
        return cleaned
    
    return ""

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
        msg['Subject'] = 'StagePros - Password Reset Code'
        msg['From'] = SMTP_FROM_EMAIL
        msg['To'] = email
        
        # Plain text version
        text = f"""
Hello {user_name},

You requested to reset your password for StagePros.

Your password reset code is: {code}

This code will expire in {RESET_CODE_EXPIRE_MINUTES} minutes.

If you did not request this password reset, please ignore this email.

Best regards,
The StagePros Team
        """
        
        # HTML version
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">StagePros</h1>
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
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 StagePros. All rights reserved.</p>
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

def verify_token(token: Optional[str] = Cookie(None, alias="access_token")) -> dict:
    """Verify JWT token from cookie. Use as Depends(verify_token) to protect routes."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def set_auth_cookie(response: Response, token: str):
    """Set the auth cookie with environment-appropriate security settings."""
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=IS_PRODUCTION,           # True in production (requires HTTPS)
        samesite="lax" if not IS_PRODUCTION else "none",
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )



# In-memory store for verification codes (email verification, not password reset)
verification_codes: Dict[str, dict] = {}

def generate_verification_code() -> str:
    """Generate a 6-digit verification code"""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

def store_verification_code(email: str, code: str, user_type: str = "customer"):
    """Store verification code with expiration"""
    verification_codes[email.lower()] = {
        'code': code,
        'user_type': user_type,
        'expires': datetime.utcnow() + timedelta(minutes=15),
        'attempts': 0
    }

def verify_verification_code(email: str, code: str) -> Tuple[bool, str]:
    """Verify email verification code"""
    email_lower = email.lower()
    
    if email_lower not in verification_codes:
        return False, "No verification code found. Please request a new one."
    
    stored = verification_codes[email_lower]
    
    if datetime.utcnow() > stored['expires']:
        del verification_codes[email_lower]
        return False, "Verification code has expired. Please request a new one."
    
    if stored['attempts'] >= 5:
        del verification_codes[email_lower]
        return False, "Too many failed attempts. Please request a new code."
    
    if stored['code'] != code:
        stored['attempts'] += 1
        return False, f"Invalid code. {5 - stored['attempts']} attempts remaining."
    
    return True, "Code verified"

def clear_verification_code(email: str):
    """Remove verification code after successful verification"""
    email_lower = email.lower()
    if email_lower in verification_codes:
        del verification_codes[email_lower]

def send_verification_email(email: str, code: str, user_name: str, user_type: str = "customer") -> bool:
    """Send email verification code"""
    try:
        # Check if SMTP is configured
        if not SMTP_USERNAME or not SMTP_PASSWORD:
            # Development mode - print to console instead of sending
            print("=" * 50)
            print(f"EMAIL VERIFICATION CODE (Development Mode)")
            print(f"Email: {email}")
            print(f"Name: {user_name}")
            print(f"User Type: {user_type}")
            print(f"Verification Code: {code}")
            print(f"This code expires in 15 minutes")
            print("=" * 50)
            return True
        
        # Production mode - send actual email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'StagePros - Email Verification Code'
        msg['From'] = SMTP_FROM_EMAIL
        msg['To'] = email
        
        account_type = "Customer" if user_type == "customer" else "Stage Pro"
        
        # Plain text version
        text = f"""
Hello {user_name},

Welcome to StagePros! Please verify your email to complete your {account_type} registration.

Your verification code is: {code}

This code will expire in 15 minutes.

If you did not create an account, please ignore this email.

Best regards,
The StagePros Team
        """
        
        # HTML version
        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #E85D04 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">StagePros</h1>
            </div>
            <div style="padding: 30px; background-color: #f8f9fa;">
                <h2 style="color: #333;">Welcome to StagePros!</h2>
                <p style="color: #666;">Hello {user_name},</p>
                <p style="color: #666;">Please verify your email to complete your {account_type} registration:</p>
                <div style="text-align: center; padding: 20px;">
                    <div style="background: #1e293b; color: white; font-size: 32px; letter-spacing: 8px; padding: 20px 40px; border-radius: 10px; display: inline-block;">
                        {code}
                    </div>
                </div>
                <p style="color: #999; font-size: 14px;">This code will expire in 15 minutes.</p>
                <p style="color: #999; font-size: 14px;">If you did not create an account, please ignore this email.</p>
            </div>
            <div style="padding: 20px; text-align: center; background-color: #1e293b;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">© 2026 StagePros. All rights reserved.</p>
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
        
        print(f"Verification email sent to {email}")
        return True
        
    except Exception as e:
        print(f"Error sending verification email: {e}")
        traceback.print_exc()
        return False

# Routes
@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/api/customers")
async def list_customers(email: Optional[str] = None, is_verified: Optional[str] = None, current_user: dict = Depends(verify_token)):
    """Get list of customers with optional filtering"""
    is_verified_bool = None
    if is_verified is not None:
        is_verified_bool = is_verified.lower() == 'true'
    
    customers = await data_layer.get_all_users(role='customer', email=email, is_verified=is_verified_bool)
    
    # Remove sensitive fields
    for customer in customers:
        customer.pop('password_hash', None)
        customer.pop('password', None)
        customer.pop('verification_code', None)
    
    return {"customers": customers}

@app.post("/api/customers")
async def create_customer(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new customer account"""
    # Check if email already exists
    email_check = await data_layer.check_email_exists(data.get('email', ''))
    if email_check.get('exists'):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password = data.get('password', '')
    if password and not password.startswith('$2b$'):
        password = bcrypt.hashpw(password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = await data_layer.create_user(
        email=data.get('email', ''),
        password_hash=password,
        name=data.get('name', ''),
        phone=data.get('phone', ''),
        role='customer'
    )
    
    # Return without sensitive data
    new_user.pop('password_hash', None)
    return {"customer": new_user, "message": "Account created successfully"}

@app.put("/api/customers/{customer_id}")
async def update_customer(customer_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update a customer account"""
    IGNORE_FIELDS = {'id', 'created_at', 'created_date', 'created_by_id', 'created_by', 'role', 'email'}
    
    update_fields = {}
    for key, value in data.items():
        if key in IGNORE_FIELDS:
            continue
        if key == 'password' and value and not value.startswith('$2b$'):
            update_fields['password_hash'] = bcrypt.hashpw(value[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        else:
            update_fields[key] = value
    
    updated = await data_layer.update_user(customer_id, **update_fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    return {"message": "Customer updated successfully"}

# ============ Pro Account Routes ============

@app.get("/api/pros")
async def list_pros(email: Optional[str] = None, is_verified: Optional[str] = None, current_user: dict = Depends(verify_token)):
    """Get list of pro accounts with optional filtering"""
    is_verified_bool = None
    if is_verified is not None:
        is_verified_bool = is_verified.lower() == 'true'
    
    pros = await data_layer.get_all_users(role='pro', email=email, is_verified=is_verified_bool)
    
    # Remove sensitive fields
    for pro in pros:
        pro.pop('password_hash', None)
        pro.pop('password', None)
        pro.pop('verification_code', None)
    
    return {"pros": pros}

@app.post("/api/pros")
async def create_pro(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new pro account"""
    # Check if email already exists
    email_check = await data_layer.check_email_exists(data.get('email', ''))
    if email_check.get('exists'):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password = data.get('password', '')
    if password and not password.startswith('$2b$'):
        password = bcrypt.hashpw(password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    new_user = await data_layer.create_user(
        email=data.get('email', ''),
        password_hash=password,
        name=data.get('name', ''),
        phone=data.get('phone', ''),
        role='pro'
    )
    
    user_id = new_user.get('id')
    
    # Also create pro profile
    await data_layer.create_pro_profile(
        user_id=user_id,
        business_name=data.get('name', 'Stage Pro')
    )
    
    new_user.pop('password_hash', None)
    return {"pro": new_user, "id": user_id, "message": "Account created successfully"}

@app.put("/api/pros/{pro_id}")
async def update_pro(pro_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update a pro account"""
    IGNORE_FIELDS = {'id', 'created_at', 'created_date', 'created_by_id', 'created_by', 'role', 'email'}
    
    update_fields = {}
    for key, value in data.items():
        if key in IGNORE_FIELDS:
            continue
        if key == 'password' and value and not value.startswith('$2b$'):
            update_fields['password_hash'] = bcrypt.hashpw(value[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        else:
            update_fields[key] = value
    
    updated = await data_layer.update_user(pro_id, **update_fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Pro account not found")
    
    return {"message": "Pro account updated successfully"}

# ============ Unified Auth Endpoints ============

@app.post("/api/auth/login")
async def login(request: LoginRequest, response: Response):
    """Unified sign in endpoint for both customer and pro"""
    try:
        user = None
        user_id = None
        actual_user_type = request.user_type
        
        # Check using data_layer (supports both JSON and PostgreSQL)
        user = await data_layer.get_user_by_email(request.email, role=request.user_type)
        
        if user:
            user_id = user.get('id', '')
            actual_user_type = user.get('role') or user.get('user_type', request.user_type)
        else:
            # Check if user exists with different role
            any_user = await data_layer.get_user_by_email(request.email)
            if any_user:
                other_type = any_user.get('role') or any_user.get('user_type', 'user')
                raise HTTPException(
                    status_code=400, 
                    detail=f"This email is registered as a {other_type} account. Please use the {other_type} login."
                )
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password (supports both hashed and legacy plaintext)
        password_hash = user.get('password_hash') or user.get('password', '')
        if not verify_password(request.password, password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Create token
        access_token = create_access_token(user_id, request.email)
        
        # Set HTTP-only secure cookie
        set_auth_cookie(response, access_token)
        
        return {
            "message": "Login successful",
            "user": {
                "id": user_id,
                "name": user.get('name', ''),
                "email": user.get('email', ''),
                "phone": user.get('phone', ''),
                "user_type": actual_user_type
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
    """Unified sign up endpoint for both customer and pro"""
    # Validate email format (industry-standard checks)
    email_valid, email_error = validate_email(request.email)
    if not email_valid:
        raise HTTPException(status_code=400, detail=email_error)
    
    # Validate phone number (REQUIRED - industry-standard checks)
    phone_valid, phone_error = validate_phone(request.phone)
    if not phone_valid:
        raise HTTPException(status_code=400, detail=phone_error)
    
    # Normalize phone for consistent storage and comparison
    normalized_phone = normalize_phone(request.phone)
    
    # CRITICAL: Check if email exists in ANY account type (using data_layer)
    email_check = await data_layer.check_email_exists(request.email)
    if email_check.get("exists"):
        existing_type = email_check.get('user_type', 'user')
        raise HTTPException(status_code=400, detail=f"Email already registered as {existing_type} account")
    
    # Check for duplicate phone across ALL users (using data_layer)
    phone_check = await data_layer.check_phone_exists(normalized_phone)
    if phone_check.get("exists"):
        raise HTTPException(status_code=400, detail=f"Phone number already registered as {phone_check.get('user_type', 'user')} account")
    
    # Strong password rules for all accounts
    password_valid, password_error = validate_password(request.password)
    if not password_valid:
        raise HTTPException(status_code=400, detail=password_error)
    
    # Hash password
    hashed_password = bcrypt.hashpw(request.password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        # Create user via data_layer (handles both JSON and PostgreSQL)
        new_user = await data_layer.create_user(
            email=request.email.lower().strip(),
            password_hash=hashed_password,
            name=request.name or ("Customer" if request.user_type == "customer" else "Stage Pro"),
            phone=normalized_phone,
            role=request.user_type,
            security_question_1=request.security_question_1 or "What is your pet's name?",
            security_answer_1=request.security_answer_1.lower().strip() if request.security_answer_1 else "",
            security_question_2=request.security_question_2 or "What city were you born in?",
            security_answer_2=request.security_answer_2.lower().strip() if request.security_answer_2 else ""
        )
        
        user_id = new_user.get('id')
        
        # If pro, also create pro profile
        if request.user_type == "pro":
            await data_layer.create_pro_profile(
                user_id=user_id,
                business_name=request.name or "Stage Pro",
                profile_image=f"https://i.pravatar.cc/150?u={request.email}"
            )
        
        access_token = create_access_token(user_id, request.email)
        set_auth_cookie(response, access_token)
        
        return {
            "message": "Account created successfully",
            "user": {
                "id": user_id,
                "name": new_user.get('name'),
                "email": new_user.get('email'),
                "phone": new_user.get('phone'),
                "user_type": request.user_type
            }
        }
    except Exception as e:
        print(f"Signup error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create account")

@app.post("/api/auth/check-email")
async def check_email(request: CheckEmailRequest):
    """Check if email is already registered in ANY account type"""
    # Validate email format first (industry-standard checks)
    email_valid, email_error = validate_email(request.email)
    if not email_valid:
        raise HTTPException(status_code=400, detail=email_error)
    
    normalized_email = request.email.lower().strip()
    
    # Check using data_layer (supports both JSON and PostgreSQL)
    result = await data_layer.check_email_exists(normalized_email)
    if result.get("exists"):
        return {"exists": True, "email": normalized_email, "user_type": result.get('user_type')}
    
    return {"exists": False, "email": normalized_email}

@app.post("/api/auth/check-phone")
async def check_phone(request: CheckPhoneRequest):
    """Check if phone number is already registered in ANY account type"""
    # For the check endpoint, be lenient - return validation status instead of 400 error
    # This allows real-time validation feedback in the UI
    phone_valid, phone_error = validate_phone(request.phone)
    if not phone_valid:
        # Return validation error as response, not HTTP error - allows UI to show helpful message
        return {"exists": False, "phone": request.phone, "valid": False, "error": phone_error}
    
    normalized = normalize_phone(request.phone)
    
    # Check using data_layer (supports both JSON and PostgreSQL)
    result = await data_layer.check_phone_exists(normalized)
    if result.get("exists"):
        return {"exists": True, "phone": normalized, "user_type": result.get('user_type'), "valid": True}
    
    return {"exists": False, "phone": normalized, "valid": True}

@app.post("/api/auth/check-name")
async def check_name(request: CheckNameRequest):
    """Check if business/artist name is already taken in Scout profiles"""
    if not request.name or len(request.name.strip()) < 2:
        return {"exists": False, "name": request.name, "valid": False, "error": "Name must be at least 2 characters"}
    
    normalized_name = request.name.lower().strip()
    
    # Check pro profiles for existing names
    scouts = await data_layer.get_all_pro_profiles(limit=500)
    for scout in scouts:
        if (scout.get('business_name', '') or scout.get('name', '')).lower().strip() == normalized_name:
            return {"exists": True, "name": request.name, "valid": True}
    
    return {"exists": False, "name": request.name, "valid": True}

@app.post("/api/auth/security-questions")
async def get_security_questions(request: SecurityQuestionsRequest):
    """Get security questions for password reset"""
    # Use data_layer (supports both JSON and PostgreSQL)
    result = await data_layer.get_security_questions(request.email, role=request.user_type)
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    questions = []
    if result.get('security_question_1'):
        questions.append(result['security_question_1'])
    if result.get('security_question_2'):
        questions.append(result['security_question_2'])
    
    return {"questions": questions, "email": request.email}

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Reset password using security questions - verify answers and create reset session"""
    # Get user via data_layer (supports both JSON and PostgreSQL)
    user = await data_layer.get_user_by_email(request.email, role=request.user_type)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get security answers (stored in password_hash fields or legacy fields)
    stored_answer_1 = (user.get('security_answer_1_hash') or user.get('security_answer_1') or '').lower().strip()
    stored_answer_2 = (user.get('security_answer_2_hash') or user.get('security_answer_2') or '').lower().strip()
    
    # Verify security answers (case-insensitive)
    answer1_correct = request.security_answer_1.lower().strip() == stored_answer_1
    answer2_correct = request.security_answer_2.lower().strip() == stored_answer_2
    
    if not (answer1_correct and answer2_correct):
        raise HTTPException(status_code=401, detail="Security answers do not match")
    
    # Create a verified reset session (same as email code verification)
    email_key = request.email.lower()
    password_reset_codes[email_key] = {
        "code": "SECURITY_VERIFIED",
        "expires": datetime.now(timezone.utc) + timedelta(minutes=15),
        "verified": True
    }
    
    return {"message": "Security answers verified", "verified": True}

@app.post("/api/auth/forgot-password/send-code")
async def send_password_reset_code(request: SendResetCodeRequest):
    """Send password reset code to user's email"""
    # Get user via data_layer
    user = await data_layer.get_user_by_email(request.email, role=request.user_type)
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
    user_name = user.get('name', 'User')
    
    code = generate_reset_code()
    store_reset_code(request.email, code)
    
    if not send_reset_email(request.email, code, user_name):
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
    # Check for valid reset session (from email code or security questions)
    email_key = request.email.lower()
    if email_key not in password_reset_codes:
        raise HTTPException(status_code=400, detail="No verified session found. Please verify your identity first.")
    
    # Strong password rules for all accounts
    password_valid, password_error = validate_password(request.new_password)
    if not password_valid:
        raise HTTPException(status_code=400, detail=password_error)
    
    # Update password via data_layer
    hashed_password = bcrypt.hashpw(request.new_password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    await data_layer.update_password(request.email, hashed_password, role=request.user_type)
    
    clear_reset_code(request.email)
    return {"message": "Password has been reset successfully"}

@app.post("/api/auth/logout")
async def logout(response: Response):
    """Sign out endpoint - securely clears authentication cookie"""
    response.delete_cookie(
        key="access_token",
        path="/",
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="lax" if not IS_PRODUCTION else "none",
    )
    return {"message": "Logged out successfully"}

# ============ Email Verification Endpoints ============

@app.post("/api/auth/customer/send-verification")
async def send_verification_code_endpoint(request: SendVerificationCodeRequest):
    """Send email verification code for signup (works for both customer and pro accounts)"""
    email = request.email.lower().strip()
    user_name = request.name or "there"
    user_type = request.user_type or "customer"
    
    # Validate email format
    email_valid, email_error = validate_email(email)
    if not email_valid:
        raise HTTPException(status_code=400, detail=email_error)
    
    # Generate and store verification code
    code = generate_verification_code()
    store_verification_code(email, code, user_type)
    
    # Send verification email
    if send_verification_email(email, code, user_name, user_type):
        return {"message": "Verification code sent successfully", "email": email}
    else:
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again.")

@app.post("/api/auth/verify-email")
async def verify_email_code_endpoint(request: CustomerVerifyRequest):
    """Verify email verification code"""
    is_valid, message = verify_verification_code(request.email, request.code)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # Don't clear the code yet - let it be cleared on successful account creation
    return {"message": "Email verified successfully", "valid": True}

# Page view logging endpoint
@app.post("/api/logs/page-view")
async def log_page_view(request: Request):
    """Log page view for analytics - accepts and acknowledges silently"""
    try:
        body = await request.json()
        page_name = body.get("page_name", "unknown")
        # Could log to file or database here if needed
        # For now, just acknowledge the request
        return {"success": True, "page": page_name}
    except Exception:
        return {"success": True}

@app.get("/api/auth/me")
async def get_current_user(access_token: Optional[str] = Cookie(None)):
    """Get current authenticated user — uses data_layer for database support"""
    if not access_token:
        return None
    
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        token_id = payload.get("tasker_id")  # holds user id or tasker id
        email = payload.get("email")
        
        if not email:
            return None
        
        # Check using data_layer (supports both JSON and PostgreSQL)
        user = await data_layer.get_user_by_email(email)
        if user:
            user_type = user.get('role') or user.get('user_type', 'pro')
            return {
                "id": user.get('id', ''),
                "tasker_id": user.get('id', ''),
                "name": user.get('name', ''),
                "email": user.get('email', ''),
                "phone": user.get('phone', ''),
                "full_name": user.get('name', ''),
                "user_type": user_type,
                "is_pro": user_type == 'pro',
            }
        
        return None
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

@app.get("/api/scouts")
async def list_scouts(
    sort_by: str = "sxsw_years",
    limit: int = 10,
    id: Optional[str] = None,
    email: Optional[str] = None,
    is_verified: Optional[str] = None,
    services: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None
):
    """Get list of scouts with optional sorting and filtering"""
    # Use data_layer for database support
    services_list = [services] if services else None
    
    # Parse is_verified parameter
    verified_bool = None
    if is_verified is not None:
        verified_bool = is_verified.lower() == 'true'
    
    scouts = await data_layer.get_all_pro_profiles(
        services=services_list,
        location=location,
        experience_level=experience_level,
        is_verified=verified_bool,
        limit=limit
    )
    
    # Apply additional filters not handled by data_layer
    if id:
        scouts = [s for s in scouts if s.get('id') == id]
    
    if email:
        scouts = [s for s in scouts if s.get('email', '').lower() == email.lower()]
    
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
    scout = await data_layer.get_pro_profile_by_id(scout_id)
    
    if not scout:
        raise HTTPException(status_code=404, detail="Scout not found")
    
    return scout

@app.post("/api/scouts")
async def create_scout(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new scout profile"""
    user_id = current_user.get('tasker_id') if current_user else None
    
    try:
        new_scout = await data_layer.create_pro_profile(
            user_id=user_id or data.get('user_id', ''),
            business_name=data.get('name', ''),
            bio=data.get('bio', ''),
            profile_image=data.get('profile_image', ''),
            services=data.get('services', []),
            venue_types=data.get('venue_types', []),
            style_tags=data.get('style_tags', []),
            experience_level=data.get('experience_level', 'local_shows'),
            sxsw_years=data.get('sxsw_years', 0),
            gear_highlights=data.get('gear_highlights', []),
            portfolio_images=data.get('portfolio_images', []),
            location=data.get('location', ''),
            budget_min=data.get('budget_min'),
            budget_max=data.get('budget_max'),
            available_last_minute=data.get('available_last_minute', False),
            turnaround_days=data.get('turnaround_days'),
            availability_dates=data.get('availability_dates', [])
        )
        return {"message": "Scout created successfully", "id": new_scout.get("id"), "scout": new_scout}
    except Exception as e:
        print(f"Error creating scout: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create scout")

@app.put("/api/scouts/{scout_id}")
async def update_scout(scout_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update an existing scout profile"""
    user_id = current_user.get('tasker_id') if current_user else scout_id
    
    # Fields that belong to the users table, NOT pro_profiles
    USER_TABLE_FIELDS = {'name', 'phone', 'bio', 'profile_image', 'is_verified'}
    # Fields that should never be set via update (read-only / system-managed)
    IGNORE_FIELDS = {
        'id', 'user_id', 'email', 'created_at', 'updated_at', 'created_date',
        'updated_date', 'created_by_id', 'created_by', 'is_sample',
        'rating', 'review_count', 'average_rating', 'total_reviews',
        'password_hash', 'role', 'auth_token'
    }
    
    try:
        # Separate user fields from pro_profile fields
        user_fields = {}
        pro_fields = {}
        for key, value in data.items():
            if key in IGNORE_FIELDS:
                continue
            elif key in USER_TABLE_FIELDS:
                user_fields[key] = value
            else:
                # Convert empty strings to None for numeric fields
                if key in ('budget_min', 'budget_max', 'hourly_rate', 'daily_rate',
                           'sxsw_years', 'turnaround_days', 'service_radius_miles') and value == '':
                    value = None
                pro_fields[key] = value
        
        # Update user table fields (name, phone, bio, profile_image)
        if user_fields:
            await data_layer.update_user(user_id, **user_fields)
        
        # Update pro_profiles table fields
        updated_scout = await data_layer.update_pro_profile(user_id, **pro_fields)
        if updated_scout:
            return {"message": "Scout updated successfully", "scout": updated_scout}
        else:
            raise HTTPException(status_code=404, detail="Scout not found")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating scout: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to update scout")


# ============ Booking Request Endpoints ============

@app.get("/api/bookings")
async def list_bookings(
    requester_email: Optional[str] = None,
    scout_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    """Get list of booking requests with optional filtering"""
    # Use data_layer for database support
    user_id = current_user.get('tasker_id') if current_user else None
    user_type = current_user.get('user_type', 'customer') if current_user else 'customer'
    
    # Get bookings based on user role
    if customer_id:
        bookings = await data_layer.get_bookings_for_user(customer_id, 'customer')
    elif scout_id:
        bookings = await data_layer.get_bookings_for_user(scout_id, 'pro')
    elif user_id:
        bookings = await data_layer.get_bookings_for_user(user_id, user_type)
    else:
        bookings = []
    
    # Apply additional filters
    if requester_email:
        bookings = [b for b in bookings if b.get('requester_email', '').lower() == requester_email.lower()]
    if status:
        bookings = [b for b in bookings if b.get('status', '').lower() == status.lower()]
    
    return {"bookings": bookings}

@app.post("/api/bookings")
async def create_booking_endpoint(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new booking request"""
    try:
        customer_id = data.get('customer_id') or (current_user.get('tasker_id') if current_user else '')
        
        new_booking = await data_layer.create_booking(
            customer_id=customer_id,
            pro_id=data.get('scout_id', ''),
            requester_name=data.get('requester_name', ''),
            requester_email=data.get('requester_email', ''),
            event_date=data.get('event_date', ''),
            requester_phone=data.get('requester_phone', ''),
            start_time=data.get('start_time', ''),
            end_time=data.get('end_time', ''),
            venue_name=data.get('venue_name', ''),
            venue_type=data.get('venue_type', ''),
            venue_area=data.get('venue_area', ''),
            organization=data.get('organization', ''),
            services_needed=data.get('services_needed', []),
            budget_range=data.get('budget_range', ''),
            message=data.get('message', ''),
            is_multiday=data.get('is_multiday', False),
            additional_dates=data.get('additional_dates', [])
        )
        
        return {"booking": new_booking, "id": new_booking.get('id'), "message": "Booking request created successfully"}
    except Exception as e:
        print(f"Error creating booking: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to create booking")

@app.get("/api/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(verify_token)):
    """Get single booking by ID"""
    booking = await data_layer.get_booking_by_id(booking_id)
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking

@app.put("/api/bookings/{booking_id}")
async def update_booking(booking_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update a booking request"""
    status = data.get('status')
    response = data.get('pro_response')
    
    if status:
        updated = await data_layer.update_booking_status(booking_id, status, response)
        if updated:
            return {"message": "Booking updated successfully", "booking": updated}
        else:
            raise HTTPException(status_code=404, detail="Booking not found")
    
    # General update for non-status fields
    IGNORE_FIELDS = {'id', 'created_at', 'created_date', 'created_by_id', 'created_by'}
    update_fields = {k: v for k, v in data.items() if k not in IGNORE_FIELDS}
    
    updated = await data_layer.update_booking(booking_id, **update_fields)
    if not updated:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking updated successfully", "booking": updated}

@app.delete("/api/bookings/{booking_id}")
async def delete_booking(booking_id: str, current_user: dict = Depends(verify_token)):
    """Delete a booking request"""
    deleted = await data_layer.delete_booking(booking_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return {"message": "Booking deleted successfully", "id": deleted.get('id', booking_id)}


# ============ Messages Endpoints ============

@app.get("/api/messages")
async def list_messages(
    conversation_id: Optional[str] = None,
    sender_id: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    """Get list of messages with optional filtering"""
    if conversation_id:
        messages = await data_layer.get_messages(conversation_id)
    else:
        # Get all conversations for user and their messages
        user_id = current_user.get('tasker_id') if current_user else None
        user_type = current_user.get('user_type', 'customer') if current_user else 'customer'
        
        if user_id:
            conversations = await data_layer.get_conversations_for_user(user_id, user_type)
            messages = []
            for conv in conversations:
                conv_messages = await data_layer.get_messages(conv.get('id'))
                messages.extend(conv_messages)
        else:
            messages = []
    
    # Apply additional filters
    if sender_id:
        messages = [m for m in messages if m.get('sender_id') == sender_id]
    
    return {"messages": messages}

@app.post("/api/messages")
async def create_message(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new message"""
    try:
        conversation_id = data.get('conversation_id')
        
        # If no conversation_id, create or get one
        if not conversation_id:
            customer_id = data.get('customer_id')
            pro_id = data.get('pro_id')
            booking_request_id = data.get('booking_request_id')
            
            if not customer_id or not pro_id:
                raise HTTPException(status_code=400, detail="conversation_id or both customer_id and pro_id required")
            
            conversation = await data_layer.get_or_create_conversation(
                customer_id=customer_id,
                pro_id=pro_id,
                booking_request_id=booking_request_id
            )
            conversation_id = conversation.get('id')
        
        sender_id = data.get('sender_id') or (current_user.get('tasker_id') if current_user else '')
        sender_type = data.get('sender_type') or (current_user.get('user_type', 'customer') if current_user else 'customer')
        
        new_message = await data_layer.send_message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            sender_type=sender_type,
            message=data.get('message', ''),
            attachments=data.get('attachments', [])
        )
        
        return {"message": new_message, "id": new_message.get('id'), "success": True}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error creating message: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to send message")

@app.get("/api/conversations")
async def list_conversations(current_user: dict = Depends(verify_token)):
    """Get all conversations for the current user"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = current_user.get('tasker_id')
    user_type = current_user.get('user_type', 'customer')
    
    conversations = await data_layer.get_conversations_for_user(user_id, user_type)
    return {"conversations": conversations}

@app.post("/api/conversations/{conversation_id}/read")
async def mark_conversation_read(conversation_id: str, current_user: dict = Depends(verify_token)):
    """Mark all messages in a conversation as read"""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    reader_id = current_user.get('tasker_id')
    await data_layer.mark_messages_read(conversation_id, reader_id)
    
    return {"success": True, "message": "Messages marked as read"}

