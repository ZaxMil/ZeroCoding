import { useEffect, useRef, useState } from 'react';
import { loadPayPalSdk } from './sdk';
import { supabase } from '@/integrations/supabase/client';
import { getPayPalSettings } from '@/settings/SettingsAPI';

export type CheckoutButtonProps = {
  amount: number;
  currency?: string;
  onSuccess?: (res: any) => void;
  onError?: (err: any) => void;
  className?: string;
};

export function CheckoutButton({ amount, currency, onSuccess, onError, className }: CheckoutButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const settings = await getPayPalSettings();
        const clientId = settings.clientId as string | undefined;
        if (!clientId) throw new Error('PayPal Client ID missing');
        const curr = (currency || settings.currency || 'USD').toUpperCase();

        // Check if SDK is loaded with different currency
        const existingScript = document.querySelector('script[src^="https://www.paypal.com/sdk/js"]') as HTMLScriptElement;
        if (existingScript) {
          const currentCurrency = new URLSearchParams(new URL(existingScript.src).search).get('currency');
          if (currentCurrency && currentCurrency.toUpperCase() !== curr) {
            // Remove old script and reset PayPal
            existingScript.remove();
            delete (window as any).paypal;
          }
        }

        // Load SDK (currency can now be changed)
        await loadPayPalSdk({ clientId, currency: curr, intent: 'capture', components: 'buttons' });
        if (cancelled) return;

        setReady(true);

        // Render buttons
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          const paypal = (window as any).paypal;
          await paypal.Buttons({
            style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
            createOrder: async () => {
              const { data, error } = await supabase.functions.invoke('paypal-create-order', {
                body: { amount, currency: curr },
              });
              if (error || !data?.ok) throw new Error(data?.error || error?.message || 'create failed');
              return data.id as string;
            },
            onApprove: async (data: any) => {
              const { data: cap, error } = await supabase.functions.invoke('paypal-capture-order', {
                body: { orderId: data.orderID },
              });
              if (error || !cap?.ok) throw new Error(cap?.error || error?.message || 'capture failed');
              onSuccess?.(cap);
            },
            onError: (err: any) => {
              onError?.(err);
            }
          }).render(containerRef.current);
        }
      } catch (e) {
        onError?.(e);
      }
    })();

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [amount, currency]);

  return <div ref={containerRef} className={className} aria-live="polite" />;
}

export default CheckoutButton;