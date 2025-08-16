export interface CoinTransaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: 'purchase' | 'spend' | 'reward' | 'refund';
  description: string;
  reference_id?: string; // PayPal transaction ID or chapter ID
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface UserCoins {
  user_id: string;
  balance: number;
  total_earned: number;
  total_spent: number;
  last_updated: string;
}

export interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  price: number;
  bonus_coins: number;
  popular: boolean;
  description: string;
  paypal_plan_id?: string;
}

export interface PremiumChapter {
  chapter_id: string;
  cost_in_coins: number;
  unlock_type: 'permanent' | 'temporary';
  unlock_duration?: number; // hours for temporary unlocks
  early_access?: boolean;
}

export interface ChapterUnlock {
  id: string;
  user_id: string;
  chapter_id: string;
  unlocked_at: string;
  expires_at?: string;
  transaction_id: string;
}

export interface PayPalPayment {
  id: string;
  user_id: string;
  paypal_order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'approved' | 'completed' | 'cancelled';
  coin_package_id: string;
  created_at: string;
  completed_at?: string;
}