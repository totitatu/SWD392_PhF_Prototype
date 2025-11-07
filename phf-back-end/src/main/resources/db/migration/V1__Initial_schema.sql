-- Using public schema (Supabase default)
-- No need to create schema, using public schema

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(128) NOT NULL,
    dosage_strength VARCHAR(64) NOT NULL,
    category VARCHAR(32) NOT NULL,
    reorder_level INTEGER,
    expiry_alert_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_product_sku UNIQUE (sku)
);

-- Pharmacy users table
CREATE TABLE IF NOT EXISTS pharmacy_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(128) NOT NULL,
    email VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_email UNIQUE (email)
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(128) NOT NULL,
    contact_email VARCHAR(128) NOT NULL,
    contact_phone VARCHAR(64),
    contact_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_supplier_name UNIQUE (name)
);

-- Supplier products junction table
CREATE TABLE IF NOT EXISTS supplier_products (
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (supplier_id, product_id)
);

-- Purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(64) NOT NULL UNIQUE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    status VARCHAR(32) NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order lines table
CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    line_number INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10, 2) NOT NULL
);

-- Inventory batches table
CREATE TABLE IF NOT EXISTS inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    batch_number VARCHAR(64) NOT NULL,
    quantity_on_hand INTEGER NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL,
    received_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (expiry_date >= received_date),
    CHECK (quantity_on_hand >= 0)
);

-- Inventory adjustments table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    performed_by UUID NOT NULL REFERENCES pharmacy_users(id),
    type VARCHAR(32) NOT NULL,
    quantity_change INTEGER NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (quantity_change != 0)
);

-- Sale transactions table
CREATE TABLE IF NOT EXISTS sale_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number VARCHAR(64) NOT NULL UNIQUE,
    sold_at TIMESTAMP WITH TIME ZONE NOT NULL,
    cashier_id UUID NOT NULL REFERENCES pharmacy_users(id),
    total_discount NUMERIC(10, 2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sale transaction lines table
CREATE TABLE IF NOT EXISTS sale_transaction_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_transaction_id UUID NOT NULL REFERENCES sale_transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    inventory_batch_id UUID REFERENCES inventory_batches(id),
    line_number INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_pharmacy_users_email ON pharmacy_users(email);
CREATE INDEX IF NOT EXISTS idx_pharmacy_users_role ON pharmacy_users(role);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_order_date ON purchase_orders(order_date);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_product ON inventory_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batches_expiry ON inventory_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_cashier ON sale_transactions(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_sold_at ON sale_transactions(sold_at);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_receipt ON sale_transactions(receipt_number);

