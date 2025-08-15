import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Search, Shield, Ban, Crown, Coins } from 'lucide-react';
import { AdminCoinManagerDialog } from '@/components/admin/AdminCoinManagerDialog';
import { AdminFormValidator, BulkOperationValidator } from './validation/AdminFormValidator';
import { useAdminValidation } from '@/utils/security/AdminSecurityValidator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  user_id: string;
  email: string;
  username: string;
  role: string;
  activity_score: number;
  login_count: number;
  is_banned: boolean;
  created_at: string;
  wallet_balance?: number;
}

export const SimpleUserManager = () => {
  const { toast } = useToast();
  const { validateForm, validateBulkOperation, checkRolePermission } = useAdminValidation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [coinDialog, setCoinDialog] = useState<{ open: boolean; user?: UserProfile }>({ open: false });
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'ban' | 'role_change' | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [userRole] = useState('admin'); // In real app, get from auth context

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const profiles = data || [];
      const userIds = profiles.map((u: any) => u.user_id);

      // Fetch wallet balances in batch
      const { data: wallets, error: walletError } = await supabase
        .from('coin_wallets')
        .select('user_id, balance')
        .in('user_id', userIds);

      if (walletError) {
        console.warn('Could not load coin wallets:', walletError);
      }

      const walletMap: Record<string, number> = {};
      wallets?.forEach((w: any) => { walletMap[w.user_id] = w.balance; });

      setUsers(profiles.map((u: any) => ({ ...u, wallet_balance: walletMap[u.user_id] ?? 0 })));
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'author' | 'editor' | 'member' | 'user') => {
    // Validate role permission
    if (!checkRolePermission(userRole, newRole)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to assign this role",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      await loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const toggleUserBan = async (userId: string, currentBanStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: !currentBanStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentBanStatus ? 'banned' : 'unbanned'} successfully`,
      });

      await loadUsers();
    } catch (error) {
      console.error('Error updating ban status:', error);
      toast({
        title: "Error",
        description: "Failed to update ban status",
        variant: "destructive",
      });
    }
  };

  // Bulk operations
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleBulkAction = (action: 'ban' | 'role_change') => {
    setBulkAction(action);
    setShowBulkDialog(true);
  };

  const executeBulkAction = async () => {
    if (!bulkAction || selectedUsers.size === 0) return;

    try {
      const userIds = Array.from(selectedUsers);
      
      if (bulkAction === 'ban') {
        const { error } = await supabase
          .from('profiles')
          .update({ is_banned: true })
          .in('user_id', userIds);

        if (error) throw error;
      } else if (bulkAction === 'role_change' && newRole) {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole as any })
          .in('user_id', userIds);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Bulk ${bulkAction} operation completed successfully`,
      });

      setSelectedUsers(new Set());
      setShowBulkDialog(false);
      setBulkAction(null);
      setNewRole('');
      await loadUsers();
    } catch (error) {
      console.error('Error in bulk operation:', error);
      toast({
        title: "Error",
        description: "Failed to complete bulk operation",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'author': return 'default';
      case 'editor': return 'secondary';
      case 'member': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by email or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="author">Author</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Coins</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username || 'No username'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select 
                          value={user.role} 
                          onValueChange={(value) => updateUserRole(user.user_id, value as 'admin' | 'author' | 'editor' | 'member' | 'user')}
                        >
                          <SelectTrigger className="w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="author">Author</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="user">User</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCoinDialog({ open: true, user })}
                          aria-label={`Manage coins for ${user.username || user.email}`}
                        >
                          <Coins className="h-4 w-4 mr-1" />
                          {user.wallet_balance ?? 0}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Score: {user.activity_score}</div>
                          <div>Logins: {user.login_count}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive">Banned</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={user.is_banned ? "outline" : "destructive"}
                          onClick={() => toggleUserBan(user.user_id, user.is_banned)}
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          {user.is_banned ? 'Unban' : 'Ban'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Coin Manager Dialog */}
          <AdminCoinManagerDialog
            open={coinDialog.open}
            onOpenChange={(open) => setCoinDialog({ open, user: open ? coinDialog.user : undefined })}
            userId={coinDialog.user?.user_id || ''}
            email={coinDialog.user?.email || ''}
            username={coinDialog.user?.username}
          />
        </CardContent>
      </Card>
    </div>
  );
};