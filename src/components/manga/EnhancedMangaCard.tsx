import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Lock, Eye, Clock, Sparkles } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LazyImage from '@/components/LazyImage';
import { getOptimizedImageUrl, getFallbackCoverImage } from '@/utils/imageOptimization';
import { formatTimeAgo } from '@/utils/dateFormatting';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import ChapterAccessHandler from '@/components/ChapterAccessHandler';
import { useOpenedChapters } from '@/hooks/useOpenedChapters';
import { ChapterLockIcon } from '@/components/chapter/ChapterLockIcon';
import { ChapterTimestampBadge } from '@/components/chapter/ChapterTimestampBadge';
import { ChapterIcon } from '@/components/chapter/ChapterIcon';
interface ChapterInfo {
  id: string;
  chapter_number: number;
  title: string;
  created_at: string;
  is_locked: boolean;
}
interface SeriesData {
  id: string;
  title: string;
  author?: string;
  artist?: string;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  genres?: string[];
  description?: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  view_count?: number;
  rating_average?: number;
  rating_count?: number;
  content_type?: 'manga' | 'novel';
}
interface EnhancedMangaCardProps {
  series: SeriesData;
  showMetadata?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  variant?: 'default' | 'directory';
}
export const EnhancedMangaCard = ({
  series,
  showMetadata = true,
  size = 'medium',
  className = '',
  variant = 'default'
}: EnhancedMangaCardProps) => {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<ChapterInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const { isChapterOpened, markChapterOpened, getOpenedStatus } = useOpenedChapters();
  const isNew = new Date(series.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  // Size configurations
  const sizeConfig = {
    small: {
      aspect: 'aspect-[2/3]',
      textSize: 'text-xs',
      titleSize: 'text-xs sm:text-sm',
      padding: 'p-2',
      imageSize: {
        width: 200,
        height: 300
      }
    },
    medium: {
      aspect: 'aspect-[3/4]',
      textSize: 'text-xs sm:text-sm',
      titleSize: 'text-sm sm:text-base',
      padding: 'p-2 sm:p-3',
      imageSize: {
        width: 300,
        height: 400
      }
    },
    large: {
      aspect: 'aspect-[3/4]',
      textSize: 'text-base',
      titleSize: 'text-lg',
      padding: 'p-4',
      imageSize: {
        width: 400,
        height: 533
      }
    }
  };
  const config = sizeConfig[size];
  useEffect(() => {
    const fetchChapters = async () => {
      try {
        // First try RPC that should include locked chapters for public display
        const daysBack = 365;
        const limit = 500;
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_latest_chapters_feed_all', {
          days_back: daysBack,
          limit_count: limit,
        });

        if (!rpcError && Array.isArray(rpcData)) {
          const forSeries = rpcData
            .filter((i: any) => i.series_id === series.id)
            .sort((a: any, b: any) => (b.chapter_number ?? 0) - (a.chapter_number ?? 0))
            .slice(0, 2)
            .map((item: any) => ({
              id: item.chapter_id,
              chapter_number: item.chapter_number,
              title: item.chapter_title || `Chapter ${item.chapter_number}`,
              created_at: item.created_at,
              is_locked: !!item.is_locked,
            }));

          if (forSeries.length > 0) {
            setChapters(forSeries as ChapterInfo[]);
            return;
          }
        }

        // Fallback: direct select (may be limited by RLS for anon)
        const { data, error } = await supabase
          .from('chapters')
          .select('id, chapter_number, title, created_at, is_locked')
          .eq('series_id', series.id)
          .order('chapter_number', { ascending: false })
          .limit(2);

        if (error) {
          console.error('Error fetching chapters:', error);
          setChapters([]);
        } else {
          setChapters((data || []) as ChapterInfo[]);
        }
      } catch (err) {
        console.error('Error fetching chapters:', err);
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };
    fetchChapters();
  }, [series.id]);
  const optimizedCoverUrl = getOptimizedImageUrl(series.cover_image_url || getFallbackCoverImage(series.id), config.imageSize.width, config.imageSize.height);
  return <Card className={`group overflow-hidden transition-all duration-300 hover:-translate-y-1 ${variant === 'directory' ? 'animate-fade-in hover-scale bg-card/80 backdrop-blur-sm border border-border/60 hover:border-primary/40 hover:ring-2 hover:ring-primary/20 hover:shadow-xl' : 'bg-card/95 backdrop-blur-sm hover:bg-card hover:shadow-lg border border-border/50 hover:border-primary/30'} ${className}`}>
      <Link to={`/series/${series.id}`} className="block h-full">
        {/* Cover Image with consistent aspect ratio */}
        <div className={`relative ${config.aspect} overflow-hidden bg-muted`}>
          <LazyImage src={optimizedCoverUrl} alt={series.title} className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" fill width={config.imageSize.width} height={config.imageSize.height} sizes={size === 'small' ? '(max-width: 640px) 50vw, 25vw' : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw'} />
          
          {/* NEW indicator */}
          {isNew && <div className="absolute top-2 left-2">
              
            </div>}
          
          {/* Content Type Badge */}
          <div className="absolute top-2 right-2">
            <Badge className={`text-xs font-bold uppercase tracking-wider px-2 py-1 shadow-lg ${series.genres?.includes('Novel') ? 'bg-purple-500/90 text-white' : series.genres?.includes('Manhua') ? 'bg-red-500/90 text-white' : series.genres?.includes('Manhwa') ? 'bg-blue-500/90 text-white' : 'bg-orange-500/90 text-white'}`}>
              {series.genres?.includes('Novel') ? 'NOVEL' : series.genres?.includes('Manhua') ? 'MANHUA' : series.genres?.includes('Manhwa') ? 'MANHWA' : 'MANGA'}
            </Badge>
          </div>
          
          {/* Rating badge */}
          {series.rating_average && <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{series.rating_average.toFixed(1)}</span>
            </div>}
          
          {/* Status indicator */}
          <div className="absolute bottom-2 left-2">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${series.status === 'ongoing' ? 'bg-green-500' : series.status === 'completed' ? 'bg-blue-500' : series.status === 'hiatus' ? 'bg-orange-500' : 'bg-red-500'}`} />
              <span className="text-xs font-medium text-white bg-black/60 px-1 py-0.5 rounded">
                {series.status === 'ongoing' ? 'Ongoing' : series.status === 'completed' ? 'Complete' : series.status === 'hiatus' ? 'Hiatus' : 'Dropped'}
              </span>
            </div>
          </div>

          {/* Hover overlay CTA for directory cards */}
          {variant === 'directory' && (
            <>
              <div className="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow">
                  View Series
                </span>
              </div>
            </>
          )}
        </div>

        {/* Content below image */}
        <CardContent className={`${config.padding} space-y-1 sm:space-y-2 min-h-[80px] sm:min-h-[100px] flex flex-col`}>
          {/* Title */}
          <h3
            className={`font-bold ${config.titleSize} group-hover:text-primary transition-colors duration-300`}
            style={{
              height: '2.5rem',
              lineHeight: '1.25rem',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
            title={series.title}
            aria-label={series.title}
          >
            {series.title}
          </h3>
          {variant === 'directory' && Array.isArray(series.genres) && series.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {series.genres.slice(0, 2).map((g) => (
                <Badge key={g} variant="secondary" className="text-[10px]">
                  {g}
                </Badge>
              ))}
            </div>
          )}
          
          {showMetadata && <>
              {/* Latest chapters */}
              <div className="flex-1">
                {loading ? <div className="animate-pulse space-y-1">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-6 bg-muted rounded" />
                    <div className="h-6 bg-muted rounded" />
                  </div> : <div className="space-y-1">
                     {(() => {
                console.log(`EnhancedMangaCard - Series ${series.id} (${series.title}): chapters found=${chapters.length}`);
                // If no real chapters, show fake locked ones to entice users
                const chaptersToShow = chapters.length > 0 ? chapters : [{
                  id: `${series.id}-fake-3`,
                  chapter_number: 3,
                  is_locked: true,
                  created_at: new Date().toISOString()
                }, {
                  id: `${series.id}-fake-2`,
                  chapter_number: 2,
                  is_locked: true,
                  created_at: new Date().toISOString()
                }];
                return chaptersToShow.map((chapter, index) => <ChapterAccessHandler key={chapter.id} chapterId={chapter.id} chapterTitle={`Chapter ${chapter.chapter_number}`} isLocked={chapter.is_locked} onAccess={() => {
                  // Mark chapter as opened when accessed
                  markChapterOpened(chapter.id, series.id);
                  const chapterSlug = `chapter-${chapter.chapter_number.toString().padStart(3, '0')}`;
                  navigate(`/read/${series.id}/${chapterSlug}`);
                }}>
                            <div className={`w-full px-1.5 sm:px-2 py-1 rounded ${config.textSize} font-semibold transition-all hover:scale-105 cursor-pointer bg-gray-600/90 text-white hover:bg-gray-500/90`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                   <span>CH. {chapter.chapter_number}</span>
                                 </div>
                                 <div className="flex items-center gap-1 text-xs opacity-80">
                                    {/* Use new ChapterIcon component */}
                                    <ChapterIcon 
                                      chapterId={chapter.id}
                                      isLocked={chapter.is_locked}
                                      createdAt={chapter.created_at}
                                      seriesId={series.id}
                                    />
                                    <span>{formatTimeAgo(chapter.created_at)}</span>
                                </div>
                              </div>
                            </div>
                          </ChapterAccessHandler>);
              })()}
                  </div>}
              </div>
            </>}
        </CardContent>
      </Link>
    </Card>;
};