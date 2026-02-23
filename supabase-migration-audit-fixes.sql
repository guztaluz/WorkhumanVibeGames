-- Migration: Audit fixes for existing deployments
-- Run this SQL in your Supabase SQL Editor if you already have the app deployed.

-- 1. Add 'results' phase to event_state
ALTER TABLE event_state DROP CONSTRAINT IF EXISTS event_state_current_phase_check;
ALTER TABLE event_state ADD CONSTRAINT event_state_current_phase_check
  CHECK (current_phase IN ('profiles', 'pairings', 'voting', 'results'));

-- 2. Enforce unique profile names
ALTER TABLE profiles ADD CONSTRAINT profiles_name_unique UNIQUE (name);

-- 3. Create pairs table for persisted pairings
CREATE TABLE IF NOT EXISTS pairs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_ids UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on pairs" ON pairs
  FOR ALL USING (true) WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE pairs;
