import { createStore, get, set } from 'idb-keyval';

export type PayPalMode = 'sandbox' | 'live';

export interface PayPalSettings {
  mode: PayPalMode;
  currency: string; // e.g., USD
  returnUrl: string;
  cancelUrl: string;
  clientId?: string; // PayPal publishable client ID (safe to store client-side)
}

const store = createStore('app-settings', 'settings');
const KEY = 'paypal-settings';

const DEFAULTS: PayPalSettings = {
  mode: 'sandbox',
  currency: 'USD',
  returnUrl: '/',
  cancelUrl: '/',
  clientId: '',
};

export async function getPayPalSettings(): Promise<PayPalSettings> {
  try {
    const val = await get<PayPalSettings>(KEY, store);
    return { ...DEFAULTS, ...(val || {}) };
  } catch (e) {
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as PayPalSettings) };
    } catch (_) {}
    console.error('getPayPalSettings error', e);
    return { ...DEFAULTS };
  }
}

export async function savePayPalSettings(settings: PayPalSettings): Promise<void> {
  try {
    await set(KEY, settings, store);
  } catch (e) {
    // Fallback to localStorage
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
      return;
    } catch (_) {}
    console.error('savePayPalSettings error', e);
    throw e;
  }
}