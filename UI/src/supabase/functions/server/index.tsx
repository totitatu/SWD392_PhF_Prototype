import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.use('*', logger(console.log));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

// Initialize Supabase Storage buckets
const initStorage = async () => {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const bucketName = 'make-a836deb0-pharmaflow';
  
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
    console.log('Created storage bucket:', bucketName);
  }
};

initStorage();

// Helper function to verify auth
const verifyAuth = async (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing authorization', status: 401 };
  }
  
  const accessToken = authHeader.split(' ')[1];
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 };
  }
  
  return { user };
};

// Auth Routes
app.post('/make-server-a836deb0/auth/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: role || 'staff' },
      email_confirm: true, // Auto-confirm email since email server not configured
    });
    
    if (error) {
      console.log('Error creating user:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Get current user data
app.get('/make-server-a836deb0/auth/me', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  return c.json({ user: auth.user });
});

// Product Routes
app.get('/make-server-a836deb0/products', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const products = await kv.getByPrefix('product:');
    return c.json({ products });
  } catch (error) {
    console.log('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

app.post('/make-server-a836deb0/products', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const product = await c.req.json();
    const productId = `product:${Date.now()}`;
    await kv.set(productId, { ...product, id: productId, createdAt: new Date().toISOString() });
    
    return c.json({ product: { ...product, id: productId } });
  } catch (error) {
    console.log('Error creating product:', error);
    return c.json({ error: 'Failed to create product' }, 500);
  }
});

app.put('/make-server-a836deb0/products/:id', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(id);
    
    if (!existing) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(id, updated);
    
    return c.json({ product: updated });
  } catch (error) {
    console.log('Error updating product:', error);
    return c.json({ error: 'Failed to update product' }, 500);
  }
});

app.delete('/make-server-a836deb0/products/:id', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const id = c.req.param('id');
    await kv.del(id);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting product:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

// Inventory Routes
app.get('/make-server-a836deb0/inventory', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const inventory = await kv.getByPrefix('inventory:');
    return c.json({ inventory });
  } catch (error) {
    console.log('Error fetching inventory:', error);
    return c.json({ error: 'Failed to fetch inventory' }, 500);
  }
});

app.post('/make-server-a836deb0/inventory', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const stock = await c.req.json();
    const stockId = `inventory:${Date.now()}`;
    await kv.set(stockId, { ...stock, id: stockId, createdAt: new Date().toISOString() });
    
    return c.json({ stock: { ...stock, id: stockId } });
  } catch (error) {
    console.log('Error adding inventory:', error);
    return c.json({ error: 'Failed to add inventory' }, 500);
  }
});

// Supplier Routes
app.get('/make-server-a836deb0/suppliers', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const suppliers = await kv.getByPrefix('supplier:');
    return c.json({ suppliers });
  } catch (error) {
    console.log('Error fetching suppliers:', error);
    return c.json({ error: 'Failed to fetch suppliers' }, 500);
  }
});

app.post('/make-server-a836deb0/suppliers', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const supplier = await c.req.json();
    const supplierId = `supplier:${Date.now()}`;
    await kv.set(supplierId, { ...supplier, id: supplierId, createdAt: new Date().toISOString() });
    
    return c.json({ supplier: { ...supplier, id: supplierId } });
  } catch (error) {
    console.log('Error creating supplier:', error);
    return c.json({ error: 'Failed to create supplier' }, 500);
  }
});

app.put('/make-server-a836deb0/suppliers/:id', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(id);
    
    if (!existing) {
      return c.json({ error: 'Supplier not found' }, 404);
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(id, updated);
    
    return c.json({ supplier: updated });
  } catch (error) {
    console.log('Error updating supplier:', error);
    return c.json({ error: 'Failed to update supplier' }, 500);
  }
});

// Sales/Transaction Routes
app.post('/make-server-a836deb0/sales', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const sale = await c.req.json();
    const saleId = `sale:${Date.now()}`;
    
    // Deduct inventory
    for (const item of sale.items) {
      const inventoryItems = await kv.getByPrefix('inventory:');
      const stockItem = inventoryItems.find((inv: any) => inv.productId === item.productId);
      
      if (stockItem) {
        const updatedQuantity = (stockItem.quantity || 0) - item.quantity;
        await kv.set(stockItem.id, { ...stockItem, quantity: updatedQuantity });
      }
    }
    
    await kv.set(saleId, { ...sale, id: saleId, createdAt: new Date().toISOString() });
    
    return c.json({ sale: { ...sale, id: saleId } });
  } catch (error) {
    console.log('Error processing sale:', error);
    return c.json({ error: 'Failed to process sale' }, 500);
  }
});

app.get('/make-server-a836deb0/sales', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const sales = await kv.getByPrefix('sale:');
    return c.json({ sales });
  } catch (error) {
    console.log('Error fetching sales:', error);
    return c.json({ error: 'Failed to fetch sales' }, 500);
  }
});

// Purchase Order Routes
app.get('/make-server-a836deb0/purchase-orders', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const orders = await kv.getByPrefix('order:');
    return c.json({ orders });
  } catch (error) {
    console.log('Error fetching orders:', error);
    return c.json({ error: 'Failed to fetch orders' }, 500);
  }
});

