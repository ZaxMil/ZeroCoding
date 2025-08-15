import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/utils/DatabaseService';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Coins, Plus, Minus, History, DollarSign, AlertTriangle } from 'lucide-react';

interface AdminCoinManagerDialogProps {
  userId: string;
  email: string;
  username?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface WalletInfo {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

interface TransactionRow {
  id: string;
  amount: number;
  type: 'purchase' | 'spend' | 'refund' | 'reward' | 'earn';
  context: string;
  description?: string;
  reference_id?: string | null;
  created_at: string;
}

export const AdminCoinManagerDialog = ({ userId, email, username, open, onOpenChange }: AdminCoinManagerDialogProps) => {
  const { toast } = useToast();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [amount, setAmount] = useState<number>(0);
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [reason, setReason] = useState('');
  const [referenceId, setReferenceId] = useState('');

  const [pricingSupported, setPricingSupported] = useState<boolean>(true);
  const [useOverride, setUseOverride] = useState<boolean>(false);
  const [overridePrice, setOverridePrice] = useState<number>(0);
  const [overrideCurrency, setOverrideCurrency] = useState<string>('USD');
  const [savingPrice, setSavingPrice] = useState(false);

  const displayName = useMemo(() => username || email, [username, email]);

  useEffect(() => {
    if (!open || !userId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        supabase
          .from('coin_wallets')
          .select('balance, lifetime_earned, lifetime_spent')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('coin_transactions')
          .select('id, amount, type, context, description, reference_id, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (walletRes.error && walletRes.error.code !== 'PGRST116') { // ignore not found
        throw walletRes.error;
      }

      setWallet(walletRes.data || { balance: 0, lifetime_earned: 0, lifetime_spent: 0 });
      setTransactions((txRes.data as unknown as TransactionRow[]) || []);

      // Load per-user pricing override if available
      const { data: coinSettings, error: coinSettingsError } = await (supabase as any)
        .from('user_coin_settings')
        .select('price_per_coin, currency')
        .eq('user_id', userId)
        .single();

      if (coinSettingsError) {
        // Likely table missing; disable pricing override UI gracefully
        console.warn('user_coin_settings not available:', coinSettingsError.message);
        setPricingSupported(false);
      } else {
        setPricingSupported(true);
        if (coinSettings) {
          setUseOverride(true);
          setOverridePrice(Number(coinSettings.price_per_coin));
          setOverrideCurrency(coinSettings.currency || 'USD');
        } else {
          setUseOverride(false);
        }
      }
    } catch (e: any) {
      console.error('Failed to load coin data:', e);
      toast({ title: 'Error', description: 'Failed to load coin data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (val: number) => {
    setAmount((prev) => Math.max(0, (prev || 0) + val));
    setMode(val >= 0 ? 'add' : 'remove');
  };

  const submitAdjustment = async () => {
    if (!userId) return;
    const amt = Math.abs(Number(amount));
    if (!amt) {
      toast({ title: 'Amount required', description: 'Enter a coin amount greater than 0', variant: 'destructive' });
      return;
    }
    try {
      setLoading(true);
      const type = mode === 'add' ? 'earn' : 'spend';
      const context = reason?.trim() ? reason.trim() : 'admin_adjustment';
      const res = await db.processCoins(userId, amt, type as any, context);
      if ((res as any)?.error) throw (res as any).error;
      toast({ title: 'Success', description: `Balance ${mode === 'add' ? 'increased' : 'decreased'} by ${amt} coins` });
      setAmount(0); setReason(''); setReferenceId('');
      await loadAll();
    } catch (e: any) {
      console.error('Adjustment failed', e);
      toast({ title: 'Adjustment failed', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const savePricingOverride = async () => {
    if (!pricingSupported) return;
    try {
      setSavingPrice(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (useOverride) {
        const { error } = await (supabase as any).from('user_coin_settings').upsert({
          user_id: userId,
          price_per_coin: overridePrice,
          currency: overrideCurrency,
          updated_at: new Date().toISOString(),
          updated_by: user?.id || null,
        });
        if (error) throw error;
      } else {
        // Clear override
        const { error } = await (supabase as any).from('user_coin_settings').delete().eq('user_id', userId);
        if (error) throw error;
      }
      toast({ title: 'Saved', description: 'Per-user coin price saved' });
    } catch (e: any) {
      console.error('Failed to save override', e);
      toast({ title: 'Failed to save', description: e?.message || 'user_coin_settings table may be missing', variant: 'destructive' });
    } finally {
      setSavingPrice(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Coins — {displayName}</DialogTitle>
          <DialogDescription>Adjust balance, review history, and set per-user pricing.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="adjust">Adjust</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    <div>
                      <div className="text-sm">Balance</div>
                      <div className="text-2xl font-semibold">{wallet?.balance ?? 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm">Lifetime Earned</div>
                  <div className="text-xl font-semibold">{wallet?.lifetime_earned ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm">Lifetime Spent</div>
                  <div className="text-xl font-semibold">{wallet?.lifetime_spent ?? 0}</div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-medium">Per-user pricing override</div>
                {!pricingSupported && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" /> Not configured (user_coin_settings table missing)
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>Use override</Label>
                  <div className="flex items-center gap-2">
                    <Button variant={useOverride ? 'default' : 'outline'} size="sm" onClick={() => setUseOverride(true)}>On</Button>
                    <Button variant={!useOverride ? 'default' : 'outline'} size="sm" onClick={() => setUseOverride(false)}>Off</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Price per coin</Label>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <Input type="number" step="0.0001" value={overridePrice} onChange={(e) => setOverridePrice(parseFloat(e.target.value) || 0)} disabled={!useOverride || !pricingSupported} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Input value={overrideCurrency} onChange={(e) => setOverrideCurrency(e.target.value || 'USD')} disabled={!useOverride || !pricingSupported} />
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={savePricingOverride} disabled={!pricingSupported || (!useOverride && overridePrice === 0) || savingPrice}>
                  Save Pricing
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="adjust">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} placeholder="e.g. 100" />
                </div>
                <div className="space-y-2">
                  <Label>Action</Label>
                  <div className="flex gap-2">
                    <Button variant={mode === 'add' ? 'default' : 'outline'} onClick={() => setMode('add')} size="sm">
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                    <Button variant={mode === 'remove' ? 'default' : 'outline'} onClick={() => setMode('remove')} size="sm">
                      <Minus className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {[10, 50, 100, -10, -50].map((v) => (
                  <Button key={v} size="sm" variant="secondary" onClick={() => applyPreset(v)}>
                    {v > 0 ? `+${v}` : v}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Reason/Description</Label>
                <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Manual adjustment, compensation" />
              </div>
              <div className="space-y-2">
                <Label>Reference ID (optional)</Label>
                <Input value={referenceId} onChange={(e) => setReferenceId(e.target.value)} placeholder="e.g., chapter_123" />
              </div>

              <div className="pt-2">
                <Button onClick={submitAdjustment} disabled={loading}>
                  Apply Adjustment
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="max-h-[60vh] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Context</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">No transactions</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={tx.type === 'spend' ? 'destructive' : 'default'}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={tx.type === 'spend' ? 'text-red-600' : 'text-green-600'}>
                          {tx.type === 'spend' ? '-' : '+'}{tx.amount}
                        </TableCell>
                        <TableCell>{tx.description || tx.context}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCoinManagerDialog;
