-- =========================================================================
-- Visit Tracking System Schema
-- =========================================================================
-- Privacy-respecting visit tracking that counts unique visits without storing IPs
-- A visit is unique per page per day per browser session

-- Drop table if it exists (for testing)
DROP TABLE IF EXISTS site_visits CASCADE;

-- Create site_visits table
CREATE TABLE site_visits (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    page_slug VARCHAR(50) NOT NULL, -- 'index' or 'guestbook'
    visit_date DATE NOT NULL, -- Date of the visit (YYYY-MM-DD)
    session_id VARCHAR(64) NOT NULL, -- Browser session identifier (hashed)
    user_agent_hash VARCHAR(64), -- Hashed user agent for very basic bot detection
    referrer TEXT, -- Optional referrer information
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_daily_page_visit UNIQUE (page_slug, visit_date, session_id)
);

-- Create indexes for performance
CREATE INDEX idx_site_visits_page_date ON site_visits(page_slug, visit_date);
CREATE INDEX idx_site_visits_created_at ON site_visits(created_at);

-- Add RLS (Row Level Security)
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous users (only INSERT, no SELECT)
CREATE POLICY "Allow anonymous insert visits" ON site_visits
    FOR INSERT WITH CHECK (true);

-- Create policy for authenticated users (full access)
CREATE POLICY "Allow authenticated full access" ON site_visits
    USING (auth.role() = 'authenticated');

-- Function to get visit statistics
CREATE OR REPLACE FUNCTION get_visit_stats(p_page_slug VARCHAR(50) DEFAULT NULL)
RETURNS TABLE(
    total_visits BIGINT,
    today_visits BIGINT,
    unique_days BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_visits,
        COUNT(*) FILTER (WHERE visit_date = CURRENT_DATE)::BIGINT as today_visits,
        COUNT(DISTINCT visit_date)::BIGINT as unique_days
    FROM site_visits
    WHERE (p_page_slug IS NULL OR page_slug = p_page_slug);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a visit
CREATE OR REPLACE FUNCTION record_visit(
    p_page_slug VARCHAR(50),
    p_session_id VARCHAR(64),
    p_user_agent_hash VARCHAR(64) DEFAULT NULL,
    p_referrer TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    total_visits BIGINT,
    is_duplicate BOOLEAN
) AS $$
DECLARE
    v_visit_count BIGINT;
    v_is_duplicate BOOLEAN := FALSE;
BEGIN
    -- Try to insert the visit
    INSERT INTO site_visits (page_slug, visit_date, session_id, user_agent_hash, referrer)
    VALUES (p_page_slug, CURRENT_DATE, p_session_id, p_user_agent_hash, p_referrer)
    ON CONFLICT (page_slug, visit_date, session_id) DO NOTHING;

    -- Check if this was a duplicate (concurrent visit same day)
    v_is_duplicate := NOT FOUND;

    -- Get current total count for this page
    SELECT COUNT(*) INTO v_visit_count
    FROM site_visits
    WHERE page_slug = p_page_slug;

    RETURN QUERY SELECT
        true as success,
        COALESCE(v_visit_count, 0) as total_visits,
        v_is_duplicate as is_duplicate;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
