import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Eye, EyeOff, TrendingUp, ArrowUpDown, Edit3, 
  DollarSign, Users, BarChart3, Settings, 
  Upload, BookOpen, Crown, Star, Lock, Unlock
} from 'lucide-react';
import { AdminOnly } from '@/components/auth/RoleGuard';
import { useToast } from '@/hooks/use-toast';
import { runtime } from '@/config/runtime';

const AdminMobile = () => {
  const { toast } = useToast();
  const [selectedSeries, setSelectedSeries] = useState('demo-series-1');
  const [chapterOrder, setChapterOrder] = useState<'asc' | 'desc'>('desc');
  const [publishStatus, setPublishStatus] = useState(true);
  const [chapterPrice, setChapterPrice] = useState(10);
  const [bumpDuration, setBumpDuration] = useState(24);

  const mockSeries = [
    { id: 'demo-series-1', title: 'Demo Series ABCD', chapters: 24 },
    { id: 'demo-series-2', title: 'Another Demo', chapters: 15 },
  ];

  const mockStats = {
    totalUsers: 1247,
    activeReaders: 89,
    totalRevenue: 2450,
    popularChapters: 8
  };

  const handlePublishToggle = () => {
    setPublishStatus(!publishStatus);
    toast({
      title: publishStatus ? "Series Unpublished" : "Series Published",
      description: `${selectedSeries} is now ${publishStatus ? 'hidden' : 'visible'} to users.`
    });
  };

  const handlePriceUpdate = () => {
    toast({
      title: "Price Updated",
      description: `Chapter unlock cost set to ${chapterPrice} coins.`
    });
  };

  const handleBumpToTop = () => {
    toast({
      title: "Chapter Bumped",
      description: `Latest chapter promoted as "Now Free" for ${bumpDuration}h.`
    });
  };

  const toggleChapterOrder = () => {
    const newOrder = chapterOrder === 'desc' ? 'asc' : 'desc';
    setChapterOrder(newOrder);
    localStorage.setItem(`chapter-order-${selectedSeries}`, newOrder);
    toast({
      title: "Chapter Order Updated",
      description: `Chapters now sorted ${newOrder === 'desc' ? 'newest first' : 'oldest first'}.`
    });
  };

  return (
    <AdminOnly>
      <div className="min-h-screen bg-background p-4 space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" />
              Mobile Admin Dashboard
            </CardTitle>
            {runtime.USE_MOCKS && (
              <Badge variant="outline" className="w-fit text-xs">
                Mock Mode Active
              </Badge>
            )}
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{mockStats.totalUsers}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Total Users
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">${mockStats.totalRevenue}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <DollarSign className="h-3 w-3" />
                Revenue
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{mockStats.activeReaders}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <BookOpen className="h-3 w-3" />
                Active Readers
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{mockStats.popularChapters}</div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Popular Chapters
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Series Management */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Series Management</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Select Series</Label>
              <Select value={selectedSeries} onValueChange={setSelectedSeries}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mockSeries.map(series => (
                    <SelectItem key={series.id} value={series.id}>
                      {series.title} ({series.chapters} chapters)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {publishStatus ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <Label className="text-sm">Published Status</Label>
              </div>
              <Switch
                checked={publishStatus}
                onCheckedChange={handlePublishToggle}
              />
            </div>
          </CardContent>
        </Card>

        {/* Chapter Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Chapter Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Chapter Order</Label>
              <Button variant="outline" size="sm" onClick={toggleChapterOrder}>
                <ArrowUpDown className="h-4 w-4 mr-1" />
                {chapterOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              </Button>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm">Chapter Unlock Cost (Coins)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={chapterPrice}
                  onChange={(e) => setChapterPrice(Number(e.target.value))}
                  className="flex-1"
                  min="0"
                  max="100"
                />
                <Button size="sm" onClick={handlePriceUpdate}>
                  <DollarSign className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-sm">Bump Latest Chapter</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={bumpDuration}
                  onChange={(e) => setBumpDuration(Number(e.target.value))}
                  className="flex-1"
                  min="1"
                  max="168"
                  placeholder="Hours"
                />
                <Button size="sm" onClick={handleBumpToTop}>
                  <TrendingUp className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Promotes latest chapter as "Now Free" for specified hours
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Chapter
            </Button>
            
            <Button className="w-full" variant="outline">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Metadata
            </Button>
            
            <Button className="w-full" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <Crown className="h-3 w-3" />
                <span>2 new premium subscriptions</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600">
                <Unlock className="h-3 w-3" />
                <span>15 chapters unlocked today</span>
              </div>
              <div className="flex items-center gap-2 text-orange-600">
                <Star className="h-3 w-3" />
                <span>New 5-star review on Series ABCD</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <BookOpen className="h-3 w-3" />
                <span>89 active readers this hour</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminOnly>
  );
};

export default AdminMobile;