"""
Database connection and utilities for PostgreSQL (Supabase)
"""
import os
from contextlib import contextmanager
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, date
import asyncpg
from dotenv import load_dotenv


def _serialize_value(value: Any) -> Any:
    """Convert non-JSON-serializable types to serializable ones"""
    if isinstance(value, UUID):
        return str(value)
    elif isinstance(value, datetime):
        return value.isoformat()
    elif isinstance(value, date):
        return value.isoformat()
    elif isinstance(value, list):
        return [_serialize_value(v) for v in value]
    return value


def _serialize_row(row: Dict[str, Any]) -> Dict[str, Any]:
    """Convert all non-JSON-serializable values in a row"""
    return {k: _serialize_value(v) for k, v in row.items()}

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))

DATABASE_URL = os.getenv("DATABASE_URL")
USE_DATABASE = os.getenv("USE_DATABASE", "false").lower() == "true"

# Connection pool (initialized on first use)
_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """Get or create the connection pool"""
    global _pool
    if _pool is None:
        if not DATABASE_URL:
            raise RuntimeError("DATABASE_URL environment variable is not set")
        _pool = await asyncpg.create_pool(
            DATABASE_URL,
            min_size=2,
            max_size=10,
            command_timeout=60
        )
    return _pool


async def close_pool():
    """Close the connection pool"""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


async def execute(query: str, *args) -> str:
    """Execute a query without returning results"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.execute(query, *args)


async def fetch_one(query: str, *args) -> Optional[Dict[str, Any]]:
    """Fetch a single row as a dictionary"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(query, *args)
        return _serialize_row(dict(row)) if row else None


async def fetch_all(query: str, *args) -> List[Dict[str, Any]]:
    """Fetch all rows as a list of dictionaries"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *args)
        return [_serialize_row(dict(row)) for row in rows]


async def fetch_val(query: str, *args) -> Any:
    """Fetch a single value"""
    pool = await get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval(query, *args)


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
    security_answer_1_hash: str = "",
    security_question_2: str = "",
    security_answer_2_hash: str = "",
    verification_code: str = ""
) -> Dict[str, Any]:
    """Create a new user and return the created record"""
    query = """
        INSERT INTO users (
            email, password_hash, name, phone, role,
            security_question_1, security_answer_1_hash,
            security_question_2, security_answer_2_hash,
            verification_code, is_verified, email_verified
        ) VALUES ($1, $2, $3, $4, $5::user_role, $6, $7, $8, $9, $10, true, true)
        RETURNING *
    """
    return await fetch_one(
        query, email, password_hash, name, phone, role,
        security_question_1, security_answer_1_hash,
        security_question_2, security_answer_2_hash,
        verification_code
    )


async def get_all_users(role: str = None, email: str = None, is_verified: bool = None, limit: int = 100) -> List[Dict[str, Any]]:
    """Get all users with optional filters"""
    conditions = []
    values = []
    idx = 1
    if role:
        conditions.append(f"role = ${idx}::user_role")
        values.append(role)
        idx += 1
    if email:
        conditions.append(f"email = ${idx}")
        values.append(email)
        idx += 1
    if is_verified is not None:
        conditions.append(f"is_verified = ${idx}")
        values.append(is_verified)
        idx += 1
    
    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    values.append(limit)
    query = f"SELECT * FROM users {where} ORDER BY created_at DESC LIMIT ${idx}"
    return await fetch_all(query, *values)


async def get_user_by_email(email: str, role: str = None) -> Optional[Dict[str, Any]]:
    """Get a user by email, optionally filtered by role"""
    if role:
        query = "SELECT * FROM users WHERE email = $1 AND role = $2::user_role"
        return await fetch_one(query, email, role)
    else:
        query = "SELECT * FROM users WHERE email = $1"
        return await fetch_one(query, email)


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get a user by ID"""
    query = "SELECT * FROM users WHERE id = $1::uuid"
    return await fetch_one(query, user_id)


async def check_email_exists(email: str, role: str = None) -> Dict[str, Any]:
    """Check if email exists, return exists status and user type"""
    if role:
        query = "SELECT id, role FROM users WHERE email = $1 AND role = $2::user_role"
        user = await fetch_one(query, email, role)
    else:
        query = "SELECT id, role FROM users WHERE email = $1"
        user = await fetch_one(query, email)
    
    if user:
        return {"exists": True, "user_type": user["role"]}
    return {"exists": False}


