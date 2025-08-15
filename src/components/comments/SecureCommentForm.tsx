import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SecurityValidator, VALIDATION_PATTERNS } from '@/utils/security/validation';

interface SecureCommentFormProps {
  onSubmit: (content: string, authorName?: string) => Promise<void>;
  placeholder?: string;
  maxLength?: number;
  requireAuth?: boolean;
}

export const SecureCommentForm: React.FC<SecureCommentFormProps> = ({
  onSubmit,
  placeholder = "Write your comment...",
  maxLength = 2000,
  requireAuth = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateComment = () => {
    const newErrors: {[key: string]: string} = {};
    
    // Validate content
    const contentResult = SecurityValidator.validateField(content, {
      required: true,
      minLength: 5,
      maxLength: maxLength,
      sanitize: true,
      allowedTags: ['p', 'br', 'strong', 'em']
    });
    
    if (!contentResult.isValid && contentResult.error) {
      newErrors.content = contentResult.error;
    }
    
    // Validate author name for guest users
    if (!user && !requireAuth) {
      const nameResult = SecurityValidator.validateField(authorName, {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: VALIDATION_PATTERNS.safeText,
        sanitize: true
      });
      
      if (!nameResult.isValid && nameResult.error) {
        newErrors.authorName = nameResult.error;
      }
    }
    
    // Security validation
    const inputText = content + (authorName || '');
    const securityCheck = SecurityValidator.isSecureInput(inputText);
    if (!securityCheck.isSecure) {
      newErrors.security = `Security issue detected: ${securityCheck.threats.join(', ')}`;
    }
    
    // Check for spam patterns
    const spamPatterns = [
      /https?:\/\/[^\s]+/gi, // URLs
      /\b(buy|sale|cheap|discount|offer|deal|click here|visit|website)\b/gi,
      /(.)\1{4,}/gi // Repeated characters
    ];
    
    const hasSpam = spamPatterns.some(pattern => pattern.test(content));
    if (hasSpam) {
      newErrors.spam = 'Comment appears to contain spam or promotional content';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateComment()) {
      return;
    }
    
    if (requireAuth && !user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to comment",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Sanitize content before submission
      const sanitizedContent = SecurityValidator.sanitizeHtml(content, ['p', 'br', 'strong', 'em']);
      const sanitizedName = authorName ? SecurityValidator.sanitizeText(authorName) : undefined;
      
      await onSubmit(sanitizedContent, sanitizedName);
      
      // Reset form on success
      setContent('');
      setAuthorName('');
      setErrors({});
      
      toast({
        title: "Comment Posted",
        description: "Your comment has been submitted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Failed to Post Comment",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (requireAuth && !user) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">
            Please sign in to participate in the discussion
          </p>
          <Button variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal'))}>
            Sign In to Comment
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Guest name field */}
          {!user && !requireAuth && (
            <div>
              <Label htmlFor="author-name" className="text-sm font-medium">
                Your Name *
              </Label>
              <Input
                id="author-name"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Enter your name"
                className={`mt-1 ${errors.authorName ? 'border-destructive' : ''}`}
                maxLength={50}
                required
              />
              {errors.authorName && (
                <p className="text-sm text-destructive mt-1">{errors.authorName}</p>
              )}
            </div>
          )}
          
          {/* Comment content */}
          <div>
            <Label htmlFor="comment-content" className="text-sm font-medium">
              Comment *
            </Label>
            <Textarea
              id="comment-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className={`mt-1 resize-none ${errors.content ? 'border-destructive' : ''}`}
              rows={4}
              maxLength={maxLength}
              required
            />
            <div className="flex justify-between items-center mt-1">
              <div className="text-xs text-muted-foreground">
                {content.length}/{maxLength} characters
              </div>
              {errors.content && (
                <p className="text-sm text-destructive">{errors.content}</p>
              )}
            </div>
          </div>
          
          {/* Error messages */}
          {(errors.security || errors.spam) && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
              <div className="text-sm text-destructive">
                {errors.security || errors.spam}
              </div>
            </div>
          )}
          
          {/* Submit button */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3 text-green-500" />
              <span>Comments are filtered for spam and inappropriate content</span>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || content.length < 5}
              className="ml-4"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};