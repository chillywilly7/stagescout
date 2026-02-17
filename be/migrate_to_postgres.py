"""
Database Migration Script
Migrates data from JSON files to PostgreSQL (Supabase)

Usage:
    python migrate_to_postgres.py --init     # Initialize schema (create tables)
    python migrate_to_postgres.py --migrate  # Migrate JSON data to database
    python migrate_to_postgres.py --all      # Do both
"""

import os
import sys
import json
import argparse
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")

# Data file paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
USERS_FILE = os.path.join(DATA_DIR, "users.json")
SCOUTS_FILE = os.path.join(DATA_DIR, "Scout.json")
BOOKINGS_FILE = os.path.join(DATA_DIR, "BookingRequest.json")
TASKERS_FILE = os.path.join(DATA_DIR, "taskers.json")
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "database/schema.sql")


def load_json(filepath, default=None):
    """Load data from JSON file"""
    if default is None:
        default = []
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                for key in ['users', 'taskers', 'scouts', 'bookings']:
                    if key in data:
                        return data[key]
                return data
            return default
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"  Warning: Could not load {filepath}: {e}")
        return default


def init_schema(conn):
    """Initialize database schema"""
    print("\n📦 Initializing database schema...")
    
    with open(SCHEMA_FILE, 'r') as f:
        schema_sql = f.read()
    
    # Split by statement (crude but works for this schema)
    # We need to handle DO blocks specially
    cur = conn.cursor()
    
    try:
        # Execute the entire schema at once
        cur.execute(schema_sql)
        conn.commit()
        print("✅ Schema created successfully!")
    except Exception as e:
        conn.rollback()
        error_msg = str(e)
        
        # Check if it's just "already exists" errors
        if "already exists" in error_msg:
            print("⚠️  Some objects already exist (this is OK for subsequent runs)")
            # Try to continue anyway
        else:
            print(f"❌ Error creating schema: {e}")
            raise
    finally:
        cur.close()


def migrate_users(conn):
    """Migrate users from JSON to database"""
    print("\n👤 Migrating users...")
    
    users = load_json(USERS_FILE, [])
    print(f"  Found {len(users)} users in JSON file")
    
    if not users:
        print("  No users to migrate")
        return 0
    
    cur = conn.cursor()
    migrated = 0
    skipped = 0
    
    for user in users:
        email = user.get('email', '').lower().strip()
        if not email:
            continue
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            skipped += 1
            continue
        
        try:
            # Map user_type to role enum
            role = user.get('user_type', 'customer')
            if role not in ('customer', 'pro', 'admin'):
                role = 'customer'
            
            cur.execute("""
                INSERT INTO users (
                    email, password_hash, name, phone, role,
                    is_verified, email_verified,
                    security_question_1, security_answer_1_hash,
                    security_question_2, security_answer_2_hash,
                    profile_image, created_at, updated_at
                ) VALUES (
                    %s, %s, %s, %s, %s::user_role,
                    %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s, %s
                )
            """, (
                email,
                user.get('password', ''),
                user.get('name', ''),
                user.get('phone', ''),
                role,
                user.get('is_verified', False),
                user.get('email_verified', user.get('is_verified', False)),
                user.get('security_question_1', ''),
                user.get('security_answer_1', ''),
                user.get('security_question_2', ''),
                user.get('security_answer_2', ''),
                user.get('profile_image', ''),
                user.get('created_date', datetime.utcnow().isoformat()),
                user.get('updated_date', datetime.utcnow().isoformat())
            ))
            migrated += 1
        except Exception as e:
            print(f"  Error migrating user {email}: {e}")
            conn.rollback()
            continue
    
    conn.commit()
    cur.close()
    print(f"  ✅ Migrated {migrated} users, skipped {skipped} existing")
    return migrated


def migrate_taskers(conn):
    """Migrate taskers (legacy pro data) to users table"""
    print("\n🎭 Migrating taskers (legacy pro accounts)...")
    
    taskers = load_json(TASKERS_FILE, [])
    print(f"  Found {len(taskers)} taskers in JSON file")
    
    if not taskers:
        print("  No taskers to migrate")
        return 0
    
    cur = conn.cursor()
    migrated = 0
    skipped = 0
    
    for tasker in taskers:
        email = tasker.get('email', '').lower().strip()
        if not email:
            continue
        
        # Check if user already exists
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            skipped += 1
            continue
        
        try:
            cur.execute("""
                INSERT INTO users (
                    email, password_hash, name, phone, role,
                    is_verified, email_verified,
                    security_question_1, security_answer_1_hash,
                    security_question_2, security_answer_2_hash,
                    profile_image, bio
                ) VALUES (
                    %s, %s, %s, %s, 'pro'::user_role,
                    %s, %s,
                    %s, %s,
                    %s, %s,
                    %s, %s
                )
                RETURNING id
            """, (
                email,
                tasker.get('password', ''),
                tasker.get('name', ''),
                tasker.get('phone', ''),
                tasker.get('is_verified', False),
                tasker.get('is_verified', False),
                tasker.get('security_question_1', ''),
                tasker.get('security_answer_1', ''),
                tasker.get('security_question_2', ''),
                tasker.get('security_answer_2', ''),
                tasker.get('profile_image', ''),
                tasker.get('bio', '')
            ))
            migrated += 1
        except Exception as e:
            print(f"  Error migrating tasker {email}: {e}")
            conn.rollback()
            continue
    
    conn.commit()
    cur.close()
    print(f"  ✅ Migrated {migrated} taskers, skipped {skipped} existing")
    return migrated