async def check_phone_exists(phone: str, role: str = None) -> Dict[str, Any]:
    """Check if phone exists, return exists status and user type"""
    # Normalize phone to digits only
    phone_digits = ''.join(filter(str.isdigit, phone))
    
    if role:
        query = """
            SELECT id, role FROM users 
            WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1 
            AND role = $2::user_role
        """
        user = await fetch_one(query, phone_digits, role)
    else:
        query = """
            SELECT id, role FROM users 
            WHERE REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $1
        """
        user = await fetch_one(query, phone_digits)
    
    if user:
        return {"exists": True, "user_type": user["role"]}
    return {"exists": False}


async def update_user(user_id: str, **fields) -> Optional[Dict[str, Any]]:
    """Update user fields"""
    if not fields:
        return await get_user_by_id(user_id)
    
    set_clauses = []
    values = []
    for i, (key, value) in enumerate(fields.items(), start=1):
        set_clauses.append(f"{key} = ${i}")
        values.append(value)
    
    values.append(user_id)
    query = f"""
        UPDATE users SET {', '.join(set_clauses)}
        WHERE id = ${len(values)}::uuid
        RETURNING *
    """
    return await fetch_one(query, *values)


async def update_user_verification(email: str, code: str = None, verified: bool = None):
    """Update verification status"""
    if code is not None:
        await execute(
            "UPDATE users SET verification_code = $1 WHERE email = $2",
            code, email
        )
    if verified is not None:
        await execute(
            "UPDATE users SET is_verified = $1, email_verified = $1 WHERE email = $2",
            verified, email
        )


async def get_security_questions(email: str, role: str = None) -> Optional[Dict[str, str]]:
    """Get security questions for a user"""
    user = await get_user_by_email(email, role)
    if user:
        return {
            "security_question_1": user.get("security_question_1", ""),
            "security_question_2": user.get("security_question_2", "")
        }
    return None


async def update_password(email: str, password_hash: str, role: str = None):
    """Update user password"""
    if role:
        await execute(
            "UPDATE users SET password_hash = $1 WHERE email = $2 AND role = $3::user_role",
            password_hash, email, role
        )
    else:
        await execute(
            "UPDATE users SET password_hash = $1 WHERE email = $2",
            password_hash, email
        )


# ============================================================================
# Pro Profile Operations
# ============================================================================

async def create_pro_profile(user_id: str, **fields) -> Dict[str, Any]:
    """Create a pro profile for a user"""
    # Build the query dynamically based on provided fields
    columns = ["user_id"]
    placeholders = ["$1::uuid"]
    values = [user_id]
    
    allowed_fields = [
        "business_name", "services", "venue_types", "style_tags",
        "experience_level", "sxsw_years", "years_experience",
        "gear_highlights", "equipment_list", "portfolio_images",
        "location", "zip_code", "service_radius_miles", "is_austin_based",
        "budget_min", "budget_max", "hourly_rate", "daily_rate",
        "available_last_minute", "turnaround_days", "availability_dates",
        "verification_status", "verification_business_name",
        "verification_tax_id", "verification_insurance"
    ]
    
    for i, (key, value) in enumerate(fields.items(), start=2):
        if key in allowed_fields and value is not None:
            columns.append(key)
            if key == "experience_level":
                placeholders.append(f"${i}::experience_level")
            elif key == "verification_status":
                placeholders.append(f"${i}::verification_status")
            elif key in ["services", "venue_types", "style_tags", "gear_highlights", 
                        "equipment_list", "portfolio_images", "availability_dates"]:
                placeholders.append(f"${i}::text[]")
            else:
                placeholders.append(f"${i}")
            values.append(value)
    
    query = f"""
        INSERT INTO pro_profiles ({', '.join(columns)})
        VALUES ({', '.join(placeholders)})
        RETURNING *
    """
    return await fetch_one(query, *values)


