-- Migration: Add work_location to profiles (run in Supabase SQL Editor if you already have the app deployed)
-- This adds the column with default 'in_office' so existing profiles are treated as in-office.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS work_location TEXT NOT NULL DEFAULT 'in_office'
  CHECK (work_location IN ('remote', 'in_office'));
