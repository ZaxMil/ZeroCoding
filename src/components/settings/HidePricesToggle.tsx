import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EyeOff, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STORAGE_KEY = 'hide-chapter-prices';

export const HidePricesToggle = () => {
  const [hidePrices, setHidePrices] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHidePrices(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading hide prices setting:', error);
    }
  }, []);

  useEffect(() => {
    // Apply CSS custom property to hide prices globally
    document.documentElement.style.setProperty(
      '--hide-chapter-prices', 
      hidePrices ? 'none' : 'block'
    );
    
    // Add/remove class to body for CSS targeting
    if (hidePrices) {
      document.body.classList.add('hide-chapter-prices');
    } else {
      document.body.classList.remove('hide-chapter-prices');
    }
  }, [hidePrices]);

  const toggleHidePrices = (enabled: boolean) => {
    setHidePrices(enabled);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Error saving hide prices setting:', error);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EyeOff className="h-4 w-4" />
          <h3 className="font-semibold">Hide Chapter Prices</h3>
          {hidePrices && (
            <Badge variant="secondary" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>
        <Switch
          checked={hidePrices}
          onCheckedChange={toggleHidePrices}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="hide-prices" className="text-sm font-medium">
              Hide Pricing Information
            </Label>
            <p className="text-xs text-muted-foreground">
              Hide chapter prices and lock icons throughout the app
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">When enabled:</p>
            <p>• Chapter prices will be hidden from series pages</p>
            <p>• Lock icons on premium chapters will be hidden</p>
            <p>• Purchase buttons will be replaced with "Read" buttons</p>
            <p>• Free users can browse without seeing pricing</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• This is a cosmetic change only - functionality remains the same</p>
          <p>• Locked content will still require purchase to access</p>
          <p>• Settings apply immediately across the entire app</p>
        </div>
      </div>
    </Card>
  );
};