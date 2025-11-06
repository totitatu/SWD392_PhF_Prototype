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
import { Search, Eye, Filter, FileText } from 'lucide-react';

export function SystemLogs({ session }) {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, levelFilter]);

  const fetchLogs = async () => {
    try {
      const token = session.access_token;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a836deb0/logs`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const logsList = (data.logs || []).sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setLogs(logsList);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      // If API doesn't exist, use mock data for demonstration
      setLogs([
        {
          id: '1',
          level: 'info',
          message: 'User logged in successfully',
          userId: session.user.id,
          action: 'login',
          timestamp: new Date().toISOString(),
          details: { email: session.user.email },
        },
        {
          id: '2',
          level: 'info',
          message: 'Product created',
          userId: session.user.id,
          action: 'product_create',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: { productName: 'Paracetamol' },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message?.toLowerCase().includes(term) ||
        log.action?.toLowerCase().includes(term) ||
        log.userId?.toLowerCase().includes(term)
      );
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(log => log.level === levelFilter);
    }

    setFilteredLogs(filtered);
  };

  const handleViewLog = (log) => {
    setSelectedLog(log);
    setShowViewDialog(true);
  };

  const getLevelBadgeVariant = (level) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'outline';
      case 'info':
        return 'default';
      default:
        return 'outline';
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
      <div>
        <h1>System Logs</h1>
        <p className="text-muted-foreground">
          View system activity and audit logs
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs by message, action, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-input-background px-3 py-2 text-sm"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLevelBadgeVariant(log.level)}>
                      {log.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono">{log.action || 'N/A'}</span>
                  </TableCell>
                  <TableCell className="max-w-md truncate">
                    {log.message}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {log.userId?.slice(-8) || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredLogs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {logs.length === 0
                ? 'No system logs found'
                : 'No logs match your filters'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Log Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Log Details
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Level</p>
                  <Badge variant={getLevelBadgeVariant(selectedLog.level)}>
                    {selectedLog.level}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <p className="font-mono text-sm">{selectedLog.action || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{selectedLog.userId || 'N/A'}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-2">Message</p>
                <p className="font-medium">{selectedLog.message}</p>
              </div>

              {selectedLog.details && (
                <div>
                  <p className="text-muted-foreground mb-2">Details</p>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

