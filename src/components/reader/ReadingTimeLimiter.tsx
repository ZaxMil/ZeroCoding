import { useState, useEffect } from 'react';
import { Clock, Pause, Play, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface ReadingSession {
  startTime: number;
  totalTime: number; // in minutes
  isPaused: boolean;
}

interface ReadingTimeLimiterProps {
  onTimeUp?: () => void;
}

export const ReadingTimeLimiter = ({ onTimeUp }: ReadingTimeLimiterProps) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(60); // minutes
  const [sessionLimit, setSessionLimit] = useState(30); // minutes
  const [currentSession, setCurrentSession] = useState<ReadingSession | null>(null);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings
    const settings = JSON.parse(localStorage.getItem('manga_time_limiter') || '{}');
    if (settings.enabled !== undefined) {
      setIsEnabled(settings.enabled);
      setDailyLimit(settings.dailyLimit || 60);
      setSessionLimit(settings.sessionLimit || 30);
    }

    // Load today's usage
    const today = new Date().toDateString();
    const usage = JSON.parse(localStorage.getItem(`manga_daily_usage_${today}`) || '0');
    setDailyUsed(usage);
  }, []);

  useEffect(() => {
    if (!isEnabled || !currentSession || currentSession.isPaused) return;

    const interval = setInterval(() => {
      setCurrentSession(prev => {
        if (!prev) return null;
        
        const elapsed = (Date.now() - prev.startTime) / (1000 * 60); // minutes
        const newTotal = prev.totalTime + 1/60; // Add 1 minute
        
        // Check session limit
        if (elapsed >= sessionLimit) {
          toast({
            title: "Session limit reached",
            description: `You've been reading for ${sessionLimit} minutes. Time for a break!`,
            variant: "destructive",
          });
          onTimeUp?.();
          return null;
        }
        
        // Check daily limit
        if (dailyUsed + elapsed >= dailyLimit) {
          toast({
            title: "Daily limit reached",
            description: `You've reached your daily reading limit of ${dailyLimit} minutes.`,
            variant: "destructive",
          });
          onTimeUp?.();
          return null;
        }
        
        // Warning at 80% of limits
        if (!showWarning && (elapsed >= sessionLimit * 0.8 || dailyUsed + elapsed >= dailyLimit * 0.8)) {
          setShowWarning(true);
          toast({
            title: "Time limit approaching",
            description: "You're approaching your reading time limit.",
          });
        }
        
        return { ...prev, totalTime: newTotal };
      });
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isEnabled, currentSession, sessionLimit, dailyLimit, dailyUsed, showWarning, onTimeUp, toast]);

  const startSession = () => {
    if (dailyUsed >= dailyLimit) {
      toast({
        title: "Daily limit reached",
        description: "You've already reached your daily reading limit.",
        variant: "destructive",
      });
      return;
    }

    setCurrentSession({
      startTime: Date.now(),
      totalTime: 0,
      isPaused: false
    });
    setShowWarning(false);
  };

  const pauseSession = () => {
    setCurrentSession(prev => prev ? { ...prev, isPaused: true } : null);
  };

  const resumeSession = () => {
    setCurrentSession(prev => prev ? { 
      ...prev, 
      isPaused: false, 
      startTime: Date.now() 
    } : null);
  };

  const endSession = () => {
    if (currentSession) {
      const totalMinutes = (Date.now() - currentSession.startTime) / (1000 * 60);
      const newDailyUsed = dailyUsed + totalMinutes;
      
      // Save daily usage
      const today = new Date().toDateString();
      localStorage.setItem(`manga_daily_usage_${today}`, JSON.stringify(newDailyUsed));
      setDailyUsed(newDailyUsed);
    }
    
    setCurrentSession(null);
    setShowWarning(false);
  };

  const saveSettings = () => {
    const settings = {
      enabled: isEnabled,
      dailyLimit,
      sessionLimit
    };
    localStorage.setItem('manga_time_limiter', JSON.stringify(settings));
    
    toast({
      title: "Settings saved",
      description: "Reading time limits updated",
    });
  };

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Reading Time Limiter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-limiter">Enable time limits</Label>
            <Switch
              id="enable-limiter"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Set daily and session reading time limits for healthy reading habits.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sessionElapsed = currentSession ? (Date.now() - currentSession.startTime) / (1000 * 60) : 0;
  const sessionProgress = (sessionElapsed / sessionLimit) * 100;
  const dailyProgress = (dailyUsed / dailyLimit) * 100;

  return (
    <Card className={showWarning ? "border-yellow-500" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Reading Time Limiter
          {showWarning && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="daily-limit">Daily Limit (minutes)</Label>
            <Input
              id="daily-limit"
              type="number"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(parseInt(e.target.value) || 60)}
              min="5"
              max="480"
            />
          </div>
          <div>
            <Label htmlFor="session-limit">Session Limit (minutes)</Label>
            <Input
              id="session-limit"
              type="number"
              value={sessionLimit}
              onChange={(e) => setSessionLimit(parseInt(e.target.value) || 30)}
              min="5"
              max="180"
            />
          </div>
        </div>

        <Button onClick={saveSettings} variant="outline" size="sm">
          Save Settings
        </Button>

        {/* Current Status */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Daily Usage</span>
              <span>{Math.round(dailyUsed)}/{dailyLimit} min</span>
            </div>
            <Progress value={dailyProgress} className="h-2" />
          </div>

          {currentSession && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Current Session</span>
                <span>{Math.round(sessionElapsed)}/{sessionLimit} min</span>
              </div>
              <Progress value={sessionProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          {!currentSession ? (
            <Button onClick={startSession} disabled={dailyUsed >= dailyLimit}>
              <Play className="h-4 w-4 mr-2" />
              Start Reading
            </Button>
          ) : (
            <>
              {currentSession.isPaused ? (
                <Button onClick={resumeSession}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
              ) : (
                <Button onClick={pauseSession} variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
              )}
              <Button onClick={endSession} variant="outline">
                End Session
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="disable-limiter">Disable time limits</Label>
          <Switch
            id="disable-limiter"
            checked={!isEnabled}
            onCheckedChange={(checked) => setIsEnabled(!checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
};