import { useState, useEffect } from 'react';
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
import { Receipt, Search, Calendar, Download, Eye, Printer, Mail, AlertCircle, RefreshCw, FileImage } from 'lucide-react';
import { Separator } from '../ui/separator';
import { saleAPI } from '../../services/api';

export function SalesHistory({ session }) {
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPrescriptionImage, setShowPrescriptionImage] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // UC47 - List Receipts: Fetch up to 20 recent receipts
  useEffect(() => {
    fetchSales();
  }, []);

  // Update filtered sales when sales data changes (for initial display)
  useEffect(() => {
    if (sales.length > 0 && !dateFilter.start && !dateFilter.end && !searchTerm) {
      setFilteredSales(sales);
    }
  }, [sales]);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      // UC47 - Normal Flow step 2: Retrieve latest 20 receipts
      const salesList = await saleAPI.list();
      // Sort by soldAt descending (reverse chronological order)
      const sorted = (salesList || [])
        .sort((a, b) => new Date(b.soldAt || b.createdAt) - new Date(a.soldAt || a.createdAt))
        .slice(0, 20); // POST-1: Up to 20 recent receipts
      setSales(sorted);
      setFilteredSales(sorted);
    } catch (error) {
      console.error('Error fetching sales:', error);
      // E2: Database unreachable
      setError('Database unreachable. Please try again.');
      setSales([]);
      setFilteredSales([]);
    } finally {
      setLoading(false);
    }
  };

  // UC47 - A1: Apply filters (date range or keyword)
  const filterSales = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      
      // A1: Filter by date range
      if (dateFilter.start) {
        filters.startDate = new Date(dateFilter.start).toISOString();
      }
      if (dateFilter.end) {
        const endDate = new Date(dateFilter.end);
        endDate.setHours(23, 59, 59, 999);
        filters.endDate = endDate.toISOString();
      }
      
      // A1: Filter by keyword (searchTerm)
      if (searchTerm.trim()) {
        filters.searchTerm = searchTerm.trim();
      }
      
      let salesList;
      if (Object.keys(filters).length > 0) {
        // Use filtered API call
        salesList = await saleAPI.list(filters);
      } else {
        // Get recent sales
        salesList = await saleAPI.list();
      }
      
      const sorted = (salesList || [])
        .sort((a, b) => new Date(b.soldAt || b.createdAt) - new Date(a.soldAt || a.createdAt))
        .slice(0, 20);
      setSales(sorted);
      setFilteredSales(sorted);
    } catch (error) {
      console.error('Error filtering sales:', error);
      setError('Error applying filters. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // UC48 - View Receipt Details: Staff selects a receipt from the list
  const handleViewSale = async (sale) => {
    setLoadingDetail(true);
    try {
      // UC48 - Normal Flow step 2: Retrieve full transaction details
      const fullSale = await saleAPI.getById(sale.id);
      setSelectedSale(fullSale);
      setShowDetailDialog(true);
    } catch (error) {
      console.error('Error fetching sale details:', error);
      // E1: Receipt not found
      alert('Record unavailable. Please try again.');
      setSelectedSale(sale); // Fallback to basic info
      setShowDetailDialog(true);
    } finally {
      setLoadingDetail(false);
    }
  };

  // UC48 - A1: View attached prescription
  const handleViewPrescription = () => {
    if (selectedSale?.prescriptionImageUrl) {
      setShowPrescriptionImage(true);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export functionality coming soon');
  };

  // UC47 - Export to CSV
  const exportToCSV = () => {
    const headers = ['Receipt Number', 'Date', 'Total Amount', 'Items Count', 'Cashier', 'Payment Method'];
    const rows = filteredSales.map(sale => [
      sale.receiptNumber || sale.id?.slice(-8) || 'N/A',
      new Date(sale.soldAt || sale.createdAt).toLocaleDateString(),
      (sale.totalAmount || 0).toFixed(2),
      sale.lineItems?.length || sale.items?.length || 0,
      sale.cashierName || 'N/A',
      sale.paymentMethod || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Sales History</h1>
          <p className="text-muted-foreground">
            View and manage recent sales transactions (UC47 - List Receipts)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          {error && (
            <Button onClick={fetchSales} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* E2: Database unreachable - Show retry option */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSales}
            className="h-7"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number, cashier name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    filterSales();
                  }
                }}
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
              <Button onClick={filterSales} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Filter
              </Button>
              {(dateFilter.start || dateFilter.end || searchTerm) && (
                <Button 
                  onClick={() => {
                    setDateFilter({ start: '', end: '' });
                    setSearchTerm('');
                    fetchSales();
                  }} 
                  variant="ghost"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Cashier</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-mono text-xs">
                          {sale.receiptNumber || sale.id?.slice(-8) || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {new Date(sale.soldAt || sale.createdAt).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-muted-foreground">
                            {new Date(sale.soldAt || sale.createdAt).toLocaleTimeString()}
                          </span>
                        </TableCell>
                        <TableCell>{sale.lineItems?.length || sale.items?.length || 0} items</TableCell>
                        <TableCell className="font-semibold">
                          ${(sale.totalAmount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {sale.cashierName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {sale.paymentMethod || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewSale(sale)}
                            disabled={loadingDetail}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {/* E1: No receipts found */}
                        {sales.length === 0 
                          ? 'No sales available.'
                          : 'No sales match your filters'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      {/* UC48 - View Receipt Details Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Receipt Details (UC48)
              </div>
              <div className="flex gap-2">
                {selectedSale?.prescriptionImageUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewPrescription}
                  >
                    <FileImage className="w-4 h-4 mr-1" />
                    View Prescription
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrintReceipt}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportPDF}
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : selectedSale ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Receipt Number</p>
                  <p className="font-mono font-medium">{selectedSale.receiptNumber || selectedSale.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date & Time</p>
                  <p>{new Date(selectedSale.soldAt || selectedSale.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Cashier</p>
                  <p className="font-medium">{selectedSale.cashierName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Method</p>
                  <Badge variant="outline">{selectedSale.paymentMethod || 'N/A'}</Badge>
                </div>
                {selectedSale.customerEmail && (
                  <div>
                    <p className="text-muted-foreground">Customer Email</p>
                    <p>{selectedSale.customerEmail}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Total Items</p>
                  <p className="font-medium">{selectedSale.lineItems?.length || selectedSale.items?.length || 0}</p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold mb-2">Items</h4>
                <div className="space-y-2">
                  {(selectedSale.lineItems || selectedSale.items || []).map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex justify-between items-center p-2 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.productName || 'Unknown Product'}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.productSku && `SKU: ${item.productSku}`}
                          {item.batchNumber && ` | Batch: ${item.batchNumber}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          ${(item.unitPrice || item.price || 0).toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(item.lineTotal || (item.unitPrice || item.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSale.totalDiscount && selectedSale.totalDiscount > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-red-600">-${selectedSale.totalDiscount.toFixed(2)}</span>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount</span>
                <span>${(selectedSale.totalAmount || 0).toFixed(2)}</span>
              </div>

              {/* UC48 - A1: View attached prescription */}
              {selectedSale.prescriptionImageUrl && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Prescription Image</p>
                    <Button
                      variant="outline"
                      onClick={handleViewPrescription}
                      className="w-full"
                    >
                      <FileImage className="w-4 h-4 mr-2" />
                      View Prescription Image
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {/* E1: Receipt not found */}
              Record unavailable.
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Prescription Image Viewer Dialog */}
      <Dialog open={showPrescriptionImage} onOpenChange={setShowPrescriptionImage}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Prescription Image</DialogTitle>
          </DialogHeader>
          {selectedSale?.prescriptionImageUrl && (
            <div className="space-y-4">
              <img
                src={selectedSale.prescriptionImageUrl}
                alt="Prescription"
                className="w-full h-auto border rounded-lg"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

