import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
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
  History,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Upload,
  FileImage
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SalesHistory } from './SalesHistory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { posAPI, saleAPI, inventoryAPI, userAPI, productAPI } from '../../services/api';

export function POSSystem({ session }) {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // UC46 - Checkout form state
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [customerEmail, setCustomerEmail] = useState('');
  const [emailReceipt, setEmailReceipt] = useState(false);
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [actualTotal, setActualTotal] = useState(null); // Actual total based on batch prices

  // Load 5 suggested products
  const loadSuggestedProducts = useCallback(async () => {
    setLoading(true);
    setSearchError(null);
    try {
      const suggested = await posAPI.getSuggestedProducts();
      setProducts(suggested || []);
    } catch (error) {
      console.error('Error loading suggested products:', error);
      setSearchError('Failed to load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load suggested products on mount
  useEffect(() => {
    loadSuggestedProducts();
  }, [loadSuggestedProducts]);

  // UC44 - Search Products (POS) with debouncing
  const searchProducts = useCallback(async (term) => {
    if (!term || term.trim().length === 0) {
      // If search term is empty, load suggested products
      await loadSuggestedProducts();
      return;
    }

    setLoading(true);
    setSearchError(null);

    try {
      const results = await posAPI.searchProducts(term.trim());
      setProducts(results || []);
    } catch (error) {
      console.error('Error searching products:', error);
      // E1: Database query timeout or E2: Inventory data corrupted
      setSearchError(error.message || 'Search unavailable. Please try again or refresh.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [loadSuggestedProducts]);

  // Debounce search input
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300); // 300ms debounce

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTerm, searchProducts]);

  const addToCart = (product) => {
    if (!product.available || product.stockQuantity <= 0) {
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.id);

    if (existingItem) {
      if (existingItem.quantity < product.stockQuantity) {
        setCart(
          cart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      }
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          productName: product.name,
          price: product.sellingPrice || 0,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (productId, delta) => {
    const item = cart.find((item) => item.productId === productId);
    if (!item) return;

    const product = products.find((p) => p.id === productId);
    const maxQuantity = product?.stockQuantity || 0;
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.productId !== productId));
    } else if (newQuantity <= maxQuantity) {
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

  // UC46 - Open checkout dialog
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    // Calculate actual total based on batch prices (FEFO)
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      let calculatedTotal = 0;
      
      for (const item of cart) {
        const inventoryBatches = await inventoryAPI.list({ 
          productId: item.productId,
          active: true 
        });
        
        const availableBatches = (inventoryBatches || [])
          .filter(batch => {
            if (batch.quantityOnHand <= 0 || batch.active === false) return false;
            if (batch.expiryDate) {
              const expiryDate = new Date(batch.expiryDate);
              expiryDate.setHours(0, 0, 0, 0);
              if (expiryDate < currentDate) return false;
            }
            return true;
          })
          .sort((a, b) => {
            const dateA = new Date(a.expiryDate || '9999-12-31');
            const dateB = new Date(b.expiryDate || '9999-12-31');
            return dateA - dateB;
          });
        
        let remainingQuantity = item.quantity;
        for (const batch of availableBatches) {
          if (remainingQuantity <= 0) break;
          const quantityFromBatch = Math.min(remainingQuantity, batch.quantityOnHand);
          const batchPrice = parseFloat(batch.sellingPrice) || 0;
          calculatedTotal += batchPrice * quantityFromBatch;
          remainingQuantity -= quantityFromBatch;
        }
      }
      
      setActualTotal(calculatedTotal);
    } catch (error) {
      console.error('Error calculating actual total:', error);
      setActualTotal(null); // Fallback to cart total if calculation fails
    }
    
    setShowCheckoutDialog(true);
  };

  // UC46 - Complete sale transaction
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    
    setCheckoutLoading(true);
    try {
      // Get cashier ID from email
      let cashierId = null;
      try {
        const userEmail = session?.user?.email;
        if (userEmail) {
          const user = await userAPI.getByEmail(userEmail);
          if (user) {
            cashierId = user.id;
          }
        }
      } catch (error) {
        console.error('Error getting cashier:', error);
        // If user not found, try to get first active user as fallback
        const users = await userAPI.list({ active: true });
        if (users && users.length > 0) {
          cashierId = users[0].id;
        } else {
          throw new Error('No cashier available. Please create a user account first.');
        }
      }

      if (!cashierId) {
        throw new Error('Cashier ID is required');
      }

      // Fetch inventory batches for each product in cart
      const lineItems = [];
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day for comparison
      
      for (const item of cart) {
        // Get available inventory batches for this product (FEFO - First Expired First Out)
        const inventoryBatches = await inventoryAPI.list({ 
          productId: item.productId,
          active: true 
        });
        
        // Filter batches: exclude expired, only active batches with stock > 0, sort by expiry date (FEFO)
        const availableBatches = (inventoryBatches || [])
          .filter(batch => {
            // Check if batch is active and has stock
            if (batch.quantityOnHand <= 0 || batch.active === false) {
              return false;
            }
            
            // Exclude expired batches
            if (batch.expiryDate) {
              const expiryDate = new Date(batch.expiryDate);
              expiryDate.setHours(0, 0, 0, 0);
              if (expiryDate < currentDate) {
                return false; // Skip expired batches
              }
            }
            
            return true;
          })
          .sort((a, b) => {
            // Sort by expiry date: earliest expiry first (FEFO)
            const dateA = new Date(a.expiryDate || '9999-12-31');
            const dateB = new Date(b.expiryDate || '9999-12-31');
            return dateA - dateB;
          });
        
        if (availableBatches.length === 0) {
          throw new Error(`No available stock for ${item.productName} (may be expired or out of stock)`);
        }

        // Use FEFO - take from batches with earliest expiry first
        // Each batch may have different selling price, so use batch's actual price
        let remainingQuantity = item.quantity;
        for (const batch of availableBatches) {
          if (remainingQuantity <= 0) break;
          
          const quantityFromBatch = Math.min(remainingQuantity, batch.quantityOnHand);
          
          // Use the actual selling price from the batch, not the price from cart
          const batchPrice = parseFloat(batch.sellingPrice) || 0;
          
          lineItems.push({
            inventoryBatchId: batch.id,
            quantity: quantityFromBatch,
            unitPrice: batchPrice,
          });
          
          remainingQuantity -= quantityFromBatch;
        }
        
        if (remainingQuantity > 0) {
          throw new Error(`Insufficient stock for ${item.productName}. Available: ${item.quantity - remainingQuantity}, Requested: ${item.quantity}`);
        }
      }

      // Prescription image is optional (no longer required for prescription products)

      // Create sale transaction
      const saleRequest = {
        soldAt: new Date().toISOString(),
        cashierId: cashierId,
        lineItems: lineItems,
        totalDiscount: null,
        paymentMethod: paymentMethod,
        prescriptionImageUrl: prescriptionImageUrl || null,
        customerEmail: emailReceipt && customerEmail ? customerEmail : null,
        emailReceipt: emailReceipt,
      };

      const createdSale = await saleAPI.create(saleRequest);
      
      setLastReceipt(createdSale);
      setShowReceipt(true);
      setShowCheckoutDialog(false);
      setCart([]);
      setActualTotal(null); // Reset actual total
      
      // Reset checkout form
      setPaymentMethod('CASH');
      setCustomerEmail('');
      setEmailReceipt(false);
      setPrescriptionImageUrl('');
      setPrescriptionFile(null);
      
      // Refresh search results to update stock quantities
      if (searchTerm.trim()) {
        await searchProducts(searchTerm);
      }
    } catch (error) {
      console.error('Error processing sale:', error);
      alert(error.message || 'Error processing sale. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle prescription image upload (simplified - convert to base64 or use URL)
  const handlePrescriptionUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setPrescriptionFile(file);
    
    // Convert to base64 for now (in production, upload to storage and get URL)
    const reader = new FileReader();
    reader.onloadend = () => {
      setPrescriptionImageUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleBarcodeScan = async (barcode) => {
    try {
      const product = await posAPI.getProductByBarcode(barcode);
      if (product && product.available) {
        addToCart(product);
      }
    } catch (error) {
      console.error('Error scanning barcode:', error);
    } finally {
      setShowScanner(false);
    }
  };

  const handleRefresh = () => {
    setSearchError(null);
    if (searchTerm.trim()) {
      searchProducts(searchTerm);
    }
  };

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
              {searchError && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{searchError}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRefresh}
                    className="h-7"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              )}
              
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              
              {!loading && (
                <>
                  {products.length > 0 && !searchTerm.trim() && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-muted-foreground">Suggested Products (5)</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto">
                    {products.map((product) => {
                      const price = product.sellingPrice || 0;
                      const stock = product.stockQuantity || 0;
                      const dosage = product.dosage || 
                        (product.dosageStrength && product.dosageForm 
                          ? `${product.dosageStrength} ${product.dosageForm}`
                          : product.dosageStrength || product.dosageForm || '');

                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          disabled={!product.available || stock === 0}
                          className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div className="space-y-2">
                            <div>
                              <h4 className="text-sm font-medium">{product.name}</h4>
                              {product.activeIngredient && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {product.activeIngredient}
                                </p>
                              )}
                              {dosage && (
                                <p className="text-xs text-muted-foreground">
                                  {dosage}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold">
                                ${parseFloat(price).toFixed(2)}
                              </span>
                              <Badge 
                                variant={stock > 0 ? "outline" : "destructive"} 
                                className="text-xs"
                              >
                                {stock} in stock
                              </Badge>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* A1: No results */}
                  {products.length === 0 && !searchError && searchTerm.trim() && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-2">No products found</p>
                      <p className="text-xs">Try checking spelling or searching by ingredient</p>
                    </div>
                  )}
                  {products.length === 0 && !searchTerm.trim() && !loading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No suggested products available</p>
                      <p className="text-xs mt-1">Enter a search term to find products</p>
                    </div>
                  )}
                </>
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
                    Complete Sale / Generate Receipt
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

      {/* UC46 - Checkout Dialog */}
      <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Transaction / Generate Receipt (UC46)</DialogTitle>
            <DialogDescription>
              Review cart, confirm prices, and select payment method
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Cart Review */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Cart Items</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between items-center p-2 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Estimated Total (from cart)</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              {actualTotal !== null && actualTotal !== calculateTotal() && (
                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                  <span>Actual Total (based on batch prices)</span>
                  <span>${actualTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount</span>
                <span>${(actualTotal !== null ? actualTotal : calculateTotal()).toFixed(2)}</span>
              </div>
              {actualTotal !== null && actualTotal !== calculateTotal() && (
                <p className="text-xs text-muted-foreground">
                  * Price may vary based on actual batches used (FEFO - First Expired First Out)
                </p>
              )}
            </div>

            <Separator />

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label>Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="MOBILE_PAYMENT">Mobile Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prescription Upload (optional) */}
            <div className="space-y-2">
              <Label>Prescription Image (Optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handlePrescriptionUpload}
                  className="flex-1"
                />
                {prescriptionImageUrl && (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden">
                    <img 
                      src={prescriptionImageUrl} 
                      alt="Prescription" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload prescription image if needed (optional)
              </p>
            </div>

            {/* Email Receipt Option */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="emailReceipt"
                  checked={emailReceipt}
                  onChange={(e) => setEmailReceipt(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="emailReceipt" className="cursor-pointer">
                  Send receipt via email
                </Label>
              </div>
              {emailReceipt && (
                <Input
                  type="email"
                  placeholder="Customer email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              )}
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCheckoutDialog(false)}
                className="flex-1"
                disabled={checkoutLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteSale}
                className="flex-1"
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4 mr-2" />
                    Generate Receipt
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-2xl">
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
                  Receipt Number: {lastReceipt.receiptNumber || lastReceipt.id}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                {(lastReceipt.lineItems || lastReceipt.items || []).map((item, index) => (
                  <div key={item.id || index} className="flex justify-between text-sm">
                    <span>
                      {item.productName || 'Unknown Product'} x {item.quantity}
                    </span>
                    <span>${(item.lineTotal || (item.price || item.unitPrice || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-xl font-semibold">${(lastReceipt.totalAmount || 0).toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.print()}
                  className="flex-1"
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button
                  onClick={() => {
                    setShowReceipt(false);
                    setLastReceipt(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
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

