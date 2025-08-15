import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getPayPalSettings, savePayPalSettings, PayPalSettings as PSettings, PayPalMode } from '@/settings/SettingsAPI';
import { loadPayPalSdk } from '@/payments/paypal/sdk';
import { supabase } from '@/integrations/supabase/client';
import CheckoutButton from '@/payments/paypal/CheckoutButton';

const fieldCls = 'flex flex-col gap-2';

const PayPalSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PSettings>({ mode: 'sandbox', currency: 'USD', returnUrl: '/', cancelUrl: '/' });
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getPayPalSettings();
      setSettings(s);
      setLoading(false);
    })();
  }, []);

  const onSave = async () => {
    try {
      setSaving(true);
      await savePayPalSettings(settings);
      toast({ title: 'PayPal settings saved' });
    } catch (e:any) {
      toast({ title: 'Save failed', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const onTestClient = async () => {
    const clientId = settings.clientId;
    if (!clientId) {
      toast({ title: 'Add your PayPal Client ID first', variant: 'destructive' });
      return;
    }
    try {
      await loadPayPalSdk({ clientId, currency: settings.currency });
      if ((window as any).paypal) toast({ title: 'PayPal SDK loaded successfully' });
      else toast({ title: 'SDK loaded but window.paypal missing', variant: 'destructive' });
    } catch (e:any) {
      toast({ title: 'SDK failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const onReloadSdk = async () => {
    try {
      // Force reload SDK with current currency
      const existingScript = document.querySelector('script[src^="https://www.paypal.com/sdk/js"]') as HTMLScriptElement;
      if (existingScript) {
        existingScript.remove();
        delete (window as any).paypal;
      }
      
      const clientId = settings.clientId as string | undefined;
      if (!clientId) throw new Error('PayPal Client ID missing');
      
      await loadPayPalSdk({ clientId, currency: settings.currency, intent: 'capture', components: 'buttons' });
      toast({ title: `SDK reloaded with ${settings.currency} currency` });
      setShowCheckout(false); // Reset checkout to remount with new currency
    } catch (e:any) {
      toast({ title: 'SDK reload failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const onTestServer = async () => {
    const clientId = settings.clientId as string | undefined;
    try {
      const { data, error } = await supabase.functions.invoke('paypal-validate', {
        body: { mode: settings.mode as PayPalMode, clientId }
      });
      if (error) throw error;
      const { ok, tokenOk, webhookOk } = data || {};
      if (ok) {
        toast({ title: 'Server OK', description: `token=${!!tokenOk} · webhook=${webhookOk === undefined ? 'n/a' : !!webhookOk}` });
      } else {
        toast({ title: 'Server validation failed', description: `token=${!!tokenOk} · webhook=${webhookOk === undefined ? 'n/a' : !!webhookOk}`, variant: 'destructive' });
      }
    } catch (e:any) {
      toast({ title: 'Server test failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">PayPal Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">Non-secret options are stored locally. Secrets must be set via environment.</p>
          <p className="text-xs text-muted-foreground mt-1">Client ID saved: {settings.clientId ? 'Yes' : 'No'}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className={fieldCls}>
            <Label>Mode</Label>
            <Select value={settings.mode} onValueChange={(v)=> setSettings(s=> ({...s, mode: v as PayPalMode}))}>
              <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox">Sandbox</SelectItem>
                <SelectItem value="live">Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className={fieldCls}>
            <Label>PayPal Client ID (publishable)</Label>
            <Input value={settings.clientId || ''} onChange={(e)=> setSettings(s=> ({...s, clientId: e.target.value.trim()}))} placeholder="A...your-client-id..." />
            <p className="text-xs text-muted-foreground">Stored locally; required to load the SDK</p>
          </div>
          <div className={fieldCls}>
            <Label>Currency</Label>
            <Input value={settings.currency} onChange={(e)=> setSettings(s=> ({...s, currency: e.target.value.toUpperCase()}))} placeholder="USD" />
            <p className="text-xs text-muted-foreground">Changing currency reloads the SDK</p>
          </div>
          <div className={fieldCls}>
            <Label>Return URL</Label>
            <Input value={settings.returnUrl} onChange={(e)=> setSettings(s=> ({...s, returnUrl: e.target.value}))} placeholder="/payment-success" />
          </div>
          <div className={fieldCls}>
            <Label>Cancel URL</Label>
            <Input value={settings.cancelUrl} onChange={(e)=> setSettings(s=> ({...s, cancelUrl: e.target.value}))} placeholder="/payment-canceled" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={onSave} disabled={saving || loading}>Save</Button>
          <Button variant="outline" onClick={onTestClient}>Test Client SDK</Button>
          {!settings.clientId && (
            <p className="text-xs text-yellow-600">⚠️ PayPal Client ID not set</p>
          )}
          <Button variant="outline" onClick={onReloadSdk}>Reload SDK</Button>
          <Button variant="outline" onClick={onTestServer}>Test Server Credentials</Button>
          <Button variant="outline" onClick={()=> setShowCheckout((s)=>!s)}>Test $1 Checkout (Sandbox)</Button>
        </div>

        {showCheckout && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Sandbox test: completes a $1 capture via Edge Functions.<br/>
              <span className="text-xs">Sandbox only; use buyer sandbox account to approve.</span>
            </p>
            <CheckoutButton
              amount={1}
              currency={settings.currency}
              onSuccess={(res)=> toast({ title: `Capture OK: ${res?.status || 'COMPLETED'}`, description: res?.captureId ? `captureId: ${res.captureId}` : undefined })}
              onError={(err)=> toast({ title: 'Checkout failed', description: err?.message || String(err), variant: 'destructive' })}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default PayPalSettings;