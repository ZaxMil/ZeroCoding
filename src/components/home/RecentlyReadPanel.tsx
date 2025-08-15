import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RecentChapter {
  id: string;
  title: string;
  chapterNumber: string;
  seriesTitle: string;
  lastReadAt: Date;
  progress: number; // 0-100
  thumbnail?: string;
}

export const RecentlyReadPanel = () => {
  const { user } = useAuth();
  const [recentChapters, setRecentChapters] = useState<RecentChapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecentChapters = async () => {
      try {
        // Load from localStorage for now, can be enhanced with Supabase later
        const stored = localStorage.getItem('recently-read-chapters');
        if (stored) {
          const chapters = JSON.parse(stored);
          setRecentChapters(chapters.slice(0, 5)); // Last 5 chapters
        }
      } catch (error) {
        console.error('Error loading recent chapters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecentChapters();
  }, [user]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (recentChapters.length === 0) {
    return (
      <Card className="p-6 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-semibold mb-2">No Recent Reading</h3>
        <p className="text-sm text-muted-foreground">
          Start reading to see your recent chapters here
        </p>
      </Card>
    );
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">Recently Read</h3>
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          View All
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      <div className="space-y-3">
        {recentChapters.map((chapter) => (
          <div
            key={chapter.id}
            className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
          >
            {chapter.thumbnail ? (
              <img
                src={chapter.thumbnail}
                alt={chapter.title}
                className="w-12 h-16 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">
                {chapter.seriesTitle}
              </h4>
              <p className="text-xs text-muted-foreground truncate">
                Chapter {chapter.chapterNumber}: {chapter.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${chapter.progress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {chapter.progress}%
                </span>
              </div>
            </div>

            <div className="text-right">
              <Badge variant="secondary" className="text-xs">
                {formatTimeAgo(new Date(chapter.lastReadAt))}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};