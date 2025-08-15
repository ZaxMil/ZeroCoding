import { useState, useEffect } from 'react';

export interface ReaderPreset {
  id: string;
  name: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  theme: 'light' | 'dark' | 'sepia';
  readingMode: 'single' | 'double' | 'webtoon';
  pageTransition: string;
  backgroundColor: string;
  textColor: string;
  zoom: number;
  margin: number;
  isDefault?: boolean;
  createdAt: string;
}

const defaultPresets: ReaderPreset[] = [
  {
    id: 'default-light',
    name: 'Light Mode',
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 1.6,
    theme: 'light',
    readingMode: 'single',
    pageTransition: 'slide',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    zoom: 100,
    margin: 20,
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-dark',
    name: 'Dark Mode',
    fontSize: 16,
    fontFamily: 'Inter',
    lineHeight: 1.6,
    theme: 'dark',
    readingMode: 'single',
    pageTransition: 'slide',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    zoom: 100,
    margin: 20,
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'default-sepia',
    name: 'Sepia Mode',
    fontSize: 16,
    fontFamily: 'Georgia',
    lineHeight: 1.7,
    theme: 'sepia',
    readingMode: 'single',
    pageTransition: 'fade',
    backgroundColor: '#f4f1ea',
    textColor: '#5c4b37',
    zoom: 100,
    margin: 25,
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

const STORAGE_KEY = 'reader-presets';
const ACTIVE_PRESET_KEY = 'active-reader-preset';

export const useReaderPresets = () => {
  const [presets, setPresets] = useState<ReaderPreset[]>(defaultPresets);
  const [activePresetId, setActivePresetId] = useState<string>('default-light');
  const [loading, setLoading] = useState(true);

  // Load presets on mount
  useEffect(() => {
    try {
      const storedPresets = localStorage.getItem(STORAGE_KEY);
      const storedActiveId = localStorage.getItem(ACTIVE_PRESET_KEY);

      if (storedPresets) {
        const parsed = JSON.parse(storedPresets);
        // Merge with defaults to ensure we have the base presets
        const merged = [...defaultPresets];
        parsed.forEach((preset: ReaderPreset) => {
          if (!preset.isDefault) {
            merged.push(preset);
          }
        });
        setPresets(merged);
      }

      if (storedActiveId) {
        setActivePresetId(storedActiveId);
      }
    } catch (error) {
      console.error('Error loading reader presets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save presets to localStorage
  const savePresets = (newPresets: ReaderPreset[]) => {
    try {
      const customPresets = newPresets.filter(preset => !preset.isDefault);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customPresets));
    } catch (error) {
      console.error('Error saving reader presets:', error);
    }
  };

  const activePreset = presets.find(preset => preset.id === activePresetId) || presets[0];

  const createPreset = (preset: Omit<ReaderPreset, 'id' | 'createdAt'>) => {
    const newPreset: ReaderPreset = {
      ...preset,
      id: `custom-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    savePresets(updatedPresets);
    return newPreset;
  };

  const updatePreset = (id: string, updates: Partial<ReaderPreset>) => {
    const updatedPresets = presets.map(preset =>
      preset.id === id ? { ...preset, ...updates } : preset
    );
    setPresets(updatedPresets);
    savePresets(updatedPresets);
  };

  const deletePreset = (id: string) => {
    // Don't allow deleting default presets
    const preset = presets.find(p => p.id === id);
    if (preset?.isDefault) return;

    const updatedPresets = presets.filter(preset => preset.id !== id);
    setPresets(updatedPresets);
    savePresets(updatedPresets);

    // If the deleted preset was active, switch to default
    if (activePresetId === id) {
      setActivePreset('default-light');
    }
  };

  const setActivePreset = (id: string) => {
    setActivePresetId(id);
    try {
      localStorage.setItem(ACTIVE_PRESET_KEY, id);
    } catch (error) {
      console.error('Error saving active preset:', error);
    }
  };

  const duplicatePreset = (id: string) => {
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    const duplicated = createPreset({
      ...preset,
      name: `${preset.name} (Copy)`,
      isDefault: false
    });

    return duplicated;
  };

  const resetToDefaults = () => {
    setPresets(defaultPresets);
    setActivePreset('default-light');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_PRESET_KEY);
  };

  return {
    presets,
    activePreset,
    activePresetId,
    loading,
    createPreset,
    updatePreset,
    deletePreset,
    setActivePreset,
    duplicatePreset,
    resetToDefaults
  };
};