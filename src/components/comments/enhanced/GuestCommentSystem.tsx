import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Mail, MessageCircle, Globe, Crown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GuestCommentSystemProps {
  onSubmit: (data: {
    name: string;
    email: string;
    content: string;
    website?: string;
  }) => void;
  onUpgrade?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

interface GuestSession {
  name: string;
  email: string;
  website?: string;
  persistSession: boolean;
  commentsCount: number;
}

export const GuestCommentSystem: React.FC<GuestCommentSystemProps> = ({
  onSubmit,
  onUpgrade,
  isSubmitting = false,
  className
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website: '',
    content: '',
    persistSession: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);

  // Load guest session from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('guest-comment-session');
    if (stored) {
      try {
        const session = JSON.parse(stored);
        setGuestSession(session);
        setFormData(prev => ({
          ...prev,
          name: session.name,
          email: session.email,
          website: session.website || '',
          persistSession: true
        }));
      } catch (error) {
        console.error('Failed to load guest session:', error);
      }
    }
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Name must be less than 50 characters';
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

    if (formData.website && formData.website.trim()) {
      if (!/^https?:\/\/.+\..+/.test(formData.website)) {
        newErrors.website = 'Please enter a valid website URL starting with http:// or https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Save guest session if requested
      if (formData.persistSession) {
        const session: GuestSession = {
          name: formData.name,
          email: formData.email,
          website: formData.website,
          persistSession: true,
          commentsCount: (guestSession?.commentsCount || 0) + 1
        };
        localStorage.setItem('guest-comment-session', JSON.stringify(session));
        setGuestSession(session);
      }

      onSubmit({
        name: formData.name,
        email: formData.email,
        content: formData.content,
        website: formData.website || undefined
      });

      // Clear only the comment content
      setFormData(prev => ({ ...prev, content: '' }));
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const clearSession = () => {
    localStorage.removeItem('guest-comment-session');
    setGuestSession(null);
    setFormData({
      name: '',
      email: '',
      website: '',
      content: '',
      persistSession: true
    });
  };

  return (
    <Card className={cn('border-border/30 bg-card/20 backdrop-blur-sm', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5" />
            Comment as Guest
            {guestSession && (
              <Badge variant="secondary" className="text-xs">
                {guestSession.commentsCount} comment{guestSession.commentsCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          
          {onUpgrade && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onUpgrade}
              className="text-xs"
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground">
          {guestSession 
            ? `Welcome back, ${guestSession.name}! Your email won't be published.`
            : 'Share your thoughts as a guest. Your email won\'t be published.'
          }
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info Section */}
          {!guestSession && (
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
          )}

          {/* Returning Guest Info */}
          {guestSession && (
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{guestSession.name}</p>
                  <p className="text-xs text-muted-foreground">{guestSession.email}</p>
                </div>
              </div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={clearSession}
                className="text-xs"
              >
                Change
              </Button>
            </div>
          )}

          {/* Website Field */}
          {!guestSession && (
            <div className="space-y-2">
              <Label htmlFor="guest-website" className="text-sm font-medium">
                Website (optional)
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="guest-website"
                  type="url"
                  placeholder="https://yourwebsite.com"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className={cn(
                    'pl-10',
                    errors.website && 'border-destructive focus:border-destructive'
                  )}
                  disabled={isSubmitting}
                  maxLength={200}
                />
              </div>
              {errors.website && (
                <p className="text-sm text-destructive">{errors.website}</p>
              )}
            </div>
          )}

          {/* Comment Content */}
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

          {/* Session Persistence */}
          {!guestSession && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="persist-session"
                checked={formData.persistSession}
                onCheckedChange={(checked) => handleInputChange('persistSession', checked)}
              />
              <Label htmlFor="persist-session" className="text-sm text-muted-foreground">
                Remember my details for future comments
              </Label>
            </div>
          )}

          {/* Submit Section */}
          <div className="flex items-center justify-between pt-2 border-t border-border/30">
            <div className="text-xs text-muted-foreground">
              <p>By posting, you agree to our community guidelines</p>
              {onUpgrade && (
                <p className="mt-1">
                  <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto text-xs text-primary"
                    onClick={onUpgrade}
                  >
                    Create an account
                  </Button>
                  {' '}for rich text editing and more features
                </p>
              )}
            </div>
            
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