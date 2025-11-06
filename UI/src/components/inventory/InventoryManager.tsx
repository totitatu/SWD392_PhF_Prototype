import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
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
import { Plus, Search, Package, AlertTriangle, Calendar } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface InventoryManagerProps {
  session: any;
}

export function InventoryManager({ session }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    activeIngredient: '',
    dosage: '',
    sku: '',
    category: '',
    minStock: 10,
  });

  // New stock form
  const [newStock, setNewStock] = useState({
    productId: '',
    batchNumber: '',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    expiryDate: '',
  });

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

  const handleAddProduct = async () => {
    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newProduct),
        }
      );

      if (response.ok) {
        await fetchData();
        setShowAddProduct(false);
        setNewProduct({
          name: '',
          activeIngredient: '',
          dosage: '',
          sku: '',
          category: '',
          minStock: 10,
        });
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleAddStock = async () => {
    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/inventory`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newStock),
        }
      );

      if (response.ok) {
        await fetchData();
        setShowAddStock(false);
        setNewStock({
          productId: '',
          batchNumber: '',
          quantity: 0,
          costPrice: 0,
          sellingPrice: 0,
          expiryDate: '',
        });
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const getProductStock = (productId: string) => {
    return inventory
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
  };

  const isLowStock = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    const stock = getProductStock(productId);
    return stock <= (product?.minStock || 10);
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
                  <Input
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                    placeholder="Pain Relief"
                  />
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
                          {product.name} - {product.dosage}
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
                    value={newStock.quantity}
                    onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cost Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStock.costPrice}
                      onChange={(e) => setNewStock({ ...newStock, costPrice: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newStock.sellingPrice}
                      onChange={(e) => setNewStock({ ...newStock, sellingPrice: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiry Date</Label>
                  <Input
                    type="date"
                    value={newStock.expiryDate}
                    onChange={(e) => setNewStock({ ...newStock, expiryDate: e.target.value })}
                  />
                </div>
                <Button onClick={handleAddStock} className="w-full">
                  Add Stock
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
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
                <TableHead>Status</TableHead>
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
                          {product.activeIngredient} - {product.dosage}
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
    </div>
  );
}
