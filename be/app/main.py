from fastapi import FastAPI, HTTPException, Response, Cookie, Depends, Request
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

# Data file paths
CUSTOMER_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/CustomerAccount.json")
PRO_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/ProAccount.json")
USERS_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/users.json")

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

# ============ Unified User Data Functions ============

def load_users():
    """Load all users from unified JSON file"""
    try:
        with open(USERS_DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('users', [])
    except FileNotFoundError:
        return []

def save_users(users: list) -> bool:
    """Save all users to unified JSON file"""
    try:
        with open(USERS_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump({"users": users}, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving users: {e}")
        return False

def get_user_by_email(email: str):
    """Get user by email (checks all users regardless of type)"""
    users = load_users()
    return next((u for u in users if u.get('email', '').lower() == email.lower()), None)

def generate_user_id():
    """Generate a new unique user ID"""
    return secrets.token_hex(12)

# Legacy functions for backwards compatibility - now use unified users.json
def load_customers():
    """Load customers from unified users file"""
    users = load_users()
    return [u for u in users if u.get('user_type') == 'customer']

def save_customers(customers):
    """Save customers to unified users file"""
    users = load_users()
    # Remove existing customers
    users = [u for u in users if u.get('user_type') != 'customer']
    # Add updated customers
    users.extend(customers)
    save_users(users)

def load_pros():
    """Load pro accounts from unified users file"""
    users = load_users()
    return [u for u in users if u.get('user_type') == 'pro']

def save_pros(pros):
    """Save pro accounts to unified users file"""
    users = load_users()
    # Remove existing pros
    users = [u for u in users if u.get('user_type') != 'pro']
    # Add updated pros
    users.extend(pros)
    save_users(users)

# Routes
@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/api/customers")
async def list_customers(email: Optional[str] = None, is_verified: Optional[str] = None, current_user: dict = Depends(verify_token)):
    """Get list of customers with optional filtering"""
    customers = load_customers()
    
    # Apply filters
    if email:
        customers = [c for c in customers if c.get('email') == email]
    if is_verified:
        # Convert string parameter to boolean for comparison
        # is_verified in database is a boolean, but query param comes as string
        is_verified_bool = is_verified.lower() == 'true'
        customers = [c for c in customers if c.get('is_verified', False) == is_verified_bool]
    
    # Remove sensitive fields
    for customer in customers:
        customer.pop('password', None)
        customer.pop('verification_code', None)
    
    return {"customers": customers}

@app.post("/api/customers")
async def create_customer(data: dict, current_user: dict = Depends(verify_token)):
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
async def update_customer(customer_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update a customer account"""
    customers = load_customers()
    
    customer_idx = next((i for i, c in enumerate(customers) if c.get('id') == customer_id), None)
    if customer_idx is None:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Update fields
    for key, value in data.items():
        if key not in ['id', 'created_date', 'created_by_id', 'created_by']:
            # Hash password if being updated
            if key == 'password' and value and not value.startswith('$2b$'):
                value = bcrypt.hashpw(value[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            customers[customer_idx][key] = value
    
    customers[customer_idx]['updated_date'] = datetime.utcnow().isoformat()
    save_customers(customers)
    
    return {"message": "Customer updated successfully"}

# ============ Pro Account Routes ============

@app.get("/api/pros")
async def list_pros(email: Optional[str] = None, is_verified: Optional[str] = None, current_user: dict = Depends(verify_token)):
    """Get list of pro accounts with optional filtering"""
    pros = load_pros()
    
    # Apply filters
    if email:
        pros = [p for p in pros if p.get('email', '').lower() == email.lower()]
    if is_verified:
        # Convert string parameter to boolean for comparison
        # is_verified in database is a boolean, but query param comes as string
        is_verified_bool = is_verified.lower() == 'true'
        pros = [p for p in pros if p.get('is_verified', False) == is_verified_bool]
    
    # Remove sensitive fields
    for pro in pros:
        pro.pop('password', None)
        pro.pop('verification_code', None)
    
    return {"pros": pros}

@app.post("/api/pros")
async def create_pro(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new pro account"""
    pros = load_pros()
    
    # Check if email already exists
    existing = next((p for p in pros if p.get('email', '').lower() == data.get('email', '').lower()), None)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    import uuid
    
    new_pro = {
        "email": data.get('email'),
        "password": data.get('password', ''),
        "verification_code": data.get('verification_code', ''),
        "is_verified": data.get('is_verified', 'false'),
        "scout_id": data.get('scout_id', ''),
        "id": str(uuid.uuid4())[:24],
        "created_date": datetime.utcnow().isoformat(),
        "updated_date": datetime.utcnow().isoformat(),
        "created_by_id": "",
        "created_by": data.get('email'),
        "is_sample": "false"
    }
    
    pros.append(new_pro)
    save_pros(pros)
    
    return_pro = {k: v for k, v in new_pro.items() if k not in ['password', 'verification_code']}
    return {"pro": return_pro, "id": new_pro['id'], "message": "Account created successfully"}

@app.put("/api/pros/{pro_id}")
async def update_pro(pro_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update a pro account"""
    pros = load_pros()
    
    pro_idx = next((i for i, p in enumerate(pros) if p.get('id') == pro_id), None)
    if pro_idx is None:
        raise HTTPException(status_code=404, detail="Pro account not found")
    
    # Update fields
    for key, value in data.items():
        if key not in ['id', 'created_date', 'created_by_id', 'created_by']:
            # Hash password if being updated
            if key == 'password' and value and not value.startswith('$2b$'):
                value = bcrypt.hashpw(value[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            pros[pro_idx][key] = value
    
    pros[pro_idx]['updated_date'] = datetime.utcnow().isoformat()
    save_pros(pros)
    
    return {"message": "Pro account updated successfully"}

# ============ Unified Auth Endpoints ============

@app.post("/api/auth/login")
async def login(request: LoginRequest, response: Response):
    """Unified sign in endpoint for both customer and pro"""
    try:
        user = None
        user_id = None
        actual_user_type = request.user_type
        
        # First check unified users store
        user = get_user_by_email(request.email)
        if user:
            user_id = user.get('id', '') if user.get('user_type') == 'customer' else user.get('tasker_id', user.get('id', ''))
            actual_user_type = user.get('user_type', request.user_type)
            
            # If user exists but is different type than requested, inform them
            if actual_user_type != request.user_type:
                raise HTTPException(
                    status_code=400, 
                    detail=f"This email is registered as a {actual_user_type} account. Please use the {actual_user_type} login."
                )
        else:
            # Fall back to checking taskers.json for legacy pro accounts
            if request.user_type == "pro":
                taskers = load_taskers()
                user = next((t for t in taskers if t['email'].lower() == request.email.lower()), None)
                if user:
                    user_id = user.get('tasker_id', '')
                    actual_user_type = "pro"
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Verify password (supports both hashed and legacy plaintext)
        if not verify_password(request.password, user.get('password', '')):
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
    
    # CRITICAL: Check if email exists in ANY account type (unified check)
    existing_user = get_user_by_email(request.email)
    if existing_user:
        existing_type = existing_user.get('user_type', 'user')
        raise HTTPException(status_code=400, detail=f"Email already registered as {existing_type} account")
    
    # Also check taskers.json for pro accounts
    taskers = load_taskers()
    if any(t['email'].lower() == request.email.lower() for t in taskers):
        raise HTTPException(status_code=400, detail="Email already registered as pro account")
    
    # Check for duplicate phone across ALL users (using normalized format)
    users = load_users()
    for user in users:
        user_phone = normalize_phone(user.get('phone', ''))
        if user_phone and user_phone == normalized_phone:
            raise HTTPException(status_code=400, detail=f"Phone number already registered as {user.get('user_type', 'user')} account")
    
    # Also check taskers for phone
    for tasker in taskers:
        tasker_phone = normalize_phone(tasker.get('phone', ''))
        if tasker_phone and tasker_phone == normalized_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered as pro account")
    
    # Strong password rules for all accounts
    password_valid, password_error = validate_password(request.password)
    if not password_valid:
        raise HTTPException(status_code=400, detail=password_error)
    
    if request.user_type == "customer":
        # Customer signup - save to unified users.json
        new_customer = {
            "id": generate_user_id(),
            "email": request.email.lower().strip(),
            "name": request.name or "Customer",
            "phone": normalized_phone,
            "password": bcrypt.hashpw(request.password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
            "user_type": "customer",
            "is_verified": True,
            "preferences": {},
            "security_question_1": request.security_question_1 or "What is your pet's name?",
            "security_answer_1": request.security_answer_1.lower().strip() if request.security_answer_1 else "",
            "security_question_2": request.security_question_2 or "What city were you born in?",
            "security_answer_2": request.security_answer_2.lower().strip() if request.security_answer_2 else "",
            "created_date": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().isoformat()
        }
        
        users = load_users()
        users.append(new_customer)
        save_users(users)
        
        access_token = create_access_token(new_customer['id'], request.email)
        set_auth_cookie(response, access_token)
        
        return {
            "message": "Account created successfully",
            "user": {
                "id": new_customer['id'],
                "name": new_customer['name'],
                "email": new_customer['email'],
                "phone": new_customer['phone'],
                "user_type": "customer"
            }
        }
    else:
        # Pro signup - save to both users.json and taskers.json for now
        new_user_id = generate_user_id()
        new_tasker_id = generate_tasker_id()
        hashed_password = bcrypt.hashpw(request.password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Add to unified users.json
        new_user = {
            "id": new_user_id,
            "email": request.email.lower().strip(),
            "name": request.name or "Stage Pro",
            "phone": normalized_phone,
            "password": hashed_password,
            "user_type": "pro",
            "tasker_id": new_tasker_id,
            "is_verified": False,
            "created_date": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().isoformat()
        }
        
        users = load_users()
        users.append(new_user)
        save_users(users)
        
        # Also add to taskers.json (full profile data)
        new_tasker = {
            "tasker_id": new_tasker_id,
            "name": request.name or "Stage Pro",
            "email": request.email.lower().strip(),
            "phone": normalized_phone,
            "password": hashed_password,
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
            "is_pro": True,
            "security_question_1": request.security_question_1 or "What is your pet's name?",
            "security_answer_1": (request.security_answer_1 or "").lower(),
            "security_question_2": request.security_question_2 or "What city were you born in?",
            "security_answer_2": (request.security_answer_2 or "").lower()
        }
        
        taskers.append(new_tasker)
        
        if not save_taskers(taskers):
            raise HTTPException(status_code=500, detail="Failed to create account")
        
        access_token = create_access_token(new_tasker_id, request.email)
        set_auth_cookie(response, access_token)
        
        return {
            "message": "Account created successfully",
            "user": {
                "id": new_tasker_id,
                "name": new_tasker['name'],
                "email": new_tasker['email'],
                "phone": new_tasker['phone'],
                "user_type": "pro"
            }
        }

@app.post("/api/auth/check-email")
async def check_email(request: CheckEmailRequest):
    """Check if email is already registered in ANY account type"""
    # Validate email format first (industry-standard checks)
    email_valid, email_error = validate_email(request.email)
    if not email_valid:
        raise HTTPException(status_code=400, detail=email_error)
    
    normalized_email = request.email.lower().strip()
    
    # Check unified users store (customers and pros)
    user = get_user_by_email(normalized_email)
    if user:
        return {"exists": True, "email": normalized_email, "user_type": user.get('user_type')}
    
    # Also check taskers.json for legacy pro accounts
    taskers = load_taskers()
    tasker = next((t for t in taskers if t['email'].lower() == normalized_email), None)
    if tasker:
        return {"exists": True, "email": normalized_email, "user_type": "pro"}
    
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
    
    # Check unified users store (customers and pros)
    users = load_users()
    for user in users:
        user_phone = normalize_phone(user.get('phone', ''))
        if user_phone and user_phone == normalized:
            return {"exists": True, "phone": normalized, "user_type": user.get('user_type'), "valid": True}
    
    # Also check taskers.json for legacy pro accounts
    taskers = load_taskers()
    for tasker in taskers:
        tasker_phone = normalize_phone(tasker.get('phone', ''))
        if tasker_phone and tasker_phone == normalized:
            return {"exists": True, "phone": normalized, "user_type": "pro", "valid": True}
    
    return {"exists": False, "phone": normalized, "valid": True}

@app.post("/api/auth/security-questions")
async def get_security_questions(request: SecurityQuestionsRequest):
    """Get security questions for password reset"""
    if request.user_type == "customer":
        users = load_users()
        user = next((u for u in users if u['email'].lower() == request.email.lower() and u.get('user_type') == 'customer'), None)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        questions = []
        if user.get('security_question_1'):
            questions.append(user['security_question_1'])
        if user.get('security_question_2'):
            questions.append(user['security_question_2'])
        
        return {"questions": questions, "email": request.email}
    else:
        users = load_users()
        user = next((u for u in users if u['email'].lower() == request.email.lower() and u.get('user_type') == 'pro'), None)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        questions = []
        if user.get('security_question_1'):
            questions.append(user['security_question_1'])
        if user.get('security_question_2'):
            questions.append(user['security_question_2'])
        
        return {"questions": questions, "email": request.email}

@app.post("/api/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Reset password using security questions - verify answers and create reset session"""
    if request.user_type == "customer":
        users = load_users()
        user = next((u for u in users if u['email'].lower() == request.email.lower() and u.get('user_type') == 'customer'), None)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify security answers (case-insensitive)
        answer1_correct = request.security_answer_1.lower().strip() == (user.get('security_answer_1') or '').lower().strip()
        answer2_correct = request.security_answer_2.lower().strip() == (user.get('security_answer_2') or '').lower().strip()
        
        if not (answer1_correct and answer2_correct):
            raise HTTPException(status_code=401, detail="Security answers do not match")
        
        # Create a verified reset session (same as email code verification)
        email_key = request.email.lower()
        password_reset_codes[email_key] = {
            "code": "SECURITY_VERIFIED",
            "expires": datetime.utcnow() + timedelta(minutes=15),
            "verified": True
        }
        
        return {"message": "Security answers verified", "verified": True}
    else:
        users = load_users()
        user = next((u for u in users if u['email'].lower() == request.email.lower() and u.get('user_type') == 'pro'), None)
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Verify security answers (case-insensitive)
        answer1_correct = request.security_answer_1.lower().strip() == (user.get('security_answer_1') or '').lower().strip()
        answer2_correct = request.security_answer_2.lower().strip() == (user.get('security_answer_2') or '').lower().strip()
        
        if not (answer1_correct and answer2_correct):
            raise HTTPException(status_code=401, detail="Security answers do not match")
        
        # Create a verified reset session (same as email code verification)
        email_key = request.email.lower()
        password_reset_codes[email_key] = {
            "code": "SECURITY_VERIFIED",
            "expires": datetime.utcnow() + timedelta(minutes=15),
            "verified": True
        }
        
        return {"message": "Security answers verified", "verified": True}

@app.post("/api/auth/forgot-password/send-code")
async def send_password_reset_code(request: SendResetCodeRequest):
    """Send password reset code to user's email"""
    user = None
    user_name = "User"
    
    if request.user_type == "customer":
        users = load_users()
        user = next((u for u in users if u['email'].lower() == request.email.lower() and u.get('user_type') == 'customer'), None)
        if user:
            user_name = user.get('name', 'Customer')
    else:
        users = load_users()
        user = next((u for u in users if u['email'].lower() == request.email.lower() and u.get('user_type') == 'pro'), None)
        if user:
            user_name = user.get('name', 'Stage Pro')
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
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
    
    users = load_users()
    user_type = request.user_type
    user_idx = next((i for i, u in enumerate(users) if u['email'].lower() == request.email.lower() and u.get('user_type') == user_type), None)
    
    if user_idx is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    users[user_idx]['password'] = bcrypt.hashpw(request.new_password[:72].encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    users[user_idx]['updated_date'] = datetime.utcnow().isoformat()
    save_users(users)
    
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
    """Get current authenticated user — searches unified users store and legacy taskers"""
    if not access_token:
        return None
    
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        token_id = payload.get("tasker_id")  # holds user id or tasker id
        email = payload.get("email")
        
        if not email:
            return None
        
        # 1. Check unified users.json (customers + pros)
        user = get_user_by_email(email)
        if user:
            user_type = user.get('user_type', 'pro')
            return {
                "id": user.get('tasker_id', user.get('id', '')),
                "tasker_id": user.get('tasker_id', user.get('id', '')),
                "name": user.get('name', ''),
                "email": user.get('email', ''),
                "phone": user.get('phone', ''),
                "full_name": user.get('name', ''),
                "user_type": user_type,
                "is_pro": user_type == 'pro',
            }
        
        # 2. Fall back to legacy taskers.json
        if token_id:
            taskers = load_taskers()
            tasker = next((t for t in taskers if t['tasker_id'] == token_id), None)
            if tasker:
                return {
                    "id": tasker['tasker_id'],
                    "tasker_id": tasker['tasker_id'],
                    "name": tasker['name'],
                    "email": tasker['email'],
                    "phone": tasker['phone'],
                    "full_name": tasker['name'],
                    "user_type": "pro",
                    "is_pro": tasker.get('is_pro', True),
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

# Scout Data File
SCOUT_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/Scout.json")

def load_scouts():
    """Load scouts from JSON file"""
    try:
        with open(SCOUT_DATA_FILE, 'r', encoding='utf-8') as f:
            scouts = json.load(f)
            return scouts if isinstance(scouts, list) else []
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []

def save_scouts(scouts: list) -> bool:
    """Save scouts to JSON file"""
    try:
        with open(SCOUT_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(scouts, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving scouts: {e}")
        return False

@app.get("/api/scouts")
async def list_scouts(
    sort_by: str = "sxsw_years",
    limit: int = 10,
    id: Optional[str] = None,
    is_verified: Optional[str] = None,
    services: Optional[str] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None
):
    """Get list of scouts with optional sorting and filtering"""
    scouts = load_scouts()
    
    # Apply filters
    # Filter by ID first (most specific filter)
    if id:
        scouts = [s for s in scouts if s.get('id') == id]
    
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

@app.post("/api/scouts")
async def create_scout(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new scout profile"""
    scouts = load_scouts()
    
    import uuid
    new_scout = {
        "id": str(uuid.uuid4())[:24],
        "created_date": datetime.now().isoformat(),
        **data
    }
    
    scouts.append(new_scout)
    
    if save_scouts(scouts):
        return {"message": "Scout created successfully", "id": new_scout["id"], "scout": new_scout}
    else:
        raise HTTPException(status_code=500, detail="Failed to save scout")

@app.put("/api/scouts/{scout_id}")
async def update_scout(scout_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update an existing scout profile"""
    scouts = load_scouts()
    
    scout_index = next((i for i, s in enumerate(scouts) if s.get('id') == scout_id), None)
    
    if scout_index is None:
        raise HTTPException(status_code=404, detail="Scout not found")
    
    # Update scout data
    scouts[scout_index] = {
        **scouts[scout_index],
        **data,
        "updated_date": datetime.now().isoformat()
    }
    
    if save_scouts(scouts):
        return {"message": "Scout updated successfully", "scout": scouts[scout_index]}
    else:
        raise HTTPException(status_code=500, detail="Failed to save scout")


# ============ Booking Request Endpoints ============

BOOKING_DATA_FILE = os.path.join(os.path.dirname(__file__), "../data/BookingRequest.json")

def load_bookings():
    """Load bookings from JSON file"""
    try:
        with open(BOOKING_DATA_FILE, 'r', encoding='utf-8') as f:
            bookings = json.load(f)
            return bookings if isinstance(bookings, list) else []
    except FileNotFoundError:
        return []
    except json.JSONDecodeError:
        return []

def save_bookings(bookings: list) -> bool:
    """Save bookings to JSON file"""
    try:
        with open(BOOKING_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(bookings, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving bookings: {e}")
        return False

@app.get("/api/bookings")
async def list_bookings(
    requester_email: Optional[str] = None,
    scout_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(verify_token)
):
    """Get list of booking requests with optional filtering"""
    bookings = load_bookings()
    
    # Apply filters
    if requester_email:
        bookings = [b for b in bookings if b.get('requester_email', '').lower() == requester_email.lower()]
    if scout_id:
        bookings = [b for b in bookings if b.get('scout_id') == scout_id]
    if customer_id:
        bookings = [b for b in bookings if b.get('customer_id') == customer_id]
    if status:
        bookings = [b for b in bookings if b.get('status', '').lower() == status.lower()]
    
    return {"bookings": bookings}

@app.post("/api/bookings")
async def create_booking(data: dict, current_user: dict = Depends(verify_token)):
    """Create a new booking request"""
    bookings = load_bookings()
    
    import uuid
    new_booking = {
        "id": str(uuid.uuid4())[:24],
        "requester_name": data.get('requester_name', ''),
        "requester_email": data.get('requester_email', ''),
        "requester_phone": data.get('requester_phone', ''),
        "scout_id": data.get('scout_id', ''),
        "customer_id": data.get('customer_id', ''),
        "event_date": data.get('event_date', ''),
        "start_time": data.get('start_time', ''),
        "end_time": data.get('end_time', ''),
        "venue_name": data.get('venue_name', ''),
        "venue_type": data.get('venue_type', ''),
        "venue_area": data.get('venue_area', ''),
        "organization": data.get('organization', ''),
        "services_needed": data.get('services_needed', []),
        "budget_range": data.get('budget_range', ''),
        "message": data.get('message', ''),
        "is_multiday": data.get('is_multiday', False),
        "additional_dates": data.get('additional_dates', []),
        "status": "pending",
        "created_date": datetime.utcnow().isoformat(),
        "updated_date": datetime.utcnow().isoformat(),
        "created_by_id": data.get('customer_id', ''),
        "created_by": data.get('requester_email', ''),
        "is_sample": False
    }
    
    bookings.append(new_booking)
    save_bookings(bookings)
    
    return {"booking": new_booking, "id": new_booking['id'], "message": "Booking request created successfully"}

@app.get("/api/bookings/{booking_id}")
async def get_booking(booking_id: str, current_user: dict = Depends(verify_token)):
    """Get single booking by ID"""
    bookings = load_bookings()
    booking = next((b for b in bookings if b.get('id') == booking_id), None)
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    return booking

@app.put("/api/bookings/{booking_id}")
async def update_booking(booking_id: str, data: dict, current_user: dict = Depends(verify_token)):
    """Update a booking request"""
    bookings = load_bookings()
    
    booking_idx = next((i for i, b in enumerate(bookings) if b.get('id') == booking_id), None)
    if booking_idx is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Update fields
    for key, value in data.items():
        if key not in ['id', 'created_date', 'created_by_id', 'created_by']:
            bookings[booking_idx][key] = value
    
    bookings[booking_idx]['updated_date'] = datetime.utcnow().isoformat()
    save_bookings(bookings)
    
    return {"message": "Booking updated successfully", "booking": bookings[booking_idx]}

@app.delete("/api/bookings/{booking_id}")
async def delete_booking(booking_id: str, current_user: dict = Depends(verify_token)):
    """Delete a booking request"""
    bookings = load_bookings()
    
    booking_idx = next((i for i, b in enumerate(bookings) if b.get('id') == booking_id), None)
    if booking_idx is None:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    deleted = bookings.pop(booking_idx)
    save_bookings(bookings)
    
    return {"message": "Booking deleted successfully", "id": deleted['id']}