def migrate_scouts(conn):
    """Migrate scouts to pro_profiles table"""
    print("\n🎪 Migrating Scouts to pro_profiles...")
    
    scouts = load_json(SCOUTS_FILE, [])
    print(f"  Found {len(scouts)} scouts in JSON file")
    
    if not scouts:
        print("  No scouts to migrate")
        return 0
    
    cur = conn.cursor()
    migrated = 0
    skipped = 0
    errors = 0
    
    for scout in scouts:
        email = scout.get('email', '').lower().strip()
        if not email:
            continue
        
        # Get the user ID
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        result = cur.fetchone()
        
        if not result:
            # Create user first
            try:
                cur.execute("""
                    INSERT INTO users (
                        email, password_hash, name, phone, role, is_verified, email_verified
                    ) VALUES (%s, '', %s, %s, 'pro'::user_role, false, false)
                    RETURNING id
                """, (email, scout.get('name', ''), scout.get('phone', '')))
                result = cur.fetchone()
            except Exception as e:
                print(f"  Error creating user for scout {email}: {e}")
                conn.rollback()
                errors += 1
                continue
        
        user_id = result[0]
        # If scout has a profile image, copy it into users.profile_image
        try:
            profile_img = scout.get('profile_image')
            if profile_img:
                cur.execute("UPDATE users SET profile_image = %s WHERE id = %s", (profile_img, user_id))
        except Exception as e:
            print(f"  Warning: could not set profile_image for user {email}: {e}")
        
        # Check if pro_profile already exists
        cur.execute("SELECT id FROM pro_profiles WHERE user_id = %s", (user_id,))
        if cur.fetchone():
            skipped += 1
            continue
        
        try:
            # Map experience_level
            exp_level = scout.get('experience_level', 'local_shows')
            if exp_level not in ('local_shows', 'touring', 'sxsw_veteran'):
                exp_level = 'local_shows'
            
            # Map verification_status
            ver_status = scout.get('verification_status', 'none')
            if ver_status not in ('none', 'pending', 'approved', 'rejected'):
                ver_status = 'none'
            
            cur.execute("""
                INSERT INTO pro_profiles (
                    user_id, business_name, services, venue_types, style_tags,
                    experience_level, sxsw_years, gear_highlights, portfolio_images,
                    location, budget_min, budget_max,
                    available_last_minute, turnaround_days, availability_dates,
                    verification_status, is_austin_based,
                    average_rating, total_reviews
                ) VALUES (
                    %s, %s, %s::text[], %s::text[], %s::text[],
                    %s::experience_level, %s, %s::text[], %s::text[],
                    %s, %s, %s,
                    %s, %s, %s::date[],
                    %s::verification_status, %s,
                    %s, %s
                )
            """, (
                user_id,
                scout.get('name', ''),
                scout.get('services', []),
                scout.get('venue_types', []),
                scout.get('style_tags', []),
                exp_level,
                scout.get('sxsw_years', 0),
                scout.get('gear_highlights', []),
                scout.get('portfolio_images', []),
                scout.get('location', ''),
                scout.get('budget_min'),
                scout.get('budget_max'),
                scout.get('available_last_minute', False),
                scout.get('turnaround_days'),
                scout.get('availability_dates', []),
                ver_status,
                scout.get('is_austin_based', True),
                scout.get('rating', 0),
                scout.get('review_count', 0)
            ))
            migrated += 1
        except Exception as e:
            print(f"  Error migrating scout {email}: {e}")
            conn.rollback()
            errors += 1
            continue
    
    conn.commit()
    cur.close()
    print(f"  ✅ Migrated {migrated} scouts, skipped {skipped} existing, {errors} errors")
    return migrated


