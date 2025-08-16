import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { User, BookOpen, FileText, Bookmark, Settings, Calendar, TrendingUp } from 'lucide-react';
import { useReadingNotes } from '@/hooks/useReadingNotes';
import { useBookmarks } from '@/hooks/useBookmarks';
import { getReadingProgress } from '@/utils/readingProgress';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileProps {
  userId?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: 'manga_reader',
    email: 'reader@example.com',
    bio: 'Passionate manga reader and collector',
    joinDate: '2024-01-15',
    avatar: '',
    preferences: {
      favoriteGenres: ['Action', 'Adventure', 'Drama'],
      readingGoal: 50
    }
  });

  const { notes, getNoteStats } = useReadingNotes();
  const { bookmarks } = useBookmarks();
  const readingProgress = getReadingProgress();

  const noteStats = getNoteStats();
  const totalChaptersRead = Object.keys(readingProgress).length;
  const completedChapters = Object.values(readingProgress).filter(p => p.completed).length;
  const readingPercentage = totalChaptersRead > 0 ? (completedChapters / totalChaptersRead) * 100 : 0;

  const handleSaveProfile = () => {
    // TODO: Save profile to backend
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-2xl">
                  {profile.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button size="sm" className="absolute -bottom-2 -right-2" variant="outline">
                  Change
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-4">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={profile.username}
                      onChange={(e) => setProfile(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">{profile.username}</h1>
                    <Badge variant="secondary">Reader</Badge>
                  </div>
                  <p className="text-muted-foreground">{profile.bio}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Joined {formatDistanceToNow(new Date(profile.joinDate), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button onClick={handleSaveProfile}>Save Changes</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reading Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalChaptersRead}</p>
                <p className="text-sm text-muted-foreground">Chapters Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{completedChapters}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bookmark className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{bookmarks.length}</p>
                <p className="text-sm text-muted-foreground">Bookmarks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{noteStats.totalNotes}</p>
                <p className="text-sm text-muted-foreground">Reading Notes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="progress">Reading Progress</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest reading activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recent Notes */}
                <div>
                  <h4 className="font-medium mb-2">Recent Notes</h4>
                  <div className="space-y-2">
                    {notes.slice(0, 3).map((note) => (
                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{note.type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(note.timestamp, { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Recent Bookmarks */}
                <div>
                  <h4 className="font-medium mb-2">Recent Bookmarks</h4>
                  <div className="space-y-2">
                    {bookmarks.slice(0, 3).map((bookmark) => (
                      <div key={bookmark.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-sm">{bookmark.title}</h5>
                          <span className="text-xs text-muted-foreground">
                            Page {bookmark.pageNumber}
                          </span>
                        </div>
                        {bookmark.note && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {bookmark.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reading Progress</CardTitle>
              <CardDescription>Track your reading journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(readingPercentage)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${readingPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Note Types</h4>
                    <div className="space-y-1">
                      {Object.entries(noteStats.notesByType).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="capitalize">{type}</span>
                          <span>{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Reading Stats</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Chapters with Notes</span>
                        <span>{noteStats.chaptersWithNotes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Bookmarks</span>
                        <span>{bookmarks.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reading Preferences</CardTitle>
              <CardDescription>Customize your reading experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="favorite-genres">Favorite Genres</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {profile.preferences.favoriteGenres.map((genre) => (
                      <Badge key={genre} variant="secondary">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="reading-goal">Reading Goal (chapters per month)</Label>
                  <Input
                    id="reading-goal"
                    type="number"
                    value={profile.preferences.readingGoal}
                    onChange={(e) => setProfile(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        readingGoal: Number(e.target.value)
                      }
                    }))}
                    className="w-32 mt-2"
                  />
                </div>

                <Button>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};