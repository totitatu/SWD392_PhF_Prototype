import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package,
  Calendar,
  Brain
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ReportsPageProps {
  session: any;
}

export function ReportsPage({ session }: ReportsPageProps) {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [forecastLoading, setForecastLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = session.access_token;

      const [salesRes, productsRes, inventoryRes] = await Promise.all([
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/sales`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/products`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/inventory`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      const salesData = await salesRes.json();
      const productsData = await productsRes.json();
      const inventoryData = await inventoryRes.json();

      setSales(salesData.sales || []);
      setProducts(productsData.products || []);
      setInventory(inventoryData.inventory || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateForecast = async (productId: string) => {
    setForecastLoading(true);
    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/forecast`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        }
      );

      const data = await response.json();
      setForecast(data.forecast);
    } catch (error) {
      console.error('Error generating forecast:', error);
    } finally {
      setForecastLoading(false);
    }
  };

  // Calculate sales by date
  const getSalesByDate = () => {
    const salesByDate: { [key: string]: number } = {};
    
    sales.forEach((sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      salesByDate[date] = (salesByDate[date] || 0) + (sale.totalAmount || 0);
    });

    return Object.entries(salesByDate)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 days
  };

  // Calculate top selling products
  const getTopProducts = () => {
    const productSales: { [key: string]: { name: string; quantity: number } } = {};

    sales.forEach((sale) => {
      sale.items?.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.productName,
            quantity: 0,
          };
        }
        productSales[item.productId].quantity += item.quantity;
      });
    });

    return Object.entries(productSales)
      .map(([id, data]) => ({ ...data, id }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Calculate inventory value
  const getInventoryValue = () => {
    return inventory.reduce(
      (sum, item) => sum + (item.quantity || 0) * (item.costPrice || 0),
      0
    );
  };

  // Calculate total revenue
  const getTotalRevenue = () => {
    return sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  };

  // Calculate profit margin
  const getProfitMargin = () => {
    let totalRevenue = 0;
    let totalCost = 0;

    sales.forEach((sale) => {
      sale.items?.forEach((item: any) => {
        const stockItem = inventory.find((inv) => inv.productId === item.productId);
        totalRevenue += item.price * item.quantity;
        totalCost += (stockItem?.costPrice || 0) * item.quantity;
      });
    });

    return totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const salesByDate = getSalesByDate();
  const topProducts = getTopProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1>Reports & Analytics</h1>
        <p className="text-muted-foreground">
          View sales performance, inventory insights, and AI-powered forecasts
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${getTotalRevenue().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              All time sales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${getInventoryValue().toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Current stock value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{getProfitMargin().toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Average margin
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Transactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">{sales.length}</div>
            <p className="text-xs text-muted-foreground">
              All time sales
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Trends</TabsTrigger>
          <TabsTrigger value="products">Top Products</TabsTrigger>
          <TabsTrigger value="forecast">AI Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Over Time (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    name="Revenue ($)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#0ea5e9" name="Units Sold" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Powered Sales Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate demand predictions for your products using AI analysis of historical sales data.
              </p>

              <div className="space-y-2">
                <label className="text-sm">Select Product</label>
                <div className="flex gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
                    onChange={(e) => {
                      if (e.target.value) {
                        generateForecast(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select a product...</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.dosage}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {forecastLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {forecast && !forecastLoading && (
                <div className="border rounded-lg p-6 bg-primary/5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary">AI Forecast</Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(forecast.generatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg">{forecast.productName}</h3>
                      <p className="text-sm text-muted-foreground">
                        Predicted demand for next {forecast.period}
                      </p>
                    </div>
                    <div className="pt-4">
                      <div className="text-3xl text-primary">
                        {Math.round(forecast.predictedDemand)} units
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Recommended order quantity based on historical trends and seasonality
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!forecast && !forecastLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  Select a product to generate forecast
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
