# Quick Reference - StageScout Auth System

## 🚀 Quick Start (30 seconds)

### Terminal 1 - Backend
```bash
cd be
python -m uvicorn app.main:app --reload
```

### Terminal 2 - Frontend
```bash
cd fe
npm run dev
```

### Terminal 3 - Testing (Optional)
```bash
cd be
python test_auth.py
```

---

## 📝 Test Signup
```
Name: John Doe
Email: john@example.com
Phone: 5551234567
Password: TestPass123!
Confirm: TestPass123!
Security Q1: Pick any, answer anything
Security Q2: Pick any, answer anything
```

---

## ✅ Valid Passwords
- `SecurePass123!`
- `MyP@ssw0rd`
- `Complex#Pass456`
- `TestPass123!`

## ❌ Invalid Passwords (Why?)
- `short` - **Too short**
- `noupppercase123!` - **No uppercase**
- `NOLOWERCASE123!` - **No lowercase**
- `NoNumbers!` - **No numbers**
- `NoSpecial123` - **No special char**

---

## 🔐 Password Requirements
```
✓ 8+ characters
✓ Uppercase letter (A-Z)
✓ Lowercase letter (a-z)
✓ Number (0-9)
✓ Special character (!@#$%^&*)
```

---

## API Endpoints

### Signup
```
POST /api/auth/signup
Body: {
  "email": "user@example.com",
  "password": "ValidPass123!",
  "name": "User Name",
  "phone": "5551234567",
  "security_question_1": "...",
  "security_answer_1": "...",
  "security_question_2": "...",
  "security_answer_2": "..."
}
```

### Login
```
POST /api/auth/login
Body: {
  "email": "user@example.com",
  "password": "ValidPass123!"
}
```

### Logout
```
POST /api/auth/logout
```

### Get Current User
```
GET /api/auth/me
```

### Get Test Users
```
GET /api/test-users
```

---

## Files You Need to Know About

### Backend
- `be/app/main.py` - All auth endpoints
- `be/requirements.txt` - Dependencies
- `be/test_auth.py` - Testing script

### Frontend  
- `fe/src/components/SignupModal.jsx` - Signup form
- `fe/src/components/LoginModal.jsx` - Login form
- `fe/src/components/PasswordStrengthMeter.jsx` - Password validator
- `fe/src/api/base44Client.js` - API client
- `fe/src/layout/Layout.jsx` - Main layout with modals

### Documentation
- `AUTHENTICATION.md` - Full documentation
- `IMPLEMENTATION_SUMMARY.md` - What was built
- `TEST_GUIDE.sh` - Testing instructions
- `be/test_auth.py` - API test script

---

## 🧪 Common Test Cases

### Test 1: Valid Signup
```
✓ Fill all fields correctly
✓ Watch password strength meter turn green
✓ Click Create Account
✓ Should be logged in automatically
```

### Test 2: Duplicate Email
```
✓ Sign up with email1@test.com
✓ Try to sign up again with same email
✓ Should see: "Email already registered"
```

### Test 3: Weak Password
```
✓ Enter password: "weak"
✓ Watch meter show red
✓ See requirements not met
✓ Can't submit form
```

### Test 4: Password Mismatch
```
✓ Enter password: TestPass123!
✓ Confirm with: DifferentPass123!
✓ See error: "Passwords do not match"
✓ Can't submit form
```

### Test 5: Login After Signup
```
✓ Sign up successfully
✓ Refresh page (session persists)
✓ Logout
✓ Sign in with credentials
✓ Should work
```

---

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check dependencies
pip install -r requirements.txt

# Port 8000 in use?
lsof -i :8000  # Mac/Linux
netstat -ano | findstr :8000  # Windows
```

### Can't see signup form
- Check `SignupModal.jsx` exists in `fe/src/components/`
- Check import in `Layout.jsx` is correct
- Check browser console for errors (F12)

### Passwords not validating
- Ensure all special characters are typed
- Watch the password strength meter
- Check backend validation: `be/app/main.py` line ~100

### Can't login after signup
- Check browser has cookies enabled
- Clear cookies and try again
- Check `access_token` cookie in DevTools > Application > Cookies

### Backend test script fails
```bash
# Make sure backend is running first
python -m uvicorn app.main:app --reload

# Then in different terminal
python test_auth.py
```

---

## 🔗 Links

### Local URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Files
- [Authentication Docs](./AUTHENTICATION.md)
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Test Guide](./TEST_GUIDE.sh)
- [Backend Test](./be/test_auth.py)

---

## 💡 Tips

1. **Password Testing**
   - Use `TestPass123!` for quick testing
   - Meets all requirements
   - Easy to remember

2. **Backend Docs**
   - Go to http://localhost:8000/docs
   - Try endpoints directly in browser
   - See responses in real-time

3. **Frontend Debugging**
   - Open DevTools (F12)
   - Network tab: see API calls
   - Console: see errors
   - Application: see cookies

4. **Testing API Directly**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@test.com","password":"ValidPass123!"}'
   ```

---

## 🎯 Next Steps

After testing, consider:

1. **Email Verification** - Send verification codes
2. **Two-Factor Auth** - SMS or authenticator app
3. **OAuth** - Google, Facebook, Apple login
4. **Password Reset** - Email-based recovery
5. **Profile Completion** - Additional user info
6. **Rate Limiting** - Prevent brute force attacks

---

## 📞 Need Help?

1. Check console errors (F12)
2. Read AUTHENTICATION.md for details
3. Review IMPLEMENTATION_SUMMARY.md for overview
4. Run TEST_GUIDE.sh for manual testing
5. Use be/test_auth.py for API testing

---

**Last Updated**: January 24, 2026  
**Status**: ✅ Production Ready  
**Version**: 1.0.0
