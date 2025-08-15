import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cleanupDemoData, confirmAndCleanup } from '@/utils/cleanupDemoData';
import { cleanupMockData, validateProductionReadiness } from '@/utils/cleanupMockData';
import { Trash2, RefreshCw, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

export const CleanupDataPanel: React.FC = () => {
  const [isCleaningDemo, setIsCleaningDemo] = useState(false);
  const [isCleaningMock, setIsCleaningMock] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const { toast } = useToast();

  const handleDemoCleanup = async () => {
    setIsCleaningDemo(true);
    try {
      const success = await confirmAndCleanup();
      if (success) {
        toast({
          title: 'Demo Data Cleaned',
          description: 'All demo content has been removed',
        });
      }
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: 'Error during demo data cleanup',
        variant: 'destructive',
      });
    } finally {
      setIsCleaningDemo(false);
    }
  };

  const handleMockCleanup = () => {
    setIsCleaningMock(true);
    try {
      const report = cleanupMockData();
      toast({
        title: 'Mock Data Cleaned',
        description: `Cleaned ${report.replacements} items`,
      });
    } catch (error) {
      toast({
        title: 'Cleanup Failed',
        description: 'Error during mock data cleanup',
        variant: 'destructive',
      });
    } finally {
      setIsCleaningMock(false);
    }
  };

  const validateProduction = () => {
    const result = validateProductionReadiness();
    setValidationResult(result);
    
    if (result.ready) {
      toast({
        title: 'Production Ready',
        description: 'No issues found',
      });
    } else {
      toast({
        title: 'Issues Found',
        description: `${result.issues.length} production issues detected`,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        <p className="mb-2">Clean up test data and prepare for production:</p>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleDemoCleanup}
          disabled={isCleaningDemo}
          className="w-full"
          variant="destructive"
        >
          {isCleaningDemo ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Cleaning Demo Data...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Clean All Demo Data
            </>
          )}
        </Button>

        <Button
          onClick={handleMockCleanup}
          disabled={isCleaningMock}
          className="w-full"
          variant="outline"
        >
          {isCleaningMock ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Cleaning Mock Data...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Clean Mock Data
            </>
          )}
        </Button>

        <Button
          onClick={validateProduction}
          className="w-full"
          variant="secondary"
        >
          <Shield className="h-4 w-4 mr-2" />
          Validate Production Readiness
        </Button>
      </div>

      {validationResult && (
        <Alert className={validationResult.ready ? "border-green-200 bg-green-50 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:bg-red-900/20"}>
          {validationResult.ready ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription>
            {validationResult.ready ? (
              'Production ready - no issues found'
            ) : (
              <div>
                <p className="font-medium mb-2">Issues found:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {validationResult.issues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};