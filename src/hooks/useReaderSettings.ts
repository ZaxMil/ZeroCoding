import { useState, useEffect } from 'react';

export type ReadingMode = 'single' | 'continuous' | 'double';
export type FitMode = 'width' | 'height' | 'original';
export type ReadingDirection = 'ltr' | 'rtl';

interface ReaderSettings {
  readingMode: ReadingMode;
  fitMode: FitMode;
  readingDirection: ReadingDirection;
  brightness: number;
  zoom: number;
  autoFullscreen: boolean;
  pageTransition: boolean;
  showPageNumbers: boolean;
  gesturesEnabled: boolean;
  preloadPages: number;
}

const defaultSettings: ReaderSettings = {
  readingMode: 'single',
  fitMode: 'width',
  readingDirection: 'ltr',
  brightness: 100,
  zoom: 100,
  autoFullscreen: false,
  pageTransition: true,
  showPageNumbers: true,
  gesturesEnabled: true,
  preloadPages: 3
};

export const useReaderSettings = () => {
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('reader_settings');
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (error) {
        console.error('Failed to load reader settings:', error);
      }
    }
  }, []);

  const updateSetting = <K extends keyof ReaderSettings>(
    key: K,
    value: ReaderSettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('reader_settings', JSON.stringify(newSettings));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem('reader_settings', JSON.stringify(defaultSettings));
  };

  return {
    settings,
    updateSetting,
    resetSettings
  };
};