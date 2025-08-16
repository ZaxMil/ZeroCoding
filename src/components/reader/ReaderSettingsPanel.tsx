import { Settings, Monitor, Sun, ZoomIn, Navigation, Hand, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useReaderSettings } from '@/hooks/useReaderSettings';

export const ReaderSettingsPanel = () => {
  const { settings, updateSetting, resetSettings } = useReaderSettings();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 right-4 z-50">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Reader Settings
          </SheetTitle>
          <SheetDescription>
            Customize your reading experience
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-120px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Reading Mode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                <h3 className="font-medium">Reading Mode</h3>
              </div>
              <Select
                value={settings.readingMode}
                onValueChange={(value) => updateSetting('readingMode', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Page</SelectItem>
                  <SelectItem value="continuous">Continuous Scroll</SelectItem>
                  <SelectItem value="double">Double Page</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Fit Mode */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                <h3 className="font-medium">Fit Mode</h3>
              </div>
              <Select
                value={settings.fitMode}
                onValueChange={(value) => updateSetting('fitMode', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="width">Fit Width</SelectItem>
                  <SelectItem value="height">Fit Height</SelectItem>
                  <SelectItem value="original">Original Size</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Reading Direction */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                <h3 className="font-medium">Reading Direction</h3>
              </div>
              <Select
                value={settings.readingDirection}
                onValueChange={(value) => updateSetting('readingDirection', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ltr">Left to Right</SelectItem>
                  <SelectItem value="rtl">Right to Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Brightness */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <h3 className="font-medium">Brightness: {settings.brightness}%</h3>
              </div>
              <Slider
                value={[settings.brightness]}
                onValueChange={([value]) => updateSetting('brightness', value)}
                max={150}
                min={50}
                step={5}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Zoom */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                <h3 className="font-medium">Zoom: {settings.zoom}%</h3>
              </div>
              <Slider
                value={[settings.zoom]}
                onValueChange={([value]) => updateSetting('zoom', value)}
                max={200}
                min={50}
                step={10}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Preload Pages */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <h3 className="font-medium">Preload Pages: {settings.preloadPages}</h3>
              </div>
              <Slider
                value={[settings.preloadPages]}
                onValueChange={([value]) => updateSetting('preloadPages', value)}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Toggle Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="font-medium">Auto Fullscreen</span>
                </div>
                <Switch
                  checked={settings.autoFullscreen}
                  onCheckedChange={(checked) => updateSetting('autoFullscreen', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  <span className="font-medium">Page Transitions</span>
                </div>
                <Switch
                  checked={settings.pageTransition}
                  onCheckedChange={(checked) => updateSetting('pageTransition', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="font-medium">Show Page Numbers</span>
                </div>
                <Switch
                  checked={settings.showPageNumbers}
                  onCheckedChange={(checked) => updateSetting('showPageNumbers', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hand className="h-4 w-4" />
                  <span className="font-medium">Gesture Controls</span>
                </div>
                <Switch
                  checked={settings.gesturesEnabled}
                  onCheckedChange={(checked) => updateSetting('gesturesEnabled', checked)}
                />
              </div>
            </div>

            <Separator />

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={resetSettings}
              className="w-full"
            >
              Reset to Defaults
            </Button>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};