import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, User, Shield, Crown, X, RefreshCw, Coins, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCoinWallet } from '@/hooks/useCoinWallet';
import { runtime } from '@/config/runtime';
import { getMockWallet, setMockWallet } from '@/lib/mockStorage';

interface DevOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevOverlay = ({ isOpen, onClose }: DevOverlayProps) => {
  const { user, userProfile } = useAuth();
  const { wallet, refreshWallet } = useCoinWallet();
  const [mockRole, setMockRole] = useState<'anon' | 'member' | 'admin'>('anon');
  const [mockCoins, setMockCoins] = useState(200);
  const [showLocked, setShowLocked] = useState(runtime.SHOW_LOCKED_FOR_ANON);
  const [particlesEnabled, setParticlesEnabled] = useState(runtime.PARTICLES);
  const [particlesDensity, setParticlesDensity] = useState([runtime.PARTICLES_DENSITY]);
  const [slowNetwork, setSlowNetwork] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('dev:show_locked_for_anon', String(showLocked)); } catch {}
  }, [showLocked]);
  useEffect(() => {
    try { localStorage.setItem('dev:particles', String(particlesEnabled)); } catch {}
  }, [particlesEnabled]);
  useEffect(() => {
    try { localStorage.setItem('dev:particles_density', String(particlesDensity[0])); } catch {}
  }, [particlesDensity]);

  useEffect(() => {
    if (user && wallet) {
      setMockCoins(wallet.balance);
    }
  }, [user, wallet]);

  const handleRoleChange = (role: 'anon' | 'member' | 'admin') => {
    setMockRole(role);
    // In real implementation, this would update mock auth state
    console.log('Dev: Changed role to', role);
  };

  const handleCoinsUpdate = () => {
    if (user && runtime.USE_MOCKS) {
      const mockWallet = getMockWallet(user.id);
      setMockWallet(user.id, { ...mockWallet, balance: mockCoins });
      refreshWallet();
    }
  };

  const toggleFeature = (feature: string) => {
    console.log('Dev: Toggled feature', feature);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm">
      <div className="absolute top-4 right-4 w-96 max-h-[90vh] overflow-y-auto">
        <Card className="bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Developer Overlay</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Badge variant="outline" className="w-fit text-xs">
              Mock Mode: {runtime.USE_MOCKS ? 'ON' : 'OFF'}
            </Badge>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Role Switching */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">User Role</Label>
              <Select value={mockRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anon">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Anonymous
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4" />
                      Member
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {user && (
                <div className="text-xs text-muted-foreground">
                  Current: {userProfile?.role || 'member'}
                </div>
              )}
            </div>

            <Separator />

            {/* Wallet Controls */}
            {user && runtime.USE_MOCKS && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Mock Wallet</Label>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <Input
                    type="number"
                    value={mockCoins}
                    onChange={(e) => setMockCoins(Number(e.target.value))}
                    className="flex-1"
                    min="0"
                    max="9999"
                  />
                  <Button size="sm" onClick={handleCoinsUpdate}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Current balance: {wallet?.balance || 0} coins
                </div>
              </div>
            )}

            <Separator />

            {/* Feature Toggles */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Feature Toggles</Label>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {showLocked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Label className="text-sm">Show Locked Chapters</Label>
                </div>
                <Switch
                  checked={showLocked}
                  onCheckedChange={setShowLocked}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Particles Background</Label>
                <Switch
                  checked={particlesEnabled}
                  onCheckedChange={setParticlesEnabled}
                />
              </div>

              {particlesEnabled && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Particles Density</Label>
                  <Slider
                    value={particlesDensity}
                    onValueChange={setParticlesDensity}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {Math.round(particlesDensity[0] * 100)}%
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Label className="text-sm">Simulate Slow Network</Label>
                <Switch
                  checked={slowNetwork}
                  onCheckedChange={setSlowNetwork}
                />
              </div>
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Actions</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFeature('clear-cache')}
                  className="text-xs"
                >
                  Clear Cache
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFeature('reset-progress')}
                  className="text-xs"
                >
                  Reset Progress
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-xs col-span-2"
                >
                  Reload App
                </Button>
              </div>
            </div>

            {/* Debug Info */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Debug Info</Label>
              <div className="text-xs space-y-1 text-muted-foreground font-mono">
                <div>Mode: {runtime.USE_MOCKS ? 'Mock' : 'Production'}</div>
                <div>User: {user ? user.email : 'Anonymous'}</div>
                <div>Viewport: {window.innerWidth}×{window.innerHeight}</div>
                <div>UserAgent: {navigator.userAgent.slice(0, 30)}...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};