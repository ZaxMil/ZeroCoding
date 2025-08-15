// Admin Edge Functions Integration
import { supabase } from '@/integrations/supabase/client';

interface EdgeFunctionResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  validation?: {
    isValid: boolean;
    error: string;
    sanitizedData: Record<string, any>;
  };
  timestamp: string;
}

export class AdminEdgeFunctions {
  
  private static async callEdgeFunction<T = any>(
    functionName: string,
    payload: Record<string, any>
  ): Promise<EdgeFunctionResponse<T>> {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) {
        throw error;
      }

      return data as EdgeFunctionResponse<T>;
    } catch (error: any) {
      console.error(`Edge function ${functionName} error:`, error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  // Role change validation and execution
  static async changeUserRole(targetUserId: string, newRole: string, reason?: string) {
    return this.callEdgeFunction('admin-validation', {
      action: 'role_change',
      data: {
        target_user_id: targetUserId,
        new_role: newRole
      },
      target_id: targetUserId,
      reason
    });
  }

  // Account suspension/ban
  static async suspendAccount(
    targetUserId: string,
    suspensionType: 'ban' | 'suspend' | 'shadowban' | 'mute',
    durationHours?: number,
    reason?: string
  ) {
    return this.callEdgeFunction('admin-validation', {
      action: 'account_suspension',
      data: {
        target_user_id: targetUserId,
        suspension_type: suspensionType,
        duration_hours: durationHours
      },
      target_id: targetUserId,
      reason
    });
  }

  // Coin pricing updates
  static async updateCoinPricing(pricingData: {
    coin_amount: number;
    price_usd: number;
    currency: string;
    region: string;
    user_group?: string;
    promo_code?: string;
  }) {
    return this.callEdgeFunction('admin-validation', {
      action: 'coin_pricing_update',
      data: pricingData
    });
  }

  // Chapter publishing/unpublishing
  static async updateChapterStatus(chapterId: string, action: 'publish' | 'unpublish') {
    return this.callEdgeFunction('admin-validation', {
      action: 'chapter_publish',
      data: { action },
      target_id: chapterId
    });
  }

  // Comment moderation
  static async moderateComment(
    commentId: string,
    action: 'approve' | 'reject' | 'delete' | 'flag',
    reason?: string
  ) {
    return this.callEdgeFunction('content-moderation', {
      action: 'comment_moderation',
      data: {
        comment_id: commentId,
        moderation_action: action
      },
      reason
    });
  }

  // Per-user coin pricing overrides
  static async setUserCoinPriceOverride(
    userId: string,
    overriddenPrice: number,
    reason: string
  ) {
    return this.callEdgeFunction('admin-validation', {
      action: 'user_pricing_override',
      data: {
        user_id: userId,
        overridden_price: overriddenPrice,
        reason_for_change: reason
      }
    });
  }

  static async getUserCoinPriceOverride(userId: string) {
    try {
      // For now, return mock data since table doesn't exist yet
      const mockData = {
        user_id: userId,
        overridden_price: 0.99,
        reason_for_change: 'Test override',
        updated_by_admin_id: 'admin-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return {
        success: true,
        data: Math.random() > 0.5 ? mockData : null, // Simulate sometimes having overrides
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  static async removeUserCoinPriceOverride(userId: string) {
    try {
      // Mock implementation - in real app this would delete from the table
      console.log('Removing price override for user:', userId);

      return {
        success: true,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Search users for pricing overrides
  static async searchUsers(query: string, limit: number = 20) {
    try {
      // Mock user search for testing
      const mockUsers = [
        {
          user_id: 'user-1',
          username: 'test_user_1',
          email: 'user1@example.com',
          role: 'member'
        },
        {
          user_id: 'user-2',
          username: 'test_user_2',
          email: 'user2@example.com',
          role: 'user'
        },
        {
          user_id: 'user-3',
          username: 'premium_user',
          email: 'premium@example.com',
          role: 'member'
        }
      ];

      const filteredUsers = mockUsers.filter(user => 
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.user_id.includes(query)
      ).slice(0, limit);

      return {
        success: true,
        data: filteredUsers,
        timestamp: new Date().toISOString()
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: [],
        timestamp: new Date().toISOString()
      };
    }
  }
}