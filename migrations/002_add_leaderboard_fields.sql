-- Migration: Add Leaderboard Fields to User Table

-- Add x_handle column
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "x_handle" TEXT;

-- Add leaderboard_mode column with default 'none'
-- 'none' = Not participating (default)
-- 'normal' = Public profile
-- 'anonymous' = Anonymous participation
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "leaderboard_mode" TEXT DEFAULT 'none';
