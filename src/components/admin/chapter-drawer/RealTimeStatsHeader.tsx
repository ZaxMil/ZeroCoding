import { useState, useEffect } from 'react';
import { TrendingUp, Eye, DollarSign, Users, Star } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

interface RealTimeStatsHeaderProps {
  seriesId: string;
  chapters: Array<{
    id: string;
    views: number;
    sales: number;
    coin_cost: number | null;
  }>;
}

interface StatsData {
  totalChapters: number;
  totalViews: number;
  totalSales: number;
  avgPrice: number;
  topChapter: {
    id: string;
    title: string;
    views: number;
    sales: number;
  } | null;
  avgViewsPerChapter: number;
  avgSalesPerChapter: number;
}

export const RealTimeStatsHeader = ({ seriesId, chapters }: RealTimeStatsHeaderProps) => {
  const [stats, setStats] = useState<StatsData>({
    totalChapters: 0,
    totalViews: 0,
    totalSales: 0,
    avgPrice: 0,
    topChapter: null,
    avgViewsPerChapter: 0,
    avgSalesPerChapter: 0
  });

  const calculateStats = async () => {
    try {
      const totalChapters = chapters.length;
      const totalViews = chapters.reduce((sum, ch) => sum + ch.views, 0);
      const totalSales = chapters.reduce((sum, ch) => sum + ch.sales, 0);
      
      const paidChapters = chapters.filter(ch => ch.coin_cost && ch.coin_cost > 0);
      const avgPrice = paidChapters.length > 0 
        ? paidChapters.reduce((sum, ch) => sum + (ch.coin_cost || 0), 0) / paidChapters.length 
        : 0;

      const avgViewsPerChapter = totalChapters > 0 ? totalViews / totalChapters : 0;
      const avgSalesPerChapter = totalChapters > 0 ? totalSales / totalChapters : 0;

      // Find top performing chapter
      let topChapter = null;
      if (chapters.length > 0) {
        const sortedByPerformance = [...chapters].sort((a, b) => 
          (b.views + b.sales * 2) - (a.views + a.sales * 2)
        );
        
        if (sortedByPerformance[0]) {
          // Get chapter title
          const { data: chapterData } = await supabase
            .from('chapters')
            .select('title')
            .eq('id', sortedByPerformance[0].id)
            .single();

          topChapter = {
            id: sortedByPerformance[0].id,
            title: chapterData?.title || 'Untitled',
            views: sortedByPerformance[0].views,
            sales: sortedByPerformance[0].sales
          };
        }
      }

      setStats({
        totalChapters,
        totalViews,
        totalSales,
        avgPrice,
        topChapter,
        avgViewsPerChapter,
        avgSalesPerChapter
      });
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  useEffect(() => {
    calculateStats();
  }, [chapters, seriesId]);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel(`series-stats-${seriesId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'reading_progress',
        filter: `chapter_id=in.(${chapters.map(c => c.id).join(',')})` 
      }, () => {
        calculateStats();
      })
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'coin_transactions',
        filter: `reference_id=in.(${chapters.map(c => c.id).join(',')})` 
      }, () => {
        calculateStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [seriesId, chapters]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-center cursor-help">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-2xl font-bold text-primary">{stats.totalChapters}</span>
              </div>
              <div className="text-xs text-muted-foreground">Chapters</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of chapters in this series</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-center cursor-help">
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.totalViews}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Views ({stats.avgViewsPerChapter.toFixed(1)} avg)
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total unique readers across all chapters</p>
            <p className="text-xs text-muted-foreground">
              Average of {stats.avgViewsPerChapter.toFixed(1)} views per chapter
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-center cursor-help">
              <div className="flex items-center justify-center gap-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{stats.totalSales}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Sales ({stats.avgSalesPerChapter.toFixed(1)} avg)
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total paid chapter purchases</p>
            <p className="text-xs text-muted-foreground">
              Average of {stats.avgSalesPerChapter.toFixed(1)} sales per chapter
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="text-center cursor-help">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-2xl font-bold text-orange-600">{stats.avgPrice.toFixed(1)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Avg Price</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Average price of paid chapters</p>
            <p className="text-xs text-muted-foreground">Only includes chapters with set prices</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {stats.topChapter && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <span className="text-lg font-bold text-yellow-600">
                    #{stats.topChapter.id.slice(-4)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">Top Chapter</div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                <p className="font-medium">{stats.topChapter.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.topChapter.views} views, {stats.topChapter.sales} sales
                </p>
                <p className="text-xs text-muted-foreground">
                  Ranked by engagement (views + sales × 2)
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};