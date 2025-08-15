import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// no supabase needed for simple redirect

const RedirectLegacyReaderWithSeries = () => {
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const seriesParam = (params as any).seriesId || (params as any).seriesSlug;
    const chapterParam = (params as any).chapterNumber || (params as any).chapterSlug;

    if (!seriesParam || !chapterParam) {
      navigate('/', { replace: true });
      return;
    }

    // Normalize chapter parameter to a number when possible (supports chapter-001, ch-12)
    const normalizedChapter = (() => {
      const str = String(chapterParam);
      const directNum = Number(str);
      if (!Number.isNaN(directNum)) return String(directNum);
      const m = str.match(/(?:chapter-|ch-|c)(\d+)/i);
      return m ? String(parseInt(m[1], 10)) : str;
    })();

    // Directly redirect to ID/slug-based canonical route
    navigate(`/read/${seriesParam}/${normalizedChapter}`, { replace: true });
  }, [params, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default RedirectLegacyReaderWithSeries;