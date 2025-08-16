import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

export default function SupabaseSetup() {
  const [config, setConfig] = useState({
    url: '',
    anonKey: ''
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const validateConnection = async () => {
    if (!config.url || !config.anonKey) {
      setValidationResult({
        isValid: false,
        message: 'Please enter both Supabase URL and anon key'
      });
      return;
    }

    setIsValidating(true);
    try {
      const testClient = createClient(config.url, config.anonKey);
      
      // Test the connection
      const { error } = await testClient.from('profiles').select('count').limit(1);
      
      if (error && error.code !== 'PGRST116') { // PGRST116 means table doesn't exist, which is ok
        throw error;
      }

      setValidationResult({
        isValid: true,
        message: 'Successfully connected to your 1manga project!'
      });
    } catch (error) {
      console.error('Supabase validation error:', error);
      setValidationResult({
        isValid: false,
        message: 'Failed to connect. Please check your URL and key.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const saveConfiguration = () => {
    if (!validationResult?.isValid) return;
    
    // Store configuration in localStorage for now
    localStorage.setItem('supabase_config', JSON.stringify(config));
    
    toast({
      title: "Configuration Saved",
      description: "Your 1manga project has been connected successfully!",
    });
    
    // Reload the page to use new configuration
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Connect Your 1manga Project</h1>
          <p className="text-muted-foreground">
            Enter your Supabase project credentials to connect your 1manga database
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Supabase Project Details
            </CardTitle>
            <CardDescription>
              Find these values in your 1manga project's Supabase dashboard under Settings → API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supabase-url">Project URL</Label>
              <Input
                id="supabase-url"
                type="url"
                placeholder="https://your-1manga-project.supabase.co"
                value={config.url}
                onChange={(e) => setConfig(prev => ({ ...prev, url: e.target.value }))}
                className={validationResult && !validationResult.isValid ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supabase-anon-key">Anon Public Key</Label>
              <Input
                id="supabase-anon-key"
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={config.anonKey}
                onChange={(e) => setConfig(prev => ({ ...prev, anonKey: e.target.value }))}
                className={validationResult && !validationResult.isValid ? 'border-destructive' : ''}
              />
            </div>

            <div className="pt-2">
              <Button
                onClick={validateConnection}
                disabled={isValidating || !config.url || !config.anonKey}
                variant="outline"
                className="w-full"
              >
                {isValidating ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </div>

            {validationResult && (
              <Alert className={validationResult.isValid ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-destructive bg-destructive/10'}>
                {validationResult.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
                <AlertDescription className={validationResult.isValid ? 'text-green-800 dark:text-green-200' : 'text-destructive'}>
                  {validationResult.message}
                </AlertDescription>
              </Alert>
            )}

            {validationResult?.isValid && (
              <Button onClick={saveConfiguration} className="w-full">
                Save Configuration & Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              To find your 1manga project credentials:
            </p>
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>Go to your Supabase dashboard</li>
              <li>Select your "1manga" project</li>
              <li>Navigate to Settings → API</li>
              <li>Copy your Project URL and anon public key</li>
            </ol>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              <ExternalLink className="h-4 w-4" />
              Open Supabase Dashboard
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}