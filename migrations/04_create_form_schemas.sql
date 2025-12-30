-- Supabase Migration: Create Form Schema Tables
-- Allows SMEs to define custom order data collection forms

BEGIN;

-- Create form_schemas table (business form definitions)
CREATE TABLE IF NOT EXISTS form_schemas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sme_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_sme_id FOREIGN KEY (sme_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_schemas_sme_id ON form_schemas(sme_id);
CREATE INDEX IF NOT EXISTS idx_form_schemas_is_active ON form_schemas(is_active);

-- Create form_fields table (individual fields within a schema)
CREATE TABLE IF NOT EXISTS form_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_id UUID NOT NULL,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'number', 'select', 'checkbox', 'textarea', 'email', 'phone', 'date')),
  required BOOLEAN DEFAULT true,
  options JSONB, -- For select/checkbox: array of { label, value } objects
  validation JSONB, -- Custom validation rules (e.g., { minLength: 3, maxLength: 100, pattern: "..." })
  placeholder TEXT,
  help_text TEXT,
  field_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_schema_id FOREIGN KEY (schema_id) REFERENCES form_schemas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_fields_schema_id ON form_fields(schema_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_field_order ON form_fields(schema_id, field_order);

-- Create form_responses table (submitted form data per order)
CREATE TABLE IF NOT EXISTS form_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schema_id UUID NOT NULL,
  order_id UUID NOT NULL,
  sme_id UUID NOT NULL,
  customer_id UUID,
  response_data JSONB NOT NULL, -- Flat object with field_key: value pairs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_schema_id FOREIGN KEY (schema_id) REFERENCES form_schemas(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_id FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_sme_id FOREIGN KEY (sme_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_form_responses_order_id ON form_responses(order_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_sme_id ON form_responses(sme_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_schema_id ON form_responses(schema_id);

-- Enable RLS (Row Level Security)
ALTER TABLE form_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policy for form_schemas: SMEs can only see/edit their own schemas
CREATE POLICY "Users can manage their own form schemas"
  ON form_schemas
  FOR ALL
  TO authenticated
  USING (sme_id = auth.uid())
  WITH CHECK (sme_id = auth.uid());

-- RLS Policy for form_fields: accessible through schema ownership
CREATE POLICY "Users can view/manage fields of their schemas"
  ON form_fields
  FOR ALL
  TO authenticated
  USING (
    schema_id IN (SELECT id FROM form_schemas WHERE sme_id = auth.uid())
  )
  WITH CHECK (
    schema_id IN (SELECT id FROM form_schemas WHERE sme_id = auth.uid())
  );

-- RLS Policy for form_responses: SMEs see responses for their schemas/orders
CREATE POLICY "Users can view responses for their schemas"
  ON form_responses
  FOR SELECT
  TO authenticated
  USING (sme_id = auth.uid());

CREATE POLICY "Service role can insert responses"
  ON form_responses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

COMMIT;
