-- Supabase Migration: Create WhatsApp Logs Table
-- Run this in Supabase SQL Editor

-- Create whatsapp_logs table for audit trail
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  message_body TEXT NOT NULL,
  twilio_sid VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_order_id ON whatsapp_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_twilio_sid ON whatsapp_logs(twilio_sid);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);

-- Enable RLS (Row Level Security)
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their order's logs
CREATE POLICY "Users can view their order WhatsApp logs"
  ON whatsapp_logs
  FOR SELECT
  TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE sme_id = auth.uid()
    )
  );

-- Create policy to allow service role (backend) to insert logs
CREATE POLICY "Service role can insert WhatsApp logs"
  ON whatsapp_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow service role to update logs
CREATE POLICY "Service role can update WhatsApp logs"
  ON whatsapp_logs
  FOR UPDATE
  TO authenticated
  USING (true);

-- Optional: Add column to orders table to track last WhatsApp notification time
-- This prevents duplicate messages
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_whatsapp_notification TIMESTAMP;

-- Add index for last_whatsapp_notification
CREATE INDEX IF NOT EXISTS idx_orders_last_whatsapp ON orders(last_whatsapp_notification);