async def get_pro_profile_by_id(profile_id: str) -> Optional[Dict[str, Any]]:
    """Get pro profile by profile ID (from pro_listings view for full data)"""
    query = "SELECT * FROM pro_listings WHERE profile_id = $1::uuid"
    result = await fetch_one(query, profile_id)
    if result:
        return result
    # Fallback: try as user_id
    query = "SELECT * FROM pro_listings WHERE user_id = $1::uuid"
    return await fetch_one(query, profile_id)


async def get_pro_profile_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get pro profile by user ID"""
    query = "SELECT * FROM pro_profiles WHERE user_id = $1::uuid"
    return await fetch_one(query, user_id)


async def get_pro_profile_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get pro profile by email (joins with users table)"""
    query = """
        SELECT pp.*, u.email, u.name, u.phone, u.profile_image as profile_image
        FROM pro_profiles pp
        JOIN users u ON pp.user_id = u.id
        WHERE u.email = $1
    """
    return await fetch_one(query, email)


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
    query = """
        SELECT pp.*, u.email, u.name, u.phone, u.profile_image as profile_image, u.is_verified as is_verified
        FROM pro_profiles pp
        JOIN users u ON pp.user_id = u.id
        WHERE u.is_active = true
    """
    conditions = []
    values = []
    param_count = 0
    
    if services:
        param_count += 1
        conditions.append(f"pp.services && ${param_count}::text[]")
        values.append(services)
    
    if location:
        param_count += 1
        conditions.append(f"pp.location = ${param_count}")
        values.append(location)
    
    if experience_level:
        param_count += 1
        conditions.append(f"pp.experience_level = ${param_count}::experience_level")
        values.append(experience_level)
    
    if available_last_minute is not None:
        param_count += 1
        conditions.append(f"pp.available_last_minute = ${param_count}")
        values.append(available_last_minute)
    
    if is_verified is not None:
        param_count += 1
        conditions.append(f"u.is_verified = ${param_count}")
        values.append(is_verified)
    
    if conditions:
        query += " AND " + " AND ".join(conditions)
    
    query += f" ORDER BY pp.average_rating DESC, pp.created_at DESC"
    query += f" LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
    values.extend([limit, offset])
    
    return await fetch_all(query, *values)


async def update_pro_profile(user_id: str, **fields) -> Optional[Dict[str, Any]]:
    """Update pro profile fields"""
    if not fields:
        return await get_pro_profile_by_user_id(user_id)
    
    set_clauses = []
    values = []
    
    for i, (key, value) in enumerate(fields.items(), start=1):
        if key == "experience_level":
            set_clauses.append(f"{key} = ${i}::experience_level")
        elif key == "verification_status":
            set_clauses.append(f"{key} = ${i}::verification_status")
        elif key in ["services", "venue_types", "style_tags", "gear_highlights",
                    "equipment_list", "portfolio_images"]:
            set_clauses.append(f"{key} = ${i}::text[]")
        elif key == "availability_dates":
            set_clauses.append(f"{key} = ${i}::date[]")
        elif key == "verification_insurance_expiry":
            set_clauses.append(f"{key} = ${i}::date")
        elif key in ["budget_min", "budget_max", "hourly_rate", "daily_rate"]:
            set_clauses.append(f"{key} = ${i}::numeric")
        else:
            set_clauses.append(f"{key} = ${i}")
        values.append(value)
    
    values.append(user_id)
    query = f"""
        UPDATE pro_profiles SET {', '.join(set_clauses)}
        WHERE user_id = ${len(values)}::uuid
        RETURNING *
    """
    return await fetch_one(query, *values)


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
    """Create a new booking request"""
    query = """
        INSERT INTO booking_requests (
            customer_id, pro_id, requester_name, requester_email, event_date,
            requester_phone, venue_name, venue_type, venue_area, venue_address,
            start_time, end_time, is_multiday, additional_dates,
            services_needed, budget_range, message, organization, status
        ) VALUES (
            $1::uuid, $2::uuid, $3, $4, $5::date,
            $6, $7, $8, $9, $10,
            $11::time, $12::time, $13, $14::date[],
            $15::text[], $16, $17, $18, 'pending'::booking_status
        )
        RETURNING *
    """
    return await fetch_one(
        query,
        customer_id, pro_id, requester_name, requester_email, event_date,
        fields.get("requester_phone", ""),
        fields.get("venue_name", ""),
        fields.get("venue_type", ""),
        fields.get("venue_area", ""),
        fields.get("venue_address", ""),
        fields.get("start_time"),
        fields.get("end_time"),
        fields.get("is_multiday", False),
        fields.get("additional_dates", []),
        fields.get("services_needed", []),
        fields.get("budget_range", ""),
        fields.get("message", ""),
        fields.get("organization", "")
    )


