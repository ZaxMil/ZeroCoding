import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface WatermarkSettings {
  enabled: boolean;
  opacity: number;
  textTemplate: string;
  ttlSec: number;
  formatPreference: 'webp' | 'jpeg';
}

export default function WatermarkSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<WatermarkSettings>({
    enabled: true,
    opacity: 0.22,
    textTemplate: '${SITE_NAME} · user:{uid8} · ts:{iso}',
    ttlSec: 120,
    formatPreference: 'webp'
  });
  const [testUrl, setTestUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [leakCheck, setLeakCheck] = useState({
    file: null as File | null,
    chapterId: '',
    index: '',
    userId: '',
    result: null as any
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const maxPages = 10;

  // Load settings from IndexedDB
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = localStorage.getItem('watermark-settings');
        if (stored) {
          setSettings({ ...settings, ...JSON.parse(stored) });
        }
      } catch (error) {
        console.warn('Failed to load watermark settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      setLogsLoading(true);
      const from = page * pageSize;
      const to = Math.min(from + pageSize - 1, 199);
      const { data, error } = await (supabase as any)
        .from('image_page_access')
        .select('*')
        .order('ts', { ascending: false })
        .range(from, to);
      if (!error) {
        setLogs(data || []);
      }
      setLogsLoading(false);
    };
    fetchLogs();
  }, [page]);

  const saveSettings = async () => {
    try {
      localStorage.setItem('watermark-settings', JSON.stringify(settings));
      toast({
        title: 'Settings saved',
        description: 'Watermark settings have been saved locally.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive'
      });
    }
  };

  const generateTestUrl = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sign-chapter-page', {
        body: {
          chapterId: 'test-chapter-id',
          index: 0,
          ttlSec: settings.ttlSec,
          format: settings.formatPreference
        }
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.message || 'Failed to generate test URL');

      setTestUrl(data.signedUrl);
      toast({
        title: 'Test URL generated',
        description: 'Click the link to view the test image.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate test URL.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const checkLeak = async () => {
    if (!leakCheck.file || !leakCheck.chapterId || !leakCheck.index || !leakCheck.userId) {
      toast({
        title: 'Error',
        description: 'Please fill all fields and select a file.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', leakCheck.file);
      formData.append('cid', leakCheck.chapterId);
      formData.append('i', leakCheck.index);
      formData.append('uid', leakCheck.userId);

      const response = await fetch('/functions/v1/check-watermark', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      const result = await response.json();
      setLeakCheck(prev => ({ ...prev, result }));

      toast({
        title: result.match ? 'MATCH FOUND' : 'NO MATCH',
        description: result.match 
          ? 'Fingerprint detected in uploaded image.'
          : 'No matching fingerprint found.',
        variant: result.match ? 'destructive' : 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to check watermark.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Watermark Settings</h1>
        <p className="text-muted-foreground">Configure image watermarking and security settings.</p>
      </div>

      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Watermark Configuration</CardTitle>
          <CardDescription>Control how images are watermarked and served</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              checked={settings.enabled}
              onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
            />
            <Label>Enable watermarking</Label>
          </div>

          <div className="space-y-2">
            <Label>Watermark opacity: {(settings.opacity * 100).toFixed(0)}%</Label>
            <Slider
              value={[settings.opacity]}
              onValueChange={([opacity]) => setSettings(prev => ({ ...prev, opacity }))}
              max={1}
              min={0.1}
              step={0.01}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Text template</Label>
            <Textarea
              value={settings.textTemplate}
              onChange={(e) => setSettings(prev => ({ ...prev, textTemplate: e.target.value }))}
              placeholder="${SITE_NAME} · user:{uid8} · ts:{iso}"
              className="min-h-[60px]"
            />
            <p className="text-sm text-muted-foreground">
              Available variables: {'{uid8}'} (user ID), {'{iso}'} (timestamp), ${'${SITE_NAME}'} (site name)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TTL (seconds)</Label>
              <Input
                type="number"
                min={30}
                max={120}
                value={settings.ttlSec}
                onChange={(e) => setSettings(prev => ({ ...prev, ttlSec: parseInt(e.target.value) || 120 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Format preference</Label>
              <Select
                value={settings.formatPreference}
                onValueChange={(format: 'webp' | 'jpeg') => setSettings(prev => ({ ...prev, formatPreference: format }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP (smaller files)</SelectItem>
                  <SelectItem value="jpeg">JPEG (better compatibility)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={saveSettings}>Save Settings</Button>
        </CardContent>
      </Card>

      {/* Test Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test URL Generator */}
        <Card>
          <CardHeader>
            <CardTitle>Test URL Generator</CardTitle>
            <CardDescription>Generate a test signed URL to verify watermarking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateTestUrl} disabled={loading}>
              Generate Test URL
            </Button>
            
            {testUrl && (
              <div className="space-y-2">
                <Label>Test URL (expires in {settings.ttlSec}s):</Label>
                <div className="p-2 bg-muted rounded text-sm font-mono break-all">
                  <a href={testUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {testUrl}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leak Checker */}
        <Card>
          <CardHeader>
            <CardTitle>Leak Checker</CardTitle>
            <CardDescription>Check if an uploaded image contains expected fingerprints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Upload suspected image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setLeakCheck(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Chapter ID</Label>
                <Input
                  value={leakCheck.chapterId}
                  onChange={(e) => setLeakCheck(prev => ({ ...prev, chapterId: e.target.value }))}
                  placeholder="chapter-id"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Page Index</Label>
                <Input
                  type="number"
                  value={leakCheck.index}
                  onChange={(e) => setLeakCheck(prev => ({ ...prev, index: e.target.value }))}
                  placeholder="0"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">User ID</Label>
                <Input
                  value={leakCheck.userId}
                  onChange={(e) => setLeakCheck(prev => ({ ...prev, userId: e.target.value }))}
                  placeholder="user-id"
                  className="text-xs"
                />
              </div>
            </div>

            <Button onClick={checkLeak} disabled={loading}>
              Check Fingerprint
            </Button>

            {leakCheck.result && (
              <div className={`p-3 rounded border ${leakCheck.result.match ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="font-medium">
                  Result: {leakCheck.result.match ? 'MATCH DETECTED' : 'NO MATCH'}
                </div>
                {leakCheck.result.coords && (
                  <div className="text-sm mt-1">
                    Checked {leakCheck.result.coords.length} coordinates
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Access Logs Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Image Access Logs</CardTitle>
          <CardDescription>Preview of recent watermarked image access (admin only)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Recent access logs (admin only). Showing {pageSize} per page, up to last 200 records.
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Page {page + 1} of {maxPages}</div>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || logsLoading}>Prev</Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(maxPages - 1, p + 1))} disabled={page >= maxPages - 1 || logsLoading || logs.length < pageSize}>Next</Button>
              </div>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Chapter</th>
                    <th className="text-left p-2">Page</th>
                    <th className="text-left p-2">IP</th>
                    <th className="text-left p-2">Fmt</th>
                    <th className="text-left p-2">WM</th>
                  </tr>
                </thead>
                <tbody>
                  {logsLoading ? (
                    <tr><td colSpan={7} className="p-3 text-center text-muted-foreground">Loading...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={7} className="p-3 text-center text-muted-foreground">No logs or insufficient permissions.</td></tr>
                  ) : (
                    logs.map((row, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">{new Date(row.ts).toLocaleString()}</td>
                        <td className="p-2 font-mono text-xs">{row.uid}</td>
                        <td className="p-2">{row.cid}</td>
                        <td className="p-2">{row.i}</td>
                        <td className="p-2">{row.ip || '-'}</td>
                        <td className="p-2">{row.fmt}</td>
                        <td className="p-2">{row.wm ? 'yes' : 'no'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}