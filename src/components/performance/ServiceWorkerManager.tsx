import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Trash2, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Settings
} from 'lucide-react';

interface CacheStats {
  totalSize: number;
  itemCount: number;
  lastUpdated: string;
}

interface ServiceWorkerState {
  isRegistered: boolean;
  isActive: boolean;
  isUpdateAvailable: boolean;
  registrationTime?: string;
  version?: string;
}

export const ServiceWorkerManager: React.FC = () => {
  const [swState, setSwState] = useState<ServiceWorkerState>({
    isRegistered: false,
    isActive: false,
    isUpdateAvailable: false
  });
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalSize: 0,
    itemCount: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalling, setIsInstalling] = useState(false);

  // Check service worker status
  const checkServiceWorkerStatus = async () => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        setSwState({
          isRegistered: true,
          isActive: !!registration.active,
          isUpdateAvailable: !!registration.waiting,
          registrationTime: new Date().toISOString(),
          version: '1.0.0'
        });
      }
    } catch (error) {
      console.error('Failed to check service worker status:', error);
    }
  };

  // Register service worker
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      alert('Service Workers are not supported in this browser');
      return;
    }

    setIsInstalling(true);
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      
      registration.addEventListener('updatefound', () => {
        setSwState(prev => ({ ...prev, isUpdateAvailable: true }));
      });

      await checkServiceWorkerStatus();
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      alert('Failed to register Service Worker');
    } finally {
      setIsInstalling(false);
    }
  };

  // Update service worker
  const updateServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to update service worker:', error);
    }
  };

  // Clear cache
  const clearCache = async () => {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      setCacheStats({
        totalSize: 0,
        itemCount: 0,
        lastUpdated: new Date().toISOString()
      });
      alert('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache');
    }
  };

  // Get cache statistics
  const getCacheStats = async () => {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;
      let itemCount = 0;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        itemCount += keys.length;

        // Estimate size (this is approximate)
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      setCacheStats({
        totalSize,
        itemCount,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to get cache stats:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize
  useEffect(() => {
    checkServiceWorkerStatus();
    getCacheStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-5 w-5 text-green-600" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-600" />
            )}
            Network Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          {!isOnline && (
            <p className="text-sm text-muted-foreground mt-2">
              You're currently offline. Cached content will be served when available.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Service Worker
            </span>
            <Badge variant={swState.isActive ? 'default' : 'secondary'}>
              {swState.isRegistered ? 'Registered' : 'Not Registered'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Manages offline functionality and caching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {swState.isActive ? 'Active and running' : 'Inactive'}
              </p>
            </div>
            {swState.isActive ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-600" />
            )}
          </div>

          {swState.isUpdateAvailable && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Update Available
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                A new version of the app is available.
              </p>
              <Button size="sm" onClick={updateServiceWorker}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Now
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            {!swState.isRegistered ? (
              <Button 
                onClick={registerServiceWorker} 
                disabled={isInstalling}
              >
                {isInstalling ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Installing...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install Service Worker
                  </>
                )}
              </Button>
            ) : (
              <Button variant="outline" onClick={checkServiceWorkerStatus}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Status
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cache Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Cache Management
          </CardTitle>
          <CardDescription>
            Manage cached resources for offline access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{cacheStats.itemCount}</p>
              <p className="text-sm text-muted-foreground">Cached Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{formatFileSize(cacheStats.totalSize)}</p>
              <p className="text-sm text-muted-foreground">Total Size</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Last Updated</p>
              <p className="text-sm text-muted-foreground">
                {new Date(cacheStats.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={getCacheStats}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
            <Button variant="destructive" onClick={clearCache}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Service Worker enables offline reading of cached manga</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Clear cache if you experience loading issues</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Update when prompted for the latest features</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Cached content loads faster on repeat visits</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};