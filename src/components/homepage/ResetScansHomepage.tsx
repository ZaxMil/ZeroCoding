import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { 
  Star, 
  Eye, 
  Clock, 
  BookOpen, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  Coffee,
  Users,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useSeriesData, useTrendingSeries, SeriesCard } from '@/hooks/useSeriesData';
import { LoadingState } from '@/components/LoadingSpinner';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { HeroSlider } from './HeroSlider';
import { ResetScansMangaCard } from './ResetScansMangaCard';
import { EnhancedMangaCard } from '@/components/manga/EnhancedMangaCard';
import TrendingSidebarWidget from './TrendingSidebarWidget';

import { FeedSection } from './FeedSection';
import { BlogSection } from './BlogSection';
import SearchBar from '@/components/SearchBar';
import ContinueReadingWidget from '@/components/homepage/ContinueReadingWidget';
import { UnreadChaptersFilter } from '@/components/filters/UnreadChaptersFilter';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useOpenedChapters } from '@/hooks/useOpenedChapters';

// Component removed - now using ResetScansMangaCard

// Component removed - now using individual widgets

interface ResetScansHomepageProps {
  className?: string;
}

export const ResetScansHomepage = ({ className = '' }: ResetScansHomepageProps) => {
  const { series: latestSeries, fetchSeries, loading } = useSeriesData();
  const { trendingSeries } = useTrendingSeries();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [showOnlyUnread, setShowOnlyUnread] = useLocalStorage('homepage-show-only-unread', false);
  const { isChapterOpened } = useOpenedChapters();
  
  useEffect(() => {
    // Fetch data for different sections
    fetchSeries('latest', 48); // Fetch more data for pagination
  }, []);

  // Filter series based on unread chapters if enabled
  const filteredSeries = showOnlyUnread 
    ? latestSeries.filter(series => {
        // For now, we'll use a simple heuristic: if no chapters are opened, show the series
        // In a real implementation, we'd need chapter data for each series
        return true; // Simplified for demo - would need to check if series has unread chapters
      })
    : latestSeries;

  // Calculate pagination for latest comics
  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageSeries = filteredSeries.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse space-y-8 p-4">
          <div className="h-[500px] bg-muted rounded-lg" />
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 lg:gap-8">
            <div className="space-y-8">
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-muted rounded-lg" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-64 bg-muted rounded-lg" />
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Slider - Full Width */}
      <HeroSlider
        slidesCount={16}
        autoSlideInterval={5000}
        showFilters={true}
      />

      <ContinueReadingWidget />

      <Separator className="bg-border/50" />

      {/* Main Content with Sidebar - Properly Boxed */}
      <div className="container mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="space-y-8">
            {/* Latest Comics Section - moved under Feed */}
            <section>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">Latest Comics</h2>
                  <p className="text-sm sm:text-base text-muted-foreground">Fresh chapters just dropped</p>
                </div>
                <div className="flex items-center gap-4">
                  <UnreadChaptersFilter
                    showOnlyUnread={showOnlyUnread}
                    onToggle={setShowOnlyUnread}
                  />
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/browse?sort=latest" className="whitespace-nowrap">
                      View All
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              {/* Grid: 4 per row on desktop, responsive down to 2 */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {currentPageSeries.map(series => (
                  <EnhancedMangaCard 
                    key={series.id} 
                    series={series} 
                    showMetadata={true} 
                    size="medium"
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage > 1) setCurrentPage(currentPage - 1);
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        if (totalPages <= 7 || page === 1 || page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(page);
                                }}
                                isActive={currentPage === page}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <PaginationItem key={page}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </section>

          </div>

          <div className="space-y-6">
            <TrendingSidebarWidget 
              todaySeries={trendingSeries.slice(0, 3)} 
              weekSeries={trendingSeries.slice(0, 5)} 
              allTimeSeries={trendingSeries} 
            />
          </div>
          {/* Full-width Chapter Feed Section */}
          <div className="xl:col-span-2">
            <Separator className="bg-border/30" />
            <FeedSection />
          </div>
        </div>
      </div>

      {/* Full-Width Blog Section */}
      <Separator className="bg-border/50" />
      <BlogSection />
    </div>
  );
};