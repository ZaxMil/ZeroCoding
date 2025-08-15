import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Volume2, Play, Pause, Square } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

export const TextToSpeechSettings = () => {
  const { 
    settings, 
    isSupported, 
    isPlaying, 
    isPaused, 
    availableVoices, 
    updateSettings,
    speak,
    togglePlayPause,
    stop
  } = useTextToSpeech();

  const testText = "This is a sample text to test the text-to-speech settings. How does this sound?";

  const handleVoiceChange = (voiceName: string) => {
    updateSettings({ ...settings, voice: voiceName });
  };

  const handleRateChange = (value: number[]) => {
    updateSettings({ ...settings, rate: value[0] });
  };

  const handlePitchChange = (value: number[]) => {
    updateSettings({ ...settings, pitch: value[0] });
  };

  const handleVolumeChange = (value: number[]) => {
    updateSettings({ ...settings, volume: value[0] });
  };

  const toggleEnabled = (enabled: boolean) => {
    updateSettings({ ...settings, enabled });
    if (!enabled && isPlaying) {
      stop();
    }
  };

  if (!isSupported) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-muted-foreground">Text-to-Speech</h3>
          <Badge variant="outline" className="text-xs">Not Supported</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Text-to-speech is not supported on this browser.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4" />
          <h3 className="font-semibold">Text-to-Speech</h3>
          {settings.enabled && (
            <Badge variant="secondary" className="text-xs">
              Enabled
            </Badge>
          )}
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={toggleEnabled}
        />
      </div>

      {settings.enabled && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Voice</Label>
              <Select value={settings.voice} onValueChange={handleVoiceChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {availableVoices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Speed: {settings.rate.toFixed(1)}x
              </Label>
              <Slider
                value={[settings.rate]}
                onValueChange={handleRateChange}
                min={0.1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Pitch: {settings.pitch.toFixed(1)}
              </Label>
              <Slider
                value={[settings.pitch]}
                onValueChange={handlePitchChange}
                min={0}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">
                Volume: {Math.round(settings.volume * 100)}%
              </Label>
              <Slider
                value={[settings.volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <Separator />

            <div>
              <Label className="text-sm font-medium mb-2 block">Test Voice</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => speak(testText)}
                  disabled={isPlaying && !isPaused}
                  className="flex items-center gap-2"
                >
                  <Play className="h-3 w-3" />
                  Test
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  disabled={!isPlaying}
                  className="flex items-center gap-2"
                >
                  {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stop}
                  disabled={!isPlaying}
                  className="flex items-center gap-2"
                >
                  <Square className="h-3 w-3" />
                  Stop
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• TTS can read chapter text aloud when available</p>
        <p>• Voice quality depends on your system's available voices</p>
        <p>• This feature works best for text-based content</p>
      </div>
    </Card>
  );
};