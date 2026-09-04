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
    status TEXT DEFAULT 'unsent', -- unsent, sent, failed
    ai_generated_subject TEXT,
    ai_generated_body TEXT,
    error_log TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster querying in dashboard
CREATE INDEX IF NOT EXISTS idx_outreach_status ON outreach_leads(status);
CREATE INDEX IF NOT EXISTS idx_outreach_campaign ON outreach_leads(campaign_id);
