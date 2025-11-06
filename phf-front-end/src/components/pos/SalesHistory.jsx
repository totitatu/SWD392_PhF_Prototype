import { useState, useEffect } from 'react';
import { projectId } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Receipt, Search, Calendar, Download, Eye } from 'lucide-react';
import { Separator } from '../ui/separator';

export function SalesHistory({ session }) {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, dateFilter]);

  const fetchSales = async () => {
    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/sales`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      const data = await response.json();
      const salesList = (data.sales || []).slice(0, 20).sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setSales(salesList);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSales = () => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(sale => 
        sale.id?.toLowerCase().includes(term) ||
        sale.userId?.toLowerCase().includes(term) ||
        sale.items?.some(item => 
          item.productName?.toLowerCase().includes(term)
        )
      );
    }

    // Date filter
    if (dateFilter.start) {
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) >= new Date(dateFilter.start)
      );
    }
    if (dateFilter.end) {
      filtered = filtered.filter(sale => 
        new Date(sale.createdAt) <= new Date(dateFilter.end + 'T23:59:59')
      );
    }

    setFilteredSales(filtered);
  };

  const handleViewSale = (sale) => {
    setSelectedSale(sale);
    setShowDetailDialog(true);
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Date', 'Total Amount', 'Items Count', 'Cashier'];
    const rows = filteredSales.map(sale => [
      sale.id.slice(-8),
      new Date(sale.createdAt).toLocaleDateString(),
      sale.totalAmount.toFixed(2),
      sale.items?.length || 0,
      session.user.user_metadata?.name || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
          <h1>Sales History</h1>
          <p className="text-muted-foreground">
            View and manage recent sales transactions
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, product name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={dateFilter.start}
                onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                className="w-40"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={dateFilter.end}
                onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-xs">
                    {sale.id.slice(-8)}
                  </TableCell>
                  <TableCell>
                    {new Date(sale.createdAt).toLocaleDateString()}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell>{sale.items?.length || 0} items</TableCell>
                  <TableCell className="font-semibold">
                    ${sale.totalAmount?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell>
                    {session.user.user_metadata?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewSale(sale)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredSales.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {sales.length === 0 
                ? 'No sales transactions found'
                : 'No sales match your filters'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sale Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Sale Details
            </DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transaction ID</p>
                  <p className="font-mono">{selectedSale.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p>{new Date(selectedSale.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cashier</p>
                  <p>{session.user.user_metadata?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Items</p>
                  <p>{selectedSale.items?.length || 0}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedSale.items?.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.productName}</p>
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

              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount</span>
                <span>${selectedSale.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

