-- Add form_data JSONB column to orders table
-- This stores the complete form response including custom fields

ALTER TABLE orders
ADD COLUMN form_data JSONB DEFAULT NULL;

-- Create index for querying form_data if needed
CREATE INDEX idx_orders_form_data ON orders USING GIN (form_data);

COMMENT ON COLUMN orders.form_data IS 'Complete form response stored as JSONB, includes all custom fields from the form schema';
