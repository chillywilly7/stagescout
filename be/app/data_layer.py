"""
Data Layer - Unified interface for JSON and PostgreSQL storage
Switches between backends based on USE_DATABASE environment variable
"""
import os
import json
import asyncio
from datetime import datetime
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

USE_DATABASE = os.getenv("USE_DATABASE", "false").lower() == "true"

# Data file paths (for JSON backend)
DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
SCOUTS_FILE = os.path.join(DATA_DIR, "Scout.json")
BOOKINGS_FILE = os.path.join(DATA_DIR, "BookingRequest.json")
TASKERS_FILE = os.path.join(DATA_DIR, "taskers.json")
CONVERSATIONS_FILE = os.path.join(DATA_DIR, "conversations.json")
MESSAGES_FILE = os.path.join(DATA_DIR, "messages.json")

# Import database module only if needed
if USE_DATABASE:
    try:
        from . import database as db
    except ImportError:
        import database as db


# ============================================================================
# JSON Backend Helpers
# ============================================================================

def _load_json(filepath: str, default_value=None):
    """Load data from JSON file"""
    if default_value is None:
        default_value = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # Handle both list and dict with key
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                # Try common keys
                for key in ['users', 'taskers', 'scouts', 'bookings', 'conversations', 'messages']:
                    if key in data:
                        return data[key]
                return data
            return default_value
    except (FileNotFoundError, json.JSONDecodeError):
        return default_value


def _save_json(filepath: str, data, key: str = None):
    """Save data to JSON file"""
    try:
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'w', encoding='utf-8') as f:
            if key:
                json.dump({key: data}, f, indent=2, default=str)
            else:
                json.dump(data, f, indent=2, default=str)
        return True
    except Exception as e:
        print(f"Error saving to {filepath}: {e}")
        return False


def _generate_id():
    """Generate a unique ID"""
    import secrets
    return secrets.token_hex(12)


# ============================================================================
# User Operations
# ============================================================================

async def create_user(
    email: str,
    password_hash: str,
    name: str,
    phone: str = "",
    role: str = "customer",
    security_question_1: str = "",
    security_answer_1: str = "",
    security_question_2: str = "",
    security_answer_2: str = "",
    **extra_fields
) -> Dict[str, Any]:
    """Create a new user"""
    if USE_DATABASE:
        return await db.create_user(
            email=email,
            password_hash=password_hash,
            name=name,
            phone=phone,
            role=role,
            security_question_1=security_question_1,
            security_answer_1_hash=security_answer_1,  # Store as-is, hashing done at API layer
            security_question_2=security_question_2,
            security_answer_2_hash=security_answer_2
        )
    else:
        users = _load_json(USERS_FILE, [])
        new_user = {
            "id": _generate_id(),
            "email": email.lower().strip(),
            "password": password_hash,
            "name": name,
            "phone": phone,
            "user_type": role,
            "is_verified": True,
            "email_verified": True,
            "verification_code": "",
            "security_question_1": security_question_1,
            "security_answer_1": security_answer_1,
            "security_question_2": security_question_2,
            "security_answer_2": security_answer_2,
            "profile_image": f"https://i.pravatar.cc/150?u={email}",
            "created_date": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().isoformat(),
            **extra_fields
        }
        users.append(new_user)
        _save_json(USERS_FILE, users, "users")
        return new_user


