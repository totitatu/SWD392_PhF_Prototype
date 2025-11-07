import { useState, useEffect } from 'react';
import { purchaseOrderAPI, supplierAPI, productAPI } from '../../services/api';
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
    unitCost: 0,
  });

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      const [ordersData, suppliersData, productsData] = await Promise.all([
        purchaseOrderAPI.list({ status: statusFilter !== 'all' ? statusFilter.toUpperCase() : undefined }),
        supplierAPI.list({ active: true }),
        productAPI.list({ active: true }),
      ]);

      setOrders(ordersData || []);
      setSuppliers(suppliersData || []);
      setProducts(productsData || []);
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
        order.orderCode?.toLowerCase().includes(term) ||
        order.supplierName?.toLowerCase().includes(term) ||
        order.supplierEmail?.toLowerCase().includes(term) ||
        (order.lineItems || order.items || []).some(item => 
          item.productName?.toLowerCase().includes(term)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        const orderStatus = (order.status || '').toUpperCase();
        const filterStatus = statusFilter.toUpperCase();
        return orderStatus === filterStatus;
      });
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
    if (orderItem.productId && orderItem.quantity > 0 && orderItem.unitCost > 0) {
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
      setOrderItem({ productId: '', productName: '', quantity: 0, unitCost: 0 });
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
      // Generate order code (e.g., PO-YYYYMMDD-HHMMSS)
      const now = new Date();
      const orderCode = `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      
      // Get today's date and expected date (7 days from now)
      const today = new Date().toISOString().split('T')[0];
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      await purchaseOrderAPI.create({
        orderCode: orderCode,
        supplierId: newOrder.supplierId,
        orderDate: today,
        expectedDate: expectedDateStr,
        lineItems: newOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost || 0.01,
        })),
      });
      await fetchData();
      setShowCreateDialog(false);
      setNewOrder({
        supplierId: '',
        supplierName: '',
        supplierEmail: '',
        items: [],
      });
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Error creating order: ' + (error.message || 'Unknown error'));
    }
  };

  const handleViewOrder = async (order) => {
    try {
      // Fetch full order details to ensure lineItems are loaded
      const fullOrder = await purchaseOrderAPI.getById(order.id);
      setSelectedOrder(fullOrder);
      setShowViewDialog(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback to order from list if fetch fails
      setSelectedOrder(order);
      setShowViewDialog(true);
    }
  };

  const handleEditDraft = async (order) => {
    if (order.status !== 'DRAFT' && order.status !== 'draft') return;
    try {
      // Fetch full order details to ensure lineItems are loaded
      const fullOrder = await purchaseOrderAPI.getById(order.id);
      setEditingOrder(fullOrder);
      const lineItems = fullOrder.lineItems || fullOrder.items || [];
      setNewOrder({
        supplierId: fullOrder.supplierId || '',
        supplierName: fullOrder.supplierName || '',
        supplierEmail: '',
        items: lineItems.map(item => ({
          productId: item.productId,
          productName: item.productName || '',
          quantity: item.quantity || 0,
          unitCost: item.unitCost || 0,
        })),
      });
      setShowEditDialog(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
      // Fallback to order from list if fetch fails
      const lineItems = order.lineItems || order.items || [];
      setEditingOrder(order);
      setNewOrder({
        supplierId: order.supplierId || '',
        supplierName: order.supplierName || '',
        supplierEmail: '',
        items: lineItems.map(item => ({
          productId: item.productId,
          productName: item.productName || '',
          quantity: item.quantity || 0,
          unitCost: item.unitCost || 0,
        })),
      });
      setShowEditDialog(true);
    }
  };

  const handleUpdateDraft = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      const expectedDateStr = expectedDate.toISOString().split('T')[0];

      await purchaseOrderAPI.update(editingOrder.id, {
        orderCode: editingOrder.orderCode || `PO-${Date.now()}`,
        supplierId: newOrder.supplierId,
        orderDate: editingOrder.orderDate || today,
        expectedDate: editingOrder.expectedDate || expectedDateStr,
        lineItems: newOrder.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost || 0.01,
        })),
      });
      await fetchData();
      setShowEditDialog(false);
      setEditingOrder(null);
      setNewOrder({
        supplierId: '',
        supplierName: '',
        supplierEmail: '',
        items: [],
      });
    } catch (error) {
      console.error('Error updating draft order:', error);
      alert('Error updating order: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteDraft = async (orderId) => {
    if (!confirm('Are you sure you want to delete this draft order?')) return;

    try {
      await purchaseOrderAPI.delete(orderId);
      await fetchData();
    } catch (error) {
      console.error('Error deleting draft order:', error);
      alert('Error deleting order: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const statusUpper = (status || '').toUpperCase();
      
      // Use the new updateStatus endpoint
      await purchaseOrderAPI.updateStatus(orderId, statusUpper);
      
      // Refresh data
      await fetchData();
      
      // Update selectedOrder if it's the same order being viewed
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = await purchaseOrderAPI.getById(orderId);
        setSelectedOrder(updatedOrder);
      }
      
      // Update editingOrder if it's the same order being edited
      if (editingOrder && editingOrder.id === orderId) {
        const updatedOrder = await purchaseOrderAPI.getById(orderId);
        setEditingOrder(updatedOrder);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Error updating order status: ' + (error.message || 'Unknown error'));
    }
  };

  const getStatusColor = (status) => {
    const statusUpper = (status || '').toUpperCase();
    switch (statusUpper) {
      case 'ORDERED':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'DRAFT':
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
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <Select
                      value={orderItem.productId}
                      onValueChange={(value) => {
                        const product = products.find(p => p.id === value);
                        setOrderItem({ 
                          ...orderItem, 
                          productId: value,
                          productName: product?.name || ''
                        });
                      }}
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
                    min="1"
                    placeholder="Qty"
                    value={orderItem.quantity || ''}
                    onChange={(e) =>
                      setOrderItem({
                        ...orderItem,
                        quantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Unit Cost"
                    value={orderItem.unitCost || ''}
                    onChange={(e) =>
                      setOrderItem({
                        ...orderItem,
                        unitCost: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <Button 
                  onClick={handleAddItem} 
                  variant="outline" 
                  className="w-full"
                  disabled={!orderItem.productId || orderItem.quantity <= 0 || orderItem.unitCost <= 0}
                >
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
                        {item.productName} x {item.quantity} @ ${item.unitCost?.toFixed(2) || '0.00'}
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
              <div className="relative flex-[3]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ID, supplier name, order code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="ORDERED">Ordered</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
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
                  <TableCell>{(order.lineItems || order.items || [])?.length || 0} items</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Select
                        value={order.status || 'DRAFT'}
                        onValueChange={(value) => handleUpdateStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-32 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRAFT">Draft</SelectItem>
                          <SelectItem value="ORDERED">Ordered</SelectItem>
                          <SelectItem value="RECEIVED">Received</SelectItem>
                          <SelectItem value="CANCELLED">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                      {(order.status === 'DRAFT' || order.status === 'draft') && (
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
                      {(order.status === 'ORDERED' || order.status === 'ordered') && (
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
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                    <Select
                      value={selectedOrder.status || 'DRAFT'}
                      onValueChange={(value) => handleUpdateStatus(selectedOrder.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ORDERED">Ordered</SelectItem>
                        <SelectItem value="RECEIVED">Received</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                  {(selectedOrder.lineItems || selectedOrder.items || []).length > 0 ? (
                    (selectedOrder.lineItems || selectedOrder.items || []).map((item, index) => (
                      <div key={item.id || index} className="flex justify-between p-2 border rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{item.productName || 'Unknown Product'}</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            Quantity: {item.quantity} × ${item.unitCost?.toFixed(2) || '0.00'} = ${((item.quantity || 0) * (item.unitCost || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No items in this order</p>
                  )}
                </div>
                {(selectedOrder.lineItems || selectedOrder.items || []).length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total:</span>
                      <span>
                        ${((selectedOrder.lineItems || selectedOrder.items || []).reduce((sum, item) => 
                          sum + ((item.quantity || 0) * (item.unitCost || 0)), 0
                        )).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
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
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <Select
                    value={orderItem.productId}
                    onValueChange={(value) => {
                      const product = products.find(p => p.id === value);
                      setOrderItem({ 
                        ...orderItem, 
                        productId: value,
                        productName: product?.name || ''
                      });
                    }}
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
                  min="1"
                  placeholder="Qty"
                  value={orderItem.quantity || ''}
                  onChange={(e) =>
                    setOrderItem({
                      ...orderItem,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Unit Cost"
                  value={orderItem.unitCost || ''}
                  onChange={(e) =>
                    setOrderItem({
                      ...orderItem,
                      unitCost: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <Button 
                onClick={handleAddItem} 
                variant="outline" 
                className="w-full"
                disabled={!orderItem.productId || orderItem.quantity <= 0 || orderItem.unitCost <= 0}
              >
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
                      {item.productName} x {item.quantity} @ ${item.unitCost?.toFixed(2) || '0.00'}
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

