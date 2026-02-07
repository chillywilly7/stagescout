#!/usr/bin/env python3
"""
StagePros Authentication API Tester
Test the signup and login functionality directly
"""

import requests
import json
import time
from datetime import datetime

# API Configuration
API_BASE_URL = "http://localhost:8000/api"
HEADERS = {"Content-Type": "application/json"}

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(msg):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {msg}{Colors.RESET}")

def print_error(msg):
    """Print error message"""
    print(f"{Colors.RED}❌ {msg}{Colors.RESET}")

def print_info(msg):
    """Print info message"""
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.RESET}")

def test_health_check():
    """Test if API is running"""
    print_section("Testing API Health Check")
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code == 200:
            print_success(f"API is running: {response.json()}")
            return True
        else:
            print_error(f"API returned status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot connect to API: {e}")
        print_info("Make sure backend is running: python -m uvicorn app.main:app --reload")
        return False

def test_get_test_users():
    """Get all test users"""
    print_section("Fetching Test Users")
    try:
        response = requests.get(f"{API_BASE_URL}/test-users")
        if response.status_code == 200:
            data = response.json()
            test_users = data.get('test_users', [])
            print_success(f"Found {len(test_users)} test users:")
            for user in test_users:
                print(f"  - {user['name']} ({user['email']})")
            return test_users
        else:
            print_error(f"Failed to fetch test users: {response.status_code}")
            return []
    except Exception as e:
        print_error(f"Error: {e}")
        return []

def test_signup(email, password, name, phone):
    """Test signup endpoint"""
    print_section(f"Testing Signup: {email}")
    
    payload = {
        "email": email,
        "password": password,
        "name": name,
        "phone": phone,
        "security_question_1": "What is your pet's name?",
        "security_answer_1": "TestPet",
        "security_question_2": "What city were you born in?",
        "security_answer_2": "TestCity"
    }
    
    print_info(f"Signing up with: {email}")
    print(f"Password: {password}")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/signup",
            json=payload,
            headers=HEADERS
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            print_success("Signup successful!")
            print(json.dumps(data, indent=2))
            return data
        else:
            data = response.json()
            print_error(f"Signup failed: {data.get('detail', 'Unknown error')}")
            print(json.dumps(data, indent=2))
            return None
            
    except Exception as e:
        print_error(f"Error: {e}")
        return None

def test_login(email, password):
    """Test login endpoint"""
    print_section(f"Testing Login: {email}")
    
    payload = {
        "email": email,
        "password": password
    }
    
    print_info(f"Logging in with: {email}")
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json=payload,
            headers=HEADERS
        )
        
        print(f"\nResponse Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success("Login successful!")
            print(json.dumps(data, indent=2))
            
            # Check for cookie
            if 'Set-Cookie' in response.headers:
                print_info("Auth token cookie set successfully")
            
            return response.cookies, data
        else:
            data = response.json()
            print_error(f"Login failed: {data.get('detail', 'Unknown error')}")
            return None, None
            
    except Exception as e:
        print_error(f"Error: {e}")
        return None, None

def test_invalid_passwords():
    """Test password validation"""
    print_section("Testing Password Validation")
    
    test_cases = [
        ("short", False, "Too short"),
        ("nouppercase123!", False, "No uppercase"),
        ("NOLOWERCASE123!", False, "No lowercase"),
        ("NoNumbers!", False, "No numbers"),
        ("NoSpecial123", False, "No special char"),
        ("ValidPass123!", True, "Valid password"),
        ("SecureP@ssw0rd", True, "Valid password"),
        ("Complex#Pass456", True, "Valid password"),
    ]
    
    for password, should_pass, description in test_cases:
        print_info(f"Testing: {password} - {description}")
        
        payload = {
            "email": f"test_{int(time.time())}@example.com",
            "password": password,
            "name": "Test User",
            "phone": "5551234567",
            "security_question_1": "What is your pet's name?",
            "security_answer_1": "Test",
            "security_question_2": "What city were you born in?",
            "security_answer_2": "Test"
        }
        
        try:
            response = requests.post(
                f"{API_BASE_URL}/auth/signup",
                json=payload,
                headers=HEADERS
            )
            
            if should_pass:
                if response.status_code in [200, 201]:
                    print_success(f"  ✓ Accepted as expected")
                else:
                    print_error(f"  ✗ Rejected but should pass: {response.json().get('detail')}")
            else:
                if response.status_code != 200 and response.status_code != 201:
                    print_success(f"  ✓ Rejected as expected")
                else:
                    print_error(f"  ✗ Accepted but should reject")
                    
        except Exception as e:
            print_error(f"  Error: {e}")

def test_duplicate_email():
    """Test duplicate email prevention"""
    print_section("Testing Duplicate Email Prevention")
    
    unique_email = f"duplicate_test_{int(time.time())}@example.com"
    
    # First signup
    print_info("Attempting first signup with email...")
    payload1 = {
        "email": unique_email,
        "password": "FirstPass123!",
        "name": "First User",
        "phone": "5551234567",
        "security_question_1": "What is your pet's name?",
        "security_answer_1": "Pet",
        "security_question_2": "What city were you born in?",
        "security_answer_2": "City"
    }
    
    try:
        response1 = requests.post(
            f"{API_BASE_URL}/auth/signup",
            json=payload1,
            headers=HEADERS
        )
        
        if response1.status_code in [200, 201]:
            print_success("First signup successful")
        else:
            print_error(f"First signup failed: {response1.json().get('detail')}")
            return
        
        # Second signup with same email
        print_info("Attempting second signup with same email...")
        payload2 = {
            "email": unique_email,
            "password": "SecondPass123!",
            "name": "Second User",
            "phone": "5559876543",
            "security_question_1": "What is your pet's name?",
            "security_answer_1": "Pet2",
            "security_question_2": "What city were you born in?",
            "security_answer_2": "City2"
        }
        
        response2 = requests.post(
            f"{API_BASE_URL}/auth/signup",
            json=payload2,
            headers=HEADERS
        )
        
        if response2.status_code != 200 and response2.status_code != 201:
            print_success(f"Duplicate email correctly rejected: {response2.json().get('detail')}")
        else:
            print_error("Duplicate email was allowed (should be rejected)")
            
    except Exception as e:
        print_error(f"Error: {e}")

def main():
    """Run all tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════╗")
    print("║  StagePros Auth System - API Tester   ║")
    print("║     Testing Signup & Login Workflow    ║")
    print("╚════════════════════════════════════════╝")
    print(f"{Colors.RESET}")
    
    # Check if API is running
    if not test_health_check():
        return
    
    # Get existing test users
    test_users = test_get_test_users()
    
    # Test password validation
    test_invalid_passwords()
    
    # Test duplicate email prevention
    test_duplicate_email()
    
    # Test signup with valid data
    print_section("Interactive Signup Test")
    unique_email = f"newuser_{int(time.time())}@test.com"
    signup_result = test_signup(
        email=unique_email,
        password="NewUser123!",
        name="New Test User",
        phone="5555551234"
    )
    
    if signup_result:
        # Test login with new credentials
        test_login(
            email=unique_email,
            password="NewUser123!"
        )
    
    # Test login with existing user if available
    if test_users:
        print_section("Testing Login with Existing User")
        first_user = test_users[0]
        test_login(
            email=first_user['email'],
            password=first_user['password']
        )
    
    print(f"\n{Colors.GREEN}{Colors.BOLD}✅ All tests completed!{Colors.RESET}\n")

if __name__ == "__main__":
    main()
