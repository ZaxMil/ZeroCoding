import { useState, useEffect } from 'react';
import { ReadingPreferencesData } from '@/components/reader/ReadingPreferences';

const STORAGE_KEY = 'manga_reading_preferences';

const defaultPreferences: ReadingPreferencesData = {
  readingMode: 'single',
  pageDirection: 'ltr',
  autoAdvance: false,
  autoAdvanceDelay: 5,
  fitMode: 'width',
  darkMode: false,
  backgroundColor: '#ffffff',
  showPageNumbers: true,
  enableZoom: true,
  preloadPages: 3
};

export const useReadingPreferences = () => {
  const [preferences, setPreferences] = useState<ReadingPreferencesData>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.error('Error loading reading preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save preferences to localStorage whenever they change
  const updatePreferences = (newPreferences: ReadingPreferencesData) => {
    try {
      setPreferences(newPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving reading preferences:', error);
    }
  };

  // Update a single preference
  const updatePreference = <K extends keyof ReadingPreferencesData>(
    key: K,
    value: ReadingPreferencesData[K]
  ) => {
    const newPreferences = { ...preferences, [key]: value };
    updatePreferences(newPreferences);
  };

  // Reset to defaults
  const resetPreferences = () => {
    updatePreferences(defaultPreferences);
  };

  return {
    preferences,
    updatePreferences,
    updatePreference,
    resetPreferences,
    loading
  };
};