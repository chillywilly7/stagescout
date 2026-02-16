# Database Migration Guide

## Current State (JSON Files)
The current system uses fragmented JSON files with data duplication:

| File | Purpose | Issues |
|------|---------|--------|
| `users.json` | All accounts | Has name/phone but often empty for pros |
| `ProAccount.json` | Pro auth data | Only stores email/password, no name/phone |
| `CustomerAccount.json` | Customer auth | Has name/phone, but separate from main users |
| `Scout.json` | Pro profiles | Has name/phone/bio/services but disconnected |
| `taskers.json` | Legacy sample data | Not connected to auth system |

### Data Flow Problems

1. **ScoutOnboarding** creates Scout with name/phone but ProAccount without them
2. **ProSignup** creates user in users.json with name/phone, but no Scout profile
3. **ProDashboard** queries ProAccount and Scout separately, can't find unified data

## Target State (PostgreSQL)

### Recommended Free PostgreSQL Options

| Provider | Free Tier | Best For |
|----------|-----------|----------|
| [Supabase](https://supabase.com) | 500MB, 50K monthly requests | Full-stack with auth |
| [Neon](https://neon.tech) | 512MB, serverless | Serverless apps |
| [Railway](https://railway.app) | $5/month credit | Quick deploys |
| [PlanetScale](https://planetscale.com) | 5GB reads/month | MySQL compatible |
| [ElephantSQL](https://elephantsql.com) | 20MB | Small projects |

**Recommendation: Supabase** - Free tier includes auth, realtime, storage, and 500MB database.

### Schema Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           USERS                                  │
│  (Single table for ALL accounts - customers, pros, admins)      │
│  - id, email, password_hash, name, phone                        │
│  - role: 'customer' | 'pro' | 'admin'                           │
│  - verification, security questions, profile basics             │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:1 (only for pros)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PRO_PROFILES                               │
│  (Professional-specific data)                                    │
│  - services, gear, venue_types, style_tags                       │
│  - pricing, availability, portfolio                              │
│  - business verification                                         │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BOOKING_REQUESTS                             │
│  - customer_id → users.id                                        │
│  - pro_id → users.id                                             │
│  - event details, status, pricing                                │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:1
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONVERSATIONS                                │
│  - Links customer <-> pro for messaging                          │
│  - Can exist with or without booking                             │
└─────────────────────────────────────────────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       MESSAGES                                   │
│  - sender_id, message content                                    │
│  - read status, attachments                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Signup Flow Alignment

### Customer Signup Flow
```
CustomerSignup.jsx
    │
    ├─ Step 1: Email (check availability)
    │
    ├─ Step 2: Verify email (optional code)
    │
    ├─ Step 3: Name + Phone
    │
    ├─ Step 4: Security Questions
    │
    └─ Step 5: Password
         │
         └──► POST /api/auth/signup
              {
                email, password, name, phone,
                user_type: 'customer',
                security_question_1, security_answer_1,
                security_question_2, security_answer_2
              }
              │
              └──► Creates user in USERS table with role='customer'
```

### Pro Signup Flow (Standard)
```
ProSignup.jsx
    │
    ├─ Step 1: Email (check availability)
    │
    ├─ Step 2: Verify email
    │
    ├─ Step 3: Name + Phone
    │
    ├─ Step 4: Security Questions
    │
    └─ Step 5: Password
         │
         └──► POST /api/auth/signup
              {
                email, password, name, phone,
                user_type: 'pro',
                security_question_1, security_answer_1,
                security_question_2, security_answer_2
              }
              │
              └──► Creates user in USERS table with role='pro'
              │
              └──► Creates empty PRO_PROFILES linked to user
              │
              └──► Redirects to ProDashboard for profile completion
```

### ScoutOnboarding Flow (Full Profile)
```
ScoutOnboarding.jsx ("Join StagePros" / "List Services")
    │
    ├─ Step 1: Basic Info (name, email, phone, bio)
    │
    ├─ Step 2: Services (services[], venue_types[])
    │
    ├─ Step 3: Experience (experience_level, gear, styles, portfolio)
    │
    ├─ Step 4: Pricing (budget_min, budget_max, turnaround)
    │
    ├─ Step 5: Availability (dates[])
    │
    ├─ Step 6: Email Verification
    │
    └─ Step 7: Password
         │
         └──► POST /api/auth/signup
              {
                email, password, name, phone,
                user_type: 'pro'
              }
              │
              └──► Creates user in USERS table with role='pro'
              │
              └──► POST /api/pro-profiles
              │    {
              │      user_id, business_name, services, venue_types,
              │      experience_level, gear_highlights, style_tags,
              │      budget_min, budget_max, availability_dates, ...
              │    }
              │
              └──► Creates complete PRO_PROFILES
              │
              └──► Redirects to ProDashboard (fully populated)
```

## API Endpoints (Updated for Unified Schema)

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create user (returns JWT) |
| POST | `/api/auth/login` | Login (returns JWT) |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user + profile |

### Pro Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pro-profiles` | List all (filtered) |
| GET | `/api/pro-profiles/:id` | Get one profile |
| POST | `/api/pro-profiles` | Create (after signup) |
| PATCH | `/api/pro-profiles/:id` | Update profile |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create booking request |
| GET | `/api/bookings` | List user's bookings |
| PATCH | `/api/bookings/:id` | Update status |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/conversations` | List user's conversations |
| GET | `/api/conversations/:id/messages` | Get messages |
| POST | `/api/conversations/:id/messages` | Send message |

## Migration Steps

### Phase 1: Backend Changes
1. Set up PostgreSQL (Supabase recommended)
2. Run `schema.sql` to create tables
3. Create new FastAPI endpoints for unified schema
4. Add data migration script (JSON → PostgreSQL)

### Phase 2: Frontend Changes
1. Update `stageproClient.js` with new endpoints
2. Fix ScoutOnboarding to properly link user + profile
3. Update ProDashboard to fetch from unified user endpoint
4. Remove legacy entity endpoints (ProAccount, CustomerAccount separate)

### Phase 3: Testing
1. Test all signup flows create correct data
2. Test ProDashboard loads name/phone correctly
3. Test messaging between customer and pro
4. Test booking workflow end-to-end
