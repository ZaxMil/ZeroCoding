import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Trophy, TrendingUp, Target, Calendar } from 'lucide-react';
import { useReadingProgress } from '@/hooks/useReadingProgress';

interface ReadingGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

const mockGoals: ReadingGoal[] = [
  {
    id: '1',
    title: 'Daily Reading',
    target: 3,
    current: 2,
    unit: 'chapters',
    deadline: '2024-01-17',
    type: 'daily'
  },
  {
    id: '2',
    title: 'Weekly Goal',
    target: 20,
    current: 14,
    unit: 'chapters',
    deadline: '2024-01-21',
    type: 'weekly'
  },
  {
    id: '3',
    title: 'Monthly Challenge',
    target: 10,
    current: 3,
    unit: 'series',
    deadline: '2024-01-31',
    type: 'monthly'
  }
];

const mockAchievements = [
  { id: '1', title: 'Speed Reader', description: 'Read 50 chapters in a week', unlocked: true, icon: '⚡' },
  { id: '2', title: 'Bookworm', description: 'Read for 100 hours total', unlocked: true, icon: '📚' },
  { id: '3', title: 'Explorer', description: 'Read 10 different genres', unlocked: false, icon: '🗺️' },
  { id: '4', title: 'Completionist', description: 'Finish 25 series', unlocked: false, icon: '🏆' }
];

export function ReadingAnalytics() {
  const { stats, loading } = useReadingProgress();

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Start reading to see your analytics!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total_series}</p>
                <p className="text-sm text-muted-foreground">Series Reading</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.total_chapters_read}</p>
                <p className="text-sm text-muted-foreground">Chapters Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.total_reading_time / 60)}h</p>
                <p className="text-sm text-muted-foreground">Reading Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.reading_streak}</p>
                <p className="text-sm text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* This Week */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This Week
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Chapters Read</span>
                <span className="text-sm text-muted-foreground">
                  {stats.chapters_this_week} / 20 goal
                </span>
              </div>
              <Progress value={(stats.chapters_this_week / 20) * 100} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Pages Read</span>
                <span className="text-sm text-muted-foreground">
                  {stats.pages_this_week} pages
                </span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Reading Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockGoals.map((goal) => {
              const progress = (goal.current / goal.target) * 100;
              const isCompleted = goal.current >= goal.target;
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{goal.title}</span>
                      {isCompleted && (
                        <Badge variant="secondary" className="text-xs">
                          Completed!
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {goal.current} / {goal.target} {goal.unit}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className={`h-2 ${isCompleted ? 'bg-green-100' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.toFixed(0)}% complete</span>
                    <span>{goal.type} goal</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockAchievements.map((achievement) => (
              <div 
                key={achievement.id}
                className={`p-3 rounded-lg border ${
                  achievement.unlocked 
                    ? 'bg-primary/5 border-primary/20' 
                    : 'bg-muted/30 border-muted opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <h4 className="font-medium">{achievement.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                    {achievement.unlocked && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Unlocked
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Favorite Genre */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium">Favorite Genre</span>
              <div className="mt-1">
                <Badge variant="secondary" className="text-sm">
                  {stats.favorite_genre}
                </Badge>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium">Average Reading Session</span>
              <p className="text-sm text-muted-foreground mt-1">
                {Math.round(stats.total_reading_time / stats.total_chapters_read || 0)} minutes per chapter
              </p>
            </div>
            
            <div>
              <span className="text-sm font-medium">Reading Consistency</span>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.reading_streak} day streak - Keep it up!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}