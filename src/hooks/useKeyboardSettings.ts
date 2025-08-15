import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { KeyboardNavigationSettings } from './useKeyboardNavigation';

const STORAGE_KEY = 'keyboard-navigation-settings';

const defaultSettings: KeyboardNavigationSettings = {
  enabled: true,
  visualFeedback: true,
  shortcuts: {
    'ArrowLeft': true,
    'ArrowRight': true,
    'ArrowUp': true,
    'ArrowDown': true,
    ' ': true,
    'f': true,
    'm': true,
    'b': true,
    't': true,
    'g': true,
    'e': true,
    'n': true,
    'p': true,
    'r': true,
    'c': true,
    '/': true,
    '?': true,
    'Escape': true
  }
};

export const useKeyboardSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<KeyboardNavigationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Always load from localStorage for now (no DB columns yet)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Error loading keyboard settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  // Save settings function
  const updateSettings = async (newSettings: KeyboardNavigationSettings) => {
    try {
      setSettings(newSettings);
      
      // Save to localStorage for all users
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      
      // Notify other components about settings change
      window.dispatchEvent(new CustomEvent('keyboardSettingsChange', {
        detail: newSettings
      }));
      
      console.log('Keyboard settings saved:', newSettings);
    } catch (error) {
      console.error('Error saving keyboard settings:', error);
    }
  };

  // Listen for settings changes from other components
  useEffect(() => {
    const handleSettingsChange = (e: CustomEvent) => {
      setSettings(e.detail);
    };
    
    window.addEventListener('keyboardSettingsChange', handleSettingsChange as EventListener);
    return () => window.removeEventListener('keyboardSettingsChange', handleSettingsChange as EventListener);
  }, []);

  return {
    settings,
    updateSettings,
    loading,
    resetToDefaults: () => updateSettings(defaultSettings)
  };
};