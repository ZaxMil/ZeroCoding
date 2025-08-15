import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Heart, Users, DollarSign, Zap, ExternalLink } from 'lucide-react';
import DonatePanel from '@/components/support/DonatePanel';
import { supabase } from '@/integrations/supabase/client';

interface SocialPlatform {
  id: string;
  platform_name: string;
  platform_url: string;
  icon_type: string;
  platform_color?: string;
  display_order: number;
}

const getIconForPlatform = (platformName: string) => {
  switch (platformName.toLowerCase()) {
    case 'patreon':
      return Heart;
    case 'discord':
      return Users;
    case 'paypal':
      return DollarSign;
    case 'ko-fi':
      return Zap;
    default:
      return Heart;
  }
};

export default function CompactSupportBar() {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('social_media_settings')
          .select('*')
          .eq('is_enabled', true)
          .order('display_order', { ascending: true });
        setPlatforms(data || []);
      } catch (e) {
        console.error('Failed to load social platforms', e);
      }
    })();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        className="h-8 px-3"
        onClick={() => setOpen(true)}
        aria-label="Donate to support"
      >
        <Heart className="h-4 w-4 mr-1" />
        Donate
      </Button>

      {platforms.slice(0, 3).map((p) => {
        const Icon = getIconForPlatform(p.platform_name);
        return (
          <Button
            key={p.id}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 bg-background/50 hover:bg-background border-primary/20 hover:border-primary/40"
            asChild
            aria-label={`Open ${p.platform_name}`}
            title={`Support on ${p.platform_name}`}
          >
            <a href={p.platform_url} target="_blank" rel="noopener noreferrer">
              <Icon className="h-4 w-4" style={{ color: p.platform_color || 'currentColor' }} />
            </a>
          </Button>
        );
      })}

      {platforms.length > 3 && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 text-xs bg-background/50 hover:bg-background border-primary/20 hover:border-primary/40"
          onClick={() => {
            platforms.slice(3).forEach((p) => {
              window.open(p.platform_url, '_blank', 'noopener,noreferrer');
            });
          }}
          aria-label={`Open ${platforms.length - 3} more platforms`}
        >
          +{platforms.length - 3}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Support Kodelex
            </DialogTitle>
          </DialogHeader>
          <DonatePanel onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
