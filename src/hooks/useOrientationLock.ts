import { useState, useEffect } from 'react';

type OrientationLock = 'any' | 'portrait' | 'landscape';

interface OrientationSettings {
  enabled: boolean;
  orientation: OrientationLock;
}

const defaultSettings: OrientationSettings = {
  enabled: false,
  orientation: 'any'
};

const STORAGE_KEY = 'orientation-lock-settings';

export const useOrientationLock = () => {
  const [settings, setSettings] = useState<OrientationSettings>(defaultSettings);
  const [isSupported, setIsSupported] = useState(false);

  // Check if orientation lock is supported
  useEffect(() => {
    const checkSupport = () => {
      const hasAPI = 'screen' in window && 'orientation' in window.screen;
      const hasLock = hasAPI && 'lock' in window.screen.orientation;
      setIsSupported(hasLock);
    };

    checkSupport();
  }, []);

  // Load settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading orientation settings:', error);
    }
  }, []);

  // Apply orientation lock when settings change
  useEffect(() => {
    if (!isSupported || !settings.enabled) {
      // Unlock orientation if disabled
      if (isSupported && 'unlock' in window.screen.orientation) {
        try {
          (window.screen.orientation as any).unlock();
        } catch {}
      }
      return;
    }

    const applyLock = async () => {
      try {
        if (settings.orientation === 'any') {
          if ((window.screen.orientation as any).unlock) {
            await (window.screen.orientation as any).unlock();
          }
        } else {
          const orientationMap = {
            portrait: 'portrait-primary',
            landscape: 'landscape-primary'
          } as const;
          
          if ((window.screen.orientation as any).lock) {
            await (window.screen.orientation as any).lock(orientationMap[settings.orientation]);
          }
        }
      } catch (error) {
        // Orientation lock can fail in various scenarios (not fullscreen, etc.)
        console.warn('Could not apply orientation lock:', error);
      }
    };

    applyLock();
  }, [settings, isSupported]);

  const updateSettings = (newSettings: OrientationSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving orientation settings:', error);
    }
  };

  const toggleEnabled = (enabled: boolean) => {
    updateSettings({ ...settings, enabled });
  };

  const setOrientation = (orientation: OrientationLock) => {
    updateSettings({ ...settings, orientation });
  };

  return {
    settings,
    isSupported,
    updateSettings,
    toggleEnabled,
    setOrientation
  };
};