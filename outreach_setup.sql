-- Create outreach campaigns table
CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' -- active, paused, completed
);

-- Create outreach leads table
CREATE TABLE IF NOT EXISTS outreach_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    agency_name TEXT,
    agency_size TEXT,                  -- e.g. "100+", "1 broker", "10-50"
    recommended_offer TEXT,            -- AI recommended offer from DLD data
    outbound_tier TEXT,                -- e.g. "A+", "A", "B", "C"
    website TEXT,                      -- Agency website URL for ICP enrichment
    status TEXT DEFAULT 'unsent',      -- unsent, sent, failed
    ai_generated_subject TEXT,
    ai_generated_body TEXT,
    ai_rationale TEXT,                 -- AI framework explanation and trigger
    error_log TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster querying in dashboard
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_leads(status);
CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach_leads(campaign_id);

-- Migration: Add missing columns to existing table (run if table already exists)
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS agency_size TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS recommended_offer TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS outbound_tier TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS ai_rationale TEXT;

