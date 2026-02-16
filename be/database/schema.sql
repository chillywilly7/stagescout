-- StageScout Database Schema
-- PostgreSQL (compatible with Supabase, Neon, Railway - all free for dev)
-- 
-- Design Principles:
-- 1. Single unified users table for all account types (customers & pros)
-- 2. Separate pro_profiles table for professional-specific data
-- 3. Proper foreign key relationships
-- 4. Messaging via conversations + messages tables
-- 5. Full audit trail with timestamps

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
CREATE TYPE user_role AS ENUM ('customer', 'pro', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'declined');
CREATE TYPE verification_status AS ENUM ('none', 'pending', 'approved', 'rejected');
CREATE TYPE experience_level AS ENUM ('local_shows', 'touring', 'sxsw_veteran');
CREATE TYPE message_sender_type AS ENUM ('customer', 'pro', 'system');

-- ============================================================================
-- USERS TABLE (Unified for all account types)
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core Identity (required for ALL users)
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    
    -- Account Type & Status
    role user_role NOT NULL DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    
    -- Verification Codes (temporary, cleared after use)
    verification_code VARCHAR(10),
    verification_code_expires TIMESTAMPTZ,
    password_reset_code VARCHAR(10),
    password_reset_expires TIMESTAMPTZ,
    
    -- Security Questions
    security_question_1 TEXT,
    security_answer_1_hash VARCHAR(255),
    security_question_2 TEXT,
    security_answer_2_hash VARCHAR(255),
    
    -- Profile (shared fields for both customers and pros)
    profile_image TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    
    -- Session Management
    last_login TIMESTAMPTZ,
    auth_token TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- ============================================================================
-- PRO PROFILES TABLE (Professional-specific data, linked 1:1 to users)
-- ============================================================================
CREATE TABLE pro_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    
    -- Business Identity
    business_name VARCHAR(255),  -- Can differ from user.name (e.g., "Capitol Audio" vs "John Smith")
    
    -- Services & Expertise
    services TEXT[] DEFAULT '{}',  -- ['audio_rental', 'dj', 'photography', 'videography', 'lighting', 'full_production']
    venue_types TEXT[] DEFAULT '{}',  -- ['indoor', 'outdoor', 'popup', 'showcase', 'brand_activation']
    style_tags TEXT[] DEFAULT '{}',  -- ['Rock', 'Indie', 'Electronic', etc.]
    
    -- Experience
    experience_level experience_level,
    sxsw_years INTEGER DEFAULT 0,
    years_experience INTEGER DEFAULT 0,
    
    -- Equipment & Gear
    gear_highlights TEXT[] DEFAULT '{}',
    equipment_list TEXT[] DEFAULT '{}',
    
    -- Portfolio
    portfolio_images TEXT[] DEFAULT '{}',
    
    -- Location & Service Area
    location VARCHAR(100),  -- 'downtown', 'east_austin', etc.
    zip_code VARCHAR(10),
    service_radius_miles INTEGER DEFAULT 25,
    is_austin_based BOOLEAN DEFAULT TRUE,
    
    -- Pricing
    budget_min DECIMAL(10,2),
    budget_max DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    daily_rate DECIMAL(10,2),
    
    -- Availability
    available_last_minute BOOLEAN DEFAULT FALSE,
    turnaround_days INTEGER,  -- For photo/video delivery
    availability_dates DATE[] DEFAULT '{}',
    
    -- Verification (Business verification for trust badge)
    verification_status verification_status DEFAULT 'none',
    verification_business_name VARCHAR(255),
    verification_tax_id VARCHAR(50),
    verification_insurance VARCHAR(255),
    verification_insurance_expiry DATE,
    verification_documents TEXT[] DEFAULT '{}',
    
    -- Ratings & Reviews
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    
    -- Flags
    is_featured BOOLEAN DEFAULT FALSE,
    is_pro_plus BOOLEAN DEFAULT FALSE,  -- Premium tier
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pro_profiles_user_id ON pro_profiles(user_id);
CREATE INDEX idx_pro_profiles_services ON pro_profiles USING GIN(services);
CREATE INDEX idx_pro_profiles_location ON pro_profiles(location);
CREATE INDEX idx_pro_profiles_rating ON pro_profiles(average_rating DESC);

-- ============================================================================
-- BOOKING REQUESTS TABLE
-- ============================================================================
CREATE TABLE booking_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Parties involved
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pro_profile_id UUID REFERENCES pro_profiles(id) ON DELETE SET NULL,
    
    -- Requester Info (denormalized for historical record)
    requester_name VARCHAR(255) NOT NULL,
    requester_email VARCHAR(255) NOT NULL,
    requester_phone VARCHAR(20),
    organization VARCHAR(255),
    
    -- Event Details
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_multiday BOOLEAN DEFAULT FALSE,
    additional_dates DATE[] DEFAULT '{}',
    
    -- Venue Info
    venue_name VARCHAR(255),
    venue_type VARCHAR(100),
    venue_area VARCHAR(100),
    venue_address TEXT,
    
    -- Service Request
    services_needed TEXT[] DEFAULT '{}',
    budget_range VARCHAR(50),
    message TEXT,
    
    -- Status & Workflow
    status booking_status DEFAULT 'pending',
    pro_response TEXT,
    confirmed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Financial
    agreed_price DECIMAL(10,2),
    deposit_paid BOOLEAN DEFAULT FALSE,
    final_paid BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_customer ON booking_requests(customer_id);
