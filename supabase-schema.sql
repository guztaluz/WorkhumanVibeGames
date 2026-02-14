-- Supabase Schema for Vibe Games
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (for pairing - names, avatars, skill levels)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  avatar_url TEXT,
  skill_level TEXT NOT NULL DEFAULT 'just_starting' CHECK (skill_level IN ('just_starting', 'getting_hang', 'master')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event state (current phase: profiles, pairings, voting)
CREATE TABLE IF NOT EXISTS event_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  current_phase TEXT NOT NULL DEFAULT 'profiles' CHECK (current_phase IN ('profiles', 'pairings', 'voting')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
INSERT INTO event_state (id, current_phase) VALUES ('default', 'profiles') ON CONFLICT (id) DO NOTHING;

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  members TEXT[] NOT NULL DEFAULT '{}',
  selected_idea TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project ideas table (pre-seeded suggestions)
CREATE TABLE IF NOT EXISTS project_ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_random_pool BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voter_name TEXT NOT NULL,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure one vote per voter per team per category
  UNIQUE(voter_name, team_id, category)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies for profiles and event_state
CREATE POLICY "Allow all operations on profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on event_state" ON event_state
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for teams (allow all operations for now - simple setup)
CREATE POLICY "Allow all operations on teams" ON teams
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for project_ideas (read only for users)
CREATE POLICY "Allow read on project_ideas" ON project_ideas
  FOR SELECT USING (true);

-- Policies for votes (allow all operations)
CREATE POLICY "Allow all operations on votes" ON votes
  FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE votes;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE event_state;

-- Seed project ideas
INSERT INTO project_ideas (title, description, is_random_pool) VALUES
  ('Plant Dating App', 'A dating app for house plants - swipe right if your fern is compatible with their succulent!', true),
  ('Pet Rock Walker', 'Uber but for people who walk your pet rock. Premium service includes rock polishing.', true),
  ('Sock Matcher', 'Tinder for matching socks after laundry. Finally find that missing pair!', true),
  ('Code Roaster AI', 'An AI that roasts your code reviews. "Oh, you call THAT a function?"', true),
  ('Drill Sergeant Meditation', 'A meditation app narrated by a drill sergeant. "BREATHE! I SAID BREATHE CALMLY!"', true),
  ('Q Foods Delivery', 'Food delivery but only foods that start with the letter Q. Quinoa for everyone!', true),
  ('Pigeon Conspiracy Network', 'A social network exclusively for conspiracy theories about pigeons being government drones.', true),
  ('Kazoo Spotify', 'Spotify but every song is replaced with kazoo covers. Experience Bohemian Rhapsody like never before.', true),
  ('Angry Cloud Storage', 'Cloud storage that yells at you when you upload files. "ANOTHER SCREENSHOT?!"', true),
  ('Procrastination Tracker', 'An app that tracks how long you spend tracking your productivity instead of being productive.', true),
  ('Excuse Generator Pro', 'AI-powered excuse generator for missing meetings. "My WiFi was attacked by digital squirrels."', true),
  ('Passive Aggressive Calendar', 'A calendar that guilt-trips you about missed appointments. "Oh, you forgot ANOTHER dentist visit?"', true),
  ('Reverse Social Media', 'A social network where you can only post on other peoples profiles about yourself.', true),
  ('Weather Mood Ring', 'An app that tells you the weather based on your mood, not the actual weather.', true),
  ('Compliment Battle Arena', 'A competitive game where players battle using only sincere compliments.', true),
  ('Time Travel Todo List', 'A todo list that sends tasks to your past self. Good luck explaining that paradox!', true),
  ('AI Rubber Duck', 'An AI rubber duck for debugging that actually quacks back unhelpful advice.', true),
  ('Introvert Party Planner', 'An app that plans parties where nobody shows up. Finally, the perfect event!', true),
  ('Opposite Day App', 'Everything in the app does the opposite of what you expect. Chaos guaranteed.', true),
  ('NFT for Mundane Things', 'Mint NFTs of your most boring possessions. Own the blockchain rights to a paperclip!', true)
ON CONFLICT DO NOTHING;
