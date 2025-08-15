import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, Shield, AlertCircle, FileImage } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SecurityValidator, VALIDATION_PATTERNS } from '@/utils/security/validation';

// Schema for chapter upload form with security validation
const chapterUploadSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .refine((val) => VALIDATION_PATTERNS.safeText.test(val), 'Title contains invalid characters'),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional()
    .refine((val) => !val || VALIDATION_PATTERNS.safeText.test(val), 'Description contains invalid characters'),
  
  chapterNumber: z.number()
    .int('Chapter number must be an integer')
    .positive('Chapter number must be positive')
    .max(9999, 'Chapter number too large'),
  
  seriesId: z.string()
    .min(1, 'Series selection is required')
    .uuid('Invalid series ID'),
  
  tags: z.string()
    .max(500, 'Tags must be less than 500 characters')
    .optional()
    .refine((val) => !val || VALIDATION_PATTERNS.safeText.test(val), 'Tags contain invalid characters'),
  
  isPremium: z.boolean().default(false),
  
  seoTitle: z.string()
    .max(60, 'SEO title must be less than 60 characters')
    .optional()
    .refine((val) => !val || VALIDATION_PATTERNS.safeText.test(val), 'SEO title contains invalid characters'),
  
  seoDescription: z.string()
    .max(160, 'SEO description must be less than 160 characters')
    .optional()
    .refine((val) => !val || VALIDATION_PATTERNS.safeText.test(val), 'SEO description contains invalid characters'),
});

type ChapterUploadForm = z.infer<typeof chapterUploadSchema>;

interface SecureContentUploadFormProps {
  onSubmit: (data: ChapterUploadForm, files: File[]) => Promise<void>;
  seriesOptions: { id: string; title: string }[];
  isLoading?: boolean;
}

export const SecureContentUploadForm: React.FC<SecureContentUploadFormProps> = ({
  onSubmit,
  seriesOptions,
  isLoading = false
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [securityErrors, setSecurityErrors] = useState<string[]>([]);
  const { toast } = useToast();
  
  const form = useForm<ChapterUploadForm>({
    resolver: zodResolver(chapterUploadSchema),
    defaultValues: {
      title: '',
      description: '',
      chapterNumber: 1,
      seriesId: '',
      tags: '',
      isPremium: false,
      seoTitle: '',
      seoDescription: ''
    }
  });

  // File validation
  const validateFiles = (files: FileList | null): string[] => {
    if (!files || files.length === 0) {
      return ['At least one image file is required'];
    }
    
    const errors: string[] = [];
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxFiles = 100;
    
    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }
    
    Array.from(files).forEach((file, index) => {
      // Check file type
      if (!allowedTypes.includes(file.type)) {
        errors.push(`File ${index + 1}: Unsupported file type. Only JPEG, PNG, WebP, and GIF are allowed`);
      }
      
      // Check file size
      if (file.size > maxFileSize) {
        errors.push(`File ${index + 1}: File size exceeds 10MB limit`);
      }
      
      // Check filename for security
      const securityCheck = SecurityValidator.isSecureInput(file.name);
      if (!securityCheck.isSecure) {
        errors.push(`File ${index + 1}: Filename contains potentially dangerous characters`);
      }
      
      // Check for suspicious file names
      const suspiciousPatterns = [
        /\.php$/i, /\.asp$/i, /\.jsp$/i, /\.exe$/i, /\.bat$/i, /\.cmd$/i,
        /script/i, /javascript/i, /<.*>/
      ];
      
      if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
        errors.push(`File ${index + 1}: Filename appears suspicious`);
      }
    });
    
    return errors;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const errors = validateFiles(files);
    
    if (errors.length > 0) {
      setFileErrors(errors);
      setSelectedFiles([]);
      return;
    }
    
    setFileErrors([]);
    setSelectedFiles(Array.from(files || []));
  };

  const validateSecurity = (data: ChapterUploadForm): string[] => {
    const errors: string[] = [];
    const allTextFields = [
      data.title,
      data.description || '',
      data.tags || '',
      data.seoTitle || '',
      data.seoDescription || ''
    ].join(' ');
    
    // Check for security threats
    const securityCheck = SecurityValidator.isSecureInput(allTextFields);
    if (!securityCheck.isSecure) {
      errors.push(`Security threats detected: ${securityCheck.threats.join(', ')}`);
    }
    
    // Check for potential XSS in content
    const xssPatterns = [
      /<script/i, /javascript:/i, /on\w+=/i, /<iframe/i, /<object/i, /<embed/i
    ];
    
    if (xssPatterns.some(pattern => pattern.test(allTextFields))) {
      errors.push('Content contains potentially dangerous script elements');
    }
    
    return errors;
  };

  const handleFormSubmit = async (data: ChapterUploadForm) => {
    // Security validation
    const securityErrors = validateSecurity(data);
    if (securityErrors.length > 0) {
      setSecurityErrors(securityErrors);
      return;
    }
    
    // File validation
    if (selectedFiles.length === 0) {
      setFileErrors(['At least one image file is required']);
      return;
    }
    
    setSecurityErrors([]);
    setFileErrors([]);
    
    try {
      // Sanitize form data
      const sanitizedData: ChapterUploadForm = {
        ...data,
        title: SecurityValidator.sanitizeText(data.title),
        description: data.description ? SecurityValidator.sanitizeText(data.description) : undefined,
        tags: data.tags ? SecurityValidator.sanitizeText(data.tags) : undefined,
        seoTitle: data.seoTitle ? SecurityValidator.sanitizeText(data.seoTitle) : undefined,
        seoDescription: data.seoDescription ? SecurityValidator.sanitizeText(data.seoDescription) : undefined,
      };
      
      await onSubmit(sanitizedData, selectedFiles);
      
      // Reset form on success
      form.reset();
      setSelectedFiles([]);
      
      toast({
        title: "Chapter Uploaded Successfully",
        description: "The chapter has been uploaded and is being processed"
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Secure Chapter Upload
        </CardTitle>
        <CardDescription>
          Upload a new chapter with secure validation and content filtering
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Security Errors */}
        {securityErrors.length > 0 && (
          <div className="flex items-start gap-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-destructive mb-1">Security Issues Detected</h4>
              <ul className="text-sm text-destructive space-y-1">
                {securityErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Title *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter chapter title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="chapterNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter Number *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1" 
                        max="9999"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="seriesId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Series *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a series" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {seriesOptions.map((series) => (
                        <SelectItem key={series.id} value={series.id}>
                          {series.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Optional chapter description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* File Upload */}
            <div className="space-y-3">
              <Label htmlFor="chapter-images">Chapter Images *</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                <div className="text-center">
                  <FileImage className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <Input
                    id="chapter-images"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Select multiple image files (JPEG, PNG, WebP, GIF)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Maximum 10MB per file, up to 100 files
                  </p>
                </div>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {selectedFiles.length} file(s) selected
                  </p>
                </div>
              )}
              
              {fileErrors.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <ul className="text-sm text-destructive space-y-1">
                    {fileErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {/* SEO Fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">SEO Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seoTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SEO Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SEO-friendly title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="action, adventure, fantasy" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="seoDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SEO Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Brief description for search engines" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Security Info */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Shield className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                All content is automatically scanned for security threats and inappropriate content
              </p>
            </div>
            
            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={isLoading || selectedFiles.length === 0}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Chapter
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};