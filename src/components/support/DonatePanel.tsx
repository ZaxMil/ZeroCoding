import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DollarSign, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadPayPalSdk } from '@/payments/paypal/sdk';
import { supabase } from '@/integrations/supabase/client';

interface DonatePanelProps {
  defaultAmount?: number;
  currency?: string;
  onSuccess?: (order: any) => void;
}

const presets = ['3.00', '5.00', '10.00', '25.00'];

export default function DonatePanel({ defaultAmount = 5, currency = 'USD', onSuccess }: DonatePanelProps) {
  const [amount, setAmount] = useState<string>(defaultAmount.toFixed(2));
  const [message, setMessage] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [paypalReady, setPaypalReady] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();

  // Load PayPal SDK lazily when panel is shown
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadPayPalSdk({ clientId: 'sb', currency: currency.toUpperCase(), intent: 'capture', components: 'buttons', disableFunding: 'credit,card' });
        if (!cancelled) setPaypalReady(true);
      } catch (e) {
        console.error('PayPal SDK failed to load', e);
        toast({
          title: 'PayPal unavailable',
          description: 'Falling back to Support page for donations.',
          variant: 'destructive'
        });
      }
    })();
    return () => { cancelled = true; };
  }, [currency, toast]);

  // Render PayPal Buttons (rerender when amount changes)
  useEffect(() => {
    if (!paypalReady || !containerRef.current) return;

    containerRef.current.innerHTML = '';
    const paypal = (window as any).paypal;

    paypal.Buttons({
      style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [
            {
              amount: { value: amount },
              description: message || 'Support Kodelex'
            }
          ]
        });
      },
      onApprove: async (_data: any, actions: any) => {
        setLoading(true);
        try {
          const order = await actions.order.capture();
          await logTransaction(order);
          toast({
            title: 'Thank you for your support! ❤️',
            description: `Your donation of $${amount} has been processed successfully.`,
          });
          onSuccess?.(order);
        } catch (err) {
          console.error('PayPal error:', err);
          toast({
            title: 'Payment Error',
            description: 'There was an issue processing your payment. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setLoading(false);
        }
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast({ title: 'Payment Error', description: 'There was an issue with PayPal. Please try again.', variant: 'destructive' });
      }
    }).render(containerRef.current);
  }, [amount, message, paypalReady]);

  const logTransaction = async (order: any) => {
    try {
      const { error } = await supabase
        .from('donations')
        .insert({
          transaction_id: order.id,
          email: email || 'anonymous@supporter.com',
          amount: parseFloat(amount),
          message: message || null,
          paypal_order_data: order,
          status: 'completed'
        });
      if (error) console.error('Error logging transaction:', error);
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Choose Amount (USD)</Label>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <Button
              key={p}
              variant={amount === p ? 'default' : 'outline'}
              onClick={() => setAmount(p)}
              className={amount === p ? 'bg-gradient-accent' : ''}
              aria-pressed={amount === p}
            >
              ${p}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Custom amount"
            className="flex-1"
            aria-label="Custom amount"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">Email (optional)</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your.email@example.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium">Message (optional)</Label>
        <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Leave a message of support..." className="min-h-[80px]" maxLength={500} />
        <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
      </div>

      <div className="border-t pt-3">
        <div ref={containerRef} className={`min-h-[50px] ${loading ? 'opacity-50 pointer-events-none' : ''}`} aria-live="polite" />
        {!paypalReady && (
          <div className="text-center text-muted-foreground py-3">Loading PayPal...</div>
        )}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-2">
          <Heart className="h-3 w-3" />
          <span>Secure payments via PayPal. We never store your card details.</span>
        </div>
      </div>
    </div>
  );
}
