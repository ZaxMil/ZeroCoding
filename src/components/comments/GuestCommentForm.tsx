import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { User, Mail, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestCommentFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    content: string;
    website?: string;
  }) => void;
  isSubmitting?: boolean;
  className?: string;
}

export const GuestCommentForm: React.FC<GuestCommentFormProps> = ({
  onSubmit,
  isSubmitting = false,
  className
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    content: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Comment is required';
    } else if (formData.content.length < 10) {
      newErrors.content = 'Comment must be at least 10 characters';
    } else if (formData.content.length > 2000) {
      newErrors.content = 'Comment must be less than 2000 characters';
    }

    if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className={cn('border-border/30 bg-card/20 backdrop-blur-sm', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Join the Discussion
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your thoughts as a guest. Your email won't be published.
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="text-sm font-medium">
                Name *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guest-name"
                  type="text"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={cn(
                    'pl-10',
                    errors.name && 'border-destructive focus:border-destructive'
                  )}
                  disabled={isSubmitting}
                  maxLength={50}
                />
              </div>
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="guest-email" className="text-sm font-medium">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(
                    'pl-10',
                    errors.email && 'border-destructive focus:border-destructive'
                  )}
                  disabled={isSubmitting}
                  maxLength={100}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-website" className="text-sm font-medium">
              Website (optional)
            </Label>
            <Input
              id="guest-website"
              type="url"
              placeholder="https://yourwebsite.com"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              className={cn(
                errors.website && 'border-destructive focus:border-destructive'
              )}
              disabled={isSubmitting}
              maxLength={200}
            />
            {errors.website && (
              <p className="text-sm text-destructive">{errors.website}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-content" className="text-sm font-medium">
              Comment *
            </Label>
            <Textarea
              id="guest-content"
              placeholder="Share your thoughts..."
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              className={cn(
                'min-h-[120px] resize-none',
                errors.content && 'border-destructive focus:border-destructive'
              )}
              disabled={isSubmitting}
              maxLength={2000}
            />
            <div className="flex items-center justify-between">
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {formData.content.length}/2000 characters
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-muted-foreground">
              By posting, you agree to our community guidelines
            </p>
            
            <Button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.content}
              className="min-w-[120px]"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};