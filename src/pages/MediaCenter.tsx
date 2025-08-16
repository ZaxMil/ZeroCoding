import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import MediaUploader from '@/components/media/MediaUploader';
import MediaGallery from '@/components/media/MediaGallery';
import BackgroundRemover from '@/components/media/BackgroundRemover';
import WatermarkTools from '@/components/media/WatermarkTools';
import { ImageIcon, Upload, Scissors, Shield, Sparkles } from 'lucide-react';

export default function MediaCenter() {
  const [activeTab, setActiveTab] = useState('gallery');
  const [uploadCount, setUploadCount] = useState(0);

  const handleUploadComplete = (files: any[]) => {
    setUploadCount(prev => prev + files.length);
    setActiveTab('gallery'); // Switch to gallery after upload
  };

  const handleProcessComplete = () => {
    setActiveTab('gallery'); // Switch to gallery after processing
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Center</h1>
          <p className="text-muted-foreground">
            Upload, organize, and enhance your media files with AI-powered tools
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Sparkles className="h-3 w-3 mr-1" />
          AI-Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Gallery
            {uploadCount > 0 && (
              <Badge variant="destructive" className="h-4 w-4 p-0 text-xs flex items-center justify-center">
                {uploadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="background" className="flex items-center gap-2">
            <Scissors className="h-4 w-4" />
            Remove BG
          </TabsTrigger>
          <TabsTrigger value="watermark" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Watermark
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gallery" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Media Library</CardTitle>
              <CardDescription>
                Browse, search, and manage all your uploaded media files
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaGallery />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <MediaUploader 
            onUploadComplete={handleUploadComplete}
            maxFiles={20}
            maxSize={100 * 1024 * 1024} // 100MB
          />
          
          <Card>
            <CardHeader>
              <CardTitle>Upload Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Supported Formats</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Images: JPG, PNG, WebP, GIF</li>
                    <li>• Videos: MP4, WebM, MOV</li>
                    <li>• Audio: MP3, WAV, OGG</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">File Limits</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Max file size: 100MB</li>
                    <li>• Max files per upload: 20</li>
                    <li>• Total storage: Unlimited</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Features</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Automatic compression</li>
                    <li>• AI-powered organization</li>
                    <li>• Secure cloud storage</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background" className="space-y-6">
          <BackgroundRemover onProcessComplete={handleProcessComplete} />
          
          <Card>
            <CardHeader>
              <CardTitle>Background Removal Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Best Results</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Clear contrast between subject and background</li>
                    <li>• Good lighting on the main subject</li>
                    <li>• Avoid cluttered backgrounds</li>
                    <li>• High resolution images work better</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Technical Notes</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Processing happens in your browser</li>
                    <li>• First use downloads AI model (~50MB)</li>
                    <li>• Images resized to max 1024px for speed</li>
                    <li>• Output format is PNG with transparency</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="watermark" className="space-y-6">
          <WatermarkTools onWatermarkComplete={handleProcessComplete} />
          
          <Card>
            <CardHeader>
              <CardTitle>Watermarking Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-medium">Visible Watermarks</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Deters casual image theft</li>
                    <li>• Multiple positioning options</li>
                    <li>• Adjustable opacity and size</li>
                    <li>• Pattern repeating for extra security</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Micro-Fingerprints</h4>
                  <ul className="text-muted-foreground space-y-1">
                    <li>• Invisible pixel modifications</li>
                    <li>• Helps trace leaked images</li>
                    <li>• User-specific fingerprints</li>
                    <li>• Survives basic image editing</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}