-- Supabase Migration: Convert orders_otp.expires_at to timestamptz (UTC)
-- Run this in Supabase SQL Editor

BEGIN;

-- Convert expires_at (timestamp without time zone) to timestamptz assuming stored values are UTC
ALTER TABLE IF EXISTS orders_otp
  ALTER COLUMN expires_at TYPE timestamptz
  USING (expires_at AT TIME ZONE 'UTC');

-- Optional: ensure created_at/updated_at are timestamptz as well (safe no-op if already)
ALTER TABLE IF EXISTS orders_otp
  ALTER COLUMN created_at TYPE timestamptz
  USING (created_at AT TIME ZONE 'UTC');

ALTER TABLE IF EXISTS orders_otp
  ALTER COLUMN updated_at TYPE timestamptz
  USING (updated_at AT TIME ZONE 'UTC');

COMMIT;
