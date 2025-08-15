// CoinsAdapter using localStorage mock wallet and transactions
import { getMockWallet, setMockWallet, getMockTransactions, addMockTransaction, MockTransaction } from '@/lib/mockStorage';
import { runtime } from '@/config/runtime';

export interface CoinsAdapter {
  getWallet: (uid: string) => Promise<{ balance: number; lifetime_earned: number; lifetime_spent: number }>;
  getTransactions: (uid: string, limit?: number) => Promise<MockTransaction[]>;
  addCoins: (uid: string, amount: number, description?: string, reference_id?: string) => Promise<void>;
  spendCoins: (uid: string, amount: number, description?: string, chapterId?: string) => Promise<boolean>;
}

export const coinsAdapter: CoinsAdapter = {
  async getWallet(uid) {
    return getMockWallet(uid);
  },
  async getTransactions(uid, limit = 50) {
    const list = getMockTransactions(uid);
    return list.slice(0, limit);
  },
  async addCoins(uid, amount, description, reference_id) {
    if (!runtime.USE_MOCKS) return; // no-op in prod here
    addMockTransaction(uid, { amount: Math.abs(amount), type: 'reward', description, reference_id });
  },
  async spendCoins(uid, amount, description, chapterId) {
    if (amount <= 0) return false;
    const w = getMockWallet(uid);
    if ((w.balance || 0) < amount) return false;
    addMockTransaction(uid, { amount: -Math.abs(amount), type: 'spend', description, reference_id: chapterId });
    return true;
  }
};
