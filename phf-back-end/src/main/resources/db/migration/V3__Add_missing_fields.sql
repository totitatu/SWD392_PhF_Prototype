-- Add missing fields to match front-end requirements

-- Add selling_price and active to inventory_batches
ALTER TABLE inventory_batches 
ADD COLUMN IF NOT EXISTS selling_price NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Update existing records to have default selling_price (same as cost_price) if null
UPDATE inventory_batches 
SET selling_price = cost_price 
WHERE selling_price IS NULL;

-- Make selling_price NOT NULL after setting defaults
ALTER TABLE inventory_batches 
ALTER COLUMN selling_price SET NOT NULL;

-- Add dosage, min_stock, and active to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dosage VARCHAR(128),
ADD COLUMN IF NOT EXISTS min_stock INTEGER,
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Sync min_stock with reorder_level if reorder_level exists
UPDATE products 
SET min_stock = reorder_level 
WHERE min_stock IS NULL AND reorder_level IS NOT NULL;

-- Add notes and active to suppliers
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS notes VARCHAR(1000),
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

