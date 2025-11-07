-- UC46 - Add payment method and prescription image to sale transactions
ALTER TABLE sale_transactions 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32),
ADD COLUMN IF NOT EXISTS prescription_image_url VARCHAR(512),
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(128);

-- Add index for payment method queries
CREATE INDEX IF NOT EXISTS idx_sale_transactions_payment_method ON sale_transactions(payment_method);

