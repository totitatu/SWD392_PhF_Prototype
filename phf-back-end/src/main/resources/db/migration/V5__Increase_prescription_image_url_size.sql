-- Fix: Increase prescription_image_url column size to support base64 encoded images
-- Base64 encoded images can be very long (several KB to MB), so we need TEXT type
ALTER TABLE sale_transactions 
ALTER COLUMN prescription_image_url TYPE TEXT;

