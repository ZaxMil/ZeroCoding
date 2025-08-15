import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ChapterLayout = 1 | 2 | 3;
export type ReadingMode = 'single' | 'webtoon' | 'double';
export type ImageFit = 'contain' | 'width' | 'height' | 'auto';

export const useChapterLayout = () => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<ChapterLayout>(1);
  const [readingMode, setReadingMode] = useState<ReadingMode>('single');
  const [imageGap, setImageGap] = useState(0); // Gap in pixels - 0 for seamless webtoon
  const [imageFit, setImageFit] = useState<ImageFit>('height');
  const [imageScale, setImageScale] = useState(100); // Scale percentage
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Clear old preferences and force reset
  useEffect(() => {
    const PREFERENCES_VERSION = "1.0";
    const currentVersion = localStorage.getItem('preferences-version');
    
    if (currentVersion !== PREFERENCES_VERSION) {
      console.log('🔄 Clearing old reading preferences...');
      localStorage.removeItem('reading-mode');
      localStorage.removeItem('chapter-layout');
      localStorage.removeItem('image-gap');
      localStorage.removeItem('image-fit');
      localStorage.removeItem('image-scale');
      localStorage.setItem('preferences-version', PREFERENCES_VERSION);
    }
  }, []);

  // Load preferences immediately without blocking loading state
  useEffect(() => {
    const loadPreferences = () => {
      try {
        console.log('🔄 Loading reading preferences...');
        
        // Load from localStorage for all users since database columns don't exist yet
        const savedLayout = localStorage.getItem('chapter-layout');
        const savedReadingMode = localStorage.getItem('reading-mode');
        const savedImageGap = localStorage.getItem('image-gap');
        const savedImageFit = localStorage.getItem('image-fit');
        const savedImageScale = localStorage.getItem('image-scale');
        
        if (savedLayout) {
          const parsedLayout = parseInt(savedLayout) as ChapterLayout;
          if ([1, 2, 3].includes(parsedLayout)) {
            setLayout(parsedLayout);
          }
        }
        
        if (savedReadingMode && ['single', 'webtoon', 'double'].includes(savedReadingMode)) {
          console.log('🔄 Loading saved reading mode:', savedReadingMode);
          setReadingMode(savedReadingMode as ReadingMode);
        } else {
          console.log('🔄 Using default reading mode: single');
          // Explicitly set to single if no saved preference
          setReadingMode('single');
        }
        
        if (savedImageGap) {
          const gap = parseInt(savedImageGap);
          if (!isNaN(gap) && gap >= 0 && gap <= 50) {
            setImageGap(gap);
          }
        }
        
        if (savedImageFit && ['contain', 'width', 'height', 'auto'].includes(savedImageFit)) {
          setImageFit(savedImageFit as ImageFit);
        }
        
        if (savedImageScale) {
          const scale = parseInt(savedImageScale);
          if (!isNaN(scale)) {
            const clamped = Math.min(200, Math.max(50, scale));
            setImageScale(clamped);
            if (clamped !== scale) {
              localStorage.setItem('image-scale', clamped.toString());
            }
          }
        }
        
        setPreferencesLoaded(true);
        console.log('🔄 Preferences loaded successfully');
      } catch (error) {
        console.error('Error loading preferences:', error);
        // Set defaults on error
        setReadingMode('single');
        setPreferencesLoaded(true);
      }
    };

    loadPreferences();
  }, []);

  // Separate effect for data loading that doesn't depend on preferences
  useEffect(() => {
    const loadData = async () => {
      try {
        // Any actual data loading logic would go here
        // Currently just setting loading to false since preferences are separate
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Sync preferences across components without reload
  useEffect(() => {
    const handler = (e: Event) => {
      const evt = e as CustomEvent<Partial<{ layout: ChapterLayout; readingMode: ReadingMode; imageGap: number; imageFit: ImageFit; imageScale: number }>>;
      const detail = evt.detail || {};
      if (detail.layout !== undefined) setLayout(detail.layout);
      if (detail.readingMode !== undefined) setReadingMode(detail.readingMode);
      if (detail.imageGap !== undefined) setImageGap(detail.imageGap);
      if (detail.imageFit !== undefined) setImageFit(detail.imageFit);
      if (detail.imageScale !== undefined) setImageScale(detail.imageScale);
    };
    window.addEventListener('chapterPreferencesChange', handler as EventListener);
    return () => window.removeEventListener('chapterPreferencesChange', handler as EventListener);
  }, []);

  const updateLayout = async (newLayout: ChapterLayout) => {
    setLayout(newLayout);
    await savePreferences({ layout: newLayout });
  };

  const updateReadingMode = async (mode: ReadingMode) => {
    setReadingMode(mode);
    await savePreferences({ readingMode: mode });
  };

  const updateImageGap = async (gap: number) => {
    setImageGap(gap);
    await savePreferences({ imageGap: gap });
  };

  const updateImageFit = async (fit: ImageFit) => {
    setImageFit(fit);
    await savePreferences({ imageFit: fit });
  };

  const updateImageScale = async (scale: number) => {
    const clamped = Math.min(200, Math.max(50, scale));
    setImageScale(clamped);
    await savePreferences({ imageScale: clamped });
  };

  const savePreferences = async (prefs: {
    layout?: ChapterLayout;
    readingMode?: ReadingMode;
    imageGap?: number;
    imageFit?: ImageFit;
    imageScale?: number;
  }) => {
    try {
      // Save to localStorage for all users since database columns don't exist yet
      if (prefs.layout !== undefined) {
        localStorage.setItem('chapter-layout', prefs.layout.toString());
      }
      if (prefs.readingMode !== undefined) {
        localStorage.setItem('reading-mode', prefs.readingMode);
      }
      if (prefs.imageGap !== undefined) {
        localStorage.setItem('image-gap', prefs.imageGap.toString());
      }
      if (prefs.imageFit !== undefined) {
        localStorage.setItem('image-fit', prefs.imageFit);
      }
      if (prefs.imageScale !== undefined) {
        localStorage.setItem('image-scale', prefs.imageScale.toString());
      }

      // Notify all open components about preference changes
      window.dispatchEvent(new CustomEvent('chapterPreferencesChange', { detail: prefs }));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  return {
    layout,
    readingMode,
    imageGap,
    imageFit,
    imageScale,
    updateLayout,
    updateReadingMode,
    updateImageGap,
    updateImageFit,
    updateImageScale,
    loading,
    preferencesLoaded
  };
};