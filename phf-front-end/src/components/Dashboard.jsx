import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
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
      const token = session.access_token;

      // Fetch alerts
      const alertsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/alerts`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      const alertsData = await alertsRes.json();
      setAlerts(alertsData.alerts || []);

      // Fetch sales for today
      const salesRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/sales`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      const salesData = await salesRes.json();
      const sales = salesData.sales || [];

      const today = new Date().toDateString();
      const todaySales = sales.filter((sale) => 
        new Date(sale.createdAt).toDateString() === today
      );

      const todayRevenue = todaySales.reduce((sum, sale) => 
        sum + (sale.totalAmount || 0), 0
      );

      // Fetch inventory
      const invRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/inventory`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );
      const invData = await invRes.json();
      const inventory = invData.inventory || [];

      const totalValue = inventory.reduce((sum, item) => 
        sum + ((item.quantity || 0) * (item.costPrice || 0)), 0
      );

      setStats({
        todaySales: todayRevenue,
        todayTransactions: todaySales.length,
        lowStockCount: alertsData.alerts?.filter((a) => a.type === 'low-stock').length || 0,
        expiringCount: alertsData.alerts?.filter((a) => a.type === 'expiry').length || 0,
        totalInventoryValue: totalValue,
      });
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

