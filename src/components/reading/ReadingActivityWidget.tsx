import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ReadingStatusIcon } from '@/components/reading/ReadingStatusIcon';
import { useAdvancedReadingProgress } from '@/hooks/useAdvancedReadingProgress';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, TrendingUp, BookOpen, CheckCircle } from 'lucide-react';

export const ReadingActivityWidget = () => {
  const { user } = useAuth();
  const { getRecentActivity, getStats, isLoading } = useAdvancedReadingProgress(user?.id);

  const recentActivity = getRecentActivity(5);
  const stats = getStats();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-3 bg-muted rounded"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reading Activity
          </h3>
          <Badge variant="outline">{stats.totalChapters} chapters tracked</Badge>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <CheckCircle className="h-6 w-6 mx-auto mb-2 text-success" />
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
            <div className="text-2xl font-bold">{stats.reading}</div>
            <div className="text-xs text-muted-foreground">Reading</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-chart-1" />
            <div className="text-2xl font-bold">{Math.round(stats.averageCompletion)}%</div>
            <div className="text-xs text-muted-foreground">Avg Progress</div>
          </div>
          
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.unread}</div>
            <div className="text-xs text-muted-foreground">Unread</div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Recent Activity</h4>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <div
                  key={activity.chapterId}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ReadingStatusIcon 
                      status={activity.completed ? 'completed' : 'reading'}
                      progress={activity.percentage}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        Chapter {activity.chapterId.split('-').pop()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Page {activity.currentPage} of {activity.totalPages}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <Progress value={activity.percentage} className="w-16 h-1 mb-1" />
                    <div className="text-xs text-muted-foreground">
                      {Math.round(activity.percentage)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recentActivity.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No reading activity yet</p>
            <p className="text-xs">Start reading to track your progress</p>
          </div>
        )}
      </div>
    </Card>
  );
};