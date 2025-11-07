import { useState, useEffect } from 'react';
import { productAPI, inventoryAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, Search, Package, AlertTriangle, Calendar, Edit, Eye, X, Filter, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export function InventoryManager({ session }) {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all'); // all, in-stock, low-stock, out-of-stock
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [showViewProduct, setShowViewProduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showViewInventory, setShowViewInventory] = useState(false);
  const [showEditInventory, setShowEditInventory] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [editingInventory, setEditingInventory] = useState(null);
  const [inventorySearchTerm, setInventorySearchTerm] = useState('');
  const [inventoryFilter, setInventoryFilter] = useState('all'); // all, low-stock, expiring-soon, expired

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    activeIngredient: '',
    dosage: '',
    dosageForm: '',
    dosageStrength: '',
    sku: '',
    category: '',
    minStock: 10,
    active: true,
  });

  // New stock form
  const [newStock, setNewStock] = useState({
    productId: '',
    batchNumber: '',
    quantityOnHand: 0,
    costPrice: 0,
    sellingPrice: 0,
    receivedDate: new Date().toISOString().split('T')[0], // Default to today
    expiryDate: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch all products (both active and inactive)
      const [productsData, inventoryData] = await Promise.all([
        productAPI.list(), // Remove active filter to get all products
        inventoryAPI.list({ active: true }),
      ]);

      setProducts(productsData || []);
      setInventory(inventoryData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      await productAPI.create({
        name: newProduct.name,
        activeIngredient: newProduct.activeIngredient,
        dosageForm: newProduct.dosageForm || 'TABLET',
        dosageStrength: newProduct.dosageStrength || newProduct.dosage || '',
        sku: newProduct.sku,
        category: newProduct.category || 'OTHER',
        dosage: newProduct.dosage || null,
        minStock: newProduct.minStock || null,
        active: true,
      });
      await fetchData();
      setShowAddProduct(false);
      setNewProduct({
        name: '',
        activeIngredient: '',
        dosage: '',
        dosageForm: '',
        dosageStrength: '',
        sku: '',
        category: '',
        minStock: 10,
        active: true,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Error adding product: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAddStock = async () => {
    try {
      await inventoryAPI.create({
        productId: newStock.productId,
        batchNumber: newStock.batchNumber,
        quantityOnHand: newStock.quantityOnHand,
        costPrice: newStock.costPrice,
        sellingPrice: newStock.sellingPrice,
        receivedDate: newStock.receivedDate || new Date().toISOString().split('T')[0],
        expiryDate: newStock.expiryDate,
        active: true,
      });
      await fetchData();
      setShowAddStock(false);
      setNewStock({
        productId: '',
        batchNumber: '',
        quantityOnHand: 0,
        costPrice: 0,
        sellingPrice: 0,
        receivedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      });
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock: ' + (error.message || 'Unknown error'));
    }
  };

  const getProductStock = (productId) => {
    return inventory
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + (item.quantityOnHand || 0), 0);
  };

  const isLowStock = (productId) => {
    const product = products.find((p) => p.id === productId);
    const stock = getProductStock(productId);
    return stock <= (product?.minStock || 10);
  };

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const filteredProducts = products.filter((product) => {
    // Search filter
    const matchesSearch = !searchTerm || 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = product.active !== false;
    } else if (statusFilter === 'inactive') {
      matchesStatus = product.active === false;
    }

    // Stock filter
    const stock = getProductStock(product.id);
    const lowStock = isLowStock(product.id);
    let matchesStock = true;
    if (stockFilter === 'in-stock') {
      matchesStock = stock > 0 && !lowStock;
    } else if (stockFilter === 'low-stock') {
      matchesStock = lowStock && stock > 0;
    } else if (stockFilter === 'out-of-stock') {
      matchesStock = stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewProduct(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setNewProduct({
      name: product.name || '',
      activeIngredient: product.activeIngredient || '',
      dosage: product.dosage || '',
      dosageForm: product.dosageForm || '',
      dosageStrength: product.dosageStrength || '',
      sku: product.sku || '',
      category: product.category || '',
      minStock: product.minStock || 10,
      active: product.active !== false,
    });
    setShowEditProduct(true);
  };

  const handleUpdateProduct = async () => {
    try {
      await productAPI.update(editingProduct.id, {
        name: newProduct.name,
        activeIngredient: newProduct.activeIngredient,
        dosageForm: newProduct.dosageForm || 'TABLET',
        dosageStrength: newProduct.dosageStrength || newProduct.dosage || '',
        sku: newProduct.sku,
        category: newProduct.category || 'OTHER',
        dosage: newProduct.dosage || null,
        minStock: newProduct.minStock || null,
        active: editingProduct ? newProduct.active : true,
      });
      await fetchData();
      setShowEditProduct(false);
      setEditingProduct(null);
      setNewProduct({
        name: '',
        activeIngredient: '',
        dosage: '',
        dosageForm: '',
        dosageStrength: '',
        sku: '',
        category: '',
        minStock: 10,
        active: true,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeactivateProduct = async (product) => {
    if (!confirm(`Are you sure you want to deactivate ${product.name}?`)) return;

    try {
      await productAPI.deactivate(product.id);
      await fetchData();
    } catch (error) {
      console.error('Error deactivating product:', error);
      alert('Error deactivating product: ' + (error.message || 'Unknown error'));
    }
  };

  const handleActivateProduct = async (product) => {
    if (!confirm(`Are you sure you want to activate ${product.name}?`)) return;

    try {
      await productAPI.activate(product.id);
      await fetchData();
    } catch (error) {
      console.error('Error activating product:', error);
      alert('Error activating product: ' + (error.message || 'Unknown error'));
    }
  };

  // Inventory management functions
  const filteredInventory = inventory.filter((item) => {
    const product = products.find(p => p.id === item.productId);
    const productName = product?.name || '';
    
    // Search filter
    const matchesSearch = !inventorySearchTerm || 
      productName.toLowerCase().includes(inventorySearchTerm.toLowerCase()) ||
      item.batchNumber?.toLowerCase().includes(inventorySearchTerm.toLowerCase());

    // Status filter
    let matchesFilter = true;
    if (inventoryFilter === 'low-stock') {
      matchesFilter = item.quantityOnHand <= (product?.minStock || 10);
    } else if (inventoryFilter === 'expiring-soon') {
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      matchesFilter = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    } else if (inventoryFilter === 'expired') {
      const expiryDate = new Date(item.expiryDate);
      matchesFilter = expiryDate < new Date();
    }

    return matchesSearch && matchesFilter;
  });

  const handleViewInventory = (item) => {
    setSelectedInventory(item);
    setShowViewInventory(true);
  };

  const handleEditInventory = (item) => {
    setEditingInventory(item);
    setNewStock({
      productId: item.productId,
      batchNumber: item.batchNumber || '',
      quantityOnHand: item.quantityOnHand || 0,
      costPrice: item.costPrice || 0,
      sellingPrice: item.sellingPrice || 0,
      receivedDate: item.receivedDate || new Date().toISOString().split('T')[0],
      expiryDate: item.expiryDate || '',
    });
    setShowEditInventory(true);
  };

  const handleUpdateInventory = async () => {
    try {
      await inventoryAPI.update(editingInventory.id, {
        productId: newStock.productId,
        batchNumber: newStock.batchNumber,
        quantityOnHand: newStock.quantityOnHand,
        costPrice: newStock.costPrice,
        sellingPrice: newStock.sellingPrice,
        receivedDate: newStock.receivedDate,
        expiryDate: newStock.expiryDate || null,
      });
      await fetchData();
      setShowEditInventory(false);
      setEditingInventory(null);
      setNewStock({
        productId: '',
        batchNumber: '',
        quantityOnHand: 0,
        costPrice: 0,
        sellingPrice: 0,
        receivedDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
      });
    } catch (error) {
      console.error('Error updating inventory:', error);
      alert('Error updating inventory: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeactivateInventory = async (item) => {
    const product = products.find(p => p.id === item.productId);
    if (!confirm(`Are you sure you want to deactivate this inventory stock for ${product?.name || 'product'}?`)) return;

    try {
      await inventoryAPI.deactivate(item.id);
      await fetchData();
    } catch (error) {
      console.error('Error deactivating inventory:', error);
      alert('Error deactivating inventory: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Inventory Management</h1>
          <p className="text-muted-foreground">
            Manage your pharmaceutical products and stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new pharmaceutical product to your catalog
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Paracetamol"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active Ingredient</Label>
                  <Input
                    value={newProduct.activeIngredient}
                    onChange={(e) => setNewProduct({ ...newProduct, activeIngredient: e.target.value })}
                    placeholder="Acetaminophen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input
                    value={newProduct.dosage}
                    onChange={(e) => setNewProduct({ ...newProduct, dosage: e.target.value })}
                    placeholder="500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="PAR-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newProduct.category || ''}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                      <SelectItem value="OVER_THE_COUNTER">Over the Counter</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stock Level</Label>
                  <Input
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) })}
                  />
                </div>
                <Button onClick={handleAddProduct} className="w-full">
                  Add Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showAddStock} onOpenChange={setShowAddStock}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Package className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock</DialogTitle>
                <DialogDescription>
                  Add new stock batch to inventory
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product</Label>
                  <Select
                    value={newStock.productId}
                    onValueChange={(value) => setNewStock({ ...newStock, productId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {product.dosage || 
                            (product.dosageStrength && product.dosageForm 
                              ? `${product.dosageStrength} ${product.dosageForm}` 
                              : product.dosageStrength || product.dosageForm || '')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input
                    value={newStock.batchNumber}
                    onChange={(e) => setNewStock({ ...newStock, batchNumber: e.target.value })}
                    placeholder="BATCH001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newStock.quantityOnHand}
                    onChange={(e) => setNewStock({ ...newStock, quantityOnHand: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newStock.costPrice}
                      onChange={(e) => setNewStock({ ...newStock, costPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newStock.sellingPrice}
                      onChange={(e) => setNewStock({ ...newStock, sellingPrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Received Date</Label>
                    <Input
                      type="date"
                      value={newStock.receivedDate}
                      onChange={(e) => setNewStock({ ...newStock, receivedDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={newStock.expiryDate}
                      onChange={(e) => setNewStock({ ...newStock, expiryDate: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddStock} className="w-full">
                  Add Stock
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showEditProduct} onOpenChange={setShowEditProduct}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Product</DialogTitle>
                <DialogDescription>
                  Update product information
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="Paracetamol"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Active Ingredient</Label>
                  <Input
                    value={newProduct.activeIngredient}
                    onChange={(e) => setNewProduct({ ...newProduct, activeIngredient: e.target.value })}
                    placeholder="Acetaminophen"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dosage</Label>
                  <Input
                    value={newProduct.dosage}
                    onChange={(e) => setNewProduct({ ...newProduct, dosage: e.target.value })}
                    placeholder="500mg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                    placeholder="PAR-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newProduct.category || ''}
                    onValueChange={(value) => setNewProduct({ ...newProduct, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                      <SelectItem value="OVER_THE_COUNTER">Over the Counter</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stock Level</Label>
                  <Input
                    type="number"
                    value={newProduct.minStock}
                    onChange={(e) => setNewProduct({ ...newProduct, minStock: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <Select 
                    value={newProduct.active ? 'active' : 'inactive'} 
                    onValueChange={(value) => setNewProduct({ ...newProduct, active: value === 'active' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive (Deactivated)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newProduct.active 
                      ? 'Product is active and can be used in inventory and sales' 
                      : 'Product is deactivated and cannot be used'}
                  </p>
                </div>
                <Button onClick={handleUpdateProduct} className="w-full">
                  Update Product
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showViewProduct} onOpenChange={setShowViewProduct}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Product Details</DialogTitle>
              </DialogHeader>
              {selectedProduct && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Product Name</p>
                      <p className="font-medium">{selectedProduct.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">SKU</p>
                      <p className="font-medium">{selectedProduct.sku}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Ingredient</p>
                      <p className="font-medium">{selectedProduct.activeIngredient}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Dosage</p>
                      <p className="font-medium">
                        {selectedProduct.dosage || 
                         (selectedProduct.dosageStrength && selectedProduct.dosageForm 
                          ? `${selectedProduct.dosageStrength} ${selectedProduct.dosageForm}` 
                          : selectedProduct.dosageStrength || selectedProduct.dosageForm || 'N/A')}
                      </p>
                    </div>
                    {(selectedProduct.dosageForm || selectedProduct.dosageStrength) && (
                      <>
                        <div>
                          <p className="text-sm text-muted-foreground">Dosage Form</p>
                          <p className="font-medium">{selectedProduct.dosageForm || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Dosage Strength</p>
                          <p className="font-medium">{selectedProduct.dosageStrength || 'N/A'}</p>
                        </div>
                      </>
                    )}
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="font-medium">{selectedProduct.category}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum Stock</p>
                      <p className="font-medium">{selectedProduct.minStock}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Stock</p>
                      <p className="font-medium">{getProductStock(selectedProduct.id)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge variant={isLowStock(selectedProduct.id) ? "destructive" : "outline"}>
                        {isLowStock(selectedProduct.id) ? "Low Stock" : "In Stock"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Stock Status</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stock = getProductStock(product.id);
                const lowStock = isLowStock(product.id);

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <div>{product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {product.activeIngredient} - {product.dosage || 
                            (product.dosageStrength && product.dosageForm 
                              ? `${product.dosageStrength} ${product.dosageForm}` 
                              : product.dosageStrength || product.dosageForm || 'N/A')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{product.sku}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{stock}</TableCell>
                    <TableCell>
                      {lowStock ? (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Low Stock
                        </Badge>
                      ) : (
                        <Badge variant="outline">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active === false ? 'destructive' : 'outline'}>
                        {product.active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditProduct(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {product.active !== false ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeactivateProduct(product)}
                            className="text-destructive"
                            title="Deactivate product"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleActivateProduct(product)}
                            className="text-green-600 hover:text-green-700"
                            title="Activate product"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No products found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Stocks Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Inventory Stocks</h2>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory by product name or batch number..."
                  value={inventorySearchTerm}
                  onChange={(e) => setInventorySearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={inventoryFilter}
                  onChange={(e) => setInventoryFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
                >
                  <option value="all">All Items</option>
                  <option value="low-stock">Low Stock</option>
                  <option value="expiring-soon">Expiring Soon (30 days)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  const expiryDate = new Date(item.expiryDate);
                  const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
                  const isExpired = expiryDate < new Date();
                  const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {product?.name || 'Unknown Product'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.batchNumber || 'N/A'}
                      </TableCell>
                      <TableCell>{item.quantityOnHand}</TableCell>
                      <TableCell>${item.costPrice?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>${item.sellingPrice?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>
                        {item.expiryDate ? (
                          <div>
                            <div>{new Date(item.expiryDate).toLocaleDateString()}</div>
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs mt-1">
                                Expired
                              </Badge>
                            )}
                            {isExpiringSoon && !isExpired && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {daysUntilExpiry} days left
                              </Badge>
                            )}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.isActive === false ? 'destructive' : 'outline'}>
                          {item.isActive === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewInventory(item)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditInventory(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {item.isActive !== false && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeactivateInventory(item)}
                              className="text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredInventory.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {inventory.length === 0
                  ? 'No inventory stocks yet'
                  : 'No inventory stocks match your filters'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Inventory Dialog */}
      <Dialog open={showViewInventory} onOpenChange={setShowViewInventory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inventory Stock Details</DialogTitle>
          </DialogHeader>
          {selectedInventory && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Product</p>
                  <p className="font-medium">
                    {products.find(p => p.id === selectedInventory.productId)?.name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batch Number</p>
                  <p className="font-mono text-xs">{selectedInventory.batchNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{selectedInventory.quantityOnHand}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cost Price</p>
                  <p className="font-medium">${selectedInventory.costPrice?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selling Price</p>
                  <p className="font-medium">${selectedInventory.sellingPrice?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiry Date</p>
                  <p className="font-medium">
                    {selectedInventory.expiryDate
                      ? new Date(selectedInventory.expiryDate).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedInventory.isActive === false ? 'destructive' : 'outline'}>
                    {selectedInventory.isActive === false ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={showEditInventory} onOpenChange={setShowEditInventory}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Stock</DialogTitle>
            <DialogDescription>
              Update inventory stock information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <Select
                value={newStock.productId}
                onValueChange={(value) => {
                  const product = products.find(p => p.id === value);
                  setNewStock({ ...newStock, productId: value });
                }}
                disabled
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Batch Number</Label>
              <Input
                value={newStock.batchNumber}
                onChange={(e) => setNewStock({ ...newStock, batchNumber: e.target.value })}
                placeholder="BATCH-001"
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                value={newStock.quantityOnHand}
                onChange={(e) => setNewStock({ ...newStock, quantityOnHand: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Received Date</Label>
                <Input
                  type="date"
                  value={newStock.receivedDate}
                  onChange={(e) => setNewStock({ ...newStock, receivedDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={newStock.expiryDate}
                  onChange={(e) => setNewStock({ ...newStock, expiryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={newStock.costPrice}
                  onChange={(e) => setNewStock({ ...newStock, costPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Selling Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newStock.sellingPrice}
                  onChange={(e) => setNewStock({ ...newStock, sellingPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <Button onClick={handleUpdateInventory} className="w-full">
              Update Inventory Stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

