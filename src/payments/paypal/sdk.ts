declare global {
  interface Window {
    paypal: any;
  }
}

export type PayPalSdkOptions = {
  clientId: string;
  currency: string;
  intent?: 'capture' | 'authorize';
  components?: string; // e.g., 'buttons,marks'
  disableFunding?: string; // e.g., 'paylater,card'
};

let loadingPromise: Promise<any> | null = null;

export async function loadPayPalSdk(opts: PayPalSdkOptions): Promise<any> {
  if (typeof window === 'undefined') throw new Error('SDK can only load in browser');
  if (window.paypal) return window.paypal;
  if (loadingPromise) return loadingPromise;

  const params = new URLSearchParams();
  params.set('client-id', opts.clientId);
  params.set('currency', opts.currency);
  params.set('intent', opts.intent || 'capture');
  params.set('components', opts.components || 'buttons');
  if (opts.disableFunding) params.set('disable-funding', opts.disableFunding);

  const src = `https://www.paypal.com/sdk/js?${params.toString()}`;

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src^="https://www.paypal.com/sdk/js"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.paypal));
      existing.addEventListener('error', () => reject(new Error('PayPal SDK failed to load')));
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(window.paypal);
    script.onerror = () => reject(new Error('PayPal SDK failed to load'));
    document.body.appendChild(script);
  });

  return loadingPromise;
}