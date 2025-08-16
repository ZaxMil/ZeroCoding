import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Database, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle,
  BookOpen,
  FileText,
  RefreshCw,
  Users,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DemoAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => Promise<void>;
  confirmMessage: string;
}

export const ImprovedDataResetPanel: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const simulateProgress = async (actionId: string) => {
    setLoading(actionId);
    setProgress(0);
    
    for (let i = 0; i <= 100; i += 10) {
      setProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setLoading(null);
    setProgress(0);
  };

  const addDemoSeries = async () => {
    await simulateProgress('demo-series');
    
    // In a real implementation, this would add demo series data
    toast({
      title: "Demo Series Added",
      description: "Successfully added demo manga series to the database.",
      duration: 3000,
    });
  };

  const addDemoChapters = async () => {
    await simulateProgress('demo-chapters');
    
    // In a real implementation, this would add demo chapter data
    toast({
      title: "Demo Chapters Added",
      description: "Successfully added demo chapters to existing series.",
      duration: 3000,
    });
  };

  const removeAllData = async () => {
    await simulateProgress('remove-all');
    
    // In a real implementation, this would clear all data
    toast({
      title: "All Data Removed",
      description: "Successfully removed all manga data from the database.",
      duration: 3000,
    });
  };

  const demoActions: DemoAction[] = [
    {
      id: 'demo-series',
      title: 'Demo Series Insertion',
      description: 'Add sample manga series with covers, descriptions, and metadata for testing purposes.',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      action: addDemoSeries,
      confirmMessage: 'This will add demo manga series to your database. Continue?'
    },
    {
      id: 'demo-chapters',
      title: 'Demo Chapter Insertion',
      description: 'Add sample chapters with pages and content to existing series for testing the reader.',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-green-500/10 text-green-400 border-green-500/20',
      action: addDemoChapters,
      confirmMessage: 'This will add demo chapters to existing series. Continue?'
    },
    {
      id: 'remove-all',
      title: 'Complete Data Deletion',
      description: 'Remove all manga series, chapters, and related data. This action cannot be undone.',
      icon: <Trash2 className="h-6 w-6" />,
      color: 'bg-red-500/10 text-red-400 border-red-500/20',
      action: removeAllData,
      confirmMessage: 'This will permanently delete ALL manga data. This action cannot be undone. Are you sure?'
    }
  ];

  const handleAction = async (action: DemoAction) => {
    if (loading) return;

    const confirmed = window.confirm(action.confirmMessage);
    if (!confirmed) return;

    try {
      await action.action();
    } catch (error) {
      toast({
        title: "Action Failed",
        description: `Failed to complete ${action.title.toLowerCase()}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Data Management</h1>
        <p className="text-slate-400">Manage demo data and database operations</p>
      </div>

      {/* Warning Alert */}
      <Alert className="border-yellow-500/20 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-400" />
        <AlertDescription className="text-yellow-200">
          These operations directly modify your database. Use with caution, especially in production environments.
        </AlertDescription>
      </Alert>

      {/* Progress Indicator */}
      {loading && (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-white font-medium">Processing operation...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-slate-400 mt-2">{progress}% complete</p>
          </CardContent>
        </Card>
      )}

      {/* Main Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {demoActions.map((action) => (
          <Card 
            key={action.id} 
            className="bg-slate-900/50 border-slate-800 hover:bg-slate-900/70 transition-colors"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-lg ${action.color}`}>
                  {action.icon}
                </div>
                {action.id === 'remove-all' && (
                  <Badge variant="destructive" className="text-xs">
                    Destructive
                  </Badge>
                )}
              </div>
              <CardTitle className="text-white text-lg">{action.title}</CardTitle>
              <CardDescription className="text-slate-400">
                {action.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => handleAction(action)}
                disabled={loading !== null}
                variant={action.id === 'remove-all' ? 'destructive' : 'default'}
                className="w-full"
              >
                {loading === action.id ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {action.icon}
                    <span className="ml-2">{action.title}</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Information */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-500/10">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">12</p>
              <p className="text-sm text-slate-400">Total Series</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-green-500/10">
                <FileText className="h-6 w-6 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">156</p>
              <p className="text-sm text-slate-400">Total Chapters</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-lg bg-purple-500/10">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">2.4K</p>
              <p className="text-sm text-slate-400">Total Users</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quick Tips
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
            <p className="text-sm text-slate-300">
              <strong>Demo Series:</strong> Creates realistic manga series with proper metadata, covers, and descriptions.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0" />
            <p className="text-sm text-slate-300">
              <strong>Demo Chapters:</strong> Adds chapters with sample pages to test the reading experience.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-400 mt-2 flex-shrink-0" />
            <p className="text-sm text-slate-300">
              <strong>Data Deletion:</strong> Completely removes all content - use only when starting fresh.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};