import { useState, useEffect } from 'react';

interface AnimationSettings {
  pageTransitions: boolean;
  smoothScrolling: boolean;
  hoverEffects: boolean;
  loadingAnimations: boolean;
  feedbackAnimations: boolean;
}

const defaultSettings: AnimationSettings = {
  pageTransitions: true,
  smoothScrolling: true,
  hoverEffects: true,
  loadingAnimations: true,
  feedbackAnimations: true
};

const STORAGE_KEY = 'animation-settings';

export const useAnimationSettings = () => {
  const [settings, setSettings] = useState<AnimationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...defaultSettings, ...parsed });
        }
      } catch (error) {
        console.error('Error loading animation settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Apply CSS variables based on settings
  useEffect(() => {
    const root = document.documentElement;
    
    // Update CSS custom properties for animations
    root.style.setProperty(
      '--page-transition-duration', 
      settings.pageTransitions ? '300ms' : '0ms'
    );
    
    root.style.setProperty(
      '--scroll-behavior', 
      settings.smoothScrolling ? 'smooth' : 'auto'
    );
    
    root.style.setProperty(
      '--hover-transition-duration', 
      settings.hoverEffects ? '200ms' : '0ms'
    );
    
    root.style.setProperty(
      '--loading-animation-duration', 
      settings.loadingAnimations ? '2s' : '0s'
    );

    // Add/remove animation classes to body
    if (settings.feedbackAnimations) {
      document.body.classList.add('animations-enabled');
    } else {
      document.body.classList.remove('animations-enabled');
    }
  }, [settings]);

  // Save settings function
  const updateSettings = (newSettings: AnimationSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('animationSettingsChange', {
        detail: newSettings
      }));
    } catch (error) {
      console.error('Error saving animation settings:', error);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    updateSettings(defaultSettings);
  };

  // Individual setting helpers
  const enablePageTransitions = (enabled: boolean) => {
    updateSettings({ ...settings, pageTransitions: enabled });
  };

  const enableSmoothScrolling = (enabled: boolean) => {
    updateSettings({ ...settings, smoothScrolling: enabled });
  };

  const enableHoverEffects = (enabled: boolean) => {
    updateSettings({ ...settings, hoverEffects: enabled });
  };

  const enableLoadingAnimations = (enabled: boolean) => {
    updateSettings({ ...settings, loadingAnimations: enabled });
  };

  const enableFeedbackAnimations = (enabled: boolean) => {
    updateSettings({ ...settings, feedbackAnimations: enabled });
  };

  return {
    settings,
    updateSettings,
    resetToDefaults,
    loading,
    // Individual helpers
    enablePageTransitions,
    enableSmoothScrolling,
    enableHoverEffects,
    enableLoadingAnimations,
    enableFeedbackAnimations
  };
};