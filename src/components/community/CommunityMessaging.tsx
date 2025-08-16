import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MessagingModal } from '@/components/profile/MessagingModal';
import { Search, MessageSquare, Users, Crown, Shield, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  profile_picture_url?: string;
  role: 'admin' | 'moderator' | 'author' | 'member';
  is_online?: boolean;
  last_seen?: string;
}

export const CommunityMessaging: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showMessaging, setShowMessaging] = useState(false);

  // Mock community users data
  const communityUsers: UserProfile[] = [
    {
      id: 'admin-1',
      username: 'admin',
      display_name: 'Site Administrator',
      profile_picture_url: '',
      role: 'admin',
      is_online: true
    },
    {
      id: 'mod-1',
      username: 'manga_mod',
      display_name: 'Manga Moderator',
      profile_picture_url: '',
      role: 'moderator',
      is_online: true
    },
    {
      id: 'author-1',
      username: 'sensei_artist',
      display_name: 'Sensei Artist',
      profile_picture_url: '',
      role: 'author',
      is_online: false,
      last_seen: '2 hours ago'
    },
    {
      id: 'user-1',
      username: 'manga_lover',
      display_name: 'Manga Enthusiast',
      profile_picture_url: '',
      role: 'member',
      is_online: true
    },
    {
      id: 'user-2',
      username: 'otaku_reader',
      display_name: 'Otaku Reader',
      profile_picture_url: '',
      role: 'member',
      is_online: false,
      last_seen: '1 day ago'
    }
  ];

  const filteredUsers = communityUsers.filter(profile =>
    profile.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartConversation = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setShowMessaging(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'author':
        return <Star className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'moderator':
        return 'secondary';
      case 'author':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Community Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search community members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Users List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No users found</p>
                </div>
              ) : (
                filteredUsers.map((userProfile) => (
                  <div
                    key={userProfile.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={userProfile.profile_picture_url} />
                        <AvatarFallback>
                          {userProfile.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      {userProfile.is_online && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">
                          {userProfile.display_name}
                        </h4>
                        {getRoleIcon(userProfile.role)}
                        <Badge variant={getRoleBadgeVariant(userProfile.role)}>
                          {userProfile.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{userProfile.username}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {userProfile.is_online ? 'Online' : `Last seen ${userProfile.last_seen}`}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartConversation(userProfile)}
                      disabled={!user}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messaging Modal */}
      {selectedUser && (
        <MessagingModal
          isOpen={showMessaging}
          onClose={() => {
            setShowMessaging(false);
            setSelectedUser(null);
          }}
          recipientId={selectedUser.id}
          recipientProfile={{
            username: selectedUser.username,
            display_name: selectedUser.display_name,
            profile_picture_url: selectedUser.profile_picture_url || ''
          }}
        />
      )}

      {/* Community Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Messaging Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-600">Do:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Be respectful and kind in all conversations</li>
                <li>• Keep discussions relevant and constructive</li>
                <li>• Use spoiler warnings for recent chapters</li>
                <li>• Report inappropriate behavior to moderators</li>
                <li>• Respect others' privacy and boundaries</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-red-600">Don't:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Share personal information publicly</li>
                <li>• Send spam or promotional content</li>
                <li>• Engage in harassment or bullying</li>
                <li>• Share pirated content or illegal links</li>
                <li>• Use offensive or inappropriate language</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};