async def get_bookings_for_user(user_id: str, role: str = "customer") -> List[Dict[str, Any]]:
    """Get all bookings for a user (as customer or pro)"""
    if role == "customer":
        query = """
            SELECT br.*, 
                   u.name as pro_name, u.email as pro_email,
                   pp.business_name, pp.services as pro_services
            FROM booking_requests br
            JOIN users u ON br.pro_id = u.id
            LEFT JOIN pro_profiles pp ON br.pro_id = pp.user_id
            WHERE br.customer_id = $1::uuid
            ORDER BY br.created_at DESC
        """
    else:
        query = """
            SELECT br.*,
                   u.name as customer_name, u.email as customer_email
            FROM booking_requests br
            JOIN users u ON br.customer_id = u.id
            WHERE br.pro_id = $1::uuid
            ORDER BY br.created_at DESC
        """
    return await fetch_all(query, user_id)


async def get_booking_by_id(booking_id: str) -> Optional[Dict[str, Any]]:
    """Get a booking by ID"""
    query = "SELECT * FROM booking_requests WHERE id = $1::uuid"
    return await fetch_one(query, booking_id)


async def update_booking_status(booking_id: str, status: str, response: str = None) -> Optional[Dict[str, Any]]:
    """Update booking status"""
    if response:
        query = """
            UPDATE booking_requests 
            SET status = $1::booking_status, pro_response = $2
            WHERE id = $3::uuid
            RETURNING *
        """
        return await fetch_one(query, status, response, booking_id)
    else:
        query = """
            UPDATE booking_requests SET status = $1::booking_status
            WHERE id = $2::uuid
            RETURNING *
        """
        return await fetch_one(query, status, booking_id)


async def update_booking(booking_id: str, **fields) -> Optional[Dict[str, Any]]:
    """Update arbitrary booking fields"""
    if not fields:
        return await get_booking_by_id(booking_id)
    
    set_clauses = []
    values = []
    for i, (key, value) in enumerate(fields.items(), start=1):
        if key == 'status':
            set_clauses.append(f"{key} = ${i}::booking_status")
        else:
            set_clauses.append(f"{key} = ${i}")
        values.append(value)
    
    values.append(booking_id)
    query = f"""
        UPDATE booking_requests SET {', '.join(set_clauses)}
        WHERE id = ${len(values)}::uuid
        RETURNING *
    """
    return await fetch_one(query, *values)


async def delete_booking(booking_id: str) -> Optional[Dict[str, Any]]:
    """Delete a booking by ID"""
    query = "DELETE FROM booking_requests WHERE id = $1::uuid RETURNING *"
    return await fetch_one(query, booking_id)


# ============================================================================
# Conversation & Message Operations
# ============================================================================

async def create_conversation(
    customer_id: str,
    pro_id: str,
    booking_request_id: str = None,
    subject: str = None
) -> Dict[str, Any]:
    """Create a new conversation"""
    query = """
        INSERT INTO conversations (customer_id, pro_id, booking_request_id, subject)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4)
        RETURNING *
    """
    return await fetch_one(query, customer_id, pro_id, booking_request_id, subject)


async def get_or_create_conversation(
    customer_id: str,
    pro_id: str,
    booking_request_id: str = None
) -> Dict[str, Any]:
    """Get existing conversation or create new one"""
    # Try to find existing conversation
    if booking_request_id:
        query = "SELECT * FROM conversations WHERE booking_request_id = $1::uuid"
        conv = await fetch_one(query, booking_request_id)
        if conv:
            return conv
    else:
        query = """
            SELECT * FROM conversations 
            WHERE customer_id = $1::uuid AND pro_id = $2::uuid AND booking_request_id IS NULL
        """
        conv = await fetch_one(query, customer_id, pro_id)
        if conv:
            return conv
    
    # Create new conversation
    return await create_conversation(customer_id, pro_id, booking_request_id)


