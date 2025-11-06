import { useState, useEffect } from 'react';
import { projectId } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { BarcodeScanner } from './BarcodeScanner';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus,
  Camera,
  Receipt,
  X,
  History
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SalesHistory } from './SalesHistory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

export function POSSystem({ session }) {
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = session.access_token;

      const [productsRes, inventoryRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const productsData = await productsRes.json();
      const inventoryData = await inventoryRes.json();

      setProducts(productsData.products || []);
      setInventory(inventoryData.inventory || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProductPrice = (productId) => {
    const stockItem = inventory.find((item) => item.productId === productId);
    return stockItem?.sellingPrice || 0;
  };

  const getAvailableStock = (productId) => {
    return inventory
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const addToCart = (product) => {
    const existingItem = cart.find((item) => item.productId === product.id);
    const availableStock = getAvailableStock(product.id);

    if (existingItem) {
      if (existingItem.quantity < availableStock) {
        setCart(
          cart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      if (availableStock > 0) {
        setCart([
          ...cart,
          {
            productId: product.id,
            productName: product.name,
            price: getProductPrice(product.id),
            quantity: 1,
          },
        ]);
      }
    }
  };

  const updateQuantity = (productId, delta) => {
    const item = cart.find((item) => item.productId === productId);
    if (!item) return;

    const newQuantity = item.quantity + delta;
    const availableStock = getAvailableStock(productId);

    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.productId !== productId));
    } else if (newQuantity <= availableStock) {
      setCart(
        cart.map((item) =>
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const token = session.access_token;
      const sale = {
        items: cart,
        totalAmount: calculateTotal(),
        userId: session.user.id,
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/sales`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(sale),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLastReceipt(data.sale);
        setShowReceipt(true);
        setCart([]);
        await fetchData(); // Refresh inventory
      }
    } catch (error) {
      console.error('Error processing sale:', error);
    }
  };

  const handleBarcodeScan = (barcode) => {
    const product = products.find((p) => p.sku === barcode);
    if (product) {
      addToCart(product);
    }
    setShowScanner(false);
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Point of Sale</h1>
        <p className="text-muted-foreground">
          Process sales transactions quickly and efficiently
        </p>
      </div>

      <Tabs defaultValue="pos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pos">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Point of Sale
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="w-4 h-4 mr-2" />
            Sales History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button onClick={() => setShowScanner(true)} variant="outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Barcode
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                {filteredProducts.map((product) => {
                  const stock = getAvailableStock(product.id);
                  const price = getProductPrice(product.id);

                  return (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={stock === 0}
                      className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm">{product.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {product.dosage}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">${price.toFixed(2)}</span>
                          <Badge variant={stock > 0 ? "outline" : "destructive"} className="text-xs">
                            {stock} in stock
                          </Badge>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No products found
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {cart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm truncate">{item.productName}</h4>
                      <p className="text-xs text-muted-foreground">
                        ${item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, -1)}
                        className="h-7 w-7 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm w-8 text-center">{item.quantity}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.productId, 1)}
                        className="h-7 w-7 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFromCart(item.productId)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {cart.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Cart is empty
                </div>
              )}

              {cart.length > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total</span>
                      <span className="text-xl">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <Button onClick={handleCheckout} className="w-full mt-4">
                    <Receipt className="w-4 h-4 mr-2" />
                    Complete Sale
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Barcode Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <BarcodeScanner onScan={handleBarcodeScan} />
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Complete</DialogTitle>
          </DialogHeader>
          {lastReceipt && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <Receipt className="w-8 h-8 text-green-600" />
                </div>
                <h3>Sale Successful</h3>
                <p className="text-muted-foreground text-sm">
                  Transaction ID: {lastReceipt.id}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                {lastReceipt.items?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-xl">${lastReceipt.totalAmount.toFixed(2)}</span>
              </div>

              <Button onClick={() => setShowReceipt(false)} className="w-full">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="history">
          <SalesHistory session={session} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

