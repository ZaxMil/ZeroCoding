import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ImageIcon, Video, Music, FileIcon, Search, Filter, MoreHorizontal, Download, Trash2, Eye, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface MediaItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  created_at: string;
  metadata?: any;
}

interface MediaGalleryProps {
  onSelectMedia?: (media: MediaItem) => void;
  selectionMode?: boolean;
}

export default function MediaGallery({ onSelectMedia, selectionMode = false }: MediaGalleryProps) {
  const { toast } = useToast();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    fetchMedia();
  }, []);

  useEffect(() => {
    if (selectedMedia) {
      generatePreviewUrl(selectedMedia);
    }
  }, [selectedMedia]);

  const fetchMedia = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mock user media data since table doesn't exist yet
      const data = [] as MediaItem[];
      const error = null;

      if (error) throw error;
      setMedia(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load media files.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePreviewUrl = async (item: MediaItem) => {
    try {
      const { data } = await supabase.storage
        .from('user-media')
        .createSignedUrl(item.file_path, 3600);
      
      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
      }
    } catch (error) {
      console.error('Failed to generate preview URL:', error);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileIcon className="h-4 w-4" />;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'bg-blue-100 text-blue-800';
    if (type.startsWith('video/')) return 'bg-purple-100 text-purple-800';
    if (type.startsWith('audio/')) return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const deleteMedia = async (item: MediaItem) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('user-media')
        .remove([item.file_path]);

      if (storageError) throw storageError;

      // Mock database deletion since table doesn't exist yet
      const dbError = null;

      if (dbError) throw dbError;

      setMedia(prev => prev.filter(m => m.id !== item.id));
      toast({
        title: 'Deleted',
        description: 'Media file deleted successfully.'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to delete media file.',
        variant: 'destructive'
      });
    }
  };

  const downloadMedia = async (item: MediaItem) => {
    try {
      const { data } = await supabase.storage
        .from('user-media')
        .createSignedUrl(item.file_path, 3600);
      
      if (data?.signedUrl) {
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.download = item.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to download file.',
        variant: 'destructive'
      });
    }
  };

  const filteredMedia = media.filter(item => {
    const matchesSearch = item.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || item.file_type.startsWith(typeFilter);
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Loading media files...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Media Gallery</CardTitle>
        <CardDescription>View and manage your uploaded media files</CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredMedia.length === 0 ? (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No media files found</p>
            <p className="text-muted-foreground">
              {searchQuery || typeFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Upload some files to get started'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredMedia.map((item) => (
              <div 
                key={item.id} 
                className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                  selectionMode ? 'hover:border-primary' : ''
                }`}
                onClick={() => selectionMode && onSelectMedia?.(item)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getFileIcon(item.file_type)}
                    <Badge className={`text-xs ${getFileTypeColor(item.file_type)}`}>
                      {item.file_type.split('/')[0]}
                    </Badge>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSelectedMedia(item)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => downloadMedia(item)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => deleteMedia(item)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm truncate" title={item.file_name}>
                    {item.file_name}
                  </h4>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{(item.file_size / 1024 / 1024).toFixed(1)} MB</p>
                    <p>{format(new Date(item.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{selectedMedia?.file_name}</DialogTitle>
            </DialogHeader>
            
            {selectedMedia && (
              <div className="space-y-4">
                {selectedMedia.file_type.startsWith('image/') && previewUrl && (
                  <img 
                    src={previewUrl} 
                    alt={selectedMedia.file_name}
                    className="max-w-full max-h-96 object-contain mx-auto rounded-lg"
                  />
                )}
                
                {selectedMedia.file_type.startsWith('video/') && previewUrl && (
                  <video 
                    controls 
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                    src={previewUrl}
                  />
                )}
                
                {selectedMedia.file_type.startsWith('audio/') && previewUrl && (
                  <audio controls className="w-full" src={previewUrl} />
                )}

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">File Details</p>
                    <p>Type: {selectedMedia.file_type}</p>
                    <p>Size: {(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB</p>
                    <p>Uploaded: {format(new Date(selectedMedia.created_at), 'PPp')}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}