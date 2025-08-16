import { useState, useEffect } from 'react';
import { Book, Clock, Calendar, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ReadingStats {
  totalChaptersRead: number;
  totalPagesRead: number;
  totalReadingTime: number; // in minutes
  averageReadingSpeed: number; // pages per minute
  currentStreak: number;
  longestStreak: number;
  completedSeries: number;
  favoriteGenres: string[];
  readingGoal: number;
  goalProgress: number;
}

export const ReadingStatistics = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadStats = async () => {
      try {
        // Get reading progress data
        const { data: progressData, error: progressError } = await supabase
          .from('reading_progress')
          .select('*')
          .eq('user_id', user.id);

        if (progressError) throw progressError;

        // Mock reading sessions data
        const sessionsData: any[] = [];

        // Calculate statistics
        const totalChaptersRead = progressData?.length || 0;
        const totalPagesRead = progressData?.reduce((sum, p) => sum + (p.current_page || 0), 0) || 0;
        const totalReadingTime = 0; // Mock data
        const averageReadingSpeed = totalReadingTime > 0 ? totalPagesRead / totalReadingTime : 0;

        // Calculate reading streak
        const currentStreak = calculateCurrentStreak(sessionsData || []);
        const longestStreak = calculateLongestStreak(sessionsData || []);

        // Mock completed series count
        const completedSeries = 5;

        // Mock reading goal
        const readingGoal = 100;
        const goalProgress = (totalChaptersRead / readingGoal) * 100;

        setStats({
          totalChaptersRead,
          totalPagesRead,
          totalReadingTime,
          averageReadingSpeed,
          currentStreak,
          longestStreak,
          completedSeries,
          favoriteGenres: ['Action', 'Adventure', 'Romance'], // Mock data
          readingGoal,
          goalProgress
        });

      } catch (error) {
        console.error('Failed to load reading statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const calculateCurrentStreak = (sessions: any[]): number => {
    if (!sessions.length) return 0;

    let streak = 0;
    const today = new Date();
    const currentDate = new Date(today);

    for (let i = 0; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].created_at);
      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateLongestStreak = (sessions: any[]): number => {
    if (!sessions.length) return 0;

    let longestStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sessions.length; i++) {
      const currentDate = new Date(sessions[i - 1].created_at);
      const previousDate = new Date(sessions[i].created_at);
      const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        currentStreak++;
      } else {
        longestStreak = Math.max(longestStreak, currentStreak);
        currentStreak = 1;
      }
    }

    return Math.max(longestStreak, currentStreak);
  };

  const formatReadingTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded"></div>
              <div className="h-6 w-16 bg-muted rounded"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No reading statistics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chapters Read</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChaptersRead}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reading Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatReadingTime(stats.totalReadingTime)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageReadingSpeed.toFixed(1)} pages/min avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Longest: {stats.longestStreak} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Series</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedSeries}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPagesRead} pages total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reading Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Reading Goal Progress
          </CardTitle>
          <CardDescription>
            {stats.totalChaptersRead} of {stats.readingGoal} chapters this year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={Math.min(stats.goalProgress, 100)} className="h-3" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{stats.goalProgress.toFixed(1)}% complete</span>
              <span>{Math.max(0, stats.readingGoal - stats.totalChaptersRead)} remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorite Genres */}
      <Card>
        <CardHeader>
          <CardTitle>Favorite Genres</CardTitle>
          <CardDescription>Based on your reading history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {stats.favoriteGenres.map((genre) => (
              <Badge key={genre} variant="secondary">
                {genre}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};