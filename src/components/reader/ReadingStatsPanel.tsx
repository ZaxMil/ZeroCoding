import { useState, useEffect } from 'react';
import { BarChart3, Clock, BookOpen, TrendingUp, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SeriesStats {
  seriesId: string;
  seriesTitle: string;
  totalChapters: number;
  readChapters: number;
  totalTimeMinutes: number;
  averageTimePerChapter: number;
  firstReadDate: string;
  lastReadDate: string;
  readingStreak: number;
  favoriteChapter?: string;
}

interface ReadingStatsPanel {
  seriesId: string;
  seriesTitle?: string;
}

export const ReadingStatsPanel = ({ seriesId, seriesTitle }: ReadingStatsPanel) => {
  const [stats, setStats] = useState<SeriesStats | null>(null);
  const [globalStats, setGlobalStats] = useState({
    totalSeries: 0,
    totalChapters: 0,
    totalTimeMinutes: 0,
    averageRating: 0,
    longestStreak: 0
  });

  useEffect(() => {
    loadStats();
  }, [seriesId]);

  const loadStats = () => {
    // Load series-specific stats
    const seriesStatsKey = `manga_series_stats_${seriesId}`;
    const savedStats = localStorage.getItem(seriesStatsKey);
    
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    } else {
      // Initialize with default stats
      const initialStats: SeriesStats = {
        seriesId,
        seriesTitle: seriesTitle || 'Unknown Series',
        totalChapters: 0,
        readChapters: 0,
        totalTimeMinutes: 0,
        averageTimePerChapter: 0,
        firstReadDate: new Date().toISOString(),
        lastReadDate: new Date().toISOString(),
        readingStreak: 1
      };
      setStats(initialStats);
      localStorage.setItem(seriesStatsKey, JSON.stringify(initialStats));
    }

    // Load global stats
    const allStatsKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('manga_series_stats_')
    );
    
    let totalSeries = allStatsKeys.length;
    let totalChapters = 0;
    let totalTime = 0;
    
    allStatsKeys.forEach(key => {
      const stats = JSON.parse(localStorage.getItem(key) || '{}');
      totalChapters += stats.readChapters || 0;
      totalTime += stats.totalTimeMinutes || 0;
    });

    setGlobalStats({
      totalSeries,
      totalChapters,
      totalTimeMinutes: totalTime,
      averageRating: 4.5, // Mock value
      longestStreak: 15 // Mock value
    });
  };

  const updateReadingTime = (minutes: number) => {
    if (!stats) return;
    
    const updatedStats = {
      ...stats,
      totalTimeMinutes: stats.totalTimeMinutes + minutes,
      averageTimePerChapter: stats.readChapters > 0 
        ? (stats.totalTimeMinutes + minutes) / stats.readChapters 
        : minutes,
      lastReadDate: new Date().toISOString()
    };
    
    setStats(updatedStats);
    localStorage.setItem(`manga_series_stats_${seriesId}`, JSON.stringify(updatedStats));
  };

  const incrementChapterRead = () => {
    if (!stats) return;
    
    const updatedStats = {
      ...stats,
      readChapters: stats.readChapters + 1,
      averageTimePerChapter: stats.totalTimeMinutes / (stats.readChapters + 1),
      lastReadDate: new Date().toISOString()
    };
    
    setStats(updatedStats);
    localStorage.setItem(`manga_series_stats_${seriesId}`, JSON.stringify(updatedStats));
  };

  if (!stats) return null;

  const completionPercentage = stats.totalChapters > 0 
    ? (stats.readChapters / stats.totalChapters) * 100 
    : 0;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Reading Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="series" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="series">This Series</TabsTrigger>
            <TabsTrigger value="global">All Time</TabsTrigger>
          </TabsList>
          
          <TabsContent value="series" className="space-y-4">
            {/* Series Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{stats.readChapters}/{stats.totalChapters || '?'} chapters</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              {completionPercentage > 0 && (
                <p className="text-xs text-muted-foreground">
                  {completionPercentage.toFixed(1)}% complete
                </p>
              )}
            </div>

            {/* Reading Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-lg font-semibold">
                  {formatTime(stats.totalTimeMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-lg font-semibold">
                  {formatTime(stats.averageTimePerChapter)}
                </div>
                <div className="text-xs text-muted-foreground">Avg/Chapter</div>
              </div>
            </div>

            {/* Reading Dates */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">First Read:</span>
                <span>{formatDate(stats.firstReadDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Read:</span>
                <span>{formatDate(stats.lastReadDate)}</span>
              </div>
            </div>

            {/* Reading Streak */}
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Reading Streak</span>
              </div>
              <Badge variant="secondary">
                {stats.readingStreak} days
              </Badge>
            </div>
          </TabsContent>

          <TabsContent value="global" className="space-y-4">
            {/* Global Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                <div className="text-lg font-semibold">{globalStats.totalSeries}</div>
                <div className="text-xs text-muted-foreground">Series Read</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                <div className="text-lg font-semibold">{globalStats.totalChapters}</div>
                <div className="text-xs text-muted-foreground">Total Chapters</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-green-500" />
                <div className="text-lg font-semibold">
                  {formatTime(globalStats.totalTimeMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">Reading Time</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                <div className="text-lg font-semibold">{globalStats.longestStreak}</div>
                <div className="text-xs text-muted-foreground">Longest Streak</div>
              </div>
            </div>

            {/* Achievements */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Achievements</h4>
              <div className="space-y-1">
                {globalStats.totalChapters >= 100 && (
                  <Badge variant="secondary" className="mr-2">
                    📚 Century Reader (100+ chapters)
                  </Badge>
                )}
                {globalStats.totalSeries >= 10 && (
                  <Badge variant="secondary" className="mr-2">
                    🌟 Series Explorer (10+ series)
                  </Badge>
                )}
                {globalStats.totalTimeMinutes >= 1440 && (
                  <Badge variant="secondary" className="mr-2">
                    ⏰ Day Reader (24+ hours)
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Hook for tracking reading stats
export const useReadingStats = (seriesId: string) => {
  const trackChapterRead = () => {
    const seriesStatsKey = `manga_series_stats_${seriesId}`;
    const stats = JSON.parse(localStorage.getItem(seriesStatsKey) || '{}');
    
    const updatedStats = {
      ...stats,
      readChapters: (stats.readChapters || 0) + 1,
      lastReadDate: new Date().toISOString()
    };
    
    localStorage.setItem(seriesStatsKey, JSON.stringify(updatedStats));
  };

  const trackReadingTime = (minutes: number) => {
    const seriesStatsKey = `manga_series_stats_${seriesId}`;
    const stats = JSON.parse(localStorage.getItem(seriesStatsKey) || '{}');
    
    const updatedStats = {
      ...stats,
      totalTimeMinutes: (stats.totalTimeMinutes || 0) + minutes,
      lastReadDate: new Date().toISOString()
    };
    
    localStorage.setItem(seriesStatsKey, JSON.stringify(updatedStats));
  };

  return { trackChapterRead, trackReadingTime };
};