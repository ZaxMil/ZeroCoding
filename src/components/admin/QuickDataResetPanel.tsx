import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { quickDatabaseReset } from '@/utils/quickDataReset';
import { Zap, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export const QuickDataResetPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { toast } = useToast();

  const handleQuickReset = async () => {
    if (!confirm('⚠️ Quick reset: Create 2 test series with chapters. Continue?')) return;
    
    setIsRunning(true);
    try {
      const result = await quickDatabaseReset();
      if (result) {
        setCompleted(true);
        toast({
          title: 'Quick Reset Complete',
          description: 'Created 2 test series for quick testing',
        });
      } else {
        toast({
          title: 'Reset Failed',
          description: 'Check console for details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run quick reset',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">Quick reset for testing:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Creates <strong>2 test series</strong> (1 manga + 1 novel)</li>
          <li>Each series has <strong>5 chapters</strong></li>
          <li>All chapters are <strong>free to read</strong></li>
          <li>Perfect for quick functionality testing</li>
        </ul>
      </div>

      <Button
        onClick={handleQuickReset}
        disabled={isRunning}
        className="w-full"
        variant="outline"
      >
        {isRunning ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Creating Test Data...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4 mr-2" />
            Quick Test Reset
          </>
        )}
      </Button>

      {completed && (
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-green-700 dark:text-green-300">Quick reset completed</span>
          <Badge variant="outline">2 series</Badge>
        </div>
      )}
    </div>
  );
};