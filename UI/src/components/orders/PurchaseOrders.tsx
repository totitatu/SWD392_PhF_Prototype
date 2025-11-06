import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Plus, FileText, Send, Check } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface PurchaseOrdersProps {
  session: any;
}

export function PurchaseOrders({ session }: PurchaseOrdersProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newOrder, setNewOrder] = useState({
    supplierId: '',
    supplierName: '',
    supplierEmail: '',
    items: [] as any[],
  });

  const [orderItem, setOrderItem] = useState({
    productId: '',
    productName: '',
    quantity: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = session.access_token;

      const [ordersRes, suppliersRes, productsRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/purchase-orders`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/suppliers`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const ordersData = await ordersRes.json();
      const suppliersData = await suppliersRes.json();
      const productsData = await productsRes.json();

      setOrders(ordersData.orders || []);
      setSuppliers(suppliersData.suppliers || []);
      setProducts(productsData.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSupplierChange = (supplierId: string) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    if (supplier) {
      setNewOrder({
        ...newOrder,
        supplierId,
        supplierName: supplier.name,
        supplierEmail: supplier.email,
      });
    }
  };

  const handleAddItem = () => {
    if (orderItem.productId && orderItem.quantity > 0) {
      const product = products.find((p) => p.id === orderItem.productId);
      setNewOrder({
        ...newOrder,
        items: [
          ...newOrder.items,
          {
            ...orderItem,
            productName: product?.name || '',
          },
        ],
      });
      setOrderItem({ productId: '', productName: '', quantity: 0 });
    }
  };

  const handleRemoveItem = (index: number) => {
    setNewOrder({
      ...newOrder,
      items: newOrder.items.filter((_, i) => i !== index),
    });
  };

  const handleCreateOrder = async () => {
    if (!newOrder.supplierId || newOrder.items.length === 0) return;

    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/purchase-orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...newOrder,
            totalAmount: 0, // Can be calculated based on cost prices
          }),
        }
      );

      if (response.ok) {
        await fetchData();
        setShowCreateDialog(false);
        setNewOrder({
          supplierId: '',
          supplierName: '',
          supplierEmail: '',
          items: [],
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/purchase-orders/${orderId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered':
        return 'bg-blue-100 text-blue-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1>Purchase Orders</h1>
          <p className="text-muted-foreground">
            Manage purchase orders and track deliveries
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
              <DialogDescription>
                Create a new purchase order for your supplier
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select
                  value={newOrder.supplierId}
                  onValueChange={handleSupplierChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="text-sm">Add Items</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Select
                      value={orderItem.productId}
                      onValueChange={(value) =>
                        setOrderItem({ ...orderItem, productId: value })
                      }
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
                  <Input
                    type="number"
                    placeholder="Qty"
                    value={orderItem.quantity || ''}
                    onChange={(e) =>
                      setOrderItem({
                        ...orderItem,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <Button onClick={handleAddItem} variant="outline" className="w-full">
                  Add Item
                </Button>
              </div>

              {newOrder.items.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h3 className="text-sm">Order Items</h3>
                  {newOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm py-2 border-b last:border-b-0"
                    >
                      <span>
                        {item.productName} x {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={handleCreateOrder}
                className="w-full"
                disabled={!newOrder.supplierId || newOrder.items.length === 0}
              >
                <Send className="w-4 h-4 mr-2" />
                Create & Send Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="text-xs">{order.id.slice(-8)}</TableCell>
                  <TableCell>{order.supplierName}</TableCell>
                  <TableCell>{order.items?.length || 0} items</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.status === 'ordered' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'received')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Mark Received
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No purchase orders yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
