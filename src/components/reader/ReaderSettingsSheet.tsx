import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { 
  Settings, 
  BookOpen, 
  Monitor,
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  Activity,
  Keyboard
} from 'lucide-react';
import { useChapterLayout, type ReadingMode, type ImageFit } from '@/hooks/useChapterLayout';
import { PreloadSettings } from '@/components/settings/PreloadSettings';
import { ProgressTrackingSettings } from '@/components/settings/ProgressTrackingSettings';
import { KeyboardSettings } from '@/components/settings/KeyboardSettings';
import { useKeyboardSettings } from '@/hooks/useKeyboardSettings';
import { useAuth } from '@/contexts/AuthContext';

interface ReaderSettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  metrics?: {
    preloadedCount: number;
    failedCount: number;
    avgLoadTime: number;
    memoryUsage: number;
  };
}

export const ReaderSettingsSheet = ({ isOpen, onOpenChange, metrics }: ReaderSettingsSheetProps) => {
  const { user } = useAuth();
  const {
    readingMode,
    imageGap,
    imageFit,
    imageScale,
    autoHideControls,
    pageFlipAnimation,
    updateReadingMode,
    updateImageGap,
    updateImageFit,
    updateImageScale,
    updateAutoHideControls,
    updatePageFlipAnimation,
    loading
  } = useChapterLayout();

  const { settings: keyboardSettings, updateSettings: updateKeyboardSettings } = useKeyboardSettings();

  const [boxedWidth, setBoxedWidth] = useState(() => {
    const stored = localStorage.getItem('manga-boxed-width');
    return stored === null ? true : stored === 'true';
  });

  const handleBoxedWidthChange = (enabled: boolean) => {
    setBoxedWidth(enabled);
    localStorage.setItem('manga-boxed-width', enabled.toString());
    window.dispatchEvent(new CustomEvent('boxedWidthChange', { detail: enabled }));
  };

  const resetAllSettings = () => {
    updateReadingMode('single');
    updateImageGap(0);
    updateImageFit('height');
    updateImageScale(100);
    handleBoxedWidthChange(true);
  };

  if (loading) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Reader Settings
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          <Tabs defaultValue="reading" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="reading" className="text-xs">Reading</TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">Performance</TabsTrigger>
              <TabsTrigger value="controls" className="text-xs">Controls</TabsTrigger>
            </TabsList>
            
            <TabsContent value="reading" className="space-y-6 mt-6">
              {/* Reading Mode */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Reading Mode
                </Label>
                <Select value={readingMode} onValueChange={(value: ReadingMode) => updateReadingMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Single Page
                      </div>
                    </SelectItem>
                    <SelectItem value="webtoon">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Webtoon (Vertical)
                      </div>
                    </SelectItem>
                    <SelectItem value="double">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Double Page
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {readingMode === 'single' && 'Traditional manga reading, one page at a time'}
                  {readingMode === 'webtoon' && 'Vertical scrolling, all pages in sequence'}
                  {readingMode === 'double' && 'Side-by-side pages for wide screen reading'}
                </p>
              </div>

              {/* Page Flip Animation (Double Mode Only) */}
              {readingMode === 'double' && (
                <>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Page Flip Animation</Label>
                    <Switch
                      checked={pageFlipAnimation}
                      onCheckedChange={updatePageFlipAnimation}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Realistic page turning animation when navigating in double page mode
                  </p>
                </>
              )}

              <Separator />

              {/* Boxed Width */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Boxed Width</Label>
                <Switch
                  checked={boxedWidth}
                  onCheckedChange={handleBoxedWidthChange}
                />
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Constrains content width for better readability
              </p>

              <Separator />

              {/* Image Settings */}
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Image Settings
                </Label>

                {/* Image Fit */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Image Fit</Label>
                  <Select value={imageFit} onValueChange={(value: ImageFit) => updateImageFit(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contain">Fit to Screen</SelectItem>
                      <SelectItem value="width">Fit to Width</SelectItem>
                      <SelectItem value="height">Fit to Height</SelectItem>
                      <SelectItem value="auto">Original Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Image Scale */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Scale</Label>
                    <span className="text-xs font-mono">{imageScale}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateImageScale(Math.max(50, imageScale - 10))}
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <Slider
                      value={[imageScale]}
                      onValueChange={([value]) => updateImageScale(value)}
                      min={50}
                      max={200}
                      step={5}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateImageScale(Math.min(200, imageScale + 10))}
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateImageScale(100)}
                    className="w-full text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset to 100%
                  </Button>
                </div>

                {/* Image Gap (Webtoon Mode) */}
                {readingMode === 'webtoon' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Page Gap</Label>
                      <span className="text-xs font-mono">{imageGap}px</span>
                    </div>
                    <Slider
                      value={[imageGap]}
                      onValueChange={([value]) => updateImageGap(value)}
                      min={0}
                      max={50}
                      step={2}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>No Gap</span>
                      <span>Large Gap</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Reset All */}
              <Button
                variant="outline"
                onClick={resetAllSettings}
                className="w-full"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset All Settings
              </Button>
            </TabsContent>

            <TabsContent value="performance" className="mt-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Performance Settings
                </Label>
                <PreloadSettings metrics={metrics} />
                <Separator />
                <ProgressTrackingSettings userId={user?.id} />
              </div>
            </TabsContent>

            <TabsContent value="controls" className="mt-6 space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  Keyboard Controls
                </Label>
                <KeyboardSettings 
                  settings={keyboardSettings}
                  onSettingsChange={updateKeyboardSettings}
                />

                <Separator />

                {/* Auto-hide Controls */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Auto-hide Controls</Label>
                  <Switch
                    checked={autoHideControls}
                    onCheckedChange={updateAutoHideControls}
                  />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                  Automatically hide reading controls after 3 seconds (Single/Double page modes only)
                </p>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Quick Reference</Label>
                  <div className="text-xs space-y-1 p-3 bg-muted/50 rounded-md">
                    <div className="flex justify-between">
                      <span>Next Page:</span>
                      <code className="bg-background px-1 rounded">→ / D</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Previous Page:</span>
                      <code className="bg-background px-1 rounded">← / A</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Toggle Controls:</span>
                      <code className="bg-background px-1 rounded">Space</code>
                    </div>
                    <div className="flex justify-between">
                      <span>Fullscreen:</span>
                      <code className="bg-background px-1 rounded">F</code>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};