-- Supabase Migration: Create Orders OTP Table
-- Run this in Supabase SQL Editor

-- Create orders_otp table for OTP-based proof-of-delivery
CREATE TABLE IF NOT EXISTS orders_otp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  otp_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_order_id_otp FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_otp_order_id ON orders_otp(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_otp_expires_at ON orders_otp(expires_at);

-- Enable RLS
ALTER TABLE orders_otp ENABLE ROW LEVEL SECURITY;

-- Policy: allow SME authenticated users to select OTP records for their orders
CREATE POLICY "Users can view OTP for their orders"
  ON orders_otp
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (SELECT id FROM orders WHERE sme_id = auth.uid())
  );

-- Policy: allow service role to insert/update OTP records
CREATE POLICY "Service role can manage OTP records"
  ON orders_otp
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE orders_otp
  ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC';
