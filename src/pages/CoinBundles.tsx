import React, { useEffect, useMemo, useState } from 'react';
import { EnhancedSEOHelmet } from '@/components/EnhancedSEOHelmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, CreditCard } from 'lucide-react';
import { configManager } from '@/utils/configManager';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Bundle { amount: number; price: number; }

const CoinBundles: React.FC = () => {
  const [siteName, setSiteName] = useState('MangaReader');
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    configManager.loadConfig().then(cfg => {
      setSiteName(cfg.site.siteName);
      const entries = Object.entries(cfg.site.coinPricing || {})
        .map(([amount, price]) => ({ amount: parseInt(amount,10), price: Number(price) }))
        .sort((a,b) => a.amount - b.amount);
      setBundles(entries);
    });
  }, []);

  const handleBuy = async (b: Bundle) => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }));
      return;
    }
    try {
      setLoading(String(b.amount));
      const { data, error } = await supabase.functions.invoke('paypal-purchase-coins', {
        body: { package_id: String(b.amount), coins: b.amount, amount: b.price, currency: 'USD' }
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({ title: 'Redirecting to PayPal', description: 'Complete your purchase to receive coins' });
      }
    } catch (e) {
      console.error('purchase error', e);
      toast({ title: 'Purchase failed', description: 'Unable to start payment', variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <EnhancedSEOHelmet 
        title={`Coin Bundles — ${siteName}`}
        description="Purchase coins and bonuses to unlock chapters"
        canonical="/coins/bundles"
      />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Coin Bundles</h1>
          <p className="text-muted-foreground">Choose a bundle and complete checkout to receive coins</p>
        </div>
        {bundles.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">No bundles configured.</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {bundles.map((b, idx) => {
              const bonus = idx>0 ? Math.round(((b.amount - bundles[0].amount) / b.amount) * 100) : 0;
              return (
                <Card key={b.amount} className="relative">
                  {bonus>0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Best Value</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-lg">{b.amount} coins</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="text-2xl font-bold">${b.price.toFixed(2)}</div>
                    {bonus>0 && (
                      <Badge variant="secondary" className="inline-flex items-center gap-1"><Gift className="h-3 w-3" /> {bonus}% Bonus</Badge>
                    )}
                    <Button onClick={() => handleBuy(b)} disabled={loading===String(b.amount)} className="w-full">
                      {loading===String(b.amount) ? 'Processing…' : (<><CreditCard className="h-4 w-4 mr-2" /> Buy</>)}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default CoinBundles;
