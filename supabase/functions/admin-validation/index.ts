// Admin Validation Edge Function
// Provides server-side validation for critical admin operations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidationRequest {
  action: 'role_change' | 'account_suspension' | 'coin_pricing_update' | 'chapter_publish' | 'comment_moderation'
  data: Record<string, any>
  target_id?: string
  user_role?: string
  reason?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the current user from the JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Parse request body
    const { action, data, target_id, user_role, reason }: ValidationRequest = await req.json();

    console.log(`Admin validation request: ${action} by user ${user.id}`);

    // Verify user is admin/moderator
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_banned')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      throw new Error('Could not fetch user profile');
    }

    if (profile.is_banned) {
      throw new Error('User is banned');
    }

    const isAdmin = profile.role === 'admin';
    const isEditor = profile.role === 'editor';
    const isModerator = isAdmin || isEditor;

    if (!isModerator) {
      throw new Error('Insufficient permissions');
    }

    // Server-side validation based on action type
    let validationResult = { isValid: false, error: '', sanitizedData: {} };

    switch (action) {
      case 'role_change':
        validationResult = await validateRoleChange(data, isAdmin, supabase);
        break;
      
      case 'account_suspension':
        validationResult = await validateAccountSuspension(data, reason, isModerator, supabase);
        break;
      
      case 'coin_pricing_update':
        validationResult = await validateCoinPricingUpdate(data, isAdmin, supabase);
        break;
      
      case 'chapter_publish':
        validationResult = await validateChapterPublish(data, target_id, isModerator, supabase);
        break;
      
      case 'comment_moderation':
        validationResult = await validateCommentModeration(data, reason, isModerator, supabase);
        break;
      
      default:
        throw new Error('Unknown validation action');
    }

    // Log the validation attempt
    await supabase.from('admin_actions').insert({
      action_type: `validate_${action}`,
      admin_user_id: user.id,
      target_type: action,
      target_id: target_id || null,
      description: `Server-side validation for ${action}`,
      metadata: {
        validation_result: validationResult.isValid,
        user_role: profile.role,
        reason: reason || null
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        validation: validationResult,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Admin validation error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

// Validation functions for different admin actions
async function validateRoleChange(data: any, isAdmin: boolean, supabase: any) {
  if (!isAdmin) {
    return { isValid: false, error: 'Only admins can change user roles', sanitizedData: {} };
  }

  const { target_user_id, new_role } = data;
  
  if (!target_user_id || !new_role) {
    return { isValid: false, error: 'Missing required fields: target_user_id, new_role', sanitizedData: {} };
  }

  const allowedRoles = ['admin', 'editor', 'author', 'member', 'user'];
  if (!allowedRoles.includes(new_role)) {
    return { isValid: false, error: 'Invalid role specified', sanitizedData: {} };
  }

  // Check if target user exists
  const { data: targetUser, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', target_user_id)
    .single();

  if (error || !targetUser) {
    return { isValid: false, error: 'Target user not found', sanitizedData: {} };
  }

  return {
    isValid: true,
    error: '',
    sanitizedData: { target_user_id, new_role }
  };
}

async function validateAccountSuspension(data: any, reason: string, isModerator: boolean, supabase: any) {
  if (!isModerator) {
    return { isValid: false, error: 'Insufficient permissions for account suspension', sanitizedData: {} };
  }

  const { target_user_id, suspension_type, duration_hours } = data;
  
  if (!target_user_id || !suspension_type) {
    return { isValid: false, error: 'Missing required fields', sanitizedData: {} };
  }

  if (!reason || reason.trim().length < 5) {
    return { isValid: false, error: 'Suspension reason must be at least 5 characters', sanitizedData: {} };
  }

  // Sanitize reason
  const sanitizedReason = reason.replace(/<[^>]*>/g, '').trim();
  
  const allowedTypes = ['ban', 'suspend', 'shadowban', 'mute'];
  if (!allowedTypes.includes(suspension_type)) {
    return { isValid: false, error: 'Invalid suspension type', sanitizedData: {} };
  }

  return {
    isValid: true,
    error: '',
    sanitizedData: { target_user_id, suspension_type, duration_hours, reason: sanitizedReason }
  };
}

async function validateCoinPricingUpdate(data: any, isAdmin: boolean, supabase: any) {
  if (!isAdmin) {
    return { isValid: false, error: 'Only admins can update coin pricing', sanitizedData: {} };
  }

  const { coin_amount, price_usd, currency, region } = data;
  
  if (!coin_amount || !price_usd || !currency || !region) {
    return { isValid: false, error: 'Missing required pricing fields', sanitizedData: {} };
  }

  // Validate coin amount (1-100000, integer)
  if (coin_amount < 1 || coin_amount > 100000 || !Number.isInteger(coin_amount)) {
    return { isValid: false, error: 'Coin amount must be between 1 and 100,000 (integer)', sanitizedData: {} };
  }

  // Validate price (0.01-9999.99, two decimals)
  if (price_usd < 0.01 || price_usd > 9999.99) {
    return { isValid: false, error: 'Price must be between $0.01 and $9,999.99', sanitizedData: {} };
  }

  const allowedCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
  if (!allowedCurrencies.includes(currency)) {
    return { isValid: false, error: 'Invalid currency', sanitizedData: {} };
  }

  const allowedRegions = ['global', 'us', 'eu', 'asia', 'latam'];
  if (!allowedRegions.includes(region)) {
    return { isValid: false, error: 'Invalid region', sanitizedData: {} };
  }

  return {
    isValid: true,
    error: '',
    sanitizedData: { coin_amount, price_usd: Number(price_usd.toFixed(2)), currency, region }
  };
}

async function validateChapterPublish(data: any, target_id: string, isModerator: boolean, supabase: any) {
  if (!isModerator) {
    return { isValid: false, error: 'Insufficient permissions for chapter operations', sanitizedData: {} };
  }

  if (!target_id) {
    return { isValid: false, error: 'Chapter ID is required', sanitizedData: {} };
  }

  // Check if chapter exists
  const { data: chapter, error } = await supabase
    .from('chapters')
    .select('title, series_id')
    .eq('id', target_id)
    .single();

  if (error || !chapter) {
    return { isValid: false, error: 'Chapter not found', sanitizedData: {} };
  }

  const { action } = data; // 'publish' or 'unpublish'
  
  if (!['publish', 'unpublish'].includes(action)) {
    return { isValid: false, error: 'Invalid chapter action', sanitizedData: {} };
  }

  return {
    isValid: true,
    error: '',
    sanitizedData: { chapter_id: target_id, action }
  };
}

async function validateCommentModeration(data: any, reason: string, isModerator: boolean, supabase: any) {
  if (!isModerator) {
    return { isValid: false, error: 'Insufficient permissions for comment moderation', sanitizedData: {} };
  }

  const { comment_id, moderation_action } = data;
  
  if (!comment_id || !moderation_action) {
    return { isValid: false, error: 'Missing required fields', sanitizedData: {} };
  }

  const allowedActions = ['approve', 'reject', 'delete', 'flag'];
  if (!allowedActions.includes(moderation_action)) {
    return { isValid: false, error: 'Invalid moderation action', sanitizedData: {} };
  }

  // Check if comment exists
  const { data: comment, error } = await supabase
    .from('comments')
    .select('content, user_id')
    .eq('id', comment_id)
    .single();

  if (error || !comment) {
    return { isValid: false, error: 'Comment not found', sanitizedData: {} };
  }

  // Sanitize reason if provided
  let sanitizedReason = '';
  if (reason) {
    sanitizedReason = reason.replace(/<[^>]*>/g, '').trim();
    if (sanitizedReason.length > 1000) {
      return { isValid: false, error: 'Moderation reason too long (max 1000 characters)', sanitizedData: {} };
    }
  }

  return {
    isValid: true,
    error: '',
    sanitizedData: { comment_id, moderation_action, reason: sanitizedReason }
  };
}