// Content Moderation Edge Function
// Handles bulk moderation operations with enhanced security

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ModerationRequest {
  action: 'bulk_delete' | 'bulk_ban' | 'bulk_approve' | 'bulk_reject'
  target_ids: string[]
  target_type: 'comment' | 'chapter' | 'series' | 'user'
  reason?: string
  duration_hours?: number
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
    const { action, target_ids, target_type, reason, duration_hours }: ModerationRequest = await req.json();

    console.log(`Content moderation request: ${action} on ${target_ids.length} ${target_type}(s) by user ${user.id}`);

    // Verify user permissions
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

    // Validate bulk operation limits
    if (target_ids.length > 100) {
      throw new Error('Bulk operation limited to 100 items maximum');
    }

    if (target_ids.length === 0) {
      throw new Error('No items selected for bulk operation');
    }

    // Role-based restrictions
    if (action.includes('delete') && !isAdmin) {
      throw new Error('Only admins can perform bulk delete operations');
    }

    if (action.includes('ban') && !isModerator) {
      throw new Error('Insufficient permissions for bulk ban operations');
    }

    // Validate and sanitize reason
    let sanitizedReason = '';
    if (reason) {
      sanitizedReason = reason.replace(/<[^>]*>/g, '').trim();
      if (sanitizedReason.length < 5) {
        throw new Error('Moderation reason must be at least 5 characters');
      }
      if (sanitizedReason.length > 1000) {
        throw new Error('Moderation reason too long (max 1000 characters)');
      }
    }

    let results = [];

    // Process each target based on type and action
    for (const targetId of target_ids) {
      try {
        let result = { id: targetId, success: false, error: '' };

        switch (target_type) {
          case 'comment':
            result = await processCommentModeration(targetId, action, sanitizedReason, supabase);
            break;
          
          case 'chapter':
            result = await processChapterModeration(targetId, action, sanitizedReason, supabase);
            break;
          
          case 'series':
            result = await processSeriesModeration(targetId, action, sanitizedReason, supabase);
            break;
          
          case 'user':
            result = await processUserModeration(targetId, action, sanitizedReason, duration_hours, supabase);
            break;
        }

        results.push(result);

        // Log admin action for each item
        await supabase.from('admin_actions').insert({
          action_type: `${action}_${target_type}`,
          admin_user_id: user.id,
          target_type: target_type,
          target_id: targetId,
          description: `${action} ${target_type}`,
          metadata: {
            bulk_operation: true,
            reason: sanitizedReason || null,
            result: result.success
          }
        });

      } catch (error) {
        console.error(`Error processing ${targetId}:`, error);
        results.push({ id: targetId, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          total: target_ids.length,
          successful: successCount,
          failed: failureCount
        },
        results: results,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Content moderation error:', error);
    
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

// Processing functions for different content types
async function processCommentModeration(commentId: string, action: string, reason: string, supabase: any) {
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('*')
    .eq('id', commentId)
    .single();

  if (fetchError || !comment) {
    return { id: commentId, success: false, error: 'Comment not found' };
  }

  let updateData: any = {};

  switch (action) {
    case 'bulk_delete':
      const { error: deleteError } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (deleteError) {
        return { id: commentId, success: false, error: deleteError.message };
      }
      break;

    case 'bulk_approve':
      updateData = { is_flagged: false, status: 'active' };
      break;

    case 'bulk_reject':
      updateData = { status: 'rejected', moderation_reason: reason };
      break;
  }

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', commentId);
    
    if (updateError) {
      return { id: commentId, success: false, error: updateError.message };
    }
  }

  return { id: commentId, success: true, error: '' };
}

async function processChapterModeration(chapterId: string, action: string, reason: string, supabase: any) {
  // Placeholder for chapter moderation logic
  return { id: chapterId, success: true, error: '' };
}

async function processSeriesModeration(seriesId: string, action: string, reason: string, supabase: any) {
  // Placeholder for series moderation logic
  return { id: seriesId, success: true, error: '' };
}

async function processUserModeration(userId: string, action: string, reason: string, durationHours: number, supabase: any) {
  if (action === 'bulk_ban') {
    const expiresAt = durationHours ? new Date(Date.now() + durationHours * 60 * 60 * 1000) : null;
    
    const { error } = await supabase
      .from('user_moderation')
      .insert({
        user_id: userId,
        moderation_type: 'ban',
        reason: reason,
        expires_at: expiresAt,
        is_active: true,
        applied_by: (await supabase.auth.getUser()).data.user?.id
      });
    
    if (error) {
      return { id: userId, success: false, error: error.message };
    }
  }

  return { id: userId, success: true, error: '' };
}