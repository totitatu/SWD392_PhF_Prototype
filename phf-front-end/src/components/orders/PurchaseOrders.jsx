import { useState, useEffect } from 'react';
import { projectId } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
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
import { Plus, FileText, Send, Check, Search, Eye, Edit, Trash2, Filter } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export function PurchaseOrders({ session }) {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newOrder, setNewOrder] = useState({
    supplierId: '',
    supplierName: '',
    supplierEmail: '',
    items: [],
  });

  const [orderItem, setOrderItem] = useState({
    productId: '',
    productName: '',
    quantity: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

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

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.id?.toLowerCase().includes(term) ||
        order.supplierName?.toLowerCase().includes(term) ||
        order.supplierEmail?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleSupplierChange = (supplierId) => {
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

  const handleRemoveItem = (index) => {
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

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowViewDialog(true);
  };

  const handleEditDraft = (order) => {
    if (order.status !== 'draft') return;
    setEditingOrder(order);
    setNewOrder({
      supplierId: order.supplierId || '',
      supplierName: order.supplierName || '',
      supplierEmail: order.supplierEmail || '',
      items: order.items || [],
    });
    setShowEditDialog(true);
  };

  const handleUpdateDraft = async () => {
    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/purchase-orders/${editingOrder.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(newOrder),
        }
      );

      if (response.ok) {
        await fetchData();
        setShowEditDialog(false);
        setEditingOrder(null);
        setNewOrder({
          supplierId: '',
          supplierName: '',
          supplierEmail: '',
          items: [],
        });
      }
    } catch (error) {
      console.error('Error updating draft order:', error);
    }
  };

  const handleDeleteDraft = async (orderId) => {
    if (!confirm('Are you sure you want to delete this draft order?')) return;

    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/purchase-orders/${orderId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Error deleting draft order:', error);
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
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

  const getStatusColor = (status) => {
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
          <div className="flex flex-col gap-4">
            <CardTitle>Recent Orders</CardTitle>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, supplier name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
              </select>
            </div>
          </div>
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
              {filteredOrders.map((order) => (
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {order.status === 'draft' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditDraft(order)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDraft(order.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {order.status === 'ordered' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, 'received')}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Mark Received
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredOrders.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {orders.length === 0
                ? 'No purchase orders yet'
                : 'No orders match your filters'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono">{selectedOrder.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Supplier</p>
                  <p className="font-medium">{selectedOrder.supplierName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p>{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="flex justify-between p-2 border rounded-lg">
                      <span>{item.productName} × {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Draft Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Draft Order</DialogTitle>
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
              onClick={handleUpdateDraft}
              className="w-full"
              disabled={!newOrder.supplierId || newOrder.items.length === 0}
            >
              Update Draft
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

