import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';
import { userAPI } from '../../services/api';
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
import { Plus, Users, Mail, Shield, Search, Edit, Eye, X, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { SystemLogs } from './SystemLogs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

export function UserManagement({ session }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    name: '',
    role: 'staff',
    active: true,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userAPI.list();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(term) ||
        user.fullName?.toLowerCase().includes(term) ||
        user.id?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      const roleMap = {
        'owner': 'OWNER',
        'admin': 'PHARMACIST',
        'staff': 'SALES_STAFF'
      };
      const targetRole = roleMap[roleFilter] || roleFilter.toUpperCase();
      filtered = filtered.filter(user => 
        (user.role || 'SALES_STAFF') === targetRole
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(user => user.active !== false);
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(user => user.active === false);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Map frontend role to backend enum
      const roleMap = {
        'owner': 'OWNER',
        'admin': 'PHARMACIST',
        'staff': 'SALES_STAFF'
      };

      await userAPI.create({
        fullName: newUser.name,
        email: newUser.email,
        passwordHash: newUser.password, // Backend should hash this, but for now we send it
        role: roleMap[newUser.role] || 'SALES_STAFF',
        active: true,
      });

      setSuccess('User created successfully!');
      setTimeout(() => {
        setShowAddDialog(false);
        setNewUser({ email: '', password: '', name: '', role: 'staff', active: true });
        setSuccess('');
        fetchUsers();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowViewDialog(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    // Map backend role to frontend role
    const roleMap = {
      'OWNER': 'owner',
      'PHARMACIST': 'admin',
      'SALES_STAFF': 'staff'
    };
    setNewUser({
      email: user.email || '',
      password: '',
      name: user.fullName || '',
      role: roleMap[user.role] || 'staff',
      active: user.active !== false,
    });
    setShowEditDialog(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Map frontend role to backend enum
      const roleMap = {
        'owner': 'OWNER',
        'admin': 'PHARMACIST',
        'staff': 'SALES_STAFF'
      };

      await userAPI.update(editingUser.id, {
        fullName: newUser.name,
        email: editingUser.email, // Email should not change
        passwordHash: newUser.password || undefined, // Only send if provided
        role: roleMap[newUser.role] || 'SALES_STAFF',
        active: newUser.active,
      });

      setSuccess('User updated successfully!');
      setTimeout(() => {
        setShowEditDialog(false);
        setEditingUser(null);
        setNewUser({ email: '', password: '', name: '', role: 'staff', active: true });
        setSuccess('');
        fetchUsers();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateUser = async (user) => {
    if (!confirm(`Are you sure you want to deactivate ${user.fullName || user.email}?`)) return;

    try {
      await userAPI.deactivate(user.id);
      await fetchUsers();
      setSuccess('User deactivated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error deactivating user:', error);
      setError('Failed to deactivate user: ' + (error.message || 'Unknown error'));
    }
  };

  const handleActivateUser = async (user) => {
    if (!confirm(`Are you sure you want to activate ${user.fullName || user.email}?`)) return;

    try {
      await userAPI.activate(user.id);
      await fetchUsers();
      setSuccess('User activated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error activating user:', error);
      setError('Failed to activate user: ' + (error.message || 'Unknown error'));
    }
  };

  const getRoleBadgeVariant = (role) => {
    const roleUpper = (role || '').toUpperCase();
    switch (roleUpper) {
      case 'OWNER':
        return 'default';
      case 'PHARMACIST':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const userStats = {
    total: users.length,
    admins: users.filter(u => ['OWNER', 'PHARMACIST'].includes(u.role)).length,
    staff: users.filter(u => u.role === 'SALES_STAFF').length,
  };

  return (
    <div className="space-y-6">
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
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="w-4 h-4 mr-2" />
            System Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
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
            <div className="text-2xl">{userStats.total}</div>
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
            <div className="text-2xl">{userStats.admins}</div>
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
            <div className="text-2xl">{userStats.staff}</div>
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
                  <h4>{session.user.user_metadata?.name || session.user.email || 'User'}</h4>
                  <Badge variant={getRoleBadgeVariant(session.user.user_metadata?.role || 'STAFF')}>
                    {session.user.user_metadata?.role || 'STAFF'}
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
          <div className="flex flex-col gap-4">
            <CardTitle>User List</CardTitle>
            <div className="flex gap-4">
              <div className="relative flex-[3]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex-1">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div className="flex-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      {user.fullName || 'N/A'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role || 'SALES_STAFF')}>
                        {user.role === 'PHARMACIST' ? 'Admin' : user.role === 'SALES_STAFF' ? 'Staff' : user.role || 'Staff'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active === false ? 'destructive' : 'outline'}>
                        {user.active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewUser(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.id !== session.user.id && (
                          user.active === false ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleActivateUser(user)}
                              className="text-green-600 hover:text-green-700"
                              title="Activate user"
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeactivateUser(user)}
                              className="text-destructive"
                              title="Deactivate user"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {users.length === 0
                ? 'No users found. Create your first user above.'
                : 'No users match your filters'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-medium">{selectedUser.fullName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role || 'SALES_STAFF')}>
                    {selectedUser.role === 'PHARMACIST' ? 'Admin' : selectedUser.role === 'SALES_STAFF' ? 'Staff' : selectedUser.role || 'Staff'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={selectedUser.active === false ? 'destructive' : 'outline'}>
                    {selectedUser.active === false ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{selectedUser.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => {
        setShowEditDialog(open);
        if (!open) {
          setEditingUser(null);
          setNewUser({ email: '', password: '', name: '', role: 'staff', active: true });
          setError('');
          setSuccess('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
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
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>New Password (leave blank to keep current)</Label>
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
            </div>
            <div className="space-y-2">
              <Label>Account Status</Label>
              <Select 
                value={newUser.active ? 'active' : 'inactive'} 
                onValueChange={(value) => setNewUser({ ...newUser, active: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive (Deactivated)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {newUser.active 
                  ? 'User can log in and access the system' 
                  : 'User cannot log in and is deactivated'}
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
              onClick={handleUpdateUser}
              className="w-full"
              disabled={loading || !!success}
            >
              {loading ? 'Updating...' : 'Update User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="logs">
          <SystemLogs session={session} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

