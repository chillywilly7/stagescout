#!/usr/bin/env python3
"""
Migrate existing plain text passwords to bcrypt hashes
Run this once to update all existing users
"""

import json
import os
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DATA_FILE = os.path.join(os.path.dirname(__file__), "data/taskers.json")

def migrate_passwords():
    """Hash all plain text passwords in the database"""
    
    # Load existing data
    try:
        with open(DATA_FILE, 'r') as f:
            data = json.load(f)
            taskers = data.get('taskers', [])
    except FileNotFoundError:
        print("No taskers.json file found")
        return
    
    print(f"Found {len(taskers)} users")
    updated = 0
    
    for tasker in taskers:
        password = tasker.get('password', '')
        
        # Check if password is already a bcrypt hash
        if password.startswith('$2b$') or password.startswith('$2a$') or password.startswith('$2y$'):
            print(f"✓ {tasker['email']}: Already hashed, skipping")
            continue
        
        # Hash the plain text password
        if password:
            # Bcrypt has a 72-byte limit, truncate password if necessary
            hashed = pwd_context.hash(password[:72])
            tasker['password'] = hashed
            updated += 1
            print(f"✓ {tasker['email']}: Password hashed")
            updated += 1
            print(f"✓ {tasker['email']}: Password hashed")
        else:
            print(f"⚠ {tasker['email']}: No password, skipping")
    
    if updated > 0:
        # Save updated data
        with open(DATA_FILE, 'w') as f:
            json.dump({"taskers": taskers}, f, indent=2)
        print(f"\n✅ Successfully updated {updated} passwords")
        print(f"All test users now use password: TestPass123!")
    else:
        print("\n✅ No passwords needed updating")

if __name__ == "__main__":
    print("=" * 50)
    print("Password Migration Script")
    print("=" * 50)
    print()
    migrate_passwords()
    print()
    print("=" * 50)
