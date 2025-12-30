-- Supabase Migration: Create WhatsApp Config Table
-- Store per-business WhatsApp instance credentials/configuration

BEGIN;

-- Create whatsapp_configs table for per-SME WhatsApp instance setup
CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sme_id UUID NOT NULL UNIQUE, -- One config per SME
  provider TEXT NOT NULL CHECK (provider IN ('twilio', 'baileys', 'evolution')),
  provider_config JSONB NOT NULL, -- Store provider-specific config (credentials, API keys, etc.)
  is_connected BOOLEAN DEFAULT false,
  connected_at TIMESTAMP WITH TIME ZONE,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  instance_id TEXT, -- For Baileys/Evolution: instance identifier (e.g., phone number)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_sme_id FOREIGN KEY (sme_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_sme_id ON whatsapp_configs(sme_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_is_connected ON whatsapp_configs(is_connected);

-- Enable RLS
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: SMEs can only see/edit their own configs
CREATE POLICY "Users can manage their own WhatsApp config"
  ON whatsapp_configs
  FOR ALL
  TO authenticated
  USING (sme_id = auth.uid())
  WITH CHECK (sme_id = auth.uid());

-- RLS Policy: Service role can insert/update configs
CREATE POLICY "Service role can manage WhatsApp configs"
  ON whatsapp_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