async def get_conversations_for_user(user_id: str, role: str = "customer") -> List[Dict[str, Any]]:
    """Get all conversations for a user"""
    if role == "customer":
        query = """
            SELECT c.*, 
                   u.name as pro_name, u.email as pro_email, u.profile_image as pro_image,
                   pp.business_name,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id 
                    AND m.is_read = false AND m.sender_id != $1::uuid) as unread_count,
                   (SELECT message FROM messages m WHERE m.conversation_id = c.id 
                    ORDER BY m.created_at DESC LIMIT 1) as last_message
            FROM conversations c
            JOIN users u ON c.pro_id = u.id
            LEFT JOIN pro_profiles pp ON c.pro_id = pp.user_id
            WHERE c.customer_id = $1::uuid AND c.is_archived = false
            ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
        """
    else:
        query = """
            SELECT c.*,
                   u.name as customer_name, u.email as customer_email, u.profile_image as customer_image,
                   (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id 
                    AND m.is_read = false AND m.sender_id != $1::uuid) as unread_count,
                   (SELECT message FROM messages m WHERE m.conversation_id = c.id 
                    ORDER BY m.created_at DESC LIMIT 1) as last_message
            FROM conversations c
            JOIN users u ON c.customer_id = u.id
            WHERE c.pro_id = $1::uuid AND c.is_archived = false
            ORDER BY COALESCE(c.last_message_at, c.created_at) DESC
        """
    return await fetch_all(query, user_id)


async def get_conversation_by_id(conversation_id: str) -> Optional[Dict[str, Any]]:
    """Get a conversation by ID"""
    query = "SELECT * FROM conversations WHERE id = $1::uuid"
    return await fetch_one(query, conversation_id)


async def send_message(
    conversation_id: str,
    sender_id: str,
    sender_type: str,
    message: str,
    attachments: List[str] = None
) -> Dict[str, Any]:
    """Send a message in a conversation"""
    query = """
        INSERT INTO messages (conversation_id, sender_id, sender_type, message, attachments)
        VALUES ($1::uuid, $2::uuid, $3::message_sender_type, $4, $5::text[])
        RETURNING *
    """
    msg = await fetch_one(query, conversation_id, sender_id, sender_type, message, attachments or [])
    
    # Update conversation last_message_at
    await execute(
        "UPDATE conversations SET last_message_at = NOW() WHERE id = $1::uuid",
        conversation_id
    )
    
    return msg


async def get_messages(conversation_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
    """Get messages in a conversation"""
    query = """
        SELECT m.*, u.name as sender_name, u.profile_image as sender_image
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = $1::uuid AND m.is_deleted = false
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3
    """
    return await fetch_all(query, conversation_id, limit, offset)


async def mark_messages_read(conversation_id: str, reader_id: str):
    """Mark all messages in a conversation as read for a user"""
    await execute(
        """
        UPDATE messages SET is_read = true, read_at = NOW()
        WHERE conversation_id = $1::uuid AND sender_id != $2::uuid AND is_read = false
        """,
        conversation_id, reader_id
    )
    
    # Update conversation read timestamp
    # First check if reader is customer or pro
    conv = await get_conversation_by_id(conversation_id)
    if conv:
        if str(conv["customer_id"]) == reader_id:
            await execute(
                "UPDATE conversations SET customer_last_read = NOW() WHERE id = $1::uuid",
                conversation_id
            )
        elif str(conv["pro_id"]) == reader_id:
            await execute(
                "UPDATE conversations SET pro_last_read = NOW() WHERE id = $1::uuid",
                conversation_id
            )


# ============================================================================
# Initialization
# ============================================================================

async def init_db():
    """Initialize database connection pool"""
    if USE_DATABASE:
        await get_pool()
        print("✅ Database connection pool initialized")
    else:
        print("ℹ️  Using JSON files (set USE_DATABASE=true in .env to use PostgreSQL)")


async def shutdown_db():
    """Shutdown database connection pool"""
    await close_pool()
    print("✅ Database connection pool closed")
