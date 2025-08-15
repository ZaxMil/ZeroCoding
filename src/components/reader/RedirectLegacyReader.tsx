import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { runtime } from '@/config/runtime';

const RedirectLegacyReader = () => {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectToCanonical = async () => {
      if (!chapterId) {
        navigate('/', { replace: true });
        return;
      }

      if (runtime.USE_MOCKS) {
        // In mock mode, skip DB lookup and use a safe fallback
        navigate(`/read/${chapterId}/1`, { replace: true });
        return;
      }

      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: chapterData, error: chapterError } = await supabase
          .from('chapters')
          .select('chapter_number, series_id')
          .eq('id', chapterId)
          .single();

        if (chapterError || !chapterData) {
          navigate('/', { replace: true });
          return;
        }

        // Redirect to canonical URL using series ID only
        navigate(`/read/${chapterData.series_id}/${chapterData.chapter_number}`, { replace: true });
      } catch (error) {
        console.error('Error redirecting legacy reader:', error);
        navigate('/', { replace: true });
      }
    };

    redirectToCanonical();
  }, [chapterId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default RedirectLegacyReader;