app.post('/make-server-a836deb0/purchase-orders', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const order = await c.req.json();
    const orderId = `order:${Date.now()}`;
    await kv.set(orderId, { 
      ...order, 
      id: orderId, 
      status: 'ordered',
      createdAt: new Date().toISOString() 
    });
    
    // Send email to supplier via SendGrid
    if (order.supplierEmail) {
      await sendPurchaseOrderEmail(order);
    }
    
    return c.json({ order: { ...order, id: orderId } });
  } catch (error) {
    console.log('Error creating purchase order:', error);
    return c.json({ error: 'Failed to create purchase order' }, 500);
  }
});

app.put('/make-server-a836deb0/purchase-orders/:id', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const id = c.req.param('id');
    const updates = await c.req.json();
    const existing = await kv.get(id);
    
    if (!existing) {
      return c.json({ error: 'Order not found' }, 404);
    }
    
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(id, updated);
    
    return c.json({ order: updated });
  } catch (error) {
    console.log('Error updating order:', error);
    return c.json({ error: 'Failed to update order' }, 500);
  }
});

// Alert Routes
app.get('/make-server-a836deb0/alerts', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const alerts = [];
    const inventory = await kv.getByPrefix('inventory:');
    const products = await kv.getByPrefix('product:');
    
    // Check for low stock
    for (const stock of inventory) {
      const product = products.find((p: any) => p.id === stock.productId);
      if (product && stock.quantity <= (product.minStock || 10)) {
        alerts.push({
          type: 'low-stock',
          severity: 'warning',
          productId: product.id,
          productName: product.name,
          currentStock: stock.quantity,
          minStock: product.minStock || 10,
          message: `Low stock alert: ${product.name} (${stock.quantity} remaining)`,
        });
      }
    }
    
    // Check for expiring items
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    for (const stock of inventory) {
      if (stock.expiryDate) {
        const expiryDate = new Date(stock.expiryDate);
        const product = products.find((p: any) => p.id === stock.productId);
        
        if (expiryDate <= threeMonthsFromNow) {
          alerts.push({
            type: 'expiry',
            severity: expiryDate <= new Date() ? 'critical' : 'warning',
            productId: product?.id,
            productName: product?.name,
            expiryDate: stock.expiryDate,
            batchNumber: stock.batchNumber,
            message: `Expiry alert: ${product?.name} (Batch ${stock.batchNumber}) expires on ${new Date(stock.expiryDate).toLocaleDateString()}`,
          });
        }
      }
    }
    
    return c.json({ alerts });
  } catch (error) {
    console.log('Error fetching alerts:', error);
    return c.json({ error: 'Failed to fetch alerts' }, 500);
  }
});

// AI Forecasting Route
app.post('/make-server-a836deb0/forecast', async (c) => {
  const auth = await verifyAuth(c.req.raw);
  if (auth.error) {
    return c.json({ error: auth.error }, auth.status);
  }
  
  try {
    const { productId } = await c.req.json();
    const sales = await kv.getByPrefix('sale:');
    const product = await kv.get(productId);
    
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    
    // Filter sales for this product
    const productSales = sales
      .flatMap((sale: any) => sale.items || [])
      .filter((item: any) => item.productId === productId);
    
    // Prepare data for AI
    const historicalData = productSales.map((item: any) => ({
      quantity: item.quantity,
      date: item.date || new Date().toISOString(),
    }));
    
    // Call Gemini API
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      return c.json({ error: 'Gemini API key not configured' }, 500);
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Based on the following historical sales data for ${product.name}, predict the demand for the next 30 days. Return only a JSON object with a single field "predictedDemand" containing a number.

Historical data: ${JSON.stringify(historicalData)}

Consider seasonality and trends. Return format: {"predictedDemand": number}`
            }]
          }]
        })
      }
    );
    
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{"predictedDemand": 0}';
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[^}]+\}/);
    const forecast = jsonMatch ? JSON.parse(jsonMatch[0]) : { predictedDemand: 0 };
    
    return c.json({ 
      forecast: {
        productId,
        productName: product.name,
        predictedDemand: forecast.predictedDemand,
        period: '30 days',
        generatedAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.log('Error generating forecast:', error);
    return c.json({ error: 'Failed to generate forecast' }, 500);
  }
});

// SendGrid email helper
async function sendPurchaseOrderEmail(order: any) {
  try {
    const sendGridKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendGridKey) {
      console.log('SendGrid API key not configured');
      return;
    }
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendGridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: order.supplierEmail }],
          subject: `Purchase Order #${order.id}`,
        }],
        from: { email: 'noreply@pharmaflow.com' },
        content: [{
          type: 'text/html',
          value: `
            <h2>Purchase Order</h2>
            <p>Dear ${order.supplierName},</p>
            <p>Please find our purchase order details below:</p>
            <ul>
              ${order.items?.map((item: any) => `
                <li>${item.productName} - Quantity: ${item.quantity}</li>
              `).join('')}
            </ul>
            <p>Total Amount: $${order.totalAmount}</p>
            <p>Please confirm receipt of this order.</p>
            <p>Best regards,<br>PharmaFlow</p>
          `,
        }],
      }),
    });
    
    if (!response.ok) {
      console.log('SendGrid error:', await response.text());
    }
  } catch (error) {
    console.log('Error sending email:', error);
  }
}

// Health check
app.get('/make-server-a836deb0/health', (c) => {
  return c.json({ status: 'ok' });
});

Deno.serve(app.fetch);
