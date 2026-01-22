-- Usage Tracking Table for TweetLab (Corrected)
-- Tracks daily analysis usage for both authenticated and anonymous users

CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE, -- Changed from UUID to TEXT to match user table
    anonymous_id TEXT,
    analysis_count INTEGER DEFAULT 0,
    reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Either user_id or anonymous_id must be set, but not both
    CONSTRAINT exclusive_identifier CHECK (
        (user_id IS NOT NULL AND anonymous_id IS NULL) OR 
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    )
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_tracking(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_anonymous_id ON usage_tracking(anonymous_id) WHERE anonymous_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_usage_reset_date ON usage_tracking(reset_date);

-- Unique constraint to ensure one record per user/anonymous per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_user_daily ON usage_tracking(user_id, reset_date) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_anonymous_daily ON usage_tracking(anonymous_id, reset_date) WHERE anonymous_id IS NOT NULL;
