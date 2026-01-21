-- Run this in your Supabase SQL Editor

ALTER TABLE "user" ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS ai_context TEXT;
