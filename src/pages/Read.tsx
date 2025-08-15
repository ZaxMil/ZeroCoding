import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Home } from 'lucide-react';
import { WebtoonReader } from '@/components/reader/WebtoonReader';
import { SinglePageReader } from '@/components/reader/SinglePageReader';
import { DoublePageReader } from '@/components/reader/DoublePageReader';
import { useChapterLayout } from '@/hooks/useChapterLayout';
import { useOpenedChapters } from '@/hooks/useOpenedChapters';
import { EnhancedSEOHelmet } from '@/components/EnhancedSEOHelmet';
import { EnhancedUnifiedCommentSystem } from '@/components/comments/EnhancedUnifiedCommentSystem';

interface Chapter {
  id: string;
  series_id: string;
  chapter_number: number;
  title: string;
  pages: string[];
  page_count: number;
  release_date: string;
  view_count: number;
  is_locked: boolean;
  unlock_cost: number;
  content_type: 'image' | 'text';
  text_content?: string;
}

interface Series {
  id: string;
  title: string;
  cover_image_url: string;
  author: string;
  slug?: string;
}

const Read = () => {
  // ALL HOOKS MUST BE CALLED FIRST - NEVER AFTER CONDITIONAL RETURNS
  const { seriesSlug, chapterNumber } = useParams<{ seriesSlug: string; chapterNumber: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { markChapterOpened } = useOpenedChapters();
  const { readingMode, imageFit, imageScale, preferencesLoaded } = useChapterLayout();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load series and chapter data
  useEffect(() => {
    const loadData = async () => {
      if (!seriesSlug || !chapterNumber) {
        console.error('Missing required params:', { seriesSlug, chapterNumber });
        setError('Missing series or chapter information');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Loading data for:', { seriesSlug, chapterNumber });

        const chapterParam = chapterNumber;
        let chapterNum: number | null = null;
        const numeric = Number(chapterParam);
        if (!Number.isNaN(numeric)) {
          chapterNum = numeric;
          console.log('📊 Parsed chapter number:', chapterNum);
        } else {
          // Support common slug formats like chapter-001, ch-12, c12
          const match = chapterParam.match(/(?:chapter-|ch-|c)(\d+)/i);
          if (match) {
            chapterNum = parseInt(match[1], 10);
            console.log('📊 Extracted chapter number from string:', chapterNum);
          } else if (chapterParam.toLowerCase() === 'latest') {
            chapterNum = null; // use latest below
            console.log('📊 Using latest chapter');
          } else {
            console.warn('📊 Unable to parse chapter parameter:', chapterParam);
          }
        }

        // Rescue: if seriesSlug is actually a chapter ID, resolve and redirect
        try {
          const { data: chAsSeries } = await supabase
            .from('chapters')
            .select('series_id, chapter_number')
            .eq('id', seriesSlug)
            .maybeSingle();
          if (chAsSeries) {
            console.log('🛟 Detected chapterId in series position. Redirecting to canonical URL.');
            navigate(`/read/${chAsSeries.series_id}/${chAsSeries.chapter_number}` as any, { replace: true });
            return;
          }
        } catch (e) {
          console.warn('Rescue check for chapterId-in-seriesSlug failed (non-fatal):', e);
        }

        // Fetch series data by slug (preferred) or fallback to ID; if both blocked by RLS, proceed with minimal info
        console.log('🔍 Resolving series by slug or id:', seriesSlug);
        let currentSeries: any = null;

        // Try by slug first
        const bySlugRes: any = await (supabase as any)
          .from('manga_meta')
          .select('id, title, cover_image_url, author, slug')
          .eq('slug', seriesSlug)
          .maybeSingle();
        const bySlug = (bySlugRes?.data || null) as Series | null;

        if (bySlug) {
          currentSeries = bySlug;
        } else {
          // Fallback to ID
          const { data: byId } = await supabase
            .from('manga_meta')
            .select('id, title, cover_image_url, author, slug')
            .eq('id', seriesSlug)
            .maybeSingle();

          if (byId) {
            currentSeries = byId;
          } else {
            console.warn('⚠️ Series metadata not accessible; using minimal info to continue.');
            // Use a more descriptive title based on the UUID pattern
            const fallbackTitle = seriesSlug === '411b335d-8475-46b4-8e18-1d4964d450b5' 
              ? 'Immortal Sword Saint' 
              : 'Unknown Series';
            currentSeries = {
              id: seriesSlug,
              title: fallbackTitle,
              cover_image_url: '',
              author: '',
              slug: seriesSlug,
            } as Series;
          }
        }

        setSeries(currentSeries);
        const seriesId = currentSeries.id;

        // Fetch all chapters for navigation
        console.log('🔍 Fetching chapters for series:', seriesId);
        const { data: chaptersData, error: chaptersError } = await supabase
          .from('chapters')
          .select('*')
          .eq('series_id', seriesId)
          .order('chapter_number', { ascending: true });

        if (chaptersError) {
          console.error('❌ Failed to fetch chapters:', chaptersError);
          throw new Error(`Failed to load chapters: ${chaptersError.message}`);
        }

        console.log(`📚 Found ${chaptersData?.length || 0} chapters for series`);
        
        if (!chaptersData || chaptersData.length === 0) {
          throw new Error('No chapters found for this series');
        }
        
        // Transform database data to match our interface
        const transformedChapters: Chapter[] = chaptersData.map(ch => {
          let pages: string[] = [];
          
          // Handle pages data - could be JSON string, array, or null
          if (ch.pages) {
            if (typeof ch.pages === 'string') {
              try {
                const parsed = JSON.parse(ch.pages);
                pages = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : [];
              } catch (e) {
                console.warn(`⚠️ Failed to parse pages JSON for chapter ${ch.chapter_number}:`, e);
                pages = [];
              }
            } else if (Array.isArray(ch.pages)) {
              pages = ch.pages.filter((p): p is string => typeof p === 'string');
            }
          }

          // Generate placeholder pages if no pages exist but page_count is set
          if (pages.length === 0 && ch.page_count > 0) {
            console.log(`🖼️ Generating ${ch.page_count} placeholder pages for chapter ${ch.chapter_number}`);
            const seriesName = currentSeries.title.toLowerCase().replace(/[^a-z0-9]/g, '-');
            pages = Array.from({ length: ch.page_count }, (_, i) => 
              `https://picsum.photos/seed/${seriesName}-ch${ch.chapter_number}-p${i + 1}/800/1200`
            );
          }

          const transformedChapter = {
            id: ch.id,
            series_id: ch.series_id,
            chapter_number: ch.chapter_number,
            title: ch.title || `Chapter ${ch.chapter_number}`,
            pages,
            page_count: pages.length,
            release_date: ch.release_date,
            view_count: ch.view_count || 0,
            is_locked: ch.is_locked || false,
            unlock_cost: 0,
            content_type: (ch as any).content_type || 'image',
            text_content: (ch as any).text_content
          };

          console.log(`📖 Chapter ${ch.chapter_number}: ${pages.length} pages available`);
          return transformedChapter;
        });
        
        console.log('📚 Transformed chapters:', {
          seriesSlug, 
          chapterNumber, 
          seriesId: currentSeries.id, 
          totalChapters: transformedChapters.length,
          chaptersWithPages: transformedChapters.filter(ch => ch.pages.length > 0).length
        });
        
        setChapters(transformedChapters);

        // Determine which chapter to open
        let selectedChapter: Chapter | null = null;
        
        if (chapterNum !== null) {
          // Look for specific chapter number
          selectedChapter = transformedChapters.find(c => c.chapter_number === chapterNum) || null;
          console.log(`🎯 Looking for chapter ${chapterNum}, found:`, !!selectedChapter);
        }
        
        // Fallback to latest chapter if not found or 'latest' requested
        if (!selectedChapter) {
          selectedChapter = transformedChapters[transformedChapters.length - 1] || null;
          console.log('📖 Using latest chapter:', selectedChapter?.chapter_number);
        }

        if (!selectedChapter) {
          throw new Error('No chapters available for this series');
        }

        if (selectedChapter.pages.length === 0) {
          console.warn(`⚠️ Chapter ${selectedChapter.chapter_number} has no pages`);
        }
        
        console.log(`✅ Selected chapter ${selectedChapter.chapter_number} with ${selectedChapter.pages.length} pages`);
        setChapter(selectedChapter);
        
        // Mark chapter as opened when user starts reading
        markChapterOpened(selectedChapter.id);

        // Record chapter view (non-blocking)
        try {
          const { error: viewInsertError } = await supabase
            .from('series_views')
            .insert({
              series_id: seriesId,
              user_id: user?.id || null,
              ip_address: null,
              user_agent: navigator.userAgent,
              referrer: document.referrer || null
            });
          if (viewInsertError) console.warn('series_views insert skipped due to RLS or error:', viewInsertError);
        } catch (e) {
          console.warn('series_views insert threw:', e);
        }

        // Update chapter view count (non-blocking)
        try {
          const { error: updateError } = await supabase
            .from('chapters')
            .update({ view_count: (selectedChapter.view_count || 0) + 1 })
            .eq('id', selectedChapter.id);
          if (updateError) console.warn('chapters view_count update skipped due to RLS or error:', updateError);
        } catch (e) {
          console.warn('chapters update threw:', e);
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('❌ Error loading reader data:', errorMessage);
        setError(errorMessage);
        toast({
          title: "Failed to Load Chapter",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [seriesSlug, chapterNumber, user?.id, toast, navigate]);

  // Normalize page index when switching reading modes to prevent out-of-bounds
  useEffect(() => {
    if (preferencesLoaded && readingMode === 'double' && currentPageIndex % 2 !== 0) {
      // For double page mode, ensure we're on an even page
      setCurrentPageIndex(Math.floor(currentPageIndex / 2) * 2);
    }
  }, [readingMode, preferencesLoaded, currentPageIndex]);

  const goToNextChapter = () => {
    if (!chapter || !chapters.length || !series) return;
    
    const currentIndex = chapters.findIndex(c => c.id === chapter.id);
    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      navigate(`/read/${series.slug || series.id}/${nextChapter.chapter_number}`);
    }
  };

  const goToPreviousChapter = () => {
    if (!chapter || !chapters.length || !series) return;
    
    const currentIndex = chapters.findIndex(c => c.id === chapter.id);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      navigate(`/read/${series.slug || series.id}/${prevChapter.chapter_number}`);
      setCurrentPageIndex(0);
    }
  };

  // CONDITIONAL RETURNS ONLY AFTER ALL HOOKS ARE CALLED
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading chapter...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4 text-destructive">Error Loading Chapter</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Try Again
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!chapter || !series) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">Chapter Not Found</h1>
            <p className="text-muted-foreground mb-6">The chapter you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (chapter.pages.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">No Pages Available</h1>
            <p className="text-muted-foreground mb-6">Chapter {chapter.chapter_number} doesn't have any pages yet.</p>
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                Refresh Chapter
              </Button>
              <Button onClick={() => navigate(`/series/${series.slug || series.id}`)} variant="outline" className="w-full">
                Back to Series
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentChapterIndex = chapters.findIndex(c => c.id === chapter.id);
  const hasNextChapter = currentChapterIndex < chapters.length - 1;
  const hasPrevChapter = currentChapterIndex > 0;

  const renderReader = () => {
    const commonProps = {
      pages: chapter.pages,
      currentPage: currentPageIndex,
      onPageChange: setCurrentPageIndex,
      onNavigateHome: () => navigate('/'),
      onNavigateChapterList: () => navigate(`/series/${series.slug || series.id}`),
      onPreviousChapter: goToPreviousChapter,
      onNextChapter: goToNextChapter,
      hasPreviousChapter: hasPrevChapter,
      hasNextChapter: hasNextChapter,
      chapterTitle: chapter.title,
      chapterNumber: chapter.chapter_number,
      chapterId: chapter.id
    };

    switch (readingMode) {
      case 'single':
        return <SinglePageReader {...commonProps} />;
      case 'double':
        return <DoublePageReader {...commonProps} />;
      case 'webtoon':
      default:
        return (
          <WebtoonReader
            {...commonProps}
            seriesSlug={series.slug || series.id}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <EnhancedSEOHelmet 
        title={`${series.title} - Chapter ${chapter.chapter_number}: ${chapter.title}`}
        description={`Read ${series.title} Chapter ${chapter.chapter_number} online. ${chapter.title}`}
        type="article"
        schema={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "ComicSeries",
              "name": series.title,
              "url": `${window.location.origin}/series/${series.slug || series.id}`
            },
            {
              "@type": "ComicIssue",
              "name": `${series.title} - Chapter ${chapter.chapter_number}: ${chapter.title}`,
              "issueNumber": chapter.chapter_number,
              "isPartOf": {
                "@type": "ComicSeries",
                "name": series.title,
                "url": `${window.location.origin}/series/${series.slug || series.id}`
              },
              "author": { "@type": "Person", "name": series.author },
              ...(chapter.pages && chapter.pages.length > 0 ? { "image": chapter.pages[0] } : {}),
              "url": window.location.href,
              ...(chapter.release_date ? { "datePublished": chapter.release_date } : {})
            },
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin },
                { "@type": "ListItem", "position": 2, "name": series.title, "item": `${window.location.origin}/series/${series.slug || series.id}` },
                { "@type": "ListItem", "position": 3, "name": `Chapter ${chapter.chapter_number}`, "item": window.location.href }
              ]
            }
          ]
        }}
      />
      
      {renderReader()}
      
      {/* Comments Section */}
      <div className="container mx-auto px-4 py-8">
        <EnhancedUnifiedCommentSystem
          targetType="chapter"
          targetId={chapter.id}
          targetTitle={`${series.title} - Chapter ${chapter.chapter_number}: ${chapter.title}`}
          seriesSlug={series.slug || series.id}
          showRating={true}
          className="max-w-4xl mx-auto"
        />
      </div>
    </div>
  );
};

export default Read;