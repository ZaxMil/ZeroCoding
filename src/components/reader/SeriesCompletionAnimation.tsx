import { useEffect, useState } from 'react';
import { Trophy, Star, Heart, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';


interface SeriesCompletionAnimationProps {
  seriesTitle: string;
  totalChapters: number;
  onClose: () => void;
  onShareAchievement?: () => void;
}

export const SeriesCompletionAnimation = ({ 
  seriesTitle, 
  totalChapters, 
  onClose, 
  onShareAchievement 
}: SeriesCompletionAnimationProps) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShowAnimation(true), 100);
    
    // Trigger confetti
    triggerConfetti();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md transform transition-all duration-500 ${
        showAnimation ? 'scale-100 rotate-0' : 'scale-75 rotate-12'
      }`}>
        <CardContent className="p-8 text-center space-y-6">
          {/* Trophy Animation */}
          <div className="relative">
            <div className={`transform transition-all duration-1000 ${
              showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
            }`}>
              <Trophy className="h-20 w-20 mx-auto text-yellow-500" />
            </div>
            
            {/* Sparkles around trophy */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(8)].map((_, i) => (
                <Sparkles
                  key={i}
                  className={`absolute h-4 w-4 text-yellow-400 animate-ping transition-all duration-1000 ${
                    showAnimation ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{
                    left: `${20 + (i % 4) * 20}%`,
                    top: `${20 + Math.floor(i / 4) * 20}%`,
                    animationDelay: `${i * 200}ms`
                  }}
                />
              ))}
            </div>
          </div>

          {/* Completion Message */}
          <div className={`space-y-2 transition-all duration-700 delay-300 ${
            showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <h2 className="text-2xl font-bold text-primary">
              🎉 Series Complete! 🎉
            </h2>
            <p className="text-lg font-medium">
              {seriesTitle}
            </p>
            <p className="text-muted-foreground">
              You've read all {totalChapters} chapters!
            </p>
          </div>

          {/* Achievement Stats */}
          <div className={`grid grid-cols-3 gap-4 transition-all duration-700 delay-500 ${
            showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-sm font-medium">{totalChapters}</div>
              <div className="text-xs text-muted-foreground">Chapters</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              <div className="text-sm font-medium">100%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Trophy className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="text-sm font-medium">+500</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className={`text-center transition-all duration-700 delay-700 ${
            showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            <p className="text-sm text-muted-foreground italic">
              "Great readers become great leaders. On to the next adventure!"
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 transition-all duration-700 delay-900 ${
            showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}>
            {onShareAchievement && (
              <Button variant="outline" onClick={onShareAchievement} className="flex-1">
                Share Achievement
              </Button>
            )}
            <Button onClick={onClose} className="flex-1">
              Continue Reading
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Hook to detect series completion
export const useSeriesCompletion = () => {
  const [completedSeries, setCompletedSeries] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('manga_completed_series');
    if (saved) {
      setCompletedSeries(JSON.parse(saved));
    }
  }, []);

  const markSeriesComplete = (seriesId: string) => {
    if (!completedSeries.includes(seriesId)) {
      const updated = [...completedSeries, seriesId];
      setCompletedSeries(updated);
      localStorage.setItem('manga_completed_series', JSON.stringify(updated));
      
      // Award completion XP
      const currentXP = parseInt(localStorage.getItem('manga_total_xp') || '0');
      localStorage.setItem('manga_total_xp', (currentXP + 500).toString());
      
      return true; // First time completion
    }
    return false; // Already completed
  };

  const isSeriesComplete = (seriesId: string) => {
    return completedSeries.includes(seriesId);
  };

  return { markSeriesComplete, isSeriesComplete, completedSeries };
};

// Utility for confetti effect
const confettiLib = {
  create: () => ({
    // Mock confetti implementation
    fire: (options: any) => {
      console.log('Confetti fired!', options);
    }
  })
};

// Simple confetti implementation
export const triggerConfetti = (element?: HTMLElement) => {
  // Create colorful particles
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      animation: confetti-fall 3s linear forwards;
      left: ${Math.random() * window.innerWidth}px;
      top: -10px;
    `;
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
      particle.remove();
    }, 3000);
  }
};

// CSS for confetti animation
const confettiStyles = `
@keyframes confetti-fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}
`;

// Inject confetti styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = confettiStyles;
  document.head.appendChild(styleSheet);
}