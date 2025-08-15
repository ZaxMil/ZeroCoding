// Per-User Coin Pricing Override Management
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AdminFormValidator, FieldValidator } from './validation/AdminFormValidator';
import { useAdminValidation } from '@/utils/security/AdminSecurityValidator';
import { useSimpleRole } from '@/hooks/useSimpleRole';
import { AdminEdgeFunctions } from '@/utils/adminEdgeFunctions';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Search, 
  DollarSign, 
  UserCheck, 
  Trash2, 
  Plus,
  AlertTriangle 
} from 'lucide-react';

interface UserSearchResult {
  user_id: string;
  username: string;
  email: string;
  role: string;
}

interface CoinPriceOverride {
  id: string;
  user_id: string;
  overridden_price: number;
  reason_for_change: string;
  updated_by_admin_id: string;
  created_at: string;
  updated_at: string;
  // Joined data
  username?: string;
  email?: string;
  admin_username?: string;
}

export const UserCoinPricingManager: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin } = useSimpleRole();
  const { validateForm, assessSecurity } = useAdminValidation();
  
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [overriddenPrice, setOverriddenPrice] = useState<number>(0.99);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [overrides, setOverrides] = useState<CoinPriceOverride[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormValid, setIsFormValid] = useState(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Only allow admin access
  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">
              Only super administrators can access per-user coin pricing controls.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  useEffect(() => {
    loadExistingOverrides();
  }, []);

  const loadExistingOverrides = async () => {
    try {
      setLoading(true);
      
      // Load existing overrides - this would need a proper query with joins
      // For now, we'll simulate the data structure
      const mockOverrides: CoinPriceOverride[] = [
        {
          id: '1',
          user_id: 'user-1',
          overridden_price: 0.49,
          reason_for_change: 'Excellent community contribution - 50% discount',
          updated_by_admin_id: 'admin-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: 'helpful_user',
          email: 'user@example.com',
          admin_username: 'admin'
        },
        {
          id: '2',
          user_id: 'user-2',
          overridden_price: 2.99,
          reason_for_change: 'Spam violations - price penalty applied',
          updated_by_admin_id: 'admin-1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          username: 'problematic_user',
          email: 'problem@example.com',
          admin_username: 'admin'
        }
      ];
      
      setOverrides(mockOverrides);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load existing pricing overrides",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await AdminEdgeFunctions.searchUsers(query);
      
      if (response.success) {
        setSearchResults(response.data || []);
      } else {
        toast({
          title: "Search Error",
          description: response.error || "Failed to search users",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const validatePriceOverride = () => {
    if (!selectedUser) {
      toast({
        title: "Validation Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return false;
    }

    if (overriddenPrice < 0.01 || overriddenPrice > 999.99) {
      toast({
        title: "Invalid Price",
        description: "Price must be between $0.01 and $999.99",
        variant: "destructive",
      });
      return false;
    }

    if (reason.trim().length < 10) {
      toast({
        title: "Invalid Reason",
        description: "Reason must be at least 10 characters",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const applyPriceOverride = async () => {
    if (!validatePriceOverride() || !selectedUser) return;

    try {
      setLoading(true);
      
      const response = await AdminEdgeFunctions.setUserCoinPriceOverride(
        selectedUser.user_id,
        overriddenPrice,
        reason
      );

      if (response.success) {
        toast({
          title: "Success",
          description: `Price override applied for ${selectedUser.username}`,
        });
        
        // Refresh the overrides list
        await loadExistingOverrides();
        
        // Reset form
        setSelectedUser(null);
        setOverriddenPrice(0.99);
        setReason('');
        setUserSearch('');
        setSearchResults([]);
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to apply price override",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to apply price override",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removePriceOverride = async (userId: string, username: string) => {
    try {
      setLoading(true);
      
      const response = await AdminEdgeFunctions.removeUserCoinPriceOverride(userId);

      if (response.success) {
        toast({
          title: "Success",
          description: `Price override removed for ${username}`,
        });
        
        await loadExistingOverrides();
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to remove price override",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to remove price override",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formData = {
    search_query: userSearch,
    overridden_price: overriddenPrice,
    reason_for_change: reason
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Per-User Coin Pricing</h2>
          <p className="text-muted-foreground">
            Override default coin prices for specific users
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Price Override
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Price Override</DialogTitle>
              <DialogDescription>
                Set a custom coin price for a specific user
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Form validation */}
              <AdminFormValidator
                formType="coinPricingForm"
                data={formData}
                onValidationChange={(isValid, errors) => {
                  setIsFormValid(isValid);
                  setValidationErrors(errors);
                }}
                showSecurityStatus={true}
                className="mb-4"
              />

              {/* User search */}
              <div className="space-y-2">
                <Label htmlFor="user-search">Search User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-search"
                    placeholder="Search by username, email, or ID..."
                    value={userSearch}
                    onChange={(e) => {
                      const sanitizedValue = e.target.value;
                      const security = assessSecurity(sanitizedValue);
                      if (!security.blocked) {
                        setUserSearch(sanitizedValue);
                        searchUsers(sanitizedValue);
                      }
                    }}
                    className="pl-10"
                  />
                  <FieldValidator
                    field="search_query"
                    value={userSearch}
                    rule={{ maxLength: 100, sanitize: true }}
                    className="absolute right-2 top-2"
                  />
                </div>
                
                {/* Search results */}
                {searchResults.length > 0 && (
                  <div className="border rounded-md max-h-40 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        className="p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                        onClick={() => {
                          setSelectedUser(user);
                          setUserSearch(user.username);
                          setSearchResults([]);
                        }}
                      >
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedUser && (
                  <div className="p-3 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Selected: {selectedUser.username}</span>
                      <Badge variant="outline">{selectedUser.role}</Badge>
                    </div>
                  </div>
                )}
              </div>

              {/* Price override */}
              <div className="space-y-2">
                <Label htmlFor="price">Override Price (USD)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="999.99"
                    value={overriddenPrice}
                    onChange={(e) => setOverriddenPrice(parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                  <FieldValidator
                    field="overridden_price"
                    value={overriddenPrice}
                    rule={{ type: 'number', min: 0.01, max: 999.99, decimals: 2 }}
                    className="absolute right-2 top-2"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Override</Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this price override is being applied..."
                  value={reason}
                  onChange={(e) => {
                    const sanitizedValue = e.target.value;
                    const security = assessSecurity(sanitizedValue);
                    if (!security.blocked) {
                      setReason(sanitizedValue);
                    }
                  }}
                  className="min-h-[80px]"
                />
                <FieldValidator
                  field="reason_for_change"
                  value={reason}
                  rule={{ minLength: 10, maxLength: 500, sanitize: true }}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={applyPriceOverride} 
                  disabled={!isFormValid || loading || !selectedUser}
                >
                  {loading ? 'Applying...' : 'Apply Override'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing overrides table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Price Overrides</CardTitle>
          <CardDescription>
            Users with custom coin pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Override Price</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Set By</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((override) => (
                <TableRow key={override.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{override.username}</div>
                      <div className="text-sm text-muted-foreground">{override.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">User</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="font-medium">{override.overridden_price.toFixed(2)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={override.reason_for_change}>
                      {override.reason_for_change}
                    </div>
                  </TableCell>
                  <TableCell>{override.admin_username}</TableCell>
                  <TableCell>
                    {new Date(override.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Price Override</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the custom pricing for {override.username} and restore 
                            default pricing. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removePriceOverride(override.user_id, override.username || 'user')}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove Override
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {overrides.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No price overrides configured
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