async def get_all_users(role: str = None, email: str = None, is_verified: bool = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Get all users with optional filters"""
    if USE_DATABASE:
        return await db.get_all_users(role=role, email=email, is_verified=is_verified, limit=limit)
    else:
        users = _load_json(USERS_FILE, [])
        if role:
            users = [u for u in users if u.get('user_type') == role]
        if email:
            users = [u for u in users if u.get('email', '').lower() == email.lower()]
        if is_verified is not None:
            users = [u for u in users if u.get('is_verified') == is_verified]
        return [_map_json_user(u) for u in users[:limit]]


async def get_user_by_email(email: str, role: str = None) -> Optional[Dict[str, Any]]:
    """Get user by email"""
    if USE_DATABASE:
        return await db.get_user_by_email(email, role)
    else:
        users = _load_json(USERS_FILE, [])
        for user in users:
            if user.get('email', '').lower() == email.lower():
                if role is None or user.get('user_type') == role:
                    # Map JSON fields to database-like structure
                    return _map_json_user(user)
        return None


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    if USE_DATABASE:
        return await db.get_user_by_id(user_id)
    else:
        users = _load_json(USERS_FILE, [])
        for user in users:
            if user.get('id') == user_id:
                return _map_json_user(user)
        return None


async def check_email_exists(email: str, role: str = None) -> Dict[str, Any]:
    """Check if email exists"""
    if USE_DATABASE:
        return await db.check_email_exists(email, role)
    else:
        user = await get_user_by_email(email, role)
        if user:
            return {"exists": True, "user_type": user.get("role") or user.get("user_type")}
        
        # Also check taskers.json for legacy pro accounts
        taskers = _load_json(TASKERS_FILE, [])
        for t in taskers:
            if t.get('email', '').lower() == email.lower():
                return {"exists": True, "user_type": "pro"}
        
        return {"exists": False}


async def check_phone_exists(phone: str, role: str = None) -> Dict[str, Any]:
    """Check if phone exists"""
    if USE_DATABASE:
        return await db.check_phone_exists(phone, role)
    else:
        import re
        phone_digits = re.sub(r'\D', '', phone)
        if len(phone_digits) == 11 and phone_digits.startswith('1'):
            phone_digits = phone_digits[1:]
        
        users = _load_json(USERS_FILE, [])
        for user in users:
            user_phone = re.sub(r'\D', '', user.get('phone', ''))
            if len(user_phone) == 11 and user_phone.startswith('1'):
                user_phone = user_phone[1:]
            if user_phone and user_phone == phone_digits:
                if role is None or user.get('user_type') == role:
                    return {"exists": True, "user_type": user.get('user_type')}
        
        # Also check taskers
        taskers = _load_json(TASKERS_FILE, [])
        for t in taskers:
            t_phone = re.sub(r'\D', '', t.get('phone', ''))
            if len(t_phone) == 11 and t_phone.startswith('1'):
                t_phone = t_phone[1:]
            if t_phone and t_phone == phone_digits:
                return {"exists": True, "user_type": "pro"}
        
        return {"exists": False}


async def update_user(user_id: str, **fields) -> Optional[Dict[str, Any]]:
    """Update user fields"""
    if USE_DATABASE:
        return await db.update_user(user_id, **fields)
    else:
        users = _load_json(USERS_FILE, [])
        for i, user in enumerate(users):
            if user.get('id') == user_id:
                for key, value in fields.items():
                    # Map database field names to JSON field names
                    json_key = _db_to_json_field(key)
                    users[i][json_key] = value
                users[i]['updated_date'] = datetime.utcnow().isoformat()
                _save_json(USERS_FILE, users, "users")
                return _map_json_user(users[i])
        return None


async def update_password(email: str, password_hash: str, role: str = None):
    """Update user password"""
    if USE_DATABASE:
        await db.update_password(email, password_hash, role)
    else:
        users = _load_json(USERS_FILE, [])
        for i, user in enumerate(users):
            if user.get('email', '').lower() == email.lower():
                if role is None or user.get('user_type') == role:
                    users[i]['password'] = password_hash
                    users[i]['updated_date'] = datetime.utcnow().isoformat()
                    _save_json(USERS_FILE, users, "users")
                    return
        
        # Also update taskers.json if needed
        taskers = _load_json(TASKERS_FILE, [])
        for i, t in enumerate(taskers):
            if t.get('email', '').lower() == email.lower():
                taskers[i]['password'] = password_hash
                _save_json(TASKERS_FILE, taskers, "taskers")
                return


async def get_security_questions(email: str, role: str = None) -> Optional[Dict[str, str]]:
    """Get security questions for a user"""
    if USE_DATABASE:
        return await db.get_security_questions(email, role)
    else:
        user = await get_user_by_email(email, role)
        if user:
            return {
                "security_question_1": user.get("security_question_1", ""),
                "security_question_2": user.get("security_question_2", "")
            }
        return None


def _map_json_user(user: dict) -> dict:
    """Map JSON user fields to database-like structure"""
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "password_hash": user.get("password"),
        "name": user.get("name", ""),
        "phone": user.get("phone", ""),
        "role": user.get("user_type", "customer"),
        "is_verified": user.get("is_verified", False),
        "email_verified": user.get("email_verified", user.get("is_verified", False)),
        "verification_code": user.get("verification_code", ""),
        "security_question_1": user.get("security_question_1", ""),
        "security_answer_1_hash": user.get("security_answer_1", ""),
        "security_question_2": user.get("security_question_2", ""),
        "security_answer_2_hash": user.get("security_answer_2", ""),
        "profile_image": user.get("profile_image", ""),
        "created_at": user.get("created_date"),
        "updated_at": user.get("updated_date"),
        # Keep original fields for backwards compatibility
        **user
    }


def _db_to_json_field(field: str) -> str:
    """Map database field names to JSON field names"""
    mapping = {
        "password_hash": "password",
        "role": "user_type",
        "security_answer_1_hash": "security_answer_1",
        "security_answer_2_hash": "security_answer_2",
        "created_at": "created_date",
        "updated_at": "updated_date",
    }
    return mapping.get(field, field)


# ============================================================================
# Pro Profile Operations
# ============================================================================

async def create_pro_profile(user_id: str, **fields) -> Dict[str, Any]:
    """Create a pro profile"""
    if USE_DATABASE:
        return await db.create_pro_profile(user_id, **fields)
    else:
        # In JSON mode, pro profiles are stored in Scout.json
        scouts = _load_json(SCOUTS_FILE, [])
        
        # Get user info
        user = await get_user_by_id(user_id)
        
        new_profile = {
            "id": _generate_id(),
            "user_id": user_id,
            "email": user.get("email", "") if user else "",
            "name": fields.get("business_name", user.get("name", "") if user else ""),
            "phone": user.get("phone", "") if user else "",
            "bio": fields.get("bio", ""),
            "profile_image": fields.get("profile_image", ""),
            "services": fields.get("services", []),
            "venue_types": fields.get("venue_types", []),
            "style_tags": fields.get("style_tags", []),
            "experience_level": fields.get("experience_level", "local_shows"),
            "sxsw_years": fields.get("sxsw_years", 0),
            "gear_highlights": fields.get("gear_highlights", []),
            "portfolio_images": fields.get("portfolio_images", []),
            "location": fields.get("location", ""),
            "budget_min": fields.get("budget_min"),
            "budget_max": fields.get("budget_max"),
            "available_last_minute": fields.get("available_last_minute", False),
            "turnaround_days": fields.get("turnaround_days"),
            "availability_dates": fields.get("availability_dates", []),
            "is_verified": False,
            "verification_status": "none",
            "rating": 0,
            "review_count": 0,
            "is_austin_based": fields.get("is_austin_based", True),
            "created_date": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().isoformat(),
        }
        
        scouts.append(new_profile)
        _save_json(SCOUTS_FILE, scouts)
        return new_profile


async def get_pro_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
    """Get pro profile by profile ID"""
    if USE_DATABASE:
        return await db.get_pro_profile_by_id(profile_id)
    else:
        scouts = _load_json(SCOUTS_FILE, [])
        for scout in scouts:
            if scout.get("id") == profile_id:
                return scout
        return None


async def get_pro_profile_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get pro profile by user ID"""
    if USE_DATABASE:
        return await db.get_pro_profile_by_user_id(user_id)
    else:
        scouts = _load_json(SCOUTS_FILE, [])
        for scout in scouts:
            if scout.get("user_id") == user_id:
                return scout
        return None


async def get_pro_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get pro profile by email"""
    if USE_DATABASE:
        return await db.get_pro_profile_by_email(email)
    else:
        scouts = _load_json(SCOUTS_FILE, [])
        for scout in scouts:
            if scout.get("email", "").lower() == email.lower():
                return scout
        return None


async def get_all_pro_profiles(
    services: List[str] = None,
    location: str = None,
    experience_level: str = None,
    available_last_minute: bool = None,
    is_verified: bool = None,
    limit: int = 50,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """Get all pro profiles with optional filters"""
    if USE_DATABASE:
        return await db.get_all_pro_profiles(
            services=services,
            location=location,
            experience_level=experience_level,
            available_last_minute=available_last_minute,
            is_verified=is_verified,
            limit=limit,
            offset=offset
        )
    else:
        scouts = _load_json(SCOUTS_FILE, [])
        
        # Apply filters
        if services:
            scouts = [s for s in scouts if any(svc in s.get("services", []) for svc in services)]
        if location:
            scouts = [s for s in scouts if s.get("location") == location]
        if experience_level:
            scouts = [s for s in scouts if s.get("experience_level") == experience_level]
        if available_last_minute is not None:
            scouts = [s for s in scouts if s.get("available_last_minute") == available_last_minute]
        if is_verified is not None:
            scouts = [s for s in scouts if s.get("is_verified") == is_verified]

        # Sort by rating
        scouts.sort(key=lambda x: x.get("rating", 0), reverse=True)

        # Pagination
        return scouts[offset:offset + limit]


async def update_pro_profile(user_id: str, **fields) -> Optional[Dict[str, Any]]:
    """Update pro profile"""
    if USE_DATABASE:
        return await db.update_pro_profile(user_id, **fields)
    else:
        scouts = _load_json(SCOUTS_FILE, [])
        for i, scout in enumerate(scouts):
            if scout.get("user_id") == user_id:
                for key, value in fields.items():
                    scouts[i][key] = value
                scouts[i]["updated_date"] = datetime.utcnow().isoformat()
                _save_json(SCOUTS_FILE, scouts)
                return scouts[i]
        return None


# ============================================================================
# Booking Operations
# ============================================================================

async def create_booking(
    customer_id: str,
    pro_id: str,
    requester_name: str,
    requester_email: str,
    event_date: str,
    **fields
) -> Dict[str, Any]:
    """Create a booking request"""
    if USE_DATABASE:
        return await db.create_booking(
            customer_id=customer_id,
            pro_id=pro_id,
            requester_name=requester_name,
            requester_email=requester_email,
            event_date=event_date,
            **fields
        )
    else:
        bookings = _load_json(BOOKINGS_FILE, [])
        new_booking = {
            "id": _generate_id(),
            "customer_id": customer_id,
            "pro_id": pro_id,  # This maps to scout_id in old format
            "scout_id": pro_id,  # Keep for backwards compatibility
            "requester_name": requester_name,
            "requester_email": requester_email,
            "requester_phone": fields.get("requester_phone", ""),
            "event_date": event_date,
            "start_time": fields.get("start_time", ""),
            "end_time": fields.get("end_time", ""),
            "venue_name": fields.get("venue_name", ""),
            "venue_type": fields.get("venue_type", ""),
            "venue_area": fields.get("venue_area", ""),
            "is_multiday": fields.get("is_multiday", False),
            "additional_dates": fields.get("additional_dates", []),
            "services_needed": fields.get("services_needed", []),
            "budget_range": fields.get("budget_range", ""),
            "message": fields.get("message", ""),
            "organization": fields.get("organization", ""),
            "status": "pending",
            "created_date": datetime.utcnow().isoformat(),
            "updated_date": datetime.utcnow().isoformat(),
        }
        bookings.append(new_booking)
        _save_json(BOOKINGS_FILE, bookings)
        return new_booking


async def get_bookings_for_user(user_id: str, role: str = "customer") -> List[Dict[str, Any]]:
    """Get bookings for a user"""
    if USE_DATABASE:
        return await db.get_bookings_for_user(user_id, role)
    else:
        bookings = _load_json(BOOKINGS_FILE, [])
        if role == "customer":
            return [b for b in bookings if b.get("customer_id") == user_id]
        else:
            # For pros, check both pro_id and scout_id
            return [b for b in bookings if b.get("pro_id") == user_id or b.get("scout_id") == user_id]


async def get_booking_by_id(booking_id: str) -> Optional[Dict[str, Any]]:
    """Get booking by ID"""
    if USE_DATABASE:
        return await db.get_booking_by_id(booking_id)
    else:
        bookings = _load_json(BOOKINGS_FILE, [])
        for booking in bookings:
            if booking.get("id") == booking_id:
                return booking
        return None


async def update_booking_status(booking_id: str, status: str, response: str = None) -> Optional[Dict[str, Any]]:
    """Update booking status"""
    if USE_DATABASE:
        return await db.update_booking_status(booking_id, status, response)
    else:
        bookings = _load_json(BOOKINGS_FILE, [])
        for i, booking in enumerate(bookings):
            if booking.get("id") == booking_id:
                bookings[i]["status"] = status
                if response:
                    bookings[i]["pro_response"] = response
                bookings[i]["updated_date"] = datetime.utcnow().isoformat()
                _save_json(BOOKINGS_FILE, bookings)
                return bookings[i]
        return None


async def update_booking(booking_id: str, **fields) -> Optional[Dict[str, Any]]:
    """Update arbitrary booking fields"""
    if USE_DATABASE:
        return await db.update_booking(booking_id, **fields)
    else:
        bookings = _load_json(BOOKINGS_FILE, [])
        for i, booking in enumerate(bookings):
            if booking.get("id") == booking_id:
                for key, value in fields.items():
                    bookings[i][key] = value
                bookings[i]["updated_date"] = datetime.utcnow().isoformat()
                _save_json(BOOKINGS_FILE, bookings)
                return bookings[i]
        return None


async def delete_booking(booking_id: str) -> Optional[Dict[str, Any]]:
    """Delete a booking by ID"""
    if USE_DATABASE:
        return await db.delete_booking(booking_id)
    else:
        bookings = _load_json(BOOKINGS_FILE, [])
        for i, booking in enumerate(bookings):
            if booking.get("id") == booking_id:
                deleted = bookings.pop(i)
                _save_json(BOOKINGS_FILE, bookings)
                return deleted
        return None


# ============================================================================
# Conversation & Message Operations
# ============================================================================

async def get_or_create_conversation(
    customer_id: str,
    pro_id: str,
    booking_request_id: str = None
) -> Dict[str, Any]:
    """Get or create a conversation"""
    if USE_DATABASE:
        return await db.get_or_create_conversation(customer_id, pro_id, booking_request_id)
    else:
        convs = _load_json(CONVERSATIONS_FILE, [])
        
        # Look for existing conversation
        for conv in convs:
            if booking_request_id and conv.get("booking_request_id") == booking_request_id:
                return conv
            if (conv.get("customer_id") == customer_id and 
                conv.get("pro_id") == pro_id and
                not conv.get("booking_request_id")):
                return conv
        
        # Create new conversation
        new_conv = {
            "id": _generate_id(),
            "customer_id": customer_id,
            "pro_id": pro_id,
            "booking_request_id": booking_request_id,
            "subject": "",
            "is_archived": False,
            "last_message_at": None,
            "created_at": datetime.utcnow().isoformat(),
        }
        convs.append(new_conv)
        _save_json(CONVERSATIONS_FILE, convs)
        return new_conv


async def get_conversations_for_user(user_id: str, role: str = "customer") -> List[Dict[str, Any]]:
    """Get conversations for a user"""
    if USE_DATABASE:
        return await db.get_conversations_for_user(user_id, role)
    else:
        convs = _load_json(CONVERSATIONS_FILE, [])
        if role == "customer":
            return [c for c in convs if c.get("customer_id") == user_id and not c.get("is_archived")]
        else:
            return [c for c in convs if c.get("pro_id") == user_id and not c.get("is_archived")]


async def get_conversation_by_id(conversation_id: str) -> Optional[Dict[str, Any]]:
    """Get conversation by ID"""
    if USE_DATABASE:
        return await db.get_conversation_by_id(conversation_id)
    else:
        convs = _load_json(CONVERSATIONS_FILE, [])
        for conv in convs:
            if conv.get("id") == conversation_id:
                return conv
        return None


async def send_message(
    conversation_id: str,
    sender_id: str,
    sender_type: str,
    message: str,
    attachments: List[str] = None
) -> Dict[str, Any]:
    """Send a message"""
    if USE_DATABASE:
        return await db.send_message(conversation_id, sender_id, sender_type, message, attachments)
    else:
        messages = _load_json(MESSAGES_FILE, [])
        new_msg = {
            "id": _generate_id(),
            "conversation_id": conversation_id,
            "sender_id": sender_id,
            "sender_type": sender_type,
            "message": message,
            "attachments": attachments or [],
            "is_read": False,
            "created_at": datetime.utcnow().isoformat(),
        }
        messages.append(new_msg)
        _save_json(MESSAGES_FILE, messages)
        
        # Update conversation last_message_at
        convs = _load_json(CONVERSATIONS_FILE, [])
        for i, conv in enumerate(convs):
            if conv.get("id") == conversation_id:
                convs[i]["last_message_at"] = datetime.utcnow().isoformat()
                _save_json(CONVERSATIONS_FILE, convs)
                break
        
        return new_msg


async def get_messages(conversation_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Get messages in a conversation"""
    if USE_DATABASE:
        return await db.get_messages(conversation_id, limit, offset)
    else:
        messages = _load_json(MESSAGES_FILE, [])
        conv_messages = [m for m in messages if m.get("conversation_id") == conversation_id]
        conv_messages.sort(key=lambda x: x.get("created_at", ""))
        return conv_messages[offset:offset + limit]


async def mark_messages_read(conversation_id: str, reader_id: str):
    """Mark messages as read"""
    if USE_DATABASE:
        await db.mark_messages_read(conversation_id, reader_id)
    else:
        messages = _load_json(MESSAGES_FILE, [])
        for i, msg in enumerate(messages):
            if (msg.get("conversation_id") == conversation_id and 
                msg.get("sender_id") != reader_id and
                not msg.get("is_read")):
                messages[i]["is_read"] = True
                messages[i]["read_at"] = datetime.utcnow().isoformat()
        _save_json(MESSAGES_FILE, messages)


# ============================================================================
# Legacy Support - Load all users/taskers/scouts
# ============================================================================

def load_users_sync() -> List[Dict[str, Any]]:
    """Synchronous load of users (for backwards compatibility)"""
    return _load_json(USERS_FILE, [])


def save_users_sync(users: List[Dict[str, Any]]) -> bool:
    """Synchronous save of users (for backwards compatibility)"""
    return _save_json(USERS_FILE, users, "users")


def load_taskers_sync() -> List[Dict[str, Any]]:
    """Synchronous load of taskers"""
    return _load_json(TASKERS_FILE, [])


def save_taskers_sync(taskers: List[Dict[str, Any]]) -> bool:
    """Synchronous save of taskers"""
    return _save_json(TASKERS_FILE, taskers, "taskers")


def load_scouts_sync() -> List[Dict[str, Any]]:
    """Synchronous load of scouts"""
    return _load_json(SCOUTS_FILE, [])


def save_scouts_sync(scouts: List[Dict[str, Any]]) -> bool:
    """Synchronous save of scouts"""
    return _save_json(SCOUTS_FILE, scouts)


# ============================================================================
# Initialization
# ============================================================================

async def init_data_layer():
    """Initialize the data layer"""
    if USE_DATABASE:
        await db.init_db()
        print("✅ Using PostgreSQL database")
    else:
        # Ensure data files exist
        os.makedirs(DATA_DIR, exist_ok=True)
        for filepath, default in [
            (USERS_FILE, {"users": []}),
            (SCOUTS_FILE, []),
            (BOOKINGS_FILE, []),
            (CONVERSATIONS_FILE, []),
            (MESSAGES_FILE, []),
        ]:
            if not os.path.exists(filepath):
                with open(filepath, 'w') as f:
                    json.dump(default, f)
        print("ℹ️  Using JSON file storage")


async def shutdown_data_layer():
    """Shutdown the data layer"""
    if USE_DATABASE:
        await db.shutdown_db()
