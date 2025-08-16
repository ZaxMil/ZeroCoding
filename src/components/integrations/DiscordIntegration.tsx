import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle,
  Settings,
  Users,
  Bell,
  Link as LinkIcon,
  Check,
  X,
  ExternalLink,
  Hash,
  Crown
} from 'lucide-react';

interface DiscordServer {
  id: string;
  name: string;
  icon: string;
  memberCount: number;
  channels: DiscordChannel[];
  isConnected: boolean;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  isEnabled: boolean;
}

interface DiscordNotificationSettings {
  newChapters: boolean;
  seriesUpdates: boolean;
  communityPosts: boolean;
  userMentions: boolean;
  webhookUrl: string;
}

export const DiscordIntegration: React.FC = () => {
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [settings, setSettings] = useState<DiscordNotificationSettings>({
    newChapters: true,
    seriesUpdates: true,
    communityPosts: false,
    userMentions: true,
    webhookUrl: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Mock Discord servers data
    const mockServers: DiscordServer[] = [
      {
        id: '1',
        name: 'KodeLex Community',
        icon: 'https://api.dicebear.com/7.x/initials/svg?seed=KC',
        memberCount: 15420,
        channels: [
          { id: '1', name: 'general', type: 'text', isEnabled: true },
          { id: '2', name: 'manga-discussion', type: 'text', isEnabled: true },
          { id: '3', name: 'chapter-updates', type: 'text', isEnabled: true },
          { id: '4', name: 'recommendations', type: 'text', isEnabled: false }
        ],
        isConnected: true
      },
      {
        id: '2',
        name: 'Manga Lovers Hub',
        icon: 'https://api.dicebear.com/7.x/initials/svg?seed=MLH',
        memberCount: 8920,
        channels: [
          { id: '5', name: 'general-chat', type: 'text', isEnabled: false },
          { id: '6', name: 'spoilers', type: 'text', isEnabled: false }
        ],
        isConnected: false
      }
    ];

    setServers(mockServers);
    setIsConnected(mockServers.some(server => server.isConnected));
  }, []);

  const connectToDiscord = async () => {
    setIsConnecting(true);
    try {
      // Simulate Discord OAuth flow
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setServers(prev => prev.map(server => ({ ...server, isConnected: true })));
      
      toast({
        title: "Discord Connected!",
        description: "Successfully connected to Discord. You can now receive notifications and sync activities.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Discord. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectFromDiscord = () => {
    setIsConnected(false);
    setServers(prev => prev.map(server => ({ ...server, isConnected: false })));
    
    toast({
      title: "Discord Disconnected",
      description: "Discord integration has been disabled.",
    });
  };

  const toggleChannelEnabled = (serverId: string, channelId: string) => {
    setServers(prev => prev.map(server => 
      server.id === serverId 
        ? {
            ...server,
            channels: server.channels.map(channel =>
              channel.id === channelId
                ? { ...channel, isEnabled: !channel.isEnabled }
                : channel
            )
          }
        : server
    ));
  };

  const updateSettings = (key: keyof DiscordNotificationSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const testNotification = async () => {
    try {
      // Simulate sending test notification
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Test Notification Sent!",
        description: "Check your Discord server for the test message.",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#5865F2] rounded-lg">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Discord Integration</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect your Discord server to receive notifications and sync activities
                </p>
              </div>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="gap-1">
              {isConnected ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <div className="text-center py-8">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Connect to Discord</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Link your Discord account to receive real-time notifications about new chapters, 
                community updates, and interact with other readers.
              </p>
              <Button 
                onClick={connectToDiscord} 
                disabled={isConnecting}
                className="bg-[#5865F2] hover:bg-[#4752C4]"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect Discord Account
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">Connected as YourUsername#1234</div>
                  <div className="text-sm text-muted-foreground">
                    Connected to {servers.filter(s => s.isConnected).length} server(s)
                  </div>
                </div>
              </div>
              <Button variant="outline" onClick={disconnectFromDiscord}>
                Disconnect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <>
          {/* Server Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Connected Servers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {servers.map(server => (
                  <div key={server.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={server.icon} />
                          <AvatarFallback>{server.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {server.name}
                            {server.isConnected && (
                              <Badge variant="outline" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {server.memberCount.toLocaleString()} members
                          </div>
                        </div>
                      </div>
                      <Badge variant={server.isConnected ? 'default' : 'secondary'}>
                        {server.isConnected ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {server.isConnected && (
                      <div>
                        <h4 className="font-medium mb-3">Channel Settings</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {server.channels.map(channel => (
                            <div key={channel.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                <Hash className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">{channel.name}</span>
                              </div>
                              <Switch
                                checked={channel.isEnabled}
                                onCheckedChange={() => toggleChannelEnabled(server.id, channel.id)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">New Chapter Releases</div>
                    <div className="text-sm text-muted-foreground">Get notified when new chapters are released</div>
                  </div>
                  <Switch
                    checked={settings.newChapters}
                    onCheckedChange={(value) => updateSettings('newChapters', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Series Updates</div>
                    <div className="text-sm text-muted-foreground">Notifications for series status changes</div>
                  </div>
                  <Switch
                    checked={settings.seriesUpdates}
                    onCheckedChange={(value) => updateSettings('seriesUpdates', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Community Posts</div>
                    <div className="text-sm text-muted-foreground">New forum posts and discussions</div>
                  </div>
                  <Switch
                    checked={settings.communityPosts}
                    onCheckedChange={(value) => updateSettings('communityPosts', value)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">User Mentions</div>
                    <div className="text-sm text-muted-foreground">When someone mentions you in discussions</div>
                  </div>
                  <Switch
                    checked={settings.userMentions}
                    onCheckedChange={(value) => updateSettings('userMentions', value)}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="text-sm font-medium mb-2 block">Custom Webhook URL (Optional)</label>
                <div className="flex gap-2">
                  <Input
                    value={settings.webhookUrl}
                    onChange={(e) => updateSettings('webhookUrl', e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={testNotification}>
                    Test
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Use a custom webhook for advanced notification customization
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Integration Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Integration Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold mb-2">📚 New Chapter Alert</h4>
                  <div className="text-sm text-muted-foreground">
                    "🎉 **One Piece Chapter 1098** is now available! 
                    Read it now on KodeLex → [Read Chapter]"
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold mb-2">💬 Community Update</h4>
                  <div className="text-sm text-muted-foreground">
                    "🔥 **Hot Discussion** in #manga-talk: 
                    'Best plot twists in manga history' - Join the conversation!"
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold mb-2">⭐ Series Status</h4>
                  <div className="text-sm text-muted-foreground">
                    "📢 **Attack on Titan** status updated to 'Completed' 
                    - Thank you for the incredible journey!"
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="font-semibold mb-2">🎯 Personal Mention</h4>
                  <div className="text-sm text-muted-foreground">
                    "👋 **@YourUsername** you were mentioned in a discussion 
                    about 'Demon Slayer theories' - Check it out!"
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};