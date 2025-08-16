import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, Eye, Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WatermarkToolsProps {
  onWatermarkComplete?: (watermarkedBlob: Blob, originalFile: File) => void;
}

export default function WatermarkTools({ onWatermarkComplete }: WatermarkToolsProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string>('');
  const [watermarkedPreview, setWatermarkedPreview] = useState<string>('');
  const [watermarkedBlob, setWatermarkedBlob] = useState<Blob | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Watermark settings
  const [watermarkText, setWatermarkText] = useState('© Your Watermark');
  const [opacity, setOpacity] = useState([0.3]);
  const [fontSize, setFontSize] = useState([24]);
  const [position, setPosition] = useState('center');
  const [color, setColor] = useState('#ffffff');
  const [pattern, setPattern] = useState('single'); // single, diagonal, grid
  const [enableFingerprint, setEnableFingerprint] = useState(true);

  useEffect(() => {
    if (selectedFile && originalPreview) {
      generateWatermark();
    }
  }, [watermarkText, opacity, fontSize, position, color, pattern, enableFingerprint]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive'
      });
      return;
    }

    setSelectedFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setWatermarkedPreview('');
    setWatermarkedBlob(null);
  };

  const generateWatermark = async () => {
    if (!selectedFile || !canvasRef.current) return;

    setIsProcessing(true);

    try {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d')!;
        
        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Apply watermark based on pattern
        ctx.font = `${fontSize[0]}px Arial`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity[0];
        
        if (pattern === 'single') {
          drawSingleWatermark(ctx, canvas.width, canvas.height);
        } else if (pattern === 'diagonal') {
          drawDiagonalWatermark(ctx, canvas.width, canvas.height);
        } else if (pattern === 'grid') {
          drawGridWatermark(ctx, canvas.width, canvas.height);
        }
        
        // Add micro-fingerprint if enabled
        if (enableFingerprint) {
          addMicroFingerprint(ctx, canvas.width, canvas.height);
        }
        
        // Generate preview and blob
        canvas.toBlob((blob) => {
          if (blob) {
            setWatermarkedBlob(blob);
            setWatermarkedPreview(URL.createObjectURL(blob));
          }
          setIsProcessing(false);
        }, 'image/png', 0.9);
      };
      
      img.src = originalPreview;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to generate watermark.',
        variant: 'destructive'
      });
      setIsProcessing(false);
    }
  };

  const drawSingleWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const textMetrics = ctx.measureText(watermarkText);
    let x, y;

    switch (position) {
      case 'top-left':
        x = 20;
        y = fontSize[0] + 20;
        break;
      case 'top-right':
        x = width - textMetrics.width - 20;
        y = fontSize[0] + 20;
        break;
      case 'bottom-left':
        x = 20;
        y = height - 20;
        break;
      case 'bottom-right':
        x = width - textMetrics.width - 20;
        y = height - 20;
        break;
      case 'center':
      default:
        x = (width - textMetrics.width) / 2;
        y = height / 2;
        break;
    }

    ctx.fillText(watermarkText, x, y);
  };

  const drawDiagonalWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const step = 200;
    ctx.save();
    ctx.rotate(-Math.PI / 6); // -30 degrees
    
    for (let y = -width; y < height + width; y += step) {
      for (let x = -height; x < width + height; x += step) {
        ctx.fillText(watermarkText, x, y);
      }
    }
    
    ctx.restore();
  };

  const drawGridWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const stepX = width / 4;
    const stepY = height / 4;
    
    for (let y = stepY; y < height; y += stepY) {
      for (let x = stepX; x < width; x += stepX) {
        ctx.fillText(watermarkText, x - ctx.measureText(watermarkText).width / 2, y);
      }
    }
  };

  const addMicroFingerprint = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add subtle pixel modifications for fingerprinting
    const numPixels = 50;
    const userId = 'demo-user'; // In real app, use actual user ID
    
    for (let i = 0; i < numPixels; i++) {
      const x = Math.floor(Math.random() * width);
      const y = Math.floor(Math.random() * height);
      
      const imageData = ctx.getImageData(x, y, 1, 1);
      const pixel = imageData.data;
      
      // Slightly modify red channel (barely visible)
      pixel[0] = Math.min(255, pixel[0] + 1);
      
      ctx.putImageData(imageData, x, y);
    }
  };

  const downloadWatermarked = () => {
    if (!watermarkedBlob || !selectedFile) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(watermarkedBlob);
    link.download = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_watermarked.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onWatermarkComplete?.(watermarkedBlob, selectedFile);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Watermark Tools
          </CardTitle>
          <CardDescription>
            Add visible watermarks and invisible fingerprints to protect your images
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Visible watermarks deter casual copying. Micro-fingerprints help trace leaked images.
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Image
              </Button>
              
              {selectedFile && (
                <Badge variant="secondary">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
                </Badge>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Watermark Settings */}
          {selectedFile && (
            <div className="space-y-6">
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Watermark Settings</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="watermark-text">Text</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Opacity: {Math.round(opacity[0] * 100)}%</Label>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      max={1}
                      min={0.1}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size: {fontSize[0]}px</Label>
                    <Slider
                      value={fontSize}
                      onValueChange={setFontSize}
                      max={72}
                      min={12}
                      step={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input
                      id="color"
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-20 h-10"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Layout & Security</h4>
                  
                  <div className="space-y-2">
                    <Label>Position</Label>
                    <Select value={position} onValueChange={setPosition}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pattern</Label>
                    <Select value={pattern} onValueChange={setPattern}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="diagonal">Diagonal Repeat</SelectItem>
                        <SelectItem value="grid">Grid Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="fingerprint"
                      checked={enableFingerprint}
                      onChange={(e) => setEnableFingerprint(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="fingerprint" className="text-sm">
                      Add micro-fingerprint
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {originalPreview && (
            <div className="space-y-4">
              <Separator />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Original</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={originalPreview} 
                      alt="Original" 
                      className="w-full h-48 object-contain bg-checkerboard"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Watermarked</h4>
                  <div className="border rounded-lg overflow-hidden">
                    {watermarkedPreview ? (
                      <img 
                        src={watermarkedPreview} 
                        alt="Watermarked" 
                        className="w-full h-48 object-contain bg-checkerboard"
                      />
                    ) : (
                      <div className="w-full h-48 flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground text-sm">
                          {isProcessing ? 'Generating...' : 'Watermark preview'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={generateWatermark}
                  disabled={isProcessing}
                  variant="outline"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Generating...' : 'Preview Changes'}
                </Button>

                {watermarkedBlob && (
                  <Button onClick={downloadWatermarked}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Watermarked
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      <style>{`
        .bg-checkerboard {
          background-image: 
            linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
            linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
            linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }
      `}</style>
    </div>
  );
}