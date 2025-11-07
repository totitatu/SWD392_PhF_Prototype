import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { saleAPI, inventoryAPI } from '../services/api';

export function Dashboard({ session }) {
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    lowStockCount: 0,
    expiringCount: 0,
    totalInventoryValue: 0,
  });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch sales for today
      const sales = await saleAPI.list({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
      });

      const todayRevenue = sales.reduce((sum, sale) => 
        sum + (sale.totalAmount || 0), 0
      );

      // Fetch inventory
      const inventory = await inventoryAPI.list({ active: true });

      const totalValue = inventory.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.costPrice || 0)), 0
      );

      // Calculate low stock and expiring items
      const lowStockCount = inventory.filter(item => {
        // This would need product info to check minStock
        // For now, using a simple threshold
        return item.quantity <= 10;
      }).length;

      const expiringCount = inventory.filter(item => {
        if (!item.expiryDate) return false;
        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      }).length;

      setStats({
        todaySales: todayRevenue,
        todayTransactions: sales.length,
        lowStockCount,
        expiringCount,
        totalInventoryValue: totalValue,
      });

      // Generate alerts from inventory
      const alerts = [];
      inventory.forEach(item => {
        if (item.quantity <= 10) {
          alerts.push({
            type: 'low-stock',
            severity: item.quantity === 0 ? 'critical' : 'warning',
            message: `Low stock: ${item.productName || 'Product'} - ${item.quantity} remaining`,
          });
        }
        if (item.expiryDate) {
          const expiryDate = new Date(item.expiryDate);
          const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            alerts.push({
              type: 'expiry',
              severity: daysUntilExpiry <= 7 ? 'critical' : 'warning',
              message: `Expiring soon: ${item.productName || 'Product'} - ${daysUntilExpiry} days left`,
            });
          }
        }
      });
      setAlerts(alerts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').slice(0, 5);
  const warningAlerts = alerts.filter(a => a.severity === 'warning').slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your pharmacy.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.todayTransactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${stats.totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Expiring Soon</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{stats.expiringCount}</div>
            <p className="text-xs text-muted-foreground">
              Within 3 months
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Critical Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No critical alerts</p>
            ) : (
              criticalAlerts.map((alert, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{alert.type === 'expiry' ? 'Expired Item' : 'Critical Stock'}</AlertTitle>
                  <AlertDescription className="text-xs">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warnings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {warningAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No warnings</p>
            ) : (
              warningAlerts.map((alert, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {alert.type === 'expiry' ? 'Expiring Soon' : 'Low Stock'}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {alert.message}
                  </AlertDescription>
                </Alert>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
              <Package className="w-6 h-6 text-primary mb-2" />
              <h3 className="text-sm">Add New Stock</h3>
              <p className="text-xs text-muted-foreground">Update inventory</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
              <DollarSign className="w-6 h-6 text-primary mb-2" />
              <h3 className="text-sm">New Sale</h3>
              <p className="text-xs text-muted-foreground">Process transaction</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-muted transition-colors text-left">
              <TrendingUp className="w-6 h-6 text-primary mb-2" />
              <h3 className="text-sm">View Reports</h3>
              <p className="text-xs text-muted-foreground">Analytics & insights</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

