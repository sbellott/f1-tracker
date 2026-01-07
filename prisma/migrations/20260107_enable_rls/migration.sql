-- Enable Row Level Security on all tables
-- This migration fixes the 28 RLS security errors in Supabase
-- 
-- Since this app uses NextAuth (not Supabase Auth) with Prisma direct connection,
-- we enable RLS and create policies that:
-- 1. Allow service_role access (used by Prisma) - bypasses RLS automatically
-- 2. Allow public read access to F1 reference data
-- 3. Block all write access via anon key for sensitive tables

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "predictions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "races" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "race_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circuits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "circuit_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "drivers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "driver_race_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "driver_career_info" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "constructors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "standings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_badges" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "news_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "read_articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_invitations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notification_schedules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "scoring_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "push_subscriptions" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PUBLIC READ POLICIES (F1 Reference Data)
-- Allow anyone to read public F1 data via API
-- ============================================

CREATE POLICY "public_read_races" ON "races" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_race_sessions" ON "race_sessions" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_circuits" ON "circuits" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_circuit_history" ON "circuit_history" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_drivers" ON "drivers" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_driver_race_results" ON "driver_race_results" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_driver_career_info" ON "driver_career_info" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_constructors" ON "constructors" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_standings" ON "standings" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_badges" ON "badges" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_news_items" ON "news_items" FOR SELECT TO anon, authenticated USING (true);

-- ============================================
-- RESTRICTED TABLES (No public API access)
-- These tables should only be accessed via Prisma (service_role)
-- service_role bypasses RLS automatically
-- ============================================

-- Users - No public access (sensitive data)
CREATE POLICY "no_anon_access_users" ON "users" FOR ALL TO anon USING (false);

-- Accounts - No public access (OAuth tokens)
CREATE POLICY "no_anon_access_accounts" ON "accounts" FOR ALL TO anon USING (false);

-- Sessions - No public access (session tokens)
CREATE POLICY "no_anon_access_sessions" ON "sessions" FOR ALL TO anon USING (false);

-- Verification Tokens - No public access
CREATE POLICY "no_anon_access_verification_tokens" ON "verification_tokens" FOR ALL TO anon USING (false);

-- Predictions - No public access (user data)
CREATE POLICY "no_anon_access_predictions" ON "predictions" FOR ALL TO anon USING (false);

-- User Badges - No public access
CREATE POLICY "no_anon_access_user_badges" ON "user_badges" FOR ALL TO anon USING (false);

-- Read Articles - No public access
CREATE POLICY "no_anon_access_read_articles" ON "read_articles" FOR ALL TO anon USING (false);

-- Groups - No public access
CREATE POLICY "no_anon_access_groups" ON "groups" FOR ALL TO anon USING (false);

-- Group Members - No public access
CREATE POLICY "no_anon_access_group_members" ON "group_members" FOR ALL TO anon USING (false);

-- Group Invitations - No public access
CREATE POLICY "no_anon_access_group_invitations" ON "group_invitations" FOR ALL TO anon USING (false);

-- Notifications - No public access
CREATE POLICY "no_anon_access_notifications" ON "notifications" FOR ALL TO anon USING (false);

-- Notification Schedules - No public access
CREATE POLICY "no_anon_access_notification_schedules" ON "notification_schedules" FOR ALL TO anon USING (false);

-- Scoring Jobs - No public access
CREATE POLICY "no_anon_access_scoring_jobs" ON "scoring_jobs" FOR ALL TO anon USING (false);

-- Push Subscriptions - No public access
CREATE POLICY "no_anon_access_push_subscriptions" ON "push_subscriptions" FOR ALL TO anon USING (false);
