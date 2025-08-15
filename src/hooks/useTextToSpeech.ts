import { useState, useEffect, useRef } from 'react';

interface TTSSettings {
  enabled: boolean;
  voice: string;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

const defaultSettings: TTSSettings = {
  enabled: false,
  voice: '',
  rate: 1,
  pitch: 1,
  volume: 0.8
};

const STORAGE_KEY = 'tts-settings';

export const useTextToSpeech = () => {
  const [settings, setSettings] = useState<TTSSettings>(defaultSettings);
  const [isSupported, setIsSupported] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if TTS is supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 'speechSynthesis' in window;
      setIsSupported(supported);
      
      if (supported) {
        const loadVoices = () => {
          const voices = speechSynthesis.getVoices();
          setAvailableVoices(voices);
          
          // Set default voice if none selected
          if (!settings.voice && voices.length > 0) {
            const englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0];
            setSettings(prev => ({ ...prev, voice: englishVoice.name }));
          }
        };

        loadVoices();
        speechSynthesis.addEventListener('voiceschanged', loadVoices);
        
        return () => speechSynthesis.removeEventListener('voiceschanged', loadVoices);
      }
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
      console.error('Error loading TTS settings:', error);
    }
  }, []);

  const updateSettings = (newSettings: TTSSettings) => {
    try {
      setSettings(newSettings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving TTS settings:', error);
    }
  };

  const speak = (text: string) => {
    if (!isSupported || !settings.enabled || !text.trim()) return;

    // Stop any current speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const selectedVoice = availableVoices.find(v => v.name === settings.voice);
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (isSupported && isPlaying) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resume = () => {
    if (isSupported && isPaused) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stop = () => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const togglePlayPause = () => {
    if (isPaused) {
      resume();
    } else if (isPlaying) {
      pause();
    }
  };

  return {
    settings,
    isSupported,
    isPlaying,
    isPaused,
    availableVoices,
    updateSettings,
    speak,
    pause,
    resume,
    stop,
    togglePlayPause
  };
};