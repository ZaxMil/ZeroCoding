import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

interface ScheduleSettings {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  weekendsOnly: boolean;
}

const defaultSettings: ScheduleSettings = {
  enabled: false,
  startTime: '18:00',
  endTime: '06:00',
  weekendsOnly: false
};

const STORAGE_KEY = 'night-mode-schedule';

export const useNightModeScheduler = () => {
  const { setTheme, theme } = useTheme();
  const [settings, setSettings] = useState<ScheduleSettings>(defaultSettings);
  const [isScheduleActive, setIsScheduleActive] = useState(false);

  // Load settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Error loading night mode schedule:', error);
    }
  }, []);

  // Check schedule every minute
  useEffect(() => {
    if (!settings.enabled) {
      setIsScheduleActive(false);
      return;
    }

    const checkSchedule = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Check if it's weekend and weekendsOnly is enabled
      if (settings.weekendsOnly && currentDay !== 0 && currentDay !== 6) {
        setIsScheduleActive(false);
        return;
      }

      const [startHour, startMin] = settings.startTime.split(':').map(Number);
      const [endHour, endMin] = settings.endTime.split(':').map(Number);
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      let shouldBeActive = false;

      if (startTime < endTime) {
        // Same day schedule (e.g., 18:00 to 22:00)
        shouldBeActive = currentTime >= startTime && currentTime < endTime;
      } else {
        // Overnight schedule (e.g., 18:00 to 06:00)
        shouldBeActive = currentTime >= startTime || currentTime < endTime;
      }

      setIsScheduleActive(shouldBeActive);
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [settings]);

  // Apply theme based on schedule
  useEffect(() => {
    if (!settings.enabled) return;

    if (isScheduleActive && theme !== 'dark') {
      setTheme('dark');
    } else if (!isScheduleActive && theme === 'dark') {
      // Only switch back to light if it was set by schedule
      // We don't want to override manual theme changes
      const wasSetBySchedule = localStorage.getItem('theme-set-by-schedule') === 'true';
      if (wasSetBySchedule) {
        setTheme('light');
      }
    }

    // Track if theme was set by schedule
    localStorage.setItem('theme-set-by-schedule', isScheduleActive.toString());
  }, [isScheduleActive, settings.enabled, theme, setTheme]);

  const updateSettings = (newSettings: ScheduleSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving night mode schedule:', error);
    }
  };

  const toggleEnabled = (enabled: boolean) => {
    updateSettings({ ...settings, enabled });
    if (!enabled) {
      localStorage.removeItem('theme-set-by-schedule');
    }
  };

  const setScheduleTime = (startTime: string, endTime: string) => {
    updateSettings({ ...settings, startTime, endTime });
  };

  const toggleWeekendsOnly = (weekendsOnly: boolean) => {
    updateSettings({ ...settings, weekendsOnly });
  };

  return {
    settings,
    isScheduleActive,
    updateSettings,
    toggleEnabled,
    setScheduleTime,
    toggleWeekendsOnly
  };
};