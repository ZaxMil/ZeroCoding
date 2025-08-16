import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Users, 
  Clock, 
  Pin,
  Heart,
  Eye,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    reputation: number;
  };
  category: string;
  replies: number;
  views: number;
  likes: number;
  isPinned: boolean;
  createdAt: Date;
  lastActivity: Date;
  tags: string[];
}

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  posts: number;
  topics: number;
  lastPost?: {
    title: string;
    author: string;
    time: Date;
  };
}

export const UserForums: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);

  useEffect(() => {
    // Mock data
    const mockCategories: ForumCategory[] = [
      {
        id: '1',
        name: 'General Discussion',
        description: 'Chat about manga, anime, and everything in between',
        posts: 1234,
        topics: 89,
        lastPost: {
          title: 'What are you reading this week?',
          author: 'MangaFan123',
          time: new Date(Date.now() - 1000 * 60 * 30)
        }
      },
      {
        id: '2',
        name: 'Series Recommendations',
        description: 'Discover new manga and share your favorites',
        posts: 892,
        topics: 156,
        lastPost: {
          title: 'Hidden gems you must read',
          author: 'BookWorm',
          time: new Date(Date.now() - 1000 * 60 * 60 * 2)
        }
      },
      {
        id: '3',
        name: 'Chapter Discussions',
        description: 'Discuss the latest chapters and plot developments',
        posts: 2341,
        topics: 234,
        lastPost: {
          title: 'One Piece Chapter 1098 Discussion',
          author: 'PirateKing',
          time: new Date(Date.now() - 1000 * 60 * 15)
        }
      }
    ];

    const mockPosts: ForumPost[] = [
      {
        id: '1',
        title: 'What are your thoughts on the latest Attack on Titan chapter?',
        content: 'Just finished reading the latest chapter and wow, what a twist! What do you all think about...',
        author: {
          id: '1',
          name: 'TitanSlayer',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
          reputation: 1250
        },
        category: 'Chapter Discussions',
        replies: 42,
        views: 1205,
        likes: 89,
        isPinned: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        lastActivity: new Date(Date.now() - 1000 * 60 * 15),
        tags: ['Attack on Titan', 'Discussion', 'Spoilers']
      },
      {
        id: '2',
        title: 'Looking for recommendations similar to Demon Slayer',
        content: 'I just finished Demon Slayer and loved the art style and action sequences. Can anyone recommend...',
        author: {
          id: '2',
          name: 'DemonHunter',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
          reputation: 890
        },
        category: 'Series Recommendations',
        replies: 28,
        views: 756,
        likes: 45,
        isPinned: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
        lastActivity: new Date(Date.now() - 1000 * 60 * 45),
        tags: ['Demon Slayer', 'Recommendations', 'Action']
      }
    ];

    setCategories(mockCategories);
    setPosts(mockPosts);
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (activeTab) {
      case 'popular':
        return matchesSearch && post.likes > 20;
      case 'recent':
        return matchesSearch && post.createdAt > new Date(Date.now() - 1000 * 60 * 60 * 24);
      case 'pinned':
        return matchesSearch && post.isPinned;
      default:
        return matchesSearch;
    }
  });

  return (
    <div className="space-y-6">
      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Forum Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {categories.map(category => (
              <Card key={category.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">{category.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>{category.topics} topics</span>
                    <span>{category.posts} posts</span>
                  </div>
                  {category.lastPost && (
                    <div className="text-xs text-muted-foreground">
                      <div className="font-medium">{category.lastPost.title}</div>
                      <div>by {category.lastPost.author} • {formatDistanceToNow(category.lastPost.time)} ago</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Forum Posts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Forum Posts
            </CardTitle>
            <Button onClick={() => setShowNewPost(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Post
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search posts..."
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Posts</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="pinned">Pinned</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Posts List */}
          <div className="space-y-4">
            {filteredPosts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.author.avatar} />
                      <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {post.isPinned && <Pin className="h-4 w-4 text-yellow-500" />}
                          <h3 className="font-semibold hover:text-primary cursor-pointer">
                            {post.title}
                          </h3>
                        </div>
                        <Badge variant="outline">{post.category}</Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {post.content}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.replies}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(post.createdAt)} ago
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">by <strong>{post.author.name}</strong></span>
                          <Badge variant="secondary" className="text-xs">
                            {post.author.reputation} rep
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No posts found matching your criteria.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowNewPost(true)}>
                Create the first post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Post Modal would go here */}
      {showNewPost && (
        <Card className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create New Post</CardTitle>
                  <Button variant="ghost" onClick={() => setShowNewPost(false)}>×</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Post title..." />
                <Textarea placeholder="Write your post content..." rows={8} />
                <div className="flex gap-2">
                  <Button>Post</Button>
                  <Button variant="outline" onClick={() => setShowNewPost(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
};