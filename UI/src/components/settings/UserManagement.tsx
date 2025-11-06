import { useState } from 'react';
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
import { Plus, Users, Mail, Shield } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface UserManagementProps {
  session: any;
}

export function UserManagement({ session }: UserManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff',
  });

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(newUser),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess('User created successfully!');
      setTimeout(() => {
        setShowAddDialog(false);
        setNewUser({ email: '', password: '', name: '', role: 'staff' });
        setSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>User Management</h1>
          <p className="text-muted-foreground">
            Manage staff accounts and permissions
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setNewUser({ email: '', password: '', name: '', role: 'staff' });
            setError('');
            setSuccess('');
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new staff member to your pharmacy system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="staff@pharmacy.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Sales Staff</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Staff members have limited access to sales features only
                </p>
              </div>
              {error && (
                <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}
              {success && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  {success}
                </div>
              )}
              <Button
                onClick={handleCreateUser}
                className="w-full"
                disabled={loading || !!success}
              >
                {loading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">-</div>
            <p className="text-xs text-muted-foreground">
              All staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">-</div>
            <p className="text-xs text-muted-foreground">
              Admin & Owner accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Sales Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">-</div>
            <p className="text-xs text-muted-foreground">
              Limited access users
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4>{session.user.user_metadata?.name || 'User'}</h4>
                  <Badge variant={getRoleBadgeVariant(session.user.user_metadata?.role || 'staff')}>
                    {session.user.user_metadata?.role || 'staff'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  {session.user.email}
                </div>
              </div>
            </div>

            <div className="bg-secondary/50 p-4 rounded-lg">
              <h4 className="text-sm mb-2">Role Permissions</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {session.user.user_metadata?.role === 'owner' && (
                  <>
                    <li>• Full system access</li>
                    <li>• User management</li>
                    <li>• Reports and analytics</li>
                    <li>• Supplier and purchase order management</li>
                    <li>• Inventory and sales management</li>
                  </>
                )}
                {session.user.user_metadata?.role === 'admin' && (
                  <>
                    <li>• Most system features</li>
                    <li>• User management</li>
                    <li>• Reports and analytics</li>
                    <li>• Supplier and purchase order management</li>
                    <li>• Inventory and sales management</li>
                  </>
                )}
                {session.user.user_metadata?.role === 'staff' && (
                  <>
                    <li>• Point of Sale access</li>
                    <li>• View inventory</li>
                    <li>• Process sales transactions</li>
                    <li>• Limited dashboard access</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>User listing requires additional database setup.</p>
            <p className="text-sm mt-2">
              Users can be created using the "Add User" button above.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
