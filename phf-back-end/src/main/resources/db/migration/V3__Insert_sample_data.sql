-- Sample data for Pharmacy Management System
-- This file inserts sample data for testing and development

-- ============================================
-- 1. PHARMACY USERS
-- ============================================
-- Password hash for "password123" using BCrypt (rounds=10)
-- You can generate new hashes using: BCryptPasswordEncoder.encode("password123")
INSERT INTO pharmacy_users (id, full_name, email, password_hash, role, active, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'Nguyễn Văn Chủ', 'owner@pharmacy.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'OWNER', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('22222222-2222-2222-2222-222222222222', 'Trần Thị Dược Sĩ', 'pharmacist@pharmacy.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'PHARMACIST', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('33333333-3333-3333-3333-333333333333', 'Lê Văn Nhân Viên', 'staff1@pharmacy.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SALES_STAFF', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('44444444-4444-4444-4444-444444444444', 'Phạm Thị Bán Hàng', 'staff2@pharmacy.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'SALES_STAFF', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- 2. PRODUCTS
-- ============================================
INSERT INTO products (id, sku, name, active_ingredient, dosage_form, dosage_strength, category, reorder_level, expiry_alert_days, dosage, min_stock, active, created_at, updated_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PAR-500', 'Paracetamol 500mg', 'Paracetamol', 'TABLET', '500mg', 'OVER_THE_COUNTER', 50, 30, '500mg', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'IBU-400', 'Ibuprofen 400mg', 'Ibuprofen', 'TABLET', '400mg', 'OVER_THE_COUNTER', 30, 30, '400mg', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'AMO-500', 'Amoxicillin 500mg', 'Amoxicillin', 'CAPSULE', '500mg', 'PRESCRIPTION', 40, 60, '500mg', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'CET-10', 'Cetirizine 10mg', 'Cetirizine', 'TABLET', '10mg', 'OVER_THE_COUNTER', 25, 30, '10mg', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'OMEP-20', 'Omeprazole 20mg', 'Omeprazole', 'CAPSULE', '20mg', 'PRESCRIPTION', 35, 60, '20mg', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'MET-500', 'Metformin 500mg', 'Metformin', 'TABLET', '500mg', 'PRESCRIPTION', 50, 60, '500mg', 25, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'ASP-100', 'Aspirin 100mg', 'Acetylsalicylic acid', 'TABLET', '100mg', 'OVER_THE_COUNTER', 40, 30, '100mg', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'VIT-C-1000', 'Vitamin C 1000mg', 'Ascorbic acid', 'TABLET', '1000mg', 'OVER_THE_COUNTER', 30, 30, '1000mg', 15, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'CAL-500', 'Calcium 500mg', 'Calcium carbonate', 'TABLET', '500mg', 'OVER_THE_COUNTER', 35, 30, '500mg', 18, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'MULTI-VIT', 'Multivitamin', 'Multiple vitamins', 'TABLET', 'Various', 'OVER_THE_COUNTER', 25, 30, 'Various', 12, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- 3. SUPPLIERS
-- ============================================
INSERT INTO suppliers (id, name, contact_name, contact_email, contact_phone, contact_address, created_at, updated_at) VALUES
('aaaaaaaa-0000-0000-0000-000000000001', 'Công ty Dược phẩm ABC', 'Nguyễn Văn A', 'contact@abcpharma.com', '0901234567', '123 Đường ABC, Quận 1, TP.HCM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bbbbbbbb-0000-0000-0000-000000000002', 'Nhà thuốc XYZ', 'Trần Thị B', 'info@xyzpharma.com', '0902345678', '456 Đường XYZ, Quận 2, TP.HCM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cccccccc-0000-0000-0000-000000000003', 'Công ty Dược phẩm DEF', 'Lê Văn C', 'sales@defpharma.com', '0903456789', '789 Đường DEF, Quận 3, TP.HCM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dddddddd-0000-0000-0000-000000000004', 'Nhà phân phối GHI', 'Phạm Thị D', 'order@ghipharma.com', '0904567890', '321 Đường GHI, Quận 4, TP.HCM', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- 4. SUPPLIER PRODUCTS (Junction Table)
-- ============================================
INSERT INTO supplier_products (supplier_id, product_id) VALUES
-- ABC Pharma supplies
('aaaaaaaa-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), -- Paracetamol
('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), -- Ibuprofen
('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc'), -- Amoxicillin
-- XYZ Pharma supplies
('bbbbbbbb-0000-0000-0000-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd'), -- Cetirizine
('bbbbbbbb-0000-0000-0000-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'), -- Omeprazole
('bbbbbbbb-0000-0000-0000-000000000002', 'ffffffff-ffff-ffff-ffff-ffffffffffff'), -- Metformin
-- DEF Pharma supplies
('cccccccc-0000-0000-0000-000000000003', 'gggggggg-gggg-gggg-gggg-gggggggggggg'), -- Aspirin
('cccccccc-0000-0000-0000-000000000003', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh'), -- Vitamin C
('cccccccc-0000-0000-0000-000000000003', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii'), -- Calcium
-- GHI Pharma supplies
('dddddddd-0000-0000-0000-000000000004', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj'), -- Multivitamin
('dddddddd-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), -- Paracetamol (multiple suppliers)
('dddddddd-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'); -- Ibuprofen (multiple suppliers)

-- ============================================
-- 5. PURCHASE ORDERS
-- ============================================
INSERT INTO purchase_orders (id, order_code, supplier_id, status, order_date, expected_date, created_at, updated_at) VALUES
('aaaaaaaa-0001-0001-0001-000000000001', 'PO-2024-001', 'aaaaaaaa-0000-0000-0000-000000000001', 'RECEIVED', '2024-01-15', '2024-01-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bbbbbbbb-0002-0002-0002-000000000002', 'PO-2024-002', 'bbbbbbbb-0000-0000-0000-000000000002', 'ORDERED', '2024-02-01', '2024-02-10', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cccccccc-0003-0003-0003-000000000003', 'PO-2024-003', 'cccccccc-0000-0000-0000-000000000003', 'DRAFT', '2024-02-15', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dddddddd-0004-0004-0004-000000000004', 'PO-2024-004', 'dddddddd-0000-0000-0000-000000000004', 'RECEIVED', '2024-01-20', '2024-01-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- 6. PURCHASE ORDER LINES
-- ============================================
INSERT INTO purchase_order_lines (id, purchase_order_id, product_id, line_number, quantity, unit_cost) VALUES
-- PO-2024-001 lines
('aaaaaaaa-0001-0001-0001-000000000101', 'aaaaaaaa-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, 100, 5000.00),
('aaaaaaaa-0001-0001-0001-000000000102', 'aaaaaaaa-0001-0001-0001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, 80, 6000.00),
('aaaaaaaa-0001-0001-0001-000000000103', 'aaaaaaaa-0001-0001-0001-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 3, 60, 8000.00),
-- PO-2024-002 lines
('bbbbbbbb-0002-0002-0002-000000000201', 'bbbbbbbb-0002-0002-0002-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1, 50, 7000.00),
('bbbbbbbb-0002-0002-0002-000000000202', 'bbbbbbbb-0002-0002-0002-000000000002', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 2, 40, 9000.00),
-- PO-2024-003 lines (DRAFT)
('cccccccc-0003-0003-0003-000000000301', 'cccccccc-0003-0003-0003-000000000003', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 1, 70, 5500.00),
('cccccccc-0003-0003-0003-000000000302', 'cccccccc-0003-0003-0003-000000000003', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 2, 60, 6500.00),
-- PO-2024-004 lines
('dddddddd-0004-0004-0004-000000000401', 'dddddddd-0004-0004-0004-000000000004', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 1, 90, 4500.00),
('dddddddd-0004-0004-0004-000000000402', 'dddddddd-0004-0004-0004-000000000004', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 2, 75, 5000.00);

-- ============================================
-- 7. INVENTORY BATCHES
-- ============================================
-- Note: selling_price and active fields may need to be added to schema if not present
INSERT INTO inventory_batches (id, product_id, batch_number, quantity_on_hand, cost_price, received_date, expiry_date, created_at, updated_at) VALUES
-- Paracetamol batches
('aaaaaaaa-0001-0001-0001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BATCH-PAR-001', 50, 5000.00, '2024-01-20', '2026-01-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('aaaaaaaa-0001-0001-0001-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'BATCH-PAR-002', 30, 5000.00, '2024-01-20', '2026-01-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Ibuprofen batches
('bbbbbbbb-0002-0002-0002-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BATCH-IBU-001', 40, 6000.00, '2024-01-20', '2026-01-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bbbbbbbb-0002-0002-0002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BATCH-IBU-002', 25, 6000.00, '2024-01-20', '2026-01-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Amoxicillin batches
('cccccccc-0003-0003-0003-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'BATCH-AMO-001', 35, 8000.00, '2024-01-20', '2025-07-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cccccccc-0003-0003-0003-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'BATCH-AMO-002', 20, 8000.00, '2024-01-20', '2025-07-20', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Cetirizine batches
('dddddddd-0004-0004-0004-000000000001', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'BATCH-CET-001', 30, 7000.00, '2024-01-25', '2026-01-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Omeprazole batches
('eeeeeeee-0005-0005-0005-000000000001', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'BATCH-OME-001', 25, 9000.00, '2024-01-25', '2025-07-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Metformin batches
('ffffffff-0006-0006-0006-000000000001', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'BATCH-MET-001', 30, 7500.00, '2024-01-25', '2025-07-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Aspirin batches
('gggggggg-0007-0007-0007-000000000001', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'BATCH-ASP-001', 45, 5500.00, '2024-01-25', '2026-01-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Vitamin C batches
('hhhhhhhh-0008-0008-0008-000000000001', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'BATCH-VITC-001', 40, 6500.00, '2024-01-25', '2026-01-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Calcium batches
('iiiiiiii-0009-0009-0009-000000000001', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'BATCH-CAL-001', 50, 5000.00, '2024-01-25', '2026-01-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Multivitamin batches
('jjjjjjjj-0010-0010-0010-000000000001', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'BATCH-MULTI-001', 60, 4500.00, '2024-01-25', '2026-01-25', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- 8. SALE TRANSACTIONS
-- ============================================
INSERT INTO sale_transactions (id, receipt_number, sold_at, cashier_id, total_discount, created_at, updated_at) VALUES
('aaaaaaaa-1001-1001-1001-000000000001', 'RCP-2024-001', '2024-02-01 09:15:00+00', '33333333-3333-3333-3333-333333333333', 0.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bbbbbbbb-1002-1002-1002-000000000002', 'RCP-2024-002', '2024-02-01 10:30:00+00', '33333333-3333-3333-3333-333333333333', 5000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cccccccc-1003-1003-1003-000000000003', 'RCP-2024-003', '2024-02-01 14:20:00+00', '44444444-4444-4444-4444-444444444444', 0.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('dddddddd-1004-1004-1004-000000000004', 'RCP-2024-004', '2024-02-02 08:45:00+00', '33333333-3333-3333-3333-333333333333', 0.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('eeeeeeee-1005-1005-1005-000000000005', 'RCP-2024-005', '2024-02-02 11:10:00+00', '44444444-4444-4444-4444-444444444444', 10000.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- 9. SALE TRANSACTION LINES
-- ============================================
INSERT INTO sale_transaction_lines (id, sale_transaction_id, product_id, inventory_batch_id, line_number, quantity, unit_price) VALUES
-- RCP-2024-001 lines
('aaaaaaaa-1001-1001-1001-000000000101', 'aaaaaaaa-1001-1001-1001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'aaaaaaaa-0001-0001-0001-000000000001', 1, 2, 8000.00),
('aaaaaaaa-1001-1001-1001-000000000102', 'aaaaaaaa-1001-1001-1001-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bbbbbbbb-0002-0002-0002-000000000001', 2, 1, 10000.00),
-- RCP-2024-002 lines
('bbbbbbbb-1002-1002-1002-000000000201', 'bbbbbbbb-1002-1002-1002-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'cccccccc-0003-0003-0003-000000000001', 1, 1, 12000.00),
('bbbbbbbb-1002-1002-1002-000000000202', 'bbbbbbbb-1002-1002-1002-000000000002', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'dddddddd-0004-0004-0004-000000000001', 2, 2, 10000.00),
-- RCP-2024-003 lines
('cccccccc-1003-1003-1003-000000000301', 'cccccccc-1003-1003-1003-000000000003', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'eeeeeeee-0005-0005-0005-000000000001', 1, 1, 15000.00),
('cccccccc-1003-1003-1003-000000000302', 'cccccccc-1003-1003-1003-000000000003', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 'ffffffff-0006-0006-0006-000000000001', 2, 1, 12000.00),
-- RCP-2024-004 lines
('dddddddd-1004-1004-1004-000000000401', 'dddddddd-1004-1004-1004-000000000004', 'gggggggg-gggg-gggg-gggg-gggggggggggg', 'gggggggg-0007-0007-0007-000000000001', 1, 3, 8000.00),
('dddddddd-1004-1004-1004-000000000402', 'dddddddd-1004-1004-1004-000000000004', 'hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'hhhhhhhh-0008-0008-0008-000000000001', 2, 2, 9000.00),
-- RCP-2024-005 lines
('eeeeeeee-1005-1005-1005-000000000501', 'eeeeeeee-1005-1005-1005-000000000005', 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'iiiiiiii-0009-0009-0009-000000000001', 1, 2, 7500.00),
('eeeeeeee-1005-1005-1005-000000000502', 'eeeeeeee-1005-1005-1005-000000000005', 'jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'jjjjjjjj-0010-0010-0010-000000000001', 2, 3, 6500.00);

-- ============================================
-- 10. INVENTORY ADJUSTMENTS
-- ============================================
-- Note: InventoryAdjustmentType enum values: COUNT_VARIANCE, DAMAGED_GOODS, EXPIRED_REMOVAL, INITIAL_STOCK, OTHER
INSERT INTO inventory_adjustments (id, product_id, performed_by, type, quantity_change, reason, created_at, updated_at) VALUES
('aaaaaaaa-2001-2001-2001-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'COUNT_VARIANCE', -5, 'Stock count correction', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('bbbbbbbb-2002-2002-2002-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'DAMAGED_GOODS', -2, 'Damaged during handling', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cccccccc-2003-2003-2003-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'EXPIRED_REMOVAL', -3, 'Expired products removed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================
-- NOTES:
-- ============================================
-- 1. All passwords are set to "password123" (BCrypt hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy)
-- 2. Dates are set relative to current date for realistic data
-- 3. Prices are in VND (Vietnamese Dong)
-- 4. UUIDs are fixed for easier testing and reference
-- 5. Some inventory batches have lower quantities to test low stock alerts
-- 6. Purchase orders have different statuses to demonstrate workflow
-- 7. Sale transactions include discounts to show various scenarios
-- 8. Inventory adjustment types: COUNT_VARIANCE, DAMAGED_GOODS, EXPIRED_REMOVAL, INITIAL_STOCK, OTHER
-- 9. User roles: OWNER, PHARMACIST, SALES_STAFF
-- 10. Product categories: PRESCRIPTION, OVER_THE_COUNTER
-- 11. Purchase order statuses: DRAFT, ORDERED, RECEIVED, CANCELLED

