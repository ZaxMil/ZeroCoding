import { useState, useEffect } from 'react';
import { Trophy, Target, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Challenge {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  xpReward: number;
  type: 'daily' | 'weekly';
  icon: React.ReactNode;
}

export const ReadingChallenge = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    // Load challenges from localStorage
    const savedChallenges = localStorage.getItem('manga_challenges');
    const savedXP = localStorage.getItem('manga_total_xp');
    
    if (savedChallenges) {
      setChallenges(JSON.parse(savedChallenges));
    } else {
      // Initialize default challenges
      const defaultChallenges: Challenge[] = [
        {
          id: 'daily-pages',
          title: 'Page Turner',
          description: 'Read 50 pages today',
          target: 50,
          current: 0,
          xpReward: 100,
          type: 'daily',
          icon: <Target className="h-4 w-4" />
        },
        {
          id: 'daily-chapters',
          title: 'Chapter Champion',
          description: 'Complete 3 chapters today',
          target: 3,
          current: 0,
          xpReward: 150,
          type: 'daily',
          icon: <Trophy className="h-4 w-4" />
        },
        {
          id: 'weekly-streak',
          title: 'Reading Streak',
          description: 'Read for 7 consecutive days',
          target: 7,
          current: 1,
          xpReward: 500,
          type: 'weekly',
          icon: <Flame className="h-4 w-4" />
        }
      ];
      setChallenges(defaultChallenges);
      localStorage.setItem('manga_challenges', JSON.stringify(defaultChallenges));
    }

    if (savedXP) {
      setTotalXP(parseInt(savedXP));
    }
  }, []);

  const updateChallengeProgress = (challengeId: string, increment: number) => {
    setChallenges(prev => {
      const updated = prev.map(challenge => {
        if (challenge.id === challengeId) {
          const newCurrent = Math.min(challenge.current + increment, challenge.target);
          const wasCompleted = challenge.current >= challenge.target;
          const isNowCompleted = newCurrent >= challenge.target;
          
          // Award XP if just completed
          if (!wasCompleted && isNowCompleted) {
            setTotalXP(prevXP => {
              const newXP = prevXP + challenge.xpReward;
              localStorage.setItem('manga_total_xp', newXP.toString());
              return newXP;
            });
          }
          
          return { ...challenge, current: newCurrent };
        }
        return challenge;
      });
      
      localStorage.setItem('manga_challenges', JSON.stringify(updated));
      return updated;
    });
  };

  // Function to be called when user reads a page/chapter
  const onPageRead = () => updateChallengeProgress('daily-pages', 1);
  const onChapterComplete = () => updateChallengeProgress('daily-chapters', 1);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Reading Challenges
          </span>
          <Badge variant="secondary">
            {totalXP} XP
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {challenges.map((challenge) => {
          const progress = (challenge.current / challenge.target) * 100;
          const isCompleted = challenge.current >= challenge.target;
          
          return (
            <div key={challenge.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {challenge.icon}
                  <div>
                    <h4 className="font-medium">{challenge.title}</h4>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {challenge.current}/{challenge.target}
                  </div>
                  <Badge variant={isCompleted ? "default" : "outline"} className="text-xs">
                    {challenge.xpReward} XP
                  </Badge>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              {isCompleted && (
                <p className="text-sm text-green-600 font-medium">✓ Completed!</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

// Export functions to be used by reader components
export const useReadingChallenge = () => {
  const updatePageProgress = () => {
    // Increment page challenge
    const challenges = JSON.parse(localStorage.getItem('manga_challenges') || '[]');
    const updated = challenges.map((challenge: Challenge) => {
      if (challenge.id === 'daily-pages' && challenge.current < challenge.target) {
        return { ...challenge, current: challenge.current + 1 };
      }
      return challenge;
    });
    localStorage.setItem('manga_challenges', JSON.stringify(updated));
  };

  const updateChapterProgress = () => {
    // Increment chapter challenge
    const challenges = JSON.parse(localStorage.getItem('manga_challenges') || '[]');
    const updated = challenges.map((challenge: Challenge) => {
      if (challenge.id === 'daily-chapters' && challenge.current < challenge.target) {
        return { ...challenge, current: challenge.current + 1 };
      }
      return challenge;
    });
    localStorage.setItem('manga_challenges', JSON.stringify(updated));
  };

  return { updatePageProgress, updateChapterProgress };
};