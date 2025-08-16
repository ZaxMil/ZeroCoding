import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { UserCoins, CoinTransaction } from '@/types/monetization';

export function useCoins() {
  const { user } = useAuth();
  const [userCoins, setUserCoins] = useState<UserCoins | null>(null);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserCoins = useCallback(async () => {
    if (!user) return;

    try {
      // Mock data for demonstration - in real app this would be from Supabase
      const mockUserCoins: UserCoins = {
        user_id: user.id,
        balance: 150,
        total_earned: 500,
        total_spent: 350,
        last_updated: new Date().toISOString()
      };
      
      setUserCoins(mockUserCoins);
    } catch (error) {
      console.error('Error fetching user coins:', error);
      toast.error('Failed to load coin balance');
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      // Mock data for demonstration
      const mockTransactions: CoinTransaction[] = [
        {
          id: '1',
          user_id: user.id,
          amount: 500,
          transaction_type: 'purchase',
          description: 'Purchased Premium Pack',
          status: 'completed',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          updated_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: '2',
          user_id: user.id,
          amount: -50,
          transaction_type: 'spend',
          description: 'Unlocked Chapter 15',
          reference_id: 'chapter-15',
          status: 'completed',
          created_at: new Date(Date.now() - 43200000).toISOString(),
          updated_at: new Date(Date.now() - 43200000).toISOString()
        }
      ];
      
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, [user]);

  const spendCoins = useCallback(async (amount: number, description: string, referenceId?: string) => {
    if (!user || !userCoins) return false;

    if (userCoins.balance < amount) {
      toast.error('Insufficient coins');
      return false;
    }

    try {
      // Mock spending logic - in real app this would use Supabase functions
      if (userCoins.balance >= amount) {
        const updatedCoins = {
          ...userCoins,
          balance: userCoins.balance - amount,
          total_spent: userCoins.total_spent + amount
        };
        setUserCoins(updatedCoins);

        toast.success(`Spent ${amount} coins`);
        return true;
      } else {
        toast.error('Insufficient coins');
        return false;
      }
    } catch (error) {
      console.error('Error spending coins:', error);
      toast.error('Failed to spend coins');
      return false;
    }
  }, [user, userCoins, fetchUserCoins, fetchTransactions]);

  const addCoins = useCallback(async (amount: number, description: string, referenceId?: string) => {
    if (!user) return false;

    try {
      // Mock add coins logic
      const updatedCoins = {
        ...userCoins!,
        balance: userCoins!.balance + amount,
        total_earned: userCoins!.total_earned + amount
      };
      setUserCoins(updatedCoins);

      toast.success(`Received ${amount} coins!`);
      return true;
    } catch (error) {
      console.error('Error adding coins:', error);
      toast.error('Failed to add coins');
      return false;
    }
  }, [user, fetchUserCoins, fetchTransactions]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchUserCoins(), fetchTransactions()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user, fetchUserCoins, fetchTransactions]);

  return {
    userCoins,
    transactions,
    loading,
    spendCoins,
    addCoins,
    refreshCoins: fetchUserCoins,
    refreshTransactions: fetchTransactions
  };
}