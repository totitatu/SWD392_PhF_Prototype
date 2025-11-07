import { useState, useEffect } from 'react';
import { supplierAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Plus, Mail, Phone, MapPin, Edit, Search, Filter, X } from 'lucide-react';

export function SupplierManager({ session }) {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all'); // all, active, inactive

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    products: '',
    notes: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, [filterActive]);

  useEffect(() => {
    filterSuppliers();
  }, [suppliers, searchTerm, filterActive]);

  const fetchSuppliers = async () => {
    try {
      const data = await supplierAPI.list({ active: filterActive === 'all' ? undefined : filterActive === 'active' });
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingSupplier) {
        await supplierAPI.update(editingSupplier.id, formData);
      } else {
        await supplierAPI.create({ ...formData, active: true });
      }
      await fetchSuppliers();
      setShowAddDialog(false);
      setEditingSupplier(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        products: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving supplier:', error);
      alert('Error saving supplier: ' + (error.message || 'Unknown error'));
    }
  };

  const filterSuppliers = () => {
    let filtered = [...suppliers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(supplier =>
        supplier.name?.toLowerCase().includes(term) ||
        supplier.email?.toLowerCase().includes(term) ||
        supplier.phone?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filterActive === 'active') {
      filtered = filtered.filter(s => s.isActive !== false);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter(s => s.isActive === false);
    }

    setFilteredSuppliers(filtered);
  };

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      products: supplier.products || '',
      notes: supplier.notes || '',
    });
    setShowAddDialog(true);
  };

  const handleDeactivate = async (supplier) => {
    if (!confirm(`Are you sure you want to deactivate ${supplier.name}?`)) return;

    try {
      await supplierAPI.deactivate(supplier.id);
      await fetchSuppliers();
    } catch (error) {
      console.error('Error deactivating supplier:', error);
      alert('Error deactivating supplier: ' + (error.message || 'Unknown error'));
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
          <h1>Supplier Management</h1>
          <p className="text-muted-foreground">
            Manage your pharmaceutical suppliers and contacts
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingSupplier(null);
            setFormData({
              name: '',
              email: '',
              phone: '',
              address: '',
              products: '',
              notes: '',
            });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
              </DialogTitle>
              <DialogDescription>
                {editingSupplier
                  ? 'Update supplier information'
                  : 'Add a new pharmaceutical supplier'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="PharmaCorp Ltd."
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="orders@pharmacorp.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Medical St, Healthcare City"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Products Supplied</Label>
                <Textarea
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  placeholder="Pain relievers, antibiotics, etc."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional information"
                  rows={2}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              >
                <option value="all">All Suppliers</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{supplier.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  {supplier.isActive !== false && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivate(supplier)}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {supplier.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`mailto:${supplier.email}`}
                    className="text-primary hover:underline"
                  >
                    {supplier.email}
                  </a>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a
                    href={`tel:${supplier.phone}`}
                    className="text-primary hover:underline"
                  >
                    {supplier.phone}
                  </a>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">{supplier.address}</span>
                </div>
              )}
              {supplier.products && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Products:</p>
                  <p className="text-sm">{supplier.products}</p>
                </div>
              )}
              {supplier.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Notes:</p>
                  <p className="text-sm">{supplier.notes}</p>
                </div>
              )}
              </CardContent>
            </Card>
            ))}
          </div>
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {suppliers.length === 0
                ? 'No suppliers yet. Add your first supplier to get started.'
                : 'No suppliers match your filters'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