def migrate_bookings(conn):
    """Migrate booking requests"""
    print("\n📅 Migrating booking requests...")
    
    bookings = load_json(BOOKINGS_FILE, [])
    print(f"  Found {len(bookings)} bookings in JSON file")
    
    if not bookings:
        print("  No bookings to migrate")
        return 0
    
    cur = conn.cursor()
    migrated = 0
    skipped = 0
    errors = 0
    
    for booking in bookings:
        # Get customer and pro IDs by email
        customer_email = booking.get('requester_email', '').lower().strip()
        
        if not customer_email:
            continue
        
        # Find customer
        cur.execute("SELECT id FROM users WHERE email = %s", (customer_email,))
        customer_result = cur.fetchone()
        
        if not customer_result:
            # Create customer user
            try:
                cur.execute("""
                    INSERT INTO users (email, password_hash, name, phone, role)
                    VALUES (%s, '', %s, %s, 'customer'::user_role)
                    RETURNING id
                """, (customer_email, booking.get('requester_name', ''), booking.get('requester_phone', '')))
                customer_result = cur.fetchone()
            except Exception as e:
                print(f"  Error creating customer {customer_email}: {e}")
                conn.rollback()
                errors += 1
                continue
        
        customer_id = customer_result[0]
        
        # Find pro by scout_id - look up scout email first
        scout_id = booking.get('scout_id', '')
        pro_id = None
        
        scouts = load_json(SCOUTS_FILE, [])
        for scout in scouts:
            if scout.get('id') == scout_id:
                scout_email = scout.get('email', '').lower().strip()
                cur.execute("SELECT id FROM users WHERE email = %s", (scout_email,))
                pro_result = cur.fetchone()
                if pro_result:
                    pro_id = pro_result[0]
                break
        
        if not pro_id:
            print(f"  Warning: Could not find pro for booking (scout_id: {scout_id})")
            errors += 1
            continue
        
        try:
            # Parse event date
            event_date = booking.get('event_date', '')
            if not event_date:
                errors += 1
                continue
            
            # Map status
            status = booking.get('status', 'pending')
            if status not in ('pending', 'confirmed', 'completed', 'cancelled', 'declined'):
                status = 'pending'
            
            cur.execute("""
                INSERT INTO booking_requests (
                    customer_id, pro_id,
                    requester_name, requester_email, requester_phone,
                    event_date, start_time, end_time,
                    venue_name, venue_type, venue_area,
                    is_multiday, additional_dates,
                    services_needed, budget_range, message, organization,
                    status, created_at, updated_at
                ) VALUES (
                    %s, %s,
                    %s, %s, %s,
                    %s::date, %s::time, %s::time,
                    %s, %s, %s,
                    %s, %s::date[],
                    %s::text[], %s, %s, %s,
                    %s::booking_status, %s, %s
                )
            """, (
                customer_id, pro_id,
                booking.get('requester_name', ''),
                customer_email,
                booking.get('requester_phone', ''),
                event_date,
                booking.get('start_time') or None,
                booking.get('end_time') or None,
                booking.get('venue_name', ''),
                booking.get('venue_type', ''),
                booking.get('venue_area', ''),
                booking.get('is_multiday', False),
                booking.get('additional_dates', []),
                booking.get('services_needed', []),
                booking.get('budget_range', ''),
                booking.get('message', ''),
                booking.get('organization', ''),
                status,
                booking.get('created_date', datetime.utcnow().isoformat()),
                booking.get('updated_date', datetime.utcnow().isoformat())
            ))
            migrated += 1
        except Exception as e:
            print(f"  Error migrating booking: {e}")
            conn.rollback()
            errors += 1
            continue
    
    conn.commit()
    cur.close()
    print(f"  ✅ Migrated {migrated} bookings, {errors} errors")
    return migrated


def main():
    parser = argparse.ArgumentParser(description='Migrate JSON data to PostgreSQL')
    parser.add_argument('--init', action='store_true', help='Initialize database schema')
    parser.add_argument('--migrate', action='store_true', help='Migrate JSON data')
    parser.add_argument('--all', action='store_true', help='Do both init and migrate')
    
    args = parser.parse_args()
    
    if not any([args.init, args.migrate, args.all]):
        parser.print_help()
        sys.exit(1)
    
    if not DATABASE_URL:
        print("❌ DATABASE_URL not set in .env file")
        sys.exit(1)
    
    print("🔌 Connecting to database...")
    print(f"   Host: {DATABASE_URL.split('@')[1].split('/')[0] if '@' in DATABASE_URL else 'unknown'}")
    
    try:
        import psycopg2
    except ImportError:
        print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ Connected successfully!")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)
    
    try:
        if args.init or args.all:
            init_schema(conn)
        
        if args.migrate or args.all:
            print("\n🚀 Starting data migration...")
            
            total = 0
            total += migrate_users(conn)
            total += migrate_taskers(conn)
            total += migrate_scouts(conn)
            total += migrate_bookings(conn)
            
            print(f"\n✅ Migration complete! Total records migrated: {total}")
    
    finally:
        conn.close()
        print("\n🔌 Database connection closed")


if __name__ == "__main__":
    main()
