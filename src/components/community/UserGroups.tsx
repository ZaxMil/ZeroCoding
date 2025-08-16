import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users, 
  Plus, 
  Search, 
  Crown,
  Calendar,
  MessageCircle,
  Settings,
  UserPlus,
  Lock,
  Globe
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserGroup {
  id: string;
  name: string;
  description: string;
  avatar: string;
  banner: string;
  members: number;
  privacy: 'public' | 'private';
  category: string;
  owner: {
    id: string;
    name: string;
    avatar: string;
  };
  moderators: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
  recentActivity: {
    type: 'message' | 'join' | 'event';
    content: string;
    time: Date;
  };
  tags: string[];
  isJoined: boolean;
  createdAt: Date;
}

export const UserGroups: React.FC = () => {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    // Mock data
    const mockGroups: UserGroup[] = [
      {
        id: '1',
        name: 'One Piece Theorists',
        description: 'Discuss theories, predictions, and analysis of the One Piece universe',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=OP',
        banner: 'https://picsum.photos/400/200?random=1',
        members: 1247,
        privacy: 'public',
        category: 'Series Discussion',
        owner: {
          id: '1',
          name: 'PirateKing',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
        },
        moderators: [
          {
            id: '2',
            name: 'StrawHat',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
          }
        ],
        recentActivity: {
          type: 'message',
          content: 'New theory about the final island posted',
          time: new Date(Date.now() - 1000 * 60 * 30)
        },
        tags: ['One Piece', 'Theories', 'Analysis'],
        isJoined: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180)
      },
      {
        id: '2',
        name: 'Manga Artists United',
        description: 'A community for aspiring and professional manga artists to share work and get feedback',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=MAU',
        banner: 'https://picsum.photos/400/200?random=2',
        members: 892,
        privacy: 'public',
        category: 'Art & Creation',
        owner: {
          id: '3',
          name: 'ArtMaster',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
        },
        moderators: [
          {
            id: '4',
            name: 'Sketcher',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
          }
        ],
        recentActivity: {
          type: 'message',
          content: 'Weekly drawing challenge announced',
          time: new Date(Date.now() - 1000 * 60 * 60 * 2)
        },
        tags: ['Art', 'Drawing', 'Manga'],
        isJoined: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90)
      },
      {
        id: '3',
        name: 'Romance Manga Readers',
        description: 'For fans of romance manga and light novels. Share recommendations and discuss your favorites!',
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=RMR',
        banner: 'https://picsum.photos/400/200?random=3',
        members: 2156,
        privacy: 'public',
        category: 'Genre Focus',
        owner: {
          id: '5',
          name: 'HeartReader',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5'
        },
        moderators: [
          {
            id: '6',
            name: 'LoveManga',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6'
          }
        ],
        recentActivity: {
          type: 'join',
          content: '5 new members joined today',
          time: new Date(Date.now() - 1000 * 60 * 15)
        },
        tags: ['Romance', 'Shoujo', 'Recommendations'],
        isJoined: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365)
      }
    ];

    setGroups(mockGroups);
  }, []);

  const categories = ['all', 'Series Discussion', 'Art & Creation', 'Genre Focus', 'General'];

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || group.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const joinGroup = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, isJoined: !group.isJoined, members: group.isJoined ? group.members - 1 : group.members + 1 }
        : group
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Groups</h1>
          <p className="text-muted-foreground">Join communities of like-minded manga enthusiasts</p>
        </div>
        <Button onClick={() => setShowCreateGroup(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={filterCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Groups Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <Card key={group.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* Banner */}
            <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20">
              <img 
                src={group.banner} 
                alt={group.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-1">
                {group.privacy === 'private' ? (
                  <Badge variant="secondary" className="text-xs">
                    <Lock className="h-3 w-3 mr-1" />
                    Private
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs bg-white/90">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-4">
              {/* Group Info */}
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="h-12 w-12 border-2 border-background -mt-8 relative z-10">
                  <AvatarImage src={group.avatar} />
                  <AvatarFallback>{group.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg line-clamp-1">{group.name}</h3>
                  <Badge variant="outline" className="text-xs mb-2">
                    {group.category}
                  </Badge>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {group.description}
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {group.members.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {formatDistanceToNow(group.createdAt)} ago
                </span>
              </div>

              {/* Owner & Moderators */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  <Crown className="h-3 w-3 text-yellow-500" />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={group.owner.avatar} />
                    <AvatarFallback className="text-xs">{group.owner.name[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{group.owner.name}</span>
                </div>
                {group.moderators.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">+{group.moderators.length} mod</span>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" />
                  <span>{group.recentActivity.content}</span>
                </div>
                <span className="text-xs">{formatDistanceToNow(group.recentActivity.time)} ago</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {group.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={group.isJoined ? 'outline' : 'default'}
                  onClick={() => joinGroup(group.id)}
                  className="flex-1"
                >
                  {group.isJoined ? (
                    <>
                      <Settings className="h-3 w-3 mr-1" />
                      Joined
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-3 w-3 mr-1" />
                      Join
                    </>
                  )}
                </Button>
                <Button size="sm" variant="ghost">
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No groups found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or create a new group
            </p>
            <Button onClick={() => setShowCreateGroup(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Group
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Create New Group</CardTitle>
                <Button variant="ghost" onClick={() => setShowCreateGroup(false)}>×</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Group name..." />
              <Input placeholder="Group description..." />
              <div className="flex gap-2">
                <Button className="flex-1">Create Group</Button>
                <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};