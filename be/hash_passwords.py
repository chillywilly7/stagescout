#!/usr/bin/env python3
"""Generate bcrypt hash and update taskers.json"""
import json
import bcrypt

# Generate hash for TestPass123!
password = b"TestPass123!"
hashed = bcrypt.hashpw(password, bcrypt.gensalt()).decode()
print(f"Generated hash: {hashed}")

# Load and update taskers.json
with open("data/taskers.json", "r") as f:
    data = json.load(f)

for tasker in data["taskers"]:
    tasker["password"] = hashed
    print(f"Updated: {tasker['email']}")

# Save
with open("data/taskers.json", "w") as f:
    json.dump(data, f, indent=2)

print(f"\nDone! All passwords set to bcrypt hash.")
print(f"You can now login with: TestPass123!")
