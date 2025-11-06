import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  FileText, 
  BarChart3, 
  Users, 
  LogOut,
  Activity
} from 'lucide-react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  onSignOut: () => void;
  user: any;
}

export function Sidebar({ currentPage, onNavigate, onSignOut, user }: SidebarProps) {
  const userRole = user?.user_metadata?.role || 'staff';
  
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'admin', 'staff'] },
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, roles: ['owner', 'admin', 'staff'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['owner', 'admin', 'staff'] },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['owner', 'admin'] },
    { id: 'orders', label: 'Purchase Orders', icon: FileText, roles: ['owner', 'admin'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['owner', 'admin'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['owner', 'admin'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(userRole));

  return (
    <div className="w-64 bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl text-foreground">PharmaFlow</h1>
            <p className="text-xs text-muted-foreground">Pharmacy Management</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <Separator />

      <div className="p-4">
        <div className="bg-muted rounded-lg p-3 mb-3">
          <p className="text-sm text-foreground">{user?.user_metadata?.name || user?.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
