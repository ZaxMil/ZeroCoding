
import { supabase } from '@/integrations/supabase/client';

export interface AccessResult {
  hasAccess: boolean;
  reason?: string;
}

export async function hasPremiumAccess(
  userId: string | null,
  seriesSlug: string, // Note: treated as series_id (UUID)
  chapterNumber: number
): Promise<AccessResult> {
  if (!userId) {
    return { hasAccess: false, reason: 'Not authenticated' };
  }

  try {
    // 1) Find the chapter by series_id and chapter_number
    const { data: chapter, error: chapterError } = await supabase
      .from('chapters')
      .select('id, is_locked')
      .eq('series_id', seriesSlug)
      .eq('chapter_number', chapterNumber)
      .maybeSingle();

    if (chapterError || !chapter) {
      console.error('Chapter lookup failed:', chapterError);
      return { hasAccess: false, reason: 'Chapter not found' };
    }

    // 2) Ask the backend to decide access using existing business logic
    const { data: hasAccess, error: accessError } = await supabase.rpc(
      'user_has_chapter_access',
      {
        chapter_id_param: chapter.id,
        user_id_param: userId,
      }
    );

    if (accessError) {
      console.error('Access RPC failed, falling back to visibility:', accessError);
      // Fallback: if chapter is unlocked, allow; otherwise deny
      return chapter.is_locked
        ? { hasAccess: false, reason: 'Premium chapter requires purchase' }
        : { hasAccess: true };
    }

    return {
      hasAccess: !!hasAccess,
      reason: hasAccess ? undefined : 'Premium chapter requires purchase',
    };
  } catch (error) {
    console.error('Access check error:', error);
    return { hasAccess: false, reason: 'Access check failed' };
  }
}

export async function getSignedImageUrl(
  imagePath: string,
  ttlSeconds: number = 300
): Promise<string | null> {
  try {
    // Use the correct bucket name from storage ("chapter-pages")
    const { data, error } = await supabase.storage
      .from('chapter-pages')
      .createSignedUrl(imagePath, ttlSeconds);

    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error('Signed URL creation error:', error);
    return null;
  }
}