CREATE INDEX idx_bookings_pro ON booking_requests(pro_id);
CREATE INDEX idx_bookings_status ON booking_requests(status);
CREATE INDEX idx_bookings_event_date ON booking_requests(event_date);

-- ============================================================================
-- CONVERSATIONS TABLE (Groups messages for a booking or direct chat)
-- ============================================================================
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link to booking (optional - could be pre-booking inquiry)
    booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
    
    -- Participants
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Metadata
    subject VARCHAR(255),
    is_archived BOOLEAN DEFAULT FALSE,
    
    -- Read status tracking
    last_message_at TIMESTAMPTZ,
    customer_last_read TIMESTAMPTZ,
    pro_last_read TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique conversation per booking
    UNIQUE(booking_request_id) 
);

CREATE INDEX idx_conversations_customer ON conversations(customer_id);
CREATE INDEX idx_conversations_pro ON conversations(pro_id);
CREATE INDEX idx_conversations_booking ON conversations(booking_request_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    
    -- Sender
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sender_type message_sender_type NOT NULL,
    
    -- Content
    message TEXT NOT NULL,
    
    -- Attachments (file URLs)
    attachments TEXT[] DEFAULT '{}',
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Soft delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Links
    booking_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pro_profile_id UUID REFERENCES pro_profiles(id) ON DELETE SET NULL,
    
    -- Review Content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Specific Ratings (optional)
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    
    -- Moderation
    is_public BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    
    -- Response from pro
    pro_response TEXT,
    pro_response_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One review per booking per direction
    UNIQUE(booking_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_pro_profile ON reviews(pro_profile_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification Content
    type VARCHAR(50) NOT NULL,  -- 'new_booking', 'message', 'booking_confirmed', etc.
    title VARCHAR(255) NOT NULL,
    body TEXT,
    
    -- Links
    action_url TEXT,
    related_booking_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
    related_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- ============================================================================
-- SAVED/FAVORITES TABLE
-- ============================================================================
CREATE TABLE saved_pros (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pro_profile_id UUID REFERENCES pro_profiles(id) ON DELETE SET NULL,
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(customer_id, pro_id)
);

CREATE INDEX idx_saved_customer ON saved_pros(customer_id);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pro_profiles_updated_at BEFORE UPDATE ON pro_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_requests_updated_at BEFORE UPDATE ON booking_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update pro profile ratings when review is added
CREATE OR REPLACE FUNCTION update_pro_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pro_profiles
    SET 
        average_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM reviews
            WHERE pro_profile_id = NEW.pro_profile_id AND is_public = TRUE
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM reviews
            WHERE pro_profile_id = NEW.pro_profile_id AND is_public = TRUE
        )
    WHERE id = NEW.pro_profile_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ratings_on_review AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_pro_ratings();

-- Update conversation last_message_at when message is sent
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversation_on_message AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ============================================================================
-- VIEWS (Common queries)
-- ============================================================================

-- Pro listing view (for FindScouts page)
CREATE VIEW pro_listings AS
SELECT 
    u.id AS user_id,
    u.name,
    u.email,
    u.phone,
    u.profile_image,
    u.is_verified AS account_verified,
    p.id AS profile_id,
    p.business_name,
    p.services,
    p.venue_types,
    p.style_tags,
    p.experience_level,
    p.sxsw_years,
    p.gear_highlights,
    p.portfolio_images,
    p.location,
    p.is_austin_based,
    p.budget_min,
    p.budget_max,
    p.available_last_minute,
    p.turnaround_days,
    p.verification_status,
    p.average_rating,
    p.total_reviews,
    p.is_featured,
    p.created_at
FROM users u
JOIN pro_profiles p ON u.id = p.user_id
WHERE u.role = 'pro' AND u.is_active = TRUE;

-- ============================================================================
-- SAMPLE DATA (for development)
-- ============================================================================

-- Insert sample pro user
INSERT INTO users (email, password_hash, name, phone, role, is_verified, email_verified)
VALUES (
    'demo@stagescout.com',
    crypt('DemoPass123', gen_salt('bf')),
    'Demo DJ',
    '5125550100',
    'pro',
    TRUE,
    TRUE
);

-- Get the user ID and create pro profile
DO $$
DECLARE 
    demo_user_id UUID;
BEGIN
    SELECT id INTO demo_user_id FROM users WHERE email = 'demo@stagescout.com';
    
    INSERT INTO pro_profiles (
        user_id,
        business_name,
        services,
        venue_types,
        style_tags,
        experience_level,
        sxsw_years,
        gear_highlights,
        location,
        budget_min,
        budget_max,
        available_last_minute
    ) VALUES (
        demo_user_id,
        'Demo DJ Services',
        ARRAY['dj', 'audio_rental'],
        ARRAY['indoor', 'outdoor', 'popup'],
        ARRAY['Electronic', 'Hip-Hop', 'Pop'],
        'sxsw_veteran',
        5,
        ARRAY['Pioneer CDJ-3000', 'DJM-900NXS2', 'QSC K-Series'],
        'downtown',
        500,
        2500,
        TRUE
    );
END $$;
