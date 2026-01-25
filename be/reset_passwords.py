#!/usr/bin/env python3
"""
Reset all test user passwords to TestPass123!
This creates proper bcrypt hashes
"""

import json
import os

# Use a simple known password for all test users
# We'll set it to the plain text and let the backend hash it on first use
# Or we can generate a proper hash here
TEST_PASSWORD = "TestPass123!"

DATA_FILE = os.path.join(os.path.dirname(__file__), "data/taskers.json")

def reset_passwords():
    """Set all users to use the same test password"""
    
    # Load existing data
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            taskers = data.get('taskers', [])
    except FileNotFoundError:
        print("❌ No taskers.json file found")
        return
    
    print(f"Found {len(taskers)} users")
    
    # Generate proper bcrypt hash
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    # Bcrypt has a 72-byte limit, truncate password if necessary
    hashed_password = pwd_context.hash(TEST_PASSWORD[:72])
    print(f"✓ Generated bcrypt hash for: {TEST_PASSWORD}")
    
    for tasker in taskers:
        tasker['password'] = hashed_password
        print(f"✓ {tasker['email']}: Password set")
    
    # Save updated data
    with open(DATA_FILE, 'w') as f:
        json.dump({"taskers": taskers}, f, indent=2)
    
    print(f"\n✅ All {len(taskers)} users now use password: {TEST_PASSWORD}")
    print(f"Hash: {hashed_password[:50]}...")

if __name__ == "__main__":
    print("=" * 60)
    print("Reset Test User Passwords")
    print("=" * 60)
    print()
    reset_passwords()
    print()
    print("=" * 60)
