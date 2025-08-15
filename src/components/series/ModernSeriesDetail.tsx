import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EnhancedUnifiedCommentSystem } from '@/components/comments/EnhancedUnifiedCommentSystem';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Star, Eye, BookOpen, Heart, Share2 } from 'lucide-react';
import LazyImage from '@/components/LazyImage';
import ModernChapterGrid from './ModernChapterGrid';
// Lazy-load pagination component
const SeriesChaptersPaginated = React.lazy(() => import('./SeriesChaptersPaginated'));

import { getOptimizedImageUrl, getFallbackCoverImage } from '@/utils/imageOptimization';
import SchemaLD from '@/components/SchemaLD';
import { useSeriesChapterListMode } from '@/hooks/useSeriesChapterListMode';
import NextUpCTA from '@/components/series/NextUpCTA';


interface MangaSeries {
  id: string;
  title: string;
  description: string;
  author: string;
  artist: string;
  cover_image_url: string;
  status: string;
  genres: string[];
  tags: string[];
  rating_average: number;
  rating_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  age_rating: string;
  publication_date: string;
  slug?: string;
}
interface Chapter {
  id: string;
  title: string;
  chapter_number: number;
  page_count: number;
  release_date: string;
  view_count: number;
  is_locked: boolean;
  unlock_cost: number;
  thumbnail_url: string;
}
const ModernSeriesDetail = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [series, setSeries] = useState<MangaSeries | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { mode: listMode } = useSeriesChapterListMode();
  useEffect(() => {
    if (id) {
      fetchSeriesData(listMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, listMode]);
  const fetchSeriesData = async (currentMode: 'infinite'|'pagination') => {
    if (!id) return;
    try {
      setLoading(true);

      // Fetch series data
      const {
        data: seriesData,
        error: seriesError
      } = await supabase.from('manga_meta').select('*').eq('id', id).single();
      if (seriesError) throw seriesError;

      // Increment view count
      if (seriesData) {
        await supabase.from('manga_meta').update({
          view_count: (seriesData.view_count || 0) + 1
        }).eq('id', id);
      }

      let chaptersWithCost: any[] = [];
      if (currentMode === 'infinite') {
        // Fetch chapters using RPC to include locked rows for guests
        const { data: chaptersData, error: chaptersError } = await supabase
          .rpc('get_series_chapter_listings', { series_id_param: id });
        if (chaptersError) throw chaptersError;
        chaptersWithCost = chaptersData || [];
      }

      // Check if user has bookmarked this series
      if (user) {
        const { data: bookmarkData } = await supabase.from('bookmarks').select('id').eq('user_id', user.id).limit(1).single();
        setIsBookmarked(!!bookmarkData);
      }
      setSeries(seriesData);
      if (currentMode === 'infinite') setChapters(chaptersWithCost || []);
    } catch (error) {
      console.error('Error fetching series data:', error);
      toast({
        title: "Error",
        description: "Failed to load series data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const toggleBookmark = async () => {
    if (!user) return;
    try {
      if (isBookmarked) {
        const {
          error
        } = await supabase.from('bookmarks').delete().eq('user_id', user.id);
        if (error) throw error;
        setIsBookmarked(false);
        toast({
          title: "Success",
          description: "Removed from bookmarks"
        });
      } else {
        const {
          error
        } = await supabase.from('bookmarks').insert({
          user_id: user.id,
          chapter_id: chapters[0]?.id || '',
          page_number: 1,
          note: `Bookmarked ${series?.title}`
        });
        if (error) throw error;
        setIsBookmarked(true);
        toast({
          title: "Success",
          description: "Added to bookmarks"
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive"
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            {/* Loading Hero */}
            <div className="h-96 bg-gradient-to-r from-muted/50 to-muted/20 rounded-3xl"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-gradient-to-br from-muted/40 to-muted/10 rounded-2xl"></div>)}
            </div>
          </div>
        </div>
      </div>;
  }
  if (!series) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center bg-gradient-to-br from-card/60 to-card/20 backdrop-blur-xl border border-border/20 rounded-3xl p-16">
            <div className="text-8xl mb-6">🔍</div>
            <h1 className="text-4xl font-bold mb-4">Series not found</h1>
            <p className="text-muted-foreground text-lg">The series you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </div>;
  }
  const origin = window.location.origin;
  const seriesSlugOrId = series.slug || id;
  const seriesUrl = `${origin}/series/${seriesSlugOrId}`;
  const chapterItems = chapters.map((ch, idx) => ({
    "@type": "ListItem",
    "position": idx + 1,
    "name": `Chapter ${ch.chapter_number}${ch.title ? `: ${ch.title}` : ''}`,
    "url": `${origin}/read/${seriesSlugOrId}/${ch.chapter_number}`,
    ...(ch.thumbnail_url ? { image: ch.thumbnail_url } : {}),
    ...(ch.release_date ? { datePublished: ch.release_date } : {})
  }));
  return (
    <>
      <SchemaLD data={[
        {
          "@type": "ComicSeries",
          "name": series.title,
          "url": seriesUrl,
          "description": series.description,
          "image": getOptimizedImageUrl(series.cover_image_url || getFallbackCoverImage(series.id), 400, 600),
          ...(series.author ? { "author": { "@type": "Person", "name": series.author } } : {}),
          ...(series.artist ? { "illustrator": { "@type": "Person", "name": series.artist } } : {}),
          ...(series.genres?.length ? { "genre": series.genres } : {}),
          ...(series.tags?.length ? { "keywords": series.tags.join(', ') } : {}),
          "hasPart": { "@type": "ItemList", "itemListElement": chapterItems }
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": origin },
            { "@type": "ListItem", "position": 2, "name": "Browse", "item": `${origin}/browse` },
            { "@type": "ListItem", "position": 3, "name": series.title, "item": seriesUrl }
          ]
        }
      ]} />
      <div className="min-h-screen bg-background">
      {/* Redesigned Attractive Hero */}
      <div className="relative bg-gradient-to-br from-primary/20 via-background to-secondary/20 border-b border-border/10">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%), radial-gradient(circle at 75% 75%, hsl(var(--secondary)) 0%, transparent 50%)`
        }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Enhanced Cover Section */}
            <div className="lg:col-span-3">
              <div className="relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-secondary/30 rounded-3xl blur-2xl opacity-60 group-hover:opacity-100 transition-all duration-500" />
                
                <div className="relative">
                  <LazyImage src={getOptimizedImageUrl(series.cover_image_url || getFallbackCoverImage(series.id), 400, 600)} alt={series.title} className="w-full aspect-[3/4] object-cover rounded-2xl shadow-2xl border border-border/20 transform group-hover:scale-105 transition-transform duration-300" />
                  
                  {/* Floating Status Badge */}
                  <div className="absolute -top-3 -right-3">
                    <div className={`px-4 py-2 rounded-xl shadow-lg backdrop-blur-sm border border-white/20 text-white font-semibold text-sm ${series.status === 'ongoing' ? 'bg-gradient-to-r from-emerald-500 to-green-600' : series.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-cyan-600' : 'bg-gradient-to-r from-orange-500 to-amber-600'}`}>
                      {series.status.charAt(0).toUpperCase() + series.status.slice(1)}
                    </div>
                  </div>
                  
                  {/* Age Rating Badge */}
                  <div className="absolute bottom-3 left-3">
                    <div className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded-lg">
                      {series.age_rating}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons under cover */}
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button onClick={toggleBookmark} size="lg" disabled={!user} className={`w-full gap-3 h-12 text-base font-semibold rounded-xl shadow-lg transition-all duration-300 ${isBookmarked ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:shadow-red-500/25' : 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 hover:shadow-xl hover:shadow-primary/25'}`}>
                  <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  {isBookmarked ? 'Remove from Library' : 'Add to Library'}
                </Button>
                
                
              </div>
            </div>

            {/* Enhanced Info Section */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Title Section */}
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-black bg-gradient-to-r from-foreground via-primary to-secondary bg-clip-text text-transparent leading-tight">
                  {series.title}
                </h1>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-lg font-semibold text-muted-foreground">
                      By <span className="text-foreground">{series.author}</span>
                    </span>
                  </div>
                  
                  {series.artist && series.artist !== series.author && <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                      <span className="text-lg font-semibold text-muted-foreground">
                        Art by <span className="text-foreground">{series.artist}</span>
                      </span>
                    </div>}
                </div>
                
                {/* Genre Tags */}
                <div className="flex flex-wrap gap-3">
                  {series.genres?.slice(0, 4).map((genre, index) => (
                    <Link key={index} to={`/browse?genre=${encodeURIComponent(genre)}`}>
                      <span className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 text-primary font-medium rounded-full hover:from-primary/20 hover:to-primary/10 transition-all duration-300 cursor-pointer">
                        {genre}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:from-card/90 hover:to-card/50 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{series.rating_average?.toFixed(1) || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:from-card/90 hover:to-card/50 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{(series.view_count || 0).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:from-card/90 hover:to-card/50 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <BookOpen className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{chapters.length}</div>
                      <div className="text-xs text-muted-foreground">Chapters</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-border/20 rounded-xl p-4 hover:from-card/90 hover:to-card/50 transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Heart className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold">{series.rating_count || 0}</div>
                      <div className="text-xs text-muted-foreground">Reviews</div>
                    </div>
                  </div>
                </div>
              </div>

              
              {/* Description */}
              {series.description && <div className="bg-gradient-to-r from-card/60 to-card/30 backdrop-blur-xl border border-border/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-primary to-secondary rounded-full" />
                    Synopsis
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {series.description}
                  </p>
                </div>}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <NextUpCTA seriesId={id!} />
      </div>
      {/* Content Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="chapters" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
            <TabsTrigger value="chapters" className="text-sm">
              {listMode === 'pagination' ? 'Chapters' : `Chapters (${chapters.length})`}
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-sm">
              Comments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chapters" className="mt-0">
            {listMode === 'pagination' ? (
              <React.Suspense fallback={<div className="py-6" aria-busy="true" aria-live="polite">Loading chapters…</div>}>
                <SeriesChaptersPaginated seriesId={id!} seriesSlug={series?.slug || id} />
              </React.Suspense>
            ) : (
              <ModernChapterGrid chapters={chapters} seriesSlug={series?.slug || id} />
            )}
          </TabsContent>

          <TabsContent value="comments" className="mt-0">
            <div className="bg-card/50 border border-border/20 rounded-lg p-6">
              <EnhancedUnifiedCommentSystem 
                targetType="series"
                targetId={id!}
                targetTitle={series.title}
                showRating={false}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </>
  );
};
export default ModernSeriesDetail;